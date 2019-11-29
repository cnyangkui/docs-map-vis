<template>
  <div class="voronoi-docs">
    <div class="title">
      <h3>Voronoi + Documents</h3>
    </div>
    <div class="content">
      <div id="voronoi-docs-map"></div>
      <div id="docs-panel">
        <div id="docs-panel-control">
          <input type="button" value="clear" @click="clearSelected();" />
        </div>
        <div id="docs-display"></div>
      </div>
    </div>
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
import projdata from "../../public/data/output/thucnews/projection_dense_tfidf_thucnews.json";
import similarityMatrix from "../../public/data/output/thucnews/similarity_matrix_thucnews_5round.json";
import longdisHighsimilarity from "../assets/js/dist2similarity.js";
export default {
  name: "VoronoiDocs",
  data() {
    return {
      map: null,
      layers: {
        docpointLayer: null,
        voronoiLayer: null,
        colorLumpLayer: null
      },
      extent: [], //[minx, miny, maxx, maxy],
      alldata: {
        polygons: [], // Voronoi多边形
        coords2index: new Map(), // 多边形边上点的坐标到索引的映射
        index2coords: new Map(), // 多边形边上点的索引到坐标的映射
        edge2docindex: new Map() // 与每条边共边的多边形索引
      },
      color: null,
      roadwithScale: null,
      selected: []
    };
  },
  mounted() {
    this.$nextTick(() => {
      this.loadSettings();
      this.initMap();
      this.processData();
      this.addColorLump();
      this.addRoadLayer();
      this.addVoronoiLayer();
      this.addDocPoint();
      this.addClickEventOnVoronoi();
    });
  },
  methods: {
    loadSettings() {
      let xExt = d3.extent(projdata, d => d.x);
      let yExt = d3.extent(projdata, d => d.y);
      let x = xExt[1] - xExt[0] > yExt[1] - yExt[0] ? xExt : yExt;
      let y = xExt[1] - xExt[0] < yExt[1] - yExt[0] ? xExt : yExt;
      this.extent = [
        x[0] - 0.1 * (x[1] - x[0]),
        y[0] - 0.1 * (y[1] - y[0]),
        x[1] + 0.1 * (x[1] - x[0]),
        y[1] + 0.1 * (y[1] - y[0])
      ];
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
      let docCoords = projdata.map(d => [d.x, d.y]);
      let cells = d3
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
            _.intersection(p2, this.extent).length > 0
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
    },
    initMap() {
      this.map = new ol.Map({
        target: "voronoi-docs-map",
        view: new ol.View({
          projection: new olproj.Projection({
            extent: this.extent
          }),
          extent: this.extent,
          center: olextent.getCenter(this.extent),
          zoom: 2
        })
      });
    },
    addDocPoint() {
      let vectorSource = new olsource.Vector();
      this.layers.docpointLayer = new ollayer.Vector({
        source: vectorSource
      });
      let xExt = d3.extent(projdata, d => d.x);
      let yExt = d3.extent(projdata, d => d.y);

      projdata.forEach(doc => {
        let feature = new ol.Feature({
          geometry: new olgeom.Point([doc.x, doc.y])
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
      });
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
        feature.setStyle(
          new olstyle.Style({
            fill: new olstyle.Fill({
              color: "rgb(255, 255, 255, 0)"
            }),
            stroke: new olstyle.Stroke({
              color: "grey"
            })
          })
        );
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
        if (docindex.length == 2) {
          pg = [
            this.alldata.index2coords.get(p1),
            [projdata[docindex[0]].x, projdata[docindex[0]].y],
            this.alldata.index2coords.get(p2),
            [projdata[docindex[1]].x, projdata[docindex[1]].y],
            this.alldata.index2coords.get(p1)
          ];
          weight = similarityMatrix[docindex[0]][docindex[1]];
        } else if (docindex.length == 1) {
          pg = [
            this.alldata.index2coords.get(p1),
            [projdata[docindex[0]].x, projdata[docindex[0]].y],
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
        source: vectorSource
      });
      longdisHighsimilarity().forEach(d => {
        let pair = d.pair.split("-");
        let p1 = [projdata[parseInt(pair[0])].x, projdata[parseInt(pair[0])].y];
        let p2 = [projdata[parseInt(pair[1])].x, projdata[parseInt(pair[1])].y];
        let feature = new ol.Feature({
          geometry: new olgeom.LineString([p1, p2])
        });
        feature.setStyle(
          new olstyle.Style({
            // fill: new olstyle.Fill({
            //   color: 'rgb(255, 255, 0, 0.05)'
            // }),
            stroke: new olstyle.Stroke({
              color: "orange",
              width: this.roadwithScale(similarityMatrix[pair[0]][pair[1]])
            })
          })
        );
        vectorSource.addFeature(feature);
      });
      this.map.addLayer(this.layers.roadLayer);
    },
    addClickEventOnVoronoi() {
      let docsDisplay = document.getElementById("docs-display");
      let selectSingleClick = new olinteraction.Select();
      let instance = this;
      selectSingleClick.on("select", function(e) {
        if (e.selected && e.selected.length > 0) {
          instance.selected = instance.selected.concat(e.selected);
          e.selected.forEach(feature => {
            let id = parseInt(feature.getId().split("-")[1]);
            let p = document.createElement("p");
            p.innerHTML = projdata[id].text;
            docsDisplay.appendChild(p);
            docsDisplay.appendChild(document.createElement("hr"));
          });
        }
        instance.selected.forEach(feature => {
          feature.setStyle(
            new olstyle.Style({
              stroke: new olstyle.Stroke({
                color: "steelblue",
                width: 2
              })
            })
          );
        });
      });
      this.map.addInteraction(selectSingleClick);
    },
    detectBoundaries(polygon) {
      return _.intersection(polygon.flat(), this.extent);
    },
    clearSelected() {
      this.selected.forEach(feature => {
        feature.setStyle(
          new olstyle.Style({
            fill: new olstyle.Fill({
              color: "rgb(255, 255, 255, 0)"
            }),
            stroke: new olstyle.Stroke({
              color: "grey"
            })
          })
        );
      });
      this.selected = [];
      document.getElementById("docs-display").innerHTML = "";
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang='scss' scoped>
.voronoi-docs {
  width: 100%;
  height: 100%;

  .title {
    height: 60px;

    h3 {
      display: inline;
      line-height: 60px;
    }
  }

  .content {
    width: 100%;
    position: absolute;
    top: 60px;
    bottom: 0px;

    #voronoi-docs-map {
      display: inline-block;
      width: 60%;
      height: 100%;
      float: left;
    }

    #docs-panel {
      display: inline-block;
      width: 40%;
      height: 100%;
      float: right;
      overflow-y: scroll;

      #docs-panel-control {
        position: fixed;
      }

      #docs-display {
        margin-top: 30px;
      }
    }
  }
}
</style>
