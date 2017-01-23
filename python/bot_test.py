#Imports
import numpy as np
import matplotlib.pyplot as plt
import sys
import json
import math

from sklearn import linear_model

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
names = ["SGD Regressor", "Bayesian Ridge"]

#Param grids for Learning Algorithms

param_grid = [
[
	{'loss': ['squared_loss', 'huber'],
	 'penalty': ['none', 'l1', 'elasticnet'],
	 'learning_rate': ['constant']}
],
[
	{'n_iter': [3, 4, 5, 10, 15],
	 'compute_score': [0]}
]
]

clf = [
linear_model.SGDRegressor(),
linear_model.BayesianRidge()
]
score = []

#x_data
x_data = np.concatenate(data[0:n])

for x in range(1,len(data)-n-1):
	x_data = np.vstack((x_data,np.concatenate(data[x:x+n])))

#x_data = preprocessing.minmax_scale(x_data)
x_data = preprocessing.scale(x_data)

#y_data
y_data = data[n:len(data)-1]
y_data = [item[y_type] for item in y_data]
y_data = np.ravel(y_data)

#find out if all of our data is correct.
#print(x_data[n][y_type]) #The nth element in training data (including candlesticks n through n+n). Get the y_type value of the first candlestick
#print(y_data[0]) #The y_type value should be equal to the first answer we are looking for. 

#split training and test data
x_train, x_test, y_train, y_test = train_test_split(x_data, y_data, train_size=train_percent)

#plt.plot(range(0,len(y_test)),y_test)

colors = ['red', 'green', 'blue']

response = {}
response['classifiers'] = []

for x in range(0,len(clf)):
	y_eval = clf[x].fit(x_train,y_train)
	gs = GridSearchCV(clf[x], param_grid[x], cv=10).fit(x_data,y_data)
	best_params = gs.best_params_
	score = gs.best_score_
	predictions = clf[x].predict(x_data).tolist()
	response['classifiers'].append({'name': names[x], 'score': np.average(score), 'best_params': best_params, 'predictions': predictions, 'answers': y_data.tolist()})

print(json.dumps(response))