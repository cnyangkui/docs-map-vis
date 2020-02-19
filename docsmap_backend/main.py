# -*- encoding: utf-8 -*-
import json
import pprint

from mynlp.corpus_operator import Corpus
import utils

# file_dir = ''
# all_docs = utils.read_corpus(file_dir)

all_docs = []
with open('projection_dense_tfidf.json', 'r', encoding='utf-8') as f:
    objs = json.load(f)
for o in objs:
    all_docs.append(o['text'])

# 分词处理
corpus = Corpus(all_docs)
corpus.tokenize()
pprint.pprint("分词结束...")

# 计算文档相似性矩阵
sm = corpus.cal_similarity_matrix()
matrix = corpus.cal_similarity_matrix()
utils.write_json(matrix, 'outputdata/similarity.json')
pprint.pprint("计算相似性矩阵...")

# 文档投影
proj_data = corpus.proj_docs()
proj = []
for index, doc in enumerate(all_docs):
    proj.append({'index': index, 'text': doc, 'x': proj_data[index][0], 'y': proj_data[index][1]})
utils.write_json(proj, 'outputdata/proj.json', indent=4)
pprint.pprint("投影结束...")

# 抽取关键词
all_keywords = corpus.extra_keywords(top_k=20, with_weight=False)
utils.write_json(all_keywords, 'outputdata/keywords.json')
pprint.pprint("关键词抽取结束...")

# 聚类
labels = corpus.kmeans_docs(n_clusters=14)
utils.write_json(labels, 'outputdata/cluster.json')
pprint.pprint("聚类结束...")