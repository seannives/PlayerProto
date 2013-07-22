var eventManager = {
    subscribe : function(topic, callback) {
        amplify.subscribe(topic, callback);
    },

    publish : function(topic, data) {
        amplify.publish(topic, data);
    },

    unsubscribe : function(topic, callback) {
        amplify.unsubscribe(topic, callback);
    }
};

var activityManager = {
    getEventManager : function() {
        var eM = Object.create(eventManager);
        return eM;
    },

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
                            "nodeid": "svg" + sid,
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

    loadNodes : function(callback) {
        // get the nodeList
        var nodeList = this.scanNodes();
        
        // loop over it
        var nodeLength = nodeList.length;
        var counter = 0;
        while (counter < nodeLength) {
            // grab the 'about' url containing the content identifier (PAF).
            var contentURL = nodeList[counter].attributes.about.nodeValue;

            // pull down the content from PAF, local content repo, or wherever
            var content = this.collectContent(contentURL);

            // throw content back to the originating callback
            callback(content);

            counter++;
        }
    },

    scanNodes : function() {
        // scan through looking for 'Activity' divs.  We can change this to <object> tags if that's what
        // inkling prefers.
        // we're assuming we have jquery
        var nodes = $("div[typeof='Activity']");
        return nodes;
    },

    // initializing the activity manager 
    // - uses requirejs to load the non-minified interactives stuff just for debugging.
    // - the initActivityManager below doesn't bother with this, just relying on the compiled 
    //   interactives library.
    initActivityManagerAMD : function() {
        // 'that = this' avoids having to reference whatever we named our object (aM.) within this factory
        var that = this;
        var eventManager = that.getEventManager();

        requirejs.config({
            baseURL: '../PrototypeDist/interactives',
            paths: {
                jquery: '../PrototypeDist/lib/jquery',
                underscore: '../PrototypeDist/lib/underscore',
                // you can change this to point to the minified library if you want, like
                // interactives: '../PrototypeDist/dist/interactives',
                interactives: '../PrototypeDist/interactives',
                d3: '../PrototypeDist/lib/d3' // TODO - shouldn't reference version
            },
            shim: {
                underscore: {
                    exports: 'underscore'
                },
                d3: {
                    exports: 'd3'
                }
            }
        });

        window.onload = function() {
            
            // this is require loading is weird but just here for testing/debugging
            require(['interactives', 'jquery', 'underscore', 'd3'], function (interactives, $, _, d3) {
                // todo - see note in initActivityManager below

                that.loadNodes(function(content){
                    // initialize master player widget for each chunk of content
                    interactives.init(content, eventManager);
                });
            });
        };
    },

    // This demonstrates using the brix interactives library without using an AMD loader, instead using
    // global $, _, and d3.
    initActivityManager : function() {
        // 'that = this' avoids having to reference whatever we named our object (aM.) within this factory
        var that = this;
        var eventManager = that.getEventManager();

        window.onload = function() {
            // TODO - create an interactives object here once and put that in the callback below (or a clone
            // of it) as that may be faster than doing just a straight function call?  you'll also have to
            // do this in initActivityManagerAMD above

            that.loadNodes(function(content){
                // initialize master player widget for each chunk of content
                interactives.init(content, eventManager);
            });
            
        };
    }

};