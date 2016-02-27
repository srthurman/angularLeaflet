(function() {
    //this module is called by ng-app in index.html
    //it ties all the other needed modules together
    var app = angular.module("census.block",
    ["leaflet-directive",
    "map.service",
    "block.service",
    "cenblock.directive"]);
})();