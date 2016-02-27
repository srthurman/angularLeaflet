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
            console.trace();
            center.lat = lat;
            center.lng = lng;
            center.zoom = zoom;
        };

        return service;

    }

})();