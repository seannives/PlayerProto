/* **************************************************************************
 * widget-radiogroup-spec.js                                                $
 * **********************************************************************//**
 *
 * @fileoverview RadioGroup widget unit tests
 *
 * Created on		June 5, 2013
 * @author			Michael Jay Lippert
 *
 * Copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/

'use strict';


(function () {
    var expect = chai.expect;

	var expectElementTree = function expectElementTree(topElement, treeDescr)
	{
		expectElement(topElement, treeDescr);

		if (treeDescr.children)
		{
			var childElements = topElement.node().children;
			for (var i = 0; i < treeDescr.children.length; ++i)
			{
				expectElementTree(d3.select(childElements[i]), treeDescr.children[i]);
			};
		}
		else if (treeDescr.foreach)
		{
			var childElements = topElement.node().children;
			for (var i = 0; i < treeDescr.foreach.items.length; ++i)
			{
				expectElementTree(d3.select(childElements[i]),
								  treeDescr.foreach.fn(treeDescr.foreach.items[i]));
			};
		}
	};

	var expectElement = function expectElement(element, descr)
	{
		descr.name && expect(element.node().nodeName).to.be.equal(descr.name);
		descr.class && expect(element.classed(descr.class), 'has class ' + descr.class).to.be.true;
	};

    describe('RadioGroups: broadcasting for an answer', function () {
		var eventManager = null;

        describe('Creating a RadioGroup w/ 4 choices', function () {
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

			var configRadioGroup =
				{
					id: "rg1",
					choices: Q1Choices,
					numberFormat: "latin-upper"
				};
	
			var myRadioGroup = null;
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

				myRadioGroup = new RadioGroup(configRadioGroup, eventManager);
				eventManager.subscribe(myRadioGroup.selectedEventId, logSelectEvent);
			});
			
            it('should have the id that was specified in the config', function () {
                expect(myRadioGroup.id).to.equal(configRadioGroup.id);
            });

            it('should not create keys for choices w/o a key', function () {
                expect(myRadioGroup.choices[0]).to.not.have.property('key');
                expect(myRadioGroup.choices[3]).to.not.have.property('key');
            });

            it('should leave existing keys on images unchanged', function () {
                expect(myRadioGroup.choices[1]).to.have.property('key', 'foo').that.is.a('string');
            });

			it('should have an uninitialized lastdrawn property', function () {
                expect(myRadioGroup.lastdrawn).to.have.property('container').that.is.null;
                expect(myRadioGroup.lastdrawn).to.have.property('widgetGroup').that.is.null;
                expect(myRadioGroup.lastdrawn).to.have.property('choiceSelected').that.is.null;
            });

			describe('DOM manipulation (create/update elements) tests', function () {
				var cntrNode = null;

				after(function () {
					// Clean up test modifications to the DOM
					cntrNode.node && cntrNode.node.remove();
				});
					
				describe('.draw()', function () {
					before(function () {
						cntrNode = helper.createNewDiv();
						myRadioGroup.draw(d3.select(cntrNode));
					});
					
					it('should set the lastdrawn container property to the value passed in', function () {
						expect(myRadioGroup.lastdrawn.container.node()).to.deep.equal(cntrNode);
					});

					it('should have appended a div element with class \'widgetRadioGroup\' to the container' +
					   ' and set the lastdrawn.widgetGroup to that d3 selection', function () {
						// get the last element of the container
						var last = d3.select(cntrNode).select(":last-child");
						expect(last.node().nodeName).to.equal('DIV');
						expect(last.classed('widgetRadioGroup'), 'has class widgetRadioGroup').to.be.true;
						expect(myRadioGroup.lastdrawn.widgetGroup.node()).to.deep.equal(last.node());
					});

					// todo: Implement this test. -mjl
					it('should create a table w/ a row for each choice', function () {
						/*
						 div.widgetRadioGroup
						 	table.questionTable
								tbody
									foreach choice
										tr
											td
												input[type='radio'][name=this.id]
											td
												label
						 */
						var tree =
							{ name: 'DIV', class: 'widgetRadioGroup', children:
								[ { name: 'TABLE', class: 'questionTable', children:
										[ { name: 'TBODY',
											foreach: { items: configRadioGroup.choices,
													   fn: function (choice)
														   {
															   var choiceTree =
																	{ name: 'TR', children:
																		[ { name: 'TD', children:
																			[ { name: 'INPUT' } ]
																		  },
																		  { name: 'TD', children:
																			[ { name: 'LABEL' } ]
																		  },
																		]
																	};

															   return choiceTree;
														   }
													 }
										} ]
								} ],
							};

						expectElementTree(myRadioGroup.lastdrawn.widgetGroup, tree);
					});
				});

				describe.skip('.selectItemAtIndex()', function () {
					it('should publish the radiogroup.selectedEventId with the answer key of the item at that index', function () {
						var prevSelectEventCount = selectEventCount;
						myRadioGroup.selectItemAtIndex(1);
						expect(selectEventCount).is.equal(prevSelectEventCount + 1);
						expect(lastSelectEventDetails.selectKey).is.equal('foo');
					});

					it('should do nothing when selecting an already selected item (no event)', function() {
						// Arrange - item 1 is selected
						myRadioGroup.selectItemAtIndex(1);
						var prevSelectEventCount = selectEventCount;
						lastSelectEventDetails = null;
						// Act - re-select item 1
						myRadioGroup.selectItemAtIndex(1);
						// Assert - select event was not published
						expect(selectEventCount, "select event count").is.equal(prevSelectEventCount);
						expect(lastSelectEventDetails).to.be.null;
					});
				});
			});	
		});
    });
})();
