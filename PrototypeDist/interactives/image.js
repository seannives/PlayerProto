define(['jquery','d3'], function ($,d3) {
    'use strict';

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

	return {

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
		 * @param {string|undefined}
		 * 						config.id		-String to uniquely identify this Image.
		 * 										 if undefined a unique id will be assigned.
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
		init : function init(config,eventManager)
		{
			/**
			 * A unique id for this instance of the image widget
			 * @type {string}
			 */
			//TODO - extend from base to get this guy
			//this.id = getIdFromConfigOrAuto(config, Image);
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
			 * List of child widgets which are to be drawn in this Image's container area.
			 * Child widgets are added using Image.append.
			 * @type {Array.<IWidget>}
			 */
			this.childWidgets = [];
			
			/**
			 * The event manager to use to publish (and subscribe to) events for this widget
			 * @type {EventManager}
			 */
			this.eventManager = eventManager;

			/**
			 * The scale functions set explicitly for this Image using setScale.
			 * Image doesn't use scale functions, but they may get used in a widget chain.
			 * Otherwise a data extent of [0,1] will be mapped to the given
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
			 * Information about the last drawn instance of this image (from the draw method)
			 * @type {Object}
			 */
			this.lastdrawn =
				{
					container: null,
					size: {height: 0, width: 0},
					widgetGroup: null,
				};
		}, // end of Image constructor

		/**
		 * Prefix to use when generating ids for instances of Image.
		 * @const
		 * @type {string}
		 */
		autoIdPrefix : function autoIdPrefix()
		{
			var prefix = "img_auto_";
			return prefix
		},

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
		draw : function draw(container, size)
		{
			this.lastdrawn.container = container;
			this.lastdrawn.size = size;
			this.lastdrawn.URI = this.URI;
			this.lastdrawn.caption = this.caption;

			this.setLastdrawnScaleFns2ExplicitOrDefault_(size);
			
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

			// Draw any child widgets that got appended before draw was called
			this.childWidgets.forEach(this.drawWidget_, this);
			
		}, // end of Image.draw()

		/* **************************************************************************
		 * Image.redraw                                                         *//**
		 *
		 * Redraw the image as it may have been changed (new URI or caption). It will be
		 * redrawn into the same container area as it was last drawn.
		 *
		 ****************************************************************************/
		redraw : function redraw()
		{
			// TODO: Do we want to allow calling redraw before draw (ie handle it gracefully
			//       by doing nothing? -mjl
			var image = this.lastdrawn.widgetGroup.select("image");
			image.attr("xlink:href", this.URI);
			
			var desc = image.select("desc");
			desc.text(this.caption);
			
			this.childWidgets.forEach(this.redrawWidget_, this);
		},

		/* **************************************************************************
		 * Image.drawWidget_                                                    *//**
		 *
		 * Draw the given child widget in this image's area.
		 * This image must have been drawn BEFORE this method is called or
		 * bad things will happen.
		 *
		 * @private
		 *
		 * @todo implement some form of error handling! -mjl
		 *
		 ****************************************************************************/
		drawWidget_ : function drawWidget_(widget)
		{
			widget.setScale(this.lastdrawn.xScale, this.lastdrawn.yScale);
			widget.draw(this.lastdrawn.widgetGroup, this.lastdrawn.size);
		},

		/* **************************************************************************
		 * Image.redrawWidget_                                                  *//**
		 *
		 * Redraw the given child widget.
		 * This line graph and this child widget must have been drawn BEFORE this
		 * method is called or bad things will happen.
		 *
		 * @private
		 *
		 * @todo implement some form of error handling! -mjl
		 *
		 ****************************************************************************/
		redrawWidget_ : function redrawWidget_(widget)
		{
			widget.redraw();
		},

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
		changeImage : function changeImage(URI, opt_caption)
		{
			if (URI)
			{
				this.URI = URI;
			}
			
			if (opt_caption !== undefined)
			{
				this.caption = opt_caption;
			}
		},

		/* **************************************************************************
		 * Image.setScale                                                       *//**
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
		setScale : function setScale(xScale, yScale)
		{
			this.explicitScales_.xScale = xScale;
			this.explicitScales_.yScale = yScale;
		},

		/* **************************************************************************
		 * Image.append                                                         *//**
		 *
		 * Append the widget or widgets to this image and draw it/them on top
		 * of the image and any widgets appended earlier. If append
		 * is called before draw has been called, then the appended widget(s) will be
		 * drawn when draw is called.
		 *
		 * @param {!IWidget|Array.<IWidget>}
		 * 						svgWidgets	-The widget or array of widgets to be drawn in
		 *									 this image's area.
		 *
		 ****************************************************************************/
		append : function append(svgWidgets)
		{
			if (!$.isArray(svgWidgets))
			{
				this.append_one_(svgWidgets);
			}
			else
			{
				svgWidgets.forEach(this.append_one_, this);
			}
				
		}, // end of Image.append()

		/* **************************************************************************
		 * Image.append_one_                                                    *//**
		 *
		 * Helper for append that does the work needed to append a single widget.
		 *
		 * @param {!IWidget}	widget	-The widget which is to be drawn in this image's
		 *								 area.
		 *
		 * @private
		 *
		 ****************************************************************************/
		append_one_ : function append_one_(widget)
		{
			this.childWidgets.push(widget);
			
			if (this.lastdrawn.container !== null)
				this.drawWidget_(widget);
				
		}, // end of Image.append_one_()

		/* **************************************************************************
		 * Image.lite                                                           *//**
		 *
		 * Highlight the image if it is identified by the given liteKey.
		 *
		 * @param {string}	liteKey	-The key associated with this image if it is to be highlighted.
		 *
		 ****************************************************************************/
		lite : function lite(liteKey)
		{
			var shouldHilight = liteKey === this.key;
			this.lastdrawn.widgetGroup.classed('lit', shouldHilight);
		},

		/* **************************************************************************
		 * Image.setLastdrawnScaleFns2ExplicitOrDefault_                        *//**
		 *
		 * Set this.lastdrawn.xScale and yScale to those stored in explicitScales
		 * or to the default scale functions w/ a data domain of [0,1].
		 *
		 * @param {Size}	cntrSize	-The pixel size of the container given to draw().
		 * @private
		 *
		 ****************************************************************************/
		setLastdrawnScaleFns2ExplicitOrDefault_ : function setLastdrawnScaleFns2ExplicitOrDefault_(cntrSize)
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
		} // end of Image.setLastdrawnScaleFns2ExplicitOrDefault_()
	}
});