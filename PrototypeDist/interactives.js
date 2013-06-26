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
			'button'         : buttonConf,
			'callout'        : calloutConf,
			'captionedImage' : captionedImageConf,
			'image'          : imageConf,
			'labelGroup'     : labelgroupConf,
			'svgContainer'   : svgContainerConf
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
        return callout;	
	}

	function captionedImageConf(widgetContent, eventManager) {
		var img = imageConf(widgetContent.image, eventManager);
		// todo - figure out how to chain these; Object.create(widgetImage).init(imgConfig)

		var capImg = Object.create(captionedImage);
		capImg.init({
				id: widgetContent.id,
				image: img,
				captionPosition: widgetContent.captionPosition
			});
		return capImg;
		//cntr0.append(capImg, {topPercentOffset: 0, leftPercentOffset: 0, heightPercent: 1, widthPercent: 1});


		
		//capImg.append(numLabels);
	}

	function imageConf(widgetContent, eventManager) {
		var imgConfig =
			{
				id: widgetContent.targetid,
				URI: widgetContent.URI,
				caption: widgetContent.caption,
				actualSize: widgetContent.actualSize
			};

		var img = Object.create(widgetImage);
		img.init(imgConfig);
		// todo - figure out how to chain these; Object.create(widgetImage).init(imgConfig)
		return img;
	}

	function labelgroupConf(widgetContent, eventManager) {
		//put numbered highlightable bullets on the image
		var labelGrp = Object.create(labelGroup);
		labelGrp.init(
			{
				id: widgetContent.id,
				type: widgetContent.type,
				labels: widgetContent.labels
			}, eventManager);
		return labelGrp;
	}

	function svgContainerConf(widgetContent, eventManager) {

		var cntrSize = baseUtil.matchRatioWithHeight(widgetContent.height, widgetContent.actualSize);
		var cntrConfig = 
			{
				node: d3.select('#' + widgetContent.nodeid),
				maxSize: cntrSize,
				maxWid: cntrSize.width,
				maxHt: widgetContent.maxHt
			};
		var cntr = Object.create(svgContainer);
		cntr.init(cntrConfig);
		return cntr;
	}

	// action loading command pattern (instead of case statement)
	function doAction(widgetContent, brixObjects) {
		var actions = {
			'append' : appendAction
			//, add other widget config here
	    };
	   
	    if (typeof actions[widgetContent.type] !== 'function') {
	      throw new Error('Invalid widget ' + widgetContent.type);
	    }

	    return actions[widgetContent.type](widgetContent, brixObjects);
	}

	function appendAction(brixContent, brixObjects) {
		brixObjects[brixContent.to].append(brixObjects[brixContent.what], brixContent.config);
	}

    //Return the module value.
    return {
    	// test method
        version: '0.0.1, jQuery version is: ' + $.fn.jquery,
        // test method to show requirejs functionality - boilerplate to eventually be removed
        convert: convert,
    	init: function init(content, eventManager) {



			// load the widgets
			var brixObjects = {};
			content.targetActivity.master.brix.forEach(function(brixContent){
				if (brixContent.wtype == "action") {
					doAction(brixContent, brixObjects);
					
				} else {
					var br = loadWidget(brixContent, eventManager);
					brixObjects[brixContent.id] = br;
				}				
			});

			eventManager.subscribe(brixObjects["reactorNum"].selectedEventId, handleSelectionChanged);
			eventManager.subscribe(brixObjects["callme"].selectedEventId, handleSelectionChanged);

			handleSelectionChanged({selectKey: '0'});
			function handleSelectionChanged(eventDetails)
    		{
    			//Handler needs to get written into each page, 
    			//each widget will have it's own way of responding  
    			//LabelLite should be a method of Labels, once Labels
    			//is written as a constructor
    			brixObjects["reactorNum"].lite(eventDetails.selectKey);
    			brixObjects["callme"].lite(eventDetails.selectKey);
    			
    		}
		}
    };
});
