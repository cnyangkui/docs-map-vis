<template>
  <div class="contour">
    <div class="title"><h3>Contour</h3></div>
    <div id="contour-map"></div>
  </div>
</template>


<script>
import * as d3 from 'd3';
import * as ol from 'ol'
import * as ollayer from 'ol/layer'
import * as olsource from 'ol/source'
import * as olextent from 'ol/extent';
import * as olproj from 'ol/proj'
import * as olgeom from 'ol/geom'
import * as olstyle from 'ol/style'
import contourdata from '../assets/data/thucnews/contour.json'
import projdata from '../assets/data/thucnews/projection_dense_tfidf_thucnews.json'
import indexdata from '../assets/data/thucnews/index.json'
export default {
  name: 'contour',
  data() {
    return {
      map: null,
      layers: {
        contourLayer: null,
        docpointLayer: null
      },
      mapConfig: {
        extent: [],//[left, bottom, right, top]
        zoom: 10,
        minZoom: 3,
        maxZoom: 18,
      },
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.loadSettings();
      this.initMap();
      this.addContourLayer2();
      this.addDocPoint();
    })
  },
  methods: {
    loadSettings() {
      let xExt = d3.extent(projdata, d => d.x);
      let yExt = d3.extent(projdata, d => d.y);
      this.mapConfig.extent = [xExt[0], yExt[1], xExt[1], yExt[0]]
    },
    initMap() {
      this.map = new ol.Map({
        target: 'contour-map',
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
          geometry: new olgeom.Point([this.x()(parseFloat(doc.x)), this.y()(parseFloat(doc.y))])
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
    addContourLayer2() {
      let xnum = 64;
      let ynum = 64;
      let xRange=[], yRange = [];
      for(let i=0; i<xnum; i++) {
        xRange.push(i);
      }
      for(let j=0; j<ynum; j++) {
        yRange.push(j);
      }
      let xScale = d3.scaleQuantize().domain(d3.extent(projdata, d => d.x)).range(xRange);
      let yScale = d3.scaleQuantize().domain(d3.extent(projdata, d => d.x)).range(yRange);
      let contour_values = Array(xnum*ynum).fill(-1);
      indexdata.forEach((value, index) => {
        let x = xScale(projdata[index].x);
        let y = yScale(projdata[index].y);
        if(contour_values[y*xnum+x] == -1) {
          contour_values[y*xnum+x] = [value];
        } else {
          contour_values[y*xnum+x].push(value);
        }
      })
      contour_values = contour_values.map(d => typeof(d) === 'number' ? d: d3.mean(d));
      let extent = d3.extent(contour_values);
      extent = [extent[0] * 1.2, extent[1] * 1.2];
      let pathdata = d3.contours()
              .size([xnum, ynum])
              .thresholds(d3.range(extent[0], extent[1], +((extent[1]-extent[0])/10).toFixed(2)))(contour_values);
      // console.log(pathdata)
      // 等高线数据是四维数组，[点] -> 线; [线] -> 一种高度的等高线; []
      // for(let i=0,len1=pathdata.length; i<len1; i++) {
      //   for(let j=0,len2=pathdata[i].coordinates.length; j<len2; j++) {
      //     for(let k=0,len3=pathdata[i].coordinates[j].length; k<len3; k++) {
      //       for(let l=0,len4=pathdata[i].coordinates[j][k].length; l<len4; l++) {
      //         pathdata[i].coordinates[j][k][l][0] = this.x()(pathdata[i].coordinates[j][k][l][0]);
      //         pathdata[i].coordinates[j][k][l][1] = this.y()(pathdata[i].coordinates[j][k][l][1]);
      //       }
      //     }
      //   }
      // }
      // var color = d3.scaleLinear()
      //         .domain(extent)
      //         .interpolate(function() { return d3.schemeGreens; });
      let color= d3.scaleSequential()
        .domain(extent)
        .interpolator(d3.interpolateYlGn);


      let vectorSource = new olsource.Vector();
      this.layers.contourLayer = new ollayer.Vector({
        source: vectorSource,
      });
      pathdata.forEach(mp => {
        let feature = new ol.Feature({
          geometry: new olgeom.MultiPolygon(mp.coordinates)
        });
        feature.setStyle(new olstyle.Style({
          fill: new olstyle.Fill({
            color: color(mp.value)
          })
        }))
        vectorSource.addFeature(feature);
      })
      this.map.addLayer(this.layers.contourLayer);
    },
    addContourLayer() {
      console.log('add contour')
      // let xnum = 64;
      // let ynum = 64;
      // let xRange=[], yRange = [];
      // for(let i=0; i<xnum; i++) {
      //   xRange.push(i);
      // }
      // for(let j=0; j<ynum; j++) {
      //   yRange.push(j);
      // }
      // let xScale = d3.scaleQuantize().domain(d3.extent(projdata, d => d.x)).range(xRange);
      // let yScale = d3.scaleQuantize().domain(d3.extent(projdata, d => d.x)).range(yRange.reverse());
      // let contour_values = Array(xnum*ynum).fill(-1);
      // indexdata.forEach((value, index) => {
      //   let x = xScale(projdata[index].x);
      //   let y = yScale(projdata[index].y);
      //   console.log(projdata[index].x, x)
      //   if(contour_values[y*xnum+x] == -1) {
      //     contour_values[y*xnum+x] = [value];
      //   } else {
      //     contour_values[y*xnum+x].push(value);
      //   }
      // })
      // contour_values = contour_values.map(d => typeof(d) === 'number' ? d: d3.mean(d));
      // let extent = d3.extent(contour_values);
      // let pathdata = d3.contours()
      //         .size([xnum, ynum])
      //         .thresholds(d3.range(extent[0], extent[1], +((extent[1]-extent[0])/10).toFixed(2)))(contour_values);
      // console.log(pathdata)
      // // 等高线数据是四维数组，[点] -> 线; [线] -> 一种高度的等高线; []
      // for(let i=0,len1=pathdata.length; i<len1; i++) {
      //   for(let j=0,len2=pathdata[i].coordinates.length; j<len2; j++) {
      //     for(let k=0,len3=pathdata[i].coordinates[j].length; k<len3; k++) {
      //       for(let l=0,len4=pathdata[i].coordinates[j][k].length; l<len4; l++) {
      //         pathdata[i].coordinates[j][k][l][0] = this.x()(pathdata[i].coordinates[j][k][l][0]);
      //         pathdata[i].coordinates[j][k][l][1] = this.y()(pathdata[i].coordinates[j][k][l][1]);
      //       }
      //     }
      //   }
      // }
      // console.log(pathdata)
      this.layers.contourLayer = new ollayer.Image({
        extent: this.extent,
        source: new olsource.ImageCanvas({
          canvasFunction: function(extent, resolution, pixelRatio, size, projection) {
            let canvas = document.createElement('canvas');
            console.log(size)
            // canvas.width = 1000//size[0];
            // canvas.height = 600//size[1];
            let ctx = canvas.getContext('2d');
            let path = d3.geoPath().context(ctx);
            var color = d3.scaleLinear()
              .domain(extent)
              .interpolate(function() { return d3.interpolateYlGnBu; });
            ctx.fillStyle = 'red';
            ctx.fillRect(0, 0, 1000, 600)
            // pathdata.forEach(d => {
            //   ctx.fillStyle = color(d.value);
            //   ctx.beginPath();
            //   path(d);
            //   ctx.fill();
            // })
            return canvas;
          },
        })
      });
      this.map.addLayer(this.layers.contourLayer);
    },
    x() {
      let xExt = d3.extent(projdata, d => d.x);
      return d3.scaleLinear().domain(xExt).range([this.mapConfig.extent[0], this.mapConfig.extent[2]]);
    },
    y() {
      let yExt = d3.extent(projdata, d => d.y);
      return d3.scaleLinear().domain(yExt).range([this.mapConfig.extent[3], this.mapConfig.extent[1]]);
    },
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang='scss' scoped>
.contour {
  width: 100%;
  height: 100%;

  .title {
    height: 60px;

    h3 {
      display: inline;
      line-height: 60px;
    }
  }

  #contour-map {
    width: 100%;
    position: absolute;
    top: 60px;
    bottom: 0px;
  }
}
</style>
