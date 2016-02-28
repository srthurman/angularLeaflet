(function() {
    'use strict';

    angular
        .module("address.service", [])
        .factory('addressFactory', addressFactory);

    addressFactory.$inject = ['mapFactory', '$http', '$q'];

    function addressFactory(mapFactory, $http, $q) {
        var service = {
            getAddressSearchUrl: getAddressSearchUrl,
            addAddressSearchResults: addAddressSearchResults,
            findStreet: findStreet,
            addAddressSearchSuccess: addAddressSearchSuccess
        };


        function getAddressSearchUrl(mapUrl, zip, place, county, state) {
            //console.log("GET ADDRESS URL");
            var queryLayer = "";
            var whereClause = "";

            if (zip && zip !== '00000' && zip.trim().length === 5) {
                queryLayer = "/8";
                whereClause = "zcta5='" + zip + "'";
            }
            else if (place && place !== '99999' && place.trim().length === 5) {
                queryLayer = "/34";
                whereClause = "state='" + state + "' and place='" + place + "'";
            }
            else if (county && state && state.trim().length === 2 && county.trim().length === 3) {
                queryLayer = "/100";
                whereClause = "state='" + state + "' and county='" + county + "'";
            }
            else if (state && state.trim().length === 2) {
                queryLayer = "/98";
                whereClause = "state='" + state + "'";

            }
            else {
                mapFactory.setCenter();
                return '';
            };
            return [mapUrl, queryLayer, "/query?geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&returnCountOnly=false&returnIdsOnly=false&returnGeometry=true&outSR=4326&outFields=*&f=json&where=", encodeURIComponent(whereClause)].join('');
        };

        function addAddressSearchResults(searchUrl) {
            //console.log("ADD ADDRESS SEARCH RESULTS");
            //console.log("mapObj: ", mapObj);
            //console.log("searchUrl: ", searchUrl);
            return $http.get(searchUrl);
        };

        function addAddressSearchSuccess (resp, streetBaseUrl, street, mapObj) {
            console.log("ADDRESS SEARCH RESULTS SUCCESS");
            console.log(resp);
            if (!resp || !resp.data.features || resp.data.features.length === 0) {
                mapFactory.setCenter();
            }
            else {
                if (street) {
                    findStreet(streetBaseUrl, street, resp.data.features[0].geometry.rings)
                    .then(
                        function(resp) { return streetResultsFuzzySearch(resp, street); }
                    )
                    .then(
                        function(resp) {
                            console.log("RETURN FIND STREET PROMISE");
                            console.log(resp);
                            var streetBounds = resp.getBounds();
                            var sw = streetBounds.getSouthWest();
                            var ne = streetBounds.getNorthEast();
                            var bounds = L.latLngBounds(sw, ne);
                            mapObj.fitBounds(bounds);
                        },
                        function(failResp) {
                            ////console.log("RETURN FIND STREET REJECT");
                            var sw = bBox.getSouthWest();
                            var ne = bBox.getNorthEast();
                            var bounds = L.latLngBounds(sw, ne);
                            mapObj.fitBounds(bounds);
                    });
                }
                else {
                    var lat = parseFloat(resp.data.features[0].attributes["CENTLAT"]);
                    var lng = parseFloat(resp.data.features[0].attributes["CENTLON"]);
                    mapFactory.setCenter(lat, lng, 10);

                };
            };
        }

        function findStreet(baseUrl, street, geojsonRings) {
            //console.log("FIND STREET");
            var searchBounds = mapFactory.getBoundingBox(geojsonRings);
            var searchUrl = getFindStreetSearchUrl(baseUrl, street, searchBounds);
            return $http.get(searchUrl);
        };

        function getFindStreetSearchUrl(urlBase, street, bbox) {
            console.log("getFindStreetSearchUrl");
            //console.log(urlBase, street, bbox);
            var searchBounds = bbox.getWest() + "," + bbox.getSouth() + "," + bbox.getEast() + "," + bbox.getNorth();
            //console.log(searchBounds);
            var geoType = "esriGeometryEnvelope";
            var whereClause = "upper(NAME)+like+'%25" + street.toUpperCase() + "%25'";
            //console.log("pre poststring");
            var poststring = "geometry=" + encodeURIComponent(searchBounds) + "&geometryType=" + geoType + "&mapExtent=" + encodeURIComponent(searchBounds) + "&layers=all:" + encodeURIComponent("2,3,8") + "&layerDefs=" + "2%3A" + whereClause + "%3B3%3A" + whereClause + "%3B8%3A" + whereClause + "&tolerance=1&sr=4326&time=&layerTimeOptions=&imageDisplay=100%2C100%2C96&returnGeometry=true&maxAllowableOffset=&geometryPrecision=&dynamicLayers=&returnZ=false&returnM=false&gdbVersion=&f=json";

            return [urlBase, '/identify?', poststring].join('');
        };

        function streetResultsFuzzySearch(resp, street) {
            console.log("streetResultsFuzzySearch", resp);
            //console.log("FIND STREET RESULTS SUCCESS");                			
            var deferred = $q.defer();
            var results = resp.data.results;
            //console.log(results); 

            var foundStreet = {
                "type": "Feature",
                "properties": {
                    "name": "Zoom To Street",
                },
                "geometry": {
                    "type": "MultiLineString",
                    "coordinates": []
                }
            };
            if (results.length === 0) {
                deferred.reject("No streets found");
            }
            else {
                if (results.length === 1) {
                    foundStreet.geometry.coordinates = results[0].geometry.paths;
                }
                else {
                    //console.log("start fuzzy search");
                    var fuzzyStreet = FuzzySet([street]);
                    var fuzzyStreetResult = [0, "na"];
                    var fuzzyIndex = 0;

                    for (var g = 0, glen = results.length; g < glen; g++) {
                        var res = fuzzyStreet.get(results[g].attributes.NAME, [
                            [0, "na"]
                        ])[0];
                        if (res[0] > fuzzyStreetResult[0]) {
                            fuzzyStreetResult = res;
                            fuzzyIndex = g;
                        }
                    }
                    //var streetPath = results[fuzzyIndex].geometry.paths;
                    foundStreet.geometry.coordinates = results[fuzzyIndex].geometry.paths;
                    //console.log(foundStreet);
                }

                var foundStreetGeojson = L.geoJson(foundStreet);
                console.log("foundStreetGeojson");
                console.log(foundStreetGeojson.getBounds());
                deferred.resolve(foundStreetGeojson);
            }
            return deferred.promise;
        };
        return service;
    }

})();