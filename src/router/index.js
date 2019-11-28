import Vue from 'vue'
import VueRouter from 'vue-router'
import Navigation from '../pages/Navigation'
import Contour from '../components/Contour.vue'
import Voronoi from '../components/Voronoi.vue'
import Hexagon from '../components/Hexagon.vue'
import Triangulation from '../components/Triangulation.vue'
import VoronoiDocs from '../components/VoronoiDocs.vue'
import VoronoiRoad from '../components/VoronoiRoad.vue'
import VoronoiComparison from '../components/VoronoiComparison.vue'
import AdvancedHexagon from '../components/AdvancedHexagon.vue'
import AdvancedHexagonLake from '../components/AdvancedHexagonLake.vue'
import Map from '../components/Map.vue'

Vue.use(VueRouter)

const router = new VueRouter({
  mode: 'history',
  routes: [
    { path:'/', component: Navigation },
    { path: '/navigation', name: 'navigation', component: Navigation },
    { path: '/contour', name: 'contour', component: Contour },
    { path: '/voronoi', name: 'voronoi', component: Voronoi },
    { path: '/hexagon', name: 'hexagon', component: Hexagon },
    { path: '/triangulation', name: 'triangulation', component: Triangulation },
    { path: '/voronoiDocs', name: 'voronoiDocs', component: VoronoiDocs },
    { path: '/voronoiRoad', name: 'voronoiRoad', component: VoronoiRoad },
    { path: '/voronoiComparison', name: 'voronoiComparison', component: VoronoiComparison },
    { path: '/advancedHexagon', name: 'advancedHexagon', component: AdvancedHexagon },
    { path: '/advancedHexagonLake', name: 'advancedHexagonLake', component: AdvancedHexagonLake },
    { path: '/map', name: 'map', component: Map }
  ]
});

export default router;