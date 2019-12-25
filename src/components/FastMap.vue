<template>
  <div class="fastmap-container">
    <div id="fastmap"></div>
  </div>
</template>

<script>
import * as _ from "lodash";
import * as d3 from "d3";
import { Map as ol_Map, View as ol_View, Feature as ol_Feature } from "ol";
import { Group as ollayer_Group, Vector as ollayer_Vector } from "ol/layer";
import { Vector as olsource_Vector } from "ol/source";
import { getCenter as olextent_getCenter } from "ol/extent";
import { Projection as olproj_Projection } from "ol/proj";
import {
  Point as olgeom_Point,
  Polygon as olgeom_Polygon,
  LineString as olgeom_LineString
} from "ol/geom";
import {
  Circle as olstyle_Circle,
  Text as olstyle_Text,
  Style as olstyle_Style,
  Fill as olstyle_Fill,
  Stroke as olstyle_Stroke
} from "ol/style";
import { Select as olinteraction_Select } from "ol/interaction";
import {
  defaults as olcontrol_defaults,
  OverviewMap as olcontrol_OverviewMap
} from "ol/control";
import LayerSwitcher from "ol-layerswitcher/src/ol-layerswitcher.js";
import projdata from "../../public/data/output/thucnews/projection_dense_tfidf_thucnews.json";
import similarityMatrix from "../../public/data/output/thucnews/similarity_matrix_thucnews_5round.json";
import cluserdata from "../../public/data/output/thucnews/cluster.json";
import mapdata from "../../public/data/output/thucnews/mapdata.json";
import keywords from "../../public/data/output/thucnews/doc2keyword.json";
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
      this.map = new ol_Map({
        target: "fastmap",
        layers: [
          new ollayer_Group({
            title: "Base maps",
            layers: [
              new ollayer_Group({
                title: "Topography",
                type: "base",
                combine: true,
                visible: true,
                layers: [
                  new ollayer_Vector({
                    source: this.addColorLump(),
                    opacity: 0.3
                  }),
                  new ollayer_Vector({
                    source: this.addVoronoi()
                  })
                ]
              }),
              new ollayer_Vector({
                title: "Cluster",
                type: "base",
                visible: true,
                source: this.addCluster(),
                opacity: 0.3
              })
            ]
          }),
          new ollayer_Group({
            title: "Overlays",
            layers: [
              // new ollayer_Vector({
              //   title: "Road",
              //   source: this.addRoad()
              // }),
              new ollayer_Vector({
                title: "DocPoint",
                source: this.addDocPoint()
              })
              // new ollayer_Vector({
              //   title: "Words",
              //   source: this.addWords()
              // })
              // new ollayer_Vector({
              //   title: "Force",
              //   source: this.addForce()
              // })
            ]
          })
        ],
        controls: olcontrol_defaults().extend([
          new olcontrol_OverviewMap({
            layers: [
              new ollayer_Group({
                layers: [
                  new ollayer_Vector({
                    source: this.addColorLump()
                  }),
                  new ollayer_Vector({
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
        view: new ol_View({
          projection: new olproj_Projection({
            extent: mapdata.mapExtent
          }),
          extent: mapdata.mapExtent,
          center: olextent_getCenter(mapdata.mapExtent),
          zoom: 1
        })
      });
    },
    addDocPoint() {
      let vectorSource = new olsource_Vector();
      for (let i = 0, len = projdata.length; i < len; i++) {
        let feature = new ol_Feature({
          geometry: new olgeom_Point(mapdata.finalPoints[i])
        });
        feature.setStyle(
          new olstyle_Style({
            image: new olstyle_Circle({
              radius: 1,
              fill: new olstyle_Fill({ color: "black" })
            })
          })
        );
        vectorSource.addFeature(feature);
      }
      return vectorSource;
    },
    addVoronoi() {
      let vectorSource = new olsource_Vector();
      mapdata.polygons.forEach((pg, index) => {
        let feature = new ol_Feature({
          geometry: new olgeom_Polygon([pg])
        });
        if (index >= projdata.length) {
          feature.setStyle(
            new olstyle_Style({
              fill: new olstyle_Fill({
                color: "rgb(0, 191, 255, 0.3)"
              }),
              stroke: new olstyle_Stroke({
                color: "rgb(0, 0, 0, 0.05)"
              })
            })
          );
        } else {
          feature.setStyle(
            new olstyle_Style({
              fill: new olstyle_Fill({
                color: "rgb(255, 255, 255, 0)"
              }),
              stroke: new olstyle_Stroke({
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
      let vectorSource = new olsource_Vector();
      mapdata.polygons.forEach((pg, index) => {
        let feature = new ol_Feature({
          geometry: new olgeom_Polygon([pg])
        });
        if (index >= projdata.length) {
          feature.setStyle(
            new olstyle_Style({
              fill: new olstyle_Fill({
                color: "rgb(0, 191, 255)"
              }),
              stroke: new olstyle_Stroke({
                color: "grey"
              })
            })
          );
        } else {
          feature.setStyle(
            new olstyle_Style({
              fill: new olstyle_Fill({
                color: color(mapdata.clusters[index])
              }),
              stroke: new olstyle_Stroke({
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
      let vectorSource = new olsource_Vector();
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
        let feature = new ol_Feature({
          geometry: new olgeom_Polygon([pg])
        });
        feature.setStyle(
          new olstyle_Style({
            fill: new olstyle_Fill({
              color: this.color(weight)
            })
          })
        );
        vectorSource.addFeature(feature);
      }
      return vectorSource;
    },
    addRoad() {
      let vectorSource = new olsource_Vector();
      for (let pair in mapdata.paths) {
        let path = mapdata.paths[pair];
        let pairArr = pair.split("-");
        let feature = new ol_Feature({
          geometry: new olgeom_LineString(path)
        });
        feature.setStyle(
          new olstyle_Style({
            stroke: new olstyle_Stroke({
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
        for (let i = 0; i < 2; i++) {
          keywordSet.add(keywords[key][i]);
        }
      });
      let keywordArr = Array.from(keywordSet);
      let keyword2index = {};
      keywordArr.forEach((d, i) => {
        keyword2index[d] = domain[1] + i;
      });
      let tagArr = keywordArr.map((d, i) => {
        let obj = {};
        obj["id"] = domain[1] + i;
        obj["category"] = "tag";
        obj["word"] = d;
        return obj;
      });
      nodes = nodes.concat(tagArr);
      Object.keys(keywords).forEach(key => {
        // keywords[key].forEach(value => {
        //   links.push({ source: +key, target: keyword2index[value] });
        // })
        for (let i = 0; i < 2; i++) {
          links.push({ source: +key, target: keyword2index[keywords[key][i]] });
        }
      });
      let nodesCopy = _.cloneDeep(nodes);
      // let nodesCopy = JSON.parse(JSON.stringify(nodes));

      let graph = { nodes: nodes, links: links };
      console.log(graph);
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
        console.log("tick");
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
        let vectorSource = new olsource_Vector();
        node.each(function(d, i) {
          if (d.category === "tag") {
            let feature = new ol_Feature({
              geometry: new olgeom_Point([d.x, d.y])
            });
            feature.setStyle(
              new olstyle_Style({
                text: new olstyle_Text({
                  font: "10px Microsoft YaHei",
                  text: d.word,
                  fill: new olstyle_Fill({
                    color: "#222"
                  })
                })
              })
            );
            vectorSource.addFeature(feature);
          }
        });
        link.each(function(d) {
          let feature = new ol_Feature({
            geometry: new olgeom_LineString([
              [d.source.x, d.source.y],
              [d.target.x, d.target.y]
            ])
          });
          feature.setStyle(
            new olstyle_Style({
              stroke: new olstyle_Stroke({
                color: "rgb(255, 0, 0, 0.1)"
              })
            })
          );
          vectorSource.addFeature(feature);
        });
        let layer = new ollayer_Vector({
          title: "Force",
          source: vectorSource
        });
        instance.map.addLayer(layer);
      });
    },
    addForce2() {
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
        for (let i = 0; i < 2; i++) {
          keywordSet.add(keywords[key][i]);
        }
      });
      let keywordArr = Array.from(keywordSet);
      let keyword2index = {};
      keywordArr.forEach((d, i) => {
        keyword2index[d] = domain[1] + i;
      });
      let tagArr = keywordArr.map((d, i) => {
        let obj = {};
        obj["id"] = domain[1] + i;
        obj["category"] = "tag";
        obj["word"] = d;
        return obj;
      });
      nodes = nodes.concat(tagArr);
      Object.keys(keywords).forEach(key => {
        for (let i = 0; i < 2; i++) {
          links.push({ source: +key, target: keyword2index[keywords[key][i]] });
        }
      });
      let nodesCopy = _.cloneDeep(nodes);

      let graph = { nodes: nodes, links: links };
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
        console.log("tick");
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

      function collide(node) {
        return function(quad, x1, y1, x2, y2) {
          var updated = false;
          if (quad.data && quad.data !== node) {
            var x = node.x - quad.data.x,
              y = node.y - quad.data.y,
              xSpacing = (quad.data.width + node.width) / 2,
              ySpacing = (quad.data.height + node.height) / 2,
              absX = Math.abs(x),
              absY = Math.abs(y),
              l,
              lx,
              ly;

            if (absX < xSpacing && absY < ySpacing) {
              l = Math.sqrt(x * x + y * y);

              lx = (absX - xSpacing) / l;
              ly = (absY - ySpacing) / l;

              // the one that's barely within the bounds probably triggered the collision
              if (Math.abs(lx) > Math.abs(ly)) {
                lx = 0;
              } else {
                ly = 0;
              }

              node.x -= x *= lx;
              node.y -= y *= ly;
              quad.data.x += x;
              quad.data.y += y;

              updated = true;
            }
          }
          return updated;
        };
      }

      force.on("end", function() {
        console.log("end...");
        const fontname = "Microsoft YaHei";
        const fontsize = "10px";
        let tagNodes = nodes.filter(d => d.category === "tag");
        for(let i=0; i<tagNodes.length; i++) {
          let pixelWidth = instance.getWidthOfText(
            tagNodes[i].word,
            fontname,
            fontsize
          );
          let extent = instance.map.getView().calculateExtent([pixelWidth, ~~fontsize.split('px')[0]]);
          tagNodes[i].width = extent[2] - extent[0];
          tagNodes[i].height = extent[3] - extent[1];
        }
        console.log(tagNodes)
        let tagnode = d3
          .selectAll(".tagnode")
          .data(tagNodes)
          .enter()
          .append("circle")
          .attr("class", "tagnode");
        let force2 = d3
          .forceSimulation(nodes)
          .force("charge", d3.forceManyBody().strength(0))
          .on("tick", function() {
            console.log("tick2");
            let q = d3
                .quadtree()
                .x(d => d.x)
                .y(d => d.y)
                .addAll(tagNodes),
              i = 0,
              n = tagNodes.length;
            while (++i < n) {
              q.visit(collide(tagNodes[i]));
            }

            tagnode
              .attr("x", function(d) {
                return d.x;
              })
              .attr("y", function(d) {
                return d.y;
              });
          });
        force2.on("end", function() {
          let vectorSource = new olsource_Vector();
          tagnode.each(function(d, i) {
            if (d.category === "tag") {
              let feature = new ol_Feature({
                geometry: new olgeom_Point([d.x, d.y])
              });
              feature.setStyle(
                new olstyle_Style({
                  text: new olstyle_Text({
                    font: fontsize + " " + fontname,
                    text: d.word,
                    fill: new olstyle_Fill({
                      color: "#222"
                    })
                  })
                })
              );
              vectorSource.addFeature(feature);
            }
          });
          let layer = new ollayer_Vector({
            title: "Force",
            source: vectorSource
          });
          instance.map.addLayer(layer);
        });
      });
    },
    getWidthOfText(txt, fontname, fontsize) {
      let canvas = document.createElement("canvas");
      let ctx = canvas.getContext("2d");
      ctx.font = fontsize + " " + fontname;
      return ctx.measureText(txt).width;
    },
    addWords() {
      let vectorSource = new olsource_Vector();
      let a = 5,
        b = 1;
      for (let i = 0; i < 100; i++) {
        // let x = _.random(this.mapExtent[0], this.mapExtent[2]);
        // let y = _.random(this.mapExtent[1], this.mapExtent[3]);
        let j = i / 10;
        let x = (a + b * j) * Math.cos(j);
        let y = (a + b * j) * Math.sin(j);
        let feature = new ol_Feature({
          geometry: new olgeom_Point([x, y]) //在中心位置实例化一个要素，设置要素的样式
        });

        feature.setStyle(
          new olstyle_Style({
            text: new olstyle_Text({
              font: "15px Microsoft YaHei",
              text: "hello",
              fill: new olstyle_Fill({
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
      let selectSingleClick = new olinteraction_Select();
      let instance = this;
      selectSingleClick.on("select", function(e) {
        e.selected.forEach(feature => {
          let index = feature.getId().split("-")[1];
          let text = projdata[+index];
          let kw = keywords[+index];
          console.log(text);
          console.log(kw);
          // instance.$root.eventHub.$emit("compareVoronoi", feature.getId());
        });
      });
      this.map.addInteraction(selectSingleClick);
    },
    compareVoronoi(featureId) {
      let source = this.layers.voronoiLayer.getSource();
      let feature = source.getFeatureById(featureId);
      feature.setStyle(
        new olstyle_Style({
          stroke: new olstyle_Stroke({
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
