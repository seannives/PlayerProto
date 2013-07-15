<%@ page language="java"%>

<%@page session="false"%>
<%@page import="java.net.*,java.io.*, java.util.*"%>

<%!
   
%>

<%
	response.addHeader("Expires","-1");
	response.addHeader("Pragma","no-cache");
%>
<!DOCTYPE html>
<html>
<head>
<style type="text/css">
.headers,.console,.playerControls,.playerFrameDiv {
	width: 98%;
	padding: 2px;
	margin: 5px 0px 0px 0px;
}

div.console {
	text-align: left;
	height: 100px;
	overflow: auto;
	border-width: 2px 1px 1px 1px ;
	border-color : orange;
	border-style:solid;
	border-radius : 5px;
	display : none
}

.allWrapper {
	padding: 5px;
	text-align: left;
}

.headers {
	height: 50px;
	text-align: left;
	border: none;
	font-size: 110%;
	font-weight: bold;
}

.playerControls {
	text-align: right;
	border: none;
}

div.playerFrameDiv {
	height: 300px;
	text-align: left;
	overflow: hidden;
	border: 1px solid orange;
	border-radius : 5px;	
}

.consep {
	height: 0px;
	border-width : 2	px 0px 0px 0px;
	border-style : dashed;
	width: 98%;
	background-color: white;
	border-color :#fffbce;
}
</style>
<script type="text/javascript"
	src="http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script>
<script type="text/javascript"
	src="http://ajax.cdnjs.com/ajax/libs/json2/20110223/json2.js"></script>


<script type="text/javascript">
	// Should not be hard code. Should be handed over by the external code
	// Invoking code. This file plays the question sequentially.
	// Inspired from PAF JS code :)
 	var input = {
 			custom_assignment_guid : '55b485ec-c09b-40e0-8ab2-0c96f948c12a',
 			custom_assignment_format : 'application/vnd.pearson.paf.v1.assignment+json'
 	};
 
 	var $ = jQuery;
 	var data = null;
 	

    
    $(window).load (function () {
    	
    	var CON = {} ;
    	CON.condiv = $('#console').get (0);
    	// To disable console messaging and display. make this false.
    	CON.active = true;
    	
    	if (!!CON.active) {
    		$(CON.condiv).show ();
    	}
   		
		window.console = function (msg) {
			if (!!CON.active) {
				$(CON.condiv).append ("<div>" + msg + "</div>");
				$(CON.condiv).append ('<div class="consep">&nbsp;</div>');
				CON.condiv.scrollTop = CON.condiv.scrollHeight;
			}
		};
    	
		/**
		* Our POC launcher for Assessment. In real case this will undergo drastic changes.
		*/
    	
	 	window.doPrep = function (seqURL, playerVars) {
			// Creates and instance of Player
	 		var aPlayer = new window.AssessmentPlayer ();
			
			// Binds the next button click
	 		$('#next').click (function () {
	 			if (aPlayer.getCurrentIndex() >= aPlayer.itemCount() -1) {
	 				console (aPlayer.report());
	 			} else {
	 				aPlayer.next();
	 			}
	 		});
	 		
	 		// Binds various call back listeners with player/
	 		aPlayer.bind( aPlayer.EVENT_SEQUENCE_LOADED /*"SequenceLoaded" */, function (evt, activity) {

	 	        if (aPlayer.itemCount() > 0) {
	 	        	aPlayer.playItem(0);
	 	        }

	 	        $('.headers').html(activity.overallActivity.title);
	 	        console("Loaded complete sequence and overall activity. Total item count = " + aPlayer.itemCount());

	 		});
	 		
	 		aPlayer.bind (aPlayer.EVENT_ITEM_LOADED /*"ItemLoaded" */, function (evt, index) {
	 			console("Item loaded = " + (index + 1)+  " out of " + aPlayer.itemCount());
	 		});
	 		
	 		aPlayer.bind (aPlayer.EVENT_SEQUENCE_FINISHED /*"SequenceFinished"*/, function () {
	 			console ("Cordinator got Sequence Finished... About to fire report..")
	 			console (aPlayer.report ());
	 		});
	 		
	 		// Then inits player... 
	 		aPlayer.initialize (seqURL, playerVars, 'test1');
	 	};
	 	
	 	$.ajax ({
	 		url : "/ecourses-paf-proxy/pafpx/lti/generate",
	 		data : {
	 			uid : 'test1',
	 			cid : 'course',
	 			custom_assignment_guid : input.custom_assignment_guid,
	 			custom_assignment_format : input.custom_assignment_format
	 		},
	 		success : function(json) {
	 			console ("Sequence url = " + json.context.seqURL);
	 			doPrep (json.context.seqURL, json.context.playerVars);
	 		},
	 		error : function (d) {
	 			console ("error getting sequence url = " + JSON.stringify(d));
	 		},
	 		type : 'GET',
			async : false 				
	 	});	 	
    });
 	
 	window.AssessmentPlayer = function () {
 		//initialize (seqURL, playerVars, playerDivId);
 	};
 	
 	var _APPROT = window.AssessmentPlayer.prototype = {
 			
 		 EVENT_ITEM_LOADED: "ItemLoaded",
 		 EVENT_SEQUENCE_LOADED: "SequenceLoaded",
 		 EVENT_SEQUENCE_FINISHED: "SequenceFinished",
 		 
 		 /**********************************************
 		 *  Declaration Section. (Not needed Just for clarity)
 		 **********************************************/
 		 
  		_seqURL : null,
  		
  		_playerVars : null,
  		
  		_bindings : null,
  		
  		_items : null,
  		
  		_currentIndex : 0,
  		
  		_nodeResultRequests : null,
  		
  		_activitySequence : null,
  		
  		_sequenceNodes : null,
  		
  		_itemPlayers : null, 		 
 		
 		_hubService : null,
 		
 		_playerFrameId : null,
 		
 		_activityFrame : null,
 		
 		_playerLoader : null,
 		
 		_hubService :  null,
 		
 		initialize : function (seqURL, playerVars, playerDivId) {
 	 		this._seqURL = seqURL;
 	 		
 	 		this._playerVars = playerVars;
 	 		
 	 		this._bindings = {};
 	 		
 	 		this._items = [];
 	 		
 	 		this._currentIndex = -1;
 	 		
 	 		this._nodeResultRequests = [];
 	 		
 	 		this._activitySequence = null;
 	 		
 	 		this._sequenceNodes = {};
 	 		
 	 		this._itemPlayers = {};
 	 		
 	 		this.registerPlayers (playerVars);
 	 		
 	 		this._playerFrameId = playerDivId + "_if";
 	 		// Need to use HTML5 stylers
 	 		$('#' + playerDivId).append('<iframe id="' + this._playerFrameId + 
 	 				'" + width="100%" height="100%" frameBorder="0" scrolling="no"></iframe>');
 	 		
 	 		this._activityFrame = $('#' + this._playerFrameId)[0];
 	 		this.setPlayerLoader ( new window.PlayerLoader (this._activityFrame));
 	 		
 	 		this._hubService = new window.HubService ();
 	 			
 	        if (playerVars) {
 	            this.registerPlayers(playerVars);
 	        } 			
 	        
 	        this._initActivitySequence();
 		},
 		
 	    _clearData: function () {
 	        this._items = [];
 	        this._sequenceNodes = {};
 	        this._bindings = {};
 	    },
 		
 		_initActivitySequence : function () {
 			// First get Activity Sequence
 			this._activitySequence = this._hubService.getRichSequence (this._seqURL);
 			// Process Activity Sequence
 			this._processSequence (this._activitySequence);
 		},
 		
 		
 	    bind: function (eventName, callback, context) {
 	        if (context) {
 	            var newCallback = function () {
 	                callback.apply(context, arguments);
 	            };
 	            $(this).bind(eventName, newCallback);
 	        } else {
 	            $(this).bind(eventName, callback);
 	        }
 	    }, 		
 	    
 	    getCurrentIndex : function () {
 	    	return this._currentIndex;
 	    },
 	    
 	    /**
 	    * This event will inform any listeners that an activity was successfully loaded
 	    */
 	    itemLoaded: function (index) {
 	    	this._currentIndex = index;
 	        $(this).trigger(this.EVENT_ITEM_LOADED, index);
 	    },

 	    sequenceLoaded: function (activitySequence) {
 	        $(this).trigger(this.EVENT_SEQUENCE_LOADED, activitySequence);
 	    },

 	    /**
 	    * This event will inform any listeners that the sequence has been completed.
 	    */
 	    sequenceFinished: function () {
 	    	console ("AM About to trigger sequence finished...")
 	        $(this).trigger(this.EVENT_SEQUENCE_FINISHED);
 	    }, 	    
 	    
 	    setPlayerLoader: function (playerLoader) {
 	        this._playerLoader = playerLoader;
 	        playerLoader.bind(playerLoader.EVENT_NODERESULT, this._processNodeResult, this);
 	        playerLoader.bind(playerLoader.EVENT_SEQUENCENODE_LOADED, this._processSequenceNodeLoaded, this);
 	    }, 	    
 		
 	    itemCount: function () {
 	        return this._items === null ? 0 : this._items.length;
 	    }, 		
 		
 	    registerPlayers: function (players) {
 	        if (this._itemPlayers == null)
 	            this._itemPlayers = {};
 	        $.extend(this._itemPlayers, players);
 	    },
 			
 		_processSequence : function  (activitySequence) {
 			
 	        var activity = activitySequence.overallActivity;

 	        if (!activity) {
 	            console('NULL activity');
 	            return;
 	        }

 	        //Reading in all binding
 	        if (!activity.assignmentContents) {
 	            console("assignmentContents missing from sequence.");
 	            return;
 	        }

 	        var bindings = activity.assignmentContents.binding;
 	        if (!jQuery.isArray(bindings)) {
 	            bindings = [bindings];
 	        }

 	        var context = this;
 	        $.each(bindings, function (i, binding) {
 	            context._bindings[binding["@id"]] = binding;
 	            context._items.push(binding);
 	        });
 	        
 	       // Inform all listeners ..
 	       this.sequenceLoaded(activitySequence);
 		},
 		
 	   _processNodeResult: function (evt, nodeResult) {
			console ("Process Node result ... . AM recieved message");
 	        //Validete existence of sequenceNodeId
 	        if (!nodeResult.sequenceNodeId) {
 	            console("NodeResult from item player is missing the sequenceNodeId reference");
 	            return;
 	        }

 	        //Find which itemIndex we're talking about
 	        var itemIndex = this._getItemIndexFromSequenceNodeId(nodeResult.sequenceNodeId);

 	        if (itemIndex < 0) {
 	            console("NodeResult bindingId can not be found");
 	            return;
 	        }

 	        //Call filterNodeResult to will allow decednent classes to modify it.  ActivityManagerNative will update nextBinding
 	        this.filterNodeResult(nodeResult);
 	        this._postNodeResult(itemIndex, nodeResult);
 	    }, 		
 	    

 	    _postNodeResult: function (index, result) {
			console ("About to post node result to hub...");
 	        var context = this;

 	        var sequenceNode = this.getItem(index).sequenceNode;

 	        var ret = this._hubService.postNodeResult(sequenceNode, result);
 	        console ("Posted node result to hub..." + JSON.stringify (result));
 	        context._nodeResultPosted(ret);
 	    }, 	  
 	    
 	    /**
 	    * Called to process nodeResults.  This routine is overridden by the descendent class so I'm not sure if if should have an _ or not??
 	    */
 	    _nodeResultPosted: function (resultResponse, reason) {

 	        if (! resultResponse) {
 	        	console ("No Node result response from hub ... should be over ");
 	            //The Hub didn't return the next sequence node, so we're done
 	        	this.sequenceFinished();
 	        } else {
 	        	console ("Got Node result response from hub ... about to process new Sequence Node ");
 		        //This code should look to display a new question possibly
 		        if (resultResponse["@type"] != "SequenceNode") {
 		            console("Results are not in the form of a SequenceNode");
 		            return;
 		        }

 	            this._processSequenceNode(resultResponse);
 	        }

 	    }, 	    
 	    
 	    /**
 	    * When a NodeResult is received from the player it is first vetted by the ActivityManagerBase.
 	    * In this routine we can decorate with other info.
 	    */
 	    filterNodeResult: function (nodeResult) {

 	        //Look for a message Id.  If one exists look up original request and decide what to do.
 	        var messageId = nodeResult.messageId;
 	        if (messageId) {

 	            //Find initial request beased on messageId
 	            var requestMessage = this._nodeResultRequests[messageId];
 	            if (!requestMessage) {
 	                //TODO - some day we may want to just change this to a $.logThis - for now though I think
 	                //it should be in our faces.
 	                console("RequestNodeResult message for messageId " + messageId + " can not be found.");
 	                return;
 	            }

 	            //Remove this message request from the dictionary.
 	            delete this._nodeResultRequests[messageId];

 	            //Double check the sequenceNodeId returned by the Player with that of the request.  They should match.
 	            if (requestMessage.sequenceNodeId != nodeResult.sequenceNodeId) {
 	                console("NodeResult contains a sequenceNode that does not match requested sequenceNode");
 	                return;
 	            }

 	            //Extract the original reason for this request
 	            var reason = requestMessage.reason;

 	            if (reason) {
 	                switch (reason["@type"]) {
 	                    case "DisplayItem":
 	                        nodeResult.nextBinding = this.getItem(reason.itemIndex)["@id"];
 	                        nodeResult.nextIndex = reason.itemIndex + 1;
 	                        break;
 	                    case "Finish":
 	                    	// we signal end of assignment by: nextActivity is undefined,
 	                    	// nextBinding is undefined, computeNext is undefined or false
 	                    	delete nodeResult.nextActivity;
 	                    	delete nodeResult.nextBinding;
 	                    	delete nodeResult.computeNext;
 	                        break;
 	                }
 	            }
 	        }
 	    } ,    
 		

 	    _processSequenceNodeLoaded: function (evt, message) {
 	        var sequenceNodeId = message.sequenceNodeId;
 	        if (sequenceNodeId) {
 	            //retrieve itemIndex stored along with sequenceNode
 	            var index = this._getItemIndexFromSequenceNodeId(sequenceNodeId);
 	            if (index >= 0)
 	                this.itemLoaded(index);
 	        }
 	    }, 		
 	    
 	    _getItemIndexFromSequenceNodeId: function (sequenceNodeId) {
 	        var sequenceNode = this._sequenceNodes[sequenceNodeId];
 	        if (sequenceNode) {
 	            return sequenceNode.nodeIndex;
 	        } else {
 	            return -1;
 	        }
 	    }, 	    
 		
 	    playItem: function (index) {
 	    	console ("Calling play item = " + index);
 	        if (this._currentIndex >= 0) {
 	        	console ("Request node result for current index = " + this._currentIndex);
 	            this._requestItemNodeResult(this._currentIndex, { "@type": "DisplayItem", itemIndex: index });
 	        } else {
 	            this.getSequenceNode(index);
 	        }
 	    },
 	    
 	    next: function () {
 	        var nextIndex = this._currentIndex + 1;
 	        
 	        console ("Current index = " + this._currentIndex);
 	        if (nextIndex < this.itemCount()) {
 	            this.playItem(nextIndex);
 	        }
 	    },

 	    prev: function () {
 	        var prevIndex = this._currentIndex - 1;
 	        if (prevIndex >= 0) {
 	            this.playItem(prevIndex);
 	        }
 	    },

 	    finish: function () {
 	        //Attempt to post current item.
 	        if (this._currentIndex >= 0) {
 	            this._requestItemNodeResult(this._currentIndex, { "@type": "Finish" });
 	        } else {
 	            //this.parent(); // What is this ?? 
 	        }
 	    }, 	    
 	    
 	    getItem: function (index) {
 	        return this._items[index];
 	    },
 	    
 	    _requestItemNodeResult: function (index, reason) {
 	        var item = this.getItem(index);

 	        //Need a unique id that we'll use to identify the return message.
 	        //We'll ust the sequenceNode id
 	        var sequenceNodeId =  item.sequenceNode["@id"];
 	        var messageId = sequenceNodeId;

 	        //Store off the reason with the bindindId so when the result 
 	        //comes back it will know what do to with it.
 	        this._nodeResultRequests[messageId] = {
 	            sequenceNodeId: sequenceNodeId,
 	            reason: reason
 	        };

 	       var request = {
 	            "@context": "http://purl.org/pearson/paf/v1/ctx/core/NodeResultRequest",
 	            "@type": "NodeResultRequest",
 	            messageId: messageId,
 	            sequenceNodeId: sequenceNodeId
 	        };
			
 	       	console ("Node Result to be posted to player : data = " + JSON.stringify (request));
 	        this.postPlayerMessage(request);
 	    },
 	    
 	   getSequenceNode: function (index) {

 	        // The url we post to is stored in the activity sequence
 	        var url = this._activitySequence.nodeCollection;

 	        var activity = this.getItem(index);

 	        var targetBinding = activity["@id"];

 	        // index in the server is 1 based
 	        // TODO - not sure what nodeIdex will be used for.  Ask someone.
 	        var nodeIndex = index + 1;

 	        //this._checkHubService();
 	        var sequenceNode =  this._hubService.getSequenceNode(url, targetBinding, nodeIndex);
 	        this._processSequenceNode(sequenceNode);
 	    },
 	    
 	    _processSequenceNode: function (sequenceNode) {

 	        this._registerSequenceNode(sequenceNode);
 	        this.executeSequenceNode(sequenceNode);
 	    },
 	    
 	     //This method will register the sequenceNode with the item in it's associated with.
 	     // This method covers some PAF bugs
 	    _registerSequenceNode: function (sequenceNode) {

 	        //TODO - there's a bug in the hub where the very first sequenceNode returns a nodeIndex = 1 and it should
 	        //be 0, so for now, I'm going to look to see if the list is empty.  If so, I'll set the index to 0.
 	        //When the bug is fixed we can remove this code.
 	        if ($.isEmptyObject(this._sequenceNodes)) {
 	            sequenceNode.nodeIndex = 0;
 	        } else {
 	            //This is still part of the workaround.  If it's not empty, we should check for an existing sequenceNode. If
 	            //we find a match we should just set the nodeIndex equal.  I'm doing this because when you go back to 
 	            //the first one, it's still reporting 1 and it should be zero.
 	            var seq = this._sequenceNodes[sequenceNode["@id"]];
 	            if (seq)
 	                sequenceNode.nodeIndex = seq.nodeIndex;
 	        }

 	        this._sequenceNodes[sequenceNode["@id"]] = sequenceNode;

 	        //For now assume that nodeIndex stored in sequenceNode maps directly to an item.
 	        //Establish a relationship between an "Item" and "SequenceNode"
 	        this._items[sequenceNode.nodeIndex].sequenceNode = sequenceNode;


 	        //We should determine if we have a contentType override registered.  If so,
 	        //just replace it in the sequenceNode so we can forget about it.
 	        if (sequenceNode.player && sequenceNode.player.contentType) {
 	            var playerUrl = this._getPlayerUrl(sequenceNode.player.contentType);
 	            if (playerUrl) {
 	                sequenceNode.player.frameFrontend.frameURI = playerUrl;
 	            }
 	        }
 	    }, 
 	    
 	    _getPlayerUrl: function (contentType) {
 	        return this._itemPlayers[contentType];
 	    },
 	    
 	    executeSequenceNode: function (sequenceNode) {
 	        this._displaySequenceNode(sequenceNode);
 	    },

 	    _displaySequenceNode: function (sequenceNode) {

 	        var playerUrl = sequenceNode.player.frameFrontend.frameURI;

 	        var context = this;

 	        //Calling loadPlayer using a deffered. This way the details 
 	        //of determining when it's loaded can be dealt with inside loadPlayer
 	        this.loadPlayer(playerUrl).done(
 	            function () {
 	                context.postSequenceNode(sequenceNode);
 	            }
 	        );

 	    },
 	    
 	   	postSequenceNode: function (sequenceNode) {
 	        this.postPlayerMessage(sequenceNode);
 	    },

 	    postPlayerMessage: function (message) {
 	        this._playerLoader.postMessage(message);
 	    }, 	    
 	    
 	    loadPlayer: function (playerUrl) {
 	        return this._playerLoader.loadPlayer(playerUrl);
 	    },
 	    
 	    report: function () {
 	    	console ("In report ()...")
 	        return this._hubService.getReport(this._activitySequence.guid);
 	    },
 	};
 	
 	
 	/**************************************************************************
 	*  Player Loader 
 	**************************************************************************/
 	
 	var PlayerLoader = window.playerLoader = function (playerFrame) {
 		this.initialize (playerFrame);
 	};
 	
 	PlayerLoader.prototype = {

 	    _playerReadyDeferred: null,

 	    _playerFrame: null,

 	    timeout: 10000,

 	    _timeoutHandle: null,

 	    EVENT_NODERESULT: "NodeResult",
 	    EVENT_SEQUENCENODE_LOADED: "SequenceNodeLoaded",
 	    EVENT_GETSEQUENCENODE: "GetSequenceNode",

 	    /**
 	    * Constructor
 	    */
 	    initialize: function (playerFrame) {
 	        this._playerFrame = playerFrame;
 	        this._registerMessageHandler();

 	    },

 	    /**
 	    * Call to register for events using a callback with an optional context.
 	    */
 	    bind: function (eventName, callback, context) {
 	        if (context) {
 	            var newCallback = function () {
 	                callback.apply(context, arguments);
 	            };
 	            $(this).bind(eventName, newCallback);
 	        } else {
 	            $(this).bind(eventName, callback);
 	        }
 	    },

 	    /**
 	    * Load frame with playerUri and optional messageId
 	    */
 	    loadPlayer: function (playerUri) {
 	        return this._loadPlayer(playerUri, this._loadPlayerSource);
 	    },

 	    /*
 	    * Post and html5 message to the player
 	    */
 	    postMessage: function (message) {
 	        var msg = JSON.stringify(message);
 	        this._playerFrame.contentWindow.postMessage(msg, this._playerFrame.src);
 	    },

 	    _handleMessage: function (message) {

 	        switch (message["@type"]) {
 	            case "PlayerReady":
 	                this._playerReady();
 	                break;
 	            case "NodeResult":
 	                this._handleNodeResult(message);
 	                break;
 	            case "SequenceNodeLoaded":
 	                //Item player is responding that it has finished loading a sequence.
 	                this._handleSequenceNodeLoaded(message);
 	                break;
 	            //These messages will originate from a Custom Assignmen Player
 	            case "GetSequenceNode":
 	                this._handleGetSequence(message);
 	                break;
 	            default:
 	   	            console("PAF Activity Manager received unknown message:", message);
 	                break;
 	        }
 	    },

 	    _handleNodeResult: function (message) {
 	        $(this).trigger(this.EVENT_NODERESULT, message);
 	    },

 	    _handleSequenceNodeLoaded: function (message) {
 	        $(this).trigger(this.EVENT_SEQUENCENODE_LOADED, message);
 	    },

 	    _handleGetSequence: function(message) {
 	        $(this).trigger(this.EVENT_GETSEQUENCENODE, message);
 	    },

 	    _registerMessageHandler: function () {

 	        var context = this;
 	        $(window).on("message", function (e) {

 	            //Do security check here.  If we pass then interpret data.
 	            //To security check and make sure this message has originated from our frame.
 	            if (e.originalEvent.source !== context._playerFrame.contentWindow)
 	                return;

 	            //Security check passed so process the message
 	            var message = $.parseJSON(e.originalEvent.data);
 	            console("PAF Activity Manager received message:", message);
 	            context._handleMessage(message);
 	        });
 	    },

 	    _clearTimeout: function () {
 	        if (this._timeoutHandle) {
 	            clearTimeout(this._timeoutHandle);
 	            this._timeoutHandle = null;
 	        }
 	    },

 	    _playerReady: function () {
 	        //If there is a timeout handle, just clear it.
 	        this._clearTimeout();

 	        var deferred = this._playerReadyDeferred;
 	        if (deferred) {
 	            deferred.resolve();
 	            this._playerReadyDeferred = null;
 	        }
 	    },

 	    _loadPlayer: function (playerUri, sourceLoader) {

 	        var deferred = this._playerReadyDeferred = $.Deferred();

 	        sourceLoader.apply(this, [playerUri]);

 	        var context = this;

 	        //If deferred is not already resolved, then set a timer just in case
 	        if (deferred.state() == "pending") {
 	            context._timeoutHandle = setTimeout(function () {
 	                //since timeout occurred, let's just reset handle so we don't call clearTimeout inside _playerReady
 	                context._timeoutHandle = null;
 	                console("Player considered loaded after timeout");
 	                context._playerReady();
 	            }, this.timeout);
 	        }

 	        return deferred.promise();
 	    },

 	    _loadFrameSource: function (playerUri) {
 	        var context = this;

 	        if (this._playerFrame.src != playerUri) {
 	            console("player loading...", playerUri);
 	            this._playerFrame.src = playerUri;
 	        } else {
 	        	console("Player already loaded", playerUri);
 	            context._playerReady(playerUri);
 	        }
 	    },

 	    _loadPlayerSource: function (playerUri, messageId) {
 	        this._loadFrameSource(playerUri);
 	    }

 	};
 	
 	/**************************************************************************
 	*  HUB - SEVICE 
 	**************************************************************************/
 	
 	var HubService = window.HubService = function () {
 		
 	};
 	
 	window.HubService.prototype =  {
 		
 	    getRichSequence : function (sequenceUrl) {
 	    	var ret = null;
 	        $.ajax({
 	            type: "POST",
 	            async: false,
 	            contentType : 'application/json',
 	            url: "/ecourses-paf-proxy/pafpx/paf/genpx",
 	            data : JSON.stringify ({
 	                headers: {
 	                    Accept : "application/vnd.pearson.paf.v1.richsequence"
 	                },
 	                url : sequenceUrl,
 	                method : "GET"
 	            }),

 	            success: function (json) {
 	            	console ("Get Rich Sequence Success");
 	            	ret = $.parseJSON(json.content);
 	            	console ("Ret rich sequence =" + JSON.stringify (ret));
 	            },
 	            error: function (xhr, ajaxOptions, thrownError) {
 	            	console ("grr");
 	                console("\r\nstatus = " + xhr.status
 	                    + "\r\nthrownError = " + thrownError);
 	            }
 	        });
 	        return ret;
 	    },
 	    
 	    getSequenceNode: function (url, targetBinding, nodeIndex) {
			console ("URL ====== " + url);
 	        // post data
 	        var data = {
 	            "@context": "http://purl.org/pearson/paf/v1/ctx/core/SequenceNode",
 	            "@type": "SequenceNode",
 	            "targetBinding": targetBinding,
 	            "nodeIndex": nodeIndex
 	        };
			var ret = null;
 	        $.ajax({
 	            type: "POST",
 	           	url: "/ecourses-paf-proxy/pafpx/paf/genpx",
 	            async: false,
 	            contentType : 'application/json',
 	            data : JSON.stringify ({
 	                headers: {
 	                	 "Accept": "application/vnd.pearson.paf.v1.node.rich+json"
 	                },
 	                url : url,
 	                method : "POST",
 	                data : JSON.stringify(data),
 	                contentType : 'application/vnd.pearson.paf.v1.node+json;charset=utf-8'
 	            }),
 	            
 	            dataType: "json",
 	            success: function (json) {
 	            	console ("getSequenceNode Success");
 	            	ret = $.parseJSON(json.content);
 	            	console ("Ret rich sequence =" + JSON.stringify (ret));
 	            },
 	            error: function (xhr, ajaxOptions, thrownError) {
 	                console(url + "\r\nHub Servic:: status = " + xhr.status
 	                        + ", thrownError = " + thrownError);
 	            }
 	        });
 	        
 	        return ret;
 	    },
 	    
 	    postNodeResult: function (sequenceNode, result) {

 	        var url = sequenceNode.resultCollection + "?sequenceNodeGuid=" + encodeURIComponent(sequenceNode.guid);
			var ret = null;
 	        // post the result to the hub
 	        $.ajax({
 	        	
 	            type: "POST",
 	           	url: "/ecourses-paf-proxy/pafpx/paf/genpx",
 	            async: false,
 	            contentType : 'application/json',
 	            data : JSON.stringify ({
 	                headers: {
 	                	 "Accept": "application/vnd.pearson.paf.v1.node.rich+json"
 	                },
 	                url : url,
 	                method : "POST",
 	                data : JSON.stringify(result),
 	                contentType : 'application/json; charset=utf-8'
 	            }),
 	            
 	            dataType: "json", 	        	
 	            success: function (response) {
 	            	console ("Post Node result success. Content = " + response.content);
 	            	ret = $.parseJSON (response.content);
 	            	console ("Ret = " + JSON.stringify (ret));
 	            	
 	            },
 	            error: function (xhr, ajaxOptions, thrownError) {
 	                console(url + "\r\nHub Servic:: status = " + xhr.status + ", thrownError = " + thrownError);
 	            }
 	        });
 	        return ret;
 	    }, 	    

 	    getReport: function (guid) {
 	    	console ("In get report . Guid = " + guid);
 	        var url = "/paf-hub/resources/reports?guid="
 	                + encodeURIComponent(guid);
			var ret = null;
 	        $.ajax({
 	        	
 	            type: "POST",
 	            async: false,
 	            contentType : 'application/json',
 	            url: "/ecourses-paf-proxy/pafpx/paf/genpx",
 	            data : JSON.stringify ({
 	                url : url,
 	                method : "GET",
 	                contentType: "application/html",
 	            }),
 	        	
 	            success: function (json) {
 	            	console ("Get report success. Content = " + json.content);
 	            	ret = json.content;
 	            },
 	            error: function (xhr, ajaxOptions, thrownError) {
 	                console(url + "\r\nHub Service:: status = "
 	                                + xhr.status + ", thrownError = " + thrownError);
 	            }
 	        });
			return ret;
 	    }


 	} ;
 	
 	
 	
 	
 </script>
</head>
<body>
	<div class="allWrapper">
		<div class="headers"></div>

		<div id="test1" class="playerFrameDiv"></div>

		<div class="playerControls">
			<button id="next">Next</button>
		</div>

		<div id="console" class="console"></div>
	</div>
</body>
</html>
