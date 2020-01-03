<template>
  <div class="map-container">
    <div id="map"></div>
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
import projdata from "../../public/data/output/thucnews/projection_dense_tfidf.json";
// import { initTree, wordsCollide } from "../assets/js/tagcloud.js";
export default {
  name: "Map",
  data() {
    return {
      map: null,
      dataExtent: [],
      mapExtent: [], //[minx, miny, maxx, maxy],
      zoom: 1,
      xpixel2extent: null,
      ypixel2extent: null
    };
  },
  mounted() {
    this.$nextTick(() => {
      let start = new Date();
      this.processData();
      this.initMap();
      // this.mouseWheelZoom();
      let end = new Date();
      console.log("耗时:", end - start);
    });
  },
  methods: {
    processData() {
      let instance = this;
      let xExt = d3.extent(projdata, d => d.x);
      let yExt = d3.extent(projdata, d => d.y);
      let x = xExt[1] - xExt[0] > yExt[1] - yExt[0] ? xExt : yExt;
      let y = xExt[1] - xExt[0] < yExt[1] - yExt[0] ? xExt : yExt;
      this.dataExtent = [x[0], y[0], x[1], y[1]];
      this.mapExtent = [
        x[0] - 0.1 * (x[1] - x[0]),
        y[0] - 0.1 * (y[1] - y[0]),
        x[1] + 0.1 * (x[1] - x[0]),
        y[1] + 0.1 * (y[1] - y[0])
      ];
      let mapEle = document.getElementById("map");
      // let screenWidth = mapEle.offsetWidth;
      // let screenHeight = mapEle.offsetHeight;
      // this.xpixel2extent = d3
      //   .scaleLinear()
      //   .domain([0, screenWidth])
      //   .range([0, this.mapExtent[2] - this.mapExtent[0]]);
      // this.ypixel2extent = d3
      //   .scaleLinear()
      //   .domain([0, screenHeight])
      //   .range([0, this.mapExtent[3] - this.mapExtent[1]]);
    },
    initMap() {
      this.map = new ol.Map({
        target: "map",
        layers: [],
        view: new ol.View({
          projection: new olproj.Projection({
            extent: this.mapExtent
          }),
          extent: this.mapExtent,
          center: olextent.getCenter(this.mapExtent),
          zoom: this.zoom
        })
      });
      this.map.addLayer(
        new ollayer.Vector({
          title: "words",
          source: this.addWords()
        })
      );
      let instance = this;
      this.map.on("moveend", function(e) {
        instance.zoom = instance.map.getView().getZoom(); //获取当前地图的缩放级别
      });
    },
    getWordPixelArr(text) {
      const MinBoxSize = 10; // 最小网格大小
      const fontFamily = "sans-serif"; // 字体样式
      const fontSize = 15; // 字体大小
      const wordW = 15; // 宽度
      const wordH = 15; // 高度
      let len = text.split("").length;
      let canvas = document.createElement("canvas");
      canvas.width = wordW * len;
      canvas.height = wordH;
      let c = canvas.getContext("2d");
      c.clearRect(0, 0, wordW * len * 2, wordH * 2);
      c.save();
      c.textAlign = "center";
      c.font = ~~fontSize + "px " + fontFamily;
      c.translate((wordW * len) / 2, (wordH + fontSize) / 2);
      c.fillText(text, 0, 0);
      c.restore();
      // imageData 中包含width、height、data
      // 其中data为Uint8ClampedArray，是一个长度为width*height长度的一维数组，描述各个像素的rgba
      let imageData = c.getImageData(1, 1, wordW * len, wordH);
      let pixels = imageData.data;
      let arr = [];
      // 如果这个像素内的r+g+b+a不为0，则表示该像素有内容
      for (let i = 0; i < wordW * wordH * len; i++) {
        arr[i] =
          pixels[i * 4 + 0] +
          pixels[i * 4 + 1] +
          pixels[i * 4 + 2] +
          pixels[i * 4 + 3];
      }
      return arr;
    },
    rectCollide(x1, y1, w1, h1, x2, y2, w2, h2) {
      let maxX, maxY, minX, minY;
      maxX = x1 + w1 >= x2 + w2 ? x1 + w1 : x2 + w2;
      maxY = y1 + h1 >= y2 + h2 ? y1 + h1 : y2 + h2;
      minX = x1 <= x2 ? x1 : x2;
      minY = y1 <= y2 ? y1 : y2;
      if (maxX - minX <= w1 + w2 && maxY - minY <= h1 + h2) {
        return true;
      } else {
        return false;
      }
    },
    collideDetection(list, ele) {
      for (let i = 0; i < list.length; i++) {
        if (
          this.rectCollide(
            list[i].x,
            list[i].y,
            list[i].w,
            list[i].h,
            ele.x,
            ele.y,
            ele.w,
            ele.h
          )
        ) {
          return true;
        }
      }
      return false;
    },
    getPosAndWH(txt, x, y, fontname, fontsize) {
      let pixelWidth = this.getWidthOfText(txt, fontname, fontsize);
      let size = ~~fontsize.split("px")[0];
      // let w = this.xpixel2extent(pixelWidth);
      // let h = this.ypixel2extent(size);
      let extent = this.map.getView().calculateExtent([pixelWidth, size]);
      let w = extent[2] - extent[0];
      let h = extent[3] - extent[1];
      return {
        x: x - w / 2,
        y: y - h / 2,
        w: w,
        h: h
      };
    },
    getWidthOfText(txt, fontname, fontsize) {
      let canvas = document.createElement("canvas");
      let ctx = canvas.getContext("2d");
      ctx.font = fontsize + " " + fontname;
      return ctx.measureText(txt).width;
    },
    addWords() {
      let instance = this;
      const fontname = "Microsoft YaHei";
      const fontsize = "15px";
      let vectorSource = new olsource.Vector();
      let a = 5,
        b = 1;
      let wordRects = [];
      for (let i = 0; i < 500; i++) {
        let j = i / 10 / this.zoom;
        let x = (a + b * j) * Math.cos(j);
        let y = (a + b * j) * Math.sin(j);
        let rectInfo = this.getPosAndWH("helloworld", x, y, fontname, fontsize);
        let feature3 = new ol.Feature({
          geometry: new olgeom.Point([x, y])
        });
        feature3.setStyle(
          new olstyle.Style({
            image: new olstyle.Circle({
              radius: 5,
              fill: new olstyle.Fill({ color: "red" })
            })
          })
        );
        vectorSource.addFeature(feature3);
        if (i == 0) {
          wordRects.push(rectInfo);
        } else {
          let flag = this.collideDetection(wordRects, rectInfo);
          if (flag) {
            continue;
          } else {
            wordRects.push(rectInfo);
          }
        }
        let feature = new ol.Feature({
          geometry: new olgeom.Point([x, y]) //在中心位置实例化一个要素，设置要素的样式
        });
        feature.setStyle(
          new olstyle.Style({
            text: new olstyle.Text({
              font: fontsize + " " + fontname,
              text: "helloworld",
              fill: new olstyle.Fill({
                color: "#222"
              })
            })
          })
        );
        vectorSource.addFeature(feature);
        let pixelWidth = this.getWidthOfText("helloworld", fontname, fontsize);
        let extent = this.map
          .getView()
          .calculateExtent([pixelWidth, ~~fontsize.split("px")[0]]);
        let feature2 = new ol.Feature({
          geometry: new olgeom.LineString([
            [x - (extent[2] - extent[0]) / 2, y - (extent[3] - extent[1]) / 2],
            [x + (extent[2] - extent[0]) / 2, y - (extent[3] - extent[1]) / 2],
            [x + (extent[2] - extent[0]) / 2, y + (extent[3] - extent[1]) / 2],
            [x - (extent[2] - extent[0]) / 2, y + (extent[3] - extent[1]) / 2],
            [x - (extent[2] - extent[0]) / 2, y - (extent[3] - extent[1]) / 2]
          ])
        });
        feature2.setStyle(
          new olstyle.Style({
            stroke: new olstyle.Stroke({
              color: "steelblue"
            })
          })
        );
        vectorSource.addFeature(feature2);
      }
      return vectorSource;
    }
  },
  watch: {
    zoom(n, o) {
      console.log(n);
      let layers = this.map.getLayers().getArray();
      let wordsLayer = layers.filter(d => d.get("title") == "words")[0];
      this.map.removeLayer(wordsLayer);
      this.map.addLayer(
        new ollayer.Vector({
          title: "words",
          source: this.addWords()
        })
      );
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang='scss' scoped>
.map-container {
  width: 100%;
  height: 100%;

  // .title {
  //   height: 60px;

  //   h3 {
  //     display: inline;
  //     line-height: 60px;
  //   }
  // }

  #map {
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
