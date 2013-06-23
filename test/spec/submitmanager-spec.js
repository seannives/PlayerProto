/* **************************************************************************
 * submitmanager-spec.js                                                    $
 * **********************************************************************//**
 *
 * @fileoverview SubmitManager unit tests
 *
 * Created on		June 04, 2013
 * @author			Seann
 *
 * Copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/

'use strict';


(function () {
    var expect = chai.expect;

    describe('SubmitManager tests', function () {
    	var eventManager = null;
    	describe('Configuration with no id set tests', function () {
			var submit1Config = {
				sequenceNodeID: 'http://hub.paf.pearson.com/resources/sequences/123/nodes/1'
			};
			var submitManager = new SubmitManager(submit1Config, eventManager);

			it('should be an object', function () {
	            expect(submitManager).to.be.an('object');
	        });
	    	it('should have an auto-generated id', function () {
	    		expect(submitManager.id).to.equal('sm_auto_1');
	    	});
	    	it('should have a sequenceNodeID', function () {
	    		expect(submitManager.sequenceNodeID).to.equal('http://hub.paf.pearson.com/resources/sequences/123/nodes/1');
	    	});
		});

		var submit1Config = {
			id: 'sm1',
			sequenceNodeID: 'http://hub.paf.pearson.com/resources/sequences/123/nodes/1'
		};
							
		describe('Configuration with id set tests', function () {
			var submitManager = new SubmitManager(submit1Config, eventManager);
			it('should be an object', function () {
	            expect(submitManager).to.be.an('object');
	        });
	    	it('should have an id', function () {
	    		expect(submitManager.id).to.equal('sm1');
	    	});
	    	it('should have a sequenceNodeID', function () {
	    		expect(submitManager.sequenceNodeID).to.equal('http://hub.paf.pearson.com/resources/sequences/123/nodes/1');
	    	});
		});

		describe('Submitting to the SubmitManager', function() {
			var submitManager = null;
			var submittedEventCount = 0;
			var lastSubmittedEventDetails = null;
			var logSubmittedEvent =
				function logSubmittedEvent(eventDetails)
				{
					++submittedEventCount;
					lastSubmittedEventDetails = eventDetails;
				};

			before(function () {
				eventManager = new EventManager();
				submittedEventCount = 0;
				lastSubmittedEventDetails = null;

				submitManager = new SubmitManager(submit1Config, eventManager);
				eventManager.subscribe(submitManager.submittedEventId, logSubmittedEvent);
				submitManager.submit('1');
			});

			it('should return an object', function() {
				expect(lastSubmittedEventDetails).to.be.an.object;
			});
			it('should return a grade', function() {
				expect(lastSubmittedEventDetails.grade).to.not.be.null;
				expect(lastSubmittedEventDetails.grade).to.be.within(0,1);
			});
			it('should return a response', function() {
				expect(lastSubmittedEventDetails.response).to.not.be.null;
			});
			
		});
	});
})();
