/* **************************************************************************
 * $Workfile:: answerman.js                                             $
 * **********************************************************************//**
 *
 * @fileoverview Client-side answer evaluation engine object.
 *
 * The AnswerMan engine does simple comparisons between its record of an item's
 * data and whether the submitted answer is correct or not.
 *
 * Created on		June 17, 2013
 * @author			Leslie Bondaryk
 *
 * Copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/


/* ===================================================
Functions for making various kinds of assessment, including 
numerical check, multiple choice, vocabulary check, labeling
===================================================*/
/* -----------------------------------------------
Student feedback and scoring functions
-------------------------------------------------*/

function scoreIt(config, studAnswer) {

	//ansType is a string that identifies which kind of question is to be scored
	this.ansType = config.ansType;
	//answer is an object with the correct answer(s) for this item, and feedback
	//answer.content, answer.response, answer.tolerance can be defined
	this.answer = config.answer;
	//distractor is an array of objects with identifyable incorrect answers, such as for MC, and it's feedback
	this.distractor = config.distractor;
	//studAnswer is the selection, entry, or input gesture from the student
	console.log("Scoring ", container, "... correct answer: ", answer.content, ", student sez: ", studAnswer);

	var match = 0;
	if (studAnswer == "") {
		alert("Please submit an answer.");
		match = 1;
	}
	if (answer.content === studAnswer) {
		d3.select("#" + container).append("div").attr("class", "alert alert-success").html("<i class='icon-ok-sign'></i> Your answer, " + studAnswer + ", is correct. " + answer.response);
		match = 1;
	} else {
		for (i = 0; i < distractor.length; i++) {
			if (distractor[i].content === studAnswer) {
				d3.select("#" + container).append("div").attr("class", "alert alert-error").html("<i class='icon-exclamation-sign'></i> Your answer, " + studAnswer + ", isn't correct. " + distractor[i].response);
				match = 1;
				break;
			}
		}
	}

	if (match == 0) {
		d3.select("#" + container).append("div").attr("class", "alert alert-error").html("<i class='icon-exclamation-sign'></i> Sorry, your answer, " + studAnswer + ", isn't correct.");
	}
} //end scoreIt function
//utility function for finding selected radio button from a group

function getCheckedRadio(name) {
	var match = 0;
	var radioButtons = document.getElementsByName(name);
	for (x = 0; x < radioButtons.length; x++) {
		if (radioButtons[x].checked) {
			return radioButtons[x].value;
			break;
		}
	}
	return "";
}

function slope(data) { //begin slope function
	var pt1 = d3.values(data[0]);
	var pt2 = d3.values(data[1]);
	var dx = pt1[0] - pt2[0],
		dy = pt1[1] - pt2[1];
	return [dx, dy, dy / dx];
} //end slope function
var myData = [{
	x: 0,
	y: 0
}, {
	x: 1,
	y: 1
}];
console.log("test slope line 1 dx, dy, slope: ", slope(myData), slope(myData) === [-1, -1, 1]);
