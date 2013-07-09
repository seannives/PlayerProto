/* **************************************************************************
 * $Workfile:: bric-base.js                                             $
 * **********************************************************************//**
 *
 * @fileoverview BricBase abstract class.
 *
 * The _BricBase is the abstract class at the top hierarchy of bric class
 * inheritance.
 *
 * The code is inspired by backbone (well more than inspired), and sproutcore.
 * @todo: modify the code so it does not look to much like backbone.
 *
 * Created on   July 09, 2013
 * @author      Young-Suk
 *
 * Copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/


  /* **************************************************************************
   * _BricBase                                                               *//**
   *
   * This class represents a base class for all bric objects.
   * It is an abstract class, thus it should not be instantiated as it is
   */
  var _BricBase = function(options) {
    this.sid = _.uniqueId("bric");
    this._configure(options || {});
    this.initialize.apply(this, arguments);
  };

  // The options (properties) that the BricBase supports. The rest will be discarded.
  var bricOptions = ['el', 'id', 'attributes', 'className', 'tagName', 'events', 'messages'];

  // The underscore extends attaches methods to the _BricBase prototype. These methos are overridable
  _.extend(_BricBase.prototype, {
    tagName: 'div',
    
    //Initialize is an empty function by default. Override it with your own initialization logic
    initialize: function(){},

    // render is the core function that your view should override, in order to populate its element (this.el), with the appropriate HTML. The convention is for render to always return this.
    render: function() {
      return this;
    },

    // @todo: implement removing logic to remove bric to the DOM element and unsubscribe from events.
    remove: function() {

    },

    // Performs the initial configuration of Bric with a set of options.
    _configure: function(options) {
      if (this.options) options = _.extend({}, _.result(this, 'options'), options);
      _.extend(this, _.pick(options, bricOptions));
      this.options = options;
    }

  });

  

  //////////
  // The 'extend' function is a copy & paste from Backbonejs.
  // It depends on underscore library

  // Helper function to correctly set up the prototype chain, for subclasses.
  // Similar to `goog.inherits`, but uses a hash of prototype properties and
  // class properties to be extended.
  var extend = function(protoProps, staticProps) {
    var parent = this;
    var child;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent's constructor.
    if (protoProps && _.has(protoProps, 'constructor')) {
      child = protoProps.constructor;
    } else {
      child = function(){ return parent.apply(this, arguments); };
    }

    // Add static properties to the constructor function, if supplied.
    _.extend(child, parent, staticProps);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    var Surrogate = function(){ this.constructor = child; };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate();

    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) _.extend(child.prototype, protoProps);

    // Set a convenience property in case the parent's prototype is needed
    // later.
    child.__super__ = parent.prototype;

    return child;
  };


// associate the inheritance method for the base class
_BricBase.extend = extend;
