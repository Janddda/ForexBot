var app = angular.module('myApp', []);

app.controller('myCtrl', function($scope, $http) {

	/* Members */

	var domain = 'https://api-fxpractice.oanda.com/v1';
	var access_token = '13d85815857b2114bc46b5ca2b9f415f-39f6af6d03fc815c719aac47f33e677f';
	var account_id = '4489830';

	var headers = { "Authorization": "Bearer "+access_token };

	/* Properties */

    $scope.instruments = null;
    $scope.selectedInstrument = null;

    $scope.account = null;

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
    $scope.selectedGranularity = "H1";

    $scope.runUnits = [
        {value: "MINUTE" },
        {value: "HOUR" },
        {value: "DAY" },
        {value: "WEEK" },
        {value: "MONTH" }
    ];

    $scope.candleCount = 50;

    $scope.candlesticks = null;
    $scope.loading = false;

    $scope.showBid = false;
    $scope.showAsk = true;

    /* Methods */

    function getInstruments() {
		$http({
			url: domain+"/instruments",
			method: "GET",
			params: {
				accountId: account_id
			},
			headers: headers
		}).then(function(response) {
			$scope.instruments = response.data.instruments;
			$scope.selectedInstrument = "EUR_USD";
		});
    }

    function getAccountDetails() {
    	$http({
			url: domain+"/accounts",
			method: "GET",
			params: {
				accountId: account_id
			},
			headers: headers
		}).then(function(response) {
			$scope.account = response.data.accounts[0];
		});
    }

    function drawChart() {
    	var chart = new CanvasJS.Chart("chartContainer", {
    		zoomEnabled: true,
    		axisY: {
    			includeZero:false,
    			title: "Prices",
    			prefix: "$ "
    		},
    		data: [
    		{
    			type: "candlestick",
    			dataPoints: $scope.candlesticks.map(function(x){
    				return { x: x.time, y:[x.openAsk,x.highAsk,x.lowAsk,x.closeAsk] };
    			})
    		}
    		]
    	});
    	chart.render();
    }

    /* Commands */

    $scope.getCandles = function() {
    	$scope.loading = true;
    	$http({
			url: domain+"/candles",
			method: "GET",
			params: {
				accountId: account_id,
				instrument: $scope.selectedInstrument,
				granularity: $scope.selectedGranularity,
				count: $scope.candleCount
			},
			headers: headers
		}).then(function(response) {
			$scope.candlesticks = response.data.candles.map(function(x){
				x.time = Date.parse(x.time);
				return x;
			});
			$scope.loading = false;
			drawChart();
		});
    };


    /* Constructor */

    getInstruments();
    getAccountDetails();

});