/* **************************************************************************
 * $Workfile:: bric-answerprovider.js                                             $
 * **********************************************************************//**
 *
 * @fileoverview Implementation of a AnswerProvider.
 *               
 * The AnswerProvider is direct replacement of AnsManager, but instead of
 * function, it is a class extending the BricBase class.
 *
 * Created on		July 9, 2013
 * @author			Young-Suk Ahn Park
 *
 * Copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/


/* **************************************************************************
 * _AnswerProvider                                                      *//**
 *
 * @abstractclass
 *
 * The _AnswerProvider is an abstract class that provides interface for all
 * AnswerProviders. A concrete AnswerProvider is responsible to score and 
 * return feedback for answer provided by the student.
 * A concrete AnserProvider must implement the operation submitAnswer 
 *
 *
 ****************************************************************************/
var _AnswerProvider = _BricBase.extend({

	/**
	 * The operation that processes the student answer.

	 */
	submitAnswer: function(studAnswer) {
		// @todo
	}

});


/* **************************************************************************
 * PollingAnswerProvider                                                 *//**
 *
 * @class
 *
 * The PollingAnswerProvider is a concrete class that keeps track of the
 * number of times an answer was selected by the student. 
 *
 ****************************************************************************/
var PollingAnswerProvider = _AnswerProvider.extend({

	/**
	 * Initialization function. Called by the BricBase constructor.
	 */
	initialize: function() {
		this.statData = {};
		console.log("PollingAnswerProvider Initialized")
	},

	/**
	 * Process the answer.
	 *
	 * @param {string}	studAnswer	- The student's answer key
	 * @return {object} - The object literal 
	 * 			{submission:<the studAnswer>,
	 *			feedback: <what will be displayed back to the student>,
	 *			score: <the numeric score>}
	 */
	submitAnswer: function(studAnswer) {
		if (studAnswer in this.statData) {
			this.statData[studAnswer] = this.statData[studAnswer] + 1;
		} else {
			this.statData[studAnswer] = 1;		
		}

		var responseHtml = "<div class='alert alert-success'><i class='icon-ok-sign'></i> " +
			"OK " + studAnswer + " selected " + this.statData[studAnswer] + " times. </div>";

		var scored = {
					// YSAP - No references 
					//container: config.container,
					submission: studAnswer,
					feedback: responseHtml
					};
		return scored;
	}
});

/* **************************************************************************
 * MockAnswerProvider                                                      *//**
 *
 * @class
 *
 * The MockAnswerProvider uses a fake answer table (fakeactivitydb.js)
 * To score the answer.
 *
 *
 ****************************************************************************/
var MockAnswerProvider = _AnswerProvider.extend({

	submitAnswer: function(studAnswer) {
		
		//set the sequence node. This will be used to look up the activity
		var sequenceNode = this.attributes.sequenceNode;
		var activity = sequenceNode;
		
		//lookup the student answer in the answer key in fakeactivitydb.js, which
		//got loaded with the page
		var activity = (sequenceNode in activities) ? activities[sequenceNode] : "activity not found";
		var solution = (studAnswer in activity) ? activity[studAnswer] : "solution key not found";

		// stash the answer score and response in some variables
		//var ansKey = ('score' in solution) ? activity.score : "answer key not found";
		var ansKey = solution.score;
		
		//initialized the scored return object.  We'll need to know it's container
		//(specifies where to write the responses), the value of the student submission,
		//the score, and any specialized response.
		var scored = {
					// YSAP - No references 
					//container: config.container,
					submission: solution.content,
					response: solution.response
					};
					
		//then we switch on the lookup right or wrong response.  This is hard-coded
		//to student answer now, but needs to come from the lookup vs. the student 
		//response.  Should be either 0 for wrong, 1 for right, or anything else for
		//partial credit for the fallthrough case.
					
		switch(ansKey)
			{
			case 1:
	  		// You got it right, hooray!
				scored.score = 1;
	 			break;
				
			case 0:
			// You're always WRONG!  HAHAHHAHAHA.
				scored.score = 0;
	  			break;
				
			case undefined: 
				scored.score = -1;
				break;
				
			//fallthrough case for partially correct answers.
			default:
	  			scored.score = 0.5;
				scored.response =" Sorta kinda.";
	  			break;
			}

		var responseFormat = {
				correct: {
					icon: "icon-ok-sign",
					feedbackContent: "Congratulations, Your answer, '<%= answer %>' is correct. <%= response %>",
					responseClass: "alert-success"
				},
				incorrect: {
					icon: "icon-remove",
					feedbackContent: "Sorry, Your answer, '<%= answer %>' , is not correct. <%= response %>",
					responseClass: "alert-error"
				},
				partial: {
					icon: "icon-adjust",
					feedbackContent: "Your answer, '<%= answer %>' , is partially correct. <%= response %>",
					responseClass: "alert-info"
				},
				unknown: {
					icon: "icon-adjust",
					feedbackContent: "Something has gone horribly awry - we can't score this answer. <%= response %>",
					responseClass: ""
				}
			};

		var scoreAnsType = ["unknown", "incorrect", "correct"];

		var ansType = "unknown";
		if (typeof scored.score === "number")
		{
			ansType = scoreAnsType[scored.score + 1];
		}

		// Using underscore's template to compose the message
		var responseHtml = "<div class='" + ["alert", responseFormat[ansType].responseClass].join(" ") + "'><i class='" + responseFormat[ansType].icon + "'></i> " +
			_.template(responseFormat[ansType].feedbackContent, 
					{ answer: (scored.submission || ""),  
					response: (scored.response || "")
				})
			+ "</div>";
		
		scored.feedback = responseHtml;

		//the return the scored object to the submitting page.
		return scored;
	}

})