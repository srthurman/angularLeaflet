(function() {
    'use strict';
    console.log("mapController.js");

/*    app.config(function($logProvider) {
        $logProvider.debugEnabled(false);
    });*/

    angular
        .module("cenblock.directive", [])
        .directive('cenBlock', function(leafletMapDefaults) {
        return {
            restrict: 'E',
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
            controller: ['$scope', '$http', '$q', 'leafletData', 'leafletMapEvents', 'leafletMapDefaults', 'mapFactory', 'blockFactory',
                function($scope, $http, $q, leafletData, leafletMapEvents, leafletMapDefaults, mapFactory, blockFactory) {

                $scope.blockid = '';

                $scope.blockLayerUrl = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_Census2010/MapServer";

                $scope.markers = {};
                
                $scope.eventBroadcast = ['click', 'zoomstart'];

                $scope.layers = blockFactory.setLayers($scope.blockLayerUrl);

                $scope.controls = mapFactory.getControls();

                $scope.center = mapFactory.center;

                leafletData.getLayers().then(function(data) {
                    console.log(data);
                    $scope.baseLayer = data.baselayers.transportation;
                });

                //initialize map
                $scope.initializeMap = function() {
                    console.log(arguments.length);
                    if ($scope.initState && $scope.initCounty && $scope.initTract && $scope.initBlock) {
                        blockFactory.addBlock($scope.blockLayerUrl,  $scope.initState, $scope.initCounty, $scope.initTract, $scope.initBlock)
                        .then(getBlockId);
                    }
                    else if ($scope.initLat && $scope.initLng) {
                        blockFactory.addBlock($scope.blockLayerUrl, $scope.initLng, $scope.initLat)
                        .then(getBlockId);
                    }
                    else {
                        var addressSearchUrl = $scope.getAddressSearchUrl();
                        //mapFactory.setCenter(34.181048,-118.223644);
                        $scope.addAddressSearchResults(addressSearchUrl);
                    };

                };

                function getBlockId(resp) {
                            $scope.blockid = resp;
                            $scope.baseLayer.bringToBack();      
                        }


                //record map click event
                $scope.events = {
                    map: {
                        enable: ['click', 'load', 'zoomstart'],
                        logic: 'broadcast'
                    }
                };


                $scope.findStreet = function(street, geojsonRings) {
                    console.log("FIND STREET");
                    var streetGeojson = {
                        "type": "Feature",
                        "properties": {
                            "name": "Street Search Area",
                        },
                        "geometry": {
                            "type": "MultiPolygon",
                            "coordinates": [geojsonRings]
                        }
                    };

                    var streetSearchArea = L.geoJson(streetSearchArea);
                    console.log(streetSearchArea);
                };

                $scope.addAddressSearchResults = function(searchUrl) {
                    console.log("ADD ADDRESS SEARCH RESULTS");
                    $http.get(searchUrl)
                        .then(function(resp) {
                            console.log("ADDRESS SEARCH RESULTS SUCCESS");

                            if ($scope.initStreet) {
                                $scope.findStreet($scope.initStreet, resp.data.features[0].geometry.rings);
                            };

                            var lat = parseFloat(resp.data.features[0].attributes["CENTLAT"]);
                            var lng = parseFloat(resp.data.features[0].attributes["CENTLON"]);
                            mapFactory.setCenter(lat, lng, 10);
                        });
                };

                $scope.getAddressSearchUrl = function() {
                    console.log("GET ADDRESS URL");
                    var queryLayer = "";
                    var whereClause = "";

                    if ($scope.initZip && $scope.initZip !== '00000' && $scope.initZip.trim().length === 5) {
                        queryLayer = "/8";
                        whereClause = "zcta5='" + $scope.initZip + "'";
                    }
                    else if ($scope.initPlace && $scope.initPlace !== '99999' && $scope.initPlace.trim().length === 5) {
                        queryLayer = "/34";
                        whereClause = "state='" + $scope.initState + "' and place='" + $scope.initPlace + "'";
                    }
                    else if ($scope.initCounty && $scope.initState && $scope.initState.trim().length === 2 && $scope.initCounty.trim().length === 3) {
                        queryLayer = "/100";
                        whereClause = "state='" + $scope.initState + "' and county='" + $scope.initCounty + "'";
                    }
                    else if ($scope.initState && $scope.initState.trim().length === 2) {
                        queryLayer = "/98";
                        whereClause = "state='" + $scope.initState + "'";

                    }
                    else {
                        mapFactory.setCenter(44, -99, 5);
                        return '';
                    };
                    console.log([$scope.blockLayerUrl, queryLayer, "/query?geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&returnCountOnly=false&returnIdsOnly=false&returnGeometry=true&outSR=4326&outFields=*&f=json&where=", encodeURIComponent(whereClause)].join(''));
                    return [$scope.blockLayerUrl, queryLayer, "/query?geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&returnCountOnly=false&returnIdsOnly=false&returnGeometry=true&outSR=4326&outFields=*&f=json&where=", encodeURIComponent(whereClause)].join('');
                };

                ///Event Listeners        
                $scope.$on('leafletDirectiveMap.load', function(event, args) {
                    console.log('MAP LOADED');
                    $scope.initializeMap();
                    var layerPos = {
                        controls: $scope.controls
                    };
                    console.log(layerPos);
                    leafletMapDefaults.setDefaults(layerPos, '');
                });

                $scope.$on('leafletDirectiveMap.click', function(event, args) {
                    //differentiate	between	getting	the	block	code and identifying features
                    var leafEventLatLng = args.leafletEvent.latlng;

                    //$scope.addMarker(leafEventLatLng.lat, leafEventLatLng.lng);
                    $scope.markers = blockFactory.moveMarker(leafEventLatLng.lat, leafEventLatLng.lng);
                    blockFactory.addBlock($scope.blockLayerUrl, leafEventLatLng.lng, leafEventLatLng.lat)
                        .then(getBlockId);
                });

            }]
        }

    });

})();