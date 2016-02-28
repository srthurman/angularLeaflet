(function() {
    'use strict';

    angular
        .module("map.service", [])
        .factory('mapFactory', mapFactory);

    function mapFactory() {
        var center = {
            lat: 0,
            lng: 0,
            zoom: 14
        }

        var service = {
            getControls: getControls,
            setCenter: setCenter,
            getBoundingBox: getBoundingBox,
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
            center.lat = lat || 44;
            center.lng = lng || -99;
            center.zoom = zoom || 5;
        };

        function getBoundingBox(rings) {
            console.log("GET BOUNDING BOX");
            var streetGeojson = {
                "type": "Feature",
                "properties": {
                    "name": "Street Search Area",
                },
                "geometry": {
                    "type": "MultiPolygon",
                    "coordinates": [rings]
                }
            };

            var streetSearchArea = L.geoJson(streetGeojson);
            return streetSearchArea.getBounds();
        };

        return service;

    }

})();