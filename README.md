PlayerProto
===========

Santiago Player prototype

Initial implementation and simple demo pages illustrating usage of the following widgets:

* SVG Widgets
  * LineGraph
  * BarChart
  * Image
  * CaptionedImage
  * Carousel
  * Sketch
* HTML Widgets
  * Button

The widgets are implemented in Javascript.
Currently we are mostly using google's [Javascript Style Guide][styleguide]
but with an exception for opening curly braces on their own line rather than at the end of the previous statement (because I (mike) have an extreme preference).

We do need some framework that will provide OOP but have not selected one yet. In particular our need is to be able to provide base class functionality overridden by derived classes only when necessary.

[styleguide]: http://google-styleguide.googlecode.com/svn/trunk/javascriptguide.xml
