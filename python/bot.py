#Imports
import numpy as np
import sys
import json
import math

from sklearn import linear_model
from sklearn.model_selection import train_test_split
from sklearn.model_selection import cross_val_score

from sklearn import preprocessing

lines = []

for line in sys.stdin:
	lines.append(line)

inputFile = lines[0]
score_threshold = lines[1]

#Data
data = json.loads(inputFile)

#Number of candlesticks to look at per Y value
n = 50

#Possible Y values (note: these may change depending on the data loaded above)
OPEN = 0;
HIGH = 1;
LOW = 2;
CLOSE = 3;

#Selected Y value
y_type = 1;

#Selected CLF
clf = linear_model.BayesianRidge(n_iter=3,compute_score=0)

#x_data
x_data = np.concatenate(data[0:n])

for x in range(1,(len(data)-n)+1):
	x_data = np.vstack((x_data,np.concatenate(data[x:x+n])))

x_data = preprocessing.scale(x_data)

#y_data
y_data = data[n:len(data)]
y_data = [item[y_type] for item in y_data]
y_data = np.ravel(y_data)

#train on input data
clf.fit(x_data[:-1],y_data)

#score data
score = np.average(cross_val_score(clf, x_data, y_data, cv=10))
#print(score)

#make predictionss
x_guess = x_data[-1]
guess = clf.predict(x_guess.reshape(1, -1))

if(float(score) > float(score_threshold)):
	print(guess[0])
else:
	print(0)