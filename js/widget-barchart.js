/* **************************************************************************
 * $Workfile:: widget-barchart.js                                          $
 * **********************************************************************//**
 *
 * @fileoverview Implementation of the Barchart widget.
 *
 * The Barchart widget provides a line (or scatter) graph visualization
 * of sets of data points.
 *
 * Created on		April 11, 2013
 * @author			Leslie Bondaryk
 * @author			Michael Jay Lippert
 *
 * Copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/

// Sample BarChart constructor configuration
(function()
{
	var bc1Config = {
			id: "bc1",
			Data: [barData1],
			type: "grouped",
			xAxisFormat: { type: "linear",
						   ticks: 5,
						   orientation: "bottom",
						   label: "linear bar value (%)" },
			yAxisFormat: { type: "ordinal",
						   ticks: 5,
						   orientation: "left",
						   label: "Bar category labels" },
		};
});
	
/* **************************************************************************
 * BarChart                                                             *//**
 *
 * @constructor
 *
 * The BarChart widget provides single or multiple series bar chart
 * visualization of sets of data points. Can create pyramid chart (two sided)
 *or grouped bar chart (several bars on the same label from different series - multivariate)
 *
 * @param {Object}		config			-The settings to configure this BarChart
 * @param {string}		config.id		-String to uniquely identify this BarChart.
 * @param {Array.<Array.<{x: number, y: label}>}
 *						config.Data		-An array of series;
 *										 each series is an array of one or more bars with names.
 * @param {Array.<Array.<{key: "string">}
 *						config.Data  	Either bars or series can have a key label for highlighting.
 * @param {string		config.type		-String specifying "grouped", or anything else (ignored)
 * @param {AxisFormat}	config.xAxisFormat -Format of the x axis of the graph.
 * @param {AxisFormat}	config.yAxisFormat -Format of the y axis of the graph.
 *
 *
 * NOTES: One of the two axes must be ordinal for a bar graph. Only y is accomodated
 * for now.
 * There's a lot of logic in here to make sure that both positive and
 * negative values are accomodated.  Negative values have to count right to x=0
 * and positive must always count right from x=0. Currently all bar graphs are
 * assumed to layout horizontally.  TODO: vertical bar graphs (thermometers)
 **************************************************************************/

function BarChart(config)
{
	/**
	 * A unique id for this instance of the line graph widget
	 * @type {string}
	 */
	this.id = config.id;

	/**
	 * Array of bar series, where each series is an array of objects/bars, and each object is a
	 * bar lengths and category w/ a {number/size} x and {string} y property.
	 * Negative bar lengths Mean bars should face the other way.
	 * @type Array.<Array.<{x: number, y: string}>
	 * e.g. 3 series, 1 bar each:
	 *   [[{y: "High Income", x: 5523.6}], [{yVal: "Middle Income", xVal: 1509.3}], [{y: "Low Income", x: 491.8}]]
	 * bar objects may also include an optional key: string in which case they will be given an ID that 
	 * associates them with other widget events in the page, such as clicks on the legend.
	 */
	this.data = config.Data;

	/**
	 * The render type is one of:
	 * <ul>
	 *  <li> "grouped" for bars from multiple series with the same label, 
	 *		 plotted side by side instead of on top of one another
	 *  <li> <null> for regular bars
	 * </ul>
	 * @type {string}
	 */
	this.type = config.type;

	this.xAxisFormat = config.xAxisFormat;
	this.yAxisFormat = config.yAxisFormat;

	
	/**
	 * Information about the last drawn instance of this line graph (from the draw method)
	 * @type {Object}
	 */
	this.lastdrawn =
		{
			container: null,
			size: {height: 0, width: 0},
			barsId: 'bars',
			axes: null,
			xScale: null,
			yScale: null,
			traces: null,
		};
} // end of barChart constructor


/* **************************************************************************
 * BarChart.draw                                                       *//**
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
BarChart.prototype.draw = function(container, size)
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
	//all the data in each dimension is merged to use for the domain  
	//on the axis (autoranging)
	axesConfig.xAxisFormat.extent = d3.extent(dataPts, function(pt) {return pt.x;});
	axesConfig.yAxisFormat.extent = d3.extent(dataPts, function(pt) {return pt.y;});
	console.log("xExtent", axesConfig.xAxisFormat.extent);

	//Check to see whether ordinal or other scales will be generated
	// and whether explicit ticks are set, which overrides the autoranging
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
	this.lastdrawn.axes = new Axes(this.lastdrawn.container, axesConfig);

	// alias for axes once they've been rendered
	var axesDrawn = this.lastdrawn.axes;

	//inherit the x and y scales from the axes 
	this.lastdrawn.xScale = axesDrawn.xScale;
	this.lastdrawn.yScale = axesDrawn.yScale;
	this.lastdrawn.barsId = this.id + '_bars';
	var barsId = this.lastdrawn.barsId;
	
	//get the size of the bars and spacing produced by ordinal scale
	//TODO: would need to be xScale if the bars are vertical
	var bandsize = axesDrawn.yScale.rangeBand();
	
	if (this.type == "grouped")
	{
		//grouped bar charts find the common labels in each data set and draw non-overlapping
		//bars in a group, one bar in each series for that label.
		//The effect of the following code is to calculate a "subspacing" that fans
		//the individual bars in each label/group out around the central point for the data
		//label on the axis.
		var indices = [];

		for (i = 0; i < this.data.length; i++)
		{
			indices.push(i); //needed to space out grouped barcharts
		}

		var groupScale = d3.scale.ordinal()
			.domain(indices) //creates an extra ordinal set that encloses the data label,
			//one for each group (element in data array)
			.rangeRoundBands([bandsize, 0]);
			
			//TEST: The last index  should produce the topmost bar
			//appearing at y = 0
		console.log("Grouped barChart last bar mapped to 0 offset: ",
			groupScale(this.data.length - 1) == 0);
	};

	

	var graph = axesDrawn.group.append("g") //make a group to hold new bar chart
		.attr("id", barsId) //name it so it can be manipulated or highlighted later
		//TODO: determine if this is really useful
		;
		
	//TEST: the graph group now exists and reports it's ID correctly
	console.log("graph group is made:", graph.attr("id"));

	
	//draw the serie(s)
	// bind all the series data to a group element w/ a series class
	// creating or removing group elements so that each series has its own group.
	var barSeries = graph.selectAll("g.series")
		.data(this.data);

	barSeries.enter()
		.append("g")
			.attr("class", function(d, i) {
					return "series fill" + i;
					//give each series it's own color
				});

	barSeries.exit().remove();  //on redraw, get rid of any series which now have no data

	//If it's a grouped barchart, shimmie out the bars by group
	if (this.type == "grouped")
	{
		barSeries.attr("transform", function(d, i) {
				return "translate(0," + (groupScale(i)) + ")";
				});
	}
	

	// The series data was an array of values for each bar of the series
	// bind each series data to a child group element 1 for each bar in the
	// series.
	//
	// Note: the x<0 logic allows us to draw pyramid charts, although normally bar charts
	//  are bin counts and all positive
	//  I enclose the bars in individual groups so you could choose to label the ends with data or label
	//  and have it stick to the bar by putting it in the same group
	var bars = barSeries.selectAll("g.bar")
		.data(function(d) {return d;}); 	//drill down into the nested data

	bars.exit().remove();

	bars.enter()
		.append("g")
			.attr("id", function(d, i) {return barsId + (d.key? d.key : i);})
			//if a key has been specified for the bar, put it on the ID, for highlighting
			//TODO: this needs work - you might want to highlight the bar or the series, or
			//several bars.  I don't want to mess up the array structure of the data 
			//but to keep these unique we really need a key on the series and a key on the bar
			//can't use the y label because it might contain spaces. -lb
			.attr("class", "bar")
			.attr("transform",
				  function(d)
				  {
					  // move each group to the x=0 position horizontally if it's a
					  // positive bar, or start at it's negative x value if it's reversed.
				      var x = (d.x < 0) ? axesDrawn.xScale(d.x) : axesDrawn.xScale(0);
					  var y = axesDrawn.yScale(d.y);
				      return "translate(" + x + "," + y + ")";
				  })
			.append("rect")
			;

	// Update the height and width of the bar rects based on the data points bound above.
	bars.select("rect")
		.attr("height", (this.type == "grouped") ? (bandsize / (this.data.length + 1)) : bandsize)
		//divide height into uniform bar widths, narrower if grouped
		.attr("width",
			  function(d)
			  {
				  return (d.x < 0) ? axesDrawn.xScale(0) - axesDrawn.xScale(d.x)
								   : axesDrawn.xScale(d.x) - axesDrawn.xScale(0);
			  });


}; // end of barChart.draw()

/* **************************************************************************
 * LineGraph.setState                                                   *//**
 *
 * setState ...
 *
 * @param {?}	liteKey	-...
 *
 ****************************************************************************/

