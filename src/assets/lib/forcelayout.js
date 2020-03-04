const d3 = require("d3");
const fs = require("fs");
const similarityMatrix = require("../../../public/data/output/nCovMemory/similarity.json");

function forcelayout(graph) {
  let width = 500, height = 500;

  let simulation = d3
    .forceSimulation(graph.nodes)
    .force("charge", d3.forceManyBody())
    .force(
      "link",
      d3
        .forceLink(graph.links)
        .id(d => d.id)
    )

  // let node = everything
  //   .append("g")
  //   .attr("class", "nodes")
  //   .selectAll("circle")
  //   .data(graph.nodes);

  //add tick instructions:
  // simulation.on("tick", tickActions);
  // function tickActions() {
  //   console.log(graph.nodes[0])
  // }

  simulation.on("end", function () {
    let generatedData = graph.nodes.map(function(d, i) {
      return {index: i, x: d.x, y: d.y};
    })
    let writePath = "./public/data/output/nCovMemory/forceResult.json"
    fs.writeFile(writePath, JSON.stringify(generatedData), function (err) {
      if (err) {
        return console.error(err);
      }
      console.log("数据写入成功！");
    });
  })
}

function initData(filterRange) {
  let graph = {
    nodes: [],
    links: [],
  }
  let length = similarityMatrix.length;
  for (let i = 0; i < length; i++) {
    graph.nodes.push({ id: i });
  }
  for (let i = 0; i < length - 1; i++) {
    for (let j = i + 1; j < length; j++) {
      if (
        similarityMatrix[i][j] >= filterRange[0] &&
        similarityMatrix[i][j] <= filterRange[1]
      ) {
        graph.links.push({
          source: i,
          target: j,
          weight: +similarityMatrix[i][j].toFixed(4)
        });
      }
    }
  }
  return graph;
}

let filterRange = [0.3, 1];
let graph = initData(filterRange);
forcelayout(graph);