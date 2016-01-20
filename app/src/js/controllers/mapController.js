(function() {
    'use strict';
    console.log("mapController.js");

    var app = angular.module("demoapp", ["leaflet-directive"]);

/*    app.config(function($logProvider) {
        $logProvider.debugEnabled(false);
    });*/

    app.factory('blockUtils', function() {
        var hi = "hi";

        function sayHi() {
            return hi;
        }

        return {
            sayHi: sayHi,
            hello: hi
        }
    });

    app.directive('cenBlock', function(leafletMapDefaults) {
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
            controller: function($scope, $http, $q, leafletData, leafletMapEvents, blockUtils, leafletMapDefaults) {
                //console.log(blockUtils.sayHi());
                var bu = blockUtils;
                console.log("BU");
                console.log(bu);
                //console.log(leafletMapEvents.getAvailableMapEvents());
                //leafletData.getMap().then(function(map) {
                //    console.log("MAP");
                //    console.log(map);
                //});

                $scope.blockid = '';

                $scope.blockLayerUrl = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_Census2010/MapServer";

                $scope.markers = {
                    m1: {
                        lng: -118.25,
                        lat: 34.05
                    }
                };
                
                $scope.eventBroadcast = ['click', 'zoomstart'];

                $scope.layers = {
                    baselayers: {

                        transportation: {
                            name: "Transportation",
                            type: "agsDynamic",
                            url: "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Transportation/MapServer",
                            visible: true,
                            layerOptions: {
                                showOnSelector: false,
                                layers: [],
                                opacity: 0.9
                            }
                        },
                    },
                    overlays: {
                        stcou: {
                            name: "State / Counties",
                            type: "agsDynamic",
                            url: "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer",
                            visible: true,
                            layerOptions: {
                                layers: [53], //empty array brings in all layers
                                opacity: 0.5,
                                attribution: "Data courtesy U.S. Census Bureau"
                            }
                        },
                    }
                };

                $scope.controls = {
                    scale: true
                };

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

                $scope.setOverlay = function(geojson) {
                    console.log("SET OVERLAYS");
                    $scope.layers.overlays['blockBoundary'] = {
                        name: "Block Boundary",
                        type: 'geoJSONShape',
                        visible: true,
                        doRefresh: true,
                        data: geojson,
                        layerOptions: {
                            style: {
                                color: '#000000',
                                "fillColor": "#0FF",
                                weight: 5,
                                opacity: 1,
                                fillOpacity: 0.25
                            }
                        },
                        layerParams: {
                            showOnSelector: false
                        }
                    };

                    $scope.layers.overlays['blockOutline'] = {
                        name: "Block Outline",
                        type: 'geoJSONShape',
                        visible: true,
                        doRefresh: true,
                        data: geojson,
                        layerOptions: {
                            style: {
                                color: '#0FF',
                                "fillColor": "#0FF",
                                weight: 7,
                                fillOpacity: 0,
                                opacity: 1,
                                dashArray: "1, 15"
                            }
                        },
                        layerParams: {
                            showOnSelector: false
                        }
                    };

                };

                leafletData.getLayers().then(function(data) {
                    console.log(data);
                    $scope.baseLayer = data.baselayers.transportation;
                });

                //initialize map
                $scope.initializeMap = function() {
                    console.log(arguments.length);
                    if ($scope.initState && $scope.initCounty && $scope.initTract && $scope.initBlock) {
                        $scope.addBlock($scope.initState, $scope.initCounty, $scope.initTract, $scope.initBlock);
                    }
                    else if ($scope.initLat && $scope.initLng) {
                        $scope.addBlock($scope.initLng, $scope.initLat);
                    }
                    else {
                        var addressSearchUrl = $scope.getAddressSearchUrl();
                        //$scope.setCenter(34.181048,-118.223644);
                        $scope.addAddressSearchResults(addressSearchUrl);
                    };

                };




                //record map click event
                $scope.events = {
                    map: {
                        enable: ['click', 'load', 'zoomstart'],
                        logic: 'broadcast'
                    }
                };

                $scope.addMarker = function(lat, lng) {
                    console.log("ADD MARKER");
                    $scope.markers = {
                        m1: {
                            lat: lat,
                            lng: lng
                        }
                    }
                };

                $scope.addBlock = function() {
                    console.log("ADD BLOCK");
                    var findBlock;
                    var args = Array.prototype.slice.apply(arguments);
                    if (args.length === 2) {
                        var xcoord = args[0];
                        var ycoord = args[1];
                        console.log(xcoord, ycoord);
                        findBlock = $scope.findBlockXY(xcoord, ycoord);
                    }
                    else if (args.length === 4) {
                        var state = args[0];
                        var county = args[1];
                        var tract = args[2];
                        var block = args[3];
                        findBlock = $scope.findBlockByCode(state, county, tract, block);
                    };

                    console.log(findBlock);
                    $http.get(findBlock)
                        .then(function(resp) {
                            console.log("ADD BLOCK SUCCESS");
                            console.log(resp.data.features[0]);
                            $scope.blockid = resp.data.features[0].attributes["GEOID"];
                            var lat = parseFloat(resp.data.features[0].attributes["CENTLAT"]);
                            var lng = parseFloat(resp.data.features[0].attributes["CENTLON"]);
                            var blockGeom = resp.data.features[0].geometry.rings;
                            var blockGeojson = {
                                "type": "FeatureCollection",
                                "features": [{
                                    "type": "Feature",
                                    "properties": {},
                                    "geometry": {
                                        "type": "Polygon",
                                        "coordinates": blockGeom
                                    }
                                }]
                            };

                            $scope.setCenter(lat, lng, 14);
                            $scope.setOverlay(blockGeojson);
                            $scope.baseLayer.bringToBack();
                        });

                };

                $scope.findBlockXY = function(xcoord, ycoord) {
                    console.log("FIND BLOCK XY");
                    var endURL = "+&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=*&returnGeometry=true&maxAllowableOffset=&geometryPrecision=&outSR=4326&returnIdsOnly=false&returnCountOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&gdbVersion=&returnDistinctValues=false&f=json";
                    return [$scope.blockLayerUrl, "/18/query", "?where=&text=&objectIds=&time=&geometry=", xcoord, "+%2C+", ycoord, endURL].join('');
                };

                $scope.findBlockByCode = function(state, county, tract, block) {
                    console.log("FIND BLOCK BY CODE");
                    var endURL = "%27&geometryType=esriGeometryPoint&inSR=3857&spatialRel=esriSpatialRelIntersects" + "&returnCountOnly=false&returnIdsOnly=false&returnGeometry=true&outSR=4326&outFields=*&f=json";
                    return [$scope.blockLayerUrl, "/18/query", "?where=geoid%3D%27", state, county, tract, block, endURL].join('');
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
                            $scope.setCenter(lat, lng, 10);
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
                        $scope.setCenter(44, -99, 5);
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
                        controls: {
                            layers: {
                                visible: true,
                                position: 'bottomright',
                                collapsed: true,
                            },
                        }
                    };
                    leafletMapDefaults.setDefaults(layerPos, '');
                });

                $scope.$on('leafletDirectiveMap.click', function(event, args) {
                    //differentiate	between	getting	the	block	code and identifying features
                    var leafEventLatLng = args.leafletEvent.latlng;

                    $scope.addMarker(leafEventLatLng.lat, leafEventLatLng.lng);

                    $scope.addBlock(leafEventLatLng.lng, leafEventLatLng.lat);
                });

            }
        }

    });

})();