#Imports
import numpy as np
import sys
import json
import math

from sklearn import linear_model
from sklearn import neighbors
from sklearn import svm
from sklearn import tree
from sklearn import ensemble

from sklearn import preprocessing

lines = []

for line in sys.stdin:
	lines.append(line)

inputFile = lines[0]

#Data
data = json.loads(inputFile)

#Number of candlesticks to look at per Y value
n = 5

#Selected CLF
clf = [
linear_model.BayesianRidge(n_iter=3),
neighbors.KNeighborsRegressor(weights='distance'),
svm.NuSVR(kernel='linear'),
ensemble.AdaBoostRegressor(tree.DecisionTreeRegressor(),n_estimators=100)
]

#x_data
x_data = np.concatenate(data[0:n])

for x in range(1,(len(data)-n)+1):
	x_data = np.vstack((x_data,np.concatenate(data[x:x+n])))

x_data = preprocessing.scale(x_data)

#y_data
y_data = data[n:len(data)]

y_high = [item[1] for item in y_data]
y_high = np.ravel(y_high)

y_low = [item[2] for item in y_data]
y_low = np.ravel(y_low)

y_close = [item[3] for item in y_data]
y_close = np.ravel(y_close)

y_data = [y_high,y_low,y_close]

response = {}
classifiers = []

for x in range(0,len(clf)):

	predictions = []

	for i in range(0, len(y_data)):

		clf[x].fit(x_data[:-1],y_data[i])
		predictions.append(clf[x].predict(x_data[-1].reshape(1, -1)))

	classifiers.append(predictions)

classifiers = [np.average([item[0] for item in classifiers]),
				np.average([item[1] for item in classifiers]),
				np.average([item[2] for item in classifiers])]

print(json.dumps(classifiers))
