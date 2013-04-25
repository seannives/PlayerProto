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
	var imageConfig = {
			id: "img1",
			images:
			[
				{ URI: 'img/ch4_0_1.png', caption: "Earth's atmosphere. &copy;NASA http://www.nasa.gov/multimedia/imagegallery/ image_feature_1529.html" },
				{ URI: 'img/ch4_03.jpg', caption: "The seasons" },
				{ URI: 'img/ch4_0_2.jpg', caption: "Heat transfer mechanisms" },	
				{ URI: 'img/ch4_1.jpg', caption: "The Whitewater-Baldy Complex wildfire." },
				{ URI: 'img/ch4_2.jpg', caption: "Aerial image near downtown West Liberty, Kentucky." },
				{ URI: 'img/ch4_4.jpg', caption: "Seaside Heights, NJ after Hurricane Sandy." }
			]
		};
});

/**
 * Information needed to process a label in a Image.
 *
 * @typedef {Object} LabelConfig
 * @property {string}	content	-string with HTML markup to be displayed by the label
 * @property {Array.<nummber, number>}
 *						xyPos	-An array containing the x,y data coordinates for the
 *								 top left corner of the label
 * @property {number}	width	-The pixel width of the label
 *								 @todo we need a better way to deal w/ the width, than hard-coding it here. -lb
 * @property {string|undefined}
 *						key		-optional string used to reference the label
 *								 in order to manipulate it (such as highlight it).
 *								 does not need to be unique, and if not all labels
 *								 with the same key will be addressed.
 */
	
/* **************************************************************************
 * Image                                                                *//**
 *
 * The LabelGroup widget draws a group of labels at specified locations
 * in an SVGContainer.
 * The LabelGroup is usually used on top of another widget which provides the
 * data extents and scale functions to convert data points to pixel positions
 * in the container. If the scale functions are not set before this widget is
 * drawn, it assumes the data extents are 0 - 1.
 *
 * @constructor
 * @implements {IWidget}
 *
 * @param {Object}		config			-The settings to configure this LabelGroup
 * @param {string}		config.id		-String to uniquely identify this LabelGroup.
 * @param {Array.<LabelConfig>}
 *						config.labels	-An array describing each label in the group.
 *										 each trace is an array of points defining that trace.
 * @param {string}		type			-string specifying bullets for dots, numbered
 *										 for dots and #, or anything else for just labels
 *
 * NOTES:
 * @todo: role: a string which is one of "label", "distractor".
 * @todo: we need some sort of autowidth intelligence on these, but I don't
 * know how to reconcile that with giving user control over wrapping
 ****************************************************************************/
function Image(config, eventManager)
{
	/**
	 * A unique id for this instance of the image widget
	 * @type {string}
	 */
	this.id = config.id;

	/**
	 * Array of traces to be graphed, where each trace is an array of points and each point is an
	 * object w/ a {number} x and {number} y property.
	 * @type Array.<Array.<{x: number, y: number}>
	 * e.g. 2 traces, 1st w/ 2 points, 2nd with 3 points:
	 *   [ [{x: -1.2, y: 2.0} {x: 2, y: 3.1}], [{x: -2, y: -2}, {x: 0, y: 0}, {x: 2, y: 2}] ]
	 */
	this.labels = config.labels;

	/**
	 * The type specifies an adornment on each label or no adornment if it is not specified.
	 * It must be one of:
	 * <ul>
	 *  <li> "bullets" for a solid bullet adornment
	 *  <li> "numbered" for a bullet containing the index number adornment
	 * </ul>
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
	this.selectedEventId = this.id + '_labelSelected';
	
	/**
	 * The event details for this.selectedEventId events
	 * @typedef {Object} SelectedEventDetails
	 * @property {string|number} labelIndex	-The key associated with the selected label if it has one,
	 *										 otherwise the label's index within the group.
	 */
	
	/**
	 * The scale functions set explicitly for this LabelGroup using setScale.
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
			labelsId: 'labels',
			xScale: null,
			yScale: null,
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
	var numLabels = this.labels.length;

	var labelsContainer = container.append("g") //make a group to hold labels
		.attr("class", "labels")
		.attr("id", this.id);


		
		
		
		
		
		
		
		
		
		

	//images is an array of objects with keys URI: string with the location of the image file
	//jpg, png, svg supported, and caption: string with caption or source text.
	this.images = config.images;
	var numImg = this.images.length;
	var myID = "img" + this.id + "_";
	var that = this;

	var graph = this.group.append("g") //make a group to hold new line chart
		.attr("class", "scalableImage");
	graph.append("rect")
		.attr("width", this.innerWid)
		.attr("height", this.innerHt)
		.attr("fill", "#efefef");

	graph.append("image").attr("xlink:href", this.images[0].URI)
		.attr("id", this.id) //name it so it can be manipulated or highlighted later
		.attr("width", this.innerWid)
		.attr("height", this.innerHt)
		.append("desc").text(this.images[0].caption);

	console.log("Target for caption exists: ",	this.xaxis.select(".axisLabel"));

	this.xaxis.select(".axisLabel").html(this.images[0].caption);
	console.log("image group is made:",
				d3.select("#" + this.id).attr("id"), ", number of images in container is ", numImg);

	if (numImg > 1)
	{
		//if there are multiple images, calculate dimensions for thumbnails, and make the
		//svg box bigger to display them in a new group at the top.
		var thumbScale = 0.85 / (numImg + 2);
		this.xThumbDim = d3.round(this.innerWid * thumbScale);
		this.yThumbDim = d3.round(this.innerHt * thumbScale);
		var maxWid = this.maxWid;
		var maxHt = this.maxHt;
		this.margin.top = this.margin.top + this.yThumbDim;

		this.group.append("g")
			.attr("class", "thumbs")
			.attr("id", "thumbs" + this.id)
			.selectAll("image.thumbs").data(this.images)
			.enter().append("g")
				.attr("id", function (d, i) { return (myID + i);})
				.attr("class", "liteable thumbs")
				.attr("transform", function (d, i)
								   {
									   return "translate(" + (d3.round((i + 1) * that.innerWid / (numImg + 2))
											+ that.margin.left) + "," + 5 + ")";
								   })
				.append("image")
					.attr("xlink:href", function (d) {return d.URI;})
					.attr("width", this.xThumbDim).attr("height", this.yThumbDim)
					.append("desc")
						.text(function (d) {return d.caption;});
		//required - we should never have an image inserted without a description for ARIA
		//then move the main image down to make room for the thumbnails
		that.group.attr("transform", "translate(" + that.margin.left + "," + that.margin.top + ")");
		that.rootEl.attr("viewBox", "0 0 " + that.maxWid + " " + (that.maxHt + this.yThumbDim))
			.style("max-height", (maxHt + this.yThumbDim) + "px");
	}
		
		
		
}; // end of Image.draw()

