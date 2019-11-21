import Vue from 'vue'
import VueRouter from 'vue-router'
import Navigation from '../pages/Navigation'
import Contour from '../components/Contour.vue'
// import Voronoi from '../components/Voronoi.vue'
// import Triangulation from '../components/Triangulation.vue'
// import VoronoiRoad from '../components/VoronoiRoad.vue'
import VoronoiDocs from '../components/VoronoiDocs.vue'


Vue.use(VueRouter)

const router = new VueRouter({
  mode: 'history',
  routes: [
    { path:'/', component: Navigation },
    { path: '/navigation', name: 'navigation', component: Navigation },
    { path: '/contour', name: 'contour', component: Contour },
    // { path: '/voronoi', name: 'voronoi', component: Voronoi },
    // { path: '/triangulation', name: 'triangulation', component: Triangulation },
    // { path: '/voronoiRoad', name: 'voronoiRoad', component: VoronoiRoad },
    { path: '/voronoiDocs', name: 'voronoiDocs', component: VoronoiDocs },
  ]
});

export default router;