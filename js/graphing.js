/* ===================================================
 * graphing.js v0.0.7
 * 
 * ===================================================
 * First prototype version of graphing routines for eCourses
 * written by L. Bondaryk Jan. 2013
 * ========================================================== */

/* ===================================================
Functions for scaling and data generation
===================================================*/
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

function compareLen(a, b) {
	return a.length - b.length;
}

function lin(data, range) {
	return d3.scale.linear().domain(d3.extent(data)) //pulls min and max of x
	.rangeRound(range); //lin now a function mapping data to the dimension of the drawing space
}

function ordScale(data, range) {
	return d3.scale.ordinal().domain(data).rangePoints(range); // a function mapping ordinal values evenly across the range of the drawing space
}

function expData(inputs) {
	this.rate = inputs.rate;
	this.base = inputs.base;
	this.pts = inputs.pts;
	var data = [];
	for (i = 0; i < pts + 1; i++) {
		data[i] = {
			x: i,
			y: base * Math.exp(rate * i)
		};
	}
	return data;
}
/* ===================================================
Functions for making containers such as tables and graph SVG holders
===================================================*/

function makeTable(ordinal, rowContent, highlitekey, title, maxWid) {
	//ordinal:an integer>=0 that identifies which div to write it into, since there may be several
	//rowContent: associative array/object in which keys are the headers and the values are the contents of the table
	//		each element is a row
	//highlitekey is an array of integers that specify ordinals for round-robin highlighting - optional
	//maxWid: the width of the table, without margins, integer - optional
	//title: the title appearing above the graph - optional
	//select the div in the document where the graph will go
	var tableContainer = d3.select("#tableTarget" + ordinal);
	var dataKeys = d3.keys(rowContent[0]);
	//title it in a styled div, if it has one
	if (title) {
		tableContainer.append("div").attr("class", "graphTitle").text(title);
	}

	//create a table
	var table = tableContainer.append("table").attr("id", "table" + ordinal).attr("class", "data");

	table.append("thead").attr("class", "data").append("tr").selectAll("td").data(dataKeys).enter().append("td").html(function(d) {
		return d;
	});

	//Show the data in a table
	var tableRows = table.append("tbody").selectAll("tr").data(rowContent).enter().append("tr")
	//creates as many rows as there are elements in rowContent
	.attr("id", function(d, i) {
		return "tablerw_" + highlitekey[i];
	}).attr("class", "liteable dataTable");

	tableRows.selectAll("td").data(function(d, i) {
		return d3.values(rowContent[i]);
	}) //tells how to break the objects apart to put them in the cells, and to make 3 cells in each row
	//maybe could have used d3 native values and keys methods here, but don't know advantage
	.enter().append("td").html(function(d) {
		return d;
	});

} //end of makeTable function

function makeSwapText(ordinal, content, className, highlitekey) {
	//ordinal:an integer>=0 that identifies which div to write it into, since there may be several
	//content: array of strings to display
	//highlitekey is an array of integers that specify ordinals for round-robin highlighting - optional
	//maxWid: the width of the table, without margins, integer - optional
	//title: the title appearing above the graph - optional
	d3.select("#textTarget" + ordinal).text("Gland:" + d3.values(content[highlitekey])).attr("class", className);
}

function makeGraph(ordinal, maxWid, maxHt, margin, title, interact) {
	//ordinal:an integer>=0 that identifies which div to write it into, since there may be several
	//maxWid, maxHt: the width and height of the graph region, without margins, integers
	//margin: an associative array with keys for top, bottom, left and right
	//title: the title appearing above the graph - optional
	//interact: boolean saying whether contents are interactive, and should be indicated with an icon
	//select the div in the document where the graph will go
	var graph = d3.select("#graphTarget" + ordinal);
	//title it in a styled div, if it has one
	//this puts the hand icon on the upper right corner and blocks clicks from being interpreted as swipes
	if (interact) {
		graph.attr("class", "inter noSwipe");
	}

	if (title) {
		graph.append("div").attr("class", "graphTitle").text(title);
	}

	//create an svg element of the appropriate size and scaling
	graph.append("svg").attr("viewBox", "0 0 " + (maxWid + margin.left + margin.right) + " " + (maxHt + margin.top + margin.bottom))
	//makes it  scale correctly in single-column or phone layouts
	.attr("preserveAspectRatio", "xMinYMin meet") //ditto
	.attr("id", "graph_" + ordinal).style("max-width", maxWid + margin.left + margin.right + "px")
	//max width works to make it lay out to scale
	.style("max-height", maxHt + margin.top + margin.bottom + "px");
	//max height keeps it from forcing whitespace below 
}

function reportData(d, unit) {
	//formats data for marker labels and other graph readouts
	//d is a 2-element array of x and y values.
	//unit is a string for the unit (optional)
	return "x: " + d3.values(d)[0] + "<br> y: " + d3.round(d3.values(d)[1], 2) + (unit ? unit : "");
}

/* ===================================================
Functions for making various kinds of graphs, including 
labeled images, lineCharts, areaCharts, categoryCharts,
barCharts, stacked bar and areaCharts, etc.
===================================================*/
function legend(options) {
	this.targetGraph = options.targetGraph;
	this.ordinal = options.ordinal;
	this.xPos = options.xPos;
	this.yPos = options.yPos;
	//this.boxWid= options.boxWid;
	this.maxWid = options.maxWid;
	this.maxHt = options.maxHt;
	this.margin = options.margin;
	this.labels = options.labels;
	this.type = options.type;
	this.liteKey = options.liteKey;
	this.name = options.name;
	this.id = options.id;

	var boxLength = 20;
	var labels = this.labels;
	var boxHeight = (boxLength + 5) * labels.length;
	var longest = d3.last(labels, compareLen);
	console.log("Longest label: ", longest);
	var longBox = d3.select(targetGraph).append("g").append("text").text(longest);
	this.boxWid = longBox.node().getBBox().width + 10;
	longBox.remove();

	//render the longest label out of view and get it's width to size the box
	var xOffset = (xPos == "left") ? margin.left + 10 : (margin.left + maxWid - boxWid - 10);
	//if the position is left, start the legend on the left margin edge,
	//otherwise start it across the graph box less its width less padding
	var yOffset = (yPos == "bottom") ? maxHt + margin.top - boxHeight - 10 : margin.top + 10;
	//if the position is at the bottom, measure up from bottom of graph,
	//otherwise start it on the margin from the top.
	this.legendBox = d3.select(targetGraph).append("g")
	//make a new group to hold the legend
	.attr('id', "legend")
	//call it legend
	.attr("transform", "translate(" + xOffset + "," + yOffset + ")");
	//move it to left/right/top/bottom position
	console.log("sensible values for legend horizontal position ", xPos, xPos == "right" || xPos == "left");

	console.log("sensible values for legend vertical position ", yPos, yPos == "top" || yPos == "bottom");

	this.legendBox.append("rect").attr("x", -5).attr("y", -5) //create small padding around the contents
	.attr("width", this.boxWid + 10).attr("height", boxHeight + 8) //lineheight+padding x rows
	.attr("class", "legendBox");

	var rows = legendBox.selectAll("g.slice") //this selects all <g> elements with class slice (there aren't any yet)
	.data(labels) //associate the data to create stacked slices 
	.enter() //this will create <g> elements for every data element 
	.append("svg:g") //create groups
	.attr("transform", function(d, i) {
		return "translate(0," + (labels.length - i - 1) * (boxLength + 5) + ")";
	})
	//counting up from the bottom, make a group for each series and move to stacked position
	.style("opacity", 0.9);

	if (liteKey) {
		rows.attr("id", function(d, i) {
			return "legend" + ordinal + "_" + liteKey[i]
		})
		//name it so it can be manipulated or highlighted later
		.attr("class", "liteable");
	}

	if (this.type == "box") {
		rows.append("rect") //add a line tag to each slice
		.attr("x", 0).attr("y", 0) //start at the left edge of box, but move down
		//a little to line up with text
		.attr("width", boxLength).attr("height", boxLength).attr("class", function(d, i) {
			return "fill" + i;
		});
	} else if (this.type == "line") {
		rows.append("line") //add a line to each slice
		.attr("class", function(d, i) {
			return "trace stroke" + i;
		}).attr("x1", 0) //start at the left edge of box
		.attr("x2", boxLength) //set line width
		.attr("y1", boxLength / 2).attr("y2", boxLength / 2);
	}

	rows.append("text") //this is native svg text, it doesn't wrap
	.attr("text-anchor", "start") //left align text 
	.attr("class", "legendLabel").attr("dx", boxLength + 4) //offset text to the right beyond leader
	.attr("dy", 2 * boxLength / 3) //offset text to the right beyond leader
	//.attr("alignment-baseline","bottom")
	.text(function(d, i) {
		return d;
	}); //get the label from legend array
}

function labeledImage(target, ordinal, imgURI, maxWid, maxHt, margin, catData, valData, labelWid, liteKey, caption) { //begin labeled image generator
	//target is the ordinal of the target div, created by makeGraph
	//ordinal is the integer number of the image within the graph region, so there can be more than one
	//imgURI is a string with the location of the image file - jpg, png, svg supported
	//maxWid and maxHt are the width and height, respectively, integers
	//margin is an associative array of top, bottom, left, right integers
	//catData and valData are related arrays of labels and [x,y] positions, optional
	//labelWid: integer width of labels, optional unless catData supplied
	//highlitekey is an array of integers that specify ordinals for round-robin highlighting - optional with labels
	//caption is a text string, optional
	var leaderOffset = maxWid / 7; //standard size for leader lines
	var tickheight = 10;

	var graph0 = d3.select("#graph_" + target).append("svg:g") //make a group to hold new image
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")") // push everything down so text doesn't slop over the top
	//.attr("class","liteable")
	.attr("id", function(d, i) {
		return "labelIMG" + target + ordinal + "_"
	}) //name it so it can be manipulated or highlighted later
	;
	if (imgURI) {
		graph0.append("g").attr("class", "image").append("image").attr("xlink:href", imgURI).attr("width", maxWid).attr("height", maxHt).append("desc", "an image"); //draw the image on the bottom, starting at the 0,0 top left of group
	}

	// make the caption label, if it exists
	if (caption) {
		graph0.append("g").attr("class", "caption").append("foreignObject").attr("x", 0).attr("y", maxHt - tickheight) //offset down on text box 
		.attr("width", maxWid).attr("height", 100).append("xhtml:body").style("margin", "0px") //this interior body shouldn't inherit margins from page body
		.append("div").attr("class", "caption").html(caption) //make the label from value and category 
		;

	}

	if (valData) { //draw labels and leaders if there are any
		var slices = graph0.append("g").attr("class", "labels").selectAll("g.slice")
		//this selects all <g> elements with class slice (there aren't any yet)
		.data(valData) //associate the data to create stacked slices 
		.enter() //this will create <g> elements for every data element 
		.append("g") //create groups
		.attr("transform", function(d, i) {
			return "translate(" + d[0] + "," + d[1] + ")";
		});

		if (liteKey) {
			slices.attr("id", function(d, i) {
				return "graph" + target + ordinal + "_" + liteKey[i]
			}) //name it so it can be manipulated or highlighted later
			.attr("class", "liteable");
		}
		//a scale for the positions of the labels, evenly spaced down the side
		//TODO: use this - at the moment we just have the manual positioning
		//I'd like to automate this, at least as an option
		var labelPos = d3.scale.ordinal().domain(catData) //just use the array of data labels
		.rangeRoundBands([0, maxHt], .1);

		//var leaders = slices.append("line") //add a line tag to each slice
		//.attr("x1", function(d,i) {return d[0];})
		//use specified x position
		//.attr("x2", maxWid-2) //start in the margin
		//.attr("y1", function(d,i) {return d[1];}) //use specified y position
		//.attr("y2", function(d,i){ return labelPos(catData[i]);})
		//.style("stroke","#000000")
		// ;
		// make the labels for each stacked piece
		slices.append("foreignObject") //create an HTML container for the label
		//.attr("x",function(d,i) { return d[0];})
		.attr("x", 0)
		//.attr("y", function(d,i) { return d[1]; }) 
		.attr("y", 0).attr("width", labelWid).attr("height", maxHt / catData.length) //height should allow all labels to be shown if stacked down edge
		.append("xhtml:body").style("margin", "2px").append("div").attr("class", "graphLabel") //this interior body shouldn't inherit margins from page body
		.html(function(d, i) {
			return catData[i];
		}) //make the label from value and category 
		;
	} //end if that makes the labels conditional and optional
} //end labeled image generator function

function labeledImageObj(options) { //begin labeled image object generator
	//target is the ordinal of the target div, created by makeGraph
	this.target = options.target;
	//ordinal is the integer number of the image within the graph region, so there can be more than one
	this.ordinal = options.ordinal;
	//imgURI is a string with the location of the image file - jpg, png, svg supported
	//optional if you just want labels
	this.imgURI = options.imgURI;
	//maxWid and maxHt are the width and height, respectively, integers
	this.description = options.description
	this.maxWid = options.maxWid;
	this.maxHt = options.maxHt;
	//margin is an associative array of top, bottom, left, right integers
	this.margin = options.margin;
	//labels object has keys labelText and labelX, labelY, optional
	this.labels = options.labels;
	//labelWid: integer width of labels, optional unless catData supplied
	this.labelWid = options.labelWid;
	this.labelHt = options.labelHt;
	//highlitekey is an array of integers that specify ordinals for round-robin highlighting - optional with labels
	this.liteKey = options.liteKey;
	this.caption = options.caption;
	this.stateSwitch = options.stateSwitch;
	//x and y stops are arrays of values, on some scale defined as a graph axis, that
	//form a grid for dragging labels into snap positions.  TODO: concatenate with overall
	//position logic and sort out scales when there is no graph
	this.xStops = options.xStops;
	this.yStops = options.yStops;
	//caption is a text string, optional
	var leaderOffset = maxWid / 7; //standard size for leader lines
	var tickheight = 10;

	this.graph = d3.select("#graph_" + target).append("g") //make a group to hold new image
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")") // push everything down so text labels don't slop over the top
	.attr("id", function(d, i) {
		return "img" + target + ordinal + "_"
	}) //name it so it can be manipulated or highlighted later
	;

	if (imgURI) {
		graph.append("g").attr("class", "image").append("image").attr("xlink:href", imgURI).attr("width", maxWid).attr("height", maxHt).append("desc").text(description);
		//required - we should never have an image inserted without a description for ARIA
	}

	// make the caption label, if it exists
	if (caption) {
		graph.append("g").attr("class", "caption").attr("transform", "translate(0," + maxHt + tickheight + ")")
		//offset below image - transforming the group works better than translating
		//contents of the foreignObject in Android browsers
		.append("foreignObject").attr("x", 0).attr("y", 0).attr("width", maxWid).attr("height", 100).append("xhtml:body").style("margin", "0px") //this interior body shouldn't inherit margins from page body
		.append("div").attr("class", "caption").html(caption) //make the caption
		;
	}

	if (labels) { //draw labels and leaders if there are any
		var labelGroup = graph.append("g").attr("class", "labels").selectAll("g.slice")
		//this selects all <g> elements with class slice (there aren't any yet)
		.data(labels) //associate the data to create stacked slices 
		.enter() //this will create <g> elements for every data element 
		.append("g") //create groups
		.attr("class", "liteable label").attr("transform", function(d, i) {
			return "translate(" + d.labelX + "," + d.labelY + ")";
		});

		if (liteKey) {
			labelGroup.attr("id", function(d, i) {
				return "label" + target + ordinal + "_" + liteKey[i]
			}) //name it so it can be manipulated or highlighted later
			;
		}
		//a scale for the positions of the labels, evenly spaced down the side
		//TODO: use this - at the moment we just have the manual positioning
		//I'd like to automate this, at least as an option
		//var labelPos = d3.scale.ordinal()
		//	.domain(labelX)//just use the array of data labels
		//.rangeRoundBands([0,maxHt],.1);
		//
		//var leaders = slices.append("line") //add a line tag to each slice
		//.attr("x1", function(d,i) {return d[0];})
		//use specified x position
		//.attr("x2", maxWid-2) //start in the margin
		//.attr("y1", function(d,i) {return d[1];}) //use specified y position
		//.attr("y2", function(d,i){ return labelPos(catData[i]);})
		//.style("stroke","#000000")
		// ;
		// make the labels for each stacked piece
		labelGroup.append("foreignObject") //create an HTML container for the label
		.attr("x", 0).attr("y", 0)
		.attr("width", labelWid?labelWid:(maxWid/4))
		.attr("height", labelHt?labelHt:(maxHt/labels.length)) 
		//height should allow all labels to be shown if stacked down edge, unless hard set
		.append("xhtml:body").style("margin", "2px").append("div").attr("class", "markerLabel") 
		//this interior body shouldn't inherit margins from page body
		.html(function(d, i) {
			return d.labelText;
		}); //make the label 

	} //end if that makes the labels conditional and optional
} //end labeled image object generator function

function lineGraph(config) { //begin line graph object generator to go with widget containers
	//xPerc and yPerc are decimals telling how much of the container box to use, 
	//typically between 0 and 1. Multiply the width and height of the hard-set svg box
	//used to calculate the aspect ratio when sizing viewport up or down
	this.xDim = config.xPerc*maxWid;
	this.yDim = config.yPerc*maxHt;
	//margins also done as percentage across the width/height of the svg box
	this.xMargin = config.xMargin*maxWid;
	this.yMargin = config.yMargin*maxHt;
	
	//Data: array of arrays of objects with keys x: and y: , real floating pt, one for each point, 
	//one array for each trace.
	this.Data = config.Data;
	//renderType is a string specifying "lines","points", or "lines+points" for line, scatter, or interpolated plots TODO supply images as point glyphs
	this.type = config.type;
	//axisType is a string specifying "standard" or "all positive" for axis that always count up from zero, regardless of the sign of the data
	//TODO this works for x axis only, if y is needed must be expanded
	this.axisType = config.axisType;
	//ticks is a 1x2 array specifying number of ticks or an explicit array of tick values on each axis, and the orientation 
	//(e.g. [3,"bottom"] or [[0,5,10],"right"])
	this.xTicks = config.xTicks;
	this.yTicks = config.yTicks;
	//highlitekey is an array of integers relating the traces to other selectable things on the page, optional
	this.liteKey = config.liteKey;
	//x and ylabel are text strings, optional
	this.xLabel = config.xLabel;
	this.yLabel = config.yLabel;
	//marks: an array of x positions to put pointers or area bar markers, optional
	//note marks can be drawn independently, but should be done through the graph 
	//to ensure synchronization of the axis scale and clip mask.
	this.marks = config.marks;
	this.areaMarks = config.areaMarks;
	//TODO when we are counting through an array of widgets, get this counter instead of 0
	this.widgetName = this.containerName+"0_";
	
	var tickheight = 10;
	var format = d3.format(".1");
	//one decimal on ticks, could have specified % e.g .1%
	//TODO make this a set of options on the function, users will need control
	//full d3 options are specified at https://github.com/mbostock/d3/wiki/Formatting
	
	if(areaMarks){
		this.xBands = options.areaMarks.xBands;
		this.yBands = options.areaMarks.yBands;
	}
	
	this.graph = svgObj.append("g") //make a group to hold new line chart
	//.attr("transform", "translate(" + margin.left + "," + margin.top + ")") 
	// push everything down so text doesn't slop over the top - We'll do this later after measurement
	.attr("id", widgetName) //name it so it can be manipulated or highlighted later
	;
console.log("graph group is made:", graph.attr("id"));
	//build the x and y scales
	//start by unwrapping all the data to make a single set of values for
	//x and y
	var xData = [],
		yData = [];

	for (i = 0; i < Data.length; i++) {
		Data[i].forEach(

		function(o) {
			xData.push(o.x);
			yData.push(o.y);
		});
	}

	//Check if there are explicit ticks specified, and if there are, use them as the mapped range of the graph width
	this.xRange = ($.isArray(xTicks[0])) ? xTicks[0] : xData;
	this.yRange = ($.isArray(yTicks[0])) ? yTicks[0] : ((d3.min(yData) > 0) ? yData.concat(0) : yData);
	//check that the y range extends down to 0, because data graphs
	// that don't include 0 for y are misleading

	this.xScale = d3.scale.linear()
	.domain(d3.extent(xRange)) //pulls min and max of x
	.rangeRound([0, xDim]); //xScale is now a function mapping x-data to the width of the drawing space
	
	this.yScale = d3.scale.linear()
	.domain(d3.extent(yRange)) //pulls min and max of y
	.rangeRound([yDim, 0]);
	// yScale is a function mapping y-data to height of drawing space. This seems backwards, 
	//but svg counts height down from the top, so we want the minimum drawn at height
	//if the axis is double positive then create leftPositive and rightPositive 
	//scales that meet at 0. Still use xScale to plot the data.
console.log(yScale);
	drawAxes2(); //call the separate method to put the axes on there
	
	// make a clippath, which is used in the case that we zoom or pan the graph dynamically
	graph.append("defs")
	.append("clipPath")
	.attr("id", "clip_" + widgetName)
	.append("rect")
	.attr("width", xDim)
	.attr("height", yDim);

	//draw the trace(s)
	if (type == "lines" || type == "lines+points") {
		this.line = d3.svg.line()
		//d3 utility function for generating all the point to point paths using the scales set up above
		.interpolate("basis").x(function(d, i) {
			return xScale(d.x);
		}).y(function(d, i) {
			return yScale(d.y);
		});

	this.traces = graph.selectAll("g.traces").data(Data).enter().append("g").attr("class", "traces");

	//associate the clip path so it doesn't slop over the axes
	traces.append("path").attr("clip-path", "url(#clip_" + widgetName + ")")
	//use the line function defined above to set the path data
	.attr("d", function(d, i) {
			return line(d);
		})
	//pick the colors sequentially off the list
	.attr("class", function(d, i) {
			return "trace stroke" + i;
		});
	
	if (liteKey) {
			traces.attr("class", "traces liteable")
			.attr("id", function(d, i) {
				return widgetName + liteKey[i];
			});
		}

	}


	if (type == "points" || type == "lines+points") {

		this.series = graph.selectAll("g.series").data(Data).enter().append("g").attr("class", function(d, i) {
			return "series fill" + i;
		});

		if (liteKey) {
			series.attr("id", function(d, i) {
				return widgetName + liteKey[i]
			});
		}

		this.points = series.selectAll("g.points") //this selects all <g> elements with class points (there aren't any yet)
		.data(Object) //drill down into the nested Data
		.enter() //this will create <g> elements for every data element, useful in case you want to label them
		.append("g") //create groups
		.attr("class", "liteable")
		.attr("transform", function(d, i) {
			return "translate(" + xScale(d.x) + "," + yScale(d.y) + ")";
		}).attr("clip-path", "url(#clip_" + target + ordinal + ")")
		//move each symbol to the x,y coordinates
		.append("path").attr("d", d3.svg.symbol().type(function(d, i, j) {
			console.log(j);
			return d3.svg.symbolTypes[j];
		}));
		//pick the shapes sequentially off the list
		//the recursive j index isn't working right now, and I don't know why.  It should, as it does in
		// this example http://jsfiddle.net/kQSGF/8/
	}

	if (marks) {
		markers(graph, marks[0], xData, Data[0], xScale, xDim, marks[1], marks[2]);
		d3.select("#markers").attr("clip-path", "url(#clip_" + target + ordinal + ")");
		console.log(marks);
	}

	if (areaMarks) {
		areaMarker(areaMarks);
	}
	
	var graphDims = graph.node().getBBox();
	var scaledHt = d3.round((yDim)/graphDims.height,2);
	var scaledWid = d3.round((xDim)/graphDims.width,2);

	this.scale = (scaledHt<scaledWid)?scaledHt:scaledWid;
	console.log("graph overall dimensions: ", graphDims.height , " by ", graphDims.width);
	console.log("greates scale factor: ", scale);
	
	graph.attr("transform", "translate("+xMargin+","+ yMargin+") scale(" 
	   + scale +"," + scale +")");
	
} //end line graph object generator function to go with container widgets

function drawAxes2() {
	var format = d3.format(".1");

	if (axisType == "double positive") {
		var negatives = [],
			negTicks = [],
			posTicks = [];
		xRange.forEach(

		function(o) {
			if (o < 0) {
				negatives.push(o);
			}
		});

		if ($.isArray(xTicks[0])) {
			xTicks[0].forEach(

			function(o) {
				if (o < 0) {
					negTicks.push(Math.abs(o));
				} else {
					posTicks.push(o);
				}
			});
		}
		console.log("Minimum negative value converted to positive: ", d3.min(negatives));

		var leftPositive = d3.scale.linear().domain([Math.abs(d3.min(negatives)), 0]).rangeRound([0, xScale(0)]);
		var rightPositive = d3.scale.linear().domain([0, d3.max(xRange)]).rangeRound([xScale(0), maxWid]);
	}
	//set up the functions that will generate the x and y axes
	var xAxis = d3.svg.axis() //a function that will create the axis and ticks and text labels
	.scale(xScale) //telling the axis to use the scale defined by the function x
	.orient(xTicks[1]).tickSize(tickheight, 0).tickPadding(3).tickFormat(format);

	if (axisType == "double positive") {
		var leftXAxis = d3.svg.axis() //a function that will create the axis and ticks and text labels
		.scale(leftPositive) //telling the axis to use the scale defined by the function x
		.orient(xTicks[1]).tickSize(tickheight, 0).tickPadding(3).tickFormat(format);


		this.xAxis = d3.svg.axis() //a function that will create the axis and ticks and text labels
		.scale(rightPositive) //telling the axis to use the scale defined by the function x
		.orient(xTicks[1]).tickSize(tickheight, 0).tickPadding(3).tickFormat(format);
	}

	//next set the ticks to absolute values or just a number of ticks
	if (axisType == "double positive") {
		$.isArray(xTicks[0]) ? (xAxis.tickValues(posTicks) && leftXAxis.tickValues(negTicks)) : (xAxis.ticks(xTicks[0] - 2) && leftXAxis.ticks(2));
	} else {
		$.isArray(xTicks[0]) ? (xAxis.tickValues(xTicks[0])) : (xAxis.ticks(xTicks[0]));
	}
	//test tick type switch
	console.log("xtick specified explicitly?", xTicks[0], $.isArray(xTicks[0], xAxis.ticks()));

	this.yAxis = d3.svg.axis() //a function that will create the axis and ticks and text labels
	.scale(yScale) //telling the axis to use the scale defined by the function x
	.orient(yTicks[1]).tickSize(tickheight, 0)
	//sets the height of ticks to tickheight, except for the ends, which don't get ticks
	.tickPadding(3);

	$.isArray(yTicks[0]) ? (yAxis.tickValues(yTicks[0])) : (yAxis.ticks(yTicks[0]));
	//test tick type switch
	console.log("ytick specified explicitly?", yTicks[0], $.isArray(yTicks[0]), yAxis.ticks());


	//test data against scale
	Data.forEach(function(o) {
		console.log("max x[" + Data.indexOf(o) + "] value on graph:", xScale(d3.max(o, function(d) {
			return d.x;
		})) <= maxWid);
		console.log("min x[" + Data.indexOf(o) + "] value on graph:", xScale(d3.min(o, function(d) {
			return d.x;
		})) >= 0);
	});
	//these expressions pull the nested sets of data corresponding to each trace and extract the min and max values for x and y, 
	//then make sure those are on the visible graph somewhere given the scales created above, unless explicitly hidden by the hard set ticks.
	Data.forEach(function(o) {
		console.log("max y[" + Data.indexOf(o) + "] value on graph:", yScale(d3.max(o, function(d) {
			return d.y;
		})) >= 0);
		console.log("min y[" + Data.indexOf(o) + "] value on graph:", yScale(d3.min(o, function(d) {
			return d.y;
		})) <= yDim);
	});

	var xaxis = graph.append("g")
	.call(xAxis).attr("transform", "translate(0," + ((xTicks[1] == "bottom") ? yDim : 0) + ")")
	//move it down if the axis is at the bottom of the graph
	.attr("class", "x axis");

//if we want positive tick values radiating from 0, then make the negative half of the axis separately
	if (axisType == "double positive") {
		xaxis = graph.append("g")
		.call(leftXAxis).attr("transform", "translate(0," + ((xTicks[1] == "bottom") ? yDim : 0) + ")")
		//move it down if the axis is at the bottom of the graph
		.attr("class", "x axis");
		// make the x-axis label, if it exists
	}

	if (xLabel) {
		axisDims = xaxis.node().getBBox();
		xaxis.append("foreignObject").attr("x", 0)
		.attr("y", ((xTicks[1] == "top") ? (-1.5) : 1) * (axisDims.height + 2))
		.attr("width", xDim)
		.attr("height", 50)
		.append("xhtml:body")
		.style("margin", "0px") //this interior body shouldn't inherit margins from page body
		.append("div")
		.attr("class", "axisLabel").html(xLabel) //make the label from value and category 
		;
	}

	var yaxis = graph.append("g")
	.attr("transform", "translate(" + ((yTicks[1] == "right") ? xDim : 0) + ",0)") 
	//move it over if the axis is at the bottom of the graph
	.call(yAxis).attr("class", "y axis");

	//test x and y orientation values "top","bottom","left","right" are all that works
	console.log("sensible values for x axis orientation: ", xTicks[1], xTicks[1] == "bottom" || xTicks[1] == "top");
	console.log("sensible values for y axis orientation: ", yTicks[1], yTicks[1] == "right" || yTicks[1] == "left");

	// make the y-axis label, if it exists
	if (yLabel) {
		axisDims = yaxis.node().getBBox();
		yaxis.append("foreignObject")
		.attr("transform", "translate(" + ((yTicks[1] == "left") ? (-1.5) : 1) * (axisDims.width + 10) + "," + (yDim) + ") rotate(-90)")
		// move it out of the way of the ticks to left or right depending on axis orientation
		.attr("width", yDim)
		.attr("height", 50)
		.append("xhtml:body").style("margin", "0px") //this interior body shouldn't inherit margins from page body
		.append("div").attr("class", "axisLabel")
		.html(yLabel) //make the label from value and category 
		;
	}
} // end drawAxes2 method

function makeLegend(config) {//begin legend generator to go with widget container
	//xPer and yPerc decimal percentage tells how to position top left corner of the legend box 
	//wrt hard set svg container. In general these will daisychain off 
	//of the scaling of the underlying graph or graphs so those fit on screen. 
	
	this.xDim = config.xPerc*maxWid;
	this.yDim = config.yPerc*maxHt;
	//margins also done as percentage across the width/height of the svg box
	this.xMargin = config.xMargPerc*maxWid;
	this.yMargin = config.yMargPerc*maxHt;
	//x and yPos state left/right/top/bottom
	this.xPos = config.xPos;
	this.yPos = config.yPos;
	this.labels = config.labels;
	//type is a string specifying box or line legend markers
	this.type = config.type;
	this.liteKey = config.liteKey;
	this.name = config.name;
	var lscale = (scale?scale:1);
	
	var boxLength = 20, inset=10;
	var boxHeight = (boxLength + 5) * labels.length;
	var longest = d3.last(labels, compareLen);
	console.log("Longest legend label: ", longest);
	//to calculate the width of the box big enough for the longest text string, we have to 
	//render the string, get its bounding box, then remove it.
	var longBox = svgObj.append("g").append("text").text(longest);
	this.boxWid = longBox.node().getBBox().width + 2*inset;
	longBox.remove();

	var xOffset = (xPos == "left") ? xMargin+inset : xMargin + lscale*(xDim - boxWid - inset);
	//if the position is left, start the legend on the left margin edge,
	//otherwise start it across the graph box less its width less padding
	var yOffset = (yPos == "bottom") ? lscale*(yDim - boxHeight - inset) + yMargin : yMargin + inset;
	//if the position is at the bottom, measure up from bottom of graph,
	//otherwise start it on the margin from the top.

	this.legendBox = svgObj.append("g")
	//make a new group to hold the legend
	.attr('id',"legend" + ordinal);
	//move it to left/right/top/bottom position

	console.log("sensible values for legend horizontal position ", xPos, xPos == "right" || xPos == "left");

	console.log("sensible values for legend vertical position ", yPos, yPos == "top" || yPos == "bottom");

	this.legendBox.append("rect").attr("x", -5).attr("y", -5) //create small padding around the contents
	.attr("width", this.boxWid + 10).attr("height", boxHeight + 8) //lineheight+padding x rows
	.attr("class", "legendBox");

	var rows = legendBox.selectAll("g.slice") //this selects all <g> elements with class slice (there aren't any yet)
	.data(labels) //associate the data to create stacked slices 
	.enter() //this will create <g> elements for every data element 
	.append("svg:g") //create groups
	.attr("transform", function(d, i) {
		return "translate(0," + (labels.length - i - 1) * (boxLength + 5) + ")";
	})
	//counting up from the bottom, make a group for each series and move to stacked position
	.style("opacity", 0.9);

	if (liteKey) {
		rows.attr("id", function(d, i) {
			return "legend" + ordinal + "_" + liteKey[i]
		})
		//name it so it can be manipulated or highlighted later
		.attr("class", "liteable");
	}

	if (this.type == "box") {
		rows.append("rect") //add a line tag to each slice
		.attr("x", 0).attr("y", 0) //start at the left edge of box, but move down
		//a little to line up with text
		.attr("width", boxLength).attr("height", boxLength).attr("class", function(d, i) {
			return "fill" + i;
		});
	} else if (this.type == "line") {
		rows.append("line") //add a line to each slice
		.attr("class", function(d, i) {
			return "trace stroke" + i;
		}).attr("x1", 0) //start at the left edge of box
		.attr("x2", boxLength) //set line width
		.attr("y1", boxLength / 2).attr("y2", boxLength / 2);
	}

	rows.append("text") //this is native svg text, it doesn't wrap
	.attr("text-anchor", "start") //left align text 
	.attr("class", "legendLabel").attr("dx", boxLength + 4) //offset text to the right beyond leader
	.attr("dy", 2 * boxLength / 3) //offset text to the right beyond leader
	//.attr("alignment-baseline","bottom")
	.text(function(d, i) {
		return d;
	}); //get the label from legend array
	
	legendBox.attr("transform", "translate(" + xOffset + "," + yOffset + ") scale(" 
		+ lscale + "," + lscale + ")");
}//end of legend2 function

function drawAxes() {
	var format = d3.format(".1");

	if (axisType == "double positive") {
		var negatives = [],
			negTicks = [],
			posTicks = [];
		xRange.forEach(

		function(o) {
			if (o < 0) {
				negatives.push(o);
			}
		});

		if ($.isArray(xTicks[0])) {
			xTicks[0].forEach(

			function(o) {
				if (o < 0) {
					negTicks.push(Math.abs(o));
				} else {
					posTicks.push(o);
				}
			});
		}
		console.log("Minimum negative value converted to positive: ", d3.min(negatives));

		var leftPositive = d3.scale.linear().domain([Math.abs(d3.min(negatives)), 0]).rangeRound([0, xScale(0)]);
		var rightPositive = d3.scale.linear().domain([0, d3.max(xRange)]).rangeRound([xScale(0), maxWid]);
	}
	//set up the functions that will generate the x and y axes
	var xAxis = d3.svg.axis() //a function that will create the axis and ticks and text labels
	.scale(xScale) //telling the axis to use the scale defined by the function x
	.orient(xTicks[1]).tickSize(tickheight, 0).tickPadding(3).tickFormat(format);

	if (axisType == "double positive") {
		var leftXAxis = d3.svg.axis() //a function that will create the axis and ticks and text labels
		.scale(leftPositive) //telling the axis to use the scale defined by the function x
		.orient(xTicks[1]).tickSize(tickheight, 0).tickPadding(3).tickFormat(format);


		this.xAxis = d3.svg.axis() //a function that will create the axis and ticks and text labels
		.scale(rightPositive) //telling the axis to use the scale defined by the function x
		.orient(xTicks[1]).tickSize(tickheight, 0).tickPadding(3).tickFormat(format);
	}

	//next set the ticks to absolute values or just a number of ticks
	if (axisType == "double positive") {
		$.isArray(xTicks[0]) ? (xAxis.tickValues(posTicks) && leftXAxis.tickValues(negTicks)) : (xAxis.ticks(xTicks[0] - 2) && leftXAxis.ticks(2));
	} else {
		$.isArray(xTicks[0]) ? (xAxis.tickValues(xTicks[0])) : (xAxis.ticks(xTicks[0]));
	}
	//test tick type switch
	console.log("xtick specified explicitly?", xTicks[0], $.isArray(xTicks[0], xAxis.ticks()));

	this.yAxis = d3.svg.axis() //a function that will create the axis and ticks and text labels
	.scale(yScale) //telling the axis to use the scale defined by the function x
	.orient(yTicks[1]).tickSize(tickheight, 0)
	//sets the height of ticks to tickheight, except for the ends, which don't get ticks
	.tickPadding(3);

	$.isArray(yTicks[0]) ? (yAxis.tickValues(yTicks[0])) : (yAxis.ticks(yTicks[0]));
	//test tick type switch
	console.log("ytick specified explicitly?", yTicks[0], $.isArray(yTicks[0]), yAxis.ticks());


	//test data against scale
	Data.forEach(function(o) {
		console.log("max x[" + Data.indexOf(o) + "] value on graph:", xScale(d3.max(o, function(d) {
			return d.x;
		})) <= maxWid);
		console.log("min x[" + Data.indexOf(o) + "] value on graph:", xScale(d3.min(o, function(d) {
			return d.x;
		})) >= 0);
	});
	//these expressions pull the nested sets of data corresponding to each trace and extract the min and max values for x and y, 
	//then make sure those are on the visible graph somewhere given the scales created above, unless explicitly hidden by the hard set ticks.
	Data.forEach(function(o) {
		console.log("max y[" + Data.indexOf(o) + "] value on graph:", yScale(d3.max(o, function(d) {
			return d.y;
		})) >= 0);
		console.log("min y[" + Data.indexOf(o) + "] value on graph:", yScale(d3.min(o, function(d) {
			return d.y;
		})) <= maxHt);
	});

	var xaxis = graph.append("g")
	.call(xAxis).attr("transform", "translate(0," + ((xTicks[1] == "bottom") ? maxHt : 0) + ")")
	//move it down if the axis is at the bottom of the graph
	.attr("class", "x axis");

//if we want positive tick values radiating from 0, then make the negative half of the axis separately
	if (axisType == "double positive") {
		xaxis = graph.append("g")
		.call(leftXAxis).attr("transform", "translate(0," + ((xTicks[1] == "bottom") ? maxHt : 0) + ")")
		//move it down if the axis is at the bottom of the graph
		.attr("class", "x axis");
		// make the x-axis label, if it exists
	}

	if (xLabel) {
		axisDims = xaxis.node().getBBox();
		xaxis.append("foreignObject").attr("x", 0).attr("y", ((xTicks[1] == "top") ? (-1) : 1) * (axisDims.height + 2)).attr("width", maxWid).attr("height", 50).append("xhtml:body").style("margin", "0px") //this interior body shouldn't inherit margins from page body
		.append("div").attr("class", "axisLabel").html(xLabel) //make the label from value and category 
		;
	}

	var yaxis = graph.append("g").attr("transform", "translate(" + ((yTicks[1] == "right") ? maxWid : 0) + ",0)") //move it over if the axis is at the bottom of the graph
	.call(yAxis).attr("class", "y axis");

	//test x and y orientation values "top","bottom","left","right" are all that works
	console.log("sensible values for x axis orientation: ", xTicks[1], xTicks[1] == "bottom" || xTicks[1] == "top");
	console.log("sensible values for y axis orientation: ", yTicks[1], yTicks[1] == "right" || yTicks[1] == "left");

	// make the y-axis label, if it exists
	if (yLabel) {
		axisDims = yaxis.node().getBBox();
		yaxis.append("foreignObject").attr("transform", "translate(" + ((yTicks[1] == "left") ? (-1.5) : 1) * (axisDims.width + 10) + "," + (maxHt) + ") rotate(-90)")
		// move it out of the way of the ticks to left or right depending on axis orientation
		.attr("width", maxHt).attr("height", 50).append("xhtml:body").style("margin", "0px") //this interior body shouldn't inherit margins from page body
		.append("div").attr("class", "axisLabel").html(yLabel) //make the label from value and category 
		;
	}
} // end drawAxes method

function areaMarker(options) { //begin area graph generator
	//x and y bands determine the leading and trailing edges of the 
	//area rectangles, and the orientation (vertical if x, horiz if y)
	//bands are specified as an array of 2-element arrays
	this.xBands = options.xBands;
	//maxWid and maxHt are the width and height, respectively, integers
	//margin is an associative array of top, bottom, left, right integers
	this.yBands = options.yBands;

	//make a group to hold the area markers  
	var bandMarks = graph.append("g").attr("class", "areaMarker");

	//these tests pull the sets of markers for each band and then report whether the bands are all in the shown range of the graph which calls them
	if (xBands) {
		xBands.forEach(function(o) {
			console.log("x Band Marker" + xBands.indexOf(o), o[0] + " and " + o[1] + " in domain? " + xScale.domain());

			bandMarks.append("rect").attr("x", xScale(o[0])).attr("y", 0)
			.attr("width", Math.abs(xScale(o[1]) - xScale(o[0]))).attr("height", yDim);
		});
	}

	if (yBands) {
		yBands.forEach(function(o) {
			console.log("y Band Marker" + yBands.indexOf(o), o[0] + " and " + o[1] + " in domain " + yScale.domain());

			bandMarks.append("rect").attr("x", 0).attr("y", yScale(o[0]))
			.attr("width", xDim)
			.attr("height", Math.abs(yScale(o[1]) - yScale(o[0])));
		});
	}

	if (liteKey) {
		bandMarks.attr("id", function(d, i) {
			return "areaMark" + target + ordinal + "_" + liteKey[i];
		})
	} //name it 
} //end area marker object generator function

function lineChartObj(options) { //begin line chart object generator
	//target is the ordinal of the target div, created by makeGraph
	this.target = options.graphTarget;
	//ordinal is the integer number of the image within the graph region, so there can be more than one
	this.ordinal = options.ordinal;
	//Data: nested tuples of arrays, real floating pt.  One tuple (xVal and yVal values) for each point, one array for each trace.
	this.Data = options.Data;
	//maxWid and maxHt are the width and height, respectively, integers
	this.maxWid = options.maxWid;
	this.maxHt = options.maxHt;
	//margin is an associative array of top, bottom, left, right integers
	this.margin = options.margin;
	//renderType is a string specifying "lines","points", or "lines+points" for line, scatter, or interpolated plots TODO supply images as point glyphs
	this.type = options.type;
	//axisType is a string specifying "standard" or "all positive" for axis that always count up from zero, regardless of the sign of the data
	//TODO this works for x axis only, if y is needed must be expanded
	this.axisType = options.axisType;
	//ticks is a 1x2 nested array specifying number of ticks or an explicit array of tick values on each axis, and the orientation (e.g. [[3,"bottom"],[5,"right"]])
	this.xTicks = options.ticks[0];
	this.yTicks = options.ticks[1];
	//highlitekey is an array of integers relating the traces to other selectable things on the page, optional
	this.liteKey = options.liteKey;
	//x and ylabel are text strings, optional
	this.xLabel = options.xLabel;
	this.yLabel = options.yLabel;
	//marks: an array of x positions to put pointers or area bar markers, optional
	//note marks can be drawn independently, but should be done through the graph to ensure synchronization of the axis scale and clip mask.
	this.marks = options.marks;
	this.areaMarks = options.areaMarks;
	if(areaMarks){
		this.xBands = options.areaMarks.xBands;
		this.yBands = options.areaMarks.yBands;
	}
	
	var tickheight = 10;
	//var shapes = ["circle","cross","diamond","square","triangle-down","triangle-up"];
	var format = d3.format(".1");
	//one decimal on ticks, could have specified % e.g .1%
	//TODO make this a set of options on the function, users will need control
	//full d3 options are specified at https://github.com/mbostock/d3/wiki/Formatting
	this.graph = d3.select("#graph_" + target).append("g") //make a group to hold new line chart
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")") // push everything down so text doesn't slop over the top
	.attr("id", function(d, i) {
		return "graph" + target + ordinal + "_"
	}) //name it so it can be manipulated or highlighted later
	;
console.log("graph group is made:", graph.attr("id"));
	//build the x and y scales
	//start by unwrapping all the data to make a single set of values for
	//x and y
	var xData = [],
		yData = [];

	for (i = 0; i < Data.length; i++) {
		Data[i].forEach(

		function(o) {
			xData.push(o.x);
			yData.push(o.y);
		});
	}

	//Check if there are explicit ticks specified, and if there are, use them as the mapped range of the graph width
	this.xRange = ($.isArray(xTicks[0])) ? xTicks[0] : xData;
	this.yRange = ($.isArray(yTicks[0])) ? yTicks[0] : ((d3.min(yData) > 0) ? yData.concat(0) : yData);
	//check that the y range extends down to 0, because data graphs
	// that don't include 0 for y are misleading

	this.xScale = d3.scale.linear().domain(d3.extent(xRange)) //pulls min and max of x
	.rangeRound([0, maxWid]); //xScale is now a function mapping x-data to the width of the drawing space
	this.yScale = d3.scale.linear().domain(d3.extent(yRange)) //pulls min and max of y
	.rangeRound([maxHt, 0]);
	// yScale is a function mapping y-data to height of drawing space. This seems backwards, but svg counts height down from the top, so we want the minimum drawn at height
	//if the axis is double positive then create leftPositive and rightPositive 
	//scales that meet at 0. Still use xScale to plot the data.

	drawAxes();
	// make a clippath, which is used in the case that we zoom or pan the graph dynamically
	graph.append("defs").append("clipPath").attr("id", "clip_" + target + ordinal).append("rect").attr("width", maxWid).attr("height", maxHt);

	//draw the trace(s)
	if (type == "lines" || type == "lines+points") {
		this.line = d3.svg.line()
		//d3 utility function for generating all the point to point paths using the scales set up above
		.interpolate("basis").x(function(d, i) {
			return xScale(d.x);
		}).y(function(d, i) {
			return yScale(d.y);
		});

		this.traces = graph.selectAll("g.traces").data(Data).enter().append("g").attr("class", "traces");

		//associate the clip path so it doesn't slop over the axes
		traces.append("path").attr("clip-path", "url(#clip_" + target + ordinal + ")")
		//use the line function defined above to set the path data
		.attr("d", function(d, i) {
			return line(d);
		})
		//pick the colors sequentially off the list
		.attr("class", function(d, i) {
			return "trace stroke" + i;
		});
	
		if (liteKey) {
			traces.attr("class", "traces liteable")
			.attr("id", function(d, i) {
				return "graph" + target + ordinal + "_" + liteKey[i];
			});
		}

	}


	if (type == "points" || type == "lines+points") {

		this.series = graph.selectAll("g.series").data(Data).enter().append("g").attr("class", function(d, i) {
			return "series fill" + i;
		});

		if (liteKey) {
			series.attr("id", function(d, i) {
				return "graph" + target + ordinal + "_" + liteKey[i]
			});
		}

		this.points = series.selectAll("g.points") //this selects all <g> elements with class points (there aren't any yet)
		.data(Object) //drill down into the nested Data
		.enter() //this will create <g> elements for every data element, useful in case you want to label them
		.append("g") //create groups
		.attr("class", "liteable").attr("transform", function(d, i) {
			return "translate(" + xScale(d.x) + "," + yScale(d.y) + ")";
		}).attr("clip-path", "url(#clip_" + target + ordinal + ")")
		//move each symbol to the x,y coordinates
		.append("path").attr("d", d3.svg.symbol().type(function(d, i, j) {
			console.log(j);
			return d3.svg.symbolTypes[j];
		}));
		//pick the shapes sequentially off the list
		//the recursive j index isn't working right now, and I don't know why.  It should, as it does in
		// this example http://jsfiddle.net/kQSGF/8/
	}

	if (marks) {
		markers(graph, marks[0], xData, Data[0], xScale, maxHt, marks[1], marks[2]);
		d3.select("#markers").attr("clip-path", "url(#clip_" + target + ordinal + ")");
		console.log(marks);
	}

	if (areaMarks) {
		areaMarker(areaMarks);
	}
} //end line chart object generator function

function barChartObj(options) { //begin barChartII generator
	//targetGraph is the ordinal of the target div, created by makeGraph
	this.targetGraph = options.targetGraph;
	//ordinal is the integer number of the image within the graph region, so there can be more than one
	this.ordinal = options.ordinal;
	//Data: nested arrays of arrays object tuples, yVal is category data, xVal is reals.  One array in each for each series of bars.
	this.Data = options.Data;
	//maxWid and maxHt are the width and height, respectively, integers
	//margin is an associative array of top, bottom, left, right integers
	this.maxWid = options.maxWid;
	this.maxHt = options.maxHt;
	this.margin = options.margin;

	//ticks is a 1x2 array specifying number of ticks on each axis or an explicit array of tick values, and left/right/top/bottom orientation - TODO: more general axis generator
	this.xTicks = options.ticks[0];
	this.yTicks = options.ticks[1];
	//type is a string setting whether it's a "grouped" chart or linear, optional
	this.type = options.type;
	//highLiteKey is an array of integers relating the traces to other selectable things on the page, optional
	this.liteKey = options.liteKey;
	//x and ylabel are text strings, optional
	this.xLabel = options.xLabel;
	this.yLabel = options.yLabel;

	this.name = options.name;
	this.id = options.id;


	var tickheight = 10;
	maxWid = d3.round(maxWid);
	var graph = d3.select("#graph_" + targetGraph).append("svg:g") //make a group to hold new line chart
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")") // push everything down so text doesn't slop over the top
	.attr("id", function(d, i) {
		return "graph" + targetGraph + ordinal + "_"
	}) //name it so it can be manipulated or highlighted later
	;

	//build the x and y scales
	var xData = [],
		yData = [],
		indices = [];

	for (i = 0; i < Data.length; i++) {
		indices.push(i); //needed to space out grouped barcharts
		this.Data[i].forEach(

		function(o) {
			xData.push(o.xVal);
			//This will stack every ordinal value into a single array - at the end of the day that's all you can do
			yData.push(o.yVal);

		});
	}


	this.yScale = d3.scale.ordinal().domain(yData).rangeRoundBands([this.maxHt, 0], .2); //width is broken into even spaces allowing for bar width and 
	//a uniform white space between each, in this case, 20% white space
	var bandsize = yScale.rangeBand(); //returns the size of the bands produced by ordinal scale
	if (this.type == "grouped") {
		this.groupScale = d3.scale.ordinal().domain(indices).rangeRoundBands([bandsize, 0]);
		console.log("Grouped barChart last bar mapped to 0 offset: ", groupScale(Data.length - 1) == 0);
	};


	//Check if there are explicit ticks specified, and if there are, glom them onto
	//the xData so that they are certain to lie in the mapped range of the graph width
	var xRange = ($.isArray(xTicks[0])) ? (xData.concat(xTicks[0])) : xData;
	//check that the range at least extends down to 0, because we'll just have a bunch of potentially
	//all positive bar heights. Bars need to start at 0 and extend either positive or negative.
	//TODO reverse positive, not negative, on xaxis...
	var xMin = d3.min(xRange) > 0 ? 0 : d3.min(xRange);

	this.xScale = lin([xMin, d3.max(xRange)], [0, maxWid]);

	//set up the functions that will generate the x and y axes
	this.xAxis = d3.svg.axis() //a function that will create the axis and ticks and text labels
	.scale(xScale) //telling the axis to use the scale defined by the function x
	.orient(xTicks[1]).tickSize(tickheight).tickPadding(3);

	$.isArray(xTicks[0]) ? (xAxis.tickValues(xTicks[0])) : (xAxis.ticks(xTicks[0]));
	//test tick type switch
	console.log("xtick specified explicitly?", xTicks[0], $.isArray(xTicks[0]));
	//test ticks on visible axis
	if ($.isArray(xTicks[0])) {
		console.log("xticks within axis range", xScale(d3.max(xTicks[0])) <= maxWid);
	}
	this.yAxis = d3.svg.axis() //a function that will create the axis and ticks and text labels
	.scale(yScale) //telling the axis to use the scale defined by the function x
	.orient(yTicks[1]).tickSize(tickheight, 0).tickPadding(3);

	$.isArray(yTicks[0]) ? (yAxis.tickValues(yTicks[0])) : (yAxis.ticks(yTicks[0]));
	//test tick type switch
	console.log("ytick specified explicitly?", yTicks[0], $.isArray(yTicks[0]));

	//test data and scale
	console.log("smallest value at bottom left corner:", xMin, xScale(xMin) == 0);
	console.log("largest value at bottom right corner:", d3.max(xRange), xScale(d3.max(xRange)) == maxWid);

	var xaxis = graph.append("g").attr("transform", "translate(0," + ((xTicks[1] == "bottom") ? height : 0) + ")") //move it down if the axis is at the bottom of the graph
	.attr("class", "x axis").call(xAxis);

	// make the x-axis label, if it exists
	if (xLabel) {
		xaxis.append("foreignObject").attr("x", 0).attr("y", 3 * tickheight).attr("width", maxWid).attr("height", 50).append("xhtml:body").style("margin", "0px") //this interior body shouldn't inherit margins from page body
		.append("div").attr("class", "axisLabel").html(xLabel) //make the label from value and category 
		;
	}

	var yaxis = graph.append("g").attr("transform", "translate(" + ((yTicks[1] == "right") ? width : 0) + ",0)") //move it over if right 
	.call(yAxis).attr("class", "y axis");

	// make the y-axis label, if it exists
	if (yLabel) {
		yaxis.append("foreignObject").attr("transform", "translate(" + ((yTicks[1] == "left") ? (-1) : 1) * 6 * tickheight + "," + maxHt + ") rotate(-90)").attr("width", maxHt).attr("height", 50).append("xhtml:body").style("margin", "0px") //this interior body shouldn't inherit margins from page body
		.append("div").attr("class", "axisLabel").html(yLabel) //make the label from value and category 
		;
	}

	var series = graph.selectAll("g.series").data(Data).enter().append("g").attr("class", function(d, i) {
		return "series liteable fill" + i;
	});
	//If it's a grouped barchart, shimmie out the bars by group
	if (this.type == "grouped") {
		series.attr("transform", function(d, i) {
			return "translate(0," + (groupScale(i)) + ")";
		})
	}
	//If it's highliteable, add a key
	if (liteKey) {
		series.attr("id", function(d, i) {
			return "series_" + (liteKey[i]);
		})
	}


	var bars = series.selectAll("g.bar") //this selects all <g> elements with class bar (there aren't any yet)
	.data(Object) //drill down into the nested Data
	.enter() //this will create <g> elements for every data element 
	.append("g") //create groups
	.attr("class", "liteable")
	//move each group to the x=0 position horizontally if it's a positive bar, or 
	// start at it's negative x value if it's reversed. 
	.attr("transform", function(d, i) {
		return "translate(" + ((d.xVal < 0) ? xScale(d.xVal) : xScale(0)) + "," + (yScale(d.yVal)) + ")";
	})

	//this allows us to draw pyramid charts, although normally bar charts are bin counts and all positive
	//move the group to the y=ordinal position vertically
	//I enclose the bars in individual groups so you could choose to label the ends with data or label
	//and have it stick to the bar by putting it in the same group
	.attr("id", function(d, i, j) {
		return "barGraph" + targetGraph + ordinal + j + "_" + i
	}); //name it for the region to highlight
	bars.append("svg:rect") //make the bars
	.attr("height", type == "grouped" ? bandsize / (Data.length + 1) : bandsize) //divide height into uniform bar widths
	.attr("width", function(d, i) {
		return ((d.xVal < 0) ? (xScale(0) - xScale(d.xVal)) : (xScale(d.xVal) - xScale(0)));
	}); //returns the value of the data associated with each slice as the width, or expands to the y=0 line if it's negative
	//.attr("class", function(d,i){return "fill"+[i];});//this works because the bound data is the same length as the array of colors, but really they ought to be packed into a single JSON data structure so they are associated.
} //end bar chart II electric boogaloo generator function

function barChart(target, ordinal, Data, maxWid, maxHt, margin, ticks, highLiteKey, xlabel, ylabel) { //begin barChart generator
	//target is the ordinal of the target div, created by makeGraph
	//ordinal is the integer number of the image within the graph region, so there can be more than one
	//Data: nested arrays of arrays object tuples, yVal is category data, xVal is reals.  One array in each for each series of bars.
	//maxWid and maxHt are the width and height, respectively, integers
	//margin is an associative array of top, bottom, left, right integers
	//ticks is a 1x2 array specifying number of ticks on each axis or an explicit array of tick values, and left/right/top/bottom orientation - TODO: more general axis settings
	//highLiteKey is an array of integers relating the traces to other selectable things on the page, optional
	//x and ylabel are text strings, optional
	var tickheight = 10;
	maxWid = d3.round(maxWid);
	var graph = d3.select("#graph_" + target).append("svg:g") //make a group to hold new line chart
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")") // push everything down so text doesn't slop over the top
	.attr("id", function(d, i) {
		return "graph" + target + ordinal + "_"
	}) //name it so it can be manipulated or highlighted later
	;

	//build the x and y scales
	var xData = [],
		yData = [];

	for (i = 0; i < Data.length; i++) {
		Data[i].forEach(

		function(o) {
			xData.push(o.xVal);
			//This will stack every ordinal value into a single array - at the end of the day that's all you can do
			yData.push(o.yVal);
		})
	}


	var y = d3.scale.ordinal().domain(yData).rangeRoundBands([maxHt, 0], .2); //width is broken into even spaces allowing for bar width and 
	//a uniform white space between each, in this case, 20% white space
	var bandsize = y.rangeBand(); //returns the size of the bands produced by ordinal scale
	//Check if there are explicit ticks specified, and if there are, glom them onto
	//the xData so that they are certain to lie in the mapped range of the graph width
	var xRange = ($.isArray(ticks[0][0])) ? (xData.concat(ticks[0][0])) : xData;
	//check that the range at least extends down to 0, because we'll just have a bunch of potentially
	//all positive bar heights. Bars need to start at 0 and extend either positive or negative.
	var xMin = d3.min(xRange) > 0 ? 0 : d3.min(xRange);

	var x = lin([xMin, d3.max(xRange)], [0, maxWid]);

	//set up the functions that will generate the x and y axes
	var xAxis = d3.svg.axis() //a function that will create the axis and ticks and text labels
	.scale(x) //telling the axis to use the scale defined by the function x
	.orient(ticks[0][1]).tickSize(tickheight).tickPadding(3);

	$.isArray(ticks[0][0]) ? (xAxis.tickValues(ticks[0][0])) : (xAxis.ticks(ticks[0][0]));
	//test tick type switch
	console.log("xtick specified explicitly?", ticks[0][0], $.isArray(ticks[0][0]));
	//test ticks on visible axis
	if ($.isArray(ticks[0][0])) {
		console.log("xticks within axis range", x(d3.max(ticks[0][0])) <= maxWid);
	}
	var yAxis = d3.svg.axis() //a function that will create the axis and ticks and text labels
	.scale(y) //telling the axis to use the scale defined by the function x
	.orient(ticks[1][1]).tickSize(tickheight, 0).tickPadding(3);

	$.isArray(ticks[1][0]) ? (yAxis.tickValues(ticks[1][0])) : (yAxis.ticks(ticks[1][0]));
	//test tick type switch
	console.log("ytick specified explicitly?", ticks[1][0], $.isArray(ticks[1][0]));

	//test data and scale
	console.log("smallest value at bottom left corner:", xMin, x(xMin) == 0);
	console.log("largest value at bottom right corner:", d3.max(xRange), x(d3.max(xRange)) == maxWid);

	var xaxis = graph.append("g").attr("transform", "translate(0," + ((ticks[0][1] == "bottom") ? height : 0) + ")") //move it down if the axis is at the bottom of the graph
	.attr("class", "x axis").call(xAxis);

	// make the x-axis label, if it exists
	if (xlabel) {
		xaxis.append("foreignObject").attr("x", 0).attr("y", 3 * tickheight).attr("width", maxWid).attr("height", 50).append("xhtml:body").style("margin", "0px") //this interior body shouldn't inherit margins from page body
		.append("div").attr("class", "axisLabel").html(xlabel) //make the label from value and category 
		;
	}

	var yaxis = graph.append("g").attr("transform", "translate(" + ((ticks[1][1] == "right") ? width : 0) + ",0)") //move it over if right 
	.call(yAxis).attr("class", "y axis");

	// make the y-axis label, if it exists
	if (ylabel) {
		yaxis.append("foreignObject").attr("transform", "translate(" + ((ticks[1][1] == "left") ? (-1) : 1) * 6 * tickheight + "," + maxHt + ") rotate(-90)").attr("width", maxHt).attr("height", 50).append("xhtml:body").style("margin", "0px") //this interior body shouldn't inherit margins from page body
		.append("div").attr("class", "axisLabel").html(ylabel) //make the label from value and category 
		;
	}

	var series = graph.selectAll("g.series").data(Data).enter().append("g").attr("class", function(d, i) {
		return "series fill" + i;
	});

	var bars = series.selectAll("g.bar") //this selects all <g> elements with class bar (there aren't any yet)
	.data(Object) //drill down into the nested Data
	.enter() //this will create <g> elements for every data element 
	.append("g") //create groups
	.attr("class", "liteable").attr("transform", function(d, i) {
		return "translate(" + ((d.xVal < 0) ? x(d.xVal) : x(0)) + "," + (y(d.yVal)) + ")";
	})
	//move each group to the x=0 position horizontally if it's a positive bar, or start at it's negative x value
	//this allows us to draw pyramid charts, although normally bar charts are bin counts and all positive
	//move the group to the y=ordinal position vertically
	//I enclose the bars in individual groups so you could choose to label the ends with data or label
	//and have it stick to the bar by putting it in the same group
	.attr("id", function(d, i, j) {
		return "barGraph" + target + ordinal + j + "_" + i
	}); //name it for the region to highlight
	bars.append("svg:rect") //make the bars
	.attr("height", bandsize) //divide height into uniform bar widths
	.attr("width", function(d, i) {
		return ((d.xVal < 0) ? (x(0) - x(d.xVal)) : (x(d.xVal) - x(0)));
	}); //returns the value of the data associated with each slice as the width, or expands to the y=0 line if it's negative
	//.attr("class", function(d,i){return "fill"+[i];});//this works because the bound data is the same length as the array of colors, but really they ought to be packed into a single JSON data structure so they are associated.
} //end bar chart generator function

function categoryChart(target, ordinal, Data, maxWid, maxHt, margin, ticks, highlitekey, xlabel, ylabel, marks) { //begin category graph generator
	//target is the ordinal of the target div, created by makeGraph
	//ordinal is the integer number of the image within the graph region, so there can be more than one
	//x and yData: nested arrays of arrays values, x is category data, y is reals.  One array in each for each trace.
	//maxWid and maxHt are the width and height, respectively, integers
	//margin is an associative array of top, bottom, left, right integers
	//ticks is a 1x2 array specifying number of ticks on each axis or an explicit array of tick values, and left/right/top/bottom orientation - TODO: more general axis settings
	//highlitekey is an array of integers relating the traces to other selectable things on the page, optional
	//x and ylabel are text strings, optional
	//marks: array of data values for markers, optional
	var tickheight = 10;
	//var graphColors = ["#2C6CB8","#66A62E","#E8B12E","#6B4FB8","#D44C17","#E39014","#666666"];
	var graph = d3.select("#graph_" + target).append("svg:g") //make a group to hold new line chart
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")") // push everything down so text doesn't slop over the top
	.attr("id", function(d, i) {
		return "graph" + target + ordinal + "_"
	}) //name it so it can be manipulated or highlighted later
	;

	//build the x and y scales
	var xData = [],
		yData = [],
		yMax, yMin;

	for (i = 0; i < Data.length; i++) {
		Data[i].forEach(

		function(o) {
			xData.push(o.xVal);
			//This will stack every ordinal value into a single array - at the end of the day that's all you can do
			yData.push(o.yVal);
		})
	}

	yMin = d3.min(yData);
	yMax = d3.max(yData);
	//Check if there are explicit ticks specified, and if there are, glom them onto
	//the yData so that they are certain to lie in the mapped range of the graph width
	var yRange = ($.isArray(ticks[1][0])) ? (yData.concat(ticks[1][0])) : yData;

	var x = ordScale(xData, [0, maxWid]); //x is now a function mapping ordinal x-data to the width of the drawing space
	var y = lin(d3.extent(yRange), [maxHt, 0]);
	//d3.scale.linear()
	//.domain(d3.extent(yData))//pulls min and max of y
	//.rangeRound([maxHt,0]); 
	// y is a function mapping y-data to height of drawing space. This seems backwards, but svg counts height down from the top, so we want the minimum drawn at height
	console.log(y);
	//test x and y orientation values "top","bottom","left","right" are all that works
	console.log("sensible values for x axis orientation: ", ticks[0][1], ticks[0][1] == "bottom" || ticks[0][1] == "top");
	console.log("sensible values for y axis orientation: ", ticks[1][1], ticks[1][1] == "right" || ticks[1][1] == "left");

	//set up the functions that will generate the x and y axes
	var xAxis = d3.svg.axis() //a function that will create the axis and ticks and text labels
	.scale(x) //telling the axis to use the scale defined by the function x
	.orient(ticks[0][1]).tickSize(tickheight).tickPadding(3);

	$.isArray(ticks[0][0]) ? (xAxis.tickValues(ticks[0][0])) : (xAxis.ticks(ticks[0][0]));
	//test tick type switch
	console.log("xtick specified explicitly?", ticks[0][0], $.isArray(ticks[0][0]));

	var yAxis = d3.svg.axis() //a function that will create the axis and ticks and text labels
	.scale(y) //telling the axis to use the scale defined by the function x
	.orient(ticks[1][1]).tickSize(tickheight).tickPadding(3);

	$.isArray(ticks[1][0]) ? (yAxis.tickValues(ticks[1][0])) : (yAxis.ticks(ticks[1][0]));
	//test tick type switch
	console.log("ytick specified explicitly?", ticks[1][0], $.isArray(ticks[1][0]));

	//test data and scale
	console.log("first ordinal is at bottom left corner:", xData[0], x(xData[0]) == 0);
	console.log("last ordinal is at bottom right corner:", xData[xData.length - 1], x(xData[xData.length - 1]) == maxWid);

	var xaxis = graph.append("g").attr("transform", "translate(0," + ((ticks[0][1] == "bottom") ? height : 0) + ")") //move it down if the axis is at the bottom of the graph
	.attr("class", "x axis").call(xAxis);

	// make the x-axis label, if it exists
	if (xlabel) {
		xaxis.append("foreignObject").attr("x", maxWid / 4).attr("y", 3 * tickheight).attr("width", maxWid / 2).attr("height", 50).append("xhtml:body").style("margin", "0px") //this interior body shouldn't inherit margins from page body
		.append("div").attr("class", "axisLabel").html(xlabel) //make the label from value and category 
		;
	}

	var yaxis = graph.append("g").attr("transform", "translate(" + ((ticks[1][1] == "right") ? width : 0) + ",0)") //move it over if right 
	.call(yAxis).attr("class", "y axis");

	// make the y-axis label, if it exists
	if (ylabel) {
		yaxis.append("foreignObject").attr("transform", "translate(" + ((ticks[1][1] == "left") ? (-1) : 1) * 3 * tickheight + "," + maxHt + ") rotate(-90)").attr("width", maxHt).attr("height", 50).append("xhtml:body").style("margin", "0px") //this interior body shouldn't inherit margins from page body
		.append("div").attr("class", "axisLabel").html(ylabel) //make the label from value and category 
		;
	}


	//d3 utility function for generating all the point to point paths using the scales set up above
	//draw the trace(s)
	var line = d3.svg.line()
	//d3 utility function for generating all the point to point paths using the scales set up above
	.interpolate("basis").x(function(d, i) {
		return x(d.xVal);
	}).y(function(d, i) {
		return y(d.yVal);
	});


	var traces = graph.selectAll("g.traces").data(Data).enter().append("g").attr("class", function(d, i) {
		return "trace liteable stroke" + i;
	}).attr("id", function(d, i) {
		return "graph" + target + ordinal + "_" + highlitekey[i]
	})
	//name it so it can be manipulated or highlighted later
	.append("svg:path").attr("d", function(d, i) {
		return line(d);
	});

	var area = d3.svg.area()
	//	.interpolate("step-before")
	.x(function(d, i) {
		return x(d.xVal);
	}).y1(function(d) {
		return y(d.yVal);
	}).y0(function(d) {
		return y(0);
	});
	//x is just the x value of the data that eventually gets fed in, 
	//y1 is the y value (top of the area), and y0 is the bottom of the area, so 
	//we can make a closed path.
	//draw the area
	var areaDraw = graph.append("svg:path").attr("class", "area fill0").attr("d", area(Data[0])).style("opacity", .2);

	// make the y-axis label, if it exists
	if (marks) {
		markers(graph, marks[0], xData, Data[0], x, maxHt, marks[1], marks[2]);
	}
} //end category line chart generator function

function lineChart(target, ordinal, Data, maxWid, maxHt, margin, renderType, ticks, highlitekey, xlabel, ylabel, legend, marks) { //begin line graph generator
	//target is the ordinal of the target div, created by makeGraph
	//ordinal is the integer number of the image within the graph region, so there can be more than one
	//Data: nested tuples of arrays, real floating pt.  One tuple (x and y values) for each trace.
	//maxWid and maxHt are the width and height, respectively, integers
	//margin is an associative array of top, bottom, left, right integers
	//renderType is a string specifying "lines","points", or "lines+points" for line, scatter, or interpolated plots
	//ticks is a 1x2 nested array specifying number of ticks or an explicit array of tick values on each axis, and the orientation (e.g. [[3,"bottom"],[5,"right"]]) 
	//highlitekey is an array of integers relating the traces to other selectable things on the page, optional
	//x and ylabel are text strings, optional
	//legend: array of strings labeling each trace.  First entry should indicate position ("left/right"). Should be same length as Data +1 - optional
	var tickheight = 10;
	//var shapes = ["circle","cross","diamond","square","triangle-down","triangle-up"];
	//var graphColors = ["#2C6CB8","#66A62E","#E8B12E","#6B4FB8","#D44C17","#E39014","#666666"];
	var format = d3.format(".1");
	//one decimal on ticks, could have specified % e.g .1%
	//TODO make this a set of options on the function, users will need control
	//full d3 options are specified at https://github.com/mbostock/d3/wiki/Formatting
	var graph = d3.select("#graph_" + target).append("svg:g") //make a group to hold new line chart
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")") // push everything down so text doesn't slop over the top
	.attr("id", function(d, i) {
		return "graph" + target + ordinal + "_"
	}) //name it so it can be manipulated or highlighted later
	;

	//build the x and y scales
	var xData = [],
		yData = [];

	for (i = 0; i < Data.length; i++) {
		Data[i].forEach(

		function(o) {
			xData.push(o.xVal);
			yData.push(o.yVal);
		})
	}

	//Check if there are explicit ticks specified, and if there are, glom them onto
	//the data streams so that they are certain to lie in the mapped range of the graph width
	var xRange = ($.isArray(ticks[0][0])) ? (xData = (ticks[0][0])) : xData;
	var yRange = ($.isArray(ticks[1][0])) ? ticks[1][0] : ((d3.min(yData) > 0) ? yData.concat(0) : yData);
	//check that the y range at least extends down to 0, because data graphs
	// that don't include 0 for y are misleading
	var xScale = d3.scale.linear().domain(d3.extent(xRange)) //pulls min and max of x
	.rangeRound([0, maxWid]); //x is now a function mapping x-data to the width of the drawing space
	var yScale = d3.scale.linear().domain(d3.extent(yRange)) //pulls min and max of y
	.rangeRound([maxHt, 0]);
	// yScale is a function mapping y-data to height of drawing space. This seems backwards, but svg counts height down from the top, so we want the minimum drawn at height
	//set up the functions that will generate the x and y axes
	var xAxis = d3.svg.axis() //a function that will create the axis and ticks and text labels
	.scale(xScale) //telling the axis to use the scale defined by the function x
	.orient(ticks[0][1]).tickSize(tickheight, 0).tickPadding(3).tickFormat(format);

	$.isArray(ticks[0][0]) ? (xAxis.tickValues(ticks[0][0])) : (xAxis.ticks(ticks[0][0]));
	//test tick type switch
	console.log("xtick specified explicitly?", ticks[0][0], $.isArray(ticks[0][0], xAxis.ticks()));

	var yAxis = d3.svg.axis() //a function that will create the axis and ticks and text labels
	.scale(yScale) //telling the axis to use the scale defined by the function x
	.orient(ticks[1][1]).tickSize(tickheight, 0)
	//sets the height of ticks to tickheight, except for the ends, which don't get ticks
	.tickPadding(3);

	$.isArray(ticks[1][0]) ? (yAxis.tickValues(ticks[1][0])) : (yAxis.ticks(ticks[1][0]));
	//test tick type switch
	console.log("ytick specified explicitly?", ticks[1][0], $.isArray(ticks[1][0]), yAxis.ticks());


	//test data and scale
	Data.forEach(function(o) {
		console.log("max x[" + Data.indexOf(o) + "] value on graph:", xScale(d3.max(o, function(d) {
			return d.xVal;
		})) <= maxWid);
		console.log("min x[" + Data.indexOf(o) + "] value on graph:", xScale(d3.min(o, function(d) {
			return d.xVal;
		})) >= 0);
	});
	//these expressions pull the nested sets of data corresponding to each trace and extract the min and max values for x and y, then make sure those are on the visible graph somewhere given the scales created above, unless explicitly hidden by the hard set ticks.
	Data.forEach(function(o) {
		console.log("max y[" + Data.indexOf(o) + "] value on graph:", yScale(d3.max(o, function(d) {
			return d.yVal;
		})) >= 0);
		console.log("min y[" + Data.indexOf(o) + "] value on graph:", yScale(d3.min(o, function(d) {
			return d.yVal;
		})) <= maxHt);
	});

	var xaxis = graph.append("g").call(xAxis).attr("transform", "translate(0," + ((ticks[0][1] == "bottom") ? height : 0) + ")")
	//move it down if the axis is at the bottom of the graph
	.attr("class", "x axis");
	// make the x-axis label, if it exists
	if (xlabel) {
		xaxis.append("foreignObject").attr("x", 0).attr("y", 4 * tickheight).attr("width", maxWid).attr("height", 50).append("xhtml:body").style("margin", "0px") //this interior body shouldn't inherit margins from page body
		.append("div").attr("class", "axisLabel").html(xlabel) //make the label from value and category 
		;
	}

	var yaxis = graph.append("g").attr("transform", "translate(" + ((ticks[1][1] == "right") ? maxWid : 0) + ",0)") //move it over if the axis is at the bottom of the graph
	.call(yAxis).attr("class", "y axis");

	//test x and y orientation values "top","bottom","left","right" are all that works
	console.log("sensible values for x axis orientation: ", ticks[0][1], ticks[0][1] == "bottom" || ticks[0][1] == "top");
	console.log("sensible values for y axis orientation: ", ticks[1][1], ticks[1][1] == "right" || ticks[1][1] == "left");

	// make the y-axis label, if it exists
	if (ylabel) {
		yaxis.append("foreignObject").attr("transform", "translate(" + ((ticks[1][1] == "left") ? (-1) : 1) * 4 * tickheight + "," + (maxHt) + ") rotate(-90)")
		// move it out of the way of the ticks to left or right depending on axis orientation
		.attr("width", maxHt).attr("height", 50).append("xhtml:body").style("margin", "0px") //this interior body shouldn't inherit margins from page body
		.append("div").attr("class", "axisLabel").html(ylabel) //make the label from value and category 
		;
	}
	// make a clippath, which is used in the case that we zoom or pan the graph dynamically
	graph.append("defs").append("clipPath").attr("id", "clip_" + target + ordinal).append("rect").attr("width", maxWid).attr("height", maxHt);

	//draw the trace(s)
	if (renderType == "lines" || renderType == "lines+points") {
		var line = d3.svg.line()
		//d3 utility function for generating all the point to point paths using the scales set up above
		.interpolate("basis").x(function(d, i) {
			return xScale(d.xVal);
		}).y(function(d, i) {
			return yScale(d.yVal);
		});

		var traces = graph.selectAll("g.traces").data(Data).enter().append("g").attr("class", "trace liteable").attr("id", function(d, i) {
			return "graph" + target + ordinal + "_" + highlitekey[i]
		})
		//name it so it can be manipulated or highlighted later
		.append("svg:path").attr("clip-path", "url(#clip_" + target + ordinal + ")").attr("d", function(d, i) {
			return line(d);
		})
		//use the line function defined above
		.attr("class", function(d, i) {
			return "stroke" + i;
		});
		//pick the colors sequentially off the list
	}


	if (renderType == "points" || renderType == "lines+points") {

		var series = graph.selectAll("g.series").data(Data).enter().append("g").attr("class", function(d, i) {
			return "series fill" + i;
		}).attr("id", function(d, i) {
			return "points" + target + ordinal + "_" + highlitekey[i];
		});

		var points = series.selectAll("g.points") //this selects all <g> elements with class points (there aren't any yet)
		.data(Object) //drill down into the nested Data
		.enter() //this will create <g> elements for every data element, useful in case you want to label them
		.append("g") //create groups
		.attr("class", "liteable").attr("transform", function(d, i) {
			return "translate(" + xScale(d.xVal) + "," + yScale(d.yVal) + ")";
		}).attr("clip-path", "url(#clip_" + target + ordinal + ")")
		//move each symbol to the x,y coordinates
		.append("path").attr("d", d3.svg.symbol().type(function(d, i, j) {
			console.log(j);
			return d3.svg.symbolTypes[j];
		}));
		//pick the shapes sequentially off the list
		//the recursive j index isn't working right now, and I don't know why.  It should, as it does in
		// this example http://jsfiddle.net/kQSGF/8/
	}

	// make the legend, if it exists
	if (legend) {
		var barLength = 30;
		var xOffset = (legend[0][0] == "left") ? 15 : 2 * maxWid / 3;
		var yOffset = (legend[0][1] == "bottom") ? 2 * maxHt / 3 : 2 * margin.top;
		var legendBox = graph.append("g").attr("id", "legend").attr("transform", "translate(" + xOffset + "," + yOffset + ")");
		console.log("sensible lineGraph legend position ", legend[0][0], legend[0][0] == "right" || legend[0][0] == "left");
		console.log("sensible lineGraph legend position ", legend[0][1], legend[0][1] == "top" || legend[0][1] == "bottom");

		legendBox.append("rect").attr("x", -15).attr("y", -2 * margin.top).attr("width", 15 + maxWid / 3).attr("height", barLength * legend[1].length).attr("class", "legendBox");



		var rows = legendBox.selectAll("g.slice") //this selects all <g> elements with class slice (there aren't any yet)
		.data(legend[1]) //associate the data to create stacked slices 
		.enter() //this will create <g> elements for every data element 
		.append("svg:g") //create groups
		.attr("id", function(d, i) {
			return "graph" + target + ordinal + "_" + i
		}) //name it so it can be manipulated or highlighted later
		.attr("transform", function(d, i) {
			return "translate(0," + i * 25 + ")";
		}).attr("class", "liteable").style("opacity", 0.9);
		rows.append("line") //add a line tag to each slice
		.attr("class", function(d, i) {
			return "trace stroke" + i;
		}).attr("x1", 0) //start at the left edge of box
		.attr("x2", barLength) //right edge of text
		;
		rows.append("text") //this is native svg text, it doesn't wrap
		.attr("text-anchor", "start") //left align text 
		.attr("class", "legendLabel").attr("dx", barLength + 2) //offset text to the right beyond leader
		.attr("alignment-baseline", "middle").text(function(d, i) {
			return d;
		}); //get the label from legend array
	}

	if (marks) {
		markers(graph, marks[0], xData, Data[0], xScale, maxHt, marks[1], marks[2]);
		d3.select("#markers").attr("clip-path", "url(#clip_" + target + ordinal + ")");
	}
} //end line chart generator function

function stackedAreaChart(target, ordinal, Data, maxWid, maxHt, margin, scale, ticks, highLiteKey, xlabel, ylabel, legend) { //begin stackedAreaChart generator
	//target is the ordinal of the target div, created by makeGraph
	//ordinal is the integer number of the image within the graph region, so there can be more than one
	//Data: nested arrays with objects containing x and y data, real floating pt.  One array object full of objects (x and y values) for each stacked area.
	//maxWid and maxHt are the width and height, respectively, integers
	//margin is an associative array of top, bottom, left, right integers
	//xScale is a scale function (lin, ord, etc.) to use in scaling the x axis
	//ticks is a 1x2 nested array specifying number of ticks or an explicit array of tick values on each axis, and the orientation (e.g. [[3,"bottom"],[5,"right"]]) 
	//highlitekey is an array of integers relating the traces to other selectable things on the page, optional
	//x and ylabel are text strings, optional
	//legend: array of strings labeling each trace.  Should be same length as yData - optional
	var tickheight = 10;
	var format = d3.format(".1");
	//one decimal on ticks, could have specified % e.g .1%
	//TODO make this a set of options on the function, users will need control
	//full d3 options are specified at https://github.com/mbostock/d3/wiki/Formatting
	var graph = d3.select("#graph_" + target).append("svg:g") //make a group to hold new line chart
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")") // push everything down so text doesn't slop over the top
	.attr("id", function(d, i) {
		return "graph" + target + ordinal + "_"
	}) //name it so it can be manipulated or highlighted later
	;

	//build the x and y scales
	var xData = [],
		yData = [];

	//unwrap the x and y data into a single vector so we can find the extrema
	for (i = 0; i < Data.length; i++) {
		Data[i].forEach(

		function(o) {
			xData.push(o.x);
			//yData.push(o.y);
		})
	}

	Data.forEach(

	function(o) {
		console.log("Even data lengths Data[" + Data.indexOf(o) + "]", o.length, o.length == xData.length / Data.length);
	})

	var negatives = [],
		positives = [],
		negTicks = [],
		posTicks = [];
	xData.forEach(

	function(o) {
		if (o < 0) {
			negatives.push(o);
		} else {
			positives.push(o);
		}
	});

	if ($.isArray(ticks[0][0])) {
		ticks[0][0].forEach(

		function(o) {
			if (o < 0) {
				negTicks.push(Math.abs(o));
			} else {
				posTicks.push(o);
			}
		});
	}
	console.log("minimum negative value converted to positive", d3.min(negatives));



	// set up the stack scale to build sequential paths based on the previous baseline
	var stack = d3.layout.stack().offset("zero");

	var areaLayers = stack(Data);

	var y = d3.scale.linear().domain([0, d3.max(areaLayers, function(layer) {
		return d3.max(layer, function(d) {
			return d.y0 + d.y;
		});
	})])
	//Find the maximum value on the graph by descending into each data array in the calculated stack, summing the respective previous baseline and the latest data value for each x, then finding the max of that
	.range([height, 0]);

	//if the ordinal scale string is specified, use ordinal, otherwise linear scaling
	var xScale = (scale === "ordinal") ? ordScale(xData, [0, maxWid]) : lin(xData, [0, maxWid]);

	var leftPositive = ordScale(negatives, [0, xScale(1)]);
	var rightPositive = d3.scale.ordinal().domain(positives).rangePoints([xScale(1), maxWid]);

	console.log(rightPositive.range(), rightPositive.domain());
	//set up the functions that will generate the x and y axes
	var xAxis = d3.svg.axis() //a function that will create the axis and ticks and text labels
	.scale(rightPositive) //telling the axis to use the scale defined by the function x
	.orient(ticks[0][1]).tickSize(tickheight, 0).tickPadding(3).tickFormat(format);

	var leftXAxis = d3.svg.axis() //a function that will create the axis and ticks and text labels
	.scale(leftPositive) //telling the axis to use the scale defined by the function x
	.orient(ticks[0][1]).tickSize(tickheight, 0).tickPadding(3).tickFormat(format);

	$.isArray(ticks[0][0]) ? (xAxis.tickValues(posTicks) && leftXAxis.tickValues(negTicks)) : (xAxis.ticks(ticks[0][0] - 2) && leftXAxis.ticks(2));


	//test tick type switch
	console.log("xtick specified explicitly?", ticks[0][0], $.isArray(ticks[0][0], xAxis.ticks()));

	var yAxis = d3.svg.axis() //a function that will create the axis and ticks and text labels
	.scale(y) //telling the axis to use the scale defined by the function x
	.orient(ticks[1][1]).tickSize(tickheight, 0)
	//sets the height of ticks to tickheight, except for the ends, which don't get ticks
	.tickPadding(3);

	$.isArray(ticks[1][0]) ? (yAxis.tickValues(ticks[1][0])) : (yAxis.ticks(ticks[1][0]));
	//test tick type switch
	console.log("ytick specified explicitly?", ticks[1][0], $.isArray(ticks[1][0]), yAxis.ticks());


	//test data and scale
	Data.forEach(function(o) {
		console.log("max x[" + Data.indexOf(o) + "] value on graph:", xScale(d3.max(o, function(d) {
			return d.x;
		})) <= maxWid);
		console.log("min x[" + Data.indexOf(o) + "] value on graph:", xScale(d3.min(o, function(d) {
			return d.x;
		})) >= 0);
	});
	//these expressions pull the nested sets of data corresponding to each trace and extract the min and max values for x, then make sure those are on the visible graph somewhere given the scales created above.
	var xaxis = graph.append("g").call(xAxis).attr("transform", "translate(0," + ((ticks[0][1] == "bottom") ? height : 0) + ")") //move it down if the axis is at the bottom of the graph
	.attr("class", "x axis");
	// make the x-axis label, if it exists
	var leftxaxis = graph.append("g").call(leftXAxis).attr("transform", "translate(0," + ((ticks[0][1] == "bottom") ? height : 0) + ")") //move it down if the axis is at the bottom of the graph
	.attr("class", "x axis");
	// make the x-axis label, if it exists
	if (xlabel) {
		xaxis.append("foreignObject").attr("x", maxWid / 4).attr("y", 3 * tickheight).attr("width", maxWid / 2).attr("height", 50).append("xhtml:body").style("margin", "0px") //this interior body shouldn't inherit margins from page body
		.append("div").attr("class", "axisLabel").html(xlabel) //make the label from value and category 
		;
	}

	var yaxis = graph.append("g").attr("transform", "translate(" + ((ticks[1][1] == "right") ? maxWid : 0) + ",0)") //move it over if the axis is at the bottom of the graph
	.call(yAxis).attr("class", "y axis");

	//test x and y orientation values "top","bottom","left","right" are all that works
	console.log("sensible values for x axis orientation: ", ticks[0][1], ticks[0][1] == "bottom" || ticks[0][1] == "top");
	console.log("sensible values for y axis orientation: ", ticks[1][1], ticks[1][1] == "right" || ticks[1][1] == "left");

	// make the y-axis label, if it exists
	if (ylabel) {
		yaxis.append("foreignObject").attr("transform", "translate(" + ((ticks[1][1] == "left") ? (-1) : 1) * 3 * tickheight + "," + (maxHt) + ") rotate(-90)")
		// move it out of the way of the ticks to left or right depending on axis orientation
		.attr("width", maxHt).attr("height", 50).append("xhtml:body").style("margin", "0px") //this interior body shouldn't inherit margins from page body
		.append("div").attr("class", "axisLabel").html(ylabel) //make the label from value and category 
		;
	}

	//draw the stacked areas
	var area = d3.svg.area().x(function(d) {
		return xScale(d.x);
	}).y0(function(d) {
		return y(d.y0);
	}).y1(function(d) {
		return y(d.y0 + d.y);
	});
	//this last line will add the previous stacked baseline to the next layer
	graph.append("g").attr("class", "traces").selectAll("path")
	//we're creating paths which don't exist yet, but will be created as they are bound to data
	.data(areaLayers)
	//use the stacks created before
	.enter().append("path").attr("class", function(d, i) {
		return "liteable fill" + i;
	}).style("opacity", 0.8).attr("id", function(d, i) {
		return "areaGraph" + target + ordinal + "_" + highLiteKey[i];
	}).attr("d", area);
	//create the data, d, for each path using the function area to make the right calculations
	// make the legend, if it exists
	if (legend) {
		var barLength = 30;
		var xOffset = (legend[0][0] == "left") ? 15 : 2 * maxWid / 3;
		var yOffset = (legend[0][1] == "bottom") ? 2 * maxHt / 3 : 2 * margin.top;

		var legendBox = graph.append("g").attr("id", "legend").attr("transform", "translate(" + xOffset + "," + 2 * margin.top + ")");
		console.log("sensible values for legend position ", legend[0][0], legend[0][0] == "right" || legend[0][0] == "left");

		legendBox.append("rect").attr("x", -15).attr("y", -2 * margin.top).attr("width", maxWid / 3).attr("height", barLength * legend[1].length).attr("class", "legendBox");

		var rows = legendBox.selectAll("g.slice") //this selects all <g> elements with class slice (there aren't any yet)
		.data(legend[1]) //associate the data to create stacked slices 
		.enter() //this will create <g> elements for every data element 
		.append("svg:g") //create groups
		.attr("id", function(d, i) {
			return "graph" + target + ordinal + "_" + i
		}) //name it so it can be manipulated or highlighted later
		.attr("transform", function(d, i) {
			return "translate(0," + i * 25 + ")";
		}).attr("class", "liteable").style("opacity", 0.9);
		rows.append("line") //add a line tag to each slice
		.attr("class", "trace").attr("x1", 0) //start at the left edge of box
		.attr("x2", barLength) //right edge of text
		.attr("stroke", function(d, i) {
			return graphColors[i];
		});
		rows.append("text") //this is native svg text, it doesn't wrap
		.attr("text-anchor", "start") //left align text 
		.attr("class", "legendLabel").attr("dx", barLength + 2) //offset text to the right beyond leader
		.attr("alignment-baseline", "middle").text(function(d, i) {
			return d;
		}); //get the label from legend array
	}
} //end stackedAreaChart generator function

function choroplethMap(target, ordinal, Data, maxWid, maxHt, margin, highLiteKey, legend) { //begin stackedAreaChart generator
	//target is the ordinal of the target div, created by makeGraph
	//ordinal is the integer number of the image within the graph region, so there can be more than one
	//Data: nested array with objects containing choropleth key with name key,
	// an integer, should match the highlitekey and be ordinal for use as an array index
	//and a path for the region outline in SVG (TODO update to use GeoJSON).  
	//maxWid and maxHt are the width and height, respectively, integers
	//margin is an associative array of top, bottom, left, right integers
	//highLiteKey is an array of integers relating the traces to other selectable things on the page, optional
	//legend: 1x2 array, first element is a 1x2 set of strings specifying "left/right" and "top/bottom", second 
	// element is an array of strings labeling each trace.  Should be same length as Data - optional
	var tickheight = 10;
	var graph = d3.select("#graph_" + target).append("svg:g") //make a group to hold new line chart
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")") // push everything down so text doesn't slop over the top
	.attr("id", function(d, i) {
		return "graph" + target + ordinal + "_"
	}) //name it so it can be manipulated or highlighted later
	;

	//make a group to hold all the paths
	graph.append("g").attr("class", "traces").selectAll("path")
	//we're creating paths which don't exist yet, but will be created as they are bound to data
	.data(Data).enter().append("path").attr("class", function(d, i) {
		return "liteable fill" + d3.values(d)[0];
	}).style("opacity", 0.8).attr("id", function(d, i) {
		return "map" + target + ordinal + "_" + d3.values(d)[0];
	}).attr("d", function(d, i) {
		return d3.values(d)[1];
	});
	//create the data, d, for each path using the function area to make the right calculations
	// make the legend, if it exists
	if (legend) {
		var boxLength = 20;
		var xOffset = (legend[0][0] == "left") ? 15 : 2 * maxWid / 3;
		var yOffset = (legend[0][1] == "bottom") ? 2 * maxHt / 3 : 2 * margin.top;
		var legendBox = graph.append("g").attr("id", "legend").attr("transform", "translate(" + xOffset + "," + yOffset + ")");
		console.log("sensible values for map legend horizontal position ", legend[0][0], legend[0][0] == "right" || legend[0][0] == "left");
		console.log("sensible values for map legend vertical position ", legend[0][1], legend[0][1] == "top" || legend[0][1] == "bottom");

		legendBox.append("rect").attr("x", -15).attr("y", -2 * margin.top).attr("width", 10 + maxWid / 3).attr("height", 28 * legend[1].length).attr("class", "legendBox");

		var rows = legendBox.selectAll("g.slice") //this selects all <g> elements with class slice (there aren't any yet)
		.data(legend[1]) //associate the data to create stacked slices 
		.enter() //this will create <g> elements for every data element 
		.append("svg:g") //create groups
		.attr("id", function(d, i) {
			return "legend" + target + ordinal + "_" + i
		}) //name it so it can be manipulated or highlighted later
		.attr("transform", function(d, i) {
			return "translate(0," + (legend[1].length - i - 1) * 25 + ")";
		}).attr("class", "liteable").style("opacity", 0.9);
		rows.append("rect") //add a line tag to each slice
		//.attr("class","trace")
		.attr("x", 0).attr("y", -10) //start at the left edge of box
		.attr("width", boxLength).attr("height", boxLength).attr("class", function(d, i) {
			return "fill" + i;
		});
		rows.append("text") //this is native svg text, it doesn't wrap
		.attr("text-anchor", "start") //left align text 
		.attr("class", "legendLabel").attr("dx", boxLength + 4) //offset text to the right beyond leader
		.attr("alignment-baseline", "middle").text(function(d, i) {
			return d;
		}); //get the label from legend array
	}
} //end stackedAreaChart generator function

function markers(target, markData, xData, allData, scale, length, highLiteKey, draggable) { //begin marker generator
	//target is the d3 selection into which the markers will be drawn, created by another graph routine
	//markData: associative array of x/y values for markers
	//xData,allData: the full data for the graph
	//scale: a function that is the scale for the axis on which the markers are pinned
	//length: numeric length of the markers, usually the height or width of the enclosing 
	//highlitekey is an array of integers relating the markers to other selectable things on the page
	//draggable - boolean that says whether to allow the user to drag the markers to other locations on
	//the graph, optional default is false
	var labelHt = 60,
		labelWid = 150;
	var markers = target.append("svg:g") //make a group to hold markers 
	.attr("id", "markers").selectAll("g.marker") //this selects all marker groups (there aren't any yet)
	.data(markData) //associate the data to create the right number of markers
	.enter() //this will create <g> elements for every marker data element so we can have a marker and an associated label
	.append("g").attr("class", "marker").attr("transform", function(d) {
		return "translate(" + scale(d.xVal ? d.xVal : d) + ",0)";
		//move each group to the data point for the marker
		//if there is an object, then strip off the xVal for the location
		//TODO x or y logic
	}).attr("id", function(d, i) {
		return "marker_" + highLiteKey[i];
	});

	if (draggable) {
		markers.call(dragUpdate(xData, allData, [0, length], scale)); //to make the markers drag and update
	}
	console.log("markers are ", markData);

	markers.append("line") //vertical line
	.attr("class", "markers").attr("y1", function(d, i) {
		return i * labelHt + 30;
	}).attr("y2", length) //top of line is on the bottom of the label box, bottom of
	//line is at the bottom of the graph
	//TODO x or y logic
	//TODO respond to axis top/bottom settings
	;

	//draw data labels on the markers		
	this.markText = markers.append("foreignObject").attr("x", -labelWid / 2).attr("y", function(d, i) {
		return (labelHt + 10) * (i);
	}) //offset down on text box 
	.attr("width", labelWid).attr("height", labelHt).append("xhtml:body").style("margin", "2px") //this interior body shouldn't inherit margins from page body
	.append("div").attr("class", "markerLabel").html(function(d, i) {
		return d.yVal ? d.yVal : d;
	}) //make the label from value and category 
	;

} //end marker generator function

function areaChart(target, ordinal, xData, yData, maxWid, maxHt, margin, color, highlitekey) { //begin area graph generator
	//target is the ordinal of the target div, created by makeGraph
	//ordinal is the integer number of the image within the graph region, so there can be more than one
	//xyData: arrays of values, real floating pt. One area chart only.
	//maxWid and maxHt are the width and height, respectively, integers
	//margin is an associative array of top, bottom, left, right integers
	//ticks is a 1x2 array specifying number of ticks on each axis
	//highlitekey is an array of integers relating the traces to other selectable things on the page, optional
	//color is a string hex value preceded by #
	//USE NOTE: this function is written to produce the colored area only.  Overlay with a line chart to get axes and an outline.
	var tickheight = 10;
	var graph = d3.select("#graph_" + target).append("svg:g") //make a group to hold new line chart
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")") // push everything down so text doesn't slop over the top
	.attr("id", function(d, i) {
		return "graph" + target + ordinal + "_"
	}) //name it so it can be manipulated or highlighted later
	;

	//build the x and y scales
	var x = d3.scale.linear().domain(d3.extent(xData)) //pulls min and max of x
	.rangeRound([0, maxWid]); //x is now a function mapping x-data to the width of the drawing space
	var y = d3.scale.linear().domain(d3.extent(yData)) //pulls min and max of y
	.rangeRound([maxHt, 0]);
	// y is a function mapping y-data to height of drawing space. This seems backwards, but svg counts height down from the top, so we want the minimum drawn at height
	var area = d3.svg.area()
	//	.interpolate("step-before")
	.x(function(d, i) {
		return x(xData[i]);
	}).y1(function(d) {
		return y(d);
	}).y0(function(d) {
		return y(maxHt);
	});
	//x is just the x value of the data that eventually gets fed in, 
	//y1 is the y value (top of the area), and y0 is the bottom of the area, so 
	//we can make a closed path.

	//draw the area
	var areaDraw = graph.append("svg:path").attr("class", "area").attr("d", area(yData)).attr("fill", color).attr("opacity", 0.5);

	if (highlitekey) {
		d3.selectAll(".area").attr("id", function(d, i) {
			return "graph" + target + ordinal + "_" + highlitekey[i];
		})
	} //name it 
} //end area chart generator function

function stackedBarChart(target, ordinal, catData, valData, maxWid, maxHt, margin, xlabel) { //begin stacked bar chart generator
	var boxWidth = maxWid / 3;
	var leaderOffset = maxWid / 7;

	var graph0 = d3.select("#graph_" + target).append("svg:g") //make a group to hold new stacked chart
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")") // push everything down so text doesn't slop over the top
	//.attr("class","liteable")
	.attr("id", function(d, i) {
		return "graph" + target + ordinal + "_"
	}) //name it so it can be manipulated or highlighted later
	;

	// make the x-axis label, if it exists
	if (xlabel) {
		graph0.append("foreignObject").attr("x", 0).attr("y", maxHt + tickheight) //offset down on text box 
		.attr("width", maxWid).attr("height", 50).append("xhtml:body").style("margin", "0px") //this interior body shouldn't inherit margins from page body
		.append("div").attr("class", "axisLabel").html(xlabel) //make the label from value and category 
		;
	}

	var slices = graph0.selectAll("g.slice") //this selects all <g> elements with class slice (there aren't any yet)
	.data(valData) //associate the data to create stacked slices 
	.enter() //this will create <g> elements for every data element 
	.append("svg:g") //create groups
	.attr("id", function(d, i) {
		return "graph" + target + ordinal + "_" + i
	}) //name it so it can be manipulated or highlighted later
	.attr("class", "liteable").style("opacity", 0.9);
	//build an array of offsets up from the bottom of graph
	var stackPosition = [];
	stackPosition[0] = d3.sum(valData) - valData[0];
	for (i = 1; i < valData.length; i++) {
		stackPosition[i] = stackPosition[i - 1] - valData[i];
	}

	var stack = d3.scale.linear().domain([0, d3.sum(valData)]) // total domain is zero to sum of all percents
	.range([0, maxHt]); //stack is a function that scaled percent to height of graph
	//test data and scale
	console.log("values sum to 100%:", d3.sum(valData), d3.sum(valData) == 100);
	console.log("First box is at maximum displacement:", stack(stackPosition[0] + valData[0]) == maxHt);

	//a scale for the positions of the slice labels
	var labelPos = d3.scale.ordinal().domain(catData) //just use the array of data labels
	.rangeRoundBands([maxHt, 0], .5);

	var box = slices.append("svg:rect") //make the boxes now that all the slices exist
	.attr("width", boxWidth) // what looked good to me
	.attr("height", function(d, i) {
		return stack(d);
	}) //returns scaled percent value of each slice
	.attr("class", function(d, i) {
		return "fill" + i;
	}) //this works because the bound data is the same length as the array of colors, but really they ought to be packed into a single JSON data structure so they are associated.
	.attr("transform", function(d, i) {
		return "translate(0," + (stack(stackPosition[i])) + ")";
	}); // move each box and label group down to stacked position 
	slices.append("line") //add a line tag to each slice
	.attr("x1", boxWidth) //start at the left edge of box
	.attr("x2", boxWidth + leaderOffset - 2) //right edge of text
	.attr("y1", function(d, i) {
		return stack(stackPosition[i] + valData[i] / 2);
	}) //offset down to center of box 
	.attr("y2", function(d, i) {
		return labelPos(catData[i]);
	}) //offset down to label 
	.style("stroke", "#000000");
	//var labels = slices.append("text") //this is native svg text, but it doesn't wrap
	//        .attr("text-anchor", "start") //left align text 
	//		.attr("class","graph")
	//		.attr("dx", boxWidth+leaderOffset) //offset text to the right beyond leader
	//		.attr("alignment-baseline","middle")
	//		.attr("dy", function(d,i) { return labelPos(catData[i]);
	//			}) //offset down to center of box 
	//        .text(function(d,i){return valData[i]+"% "+ catData[i];}); //get the label from category array
	// make the labels for each stacked piece
	slices.append("foreignObject").attr("x", boxWidth + leaderOffset).attr("y", function(d, i) {
		return labelPos(catData[i]) - 10;
	}) //offset down on text box 
	.attr("width", maxWid / 2).attr("height", maxHt / catData.length).append("xhtml:body").style("margin", "0px") //this interior body shouldn't inherit margins from page body
	.append("div").attr("class", "graphLabel").html(function(d, i) {
		return valData[i] + "% " + catData[i];
	}) //make the label from value and category 
	;

} //end bar chart generator function
//Highlighter function is for highlighting one or more graph regions when an event triggers it


function highlighter(currentRegion, IDList, prevRegion) {
	//currentRegion is a selection of the currently clicked/touched region
	//IDlist is an array of strings - all linked container names on this highlight cycle for this page
	//prevRegions is a selection of the previously clicked/touched region - optional
	var regID = currentRegion.attr("id");
	//if the selected current region doesn't have an _ordinal in it's ID, then bail
	if (regID.search("_") == -1) {
		console.log("not an ordered ID");
		return;
	}
	//then strip off the relational highlight index of the selected region
	var index = regID.substr(regID.indexOf("_") + 1, regID.length);
	// if there is a previous region, turn off the old highlight
	if (prevRegion) {
		//get the ordinal index of the ID on the old selection
		var prevRegID = prevRegion.attr("id");
		var pIndex = prevRegID.substr(prevRegID.indexOf("_") + 1, prevRegID.length);

		IDList.forEach(function(o) {
			
			console.log("Turning off old highlights: ", d3.selectAll(o + "_" + pIndex).attr("id"));
				
			//For each identified highlightable item in the collection IDList, concatenate 
			//the collection name with _<index>, then transition back to unhighlighted state
			d3.selectAll("#legend").selectAll(o + "_" + pIndex).attr("fill", "#F00");
			var oldHotReg = d3.selectAll(o + "_" + pIndex).transition().duration(200);
			
		 
			//.attr("transform","scale(1,1)")
			oldHotReg.attr("fill", "#000")
			.style("opacity", 0.8)
			.style("color", "#000")
			.style("font-weight", "normal")
			//.style("letter-spacing","normal")
			.style("background-color", "transparent")
			.style("border", "0px")
			.selectAll(".graphLabel")
			.style("color", "#000")
			.style("font-weight", "normal")
			.style("color", "#333").style("border", "0px")
			.style("background-color", "transparent");
			
			//var lines = oldHotReg.select(".trace");
			//var sWidth = +d3.select(o + "_" + pIndex).select(".trace").style("stroke-width").replace('px', '');
				//gets stroke width and coerces any values with px into numbers
			//oldHotReg.selectAll(".trace").style("stroke-width", sWidth/1.5);
			
			oldHotReg
			.selectAll(".markerLabel")
			.style("color", "#000")
			.style("font-weight", "normal")
			.style("border", "solid 1px #5bafe4")
			.style("background-color", "white");
		});
	}

	// highlight up the currently selected related regions with same index in IDList
	IDList.forEach(function(o) {
	
		console.log("objects are found according to IDList: ", d3.selectAll(o + "_" + index).attr("id"));
		
		var hotReg = d3.selectAll(o + "_" + index).transition().duration(100);
		//.attr("transform","scale(1.005,.9995)")
		//scaling was abandoned because it makes data incorrect in graph placement and text hard to read
		hotReg.style("stroke", "#333")
		.style("opacity", 1)
		.style("font-weight", "500")
		//this slight bolding works in svg text, but is not really visible
		//in table text. On the up side, it doesn't change width so much,
		//so the letter spacing isn't necessary.
		//.style("letter-spacing","-.07em")
		.style("color", "#1d456e")
		.style("border", "2px solid #bce8f1")
		.style("background-color", "#E3EFFE");
		
		hotReg.selectAll(".graphLabel")
		.style("color", "#1d456e")
		.style("font-weight", "500")
		.style("border", "2px solid #bce8f1")
		.style("background-color", "#e3effe");
		
		hotReg.selectAll(".markerLabel")
			.style("color", "#1d456e")
			.style("font-weight", "600")
			.style("border", "solid 2px #bce8f1;")
			.style("background-color", "#e3effe");
			
	  //  if(d3.select(o + "_" + index).select(".trace")){
		//	var sWidth = +d3.selectAll(o + "_" + index).select(".trace").style("stroke-width").replace('px', '');
				//gets stroke width and coerces any values with px into numbers
		//		hotReg.selectAll(".trace").style("stroke-width", sWidth*1.5);
		//		}
	
	});
	console.log("returning current region: ",currentRegion.attr("id"));
	return currentRegion;
} //end highlighter function

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

//Drag to spot with optional sticky limits
function dragNDrop() {
	//xStops and yStops are the edges on which you'd like the dragged item to snap
	//functon should use the local scale of the graph, which is inherited from
	//the calling graph object.  If no scale is defined in the current context, this won't work.
	

	return d3.behavior.drag()
	//.origin(Object)
	.on("dragstart", function(d) {
		highlighter(d3.select(this),linkedRegions);
	
		//record the starting position as the nearest known data point corresponding
		//to the current click. Must use parent container because click position in nested groups
		//is wonky
		//d3.select(this).transition().duration(10)
		//.attr("transform", "translate(" + xScale(loc[0]) + "," + loc[1] + ")");
		//jump the dragged object up a little so you know you've got what you intended
	})
	.on("drag", function(d, i) {
		var loc = d3.mouse(document.getElementById("graph_"+target));
		//do this in reference to the SVG container - everything else gets the coordinates wrong
		xLoc = loc[0]-margin.left;
		yLoc = loc[1]-margin.top;
		
		d3.select(this)
		.attr("transform", "translate(" + xLoc +","+yLoc+")");
		//move the target with the mouse or finger - these work on touch
	
	})
	.on("dragend", function(d, i) {
		xLoc = xStops?xScale(snapTo(xStops,[0,maxWid])(xLoc)):xLoc;
		if(xStops){console.log("snap to x ", xScale(snapTo(xStops,[0,maxWid])(xLoc)));}
		yLoc = yStops?yScale(snapTo(yStops,[maxHt,0])(yLoc)):yLoc;
		if(yStops){console.log("snap to y ", yScale(snapTo(yStops,[maxHt,0])(yLoc)));}
		
		d3.select(this).attr("transform", "translate("+xLoc +","+yLoc+")");
		//dtrop it back down to normal position and pin it at the last location 
		//if Stops are specified on the image, then snap to the grid positions specified
		//by the x and y stops when the user lets go.  It's assumed that the stops are specified
		//according to some local scale in place for a graph underneath, so the results are 
		//scaled with xScale and yScale.
	
	});
} // end dragNDrop function

/* -----------------------------------------------
Student feedback and scoring functions
-------------------------------------------------*/

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
