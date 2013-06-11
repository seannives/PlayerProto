// tests for widget-sketch
'use strict';
(function () {
    var expect = chai.expect;

    describe('Sketch widget tests', function () {
		var eventManager = null;
	
        describe('Sketch.splitOnNumbers', function () {
            it('should handle the simple case w/ no numbers', function () {
				var result = Sketch.splitOnNumbers("abc");
                expect(result.length).to.equal(1);
                expect(result[0]).to.equal("abc");
            });
            it('should handle the simple case of just a number', function () {
				var result = Sketch.splitOnNumbers(2);
                expect(result).to.have.length(3);
                expect(result[0]).to.be.empty;
                expect(result[1]).to.equal("2");
                expect(result[2]).to.be.empty;
            });
            it('should handle the simple case w/ one number group at end', function () {
				var result = Sketch.splitOnNumbers("abc23");
                expect(result).to.have.length(3);
                expect(result[0]).to.equal("abc");
                expect(result[1]).to.equal("23");
                expect(result[2]).to.be.empty;
            });
            it('should handle the text that starts with a number group', function () {
				var result = Sketch.splitOnNumbers("45abc");
                expect(result).to.have.length(3);
                expect(result[0]).to.be.empty;
                expect(result[1]).to.equal("45");
                expect(result[2]).to.equal("abc");
            });
            it('should handle the text with multiple number groups', function () {
				var result = Sketch.splitOnNumbers("a1b2c3e4f5g6h123cd43foo");
                expect(result).to.have.length(17);
                expect(result[0]).to.equal("a");
                expect(result[1]).to.equal("1");
                expect(result[2]).to.equal("b");
                expect(result[3]).to.equal("2");
                expect(result[4]).to.equal("c");
                expect(result[5]).to.equal("3");
                expect(result[6]).to.equal("e");
                expect(result[7]).to.equal("4");
                expect(result[8]).to.equal("f");
                expect(result[9]).to.equal("5");
                expect(result[10]).to.equal("g");
                expect(result[11]).to.equal("6");
                expect(result[12]).to.equal("h");
                expect(result[13]).to.equal("123");
                expect(result[14]).to.equal("cd");
                expect(result[15]).to.equal("43");
                expect(result[16]).to.equal("foo");
            });
        });

		describe('Creating a sketch', function () {
			
			var configCntr = {
				node: null,
				maxWid: 200,
				maxHt: 200
			};
			
			var time = 20;	// number of milliseconds for each timeout
			
			// make svg container
			var cntr = helper.createNewSvgContainer(configCntr);
			
			after(function () {
				// Clean up test modifications to the DOM
				configCntr.node && configCntr.node.remove();
			});
			
			before(function ()
			{
				// make the sketch
				var mySketch = new Sketch ({
					id: "sketch1",
					drawShape:
					[
						{ shape: "rectangle", data:[{xyPos: [.2, .5], width: .2, height: .1 }]},
						{ shape: "circle", data:[{xyPos: [.5, .5], radius:  .2 }]}, 
						{ shape: "hexagon", data:[{xyPos: [.3, .3], side:  .1 }]},
						{ shape: "triangle", data:[{xyPos: [.4, .4], side: .2 }]},
						{ shape: "line", data:[{xyPos: [.1, .1], length: .5, angle: Math.PI/3 }]},
						{ shape: "wedge", data:[{xyPos: [.2, .4], length: .5, width: .2, angle: Math.PI/6 }]},
						//{ shape: "wedge", data:[{xyPos: [.35, .24], length: .3, width: .15, angle: Math.PI/4, type: "hash"}]},
						{ shape: "textBit", data:[{xyPos: [.15, .35], text: "blah" }]}
					],
				});
			
				// append the sketch
				cntr.append(mySketch);
			});
			
			/*
				NOTE:
				
				- The x and y values for each successive test are based on the values
				left from the previous test, since they all act on the same sketch.
				
				- Reflection for rectangles is not as simple as it is for other
				shapes because rectangles are anchored at their top left corner, rather
				than their center.
				
				- Transitions on sketches are asynchronous, so timeouts are necessary to
				keep new transitions from overriding older ones.
			*/
			
			describe('draw', function () {
				it('should start with the correct attributes', function (done) {
					setTimeout( function()
					{
						check(done, function ()
						{
							var xScale = mySketch.lastdrawn.xScale;
							var yScale = mySketch.lastdrawn.yScale;
					
							var rectangle = mySketch.lastdrawn.widgetGroup.select("rect");
							expect(rectangle.attr('x')).to.equal(xScale(.2).toString());
							expect(rectangle.attr('y')).to.equal(yScale(.5).toString());
							expect(rectangle.attr('width')).to.equal(xScale(.2).toString());
							expect(rectangle.attr('height')).to.equal((yScale(0) - yScale(.1)).toString());
					
							var circle = mySketch.lastdrawn.widgetGroup.select("circle");
							expect(circle.attr('cx')).to.equal(xScale(.5).toString());
							expect(circle.attr('cy')).to.equal(yScale(.5).toString());
							expect(circle.attr('r')).to.equal(xScale(.2).toString());
					
							var hexagon = mySketch.lastdrawn.widgetGroup.select("polygon.hex");
							var points1 = hexpoints(.3, .3, .1, xScale, yScale);
							expect(hexagon.attr('points')).to.equal(points1);
					
							var triangle = mySketch.lastdrawn.widgetGroup.select("polygon.tri");
							var points2 = tripoints(.4, .4, .2, xScale, yScale);
							expect(triangle.attr('points')).to.equal(points2);
					
							var wedge = mySketch.lastdrawn.widgetGroup.select("polygon.wedge");
							var points3 = wedgepoints(.2, .4, .5, .2, Math.PI/6, xScale, yScale);
							expect(wedge.attr('points')).to.equal(points3);
					
							var line = mySketch.lastdrawn.widgetGroup.select("line");
							expect(line.attr('x1')).to.equal(xScale(.1).toString());
							expect(line.attr('y1')).to.equal(yScale(.1).toString());
							expect(line.attr('x2')).to.equal(xScale(.1 + .5*Math.cos(Math.PI/3)).toString());
							expect(line.attr('y2')).to.equal(yScale(.1 + .5*Math.sin(Math.PI/3)).toString());
					
							var textBit = mySketch.lastdrawn.widgetGroup.select("text");
							var text = textBit.select("tspan").text();
							expect(textBit.attr('x')).to.equal(xScale(.15).toString());
							expect(textBit.attr('y')).to.equal(yScale(.35).toString());
							expect(text).to.equal("blah");
						});
					}, time);
				});
			});
			
			describe('move', function () {
				before(function (done) {
					mySketch.move(.1, .2, 0, 0);
					
					done();
				});
				it('should move the x and y position by the given offsets', function (done) {
					setTimeout( function ()
					{
						check(done, function ()
						{
							var xScale = mySketch.lastdrawn.xScale;
							var yScale = mySketch.lastdrawn.yScale;
					
							var rectangle = mySketch.lastdrawn.widgetGroup.select("rect");
							expect(rectangle.attr('x')).to.equal(xScale(.3).toString());
							expect(rectangle.attr('y')).to.equal(yScale(.7).toString());
					
							var circle = mySketch.lastdrawn.widgetGroup.select("circle");
							expect(circle.attr('cx')).to.equal(xScale(.6).toString());
							expect(circle.attr('cy')).to.equal(yScale(.7).toString());
					
							var hexagon = mySketch.lastdrawn.widgetGroup.select("polygon.hex");
							var points1 = hexpoints(.4, .5, .1, xScale, yScale);
							expect(hexagon.attr('points')).to.equal(points1);
					
							var triangle = mySketch.lastdrawn.widgetGroup.select("polygon.tri");
							var points2 = tripoints(.5, .6, .2, xScale, yScale);
							expect(triangle.attr('points')).to.equal(points2);
					
							var wedge = mySketch.lastdrawn.widgetGroup.select("polygon.wedge");
							var points3 = wedgepoints(.3, .6, .5, .2, Math.PI/6, xScale, yScale);
							expect(wedge.attr('points')).to.equal(points3);
					
							var line = mySketch.lastdrawn.widgetGroup.select("line");
							expect(line.attr('x1')).to.equal(xScale(.2).toString());
							expect(line.attr('y1')).to.equal(yScale(.3).toString());
							expect(line.attr('x2')).to.equal(xScale(.2 + .5*Math.cos(Math.PI/3)).toString());
							expect(line.attr('y2')).to.equal(yScale(.3 + .5*Math.sin(Math.PI/3)).toString());
					
							var textBit = mySketch.lastdrawn.widgetGroup.select("text");
							expect(textBit.attr('x')).to.equal(xScale(.25).toString());
							expect(textBit.attr('y')).to.equal(yScale(.55).toString());
						});
					}, time);
				});
			});
			
			describe('horizontal reflection', function () {
				before(function (done) {
					mySketch.reflect(null, .6, 0, 0);
					
					done();
				});
				it('should reflect the sketch over a horizontal line', function (done) {
					setTimeout( function ()
					{
						check( done, function ()
						{
							var xScale = mySketch.lastdrawn.xScale;
							var yScale = mySketch.lastdrawn.yScale;
					
							var rectangle = mySketch.lastdrawn.widgetGroup.select("rect");
							expect(rectangle.attr('x')).to.equal(xScale(.3).toString());
							expect(rectangle.attr('y')).to.equal(yScale(.6).toString());
					
							var circle = mySketch.lastdrawn.widgetGroup.select("circle");
							expect(circle.attr('cx')).to.equal(xScale(.6).toString());
							expect(circle.attr('cy')).to.equal(yScale(.5).toString());
					
							/* reflection of polygons needs to take into account that
							the points get flipped */
					
							/*var hexagon = mySketch.lastdrawn.widgetGroup.select("polygon.hex");
							var points1 = hexpoints(.4, .5, .1, xScale, yScale);
							expect(hexagon.attr('points')).to.equal(points1);
					
							var triangle = mySketch.lastdrawn.widgetGroup.select("polygon.tri");
							var points2 = tripoints(.5, .4, .2, xScale, yScale);
							expect(triangle.attr('points')).to.equal(points2);
					
							var wedge = mySketch.lastdrawn.widgetGroup.select("polygon.wedge");
							var points3 = wedgepoints(.3, .4, .5, .2, -Math.PI/6, xScale, yScale);
							expect(wedge.attr('points')).to.equal(points3);*/
					
							var line = mySketch.lastdrawn.widgetGroup.select("line");
							expect(line.attr('x1')).to.equal(xScale(.2).toString());
							expect(line.attr('y1')).to.equal(yScale(.9).toString());
							expect(line.attr('x2')).to.equal(xScale(.2 + .5*Math.cos(-Math.PI/3)).toString());
							expect(line.attr('y2')).to.equal(yScale(.9 + .5*Math.sin(-Math.PI/3)).toString());
					
							var textBit = mySketch.lastdrawn.widgetGroup.select("text");
							expect(textBit.attr('x')).to.equal(xScale(.25).toString());
							expect(textBit.attr('y')).to.equal(yScale(.65).toString());
						});
					}, time);
				});
			});
			
			describe('vertical reflection', function () {
				before(function (done) {
					mySketch.reflect(.5, null, 0, 0);
					
					done();
				});
				it('should reflect the sketch over a vertical line', function (done) {
					setTimeout( function ()
					{
						check(done, function ()
						{
							var xScale = mySketch.lastdrawn.xScale;
							var yScale = mySketch.lastdrawn.yScale;
					
							var rectangle = mySketch.lastdrawn.widgetGroup.select("rect");
							expect(rectangle.attr('x')).to.equal(xScale(.5).toString());
							expect(rectangle.attr('y')).to.equal(yScale(.6).toString());
					
							var circle = mySketch.lastdrawn.widgetGroup.select("circle");
							expect(circle.attr('cx')).to.equal(xScale(.4).toString());
							expect(circle.attr('cy')).to.equal(yScale(.5).toString());
					
							var line = mySketch.lastdrawn.widgetGroup.select("line");
							expect(line.attr('x1')).to.equal(xScale(.8).toString());
							expect(line.attr('y1')).to.equal(yScale(.9).toString());
							expect(line.attr('x2')).to.equal(xScale(.8 + .5*Math.cos(-2*Math.PI/3)).toString());
							expect(line.attr('y2')).to.equal(yScale(.9 + .5*Math.sin(-2*Math.PI/3)).toString());
					
							var textBit = mySketch.lastdrawn.widgetGroup.select("text");
							expect(textBit.attr('x')).to.equal(xScale(.75).toString());
							expect(textBit.attr('y')).to.equal(yScale(.65).toString());
						});
					}, time);
				});
			});
			
			describe('make invisible', function () {
				before(function (done) {
					mySketch.setOpacity(0, 0, 0);
					
					done();
				});
				it('should set the opacity to 0', function (done) {
					setTimeout( function ()
					{
						check(done, function ()
						{
							var sketch = mySketch.lastdrawn.widgetGroup.selectAll("g.shape");
							expect(sketch.style('opacity')).to.equal('0');
						});
					}, time);
				});
			});
			
			describe('make visible', function () {
				before(function (done) {
					mySketch.setOpacity(1, 0, 0);
					
					done();
				});
				it('should set the opacity to 1', function (done) {
					setTimeout( function ()
					{
						check(done, function ()
						{
							var sketch = mySketch.lastdrawn.widgetGroup.selectAll("g.shape");
							expect(sketch.style('opacity')).to.equal('1');
						});
					}, time);
				});
			});
			
			describe('change color', function () {
				before(function (done) {
					mySketch.setColor("blue", 0, 0);
					
					done();
				});
				it('should change the color of the sketch', function (done) {
					setTimeout( function ()
					{
						check(done, function ()
						{
							var sketch = mySketch.lastdrawn.widgetGroup.selectAll("g.shape");
							expect(sketch.style('stroke')).to.equal('#0000ff');
					
							var textBit = mySketch.lastdrawn.widgetGroup.select("text");
							expect(textBit.style('fill')).to.equal('#0000ff');
					
							var wedge = mySketch.lastdrawn.widgetGroup.select("polygon.wedge");
							expect(wedge.style('fill')).to.equal('#0000ff');
						});
					}, time);
				});
			});
		});
    });
})();

// figure out correct point string for a hexagon
function hexpoints (x, y, sidelen, xScale, yScale)
{
	var side = xScale(sidelen);
	var midx = xScale(x);
	var midy = yScale(y);
	
	// use trigonometry to calculate all the points
	var angle = (Math.PI/6);
	
	var round = d3.format('2f');
	
	var fartop = round(midy + side*(1/2 + Math.sin(angle))).toString();
	var top = round(midy + side/2).toString();
	var bot = round(midy - side/2).toString();
	var farbot = round(midy - side*(1/2 + Math.sin(angle))).toString();
	var left = round(midx - side*Math.cos(angle)).toString();
	var mid = round(midx).toString();
	var right = round(midx + side*Math.cos(angle)).toString();
	
	// return the point string
	var points = (left+","+bot)+" "+(mid+","+farbot)+" "+(right+","+bot)
		+" "+(right+","+top)+" "+(mid+","+fartop)+" "+(left+","+top);
	return points;
}
// figure out correct point string for a triangle
function tripoints (x, y, sidelen, xScale, yScale)
{
	var side = xScale(sidelen);
	var midx = xScale(x);
	var midy = yScale(y);
	
	// use trigonometry to calculate all the points
	var angle = (Math.PI/3);
	
	var round = d3.format('2f');
	
	var left = round(midx - side/2).toString();
	var mid = round(midx).toString();
	var right = round(midx + side/2).toString();
	var bot = round(midy + (side*Math.sin(angle))/2).toString();
	var top = round(midy - (side*Math.sin(angle))/2).toString();
	
	// return the point string
	var points = (left+","+bot)+" "+(right+","+bot)+" "+(mid+","+top);
	return points;
}
function wedgepoints(x, y, len, wid, ang, xScale, yScale)
{
	var flatx = len * Math.cos(ang) + x;
	var flaty = len * Math.sin(ang) + y;
				
	var angle = ang + Math.PI/2;
	
	var round = d3.format('2f');
	
	var tip1x = xScale(flatx + wid/2*Math.cos(angle));
	var tip1y = yScale(flaty + wid/2*Math.sin(angle));
	var tip2x = xScale(flatx - wid/2*Math.cos(angle));
	var tip2y = yScale(flaty - wid/2*Math.sin(angle));
	
	var xpos = xScale(x);
	var ypos = yScale(y);
				
	var points = (round(tip1x).toString()+","+round(tip1y).toString())+" "+
				(round(xpos).toString()+","+round(ypos).toString())+" "+
				(round(tip2x).toString()+","+round(tip2y).toString());
	return points;
}
function check(done, f)
{
	try
	{
    	f();
    	done();
  	} 
	catch(e)
	{
    	done(e);
  	}
}
