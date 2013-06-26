/* **************************************************************************
 * $Workfile:: bricworks.js                                                 $
 * **********************************************************************//**
 *
 * @fileoverview Implementation of the BricWorks bric factory.
 *
 * The BricWorks is a factory which creates brix.
 *
 * Created on		June 26, 2013
 * @author			Michael Jay Lippert
 *
 * Copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/

/* **************************************************************************
 * BricWorks                                                            *//**
 *
 * A BricWorks is a factory which creates brix.
 *
 * @constructor
 *
 * @param {Object}		config			-The settings to configure this RadioGroup
 * @param {EventManager|undefined}
 * 						eventManager	-The event manager to use for publishing events
 * 										 and subscribing to them. (Optional)
 *
 ****************************************************************************/
function BricWorks(config, eventManager)
{
	/**
	 * The event manager to use to publish (and subscribe to) events for this widget
	 * @type {EventManager}
	 */
	this.eventManager = eventManager || { publish: function () {}, subscribe: function () {} };

	/**
	 * The bricCatalogue is the reference to all of the brix that this BricWorks
	 * can manufacture.
	 * @type {Object.<string, function(Object, EventManager)>}
	 */
	this.bricCatalogue_ = {};

} // end of BricWorks constructor

/* **************************************************************************
 * BricWorks.registerMold                                               *//**
 *
 * Register the mold (constructor) used to create a bric.
 *
 * @param {string}	bricName	-The name of the bric that the given mold creates.
 * @param {function(Object, EventManager)}
 * 					bricMold	-A function which creates the named bric.
 *
 ****************************************************************************/
BricWorks.prototype.registerMold = function (bricName, bricMold)
{
	this.bricCatalogue_[bricName] = bricMold;

};

/* **************************************************************************
 * BricWorks.createBric                                                 *//**
 *
 * Create the specified type of bric.
 *
 * @param {string}	bricName	-The name of the bric desired.
 * @param {Object}	config		-The configuration for the specified bric.
 * @return {Object} the radio group choice which is currently selected or null.
 *
 ****************************************************************************/
BricWorks.prototype.createBric = function (bricName, config)
{
	var bricMold = this.bricCatalogue_[bricName];

	return new bricMold(config, this.eventManager);
};

