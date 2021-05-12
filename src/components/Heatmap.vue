<template>
  <div class="container">
    <div id="heatmap"></div>
  </div>
</template>
<script>
import * as d3 from "d3";
import * as h337 from "heatmap.js";
import forceLayoutPoints from "../../public/data/output/thucnews/proj.json";
export default {
  name: "Heatmap",
  data() {
    return {
      filterRange: [0.2, 1],
      width: 1200,
      height: 900,
      graph: {
        nodes: null,
        links: null
      }
    };
  },
  mounted() {
    this.draw();
  },
  methods: {
    draw() {
      // minimal heatmap instance configuration
      var heatmapInstance = h337.create({
        // only container is required, the rest will be defaults
        container: document.querySelector("#heatmap")
      });

      // now generate some random data
      let xExt = d3.extent(forceLayoutPoints, d => d.x);
      let yExt = d3.extent(forceLayoutPoints, d => d.y);
      let xScale = d3.scaleLinear().domain(xExt).range([0, this.width]);
      let yScale = d3.scaleLinear().domain(yExt).range([0, this.height]);

      var points = [];
      var max = 5;

      forceLayoutPoints.forEach(d => {
        points.push({
          x: Math.floor(xScale(d.x)),
          y: Math.floor(yScale(d.y)),
          value: 1
        })
      })
      // heatmap data format
      var data = {
        max: max,
        data: points
      };
      // if you have a set of datapoints always use setData instead of addData
      // for data initialization
      heatmapInstance.setData(data);


      let svg = d3.select("#heatmap")
        .append("svg")
        .attr("width", this.width)
        .attr("height", this.height);

      let nodes = svg.selectAll("circle")
        .data(forceLayoutPoints)
        .enter()
        .append("circle")
        .style("cx", d=>xScale(d.x))
        .style("cy", d=>yScale(d.y))
        .style("r", 2)
        .style("fill", "black");
    }
  },
  watch: {
    filterRange(o, n) {
      d3.select("#nodelink")
        .selectAll("svg")
        .remove();
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

  #heatmap {
    width: 1200px;
    height: 900px;
  }
}
</style>