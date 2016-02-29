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
                controller: ['$scope', 'leafletData', 'leafletMapEvents', 'leafletMapDefaults', 'mapFactory', 'blockFactory', 'addressFactory',
                    function($scope, leafletData, leafletMapEvents, leafletMapDefaults, mapFactory, blockFactory, addressFactory) {
                        $scope.blockid = '';

                        $scope.blockLayerUrl = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_Census2010/MapServer";

                        $scope.streetLayerUrl = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Transportation/MapServer";

                        $scope.markers = {};

                        $scope.eventBroadcast = ['click', 'zoomstart'];

                        $scope.layers = blockFactory.setLayers($scope.blockLayerUrl);

                        $scope.controls = mapFactory.getControls();

                        $scope.center = mapFactory.getCenter();

                        leafletData.getLayers()
                            .then(function(data) {
                                console.log(data);
                                $scope.baseLayer = data.baselayers.transportation;
                            });

                        $scope.initializeMap = function(mapObj) {
                            console.log(arguments.length);
                            if ($scope.initState && $scope.initCounty && $scope.initTract && $scope.initBlock) {
                                blockFactory.addBlock($scope.blockLayerUrl, $scope.initState, $scope.initCounty, $scope.initTract, $scope.initBlock)
                                    .then(getBlockId);
                            }
                            else if ($scope.initLat && $scope.initLng) {
                                blockFactory.addBlock($scope.blockLayerUrl, $scope.initLng, $scope.initLat)
                                    .then(getBlockId);
                            }
                            else {
                                var addressSearchUrl = addressFactory.getAddressSearchUrl($scope.blockLayerUrl, $scope.initZip, $scope.initPlace, $scope.initCounty, $scope.initState);
                                //mapFactory.setCenter(34.181048,-118.223644);
                                addressFactory.addAddressSearchResults(addressSearchUrl)
                                    .then(
                                        function(resp) {
                                            addressFactory.addAddressSearchSuccess(resp, $scope.streetLayerUrl, $scope.initStreet, mapObj);
                                        },
                                        requestErrorAlert
                                    );
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
                        $scope.$on('leafletDirectiveMap.load', function(event, args) {
                            leafletData.getMap().then(function(map) {
                                $scope.initializeMap(map);
                            });
                            var layerPos = {
                                controls: $scope.controls
                            };
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

                        //Utility functions
                        function requestErrorAlert() {
                            alert("Oh Noes! There was an error contacting the server!");
                        };
                    }
                ]
            }

        });

})();