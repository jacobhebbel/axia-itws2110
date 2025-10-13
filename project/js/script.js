document.getElementById("loadBtn").addEventListener("click", () => {
  const symbol = document.getElementById("symbol").value.toUpperCase();
  if (symbol) loadChart(symbol);
});

async function loadChart(symbol) {
  const url = `http://127.0.0.1:5000/api/history/${symbol}`;
  const chartDiv = document.getElementById("chart");
  chartDiv.innerHTML = ""; // Clear previous chart

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      chartDiv.textContent = "Error: " + data.error;
      return;
    }
    if (!data.history || data.history.length === 0) {
      chartDiv.textContent = `No data found for ${symbol}`;
      return;
    }

    const history = data.history.map(d => ({
      date: new Date(d.date),
      close: +d.close
    }));

    drawChart(history, symbol);
  } catch (err) {
    chartDiv.textContent = "Error fetching data.";
    console.error(err);
  }
}

function drawChart(data, symbol) {
  const width = 800;
  const height = 400;
  const margin = { top: 40, right: 30, bottom: 30, left: 50 };

  const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const x = d3.scaleTime()
    .domain(d3.extent(data, d => d.date))
    .range([margin.left, width - margin.right]);

  const y = d3.scaleLinear()
    .domain([d3.min(data, d => d.close) * 0.95, d3.max(data, d => d.close) * 1.05])
    .range([height - margin.bottom, margin.top]);

  const line = d3.line()
    .x(d => x(d.date))
    .y(d => y(d.close));

  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(10));

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2)
    .attr("d", line);

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .text(`${symbol} - 1 Year Closing Prices`);
}
