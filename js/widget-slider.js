/* **************************************************************************
 * $Workfile:: widget-slider.js                                             $
 * **********************************************************************//**
 *
 * @fileoverview Implementation of the slider widget.
 *
 * The slider widget creates an HTML5 slider for setting numerical values.
 *
 * Created on		April 15, 2013
 * @author			Leslie Bondaryk
 * @author			Michael Jay Lippert
 * @author			Greg Davis
 *
 * Copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/

// Sample BarChart constructor configuration
(function()
{
	var sl1Config = {
			id: "slider1",
			node: d3.select("#sliderTargetID"),
			startVal: 2.5,
			minVal: 0,
			maxVal: 5,
			stepVal: 0.1,
			unit: "&micro;m",
			label: "diameter: ",
			format:  d3.format('5.2f'),
		};
});
	
/* **************************************************************************
 * Slider                                                               *//**
 *
 * The slider widget creates an html5 slider for setting a numerical value from a range.
 *
 * @constructor
 *
 * @param {Object}		config			-The settings to configure this Slider
 * @param {string|undefined}
 * 						config.id		-String to uniquely identify this Slider.
 * 										 if undefined a unique id will be assigned.
 * @param {startVal}	config.startVal	- starting position of slider, number
 * @param {minVal}		config.minVal	- minimum value of slider, number
 * @param {maxVal}		config.maxVal	- maximum value of slider, number
 * @param {stepVal}		config.stepVal	- step size of slider, number
 * @param {label}		config.label	- text preceding the slider, optional
 * @param {unit}		config.unit		- text following the slider, optional
 * @param {format}		config.format	- d3 formatting function for numerics
 *						https://github.com/mbostock/d3/wiki/Formatting
 *
 * @param {EventManager|undefined}
 * 						eventManager	-The event manager to use for publishing events
 * 										 and subscribing to them. (Optional)
 *
 * NOTES: firefox doesn't support HTML5 sliders, they degrade to numeric input
 * fields.
 **************************************************************************/
function Slider(config, eventManager)
{
	/**
	 * A unique id for this instance of the slider widget
	 * @type {string}
	 */
	this.id = getIdFromConfigOrAuto(config, Slider);

	// TODO: These all need comments describing what they are. -mjl 5/16/2013
	this.startVal = config.startVal;
	this.minVal = config.minVal;
	this.maxVal = config.maxVal;
	this.stepVal = config.stepVal;
	this.unit = config.unit;
	this.label = config.label;
	this.format = config.format; //not sure if this is needed after it becomes a jquery object - gd 6/26/2013
	//
	// Define the ids of the events the slider uses
	
	/**
	 * The event manager to use to publish (and subscribe to) events for this widget
	 * @type {EventManager}
	 */
	this.eventManager = eventManager || { publish: function () {}, subscribe: function () {} };

	/**
	 * The event id (topic) published when the value of this slider changes.
	 * @const
	 * @type {string}
	 */
	this.changedValueEventId = this.id + '_valueChanged';
	
	/**
	 * The event details for this.changedValueEventId events
	 * @typedef {Object} ChangedValueEventDetails
	 * @property {number} newValue	-The new/current value of this slider.
	 */

	/**
	 * Information about the last drawn instance of this slider (from the draw method)
	 * @type {Object}
	 */
	this.lastdrawn =
		{
			container: null,
			widgetGroup: null,
		};
} // end of slider constructor

/**
 * Prefix to use when generating ids for instances of Slider.
 * @const
 * @type {string}
 */
Slider.autoIdPrefix = "sldr_auto_";


/* **************************************************************************
 * Slider.draw                                                          *//**
 *
 * The Slider allows the user to set a numeric value over some defined range.
 *
 * @param {!Element}	container	-The DOM element this slider will be created
 * 									 as the last child of.
 *
 ****************************************************************************/
Slider.prototype.draw = function(container)
{	
	this.lastdrawn.container = container;

	// Provide a reference to this Slider instance for use in any function expressions defined here.
	var that = this;

	var readOut = $("<span class='readout'>" + this.format(this.startVal) + "</span>");

	// All widgets get a top level "grouping" element which gets a class identifying the widget type.
	$(container).append($("<span />").addClass("widgetSlider"));
	var widgetGroup = $("span.widgetSlider", container);

	//write a label in front of the input if there is one
	widgetGroup
				.addClass("dataInput") // TODO: There is styling associated w/ this class that isn't widget specific. I don't think we want that. -mjl
				.append($("<span role='label' />")
					.html(this.label ? this.label : "")
				)
				.append("&nbsp;&nbsp;&nbsp;")
				.append(readOut)
				.append($("<span />")
					.html(" &nbsp;&nbsp;&nbsp;" + this.minVal)
				)
				.append($("<span class='slider' style='display:inline-block; min-width: 100px;' />")
					.slider(
						{
							max : this.maxVal,
							step : this.stepVal,
							value : this.startVal,
							min : this.minVal,
							slide : function(e, ui)
							{
								//this publishes the onChange event to the eventManager
								//passing along the updated value in the numeric field.
								var newVal = ui.value;
								//newVal = that.format(newVal);
								//that.display.setValue(newVal);
								readOut.text(that.format(ui.value))
								that.eventManager.publish(that.changedValueEventId,
												{newValue: ui.value});
							}
						} )
				)
				.append($("<span />")
					.text(this.maxVal)
				);
	
	/*this.display = new Readout({
			node: d3.select("#"+readOutId),
			id: that.id + "_Display",
			startVal: 0,//this.format(this.startVal),
			readOnly: true,
			size: 4,
			unit:  (this.unit ? this.unit : ""), 
		});*/

	this.lastdrawn.widgetGroup = widgetGroup.get(0);

}; // end of Slider.draw()

/* **************************************************************************
 * Slider.getValue                                                      *//**
 *
 * The NumericInput getValue method returns the value of the NumericInput
 * widget.
 ****************************************************************************/
Slider.prototype.getValue = function()
{
	var jSlider = $("span.slider", this.lastdrawn.widgetGroup);
	return jSlider.slider("option", "value");
};

/* **************************************************************************
 * Slider.setValue                                                      *//**
 *
 * The NumericInput setValue method sets the value of the NumericInput
 * widget. This does NOT fire the changedValue event.
 *
 * @param {number} newValue	-The new value for the widget
 *
 ****************************************************************************/
Slider.prototype.setValue = function(newValue)
{
	var jSlider = $("span.slider", this.lastdrawn.widgetGroup);
	var jReadout = $("span.readout", this.lastdrawn.widgetGroup);

	jSlider.slider("option", "value", newValue);
	jReadout.text(this.format(newValue));
};

