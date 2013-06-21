/*global define */

/**
 * The main module that defines the public interface for interactives.
 */
define(function (require) {
    'use strict';

    var $ = require('jquery');
    var d3 = require('d3');

    // sample test file - can get purged when convenient
    var convert = require('interactives/convert');

    // TODO: if you wanted to do base.util and base.svgContainer you might be able to make
    // an empty base object and extend them with these requires, if you found that helpful
    var baseUtil = require('interactives/base/util');    
    var svgContainer = require('interactives/base/svgcontainer');
    var widgetButton = require('interactives/widget-button');
    var widgetCallout = require('interactives/widget-callouts');
    var widgetImage = require('interactives/widget-image');
    var captionedImage = require('interactives/image/captionedimage');
    var labelGroup = require('interactives/labelgroup');

	// widget loading command pattern (instead of case statement)
	function loadWidget(widgetContent, eventManager) {
		var widgets = {
			'button' : buttonConf,
			'callout' : calloutConf,
			'image' : imageConf
			//, add other widget config here
	    };
	   
	    if (typeof widgets[widgetContent.wtype] !== 'function') {
	      throw new Error('Invalid widget ' + widgetContent.wtype);
	    }

	    return widgets[widgetContent.wtype](widgetContent, eventManager);
	}
	
	// button widget config - it seems to make sense to move this into widget-button but that's a refactor
	// for another day
	function buttonConf(widgetContent, eventManager) {
		var config = {
			"id" : widgetContent.id,
			"text" : widgetContent.text
		};

		var button = Object.create(widgetButton);
		button.init(config, eventManager);
		$('#' + widgetContent.targetid).append(button.getRootEl());
        // subscribe to the button press
		eventManager.subscribe(button.pressedEventId, function(){alert('yay' + widgetContent.text);});

	}

	// callout widget config 
	function calloutConf(widgetContent, eventManager) {

		var callout = Object.create(widgetCallout);
		callout.init(widgetContent, eventManager);
        callout.draw(d3.select("#" + widgetContent.targetid));
        // todo - your event manager stuff goes here		
	}

	function imageConf(widgetContent, eventManager) {
		var imgConfig =
			{
				id: "imgReactor",
				URI: '../img/reactor.jpg',
				caption: "Nuclear Reactor Schematic Diagram",
				actualSize: {height: 310, width: 680}
			};

		var myImg = Object.create(widgetImage);
		myImg.init(imgConfig);
		// todo - figure out how to chain these; Object.create(widgetImage).init(imgConfig)


		// todo - fix this
		var cntrSize = baseUtil.matchRatioWithHeight(350 - 40, imgConfig.actualSize);
		//var cntrSize = {height: 500, width: 500};

		var cntrConfig0 = 
			{
				node: d3.select("#imgReactor"),
				maxSize: cntrSize,
				maxWid: cntrSize.width, //550,
				maxHt: 350
			};
		
		var cntr0 = Object.create(svgContainer);
		cntr0.init(cntrConfig0);
		
		var cimg0 = Object.create(captionedImage);
		cimg0.init({
				id: "cimg0n",
				image: myImg,
				captionPosition: "below"
			});
		
		cntr0.append(cimg0, {topPercentOffset: 0, leftPercentOffset: 0, heightPercent: 1, widthPercent: 1});

		//put numbered highlightable bullets on the image
		var numLabels = Object.create(labelGroup);
		numLabels.init(
			{
				id: "reactorNum",
				type: "numbered",
				labels: 	
				[	
					{content: "1", xyPos: [0.025, 0.17], width: 0},
					{content: "2", xyPos: [0.075, 0.37], width: 0},
					{content: "3", xyPos: [0.325, 0.64], width: 0},
					{content: "4", xyPos: [0.648, 0.59], width: 0},
					{content: "5", xyPos: [0.690, 0.10], width: 0}
				]
			}, eventManager);
		
		cimg0.append(numLabels);

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
				loadWidget(widgetContent, eventManager);
			});
		}
    };
});
