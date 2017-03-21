#Imports
import numpy as np
import matplotlib.pyplot as plt
import sys
import json
import math

from sklearn import linear_model
from sklearn import neighbors
from sklearn import svm
from sklearn import tree
from sklearn import ensemble

from sklearn.model_selection import train_test_split
from sklearn.model_selection import cross_val_score
from sklearn.model_selection import GridSearchCV
from sklearn.metrics import mean_absolute_error

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

#Machine Learning Algorithms (for now we are not passing in any parameters)
names = ["Bayesian Ridge",
		#"Random Forest"
		#"LASSO"
		#"K Neighbors Regressor",
		#"NuSVR",
		#"AdaBoost Regressor"
		]

clf = [
linear_model.BayesianRidge(n_iter=3),
#ensemble.RandomForestRegressor(n_estimators=6,criterion='mae',random_state=42)
#linear_model.Lasso(alpha=1e-10, max_iter=10000)
#neighbors.KNeighborsRegressor(weights='distance'),
#svm.NuSVR(kernel='linear'),
#ensemble.AdaBoostRegressor(tree.DecisionTreeRegressor(),n_estimators=100)
]

params = [
	[{'n_iter': [3000],
	  'tol': [1e-20],
	  'alpha_1': [1e-9],
	  'alpha_2': [1e-6]}]
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
response['classifiers'] = []

for x in range(0,len(clf)):

	predictions = []
	differences = []
	answers = y_data[:]

	for i in range(0, len(y_data)):

		#split training and test data
		#x_train, x_test, y_train, y_test = train_test_split(x_data[:-1], y_data[i], train_size=train_percent, random_state=42)

		train_amount = math.ceil(len(x_data) * train_percent)
		x_train, x_test, y_train, y_test = x_data[0:train_amount-1], x_data[train_amount:], y_data[i][1:train_amount], y_data[i][train_amount+1:]

		clfg = GridSearchCV(clf[x],params[x],cv=5)
		clfg.fit(x_train,y_train)
		predictions.append(clfg.predict(x_test).tolist())
		answers[i] = np.array(y_test).tolist()

		differences.append(mean_absolute_error(y_test,predictions[i]))
		predictions[i] = predictions[i][-15:]
		answers[i] = answers[i][-15:]

	response['classifiers'].append({'name': names[x], 'score': 0, 'predictions': predictions, 'answers': answers, 'differences': differences, 'best_params': clfg.best_params_})

print(json.dumps(response))