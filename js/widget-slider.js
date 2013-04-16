/* **************************************************************************
 * $Workfile:: widget-slider.js                                          $
 * **********************************************************************//**
 *
 * @fileoverview Implementation of the slider widget.
 *
 * The slider widget creates an HTML5 slider for setting numerical values.
 *
 * Created on		April 15, 2013
 * @author			Leslie Bondaryk
 * @author			Michael Jay Lippert
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
			label: "diameter: "
		};
});
	
/* **************************************************************************
 * Slider                                                             *//**
 *
 * @constructor
 *
 * The BarChart widget provides single or multiple series bar chart
 * visualization of sets of data points. Can create pyramid chart (two sided)
 *or grouped bar chart (several bars on the same label from different series - multivariate)
 *
 * @param {Object}		config			-The settings to configure this Slider
 * @param {string}		config.id		-String to uniquely identify this Slider
 *  
 * @param {startVal}	config.startVal	- starting position of slider, number
 * @param {minVal}		config.minVal	- minimum value of slider, number
 * @param {maxVal}		config.maxVal	- maximum value of slider, number
 * @param {stepVal}		config.stepVal	- step size of slider, number
 * @param {label}		config.label	- text preceding the slider, optional
 * @param {unit}		config.unit		- text following the slider, optional
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
	this.id = config.id;
	this.startVal = config.startVal;
	this.minVal = config.minVal;
	this.maxVal = config.maxVal;
	this.stepVal = config.stepVal;
	this.unit = config.unit;
	this.label = config.label;
	
	// Define the ids of the events the slider uses
	this.changedValueEventId = this.id + 'Slider';
	this.eventManager = eventManager;
	
} // end of barChart constructor


/* **************************************************************************
 * Slider.draw                                                       *//**
 *
 * The Slider allows the user to set a numeric value over some defined range.
 *
 * @param {!d3.selection}
 *					container	-The container DOM element to append the slider
* @param {node}		config.node		- d3 selection of target ID to write out slider
 * @param {number}	size.height	-The height for the graph.
 * @param {number}	size.width	-The width for the graph.
 *
 ****************************************************************************/
Slider.prototype.draw = function(container)
{	
 /**
	 *  a d3 selection in the document, tells where to write the slider.  
	 * TODO: Should prolly change to jQuery selector style? -lb
	 */
		this.node = container;
		var that = this;
		//<input id="slide" type="range" min="0" max="2.5" step=".1" value="1.2">
		this.rootEl = this.node.append("span");
		//write a label in front of the input if there is one
		this.rootEl.append("span").html(this.label ? this.label : "").attr("role", "label");
		this.rootEl.append("input")
			.attr("type", "range")
			.attr("min", this.minVal)
			.attr("max", this.maxVal)
			.attr("step", this.stepVal)
			.attr("value", this.startVal)
			.attr("id", that.id)
			.attr("class", "dataLabel")
			;
		
		this.rootEl.append("span").html(this.unit ? this.unit : "");

		this.rootEl.on('change', function()
				{
			//this publishes the onChange event to the eventManager
			//passing along the updated value in the numeric field.
			//note that jQuery returns an array for selections, the
			//first element of which is the actual pointer to the
			//tag in the DOM
			console.log("slider value", $("#" + that.id)[0].value);
				that.eventManager.publish(that.changedValueEventId,
								{value: $("#" + that.id)[0].value});
									} );

		
	} // end of slider.draw()

/* **************************************************************************
	 * Slider.getValue                                                *//**
	 *
	 * The NumericInput getValue method returns the value of the NumericInput
	 * widget.
	 ****************************************************************************/
	Slider.prototype.getValue = function()
	{
		// The value is kept in the input element which was given an id
		return $("#" + this.id)[0].value;
	}

	/* **************************************************************************
	 * Slider.setValue                                                *//**
	 *
	 * The NumericInput setValue method sets the value of the NumericInput
	 * widget. This does NOT fire the changedValue event.
	 *
	 * @param {number} newValue	-The new value for the widget
	 *
	 ****************************************************************************/
	Slider.prototype.setValue = function(newValue)
	{
		console.log("TODO: called setSliderValue log", this.id, newValue);

		// The value is set in the input element which was given an id
		$("#" + this.id)[0].value = newValue;
	}
