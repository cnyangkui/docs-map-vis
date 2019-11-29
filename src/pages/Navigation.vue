<template>
  <div class="navigation">
    <h1>Navigation</h1>
    <!-- <ul>
      <li><a href="/voronoi">Voronoi</a></li>
      <li><a href="/triangulation">Triangulation</a></li>
      <li><a href="/voronoiDocs">Voronoi + Documents</a></li>
      <li><a href="/voronoiRoad">Voronoi + Road</a></li>
      <li><a href="/enhancedVoronoi">Enhanced Voronoi + Road</a></li>
      <li><a href="/enhancedVoronoiOcean">Enhanced Voronoi + Road + Ocean</a></li>
      <li><a href="/enhancedVoronoiOceanLake">Enhanced Voronoi + Road + Ocean + Lake</a></li>
      <li><a href="/voronoiComparison">Voronoi VS Enhanced Voronoi</a></li>
      <li><a href="/map">Map</a></li>
      <li><a href="/fastmap">FastMap</a></li>
    </ul>-->
    <div class="waterfall">
      <div class="item">
        <a href="/voronoi"><img src="/images/1.jpg"/></a>
        <p>Voronoi</p>
      </div>
      <div class="item">
        <a href="/triangulation"><img src="/images/2.jpg"/></a>
        <p>Triangulation</p>
      </div>
      <div class="item">
        <a href="/voronoiDocs"><img src="/images/3.jpg"/></a>
        <p>Voronoi + Documents</p>
      </div>
      <div class="item">
        <a href="/voronoiRoad"><img src="/images/4.jpg"/></a>
        <p>Voronoi + Road</p>
      </div>
      <div class="item">
        <a href="/enhancedVoronoi"><img src="/images/5.jpg"/></a>
        <p>Enhanced Voronoi + Road</p>
      </div>
      <div class="item">
        <a href="/enhancedVoronoiOcean"><img src="/images/6.jpg"/></a>
        <p>Enhanced Voronoi + Road + Ocean</p>
      </div>
      <div class="item">
        <a href="/enhancedVoronoiOceanLake"><img src="/images/7.jpg"/></a>
        <p>Enhanced Voronoi + Road + Ocean + Lake</p>
      </div>
      <div class="item">
        <a href="/map"><img src="/images/8.jpg"/></a>
        <p>Map</p>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: "Navigation",
  props: {
    msg: String
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.navigation {
  width: 90%;
  height: 100%;
  margin: 0 auto;
}
h1 {
  display: inline-block;
}
/*瀑布流层*/
.waterfall {
  -moz-column-count: 4; /* Firefox */
  -webkit-column-count: 4; /* Safari 和 Chrome */
  column-count: 4;
  -moz-column-gap: 1em;
  -webkit-column-gap: 1em;
  column-gap: 1em;
}
/*一个内容层*/
.item {
  padding: 1em;
  margin: 0 0 1em 0;
  -moz-page-break-inside: avoid;
  -webkit-column-break-inside: avoid;
  break-inside: avoid;
  border: 1px solid #000;
}
.item img {
  width: 100%;
  margin-bottom: 10px;
  cursor: pointer;
}
</style>
