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

    // initializing the activity manager 
    // - uses requirejs to load the non-minified interactives stuff just for debugging.
    // - the initActivityManager below doesn't bother with this, just relying on the compiled 
    //   interactives library.

    // We're sending 'sequenceNode' in here from the player...better ways to do this there are.
    initActivityManagerAMD : function(sequenceNode) {
        // 'that = this' avoids having to reference whatever we named our object (aM.) within this factory
        var that = this;
        var eventManager = that.getEventManager();

        requirejs.config({
            baseURL: '../js/interactives',
            paths: {
                jquery: '../js/jquery-latest',
                underscore: '../js/underscore',
                // you can change this to point to the minified library if you want, like
                // interactives: '../PrototypeDist/dist/interactives',
                interactives: '../js/interactives',
                d3: '../js/d3'
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

        $(function() {
            require(['interactives', 'jquery', 'underscore', 'd3'], function (interactives, $, _, d3) {
                interactives.init(sequenceNode, eventManager);
            });
        });
    },

    // This demonstrates using the brix interactives library without using an AMD loader, instead using
    // global $, _, and d3.
    initActivityManager : function(sequenceNode) {
        // 'that = this' avoids having to reference whatever we named our object (aM.) within this factory
        var that = this;
        var eventManager = that.getEventManager();
        $(function() {
            interactives.init(JSON.stringify(sequenceNode), eventManager);
        });
    }
};