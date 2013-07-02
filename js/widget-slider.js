/* **************************************************************************
 * $Workfile:: widget-slider.js                                             $
 * **********************************************************************//**
 *
 * @fileoverview Implementation of the slider widget.
 *
 * The slider widget creates a jQuery slider for setting a numerical value
 * from a range.
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
			startVal: 2.5,
			minVal: 0,
			maxVal: 5,
			stepVal: 0.1,
			unit: "&micro;m",
			label: "diameter: ",
			format: d3.format(String.fromCharCode(0x2007/*figure space*/) + '>5.2f'),
		};
});
	
/* **************************************************************************
 * Slider                                                               *//**
 *
 * The slider widget creates a jQuery slider for setting a numerical value
 * from a range.
 *
 * @constructor
 *
 * @param {Object}		config			-The settings to configure this Slider
 * @param {string|undefined}
 * 						config.id		-String to uniquely identify this Slider.
 * 										 if undefined a unique id will be assigned.
 * @param {number}		config.startVal	-starting value of slider
 * @param {number}		config.minVal	-minimum value of slider
 * @param {number}		config.maxVal	-maximum value of slider
 * @param {number}		config.stepVal	-step size of slider
 * @param {htmlString}	config.label	-text preceding the slider, optional
 * @param {htmlString}	config.unit		-text following the slider, optional
 * @param {function(number): string}
 * 						config.format	-formatting function for displaying value in readout
 *										 https://github.com/mbostock/d3/wiki/Formatting
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

	/**
	 * Function to format the value of this slider for display by the readout.
	 * @type {function(number): string}
	 */
	this.format = config.format;

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
			/* @type {d3.selection} */		container: null,
			/* @type {Element} */			widgetGroup: null,		
			/* @type {number} */			value: null,		
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
 * @param {!d3.selection}	container	-The DOM element this slider will be
 * 										 created as the last child of.
 *
 ****************************************************************************/
Slider.prototype.draw = function(container)
{	
	this.lastdrawn.container = container;

	// Provide a reference to this Slider instance for use in any function expressions defined here.
	var that = this;

	// get the element from the d3 selection so we can use it w/ jQuery
	var cntrElement = container.node();

	var readOut = $("<span class='readout'>" + this.format(this.startVal) + "</span>");

	// All widgets get a top level "grouping" element which gets a class identifying the widget type.
	$(cntrElement).append($("<span />").addClass("widgetSlider"));
	var widgetGroup = $("span.widgetSlider", cntrElement);

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
								readOut.text(that.format(newVal))
								// we want to publish the changedValue event after the value has been changed
								var oldVal = that.lastdrawn.value;
								that.lastdrawn.value = newVal;
								that.eventManager.publish(that.changedValueEventId,
												{oldValue: oldVal, newValue: newVal});
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

	this.lastdrawn.value = this.startVal;
	this.lastdrawn.widgetGroup = widgetGroup.get(0);

}; // end of Slider.draw()

/* **************************************************************************
 * Slider.getValue                                                      *//**
 *
 * The getValue method returns the current value of this Slider bric.
 *
 * @return {number} current value of this Slider.
 ****************************************************************************/
Slider.prototype.getValue = function()
{
	// The value held by the jQuery slider may not be the value of this slider
	// bric because we update during the jQuery's slide event which is before
	// the jQuery slider updates its value.
	//var jSlider = $("span.slider", this.lastdrawn.widgetGroup);
	//return jSlider.slider("value");
	return this.lastdrawn.value;
};

/* **************************************************************************
 * Slider.setValue                                                      *//**
 *
 * The setValue method sets the value of this Slider bric.
 * This does NOT fire the changedValue event.
 *
 * @note: should it fire the changedValue event? -mjl
 *
 * @param {number} newValue	-The new value for the widget
 *
 * @return {number} old value of this Slider before it was set to the new value.
 ****************************************************************************/
Slider.prototype.setValue = function(newValue)
{
	var oldValue = this.lastdrawn.value;

	if (newValue === oldValue)
		return oldValue;

	var jSlider = $("span.slider", this.lastdrawn.widgetGroup);
	var jReadout = $("span.readout", this.lastdrawn.widgetGroup);

	this.lastdrawn.value = newValue;
	jSlider.slider("value", newValue);
	jReadout.text(this.format(newValue));

	return oldValue;
};

