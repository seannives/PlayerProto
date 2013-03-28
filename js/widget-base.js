/* **************************************************************************
 * $Workfile:: widget-base.js                                               $
 * **********************************************************************//**
 *
 * @fileoverview Implementation of the utility functions and objects
 *               used by widgets.
 *
 * Created on		March 27, 2013
 * @author			Leslie Bondaryk
 * @author			Michael Jay Lippert
 *
 * Copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/

/**
 * Definition of the fields of the configuration object used by the
 * SVGContainer constructor.
 * documentation, not to be called/instantiated.
 * @constructor
 */
function SVGContainerConfig()
{
	/**
	 * The parent node for the created svg element
	 * @type {!d3.selection}
	// Note: may need to change this to be a standard DOM node object -lb
	 */
	this.node = null;
	
	/**
	 * The maximum width of the svg container (in pixels)
	 * @type {number}
	 */
	this.maxWid = 0;
	
	/**
	 * The maximum height of the svg container (in pixels)
	 * @type {number}
	 */
	this.maxHt = 0;
}
 
/* **************************************************************************
 * SVGContainer                                                         *//**
 *
 * @constructor
 *
 * The SVGContainer creates an svg element and appends it as the last
 * child of the given node. The svg elements properties are set based on
 * the given configuration values.
 *
 * @param {Object} config -The settings to configure this SVGContainer
 *
 ****************************************************************************/
function SVGContainer(config)
{
	/**
	 * The parent node of the created svg element
	 * @type {d3.selection}
	 */
	this.node = config.node;
	
	/**
	 * The maximum width of this svg container (in pixels)
	 * @type {number}
	 */
	this.maxWid = config.maxWid;
	
	/**
	 * The maximum height of this svg container (in pixels)
	 * @type {number}
	 */
	this.maxHt = config.maxHt;
	
	// todo: why is the container talking about graphs? in the comment below -mjl
	//maxWid, maxHt: the width and height of the graph region, without margins, integers

	// create the svg element for this container of the appropriate size and scaling
	this.svgObj = this.node.append("svg")							// append the new svg element to the parent node
		.attr("viewBox", "0 0 " + this.maxWid + " " + this.maxHt)	// set its size
		.attr("preserveAspectRatio", "xMinYMin meet")				// make it scale correctly in single-column or phone layouts
		.style("max-width", this.maxWid + "px")						// max width works to make it lay out to scale
		.style("max-height", this.maxHt + "px");					// max height keeps it from forcing whitespace below
																	//  in most cases, but not on Safari or Android.  This is a documented
																	//  webkit bug, which they claim they will fix eventually:
																	//  https://bugs.webkit.org/show_bug.cgi?id=82489
																	//  A horrible Jquery workaround is documented at 
																	//  http://www.brichards.co.uk/blog/webkit-svg-height-bug-workaround
}

/* **************************************************************************
 * SVGWidgetCanvas                                                      *//**
 *
 * @constructor
 *
 * The SVGWidgetCanvas ...( was MakeAxes)
 *
 * @param {Object} config -The settings to configure this SVGWidgetCanvas
 *
 ****************************************************************************/
function SVGWidgetCanvas(svgCont, config)
{
	//Top left corner of axis box as percentage of the width/height of the svg box
	//xPosPerc and yPosPerc are decimals telling how much of the container box to use, 
	//typically between 0 and 1. Multiply the width and height of the hard-set svg box
	this.id = "axes" + config.id;
	this.container = svgCont;
	this.xPos = d3.round(config.xPosPerc * svgCont.maxWid);
	this.yPos = d3.round(config.yPosPerc * svgCont.maxHt);
	//default margin is set that is meant to be updated by the constituent 
	//objects if they require more space - mostly happens with axes so we use axes as a container
	//margin: an associative array/object with keys for top, bottom, left and right
	this.margin = {
		top: 10,
		bottom: 0,
		left: 10,
		right: 20
	};

	//Data: array of arrays of objects with keys x: and y: , real floating pt, one for each point, 
	//one array for each trace. If only x key exists, only draw x axis, only y, then only vertical
	this.Data = config.Data;
	//axisType is a string specifying "linear", "log", "ordinal" or "double positive" for axis that always count up from zero, 
	//regardless of the sign of the data - log only hooked up on x and ordinal only on y at the moment.
	//TODO this works for x axis only, if y is needed must be expanded
	var xaxisType = config.xaxisType;
	var yaxisType = config.yaxisType;
	
	//xTicks is either an integer number of ticks or an array of values to use as tickmarks
	//xOrient is a string for orientation "bottom" or "top". Likewise for the yTicks and yOrient
	var xTicks = config.xTicks;
	var yTicks = config.yTicks;
	//x and ylabel are text strings, optional
	this.xLabel = config.xLabel;
	this.yLabel = config.yLabel;

	var format = d3.format(".1");
	var xOrient = config.xOrient,
		yOrient = config.yOrient;
	if ((xOrient === "top") && this.xLabel) {
		this.margin.top = this.margin.top + 40;
		console.log("top margin increased for top label");
		//catches the case where the whole graph renders to fit within the available SVG,
		//but cuts off at the top because it doesn't get pushed down far enough
		}
	else if ((xOrient === "bottom") && this.xLabel) {
		this.margin.bottom = this.margin.bottom+50;
		}
	
	if ((yOrient === "left") && this.yLabel) {
		this.margin.left = this.margin.left + 50;
		console.log("left margin increased for y label");
		//catches the case where the whole graph renders to fit within the available SVG,
		//but cuts off at the right because it gets pushed over too far 
			}
	else if ((yOrient === "right") && this.yLabel) {
		this.margin.right= this.margin.right + 40;
		console.log("right margin increased for y label"); 
					}
	//xPerc and yPerc are decimals telling how much of the container box to use, 
	//typically between 0 and 1. Multiply the width and height of the hard-set svg box
	//used to calculate the aspect ratio when sizing viewport up or down
		this.innerWid = d3.round(config.xPerc * svgCont.maxWid) - this.margin.left - this.margin.right;
		this.innerHt = d3.round(config.yPerc * svgCont.maxHt) - this.margin.top - this.margin.bottom;
	
	var tickheight = 10;

	this.group = svgCont.svgObj.append("g") //make a group to hold new scaled widget with axes
	//.attr("transform", "translate(" + margin.left + "," + margin.top + ")") 
	// push everything down so text doesn't slop over the top - We'll do this later after measurement
	.attr("id", this.id) //name it so it can be manipulated or highlighted later
	;


	//build the x and y scales
	//start by unwrapping all the data to make a single set of values for
	//x and y
	var xData = [],
		yData = [];
	if(!this.Data){
		this.Data=[[{x:1e-10,y:0},{x:1,y:1}]];
	}
	
	for (i = 0; i < this.Data.length; i++) {
		this.Data[i].forEach(

		function(o) {
				xData.push(o.x);
				yData.push(o.y);
		});
	}
	if (xaxisType) {
		
		if(yaxisType == "ordinal"){
		xData.push(0); //if we're making ordinal bars, x must start from 0
		}
	
		//Check if there explicit ticks specified, and if so, use them as the mapped range of the graph width
		//ignore the actual data range
		var xRange = ($.isArray(xTicks)) ? xTicks : xData;

		if (xaxisType == "linear") {
		this.xScale = d3.scale.linear().domain(d3.extent(xRange)) //pulls min and max of x
		.rangeRound([0, this.innerWid]); 
		//xScale is now a linear function mapping x-data to the width of the drawing space
		//TODO put in logic to reverse the x axis if the axis is on the right,
		//or maybe just add a "reverse" setting.
		
	     }
	
		if (xaxisType == "log") {
			var vals = d3.extent(xRange);
			//always start and end on even decades
			var low = Math.floor(Math.log(vals[0])/Math.log(10));
			var high = Math.ceil(Math.log(vals[1])/Math.log(10));
		 
		this.xScale = d3.scale.log().domain([0.99*Math.pow(10,low),Math.pow(10,high)]) //pulls min and max of x
		.rangeRound([0, this.innerWid])
		; //xScale is now a log-scale function mapping x-data to the width of the drawing space
	     }
	
		//if the axis is double positive then create leftPositive and rightPositive 
		//scales that meet at 0. Still use xScale to plot the data.
		if (xaxisType == "double positive") {
			this.xScale = d3.scale.linear().domain(d3.extent(xRange)) //pulls min and max of x
			.rangeRound([0, this.innerWid]); //xScale is now a function mapping x-data to the width of the drawing space
			
			var negatives = [],
				negTicks = [],
				posTicks = [];
			xRange.forEach(
           //store all the negative points separately
			function(o) {
				if (o < 0) {
					negatives.push(o);
				}
			});
           //store all the negative ticks separately
			if ($.isArray(xTicks)) {
				xTicks.forEach(
				function(o) {
					if (o < 0) {
						negTicks.push(Math.abs(o));
					} else {
						posTicks.push(o);
					}
				});
			}
			console.log("Minimum negative value converted to positive: ", d3.min(negatives));
            // create two scales from negative min to 0, then 0 to positive max
			//map them to the calculated point for xScale(0) - this will need to get recalc'd if the
			//graph gets resized.
			var leftPositive = d3.scale.linear()
			.domain([Math.abs(d3.min(xRange)), 0])
			.rangeRound([0, this.xScale(0)]);
			var rightPositive = d3.scale.linear()
			.domain([0, d3.max(xRange)])
			.rangeRound([this.xScale(0), this.innerWid]);
		}

		//set up the functions that will generate the x axis
		this.xAxis = d3.svg.axis() //a function that will create the axis and ticks and text labels
		.scale(this.xScale) //telling the axis to use the scale defined by the function x
		.orient(xOrient).tickSize(tickheight, 0).tickPadding(3).tickFormat(format);
		
		if (xaxisType == "log"){
			this.xAxis.tickFormat(logFormat);
		}
		
		if (xaxisType == "double positive") {
			this.leftXAxis = d3.svg.axis() 
			.scale(leftPositive) //do the faux positive left-hand axis
			.orient(xOrient).tickSize(tickheight, 0).tickPadding(3).tickFormat(format);

			this.xAxis = d3.svg.axis() 
			.scale(rightPositive) //do the real positive right-hand axis
			.orient(xOrient).tickSize(tickheight, 0).tickPadding(3).tickFormat(format);
		}

		//next set the ticks to absolute values or just a number of ticks
		if (xaxisType == "double positive") {
			$.isArray(xTicks) ? (this.xAxis.tickValues(posTicks) && this.leftXAxis.tickValues(negTicks)) : 
			   (this.xAxis.ticks(xTicks - 2) && this.leftXAxis.ticks(2));
		} else {
			$.isArray(xTicks) ? (this.xAxis.tickValues(xTicks)) : (this.xAxis.ticks(xTicks));
		}
		
		//now draw the horizontal axis
		this.xaxis = this.group.append("g")
		.call(this.xAxis)
		.attr("transform", "translate(0," + ((xOrient == "bottom") ? this.innerHt : 0) + ")")
		//move it down if the axis is at the bottom of the graph
		.attr("class", "x axis");

		//if we want positive tick values radiating from 0, then make the negative half of the axis separately
		if (xaxisType == "double positive") {
			this.xaxis.append("g").call(this.leftXAxis)
			.attr("transform", "translate(0," + ((xOrient == "bottom") ? this.innerHt : 0) + ")")
			//move it down if the axis is at the bottom of the graph
			.attr("class", "x axis");
			// make the x-axis label, if it exists
		}

		if (this.xLabel) {
			var xaxisDims = this.xaxis.node().getBBox();
			this.xLabelObj = this.xaxis.append("foreignObject")
			.attr("x", 0)
			.attr("y", ((xOrient == "top") ? (-1.5) : 1) * (xaxisDims.height + 2))
			.attr("width", this.innerWid).attr("height", 40);
			this.xLabelObj.append("xhtml:body").style("margin", "0px") 
			//this interior body shouldn't inherit margins from page body
			.append("div").attr("class", "axisLabel").html(this.xLabel) //make the label  
			;
		}
		var xHt = d3.round(this.group.select(".x.axis").node().getBBox().height);
		
	}

	if (yaxisType) {

		var yRange = ($.isArray(yTicks)) ? yTicks : ((d3.min(yData) > 0) ? yData.concat(0) : yData);
		//check that the y range extends down to 0, because data graphs
		// that don't include 0 for y are misleading
	
		if (yaxisType == "linear") {
			this.yScale = d3.scale.linear().domain(d3.extent(yRange)) //pulls min and max of y
			.rangeRound([this.innerHt, 0]);
	    }
		
		if (yaxisType == "ordinal") {
			this.yScale = d3.scale.ordinal().domain(yRange) //lists all ordinal y vals
			.rangeRoundBands([this.innerHt, 0],.4);
			
			//width is broken into even spaces allowing for bar width and 
			//a uniform white space between each, in this case, 20% white space
	    }
		
		// yScale is a function mapping y-data to height of drawing space. 
		//Svg counts height down from the top, so we want the minimum drawn at height
		this.yAxis = d3.svg.axis() //a function that will create the axis and ticks and text labels
		.scale(this.yScale) //telling the axis to use the scale defined earlier
		.orient(yOrient).tickSize(tickheight, 0)
		//sets the height of ticks to tickheight, except for the ends, which don't get ticks
		.tickPadding(3);
		//if y ticks are specified explicitly, use them
		$.isArray(yTicks) ? (this.yAxis.tickValues(yTicks)) : (this.yAxis.ticks(yTicks));
		//test tick type switch
		console.log("ytick specified explicitly?", yTicks, $.isArray(yTicks), this.yAxis.ticks());

		this.yaxis = this.group.append("g")
		.attr("transform", "translate(" + ((yOrient == "right") ? this.innerWid : 0) + ",0)")
		//move it over if the axis is at the bottom of the graph
		.call(this.yAxis).attr("class", "y axis");

		// make the y-axis label, if it exists
		if (this.yLabel) {
			var yaxisDims = this.yaxis.node().getBBox();
			var yLabelObj = this.yaxis.append("foreignObject")
			.attr("transform", "translate(" + (((yOrient == "left") ? (-1.1) : 1.1) * (yaxisDims.width) 
			   +((yOrient == "left") ? -20:0)) + "," 
			   + (this.innerHt) + ") rotate(-90)")
			// move it out of the way of the ticks to left or right depending on axis orientation
			.attr("width", this.innerHt).attr("height", 40);
			var yLabText = yLabelObj.append("xhtml:body").style("margin", "0px")
			//this interior body shouldn't inherit margins from page body
			.append("div").attr("class", "axisLabel").attr("id","label"+this.id)
			.html(this.yLabel) //make the label  
			;
			console.log("label size ", $('#label'+this.id).height());//toDO use this to correctly move to the left of axis
		}
			
		var yWid = d3.round(this.group.select(".y.axis").node().getBBox().width);
	}
	

	var axesDims = this.group.node().getBBox();
	//check that rendering is all inside available svg viewport.  If not, enlarge
	//margins and calculate a new inner width, then update all scales and renderings
	if (axesDims.width > config.xPerc*svgCont.maxWid) {
		var addMargin =  d3.round(axesDims.width - config.xPerc*svgCont.maxWid);
		addMargin = addMargin>yWid ? addMargin:yWid;
		if (yOrient === "right") {
			this.margin.right = this.margin.right + addMargin ;
		} else {
			this.margin.left = this.margin.left + addMargin ;
		}

		this.innerWid = this.innerWid - this.margin.right - this.margin.left;
		//using the new dimensions, redo the scale and axes
		this.xScale.rangeRound([0, this.innerWid]);
		this.xAxis.scale(this.xScale);
		console.log("x margins increased, new inner width is ", this.innerWid, " margin ", this.margin.left, this.margin.right);
		this.xaxis.call(this.xAxis);
		if(this.yaxis){
			this.yaxis.attr("transform", "translate(" + ((yOrient == "right") ? this.innerWid : 0) + ",0)");
		}
		if (this.xLabelObj) {
			this.xLabelObj.attr("y", d3.round(((xOrient == "top") ? (-1.4) : 1) * (xaxisDims.height + 5))).attr("width", this.innerWid).attr("height", 50);
		}

	}

	if (axesDims.height > config.yPerc*svgCont.maxHt) {
		var addMargin = d3.round(axesDims.height - config.yPerc*svgCont.maxHt);
		if (xOrient === "top") {
			this.margin.top = this.margin.top + addMargin;
		} else {
			this.margin.bottom = this.margin.bottom + addMargin;
		}
		this.innerHt = this.innerHt - this.margin.top - this.margin.bottom;
		//using the new dimensions, redo the scale and axes
		if(yaxisType=="ordinal"){
				this.yScale.rangeRoundBands([this.innerHt, 0],.3);
				console.log("ordinal bandsize ", this.yScale.rangeBand());
				//width is broken into even spaces allowing for bar width and 
				//a uniform white space between each, in this case, 30% white space
		} else
		{
				this.yScale.rangeRound([this.innerHt, 0]);
		}
	
		this.yAxis.scale(this.yScale);
		console.log("y margins increased, new inner height is ", this.innerHt, " margin: ", this.margin.top, this.margin.bottom);
		this.yaxis.call(this.yAxis);
		if(this.xaxis) {
			this.xaxis.attr("transform", "translate(0," + ((xOrient == "bottom") ? this.innerHt : 0) + ")");
		}
		if (yLabelObj) {
			yLabelObj.attr("transform", "translate(" + d3.round(((yOrient == "left") ? (-1.1) : 1.1) * (yaxisDims.width) 
				   +((yOrient == "left") ? -19:0)) + "," 
				   + (this.innerHt) + ") rotate(-90)")
			// move it out of the way of the ticks to left or right depending on axis orientation
			.attr("width", this.innerHt);
		}
	}

	this.margin.left = this.margin.left + this.xPos;
	this.margin.top = this.margin.top + this.yPos;
	//and finally, with the margins all settled, move the group down to accomodate the 
	//top and left margins and position
	this.group.attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
} // end makeAxis method