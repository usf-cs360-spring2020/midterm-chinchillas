
function drawBarchart(data){
  // configuration of svg/plot area
  let config = {
    'svg': {},
    'margin': {},
    'plot': {}
  };

  config.margin.top = 120;
  config.margin.right = 25;
  config.margin.bottom = 0;
  config.margin.left = 30;

  config.svg.height = 700 - config.margin.top - config.margin.bottom;
  config.svg.width = 970 - config.margin.left - config.margin.right;


 let lowerpad = 0;//for moving the chart up and down.
  // setup svg
  let svg = d3.select("#barChart");
  svg.attr('width', config.svg.width + config.margin.left +config.margin.right);
  svg.attr('height', config.svg.height + 2*config.margin.top + config.margin.bottom);
  svg.attr("transform", translate(config.margin.left, config.margin.top))
  //svg.style("background-color", "pink");

//x-axis scaleband (for months) to the middle of the svg for the left bar-chart
  let x = d3.scaleBand()
  .range([0, config.svg.width/2])// to the middle
  .domain(data.map(d => d.Month))
  .paddingInner(0.2)
  .paddingOuter(0.1);

//x-axis scaleband (for months) from the middle of the svg for the right bar-chart
  let x2 = d3.scaleBand()
  .range([config.svg.width/2, config.svg.width]) // from the middle
  .domain(data.map(d => d.Month))
  .paddingInner(0.2)
  .paddingOuter(0.1);

//y-axis scale linear by minutes
let y = d3.scaleLinear()
  .domain([0, d3.max(data, d => d.NonLifeThreatening)])
  .range([config.svg.height, 0])
  .nice();

//drawing the x axis left
  xaxis = d3.axisBottom(x)
  .tickSize(5)
  .tickPadding(5)
  .tickSizeOuter(0);

//drawing the x axis right
  xaxis2 = d3.axisBottom(x2)
  .tickSize(5)
  .tickPadding(5)
  .tickSizeOuter(0);

  yaxis = d3.axisLeft(y)
  .tickValues(d3.range(0, 11, 1))
  .ticks(10)
  .tickPadding(1);



//left axis
  svg.append("g")
  .attr("id", "x-axis")
  .attr("transform", `translate(${config.margin.left}, ${config.svg.height + config.margin.top - lowerpad})`)
  .call(xaxis)
  .selectAll("text") //from here adding the months texts and rotating them
    .attr("y", 6) //to align the rotation to the tick mark
    .attr("x", 9)
    .attr("dy", ".35em")
    .attr("transform", "rotate(45)")
    .style("text-anchor", "start");

//left axis
  svg.append("g")
  .attr("id", "x-axis2")
  .attr("transform", `translate(${config.margin.left}, ${config.svg.height + config.margin.top - lowerpad})`)
  .call(xaxis2)
  .selectAll("text") //from here adding the months texts and rotating them
    .attr("y", 6) //to align the rotation to the tick mark
    .attr("x", 9)
    .attr("dy", ".35em")
    .attr("transform", "rotate(45)")
    .style("text-anchor", "start");

  svg.append("g")
  .attr("id", "y-axis")
  .attr("transform", `translate(${config.margin.left}, ${config.margin.top - lowerpad})`)
  .call(yaxis);

  // add the Y gridlines
  svg.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(${config.margin.left}, ${config.margin.top - lowerpad})`)
      .call(yaxis
          .tickSize(-config.svg.width)
          .tickFormat("")
      );



//minute label for y-axis
  svg
    .append("text")
    .attr("class", "legend-text")
    .attr("x", config.margin.left - 20)
    .attr("y", config.margin.top -18)
    .text("Minutes")
    .attr("alignment-baseline", "middle")
    .style("font-size","12px")
    .style('fill', 'black');
//label for non life threatening calls
    // svg
    //   .append("text")
    //   .attr("class", "legend-text")
    //   .attr("x", config.margin.left + 30)
    //   .attr("y", config.margin.top -40)
    //   .text("Non Life Threatening Medical Calls")
    //   .attr("alignment-baseline", "middle")
    //   .style("font-size","20px")
    //   .style('fill', 'black');

//label for non life threatening calls
    // svg
    //   .append("text")
    //   .attr("class", "legend-text")
    //   .attr("x", config.margin.left + 475)
    //   .attr("y", config.margin.top -40)
    //   .text("Potentially Life Threatening Medical Calls")
    //   .attr("alignment-baseline", "middle")
    //   .style("font-size","20px")
    //   .style('fill', 'black');

//drawbars left
  let bars = svg.append("g")
  .attr("id", "bars")
  .attr("transform", `translate(${config.margin.left}, ${config.margin.top})`)
  .selectAll("rect")
  .data(data)
  .enter()
  .append("rect")
  .attr("x", d => x(d.Month))
  .attr("y", d => y(d.NonLifeThreatening))
  .attr("width", x.bandwidth())
  .attr("height", d => config.svg.height- lowerpad - y(d.NonLifeThreatening))
  .style("fill", "#3a9dc7");

//drawbars right
  let bars2 = svg.append("g")
  .attr("id", "bars2")
  .attr("transform", `translate(${config.margin.left}, ${config.margin.top})`)
  .selectAll("rect")
  .data(data)
  .enter()
  .append("rect")
  .attr("x", d => x2(d.Month))
  .attr("y", d => y(d.PotentiallyLifeThreatening))
  .attr("width", x2.bandwidth())
  .attr("height", d => config.svg.height- lowerpad - y(d.PotentiallyLifeThreatening))
  .style("fill", "#7FFFD4");

  //Mouseover start

  bars.on("mouseover", function(d) {
      bars.filter(e => (d.Month !== e.Month)).transition().style("fill", "lightgrey").attr("opacity", "0.7");
      bars2.filter(e => (d.Month !== e.Month)).transition().style("fill", "lightgrey").attr("opacity", "0.7");
    });

    bars2.on("mouseover", function(d) {
        bars2.filter(e => (d.Month !== e.Month)).transition().style("fill", "lightgrey").attr("opacity", "0.7");
        bars.filter(e => (d.Month !== e.Month)).transition().style("fill", "lightgrey").attr("opacity", "0.7");
      });

  bars.on("mouseout", function(d) {
      bars.transition().style("fill", "#3a9dc7").attr("opacity", "1");
      bars2.transition().style("fill", "#7FFFD4").attr("opacity", "1");
    });

  bars2.on("mouseout", function(d) {
      bars2.transition().style("fill", "#7FFFD4").attr("opacity", "1");
      bars.transition().style("fill", "#3a9dc7").attr("opacity", "1");
    });

  //mouseover end

  //tooltip

  bars.on("mouseover.hover2", function(d) {
     let me = d3.select(this);
     let div = d3.select("body").append("div");

     div.attr("id", "details");
     div.attr("class", "tooltip");

     let rows = div.append("table")
       .selectAll("tr")
       .data(Object.keys(d))
       .enter()
       .append("tr");
       console.log(rows);
     rows.append("th").text(key => key);
     rows.append("td").text(key => d[key]);
   });

 bars.on("mousemove.hover2", function(d) {
     let div = d3.select("div#details");

     // get height of tooltip
     let bbox = div.node().getBoundingClientRect();

     div.style("left", d3.event.pageX + "px")
     div.style("top",  (d3.event.pageY - bbox.height) + "px");
   });

 bars.on("mouseout.hover2", function(d) {
     d3.selectAll("div#details").remove();
   });

   //bars2

   var highlight = document.createElement("tr");
   highlight.className = ("is-selected");

   bars2.on("mouseover.hover2", function(d) {
      let me = d3.select(this);
      let div = d3.select("body").append("div");

      div.attr("id", "details");
      div.attr("class", "tooltip");

      let rows = div.append("table")
        .selectAll("tr")
        .data(Object.keys(d))
        .enter()
        .append("tr");

      rows.append("th").text(key => key);
      rows.append("td").text(key => d[key]);
      console.log(rows);
    });

  bars2.on("mousemove.hover2", function(d) {
      let div = d3.select("div#details");

      // get height of tooltip
      let bbox = div.node().getBoundingClientRect();

      div.style("left", d3.event.pageX + "px")
      div.style("top",  (d3.event.pageY - bbox.height) + "px");
    });

  bars2.on("mouseout.hover2", function(d) {
      d3.selectAll("div#details").remove();
    });

    svg
    .append("text")
    .attr("id", "charttitle")
     .attr("x",  75)
     .attr("y", 20)
     .style("text-anchor", "left")
     .style("font-weight", 600)
     .style("font-size", "22px")
     .text("Average Response time of life threatening vs non life threatening calls");


    //legend
    let ordinal = d3.scaleOrdinal()
  .domain(["Potentially Life Threatening Medical Calls", "Non life threatening medical calls"])
  .range(["#3a9dc7", "#7FFFD4"]);



svg.append("g")
  .attr("class", "legendOrdinal")
  .attr("transform", "translate(650,50)");

let legendOrdinal = d3.legendColor()
  .shape("path", d3.symbol().type(d3.symbolCircle).size(150)())
  .scale(ordinal)
  .on("cellover", function(d) {
      console.log(d);
      if (d == "Potentially Life Threatening Medical Calls"){
        bars2.filter(e => (d.Month !== e.Month)).transition().style("fill", "lightgrey").attr("opacity", "0.7");
      }
      else{
        bars.filter(e => (d.Month !== e.Month)).transition().style("fill", "lightgrey").attr("opacity", "0.7");
      }
    })
    .on("cellout", function(d) {
        bars2.transition().style("fill", "#7FFFD4").attr("opacity", "1");
        bars.transition().style("fill", "#3a9dc7").attr("opacity", "1");
      });

svg.select(".legendOrdinal")
  .call(legendOrdinal);


  function translate(x, y) {
    return 'translate(' + x + ',' + y + ')';
  }

}
