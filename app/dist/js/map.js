"use strict";

(function() {
    "use strict";
    console.log("mapController.js");
    angular.module("cenblock.directive", []).directive("cenBlock", function(leafletMapDefaults) {
        return {
            restrict: "E",
            replace: true,
            scope: {
                initLat: "@lat",
                initLng: "@lng",
                initState: "@state",
                initCounty: "@county",
                initTract: "@tract",
                initBlock: "@block",
                initStreet: "@street",
                initZip: "@zip",
                initPlace: "@place"
            },
            templateUrl: "templates/leafletMap.html",
            controller: [ "$scope", "$http", "$q", "leafletData", "leafletMapEvents", "leafletMapDefaults", "mapFactory", "blockFactory", function($scope, $http, $q, leafletData, leafletMapEvents, leafletMapDefaults, mapFactory, blockFactory) {
                $scope.blockid = "";
                $scope.blockLayerUrl = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_Census2010/MapServer";
                $scope.markers = {
                    m1: {
                        lng: -118.25,
                        lat: 34.05
                    }
                };
                $scope.eventBroadcast = [ "click", "zoomstart" ];
                $scope.layers = blockFactory.setLayers($scope.blockLayerUrl);
                $scope.controls = mapFactory.getControls();
                $scope.center = {
                    lat: 0,
                    lng: 0,
                    zoom: 14
                };
                $scope.setCenter = function(lat, lng, zoom) {
                    console.log("SET CENTER");
                    console.trace();
                    $scope.center.lat = lat;
                    $scope.center.lng = lng;
                    $scope.center.zoom = zoom;
                };
                leafletData.getLayers().then(function(data) {
                    console.log(data);
                    $scope.baseLayer = data.baselayers.transportation;
                });
                $scope.initializeMap = function() {
                    console.log(arguments.length);
                    if ($scope.initState && $scope.initCounty && $scope.initTract && $scope.initBlock) {
                        blockFactory.addBlock($scope.blockLayerUrl, $scope.initState, $scope.initCounty, $scope.initTract, $scope.initBlock).then(function(resp) {
                            $scope.blockid = resp;
                        });
                    } else if ($scope.initLat && $scope.initLng) {
                        blockFactory.addBlock($scope.blockLayerUrl, $scope.initLng, $scope.initLat).then(function(resp) {
                            $scope.blockid = resp;
                        });
                    } else {
                        var addressSearchUrl = $scope.getAddressSearchUrl();
                        $scope.addAddressSearchResults(addressSearchUrl);
                    }
                };
                $scope.events = {
                    map: {
                        enable: [ "click", "load", "zoomstart" ],
                        logic: "broadcast"
                    }
                };
                $scope.findStreet = function(street, geojsonRings) {
                    console.log("FIND STREET");
                    var streetGeojson = {
                        type: "Feature",
                        properties: {
                            name: "Street Search Area"
                        },
                        geometry: {
                            type: "MultiPolygon",
                            coordinates: [ geojsonRings ]
                        }
                    };
                    var streetSearchArea = L.geoJson(streetSearchArea);
                    console.log(streetSearchArea);
                };
                $scope.addAddressSearchResults = function(searchUrl) {
                    console.log("ADD ADDRESS SEARCH RESULTS");
                    $http.get(searchUrl).then(function(resp) {
                        console.log("ADDRESS SEARCH RESULTS SUCCESS");
                        if ($scope.initStreet) {
                            $scope.findStreet($scope.initStreet, resp.data.features[0].geometry.rings);
                        }
                        var lat = parseFloat(resp.data.features[0].attributes["CENTLAT"]);
                        var lng = parseFloat(resp.data.features[0].attributes["CENTLON"]);
                        $scope.setCenter(lat, lng, 10);
                    });
                };
                $scope.getAddressSearchUrl = function() {
                    console.log("GET ADDRESS URL");
                    var queryLayer = "";
                    var whereClause = "";
                    if ($scope.initZip && $scope.initZip !== "00000" && $scope.initZip.trim().length === 5) {
                        queryLayer = "/8";
                        whereClause = "zcta5='" + $scope.initZip + "'";
                    } else if ($scope.initPlace && $scope.initPlace !== "99999" && $scope.initPlace.trim().length === 5) {
                        queryLayer = "/34";
                        whereClause = "state='" + $scope.initState + "' and place='" + $scope.initPlace + "'";
                    } else if ($scope.initCounty && $scope.initState && $scope.initState.trim().length === 2 && $scope.initCounty.trim().length === 3) {
                        queryLayer = "/100";
                        whereClause = "state='" + $scope.initState + "' and county='" + $scope.initCounty + "'";
                    } else if ($scope.initState && $scope.initState.trim().length === 2) {
                        queryLayer = "/98";
                        whereClause = "state='" + $scope.initState + "'";
                    } else {
                        $scope.setCenter(44, -99, 5);
                        return "";
                    }
                    console.log([ $scope.blockLayerUrl, queryLayer, "/query?geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&returnCountOnly=false&returnIdsOnly=false&returnGeometry=true&outSR=4326&outFields=*&f=json&where=", encodeURIComponent(whereClause) ].join(""));
                    return [ $scope.blockLayerUrl, queryLayer, "/query?geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&returnCountOnly=false&returnIdsOnly=false&returnGeometry=true&outSR=4326&outFields=*&f=json&where=", encodeURIComponent(whereClause) ].join("");
                };
                $scope.$on("leafletDirectiveMap.load", function(event, args) {
                    console.log("MAP LOADED");
                    $scope.initializeMap();
                    var layerPos = {
                        controls: $scope.controls
                    };
                    console.log(layerPos);
                    leafletMapDefaults.setDefaults(layerPos, "");
                });
                $scope.$on("leafletDirectiveMap.click", function(event, args) {
                    var leafEventLatLng = args.leafletEvent.latlng;
                    $scope.markers = blockFactory.moveMarker(leafEventLatLng.lat, leafEventLatLng.lng);
                    blockFactory.addBlock($scope.blockLayerUrl, leafEventLatLng.lng, leafEventLatLng.lat).then(function(resp) {
                        $scope.blockid = resp;
                    });
                });
            } ]
        };
    });
})();

"use strict";

"use strict";

(function() {
    var app = angular.module("census.block", [ "leaflet-directive", "map.service", "block.service", "cenblock.directive" ]);
})();

"use strict";

"use strict";

(function() {
    "use strict";
    angular.module("block.service", []).factory("blockFactory", blockFactory);
    blockFactory.$inject = [ "mapFactory", "$http", "$q" ];
    function blockFactory(mapFactory, $http, $q) {
        var layers = {};
        var markers = {};
        var service = {
            moveMarker: moveMarker,
            addBlock: addBlock,
            setLayers: setLayers
        };
        function setLayers() {
            layers = {
                baselayers: {
                    transportation: {
                        name: "Transportation",
                        type: "agsDynamic",
                        url: "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Transportation/MapServer",
                        visible: true,
                        layerOptions: {
                            showOnSelector: false,
                            layers: [],
                            opacity: .9
                        }
                    }
                },
                overlays: {
                    stcou: {
                        name: "State / Counties",
                        type: "agsDynamic",
                        url: "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer",
                        visible: true,
                        layerOptions: {
                            layers: [ 53 ],
                            opacity: .5,
                            attribution: "Data courtesy U.S. Census Bureau"
                        }
                    }
                }
            };
        }
        function moveMarker(lat, lng) {
            console.log("ADD MARKER");
            markers = {
                m1: {
                    lat: lat,
                    lng: lng
                }
            };
        }
        function findBlockXY(blockLayerUrl, xcoord, ycoord) {
            console.log("FIND BLOCK XY");
            var endURL = "+&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=*&returnGeometry=true&maxAllowableOffset=&geometryPrecision=&outSR=4326&returnIdsOnly=false&returnCountOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&gdbVersion=&returnDistinctValues=false&f=json";
            return [ blockLayerUrl, "/18/query", "?where=&text=&objectIds=&time=&geometry=", xcoord, "+%2C+", ycoord, endURL ].join("");
        }
        function findBlockByCode(blockLayerUrl, state, county, tract, block) {
            console.log("FIND BLOCK BY CODE");
            var endURL = "%27&geometryType=esriGeometryPoint&inSR=3857&spatialRel=esriSpatialRelIntersects" + "&returnCountOnly=false&returnIdsOnly=false&returnGeometry=true&outSR=4326&outFields=*&f=json";
            return [ blockLayerUrl, "/18/query", "?where=geoid%3D%27", state, county, tract, block, endURL ].join("");
        }
        function addBlock() {
            console.log("ADD BLOCK");
            var deferred = $q.defer();
            var findBlock;
            var args = Array.prototype.slice.apply(arguments);
            if (args.length === 2) {
                var xcoord = args[0];
                var ycoord = args[1];
                console.log(xcoord, ycoord);
                findBlock = findBlockXY(mapUrl, xcoord, ycoord);
            } else if (args.length === 4) {
                var state = args[0];
                var county = args[1];
                var tract = args[2];
                var block = args[3];
                findBlock = findBlockByCode(mapUrl, state, county, tract, block);
            }
            console.log(findBlock);
            $http.get(findBlock).then(function(resp) {
                console.log("ADD BLOCK SUCCESS");
                console.log(resp.data.features[0]);
                var blockID = resp.data.features[0].attributes["GEOID"];
                var lat = parseFloat(resp.data.features[0].attributes["CENTLAT"]);
                var lng = parseFloat(resp.data.features[0].attributes["CENTLON"]);
                var blockGeom = resp.data.features[0].geometry.rings;
                var blockGeojson = {
                    type: "FeatureCollection",
                    features: [ {
                        type: "Feature",
                        properties: {},
                        geometry: {
                            type: "Polygon",
                            coordinates: blockGeom
                        }
                    } ]
                };
                mapFactory.setCenter(lat, lng, 14);
                setOverlay(blockGeojson);
                deferred.resolve(blockID);
            });
            return deferred.promise;
        }
        function setOverlay(geojson) {
            console.log("SET OVERLAYS");
            layers.overlays = {
                blockBoundary: {
                    name: "Block Boundary",
                    type: "geoJSONShape",
                    visible: true,
                    doRefresh: true,
                    data: geojson,
                    layerOptions: {
                        style: {
                            color: "#000000",
                            fillColor: "#0FF",
                            weight: 5,
                            opacity: 1,
                            fillOpacity: .25
                        }
                    },
                    layerParams: {
                        showOnSelector: false
                    }
                },
                blockOutline: {
                    name: "Block Outline",
                    type: "geoJSONShape",
                    visible: true,
                    doRefresh: true,
                    data: geojson,
                    layerOptions: {
                        style: {
                            color: "#0FF",
                            fillColor: "#0FF",
                            weight: 7,
                            fillOpacity: 0,
                            opacity: 1,
                            dashArray: "1, 15"
                        }
                    },
                    layerParams: {
                        showOnSelector: false
                    }
                }
            };
        }
        return service;
    }
})();

"use strict";

(function() {
    "use strict";
    angular.module("map.service", []).factory("mapFactory", mapFactory);
    function mapFactory() {
        var service = {
            getControls: getControls
        };
        function getControls() {
            return {
                scale: true,
                layers: {
                    visible: true,
                    position: "topright",
                    collapsed: true
                }
            };
        }
        return service;
    }
})();