import Vue from 'vue'
import VueRouter from 'vue-router'
import Navigation from '../pages/Navigation'
import Contour from '../components/Contour.vue'
import Voronoi from '../components/Voronoi.vue'
import EnhancedVoronoi from '../components/EnhancedVoronoi.vue'
import Triangulation from '../components/Triangulation.vue'
import VoronoiDocs from '../components/VoronoiDocs.vue'
import VoronoiRoad from '../components/VoronoiRoad.vue'
import VoronoiComparison from '../components/VoronoiComparison.vue'
import EnhancedVoronoiOcean from '../components/EnhancedVoronoiOcean.vue'
import EnhancedVoronoiOceanLake from '../components/EnhancedVoronoiOceanLake.vue'
import Map from '../components/Map.vue'
import FastMap from '../components/FastMap.vue'

Vue.use(VueRouter)

const router = new VueRouter({
  mode: 'history',
  routes: [
    { path:'/', component: Navigation },
    { path: '/navigation', name: 'navigation', component: Navigation },
    { path: '/contour', name: 'contour', component: Contour },
    { path: '/voronoi', name: 'voronoi', component: Voronoi },
    { path: '/enhancedVoronoi', name: 'enhancedVoronoi', component: EnhancedVoronoi },
    { path: '/triangulation', name: 'triangulation', component: Triangulation },
    { path: '/voronoiDocs', name: 'voronoiDocs', component: VoronoiDocs },
    { path: '/voronoiRoad', name: 'voronoiRoad', component: VoronoiRoad },
    { path: '/voronoiComparison', name: 'voronoiComparison', component: VoronoiComparison },
    { path: '/enhancedVoronoiOcean', name: 'enhancedVoronoiOcean', component: EnhancedVoronoiOcean },
    { path: '/enhancedVoronoiOceanLake', name: 'enhancedVoronoiOceanLake', component: EnhancedVoronoiOceanLake },
    { path: '/map', name: 'map', component: Map },
    { path: '/fastMap', name: 'FastMap', component: FastMap }
  ]
});

export default router;