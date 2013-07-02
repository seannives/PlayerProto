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
 * @constructor
 *
 * The slider widget creates an html5 slider for setting a numerical value from a range.
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
 * @param {format}		config.format	- d3 formatting function for numerics
 *						https://github.com/mbostock/d3/wiki/Formatting
 *
 * @param {Object}		eventManager
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

	// TODO: These all need comments describing what they are. -mjl 5/16/2013
	this.startVal = config.startVal;
	this.minVal = config.minVal;
	this.maxVal = config.maxVal;
	this.stepVal = config.stepVal;
	this.unit = config.unit;
	this.label = config.label;
	this.format = config.format; //not sure if this is needed after it becomes a jquery object - gd 6/26/2013
	this.display = null;
	// Define the ids of the events the slider uses
	this.changedValueEventId = this.id + 'Slider';
	this.eventManager = eventManager;
	
} // end of slider constructor


/* **************************************************************************
 * Slider.draw                                                          *//**
 *
 * The Slider allows the user to set a numeric value over some defined range.
 *
 * @param {!d3.selection}
 *					container	-The container DOM element to append the slider
 * @param {node}	config.node	-d3 selection of target ID to write out slider
 * @param {number}	size.height	-The height for the graph.
 * @param {number}	size.width	-The width for the graph.
 *
 ****************************************************************************/
Slider.prototype.draw = function(container)
{	
	/**
	 *  a jquery selection in the document, tells where to write the slider.  
	 */
	this.node = container;
	var that = this;
	var readOut = $("<span id='"+this.id + "_readout"+"'>"+this.startVal+"</span>");
	this.rootEl = this.node;
	//write a label in front of the input if there is one
	this.rootEl
				.attr("class", "dataInput")
				.append($("<span role='label' />")
					.html(this.label ? this.label : "")
				)
				.append("&nbsp;&nbsp;&nbsp;")
				.append(readOut)
				.append($("<span />")
					.html(" &nbsp;&nbsp;&nbsp;" + this.minVal)
				)
				.append($("<span id='"+that.id+"' style='display:inline-block; min-width: 100px;' />")
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
								readOut.html(ui.value)
								that.eventManager.publish(that.changedValueEventId,
												{value: ui.value});
							}
						} )
				)
				.append($("<span />")
					.html(this.maxVal)
				);
	
	/*this.display = new Readout({
			node: d3.select("#"+readOutId),
			id: that.id + "_Display",
			startVal: 0,//this.format(this.startVal),
			readOnly: true,
			size: 4,
			unit:  (this.unit ? this.unit : ""), 
		});*/

}; // end of Slider.draw()

/* **************************************************************************
 * Slider.getValue                                                      *//**
 *
 * The NumericInput getValue method returns the value of the NumericInput
 * widget.
 ****************************************************************************/
Slider.prototype.getValue = function()
{
	// The value is kept in the input element which was given an id
	return $("#" + this.id).slider("option", "value");
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
	// The value is set in the input element which was given an id
	$("#" + this.id).slider("option", "value", newValue);
	$("#"+this.id+"_readout").html($("#" + this.id).slider("option", "value"));
};
