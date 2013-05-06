/* **************************************************************************
 * $Workfile:: widget-sketch.js                                         $
 * **********************************************************************//**
 *
 * @fileoverview Implementation of the sketch widget.
 *
 * The Sketch widget draws a group of geometric objects at specified locations
 * in an SVGContainer.
 *
 * Created on		May 3, 2013
 * @author			Leslie Bondaryk
 * @author			Michael Jay Lippert
 *
 * Copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/

// Sample Label constructor configuration
(function()
{
	var lbl1Config = {
			id: "sketch1",
			drawShape: 	
			[	
				{ shape: "rectangle",	xyPos: [ 0, 5], width: 2, height: 2 },
				{ shape: "circle",	xyPos: [5, 5], radius:  2 }, 
				{ shape: "hexagon",	xyPos: [3,3], radius:  1 },
				{ shape: "line",	xyPos: [1,1], xyEnd:  [5,5] },
			],
		};
});

/**
 * Information needed to process drawings in a sketch
 *
 * @typedef {Object} SketchConfig
 * @property {string}	shape	-name of geometric shape, supports circle, rectangle, hexagon, line
 * @property {Array.<nummber, number>}
 *						xyPos	- top left corner of rectangles, center of circles, local coordinates
 * @property {number}	width	- width of rectange, local coordinates
 * @property {number}	height	- height of rectange, local coordinates
 * @property {number}	radius	- radius of circle or hex, local coordinates
 * @property {Array.<nummber, number>}
 *						xyEnd	- xy local coordinates of end points of lines
 * @property {string|undefined}
 *						key		-optional string used to reference the sketch object
 *								 in order to manipulate it (such as highlight it).
 *								 does not need to be unique, and if not all labels
 *								 with the same key will be addressed.
 */
	
/* **************************************************************************
 * Sketch                                                           *//**
 *
 * The Sketch widget draws a group of geometric objects at specified locations
 * in an SVGContainer.
 * The Sketch widget might be used on top of another widget which provides the
 * data extents and scale functions to convert data points to pixel positions
 * in the container. If the scale functions are not set before this widget is
 * drawn, it assumes the data extents are 0 - 1.
 *
 * @constructor
 * @implements {IWidget}
 *
 * @param {Object}		config			-The settings to configure this Sketch
 * @param {string}		config.id		-String to uniquely identify this Sketch.
 * @param {Array.<SketchConfig>}
 *						config.drawStuff	-An array describing each drawing object in the group.
 *
 * NOTES:
 * @todo: this might or might not be the start of something like an 
 * equation editor or a chemistry editor
 ****************************************************************************/
function Sketch(config, eventManager)
{
	/**
	 * A unique id for this instance of the labelgroup widget
	 * @type {string}
	 */
	this.id = config.id;

	/**
	 * Array of objects to be drawn, where each object specifies the shape, position, and size
 	 */
	this.drawShape = config.drawShape;
	
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
	this.selectedEventId = this.id + '_sketchSelected';
	
	/**
	 * The event details for this.selectedEventId events
	 * @typedef {Object} SelectedEventDetails
	 * @property {string|number} sketchIndex	-The key associated with the selected label if it has one,
	 *										 otherwise the label's index within the group.
	 */
	
	/**
	 * The scale functions set explicitly for this Sketch using setScale.
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
			sketchId: this.id + 'Sketch',
			xScale: null,
			yScale: null,
		};
} // end of Label constructor

/* **************************************************************************
 * Sketch.draw                                                      *//**
 *
 * Draw this Sketch in the given container.
 *
 * @param {!d3.selection}
 *					container	-The container svg element to append the labels element tree to.
 * @param {Object}	size		-The size in pixels for the label
 * @param {number}	size.height	-The height in pixels of the area the labels are drawn within.
 * @param {number}	size.width	-The width in pixels of the area the labels are drawn within.
 *
 ****************************************************************************/
Sketch.prototype.draw = function(container, size)
{
	this.lastdrawn.container = container;
	this.lastdrawn.size = size;
	
	if (this.explicitScales_.xScale !== null)
	{
		this.lastdrawn.xScale = this.explicitScales_.xScale;
	}
	else
	{
		// map the default x data domain [0,1] to the whole width of the container
		this.lastdrawn.xScale = d3.scale.linear().rangeRound([0, size.width]);
	}
	
	if (this.explicitScales_.yScale !== null)
	{
		this.lastdrawn.yScale = this.explicitScales_.yScale;
	}
	else
	{
		// map the default y data domain [0,1] to the whole height of the container
		// but from bottom to top
		this.lastdrawn.yScale = d3.scale.linear().rangeRound([size.height, 0]);
	}
	
	var that = this;
	var xScale = this.lastdrawn.xScale;
	var yScale = this.lastdrawn.yScale;
	
	var sketchContainer = container.append("g") //make a group to hold labels
		.attr("id", this.lastdrawn.sketchId);

	// bind the sketch group collection to the data
	// the collection is used to highlight and unhighlight
	var drawCollection = sketchContainer.selectAll("g.sketch").data(this.drawShape);
	
	// on the enter selection (create new ones from drawStuff) make
	// the groups. This is useful in case you want to pack more than just the
	// text label into the graup with the same relative positioning.  
	drawCollection.enter()
		.append("g")
		.attr("class","sketch");
		
	// autokey entries which have no key with the data index
	drawCollection.each(function (d, i) { 
					// if there is no key assigned, make one from the index
					d.key = 'key' in d ? d.key : i;
					});
					
	// move the sketch objects into position, but do it on the data collection, which 
	// includes both the update and the enter selections, so you can drag them around
	// on a suitable event or redraw.
	
 
	drawCollection.attr("transform", function (d, i)  {
					return "translate(" + xScale(d.xyPos[0]) + "," + yScale(d.xyPos[1]) + ")";
				  });

	// TODO: we're likely going to want to label the drawBits, but 
	// I don't need it now, and it's not clear if we should just layer a labelGroup
	// on it or make them part of the groups that hold each thing.
	

	drawCollection.filter(function (d, i) { return d.shape === "circle"; })
		.append("circle")
			.attr("r", function(d) { return xScale(d.radius)})
			.attr("cx", 0).attr("cy", 0);
	

	drawCollection.filter(function (d, i) { return d.shape === "rectangle"; })
		.append("rect")
			.attr("width", function(d) { return xScale(d.width)})
			.attr("height", function(d) { return yScale(d.height)});

	drawCollection.filter(function (d) { return d.shape === "hexagon"; })
		.append("polygon")
			.attr("points","10,12 17,24 33,24 40,12 33,0 17,0");

	drawCollection.filter(function (d) { return d.shape === "line"; })
		.append("line")
			.attr("x2",function(d) { return xScale(d.xyEnd[0])})
			.attr("y2",function(d) { return yScale(d.xyEnd[1])});


	drawCollection.on('click',
				function (d, i)
				{
					that.eventManager.publish(that.selectedEventId, {selectKey:d.key});
				});

	this.lastdrawn.drawCollection = sketchContainer.selectAll(".sketch");
	
}; // end of Sketch.draw()

/* **************************************************************************
 * Sketch.setScale                                                  *//**
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
Sketch.prototype.setScale = function (xScale, yScale)
{
	this.explicitScales_.xScale = xScale;
	this.explicitScales_.yScale = yScale;
};

/* **************************************************************************
 * Sketch.redraw                        	                             *//**
 *
 * Redraw the sketch as it may have been modified in size or draw bits. It will be
 * redrawn into the same container area as it was last drawn.
 *
 ****************************************************************************/
Sketch.prototype.redraw = function ()
{
	
	this.draw();
};

/* **************************************************************************
 * Sketch.lite                                                 *//**
 *
 * Highlight the drawing bits associated w/ the given key and
 * remove any highlighting on all others.
 *
 * @param {string|number}	liteKey	-The key associated with the label(s) to be highlighted.
 *
 ****************************************************************************/


Sketch.prototype.lite = function (liteKey)
{
	console.log("TODO: Log fired Sketch Select " + liteKey);
	
	// return all styles to normal on all the labels and numbers
	this.lastdrawn.drawCollection
		.classed('lit', false);
	 
	
	// create a filter function that will match all instances of the liteKey
	// then find the set that matches
	var matchesKey = function (d, i) { return d.key === liteKey; };
	
	var set = this.lastdrawn.drawCollection.filter(matchesKey);
	
	// if any are found, highlight the selected label(s)
	if (set[0][0]) 
	{
		// for numbered labels, highlight the selected circle and any others
		// with the same liteKey
		set.classed('lit', true);
	} 
	else
	{
		console.log("No key '" + liteKey + "' in Sketch group " + this.id );
	}
}; // end of Sketch.lite()

