(function() {
    'use strict';

    angular
        .module("block.service", [])
        .factory('blockFactory', blockFactory);

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
                    },
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
                    },
                }
            }
            
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
            }
            else if (args.length === 5) {
                var state = args[1];
                var county = args[2];
                var tract = args[3];
                var block = args[4];
                findBlock = findBlockByCode(mapUrl, state, county, tract, block);
            };

            console.log("findBlock URL: ",findBlock);
            $http.get(findBlock)
                .then(function(resp) {
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
            console.log("layers: ", layers)        
        };
        return service;

    }

})();