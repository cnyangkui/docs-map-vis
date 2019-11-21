<template>
  <div class="voronoi-road">
    <div class="title"><h3>Voronoi with Road</h3></div>
    <div id="voronoi-road-map"></div>
  </div>
</template>

<script>
import * as _ from 'lodash'
import * as d3 from 'd3';
import * as ol from 'ol'
import * as ollayer from 'ol/layer'
import * as olsource from 'ol/source'
import * as olextent from 'ol/extent';
import * as olproj from 'ol/proj'
import * as olgeom from 'ol/geom'
import * as olstyle from 'ol/style'
import projdata from '../assets/data/thucnews/projection_dense_tfidf_thucnews.json'
import similarityMatrix from '../assets/data/thucnews/similarity_matrix_thucnews_5round.json'
import longdisHighsimilarity from '../assets/js/dist2similarity.js'
export default {
  name: 'voronoiRoad',
  data() {
    return {
      map: null,
      layers: {
        docpointLayer: null,
        voronoiLayer: null,
        colorLumpLayer: null,
        roadLayer: null,
      },
      mapConfig: {
        extent: [],//[left, bottom, right, top]
        zoom: 1,
        minZoom: 1,
        maxZoom: 18,
      },
      color: null,
      roadwithScale: null,
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.loadSettings();
      this.initMap();
      this.addVoronoiLayer();
      this.addColorLump();
      this.addRoadLayer();
      this.addDocPoint();
    })
  },
  methods: {
    loadSettings() {
      let xExt = d3.extent(projdata, d => d.x);
      let yExt = d3.extent(projdata, d => d.y);
      this.mapConfig.extent = [xExt[0], yExt[1], xExt[1], yExt[0]];
      // this.color = d3.scaleLinear().domain([0, 0.2]).range(['yellow', 'green']);
      this.color= d3.scaleSequential().domain([0, 0.5]).interpolator(d3.interpolateYlGn);//interpolateBrBG,interpolateYlGn
      this.roadwithScale = d3.scaleLinear().domain([0.2, 0.5]).range([1, 5]);
    },
    initMap() {
      this.map = new ol.Map({
        target: 'voronoi-road-map',
        view: new ol.View({
          projection: new olproj.Projection({
            extent: this.mapConfig.extent
          }),
          center: olextent.getCenter(this.mapConfig.extent),
          zoom: 2
        }),
        // layers: [
        //   new ollayer.Tile({
        //     source: new olsource.OSM()
        //   })
        // ]
      });
    },
    addDocPoint() {
      let vectorSource = new olsource.Vector();
      this.layers.docpointLayer = new ollayer.Vector({
        source: vectorSource,
      });
      let xExt = d3.extent(projdata, d => d.x);
      let yExt = d3.extent(projdata, d => d.y);
      
      projdata.forEach(doc => {
        let feature = new ol.Feature({
          geometry: new olgeom.Point([parseFloat(doc.x), parseFloat(doc.y)])
        });
        feature.setStyle(new olstyle.Style({
          image: new olstyle.Circle({
            radius: 1,
            fill: new olstyle.Fill({ color: 'black' })
          })
        }))
        vectorSource.addFeature(feature);
      })
      this.map.addLayer(this.layers.docpointLayer);
    },
    addVoronoiLayer() {
      let data = projdata.map(d => [d.x, d.y]);
      let cells = d3.voronoi()
        .extent([[this.mapConfig.extent[0], this.mapConfig.extent[3]], [this.mapConfig.extent[2], this.mapConfig.extent[1]]])
        .polygons(data);
      let vectorSource = new olsource.Vector();
      this.layers.voronoiLayer = new ollayer.Vector({
        source: vectorSource,
      });
      
      cells.forEach(c => {
        let start = c[0];
        let polygon = c;
        polygon.push(start);
        let feature = new ol.Feature({
          geometry: new olgeom.Polygon([polygon])
        });
        feature.setStyle(new olstyle.Style({
          // fill: new olstyle.Fill({
          //   color: 'rgb(255, 255, 0, 0.05)'
          // }),
          stroke: new olstyle.Stroke({
            color: 'grey'
          })
        }))
        vectorSource.addFeature(feature);
      })
      this.map.addLayer(this.layers.voronoiLayer);
    },
    addColorLump() {
      let data = projdata.map(d => [d.x, d.y]);
      let cells = d3.voronoi()
        .extent([[this.mapConfig.extent[0], this.mapConfig.extent[3]], [this.mapConfig.extent[2], this.mapConfig.extent[1]]])
        .polygons(data);
      let vectorSource = new olsource.Vector();
      this.layers.colorLumpLayer = new ollayer.Vector({
        source: vectorSource,
      });
      for(let i=0,len1=similarityMatrix.length; i<len1; i++) {
        for(let j=i+1,len2=similarityMatrix[i].length; j<len2; j++) {
          let commonEdge = _.intersectionBy(cells[i], cells[j], JSON.stringify)
          if(commonEdge.length != 0) {
            let colorLump1 = [cells[i].data, commonEdge[0], commonEdge[1], cells[i].data];
            let colorLump2 = [cells[j].data, commonEdge[0], commonEdge[1], cells[j].data];
            let feature1 = new ol.Feature({
              geometry: new olgeom.Polygon([colorLump1])
            });
            feature1.setStyle(new olstyle.Style({
              fill: new olstyle.Fill({
                color: this.color(similarityMatrix[i][j])
              })
            }))
            let feature2 = new ol.Feature({
              geometry: new olgeom.Polygon([colorLump2])
            });
            feature2.setStyle(new olstyle.Style({
              fill: new olstyle.Fill({
                color: this.color(similarityMatrix[i][j])
              })
            }))
            vectorSource.addFeature(feature1);
            vectorSource.addFeature(feature2);
          }
        }
        // 给边界空白多边形绘制颜色
        let boundaryPoints = this.detectBoundaries(cells[i]);
        if(boundaryPoints.length > 0) {
          let boundaryCoords = cells[i].filter(d => {
            let tmp = _.intersection(d, boundaryPoints)
            return tmp.length > 0 ? true : false;
          })
          if(boundaryCoords.length == 2) { // 边
            boundaryCoords.splice(0, 0, cells[i].data);
            boundaryCoords.push(cells[i].data);
          } else if(boundaryCoords.length == 3) { // 角
            let vertex = boundaryCoords.filter(d => _.intersection(d, this.mapConfig.extent).length == 2)[0];
            let others = boundaryCoords.filter(d => _.intersection(d, this.mapConfig.extent).length == 1);
            boundaryCoords = [cells[i].data, others[0], vertex, others[1], cells[i].data];
          }
          let feature = new ol.Feature({
            geometry: new olgeom.Polygon([boundaryCoords])
          });
          feature.setStyle(new olstyle.Style({
            fill: new olstyle.Fill({
              color: this.color(0)
            })
          }))
          vectorSource.addFeature(feature);
        }
      }
      this.layers.colorLumpLayer.setOpacity(0.3);
      this.map.addLayer(this.layers.colorLumpLayer);
    },
    addRoadLayer() {
      let vectorSource = new olsource.Vector();
      this.layers.roadLayer = new ollayer.Vector({
        source: vectorSource,
      }); 
      longdisHighsimilarity().forEach(d => {
        let pair = d.pair.split('-');
        let p1 = [projdata[parseInt(pair[0])].x, projdata[parseInt(pair[0])].y];
        let p2 = [projdata[parseInt(pair[1])].x, projdata[parseInt(pair[1])].y];
        let feature = new ol.Feature({
          geometry: new olgeom.LineString([p1, p2])
        });
        feature.setStyle(new olstyle.Style({
          // fill: new olstyle.Fill({
          //   color: 'rgb(255, 255, 0, 0.05)'
          // }),
          stroke: new olstyle.Stroke({
            color: 'orange',
            width: this.roadwithScale(similarityMatrix[pair[0]][pair[1]])
          })
        }))
        vectorSource.addFeature(feature);
      })
      this.map.addLayer(this.layers.roadLayer);
    },
    detectBoundaries(polygon) {
      return _.intersection(polygon.flat(), this.mapConfig.extent);
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang='scss' scoped>
.voronoi-road {
  width: 100%;
  height: 100%;

  .title {
    height: 60px;

    h3 {
      display: inline;
      line-height: 60px;
    }
  }

  #voronoi-road-map {
    width: 100%;
    position: absolute;
    top: 60px;
    bottom: 0px;
  }
}
</style>
