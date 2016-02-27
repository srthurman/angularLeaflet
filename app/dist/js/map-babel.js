"use strict";

(function () {
    'use strict';

    console.log("mapController.js");

    /*    app.config(function($logProvider) {
            $logProvider.debugEnabled(false);
        });*/

    angular.module("cenblock.directive", []).directive('cenBlock', function (leafletMapDefaults) {
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
            controller: ['$scope', '$http', '$q', 'leafletData', 'leafletMapEvents', 'leafletMapDefaults', 'mapFactory', 'blockFactory', 'addressFactory', function ($scope, $http, $q, leafletData, leafletMapEvents, leafletMapDefaults, mapFactory, blockFactory, addressFactory) {

                $scope.blockid = '';

                $scope.blockLayerUrl = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_Census2010/MapServer";

                $scope.markers = {};

                $scope.eventBroadcast = ['click', 'zoomstart'];

                $scope.layers = blockFactory.setLayers($scope.blockLayerUrl);

                $scope.controls = mapFactory.getControls();

                $scope.center = mapFactory.center;

                leafletData.getLayers().then(function (data) {
                    console.log(data);
                    $scope.baseLayer = data.baselayers.transportation;
                });

                //initialize map
                $scope.initializeMap = function () {
                    console.log(arguments.length);
                    if ($scope.initState && $scope.initCounty && $scope.initTract && $scope.initBlock) {
                        blockFactory.addBlock($scope.blockLayerUrl, $scope.initState, $scope.initCounty, $scope.initTract, $scope.initBlock).then(getBlockId);
                    } else if ($scope.initLat && $scope.initLng) {
                        blockFactory.addBlock($scope.blockLayerUrl, $scope.initLng, $scope.initLat).then(getBlockId);
                    } else {
                        var addressSearchUrl = addressFactory.getAddressSearchUrl();
                        //mapFactory.setCenter(34.181048,-118.223644);
                        addressFactory.addAddressSearchResults(addressSearchUrl, $scope.initStreet);
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

                ///Event Listeners       
                $scope.$on('leafletDirectiveMap.load', function (event, args) {
                    console.log('MAP LOADED');
                    $scope.initializeMap();
                    var layerPos = {
                        controls: $scope.controls
                    };
                    console.log(layerPos);
                    leafletMapDefaults.setDefaults(layerPos, '');
                });

                $scope.$on('leafletDirectiveMap.click', function (event, args) {
                    //differentiate	between	getting	the	block	code and identifying features
                    var leafEventLatLng = args.leafletEvent.latlng;

                    //$scope.addMarker(leafEventLatLng.lat, leafEventLatLng.lng);
                    $scope.markers = blockFactory.moveMarker(leafEventLatLng.lat, leafEventLatLng.lng);
                    blockFactory.addBlock($scope.blockLayerUrl, leafEventLatLng.lng, leafEventLatLng.lat).then(getBlockId);
                });
            }]
        };
    });
})();
"use strict";
"use strict";

(function () {
    //this module is called by ng-app in index.html
    //it ties all the other needed modules together
    var app = angular.module("census.block", ["leaflet-directive", "map.service", "block.service", "address.service", "cenblock.directive"]);
})();
'use strict';

(function () {
    'use strict';

    angular.module("address.service", []).factory('addressFactory', addressFactory);

    addressFactory.$inject = ['mapFactory', '$http', '$q'];

    function addressFactory(mapFactory, $http, $q) {
        var service = {
            getAddressSearchUrl: getAddressSearchUrl,
            addAddressSearchResults: addAddressSearchResults,
            findStreet: findStreet
        };

        function getAddressSearchUrl(mapUrl, zip, place, county, state) {
            console.log("GET ADDRESS URL");
            var queryLayer = "";
            var whereClause = "";

            if (zip && zip !== '00000' && zip.trim().length === 5) {
                queryLayer = "/8";
                whereClause = "zcta5='" + zip + "'";
            } else if (place && place !== '99999' && place.trim().length === 5) {
                queryLayer = "/34";
                whereClause = "state='" + state + "' and place='" + place + "'";
            } else if (county && state && state.trim().length === 2 && county.trim().length === 3) {
                queryLayer = "/100";
                whereClause = "state='" + state + "' and county='" + county + "'";
            } else if (state && state.trim().length === 2) {
                queryLayer = "/98";
                whereClause = "state='" + state + "'";
            } else {
                mapFactory.setCenter(44, -99, 5);
                return '';
            };
            return [mapUrl, queryLayer, "/query?geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&returnCountOnly=false&returnIdsOnly=false&returnGeometry=true&outSR=4326&outFields=*&f=json&where=", encodeURIComponent(whereClause)].join('');
        };

        function addAddressSearchResults(searchUrl, initStreet) {
            console.log("ADD ADDRESS SEARCH RESULTS");
            $http.get(searchUrl).then(function (resp) {
                console.log("ADDRESS SEARCH RESULTS SUCCESS");

                if (initStreet) {
                    findStreet(initStreet, resp.data.features[0].geometry.rings);
                };

                var lat = parseFloat(resp.data.features[0].attributes["CENTLAT"]);
                var lng = parseFloat(resp.data.features[0].attributes["CENTLON"]);
                mapFactory.setCenter(lat, lng, 10);
            });
        };

        function findStreet(street, geojsonRings) {
            console.log("FIND STREET");
            var streetGeojson = {
                "type": "Feature",
                "properties": {
                    "name": "Street Search Area"
                },
                "geometry": {
                    "type": "MultiPolygon",
                    "coordinates": [geojsonRings]
                }
            };

            var streetSearchArea = L.geoJson(streetSearchArea);
            console.log(streetSearchArea);
        };

        return service;
    }
})();
'use strict';

(function () {
    'use strict';

    angular.module("block.service", []).factory('blockFactory', blockFactory);

    blockFactory.$inject = ['mapFactory', '$http', '$q'];

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
                            layers: [], //empty array brings in all layers
                            opacity: 0.9
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
                            layers: [53],
                            opacity: 0.5,
                            attribution: "Data courtesy U.S. Census Bureau"
                        }
                    }
                }
            };

            return layers;
        };

        function moveMarker(lat, lng) {
            console.log("ADD MARKER");
            markers = {
                m1: {
                    lat: lat,
                    lng: lng
                }
            };

            return markers;
        };

        function findBlockXY(blockLayerUrl, xcoord, ycoord) {
            console.log("FIND BLOCK XY");
            var endURL = "+&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=*&returnGeometry=true&maxAllowableOffset=&geometryPrecision=&outSR=4326&returnIdsOnly=false&returnCountOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&gdbVersion=&returnDistinctValues=false&f=json";
            return [blockLayerUrl, "/18/query", "?where=&text=&objectIds=&time=&geometry=", xcoord, "+%2C+", ycoord, endURL].join('');
        };

        function findBlockByCode(blockLayerUrl, state, county, tract, block) {
            console.log("FIND BLOCK BY CODE");
            var endURL = "%27&geometryType=esriGeometryPoint&inSR=3857&spatialRel=esriSpatialRelIntersects" + "&returnCountOnly=false&returnIdsOnly=false&returnGeometry=true&outSR=4326&outFields=*&f=json";
            return [blockLayerUrl, "/18/query", "?where=geoid%3D%27", state, county, tract, block, endURL].join('');
        };

        function addBlock(mapUrl) {
            console.log("ADD BLOCK");
            console.log("mapUrl", mapUrl);
            var deferred = $q.defer();
            var findBlock = "";
            var args = Array.prototype.slice.apply(arguments);
            console.log(args);
            if (args.length === 3) {
                var xcoord = args[1];
                var ycoord = args[2];
                console.log("X,Y Coords", xcoord, ycoord);
                console.log(xcoord, ycoord);
                findBlock = findBlockXY(mapUrl, xcoord, ycoord);
            } else if (args.length === 5) {
                var state = args[1];
                var county = args[2];
                var tract = args[3];
                var block = args[4];
                findBlock = findBlockByCode(mapUrl, state, county, tract, block);
            };

            console.log("findBlock URL: ", findBlock);
            $http.get(findBlock).then(function (resp) {
                console.log("ADD BLOCK SUCCESS");
                console.log(resp.data.features[0]);
                var blockID = resp.data.features[0].attributes["GEOID"];
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

                mapFactory.setCenter(lat, lng, 14);
                setOverlay(blockGeojson);
                deferred.resolve(blockID);
            });
            return deferred.promise;
        };

        function setOverlay(geojson) {
            console.log("SET OVERLAYS");
            layers.overlays = {
                blockBoundary: {
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
                },
                blockOutline: {
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
                }
            };
            console.log("layers: ", layers);
        };
        return service;
    }
})();
'use strict';

(function () {
    'use strict';

    angular.module("map.service", []).factory('mapFactory', mapFactory);

    function mapFactory() {
        var center = {
            lat: 0,
            lng: 0,
            zoom: 14
        };

        var service = {
            getControls: getControls,
            setCenter: setCenter,
            center: center
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
        };

        function setCenter(lat, lng, zoom) {
            console.log("SET CENTER");
            center.lat = lat;
            center.lng = lng;
            center.zoom = zoom;
        };

        return service;
    }
})();
