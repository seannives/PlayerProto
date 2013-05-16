// sample test for widget-base
'use strict';


(function () {
    var expect = chai.expect;

var eventManager = new EventManager();

    describe('LineGraphs should be awesome', function () {
        describe('linear data', function () {
			var testData = [
				{ x:    0, y: 0 },
				{ x:    5, y: 5 },
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
			
            it('Should create lines id from base id', function () {
                expect(myGraph.lastdrawn.linesId).to.equal(myGraph.id + 'lines');
            });
			it('Should know it has a point at 0,0', function () {
                expect(myGraph.data[0][0]).to.equal({x:0,y:0});
            });
			it('Should create an empty array of child Widgets', function () {
                expect(myGraph.childWidgets).to.be.empty;
            });
				this.xAxisFormat = config.xAxisFormat;

        });
    });
})();