PlayerProto
===========

Santiago Player prototype

Initial implementation and simple demo pages illustrating usage of the following widgets:

* SVG Widgets
  * LineGraph
  * BarChart
  * LabelGroup
  * Image
  * CaptionedImage
  * Carousel
  * Sketch
  * Markers (still on old framework)
  * Pie Charts (still on old framework)
  * Legends
* HTML Widgets
  * Button
  * Slider
  * RadioButton
  * Callout

The widgets are implemented in Javascript, and are largely based on the [d3 DOM manipulation framework][D3].

## Coding Style ##
Currently we are mostly using google's [Javascript Style Guide][styleguide]
but with an exception for opening curly braces on their own line rather than at the end
of the previous statement (because I (mike) have an extreme preference).

We are also using jsdoc comments sort of a mix of [google's closure compiler doc][goog-jsdoc] and [jsdoc 3][].

In addition, declare each local variable w/ its own `var`, don't declare multiple variables with one
var separated by commas. This *rule* comes from my c++ days, but I think it improves maintainability
even in javascript.

Similarly, the `then` (and `else`) portion of the `if` statement should always be on its own line
and enclosed in curly braces. The [arguments go back and forth][if-braces], but if it prevents
some merge errors it's worth the verbosity.

We do need some framework that will provide OOP but have not selected one yet. In particular our need is to be able to 
provide base class functionality overridden by derived classes only when necessary.

== Useful references ==

* git
  * [Think Like (a) Git](http://think-like-a-git.net/)
  * [SmartGit][] - A nice git GUI tool which runs on Windows, Mac and Linux

* Javascript frameworks
  * [D3][]  
  
[styleguide]: http://google-styleguide.googlecode.com/svn/trunk/javascriptguide.xml
[goog-jsdoc]: https://developers.google.com/closure/compiler/docs/js-for-compiler
[jsdoc 3]: http://usejsdoc.org/index.html
[if-braces]: http://programmers.stackexchange.com/questions/16528/single-statement-if-block-braces-or-no
[SmartGit]: http://www.syntevo.com/smartgithg/index.html
[D3]: https://github.com/mbostock/d3/wiki/API-Reference
