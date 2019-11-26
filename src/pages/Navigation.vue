<template>
  <div class="navigation">
    <h1>Navigation</h1>
    <ul>
      <li><a href="/voronoi">Voronoi</a></li>
      <li><a href="/triangulation">Triangulation</a></li>
      <li><a href="/voronoiDocs">Voronoi + Documents</a></li>
      <li><a href="/voronoiRoad">Voronoi + Road</a></li>
      <li><a href="/hexagon">Hexagon + Road</a></li>
      <li><a href="/voronoiComparison">Voronoi VS Hexagon</a></li>
      <li><a href="/advancedHexagon">Advanced Hexagon</a></li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'Navigation',
  props: {
    msg: String
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.navigation {
  width: 100%;
  height: 100%;
}
h1 {
  display: inline-block;
  /* margin-top: 200px; */
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  /* display: inline-block; */
  /* margin: 0 10px; */
}
a {
  color: #42b983;
}
</style>
