#Imports
import numpy as np
import math
import cgi, cgitb

from sklearn import tree

print "Content-type: text/html\n\n"    #for showing print on HTML

data = cgi.FieldStorage()

inputFile = data["inputFile"].value 
x_test = data['xTest'].value

#Data
data = np.genfromtxt(inputFile,delimiter=";", usecols = (1,2,3,4)) #Change this to whatever file is needed and adjust usecols. Currently loads OHLC

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
x_data = np.concatenate(data[0:n])

for x in range(1,len(data)-n-1):
	x_data = np.vstack((x_data,np.concatenate(data[x:x+n])))

#y_data
y_data = data[n:len(data)-1,[y_type]]
y_data = np.ravel(y_data)

#train on input data
clf.fit(x_data,y_data)

#make a prediction based on the input test
print clf.predict(x_test)

