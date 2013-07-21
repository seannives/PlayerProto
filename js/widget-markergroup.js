/* **************************************************************************
 * $Workfile:: widget-MarkerGroup.js                                        $
 * *********************************************************************/ /**
 *
 * @fileoverview Implementation of the {@link MarkerGroup} bric.
 *
 * The MarkerGroup bric draws a group of labels at specified locations
 * in an {@link SVGContainer}.
 *
 * Created on		June 26, 2013
 * @author			Leslie Bondaryk
 *
 * @copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/

// Sample Label constructor configuration
(function()
{
	var markerConfig = {
			id: "markers0",
			marks: [
			{x: 8, y: 20, label: "An early year"},
			{x: 20, label: "a later year", key: "liteup"},
			{x: 45, label: "the latest year with a long description"}
			],
			type: "x"
		};
});

/**
 * Information needed to process a label in a MarkerGroup.
 *
 * @typedef {Object} LabelConfig
 * @property {string|undefined}	id	- string with ID, optional
 * @property {Array.<nummber, number|undefined, string|undefined>}
 *						xMarks	- An array containing objects with x,y 
 * 								coordinates for each marker, a label,
 * 								if desired, and a key, if desired
 * @property {string|undefined}	type - string with orientation "x" (default) or "y"
 * @todo we need a better way to deal w/ the width, 
 *									than hard-coding it. -lb
 */
	
/* **************************************************************************
 * MarkerGroup                                                         */ /**
 *
 * The MarkerGroup widget draws a group of markers at specified locations
 * in an SVGContainer.
 * The MarkerGroup is usually used on top of another bric which provides the
 * data extents and scale functions to convert data points to pixel positions
 * in the container. If the scale functions are not set before this bric is
 * drawn, it assumes the data extents are 0 - 1.
 *
 * @constructor
 * @implements {IWidget}
 *
 * @param {Object}		config			-The settings to configure this MarkerGroup
 * @param {string|undefined}
 * 						config.id		-String to uniquely identify this MarkerGroup.
 * 										 if undefined a unique id will be assigned.
 * @param {Array.<LabelConfig>}
 *						config.markers	-An array describing each marker in the group.
 *										 
 * @param {string}		config.type		-string specifying orientation, x or y
 * @param {EventManager=}
 * 						eventManager	-The event manager to use for publishing events
 * 										 and subscribing to them.
 *
 * @todo: role: a string which is one of "label", "distractor".
 * @todo: we need some sort of autowidth intelligence on these, but I don't
 * know how to reconcile that with giving user control over wrapping
 ****************************************************************************/
function MarkerGroup(config, eventManager)
{
	/**
	 * A unique id for this instance of the MarkerGroup widget
	 * @type {string}
	 */
	this.id = getIdFromConfigOrAuto(config, MarkerGroup);

	/**
	 * Array of markers to be graphed, where each marker is an object in an array
	 * @type {Array.<Array.<{x: number, y: number, label: string, key: string}>>}
	 * @example
	 *   // 2 markers, first numerical, second shows string label:
	 *   [{x: -1.2, y: 2.0}, {x: 5, y: 5, label: "big data"}]
	 */
	this.marks = config.marks;

	/**
	 * The type specifies an adornment on each label or no adornment if it is not specified.
	 * It must be one of:
	 *
	 *  - "bullets" for a solid bullet adornment
	 *  - "numbered" for a bullet containing the index number adornment
	 *
	 * @type {string|undefined}
	 */
	this.type = config.type;
	
	/**
	 * The event manager to use to publish (and subscribe to) events for this widget
	 * @type {EventManager}
	 */
	this.eventManager = eventManager;

	/**
	 * The event id published when a label in this group is selected.
	 * @const
	 * @type {string}
	 */
	this.selectedEventId = this.id + '_markerSelected';
	
	/**
	 * The event details for this.selectedEventId events
	 * @typedef {Object} SelectedEventDetails
	 * @property {string|number} selectKey	-The key associated with the selected label if it has one,
	 *										 otherwise the label's index within the group.
	 */
	
	/**
	 * The scale functions set explicitly for this MarkerGroup using setScale.
	 * If these are not null when draw is called they will be used to position
	 * the labels. Otherwise a data extent of [0,1] will be mapped to the given
	 * container area.
	 * @type Object
	 * @property {function(number): number}
	 *						xScale	-function to convert a horizontal data offset
	 *								 to the pixel offset into the data area.
	 * @property {function(number): number}
	 *						yScale	-function to convert a vertical data offset
	 *								 to the pixel offset into the data area.
	 * @private
	 */
	this.explicitScales_ = {xScale: null, yScale: null};
	
	/**
	 * Information about the last drawn instance of this line graph (from the draw method)
	 * @type {Object}
	 */
	this.lastdrawn =
		{
			container: null,
			size: {height: 0, width: 0},
			markerGroup: null,
			xScale: null,
			yScale: null,
			markerCollection: null
		};
} // end of Label constructor

/**
 * Prefix to use when generating ids for instances of MarkerGroup.
 * @const
 * @type {string}
 */
MarkerGroup.autoIdPrefix = "lblg_auto_";

/* **************************************************************************
 * MarkerGroup.draw                                                    */ /**
 *
 * Draw this MarkerGroup in the given container. Draw is meant to be called
 * initially and once per page/instance in the case where markers don't yet exist. 
 *
 * @param {!d3.selection}
 *					container	-The container svg element to append the labels element tree to.
 * @param {Size}	size		-The height and width in pixels for the label
 *
 ****************************************************************************/
MarkerGroup.prototype.draw = function(container, size)
{
	this.lastdrawn.container = container;
	this.lastdrawn.size = size;
	var xScale = this.lastdrawn.xScale ,
		yScale = this.lastdrawn.yScale;
	this.setLastdrawnScaleFns2ExplicitOrDefault_(size);

	var that = this;

	var markerContainer = container.append("g") //make a group to hold markers
		.attr("class", "bricMarkers")
		.attr("id", this.id);
		
	this.lastdrawn.markerGroup = markerContainer;

	/*
	This puts a solid bar above the graph, as I have seen in some UX designs.
	Not sure it's appropriate for something that slides though.
	markerContainer.append("rect")
		.attr("width",size.width)
		.attr("height", 0.35 * size.height)
		//we need to move this above the graph.  The 25% assumes
		//that the containing svg is drawn with the graph occupying the 
		//bottom 80%. TODO: make this work on all sides, not just top
		.attr("y", - 0.35 * size.height - markerHeight)
		.attr("class", "fill0");
		*/

	// Draw the data (each marker line and label)
	this.drawData_();

	
}


/* **************************************************************************
 * MarkerGroup.redraw                                                  */ /**
 *
 * Redraw the data as it may have been modified. It will be
 * redrawn into the same container area as it was last drawn.
 *
 ****************************************************************************/
MarkerGroup.prototype.redraw = function ()
{
	
	this.drawData_();
};

/* **************************************************************************
 * MarkerGroup.drawWidget_                                             */ /**
 *
 * Draw the given child widget in this charts's data area.
 * This chart must have been drawn BEFORE this method is called or
 * bad things will happen.
 *
 * @private
 *
 * @todo implement some form of error handling! -mjl
 *
 ****************************************************************************/
MarkerGroup.prototype.drawWidget_ = function (widget)
{
	widget.setScale(this.lastdrawn.xScale, this.lastdrawn.yScale);
	widget.draw(this.lastdrawn.axes.group, this.lastdrawn.dataRect.getSize());
};

 /* **************************************************************************
 * markerGroup.redrawWidget_                                            */ /**
 *
 * Redraw the given child widget.
 * This child widget must have been drawn BEFORE this
 * method is called or bad things will happen.
 *
 * @private
 *
 * @todo implement some form of error handling! -mjl
 *
 ****************************************************************************/
MarkerGroup.prototype.redrawWidget_ = function (widget)
{
	widget.redraw();
};


/* **************************************************************************
 * markerGroup.drawData_                                               */ /**
 *
 * Draw the marker data (overwriting any existing data).
 *
 * @private
 *
 ****************************************************************************/
 
 MarkerGroup.prototype.drawData_ = function ()
{
	// local var names are easier to read (shorter)

	var size = this.lastdrawn.size;
	var xScale = this.lastdrawn.xScale;
	var yScale = this.lastdrawn.yScale;
	var markerGroup = this.lastdrawn.markerGroup;

	var markerHeight = 8;
	var that = this;
	
	
	//label height is currently set to 25% of the box height
	var labelHt = d3.round(0.25 * size.height), labelWid = size.width / (this.marks.length + 1);
	//TODO: probably shouldn't hard set these, but I'm not sure how to set wrapping otherwise.
	//These look marginally ok. The 25% assumes that the containing svg is drawn with the graph 
	//occupying the bottom 80%. Even this is flawed, as it uses the graph data rectangle
	//and not the whole graph rendering rectangle.

		
	// bind the marker group collection to the data
	// the collection is used to highlight and unhighlight
	var markerCollection = markerGroup.selectAll("g.marker").data(this.marks);

	// create <g> elements for every marker
	markerCollection.enter() 
		//groups are good because we can have a marker line, an intersection dot, 
		//and a label, and anything else
		//that requires the same relative coordinates.
		.append("g").attr("class", "marker");
	
	//on redraw, get rid of any series which now have no data
	markerCollection.exit().remove();  

	markerCollection.attr("transform", function(d) {
		
		// check orientation on the markers, and move the 
		// group accordingly.  The numbers are used within the local brix scale.
		// If the markers are horizontal from the y axis, move the group to the 
		// y data value vertically, but stay at zero horizontally.  Otherwise, 
		// move the group to the x data value horizontally, but stay at 0 vertically.
		// TODO: logic here is a little flawed, it assumes that the axes is on the 
		// bottom and left of the graph - lb
		var xVal = d3.round(that.lastdrawn.xScale(that.type === "y" ? 0 : d.x));
		var yVal = d3.round(that.type === "y" ? that.lastdrawn.yScale(d.y) : 0);

		return attrFnVal("translate", xVal, yVal);
		//move each group to the data point specified for the marker
	});


	//draw the marker lines for each data point
	markerCollection.append("line") 
		//within each group, always start at x=0
		.attr("x1", 0)
		.attr("x2", 
		//if the markers are horizontal from the y axis, then the 
		//second x point is the full width of the box.  Otherwise,
		//it stays at 0.
			  (that.type === "y") ? that.lastdrawn.xScale(size.width) : 0)
		//y starts at the top of the box, 0 pixels at top in SVG
		.attr("y1", 0)
		//if the markers are horizontal from the y axis, then the 
		//second y point is also 0.  Otherwise, it's the full height of the graph rectangle.
		.attr("y2", that.type === "y" ? 0 : size.height);


	//draw the horizontal or vertical marker line
	markerCollection.append("line") 
		.attr("class", "markers")
		.attr("x1", 0)
		.attr("x2", 
		//if the markers are horizontal from the y axis, then the 
		//second x point is the full width of the box.  Otherwise,
		//it stays at 0.
			(this.type === "y") ? this.lastdrawn.xScale(size.width) : 0)
		//starts at the top of the box, 0 pixels at top in SVG
		.attr("y1", 0)
		.attr("y2", 
		//if the markers are horizontal from the y axis, then the 
		//second y point is 0.  Otherwise, it's the full height of the graph rectangle.
			(this.type === "y") ? 0 : this.lastdrawn.yScale(0));
		
		
	//draw the marker arrows (triangles)
		markerCollection.append("polygon") 
		.attr("points", 
			//if the markers are horizontal from the y axis, then the 
			//arrows point to the left on the right side.  Otherwise 
			//they point down from the top.  
			//TODO: accomodate other axis positions,since these assume top/right marker
			//placement.
			 (this.type === "y") ? 	"8,-8 8,8 " +  -markerHeight + ",0" : 
			 						"-8, " +  -markerHeight + " 8, " +  -markerHeight + " 0,6");

	//draw the marker boxes (rectangles)
		markerCollection.append("rect") 
		.attr("width", labelWid)
		.attr("height", labelHt)
		//we need to move this above the graph.  The 25% assumes
		//that the containing svg is drawn with the graph occupying the 
		//bottom 80%. TODO: make this work on all sides, not just top
		.attr("y", - labelHt - markerHeight + 1)
			//if the markers are horizontal from the y axis, then the 
			//arrows point to the left on the right side.  Otherwise 
			//they point down from the top.  
			//TODO: accomodate other axis positions,since these assume top/right marker
			//placement.
			//x position puts it at the start of the downward triangle
			//this also only works for marker labels on top
		.attr("x", -8);
		
  
	//draw data labels on the markers
	markerCollection.append("foreignObject")
	// if y markers, x value is all the way on the right side, otherwise, 
	// back up to the start of the down arrow
		.attr("x", this.type === "y" ? size.width : -8)
	// if y markers, y value is at the very top of the marker group, at 0, 
	// otherwise, move the label up to start at the top of the box, above
	// the line, plus some (-5)
		.attr("y", this.type === "y" ? 0 : (-labelHt - 5))
		.attr("width", labelWid)
		.attr("height", labelHt)
		.append("xhtml:body")
		//this interior body shouldn't inherit margins from page body
			.style("margin", "2px") 
			.append("div").attr("class", "markerLabel")
			.html(function(d, i) {
				// make the label from value, or, if a label is 
				// specified, use just that
					return d.y ? ("x: " + d.x + "<br> y: " + d.y) : d.label;
			}); 
		
	// autokey entries which have no key with the data index
	markerCollection.each(function (d, i) { 
					// if there is no key assigned, make one from the index
					d.key = 'key' in d ? d.key : i.toString();
					});
	

	
	markerCollection.on('click',
				function (d, i)
				{
					that.eventManager.publish(that.selectedEventId, {selectKey: d.key});
				});
				
	this.lastdrawn.markerCollection = markerGroup.selectAll("g.widgetMarker");

}; // end of MarkerGroup.draw()

/* **************************************************************************
 * MarkerGroup.setScale                                                */ /**
 *
 * Called to preempt the normal scale definition which is done when the
 * widget is drawn. This is usually called in order to force one widget
 * to use the scaling/data area calculated by another widget.
 *
 * @param {function(number): number}
 *						xScale	-function to convert a horizontal data offset
 *								 to the pixel offset into the data area.
 * @param {function(number): number}
 *						yScale	-function to convert a vertical data offset
 *								 to the pixel offset into the data area.
 *
 ****************************************************************************/
MarkerGroup.prototype.setScale = function (xScale, yScale)
{
	this.explicitScales_.xScale = xScale;
	this.explicitScales_.yScale = yScale;
};

/* **************************************************************************
 * MarkerGroup.lite                                                    */ /**
 *
 * Highlight the label(s) associated w/ the given liteKey (key) and
 * remove any highlighting on all other labels.
 *
 * @param {string}	liteKey	-The key associated with the label(s) to be highlighted.
 *
 ****************************************************************************/
MarkerGroup.prototype.lite = function (liteKey)
{
	console.log("TODO: log fired marker highlite " + liteKey);
	
	// Turn off all current highlights
	var allMarkers = this.lastdrawn.markerCollection;
	allMarkers
		.classed("lit", false);
	
	// create a filter function that will match all instances of the liteKey
	// then find the set that matches
	var matchesIndex = function (d, i) { return d.key === liteKey; };
	
	var markersToLite = allMarkers.filter(matchesLabelIndex);

	// Highlight the labels w/ the matching key
	markersToLite
		.classed("lit", true);

	if (markersToLite.empty())
	{
		console.log("No key '" + liteKey + "' in Markers group " + this.id );
	}
}; // end of MarkerGroup.lite()

/* **************************************************************************
 * MarkerGroup.setLastdrawnScaleFns2ExplicitOrDefault_                 */ /**
 *
 * Set this.lastdrawn.xScale and yScale to those stored in explicitScales
 * or to the default scale functions w/ a data domain of [0,1].
 *
 * @param {Size}	cntrSize	-The pixel size of the container given to draw().
 * @private
 *
 ****************************************************************************/
MarkerGroup.prototype.setLastdrawnScaleFns2ExplicitOrDefault_ = function (cntrSize)
{
	if (this.explicitScales_.xScale !== null)
	{
		this.lastdrawn.xScale = this.explicitScales_.xScale;
	}
	else
	{
		// map the default x data domain [0,1] to the whole width of the container
		this.lastdrawn.xScale = d3.scale.linear().rangeRound([0, cntrSize.width]);
	}
	
	if (this.explicitScales_.yScale !== null)
	{
		this.lastdrawn.yScale = this.explicitScales_.yScale;
	}
	else
	{
		// map the default y data domain [0,1] to the whole height of the container
		// but from bottom to top
		this.lastdrawn.yScale = d3.scale.linear().rangeRound([cntrSize.height, 0]);
	}
}; // end of MarkerGroup.setLastdrawnScaleFns2ExplicitOrDefault_()

/* **************************************************************************
 * MarkerGroup.setOpacity                                              */ /**
 *
 * Set the opacity of the sketch
 *
 * @param {number}		opacity		- opacity value to be set to (0: transparent, 1: opaque)
 * @param {number}		duration	- the duration of the transition in milliseconds
 * @param {number}		delay		- the delay before the transition starts in milliseconds
 *
 ****************************************************************************/
MarkerGroup.prototype.setOpacity = function (opacity, duration, delay)
{
	var xScale = this.lastdrawn.xScale;
	var yScale = this.lastdrawn.yScale;

	var allMarkers = this.lastdrawn.markerCollection;

	allMarkers.transition()
		.style('opacity', opacity)
		.duration(duration).delay(delay);


};
