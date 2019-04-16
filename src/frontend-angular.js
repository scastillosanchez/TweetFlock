//  This for front-end stuff in Angular

let myApp = angular.module('myApp', ['ngRoute']); // creating angular module

myApp.controller('myController', ['$scope', '$http', function ($scope, $http) { // controller
  $scope.listTweets = [];
  $scope.countries = [0,0,0];
  $scope.retweets = [0,0];
  $scope.followers = [];

  $scope.returnQuery = function () { // pushing ng-model to server which will get tweets based on parameters
    $http.get('/searchQuery', { // push the parameters from the form
      params: {
        keyword: $scope.searchQuery,
        amount: $scope.amtTweets
      }
    }).then(function (response) { // debugging and show export button to get tweets in file
      console.log(response);
      $("#alert").show();
      $(".alert").show().removeClass().addClass("alert alert-success").text("Tweets added to Database!");
    }, function (resError) { // debugging
      console.log(resError)
    })
  };

  $scope.resetQuery = function () { //when the reset button is pressed it refreshes page
    window.location.reload(true);
  };

  $scope.getVisuals = function (tweets) { //will show 3 visualizations through Chart.js
    let length = tweets.length;

    let pie = document.getElementById('pieChart').getContext('2d');
    let doughnut = document.getElementById('doughnutChart').getContext('2d');
    let bar = document.getElementById('barChart').getContext('2d');

    //tweets by country
    for (let i = 0; i < length; i++) {
      if (tweets[i]['place'] == null) {
        $scope.countries[2] += 1;
      } else {
        if (tweets[i]['place']['country_code'] === "US") {
          $scope.countries[0] += 1;
        } else {
          $scope.countries[1] += 1;
        }
      }
    }
    let countryPC = new Chart(pie, {
      type: 'pie',
      data: {
        datasets: [{
          label: "Tweets by Country",
          data: $scope.countries,
          backgroundColor: [
            'rgba(255, 99, 132, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(255, 206, 86, 0.2)',
          ]
        }],

        labels : ['US', 'Other', 'NA']
      }
      //options: options
    });


    //amount of retweets
    let indiv = "";
    for (let i = 0; i < length; i++) {
      indiv = tweets[i]['text'].split(" ");
      //console.log(indiv[0]);
      if (indiv[0] === 'RT') {
        $scope.retweets[0] += 1;
      } else {
        $scope.retweets[1] += 1;
      }
    }

    let retweetDC = new Chart(doughnut, {
      type: 'doughnut',
      data: {
        datasets: [{
          label: "Amount of Retweets",
          data: $scope.retweets,
          backgroundColor: [
            'rgba(255, 99, 132, 0.2)',
            'rgba(54, 162, 235, 0.2)',
          ]
        }],
        labels : ["Retweets", "Original Tweets"]
      }
    });

    //top 5 counts of followers
    let top5count = [];
    let top5names = [];


    for (let i = 0; i < length; i++) {
      $scope.followers.push({username: tweets[i]['user']['screen_name'], followers: tweets[i]['user']['followers_count']});
    }

    //console.log($scope.followers);
    $scope.followers.sort(function(a, b){return b.followers-a.followers});
    //console.log($scope.followers);
    for (let i = 0; i < 5; i++) {
      top5count.push($scope.followers[i]['followers']);
      top5names.push($scope.followers[i]['username']);
    }
    //console.log(top5);

    let topBC = new Chart(bar, {
      type: 'bar',
      data: {
        datasets: [{
          label: "Followers Count",
          data: top5count,
          backgroundColor: [
            'rgba(255, 99, 132, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(255, 206, 86, 0.2)',
            'rgba(75, 192, 192, 0.2)',
            'rgba(153, 102, 255, 0.2)'
          ]
        }],
        labels : top5names
      },
      options: {
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: true
            }
          }]
        }
      }
    });
  };

  $scope.showTweets = function () { //get tweets from back-end
    $http.get('/collectTweets').then(function (response) {
      $scope.listTweets = response.data;
      //console.log($scope.listTweets);
      let length = $scope.listTweets.length;
      if(length === 0) {
        $("#alert").show();
        $(".alert").show().removeClass().addClass("alert alert-danger").text("Please get tweets before trying to show them!");
      } else {
        $(".container-tweets").fadeIn('slow');
        $scope.getVisuals($scope.listTweets);
      }

      console.log(response);
    }, function (resError) {
      $("#alert").show();
      $(".alert").show().removeClass().addClass("alert alert-danger").text("Please get tweets before trying to show them!");
      console.log(resError);
    });
  };

  $scope.getFile = function () { // function to get export file
    $http.get('/exportFile', { // get file type
      params: {
        file: $scope.fileConversion //from form
      }
    }).then(function (response) { // debug for success
      console.log(response);
      if (response.data.length === 0) {
        $("#alert").show();
        $(".alert").show().removeClass().addClass("alert alert-success").text("File successfully exported and downloaded!");
      } else {
        $("#alert").show();
        $(".alert").show().removeClass().addClass("alert alert-danger").text(response.data);
      }
    }, function (resError) { // debug for error
      console.log(resError);
      $("#alert").show();
      $(".alert").show().removeClass().addClass("alert alert-danger").text("File export was unsuccessful, please try again!");
    })
  }
}]);
