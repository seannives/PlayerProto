define(['jquery'], function ($) {
    'use strict';

	return {

		// NOTE - This button widget isn't up to date.  There's a more recent version 
		// available


		/* **************************************************************************
		 * button                                                              *//**
		 *
		 * @constructor - or at least it was once
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
		init : function init(config, eventManager) {
			/**
			 * A unique id for this instance of the button widget
			 * @type {string}
			 */
			this.id = config.id;
			
			/**
			 * The event manager to use to publish (and subscribe to) events for this widget
			 * @type {EventManager}
			 */
			this.eventManager = eventManager;
			
			/**
			 * The event id published when this button is clicked.
			 * @const
			 * @type {string}
			 */
			this.pressedEventId = this.id + '_Pressed';
			
			var text = config.text !== undefined ? config.text : "Default text";
			
			/**
			 * The root element of the element tree for this button. It should
			 * be appended into the document where it is expected to be displayed.
			 * @type {Element}
			 * @private
			 *
			 */
			this.rootEl_ = $('<div><button type="button">' + text + '</button></div>');
			
			// publish events when clicked
			var that = this;
			$("button", this.rootEl_).click(
				function()
				{
					that.eventManager.publish(that.pressedEventId);
				});
			
		}, // end of button constructor

		/* **************************************************************************
		 * Button.getRootEl                                                     *//**
		 *
		 * Get the root element of this button widget.
		 *
		 **************************************************************************/
		getRootEl : function getRootEL()
		{
			return this.rootEl_;
		}
	};
});