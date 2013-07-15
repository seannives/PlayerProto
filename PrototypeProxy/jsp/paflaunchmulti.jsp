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
	border-width: 2px 1px 1px 1px;
	border-color: orange;
	border-style: solid;
	border-radius: 5px;
	display: none
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
	#height: 300px;
	text-align: left;
	overflow: hidden;
	border: 1px solid orange;
	border-radius: 5px;
	#width: 49%;
	display: inline-block;
}

div.playerFrameDiv:last-child {
	height: 300px;
	text-align: left;
	overflow: hidden;
	border: 1px solid orange;
	border-radius: 5px;
	width: 49%;
	display: inline-block
}

.consep {
	height: 0px;
	border-width: 2 px 0px 0px 0px;
	border-style: dashed;
	width: 98%;
	background-color: white;
	border-color: #fffbce;
}
</style>

<script type="text/javascript"
	src="http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script>
<script type="text/javascript"
	src="http://ajax.cdnjs.com/ajax/libs/json2/20110223/json2.js"></script>
<script type="text/javascript"
	src="../js/mutlipafam.js"></script>


<script type="text/javascript">

	// Should not be hard code. Should be handed over by the external code
	// Invoking code. Since this is a POC code it is hardcoded.
	// Inspired from PAF code with quite a bit of addition from our side
	// Need to validate the Result Posted. Result JSON is recieved from
	// Player successfull and the POST to the hub is also happening. But the
	// scores are always coming 0.
	// TODO :1) Check result posting.
	
 	var input = {
 			//custom_assignment_guid : '55b485ec-c09b-40e0-8ab2-0c96f948c12a',
 			//custom_assignment_guid : 'c99c4139-9575-4f87-9284-717c540f84ef',
 			custom_assignment_guid : 'sanvan.assignment.1',
 			custom_assignment_format : 'application/vnd.pearson.paf.v1.assignment+json'
	};
 
	var PAF_PROXY_BASE_URL = "http://localhost:8080"
 
 	var $ = jQuery;
 	var data = null;
    
    $(window).load (function () {
    	
    	console.init (true);
    	
    	var PAF = window.Ecourses.Paf;
		/**
		* Our POC launcher for Assessment. In real case this code will 
		* Under go drastic changes. Also the layout will also change.
		*/
    	
	 	window.doPrep = function (seqURL, playerVars, hubSession , pafProxyURL) {
			// Creates and instance of Player
	 		var aPlrMgr = new PAF.AssessmentPlayerManager ();
			
			// Binds the next button click
	 		$('#next').click (function () {
	 			aPlrMgr.postLastResults ();
	 			if (aPlrMgr.isOver()) {
	 				console ("Over ... gen report");
	 				console (aPlrMgr.report());
	 			} else {
	 				aPlrMgr.playNext();
	 			}
	 		});
	 		
	 		// Binds various call back listeners with player/
	 		aPlrMgr.bind(aPlrMgr.EVENT_SEQUENCE_LOADED /* "SequenceLoaded" */, function (evt, activity) {
				
	 	        if (aPlrMgr.itemCount() > 0) {
	 	        	console ("In Play next. About fetch items and play...");
	 	        	aPlrMgr.playNext();
	 	        }

	 	        $('.headers').html(activity.overallActivity.title);
	 	        console("Loaded complete sequence and overall activity. Total item count = " 
	 	        		+ aPlrMgr.itemCount());

	 		});
	 		
	 		
	 		aPlrMgr.bind (aPlrMgr.EVENT_ITEM_LOADED /* "ItemLoaded" */, function (evt, index) {
	 			console("Item loaded = " + (index + 1)+  " out of " + aPlrMgr.itemCount());
	 		});
	 		
	 		aPlrMgr.bind (aPlrMgr.EVENT_SEQUENCE_FINISHED /* "SequenceFinished" */ , function () {
	 			console ("Cordinator got Sequence Finished...");
	 		});
	 		
	 		// Then inits player... 
	 		//aPlrMgr.initialize (seqURL, playerVars, hubSession , ['test1', 'test2', 'test3', 'test4'], pafProxyURL);
	 		aPlrMgr.initialize (seqURL, playerVars, hubSession , ['test1'], pafProxyURL);
	 		console ("Item count = " + aPlrMgr.itemCount());
	 	};
	 	
	 	var json = PAF.getLtiLaunch ( {
 			uid : 'test1',
 			cid : 'course',
 			custom_assignment_guid : input.custom_assignment_guid,
 			custom_assignment_format : input.custom_assignment_format
	 	}, PAF_PROXY_BASE_URL);
	 	doPrep (json.context.seqURL, json.context.playerVars, json.context.hubSession,  PAF_PROXY_BASE_URL);
	 	
    });
 	
 	
 </script>
</head>
<body>
    <!--  Our sample layout. -->
	<div class="allWrapper">
		<div class="headers"></div>

		<div id="test1" class="playerFrameDiv"></div>
		<!-- <div id="test2" class="playerFrameDiv"></div>
		<div id="test3" class="playerFrameDiv"></div>
		<div id="test4" class="playerFrameDiv"></div> -->		

		<div class="playerControls">
			<button id="next">Next</button>
		</div>

		<div id="console" class="console"></div>
	</div>
</body>
</html>

