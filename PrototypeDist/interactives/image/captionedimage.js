define(['jquery', 'd3', 'interactives/base/util', 'interactives/image'], 
		function ($, d3, util, Image) {
    'use strict';

    var CaptionedImage = Image.subClass({
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
		init: function (config, eventManager) 
		{
			// constuct the base
			this._super(config, eventManager);
			console.log("cap config:");
			console.log(JSON.stringify(config));
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
			 * Information about the last drawn instance of this image (from the draw method)
			 * @type {Object}
			 */
			this.captioned_lastdrawn =
				{
					container: null,
					size: {height: 0, width: 0},
					widgetGroup: null,
					URI: null,
					caption: null,
				};
		},

		/* **************************************************************************
		 * CaptionedImage.draw                                                 */ /**
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
		draw: function (container, size)
		{
			this.captioned_lastdrawn.container = container;
			this.captioned_lastdrawn.size = size;
			this.captioned_lastdrawn.URI = this.URI;
			this.captioned_lastdrawn.caption = this.caption;

			// make a group to hold the image
			var widgetGroup = container.append("g")
				.attr("class", "widgetCaptionedImage")
				.attr("id", this.id);

			var captionSize = {height: 40, width: size.width};
			var imageSize = {height: size.height - captionSize.height, width: size.width};
			
			// Draw the image
			var imageGroup = widgetGroup.append("g");
			this._super(imageGroup, imageSize);	
			
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
							.html(this.caption);

			// position the caption
			if (this.captionPosition === "above")
			{
				imageGroup.attr("transform", util.attrFnVal("translate", 0, captionSize.height));
			}
			else // assume below
			{
				captionGroup.attr("transform", util.attrFnVal("translate", 0, imageSize.height));
			}

			this.captioned_lastdrawn.widgetGroup = widgetGroup;
			
		}, // end of CaptionedImage.draw()

		/* **************************************************************************
		 * CaptionedImage.redraw                                               */ /**
		 *
		 * Redraw the image as it may have been changed (new URI or caption). It will be
		 * redrawn into the same container area as it was last drawn.
		 *
		 ****************************************************************************/
		redraw: function ()
		{
			// TODO: Do we want to allow calling redraw before draw (ie handle it gracefully
			//       by doing nothing? -mjl
			this._super();

			// NOTE: for some reason foreignObject in a d3 selector doesn't work
			//       but body does.
			// TODO: updating the html isn't causing it to be re-rendered (at least in Chrome)
			var captionDiv = this.lastdrawn.widgetGroup.select("g body div")
				.html(this.caption);
		},

		/* **************************************************************************
		 * CaptionedImage.changeImage                                          */ /**
		 *
		 * Change the URI of this Image and/or the caption. After changing the
		 * image it should be redrawn.
		 *
		 * @param	{?string}	URI			-The new URI for the image. If null, the URI
		 *									 will not be changed.
		 * @param	{string=}	opt_caption	-The new caption for the image.
		 *
		 ****************************************************************************/
		changeImage: function (URI, opt_caption)
		{
			this._super(URI, opt_caption);
		},

		/* **************************************************************************
		 * CaptionedImage.setScale                                             */ /**
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
		setScale: function (xScale, yScale)
		{
			this._super(xScale, yScale);
		},

		/* **************************************************************************
		 * CaptionedImage.append                                               */ /**
		 *
		 * Append the widget or widgets to the encapsulated image.
		 *
		 * @param {!IWidget|Array.<IWidget>}
		 * 						svgWidgets	-The widget or array of widgets to be drawn in
		 *									 this encapsulated image's area.
		 *
		 ****************************************************************************/
		append: function (svgWidgets)
		{
			this._super(svgWidgets);
				
		}, // end of CaptionedImage.append()

	}); //end of CaptionedImage Class
	return CaptionedImage;
});
