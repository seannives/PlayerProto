define(['jquery','d3'], function ($,d3) {
    'use strict';

	return {

		/* **************************************************************************
		 * SVGContainer                                                         *//**
		 *
		 * @constructor
		 *
		 * The SVGContainer creates an svg element and appends it as the last
		 * child of the given node. The svg elements properties are set based on
		 * the given configuration values.
		 *
		 * @param {Object}        config -The settings to configure this SVGContainer
		 * @param {!d3.selection} config.node -The parent node for the created svg element
		 * @param {number}        config.maxWid -The maximum width of the svg container (in pixels)
		 * @param {number}        config.maxHt -The maximum width of the svg container (in pixels)
		 *
		 ****************************************************************************/
		init : function init(config)
		{
			/**
			 * The parent node of the created svg element
			 * @type {d3.selection}
			 */
			this.parentNode = config.node;

			/**
			 * The maximum width of this svg container (in pixels)
			 * @type {number}
			 */
			this.maxWid = config.maxWid;

			/**
			 * The maximum height of this svg container (in pixels)
			 * @type {number}
			 */
			this.maxHt = config.maxHt;

			// It's easy to specify the node incorrectly, lets call that out right away!
			if (this.parentNode.empty())
			{
				alert("SVGContainer parent node doesn't exist.");
				return null;
			}

			// todo: why is the container talking about graphs? in the comment below -mjl
			//maxWid, maxHt: the width and height of the graph region, without margins, integers

			// create the svg element for this container of the appropriate size and scaling
			/**
			 * The svg element representing the container in the document
			 * @type {d3.selection}
			 */
			this.svgObj = this.parentNode.append("svg")						// append the new svg element to the parent node
				.attr("viewBox", "0 0 " + this.maxWid + " " + this.maxHt)	// set its size
				.attr("preserveAspectRatio", "xMinYMin meet")				// make it scale correctly in single-column or phone layouts
				.style("max-width", this.maxWid + "px")						// max width works to make it lay out to scale
				.style("max-height", this.maxHt + "px");					// max height keeps it from forcing whitespace below
																			//  in most cases, but not on Safari or Android.  This is a documented
																			//  webkit bug, which they claim they will fix eventually:
																			//  https://bugs.webkit.org/show_bug.cgi?id=82489
																			//  A horrible Jquery workaround is documented at
																			//  http://www.brichards.co.uk/blog/webkit-svg-height-bug-workaround
		},

		/* **************************************************************************
		 * SVGContainer.append                                                  *//**
		 *
		 * Append the given widgets to the container at the specified location
		 * within it. If multiple widgets are passed in, the x and y scale of
		 * the 1st widget will be set on the other widgets before calling draw.
		 *
		 * @param {Object}	svgWidgets		-The widget or array of widgets to draw in the container
		 * @param {Object|undefined}
		 * 					location		-optional. The location in the container where the
		 * 									 widget should be placed. If not specified the entire
		 * 									 container will be used.
		 * @param {number}	location.topPercentOffset
		 *									-Fraction offset of the top of the widget.
		 * @param {number}	location.leftPercentOffset
		 *									-Fraction offset of the left of the widget.
		 * @param {number}	location.heightPercent
		 *									-Fraction of container height for the widget height.
		 * @param {number}	location.widthPercent
		 *									-Fraction of container width for the widget width.
		 *
		 ****************************************************************************/
		append : function append(svgWidgets, location)
		{
			if (!Array.isArray(svgWidgets))
			{
				this.append_one_(svgWidgets, location);
			}
			else
			{
				// When appending a group of widgets, the data scale of the 1st one
				// should be used by the rest of the widgets.
				for (var i = 0; i < svgWidgets.length; ++i)
				{
					if (i > 0)
					{
						svgWidgets[i].setScale(svgWidgets[0].xScale, svgWidgets[0].yScale);
					}

					this.append_one_(svgWidgets[i], location);
				}
			}
		},

		/* **************************************************************************
		 * SVGContainer.append_one_                                             *//**
		 *
		 * Private helper that appends the given widget to the container at the
		 * specified location within it.
		 *
		 * @param {Object}	svgWidget		-The widget to draw in the container
		 * @param {Object|undefined}
		 * 					location		-optional. The location in the container where the
		 * 									 widget should be placed. If not specified the entire
		 * 									 container will be used.
		 * @param {number}	location.topPercentOffset
		 *									-Fraction offset of the top of the widget.
		 * @param {number}	location.leftPercentOffset
		 *									-Fraction offset of the left of the widget.
		 * @param {number}	location.heightPercent
		 *									-Fraction of container height for the widget height.
		 * @param {number}	location.widthPercent
		 *									-Fraction of container width for the widget width.
		 *
		 * @private
		 *
		 ****************************************************************************/
		append_one_ : function append_one_(svgWidget, location)
		{
			if (location === undefined)
			{
				location = {topPercentOffset: 0, leftPercentOffset: 0, heightPercent: 1, widthPercent: 1};
			}
			// create a group for the widget to draw into that we can then position
			var g = this.svgObj.append('g').attr("class", "widget");
			var h = d3.round(location.heightPercent * this.maxHt);
			var w = d3.round(location.widthPercent * this.maxWid);
			svgWidget.draw(g, {height: h, width: w});
			
			// position the widget
			var top = d3.round(location.topPercentOffset * this.maxHt);
			var left = d3.round(location.leftPercentOffset * this.maxWid);
			if (top !== 0 || left !== 0)
			{
				g.attr('transform', 'translate(' + left + ',' + top + ')');
			}
		}
	}

});