/* Message Broker
 */

/**$
 *
 * 
 ev {
 	data: {
		eventName: changed, submited, 
		sourceObjectId:
 	}
 }
 */
var MessageBroker = function() {

	var init - function() {
		// Handle events.
        window.addEventListener('message', function(e){
            if (e.data.method === 'save') saveGlobalData(e);
            if (e.data.method === 'resize') resize(e);
        });
	}

}
