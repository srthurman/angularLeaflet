(function() {
    'use strict';

    angular
        .module("map.service", [])
        .factory('mapFactory', mapFactory);

    function mapFactory() {
        let myVar = "myVAR";

        let service = {
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
        };

        return service;

    }

})();