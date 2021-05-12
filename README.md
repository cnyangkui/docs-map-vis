# docs-map-vis

Map-based Docs Visualization

文档地图可视化方式

![image](/public/images/Home.png)


注：代码写得有点烂，主要有两个问题，一是性能不高，速度慢；二是文档投影到二维平面后，不能有坐标完全相同的两个投影节点，如果有坐标相同的投影节点，Voronoi会绘制失败，可视化结果可能会出错。

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Run your tests
```
npm run test
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
