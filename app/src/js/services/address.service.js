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
            findStreet: findStreet
        };


        function getAddressSearchUrl(mapUrl, zip, place, county, state) {
            console.log("GET ADDRESS URL");
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
                mapFactory.setCenter(44, -99, 5);
                return '';
            };
            return [mapUrl, queryLayer, "/query?geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&returnCountOnly=false&returnIdsOnly=false&returnGeometry=true&outSR=4326&outFields=*&f=json&where=", encodeURIComponent(whereClause)].join('');
        };

        function addAddressSearchResults(searchUrl, initStreet) {
            console.log("ADD ADDRESS SEARCH RESULTS");
            $http.get(searchUrl)
                .then(function(resp) {
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


        return service;
    }

})();