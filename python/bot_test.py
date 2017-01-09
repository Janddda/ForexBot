#Imports
import numpy as np
import matplotlib.pyplot as plt
import math

from sklearn import svm
from sklearn import tree
from sklearn import neural_network
from sklearn import linear_model
from sklearn.model_selection import train_test_split
from sklearn.model_selection import cross_val_score
from sklearn.model_selection import GridSearchCV

#Data
data = np.genfromtxt(r"C:\Users\Justin\Downloads\HISTDATA_COM_ASCII_EURUSD_M12016\DAT_ASCII_EURUSD_M1_2016.csv",delimiter=";", usecols = (1,2,3,4), max_rows=10000) #Change this to whatever file is needed and adjust usecols. Currently loads OHLC

#Train/Test ratios
train_percent = .7

#Number of candlesticks to look at per Y value
n = 5

#Possible Y values (note: these may change depending on the data loaded above)
OPEN = 0;
HIGH = 1;
LOW = 2;
CLOSE = 3;

#Selected Y value
y_type = 3;

#Param grids for Learning Algorithms

param_grid = [[
	{'loss': ['squared_loss', 'huber'],
	 'penalty': ['none', 'l2', 'l1', 'elasticnet'],
	 'learning_rate': ['constant', 'optimal', 'invscaling']}
],
[
	{'max_features': ['auto', 'sqrt', 'log2']}
]]

#Machine Learning Algorithms (for now we are not passing in any parameters)
clf = [
linear_model.SGDRegressor(penalty='none',learning_rate='constant'),
tree.DecisionTreeRegressor()
]
score = []

#x_data
x_data = np.concatenate(data[0:n])

for x in range(1,len(data)-n-1):
	x_data = np.vstack((x_data,np.concatenate(data[x:x+n])))

#y_data
y_data = data[n:len(data)-1,[y_type]]
y_data = np.ravel(y_data)

#find out if all of our data is correct.
#print(x_data[n][y_type]) #The nth element in training data (including candlesticks n through n+n). Get the y_type value of the first candlestick
#print(y_data[0]) #The y_type value should be equal to the first answer we are looking for. 

#split training and test data
x_train, x_test, y_train, y_test = train_test_split(x_data, y_data, train_size=train_percent)

#plt.plot(range(0,len(y_test)),y_test)

colors = ['red', 'green', 'blue']

for x in range(0,len(clf)):
	y_eval = clf[x].fit(x_train,y_train)
	score.append(cross_val_score(clf[x], x_data, y_data, cv=10))
	#print(GridSearchCV(clf[x], param_grid[x], cv=10).fit(x_data,y_data).best_params_)
	print(np.average(score[x]))
	predictions = clf[x].predict(x_test)
	plt.scatter(range(0,len(y_test)),predictions-y_test, label=clf[x], color=colors[x], alpha=.5)

plt.legend()
plt.show()