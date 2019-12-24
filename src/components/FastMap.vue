<template>
  <div class="fastmap-container">
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
import cluserdata from "../../public/data/output/thucnews/cluster.json";
import mapdata from "../../public/data/output/thucnews/mapdata.json";
import keywords from "../../public/data/output/thucnews/doc2keyword.json";
import { link } from "fs";
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
      this.addForce();
      this.addClickEventOnRoad();
      let end = new Date();
      console.log("耗时:", end - start);
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
      console.log(mapdata);
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
                visible: true,
                source: this.addCluster(),
                opacity: 0.3
              })
            ]
          }),
          new ollayer.Group({
            title: "Overlays",
            layers: [
              // new ollayer.Vector({
              //   title: "Road",
              //   source: this.addRoad()
              // }),
              new ollayer.Vector({
                title: "DocPoint",
                source: this.addDocPoint()
              })
              // new ollayer.Vector({
              //   title: "Words",
              //   source: this.addWords()
              // })
              // new ollayer.Vector({
              //   title: "Force",
              //   source: this.addForce()
              // })
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
            tipLabel: "Légende" // Optional label for button
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
        // let center = d3.polygonCentroid(mapdata.polygons[i]);
        let feature = new ol.Feature({
          geometry: new olgeom.Point(mapdata.finalPoints[i])
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
        feature.setId("clusterVoronoi-" + index);
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
      for (let pair in mapdata.paths) {
        let path = mapdata.paths[pair];
        let pairArr = pair.split("-");
        let feature = new ol.Feature({
          geometry: new olgeom.LineString(path)
        });
        feature.setStyle(
          new olstyle.Style({
            stroke: new olstyle.Stroke({
              color: "rgb(255, 165, 0, 0.3)",
              width: this.roadwithScale(
                similarityMatrix[+pairArr[0]][+pairArr[1]]
              )
            })
          })
        );
        vectorSource.addFeature(feature);
      }
      return vectorSource;
    },
    addForce() {
      let instance = this;
      let domain = mapdata.pointIndexInfo.dataPoint;
      let nodes = [];
      let links = [];
      for (let i = domain[0]; i < domain[1]; i++) {
        nodes.push({
          id: i,
          category: "point",
          x: mapdata.finalPoints[i][0],
          y: mapdata.finalPoints[i][1]
        });
      }
      let keywordSet = new Set();
      Object.keys(keywords).forEach(key => {
        // keywords[key].forEach(value => {
        //   keywordSet.add(value);
        // })
        for(let i=0; i<3; i++) {
          keywordSet.add(keywords[key][i]);
        }
      });
      let keywordArr = Array.from(keywordSet);
      let keyword2index = {};
      keywordArr.forEach((d,i) => {
        keyword2index[d]=domain[1]+i;
      });
      let tagArr = keywordArr.map((d, i) => {
        let obj = {};
        obj["id"] = domain[1] + i;
        obj["category"] = "tag";
        obj["word"] = d;
        return obj;
      })
      nodes = nodes.concat(tagArr);
      Object.keys(keywords).forEach(key => {
        // keywords[key].forEach(value => {
        //   links.push({ source: +key, target: keyword2index[value] });
        // })
        for(let i=0; i<3; i++) {
          links.push({ source: +key, target: keyword2index[keywords[key][i]] });
        }
      });
      let nodesCopy = _.cloneDeep(nodes);
      // let nodesCopy = JSON.parse(JSON.stringify(nodes));

      let graph = { nodes: nodes, links: links };
      console.log(graph)
      let force = d3
        .forceSimulation()
        .force("charge", d3.forceManyBody().distanceMax(0.5))
        // .force("center",d3.forceCenter(width/2,height/2))
        .on("tick", tick);

      force
        .nodes(graph.nodes)
        .force("link", d3.forceLink(graph.links).distance(1));

      let link = d3
        .selectAll(".link")
        .data(graph.links)
        .enter()
        .append("line")
        .attr("class", "link");
      let node = d3
        .selectAll(".node")
        .data(graph.nodes)
        .enter()
        .append("circle")
        .attr("class", "node");

      function tick() {
        console.log("tick")
        node
          .attr("cx", function(d) {
            if (d.category === "point") {
              d.fx = nodesCopy[d.id].x;
            }
            return d.x;
          })
          .attr("cy", function(d) {
            if (d.category === "point") {
              d.fy = nodesCopy[d.id].y;
            }
            return d.y;
          });
        link
          .attr("x1", function(d) {
            return d.source.x;
          })
          .attr("y1", function(d) {
            return d.source.y;
          })
          .attr("x2", function(d) {
            return d.target.x;
          })
          .attr("y2", function(d) {
            return d.target.y;
          });
      }

      force.on("end", function() {
        console.log("end...");
        console.log(graph);
        let vectorSource = new olsource.Vector();
        node.each(function(d, i) {
          if (d.category === "tag") {
            let feature = new ol.Feature({
              geometry: new olgeom.Point([d.x, d.y])
            });
            feature.setStyle(
              new olstyle.Style({
                text: new olstyle.Text({
                  font: "10px Microsoft YaHei",
                  text: d.word,
                  fill: new olstyle.Fill({
                    color: "#222"
                  })
                })
              })
            );
            vectorSource.addFeature(feature);
          }
        });
        link.each(function(d) {
          let feature = new ol.Feature({
            geometry: new olgeom.LineString([
              [d.source.x, d.source.y],
              [d.target.x, d.target.y]
            ])
          });
          feature.setStyle(new olstyle.Style({
            stroke: new olstyle.Stroke({
              color: "rgb(255, 0, 0, 0.1)"
            })
          }))
          vectorSource.addFeature(feature);
        });
        let layer = new ollayer.Vector({
          title: "Force",
          source: vectorSource
        });
        instance.map.addLayer(layer);
      });
    },
    addWords() {
      let vectorSource = new olsource.Vector();
      let a = 5,
        b = 1;
      for (let i = 0; i < 100; i++) {
        // let x = _.random(this.mapExtent[0], this.mapExtent[2]);
        // let y = _.random(this.mapExtent[1], this.mapExtent[3]);
        let j = i / 10;
        let x = (a + b * j) * Math.cos(j);
        let y = (a + b * j) * Math.sin(j);
        let feature = new ol.Feature({
          geometry: new olgeom.Point([x, y]) //在中心位置实例化一个要素，设置要素的样式
        });

        feature.setStyle(
          new olstyle.Style({
            text: new olstyle.Text({
              font: "15px Microsoft YaHei",
              text: "hello",
              fill: new olstyle.Fill({
                color: "#222"
              })
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
          let index = feature.getId().split('-')[1];
          let text = projdata[+index];
          let kw = keywords[+index];
          console.log(text);
          console.log(kw)
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
