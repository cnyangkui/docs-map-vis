<template>
  <div class="advanced-hexagon">
    <div class="title">
      <h3>Advanced Hexagon</h3>
    </div>
    <div id="advanced-hexagon-map"></div>
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
import projdata from "../assets/data/thucnews/projection_dense_tfidf_thucnews.json";
import similarityMatrix from "../assets/data/thucnews/similarity_matrix_thucnews_5round.json";
import longdisHighsimilarity from "../assets/js/dist2similarity.js";
import Graph from "../assets/js/dijkstra.js";
export default {
  name: "AdvancedIterativeVoronoi",
  data() {
    return {
      map: null,
      layers: {
        docpointLayer: null,
        voronoiLayer: null,
        colorLumpLayer: null,
        roadLayer: null
      },
      dataExtent: [],
      extent: [], //[left, bottom, right, top],
      alldata: {
        points: [],
        polygons: [], // Voronoi多边形
        coords2index: new Map(), // 多边形边上点的坐标到索引的映射
        index2coords: new Map(), // 多边形边上点的索引到坐标的映射
        edge2docindex: new Map(), // 与每条边共边的多边形索引
        graphdata: new Map(), // 根据多边形构造的图数据
        graph: new Graph() // 根据多边形的边构造图
      },
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
      this.loadSettings();
      this.processData();
      this.initMap();
      this.addColorLump();
      this.addVoronoiLayer();
      this.addRoadLayer();
      this.addDocPoint();
      this.addClickEventOnRoad();
    });
  },
  methods: {
    loadSettings() {
      let xExt = d3.extent(projdata, d => d.x);
      let yExt = d3.extent(projdata, d => d.y);
      let x = xExt[1] - xExt[0] > yExt[1] - yExt[0] ? xExt : yExt;
      let y = xExt[1] - xExt[0] < yExt[1] - yExt[0] ? xExt : yExt;
      this.dataExtent = [x[0], y[0], x[1], y[1]];
      this.extent = [x[0] * 1.2, y[0] * 1.2, x[1] * 1.2, y[1] * 1.2];
      this.color = d3
        .scaleSequential()
        .domain([0, 0.5])
        .interpolator(d3.interpolateYlGn); //interpolateBrBG,interpolateYlGn
      this.roadwithScale = d3
        .scaleLinear()
        .domain([0.2, 0.5])
        .range([1, 5]);
    },
    processData() {
      let instance = this;
      let doclink = new Set();
      (function() {
        let docCoords = projdata.map(d => [d.x, d.y]);
        let cells = d3
          .voronoi()
          .extent([
            [instance.extent[0], instance.extent[1]],
            [instance.extent[2], instance.extent[3]]
          ])
          .polygons(docCoords);
        let docCoords2index = new Map();
        cells.forEach((d, i) => {
          docCoords2index.set(JSON.stringify(d.data), i);
        });
        let triangles = d3
          .voronoi()
          .extent([
            [instance.extent[0], instance.extent[1]],
            [instance.extent[2], instance.extent[3]]
          ])
          .triangles(docCoords);
        triangles.forEach((d, i) => {
          let [p1, p2, p3] = d;
          let i1 = docCoords2index.get(JSON.stringify(p1));
          let i2 = docCoords2index.get(JSON.stringify(p2));
          let i3 = docCoords2index.get(JSON.stringify(p3));
          doclink.add([i1, i2].sort((a, b) => a - b) + "");
          doclink.add([i2, i3].sort((a, b) => a - b) + "");
          doclink.add([i3, i1].sort((a, b) => a - b) + "");
        });
        doclink = Array.from(doclink);
      })();
      let randomNumber = 800;
      this.alldata.points = projdata.map(d => [d.x, d.y]);
      for (let i = 0; i < randomNumber; i++) {
        let tmp = Math.floor(i / (randomNumber / 4));
        if (tmp == 0) {
          let x = _.random(this.extent[0], this.dataExtent[2], true);
          let y = _.random(this.extent[1], this.dataExtent[1], true);
          this.alldata.points.push([x, y]);
        } else if (tmp == 1) {
          let x = _.random(this.dataExtent[2], this.extent[2], true);
          let y = _.random(this.extent[1], this.dataExtent[3], true);
          this.alldata.points.push([x, y]);
        } else if (tmp == 2) {
          let x = _.random(this.dataExtent[0], this.extent[2], true);
          let y = _.random(this.dataExtent[3], this.extent[3], true);
          this.alldata.points.push([x, y]);
        } else {
          let x = _.random(this.extent[0], this.dataExtent[0], true);
          let y = _.random(this.dataExtent[1], this.extent[3], true);
          this.alldata.points.push([x, y]);
        }
      }
      let cells = d3
        .voronoi()
        .extent([
          [instance.extent[0], instance.extent[1]],
          [instance.extent[2], instance.extent[3]]
        ])
        .polygons(this.alldata.points);
      // 获得Voronoi的多边形
      this.alldata.polygons = cells.map(c => {
        let pg = Object.assign([], c);
        pg.push(c[0]);
        return pg;
      });
      // Voronoi每次选取多边形中心，重新绘制，多次迭代后变成六边形地图
      let docCoords = [];
      for (let i = 0; i < 600; i++) {
        docCoords = this.alldata.polygons.map(d => d3.polygonCentroid(d));
        cells = d3
          .voronoi()
          .extent([
            [this.extent[0], this.extent[1]],
            [this.extent[2], this.extent[3]]
          ])
          .polygons(docCoords);
        // 获得Voronoi的多边形
        this.alldata.polygons = cells.map(c => {
          let pg = Object.assign([], c);
          pg.push(c[0]);
          return pg;
        });
      }

      let p_index = 0;
      // 构建多边形边上点的坐标与索引的互相映射
      this.alldata.polygons.forEach((pg, index) => {
        pg.forEach((point, i) => {
          let coords = Object.assign([], point);
          this.alldata.coords2index.set(JSON.stringify(coords), p_index);
          this.alldata.index2coords.set(p_index, coords);
          p_index++;
        });
      });
      // 对于多边形的每条边，获得与之共边的多边形的索引
      this.alldata.polygons.forEach((pg, index) => {
        for (let i = 0, len = pg.length - 1; i < len; i++) {
          let p1 = Object.assign([], pg[i]); // 多边形上的节点
          let p2 = Object.assign([], pg[i + 1]); // 多边形上的节点
          if (
            _.intersection(p1, this.extent).length > 0 ||
            _.intersection(p2, this.extent).length > 0 ||
            index > projdata.length
          ) {
            continue;
          }
          let i1 = this.alldata.coords2index.get(JSON.stringify(p1));
          let i2 = this.alldata.coords2index.get(JSON.stringify(p2));
          let edge1 = i1 + "-" + i2;
          let edge2 = i2 + "-" + i1;
          if (this.alldata.edge2docindex.has(edge1)) {
            let value = this.alldata.edge2docindex.get(edge1);
            value.push(index);
            this.alldata.edge2docindex.set(edge1, value);
          } else {
            this.alldata.edge2docindex.set(edge1, [index]);
          }
          if (this.alldata.edge2docindex.has(edge2)) {
            let value = this.alldata.edge2docindex.get(edge2);
            value.push(index);
            this.alldata.edge2docindex.set(edge2, value);
          } else {
            this.alldata.edge2docindex.set(edge2, [index]);
          }
        }
      });

      // 多边形每条边距离的归一化
      let weightScale;
      (function() {
        let weightlist = [];
        for (let [edge, docindex] of instance.alldata.edge2docindex) {
          let [p1, p2] = edge.split("-");
          let weight = 0;
          if (docindex.length == 2) {
            let c1 = instance.alldata.index2coords.get(parseInt(p1));
            let c2 = instance.alldata.index2coords.get(parseInt(p2));
            weight = Math.sqrt((c1[0] - c2[0]) ** 2 + (c1[1] - c2[1]) ** 2); // 2D 欧式距离作为边权重
            weightlist.push(weight);
          }
        }
        let max = d3.max(weightlist);
        weightScale = d3
          .scaleLinear()
          .domain([0, max])
          .range([0, 1]);
      })();
      // 计算多边形每条边上的权值，根据文档相似度赋予，从而构造图数据
      for (let [edge, docindex] of this.alldata.edge2docindex) {
        let [p1, p2] = edge.split("-");
        let weight = 0;
        if (docindex.length == 2) {
          let c1 = this.alldata.index2coords.get(parseInt(p1));
          let c2 = this.alldata.index2coords.get(parseInt(p2));
          // weight = similarityMatrix[docindex[0]][docindex[1]]; // 相似度作为边权重
          // weight = Math.sqrt((c1[0]-c2[0])**2 + (c1[1]-c2[1])**2) // 2D 欧式距离作为边权重
          weight =
            weightScale(
              Math.sqrt((c1[0] - c2[0]) ** 2 + (c1[1] - c2[1]) ** 2)
            ) *
              0.3 +
            similarityMatrix[docindex[0]][docindex[1]] * 0.7;
        } else if (docindex.length == 1) {
          weight = 1 / 0;
        }
        if (this.alldata.graphdata.has(p1)) {
          // 图数据中是否有起点为p1的数据
          let target = this.alldata.graphdata.get(p1); //起点为p1的数据的终点
          target[p2] = weight; // 加入一个新的终点
          this.alldata.graphdata.set(p1, target);
        } else {
          let target = {};
          target[p2] = weight;
          this.alldata.graphdata.set(p1, target);
        }
      }
      // 构造Graph
      for (let [key, value] of this.alldata.graphdata) {
        this.alldata.graph.addVertex(key, value);
      }

      let doclink2 = new Set();
      (function() {
        let docCoords2 = instance.alldata.polygons.map(d => d.data);
        let docCoords2index2 = new Map();
        instance.alldata.polygons.forEach((d, i) => {
          docCoords2index2.set(JSON.stringify(d.data), i);
        });
        let triangles2 = d3
          .voronoi()
          .extent([
            [instance.extent[0], instance.extent[1]],
            [instance.extent[2], instance.extent[3]]
          ])
          .triangles(docCoords2);
        triangles2.forEach((d, i) => {
          let [p1, p2, p3] = d;
          let i1 = docCoords2index2.get(JSON.stringify(p1));
          let i2 = docCoords2index2.get(JSON.stringify(p2));
          let i3 = docCoords2index2.get(JSON.stringify(p3));
          doclink2.add([i1, i2].sort((a, b) => a - b) + "");
          doclink2.add([i2, i3].sort((a, b) => a - b) + "");
          doclink2.add([i3, i1].sort((a, b) => a - b) + "");
        });
        doclink2 = Array.from(doclink2);
        let radio = _.intersection(doclink, doclink2).length / doclink.length;
        console.log("结构保持率：" + radio.toFixed(2));
      })();
    },
    initMap() {
      this.map = new ol.Map({
        target: "advanced-hexagon-map",
        view: new ol.View({
          projection: new olproj.Projection({
            extent: this.extent
          }),
          // extent: this.extent,
          center: olextent.getCenter(this.extent),
          zoom: 2
        })
      });
    },
    addDocPoint() {
      let vectorSource = new olsource.Vector();
      this.layers.docpointLayer = new ollayer.Vector({
        source: vectorSource,
        zIndex: 3
      });
      let xExt = d3.extent(projdata, d => d.x);
      let yExt = d3.extent(projdata, d => d.y);

      for (let i = 0, len = projdata.length; i < len; i++) {
        let center = d3.polygonCentroid(this.alldata.polygons[i]);
        let feature = new ol.Feature({
          geometry: new olgeom.Point(center)
          // geometry: new olgeom.Point([parseFloat(pg.x), parseFloat(pg.y)])
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
      this.map.addLayer(this.layers.docpointLayer);
    },
    addVoronoiLayer() {
      let vectorSource = new olsource.Vector();
      this.layers.voronoiLayer = new ollayer.Vector({
        source: vectorSource,
        zIndex: 2
      });

      this.alldata.polygons.forEach((pg, index) => {
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
      this.map.addLayer(this.layers.voronoiLayer);
    },
    addColorLump() {
      let vectorSource = new olsource.Vector();
      this.layers.colorLumpLayer = new ollayer.Vector({
        source: vectorSource,
        zIndex: 1
      });
      for (let [edge, docindex] of this.alldata.edge2docindex) {
        let pg = null;
        let weight = 0;
        let [p1, p2] = edge.split("-");
        p1 = parseInt(p1);
        p2 = parseInt(p2);
        // console.log(this.alldata.polygons[docindex[0]])
        if (docindex.length == 2) {
          pg = [
            this.alldata.index2coords.get(p1),
            this.alldata.polygons[docindex[0]].data,
            this.alldata.index2coords.get(p2),
            this.alldata.polygons[docindex[1]].data,
            this.alldata.index2coords.get(p1)
          ];
          weight = similarityMatrix[docindex[0]][docindex[1]];
        } else if (docindex.length == 1) {
          pg = [
            this.alldata.index2coords.get(p1),
            this.alldata.polygons[docindex[0]].data,
            this.alldata.index2coords.get(p2),
            this.alldata.index2coords.get(p1)
          ];
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
      this.layers.colorLumpLayer.setOpacity(0.3);
      this.map.addLayer(this.layers.colorLumpLayer);
    },
    addRoadLayer() {
      let vectorSource = new olsource.Vector();
      this.layers.roadLayer = new ollayer.Vector({
        source: vectorSource,
        zIndex: 4
      });
      longdisHighsimilarity().forEach(d => {
        let pair = d.pair.split("-");
        // let p1 = [projdata[parseInt(pair[0])].x, projdata[parseInt(pair[0])].y];
        // let p2 = [projdata[parseInt(pair[1])].x, projdata[parseInt(pair[1])].y];
        let pg1 = this.alldata.polygons[parseInt(pair[0])];
        let pg2 = this.alldata.polygons[parseInt(pair[1])];
        let distance = 1 / 0;
        let start = pg1[0],
          end = pg2[0];
        for (let i = 0, len1 = pg1.length; i < len1; i++) {
          if (_.intersection(pg1[i], this.extent).length > 0) continue;
          for (let j = 0, len2 = pg2.length; j < len2; j++) {
            if (_.intersection(pg2[j], this.extent).length > 0) continue;
            let p1 = pg1[i];
            let p2 = pg2[j];
            let tmp = Math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2);
            if (tmp < distance) {
              distance = tmp;
              start = p1;
              end = p2;
            }
          }
        }

        let startIndex = this.alldata.coords2index.get(JSON.stringify(start));
        let endIndex = this.alldata.coords2index.get(JSON.stringify(end));
        let pathstr = this.alldata.graph
          .shortestPath(startIndex + "", endIndex + "")
          .concat([startIndex + ""])
          .reverse();
        let pathcoords = [];
        pathcoords.push(pg1.data);
        pathstr.forEach(pid => {
          pathcoords.push(this.alldata.index2coords.get(parseInt(pid)));
        });
        pathcoords.push(pg2.data);
        let feature = new ol.Feature({
          geometry: new olgeom.LineString(pathcoords)
        });
        feature.setStyle(
          new olstyle.Style({
            stroke: new olstyle.Stroke({
              color: "rgb(255, 165, 0, 0.5)",
              width: this.roadwithScale(similarityMatrix[pair[0]][pair[1]])
            })
          })
        );
        vectorSource.addFeature(feature);
      });
      this.map.addLayer(this.layers.roadLayer);
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
.advanced-hexagon {
  width: 100%;
  height: 100%;

  .title {
    height: 60px;

    h3 {
      display: inline;
      line-height: 60px;
    }
  }

  #advanced-hexagon-map {
    width: 100%;
    position: absolute;
    top: 60px;
    bottom: 0px;
  }
}
</style>
