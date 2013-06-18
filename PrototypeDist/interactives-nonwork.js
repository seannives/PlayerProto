/*global define */

/**
 * The main module that defines the public interface for interactives,
 */
define(function (require) {
    'use strict';

    var $ = require('jquery');
    var widgetbutton = require('interactives/widget-button');

	// private functions

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
		
		var mybutton = widgetbutton();
        mybutton.init(config, eventManager);
        $('#' + content.targetActivity.master.widget.targetid).append(mybutton.getRootEl());
        // subscribe to the button press
		eventManager.subscribe(mybutton.pressedEventId, function(){alert('yay');});
	}

	// public - return the module value
	return {
		init : function init(content, eventManager) {

			// loop over each nested widget (do this later...we don't have nested widgets yet in sample json)

			// load the widgets
			// option 1: loadWidget (what we're doing below).
			//           Allows you to pair down the config, instantiate the widget, and handle eventMgm callbacks.
			//           Probably want each "case" to pass to a private function
			// option 2: beef up each individual widget's init so we can just pass it the content block.  Then
			//           you don't have to maintain a command object to match each widget.  Is that important/worthwhile  
			//           enough to go this route?

			loadWidget(content.targetActivity.master.widget.type, content);
		}
	};
});
