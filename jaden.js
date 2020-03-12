// location of data file
let csv = 'img/pt1.csv';

// configuration of svg/plot area
let config = {
  'svg': {},
  'margin': {},
  'plot': {}
};

config.svg.height = 500;
config.svg.width = config.svg.height * 1.618; // golden ratio

config.margin.top = 100;
config.margin.right = 20;
config.margin.bottom = 20;
config.margin.left = 150;

config.plot.x = config.margin.left;
config.plot.y = config.margin.top;
config.plot.width = config.svg.width - config.margin.left - config.margin.right;
config.plot.height = config.svg.height - config.margin.top - config.margin.bottom;

// setup svg
let svg = d3.select('body').select('svg');
svg.attr('width', config.svg.width);
svg.attr('height', config.svg.height);

// setup plot area
let plot = svg.append('g');
plot.attr('id', 'plot');
plot.attr('transform', translate(config.plot.x, config.plot.y))


// use a rect to illustrate plot area
let rect = plot.append('rect');
rect.attr('id', 'background');

rect.attr('x', 0);
rect.attr('y', 0);
rect.attr('width', config.plot.width);
rect.attr('height', config.plot.height);

// scales for data
let scale = {};

scale.x = d3.scaleBand();
scale.x.range([0, config.plot.width]);

scale.y = d3.scaleBand();
scale.y.range([config.plot.height, 0]);

// https://github.com/d3/d3-scale-chromatic
color = d3.scaleSequential(d3.interpolateYlGnBu);

let axis = {};  // axes for data
axis.x = d3.axisTop(scale.x);
axis.x.tickPadding(0);

axis.y = d3.axisLeft(scale.y);
axis.y.tickPadding(0);

// format the tick labels
axis.x.tickFormat();
axis.y.tickFormat(regionFormatter);

// load data
// https://github.com/d3/d3-fetch/blob/master/README.md#csv
d3.csv(csv, convertRow).then(drawHeatmap);

// function to convert column names into date
// try: parseColumnName('1979-12');
let parseColumnName = d3.timeParse('%Y');

// function to convert each row
// https://github.com/d3/d3-fetch/blob/master/README.md#csv
function convertRow(row, index) {
  // this will be our converted output row
  let out = {};

  // this will be the values from each yyyy-mm column
  out.values = [];
  // loop through all of the columns in our original row
  // depending on column name, perform some sort of conversion
  for (let col in row) {
    switch (col) {
      // these are the text columns that do not need conversion
      case 'Neighborhooods':
        out[col] = row[col];
        break;

      // these are the columns that need to be converted to float
      case '2015':
      case '2016':
      case '2017':
      case '2018':
      case '2019':

        out[col] = parseFloat(row[col]);
        break;
      // default:
          // convert column name into the date

    }
    if(col != "Neighborhooods"){
      var date = col;

      // convert the value to float
      var value = parseFloat(row[col]);

      // add them to our values
      out.values.push({
        'date': date,
        'value': value
      });
    }
  }


  return out;
}

function drawHeatmap(data) {
  console.log(data);
  console.log(data[0]);


  // lets reduce data size to biggest regions
  // the number of rows to keep
  let keep = 41;

  // filter dataset to smaller size
  data = data.filter(function(row) {
    return row['Neighborhooods'];
  });

  console.log('kept', data.length, 'rows');
  console.log(data);

  // keys = data[0];
  //
  //
  // keys = Object.keys(keys);
  //
  // keys = keys.slice(0,5)
  //
  // console.log(keys);


  // sorting is important in heatmaps
  // options: RegionName, SizeRank, HistoricAverage_1985thru1999
  let sortColumn = 'Neighborhooods';

  data = data.sort(function(a, b) {
    return a[sortColumn] - b[sortColumn];
  }).reverse();

  // need domains to setup scales
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
  let regions = data.map(row => row['Neighborhooods']);
  console.log(regions);

  let dates = data[0].values.map(value => value.date);
  console.log(dates);

  // now that we have data set the scale domain
  scale.x.domain(dates);
  scale.y.domain(regions);

  // draw the x and y axis
  let gx = svg.append("g");
  gx.attr("id", "x-axis");
  gx.attr("class", "axis");
  gx.attr("transform", translate(config.plot.x, config.margin.top));
  gx.call(axis.x);

  let gy = svg.append("g");
  gy.attr("id", "y-axis");
  gy.attr("class", "axis");
  gy.attr("transform", translate(config.plot.x, config.plot.y));
  gy.call(axis.y);

  let values = data.map(d => d.values);

 // combine all of the individual object arrays into one
 let merged = d3.merge(values);

 // get only the value part of the objects
 let mapped = merged.map(d => d.value);
 console.log(mapped);

 // console.log(mapped);
  // calculate the min, max, and median
  let min = d3.min(mapped);
  let max = d3.max(mapped);
  let mid = d3.mean(mapped);

  console.log(mid);
  console.log(max);
  console.log(min);


  color.domain([min, max]);

  // create one group per row
  let rows = plot.selectAll("g.cell")
    .data(data)
    .enter()
    .append("g");

  rows.attr("class", "cell");
  // rows.attr("id", d => "neighborhood-" + d.Neighborhooods);

  // shift the entire group to the appropriate y-location
  rows.attr("transform", function(d) {
    return translate(0, scale.y(d.Neighborhooods));
  });

  // create one rect per cell within row group
  let cells = rows.selectAll("rect")
    .data(d => d.values)
    .enter()
    .append("rect");

  cells.attr("x", d => scale.x(d.date));
  cells.attr("y", 0); // handled by group transform
  cells.attr("width", scale.x.bandwidth());
  cells.attr("height", scale.y.bandwidth());

  // here is the color magic!
  cells.style("fill", d => color(d.value));
  cells.style("stroke", d => color(d.value));

  svg
  .append("text")
  .attr("id", "charttitle")
   .attr("x",  35)
   .attr("y", 50)
   .style("text-anchor", "left")
   .style("font-weight", 600)
   .style("font-size", "22px")
   .text("Average Respone Time Per Neighborhoood Per Year");

  svg.append("g")
  .attr("class", "legendLinear")
  .attr("transform", "translate(600,40)")

var legendLinear = d3.legendColor()
  .shapeWidth(3)
  .cells(50)
  .shapePadding(0)
  .orient('horizontal')
  .scale(color)

  // .title("Avg. Minutes");

svg.select(".legendLinear")
  .call(legendLinear);



  svg.append("text").attr("id","legendtitle")
   .attr("x", 640)
   .attr("y",30)
   .style("text-anchor", "middle")
   .style("font-weight", 600)
   .style("font-size", "14px")
   .text("Avg. Minutes");
   svg.append("text").attr("id","legendMinScale")
    .attr("x", 570)
    .attr("y",70)
    .style("text-anchor", "left")
    .style("font-weight", 500)
    .style("font-size", "12px")
    .text(min);
    svg.append("text").attr("id","legendMaxScale")
     .attr("x", 740)
     .attr("y",70)
     .style("text-anchor", "left")
     .style("font-weight", 500)
     .style("font-size", "12px")
     .text(max);
}

// convert region to more condensed form
function regionFormatter(d) {
  let text = d;
  let parts = text.split(/[,-]+/);

  if (parts !== null) {
    text = parts[0];

    if (parts.length > 2) {
      text = text + "+";
    }
  }

  return text;
}

// helper method to make translating easier
function translate(x, y) {
  return 'translate(' + x + ',' + y + ')';
}
