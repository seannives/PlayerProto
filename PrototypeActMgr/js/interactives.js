function interactives() {
	
	// private functions
	function loadWidget(widget, content) {

		var widgets = {
			// probably want to abstract these out into individual functions
			'button' : function(content) {
				var config = {
					"id" : content.targetActivity.master.widget.id,
					"text" : content.targetActivity.master.widget.text
				};
				var mybutton = ibutton();
		        mybutton.init(config, eventManager);
		        $('#' + content.targetActivity.master.widget.targetid).append(mybutton.getRootEl());
		        // subscribe to the button press
				eventManager.subscribe(mybutton.pressedEventId, function(){alert('yay');});
			}//, add other widgets here
	    };
	   
	    if (typeof widgets[widget] !== 'function') {
	      throw new Error('Invalid widget.');
	    }

	    return widgets[widget](content);
	}


	// public
	return {
		init : function(content, eventManager) {

			// loop over each nested widget (do this later...we don't have nested widgets yet in sample json)

			// load the widgets
			// option 1: loadWidget (what we're doing below).
			//           Allows you to pair down the config, instantiate the widget, and handle eventMgm callbacks.
			//           Probably want each "case" to pass to a private function
			// option 2: beef up each individual widget's init so we can just pass it the content block.  Then
			//           you don't have to maintain a case list to match each widget.  Is that important/worthwhile  
			//           enough to go this route?

			loadWidget(content.targetActivity.master.widget.type, content);
		}
	};
};

function ibutton() {
	return {

		/* **************************************************************************
		 * ibutton                                                              *//**
		 *
		 * @constructor - or at least it was once
		 *
		 * The button widget creates a clickable button that publishes events.
		 *
		 * @param {Object}		config		-The settings to configure this button
		 * @param {string}		config.id	-String to uniquely identify this button
		 * @param {string}		config.text	-The text to be displayed on the button
		 *
		 * @param {Object}		eventManager
		 *
		 * NOTES: firefox doesn't support HTML5 buttons, they degrade to numeric input
		 * fields.
		 **************************************************************************/
		init : function (config, eventManager)
		{
			/**
			 * A unique id for this instance of the button widget
			 * @type {string}
			 */
			this.id = config.id;
			
			/**
			 * The event manager to use to publish (and subscribe to) events for this widget
			 * @type {EventManager}
			 */
			this.eventManager = eventManager;
			
			/**
			 * The event id published when this button is clicked.
			 * @const
			 * @type {string}
			 */
			this.pressedEventId = this.id + '_Pressed';
			
			var text = config.text !== undefined ? config.text : "Default text";
			
			/**
			 * The root element of the element tree for this button. It should
			 * be appended into the document where it is expected to be displayed.
			 * @type {Element}
			 * @private
			 *
			 */
			this.rootEl_ = $('<div><button type="button">' + text + '</button></div>');
			
			// publish events when clicked
			var that = this;
			$("button", this.rootEl_).click(
				function()
				{
					that.eventManager.publish(that.pressedEventId);
				});
			
		}, // end of button constructor

		/* **************************************************************************
		 * Button.getRootEl                                                     *//**
		 *
		 * Get the root element of this button widget.
		 *
		 **************************************************************************/
		getRootEl : function()
		{
			return this.rootEl_;
		}
	};
};