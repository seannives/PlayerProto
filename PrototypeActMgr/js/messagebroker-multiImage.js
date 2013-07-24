/**
 * @fileoverview Implementation of a MessageBroker

 * MessageBroker is the component that lives in the master document (html) and 
 * serves as "middleware" that relays messages between iframes.
 *
 * For the mean time the implementation of brokering is very rudimentary.
 * It just relays every 'bricevent' messages to the rest of the iframes except
 * where the event was originated.
 *
 * The message format is as follows (the inner structure 'data' is the actual payload').
 * Notice that the message contains the topic.

 Event = {
 	source: <source>,
 	data: {
 		messageType: <bricevent, resize>
 		#case bricevent, this is what actually sent at EventManager scope
	 	message: {
	 		sendTime: <time was sent in unix format>
	 		topic: <the event manager's topic: objectId/event_name (changed, submitted, control, error, etc)>
			eventData: <specific data, usually collection of key-value pairs> 
	 	}

	 	#case resize
		width:<w>,
		height:<h>
	 }
 }

 *
 * Created on		March 18, 2013
 * @author			Young Suk Ahn Park
 */

/**
 * MessageBroker 
 * @constructor
 *
 * The MessageBroker all bric iframes for the message relaying.
 * To make it simpler to migrate to object literal style, the constructor's 
 * logic was placed in the initialize() function.
 * 
 */
var MessageBroker = function(options) {

	// List of iframes that contains brics
	this.bricIframes = null;


	// Calls the initialization method.
	// (Remember that we are already in constructor scope)
	this.initialize.apply(this, arguments);
}

/**
 * MessageBroker.initialize
 *
 * The initialization method.
 *
 * @param {Object} options		Options (currently no option is used) .
 * 
 */
MessageBroker.prototype.initialize = function (options) {

		this.bricIframes = document.querySelectorAll('iframe.bric'); // 
		//this.bricIframes = $("iframe.bric");  // Using jQuery 

		// Listen to messages.
		var _self = this;
		window.addEventListener('message', function(evt){
//console.log("[MB] Message Received: " + evt.data.messageType);
			if (evt.data.messageType === 'bricevent') _self.relay(evt);
			if (evt.data.messageType === 'resize') _self.resize(evt);
		});
	};


	////////// The rest of methods //////////

/**
 * MessageBroker.initialize
 *
 * Relay the message to the rest of iframes.
 * @todo: Possible improvement. Smarter relaying, i.e. to specific iframes 
 *        that are interested in that topic.
 *        Be ware that "smarter" MessageBroker means more load/complexity to it.
 *
 * @param {Object} evt		The event object as sent by the postMessage().
 * 
 */
MessageBroker.prototype.relay = function (evt) {

		[].forEach.call(this.bricIframes, function(bricIframe){
			// Skip over the iframe that sent the message.
			if (evt.source === bricIframe.contentWindow) return;

			var message = {
				messageType: evt.data.messageType,
				message: evt.data.message
			}
			bricIframe.contentWindow.postMessage(message, '*');
		});
	};

/**
 * MessageBroker.resize
 *
 * Handles the resize of the iframes.
 * The message contains the width and height.
 * @todo: Check that all user agents (browsers) that we intent to support
 *        behaves correctly.
 *
 * @param {Object} evt		The event object as sent by the postMessage().
 */
MessageBroker.prototype.resize = function (evt) {
		//console.log("resizing " + JSON.stringify(evt.data));
		var sourceObject = this.findIFrameWithWindow(evt.source);
		sourceObject.style.width = evt.data.message.width + 'px';
		sourceObject.style.height = evt.data.message.height + 'px';
	};

	////////// methods related to DOM
	// Maybe is a good idea to refactor them to to a separate class
	// Say, MasterDocumentManager, that handles DOM related events.
	// And provides abstraction of specific DOM manipulation

/**
 * MessageBroker.findIFrameWithWindow
 *
 * Returns the matching iframe within the the list of bric iframe list. 
 *
 * @param {Object} evt		The event object as sent by the postMessage().
 */
MessageBroker.prototype.findIFrameWithWindow = function (win){
		for (var i = 0; i < this.bricIframes.length; i++){
			if (win === this.bricIframes[i].contentWindow) return this.bricIframes[i];
		}
	};

/**
 * MessageBroker.findIFrameWithWindow
 *
 * Returns a queryString from <param> tags inside and <object>. 
 *
 * @param {Node} objectNode		The object node that will be changed to iframe, and contains the params.
 */
function buildQueryStringFromParams(objectNode){
		var params = objectNode.querySelectorAll('param');
		var queryString = [].reduce.call(params, function(acc, paramNode){
			var name = paramNode.getAttribute('name');
			var value = paramNode.getAttribute('value');

			if (acc) acc += '&';
			return acc + encodeURIComponent(name) + '=' + encodeURIComponent(value);
		}, '');
		return queryString;
	};


