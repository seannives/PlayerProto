/* **************************************************************************
 * $Workfile:: widget-linegraph.js                                          $
 * **********************************************************************//**
 *
 * @fileoverview Implementation of the LineGraph widget.
 *
 * The LineGraph widget provides a line (or scatter) graph visualization
 * of sets of data points.
 *
 * Created on		March 27, 2013
 * @author			Leslie Bondaryk
 * @author			Michael Jay Lippert
 *
 * Copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/

// Sample LineGraph constructor configuration
(function()
{
	var lg1Config = {
			id: "lg1",
			Data: [lineData1],
			type: "lines",
			xAxisFormat: { type: "linear",
						   ticks: 5,
						   orientation: "bottom",
						   label: "one line with markup <span class='math'>y=x<sup>2</sup></span>" },
			yAxisFormat: { type: "linear",
						   ticks: 5,
						   orientation: "right",
						   label: "Labels can have extended chars (&mu;m)" },
		};
});
	
/* **************************************************************************
 * LineGraph                                                            *//**
 *
 * The LineGraph widget provides a line (or scatter) graph visualization
 * of sets of data points.
 *
 * @constructor
 * @implements {IWidget}
 *
 * @param {Object}		config			-The settings to configure this LineGraph
 * @param {string}		config.id		-String to uniquely identify this LineGraph.
 * @param {Array.<Array.<{x: number, y: number}>}
 *						config.Data		-An array of traces (lines on the graph);
 *										 each trace is an array of points defining that trace.
 * @param {Array.<number>}
 *						config.liteKey  -Array of integers to provide correspondance between traces
 *										 on this LineGraph with elements in other widgets.
 * @param {string		config.type		-String specifying "lines", "points", or
 *										 "lines+points" for traces.
 * @param {AxisFormat}	config.xAxisFormat -Format of the x axis of the graph.
 * @param {AxisFormat}	config.yAxisFormat -Format of the y axis of the graph.
 *
 * @todo: need to add custom symbols or images for scatter plots.
 *
 ****************************************************************************/
function LineGraph(config)
{
	/**
	 * A unique id for this instance of the line graph widget
	 * @type {string}
	 */
	this.id = config.id;

	/**
	 * Array of traces to be graphed, where each trace is an array of points and each point is an
	 * object w/ a {number} x and {number} y property.
	 * @type Array.<Array.<{x: number, y: number}>
	 * e.g. 2 traces, 1st w/ 2 points, 2nd with 3 points:
	 *   [ [{x: -1.2, y: 2.0} {x: 2, y: 3.1}], [{x: -2, y: -2}, {x: 0, y: 0}, {x: 2, y: 2}] ]
	 */
	this.data = config.Data;

	/**
	 * The render type is one of:
	 * <ul>
	 *  <li> "lines" for a line plot
	 *  <li> "points" for a scatter plot
	 *  <li> "lines+points" for interpolated plots
	 * </ul>
	 * @type {string}
	 * TODO supply images as point glyphs
	 */
	this.type = config.type;

	this.xAxisFormat = config.xAxisFormat;
	this.yAxisFormat = config.yAxisFormat;

	/**
	 * highlight key is an array of integers relating the traces to other selectable things on the page, optional
	 * @type Array.<number>|undefined
	 */
	this.liteKey = config.liteKey;
	
	/**
	 * Information about the last drawn instance of this line graph (from the draw method)
	 * @type {Object}
	 */
	this.lastdrawn =
		{
			container: null,
			size: {height: 0, width: 0},
			dataRect: new Rect(0, 0, 0, 0),
			linesId: 'lines',
			axes: null,
			xScale: null,
			yScale: null,
			traces: null,
		};
} // end of LineGraph constructor


/* **************************************************************************
 * LineGraph.draw                                                       *//**
 *
 * The LineGraph widget provides a line (or scatter) graph visualization
 * of sets of data points.
 *
 * @param {!d3.selection}
 *					container	-The container svg element to append the graph element tree to.
 * @param {Object}	size		-The size in pixels for the graph
 * @param {number}	size.height	-The height for the graph.
 * @param {number}	size.width	-The width for the graph.
 *
 ****************************************************************************/
LineGraph.prototype.draw = function(container, size)
{
	this.lastdrawn.container = container;
	this.lastdrawn.size = size;
	
	// Create the axes (svg canvas) in the container
	var axesConfig = {
			id: this.id + '_axes',
			size: this.lastdrawn.size,
			xAxisFormat: this.xAxisFormat,
			yAxisFormat: this.yAxisFormat,
		};
		
	var dataPts = d3.merge(this.data);
	axesConfig.xAxisFormat.extent = d3.extent(dataPts, function(pt) {return pt.x;});
	axesConfig.yAxisFormat.extent = d3.extent(dataPts, function(pt) {return pt.y;});
	
	if (axesConfig.xAxisFormat.type == 'ordinal' && !$.isArray(axesConfig.xAxisFormat.ticks))
	{
		var ordinalValueMap = d3.set(dataPts.map(function (pt) {return pt.x;}));
		axesConfig.xAxisFormat.ticks = ordinalValueMap.values();
	}
	
	if (axesConfig.yAxisFormat.type == 'ordinal' && !$.isArray(axesConfig.yAxisFormat.ticks))
	{
		var ordinalValueMap = d3.set(dataPts.map(function (pt) {return pt.y;}));
		axesConfig.yAxisFormat.ticks = ordinalValueMap.values();
	}
	
	this.lastdrawn.axes = new Axes(this.lastdrawn.container, axesConfig);

	// alias for axes used by the old code below
	var axesCont = this.lastdrawn.axes;

	//inherit the x and y scales from the axes container
	this.lastdrawn.xScale = axesCont.xScale;
	this.lastdrawn.yScale = axesCont.yScale;
	
	//inherit the dataRect from the axes container
	this.lastdrawn.dataRect = axesCont.dataRect;

	this.lastdrawn.linesId = this.id + '_lines';
	var linesId = this.lastdrawn.linesId;
	var prefix = this.lastdrawn.linesId;

	var graph = axesCont.group.append("g") //make a group to hold new line chart
		.attr("id", linesId) //name it so it can be manipulated or highlighted later
		;
	console.log("graph group is made:", graph.attr("id"));

	// make a clippath, which is used in the case that we zoom or pan the graph dynamically
	var clipId = linesId + "_clip";
	graph.append("defs")
			.append("clipPath")
				.attr("id", clipId)
				.append("rect")
					.attr("width", axesCont.dataRect.width)
					.attr("height", axesCont.dataRect.height);

	//draw the trace(s)
	if (this.type == "lines" || this.type == "lines+points")
	{
		var line = d3.svg.line()
			//d3 utility function for generating all the point to point paths using the scales set up above
			.interpolate("basis")
				.x(function(d) {return axesCont.xScale(d.x);})
				.y(function(d) {return axesCont.yScale(d.y);});

		var traces = graph.selectAll("g.traces")
			.data(this.data)
			.enter().append("g").attr("class", "traces");

		//associate the clip path so it doesn't slop over the axes
		traces.append("path").attr("clip-path", "url(#" + clipId + ")")
			//use the line function defined above to set the path data
			.attr("d", function(d) {return line(d);})
			//pick the colors sequentially off the list
			.attr("class", function(d, i) {return "trace stroke" + i;});
			
		this.lastdrawn.traces = traces;

		if (this.liteKey)
		{
			traces.attr("class", "traces liteable").attr("id", function(d, i) {
					return prefix + "_" + this.liteKey[i];
				});
		}

	}


	if (this.type == "points" || this.type == "lines+points")
	{

		var series = graph.selectAll("g.series")
			.data(this.data)
			.enter()
				.append("g")
					.attr("clip-path", "url(#" + clipId + ")")
					.attr("class",
						  function (d, i) {return "series fill" + i;});

		if (this.liteKey)
		{
			series.attr("id", function(d, i) {
					return linesId + "_" + this.liteKey[i];
				})
				.attr("class", function(d, i) {
					return "liteable series fill" + i;});
		}

		var points = series.selectAll("g.points") 
		//this selects all <g> elements with class points (there aren't any yet) 
		//within the selection series.  Note that series has the nested point
		//Data associated with it.  So the data for the points is each array 
		//in the data series.  This can also be done by using the keyword Object
		//as the .data for points, but it's a little obscure why that works.
			.data(function(d, i) {return d;}) //drill down into the nested Data
			.enter() //this will create <g> elements for every data element, useful in case you want to label them
			.append("g") //create groups
			.attr("transform", function(d, i) {
					return "translate(" + axesCont.xScale(d.x) + "," + axesCont.yScale(d.y) + ")";
				})
			//move each symbol to the x,y coordinates
			.append("path")
			.attr("d", 
					//j is the index of the series, i of the data points in the series
					function(d, i, j) {
					   return (d3.svg.symbol().type(d3.svg.symbolTypes[j])());
					}
				);
		//pick the shapes sequentially off the list
	}

}; // end of LineGraph.draw()

/* **************************************************************************
 * LineGraph.setState                                                   *//**
 *
 * setState ...
 *
 * @param {?}	liteKey	-...
 *
 ****************************************************************************/
LineGraph.prototype.lineLite = function(liteKey)
{
	if (this.traces[liteKey])
	{
		//put all lines back to normal width (clear old state)
		d3.selectAll("#" + this.lastdrawn.linesId).transition().duration(100).style("stroke-width", 2);
		//emphasize the line selected
		d3.select("#" + this.lastdrawn.linesId + liteKey).style("stroke-width", 4);
		return liteKey;
	}
	else
	{
		console.log("Invalid key. No trace " + liteKey);
	}
};
