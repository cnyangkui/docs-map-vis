<template>
  <div class="container">
    <div class="left">
      <VoronoiRoad></VoronoiRoad>
    </div>
    <div class="right">
      <IterativeVoronoi></IterativeVoronoi>
    </div>
  </div>
</template>

<script>
import VoronoiRoad from './VoronoiRoad.vue'
import IterativeVoronoi from './IterativeVoronoi.vue'
export default {
  name: 'VoronoiComparison',
  components: {
    VoronoiRoad,
    IterativeVoronoi
  },
  data() {
    return {
      
    }
  }
}
</script>
<style lang="scss" scoped>
.container {
  width: 100%;
  height: 100%;

  .left {
    display: inline-block;
    position: relative;
    width: 50%;
    height: 100%;
    float: left;
  }

  .right {
    display: inline-block;
    position: relative;
    width: 50%;
    height: 100%;
    float: right;
  }
}
</style>