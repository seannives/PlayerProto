/* **************************************************************************
 * $Workfile:: eventmanager.js                                              $
 * **********************************************************************//**
 *
 * Implementation of an EventManager object.
 *
 * Created on		March 18, 2013
 * @author			Michael Jay Lippert
 *
 * Copyright (c) 2013 Michael Jay Lippert, All rights reserved.
 *
 * **************************************************************************/

/* **************************************************************************
 * Constants
 ****************************************************************************/

/* **************************************************************************
 * Page variables
 ****************************************************************************/

/* **************************************************************************
 * EventManager                                                         *//**
 *
 * @constructor for event manager object
 *
 * The event manager should be used for all events. By publishing events that
 * a widget may fire, and subscribing to the events the widget will respond
 * to widgets can respond to events fired by other widgets on the page.
 *
 ****************************************************************************/
function EventManager()
{
	// Public Methods
	this.publish = EventManager_publish;
	this.subscribe = EventManager_subscribe;
	this.fire = EventManager_fire;
	
	// Private Fields
	
	// events associates eventIds with an array of publishers and an array of
	// subscribers to that event.
	this.events = {};
}

/* **************************************************************************
 * EventManager_publish                                                 *//**
 *
 * EventManager class method to publish an event that an object may fire.
 *
 * @param	publisher	The object that will fire the published event
 * @param	eventId		The identifier of the event that is used when the
 *						event is fired. This event ID must be unique to
 *						the event on the page.
 *
 ****************************************************************************/
function EventManager_publish( publisher, eventId )
{
	// If the eventId has never been published, add it
	if (!(eventId in this.events))
	{
		this.events[eventId] = { publishers: [], callbacks: [] };
	}
	
	var event = this.events[eventId];
	
	// If the publisher has already published this eventId, todo: error or ignore?
	if ($.inArray(event.publishers, publisher) == -1)
	{
		alert('event was already published by this publisher');
		return;
	}
	
	// Add the publisher to the list of publishers of the eventId
	event.publishers.push(publisher);
}

/* **************************************************************************
 * EventManager_subscribe                                               *//**
 *
 * EventManager class method to subscribe to an event that an object may fire.
 *
 * @param	eventId		The identifier of the event that when fired should
 *						invoke the given callback.
 * @param	callback	The function that will be called when the event is
 *						fired.  
 *
 * Notes:
 * - I don't see usefulness of recording the subscriber object at this
 *   time, so it isn't a parameter.
 * - If you subscribe the same callback multiple times, when the event is
 *   fired it will be called once for each subscription.
 ****************************************************************************/
function EventManager_subscribe( eventId, callback )
{
	// If the eventId has never been published, add it (todo: or error?)
	if (!(eventId in this.events))
	{
		this.events[eventId] = { publishers: [], callbacks: [] };
	}
	
	var event = this.events[eventId];
	
	// Add the callback to the list of callbacks of the eventId
	event.callbacks.push(callback);
}

