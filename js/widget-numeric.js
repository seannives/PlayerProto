/* **************************************************************************
 * $Workfile:: widget-numeric.js                                            $
 * *********************************************************************/ /**
 *
 * @fileoverview Implementation of the {@link Readout} and
 *               {@link NumericInput} brix.
 *
 * [FILL IN SUMMARY DESCRIPTION OF WHAT IS IN THIS FILE]
 * @note the following text was in this file, I don't believe it is really
 * descriptive of this file anymore.
 *
 * HTML widgets
 * these are widgets that will just write as HTML fields, not SVG, although they can be used
 * inside foreign object containers to the extent that browsers will render them
 *
 * Created on		April 25, 2013
 * @author			Leslie Bondaryk
 *
 * @copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/


/* **************************************************************************
 * Readout                                                             */ /**
 *
 * Constructor function for a Readout bric.
 *
 * @constructor
 * @implements {IWidget}
 *
 * @param {Object}		config			-The settings to configure this Readout
 * @param {string|undefined}
 * 						config.id		-String to uniquely identify this Readou.
 * 										 if undefined a unique id will be assigned.
 * @param {number} 		config.node		-[DESCRIPTION of config parameter needed]
 * @param {number} 		config.startVal	-[DESCRIPTION of config parameter needed]
 * @param {htmlString} 	config.unit		-[DESCRIPTION of config parameter needed]
 * @param {htmlString}	config.label	-[DESCRIPTION of config parameter needed]
 * @param {*} 			config.precision
 * 										-[DESCRIPTION of config parameter needed]
 * @param {EventManager=}
 * 						eventManager	-The event manager to use for publishing events
 * 										 and subscribing to them.
 *
 * @classdesc
 * Readout Widget is just a way to display calculated or event-driven text
 * in a page.  This is commonly used for meters, results, tests, updatable text, etc.
 * Formerly done as a text input so you can either display or type into it
 *
 ****************************************************************************/
function Readout(config)
{
	this.id = config.id;

	this.node = config.node;
	this.startVal = config.startVal;	
	this.unit = config.unit;
	//if the readout requires a unit to be appended, do so. String value.
	this.label = config.label;
	//if the readout requires a label to be prepended, do so. String value.
	// Define the ids of the events this widget broadcasts
	var that = this;
	var precision = config.precision;

	//<span id="myID" class"dataLabel">numeric readout</span>;
	this.rootEl = this.node.append("span");
	//write a label in front of the input if there is one
	var readout = this.rootEl.html(this.label?this.label:"").attr("role","label");
	
	
	/* used to be input fields, but I switched to text per the design -lb
	this.rootEl
	.append("input")
	.style("max-width","40px")
	.style("direction","rtl")
	.attr("type","text")
	.property("value",this.startVal)
	.attr("align","right")
	.attr("size",size?size:6)
	.attr("id",that.id)
	; */
	
	this.rootEl.append("span")
		.attr("class","dataLabel")
		.attr("id",that.id)
		.text(this.startVal);

	this.rootEl.append("span").html("&nbsp;" + (this.unit ? this.unit : ""));
	
	// TEST: the written text span is the start value
	console.log("text is the startVal:", d3.select("#" + this.id).text() == this.startVal, d3.select("#" + this.id).text());

} //end Readout widget
	
/* **************************************************************************
 * Readout.setValue                                                    */ /**
 *
 * The Readout setValue method sets the value of the Readout
 * widget. This does NOT fire the changedValue event.
 *
 * @param {number} newValue	-The new value for the widget
 *
 ****************************************************************************/
Readout.prototype.setValue = function (newValue)
{
	console.log("TODO: called setReadoutValue log", this.id, newValue);
	
	// The value is kept in the input element which was given an id
	d3.select("#" + this.id).text(newValue);
};


/* **************************************************************************
 * Readout.getValue                                                    */ /**
 *
 * The Readout getValue method gets the value of the Readout
 * widget. This does NOT fire the changedValue event.
 *
 * @param {number} newValue	-The new value for the widget
 *
 ****************************************************************************/
Readout.prototype.getValue = function ()
{
	// The value is kept in the input element which was given an id
	return d3.select("#" + this.id).text();
};

/* **************************************************************************
 * NumericInput                                                        */ /**
 *
 * Constructor function for a NumericInput bric.
 *
 * @constructor
 * @implements {IWidget}
 *
 * @param {Object}		config			-The settings to configure this Readout
 * @param {string|undefined}
 * 						config.id		-String to uniquely identify this Readou.
 * 										 if undefined a unique id will be assigned.
 * @param {number} 		config.node		-[DESCRIPTION of config parameter needed]
 * @param {number} 		config.startVal	-[DESCRIPTION of config parameter needed]
 * @param {number} 		config.minVal	-[DESCRIPTION of config parameter needed]
 * @param {number} 		config.maxVal	-[DESCRIPTION of config parameter needed]
 * @param {htmlString} 	config.unit		-[DESCRIPTION of config parameter needed]
 * @param {htmlString}	config.label	-[DESCRIPTION of config parameter needed]
 * @param {EventManager=}
 * 						eventManager	-The event manager to use for publishing events
 * 										 and subscribing to them.
 *
 * @classdesc
 * A NumericInput widget...
 *
 ****************************************************************************/
function NumericInput(config, eventManager)
{
	this.id = config.id;

	this.node = config.node;
	this.startVal = config.startVal;

	var minVal = config.minVal;
	var maxVal = config.maxVal;
	this.unit = config.unit;
	this.label = config.label;
	// Define the ids of the events the ButtonWidget uses
	this.changedValueEventId = this.id + 'Number';
	this.eventManager = eventManager;

	var that = this;

	//this.rootEl = $('<div><input type="number" min="0" max="100" step="5" value="50"    id="numInput_0" class="dataLabel"></div>');
	this.rootEl = this.node.append("span");
	//write a label in front of the input if there is one
	this.rootEl.append("span").html(this.label ? this.label : "").attr("role", "label");
	this.rootEl.append("input")
		.attr("type", "number")
		.attr("min", minVal)
		.attr("max", maxVal)
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
			that.eventManager.publish(that.changedValueEventId,
							{value: $("#" + that.id)[0].value});
								} );

	// Define private handlers for subscribed events
	function changedValueHandler(eventDetails)
	{
		that.setValue(eventDetails.value);
	}

	// Subscribe to own events, if appropriate
	eventManager.subscribe(that.changedValueEventId, changedValueHandler);
} //end NumericInput widget

/* **************************************************************************
 * NumericInput.getValue                                               */ /**
 *
 * The NumericInput getValue method returns the value of the NumericInput
 * widget.
 ****************************************************************************/
NumericInput.prototype.getValue = function()
{
	// The value is kept in the input element which was given an id
	return $("#" + this.id)[0].value;
};

/* **************************************************************************
 * NumericInput.setValue                                               */ /**
 *
 * The NumericInput setValue method sets the value of the NumericInput
 * widget. This does NOT fire the changedValue event.
 *
 * @param {number} newValue	-The new value for the widget
 *
 ****************************************************************************/
NumericInput.prototype.setValue = function(newValue)
{
	console.log("TODO: called setNumericInputValue log", this.id, newValue);

	// The value is kept in the input element which was given an id
	$("#" + this.id)[0].value = newValue;
};

