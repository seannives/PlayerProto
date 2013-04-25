/* ===================================================
 * assessment.js v0.0.1
 * 
 * ===================================================
 * Second prototype version of assessment routines for eCourses
 * written by L. Bondaryk and M. Lippert March. 2013
 * ========================================================== */

/* ============================================
 * Utilities
 *
 *=============================================*/

function measure(container) {
	if (!container) return {
		height: 0,
		width: 0
	};


	//container.append('text').attr({x: -1000, y: -1000}).text(text);
	var bbox = container.node().getBBox();
	//container.remove();
	return {
		height: bbox.height,
		width: bbox.width
	};
}

function logFormat(d) {
    var x = (Math.log(d) / Math.log(10)) + 1e-6; //find the log base 10 (plus a little for zero padding)
    //then see if the log has abscissa 1, and only return numbers for those, and even
    return (Math.abs(x - Math.floor(x)) < .1)&&(Math.floor(x)%2==0) ? d3.round(Math.log(d)/Math.log(10)) : "";
  }

console.log("logFormat 10^-2 produces negative decade tick label -2", logFormat(Math.pow(10,-2))==-2);
console.log("logFormat 2*10^-3 produces no tick label", logFormat(2*Math.pow(10,-3))=="");
console.log("logFormat 10^3 produces no odd decade tick label", logFormat(Math.pow(10,3))=="");


function compareLen(a, b) {
	return a.length - b.length;
}
console.log("compare string a to string b equal lengths ", compareLen("a","b")===0);
console.log("compare string a to string bbbb equal lengths ", compareLen("a","bbbb")===-3);

/* ============================================
 * containers
 *
 *=============================================*/
 
function MakeAxes(svgCont, config) {
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

MakeAxes.prototype.Legend = function (config) { //begin legend method to go with axes object
	var myID = "legend" + this.id + "_";
	this.legend = {id: myID};
	//I define this local var because there are difficulties using
	//this.id inside data functions from d3,the scope changes, so I need the local name
	//x and yPos are strings, and required: they state left/right/top/bottom
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

MakeAxes.prototype.Labels = function(config) { //begin labeled image object generator
	
	//labels: is an array of objects with keys content: string with HTML markup
	//xyPos: an [x,y] array to orient the position on the axes grid, in local coordinates
	//width: the width of the label
	//and TODO role: a string which is one of "label", "distractor".
	//TODO: we need some sort of autowidth intelligence on these, but I don't
	//know how to reconcile that with giving user control over wrapping
	
	var myID  = "label" + this.id + "_";
	this.labels = {id: myID,
				  labels: config.labels,
				  eventFunc: this.setLabelLite,
				  type: config.type
				};
	var numLabels = this.labels.labels.length;
	var liteKey = config.liteKey;
	var xScale = this.xScale, yScale = this.yScale;

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
		.data(this.labels.labels).enter()
		.append("g")
		.attr("transform", function(d, i) {
			return "translate(" + xScale(d.xyPos[0]) + "," + yScale(d.xyPos[1]) + ")";
		});
	
	this.labelCollection.append("foreignObject")
		.attr("x", 0)
		.attr("y", 0)
		.attr("width", function(d,i) { return d.width;})
		.attr("height", 200)
		.append("xhtml:body").style("margin", "0px") 
			//this interior body shouldn't inherit margins from page body
		.append("div").attr("class", "markerLabel")
		//.style("visibility",function(d,i) { return d.viz;})
		//I punted on the show/hide thing, but it could come back
			.html(function(d, i) {
				return d.content;
				}
				); //make the label 
				
	if(this.labels.type == "bullets"){			
		this.labelCollection.append("circle")
		.attr("cx",0).attr("cy",0).attr("r",10)
		.attr("class",function(d, i) {
				return "fill"+i;
				});
	}
				
		if (liteKey) {
			this.labelCollection.attr("id", function(d, i) {
				return myID + liteKey[i];
			})
			//name it so it can be manipulated or highlighted later
			.attr("class", "liteable");
		}
} //end MakeLabels object generator function

MakeAxes.prototype.setLabelLite = function(liteKey) {
	if (this.labelCollection.selectAll(".liteable")) {
		console.log("TODO: Log highlight event on ", this.labels.id);
		//return all styles to normal on the labels
		var unset = d3.select("#" + this.labels.id).selectAll(".markerLabel");
		unset.transition().duration(200)
		.attr("filter", null)
		.style("color",null)
		.style("font-weight",null)
	//	.style("background-color","")
	;
		
		//highlight the selected label(s)
		//d3.selectAll("#" + this.labels.id + liteKey).attr("filter", "url(#drop-shadow)");
		//this won't render - browser bug
		var set = d3.selectAll("#" + this.labels.id + liteKey).select(".markerLabel");
		console.log("Setting label lites", set);
		set.transition().duration(200)
		.style("color", "#1d95ae")
		.style("font-weight", "600");
	
	//	.style("background-color", "#e3effe");
	// this renders badly from Chrome refresh bug
		return liteKey;
	} else {
		console.log("Invalid key. No image " + liteKey);
	}
};

MakeAxes.prototype.AreaMarkers = function(config) { //begin area marker generator
	
	//make x and y scales from the axes container into variables so they can be 
	//used inside functions
	var xScale = this.xScale;
	var yScale = this.yScale;
	var myID  = "areaMark" + this.id + "_";
	this.areaMarkers = {
		id: myID,
		eventFunc: this.setMarkerLite
				};
	//x and y bands are arrays of  of 2-element arrays of reals
	// they determine the leading and trailing edges of the 
	//area marker rectangles, and the orientation (vertical if x, horiz if y)
	this.xBands = config.xBands;
	this.yBands = config.yBands;

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

MakeAxes.prototype.markerHighLite = function(liteKey) {
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

MakeAxes.prototype.Pie = function(config) { //begin area marker generator
	
	//make x and y scales from the axes container into variables so they can be 
	//used inside functions
	var xScale = this.xScale;
	var yScale = this.yScale;
	var myID  = "pie" + this.id + "_";
	this.pieChart = {
		id: myID,
		eventFunc: this.pieLite
				};
	//Data is an array of real, positive values, one for each slice of pie
	this.Data = config.Data;
	var liteKey = config.liteKey;
	var r = this.innerHt/3;//use one dimension of the axes box for a radius
	
	var arc = d3.svg.arc()              //this will create <path> elements for us using arc data
	        .outerRadius(r);//use one dimension of the axes box for a radius
	
	//make a group to hold the pie 
	var pieGroup = this.group.append("g").attr("class", "pie")
	.attr("transform", "translate(" + this.innerWid/2 + "," + this.innerHt/2 + ")"); //center it

	var pieArcs = d3.layout.pie()           //this will create arc data for us given a list of values
	        .value(function(d) { return d; });    

	var arcs = pieGroup.selectAll("g.slice")     
	        .data(pieArcs(this.Data))                     
	//associate the generated pie data (an array of arcs w/startAngle, endAngle and value props) 
	        .enter()                            
	        .append("g")       
	        .attr("class", function(d, i) {
				return "fill" + i;
			});    //color with predefined sequential colors

	arcs.append("path")
	   .attr("d", arc);      //this creates the path using the associated data (pie) with the arc drawing function

	if (liteKey) {
		arcs.attr("id", function(d, i) {
			return this.pieChart.id + liteKey[i];
		}).attr("class","liteable");
	} //name it if it's got an associative key
} //end pie chart object generator function

MakeAxes.prototype.pieLite = function(liteKey) {
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


MakeAxes.prototype.LineGraph = function(config,eventManager) { 
//begin line graph object generator 

	//Data: array of arrays of objects with keys x: and y: , real floating pt, one for each point, 
	//one array for each trace.
	this.Data = config.Data;
	//renderType is a string specifying "lines","points", or "lines+points" for line, scatter, or interpolated plots TODO supply images as point glyphs
	this.type = config.type;
	//highlitekey is an array of integers relating the traces to other selectable things on the page, optional
	var liteKey = config.liteKey;
	var myID = "lines" + this.id + "_";

	if(d3.select("#"+myID)[0][0]==null){
		var graph = this.group.append("g") //make a group to hold new bar chart
		.attr("id", myID);//name it so it can be manipulated or highlighted later
		console.log("graph group is made:", graph.attr("id"));
	}
	else {
		var graph = d3.select("#"+this.id); 
		console.log("graph group is found: ", graph.attr("id"));	
	}
	
	var that = this;

	// make a clippath, which is used in the case that we zoom or pan the graph dynamically
	graph.append("defs").append("clipPath").attr("id", "clip_" + myID)
	.append("rect").attr("width", that.innerWid)
	.attr("height", that.innerHt);

	//draw the trace(s)
	if (this.type == "lines" || this.type == "lines+points") {
		var line = d3.svg.line()
		//d3 utility function for generating all the point to point paths using the scales set up above
		.interpolate("basis").x(function(d, i) {
			return that.xScale(d.x);
		}).y(function(d, i) {
			return that.yScale(d.y);
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
				return myID + liteKey[i];
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


MakeAxes.prototype.BarChart = function (config,eventManager) { //begin bar graph object generator
	 
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

	if(d3.select("#"+myID)[0][0] === null){
		var graph = this.group.append("g") //make a group to hold new bar chart
		.attr("id", myID);//name it so it can be manipulated or highlighted later
		console.log("graph group is made:", graph.attr("id"));
	}
	else {
		var graph = d3.select("#"+this.id); 
		console.log("graph group is found: ", graph.attr("id"));	
	}
	
	var bandsize = that.yScale.rangeBand(); 
	//returns the size of the bands produced by ordinal scale
	
	
	if (type == "grouped") {
		//grouped bar charts find the common labels in each data set and draw non-overlapping
		//bars in a group representing the value for that label for each data array.
		//The effect of the following code is to calculate a "subspacing" that fans
		//the individual bars in each group out around the central point for the data
		//label.
		var indices = [];

		for (i = 0; i < this.Data.length; i++) {
		indices.push(i); //needed to space out grouped barcharts
		}
	
		var groupScale = d3.scale.ordinal()
		.domain(indices) //creates an extra ordinal set that encloses the data label, 
		//one for each group (element in data array)
		.rangeRoundBands([bandsize, 0]);
		console.log("Grouped barChart last bar mapped to 0 offset: ", 
		groupScale(this.Data.length - 1) == 0);
	};


	this.barSeries = graph.selectAll("g.series")
	.data(that.Data);
	
	this.barSeries.enter()
	.append("g")
	.attr("class", function(d, i) {
		return "series fill" + i;
	});
	
	this.barSeries.exit().remove();
	//If it's a grouped barchart, shimmie out the bars by group
	if (type == "grouped") {
		this.barSeries.attr("transform", function(d, i) {
			return "translate(0," + (groupScale(i)) + ")";
		})
	}
	//If it's highliteable, add a key to the series
	if (liteKey) {
		series.attr("id", function(d, i) {
			return "series_" + (liteKey[i]);
		})
	}


	this.bars = this.barSeries.selectAll("rect.bar") 
	//this selects all <g> elements with class bar (there aren't any yet)
	.data(function(d,i){return d;}); 	//drill down into the nested Data
	this.bars.enter() 		//this will create <g> elements for every data element 
	.append("rect") 	//create groups
	.attr("class", "bar");
	//move each group to the x=0 position horizontally if it's a positive bar, or 
	// start at it's negative x value if it's reversed. 
	this.bars.attr("transform", function(d, i) {
		return "translate(" + ((d.x < 0) ? that.xScale(d.x) : that.xScale(0)) + "," 
			+ (that.yScale(d.y)) + ")";
	})
	//the x<0 logic allows us to draw pyramid charts, although normally bar charts 
	//are bin counts and all positive
	//move the group to the y=ordinal position vertically
	//I enclose the bars in individual groups so you could choose to label the ends with data or label
	//and have it stick to the bar by putting it in the same group
	.attr("id", function(d, i) {
		return myID + i;
	})
	.attr("height", (this.type == "grouped") ? (bandsize / (this.Data.length + 1)) : bandsize) 
	//divide height into uniform bar widths
	.attr("width", function(d, i) {
		return ((d.x < 0) ? (that.xScale(0) - that.xScale(d.x)) : 
			(that.xScale(d.x) - that.xScale(0)));
	}); 
	//returns the value of the data associated with each slice as the width, 
	//or expands to the y=0 line if it's negative
	 this.bars.exit().remove();
} //end bar chart object generator function


function MakeLineGraph(axesCont, config) { //begin line graph object generator to go with widget containers
	//inherit the width, height and margins from the axes container
	this.xDim = axesCont.innerWid;
	this.yDim = axesCont.innerHt;
	//Data: array of arrays of objects with keys x: and y: , real floating pt, one for each point, 
	//one array for each trace.
	this.Data = config.Data;
	//renderType is a string specifying "lines","points", or "lines+points" for line, scatter, or interpolated plots TODO supply images as point glyphs
	this.type = config.type;
	//highlitekey is an array of integers relating the traces to other selectable things on the page, optional
	var liteKey = config.liteKey;
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

MakeLineGraph.prototype.setState = function(liteKey) {
	if (this.traces[liteKey]) {
		//put all lines back to normal width (clear old state)
		d3.selectAll("#"+this.id).transition().duration(100).style("stroke-width",2);
		//emphasize the line selected
		d3.select("#" + this.id + liteKey)
		.style("stroke-width",4);
		return liteKey;
	} else {
		console.log("Invalid key. No trace " + liteKey);
	}
};


function MakeBarGraph(axesCont, config) { //begin bar graph object generator
	//inherit the width, height and margins from the axes container
	this.xDim = axesCont.innerWid;
	this.yDim = axesCont.innerHt;
	//Data: array of arrays of objects with keys x: and y: , real floating pt, one for each point, 
	//one array for each trace.
	this.Data = config.Data;
	//type is a string setting whether it's a "grouped" chart or linear, optional
	this.type = config.type;
	//highlitekey is an array of integers relating the traces to other selectable things on the page, optional
	var liteKey = config.liteKey;
	this.id = "bars" + axesCont.id + "_";
	var prefix = this.id;

	var graph = axesCont.group.append("g") //make a group to hold new line chart
	.attr("id", this.id) //name it so it can be manipulated or highlighted later
	;
	console.log("graph group is made:", graph.attr("id"));
	//inherit the x and y scales from the axes container
	this.xScale = axesCont.xScale;
	this.yScale = axesCont.yScale;
	
	var bandsize = this.yScale.rangeBand(); //returns the size of the bands produced by ordinal scale
	var indices = [];

	for (i = 0; i < this.Data.length; i++) {
		indices.push(i); //needed to space out grouped barcharts
	}
	
	if (this.type == "grouped") {
		var groupScale = d3.scale.ordinal()
		.domain(indices) //creates an extra ordinal set that encloses the data label, one set for each label
		.rangeRoundBands([bandsize, 0]);
		console.log("Grouped barChart last bar mapped to 0 offset: ", groupScale(this.Data.length - 1) == 0);
	};


	this.barSeries = graph.selectAll("g.series")
	.data(this.Data);
	this.barSeries.exit().remove();
	this.barSeries.enter()
	.append("g")
	.attr("class", function(d, i) {
		return "series liteable fill" + i;
	});
	//If it's a grouped barchart, shimmie out the bars by group
	if (this.type == "grouped") {
		this.barSeries.attr("transform", function(d, i) {
			return "translate(0," + (groupScale(i)) + ")";
		})
	}
	//If it's highliteable, add a key to the series
	if (liteKey) {
		series.attr("id", function(d, i) {
			return "series_" + (liteKey[i]);
		})
	}


	this.bars = this.barSeries.selectAll("g.bar") //this selects all <g> elements with class bar (there aren't any yet)
	.data(Object) //drill down into the nested Data
	.enter() //this will create <g> elements for every data element 
	.append("g") //create groups
	.attr("class", "liteable")
	//move each group to the x=0 position horizontally if it's a positive bar, or 
	// start at it's negative x value if it's reversed. 
	.attr("transform", function(d, i) {
		return "translate(" + ((d.x < 0) ? axesCont.xScale(d.x) : axesCont.xScale(0)) + "," 
			+ (axesCont.yScale(d.y)) + ")";
	})

	//the x<0 logic allows us to draw pyramid charts, although normally bar charts 
	//are bin counts and all positive
	//move the group to the y=ordinal position vertically
	//I enclose the bars in individual groups so you could choose to label the ends with data or label
	//and have it stick to the bar by putting it in the same group
	.attr("id", function(d, i, j) {
		return prefix + "_" + i;
	}); //name it for the region to highlight
	this.bars.append("rect") //make the bars
	.attr("height", (this.type == "grouped") ? (bandsize / (this.Data.length + 1)) : bandsize) 
	//divide height into uniform bar widths
	.attr("width", function(d, i) {
		return ((d.x < 0) ? (axesCont.xScale(0) - axesCont.xScale(d.x)) : 
			(axesCont.xScale(d.x) - axesCont.xScale(0)));
	}); //returns the value of the data associated with each slice as the width, 
	//or expands to the y=0 line if it's negative
} //end bar chart object generator function


function MakeAreaMarkers(axesCont,config) { //begin area marker generator
	//inherit the width, height and margins from the axes container
	this.xDim = axesCont.innerWid;
	this.yDim = axesCont.innerHt;
	//inherit the x and y scales from the axes container
	var xScale = axesCont.xScale;
	var yScale = axesCont.yScale;
	//Data: array of arrays of objects with keys x: and y: , real floating pt, one for each point, 
	//one array for each trace.
	this.Data = axesCont.Data;
	
	//x and y bands determine the leading and trailing edges of the 
	//area rectangles, and the orientation (vertical if x, horiz if y)
	//bands are specified as an array of 2-element arrays
	this.xBands = config.xBands;
	//maxWid and maxHt are the width and height, respectively, integers
	//margin is an associative array of top, bottom, left, right integers
	this.yBands = config.yBands;

	var liteKey = config.liteKey;
	//make a group to hold the area markers  
	var bandMarks = axesCont.group.append("g").attr("class", "areaMarker");

	//these tests pull the sets of markers for each band and then report whether the bands are all in the shown range of the graph which calls them
	if (this.xBands) {
		bandMarks.selectAll("rect")
		.data(this.xBands).enter()
		.append("rect").attr("x", function(d) {return xScale(d[0]); })
		.attr("y", 0)
		.attr("width", function(d) {return Math.abs(xScale(d[1]) - xScale(d[0]));})
		.attr("height", this.yDim)
	//	.attr("class", function(d,i){ return "fill"+i;})
		;
		
	
	}

	if (this.yBands) {
		this.yBands.forEach(function(o) {
			console.log("y Band Marker" + this.yBands.indexOf(o), o[0] + " and " + o[1] + " in domain " + this.yScale.domain());

			bandMarks.append("rect").attr("x", 0).attr("y", this.yScale(o[0]))
			.attr("width", this.xDim)
			.attr("height", Math.abs(this.yScale(o[1]) - this.yScale(o[0])));
		});
	}

	if (liteKey) {
		bandMarks.attr("id", function(d, i) {
			return "areaMark" + target + ordinal + "_" + liteKey[i];
		})
	} //name it 
} //end area marker object generator function

MakeAreaMarkers.prototype.setState = function(liteKey) {
	if (this.images[liteKey]) {
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

//MakeScalableImage.prototype = new makeAxes();        // TODO Here's where the inheritance occurs 
//MakeScalableImage.prototype.constructor=MakeScalableImage; //this throws errors I don't understand
function MakeScalableImage(axesCont, options) { //begin labeled image object generator
	//inherit the width, height and margins from the axes container
	var xDim = axesCont.innerWid;
	var yDim = axesCont.innerHt;

	//imgages is an array of objects with keys URI: string with the location of the image file 
	//jpg, png, svg supported, and caption: string with caption or source text.
	this.images = options.images;
	var numImg = this.images.length;
	this.id = "img" + axesCont.id + "_";
	var thumbid = this.id;
	this.captionCont = axesCont.xaxis;

	var graph = axesCont.group.append("g") //make a group to hold new line chart
	.attr("class", "scalableImage");
	graph.append("rect").attr("width",xDim).attr("height",yDim).attr("fill","#efefef");

	graph.append("image").attr("xlink:href", this.images[0].URI)
	.attr("id", this.id) //name it so it can be manipulated or highlighted later
	.attr("width", xDim).attr("height", yDim)
	.append("desc").text(this.images[0].caption);
	
	console.log("axesobj ",	axesCont.xaxis.select(".axisLabel"));

	this.captionCont.select(".axisLabel").html(this.images[0].caption);
	console.log("image group is made:", d3.select("#" + this.id).attr("id"),
	 ", number of images in container is ", numImg);

	if (numImg > 1) {
		//if there are multiple images, calculate dimensions for thumbnails, and make the 
		//svg box bigger to display them in a new group at the top.
		var thumbScale = 0.85 / (numImg + 2);
		this.xThumbDim = d3.round(xDim * thumbScale), this.yThumbDim = d3.round(yDim * thumbScale);
		var maxWid = axesCont.container.maxWid;
		var maxHt = axesCont.container.maxHt;
		axesCont.margin.top = axesCont.margin.top + this.yThumbDim;

		axesCont.container.svgObj.append("g").attr("class", "thumbs")
		.attr("id","thumbs"+this.id)
		.selectAll("image.thumbs").data(this.images).enter()
		.append("g").attr("id", function(d, i) { return (thumbid + i);})
		.attr("class", "liteable thumbs")
		.attr("transform", function(d, i) {
			return "translate(" + (d3.round((i + 1) * xDim / (numImg + 2)) + axesCont.margin.left) 
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
		axesCont.group.attr("transform", "translate(" + axesCont.margin.left + "," + axesCont.margin.top + ")");
		axesCont.container.svgObj.attr("viewBox", "0 0 " + maxWid + " " + (maxHt + this.yThumbDim)).style("max-height", (maxHt + this.yThumbDim) + "px");
	}

} //end MakeScalableImage object generator function

MakeScalableImage.prototype.setState = function(liteKey) {
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

function MakeCarousel(axesCont, options) { //begin labeled image object generator
	//inherit the width, height and margins from the axes container
	var xDim = axesCont.innerWid;
	var yDim = axesCont.innerHt;

	//images is an array of objects with keys URI: string with the location of the image file 
	//jpg, png, svg supported, and caption: string with caption or source text.
	//or a reference to another object: which should be drawn in sequence.
	this.images = options.images;
	var numImg = this.images.length;
	this.id = "img" + axesCont.id + "_";
	var thumbid = this.id;
	this.captionCont = axesCont.xaxis;

	var graph = axesCont.group.append("g") //make a group to hold new line chart
	.attr("class", "scalableImage");
	graph.append("rect").attr("width",xDim).attr("height",yDim).attr("fill","#efefef");

	if(this.images[0].URI){
		graph.append("image").attr("xlink:href", this.images[0].URI)
 		.attr("id", this.id) //name it so it can be manipulated or highlighted later
		.attr("width", xDim).attr("height", yDim)
		.append("desc").text(this.images[0].caption);
	}
	
	console.log("axesobj ",	axesCont.xaxis.select(".axisLabel"));

	this.captionCont.select(".axisLabel").html(this.images[0].caption);
	console.log("image group is made:", d3.select("#" + this.id).attr("id"),
	 ", number of images in container is ", numImg);

	if (numImg > 1) {
		//if there are multiple images, calculate dimensions for thumbnails, and make the 
		//svg box bigger to display them in a new group at the top.
		var thumbScale = 0.85 / (numImg + 2);
		this.xThumbDim = d3.round(xDim * thumbScale), this.yThumbDim = d3.round(yDim * thumbScale);
		var maxWid = axesCont.container.maxWid;
		var maxHt = axesCont.container.maxHt;
		axesCont.margin.top = axesCont.margin.top + this.yThumbDim;

		axesCont.container.svgObj.append("g").attr("class", "thumbs")
		.attr("id","thumbs"+this.id)
		.selectAll("image.thumbs").data(this.images).enter()
		.append("g").attr("id", function(d, i) { return (thumbid + i);})
		.attr("class", "liteable thumbs")
		.attr("transform", function(d, i) {
			return "translate(" + (d3.round((i + 1) * xDim / (numImg + 2)) + axesCont.margin.left) 
			+ "," + 5 + ")";})
		.append("image").attr("xlink:href", function(d) {
			return d.URI?d.URI:"img/defGraph.jpg";
		})
		.attr("width", this.xThumbDim).attr("height", this.yThumbDim)
		.append("desc").text(function(d) {
			return d.caption;
		});
		//required - we should never have an image inserted without a description for ARIA
		//then move the main image down to make room for the thumbnails
		axesCont.group.attr("transform", "translate(" + axesCont.margin.left + "," + axesCont.margin.top + ")");
		axesCont.container.svgObj.attr("viewBox", "0 0 " + maxWid + " " + (maxHt + this.yThumbDim)).style("max-height", (maxHt + this.yThumbDim) + "px");
	}

} //end MakeCarousel object generator function

MakeCarousel.prototype.setState = function(liteKey) {
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


function MakeLabels(axesCont, options) { //begin labeled image object generator
	//inherit the width, height and margins from the axes container
	//var xDim = axesCont.innerWid;
	//var yDim = axesCont.innerHt;
	var xScale = axesCont.xScale;
	var yScale = axesCont.yScale;
	
	//labels is an array of objects with keys content: string with HTML markup
	//xyPos: an [x,y] array to orient the position on the axes grid, in local coordinates
	//width: the width of the label
	//visibility: boolean saying whether it's visible at start
	//and TODO role: a string which is one of "label", "distractor".
	this.labels = options.labels;
	var numLabels = this.labels.length;
	this.id = "label" + axesCont.id + "_";
	var labelID = this.id;
	var liteKey = options.liteKey;
	 

	var graph = axesCont.group.append("g") //make a group to hold labels
	.attr("class", "labels")
	.attr("id", this.id);

	graph.selectAll("g.label")
		.data(this.labels).enter()
		.append("g").attr("id", function(d, i) { return labelID + (liteKey?liteKey[i]:i);})
		.attr("class", "liteable labels")
		.attr("transform", function(d, i) {
			return "translate(" + xScale(d.xyPos[0]) + "," + yScale(d.xyPos[1]) + ")";
		})
		.append("foreignObject")
			.attr("x", 0)
			.attr("y", 0)
			.attr("width", function(d,i) { return d.width;})
			.attr("height", 200)
			.append("xhtml:body").style("margin", "0px") 
			//this interior body shouldn't inherit margins from page body
			.append("div").attr("class", "markerLabel")
			//.style("visibility",function(d,i) { return d.viz;})
			.html(function(d, i) {
				return d.content;}); //make the label 

} //end MakeLabels object generator function
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


function MakeCallouts(axesCont, options) { //begin labeled image object generator
	//inherit the scales from the axes container
	var xScale = axesCont.xScale;
	var yScale = axesCont.yScale;
	
	//labels is an array of objects with keys content: string with HTML markup
	//xyPos: an [x,y] array to orient the position on the axes grid, in local coordinates
	//width: the width of the label
	//and TODO role: a string which is one of "label", "distractor".
	this.labels = options.labels;
	var numLabels = this.labels.length;
	this.id = "label" + axesCont.id + "_";
	var labelID = this.id;
	var liteKey = options.liteKey;
	 

	var graph = axesCont.group.append("g") //make a group to hold labels
	.attr("class", "labels")
	.attr("id", this.id);
   
	graph.selectAll("g.label")
		.data(this.labels).enter()
		.append("g").attr("id", function(d, i) { return labelID + (liteKey?liteKey[i]:i);})
		.attr("class", "liteable labels")
		.attr("transform", function(d, i) {
			return "translate(" + xScale(d.xyPos[0]) + "," + yScale(d.xyPos[1]) + ")";
		})
		.append("foreignObject")
			.attr("x", 0)
			.attr("y", 0)
			.attr("width", function(d,i) { return d.width;})
			.attr("height", 200)
			.append("xhtml:body").style("margin", "0px") 
			//this interior body shouldn't inherit margins from page body
			.append("div").attr("class", "callOut")
			.style("display","block")
			.html(function(d, i) {
				return d.content;}); //make the label 

} //end MakeCallouts object generator function
MakeCallouts.prototype.setState = function(liteKey) {
	if (this.labels[liteKey]) {
		//hide all labels
		var unset = d3.select("#" + this.id).selectAll(".callOut");
		unset.style("display","none");
		
		//make selected label(s) visible
		var set = d3.selectAll("#" + this.id + liteKey).select(".callOut");
		set.style("display","block");
				
		return liteKey;
	} else {
		console.log("Invalid key. No image " + liteKey);
	}
};

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


function MakeContainer(config) {
	this.ordinal = config.ordinal;
	//ordinal:an integer>=0 that identifies which div to write it into, since there may be several
	this.maxWid = config.maxWid;
	this.maxHt = config.maxHt;
	//maxWid, maxHt: the width and height of the graph region, without margins, integers
	this.title = config.title;
	//boolean specifying whether to put an icon and block swipes because container has interactive stuff in it
	this.interact = config.interact;
	this.containerName = "widget" + ordinal;
	//contents specifies an array of images, graphs, questions, etc. that go in the container.  
	//each element in the array is an object that calls its renderer
	this.margin = {
		top: 20,
		bottom: 20,
		left: 20,
		right: 20
	};
	//this is a default margin set that is meant to be updated by the constituent objects if they require more space
	//mostly happens with axes
	//margin: an associative array with keys for top, bottom, left and right
	//title: the title appearing above the graph - optional
	//interact: boolean saying whether contents are interactive, and should be indicated with an icon
	//select the div in the document where the graph will go
	var container = d3.select("#widgetTarget" + ordinal);
	//title it in a styled div, if it has one
	//this puts the hand icon on the upper right corner and blocks clicks from being interpreted as swipes
	if (interact) {
		container.attr("class", "inter noSwipe");
	}

	if (title) {
		container.append("div").attr("class", "graphTitle").text(title);
	}

	//container.style("max-height", maxHt+"px"); BADNESS: doing this slops the 
	//svg over the bottom of the div.
	//create an svg element of the appropriate size and scaling
	this.svgObj = container.append("svg").attr("max-height", maxHt).attr("viewBox", "0 0 " + maxWid + " " + maxHt)
	//makes it scale correctly in single-column or phone layouts
	.attr("preserveAspectRatio", "xMinYMin meet") //ditto
	//.attr("width",maxWid)
	.attr("id", containerName).style("max-width", maxWid + "px")
	//max width works to make it lay out to scale
	.style("max-height", maxHt + "px");
	//max height keeps it from forcing whitespace below 
	//in most cases, but not on Safari or Android.  This is a documented
	//webkit bug, which they claim they will fix eventually:
	//https://bugs.webkit.org/show_bug.cgi?id=82489
}

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

/* ===================================================
Functions for making various kinds of assessment, including 
numerical check, multiple choice, vocabulary check, labeling
===================================================*/

function multChoice(config) { //begin multiple choice question generator
	//target is the ordinal of the target div, created by makeGraphObj
	this.target = config.target;
	//ordinal is the integer number of the interactive within the widget region, so there can be more than one
	this.ordinal = config.ordinal;
	//maxWid and maxHt are the width and height, respectively, integers
	this.maxWid = config.maxWid;
	this.maxHt = options.maxHt;
	//margin is an associative array of top, bottom, left, right integers
	this.margin = config.margin;
	this.question = config.question;
	//options: the multiple choice responses
	this.options = config.options;
	this.hints = config.hints;

	//select the div in the document where the graph will go
	this.container = d3.select("#widget" + ordinal);

	container.append("p").attr("class", "questionText").html(question);
	var Qform = container.append("form");

	//create a table
	var table = Qform.append("table").attr("id", "multChoice" + ordinal).attr("class", "data");

	//Show the data in a table
	var tableRows = table.append("tbody").selectAll("tr").data(options).enter().append("tr")
	//creates as many rows as there are options
	.attr("class", "dataTable");

	tableRows.append("td").html("<input type='radio' name='q'>").append("td").html(function(d) {
		return d;
	});

} //end multiple choice generator function
/* -----------------------------------------------
Student feedback and scoring functions
-------------------------------------------------*/

function scoreIt(config, container, studAnswer) {

	//ansType is a string that identifies which kind of question is to be scored
	this.ansType = config.ansType;
	//answer is an object with the correct answer(s) for this item, and feedback
	//answer.content, answer.response, answer.tolerance can be defined
	this.answer = config.answer;
	//distractor is an array of objects with identifyable incorrect answers, such as for MC, and it's feedback
	this.distractor = config.distractor;
	//studAnswer is the selection, entry, or input gesture from the student
	console.log("Scoring ", container, "... correct answer: ", answer.content, ", student sez: ", studAnswer);

	var match = 0;
	if (studAnswer == "") {
		alert("Please submit an answer.");
		match = 1;
	}
	if (answer.content === studAnswer) {
		d3.select("#" + container).append("div").attr("class", "alert alert-success").html("<i class='icon-ok-sign'></i> Your answer, " + studAnswer + ", is correct. " + answer.response);
		match = 1;
	} else {
		for (i = 0; i < distractor.length; i++) {
			if (distractor[i].content === studAnswer) {
				d3.select("#" + container).append("div").attr("class", "alert alert-error").html("<i class='icon-exclamation-sign'></i> Your answer, " + studAnswer + ", isn't correct. " + distractor[i].response);
				match = 1;
				break;
			}
		}
	}

	if (match == 0) {
		d3.select("#" + container).append("div").attr("class", "alert alert-error").html("<i class='icon-exclamation-sign'></i> Sorry, your answer, " + studAnswer + ", isn't correct.");
	}
} //end scoreIt function
//utility function for finding selected radio button from a group

function getCheckedRadio(name) {
	var match = 0;
	var radioButtons = document.getElementsByName(name);
	for (x = 0; x < radioButtons.length; x++) {
		if (radioButtons[x].checked) {
			return radioButtons[x].value;
			break;
		}
	}
	return "";
}

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
