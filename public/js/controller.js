var app = angular.module('myApp', []);

app.controller('myCtrl', function($scope, $http) {

	/* Members */

	var domain = 'https://api-fxpractice.oanda.com/v1';
	var access_token = '13d85815857b2114bc46b5ca2b9f415f-39f6af6d03fc815c719aac47f33e677f';
	var account_id = '4489830';

	var headers = { 
        "Authorization": "Bearer "+access_token   
    };

    var postHeaders = {
        "Authorization": "Bearer "+access_token,
        "Content-Type": "application/x-www-form-urlencoded" 
    };

	/* Properties */

    $scope.instruments = null;
    $scope.selectedInstrument = null;

    $scope.trades = null;
    $scope.transactions = null;
    $scope.watchers = null;

    $scope.account = null;

    $scope.state = 0;
    $scope.order = null;

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

    $scope.prices = null;

    $scope.candleCount = 50;

    $scope.candlesticks = null;
    $scope.loading = false;

    $scope.showBid = false;
    $scope.showAsk = true;

    /* Methods */

    function getWatchers() {
        $http({
            url: "/watchers",
            method: "GET",
            params: {
            }
        }).then(function(response) {
            $scope.watchers = response.data.watchers;
        });
    }

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

    function getPrices() {

        var instruments = "";
        for(var i=0; i<$scope.trades.length; i++){
            if(instruments.indexOf($scope.trades[i].instrument)==-1){
                instruments+=$scope.trades[i].instrument;
                instruments+="%2C";
            }
        }
        instruments=instruments.slice(0, -3);

        if(instruments.length > 0) {

            $http({
                url: domain+"/prices?instruments="+instruments,
                method: "GET",
                params: {
                },
            headers: postHeaders
            }).then(function(response) {
                $scope.prices = response.data.prices;
            });

        }

    }

    function getTrades() {
        $http({
            url: domain+"/accounts/"+account_id+"/trades",
            method: "GET",
            params: {
            },
            headers: headers
        }).then(function(response) {
            $scope.trades = response.data.trades;
        });
    }

    function getTransactions() {
        $http({
            url: domain+"/accounts/"+account_id+"/transactions",
            method: "GET",
            params: {
            },
            headers: headers
        }).then(function(response) {
            $scope.transactions = response.data.transactions;
        });
    }

    function placeOrder() {
        $http({
            url: domain+"/accounts/"+account_id+"/orders",
            method: "POST",
            data: 
                "instrument="+$scope.order.instrument+"&"+
                "units="+$scope.order.units+"&"+
                "side="+$scope.order.side+"&"+
                "type="+$scope.order.type+"&"+
                "trailingStop="+$scope.order.trailingStop,
            headers: postHeaders
        }).then(function(response) {
            getTrades();
            getTransactions();
            getAccountDetails();
            $scope.state = 0;
        });
    }

    function getAccountDetails() {
    	$http({
			url: domain+"/accounts/"+account_id,
			method: "GET",
			params: {
			},
			headers: headers
		}).then(function(response) {
			$scope.account = response.data;
            getTrades();
		});
    }

    function updateTrades() {
        if($scope.prices != null && $scope.trades != null){
            for(var i=0; i<$scope.trades.length; i++) {
                for(var j=0; j<$scope.prices.length; j++) {
                    if($scope.prices[j].instrument == $scope.trades[i].instrument) {
                        if($scope.trades[i].side=='buy'){
                            $scope.trades[i].live_price = $scope.prices[j].bid;
                            $scope.trades[i].is_good = $scope.trades[i].price < $scope.trades[i].live_price;
                            $scope.trades[i].profit = (($scope.trades[i].live_price-$scope.trades[i].price)*$scope.trades[i].units).toFixed(4);
                        }else{
                            $scope.trades[i].live_price = $scope.prices[j].ask;
                            $scope.trades[i].is_good = $scope.trades[i].price > $scope.trades[i].live_price;
                            $scope.trades[i].profit = (($scope.trades[i].price-$scope.trades[i].live_price)*$scope.trades[i].units).toFixed(4);
                        }
                    }
                }
            }
        }
    }

    function updateOrder() {

        $http({
            url: domain+"/prices?instruments="+$scope.order.instrument,
            method: "GET",
            params: {
            },
            headers: postHeaders
        }).then(function(response) {
            $scope.order.price = response.data.prices[0];
            if($scope.order.side == 'buy'){
                $scope.order.cost = ($scope.order.price.ask * $scope.order.units) * $scope.account.marginRate;
            }else{
                $scope.order.cost = ($scope.order.price.bid * $scope.order.units) * $scope.account.marginRate;
            }
            if($scope.order.side=='buy') {
                $scope.order.stopLoss = ($scope.order.price.ask-($scope.order.trailingStop*0.001)).toFixed(4);
            } else {
                $scope.order.stopLoss = ($scope.order.price.bid+($scope.order.trailingStop*0.001)).toFixed(4);
            }
        });

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

    $scope.newOrder = function() {
        $scope.order = {
            instrument: "EUR_USD",
            units: 100,
            side: "buy",
            type: "market",
            trailingStop: 20
        };
        $scope.state = 1;
        updateOrder();
    };

    $scope.closeTrade = function(trade) {
        $http({
            url: domain+"/accounts/"+account_id+"/trades/"+trade.id,
            method: "DELETE",
            headers: postHeaders
        }).then(function(response) {
            getTrades();
            getTransactions();
            getAccountDetails();
            $scope.state = 0;
        });
    };

    $scope.placeOrder = function() {
        placeOrder();
    };

    /* Constructor */

    getInstruments();
    getAccountDetails();
    getTransactions();
    getWatchers();

    /* Timers */
    window.setInterval(function(){
        getPrices();
        updateTrades();
    },5000);

    window.setInterval(function(){
        getPrices();
        getTrades();
        updateTrades();
        getTransactions();
    },120000);

    window.setInterval(function(){
        if($scope.state==1){
            updateOrder();
        }
    },1000);

});