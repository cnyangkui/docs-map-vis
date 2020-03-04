<template>
  <div class="voronoi">
    <div class="title">
      <h3>Voronoi</h3>
    </div>
    <div id="voronoi-map"></div>
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
import projdata from  "../../public/data/output/thucnews/proj.json"
import similarityMatrix from "../../public/data/output/thucnews/similarity.json"
export default {
  name: "Voronoi",
  data() {
    return {
      map: null,
      layers: {
        docpointLayer: null,
        voronoiLayer: null,
        colorLumpLayer: null
      },
      extent: [], //[minx, miny, maxx, maxy]
      color: null
    };
  },
  mounted() {
    this.$nextTick(() => {
      this.loadSettings();
      this.initMap();
      this.addVoronoiLayer();
      this.addColorLump();
      this.addDocPoint();
    });
  },
  methods: {
    loadSettings() {
      let xExt = d3.extent(projdata, d => d.x);
      let yExt = d3.extent(projdata, d => d.y);
      this.extent = [
        xExt[0] - 0.1 * (xExt[1] - xExt[0]),
        yExt[0] - 0.1 * (yExt[1] - yExt[0]),
        xExt[1] + 0.1 * (xExt[1] - xExt[0]),
        yExt[1] + 0.1 * (yExt[1] - yExt[0])
      ];
      // this.extent = [xExt[0], yExt[0], xExt[1], yExt[1]]
      // let w_h = width / height;
      // let x_y = (xExt[1]*1.2 - xExt[0]*1.2) / (yExt[1] - yExt[0]);
      // this.color = d3.scaleLinear().domain([0, 0.2]).range(['yellow', 'green']);
      this.color = d3
        .scaleSequential()
        .domain([0, 0.5])
        .interpolator(d3.interpolateYlGn); //interpolateBrBG,interpolateYlGn
    },
    initMap() {
      this.map = new ol.Map({
        target: "voronoi-map",
        view: new ol.View({
          projection: new olproj.Projection({
            extent: this.extent
          }),
          extent: this.extent,
          center: olextent.getCenter(this.extent),
          zoom: 1
        })
      });
    },
    addDocPoint() {
      let vectorSource = new olsource.Vector();
      this.layers.docpointLayer = new ollayer.Vector({
        source: vectorSource
      });

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
      let data = projdata.map(d => [d.x, d.y]);
      let cells = d3
        .voronoi()
        .extent([
          [this.extent[0], this.extent[1]],
          [this.extent[2], this.extent[3]]
        ])
        .polygons(data);
      let vectorSource = new olsource.Vector();
      this.layers.voronoiLayer = new ollayer.Vector({
        source: vectorSource
      });

      cells.forEach((c, index) => {
        let polygon = Object.assign([], c);
        polygon.push(c[0]);
        let feature = new ol.Feature({
          geometry: new olgeom.Polygon([polygon])
        });
        feature.setStyle(
          new olstyle.Style({
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
      let data = projdata.map(d => [d.x, d.y]);
      let cells = d3
        .voronoi()
        .extent([
          [this.extent[0], this.extent[1]],
          [this.extent[2], this.extent[3]]
        ])
        .polygons(data);
      let vectorSource = new olsource.Vector();
      this.layers.colorLumpLayer = new ollayer.Vector({
        source: vectorSource
      });
      for (let i = 0, len1 = similarityMatrix.length; i < len1; i++) {
        for (let j = i + 1, len2 = similarityMatrix[i].length; j < len2; j++) {
          let commonEdge = _.intersectionBy(cells[i], cells[j], JSON.stringify);
          if (commonEdge.length != 0) {
            let colorLump1 = [
              cells[i].data,
              commonEdge[0],
              commonEdge[1],
              cells[i].data
            ];
            let colorLump2 = [
              cells[j].data,
              commonEdge[0],
              commonEdge[1],
              cells[j].data
            ];
            let feature1 = new ol.Feature({
              geometry: new olgeom.Polygon([colorLump1])
            });
            feature1.setStyle(
              new olstyle.Style({
                fill: new olstyle.Fill({
                  color: this.color(similarityMatrix[i][j])
                })
              })
            );
            let feature2 = new ol.Feature({
              geometry: new olgeom.Polygon([colorLump2])
            });
            feature2.setStyle(
              new olstyle.Style({
                fill: new olstyle.Fill({
                  color: this.color(similarityMatrix[i][j])
                })
              })
            );
            vectorSource.addFeature(feature1);
            vectorSource.addFeature(feature2);
          }
        }
        // 给边界空白多边形绘制颜色
        if(cells[i] == undefined) {
          continue;
        }
        let boundaryPoints = this.detectBoundaries(cells[i]);
        if (boundaryPoints.length > 0) {
          let boundaryCoords = cells[i].filter(d => {
            let tmp = _.intersection(d, boundaryPoints);
            return tmp.length > 0 ? true : false;
          });
          if (boundaryCoords.length == 2) {
            // 边
            boundaryCoords.splice(0, 0, cells[i].data);
            boundaryCoords.push(cells[i].data);
          } else if (boundaryCoords.length == 3) {
            // 角
            let vertex = boundaryCoords.filter(
              d => _.intersection(d, this.extent).length == 2
            )[0];
            let others = boundaryCoords.filter(
              d => _.intersection(d, this.extent).length == 1
            );
            boundaryCoords = [
              cells[i].data,
              others[0],
              vertex,
              others[1],
              cells[i].data
            ];
          }
          let feature = new ol.Feature({
            geometry: new olgeom.Polygon([boundaryCoords])
          });
          feature.setStyle(
            new olstyle.Style({
              fill: new olstyle.Fill({
                color: this.color(0)
              })
            })
          );
          vectorSource.addFeature(feature);
        }
      }
      this.layers.colorLumpLayer.setOpacity(0.3);
      this.map.addLayer(this.layers.colorLumpLayer);
    },
    addClickEventOnColorLump() {},
    detectBoundaries(polygon) {
      return _.intersection(polygon.flat(), this.extent);
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang='scss' scoped>
.voronoi {
  width: 100%;
  height: 100%;

  .title {
    height: 60px;

    h3 {
      display: inline;
      line-height: 60px;
    }
  }

  #voronoi-map {
    width: 100%;
    position: absolute;
    top: 60px;
    bottom: 0px;
  }
}
</style>
