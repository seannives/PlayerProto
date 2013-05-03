/* **************************************************************************
 * $Workfile:: widget-image.js                                         $
 * **********************************************************************//**
 *
 * @fileoverview Implementation of the Image widget.
 *
 * The Image widget draws a group of labels at specified locations
 * in an SVGContainer.
 *
 * Created on		April 23, 2013
 * @author			Leslie Bondaryk
 * @author			Michael Jay Lippert
 *
 * Copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/

// Sample Image constructor configuration
(function()
{
	var imageConfig =
		{
			id: "img1",
			URI: 'img/ch4_1.jpg',
			caption: "The Whitewater-Baldy Complex wildfire.",
			preserveAspectRatio: "xMinYMin meet",
			actualSize: {height: 960, width: 1280}
		};
});

/* **************************************************************************
 * Image                                                                *//**
 *
 * The Image widget draws an image in an SVGContainer.
 *
 * The Image is frequently used by other widgets, or drawn under other
 * widgets such as LabelGroups.
 *
 * @constructor
 * @implements {IWidget}
 *
 * @param {Object}		config			-The settings to configure this Image
 * @param {string}		config.id		-String to uniquely identify this Image.
 * @param {string}		config.URI		-The URI of the image resource to be displayed.
 * @param {string}		config.caption	-The caption for the image.
 * @param {string}		config.preserveAspectRatio
 *										-Specify how to treat the relationship between
 *										 the actual aspect ratio of the image and the
 *										 area it is to be drawn in.
 * @param {Size}		config.actualSize
 *										-The actual height and width in pixels of the image.
 *
 ****************************************************************************/
function Image(config, eventManager)
{
	/**
	 * A unique id for this instance of the image widget
	 * @type {string}
	 */
	this.id = config.id;

	/**
	 * The URI where the image resource is located.
	 * @type {string}
	 */
	this.URI = config.URI;
	 
	 
	/**
	 * The caption for the image.
	 * @type {string}
	 */
	this.caption = config.caption;
	 
	/**
	 * String that determines if the aspect ratio of the image should be preserved, and if
	 * so how it should be laid out in the viewport. The values that are allowed are defined by svg.
	 * @see <a href="https://developer.mozilla.org/en-US/docs/SVG/Attribute/preserveAspectRatio">
	 *      SVG Doc on preserveAspectRatio</a>
	 * @type {string}
	 * @default "xMinYMin meet"
	 */
	this.preserveAspectRatio = config.preserveAspectRatio || "xMinYMin meet";

	/**
	 * The actual size in pixels of the image resource.
	 * @todo determine if there is a simple way to figure out the actual size
	 *       at runtime instead of forcing the user to specify it.
	 * @type {Size|undefined}
	 */
	this.actualSize = config.actualSize;
	
	/**
	 * The event manager to use to publish (and subscribe to) events for this widget
	 * @type {EventManager}
	 */
	this.eventManager = eventManager;

	/**
	 * Information about the last drawn instance of this image (from the draw method)
	 * @type {Object}
	 */
	this.lastdrawn =
		{
			container: null,
			size: {height: 0, width: 0},
		};
} // end of Image constructor

/* **************************************************************************
 * Image.draw                                                           *//**
 *
 * Draw this Image in the given container.
 *
 * @param {!d3.selection}
 *					container	-The container svg element to append the labels element tree to.
 * @param {Object}	size		-The size in pixels for the label
 * @param {number}	size.height	-The height in pixels of the area the labels are drawn within.
 * @param {number}	size.width	-The width in pixels of the area the labels are drawn within.
 *
 ****************************************************************************/
Image.prototype.draw = function(container, size)
{
	this.lastdrawn.container = container;
	this.lastdrawn.size = size;
	this.lastdrawn.URI = this.URI;
	this.lastdrawn.caption = this.caption;
	
	var that = this;

	// make a group to hold the image
	var imageGroup = container.append("g")
		.attr("class", "widgetImage")
		.attr("id", this.id);

	// Rect for the background of the viewbox in case the image doesn't fill it
	imageGroup.append("rect")
		.attr("width", size.width)
		.attr("height", size.height)
		.attr("fill", "#efefef");	// TODO: move this to css selector: 'g.widgetImage>rect' -mjl
		
	imageGroup
		.append("image")
			.attr("xlink:href", this.URI)
			.attr("preserveAspectRatio", this.preserveAspectRatio)
			.attr("width", size.width)
			.attr("height", size.height)
			.append("desc")
				.text(this.caption);

}; // end of Image.draw()

