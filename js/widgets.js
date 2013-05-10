/* **************************************************************************
 * $Workfile:: widgets.js                                              $
 * **********************************************************************//*
 *
 * @fileoverview Implementation of widgets to play Santiago activities.
 *
 * The widgets will render graphs, images, and other data-driven learning
 * objects inside of the Santiago and Vancouver publishing projects.  They
 * will eventually integrate with the Pearson Activity Framework (PAF)
 * according to the documentation at
 * https://hub.pearson.com/confluence/display/AF/PAF+Widget+API
 *
 * Created on		March 27, 2013
 * @author			Leslie Bondaryk, Michael Jay Lippert
 *
 * Copyright (c) 2013 Michael Jay Lippert, All rights reserved.
 *
 * **************************************************************************/

/* **************************************************************************
 * Constants
 ****************************************************************************/

/* **************************************************************************
 * Page variables
 ****************************************************************************/

/* **************************************************************************
 * Containers
 ****************************************************************************/


/* **************************************************************************
 * renderInteractive                                                    *//**
 *
 * Create a container (html or svg) as specified and put the given node into
 * it.
 *
 * @param interactiveElement	the type of content (HTML for an html
 *								container, otherwise an svg container)
 * @param interactiveNode		The ID of the div where the widget will get
 *								written out.
 *
 * Notes:
 * I'm interpreting interactiveNode as the ID of the div where the widget
 * will get written out, and interactiveElement as the type and content.
 * My guess is this should be server-side code. interactiveElement will
 * either be an HTML-based set (tables, eqn's, forms) or an SVG-based set
 * (graphs, images).  But you'll need a different top-level container for
 * each. Note that either can nest, with SVG in HTML, or HTML in an SVG
 * foreign object. Not using this yet, just pondering it.
 ****************************************************************************/
function renderInteractive(interactiveElement, interactiveNode) {
	// load item body
	var interactive;
	if (interactiveElement.type == "HTML")
		{ interactive = MakeHTMLContainer(interactiveElement.content); }
	else
		{ interactive = MakeSVGContainer(interactiveElement.content); }

	interactive.appendChild(interactiveNode);
}



/* **************************************************************************
 * MakeSVGContainer                                                    *//**
 *
 * Create an svg tag and write it to the given node.
 *
 * @param config				an object containing the following names:
 *
 * @param node					the container node in the document
 * TODO: should make this a jQuery style node, right now it's d3 selection
 *
 * @param maxWid,maxHt			integers which set the maximum width/height
 *								of the svg region, and the aspect ratio for
 *								scaling
 *
 * Notes:
 * TODO: Eventually this might need to be a method of RenderInteractive
 * The interactiveElement can be SVG-based.
 //max height keeps it from forcing whitespace below
	//in most cases, but not on Safari or Android.  This is a documented
	//webkit bug, which they claim they will fix eventually:
	//https://bugs.webkit.org/show_bug.cgi?id=82489
	//A horrible Jquery workaround is documented at
	//http://www.brichards.co.uk/blog/webkit-svg-height-bug-workaround
 ****************************************************************************/

function MakeSVGContainer(config) {
	this.node = config.node;
	this.maxWid = config.maxWid;
	this.maxHt = config.maxHt;
	this.id = this.node.attr("id");

	//create an svg element of the appropriate size and scaling
	this.rootEl = this.node.append("svg").attr("viewBox", "0 0 " + this.maxWid + " " + this.maxHt)
	//makes it scale correctly in narrow-window, single-column or phone layouts
	.attr("preserveAspectRatio", "xMinYMin meet") //ditto
	.attr("id", this.id).style("max-width", this.maxWid + "px")
	//max width works to make it lay out to scale
	.style("max-height", this.maxHt + "px");

} //end MakeSVGContainer constructor


/* **************************************************************************
 * Axes                                                                 *//**
 *
 * Method of MakeSVGContainer: 	Create x-y axes in an SVG Container
 *
 * @param config				an object containing the following names:
 *
 * @param xPerc,yPerc			real numbers specifying the left, top corner
 * 								of the axes box as a percentage of the width
 *								and height. This allows the axes to be
 *								positioned in the svg canvas, allowing for several
 *
 * @param xPosPerc,yPosPerc		reals specifying how much of the container width and
 * 								height to use. Typically between 0 and 1. Used to
 *								calculate innerWid and innerHt
 *
 * @param Data					array of arrays containing data point objects {x: #,y: #}
 * 								This allows the axes to set their domain to the min/max
 * 								of the data.  If not supplied, a default [0,1] is set on
 *								both axes.
 *
 * @param xaxisType, yaxisType	strings specifying "linear", "log", "ordinal" or "double positive" (x)
 * 								linear and ordinal only on y at the moment.
 *
 * @param xTicks, yTicks		Either an integer number of ticks, or an array
 * 								of explicit ticks, which will override autoscaling.
 *
 * @param xOrient, yOrient 		Strings for orientation "bottom" or "top" and "left"/"right"
 *
 * @param xLabel, yLabel		Strings, optional - may contain markup and extended chars
 *
 * Notes:

 ****************************************************************************/
MakeSVGContainer.prototype.Axes = function (config,eventManager) {

	var myID = "axes" + this.id;
	this.xPos = d3.round(config.xPosPerc * this.maxWid);
	this.yPos = d3.round(config.yPosPerc * this.maxHt);
	this.eventManager = eventManager;

	//default margin is set that is meant to be updated by the constituent
	//objects if they require more space - mostly happens with axes so we
	//use axes as a container
	this.margin = {
		top: 10,
		bottom: 0,
		left: 10,
		right: 20
	};

	this.Data = config.Data;
	var xaxisType = config.xaxisType;
	var yaxisType = config.yaxisType;
	var xTicks = config.xTicks;
	var yTicks = config.yTicks;
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
	this.innerWid = d3.round(config.xPerc * this.maxWid)
						- this.margin.left - this.margin.right;
	this.innerHt = d3.round(config.yPerc * this.maxHt)
						- this.margin.top - this.margin.bottom;

	var tickheight = 10;

	this.group = this.rootEl.append("g")
	//make a group to hold new scaled widget with axes
	.attr("id", myID) //name it so it can be manipulated later
	;


	//build the x and y scales
	//start by unwrapping all the data to make a single set of values
	//for x and y
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

		//Check if there explicit ticks specified, and if so, use them
		//as the mapped range of the graph width
		//ignore the actual data range
		var xRange = ($.isArray(xTicks)) ? xTicks : xData;

		if (xaxisType == "linear") {
		this.xScale = d3.scale.linear()
		.domain(d3.extent(xRange)) //pulls min and max of x
		.rangeRound([0, this.innerWid]);
		//xScale is now a linear function mapping x-data to the width of the drawing space
		//TODO put in logic to reverse the x axis if the axis is on the right,
		//or maybe just add a "reverse" setting.
	     }

		 if (xaxisType == "ordinal") {
			this.xScale = d3.scale.ordinal().domain(xRange) //lists all ordinal x vals
			.rangeRoundBands([this.innerHt, 0],.2);
		//width is broken into even spaces allowing for bar width and
		//a uniform white space between each, in this case, 20% white space
	     }


		if (xaxisType == "log") {
			var vals = d3.extent(xRange);
			//always start and end on even decades
			var low = Math.floor(Math.log(vals[0])/Math.log(10));
			var high = Math.ceil(Math.log(vals[1])/Math.log(10));

		this.xScale = d3.scale.log()
		.domain([0.99*Math.pow(10,low),Math.pow(10,high)]) //pulls min and max of x
		.rangeRound([0, this.innerWid]);
		//xScale is now a log-scale function mapping x-data to the width of the drawing space
	     }

		//if the axis is double positive then create leftPositive and rightPositive
		//scales that meet at 0. Still use xScale to plot the data.
		if (xaxisType == "double positive") {
			this.xScale = d3.scale.linear().domain(d3.extent(xRange)) //pulls min and max of x
			.rangeRound([0, this.innerWid]);

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

		//if we want positive tick values radiating from 0,
		//then make the negative half of the axis separately
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
			//a uniform white space between each, in this case, 40% white space
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
	if (axesDims.width > config.xPerc*this.maxWid) {
		var addMargin =  d3.round(axesDims.width - config.xPerc*this.maxWid);
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

	if (axesDims.height > config.yPerc*this.maxHt) {
		var addMargin = d3.round(axesDims.height - config.yPerc*this.maxHt);
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


/* **************************************************************************
 * Legend                                                                 *//**
 *
 * Method of MakeSVGContainer: 	Create legend in x-y axes
 *
 * @param config				an object containing the following names:
 *
 * @param type					string specifying "box" or "line" for markers.
 * TODO: need to add symbols for scatter plots, including custom images
 * @param xPos, yPos			Strings for orientation "left"/"right" and "bottom"/"top"
 *
 * @param labels				Strings to print next to each entry
 *
 * @param liteKey 				integers setting correspondance with other page
 * 								elements in other widgets
 *
 * NOTES: Should probably actually get the data labels from the Data in the axes or at least
 * any component graph. It is convenient though to be able to specify these separately, so
 * they can be used as a key for images, etc., which wouldn't necessarily have labels?
 ****************************************************************************/
MakeSVGContainer.prototype.Legend = function (config, eventManager)
	{ //begin legend method to go with axes object

	var myID = "legend" + this.id + "_";
	this.legend = {id: myID};
	this.eventManager = eventManager;
	var that = this;

	var xPos = config.xPos;
	var yPos = config.yPos;
	//labels is an array of strings containing the data labels to be printed on the legend
	this.labels = config.labels;
	//type is a string specifying box or line legend
	var type = config.type;
	var liteKey = config.liteKey;
	var boxLength = 15, //attractive length for the colored lines or boxes
		inset = 10, //attractive spacing from edge of axes boxes (innerWid/Ht)
		//also used to space the enclosing legend box from the text
	//take the number of rows from the number of labels
		rowCt = this.labels.length;
	var boxHeight = (boxLength + 6) * rowCt;
	var longest = d3.last(this.labels, compareLen);
	console.log("Longest legend label: ", longest);
	//to calculate the width of the box big enough for the longest text string, we have to
	//render the string, get its bounding box, then remove it.
	var longBox = this.group.append("g");
	longBox.append("text").text(longest);
	this.boxWid = longBox.node().getBBox().width + inset/2 + boxLength;
	//the box around the legend should be the width of the
	//longest piece of text + inset + the marker length
	//so it's always outside the text and markers, plus a little padding
	longBox.remove();
	var xOffset = (xPos == "left") ? inset : (this.innerWid - this.boxWid - inset);
	//if the position is left, start the legend on the left margin edge,
	//otherwise start it across the graph box less its width less padding
	var yOffset = (yPos == "bottom") ? this.innerHt - boxHeight - inset : inset;
	//if the position is at the bottom, measure up from bottom of graph,
	//otherwise just space it down from the top.
	var legendBox = this.group.append("g")
	//make a new group to hold the legend
	.attr('id', myID)
	//move it to left/right/top/bottom position
	.attr('transform', 'translate(' + xOffset + ',' + yOffset + ')');

	console.log("sensible values for legend horizontal position ", xPos, xPos == "right" || xPos == "left");

	console.log("sensible values for legend vertical position ", yPos, yPos == "top" || yPos == "bottom");
	//next make a filter definition for highlighting
	var filter = legendBox.append("defs").append("filter").attr("id","drop-shadow");
	filter.append("feGaussianBlur").attr("in","SourceAlpha").attr("stdDeviation",2).attr("result","blur");
	filter.append("feOffset").attr("in","blur").attr("dx",2).attr("dy",2).attr("result","offsetBlur");
 	var merge = filter.append("feMerge");
	merge.append("feMergeNode").attr("in","offsetBlur");
	merge.append("feMergeNode").attr("in","SourceGraphic");


	legendBox.append("rect").attr("x", -5).attr("y", -5)
	//create small padding around the contents at leading edge
	.attr("width", this.boxWid).attr("height", boxHeight) //lineheight+padding x rows
	.attr("class", "legendBox");

	this.legendRows = legendBox.selectAll("g.slice")
	//this selects all <g> elements with class slice (there aren't any yet)
	.data(this.labels) //associate the data to create stacked slices
	.enter() //this will create <g> elements for every data element
	.append("svg:g") //create groups
	.attr("transform", function(d, i) {
		return "translate(0," + (rowCt - i - 1) * (boxLength+4) + ")";
		//each row contains a colored marker and a label.  They are spaced according to the
		//vertical size of the markers plus a little padding, 3px in this case
		//counting up from the bottom, make a group for each series and move to stacked position
	});

	if (liteKey) {
		this.legendRows.attr("id", function(d, i) {
			return myID + liteKey[i];
		})
		//name it so it can be manipulated or highlighted later
		.attr("class", "liteable");
	}

	if (type == "box") {
		this.legendRows.append("rect")
		.attr("x", 0).attr("y", 0)
		//make the rectangle a square with width and height set to boxLength
		.attr("width", boxLength)
		.attr("height", boxLength)
		.attr("class", function(d, i) {
			return "fill" + i;
		});
	} else if (type == "line") {
		this.legendRows.append("line") //add a line to each slice
		.attr("class", function(d, i) {
			return "trace stroke" + i;
		}).attr("x1", 0) //start at the left edge of box
		.attr("x2", boxLength) //set line width
		.attr("y1", boxLength / 2).attr("y2", boxLength / 2);
	}

	this.legendRows.append("text") //this is native svg text, it doesn't wrap
	.attr("text-anchor", "start") //left align text
	.attr("class", "legendLabel").attr("dx", boxLength + 4)
	//offset text to the right beyond marker by 4 px
	.attr("dy", boxLength/2 ) //offset text down so it winds up in the middle of the marker
	.attr("alignment-baseline","central")//and put the vertical center of the text on that midline
	.text(function(d, i) {
		return d; //get the label from legend array
	});
} //end of Legend method for Axes

/***************
MakeAxes.prototype.setState = function(liteKey) {
	console.log("TODO: Log highlight event on ", this.legend.id);

	if (this.legendRows.selectAll(".liteable")) {
		//TODO/put all rows back to normal width (clear old state)
		this.legendRows.attr("filter",null);
		//TODO/emphasize the line selected
		d3.selectAll("#legend" + this.id + "_" + liteKey)
		.attr("filter", "url(#drop-shadow)");
		//.selectAll("rect").style("stroke-width",1).style("stroke","#333333");
		return liteKey;
	} else {
		console.log("Invalid key. No legend row " + liteKey);
	}
};
*****************/


/* **************************************************************************
 * Labels                                                               *//**
 *
 * Method of MakeSVGContainer: 	Create labels on local axes scale
 *
 * @param config				an object containing the following names:
 *
 * @param labels				array of objects with keys content: string with HTML markup,
 *								xyPos: an [x,y] array to orient the position on the axes grid,
 * 								in local coordinates and width: the width of the label
 *								TODO: need a better answer than hard-set width
 *
 * @param type					string specifying bullets for dots, numbered
 * 								for dots and #, or anything else for just labels
 *
 * @param liteKey 				integers setting correspondance with other page
 * 								elements in other widgets
 *
 * NOTES: TODO role: a string which is one of "label", "distractor".
 * TODO: we need some sort of autowidth intelligence on these, but I don't
 * know how to reconcile that with giving user control over wrapping
 ****************************************************************************/
MakeSVGContainer.prototype.Labels = function(config, eventManager)
{ //begin labeled image object generator

	var myID  = "label" + this.id + "_";
	this.labels = {id: myID,
				  labels: config.labels
				};
	this.selectedEventId = myID + 'Number';
	
	this.eventManager = eventManager;
	
	var that=this;
	var type = config.type;
	var numLabels = this.labels.labels.length;
	var liteKey = config.liteKey;

	var graph = this.group.append("g") //make a group to hold labels
	.attr("class", "labels")
	.attr("id", this.labels.id);

//this filter can be used to add dropshadows to highlighted labels and bullets
	var filter = graph.append("defs").append("filter").attr("id","drop-shadow");
	filter.append("feGaussianBlur").attr("in","SourceAlpha").attr("stdDeviation",2).attr("result","blur");
	filter.append("feOffset").attr("in","blur").attr("dx",2).attr("dy",2).attr("result","offsetBlur");
 	var merge = filter.append("feMerge");
	merge.append("feMergeNode").attr("in","offsetBlur");
	merge.append("feMergeNode").attr("in","SourceGraphic");

	this.labelCollection = graph.selectAll("g.label")
		.data(this.labels.labels);
	this.labelCollection.enter()
		.append("g")
		.attr("class","label")
		.attr("transform", function(d, i) 
				{
				return "translate(" + that.xScale(d.xyPos[0]) + "," + that.yScale(d.xyPos[1]) + ")";
				})
		.attr("id", function(d, i) 
			{
				return myID + (d.key ? d.key : i);
			});
			//name it so it can be manipulated or highlighted later

	this.labelCollection.append("foreignObject")
		.attr("x", 0)
		.attr("y", 0)
		.attr("width", function(d,i) { return d.width;})
		.attr("height", 200)
		.append("xhtml:body").style("margin", "0px")
			//this interior body shouldn't inherit margins from page body
		.append("div").attr("class", "descLabel")
		//.style("visibility",function(d,i) { return d.viz;})
		//I punted on the show/hide thing, but it could come back
			.html(function(d, i) {
				return d.content;
				}
				); //make the label

	if(type == "bullets" || type == "numbered"){
		this.labelCollection.append("circle")
		.attr("cx",0).attr("cy",0).attr("r",16)
		.attr("class","steps");
	}

	if(type == "numbered"){
		this.labelCollection.append("text")
		.style("fill","white")
		.attr("text-anchor","middle")
		.attr("alignment-baseline","middle")
		.text(function(d, i) {
				return i+1;
				});
	}
	
	this.labelCollection.on('click',
				function (d, i)
				{
					that.eventManager.publish(that.selectedEventId, {selectKey: (d.key ? d.key : i)});
				});
	

} //end MakeLabels object generator function

/* **************************************************************************
 * lite                                                            *//**
 *
 * Updates the labels widget highlight to match the currently
 * selected index, lite.
 *
 **********************************************************************/
function lite(Obj, lite)
{
	console.log("TODO: fired LabelLite log");
	//return all styles to normal on all the labels
	var allLabels = 
		d3.selectAll("#" + Obj.labels.id).selectAll(".descLabel");
	//TODO what I need is a better way to know which collection
	//of labels to turn off. Doing it by class seems lame.
	allLabels
	.style("color",null)
	//setting a style to null removes the special
	//style property from the tag entirely.
	//TODO: make the lit and unlit classes
	.style("font-weight",null)
	.style("background-color","");
	var allBullets = 
		d3.selectAll("#" + Obj.labels.id);
	//turn all the text back to white, and circles to black
	allBullets.selectAll("text").style("fill","white");
	allBullets.selectAll("circle").attr("class","steps")
		;
		
	//highlight the selected label(s)
	
	var setLabels = d3.selectAll("#" + Obj.labels.id + lite);
	if(setLabels) 
		{
		setLabels.selectAll("circle")
		.attr("class","stepsLit");
		//highlight the one selected circle and any others
		//with the same lite index
		setLabels.selectAll("text").style("fill","#1d95ae");
		setLabels.selectAll(".descLabel")
		//.transition().duration(100)
		// this renders badly from Chrome refresh bug
		//we'll have to figure out how to get transitions
		//back in - maybe just foreign objects?
		.style("color", "#1d95ae")
		.style("font-weight", "600")
		.style("background-color", "#e3effe");
	
		} 
	else {
	console.log("Invalid key. No label " + liteKey);
		}
}



/* **************************************************************************
 * AreaMarkers                                                          *//**
 *
 * Method of MakeSVGContainer: 	Create x or y oriented bands of grey fill
 *								extending from top to bottom or side to side
 *
 * @param config				an object containing the following names:
 *
 * @param xBands, yBands		array of 2-element arrays of reals which
 *								determine the leading and trailing edges of the
 *								area marker rectangles, and the orientation
 *								(vertical if x, horiz if y)
 *
 * @param liteKey 				integers setting correspondance with other page
 * 								elements in other widgets
 *
 * NOTES: TODO will need to make the edges of these draggable
 **************************************************************************/

MakeSVGContainer.prototype.AreaMarkers = function(config,eventManager) { //begin area marker generator

	//make x and y scales from the axes container into variables so they can be
	//used inside functions
	var xScale = this.xScale;
	var yScale = this.yScale;
	var myID  = "areaMark" + this.id + "_";
	this.areaMarkers = {
		id: myID,
		eventFunc: this.setMarkerLite
				};

	this.xBands = config.xBands;
	this.yBands = config.yBands;
	this.eventManager = eventManager;
	var liteKey = config.liteKey;
	//make a group to hold the area markers
	var bandMarks = this.group.append("g").attr("class", "areaMarker");

	//these tests pull the sets of markers for each band and then report whether the bands are all in the shown range of the graph which calls them
	if (this.xBands) {
		bandMarks.selectAll("rect")
		.data(this.xBands).enter()
		.append("rect").attr("x", function(d) {return xScale(d[0]); })
		.attr("y", 0)
		.attr("width", function(d) {return Math.abs(xScale(d[1]) - xScale(d[0]));})
		.attr("height", this.innerHt)
	//	.attr("class", function(d,i){ return "fill"+i;})
	//TODO figure out a coloring scheme for when they overlap
		;


	}

	if (this.yBands) {
			bandMarks.selectAll("rect")
			.data(this.yBands).enter()
			.append("rect").attr("y", function(d) {return yScale(d[0]); })
			.attr("x", 0)
			.attr("height", function(d) {return Math.abs(yScale(d[1]) - yScale(d[0]));})
			.attr("width", this.innerWid)
	}

	if (liteKey) {
		bandMarks.attr("id", function(d, i) {
			return this.areaMarkers.id + liteKey[i];
		})
	} //name it
} //end area marker object generator function

/* MakeAxes.prototype.markerHighLite = function(liteKey) {
	if (this.markers) {
		//TODO - test and clean this up
		//turn off any previous highlights (clear old state)
		d3.selectAll(".areaMarker").transition().duration(200).style("fill-opacity","");
		//emphasize the selected marker
		d3.select("#" + this.id + liteKey)
		.transition().duration(200).style("fill-opacity","5");
		return liteKey;
	} else {
		console.log("Invalid key. No image " + liteKey);
	}
};
*/


/* **************************************************************************
 * LineMarkers                                                          *//**
 *
 * Method of MakeSVGContainer: 	Create x or y oriented marker lines that
 *								report a text label or data for an
 *								intersected point
 *
 * @param config				an object containing the following names:
 *
 * @param xMarks				array of objects {x: <val>, y: <val> or label: <val>}
 *								specifies the x position, x and y for the label, or
 *								just label in the label. Also gives the orientation
 *								(vertical if x, horiz if y - not implemented TODO)
 *
 * @param liteKey 				integers setting correspondance with other page
 * 								elements in other widgets
 *
 * NOTES: TODO will need to make these draggable - TODO hook up y variant
 * don't know if that should be a whole separate function or if
 * conditionals are better
 **************************************************************************/

MakeSVGContainer.prototype.LineMarkers = function(config, eventMangager) { //begin marker generator

	this.xMarks = config.xMarks;
	this.yMarks = config.yMarks;
	//this.eventManager = eventManager;

	var myID = "marker" + this.id + "_";
	var liteKey = config.liteKey;
	var that = this;
	var labelHt = this.innerHt/4,labelWid = 100;
	//TODO: probably shouldn't hard set these, but I'm not sure how to set wrapping otherwise.
	//These look marginally ok.

	var markers = this.group
	.selectAll("g.marker") //this selects all marker groups (there aren't any yet)
	.data(this.xMarks); //associate the data to create the right number of markers

	markers.enter() //this will create <g> elements for every marker
	//groups are good because we can have a marker line, and a label, and anything else
	//that requires the same relative coordinates.
	.append("g").attr("class", "marker");
	markers.attr("transform", function(d) {
		//Not entirely settled on marker data format.  It makes most sense to input
		//an array of values, all x or all y.  But it would also be nice to be able to
		//pull one or more entries out of an existing data set.  So the following
		//logic looks to see if there is an x: name or if it's just a standalone value
		return "translate(" + d3.round(that.xScale(d.x ? d.x : d)) + ",0)";
		//move each group to the data point specified for the marker
	});

	if(liteKey) {
		markers.attr("id", function(d, i) {
		return myID + liteKey[i];
		});
	}

	console.log("markers are made", this.xMarks);

	markers.append("line") //vertical line
	.attr("class", "markers").attr("y1", function(d, i) {
		return i * labelHt + 20;
	//top of line is on the bottom of the label box, bottom of
	//line is at the bottom of the graph

	}).attr("y2", that.innerHt) 
	;

	//draw data labels on the markers
	markers.append("foreignObject").attr("x", -labelWid / 2).attr("y", function(d, i) {
		return (labelHt + 10) * (i);
	}) //offset down on text box
	.attr("width", labelWid)
	.attr("height", labelHt)
	.append("xhtml:body")
	.style("margin", "2px") //this interior body shouldn't inherit margins from page body
	.append("div").attr("class", "markerLabel")
	.html(function(d, i) {
		return d.y ? ("x: " + d.x + "<br> y: " + d.y) : d.label;
	}) //make the label from value and category
	;
//Drag updater
function dragUpdate(xData, allData, range, scale) {
	return d3.behavior.drag()
	//.origin(Object)
	.on("dragstart", function(d) {
		var xval = snapTo(xData, range)(d3.mouse(this.parentNode)[0]);
		//record the starting position as the nearest known data point corresponding
		//to the current click. Must use parent container because click position in nested groups
		//is wonky
		d3.select(this).transition().duration(10).attr("transform", "translate(" + scale(xval) + ",-4)");
		//jump the dragged object up a little so you know you've got what you intended
	}).on("drag", function(d, i) {
		xval = snapTo(xData, range)(d3.mouse(this.parentNode)[0]);
		//update the position with the drag to the closest available data point
		xindex = xData.indexOf(xval);
		//grab the index of the data point and update the label
		d3.select(this).select(".markerLabel").html(reportData(d3.values(allData[xindex]), " B"));
		d3.select(this).transition().duration(30).attr("transform", "translate(" + scale(xval) + ",-4)")
		//move the marker with the mouse or finger - these work on touch
		//the 30 msec delay keeps it from being too bouncy
		;
	}).on("dragend", function(d, i) {
		d3.select(this).transition().duration(30).attr("transform", "translate(" + scale(xval) + ",0)");
		//dtrop it back down to normal position and pin it at the last location
		//and put the style back to normal
	});
} // end dragUpdate function

} //end line marker method



/* **************************************************************************
 * Pie                                                                  *//**
 *
 * Method of MakeSVGContainer: 	Make a pie chart with percentages
 *
 * @param config				an object containing the following names:
 *
 * @param Data					array of objects {x: <val>, y: "label"}
 *								specifies the percent. Same format as for bar charts.
 *
 * @param xYPos					two-element array specifying xy position
 *								of center wrt the local coordinate system
 *
 * @param liteKey 				integers setting correspondance with other page
 * 								elements in other widgets
 *
 * NOTES: if the percentages don't add up to 100, blank space will be left
 * on the chart.  If the percentages add up to more than 100, they will be
 * rescaled so they do in the same proportions.
 **************************************************************************/
MakeSVGContainer.prototype.Pie = function(config,eventManager) { //begin area marker generator

	//make x and y scales from the axes container into variables so they can be
	//used inside functions

	var myID  = "pie" + this.id + "_";
	this.pieChart = {
		id: myID,
		eventFunc: this.pieLite
				};
	//Data is an array of real, positive values, one for each slice of pie
	this.Data = config.Data;
	var that = this;
	var liteKey = config.liteKey;
	var xYPos = config.xYPos;
	var r = this.innerHt>this.innerWid ? this.innerWid/3 : this.innerHt/3;
	//use 1/4 of smallest dimension of the axes box for a radius
	var offset = 20+r; //padding from the axes
	//My thought was to put the pie in the upper left corner of a set of axes,
	//occupying not more than half the width so that there was still room for a
	//legend.  The legend is pretty much always necessary I think.

	var sumData = 0, last = this.Data.length;

	this.Data.forEach(
			function(o) {
				sumData=sumData + Math.abs(o.x);
			});

	if(sumData<100){
	//if the sum of all the data points does not add up to 100%, then
	//append a new data point to bring the total up to 100.
	//When this is drawn, the "last" point will be detected as
	//having extended the data range, and we'll color it white (blank).
		this.Data.push({x: 100-sumData});
	}
	
	
	if(this.Data[0].x < 0){
		this.Data[0].x = - this.Data[0].x;
		//this only works if we assume that for angles, which can be 
		//negative, that there is only one in the data series.
		this.Data.reverse();	
		last = 0;
	}

	var arc = d3.svg.arc()  //this will create <path> elements for us using arc data
	        .outerRadius(r);//use one dimension of the axes box for a radius

	//make a group to hold the pie
	var pieGroup = this.group.append("g").attr("class", "pie")
	.attr("transform", "translate(" + that.xScale(xYPos[0]) + "," + that.yScale(xYPos[1]) + ")"); 			    //center it on supplied xy position

	pieGroup.append("circle")
	//draw a gray circle defining 100% of pie, for case where it's not 
	//all filled
		.attr("cx",0).attr("cy",0).attr("r",r)
		.style("stroke","#ddd").style("stroke-width",1);
		
	var pieArcs = d3.layout.pie()           
	//pie function creates arc data for us given a list of values
	        .value(function(d) { return d.x; })
			.sort(null);
	//null sort maintains order of input - critical for single value angles

	var arcs = pieGroup.selectAll("g.slice") 
	        .data(pieArcs(this.Data));           
	//associate the generated pie data (an array of arcs w/startAngle, endAngle and value props)
	arcs.enter()
	    .append("g")
	    .attr("class", function(d, i) {
				return "slice fill" + ((i==last) ? "White" : i);
			});    //color with predefined sequential colors

	arcs.append("path")
	   .attr("d", arc);      //this creates the path using the associated data (pie) with the arc drawing function

	if (liteKey) {
		arcs.attr("id", function(d, i) {
			return this.pieChart.id + liteKey[i];
		}).attr("class","liteable");
	} //name it if it's got an associative key
} //end pie chart object generator function

/* MakeAxes.prototype.pieLite = function(liteKey) {
	if (this.markers) {
		//TODO - test and clean this up
		//turn off any previous highlights (clear old state)
		d3.selectAll(".areaMarker").transition().duration(200).style("fill-opacity","");
		//emphasize the selected marker
		d3.select("#" + this.id + liteKey)
		.transition().duration(200).style("fill-opacity","5");
		return liteKey;
	} else {
		console.log("Invalid key. No image " + liteKey);
	}
};

*/


/* **************************************************************************
 * LineGraph                                                            *//**
 *
 * Method of MakeSVGContainer: 	Create a line or scatter plot (or both) for
 *								one or more series of x-y data
 *
 * @param config				an object containing the following names:
 *
 * @param Data					array of arrays of objects with keys x: and y:
 *								real floating pt, one for each point, one
 *								array for each trace.
 *
 * @param type					string specifying "lines", "points", or
 *								"lines+points" for traces.
 * TODO: need to add custom symbols or images for scatter plots
 *
 * @param liteKey 				array of integers setting correspondance with
 * 								other page elements in other widgets
 *
 * NOTES: TODO willneed to make it possible to highlight lines/points to go
 * along with legend (for ADA and pedagogy) and make the data updateable/redraw
 * in response to other changes.  So both emits and accepts events.
 **************************************************************************/
MakeSVGContainer.prototype.LineGraph = function(config,eventManager) {
//begin line graph object generator


	this.Data = config.Data;
	this.type = config.type;
	this.eventManager = eventManager;

	var liteKey = config.liteKey;
	var myID = "lines" + this.id + "_";
	var that = this;
	//to accomodate recall of the function to update data, check if a group of
	//myID already exists.  If it doesn't, make a group to hold new line graph
	//if it does, use it.

	if(d3.select("#"+myID)[0][0]==null){
		var graph = this.group.append("g")
		.attr("id", myID);//name it so it can be manipulated or highlighted later
		console.log("graph group is made:", graph.attr("id"));
	}
	else {
		var graph = d3.select("#"+this.id);
		console.log("graph group is found: ", graph.attr("id"));
	}


	// make a clippath, which is used in the case that we zoom or pan the graph dynamically
	graph.append("defs").append("clipPath").attr("id", "clip_" + myID)
	.append("rect").attr("width", that.innerWid)
	.attr("height", that.innerHt);

	//draw the trace(s).  We have go generate the path data, then create the groups
	//for them (this will be the sticking point on redraw), then fill them with either
	//lines or points or both for the data.

	if (this.type == "lines" || this.type == "lines+points") {
		var line = d3.svg.line()
	//line() is a d3 utility function for generating all the point to point
	//paths using the scales set up above
		.interpolate("basis").x(function(d, i) {
			return that.xScale(d.x);
		}).y(function(d, i) {
			return that.yScale(d.y);
		});

		this.traces = graph.selectAll("g.traces")
		.data(this.Data)
		.enter().append("g").attr("class", "traces");

	//associate the clip path so data doesn't slop over the axes
		this.traces.append("path").attr("clip-path", "url(#clip_" + this.id + ")")
	//use the line function defined above to set the path data
		.attr("d", function(d, i) {
			return line(d);
		})
	//pick the colors sequentially off the list, both trace and stroke<i>
	//are defined in the css file
		.attr("class", function(d, i) {
			return "trace stroke" + i;
		});
	//Highlighting the sequence of traces means that we need a key to associate
	//them with other page elements.  This can be a one-to-one or one-to-many or
	//many-to-one relationship.  So if a liteKey is specified to make the association
	//write it out in an ID.  TODO: reconcile this with the overall new event model
		if (liteKey) {
			this.traces.attr("class", "traces liteable").attr("id", function(d, i) {
				return myID + liteKey[i];
			});
		}

	}//end the logic for drawing lines


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
			return "translate(" + that.xScale(d.x) + "," + that.yScale(d.y) + ")";
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

/* **************************************************************************
 * BarChart                                                             *//**
 *
 * Method of MakeSVGContainer: 	Create a bar chart, pyramid chart (two sided)
 *								or grouped bar chart (several bars on the same
 *								label from different series - multivariate)
 *
 * @param config				an object containing the following names:
 *
 * @param Data					array of arrays of objects with keys x: and y:
 *								real floating pt, one for each point, one
 *								array for each trace.
 *
 * @param type					string specifying "grouped", or anything else (ignored)
 *
 * @param liteKey 				array of integers setting correspondance with
 * 								other page elements in other widgets
 *
 * NOTES: There's a lot of logic in here to make sure that both positive and
 * negative values are accomodated.  Negative values have to count right to x=0
 * and positive must always count right from x=0.
 **************************************************************************/

MakeSVGContainer.prototype.BarChart = function (config,eventManager)
{ //begin bar graph object generator

	//Data: array of arrays of objects with keys x: and y: , real floating pt, one for each point,
	//one array for each trace.
	this.Data = config.Data;
	//type is a string setting whether it's a "grouped" chart or linear, optional
	var type = config.type;
	//highlitekey is an array of integers relating the traces to other selectable things on the page, optional
	var liteKey = config.liteKey;
	var myID = "bars" + this.id + "_";
	var that = this;

	console.log("ID", "#"+myID, d3.select("#"+myID)[0][0]);

	if (d3.select("#"+myID)[0][0] === null)
	{
		var graph = this.group.append("g") //make a group to hold new bar chart
		.attr("id", myID);//name it so it can be manipulated or highlighted later
		console.log("graph group is made:", graph.attr("id"));
	}
	else
	{
		var graph = d3.select("#"+this.id);
		console.log("graph group is found: ", graph.attr("id"));	1
	}

	var bandsize = that.yScale.rangeBand();
	//returns the size of the bands produced by ordinal scale


	if (type == "grouped")
	{
		//grouped bar charts find the common labels in each data set and draw non-overlapping
		//bars in a group representing the value for that label for each data array.
		//The effect of the following code is to calculate a "subspacing" that fans
		//the individual bars in each group out around the central point for the data
		//label.
		var indices = [];

		for (i = 0; i < this.Data.length; i++)
		{
			indices.push(i); //needed to space out grouped barcharts
		}

		var groupScale = d3.scale.ordinal()
			.domain(indices) //creates an extra ordinal set that encloses the data label,
			//one for each group (element in data array)
			.rangeRoundBands([bandsize, 0]);
		console.log("Grouped barChart last bar mapped to 0 offset: ",
			groupScale(this.Data.length - 1) == 0);
	};

	// bind all the series data to a group element w/ a series class
	// creating or removing group elements so that each series has its own group.
	this.barSeries = graph.selectAll("g.series")
		.data(that.Data);

	this.barSeries.enter()
		.append("g")
			.attr("class", function(d, i) {
					return "series fill" + i;
				});

	this.barSeries.exit().remove();

	//If it's a grouped barchart, shimmie out the bars by group
	if (type == "grouped")
	{
		this.barSeries.attr("transform", function(d, i) {
				return "translate(0," + (groupScale(i)) + ")";
			});
	}
	//If it's highliteable, add a key to the series
	if (liteKey)
	{
		series.attr("id", function(d, i) {
				return "series_" + (liteKey[i]);
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
	var bars = this.barSeries.selectAll("g.bar")
		.data(function(d) {return d;}); 	//drill down into the nested Data

	bars.exit().remove();

	bars.enter()
		.append("g")
			.attr("id", function(d, i) {return myID + i;})
			.attr("class", "bar liteable")
			.attr("transform",
				  function(d)
				  {
					  // move each group to the x=0 position horizontally if it's a
					  // positive bar, or start at it's negative x value if it's reversed.
				      var x = (d.x < 0) ? that.xScale(d.x) : that.xScale(0);
					  var y = that.yScale(d.y);
				      return "translate(" + x + "," + y + ")";
				  })
			.append("rect")
			;

	// Update the height and width of the bar rects based on the data points bound above.
	bars.select("rect")
		.attr("height", (type == "grouped") ? (bandsize / (this.Data.length + 1)) : bandsize)
		//divide height into uniform bar widths
		.attr("width",
			  function(d)
			  {
				  return (d.x < 0) ? that.xScale(0) - that.xScale(d.x)
								   : that.xScale(d.x) - that.xScale(0);
			  });
}; //end bar chart object generator function


/* **************************************************************************
 * ScalableImage                                                        *//**
 *
 * Method of MakeSVGContainer: 	Create a single scalable image or a carousel
 *								if there are multiple images
 *
 * @param config				an object containing the following names:
 *
 * @param images				array of objects with keys URI: and caption:
 *								both strings giving location and description.
 *
 * @param liteKey 				array of integers setting correspondance with
 * 								other page elements in other widgets
 *
 * NOTES: this will resize the whole SVG box taller if there is a carousel so that 
 * the image retains it's specified size but thumbnails can be created that 
 * evenly distribute across the top of the available width.
 **************************************************************************/

MakeSVGContainer.prototype.ScalableImage = function (config,eventManager)
	{ //begin scalable image object generator

	//images is an array of objects with keys URI: string with the location of the image file
	//jpg, png, svg supported, and caption: string with caption or source text.
	this.images = config.images;
	var numImg = this.images.length;
	var myID = "img" + this.id + "_";
	var that = this;

	var graph = this.group.append("g") //make a group to hold new line chart
	.attr("class", "scalableImage");
	graph.append("rect").attr("width",this.innerWid).attr("height",this.innerHt).attr("fill","#efefef");

	graph.append("image").attr("xlink:href", this.images[0].URI)
	.attr("id", this.id) //name it so it can be manipulated or highlighted later
	.attr("width", this.innerWid).attr("height", this.innerHt)
	.append("desc").text(this.images[0].caption);

	console.log("Target for caption exists: ",	this.xaxis.select(".axisLabel"));

	this.xaxis.select(".axisLabel").html(this.images[0].caption);
	console.log("image group is made:", d3.select("#" + this.id).attr("id"),
	 ", number of images in container is ", numImg);

	if (numImg > 1) {
		//if there are multiple images, calculate dimensions for thumbnails, and make the
		//svg box bigger to display them in a new group at the top.
		var thumbScale = 0.85 / (numImg + 2);
		this.xThumbDim = d3.round(this.innerWid * thumbScale), this.yThumbDim =
			d3.round(this.innerHt * thumbScale);
		var maxWid = this.maxWid;
		var maxHt = this.maxHt;
		this.margin.top = this.margin.top + this.yThumbDim;

		this.group.append("g").attr("class", "thumbs")
		.attr("id","thumbs"+this.id)
		.selectAll("image.thumbs").data(this.images).enter()
		.append("g").attr("id", function(d, i) { return (myID + i);})
		.attr("class", "liteable thumbs")
		.attr("transform", function(d, i) {
			return "translate(" + (d3.round((i + 1) * that.innerWid / (numImg + 2))
				+ that.margin.left)
			+ "," + 5 + ")";})
		.append("image").attr("xlink:href", function(d) {
			return d.URI;
		})
		.attr("width", this.xThumbDim).attr("height", this.yThumbDim)
		.append("desc").text(function(d) {
			return d.caption;
		});
		//required - we should never have an image inserted without a description for ARIA
		//then move the main image down to make room for the thumbnails
		that.group.attr("transform", "translate(" + that.margin.left + "," + that.margin.top + ")");
		that.rootEl.attr("viewBox", "0 0 " + that.maxWid + " " + (that.maxHt + this.yThumbDim)).style("max-height", (maxHt + this.yThumbDim) + "px");
	}

} //end MakeScalableImage object generator function

/*MakeScalableImage.prototype.setState = function(liteKey) {
	if (this.images[liteKey]) {
		//load the right image and caption into the main image frame
		d3.select("#" + this.id).attr("xlink:href", this.images[liteKey].URI);
		this.captionCont.select(".axisLabel").html(this.images[liteKey].caption);

		//turn off any previous highlights (clear old state)
		d3.selectAll("#thumbs"+this.id).selectAll("rect").transition().duration(200).remove();
		//draw a highlight around the thumbnail
		d3.select("#" + this.id + liteKey)
		.append("rect")
		.attr("width", this.xThumbDim).attr("height", this.yThumbDim)
		.attr("class", "lit");
		return liteKey;
	} else {
		console.log("Invalid key. No image " + liteKey);
	}
};
*/

/*
MakeLabels.prototype.setState = function(liteKey) {
	if (this.labels[liteKey]) {
		//return all styles to normal on the labels
		var unset = d3.select("#" + this.id).selectAll(".markerLabel");
		console.log("Unsetting label lites: ", unset);
		unset.transition().duration(200)
		.style("color","")
		.style("font-weight","")
		.style("background-color","")
	;

		//highlight the selected label(s)
		var set = d3.selectAll("#" + this.id + liteKey).select(".markerLabel");
		console.log("Setting label lites", set);
		set.transition().duration(200).style("color", "#1d456e")
		.style("font-weight", "600")
		.style("background-color", "#e3effe");
		return liteKey;
	} else {
		console.log("Invalid key. No image " + liteKey);
	}
};

*/


function MakeLinks(options) { //begin labeled image object generator
	var liteKey = options.liteKey;
	this.liteLinks = d3.selectAll("a.liteable");

	this.liteLinks
		.attr("id", function(d, i) {
			return "link_" + (liteKey?liteKey[i]:i);})
	; //add an id to the link that lets it drive the page-wide events

} //end MakeLinks object generator function
MakeLinks.prototype.setState = function(liteKey) {
	if (this.liteLinks[liteKey]) {
		//return all styles to normal on the link
		this.liteLinks.attr("class","liteable");

		this.liteLinks[liteKey].attr("class", "liteable lit");

		return liteKey;
	} else {
		console.log("Invalid key. No link " + liteKey);
	}
};


/* ===================================================
Events
===================================================*/

function stateCycle(currentObj, linkedObjList) {
	//IDlist is an array of strings representing ID names for
	//objects on which to set or synch state
	//this version assumes that each state function clears it's own stale state
	var regID = currentObj.id;
	//if the selected current region doesn't have an _ordinal in it's ID, then bail
	if (!regID || (regID.search("_") == -1)) {
		console.log(regID, " is not an ordered ID or ID not found");
		return;
	}

	//then strip off the relational index of the selected region
	var liteKey = regID.substr(regID.indexOf("_") + 1, regID.length);

	// call the state restoration function for each ID in the list according
	// to the currently selected key.
	linkedObjList.forEach(function(o) {

		if (!d3.selectAll("#" + o.id + liteKey)) {
			console.log("id ", o.id + liteKey, " not found.");
		} else {
			console.log("object found in IDList: ", "#" + o.id + liteKey, d3.selectAll("#" + o.id + liteKey));
		//	o.eventFunc(liteKey);
			o.setState(liteKey);
		}
	})
} //end stateCycle



/* **************************************************************************
 * Utility Functions
 ****************************************************************************/


/* **************************************************************************
 * logFormat                                                            *//**
 *
 * @method
 *
 * The logFormat method is used to limit the number of ticks produced on
 * a log-scale axis, so it doesn't get too crowded.  It's currently hard
 * set to produce only even-numbered full-decade marks, which will probably
 * need to be adjusted as requirements become clearer.
 *
 * *************************************************************************/

function logFormat(d) {

	//find the log base 10 (plus a little for zero padding)

    var x = (Math.log(d) / Math.log(10)) + 1e-6;

    //then see if the log has abscissa 1, and only return numbers for those, and even
    return (Math.abs(x - Math.floor(x)) < .1)&&(Math.floor(x)%2==0) ?
		     d3.round(Math.log(d)/Math.log(10)) : "";
  }

// Unit Tests for logFormat
console.log("logFormat 10^-2 produces negative decade tick label -2", logFormat(Math.pow(10,-2))==-2);
console.log("logFormat 2*10^-3 produces no tick label", logFormat(2*Math.pow(10,-3))=="");
console.log("logFormat 10^3 produces no odd decade tick label", logFormat(Math.pow(10,3))=="");


/* **************************************************************************
 * compareLen                                                            *//**
 *
 * @method
 *
 * The compareLen method compares the length of two strings or arrays.
 * It is used in constructors such as Legend to determine the maximum
 * label length, which is then used to determine the size of the surrounding
 * margins and rules.
 *
 ****************************************************************************/

function compareLen(a, b) {
	return a.length - b.length;
}
console.log("compare string a to string b equal lengths ", compareLen("a","b")===0);
console.log("compare string a to string bbbb equal lengths ", compareLen("a","bbbb")===-3);


function slope(data) { //begin slope function
	var pt1 = d3.values(data[0]);
	var pt2 = d3.values(data[1]);
	var dx = pt1[0] - pt2[0],
		dy = pt1[1] - pt2[1];
	return [dx, dy, dy / dx];
} //end slope function
var myData = [{
	x: 0,
	y: 0
}, {
	x: 1,
	y: 1
}];
console.log("test slope line 1 dx, dy, slope: ", slope(myData), slope(myData) === [-1, -1, 1]);

function snapTo(data, range) {
	//range is a two element array with the start and end point of the canvas
	//data is an array of any length with the data points/bins to snap to.
	//really on the cardinality of (number of points) data matters
	return d3.scale.quantize().domain(range) //dimension of the graph box
	.range(data); //converted into the nearest data to snap to data
}

console.log("Snap 50 to center of [0,5,10,15,20] with range [0,100]:", snapTo([0, 5, 10, 15, 20], [0, 100])(50)==10);
console.log("Snap 0 to 0 with [0,5,10,15,20] with range [0,100]:", snapTo([0, 5, 10, 15, 20], [0, 100])(0)==0);

function getClosest(a, x) {
	var lo, hi;
	for (var i = a.length; i--;) {
		if (a[i] <= x && (lo === undefined || lo < a[i])) lo = a[i];
		if (a[i] >= x && (hi === undefined || hi > a[i])) hi = a[i];
	};
	return [lo, hi];
}
