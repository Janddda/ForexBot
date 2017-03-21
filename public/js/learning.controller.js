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
    $scope.selectedSecondaryGranularity = "M5";

    $scope.candleCount = 650;
    $scope.trainPercent = 0.7;
    $scope.n = 3;

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
                secondary_granularity:$scope.selectedSecondaryGranularity,
                candle_count:$scope.candleCount,
                train_percent:$scope.trainPercent,
                n:$scope.n
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

                    for(var j=0; j<c.predictions.length; j++){
                        c.predictions[j] = c.predictions[j].map(function(x){
                        return x.toFixed(5);
                        });
                    }

                    var data = [];

                    for(var q=1; q<c.answers[0].length; q++){
                        data.push({x:q, y:[c.answers[2][q],c.answers[0][q],c.answers[1][q],c.answers[2][q]]});
                    }

                    var ch = new CanvasJS.Chart(c.name+"Chart",
                    {
                        title: {
                            text: "Candles"
                        },
                        animationEnabled: false,
                        axisX: {
                            interval: 1,
                            intervalType: "number",
                            minimum: 1,
                            maximum: c.answers[0].length
                        },
                        axisY: {
                            minimum: Math.min.apply(Math,c.answers[1]),
                            maximum: Math.max.apply(Math,c.answers[0])
                        },
                        data : [
                        {
                            type: "ohlc",
                            dataPoints: data
                        }
                        ]
                    });

                    ch.render();
                    
                    /*var ctx = document.getElementById(c.name+"Chart");

                    var ch = new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels: new Array(c.predictions[0].length),
                            datasets: [{
                                label: 'High Predictions',
                                data: c.predictions[0],
                                lineTension: 0,
                                fill: true,
                                borderColor: '#2ecc71',
                                borderWidth: 1,
                                pointRadius: 1
                            },
                            {
                                label: 'High Answers',
                                data: c.answers[0],
                                lineTension: 0, 
                                fill: true,
                                borderColor: '#27ae60',
                                borderWidth: 2,
                                pointRadius: 1
                            },
                            {
                                label: 'Low Predictions',
                                data: c.predictions[1],
                                lineTension: 0,
                                fill: true,
                                borderColor: '#e74c3c',
                                borderWidth: 1,
                                pointRadius: 1
                            },
                            {
                                label: 'Low Answers',
                                data: c.answers[1],
                                lineTension: 0, 
                                fill: true,
                                borderColor: '#c0392b',
                                borderWidth: 2,
                                pointRadius: 1
                            },
                            {
                                label: 'Close Predictions',
                                data: c.predictions[2],
                                lineTension: 0,
                                fill: true,
                                borderColor: '#3498db',
                                borderWidth: 1,
                                pointRadius: 1
                            },
                            {
                                label: 'Close Answers',
                                data: c.answers[2],
                                lineTension: 0, 
                                fill: true,
                                borderColor: '#2980b9',
                                borderWidth: 2,
                                pointRadius: 1
                            }]
                        },
                        options: {
                            showLines: true,
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
                                        max: c.answers[0].length,
                                        stepSize: 1
                                    }
                                }]
                            }
                        }
                    }); */

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