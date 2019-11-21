const d3 = require('d3')
const projdata = require('../data/thucnews/projection_dense_tfidf_thucnews.json')
const similarityMatrix = require('../data/thucnews/similarity_matrix_thucnews.json')

function getLongdisHighsimilarity(dist_quantile=0.2, similarity_threshold=0.2) {
  let dist2similarity = []
  for(let i=0,len1=similarityMatrix.length; i<len1; i++) {
    for(let j=i+1,len2=similarityMatrix[i].length; j<len2; j++) {
      dist2similarity.push({
        pair: i+'-'+j,
        similarity: similarityMatrix[i][j],
        dist: Math.sqrt((projdata[i].x-projdata[j].x)**2 + (projdata[i].y-projdata[j].y)**2)
      })
    }
  }
  dist2similarity = dist2similarity.sort((a, b) => a.dist - b.dist);
  let dist_threshold = d3.quantile(dist2similarity, dist_quantile, d => d.dist)
  let filter = dist2similarity.filter((d, i) => d.dist > dist_threshold && d.similarity > similarity_threshold);
  return filter;
}

export default getLongdisHighsimilarity;