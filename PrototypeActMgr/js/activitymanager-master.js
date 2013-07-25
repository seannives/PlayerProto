/*

    Here is a quick prototype of a "Master" ActivityManager.  This guy gets loaded on the page in an
    iframe (or maybe just on the master page after post-Habitat conversion?), goes to get all of the
    Activities from PAF (or the server) and then sends those out.

    Eventually it'll listen for events from the other iframes to send data off to PAF.

*/

var activityManager = {

    collectContent : function(contentURL) {
        // THIS IS FAKE.
        // This is where you'd call to the PAF hub (or whatever content repo) using the contentURL
        // and return the JSON content (perhaps the enriched sequenceNode).
        // Instead we'll just fake up some json.

        // grab the id out of the contentURL so we can populate a couple of fake examples
        var regPattern = /\d*$/;
        var myid = regPattern.exec(contentURL);

        // a function to build a bunch of basically the same config over and over
        var returnConfig = function(sid, myImg) {
            var myConfig = {
                "master": {
                    "brix": [
                        { // SVG Container
                            "xtype": "svgContainer",
                            "id": "svg" + sid,
                            //"nodeid": "svg" + sid,
                            "nodeid": "bricTarget",
                            "height": 310,
                            "maxHt": 350,
                            "actualSize": {height: 310, width: 680} // dupe from img above
                        },
                        { // Captioned Image                            
                            "xtype": "captionedImage",
                            "id": "cimg" + sid,
                            "captionPosition": "below",
                            "image": {
                                "targetid": "svg" + sid,
                                "id": "img" + sid,
                                "URI": myImg,
                                "caption": "Nuclear Reactor Schematic Diagram",
                                "actualSize": {height: 310, width: 680}
                            }
                        },
                        { // action - append image to container
                            "xtype": "action",
                            "id": "appendImg" + sid,
                            "type": "append",
                            "what": "cimg" + sid,
                            "to": "svg" + sid,
                            "config": {topPercentOffset: 0, leftPercentOffset: 0, heightPercent: 1, widthPercent: 1}
                        }
                    ]
                }
            };
            return myConfig;
        };

        var imageHash = {
            '200' : '../img/reactor.jpg',
            '201' : '../img/sunEarth.jpg',
            '202' : '../img/ultraviolet.jpg',
            '203' : '../img/strata.jpg',
            '204' : '../img/insolationMap.jpg',
            '205' : '../img/hottopic-deepsea1en.jpg',
            '206' : '../img/FG12_5_3.jpg',
            '207' : '../img/endocrineSystem.jpg',
            '208' : '../img/defGraph.jpg',
            '209' : '../img/ch4_4.jpg'
        };

        // This is the config that drives the interactives.  It's then buried in the enriched sequence node
        // below in "targetActivity"

        var interactiveConfig = returnConfig(myid[0], imageHash[myid[0]]);

        // let's pretend we have an "enriched" SequenceNode (step 5 in Assignment Startup sequence
        // diagram: https://hub.pearson.com/confluence/display/AF/Assignment+Startup)
        var sequenceNodeRich = {
          "@context" : "http://purl.org/pearson/paf/v1/ctx/core/SequenceNodeRich",
          "@type" : "SequenceNode",
          "@id" : 'http://paf.hub.pearson.com/resources/sequences/' + myid[0] + '/nodes/1',
          "nodeIndex" : 1,
          "startTime" : Date(),
          "parentSequence" : {
            "@id" : 'http://paf.hub.pearson.com/resources/sequences/' + myid[0],
            "user" : "http://idm.api.pearson.com/resources/identities/29d32894735b731",
            "learningContext" : {
              "@type" : "CourseSection",
              "@id" : "urn:udson:pearson.com/sms/prod:course/jsmith38271"
            },
            "overallActivity" : 'http://repo.paf.pearson.com/resources/activity/' + myid[0]
          },
          "targetBinding" : {
            "@id" : "http://repo.paf.pearson.com/resources/activity/4924948879517615/bindings/2",
            "boundActivity" : "http://repo.paf.pearson.com/resources/activity/59239547267",
            "activityFormat" : "application/vnd.pearson.qti.v2.asi.xml",
            "activityTitle" : "We'll put this in the targetActivity, thank you.",
            "credit" : "ForCredit",
            "scoreConstraints" : {
              "normalMaximum" : 10
            }
          },
          "targetActivity" : interactiveConfig,
          "aggregateResult" : {
            "templateVariables" : []
          },
          "player" : {
            "frameFrontend" : "http://example.com/myplayer",
            "widgetStartPage" : "http://hub.paf.pearson.com/widgets/83282736384572/index.html"
          },
          "resultCollection" : 'http://hub.paf.pearson.com/resources/sequences/' + myid[0] + '/nodes/1/results'
        };

        return sequenceNodeRich;
    },


    initMasterActivityManager : function(eventManager, pafActivityIDs) {
        // 'that = this' avoids having to reference whatever we named our object (aM.) within this factory
        var that = this;

        window.onload = function() {
            //console.log("js/activitymanager-master.js - window.onload");
            pafActivityIDs.forEach(function(pafActivityID) {
                var content = that.collectContent(pafActivityID);
                eventManager.publish("brixInit_" + pafActivityID, content);
            });
        };
    }

};