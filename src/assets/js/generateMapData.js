import * as d3 from "d3"
import projdata from "../../../public/data/output/thucnews/projection_dense_tfidf_thucnews.json";
import similarityMatrix from "../../../public/data/output/thucnews/similarity_matrix_thucnews_5round.json";
import cluserdata from "../../../public/data/output/thucnews/cluster.json"
import longdisHighsimilarity from "./dist2similarity.js";
import Graph from "./dijkstra.js";

/**
 * 获取投影数据的范围
 * @returns {Object} {
 *  dataExtent: Array [minx, miny, maxx, maxy]
 *  mapExtent: Array [minx, miny, maxx, maxy]
 * }
 */
function getExtent() {
  let xExt = d3.extent(projdata, d => d.x);
  let yExt = d3.extent(projdata, d => d.y);
  let x = xExt[1] - xExt[0] > yExt[1] - yExt[0] ? xExt : yExt;
  let y = xExt[1] - xExt[0] < yExt[1] - yExt[0] ? xExt : yExt;
  dataExtent = [x[0], y[0], x[1], y[1]];
  mapExtent = [
    x[0] - 0.1 * (x[1] - x[0]),
    y[0] - 0.1 * (y[1] - y[0]),
    x[1] + 0.1 * (x[1] - x[0]),
    y[1] + 0.1 * (y[1] - y[0])
  ];
  return {
    dataExtent: dataExtent,
    mapExtent: mapExtent
  };
}

/**
 * 在泰森多边形中对相邻的多边形构建边
 * @param {Array} mapExtent [minx, miny, maxx, maxy]
 * @returns {Array} 数据中每一个元素是一个字符串, 形式表现为"[a, b]", 表示索引为 a 的多边形和索引为 b 的多边形相邻
 */
function getDocLinks(mapExtent) {
  let doclink = new Set();
  let docCoords = projdata.map(d => [d.x, d.y]);
  let cells = d3
    .voronoi()
    .extent([
      [mapExtent[0], mapExtent[1]],
      [mapExtent[2], mapExtent[3]]
    ])
    .polygons(docCoords);
  let docCoords2index = new Map();
  cells.forEach((d, i) => {
    docCoords2index.set(JSON.stringify(d.data), i);
  });
  let triangles = d3
    .voronoi()
    .extent([
      [mapExtent[0], mapExtent[1]],
      [mapExtent[2], mapExtent[3]]
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
  return doclink;
}

/**
 * 在投影数据四周生成随机点
 * @param {Array} dataExtent [minx, miny, maxx, maxy]
 * @param {Array} mapExtent [minx, miny, maxx, maxy]
 * @param {number} pointNum int
 * @returns Array 数组中每个元素是一个坐标 [x, y]
 */
function generateOuterPoints(dataExtent, mapExtent, pointNum) {
  let outerPoints = [];
  for (let i = 0; i < pointNum; i++) {
    let tmp = i % 4;
    if (tmp == 0) {
      let x = _.random(mapExtent[0], dataExtent[2], true);
      let y = _.random(mapExtent[1], dataExtent[1], true);
      outerPoints.push([x, y]);
    } else if (tmp == 1) {
      let x = _.random(dataExtent[2], mapExtent[2], true);
      let y = _.random(mapExtent[1], dataExtent[3], true);
      outerPoints.push([x, y]);
    } else if (tmp == 2) {
      let x = _.random(dataExtent[0], mapExtent[2], true);
      let y = _.random(dataExtent[3], mapExtent[3], true);
      outerPoints.push([x, y]);
    } else {
      let x = _.random(mapExtent[0], dataExtent[0], true);
      let y = _.random(dataExtent[1], mapExtent[3], true);
      outerPoints.push([x, y]);
    }
  }
  return outerPoints;
}

/**
 * 在投影数据中点稀疏处生成随机点
 * @param {Array} dataExtent [minx, miny, maxx, maxy]
 * @param {number} innerXNum int
 * @param {number} innerYNum int
 * @returns {Array} 数组中每个元素是一个坐标 [x, y]
 */
function generateInnerPoints(dataExtent, innerXNum, innerYNum) {
  let innerPoints = [];
  let xspan =
    (dataExtent[2] - dataExtent[0]) / innerXNum;
  let yspan =
    (dataExtent[3] - dataExtent[1]) / innerYNum;
  let xScale = d3
    .scaleQuantize()
    .domain([dataExtent[0], dataExtent[2]])
    .range(d3.range(0, innerXNum));
  let yScale = d3
    .scaleQuantize()
    .domain([dataExtent[1], dataExtent[3]])
    .range(d3.range(0, innerYNum));
  let grid = [];
  for (let i = 0; i < innerXNum; i++) {
    let row = [];
    for (let j = 0; j < innerYNum; j++) {
      row.push(0);
    }
    grid.push(row);
  }
  for (let i = 0, len = projdata.length; i < len; i++) {
    let x = xScale(projdata[i].x);
    let y = yScale(projdata[i].y);
    grid[x][y]++;
  }
  for (let i = 0; i < innerXNum; i++) {
    for (let j = 0; j < innerYNum; j++) {
      if (grid[i][j] < 10) {
        let diff = 10 - grid[i][j];
        while (diff > 0) {
          let x =
            dataExtent[0] + _.random(i * xspan, (i + 1) * xspan, true);
          let y =
            dataExtent[1] + _.random(j * yspan, (j + 1) * yspan, true);
          innerPoints.push([x, y]);
          diff--;
        }
      }
    }
  }
  return innerPoints;
}

/**
 * Voronoi 迭代，生成地图
 * @param {Array} mapExtent [minx, miny, maxx, maxy]
 * @param {Array} allPoints 数组中每个元素是一个坐标 [x, y]
 * @param {number} mapIterationNum int, 迭代次数
 * @returns {Array} 数组中每一个元素表示一个多边形
 */
function getVoronoi(mapExtent, allPoints, mapIterationNum) {
  let cells = d3
    .voronoi()
    .extent([
      [mapExtent[0], mapExtent[1]],
      [mapExtent[2], mapExtent[3]]
    ])
    .polygons(allPoints);
  // 获得Voronoi的多边形
  let polygons = cells.map(c => {
    let pg = c;
    pg.push(c[0]);
    return pg;
  });
  // Voronoi每次选取多边形中心，重新绘制，多次迭代后网格趋向于六边形
  let centerPoints = [];
  for (let i = 0; i < mapIterationNum; i++) {
    centerPoints = polygons.map(d => d3.polygonCentroid(d));
    cells = d3
      .voronoi()
      .extent([
        [mapExtent[0], mapExtent[1]],
        [mapExtent[2], mapExtent[3]]
      ])
      .polygons(centerPoints);
    polygons = cells.map(c => {
      let pg = c;
      pg.push(c[0]);
      return pg;
    });
  }
  return polygons;
}

function getAllEdges(polygons, indexinfo) {
  let ecoords2index = new Map();
  let ecoords = [];
  let edges = new Map();
  let p_index = 0;
  // 构建多边形边上点的坐标与索引的互相映射
  polygons.forEach((pg) => {
    pg.forEach((point) => {
      ecoords2index.set(JSON.stringify(point), p_index);
      ecoords[p_index] = point;
      p_index++;
    });
  });
  // 对于多边形的每条边，获得与之共边的多边形的索引
  polygons.forEach((pg, index) => {
    for (let i = 0, len = pg.length - 1; i < len; i++) {
      if (
        // _.intersection(p1, this.extent).length > 0 ||
        // _.intersection(p2, this.extent).length > 0 ||
        index >= indexinfo.outerPoints[0] &&
        index < indexinfo.outerPoints[1]
      ) {
        continue;
      }
      let p1 = pg[i]; //Object.assign([], pg[i]); // 多边形上的节点
      let p2 = pg[i + 1]; //Object.assign([], pg[i + 1]); // 多边形上的节点
      let i1 = ecoords2index.get(JSON.stringify(p1));
      let i2 = ecoords2index.get(JSON.stringify(p2));
      let edge1 = i1 + "-" + i2;
      let edge2 = i2 + "-" + i1;
      if (edges.has(edge1)) {
        let value = edges.get(edge1);
        value.push(index);
        edges.set(edge1, value);
      } else {
        edges.set(edge1, [index]);
      }
      if (edges.has(edge2)) {
        let value = edges.get(edge2);
        value.push(index);
        edges.set(edge2, value);
      } else {
        edges.set(edge2, [index]);
      }
    }
  });
  return edges;
}

function getGraph(edges, ecoords) {
  // 多边形每条边距离的归一化
  let weightlist = [];
  for (let [edge, docindex] of edges) {
    let [p1, p2] = edge.split("-");
    let weight = 0;
    if (docindex.length == 2) {
      let c1 = ecoords[(parseInt(p1))];
      let c2 = ecoords[parseInt(p2)];
      weight = Math.sqrt((c1[0] - c2[0]) ** 2 + (c1[1] - c2[1]) ** 2); // 2D 欧式距离作为边权重
      weightlist.push(weight);
    }
  }
  let max = d3.max(weightlist);
  weightScale = d3
    .scaleLinear()
    .domain([0, max])
    .range([0, 1]);
  // 计算多边形每条边上的权值，根据文档相似度赋予，从而构造图数据
  let graphdata = new Map();
  for (let [edge, docindex] of edges) {
    let [p1, p2] = edge.split("-");
    let weight = 0;
    if (docindex.length == 2) {
      let c1 = ecoords[parseInt(p1)];
      let c2 = ecoords[parseInt(p2)];
      if (docindex[0] < projdata.length && docindex[1] < projdata.length) {
        // weight = similarityMatrix[docindex[0]][docindex[1]]; // 相似度作为边权重
        // weight = Math.sqrt((c1[0]-c2[0])**2 + (c1[1]-c2[1])**2) // 2D 欧式距离作为边权重
        weight =
          weightScale(
            Math.sqrt((c1[0] - c2[0]) ** 2 + (c1[1] - c2[1]) ** 2)
          ) *
          0.3 +
          similarityMatrix[docindex[0]][docindex[1]] * 0.7;
      } else {
        weight = 1;
      }
    } else if (docindex.length == 1) {
      weight = 1 / 0;
    }
    if (this.alldata.graphdata.has(p1)) {
      // 图数据中是否有起点为p1的数据
      let target = graphdata.get(p1); //起点为p1的数据的终点
      target[p2] = weight; // 加入一个新的终点
      graphdata.set(p1, target);
    } else {
      let target = {};
      target[p2] = weight;
      graphdata.set(p1, target);
    }
  }
  return graphdata;
}

function getCluster() {
  let clusterdata = new Array(projdata.length);
  Object.keys(clusterdata).forEach(key => {
    cluserdata[key].forEach(value => {
      instance.alldata.clusterdata[value] = +key;
    })
  })
  return clusterdata;
}

export default function generateMapData() {
  
  // 构造Graph
  for (let [key, value] of this.alldata.graphdata) {
    this.alldata.graph.addVertex(key, value);
  }
  let doclink2 = new Set();
  (function () {
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

}