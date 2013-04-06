/* **************************************************************************
 * Axis                                                                 *//**
 *
 * @constructor
 *
 * Axes draw x-y axes in an SVG Container and provide scaling methods
 * to map data points into the area defined by the axes.
 * The bounds of each axis is defined by either the tick values or by
 * the data extents defined in that axis' AxisFormat.
 *
 * @param {!d3.selection}
 *						container			-The container svg element to append the axes element tree to.
 * @param {Object}		config				-The settings to configure these Axes.
 * @param {string}		config.id			-String to uniquely identify this Axes.
 * @param {Object}		config.size			-The height and width that the axes must fit within.
 * @param {number}		config.size.width	-The width (in pixels) to use for the Axes.
 * @param {number}		config.size.height	-The height (in pixels) to use for the Axes.
 * @param {AxisFormat}	config.xAxisFormat	-The formatting options for the horizontal (x) axis.
 * @param {AxisFormat}	config.yAxisFormat	-The formatting options for the vertical (y) axis.
 *
 ****************************************************************************/
function Axes(container, config)
{
	this.id = config.id;
	this.container = container;

	this.xFmt = config.xAxisFormat;
	this.yFmt = config.yAxisFormat;

	// Set defaults for missing axis extents
	if (!('extent' in this.xFmt))
		this.xFmt.extent = [1e-10, 1];

	if (!('extent' in this.yFmt))
		this.yFmt.extent = [0, 1];
		
	this.xAxis = new Axis(this.xFmt, config.size.width);
	this.yAxis = new Axis(this.yFmt, config.size.height);
	
} // end of Axes constructor




/* **************************************************************************
 * Axis                                                                 *//**
 *
 * @constructor
 *
 *
 ****************************************************************************/
function Axis(format, distance)
{
	this.format = format;
	this.distance = distance;
	this.isVertical = format.orientation === 'left' || format.orientation === 'right';
	this.scale = this.createScale();
	this.generator = null;
	
	
	var tickheight = 10;
	
		if (format.type === 'linear')
		{
			this.xScale = d3.scale.linear().domain(xExtent)
				.rangeRound([0, dataAreaWidth]);
	
	
} // end of Axis constructor

/* **************************************************************************
 * Axis.createScale                                                     *//**
 *
 * Updates this.scale based on the current properties of the Axis to be a
 * function which takes a data value along the axis and returns the position
 * in the view that corresponds to that data value.
 *
 ****************************************************************************/
Axis.prototype.createScale = function()
{
	switch (this.format.type)
	{
		case: 'linear':
		this.scale = this.createLinearScale();
		break;
		
		case: 'ordinal':
		this.scale = this.createOrdinalScale();
		break;
		
		case: 'log':
		this.scale = this.createLogScale();
		break;
		
		default:
		this.scale = null;
		console.log("An unsupported axis scale was requested (%s)", this.format.type);
		break;
	}
}

/* **************************************************************************
 * Axis.createLinearScale                                               *//**
 *
 *
 *
 ****************************************************************************/
Axis.prototype.createLinearScale = function()
{
	//Check if explicit ticks are specified, and if so, use them as the mapped range of the graph width
	//ignore the actual data range
	var dataExtent = ($.isArray(xTicks)) ? d3.extent(xTicks) : this.xFmt.extent;

	// invert the vertical output coordinates so that data values increase as you go up.
	var viewExtent = this.isVertical ? [this.distance, 0] : [0, this.distance];
	
	var scale = d3.scale.linear()
						.domain(dataExtent)
						.rangeRound(viewExtent);
		
	return scale;
}

/* **************************************************************************
 * Axis.createOrdinalScale                                              *//**
 *
 *
 *
 ****************************************************************************/
Axis.prototype.createOrdinalScale = function()
{
	// invert the vertical output coordinates so that data values increase as you go up.
	var viewExtent = this.isVertical ? [this.distance, 0] : [0, this.distance];
	
	// viewExtent is broken into even spaces allowing for bar width and
	// a uniform white space between each, in this case, 20% white space
	var scale = d3.scale.ordinal()
						.domain(this.format.ticks)
						.rangeRoundBands(viewExtent, 0.4);
		
	return scale;
}

/* **************************************************************************
 * Axis.createLogScale                                                  *//**
 *
 *
 *
 ****************************************************************************/
Axis.prototype.createLogScale = function()
{
	//Check if explicit ticks are specified, and if so, use them as the mapped range of the graph width
	//ignore the actual data range
	var dataExtent = ($.isArray(xTicks)) ? d3.extent(xTicks) : this.xFmt.extent;

	// invert the vertical output coordinates so that data values increase as you go up.
	var viewExtent = this.isVertical ? [this.distance, 0] : [0, this.distance];
	
	//always start and end on even decades
	var low = Math.floor(Math.log(dataExtent[0]) / Math.log(10));
	var high = Math.ceil(Math.log(dataExtent[1]) / Math.log(10));

	var scale = d3.scale.log()
						.domain([0.99 * Math.pow(10, low), Math.pow(10, high)])
						.rangeRound(viewExtent);
		
	return scale;
}
