const d3 = require('d3')
const projdata = require('../../../public/data/output/thucnews/projection_dense_tfidf_thucnews.json')
const similarityMatrix = require('../../../public/data/output/thucnews/similarity_matrix_thucnews_5round.json')

function getLongdisHighsimilarity(coordsdata=projdata, simmatrix=similarityMatrix, dist_quantile=0.3, similarity_threshold=0.2) {
  let dist2similarity = []
  for(let i=0,len1=simmatrix.length; i<len1; i++) {
    for(let j=i+1,len2=simmatrix[i].length; j<len2; j++) {
      dist2similarity.push({
        pair: i+'-'+j,
        similarity: simmatrix[i][j],
        dist: Math.sqrt((coordsdata[i].x-coordsdata[j].x)**2 + (coordsdata[i].y-coordsdata[j].y)**2)
      })
    }
  }
  dist2similarity = dist2similarity.sort((a, b) => a.dist - b.dist);
  let dist_threshold = d3.quantile(dist2similarity, dist_quantile, d => d.dist)
  let filter = dist2similarity.filter((d, i) => d.dist > dist_threshold && d.similarity > similarity_threshold);
  return filter;
}

export default getLongdisHighsimilarity;