<template>
  <div class="container">
    <div id="controller">
      <div class="block">
        <el-slider v-model="filterRange" range show-stops :step="0.1" :min="0" :max="1"></el-slider>
      </div>
    </div>
    <div id="nodelink"></div>
  </div>
</template>
<script>
import * as d3 from "d3";
import similarityMatrix from "../../public/data/output/nCovMemory/similarity.json";
export default {
  name: "ForceLayout",
  data() {
    return {
      filterRange: [0.1, 1],
      graph: {
        nodes: null,
        links: null,
      }
    };
  },
  mounted() {
    this.initData();
    this.layout();
  },
  methods: {
    initData() {
      this.graph.nodes = [];
      this.graph.links = [];
      let length = similarityMatrix.length;
      for (let i = 0; i < length; i++) {
        this.graph.nodes.push({ id: i });
      }
      for (let i = 0; i < length - 1; i++) {
        for (let j = i + 1; j < length; j++) {
          if (
            similarityMatrix[i][j] >= this.filterRange[0] &&
            similarityMatrix[i][j] <= this.filterRange[1]
          ) {
            this.graph.links.push({
              source: i,
              target: j,
              weight: +similarityMatrix[i][j].toFixed(4)
            });
          }
        }
      }
    },
    layout() {
      let width = 1200,
        height = 900;

      //set up the simulation and add forces
      let simulation = d3
        .forceSimulation()
        .nodes(this.graph.nodes)
        .force("charge", d3.forceManyBody().strength(-100))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force(
          "links",
          d3.forceLink(this.graph.links).id(function(d) {
            return d.id;
          })
        );

      //add tick instructions:
      simulation.on("tick", tickActions);

      //add encompassing group for the zoom
      let svg = d3.select("#nodelink").append("svg")
        .attr("width", width)
        .attr("height", height);

      var everything = svg.append("g").attr("class", "everything");

      //draw lines for the links
      let linkColour = d3
        .scaleSequential()
        .domain([0, 1])
        .interpolator(d3.interpolateOrRd);
      var link = everything
        .append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(this.graph.links)
        .enter()
        .append("line")
        .attr("stroke-width", 2)
        .style("stroke", function(d) {
          return linkColour(d.weight);
        });

      //draw circles for the nodes
      var node = everything
        .append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(this.graph.nodes)
        .enter()
        .append("circle")
        .attr("r", 3)
        .attr("fill", "black");

      //add drag capabilities
      var drag_handler = d3
        .drag()
        .on("start", drag_start)
        .on("drag", drag_drag)
        .on("end", drag_end);

      drag_handler(node);

      //add zoom capabilities
      // var zoom_handler = d3.zoom().on("zoom", zoom_actions);

      // zoom_handler(svg);
      svg.call(d3.zoom().on("zoom", zoom_actions));

      /** Functions **/

      //Drag functions
      //d is the node
      function drag_start(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }

      //make sure you can't drag the circle outside the box
      function drag_drag(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
      }

      function drag_end(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }

      //Zoom functions
      function zoom_actions() {
        everything.attr("transform", d3.event.transform);
      }

      function tickActions() {
        //update circle positions each tick of the simulation
        node
          .attr("cx", function(d) {
            return d.x;
          })
          .attr("cy", function(d) {
            return d.y;
          });

        //update link positions
        link
          .attr("x1", function(d) {
            return d.source.x;
          })
          .attr("y1", function(d) {
            return d.source.y;
          })
          .attr("x2", function(d) {
            return d.target.x;
          })
          .attr("y2", function(d) {
            return d.target.y;
          });
      }
    }
  },
  watch: {
    filterRange(o, n) {
      d3.select("#nodelink").selectAll("svg").remove();
      this.initData();
      this.layout();
    }
  }
};
</script>
<style lang="scss" scoped>
.container {
  .block {
    margin: 0 auto;
    width: 80%;
  }

  #nodelink {
    width: 100%;
    height: 900px;
  }
}
</style>