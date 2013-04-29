/* **************************************************************************
 * $Workfile:: widget-labelgroup.js                                         $
 * **********************************************************************//**
 *
 * @fileoverview Implementation of the LabelGroup widget.
 *
 * The LabelGroup widget draws a group of labels at specified locations
 * in an SVGContainer.
 *
 * Created on		April 23, 2013
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
			id: "lbl1",
			labels: 	
			[	
				{ content: "Pre-development",	xyPos: [ 0, -.25], width: 100 },
				{ content: "Developing",		xyPos: [14, -.25], width:  80 },
				{ content: "Modernizing",		xyPos: [27, -.25], width:  80 },
				{ content: "Developed",			xyPos: [40, -.25], width:  70 },
				{ content: "Post-development",	xyPos: [51, -.25], width: 100 },
			],
		};
});

/**
 * Information needed to process a label in a LabelGroup.
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
 * LabelGroup                                                           *//**
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
function LabelGroup(config, eventManager)
{
	/**
	 * A unique id for this instance of the labelgroup widget
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
} // end of Label constructor

/* **************************************************************************
 * LabelGroup.draw                                                      *//**
 *
 * Draw this LabelGroup in the given container.
 *
 * @param {!d3.selection}
 *					container	-The container svg element to append the labels element tree to.
 * @param {Object}	size		-The size in pixels for the label
 * @param {number}	size.height	-The height in pixels of the area the labels are drawn within.
 * @param {number}	size.width	-The width in pixels of the area the labels are drawn within.
 *
 ****************************************************************************/
LabelGroup.prototype.draw = function(container, size)
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

	//this filter can be used to add dropshadows to highlighted labels and bullets
	var filter = labelsContainer.append("defs").append("filter").attr("id", "drop-shadow");
	filter.append("feGaussianBlur").attr("in", "SourceAlpha").attr("stdDeviation", 2).attr("result", "blur");
	filter.append("feOffset").attr("in", "blur").attr("dx", 2).attr("dy", 2).attr("result", "offsetBlur");
 	var merge = filter.append("feMerge");
	merge.append("feMergeNode").attr("in", "offsetBlur");
	merge.append("feMergeNode").attr("in", "SourceGraphic");

	var labelCollection = labelsContainer.selectAll("g.label").data(this.labels);
	labelCollection.enter()
		.append("g")
			.attr("class", "label")
				// name it so it can be manipulated or highlighted later
			.attr("id", function (d, i) { return that.id + "_label_" + ('key' in d ? d.key : i); })
			.attr("transform",
				  function (d, i) 
				  {
					  return "translate(" + that.lastdrawn.xScale(d.xyPos[0]) + "," + that.lastdrawn.yScale(d.xyPos[1]) + ")";
				  });

	labelCollection.append("foreignObject")
		.attr("x", 0)
		.attr("y", 0)
		.attr("width", function (d) { return d.width; })
		.attr("height", 200)
		.append("xhtml:body")
			.style("margin", "0px")
			//this interior body shouldn't inherit margins from page body
			.append("div")
				.attr("class", "descLabel")
				//.style("visibility",function(d,i) { return d.viz;})
				//I punted on the show/hide thing, but it could come back
				.html(function (d) { return d.content; }); //make the label

	if (this.type == "bullets" || this.type == "numbered")
	{
		labelCollection.append("circle")
			.attr("class", "steps")
			.attr("r", 16).attr("cx", 0).attr("cy", 0);
	}

	if (this.type == "numbered")
	{
		labelCollection.append("text")
			.style("fill", "white")
			.attr("text-anchor", "middle")
			.attr("alignment-baseline", "middle")
			.text(function (d, i) { return i + 1; });
	}
	
	labelCollection.on('click',
				function (d, i)
				{
					that.eventManager.publish(that.selectedEventId, {labelIndex: ('key' in d ? d.key : i)});
				});

	this.lastdrawn.labelCollection = labelsContainer.selectAll("g.label");
}; // end of LabelGroup.draw()

/* **************************************************************************
 * LabelGroup.setScale                                                  *//**
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
LabelGroup.prototype.setScale = function (xScale, yScale)
{
	this.explicitScales_.xScale = xScale;
	this.explicitScales_.yScale = yScale;
};

/* **************************************************************************
 * LabelGroup.labelLite                                                 *//**
 *
 * Highlight the label(s) associated w/ the given labelIndex (key) and
 * remove any highlighting on all other labels.
 *
 * @param {string|number}	labelIndex	-The key associated with the label(s) to be highlighted.
 *
 ****************************************************************************/
LabelGroup.prototype.labelLite = function (labelIndex)
{
	console.log("TODO: fired LabelLite log");
	
	// return all styles to normal on all the labels
	this.lastdrawn.labelCollection.classed('lit', false);
	
	// Set the findKey function based on whether the key is an index or a data key string.
	if (typeof labelIndex == "number")
	{
		var matchesLabelIndex = function (d, i) { return i == labelIndex; };
	}
	else
	{
		var matchesLabelIndex = function (d, i) { return 'key' in d ? d.key === labelIndex : false; };
	}
	
	var labels2lite = this.lastdrawn.labelCollection.filter(matchesLabelIndex);
	labels2lite.classed('lit', true);
	
	//TODO what I need is a better way to know which collection
	//of labels to turn off. Doing it by class seems lame.
	allLabels
		.style("color", null)
		//setting a style to null removes the special
		//style property from the tag entirely.
		//TODO: make the lit and unlit classes
		.style("font-weight", null)
		.style("background-color", "");

	var allBullets = d3.selectAll("#" + Obj.labels.id);
	//turn all the text back to white, and circles to black
	allBullets.selectAll("text").style("fill", "white");
	allBullets.selectAll("circle").attr("class", "steps");
		
	//highlight the selected label(s)
	
	var setLabels = d3.selectAll("#" + Obj.labels.id + lite);
	if (setLabels) 
	{
		setLabels.selectAll("circle")
			.attr("class", "stepsLit");
		//highlight the one selected circle and any others
		//with the same lite index
		setLabels.selectAll("text").style("fill", "#1d95ae");
		setLabels.selectAll(".descLabel")
			//.transition().duration(100)
			// this renders badly from Chrome refresh bug
			//we'll have to figure out how to get transitions
			//back in - maybe just foreign objects?
			.style("color", "#1d95ae")
			.style("font-weight", "600")
			.style("background-color", "#e3effe");
	} 
	else
	{
		console.log("Invalid key. No label " + key);
	}
}; // end of LabelGroup.labelLite()

