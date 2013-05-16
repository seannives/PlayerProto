// sample test for widget-base
'use strict';


(function () {
    var expect = chai.expect;

var eventManager = new EventManager();

    describe('LineGraphs should be awesome', function () {
        describe('linear data', function () {
			var testData = [
				{ x:    0, y: 1 },
				{ x:    4, y: 4 },
				{ x: 1000, y: 1000 }
				];
				
			var configGraph = {
			id: "lg0",
			Data: [testData],
			type: "lines",
			xAxisFormat: { type: "linear",
						   ticks: 5,
						   orientation: "bottom",
						   label: "one line with markup <span class='math'>y=x<sup>2</sup></span>" },
			yAxisFormat: { type: "linear",
						   ticks: 5,
						   orientation: "right",
						   label: "Labels can have extended chars (&mu;m)" },
		};
		
			var myGraph = new LineGraph(configGraph);
			
            it('Should create lines id from base id + _lines', function () {
                expect(myGraph.lastdrawn.linesId).to.equal(myGraph.id + '_lines');
            });
			it('Should know it has a point at 0,1', function () {
                expect(myGraph.data[0][0]).to.deep.equal({x:0,y:1});
            });
			it('Should create an empty array of child Widgets', function () {
                expect(myGraph.childWidgets).to.be.empty;
            });

			var configCntr = {
				node: d3.select("#Target"),
				maxWid: 400,
				maxHt: 300
				};
				
			var cntr = new SVGContainer(configCntr);
			//full width and height
			cntr.append(myGraph, {topPercentOffset: 0, leftPercentOffset: 0, heightPercent: 1, widthPercent: 1});
			
            it('Should scale the min of x range to the left edge of svg box', function () {
                expect(myGraph.lastdrawn.xScale(0)).to.equal(0);
            });
			 it('Should make a group in svg with linesId', function () {
                expect(myGraph.lastdrawn.graph.attr("id")).to.equal(myGraph.lastdrawn.linesId);
            });
		
		});
    });
})();