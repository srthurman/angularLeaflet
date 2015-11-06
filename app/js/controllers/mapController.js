'use strict';

app.controller("LayersEsriDynamicLayerController", [ "$scope", '$http', function($scope, $http) {
            angular.extend($scope, {
                blockLayer: "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Tracts_Blocks/MapServer/2/query",
                blockVars: {
                    xcoord: -77.016,
                    ycoord: 38.904
                },
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
                
                findBlockLayer: function(blockVars) {
                    if (blockVars.hasOwnProperty('xcoord') && blockVars.hasOwnProperty('ycoord')) {
                        var endURL = "+&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=*&returnGeometry=true&maxAllowableOffset=&geometryPrecision=&outSR=4326&returnIdsOnly=false&returnCountOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&gdbVersion=&returnDistinctValues=false&f=json";
                        return [$scope.blockLayer,"?where=&text=&objectIds=&time=&geometry=",blockVars.xcoord,"+%2C+",blockVars.ycoord,endURL].join('');
                    }
                }
            });
            
            $http.get($scope.findBlockLayer($scope.blockVars)).success(function(data, status) {
                alert("success");
                console.log(status);
                console.log("data");
                console.log(data.features[0].geometry);
            });
        }]);