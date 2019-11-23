import Vue from 'vue'
import VueRouter from 'vue-router'
import Navigation from '../pages/Navigation'
import Contour from '../components/Contour.vue'
import Voronoi from '../components/Voronoi.vue'
import Triangulation from '../components/Triangulation.vue'
import VoronoiDocs from '../components/VoronoiDocs.vue'
import VoronoiRoad from '../components/VoronoiRoad.vue'

Vue.use(VueRouter)

const router = new VueRouter({
  mode: 'history',
  routes: [
    { path:'/', component: Navigation },
    { path: '/navigation', name: 'navigation', component: Navigation },
    { path: '/contour', name: 'contour', component: Contour },
    { path: '/voronoi', name: 'voronoi', component: Voronoi },
    { path: '/triangulation', name: 'triangulation', component: Triangulation },
    { path: '/voronoiDocs', name: 'voronoiDocs', component: VoronoiDocs },
    { path: '/voronoiRoad', name: 'voronoiRoad', component: VoronoiRoad },
  ]
});

export default router;