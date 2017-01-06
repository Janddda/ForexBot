#Imports
import numpy as np
import matplotlib.pyplot as plt
import math

#Data
data = np.genfromtxt(r"C:\Users\Justin\Downloads\HISTDATA_COM_ASCII_EURUSD_M12016\DAT_ASCII_EURUSD_M1_2016.csv",delimiter=";", usecols = (1,2,3,4), max_rows=5000) #Change this to whatever file is needed and adjust usecols. Currently loads OHLC

#Train/Test ratios
train_percent = .7
train_count = math.ceil(len(data)*train_percent)
test_count = len(data)-train_count

#Number of candlesticks to look at per Y value
n = 3

#Possible Y values (note: these may change depending on the data loaded above)
OPEN = 0;
HIGH = 1;
LOW = 2;
CLOSE = 3;

#Selected Y value
y_type = 1;

#x_train data

x_train = np.concatenate(data[0:n])

for x in range(1,train_count-n):
	x_train = np.vstack((x_train,np.concatenate(data[x:x+n])))

#y_train data

y_train = data[:train_count-n,[y_type]]