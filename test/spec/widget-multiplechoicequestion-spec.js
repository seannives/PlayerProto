/* **************************************************************************
 * widget-multiplechoicequestion-spec.js                                    $
 * **********************************************************************//**
 *
 * @fileoverview MultipleChoiceQuestion widget unit tests
 *
 * Created on		June 24, 2013
 * @author			Michael Jay Lippert
 *
 * Copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/

'use strict';


(function () {
    var expect = chai.expect;

	// Set the seed for future uses of Math.random so the results are
	// deterministic and we can test them.
	Math.seedrandom("MultipleChoiceQuestion");

    describe('MultipleChoiceQuestions: choose one and only one', function () {
		var eventManager = null;

		var Q1Choices =
			[
				{
					content: "Because as the population increases, the absolute number of births increases even though the growth rate stays constant.",
					response: "Growth rate stays constant.",
					answerKey: "ans1"
				},
				{
					content: "Because the growth rate increases as the population rises.",
					response: "Does the growth rate change with population size?",
					answerKey: "ans2",
					key: "foo"
				},
				{
					content: "Because the total fertility rate increases with population.",
					response: "Does the fertility rate change with population size?",
					answerKey: "ans3"
			
				},
				{
					content: "Because social behaviors change and people decide to have more children.",
					response: "This might happen but is it something is necessarily occurs?",
					answerKey: "ans4"
				}
			];

        describe('Creating a RadioGroup MultipleChoiceQuestion w/ 4 randomized choices', function () {
			var configMultipleChoiceQuestion1 =
				{
					id: "Q1",
					question: "Wherefore?",
					choices: Q1Choices,
					order: "randomized",
					widget: RadioGroup,
					widgetConfig: { numberFormat: "latin-upper" },
				};

			var myMultipleChoiceQuestion = null;
			var selectEventCount = 0;
			var lastSelectEventDetails = null;
			var logSelectEvent =
				function logSelectEvent(eventDetails)
				{
					++selectEventCount;
					lastSelectEventDetails = eventDetails;
				};

			before(function () {
				eventManager = new EventManager();
				selectEventCount = 0;
				lastSelectEventDetails = null;

				myMultipleChoiceQuestion = new MultipleChoiceQuestion(configMultipleChoiceQuestion1, eventManager);
				eventManager.subscribe(myMultipleChoiceQuestion.selectedEventId, logSelectEvent);
				//eventManager.subscribe(myMultipleChoiceQuestion.submitScoreRequestEventId, logScoreRequestEvent);
			});
			
            it('should have the id that was specified in the config', function () {
                expect(myMultipleChoiceQuestion.id).to.equal(configMultipleChoiceQuestion1.id);
            });

			it('should have a RadioGroup choiceWidget', function () {
				expect(myMultipleChoiceQuestion.choiceWidget).to.be.an.instanceof(RadioGroup);
			});

			it('should have randomized the choices', function () {
				// We set the random seed above so the randomization would be deterministic
				expect(myMultipleChoiceQuestion.choiceWidget.choices[0], "1st choice").to.deep.equal(Q1Choices[3]);
				expect(myMultipleChoiceQuestion.choiceWidget.choices[1], "2nd choice").to.deep.equal(Q1Choices[0]);
				expect(myMultipleChoiceQuestion.choiceWidget.choices[2], "3rd choice").to.deep.equal(Q1Choices[2]);
				expect(myMultipleChoiceQuestion.choiceWidget.choices[3], "4th choice").to.deep.equal(Q1Choices[1]);
			});

			it('should have the eventManager given to the constructor', function () {
                expect(myMultipleChoiceQuestion.eventManager).to.equal(eventManager);
			});

			it('should have an uninitialized lastdrawn property', function () {
                expect(myMultipleChoiceQuestion.lastdrawn).to.have.property('container').that.is.null;
                expect(myMultipleChoiceQuestion.lastdrawn).to.have.property('widgetGroup').that.is.null;
            });

			describe('DOM manipulation (create/update elements) tests', function () {
				var cntrNode = null;

				after(function () {
					// Clean up test modifications to the DOM
					cntrNode && d3.select(cntrNode).remove();
				});
					
				describe('.draw()', function () {
					before(function () {
						cntrNode = helper.createNewDiv();
						myMultipleChoiceQuestion.draw(d3.select(cntrNode));
					});
					
					it('should set the lastdrawn container property to the value passed in', function () {
						expect(myMultipleChoiceQuestion.lastdrawn.container.node()).to.deep.equal(cntrNode);
					});

					it('should have appended a div element with class \'widgetMultipleChoiceQuestion\' to the container' +
					   ' and set the lastdrawn.widgetGroup to that d3 selection', function () {
						// get the last element of the container
						var last = d3.select(cntrNode).select(":last-child");
						expect(last.node().nodeName).to.equal('DIV');
						expect(last.classed('widgetMultipleChoiceQuestion'), 'has class widgetMultipleChoiceQuestion').to.be.true;
						expect(myMultipleChoiceQuestion.lastdrawn.widgetGroup.node()).to.deep.equal(last.node());
					});

					it('should create a div with sections for the question, choices, button and responses', function () {
						/*
						 div.widgetMultipleChoiceQuestion
						 	p.question
							div.choices
								div.widgetRadioGroup
							div.submit
								div.widgetButton
							div.responses
						 */
						var tree =
							{ name: 'DIV', class: 'widgetMultipleChoiceQuestion', children:
								[ { name: 'P', class: 'question' },
								  { name: 'DIV', class: 'choices', children:
									  [ { name: 'DIV', class: 'widgetRadioGroup' } ]
								  },
								  { name: 'DIV', class: 'submit', children:
									  [ { name: 'DIV', class: 'widgetButton' } ]
								  },
								  { name: 'DIV', class: 'responses' }
								],
							};

						helper.expectElementTree(myMultipleChoiceQuestion.lastdrawn.widgetGroup, tree);
					});
				});

				describe('.selectItemAtIndex()', function () {
					it('should publish the multiplechoicequestion.selectedEventId with the answer key of the item at that index', function () {
						var index = 1;
						var expectedKey = myMultipleChoiceQuestion.choiceWidget.choices[index].answerKey;
						var prevSelectEventCount = selectEventCount;
						myMultipleChoiceQuestion.selectItemAtIndex(index);
						expect(selectEventCount).is.equal(prevSelectEventCount + 1);
						expect(lastSelectEventDetails.selectKey).is.equal(expectedKey);
					});

					it('should change the selection when selecting an unselected item', function() {
						var expectedKey = myMultipleChoiceQuestion.choiceWidget.choices[2].answerKey;
						// Arrange - item 1 is selected
						myMultipleChoiceQuestion.selectItemAtIndex(1);
						var prevSelectEventCount = selectEventCount;
						lastSelectEventDetails = null;
						// Act - change the selection to item 2
						myMultipleChoiceQuestion.selectItemAtIndex(2);
						// Assert - select event was published
						expect(selectEventCount, "select event count").is.equal(prevSelectEventCount + 1);
						expect(lastSelectEventDetails.selectKey).is.equal(expectedKey);
					});

					it('should do nothing when selecting an already selected item (no event)', function() {
						// Arrange - item 1 is selected
						myMultipleChoiceQuestion.selectItemAtIndex(1);
						var prevSelectEventCount = selectEventCount;
						lastSelectEventDetails = null;
						// Act - re-select item 1
						myMultipleChoiceQuestion.selectItemAtIndex(1);
						// Assert - select event was not published
						expect(selectEventCount, "select event count").is.equal(prevSelectEventCount);
						expect(lastSelectEventDetails).to.be.null;
					});

					it.skip('MANUAL TEST: should publish selectedEventId when selection is made w/ mouse or keyboard', function() {
					});
				});

				describe('.selectedItem()', function () {
					before(function () {
						cntrNode && d3.select(cntrNode).remove();
						cntrNode = helper.createNewDiv();
						myMultipleChoiceQuestion.draw(d3.select(cntrNode));
					});

					it('should return null when no item is selected', function () {
						expect(myMultipleChoiceQuestion.selectedItem()).to.be.null;
					});

					it('should return the selected choice, even after the choice has been changed', function () {
						// 1st selection
						myMultipleChoiceQuestion.selectItemAtIndex(1);
						expect(myMultipleChoiceQuestion.selectedItem()).is.deep.equal(myMultipleChoiceQuestion.choiceWidget.choices[1]);

						// 2nd selection is after the current selection
						myMultipleChoiceQuestion.selectItemAtIndex(3);
						expect(myMultipleChoiceQuestion.selectedItem()).is.deep.equal(myMultipleChoiceQuestion.choiceWidget.choices[3]);

						// 3rd selection is before the current selection
						myMultipleChoiceQuestion.selectItemAtIndex(0);
						expect(myMultipleChoiceQuestion.selectedItem()).is.deep.equal(myMultipleChoiceQuestion.choiceWidget.choices[0]);
					});
				});
			});	
		});

        describe('Creating a SelectGroup MultipleChoiceQuestion w/ 4 ordered choices', function () {
			var configMultipleChoiceQuestion1 =
				{
					id: "Q1",
					question: "Whassup?",
					choices: Q1Choices,
					order: "ordered",
					widget: SelectGroup,
					widgetConfig: {},
				};

			var myMultipleChoiceQuestion = null;
			var selectEventCount = 0;
			var lastSelectEventDetails = null;
			var logSelectEvent =
				function logSelectEvent(eventDetails)
				{
					++selectEventCount;
					lastSelectEventDetails = eventDetails;
				};

			before(function () {
				eventManager = new EventManager();
				selectEventCount = 0;
				lastSelectEventDetails = null;

				myMultipleChoiceQuestion = new MultipleChoiceQuestion(configMultipleChoiceQuestion1, eventManager);
				eventManager.subscribe(myMultipleChoiceQuestion.selectedEventId, logSelectEvent);
				//eventManager.subscribe(myMultipleChoiceQuestion.submitScoreRequestEventId, logScoreRequestEvent);
			});
			
            it('should have the id that was specified in the config', function () {
                expect(myMultipleChoiceQuestion.id).to.equal(configMultipleChoiceQuestion1.id);
            });

			it('should have a SelectGroup choiceWidget', function () {
				expect(myMultipleChoiceQuestion.choiceWidget).to.be.an.instanceof(SelectGroup);
			});

			it('should have randomized the choices', function () {
				// We set the random seed above so the randomization would be deterministic
				expect(myMultipleChoiceQuestion.choiceWidget.choices[0], "1st choice").to.deep.equal(Q1Choices[0]);
				expect(myMultipleChoiceQuestion.choiceWidget.choices[1], "2nd choice").to.deep.equal(Q1Choices[1]);
				expect(myMultipleChoiceQuestion.choiceWidget.choices[2], "3rd choice").to.deep.equal(Q1Choices[2]);
				expect(myMultipleChoiceQuestion.choiceWidget.choices[3], "4th choice").to.deep.equal(Q1Choices[3]);
			});

			it('should have the eventManager given to the constructor', function () {
                expect(myMultipleChoiceQuestion.eventManager).to.equal(eventManager);
			});

			it('should have an uninitialized lastdrawn property', function () {
                expect(myMultipleChoiceQuestion.lastdrawn).to.have.property('container').that.is.null;
                expect(myMultipleChoiceQuestion.lastdrawn).to.have.property('widgetGroup').that.is.null;
            });

			describe('DOM manipulation (create/update elements) tests', function () {
				var cntrNode = null;

				after(function () {
					// Clean up test modifications to the DOM
					cntrNode && d3.select(cntrNode).remove();
				});
					
				describe('.draw()', function () {
					before(function () {
						cntrNode = helper.createNewDiv();
						myMultipleChoiceQuestion.draw(d3.select(cntrNode));
					});
					
					it('should set the lastdrawn container property to the value passed in', function () {
						expect(myMultipleChoiceQuestion.lastdrawn.container.node()).to.deep.equal(cntrNode);
					});

					it('should have appended a div element with class \'widgetMultipleChoiceQuestion\' to the container' +
					   ' and set the lastdrawn.widgetGroup to that d3 selection', function () {
						// get the last element of the container
						var last = d3.select(cntrNode).select(":last-child");
						expect(last.node().nodeName).to.equal('DIV');
						expect(last.classed('widgetMultipleChoiceQuestion'), 'has class widgetMultipleChoiceQuestion').to.be.true;
						expect(myMultipleChoiceQuestion.lastdrawn.widgetGroup.node()).to.deep.equal(last.node());
					});

					it('should create a div with sections for the question, choices, button and responses', function () {
						/*
						 div.widgetMultipleChoiceQuestion
						 	p.question
							div.choices
								span.widgetSelectGroup
							div.submit
								div.widgetButton
							div.responses
						 */
						var tree =
							{ name: 'DIV', class: 'widgetMultipleChoiceQuestion', children:
								[ { name: 'P', class: 'question' },
								  { name: 'DIV', class: 'choices', children:
									  [ { name: 'SPAN', class: 'widgetSelectGroup' } ]
								  },
								  { name: 'DIV', class: 'submit', children:
									  [ { name: 'DIV', class: 'widgetButton' } ]
								  },
								  { name: 'DIV', class: 'responses' }
								],
							};

						helper.expectElementTree(myMultipleChoiceQuestion.lastdrawn.widgetGroup, tree);
					});
				});

				// The SelectGroup bric doesn't support this method yet.
				describe.skip('.selectItemAtIndex()', function () {
					it('should publish the multiplechoicequestion.selectedEventId with the answer key of the item at that index', function () {
						var index = 1;
						var expectedKey = myMultipleChoiceQuestion.choiceWidget.choices[index].answerKey;
						var prevSelectEventCount = selectEventCount;
						myMultipleChoiceQuestion.selectItemAtIndex(index);
						expect(selectEventCount).is.equal(prevSelectEventCount + 1);
						expect(lastSelectEventDetails.selectKey).is.equal(expectedKey);
					});

					it('should change the selection when selecting an unselected item', function() {
						var expectedKey = myMultipleChoiceQuestion.choiceWidget.choices[2].answerKey;
						// Arrange - item 1 is selected
						myMultipleChoiceQuestion.selectItemAtIndex(1);
						var prevSelectEventCount = selectEventCount;
						lastSelectEventDetails = null;
						// Act - change the selection to item 2
						myMultipleChoiceQuestion.selectItemAtIndex(2);
						// Assert - select event was published
						expect(selectEventCount, "select event count").is.equal(prevSelectEventCount + 1);
						expect(lastSelectEventDetails.selectKey).is.equal(expectedKey);
					});

					it('should do nothing when selecting an already selected item (no event)', function() {
						// Arrange - item 1 is selected
						myMultipleChoiceQuestion.selectItemAtIndex(1);
						var prevSelectEventCount = selectEventCount;
						lastSelectEventDetails = null;
						// Act - re-select item 1
						myMultipleChoiceQuestion.selectItemAtIndex(1);
						// Assert - select event was not published
						expect(selectEventCount, "select event count").is.equal(prevSelectEventCount);
						expect(lastSelectEventDetails).to.be.null;
					});

					it.skip('MANUAL TEST: should publish selectedEventId when selection is made w/ mouse or keyboard', function() {
					});
				});

				// The SelectGroup bric doesn't support this method yet.
				describe.skip('.selectedItem()', function () {
					before(function () {
						cntrNode && d3.select(cntrNode).remove();
						cntrNode = helper.createNewDiv();
						myMultipleChoiceQuestion.draw(d3.select(cntrNode));
					});

					it('should return null when no item is selected', function () {
						expect(myMultipleChoiceQuestion.selectedItem()).to.be.null;
					});

					it('should return the selected choice, even after the choice has been changed', function () {
						// 1st selection
						myMultipleChoiceQuestion.selectItemAtIndex(1);
						expect(myMultipleChoiceQuestion.selectedItem()).is.deep.equal(myMultipleChoiceQuestion.choiceWidget.choices[1]);

						// 2nd selection is after the current selection
						myMultipleChoiceQuestion.selectItemAtIndex(3);
						expect(myMultipleChoiceQuestion.selectedItem()).is.deep.equal(myMultipleChoiceQuestion.choiceWidget.choices[3]);

						// 3rd selection is before the current selection
						myMultipleChoiceQuestion.selectItemAtIndex(0);
						expect(myMultipleChoiceQuestion.selectedItem()).is.deep.equal(myMultipleChoiceQuestion.choiceWidget.choices[0]);
					});
				});
			});	
		});
    });
})();
