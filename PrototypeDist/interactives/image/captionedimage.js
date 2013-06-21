define(['jquery','d3'], function ($,d3) {
    'use strict';

    return {
    		/* **************************************************************************
		 * CaptionedImage                                                       *//**
		 *
		 * The CaptionedImage widget draws an image in an SVGContainer with a caption.
		 *
		 * @constructor
		 * @implements {IWidget}
		 *
		 * @param {Object}		config			-The settings to configure this Image
		 * @param {string|undefined}
		 * 						config.id		-String to uniquely identify this Image.
		 * 										 if undefined a unique id will be assigned.
		 * @param {Image}		config.image	-Image widget to be drawn w/ a caption.
		 * @param {string}		config.captionPosition
		 *										-Where the caption should be placed in
		 *										 relation to the image.
		 *
		 ****************************************************************************/
		init : function init(config,eventManager)
		{
			/**
			 * A unique id for this instance of the captioned image widget
			 * @type {string}
			 */
			//TODO - extend from base, or image, to get this
			//this.id = getIdFromConfigOrAuto(config, CaptionedImage);
			this.id = config.id || "momma";

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
		}, // end of CaptionedImage constructor

		/**
		 * Prefix to use when generating ids for instances of CaptionedImage.
		 * @const
		 * @type {string}
		 */
		autoIdPrefix : function autoIdPrefix()
		{
			var prefix = "cimg_auto_";
			return prefix
		},

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
		draw : function draw(container, size)
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
				// todo - attrFnVal changed to this.attrFnVal - see how it works from base extend
				imageGroup.attr("transform", this.attrFnVal("translate", 0, captionSize.height));
			}
			else // assume below
			{
				// todo - attrFnVal changed to this.attrFnVal - see how it works from base extend
				captionGroup.attr("transform", this.attrFnVal("translate", 0, imageSize.height));
			}
			
			this.lastdrawn.widgetGroup = widgetGroup;
			
		}, // end of CaptionedImage.draw()

// todo - this needs to have come from base
attrFnVal : function attrFnVal(fnName)
{
	// get the fn args into an Array
	var args = Array.prototype.slice.call(arguments, 1);

	var fnCallStr = fnName + '(';
	fnCallStr += args.join(',');
	fnCallStr += ')';
	
	return fnCallStr;
},
		/* **************************************************************************
		 * CaptionedImage.redraw                                                *//**
		 *
		 * Redraw the image as it may have been changed (new URI or caption). It will be
		 * redrawn into the same container area as it was last drawn.
		 *
		 ****************************************************************************/
		redraw : function redraw()
		{
			// TODO: Do we want to allow calling redraw before draw (ie handle it gracefully
			//       by doing nothing? -mjl
			this.image.redraw();

			// NOTE: for some reason foreignObject in a d3 selector doesn't work
			//       but body does.
			// TODO: updating the html isn't causing it to be re-rendered (at least in Chrome)
			var captionDiv = this.lastdrawn.widgetGroup.select("g body div")
				.html(this.image.caption);
		},

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
		changeImage : function changeImage(URI, opt_caption)
		{
			this.image.changeImage(URI, opt_caption);
		},

		/* **************************************************************************
		 * CaptionedImage.setScale                                              *//**
		 *
		 * Called to preempt the normal scale definition which is done when the
		 * widget is drawn. This is usually called in order to force one widget
		 * to use the scaling/data area calculated by another widget.
		 * This will actually set the scale of the encapsulated Image, not of
		 * the CaptionedImage itself, as appended widgets will also be appended
		 * to the encapsulated Image.
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
			this.image.setScale(xScale, yScale);
		},

		/* **************************************************************************
		 * CaptionedImage.append                                                *//**
		 *
		 * Append the widget or widgets to the encapsulated image.
		 *
		 * @param {!IWidget|Array.<IWidget>}
		 * 						svgWidgets	-The widget or array of widgets to be drawn in
		 *									 this encapsulated image's area.
		 *
		 ****************************************************************************/
		append : function append(svgWidgets)
		{
			this.image.append(svgWidgets);
				
		} // end of CaptionedImage.append()
	}
});
