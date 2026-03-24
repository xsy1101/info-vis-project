let arrestsData, detentionsData, removalsData;

const width = 900;
const height = 500;

const icon_value = 4000;
const icon_size = 26;
const icons_per_row = 5;
const padding = 1;

Promise.all([
  d3.json("/info-vis-project/data/arrests_yearly.json"),
  d3.json("/info-vis-project/data/detentions_yearly.json"),
  d3.json("/info-vis-project/data/removals_yearly.json")
]).then(([a, d, r]) => {
  arrestsData = a;
  detentionsData = d;
  removalsData = r;

  drawChart(arrestsData, "Total Arrests"); 
});

d3.selectAll(".tab").on("click", function() {
  const label = d3.select(this).text();

  if (label === "Arrests") {
    drawChart(arrestsData, "Total Arrests");
  } else if (label === "Detentions") {
    drawChart(detentionsData, "Total Detentions");
  } else if (label === "Removals") {
    drawChart(removalsData, "Total Removals");
  }
});

let svg = d3.select("#chart")
    .attr("id", "chart")
    .attr("width", width)
    .attr("height", height);

const margin = { top: 30, right: 30, bottom: 50, left: 80 };
    chartWidth = width - margin.left - margin.right;
    chartHeight = height - margin.top - margin.bottom;


const chart = svg.append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


function drawChart(data, label) {
    //remove all
    chart.selectAll("*").remove();
    //convert to int
    data.forEach(d => {
        d.fiscal_year = +d["Fiscal Year"];
            d.total = +d.total;
    });
    const xScale = d3.scaleBand()
        .domain(data.map(d => d.fiscal_year))
        .range([0, chartWidth])
        .padding(0.2);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.total)])
        .range([chartHeight, 0]);
    
    //drawing axis
    chart.append("g")
        .attr("transform", `translate(0,${chartHeight})`)
        .call(d3.axisBottom(xScale));

    chart.append("g")
        .call(d3.axisLeft(yScale));
    
    //axis label
    chart.append("text")
        .attr("class", "x-label")
        .attr("x", chartWidth / 2)
        .attr("y", chartHeight + 40) 
        .attr("text-anchor", "middle")
        .text("Fiscal Year");
    
    chart.append("text")
        .attr("class", "y-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -chartHeight / 2)
        .attr("y", -60) 
        .attr("text-anchor", "middle")
        .text(label);
    
    //computing icon parameters
    const iconData = [];

    data.forEach(d => {
        const count = Math.floor(d.total / icon_value);

        for (let i = 0; i < count; i++) {
            iconData.push({
            fiscal_year: d.fiscal_year,
            col: i % icons_per_row,
            row: Math.floor(i / icons_per_row)
            });
        }
    });
    
    //stacking icons
    chart.selectAll(".person")
        .data(iconData)
        .enter()
        .append("image")
        .attr("class", "person")
        .attr("href", "../assets/person.svg")
        .attr("width", icon_size)
        .attr("height", icon_size)

        .attr("x", d => 
            xScale(d.fiscal_year) + (xScale.bandwidth() - icons_per_row * icon_size)/2
            + d.col * icon_size
            )
        .attr("y", d => 
            chartHeight - (d.row + 1) * (icon_size + padding)
            );
    
    //compute number of rows
    const numRows = {};
    data.forEach(d => {
        const count = Math.floor(d.total / icon_value);
        const rows = Math.ceil(count / icons_per_row);
        numRows[d.fiscal_year] = rows;
    });
    
    //generate lines
    const line = d3.line()
        .x(d => xScale(d.fiscal_year) + (xScale.bandwidth()/2) )
        .y(d => chartHeight - numRows[d.fiscal_year] * (icon_size + padding) -10)
        //.curve(d3.curveMonotoneX)
        ;
    
    //draw lines
    path = chart.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "none")
        .attr("d", line);
    
    //calculate angles
    const pathNode = path.node();
    const totalLength = pathNode.getTotalLength();

    const chainPoints = d3.range(0, totalLength, 15).map(len => {
        const point = pathNode.getPointAtLength(len);
        const next = pathNode.getPointAtLength(Math.min(len + 1, totalLength));

        const angle = Math.atan2(next.y - point.y, next.x - point.x);

        return {
            x: point.x,
            y: point.y,
            angle: angle
        };
    });

    //add chains
    const chainSize = 20;
    chart.selectAll(".chain-link")
        .data(chainPoints)
        .enter()
        .append("image")
        .attr("class", "chain-link")
        .attr("href", "/assets/chains.svg")
        .attr("width", chainSize)
        .attr("height", 20)

        .attr("transform", d => `
            translate(${d.x}, ${d.y})
            rotate(${d.angle * 180 / Math.PI})
            translate(${-chainSize/2}, ${-chainSize/2})
        `);
        
        //draw dots
        chart.selectAll(".column-dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "column-dot")
        .attr("cx", d => 
        xScale(d.fiscal_year) + xScale.bandwidth() / 2 -2
        )
        .attr("cy", d =>
          chartHeight - numRows[d.fiscal_year] * (icon_size + padding) -10
        )
        .attr("r", 8)
        .attr("fill", "black");
    
}


