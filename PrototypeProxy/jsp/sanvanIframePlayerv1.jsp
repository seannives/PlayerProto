<%@ page language="java" contentType="text/html; charset=UTF-8"
    pageEncoding="UTF-8"%>
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">

<head>
	<meta charset="UTF-8">
	<meta name="Copyright" content="Copyright (c) 2013 Pearson. All rights reserved." />
	<meta content="width=device-width, initial-scale=1.0" name="viewport" />
	<meta content="eCourses Author, Title" name="description" />

    <!-- Bootstrap, modified by Pearson UX team -->
    <link href="../css/bootstrap_plus.css" rel="stylesheet" media="screen">
    <!-- For the interactives/widgets -->
	<link href="../css/widgets.css" rel="stylesheet">
	<!-- Either from the UX team or Leslie's work - related to overall page layout -->
	<link href="../css/learning-objective.css" rel="stylesheet">
	<!-- eCourses toc/headers - not using this in this example -->
	<!--<link href="../css/eCourses-master.css" rel="stylesheet">-->

	<title class="setTitle">NeffReactor - library</title>
</head>
<body>
	<!-- Single 'Activity' configured to use the two div targets on the page, imgReactor and steps -->
	<div id="neffReactor" about="http://repo.paf.pearson.com/resources/activity/111001" typeof="Activity"></div>
	<div class="container-fluid">
		<div class="row-fluid">
			<div class="span8 leftCol">
                <h2 class="setTitle"></h2>
            	<p>Nuclear reactors use heat from fission reactions to turn water into steam, which spins turbines connected to generators that produce electricity. The figure shows a common design known as a pressurized water reactor.</p>
            	<div id="imgReactor"></div>            	
			</div>
            <div class="span4 rightCol">
            	<div id="steps"></div>
			</div>
		</div>
	</div>

	<!-- SCRIPTS -->

	<!-- General requirements -->
    <script src="../js/jquery-latest.js"></script>
	<script src="../js/bootstrap.min.js"></script>
	<script src="../js/jquery-ui-1.10.2.custom.js"></script>
	
	<!-- eCourses toc/headers - not using this in this example -->
	<!--
	<script src="../js/toc-structure.js"></script>    
	<script src="../js/eCourse-master.js"></script>    
	-->

	<!-- For pub/sub -->
	<script src="../js/amplify.min.js"></script>

	<!-- activitymanager & eventmanager -->
	<script src="../js/inframe-activitymanager.js"></script>

	<script src="../js/require.js"></script>

	<script>
		var playerReady = 
			{
			    "@context": "http://purl.org/pearson/paf/v1/ctx/core/PlayerReady",
			    "@type": "PlayerReady"
			 
			}
		// Send a postMessage back to the ActivityManager to tell it we've loaded the page.
		window.parent.postMessage(JSON.stringify(playerReady), "http://localhost:8080");

		function receiveMessage(event)
			{
				// Check to see that our event is coming from where we expect
				if (event.origin !== "http://localhost:8080")
				  return;
				var sequenceNode = $.parseJSON(event.data);

				// Fire up the in-iframe activityManager, sending it the RichSequenceNode we
				// just got from our parent.  We will probably get other things from our 
				// parent at some point but for now we'll assume this is it
				var aM = Object.create(activityManager);
				aM.initActivityManagerAMD(sequenceNode);


				var sequenceNodeLoaded = 
					{
					    "@type": "SequenceNodeLoaded",
					    "sequenceNodeId": sequenceNode["@id"]
					}
				// Tell the parent we've successfully loaded stuff so it can turn us on
				window.parent.postMessage(JSON.stringify(sequenceNodeLoaded), "http://localhost:8080");

			}
		// Listen for messages from the parent page
		window.addEventListener("message", receiveMessage, false);

		
	</script>

</body>
</html>


