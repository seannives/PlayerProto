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
 * @param {eventManager} eventManager	- allows the object to emit events
 *
 * NOTES: One of the two axes must be ordinal for a bar graph. Only y is accomodated
 * for now.
 * There's a lot of logic in here to make sure that both positive and
 * negative values are accomodated.  Negative values have to count right to x=0
 * and positive must always count right from x=0. Currently all bar graphs are
 * assumed to layout horizontally.  TODO: vertical bar graphs (thermometers)
 * TODO: emit events when edges of bars are dragged to set a new value
 **************************************************************************/

function BarChart(config, eventManager)
{
	/**
	 * A unique id for this instance of the bar chart widget
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
		
	//these aren't hooked up yet, but I expect bar graphs to eventually need
	//to fire drag events that let users change the data for the bar length
	//and drag events that let users sort the data differently, reordering the bars -lb
	this.eventManager = eventManager;
	this.changedEventId = this.id + 'barDataChanged';
	this.sortedEventId = this.id + 'barSortChanged';
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
	//only draw axes if there aren't any yet
	if(!d3.select("#"+ axesConfig.id)[0][0]){
		this.lastdrawn.axes = new Axes(this.lastdrawn.container, axesConfig);
	}
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

	// todo: see if there is maybe a better way to determine if something is already drawn other than by id. -mjl
	if (d3.select("#"+barsId)[0][0] === null)
	{

	var graph = axesDrawn.group.append("g") //make a group to hold new bar chart
		.attr("id", barsId) //name it so it can be manipulated or highlighted later
		//TODO: determine if this is really useful
		;
	}
	else
	{
		var graph = d3.select("#" + barsId);
	}
	//TEST: the graph group now exists and reports it's ID correctly
	console.log("graph group is made/found:", graph.attr("id") == barsId); 

	
	//draw the serie(s)
	// bind all the series data to a group element w/ a series class
	// creating or removing group elements so that each series has its own group.
	var barSeries = graph.selectAll("g.series")
		.data(this.data);

	barSeries.enter()
		.append("g")
			.attr("class", function(d, i) {
					//give each series it's own color
					return "series fill" + i;
				})
			.attr("id", function(d, i) {
			//put the number of the series on the series ID
			//can't use the y label because it might contain spaces. -lb
				return barsId + i;});
	//on redraw, get rid of any series which now have no data
	barSeries.exit().remove();  

	//If it's a grouped barchart, shimmie out the bars by group
	if (this.type == "grouped")
	{
		barSeries.attr("transform", function(d, i) {
				return "translate(0," + (groupScale(i)) + ")";
				});
	}
	

	// The series data is an array of values for each bar of the series
	// bind each series data element (bar length) to a child group element, 
	// one for each bar in the series. - mjl
	//	Enclose the bars in individual groups 
	// so you could choose to label the ends with data or label
	//  and have it stick to the bar by putting it in the same group -lb
	var bars = barSeries.selectAll("g.bar")
		.data(function(d) {return d;}); 	//drill down into the nested data

	bars.exit().remove();
 
	bars.enter()
		.append("g")
			.attr("class", "bar")
			//todo: check the dom to verify that a null value for an attribute does not create that attribute -mjl
			.append("rect")
			;
			
	// autokey entries which have no key with the data index for highlighting
	// can't use the y label because it might contain spaces. -lb
	bars.each(function (d, i) { 
					// if there is no key assigned, make one from the index
					d.key = 'key' in d ? d.key : i.toString();
					});

	bars.attr("transform",
				  function(d)
				  {
				// move each group to the x=0 position horizontally if it's a
				// positive bar, or start at it's negative x value if it's reversed.
				// The x<0 logic allows us to draw pyramid charts, normally bar 
				// charts are bin counts and all positive. 
				      var x = (d.x < 0) ? axesDrawn.xScale(d.x) : axesDrawn.xScale(0);
					  var y = axesDrawn.yScale(d.y);
				      return "translate(" + x + "," + y + ")";
				  });
				  
	// Update the height and width of the bar rects based on the data points bound above.
	bars.select("rect")
	//if grouped, each bar is only 1/# groups of the available width
		.attr("height", (this.type == "grouped") ? (bandsize / (this.data.length + 1)) : bandsize)
		.attr("width",
			  function(d)
			  {
				  return (d.x < 0) ? axesDrawn.xScale(0) - axesDrawn.xScale(d.x)
								   : axesDrawn.xScale(d.x) - axesDrawn.xScale(0);
			  });


}; // end of barChart.draw()


