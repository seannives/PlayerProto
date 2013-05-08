/* **************************************************************************
 * $Workfile:: widget-button.js                                          $
 * **********************************************************************//**
 *
 * @fileoverview Implementation of the button widget.
 *
 * The button widget creates an HTML5 button for setting numerical values.
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
 * button                                                             *//**
 *
 * @constructor
 *
 * The button widget creates a clickable button that publishes events.
 *
 * @param {Object}		config		-The settings to configure this button
 * @param {String}		config.id	-String to uniquely identify this button
 * @param {String}		config.text	-The text to be displayed on the button
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
	
	if (config.text == null) this.text = "Default text";
	else this.text = config.text;
	
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

Button.prototype.setText = function(text)
{
	// Update the DOM in getRootEl
	var b = $("button", this.rootEl);
	var t = b.text();
	$("button", this.rootEl).text(text);
}

Button.prototype.getText = function()
{
	return $("button", this.rootEl).text();
}

Button.prototype.getRootEl = function()
{
	return this.rootEl;
}

