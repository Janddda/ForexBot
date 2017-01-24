#Imports
import numpy as np
import matplotlib.pyplot as plt
import sys
import json
import math

from sklearn import linear_model
from sklearn import neighbors
from sklearn import svm
from sklearn import neural_network

from sklearn.model_selection import train_test_split
from sklearn.model_selection import cross_val_score
from sklearn.model_selection import GridSearchCV

from sklearn import preprocessing

lines = []

for line in sys.stdin:
	lines.append(line)

inputFile = lines[0]
data = json.loads(inputFile)

#Train/Test ratios
train_percent = float(lines[1])

#Number of candlesticks to look at per Y value
n = int(lines[2])

#Possible Y values (note: these may change depending on the data loaded above)
OPEN = 0;
HIGH = 1;
LOW = 2;
CLOSE = 3;

#Selected Y value
y_type = int(lines[3])


#Machine Learning Algorithms (for now we are not passing in any parameters)
names = ["Bayesian Ridge", "K Neighbors Regressor", "NuSVR", "MLP Regressor"]

#Param grids for Learning Algorithms

param_grid = [
[
	{'n_iter': [3],
	 'compute_score': [0]}
],
[
	{'weights': ['distance']}
],
[
	{'kernel': ['linear']}
],
[
	{'activation': ['relu'],
	 'solver': ['adam']}
]
]

clf = [
linear_model.BayesianRidge(n_iter=3),
neighbors.KNeighborsRegressor(weights='distance'),
svm.NuSVR(kernel='linear'),
neural_network.MLPRegressor(hidden_layer_sizes=(10))
]
score = []

#x_data
x_data = np.concatenate(data[0:n])

for x in range(1,(len(data)-n)):
	x_data = np.vstack((x_data,np.concatenate(data[x:x+n])))

#x_data = preprocessing.minmax_scale(x_data)
x_data = preprocessing.scale(x_data)

#y_data
y_data = data[n:len(data)]
y_data = [item[y_type] for item in y_data]
y_data = np.ravel(y_data)

#split training and test data
x_train, x_test, y_train, y_test = train_test_split(x_data, y_data, train_size=train_percent)

response = {}
response['classifiers'] = []

for x in range(0,len(clf)):
	y_eval = clf[x].fit(x_train,y_train)
	gs = GridSearchCV(clf[x], param_grid[x], cv=5, scoring='r2').fit(x_data,y_data)
	best_params = gs.best_params_
	score = gs.best_score_
	x_final = np.vstack((x_data,np.concatenate(data[len(data)-n:len(data)])))
	x_final = preprocessing.scale(x_final)
	predictions = clf[x].predict(x_final).tolist()
	response['classifiers'].append({'y_length': len(y_data), 'name': names[x], 'score': np.average(score), 'best_params': best_params, 'predictions': predictions[-21:], 'answers': y_data[-20:].tolist()})

print(json.dumps(response))