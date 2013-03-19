/* **************************************************************************
 * $Workfile:: eventmanager.js                                              $
 * **********************************************************************//**
 *
 * @fileoverview Implementation of an EventManager object.
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
	
	/**
	 * events associates eventIds with an array of publishers and an array of
	 * subscribers to that event.
	 * @type Object.<string, ManagedEventInfo>
	 * @private
	 */
	this.events_ = {};
}

/* **************************************************************************
 * EventManager.publish                                                 *//**
 *
 * EventManager class method to publish an event that an object may fire.
 *
 * @param	publisher	The object that will fire the published event
 * @param	eventId		The identifier of the event that is used when the
 *						event is fired. This event ID must be unique to
 *						the event on the page.
 *
 ****************************************************************************/
EventManager.prototype.publish = function( publisher, eventId )
{
	// If the eventId has never been published, add it
	if (!(eventId in this.events))
	{
		this.events[eventId] = this.getEmptyManagedEventInfo_();
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
 * EventManager.subscribe                                               *//**
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
EventManager.prototype.subscribe function( eventId, callback )
{
	// If the eventId has never been published, add it (todo: or error?)
	if (!(eventId in this.events))
	{
		this.events[eventId] =  this.getEmptyManagedEventInfo_();
	}
	
	var event = this.events[eventId];
	
	// Add the callback to the list of callbacks of the eventId
	event.callbacks.push(callback);
}

/* **************************************************************************
 * EventManager.fire                                                    *//**
 *
 * EventManager class method to fire an event.
 *
 * @param	invoker			The object that is firing the event, it is
 *							expected that the invoker has published the event.
 * @param	eventId			The identifier of the event that when fired should
 *							invoke the given callback.
 * @param	eventDetails	The details of the event to be passed to each
 *							subscriber's callback.
 *
 ****************************************************************************/
EventManager.prototype.fire function( invoker, eventId, eventDetails )
{
	// If the eventId has never been published, report an error
	if (!(eventId in this.events))
	{
		alert('Error: attempt to fire the unpublished event "' + eventId + '"');
	}
	
	var event = this.events[eventId];
	
	// Check that the firing object is one of the publishers of the event
	if ($.inArray(event.publishers, invoker) == -1)
	{
		alert('Warning: event is being fired by an object which has not published the event');
	}
	
	// Call all the subscribed functions for this event
	for (var i = 0; i < event.callbacks.length; ++i)
	{
		event.callbacks[i].call(eventDetails);
	}
}

/* **************************************************************************
 * EventManager.getEmptyManagedEventInfo_                               *//**
 *
 * EventManager class method to create an empty managed event info object
 * used to initialize a new entry in the events_ field.
 * @private
 ****************************************************************************/
EventManager.prototype.getEmptyManagedEventInfo_ function()
{
	return { publishers: [], callbacks: [] };
}
