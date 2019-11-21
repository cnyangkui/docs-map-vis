<template>
  <div class="navigation">
    <h1>Navigation</h1>
    <ul>
      <li><a href="/contour">Contour</a></li>
      <li><a href="/voronoi">Voronoi</a></li>
      <li><a href="/triangulation">Triangulation</a></li>
      <li><a href="/voronoiRoad">Voronoi with Road</a></li>
      <!-- <li><a href="https://forum.vuejs.org" target="_blank" rel="noopener">Forum</a></li>
      <li><a href="https://chat.vuejs.org" target="_blank" rel="noopener">Community Chat</a></li>
      <li><a href="https://twitter.com/vuejs" target="_blank" rel="noopener">Twitter</a></li>
      <li><a href="https://news.vuejs.org" target="_blank" rel="noopener">News</a></li> -->
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
  margin-top: 200px;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
