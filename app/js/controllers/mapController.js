'use strict';

app.controller("LayersEsriDynamicLayerController", [ "$scope", function($scope) {
            angular.extend($scope, {
                dc: {
	            	lat: 38.904,
	                lng: -77.016,
	                zoom: 11
	            },
                markers: {
                    m1: {
                        lat: 38.904,
	                lng: -77.016,
                    }
                },
                layers: {
                    baselayers: {
				    	
				    	transportation: {
					    	name: "Transportation",
					        type: "agsDynamic",
					        url: "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Transportation/MapServer",
					        visible: true,
					        layerOptions: {
					            showOnSelector: true,
					            layers: [],
				                opacity: 0.9
					        }
				    	},
                    },
                    overlays: {
                        stcou: {
					    	name: "StateCounties",
					        type: "agsDynamic",
					        url: "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer",
					        visible: true,
					        layerOptions: {
					            showOnSelector: false,
					            layers: [53], //empty array brings in all layers
				                opacity: 0.5,
				                attribution: "Data courtesy U.S. Census Bureau"
					        }
				    	},
                    }
                },
            });
        }]);