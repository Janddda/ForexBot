#Imports
import numpy as np
import math
import cgi, cgitb
import sys

from sklearn import tree

data = sys.argv;

print(sys.argv)

inputFile = data[0]
x_test = data[1]

#Data
#data = np.genfromtxt(inputFile,delimiter=",", usecols = (0,1,2,3)) #Change this to whatever file is needed and adjust usecols and delimiter. Currently loads OHLC
#data = inputFile

#Number of candlesticks to look at per Y value
n = 5

#Possible Y values (note: these may change depending on the data loaded above)
OPEN = 0;
HIGH = 1;
LOW = 2;
CLOSE = 3;

#Selected Y value
y_type = 3;

#Selected CLF
clf = tree.DecisionTreeRegressor()

#x_data
#x_data = np.concatenate(data[0:n])

#for x in range(1,len(data)-n-1):
#	x_data = np.vstack((x_data,np.concatenate(data[x:x+n])))

#y_data
#y_data = data[n:len(data)-1,[y_type]]
#y_data = np.ravel(y_data)

#train on input data
#clf.fit(x_data,y_data)

#make a prediction based on the input test
#print(clf.predict(x_test))

