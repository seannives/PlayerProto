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
			containerConfig: {
					node: d3.select("#widgetTarget0"),
					maxWid: 400,
					maxHt: 300,
				},
			axesConfig: {
					id: 0,
					xPosPerc: 0, yPosPerc: 0, //top, left corner
					xPerc: 1, yPerc: 1, //full height and width
					xAxisFormat: { type: "linear",
								   ticks: 5,
								   orientation: "bottom",
								   label: "one line with markup <span class='math'>y=x<sup>2</sup></span>" },
					yAxisFormat: { type: "linear",
								   ticks: 5,
								   orientation: "right",
								   label: "Labels can have extended chars (&mu;m)" },
				},
		};
});
	
/* **************************************************************************
 * LineGraph                                                            *//**
 *
 * @constructor
 *
 * The LineGraph widget provides a line (or scatter) graph visualization
 * of sets of data points.
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
 * @param {Object}		config.containerConfig
 *										-see SVGContainer constructor
 * @param {Object}		config.axesConfig
 *										-see Axes constructor. The data extents for each
 *										 axis will be determined by this LineGraph from the data.
 *
 * @todo: need to add custom symbols or images for scatter plots.
 *
 ****************************************************************************/
function LineGraph(config)
{
	/**
	 * Array of traces to be graphed, where each trace is an array of points and each point is an
	 * object w/ a {number} x and {number} y property.
	 * @type Array.<Array.<{x: number, y: number}>
	 * e.g. 2 traces, 1st w/ 2 points, 2nd with 3 points:
	 *   [ [{x: -1.2, y: 2.0} {x: 2, y: 3.1}], [{x: -2, y: -2}, {x: 0, y: 0}, {x: 2, y: 2}] ]
	 */
	this.Data = config.Data;
	
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
	
	/**
	 * highlight key is an array of integers relating the traces to other selectable things on the page, optional
	 * @type Array.<number>|undefined
	 */
	var liteKey = config.liteKey;
	
	/**
	 * The svg canvas for the graph
	 * @type {SVGContainer}
	 */
	this.container = new SVGContainer(config.containerConfig);
	
	// Create the axes (svg canvas) in the container
	var dataPts = d3.merge(this.Data);
	config.axesConfig.xAxisFormat.extent = d3.extent(dataPts, function(pt) {return pt.x;});
	config.axesConfig.yAxisFormat.extent = d3.extent(dataPts, function(pt) {return pt.y;});
	
	this.axes = new Axes(this.container, config.axesConfig);

	// alias for axes used by the old code below
	var axesCont = this.axes;

	// inherit the width, height and margins from the axes container
	this.xDim = axesCont.innerWid;
	this.yDim = axesCont.innerHt;
	this.id = "lines" + axesCont.id;
	var prefix = this.id;

	var graph = axesCont.group.append("g") //make a group to hold new line chart
		.attr("id", this.id) //name it so it can be manipulated or highlighted later
		;
	console.log("graph group is made:", graph.attr("id"));
	//inherit the x and y scales from the axes container
	this.xScale = axesCont.xScale;
	this.yScale = axesCont.yScale;

	// make a clippath, which is used in the case that we zoom or pan the graph dynamically
	graph.append("defs").append("clipPath").attr("id", "clip_" + this.id)
	.append("rect").attr("width", axesCont.innerWid)
	.attr("height", axesCont.innerHt);

	//draw the trace(s)
	if (this.type == "lines" || this.type == "lines+points") {
		var line = d3.svg.line()
		//d3 utility function for generating all the point to point paths using the scales set up above
		.interpolate("basis").x(function(d, i) {
			return axesCont.xScale(d.x);
		}).y(function(d, i) {
			return axesCont.yScale(d.y);
		});

		this.traces = graph.selectAll("g.traces")
		.data(this.Data)
		.enter().append("g").attr("class", "traces");

		//associate the clip path so it doesn't slop over the axes
		this.traces.append("path").attr("clip-path", "url(#clip_" + this.id + ")")
		//use the line function defined above to set the path data
		.attr("d", function(d, i) {
			return line(d);
		})
		//pick the colors sequentially off the list
		.attr("class", function(d, i) {
			return "trace stroke" + i;
		});

		if (liteKey) {
			this.traces.attr("class", "traces liteable").attr("id", function(d, i) {
				return prefix + "_" + liteKey[i];
			});
		}

	}


	if (this.type == "points" || this.type == "lines+points") {

		this.series = graph.selectAll("g.series")
		.data(this.Data).enter()
		.append("g")
		.attr("clip-path", "url(#clip_" + this.id + ")")
		.attr("class", function(d, i) {
			return "series fill" + i;
		});

		if (this.liteKey) {
			series.attr("id", function(d, i) {
				return this.id + "_" + this.liteKey[i];
			})
			.attr("class", function(d, i) {
				return "liteable series fill" + i;});
		}

		this.points = this.series.selectAll("g.points") 
		//this selects all <g> elements with class points (there aren't any yet) 
		//within the selection series.  Note that series has the nested point
		//Data associated with it.  So the data for the points is each array 
		//in the data series.  This can also be done by using the keyword Object
		//as the .data for points, but it's a little obscure why that works.
		.data(function(d,i){return d;}) //drill down into the nested Data
		.enter() //this will create <g> elements for every data element, useful in case you want to label them
		.append("g") //create groups
		.attr("transform", function(d, i) {
			return "translate(" + axesCont.xScale(d.x) + "," + axesCont.yScale(d.y) + ")";
										})
		//move each symbol to the x,y coordinates
		.append("path")
		.attr("d", 
		//j is the index of the series, i of the data points in the series
		function(d,i,j){
		   return (d3.svg.symbol().type(d3.svg.symbolTypes[j])());
		}
		);
		//pick the shapes sequentially off the list
	}

} //end line graph object generator function to go with container widgets

LineGraph.prototype.setState = function(liteKey)
{
	if (this.traces[liteKey])
	{
		//put all lines back to normal width (clear old state)
		d3.selectAll("#"+this.id).transition().duration(100).style("stroke-width",2);
		//emphasize the line selected
		d3.select("#" + this.id + liteKey).style("stroke-width", 4);
		return liteKey;
	}
	else
	{
		console.log("Invalid key. No trace " + liteKey);
	}
};
