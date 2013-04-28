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
	
	//make the axes for this graph - draw these first because these are the 
	//pieces that need extra unknown space for ticks, ticklabels, axis label
	//only draw axes if there aren't any yet
	if (!d3.select("#"+ axesConfig.id)[0][0])
	{
		this.lastdrawn.axes = new Axes(this.lastdrawn.container, axesConfig);

		//inherit the dataRect from the axes container
		this.lastdrawn.dataRect = axesCont.dataRect;
	}
	
	// alias for axes once they've been rendered
	var axesDrawn = this.lastdrawn.axes;
	
	//this.lastdrawn.axes = new Axes(this.lastdrawn.container, axesConfig);

	//inherit the x and y scales from the axes container
	this.lastdrawn.xScale = axesDrawn.xScale;
	this.lastdrawn.yScale = axesDrawn.yScale;

	this.lastdrawn.linesId = this.id + '_lines';
	var linesId = this.lastdrawn.linesId;
	var prefix = this.lastdrawn.linesId;

	var clipId = linesId + "_clip";

	// todo: see if there is maybe a better way to determine if something is already drawn other than by id. -mjl
	if (d3.select("#"+linesId)[0][0] === null)
	{

	var graph = axesDrawn.group.append("g") //make a group to hold new lines
		.attr("id", linesId);
	
	
	graph.append("defs")
			.append("clipPath")
				.attr("id", clipId)
				.append("rect")
					.attr("width", axesDrawn.dataRect.width)
					.attr("height", axesDrawn.dataRect.height);

	// make a clippath, which is used in the case that we zoom or pan 
	// the graph dynamically, or for data overflow into the tick and
	// label areas
	}
	else
	{
		//if we are just redrawing, then redraw into the selection
		var graph = d3.select("#" + linesId);
	}
	//TEST: the graph group now exists and reports it's ID correctly
	console.log("graph group is made/found:", graph.attr("id") == linesId);  


	//draw the trace(s)
	if (this.type == "lines" || this.type == "lines+points")
	{
		var line = d3.svg.line()
			//d3 utility function for generating all the point to point paths
			// using the scales from the axes
			//TODO: someday might want to add options for other interpolations -lb
			.interpolate("basis")
				.x(function(d) {return axesDrawn.xScale(d.x);})
				.y(function(d) {return axesDrawn.yScale(d.y);});


		var traces = graph.selectAll("g.traces")
			.data(this.data);
			
		traces.exit().remove();  //on redraw, get rid of any traces without data

		traces.enter().append("g")
			.attr("class", "traces")
			.append("path")
				.attr("clip-path", "url(#" + clipId + ")")
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
			.data(this.data);
			
		series.enter()
				.append("g")
					.attr("clip-path", "url(#" + clipId + ")")
					.attr("class",
						  function (d, i) {return "series fill" + i;});
		series.exit().remove();  //on redraw, get rid of any series without data
		if (this.liteKey)
		{
			series.attr("id", function(d, i) {
					return linesId + "_" + this.liteKey[i];
				})
				.attr("class", function(d, i) {
					return "liteable series fill" + i;});
		}

		var points = series.selectAll("g.points") 
		//this selects all <g> elements with class points (first time there 
		//aren't any yet) within the selection series.  series has nested point
		//Data associated with it.  So the data for the points is each x,y pair 
		//in the series.  This can also be done by using the keyword Object
		//as the .data for points, but it's a little obscure why that works. -lb
			.data(function(d, i) {return d;}); //drill down into the nested Data
		
		points.exit().remove(); //get rid of removed data points
		
		//this will create or update <g> elements for every data pt
		points.enter() 
			.append("g") 
				.attr("class","points")
				.attr("transform", function(d, i) {
					//move each symbol to the x,y coordinates in scale
					return "translate(" + axesDrawn.xScale(d.x) + 
						"," + axesDrawn.yScale(d.y) + ")";
				})
				.append("path")
					.attr("d", 
					// j is the index of the series, 
					// i of the data points in the series
						function(d, i, j) {
							//pick the shapes sequentially off the list
					   		return (d3.svg.symbol().type(d3.svg.symbolTypes[j])());
						}
				);
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
