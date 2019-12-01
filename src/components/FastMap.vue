<template>
  <div class="fastmap-container">
    <!-- <div class="title">
      <h3>Advanced Hexagon</h3>
    </div> -->
    <div id="fastmap"></div>
  </div>
</template>

<script>
import * as _ from "lodash";
import * as d3 from "d3";
import * as ol from "ol";
import * as ollayer from "ol/layer";
import * as olsource from "ol/source";
import * as olextent from "ol/extent";
import * as olproj from "ol/proj";
import * as olgeom from "ol/geom";
import * as olstyle from "ol/style";
import * as olinteraction from "ol/interaction";
import * as olcontrol from "ol/control";
import LayerSwitcher from "ol-layerswitcher/src/ol-layerswitcher.js";
import projdata from "../../public/data/output/thucnews/projection_dense_tfidf_thucnews.json";
import similarityMatrix from "../../public/data/output/thucnews/similarity_matrix_thucnews_5round.json";
import cluserdata from "../../public/data/output/thucnews/cluster.json"
import mapdata from "../../public/data/output/thucnews/mapdata.json";
// { dataExtent, mapExtent, allPoints, pointIndexInfo, polygons, finalPoints, ecoords, ecoords2index, edge2docindex, paths, clusters }
export default {
  name: "FastMap",
  data() {
    return {
      map: null,
      color: null,
      roadwithScale: null
    };
  },
  created: function() {
    this.$root.eventHub.$on("compareVoronoi", this.compareVoronoi);
  },
  beforeDestroy: function() {
    this.$root.eventHub.$off("compareVoronoi");
  },
  mounted() {
    this.$nextTick(() => {
      let start = new Date();
      this.processData();
      this.initMap();
      this.addClickEventOnRoad();
      let end = new Date();
      console.log("耗时:", end-start);
    });
  },
  methods: {
    processData() {
      let instance = this;
      this.color = d3
        .scaleSequential()
        .domain([0, 0.5])
        .interpolator(d3.interpolateYlGn); //interpolateBrBG,interpolateYlGn
      this.roadwithScale = d3
        .scaleLinear()
        .domain([0.2, 0.5])
        .range([1, 5]);
      console.log(mapdata)
    },
    initMap() {
      this.map = new ol.Map({
        target: "fastmap",
        layers: [
          new ollayer.Group({
            title: "Base maps",
            layers: [
              new ollayer.Group({
                title: "Topography",
                type: "base",
                combine: true,
                visible: true,
                layers: [
                  new ollayer.Vector({
                    source: this.addColorLump(),
                    opacity: 0.3
                  }),
                  new ollayer.Vector({
                    source: this.addVoronoi()
                  })
                ]
              }),
              new ollayer.Vector({
                title: "Cluster",
                type: "base",
                visible: false,
                source: this.addCluster(),
                opacity: 0.3
              })
            ]
          }),
          new ollayer.Group({
            title: "Overlays",
            layers: [
              new ollayer.Vector({
                title: "Road",
                source: this.addRoad()
              }),
              new ollayer.Vector({
                title: "DocPoint",
                source: this.addDocPoint()
              })
            ]
          })
        ],
        controls: olcontrol.defaults().extend([
          new olcontrol.OverviewMap({
            layers: [
              new ollayer.Group({
                layers: [
                  new ollayer.Vector({
                    source: this.addColorLump()
                  }),
                  new ollayer.Vector({
                    source: this.addVoronoi()
                  })
                ]
              })
            ]
          }),
          new LayerSwitcher({
            tipLabel: 'Légende', // Optional label for button
          })
        ]),
        view: new ol.View({
          projection: new olproj.Projection({
            extent: mapdata.mapExtent
          }),
          extent: mapdata.mapExtent,
          center: olextent.getCenter(mapdata.mapExtent),
          zoom: 1
        })
      });
    },
    addDocPoint() {
      let vectorSource = new olsource.Vector();
      for (let i = 0, len = projdata.length; i < len; i++) {
        let center = d3.polygonCentroid(mapdata.polygons[i]);
        let feature = new ol.Feature({
          geometry: new olgeom.Point(center)
        });
        feature.setStyle(
          new olstyle.Style({
            image: new olstyle.Circle({
              radius: 1,
              fill: new olstyle.Fill({ color: "black" })
            })
          })
        );
        vectorSource.addFeature(feature);
      }
      return vectorSource;
    },
    addVoronoi() {
      let vectorSource = new olsource.Vector();
      mapdata.polygons.forEach((pg, index) => {
        let feature = new ol.Feature({
          geometry: new olgeom.Polygon([pg])
        });
        if (index >= projdata.length) {
          feature.setStyle(
            new olstyle.Style({
              fill: new olstyle.Fill({
                color: "rgb(0, 191, 255, 0.3)"
              }),
              stroke: new olstyle.Stroke({
                color: "rgb(0, 0, 0, 0.05)"
              })
            })
          );
        } else {
          feature.setStyle(
            new olstyle.Style({
              fill: new olstyle.Fill({
                color: "rgb(255, 255, 255, 0)"
              }),
              stroke: new olstyle.Stroke({
                color: "rgb(0, 0, 0, 0.05)"
              })
            })
          );
        }
        feature.setId("voronoi-" + index);
        vectorSource.addFeature(feature);
      });
      return vectorSource;
    },
    addCluster() {
      let clsuterNum = Object.keys(cluserdata).length;
      let color = d3
        .scaleSequential()
        .domain([0, clsuterNum])
        .interpolator(d3.interpolateYlGn);
      let vectorSource = new olsource.Vector();
      mapdata.polygons.forEach((pg, index) => {
        let feature = new ol.Feature({
          geometry: new olgeom.Polygon([pg])
        });
        if (index >= projdata.length) {
          feature.setStyle(
            new olstyle.Style({
              fill: new olstyle.Fill({
                color: "rgb(0, 191, 255)"
              }),
              stroke: new olstyle.Stroke({
                color: "grey"
              })
            })
          );
        } else {
          feature.setStyle(
            new olstyle.Style({
              fill: new olstyle.Fill({
                color: color(mapdata.clusters[index])
              }),
              stroke: new olstyle.Stroke({
                color: "grey"
              })
            })
          );
        }
        feature.setId("clsuter-voronoi-" + index);
        vectorSource.addFeature(feature);
      });
      return vectorSource;
    },
    addColorLump() {
      let vectorSource = new olsource.Vector();
      for (let edge in mapdata.edge2docindex) {
        let docindex = mapdata.edge2docindex[edge];
        docindex = docindex.map(d => +d);
        let pg = null;
        let weight = 0;
        let [p1, p2] = edge.split("-");
        p1 = parseInt(p1);
        p2 = parseInt(p2);
        if (docindex.length == 2) {
          if (docindex[0] < projdata.length && docindex[1] < projdata.length) {
            pg = [
              mapdata.ecoords[p1],
              mapdata.finalPoints[docindex[0]],
              mapdata.ecoords[p2],
              mapdata.finalPoints[docindex[1]],
              mapdata.ecoords[p1]
            ];
            weight = similarityMatrix[docindex[0]][docindex[1]];
          } else {
            // 有一个多边形表示海洋或湖泊
            if (
              docindex[0] < projdata.length &&
              docindex[1] >= projdata.length
            ) {
              pg = [
                mapdata.ecoords[p1],
                mapdata.finalPoints[docindex[0]],
                mapdata.ecoords[p2],
                mapdata.ecoords[p1]
              ];
              weight = 0;
            } else if (
              docindex[1] < projdata.length &&
              docindex[0] >= projdata.length
            ) {
              pg = [
                mapdata.ecoords[p1],
                mapdata.finalPoints[docindex[1]],
                mapdata.ecoords[p2],
                mapdata.ecoords[p1]
              ];
              weight = 0;
            }
          }
        } else if (docindex.length == 1) {
          if (docindex[0] < projdata.length) {
            pg = [
              mapdata.ecoords[p1],
              mapdata.finalPoints[docindex[0]],
              mapdata.ecoords[p2],
              mapdata.ecoords[p1]
            ];
            weight = 0;
          }
        }
        if (pg == null) {
          continue;
        }
        let feature = new ol.Feature({
          geometry: new olgeom.Polygon([pg])
        });
        feature.setStyle(
          new olstyle.Style({
            fill: new olstyle.Fill({
              color: this.color(weight)
            })
          })
        );
        vectorSource.addFeature(feature);
      }
      return vectorSource;
    },
    addRoad() {
      let vectorSource = new olsource.Vector();
      for(let pair in mapdata.paths) {
        let path = mapdata.paths[pair];
        let pairArr = pair.split("-");
        let feature = new ol.Feature({
          geometry: new olgeom.LineString(path)
        });
        feature.setStyle(
          new olstyle.Style({
            stroke: new olstyle.Stroke({
              color: "rgb(255, 165, 0, 0.3)",
              width: this.roadwithScale(similarityMatrix[+pairArr[0]][+pairArr[1]])
            })
          })
        );
        vectorSource.addFeature(feature);
      }
      return vectorSource;
    },
    addClickEventOnRoad() {
      let selectSingleClick = new olinteraction.Select();
      let instance = this;
      selectSingleClick.on("select", function(e) {
        e.selected.forEach(feature => {
          // instance.$root.eventHub.$emit("compareVoronoi", feature.getId());
        });
      });
      this.map.addInteraction(selectSingleClick);
    },
    compareVoronoi(featureId) {
      let source = this.layers.voronoiLayer.getSource();
      let feature = source.getFeatureById(featureId);
      feature.setStyle(
        new olstyle.Style({
          stroke: new olstyle.Stroke({
            color: "steelblue",
            width: 2
          })
        })
      );
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang='scss' scoped>
.fastmap-container {
  width: 100%;
  height: 100%;

  // .title {
  //   height: 60px;

  //   h3 {
  //     display: inline;
  //     line-height: 60px;
  //   }
  // }

  #fastmap {
    width: 100%;
    position: absolute;
    top: 0px;
    bottom: 0px;

    /deep/ .layer-switcher {
      ul {
        padding-left: 1em;
      }
    }
  }
}
</style>
