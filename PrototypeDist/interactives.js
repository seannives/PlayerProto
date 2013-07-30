/* global define */

/**
 * The main module that defines the public interface for brix.
 */

define(function (require) {
    'use strict';

    /* **************************************************************************
 	 * AMD (Asynchronous Module Definition) Module loading                  *//**
 	 *
 	 * Load in our modules.
 	 ****************************************************************************/
    var $ = require('jquery');
    var d3 = require('d3');

    // sample test file - can get purged when convenient
    var convert = require('interactives/convert');

    // Each 'brix' module I'm prefacing with 'x' just for some generic naming pattern, at least for now.
    // TODO: if you wanted to do xBase.util and base.svgContainer you might be able to make
    // an empty base object and extend them with these requires, if you found that helpful
    var xBaseUtil = require('interactives/base/util');    
    var xSvgContainer = require('interactives/base/svgcontainer');
    var xButton = require('interactives/button');
    var xCallout = require('interactives/callouts');
    var xImage = require('interactives/image');
    var xCaptionedImage = require('interactives/image/captionedimage');
    var xLabelGroup = require('interactives/labelgroup');

    /* **************************************************************************
 	 * createBric                						                    *//**
 	 *
 	 * bric loading command pattern
 	 *
 	 * Each bric config has an 'xtype' which matches a bricMold function.
 	 * We pass each mold function the 'bric' object, which is the config,
 	 * and the eventManager, which some brix require for setup
 	 ****************************************************************************/
	function createBric(bric, eventManager) {
		var bricMolds = {
			'button'         : buttonMold,
			'callout'        : calloutMold,
			'captionedImage' : captionedImageMold,
			'image'          : imageMold,
			'labelGroup'     : labelGroupMold,
			'svgContainer'   : svgContainerMold
			//, add other bric config here
	    };
	   
	    if (typeof bricMolds[bric.xtype] !== 'function') {
	      throw new Error('Invalid bric ' + bric.xtype);
	    }

	    return bricMolds[bric.xtype](bric, eventManager);
	}

	 /* **************************************************************************
 	 * bricMolds	               						                     *//**
 	 *
 	 * functions responsible for pulling data out of the 'bric' config object,
 	 * making sure that conforms to what the individual bric wants, creating,
 	 * and initializing the bric.  It then returns the bric.
 	 ****************************************************************************/
	
	// button bric config - it seems to make sense to move this into interactiveds/button but that's a refactor
	// for another day
	function buttonMold(bric, eventManager) {
		var config = {
			"id" : bric.id,
			"text" : bric.text
		};

		var button = Object.create(xButton);
		button.init(config, eventManager);
		// this could be an append action
		$('#' + bric.targetid).append(button.getRootEl());
        // subscribe to the button press - this shouldn't be in here but should instead be 
        // configured out as an action
		eventManager.subscribe(button.pressedEventId, function(){alert('yay' + bric.text);});
	}

	// callout bric mold 
	function calloutMold(bric, eventManager) {
		var callout = Object.create(xCallout);
		callout.init(bric, eventManager);
        callout.draw(d3.select("#" + bric.targetid));
        return callout;	
	}

	// captionedImage bric mold
	function captionedImageMold(bric, eventManager) {
		// create an image first, using the imageMold

		var img = imageMold(bric.image, eventManager);
		//console.log("imgMold: " + JSON.stringify(img));
		// todo - figure out how to chain these; Object.create(xImage).init(imgConfig)

		// pre-resig
		/*var capImg = Object.create(xCaptionedImage);
		capImg.init({
				id: bric.id,
				image: img,
				captionPosition: bric.captionPosition
			});*/
		var capImgConfig = {
				URI: bric.image.URI,
				caption: bric.image.caption,
				actualSize: bric.image.actualSize,
				captionPosition: bric.captionPosition}
		var capImg = new xCaptionedImage(capImgConfig);
		return capImg;
	}

	// image bric mold
	function imageMold(bric, eventManager) {
		var imgConfig =
			{
				id: bric.targetid,
				URI: bric.URI,
				caption: bric.caption,
				actualSize: bric.actualSize
			};


		// todo - figure out how to chain these; Object.create(xImage).init(imgConfig)
		// Old pre-Resig method
		//var img = Object.create(xImage);
		//img.init(imgConfig);

		var img = new xImage(imgConfig);
		return img;
	}

	// labelGroup bric mold
	function labelGroupMold(bric, eventManager) {
		var labelGrp = Object.create(xLabelGroup);
		labelGrp.init(
			{
				id: bric.id,
				type: bric.type,
				labels: bric.labels
			}, eventManager);
		return labelGrp;
	}

	// SVGContainer bric mold
	function svgContainerMold(bric, eventManager) {
		var cntrSize = xBaseUtil.matchRatioWithHeight(bric.height, bric.actualSize);
		var cntrConfig = 
			{
				node: d3.select('#' + bric.nodeid),
				maxSize: cntrSize,
				maxWid: cntrSize.width,
				maxHt: bric.maxHt
			};
		var cntr = Object.create(xSvgContainer);
		cntr.init(cntrConfig);
		return cntr;
	}

    /* **************************************************************************
 	 * doAction	                						                    *//**
 	 *
 	 * action loading command pattern
 	 *
 	 * Brix with an xtype of 'action' are shunted here.  They have a config
 	 * 'type' which defines the type of action (not sure I like that...may 
 	 * want to just combine this with the above but that seems a little messy).
 	 * We pass along the 'bric' config object, the object that contains all of 
 	 * the existing brix, the object that contains all the existing actions,
 	 * and the eventManager.
 	 ****************************************************************************/
	function doAction(bric, brixObjects, brixActions, eventManager) {
		var actions = {
			'append'    : appendAction,
			'createFn'  : createFnAction,
			'seedFn'    : seedFnAction,
			'subscribe' : subscribeAction
			//, add other actions here
	    };
	   
	    if (typeof actions[bric.type] !== 'function') {
	      throw new Error('Invalid action ' + bric.type);
	    }

	    return actions[bric.type](bric, brixObjects, brixActions, eventManager);
	}

	/* **************************************************************************
 	 * bricActions	               						                    *//**
 	 *
 	 * functions responsible for doing stuff to brix...
 	 ****************************************************************************/	

 	// append one bric to another with optional config
	function appendAction(bric, brixObjects) {
		brixObjects[bric.to].append(brixObjects[bric.what], bric.config);
	}

	// create a function, primarily used as callback for eventManager.
	// hopefully we can pad this out to make it more useful for more than just
	// the neffReactor
	function createFnAction(bric, brixObjects) {
		return {
			bricFn : function bricFn(eventDetails) {
    			bric.config.forEach(function(thing){
    				brixObjects[thing.object][thing.method](eventDetails.selectKey);
    			});
    		}    			
    	};
	}

	// seed function.  Fire off one of the functions you created with a specific config
	function seedFnAction(bric, brixObjects, brixActions) {
		brixActions[bric.fn].bricFn(bric.config);
	}

	// subscribe your bric
	function subscribeAction(bric, brixObjects, brixActions, eventManager) {
		eventManager.subscribe(brixObjects[bric.object].selectedEventId, brixActions[bric.callback].bricFn);
	}

    //Return the module value.
    return {
    	// test method
        version: '0.0.1, jQuery version is: ' + $.fn.jquery,
        // test method to show requirejs functionality - boilerplate to eventually be removed
        convert: convert,
        // This is what the activityManager calls
    	init: function init(content, eventManager) {

			// placeholder for all of our brix objects
			var brixObjects = {};
			// placeholder for our actions
			var brixActions = {};
			// loop over each 'brix blox' (which can contain multiple brix and actions)
			content.targetActivity.master.brix.forEach(function(bric){
				if (bric.xtype == "action") {
					// actions, like append, subscribe, or createFn
					brixActions[bric.id] = doAction(bric, brixObjects, brixActions, eventManager);
					
				} else {
					// an individual bric, like image or labelGroup
					brixObjects[bric.id] = createBric(bric, eventManager);
				}				
			});
		}
    };
});
