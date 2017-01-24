var app = angular.module('myApp', []);

app.controller('myCtrl', function($scope, $http) {

	/* Members */

	var domain = 'https://api-fxpractice.oanda.com/v1';
	var access_token = '13d85815857b2114bc46b5ca2b9f415f-39f6af6d03fc815c719aac47f33e677f';
	var account_id = '4489830';

    var postHeaders = {
        "Authorization": "Bearer "+access_token,
        "Content-Type": "text/json" 
    };

	/* Properties */

    $scope.instruments = null;
    $scope.selectedInstrument = null;

    $scope.state = 0;

    $scope.granularities = [
    	{ value: "S5", description: "5 seconds" },
    	{ value: "S10", description: "10 seconds" },
    	{ value: "S15", description: "15 seconds" },
    	{ value: "S30", description: "30 seconds" },
    	{ value: "M1", description: "1 minute" },
    	{ value: "M2", description: "2 minutes" },
    	{ value: "M3", description: "3 minutes" },
    	{ value: "M4", description: "4 minutes" },
    	{ value: "M5", description: "5 minutes" },
    	{ value: "M10", description: "10 minutes" },
    	{ value: "M15", description: "15 minutes" },
    	{ value: "M30", description: "30 minutes" },
    	{ value: "H1", description: "1 hour" },
    	{ value: "H2", description: "2 hours" },
    	{ value: "H3", description: "3 hours" },
    	{ value: "H4", description: "4 hours" },
    	{ value: "H6", description: "6 hours" },
    	{ value: "H8", description: "8 hours" },
    	{ value: "H12", description: "12 hours" },
    	{ value: "D", description: "1 day" },
    	{ value: "W", description: "1 week" },
    	{ value: "M", description: "1 month" }
    ];
    $scope.selectedGranularity = "M1";

    $scope.seekValues = ["Open","High","Low","Close"];

    $scope.candleCount = 5000;
    $scope.trainPercent = 0.7;
    $scope.yValue = "1";
    $scope.n = 50;

    $scope.loading = false;

    $scope.classifiers = null;

    /* Methods */

    function getInstruments() {
		$http({
			url: domain+"/instruments",
			method: "GET",
			params: {
				accountId: account_id
			},
			headers: postHeaders
		}).then(function(response) {
			$scope.instruments = response.data.instruments;
			$scope.selectedInstrument = "EUR_USD";
		});
    }

    function test() {
        $scope.loading = true;
        $http({
            url: "/test",
            method: "POST",
            data: {
                instrument:$scope.selectedInstrument,
                granularity:$scope.selectedGranularity,
                candle_count:$scope.candleCount,
                train_percent:$scope.trainPercent,
                n:$scope.n,
                y_value:$scope.yValue
            }
        }).then(function(response) {
            $scope.classifiers = response.data.message.classifiers.map(function(x){
                x.score = parseFloat(x.score);
                return x;
            });
            $scope.state = 1;
            $scope.loading = false;
            setTimeout(function(){
                for(var i=0; i<$scope.classifiers.length; i++){
                    var c = $scope.classifiers[i];
                    c.predictions = c.predictions.map(function(x){
                        return x.toFixed(5);
                    });
                    var ctx = document.getElementById(c.name+"Chart");
                    if(c.predictions.length > 0 && c.answers.length > 0){
                        var ch = new Chart(ctx, {
                            type: 'line',
                            data: {
                                labels: new Array(c.predictions.length),
                                datasets: [{
                                    label: 'Predictions',
                                    data: c.predictions,
                                    lineTension: 0,
                                    fill: false,
                                    borderColor: '#e74c3c',
                                    borderWidth: 1,
                                    pointRadius: 1
                                },
                                {
                                    label: 'Answers',
                                    data: c.answers,
                                    lineTension: 0, 
                                    fill: false,
                                    borderColor: '#3498db',
                                    borderWidth: 1,
                                    pointRadius: 1
                                }]
                            },
                            options: {
                                scales: {
                                    yAxes: [{
                                        display: true,
                                        ticks: {
                                            beginAtZero:false
                                        }
                                    }],
                                    xAxes: [{
                                        display: true,
                                        position: 'bottom',
                                        ticks: {
                                            min: 0,
                                            max: c.answers.length,
                                            stepSize: 1
                                        }
                                    }]
                                }
                            }
                        });
                    }        
                }
            },1000);
        });
    }

    /* Commands */

    $scope.test = function() {
        test();
    };

    $scope.prediction = function(clf) {
        return (clf.answers[clf.answers.length-1]-clf.predictions[clf.predictions.length-2]).toFixed(5);
    };

    /* Constructor */

    getInstruments();

});