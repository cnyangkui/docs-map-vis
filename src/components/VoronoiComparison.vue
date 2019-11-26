<template>
  <div class="container">
    <div class="left">
      <VoronoiRoad></VoronoiRoad>
    </div>
    <div class="right">
      <AdvancedHexagon></AdvancedHexagon>
    </div>
  </div>
</template>

<script>
import VoronoiRoad from './VoronoiRoad.vue'
// import Hexagon from './Hexagon.vue'
import AdvancedHexagon from './AdvancedHexagon.vue'
export default {
  name: 'VoronoiComparison',
  components: {
    VoronoiRoad,
    AdvancedHexagon
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