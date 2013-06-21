define(['jquery','d3'], function ($,d3) {
    'use strict';

	

		    /* **************************************************************************
		 * $Workfile:: widget-base.js                                               $
		 * **********************************************************************//**
		 *
		 * @fileoverview Implementation of the utility functions and objects
		 *               used by widgets.
		 *
		 * Created on		March 27, 2013
		 * @author			Leslie Bondaryk
		 * @author			Michael Jay Lippert
		 *
		 * Copyright (c) 2013 Pearson, All rights reserved.
		 *
		 * **************************************************************************/

		/* **************************************************************************
		 * Utilities
		 * **********************************************************************//**
		 * @todo These need to be moved out of global scope! -mjl
		 * **************************************************************************/

		function measure(container)
		{
			if (!container)
				return { height: 0, width: 0 };

			//container.append('text').attr({x: -1000, y: -1000}).text(text);
			var bbox = container.node().getBBox();
			//container.remove();
			return { height: bbox.height,
					 width:  bbox.width };
		};

		function logFormat(d)
		{
			//find the log base 10 (plus a little for zero padding)
			var x = (Math.log(d) / Math.log(10)) + 1e-6;  
			//then see if the log has abscissa 1, and only return numbers for those, and even
			return (Math.abs(x - Math.floor(x)) < .1)&&(Math.floor(x)%2==0) ? d3.round(Math.log(d)/Math.log(10)) : "";
		};

		/* **************************************************************************
		 * sign                                                                 *//**
		 *
		 * Return 1 for positive numbers, -1 for negative numbers and 0 for things
		 * which are neither.
		 *
		 * @param {number}	x		-The number whose sign is to be returned
		 *
		 * @todo The algorithm may want to be tweaked because I'm not sure this is what
		 * I'd want, I think I'd want 0 to return 1 not 0.
		 * My reasoning is that to give y the same sign as x I would want to
		 * write: y = sign(x) * abs(y);
		 * so it is useful to consider 0 positive even though it isn't. -mjl
		 ****************************************************************************/
		function sign(x)
		{
			return x ? x < 0 ? -1 : 1 : 0;
		};

		/* **************************************************************************
		 * attrFnVal                                                            *//**
		 *
		 * Utility method that constructs a string function call given the
		 * function name and arguments.
		 *
		 * @param {string}		fnName		-Function name that will be called.
		 * @param {...[number]} arguments	-Arguments for the function call.
		 ****************************************************************************/
		function attrFnVal(fnName)
		{
			// get the fn args into an Array
			var args = Array.prototype.slice.call(arguments, 1);

			var fnCallStr = fnName + '(';
			fnCallStr += args.join(',');
			fnCallStr += ')';
			
			return fnCallStr;
		};

		/* **************************************************************************
		 * getIdFromConfigOrAuto                                                *//**
		 *
		 * Utility method that returns the id property of the config object or
		 * uses the autoIdCount and autoIdPrefix properties of the class to return
		 * the next auto assigned id for that class.
		 *
		 * @param {Object}		config		-object containing optional string id property.
		 * @param {Object}		autoIdClass	-class object to supply the auto id
		 *
		 * @return {string} id from config or generated.
		 *
		 * @todo seems like this would be better as a static base class method once
		 *       we have a base class for widgets.
		 ****************************************************************************/
		function getIdFromConfigOrAuto(config, autoIdClass)
		{
			if (config.id !== undefined)
			{
				return config.id;
			}

			// Get the next auto id from the class
			// handle missing auto id properties
			if (!('autoIdCount' in autoIdClass))
			{
				autoIdClass.autoIdCount = 0;
			}

			if (!('autoIdPrefix' in autoIdClass))
			{
				autoIdClass.autoIdPrefix = "auto" + (++getIdFromConfigOrAuto.autoPrefixCount) + "_";
			}

			return autoIdClass.autoIdPrefix + (++autoIdClass.autoIdCount);
		};

		/* **************************************************************************
		 * randomizeArray                                                       *//**
		 *
		 * Randomize the order of the elements of the given array.
		 *
		 * @param {Array}	a		-The array whose elements are to be randomized
		 *
		 ****************************************************************************/
		function randomizeArray(a)
		{
			// We'll do this by assigning each element of the given array a random number
			// then sort by that number.
			var rndArray = [];

			for (var i = a.length - 1; i >= 0; --i)
			{
				rndArray[i] = { r: Math.random(), element: a[i] };
			}

			rndArray.sort(function (a, b) { return a.r - b.r; });

			for (var i = a.length - 1; i >= 0; --i)
			{
				a[i] = rndArray[i].element;
			};
		};

		/**
		 * Count of class autoIdPrefix properties that have been set by getIdFromConfigOrAuto.
		 */
		getIdFromConfigOrAuto.autoPrefixCount = 0;

	return {
		measure : measure,
		logFormat : logFormat,
		sign : sign,
		attrFnVal : attrFnVal,
		getIdFromConfigOrAuto : getIdFromConfigOrAuto,
		randomizeArray : randomizeArray
	}

});

