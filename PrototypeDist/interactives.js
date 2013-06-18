/*global define */

/**
 * The main module that defines the public interface for interactives.
 */
define(function (require) {
    'use strict';

    var $ = require('jquery');
    var convert = require('interactives/convert');
    var widgetButton = require('interactives/widget-button')

	// widget loading command pattern (instead of case statement)
	function loadWidget(widget, content) {
		var widgets = {
			'button' : buttonConf
			//, add other widget config here
	    };
	   
	    if (typeof widgets[widget] !== 'function') {
	      throw new Error('Invalid widget.');
	    }

	    return widgets[widget](content);
	}
	
	// button widget config
	function buttonConf(content) {
		var config = {
			"id" : content.targetActivity.master.widget.id,
			"text" : content.targetActivity.master.widget.text
		};
		//var mybutton = ibutton();
        widgetButton.init(config, eventManager);
        $('#' + content.targetActivity.master.widget.targetid).append(widgetButton.getRootEl());
        // subscribe to the button press
		eventManager.subscribe(widgetButton.pressedEventId, function(){alert('yay');});
	}

    //Return the module value.
    return {
    	// test method
        version: '0.0.1, jQuery version is: ' + $.fn.jquery,
        // test method to show requirejs functionality - boilerplate to eventually be removed
        convert: convert,
    	init: function init(content, eventManager) {

			// todo - loop over each nested widget (we don't have nested widgets yet in sample json)

			// load the widgets
			loadWidget(content.targetActivity.master.widget.type, content);
		}
    };
});
