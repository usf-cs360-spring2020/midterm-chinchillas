var width = 940;
var height = 250;

var pad = {
  top: 10, bottom: 25,
  left: 35, right: 10
};

var plot = {
  width: width - pad.left - pad.right,
  height: height - pad.top - pad.bottom
};

var data = [];

var scales = {
  average: d3.scaleLinear(),
  total: d3.scaleLinear(),
  date: d3.scaleTime(),
  district: d3.scaleBand()
};

console.log("plot area:", [plot.width, plot.height]);

var remote = "https://data.sfgov.org/resource/8b9n-iqj8.json?$limit=4000";
var local = "8b9n-iqj8.json";

d3.json(local, callback);

function callback(error, json) {
  if (error) throw error;

  // convert and filter data
  json.forEach(function(current, index, array) {
    if (current.pddistrict === undefined) return;

    data.push({
      // convert to number
      incidents: +current.count_incidntnum,
      // convert to titlecase string
      district: current.pddistrict[0] + current.pddistrict.substr(1).toLowerCase(),
      // convert to date
      date: new Date(current.date)
    });
  });

  console.log(data);

  // want one bar and one line per neighborhood
  // so we must nest the data by neighborhood
  data = d3.nest()
    .key(function(d) { return d.district; })
    .rollup(function(group) {
      // this will become the "value" object for each outer element
      return {
        points: group,
        min: d3.min(group,  function(d) { return d.incidents; }),
        avg: d3.mean(group, function(d) { return d.incidents; }),
        max: d3.max(group,  function(d) { return d.incidents; })
      };
    })
    .entries(data);

  // sort by average
  data.sort(function(outer1, outer2) {
    return d3.descending(outer1.value.avg, outer2.value.avg);
  });

  console.log(data);

  // setup the scale domains
  setupScales();

  // draw the two graphs
  drawLines(d3.select("svg#lines"));
  drawBars(d3.select("svg#bars"));

  // add interactivity
  interactBars();
  interactLines();
}

function interactBars() {
  var rects = d3.select("svg#bars")
    .select("g#plot")
    .selectAll("rect");

  rects.on("mouseover", function(outer) {
    var t = d3.transition();

    // transition this bar to highlight color
    d3.select(this)
      .transition(t)
      .style("fill", "gray");

    var g = d3.select("svg#lines")
      .select("g#" + outer.key);

    // move line group to front
    g.raise();

    // transition points to highlight color
    g.selectAll("circle")
      .transition(t)
      .style("fill", "gray")
      .attr("r", 3);

    // transition line to highlight color
    g.select("path")
      .transition(t)
      .style("stroke", "gray")
      .style("stroke-width", "2px");
  });

  rects.on("mouseout", function(outer) {
    var me = d3.select(this);
    var on = me.classed("on");

    // only fade out bar and line if this bar is not active
    if (!on) {
      var t = d3.transition();

      // transition bar back to background color
      me.transition().style("fill", "lightgray");

      // transition line back ot background color
      var g = d3.select("svg#lines")
        .select("g#" + outer.key);

      g.selectAll("circle")
        .transition(t)
        .style("fill", "lightgray")
        .attr("r", 2);

      g.select("path")
        .transition(t)
        .style("stroke", "lightgray")
        .style("stroke-width", "1px");
    }
  });

  // filter line on click
  rects.on("click", function(outer) {
    var me = d3.select(this);
    var on = me.classed("on");

    // if not active make active and filter
    if (!on) {
      d3.select("svg#lines")
        .select("g#plot")
        .selectAll("g")
        .filter(function(d) {
          return outer.key != d.key;
        })
        .transition()
        .style("opacity", 0)
        .on("end", function(d) {
          d3.select(this).style("visibility", "hidden");
        });
    }
    else {
      // unhide all of the lines
      d3.select("svg#lines")
        .select("g#plot")
        .selectAll("g")
        .filter(function(d) {
          return outer.key != d.key;
        })
        .style("visibility", "visible")
        .transition()
        .style("opacity", 1);

      // let mouseover event fix the line color
    }

    // toggle whether this element is active
    me.classed("on", !on);
  });

  // TODO What about hovering while filtering?
  // TODO What about clicking two bars?
  // TODO Add label text
}

// see: https://bl.ocks.org/mbostock/8033015
function interactLines() {
  // use the voronoi polygon generator
  var voronoi = d3.voronoi()
    .x(function(inner) { return scales.date(inner.date); })
    .y(function(inner) { return scales.total(inner.incidents); })
    .extent([[0, 0],[plot.width, plot.height]]);

  // create a group for the voronoi polygons
  var vg = d3.select("svg#lines")
    .append("g")
    .attr("id", "voronoi")
    .attr("transform", translate(pad.left, pad.top))
    .style("pointer-events", "all");

  // collect all the line points into one array
  var all = d3.merge(data.map(function(outer) { return outer.value.points; }));

  // add a polygon for every point
  vg.selectAll("path")
    .data(voronoi.polygons(all))
    .enter()
    .append("path")
    // .attr("id", function(d) { d.district })
    .attr("d", function(d) { return d ? "M" + d.join("L") + "Z" : null; })
    .style("fill", "none")
    .style("stroke", "none")
    .on("mouseover", function(inner) {
      d3.select(inner.data.point).style("visibility", "visible");
    })
    .on("mouseout", function(inner) {
      d3.select(inner.data.point).style("visibility", "hidden");
    });

  // TODO Voronoi per line
  // TODO Add label text
}

function setupScales() {
  var firstDistrict = data[0].value.points;
  var dateExtent = d3.extent(firstDistrict, function(inner) { return inner.date; });
  scales.date.range([0, plot.width]);
  scales.date.domain(dateExtent);

  var maxAverage = d3.max(data, function(outer) { return outer.value.avg; });
  scales.average.range([plot.height, 0]);
  scales.average.domain([0, maxAverage]).nice();

  var minTotal = d3.min(data, function(outer) { return outer.value.min; });
  var maxTotal = d3.max(data, function(outer) { return outer.value.max; });
  scales.total.range([plot.height, 0]);
  scales.total.domain([minTotal, maxTotal]).nice();

  var districts = data.map(function(outer) { return outer.key; });
  scales.district.range([0, plot.width]);
  scales.district.domain(districts);
  scales.district.paddingInner(0.1);
  scales.district.paddingOuter(0.1);
}

function drawLines(svg) {
  svg.attr("width", width);
  svg.attr("height", height);

  // create plot
  var g = svg.append("g");

  g.attr("id", "plot");
  g.attr("transform", translate(pad.left, pad.top));

  // draw lines
  var line = d3.line()
    .x(function(inner) { return scales.date(inner.date); })
    .y(function(inner) { return scales.total(inner.incidents); });

  var lines = g.selectAll("g")
    .data(data)
    .enter()
    .append("g")
    .attr("id", function(outer) { return outer.key; });

  lines.append("path")
    .attr("d", function(outer) {
      return line(outer.value.points);
    })
    .style("stroke", "lightgray");

  // draw points
  lines.selectAll("circle")
    .data(function(outer) { return outer.value.points; })
    .enter()
    .append("circle")
    .attr("id", function(inner, i) { return inner.district + String(i); })
    .attr("cx", function(inner) { return scales.date(inner.date); })
    .attr("cy", function(inner) { return scales.total(inner.incidents); })
    .attr("r", 2)
    .style("fill", "lightgray")
    .style("visibility", "hidden")
    // needed for voronoi
    .each(function(inner) {
      inner.point = this;
    });

  // add x-axis
  svg.append("g")
    .attr("id", "x")
    .attr("class", "axis")
    .attr("transform", translate(pad.left, pad.top + plot.height))
    .call(d3.axisBottom(scales.date));

  // add y-axis
  svg.append("g")
    .attr("id", "y")
    .attr("class", "axis")
    .attr("transform", translate(pad.left, pad.top))
    .call(d3.axisLeft(scales.total));

  return lines;
}

function drawBars(svg) {
  svg.attr("width", width);
  svg.attr("height", height);

  // create plot
  var g = svg.append("g");

  g.attr("id", "plot");
  g.attr("transform", translate(pad.left, pad.top));

  // draw bars
  var bars = g.selectAll("g")
    .data(data)
    .enter()
    .append("g")
    .attr("id", function(outer) { return outer.key; });

  bars.append("rect")
    .attr("x", function(outer) { return scales.district(outer.key); })
    .attr("y", function(outer) { return scales.average(outer.value.avg); })
    .attr("width", scales.district.bandwidth())
    .attr("height", function(outer) { return plot.height - scales.average(outer.value.avg); })
    .style("fill", "lightgray");

  // add x-axis
  svg.append("g")
    .attr("id", "x")
    .attr("class", "axis")
    .attr("transform", translate(pad.left, pad.top + plot.height))
    .call(d3.axisBottom(scales.district));

  // add y-axis
  svg.append("g")
    .attr("id", "y")
    .attr("class", "axis")
    .attr("transform", translate(pad.left, pad.top))
    .call(d3.axisLeft(scales.average));

  return bars;
}

function translate(x, y) {
  return "translate(" + String(x) + "," + String(y) + ")";
}
