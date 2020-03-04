import Vue from 'vue'
import VueRouter from 'vue-router'
import Navigation from '../pages/Navigation'
import Voronoi from '../components/Voronoi.vue'
import EnhancedVoronoi from '../components/EnhancedVoronoi.vue'
import Triangulation from '../components/Triangulation.vue'
import VoronoiDocs from '../components/VoronoiDocs.vue'
import VoronoiRoad from '../components/VoronoiRoad.vue'
import VoronoiComparison from '../components/VoronoiComparison.vue'
import EnhancedVoronoiOcean from '../components/EnhancedVoronoiOcean.vue'
import EnhancedVoronoiOceanLake from '../components/EnhancedVoronoiOceanLake.vue'
import Map from '../components/Map.vue'
import Map2 from '../components/Map2.vue'
import FastMap from '../components/FastMap.vue'
import TagCloud from '../components/TagCloud.vue'
import DocsMap from '../components/DocsMap.vue'
import ForceLayout from '../components/ForceLayout.vue'

Vue.use(VueRouter)

const router = new VueRouter({
  mode: 'history',
  routes: [
    { path:'/', component: Navigation },
    { path: '/navigation', name: 'navigation', component: Navigation },
    { path: '/voronoi', name: 'voronoi', component: Voronoi },
    { path: '/enhancedVoronoi', name: 'enhancedVoronoi', component: EnhancedVoronoi },
    { path: '/triangulation', name: 'triangulation', component: Triangulation },
    { path: '/voronoiDocs', name: 'voronoiDocs', component: VoronoiDocs },
    { path: '/voronoiRoad', name: 'voronoiRoad', component: VoronoiRoad },
    { path: '/voronoiComparison', name: 'voronoiComparison', component: VoronoiComparison },
    { path: '/enhancedVoronoiOcean', name: 'enhancedVoronoiOcean', component: EnhancedVoronoiOcean },
    { path: '/enhancedVoronoiOceanLake', name: 'enhancedVoronoiOceanLake', component: EnhancedVoronoiOceanLake },
    { path: '/map', name: 'map', component: Map },
    { path: '/map2', name: 'map2', component: Map2 },
    { path: '/fastMap', name: 'FastMap', component: FastMap },
    { path: '/tagcloud', name: 'tagcloud', component: TagCloud },
    { path: '/docsMap', name: 'docsMap', component: DocsMap },
    { path: '/forceLayout', name: 'forceLayout', component: ForceLayout },
  ]
});

export default router;