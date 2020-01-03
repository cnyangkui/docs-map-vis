<template>
  <div class="triangulation">
    <div class="title">
      <h3>Triangulation</h3>
    </div>
    <div id="triangulation-map"></div>
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
import projdata from "../../public/data/output/thucnews/projection_dense_tfidf.json";
import similarityMatrix from "../../public/data/output/thucnews/similarity_matrix_5round.json";
export default {
  name: "Triangulation",
  data() {
    return {
      map: null,
      layers: {
        docpointLayer: null,
        triangulationLayer: null,
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
      this.addTriangulationLayer();
      this.addColorLump();
      this.addDocPoint();
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
      // this.color = d3.scaleLinear().domain([0, 0.2]).range(['yellow', 'green']);
      this.color = d3
        .scaleSequential()
        .domain([0, 0.5])
        .interpolator(d3.interpolateYlGn); //interpolateBrBG,interpolateYlGn
    },
    initMap() {
      this.map = new ol.Map({
        target: "triangulation-map",
        view: new ol.View({
          projection: new olproj.Projection({
            extent: this.extent
          }),
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
          geometry: new olgeom.Point([parseFloat(doc.x), parseFloat(doc.y)])
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
    addTriangulationLayer() {
      let data = projdata.map(d => [d.x, d.y]);
      let cells = d3
        .voronoi()
        .extent([
          [this.extent[0], this.extent[1]],
          [this.extent[2], this.extent[3]]
        ])
        .triangles(data);
      let vectorSource = new olsource.Vector();
      this.layers.triangulationLayer = new ollayer.Vector({
        source: vectorSource
      });

      cells.forEach(c => {
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
        vectorSource.addFeature(feature);
      });
      this.map.addLayer(this.layers.triangulationLayer);
    },
    addColorLump() {
      let data = projdata.map(d => [d.x, d.y]);
      let coords2points = new Map();
      data.forEach((d, i) => {
        coords2points.set(JSON.stringify(d), i);
      });
      let cells = d3
        .voronoi()
        .extent([
          [this.extent[0], this.extent[1]],
          [this.extent[2], this.extent[3]]
        ])
        .triangles(data);
      if (Array.from(coords2points).length != projdata.length) {
        console.log("不能赋色，有坐标完全一致的节点...");
        return;
      }
      let vectorSource = new olsource.Vector();
      this.layers.colorLumpLayer = new ollayer.Vector({
        source: vectorSource
      });
      cells.forEach(c => {
        let [p1, p2, p3] = c;
        let i1 = coords2points.get(JSON.stringify(p1)),
          i2 = coords2points.get(JSON.stringify(p2)),
          i3 = coords2points.get(JSON.stringify(p3));
        let avg =
          (similarityMatrix[i1][i2] +
            similarityMatrix[i1][i3] +
            similarityMatrix[i2][i3]) /
          3;
        let start = c[0];
        let polygon = c;
        polygon.push(start);
        let feature = new ol.Feature({
          geometry: new olgeom.Polygon([polygon])
        });
        feature.setStyle(
          new olstyle.Style({
            fill: new olstyle.Fill({
              color: this.color(avg)
            })
          })
        );
        vectorSource.addFeature(feature);
      });
      this.layers.colorLumpLayer.setOpacity(0.3);
      this.map.addLayer(this.layers.colorLumpLayer);
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang='scss' scoped>
.triangulation {
  width: 100%;
  height: 100%;

  .title {
    height: 60px;

    h3 {
      display: inline;
      line-height: 60px;
    }
  }

  #triangulation-map {
    width: 100%;
    position: absolute;
    top: 60px;
    bottom: 0px;
  }
}
</style>
