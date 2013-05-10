/* **************************************************************************
 * $Workfile:: widget-button.js                                          $
 * **********************************************************************//**
 *
 * @fileoverview Implementation of the button widget.
 *
 * The button widget creates an HTML5 button which publishes (fires) an
 * event when clicked using the event manager.
 *
 * Created on		May 8, 2013
 * @author			Jordan Vishniac
 * @author			Michael Jay Lippert
 *
 * Copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/

// Sample Button constructor configuration
(function()
{
	var button1Config = {
			id: "button1",
			text: "Hello World"
		};
});
	
/* **************************************************************************
 * Button                                                             *//**
 *
 * @constructor
 *
 * The button widget creates a clickable button that publishes events.
 *
 * @param {Object}		config		-The settings to configure this button
 * @param {string}		config.id	-String to uniquely identify this button
 * @param {string}		config.text	-The text to be displayed on the button
 *
 * @param {Object}		eventManager
 *
 * NOTES: firefox doesn't support HTML5 buttons, they degrade to numeric input
 * fields.
 **************************************************************************/

function Button(config, eventManager)
{
	/**
	 * A unique id for this instance of the button widget
	 * @type {string}
	 */
	this.id = config.id;
	
	/**
	* The text to be displayed on the button, if undefined the text
	* will be set to "Default text"
	* @type {string}
	*/
	this.text = config.text !== undefined ? config.text : "Default text";
	
	this.eventManager = eventManager;
	
	this.pressedEventId = this.id + 'Pressed';
	
	// draw button
	this.rootEl = $('<div><button type="button">' + this.text + '</button></div>');
	
	// publish events when clicked
	var that = this;
	$("button", this.rootEl).click(
		function()
		{
			that.eventManager.publish(that.pressedEventId);
		});
	
} // end of button constructor

/* **************************************************************************
 * Button.setText                                                      *//**
 *
 * This method sets the text displayed on the button to the given string
 *
 * @param {string}		text	- the text to be displayed on the button
 *
 **************************************************************************/

Button.prototype.setText = function(text)
{
	// Update the DOM in getRootEl
	this.text = text;
	this.rootEl = $('<div><button type="button">' + this.text + '</button></div>');
}

/* **************************************************************************
 * Button.getText                                                      *//**
 *
 * This method retrieves the text from the button as a string
 *
 **************************************************************************/

Button.prototype.getText = function()
{
	return $("button", this.rootEl).text();
}

/* **************************************************************************
 * Button.getRootEl                                                    *//**
 *
 * This method retrieves the text from the button as a string
 *
 **************************************************************************/

Button.prototype.getRootEl = function()
{
	return this.rootEl;
}

