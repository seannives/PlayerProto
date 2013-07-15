/**
 * Currently in POC stage... Need to separate out
 * into different files and may be use Common/RequireJS etc.
 * But Quite similar to Require JS style
 * once this code is run everything is available (Except console)
 * via the window.Ecourses and window.Ecourses.Paf objects globally.
 */

/**
 * Closure executor
 */
;(function() {
	
	/*
	 * Configture the PAF/Ecourses Namespaces.
	 */
	window.Ecourses = window.Ecourses || {};
	window.Ecourses.Paf = window.Ecourses.Paf || {};
	
	var PAF = window.Ecourses.Paf;
	
	/*
	 * Initialize console.
	 */
	window.console = function (msg) {
		if (window.console.active) {
			var con = $('#console');
			con.append ("<div>" + msg + "</div>");
			con.append ('<div class="consep">&nbsp;</div>');
			con[0].scrollTop = con[0].scrollHeight;
		}
	};	
	
	/*
	 * Called by Launcher if needed.
	 */
	window.console.init = function (bool) {
		if (bool === true) {
			$('#console').show();
			window.console.active = true;
		} else {
			$('#console').hide();
			window.console.active = false;
		}
		
	};	
	
	/*
	 * Extend PAF object have utility function
	 * Called by Launcher.
	 */
	$.extend(PAF, {
		getLtiLaunch : function (data, proxyURL) {
			var _proxyURL = (proxyURL ? proxyURL : "");
			var url = _proxyURL +  "/ecourses-paf-proxy/pafpx/lti/generate";
			var ret = null;
		 	$.ajax ({
		 		url : url,
		 		data : data,
		 		success : function(json) {
		 			console ("Sequence url = " + json.context.seqURL);
		 			ret = json;
		 			//doPrep (json.context.seqURL, json.context.playerVars, json.context.hubSession);
		 		},
		 		error : function (d) {
		 			console ("error in get Lti Launch = " + JSON.stringify(d));
		 		},
		 		type : 'GET',
				async : false 				
		 	});	
		 	
		 	return ret;
		}
	});
	/*
	 * Mainly as POC. Will need to separate out into different JS file
	 * and make more modular.
	 */
	PAF.AssessmentPlayerManager = function() {
		//initialize (seqURL, playerVars, _playerContainerId);
	};

	PAF.AssessmentPlayerManager.prototype = {

		EVENT_ITEM_LOADED : "ItemLoaded",
		EVENT_SEQUENCE_LOADED : "SequenceLoaded",
		EVENT_SEQUENCE_FINISHED : "SequenceFinished",

		/**********************************************
		 *  Declaration Section. (Not needed Just for clarity)
		 **********************************************/

		_seqURL : null,

		_playerVars : null,

		_bindings : null,

		_items : null,

		_nodeResultRequests : null,

		_activitySequence : null,

		_sequenceNodes : null,

		_itemPlayers : null,

		_hubService : null,

		_playerWrappers : null,

		_playIndex : -1,

		_recentNodes : null,

		initialize : function(seqURL, playerVars, hubSession, playerDivIdList, proxyURL) {

			this._nodeResultRequests = [];

			// Fetched in beginning and cached
			this._seqURL = seqURL;
			// Fetched in beginning and cached
			this._playerVars = playerVars;

			// Fetched in beginning and cached
			this._bindings = {};

			this._items = [];

			// This is fetched in the beginning
			// And cached..
			this._activitySequence = null;

			// Sequence nodes are never cached. Hence
			// This is dynamic
			this._sequenceNodes = {};
			// Fetched in beginning and cached
			this._itemPlayers = {};

			// Cached
			this._hubService = new PAF.HubService(hubSession, proxyURL);

			// Cached
			if (playerVars) {
				this.registerPlayers(playerVars);
			}

			// Wrapper for the various
			// player areas (typicall Iframes)
			this._playerWrappers = [];

			// This is a very temporary variable.
			this._recentNodes = [];

			var context = this;

			// Create Playerwrappers and stash it.
			$.each(playerDivIdList, function(i, name) {
				var pW = new PAF.AssessmentPlayerWrapper();
				pW.initialize(context, name);
				context._playerWrappers.push(pW);

				// Get PlayerLoader
				var playerLoader = pW.getPlayerLoader();

				playerLoader.bind(playerLoader.EVENT_NODERESULT, context
						._addArgs(context._processNodeResult, context, pW));
				playerLoader.bind(playerLoader.EVENT_SEQUENCENODE_LOADED,
						context._addArgs(context._processSequenceNodeLoaded,
								context, [ pW ]));
				// Write binder functions for events.
			});

			// Code which initiates fetching
			// of overall activity and processing
			// the sequnce nodes.
			console("About to init Activity Sequence");
			this._initActivitySequence();
			console("Completed init Activity Sequence");

			console("Completed init all");
		},

		getItem : function(index) {
			return this._items[index];
		},

		postLastResults : function() {

			// Already played .. Send message to player for Node Result
			// And post it to hub;
			var context = this;
			$
					.each(
							this._recentNodes,
							function(i, obj) {
								context
										._requestItemNodeResult(
												obj.seqNode,
												{
													"@type" : (obj.seqNode.nodeIndex == context._items.length - 1 ? "DisplayItem"
															: "DisplayItem"), // "Finish", //"DisplayItem", 
													itemIndex : obj.seqNode.nodeIndex
												}, obj.playerWrapper
														.getPlayerLoader());
							});
			// Clean up
			this._recentNodes = [];
		},

		playNext : function() {
			var context = this;

			$.each(this._playerWrappers, function(i, wr) {
				wr.getPlayerLoader().invisible();
			});

			// The total players
			var todoNodes = this._playerWrappers.length;
			// Clear recent nodes
			this._recentNodes = [];

			while (todoNodes > 0) {
				var seqNode = this._getNextSequenceNode();
				if (seqNode) {
					var pwCur = this._playerWrappers[this._playerWrappers.length
							- todoNodes];
					todoNodes--;

					var pLCur = pwCur.getPlayerLoader();
					this.executeSequenceNode(seqNode, pLCur);
					// Push recent nodes
					this._recentNodes.push({
						seqNode : seqNode,
						playerWrapper : pwCur,
					});

				} else {
					// TODO Raise sequence finished...
					this.sequenceFinished();
					break;
				}
			}
		},

		getPlayIndex : function() {
			return this._playIndex;
		},

		isOver : function() {
			return ((this.itemCount() - 1) <= this._playIndex);
		},

		isLast : function() {
			return ((this.itemCount() - 1) == this._playIndex);
		},

		_getNextSequenceNode : function() {
			if (!this.isOver()) {
				this._playIndex = this._playIndex + 1;

				var r = this.getSequenceNode(this._playIndex);
				if (r) {
					return r;
				} else {
					return null;
				}
			} else {
				return null;
			}
		},

		_addArgs : function(f, context, args) {
			return function() {
				var fArgs = [];
				$.each(arguments, function(i, obj) {
					fArgs.push(obj);
				});
				// Can use concat 
				$.each(args, function(i, obj) {
					fArgs.push(obj);
				});
				if (context) {
					f.apply(context, fArgs);
				} else {
					f.apply(undefined, fArgs);
				}
			};
		},

		_initActivitySequence : function() {
			// First get Activity Sequence
			this._activitySequence = this._hubService
					.getRichSequence(this._seqURL);
			// Process Activity Sequence
			this._processSequence(this._activitySequence);
		},

		bind : function(eventName, callback, context) {
			if (context) {
				var newCallback = function() {
					callback.apply(context, arguments);
				};
				$(this).bind(eventName, newCallback);
			} else {
				$(this).bind(eventName, callback);
			}
		},

		/**
		 * This event will inform any listeners that an activity was successfully loaded
		 */
		itemLoaded : function(index) {
			$(this).trigger(this.EVENT_ITEM_LOADED, index);
		},

		/**
		 * This event will inform any listeners that a sequence has been loaded.  This will 
		 * allow us to change our ajax calls to be asynchronous some day without affectng the caller.
		 */
		sequenceLoaded : function(activitySequence) {
			$(this).trigger(this.EVENT_SEQUENCE_LOADED, activitySequence);
		},

		/**
		 * This event will inform any listeners that the sequence has been completed.
		 */
		sequenceFinished : function() {
			console("AM About to trigger sequence finished...");
			$(this).trigger(this.EVENT_SEQUENCE_FINISHED);
		},

		/**************************************************************************
		 * Add the player loaders. And listen for events.
		 * Each player loader should expose APIs for the frameid/frame the 
		 **************************************************************************/
		_processSequenceNodeLoaded : function(evt, message, playerWrapper) {
			var pL = playerWrapper.getPlayerLoader();
			pL.visible();
			var sequenceNodeId = message.sequenceNodeId;
			if (sequenceNodeId) {
				//retrieve itemIndex stored along with sequenceNode
				var index = this
						._getItemIndexFromSequenceNodeId(sequenceNodeId);
				if (index >= 0) {
					// From index we can get player wrapper, item, sequence node etc.
					this.itemLoaded(index);
				}
			}
		},

		_getItemIndexFromSequenceNodeId : function(sequenceNodeId) {
			var sequenceNode = this._sequenceNodes[sequenceNodeId];
			if (sequenceNode) {
				return sequenceNode.nodeIndex;
			} else {
				return -1;
			}
		},

		itemCount : function() {
			return this._items === null ? 0 : this._items.length;
		},

		registerPlayers : function(players) {
			if (this._itemPlayers == null)
				this._itemPlayers = {};
			$.extend(this._itemPlayers, players);
		},

		_processSequence : function(activitySequence) {

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
				bindings = [ bindings ];
			}

			var context = this;
			$.each(bindings, function(i, binding) {
				context._bindings[binding["@id"]] = binding;
				context._items.push(binding);
			});

			console("About to trigger listerners");
			// Inform all listeners ..
			this.sequenceLoaded(activitySequence);
			console("Triggered listerners");
		},

		getSequenceNode : function(index) {

			// The url we post to is stored in the activity sequence
			var url = this._activitySequence.nodeCollection;

			var activity = this.getItem(index);

			var targetBinding = activity["@id"];

			// index in the server is 1 based
			var nodeIndex = index + 1;

			//this._checkHubService();
			var sequenceNode = this._hubService.getSequenceNode(url,
					targetBinding, nodeIndex);
			// Attach with activity
			if (sequenceNode) {
				// Map By Id
				this._sequenceNodes[sequenceNode["@id"]] = sequenceNode;
				// Attach to activity.
				activity.sequenceNode = sequenceNode;
				sequenceNode.nodeIndex = index;
				//sequenceNode.nodeIndex = (index == 0 ? 0 : sequenceNode.nodeIndex);

				if (sequenceNode.player && sequenceNode.player.contentType) {
					var playerUrl = this
							._getPlayerUrl(sequenceNode.player.contentType);
					if (playerUrl) {
						sequenceNode.player.frameFrontend.frameURI = playerUrl;
					}
				}
			} else {
				console("Unable to get sequence node for nodeIndex = "
						+ nodeIndex);
				throw "Unable to get sequence node for nodeIndex = "
						+ nodeIndex;
			}
			return sequenceNode;
		},

		_processSequenceNode : function(sequenceNode) {
			this.executeSequenceNode(sequenceNode);
		},

		_processNodeResult : function(evt, nodeResult, playerWrapper) {
			console("Process Node result ... . AM recieved message");
			//Validete existence of sequenceNodeId
			if (!nodeResult.sequenceNodeId) {
				console("NodeResult from item player is missing the sequenceNodeId reference");
				return;
			}

			//Find which itemIndex we're talking about
			var itemIndex = this
					._getItemIndexFromSequenceNodeId(nodeResult.sequenceNodeId);

			if (itemIndex < 0) {
				console("NodeResult bindingId can not be found");
				return;
			}

			//Call filterNodeResult to will allow decednent classes to modify it.  ActivityManagerNative will update nextBinding
			this.filterNodeResult(nodeResult);
			this._postNodeResult(itemIndex, nodeResult);
		},

		_postNodeResult : function(index, result) {
			console("About to post node result to hub...");

			var sequenceNode = this.getItem(index).sequenceNode;

			var ret = this._hubService.postNodeResult(sequenceNode, result);
			console("Posted node result to hub..." + JSON.stringify(result));
		},

		/**
		 * Not sure about the use of this function.
		 */
		filterNodeResult : function(nodeResult) {

			//Look for a message Id.  If one exists look up original request and decide what to do.
			var messageId = nodeResult.messageId;
			if (messageId) {

				//Find initial request beased on messageId
				var requestMessage = this._nodeResultRequests[messageId];
				if (!requestMessage) {
					console("RequestNodeResult message for messageId "
							+ messageId + " can not be found.");
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
		},

		_requestItemNodeResult : function(seqNode, reason, playerLoader) {

			//Need a unique id that we'll use to identify the return message.
			//We'll ust the sequenceNode id
			var sequenceNodeId = seqNode["@id"];
			var messageId = sequenceNodeId;

			//Store off the reason with the bindindId so when the result 
			//comes back it will know what do to with it.
			this._nodeResultRequests[messageId] = {
				sequenceNodeId : sequenceNodeId,
				reason : reason
			};

			var request = {
				"@context" : "http://purl.org/pearson/paf/v1/ctx/core/NodeResultRequest",
				"@type" : "NodeResultRequest",
				messageId : messageId,
				sequenceNodeId : sequenceNodeId
			};

			console("Node Result to be posted to player : data = "
					+ JSON.stringify(request));
			this.postPlayerMessage(request, playerLoader);
		},

		_getPlayerUrl : function(contentType) {
			return this._itemPlayers[contentType];
		},

		/**
		 * TODO : This should go into the player.
		 */
		executeSequenceNode : function(sequenceNode, playerLoader) {

			this._displaySequenceNode(sequenceNode, playerLoader);
		},

		/**
		 * TODO : This should go into the player.
		 */
		_displaySequenceNode : function(sequenceNode, playerLoader) {

			var playerUrl = sequenceNode.player.frameFrontend.frameURI;

			var context = this;

			this.loadPlayer(playerUrl, playerLoader).done(function() {
				context.postSequenceNode(sequenceNode, playerLoader);
			});

		},

		/**
		 * TODO : This should go into the player.
		 */
		postSequenceNode : function(sequenceNode, playerLoader) {
			this.postPlayerMessage(sequenceNode, playerLoader);
		},

		/**
		 * TODO : This should go into the player.
		 */
		postPlayerMessage : function(message, playerLoader) {
			playerLoader.postMessage(message);
		},

		/**
		 * TODO : This should go into the player.
		 */
		loadPlayer : function(playerUrl, playerLoader) {
			return playerLoader.loadPlayer(playerUrl);
		},

		/**
		 * TODO : Need to decide where this will go.....
		 */
		report : function() {
			console("In report ()...");
			return this._hubService.getReport(this._activitySequence.guid);
		},
	};

	/**********************************************************************
	 *  Assessment Player Wrapper to hold the mapper information between the 
	 *  player and container and also to perform the necessary initialization
	 *  on the DOM
	 **********************************************************************/

	PAF.AssessmentPlayerWrapper = function() {
		//initialize (seqURL, playerVars, playerDivId);
	};

	/**
	 *  Create the JS prototype object for creating the JS object
	 *  via new.
	 */
	PAF.AssessmentPlayerWrapper.prototype = {

		EVENT_ITEM_LOADED : "ItemLoaded",

		/**********************************************
		 *  Declaration Section. (Not needed Just for clarity)
		 **********************************************/
		_assPlrMrg : null,

		_playerLoader : null,

		_playerContainerId : null,

		initialize : function(assPlrMrg, _playerContainerId) {
			this._playerContainerId = _playerContainerId;

			var playerFrameWrapId = this._playerContainerId + "_wr";

			// We create a wrapper div for our assignment player
			var playerFrameId = playerFrameWrapId + "_if";
			// Need to use HTML5 stylers
			$('#' + _playerContainerId)
					.append(
							'<div id="'
									+ playerFrameWrapId
									+ '" style="width:100%; height:100%; margin:0px; border:0px; padding:0px;"></div>');

			var playerFrameWrap = $('#' + playerFrameWrapId)[0];

			$(playerFrameWrap)
					.append(
							'<iframe id="'
									+ playerFrameId
									+ '" width="100%" height="100%" frameBorder="0" scrolling="no"></iframe>');

			activityFrame = $('#' + playerFrameId)[0];

			// Create, initialize and stash the referecen to the player.
			this._playerLoader = new PAF.PlayerLoader(activityFrame,
					playerFrameWrap, playerFrameWrapId);
		},

		getPlayerLoader : function() {
			return this._playerLoader;
		},

		getPlayerContainerId : function() {
			return this._playerContainerId;
		},

	};

	/**************************************************************************
	 *  Player Loader. Similar to PAF loader. The loader is mapped to the 
	 *  container (Display) via the Player Wrapper object.
	 **************************************************************************/

	PAF.PlayerLoader = function(playerFrame,
			playerFrameWrap, playerFrameWrapId) {
		this.initialize(playerFrame, playerFrameWrap, playerFrameWrapId);
	};

	/**************************************************************************
	 *  Player Loader. Prototype. Helps creating of multple Player loader
	 *  via 'new' operator
	 **************************************************************************/

	PAF.PlayerLoader.prototype = {

		_playerFrameWrap : null,

		_playerFrameWrapId : null,

		_playerReadyDeferred : null,

		_playerFrame : null,

		timeout : 10000,

		_timeoutHandle : null,

		EVENT_NODERESULT : "NodeResult",
		EVENT_SEQUENCENODE_LOADED : "SequenceNodeLoaded",
		EVENT_GETSEQUENCENODE : "GetSequenceNode",

		/**
		 * Constructor
		 */
		initialize : function(playerFrame, playerFrameWrap, playerFrameWrapId) {
			this._playerFrameWrap = playerFrameWrap;
			this._playerFrameWrapId = playerFrameWrapId;
			this._playerFrame = playerFrame;
			this._registerMessageHandler();

		},

		/**
		 * Call to register for events using a callback with an optional context.
		 */
		bind : function(eventName, callback, context) {
			if (context) {
				var newCallback = function() {
					callback.apply(context, arguments);
				};
				$(this).bind(eventName, newCallback);
			} else {
				$(this).bind(eventName, callback);
			}
		},

		/**
		 * Hides the current wrapper. Indirectly this
		 * is usefult to hide the current question.
		 */
		invisible : function() {
			$(this._playerFrameWrap).hide();
		},

		/**
		 * Make the current wrapper visible. This indirectly
		 * shows the question. Useful when showing question once fully
		 * loaded.
		 */
		visible : function() {
			$(this._playerFrameWrap).show();
		},

		/**
		 * Load frame with playerUri and optional messageId
		 */
		loadPlayer : function(playerUri) {
			return this._loadPlayer(playerUri, this._loadPlayerSource);
		},

		/*
		 * Post and html5 message to the player
		 */
		postMessage : function(message) {
			var msg = JSON.stringify(message);
			this._playerFrame.contentWindow.postMessage(msg,
					this._playerFrame.src);
		},

		_handleMessage : function(message) {
			console("thing: " + message["@type"]);
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
				console("PAF Activity Manager received unknown message:",
						message);
				break;
			}
		},

		_handleNodeResult : function(message) {
			$(this).trigger(this.EVENT_NODERESULT, message);
		},

		_handleSequenceNodeLoaded : function(message) {
			$(this).trigger(this.EVENT_SEQUENCENODE_LOADED, message);
		},

		_handleGetSequence : function(message) {
			$(this).trigger(this.EVENT_GETSEQUENCENODE, message);
		},

		_registerMessageHandler : function() {

			var context = this;
			$(window)
					.on(
							"message",
							function(e) {

								//Do security check here.  If we pass then interpret data.
								//To security check and make sure this message has originated from our frame.
								if (e.originalEvent.source !== context._playerFrame.contentWindow)
									return;
								//Security check passed so process the message
								var message = $.parseJSON(e.originalEvent.data);
								console(
										"PAF Activity Manager received message:" +
										message);
								context._handleMessage(message);
							});
		},

		_clearTimeout : function() {
			if (this._timeoutHandle) {
				clearTimeout(this._timeoutHandle);
				this._timeoutHandle = null;
			}
		},

		_playerReady : function() {
			//If there is a timeout handle, just clear it.
			this._clearTimeout();

			var deferred = this._playerReadyDeferred;
			if (deferred) {
				deferred.resolve();
				this._playerReadyDeferred = null;
			}
		},

		_loadPlayer : function(playerUri, sourceLoader) {

			var deferred = this._playerReadyDeferred = $.Deferred();

			sourceLoader.apply(this, [ playerUri ]);

			var context = this;

			//If deferred is not already resolved, then set a timer just in case
			if (deferred.state() == "pending") {
				context._timeoutHandle = setTimeout(function() {
					//since timeout occurred, let's just reset handle so we don't call clearTimeout inside _playerReady
					context._timeoutHandle = null;
					console("Player considered loaded after timeout");
					context._playerReady();
				}, this.timeout);
			}

			return deferred.promise();
		},

		_loadFrameSource : function(playerUri) {
			var context = this;

			if (this._playerFrame.src != playerUri) {
				console("player loading...", playerUri);
				this._playerFrame.src = playerUri;
			} else {
				console("Player already loaded", playerUri);
				context._playerReady(playerUri);
			}
		},

		_loadPlayerSource : function(playerUri, messageId) {
			this._loadFrameSource(playerUri);
		}

	};

	/**************************************************************************
	 *  HUB - SEVICE . Similar to PAF Hub service. This deals with connections
	 *  to the PAF Hub and retrieval of information (Typically JSON format)
	 *  Most (In fact all) of the API here is routed via the generic PAF proxy
	 *  /ecourses-paf-proxy/pafpx/paf/genpx
	 **************************************************************************/

	PAF.HubService = function(hubSession, proxyURL) {
		this._hubSession = hubSession;
		this._proxyURL = (proxyURL ? proxyURL : "");
	};

	/**
	 * Hub Service Prototype.
	 */
	PAF.HubService.prototype = {

		_hubSession : null,

		getRichSequence : function(sequenceUrl) {
			var ret = null;
			$.ajax({
				type : "POST",
				async : false,
				contentType : 'application/json',
				url : this._proxyURL + "/ecourses-paf-proxy/pafpx/paf/allseq",

				/* This represents the actual data send the target server along
				  with the target server url */

				data : JSON.stringify({
					headers : {
						Accept : "application/vnd.pearson.paf.v1.richsequence",
						"Hub-Session" : this._hubSession
					},
					url : sequenceUrl,
					method : "GET"
				}),

				success : function(json) {
					console("Get Rich Sequence Success");
					ret = $.parseJSON(json.content);
					console("Ret rich sequence =" + JSON.stringify(ret));
				},
				error : function(xhr, ajaxOptions, thrownError) {
					console("grr");
					console("\r\nstatus = " + xhr.status + "\r\nthrownError = "
							+ thrownError);
				}
			});
			return ret;
		},

		getSequenceNode : function(url, targetBinding, nodeIndex) {
			console("URL ====== " + url);
			// post data
			var data = {
				"@context" : "http://purl.org/pearson/paf/v1/ctx/core/SequenceNode",
				"@type" : "SequenceNode",
				"targetBinding" : targetBinding,
				"nodeIndex" : nodeIndex
			};
			var ret = null;
			$
					.ajax({
						type : "POST",
						url : this._proxyURL + "/ecourses-paf-proxy/pafpx/paf/seqnode",
						async : false,
						contentType : 'application/json',
						/* This represents the actual data send the target server along
						 with the target server url */

						data : JSON
								.stringify({
									headers : {
										"Accept" : "application/vnd.pearson.paf.v1.node.rich+json",
										"Hub-Session" : this._hubSession
									},
									url : url,
									method : "POST",
									data : JSON.stringify(data),
									contentType : 'application/vnd.pearson.paf.v1.node+json;charset=utf-8'
								}),

						dataType : "json",
						success : function(json) {
							console("getSequenceNode Success");
							ret = $.parseJSON(json.content);
							console("Ret rich sequence =" + JSON.stringify(ret));
						},
						error : function(xhr, ajaxOptions, thrownError) {
							console(url + "\r\nHub service :: status = "
									+ xhr.status + ", thrownError = "
									+ thrownError);
						}
					});

			return ret;
		},

		postNodeResult : function(sequenceNode, result) {

			var url = sequenceNode.resultCollection + "?sequenceNodeGuid="
					+ encodeURIComponent(sequenceNode.guid);
			var ret = null;
			// post the result to the hub
			$
					.ajax({

						type : "POST",
						/* This is the PAF proxy URL */
						url : this._proxyURL + "/ecourses-paf-proxy/pafpx/paf/genpx",
						async : false,
						contentType : 'application/json',

						/* This represents the actual data send the target server along
						 with the target server url */

						data : JSON
								.stringify({
									headers : {
										"Accept" : "application/vnd.pearson.paf.v1.node.rich+json",
										"Hub-Session" : this._hubSession
									},
									url : url,
									method : "POST",
									data : JSON.stringify(result),
									contentType : 'application/json; charset=utf-8'
								}),

						dataType : "json",
						success : function(response) {
							console("Post Node result success. Content = "
									+ response.content);
							ret = $.parseJSON(response.content);
							console("Ret = " + JSON.stringify(ret));

						},
						error : function(xhr, ajaxOptions, thrownError) {
							console(url + "\r\Hub service:: status = "
									+ xhr.status + ", thrownError = "
									+ thrownError);
						}
					});
			return ret;
		},

		getReport : function(guid) {
			console("In get report . Guid = " + guid);
			var url = "/paf-hub/resources/reports?guid="
					+ encodeURIComponent(guid);
			var ret = null;
			$.ajax({

				type : "POST",
				async : false,
				contentType : 'application/json',
				/* This is the PAF proxy URL in ecourses */

				url : this._proxyURL + "/ecourses-paf-proxy/pafpx/paf/genpx",

				/* Actual Data that will go the the PAF - HUB.*/
				data : JSON.stringify({
					headers : {
						"Hub-Session" : this._hubSession
					},
					url : url,
					method : "GET",
					contentType : "application/html",
				}),

				success : function(json) {
					// Currently report comes in HTML :(
					console("Get report success. Content = " + json.content);
					ret = json.content;
				},
				error : function(xhr, ajaxOptions, thrownError) {
					console(url + "\r\nReport:: status = " + xhr.status
							+ ", thrownError = " + thrownError);
				}
			});
			return ret;
		}
	};

})();

