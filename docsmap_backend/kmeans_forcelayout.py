# -*- encoding: utf-8 -*-
import json
import pprint
from sklearn.cluster import KMeans

import utils

with open('forceResult.json', 'r', encoding='utf-8') as f:
    objs = json.load(f)

features = []
for o in objs:
    features.append([o['x'], o['y']])

# 聚类
db = KMeans(n_clusters=8, random_state=0).fit(features)
labels = db.labels_.tolist()
utils.write_json(labels, 'forceResultCluster.json')
pprint.pprint("聚类结束...")