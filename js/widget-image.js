/* **************************************************************************
 * $Workfile:: widget-image.js                                              $
 * **********************************************************************//**
 *
 * @fileoverview Implementation of the Image widget.
 *
 * The Image widget draws a scaled image in an SVGContainer.
 * The CaptionedImage widget draws a caption next to an Image.
 *
 * Created on		May 04, 2013
 * @author			Leslie Bondaryk
 * @author			Michael Jay Lippert
 *
 * Copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/

// Sample configuration objects for classes defined here
(function()
{
	// config for Image class
	var imageConfig =
		{
			id: "img1",
			URI: 'img/ch4_1.jpg',
			caption: "The Whitewater-Baldy Complex wildfire.",
			preserveAspectRatio: "xMinYMin meet",
			actualSize: {height: 960, width: 1280},
			key: "fire"
		};
	
	// config for CaptionedImage class
	var cimgConfig =
		{
			id: "cimg1",
			image: new Image(imageConfig),
			captionPosition: "below"
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
 * @param {string}		config.key		-Association key used to determine if this
 *										 image should be highlighted.
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
	 * Association key used to determine if this image should be highlighted.
	 * @type {string}
	 */
	this.key = config.key;

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
			widgetGroup: null,
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
	
	// make a group to hold the image
	var imageGroup = container.append("g")
		.attr("class", "widgetImage")
		.attr("id", this.id);

	// Rect for the background of the viewbox in case the image doesn't fill it
	imageGroup
		.append("rect")
			.attr("class", "background")
			.attr("width", size.width)
			.attr("height", size.height)
			.attr("fill", "#efefef");	// TODO: move this to css selector: 'g.widgetImage>rect' -mjl
	
	// Draw the image itself
	imageGroup
		.append("image")
			.attr("xlink:href", this.URI)
			.attr("preserveAspectRatio", this.preserveAspectRatio)
			.attr("width", size.width)
			.attr("height", size.height)
			.append("desc")
				.text(this.caption);

	// Rect to highlight this image when needed	
	var hilightWidth = 6;
	imageGroup
		.append("rect")
			.attr("class", "highlight")
			.attr("width", size.width - hilightWidth)
			.attr("height", size.height - hilightWidth)
			.attr("stroke-width", hilightWidth)
			.attr("x", hilightWidth / 2)
			.attr("y", hilightWidth / 2);

	this.lastdrawn.widgetGroup = imageGroup;

}; // end of Image.draw()

/* **************************************************************************
 * Image.redraw                                                         *//**
 *
 * Redraw the image as it may have been changed (new URI or caption). It will be
 * redrawn into the same container area as it was last drawn.
 *
 ****************************************************************************/
Image.prototype.redraw = function ()
{
	// TODO: Do we want to allow calling redraw before draw (ie handle it gracefully
	//       by doing nothing? -mjl
	var image = this.widgetGroup.select("image");
	image.attr("xlink:href", this.URI);
	
	var desc = image.select("desc");
	desc.text(this.caption);
};

/* **************************************************************************
 * Image.changeImage                                                    *//**
 *
 * Change the URI of this Image and/or the caption. After changing the
 * image it should be redrawn.
 *
 * @param	{?string}	URI			-The new URI for the image. If null, the URI
 *									 will not be changed.
 * @param	{string=}	opt_caption	-The new caption for the image.
 *
 ****************************************************************************/
Image.prototype.changeImage = function (URI, opt_caption)
{
	if (URI)
	{
		this.URI = URI;
	}
	
	if (opt_caption !== undefined)
	{
		this.caption = opt_caption;
	}
};

/* **************************************************************************
 * Image.setScale                                                       *//**
 *
 * Called to preempt the normal scale definition which is done when the
 * widget is drawn. This is usually called in order to force one widget
 * to use the scaling/data area calculated by another widget.
 * Images don't have a scale, so this method does nothing.
 *
 * @param {function(number): number}
 *						xScale	-function to convert a horizontal data offset
 *								 to the pixel offset into the data area.
 * @param {function(number): number}
 *						yScale	-function to convert a vertical data offset
 *								 to the pixel offset into the data area.
 *
 ****************************************************************************/
Image.prototype.setScale = function (xScale, yScale)
{
};

/* **************************************************************************
 * Image.lite                                                           *//**
 *
 * Highlight the image if it is identified by the given liteKey.
 *
 * @param {string}	liteKey	-The key associated with this image if it is to be highlighted.
 *
 ****************************************************************************/
Image.prototype.lite = function (liteKey)
{
	var shouldHilight = liteKey === this.key;
	this.lastdrawn.widgetGroup.classed('lit', shouldHilight);
};

/* **************************************************************************
 * CaptionedImage                                                       *//**
 *
 * The CaptionedImage widget draws an image in an SVGContainer with a caption.
 *
 * @constructor
 * @implements {IWidget}
 *
 * @param {Object}		config			-The settings to configure this Image
 * @param {string}		config.id		-String to uniquely identify this Image.
 * @param {Image}		config.image	-Image widget to be drawn w/ a caption.
 * @param {string}		config.captionPosition
 *										-Where the caption should be placed in
 *										 relation to the image.
 *
 ****************************************************************************/
function CaptionedImage(config, eventManager)
{
	/**
	 * A unique id for this instance of the captioned image widget
	 * @type {string}
	 */
	this.id = config.id;

	/**
	 * The Image which is to be drawn with a caption.
	 * @type {Image}
	 */
	this.image = config.image;
	
	
	/**
	 * Where the caption should be placed in relation to the image.
	 *   <ul>
	 *   <li> "above" - The caption should be below the image.
	 *   <li> "below" - The caption should be above the image.
	 *   </ul>
	 * @type {string}
	 */
	this.captionPosition = config.captionPosition;
	
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
			widgetGroup: null,
		};
} // end of CaptionedImage constructor

/* **************************************************************************
 * CaptionedImage.draw                                                  *//**
 *
 * Draw this CaptionedImage in the given container.
 *
 * @param {!d3.selection}
 *					container	-The container svg element to append the captioned image element tree to.
 * @param {Object}	size		-The size in pixels for the captioned image
 * @param {number}	size.height	-The height in pixels of the area the captioned image are drawn within.
 * @param {number}	size.width	-The width in pixels of the area the captioned image are drawn within.
 *
 ****************************************************************************/
CaptionedImage.prototype.draw = function(container, size)
{
	this.lastdrawn.container = container;
	this.lastdrawn.size = size;
	this.lastdrawn.URI = this.image.URI;
	this.lastdrawn.caption = this.image.caption;

	// make a group to hold the image
	var widgetGroup = container.append("g")
		.attr("class", "widgetCaptionedImage")
		.attr("id", this.id);

	var captionSize = {height: 40, width: size.width};
	var imageSize = {height: size.height - captionSize.height, width: size.width};
	
	// Draw the image
	var imageGroup = widgetGroup.append("g");
	this.image.draw(imageGroup, imageSize);	
	
	// Draw the caption
	var captionGroup = widgetGroup.append("g");

	captionGroup
		.append("foreignObject")
			.attr("width", captionSize.width)
			.attr("height", captionSize.height)
			.append("xhtml:body")
				.style("margin", "0px")		// this interior body shouldn't inherit margins from page body
				.append("div")
					.attr("class", "widgetImageCaption")
					.html(this.image.caption);

	// position the caption
	if (this.captionPosition === "above")
	{
		imageGroup.attr("transform", attrFnVal("translate", 0, captionSize.height));
	}
	else // assume below
	{
		captionGroup.attr("transform", attrFnVal("translate", 0, imageSize.height));
	}
	
	this.lastdrawn.widgetGroup = widgetGroup;
	
} // end of CaptionedImage.draw()

/* **************************************************************************
 * CaptionedImage.redraw                                                *//**
 *
 * Redraw the image as it may have been changed (new URI or caption). It will be
 * redrawn into the same container area as it was last drawn.
 *
 ****************************************************************************/
CaptionedImage.prototype.redraw = function ()
{
	// TODO: Do we want to allow calling redraw before draw (ie handle it gracefully
	//       by doing nothing? -mjl
	this.image.redraw();

	var captionDiv = this.lastdrawn.widgetGroup.select("g foreignObject div")
		.html(this.image.caption);
};

/* **************************************************************************
 * CaptionedImage.changeImage                                           *//**
 *
 * Change the URI of this Image and/or the caption. After changing the
 * image it should be redrawn.
 *
 * @param	{?string}	URI			-The new URI for the image. If null, the URI
 *									 will not be changed.
 * @param	{string=}	opt_caption	-The new caption for the image.
 *
 ****************************************************************************/
CaptionedImage.prototype.changeImage = function (URI, opt_caption)
{
	this.image.changeImage(URI, opt_caption);
};

