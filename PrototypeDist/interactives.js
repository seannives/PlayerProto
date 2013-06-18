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
	function loadWidget(widgetContent) {
		var widgets = {
			'button' : buttonConf
			//, add other widget config here
	    };
	   
	    if (typeof widgets[widgetContent.type] !== 'function') {
	      throw new Error('Invalid widget.');
	    }

	    return widgets[widgetContent.type](widgetContent);
	}
	
	// button widget config
	function buttonConf(widgetContent) {
		var config = {
			"id" : widgetContent.id,
			"text" : widgetContent.text
		};
		//var mybutton = ibutton();
        widgetButton.init(config, eventManager);
        $('#' + widgetContent.targetid).append(widgetButton.getRootEl());
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
			content.targetActivity.master.widgets.forEach(function(widgetContent){
				loadWidget(widgetContent.widget);
			});
			//loadWidget(content.targetActivity.master.widget.type, content);
		}
    };
});
