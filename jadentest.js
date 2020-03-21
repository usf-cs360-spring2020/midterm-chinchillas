// location of data file
let csv = 'img/jaden2.csv';

// configuration of svg/plot area
let config = {
  'svg': {},
  'margin': {},
  'plot': {}
};

config.svg.height = 500;
config.svg.width = config.svg.height * 1.618; // golden ratio

config.margin.top = 70;
config.margin.right = 20;
config.margin.bottom = 10;
config.margin.left = 150;

config.plot.x = config.margin.left;
config.plot.y = config.margin.top;
config.plot.width = config.svg.width - config.margin.left - config.margin.right;
config.plot.height = config.svg.height - config.margin.top - config.margin.bottom;

// setup svg
let svg = d3.select('body').select('svg');
svg.attr('width', config.svg.width);
svg.attr('height', config.svg.height);
// svg.style("background-color", "pink")

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
color = d3.scaleSequential(d3.interpolateGnBu);

let axis = {};  // axes for data
axis.x = d3.axisTop(scale.x);
axis.x.tickPadding(1);

axis.y = d3.axisLeft(scale.y);
axis.y.tickPadding(0);



// format the tick labels
axis.x.tickFormat();
axis.y.tickFormat(regionFormatter);

// load data
// https://github.com/d3/d3-fetch/blob/master/README.md#csv
d3.csv(csv, convertRow).then(drawHeatmap);

// function to convert each row
// https://github.com/d3/d3-fetch/blob/master/README.md#csv
function convertRow(row, index) {
  // this will be our converted output row
  let out = {};

  // this will be the values from each yyyy-mm column
  out.values = [];
  out.yearAverage = [];
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

        var avg = parseFloat(row[col]);

        out.yearAverage.push({
          'date': col,
          'value': avg
        })
        break;
      // default:
          // convert column name into the date

    }

    if(col != "Neighborhooods" && col != "2015" && col != "2016" && col != "2017" && col != "2018" && col != "2019"){
      var date = col;

      console.log(date);

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
  // sorting is important in heatmaps
  // options: RegionName, SizeRank, HistoricAverage_1985thru1999
  let sortColumn = '';

  data = data.sort(function(a, b) {
    return a[sortColumn] - b[sortColumn];
  }).reverse();
  // data = data.filter(function(data.values)){
  //   // if
  // }
  // need domains to setup scales
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
  let regions = data.map(row => row['Neighborhooods']);

  let dates = data[0].values.map(value => value.date);

  dates = dates.filter(d => d.includes("2015"));

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


  let values = data.map(d => d.values.filter(d => d.date.includes("2015")));
  console.log(values);


 // combine all of the individual object arrays into one
 let merged = d3.merge(values);

 console.log(merged);


 // get only the value part of the objects
 let mapped = merged.map(d => d.value);

 // console.log(mapped);
  // calculate the min, max, and median
  let min = d3.min(mapped);
  let max = d3.max(mapped);
  let mid = d3.mean(mapped);


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


  cells.on("mouseover.hover", function(d) {
    d3.select(this)
      .raise()
      .style("stroke", "green")
      .style("stroke-width", 2);

    let div = d3.select("body").append("div");

    div.attr("id", "details");
    div.attr("class", "tooltip");

    let datanew = createTooltip(Object(d));
    let rows = div.append("tablenew")
      .selectAll("tr")
      .data(Object.keys(datanew))
      .enter()
      .append("tr");

    rows.append("th").text(key => key);
    rows.append("td").text(key => datanew[key]);
    div.style("display", "inline");
  });

  cells.on("mousemove.hover", function(d) {
    let div = d3.select("div#details");
    let bbox = div.node().getBoundingClientRect();

    //TODO: CHECK WHATS WRONG
    div.style("left", d3.event.pageX + "px");
    div.style("top", (d3.event.pageY - bbox.height) + "px");
  });

  cells.on("mouseout.hover", function(d) {
    d3.select(this).style("stroke", color(d));
    d3.selectAll("div#details").remove();
    cells.style("stroke", d => color(d.value));
  });



//legend and title
  svg
  .append("text")
  .attr("id", "charttitle")
   .attr("x",  35)
   .attr("y", 40)
   .style("text-anchor", "left")
   .style("font-weight", 600)
   .style("font-size", "22px")
   .text("Average Respone Time Per Neighborhoood Per Year");

  svg.append("g")
  .attr("class", "legendLinear")
  .attr("transform", "translate(600,30)")

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
   .attr("y",20)
   .style("text-anchor", "middle")
   .style("font-weight", 600)
   .style("font-size", "14px")
   .text("Avg. Minutes");
   svg.append("text").attr("id","legendMinScale")
    .attr("x", 563)
    .attr("y",41)
    .style("text-anchor", "left")
    .style("font-weight", 500)
    .style("font-size", "12px")
    .text(min);
    svg.append("text").attr("id","legendMaxScale")
     .attr("x", 755)
     .attr("y",41)
     .style("text-anchor", "left")
     .style("font-weight", 500)
     .style("font-size", "12px")
     .text(max);
}

function createTooltip(row, index) {

    var f = d3.format(".3f");
    let out = {};
    for (let col in row) {
      switch (col) {

        case 'date':
          out['Date:\xa0'] = row[col];
          break;
        case 'value':
          out['Avg. Minutes:\xa0'] = f(parseFloat(row[col]));
        default:
          break;
      }
    }
    return out;
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
