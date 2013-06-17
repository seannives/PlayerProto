var eventManager = {
    subscribe : function(node, el) {
        amplify.subscribe( node,
                           el,
                           function( data ) {
                               document.getElementById("display").innerHTML = data;
                           }
                         );
    },

    publish : function(node, data) {
        amplify.publish(node, data );
    },
    
    unsubscribe : function() {
    }
}

var activityManager = {
    
    getEventManager : function() {
        var eM = Object.create(eventManager);
        return eM;
    },
    getElementsWithAttribute : function(element, attribute)
    {
        var matchingElements = [];
        var allElements = document.getElementsByTagName(element);
        for (var i = 0; i < allElements.length; i++)
        {
            if (allElements[i].getAttribute(attribute))
            {
                // Element exists with attribute. Add to array.
                matchingElements.push(allElements[i]);
            }
        }
        return matchingElements;
    },

    getAllElementsWithAttribute : function(attribute)
    {
        return aM.getElementsWithAttribute('*', attribute);
    },

    scanToLoadScript : function()
    {
        var nodes = aM.getAllElementsWithAttribute("typeof");
        for (var i = 0; i < nodes.length; i++)
        {
            console.log(nodes[i].getAttribute("typeof"));
        }
        console.log(nodes);
        return nodes;
    },

    loadScriptForNodes : function(callback)
    {
        var nodeList = aM.scanToLoadScript();
        var urls = "";
        for (var i = 0; i < nodeList.length; i++)
        {
            temp = nodeList[i].getAttribute("about");
            urls = urls + "," + temp;
            //console.log(callback);
        }
        console.log(urls);
        aM.loadScripts(urls, callback);
    },

    loadScripts : function(urls, callback) {
        var scripts = new Array();
        scripts = urls.split(",");
        console.log(scripts);
        //require(scripts, function() {
        //    callback();
        //});
    },

    scanToLoadPlayer : function()
    {
        var nodes = aM.getAllElementsWithAttribute("typeof");
        for (var i = 0; i < nodes.length; i++)
        {
            console.log(nodes[i].getAttribute("typeof"));
        }
        
        console.log(nodes);
    },

    initActivityManager : function() {
        window.onload = function() {
            aM.loadScriptForNodes(function(){
                var chart = Object.create(chrtWdt);
                chart.init(function() {
                    chart.renderActivity({ data: 'Hello World', dom: 'graphTarget0'});
                });
                
                var display = Object.create(dispWdt);
                display.init(function() {
                    display.renderActivity({ data: 'Hello World', dom: 'display'});
                });
            });

            //setTimeout(,500);
        };
    }
}

