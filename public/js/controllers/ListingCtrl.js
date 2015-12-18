var app = angular.module('Crowdsourcing', ['ngRoute'], function ($locationProvider) {
    /* necessary to get the current url */
    $locationProvider.html5Mode(true);
});

var indexOf = function (needle) {
    if (typeof Array.prototype.indexOf === 'function') {
        indexOf = Array.prototype.indexOf;
    } else {
        indexOf = function (needle) {
            var i = -1, index = -1;

            for (i = 0; i < this.length; i++) {
                if (this[i] === needle) {
                    index = i;
                    break;
                }
            }

            return index;
        };
    }

    return indexOf.call(this, needle);
};

app.controller('ListingController', function ($scope, $location, $http) {

    //get current url to get relevant listing
    //returns relative path => /listing/
    var path = $location.path();
    //request from server
    $http.get("/api" + path).then(
        function success(listing_info) {
            // this callback will be called asynchronously
            // when the response is available
            $scope.listing = listing_info.data;

            console.log($scope.listing);
        }, function error(response) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            $scope.error = "Could not fetch the listing";
        });
    $http.get("/api/user").success(function (data) {
        $scope.currentUser = data;
    });
    var alertPrompt = function () {
       // var title = "";
       // var pic = "";
        var questions = [];
        var questionsUserAlreadyAnswered = [];

        //get title
        //$http.get('/api/getrandomquestion').success(function (question) {
        //    title = question.description;
        //});

        //get picture
        $http.get('/api/listing/:street/:buildingNumber/:apartmentNumber/getrandompic').success(function (picture) {
            //should be changed to JSON format
            $scope.pic = picture;
        });


        $http.get('/api/questions').success(function (qs) {
            questions = qs;
        });

        $http.get('/api/listing/getQuestionsOfUserInListing/' + $scope.currentUser._id + '/' + $scope.listing._id).success(function (userqs) {
            questionsUserAlreadyAnswered = userqs;
        });

        function setQuestion() {
            var q; // question we will eventually ask the user
            for (q in questions) {
                if (!(q._id in questionsUserAlreadyAnswered)) {
                    /* the user has NOT answered this question yet -> so we can ask him now! */
                    $scope.title = q.description;
                    $scope.questionToAsk = q;
                }
            }
            // we have already asked this user ALL our questions in this specific listing
        }
        setQuestion();

        function chooseRandomPic() {
            var myPix = ["images/ss1.jpg", "images/ss2.jpg", "images/ss3.jpg"];
            var randomNum = Math.floor(Math.random() * myPix.length);
            return myPix[randomNum];
        }

        setTimeout(function () {
            sweetAlert({
                    //	title: "Is this room furnished?",
                    title: $scope.title,
                    imageUrl: $scope.pic,
                    //imageUrl: chooseRandomPic(),
                    imageSize: '600x600',
                    showCancelButton: true,
                    cancelButtonText: "No",
                    confirmButtonColor: "#00ff00", // green
                    confirmButtonText: "Yes",
                    closeOnConfirm: false,
                    closeOnCancel: false
                },
                function (isConfirm) {
                    $http.put('/api/user/addListingAndQuestionToUser/' + $scope.currentUser._id + '/' + $scope.listing._id + '/' + $scope.questionToAsk._id);
                    $http.put('/api/listing/addUserAndQuestionToListing/' + $scope.currentUser._id + '/' + $scope.listing._id + '/' + $scope.questionToAsk._id);
                    if (isConfirm) {
                        sweetAlert("Thanks!", "Your input will help others", "success");
                    }
                    else {
                        sweetAlert("Thanks!", "Your input will help others", "success");
                    }
                });
        }, 5000); // 5 seconds

    };

    $scope.hide = false;
    $scope.reportListing = function () {

        console.log($scope.listing);
        console.log($scope.currentUser);

        /* check if the user has reported this listing before */
        if (indexOf.call($scope.listing.reportedUsersIDs, $scope.currentUser._id) > -1) {
            sweetAlert("Error", "You have already reported this listing", "error");
        }

        /* the user has not reported this listing yet -> report it*/
        else {
            $http.put("/api" + path + "/incrementFlagCount").success(function () {
                sweetAlert("Thank you!", "This listing has been reported", "success");
                $scope.hide = true;
            });

            /* add this user to the reportUsers for this listing */
            $http.put("/api" + path + "/addReportedUser/" + $scope.currentUser._id + "/" + $scope.listing._id);
        } // TODO: user currently undefined because the call /api/user doesn't work - talk to Lior
    };
    // $scope.hasReportedListing = true;

    alertPrompt();
});





