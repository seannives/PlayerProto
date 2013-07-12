/* Message Broker
 */

/**$
 *
 * 
 Event = {
 	source: <source>,
 	data: {
 		messageType: <bricevent, resize>
 		#case bricevent, this is what actually sent at EventManager scope
	 	payload: {
	 		sendTime: <time was sent in unix format>
	 		topic: <the event manager's topic>
			sourceObjectId: <object Id where the event was originated>
			eventName: <changed, submitted, control, error, etc> 
			eventData: <specific data, usually collection of key-value pairs> 
	 	}

	 	#case resize
	 	payload: {
			width:<w>,
			height: <h>
	 	}
	 }
 }
 */
var MessageBroker = function(options) {

	// 
	this.bricIframes = null;


	// Perform the actual call to the initialization method.
	// (Remember that we are already in constructor scope)
	this.initialize.apply(this, arguments);
}

	// Centralize the initialization login in one single function
MessageBroker.prototype.initialize = function (options) {

 		this.convertObjectTagToIframeTag();

		//var widgetsOnPage = document.querySelectorAll('iframe');
		this.bricIframes = $("iframe.bric");

		// Handle events.

		var _self = this;
        window.addEventListener('message', function(evt){
console.log("Message Received")
            if (evt.data.method === 'save') _self.relay(evt);
            if (evt.data.method === 'resize') _self.resize(evt);
        });
	};


	////////// The rest of methods //////////

	// Relay the message to the rest of iframes
MessageBroker.prototype.relay = function (evt) {
		
        [].forEach.call(this.bricIframes, function(bricIframes){
            // Skip over the widget that sent the message.
            if (evt.source === bricIframes.contentWindow) return;

            var message = {
                method: 'restore',
                value: evt.data.value
            }
            bricIframes.contentWindow.postMessage(message, '*')
        });
	};

MessageBroker.prototype.resize = function (evt) {
        var sourceObject = findIFrameWithWindow(evt.source);
        sourceObject.style.width = evt.data.width + 'px';
        sourceObject.style.height = evt.data.height + 'px';
    };

MessageBroker.prototype.findIFrameWithWindow = function (win){
        for (var i = 0; i < this.bricIframes.length; i++){
            if (win === this.bricIframes[i].contentWindow) return this.bricIframes[i];
        }
    };

    ////////// methods related to DOM
    // Probably will be refactored to MasterDocumentManager

    // Method returns a queryString from <param> tags inside and <object>.
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

MessageBroker.prototype.convertObjectTagToIframeTag = function () {
		// Turn the <object> tags into <iframe> tags to work around webkit bug https://bugs.webkit.org/show_bug.cgi?id=75395.
	    // Also append parameters to iframe url so they're accessible to the iframe implementation.
	    // To prevent the flicker when loading, you might want to do this transformation work before rendering the HTML in your player.
	    var objectNodes = document.querySelectorAll('object.bric');
	    [].forEach.call(objectNodes, function(objectNode){
	        var iframeNode = document.createElement('iframe');
	        iframeNode.setAttribute('sandbox', 'allow-scripts');

	        // Copy over whitelisted attributes from the <object> to the <iframe>.
	        ['height','width','class','style'].forEach(function(attrName){
	            var attrValue = objectNode.getAttribute(attrName);
	            if (attrValue !== null) iframeNode.setAttribute(attrName, attrValue);
	        });

	        var queryString = buildQueryStringFromParams(objectNode);
	        var url = objectNode.getAttribute('data') + '?' + queryString;
	        iframeNode.setAttribute('src', url);
	        // Swap the <object> for the <iframe> node.
	        objectNode.parentNode.replaceChild(iframeNode, objectNode);
	    });
    };
    
