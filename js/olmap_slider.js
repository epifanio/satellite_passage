// define some interesting projections
// WGS 84 / EPSG Norway Polar Stereographic
proj4.defs('EPSG:5939', '+proj=stere +lat_0=90 +lat_ts=90 +lon_0=18 +k=0.994 +x_0=2000000 +y_0=2000000 +datum=WGS84 +units=m +no_defs');
var proj5939 = ol.proj.get('EPSG:5939');
var ex5939 = [-7021620.2399999998, -6741017.03, 10047367.779999999, 8027970.99];
proj5939.setExtent(ex5939);
ol.proj.addProjection(proj5939);

// WGS 84 -- WGS84 - World Geodetic System 1984
proj4.defs('EPSG:4326','+proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees');
var proj4326 = ol.proj.get('EPSG:4326');
var ex4326 = [-90, 30, 90, 90];
proj4326.setExtent(ex4326);
ol.proj.addProjection(proj4326);

// WGS 84 / North Pole LAEA Europe
proj4.defs('EPSG:3575','+proj=laea +lat_0=90 +lon_0=10 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs');
var proj3575 = ol.proj.get('EPSG:3575');
var ex3575 = [-3e+06,-3e+06,7e+06,7e+06];
proj3575.setExtent(ex3575);
ol.proj.addProjection(proj3575);

// WGS 84 / UPS North (N,E)
proj4.defs('EPSG:32661', '+proj=stere +lat_0=90 +lat_ts=90 +lon_0=0 +k=0.994 +x_0=2000000 +y_0=2000000 +datum=WGS84 +units=m +no_defs');
var proj32661 = ol.proj.get('EPSG:32661');
var ex32661 = [-4e+06,-6e+06,8e+06,8e+06];
proj32661.setExtent(ex32661);
ol.proj.addProjection(proj32661);

//var ext = ex5939;
//var prj = proj5939;
var ext = ex32661;
var prj = proj32661;
//var ext = ex3575;
//var prj = proj3575;
//var ext = ex4326;
//var prj = proj4326;

var tromsoLonLat = [19, 68];
var tromsoTrans = ol.proj.transform(tromsoLonLat, "EPSG:4326",  prj);


var layer = {};

// Base layer WMS
layer['base']  = new ol.layer.Tile({
   type: 'base',
   source: new ol.source.TileWMS({ 
       url: 'http://public-wms.met.no/backgroundmaps/northpole.map',
       params: {'LAYERS': 'world', 'TRANSPARENT':'false', 'VERSION':'1.1.1','FORMAT':'image/png', 'SRS':prj}
   })
});
// feature layer KML 
layer['kml1A'] = new ol.layer.Vector({
   title: 'Sentinel-1A',
   source: new ol.source.Vector({
       url: '/sites/satellittdata.metsis.met.no/files/kml/S1A_acquisition_plan_norwAOI.kml',
       format: new ol.format.KML({extractStyles: false, extractAttributes: true}),
   })
})

// feature layer KML 
layer['kml1B'] = new ol.layer.Vector({
   title: 'Sentinel-1B',
   source: new ol.source.Vector({
       url: '/sites/satellittdata.metsis.met.no/files/kml/S1B_acquisition_plan_norwAOI.kml',
       format: new ol.format.KML({extractStyles: false, extractAttributes: true}),
   })
})
// feature layer KML 
layer['kml2A'] = new ol.layer.Vector({
   title: 'Sentinel-2A',
   source: new ol.source.Vector({
       url: '/sites/satellittdata.metsis.met.no/files/kml/S2A_acquisition_plan_norwAOI.kml',
       format: new ol.format.KML({extractStyles: false, extractAttributes: true}),
   })
})

// feature layer KML 
layer['kml2B'] = new ol.layer.Vector({
   title: 'Sentinel-2B',
   source: new ol.source.Vector({
       url: '/sites/satellittdata.metsis.met.no/files/kml/S2B_acquisition_plan_norwAOI.kml',
       format: new ol.format.KML({extractStyles: false, extractAttributes: true}),
   })
})


// build up the map
var map = new ol.Map({
   target: 'map',
   layers: [ layer['base'], 
             layer['kml1A'],
             layer['kml1B'],
             layer['kml2A'],
             layer['kml2B']
           ],
   view: new ol.View({
                 zoom: 2, 
                 minZoom: 2,
                 center: tromsoTrans,
                 projection: prj,
                 extent: ext
   })
});
var layerSwitcher = new ol.control.LayerSwitcher({});
map.addControl(layerSwitcher);
layerSwitcher.showPanel();

//Mouseposition
var mousePositionControl = new ol.control.MousePosition({
   coordinateFormat : function(co) {
      return ol.coordinate.format(co, template = 'lon: {x}, lat: {y}', 2);
   },
   projection : 'EPSG:4326', //Map hat 3857
});
map.addControl(mousePositionControl);

//Define styles for pixel which are not default
// Empty for no feature & out of time range
var styleEmpty = new ol.style.Style({})
// Red for S2 feature with mouse or click            
var styleRed = new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: '#f00',
          width: 1
        }),
        fill: new ol.style.Fill({
          color: 'rgba(255,0,0,0.3)'
        })
      })
// Blue for S1 sea feature with mouse or click            
var styleBlue = new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: '#00f',
          width: 1
        }),
        fill: new ol.style.Fill({
          color: 'rgba(0,0,255,0.3)'
        })
      })
// Green for S1 land feature with mouse or click            
var styleGreen = new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: '#0f0',
          width: 1
        }),
        fill: new ol.style.Fill({
          color: 'rgba(0,255,0,0.3)'
        })
      })

// Define the start/end from the sliders
var timeSelectStart = document.getElementById('timeStart-kml');
var timeSelectEnd = document.getElementById('timeEnd-kml');


// Get the observation time from the kml file
function updateTimeSelection(endChanged) {
   var minObs, maxObs;
   for(var i12=1; i12 <=4; i12++){
      map.getLayers().getArray()[i12].getSource().forEachFeature(function(feature) {
         var obsTime = new Date(feature.get('ObservationTimeStart'));
         if (minObs === undefined || obsTime < minObs)
            minObs = obsTime;
         if (maxObs === undefined || obsTime > maxObs)
            maxObs = obsTime;
      });
   }
   // retrieve the start/end values as number and not string, according to user selection
   // define today
   var startVal = parseInt(timeSelectStart.value);
   var endVal = parseInt(timeSelectEnd.value);
   // make sure that the end time is always before the end time. If not that update the values. 
   if (startVal >= endVal) {
      if (endChanged){
         timeSelectStart.value = endVal;
      } else {
         timeSelectEnd.value = startVal;
      }
   }
   // compute the time selected with the slider
   var selectedTimeStart = new Date((100 - startVal)/100 * minObs + startVal/ 100 * maxObs);
   var selectedTimeEnd = new Date((100 - endVal)/100 * minObs + endVal / 100 * maxObs);
   // loop through features, hide those earlier than time
   for(var i12=1; i12 <=4; i12++){
      map.getLayers().getArray()[i12].getSource().forEachFeature(function(feature) {
         var obsTime = new Date(feature.get('ObservationTimeStart'));
         if (obsTime < selectedTimeStart || obsTime > selectedTimeEnd) {
            feature.setStyle(styleEmpty);
         } else {
            feature.setStyle();
         }
      });
   }
   // print and update the selected date only when moving the slider
   if (endChanged){
      boxEnd.value = selectedTimeEnd;
   if (startVal >= endVal)
      boxStart.value = selectedTimeEnd;
   } else {
      boxStart.value = selectedTimeStart;
   if (startVal >= endVal)
      boxEnd.value = selectedTimeStart;
   }
}
//Update time of the selector
timeSelectStart.onchange = function() {
   updateTimeSelection(false);
};
timeSelectEnd.onchange = function() {
   updateTimeSelection(true);
};

// Define the position of today to set the start value of the slider
function initialize_today(){
   var today = new Date();
   var minObs, maxObs;
   for(var i12=1; i12 <=4; i12++){
      map.getLayers().getArray()[i12].getSource().forEachFeature(function(feature) {
         var obsTime = new Date(feature.get('ObservationTimeStart'));
         if (minObs === undefined || obsTime < minObs)
            minObs = obsTime;
         if (maxObs === undefined || obsTime > maxObs)
            maxObs = obsTime;
      });
   }
   place = (today - minObs)*(100/(maxObs-minObs)); 
   return place;
};


var listenerKey = {};

// kml layer might not be loaded when looking for printing the date: need to listen to
// the kml source until it is ready. 
function listenerAllLayers() {
   if (layer["kml1A"].getSource().getRevision() >= 1 &&
       layer["kml1B"].getSource().getRevision() >= 1 &&
       layer["kml2A"].getSource().getRevision() >= 1 &&
       layer["kml2B"].getSource().getRevision() >= 1) {
      //if all layers are ready then stop listeing for changes
      layer["kml1A"].getSource().unByKey(listenerKey["kml1A"]);
      layer["kml1B"].getSource().unByKey(listenerKey["kml1B"]);
      layer["kml2A"].getSource().unByKey(listenerKey["kml2A"]);
      layer["kml2B"].getSource().unByKey(listenerKey["kml2B"]);
      // do something with the source
      timeSelectStart.value = initialize_today();
      updateTimeSelection(false);
      updateTimeSelection(true);
   }
}

// build elements of listenerKey for each layer
listenerKey["kml1A"] = layer["kml1A"].getSource().on('change', listenerAllLayers);
listenerKey["kml1B"] = layer["kml1B"].getSource().on('change', listenerAllLayers);
listenerKey["kml2A"] = layer["kml2A"].getSource().on('change', listenerAllLayers);
listenerKey["kml2B"] = layer["kml2B"].getSource().on('change', listenerAllLayers);

var viewProjSelect = document.getElementById('view-projection');
function updateViewProjection() {
  var newProj = ol.proj.get(viewProjSelect.value);
  var newProjExtent = newProj.getExtent();
  var newView = new ol.View({
    projection: newProj,
    center: ol.proj.transform(tromsoLonLat, "EPSG:4326",  newProj),
    zoom: 2.5,
    minZoom: 2,
    extent: newProjExtent || undefined
  });
  map.setView(newView);
};

//viewProjSelect.onchange = function() {
//  updateViewProjection();
//};

//updateViewProjection();


var info = $('#info');
window.lara_info = info;

// Create the function that manages the passing and clicking of the mouse. When only passing the doPopup is false, when clicking the doPopup
// is true. In addition when passing by with the mouse the feature changes color. 
var displayFeatureInfo = function(pixel, doPopup) {
// define the four layers for S1A, S1B, S2A and S2B
  var s1a_layer = map.getLayers().getArray()[1];
  var s1b_layer = map.getLayers().getArray()[2];
  var s2a_layer = map.getLayers().getArray()[3];
  var s2b_layer = map.getLayers().getArray()[4];

  if (doPopup) {
  }
  for(var i12=1; i12 <=4; i12++){
     map.getLayers().getArray()[i12].getSource().forEachFeature(function(feature) {
        // for the visible features (depending on time range) get the default style
        if (feature.getStyle() !== styleEmpty) {
           feature.setStyle();
        }
     });
  }   

  var feature = map.forEachFeatureAtPixel(pixel, function(feature,layer) {
// all 2A and 2B: Red
    if(layer === s2a_layer || layer === s2b_layer){
      feature.setStyle(styleRed);
// 1A or 1B with IW mode: Green
    }else if ((layer === s1a_layer || layer === s1b_layer) && feature.get("Mode") === "IW"){
      feature.setStyle(styleGreen);
// 1A or 1B with IW mode: Blue
    }else if ((layer === s1a_layer || layer === s1b_layer) && feature.get("Mode") === "EW"){
      feature.setStyle(styleBlue);
    }
    return feature;
  });

  var layer = map.forEachFeatureAtPixel(pixel, function(feature,layer) {
    return layer;
  });

  if (feature && doPopup) {
    info.popover("destroy");
    info.css({
      display: "",
      left: pixel[0]  + 'px',
      top: pixel[1] + 'px'
    });
    if (layer === s2a_layer || layer === s2b_layer){
       info.popover({
         animation: false,
         trigger: 'manual',
         html: true,
         placement: 'top',
         content: "<table><tr><td>ID                  </td><td>" + feature.get("ID")                   + "</td></tr>"
                       + "<tr><td>Timeliness          </td><td>" + feature.get("Timeliness")           + "</td></tr>"
                       + "<tr><td>Station             </td><td>" + feature.get("Station")              + "</td></tr>"
                       + "<tr><td>Mode                </td><td>" + feature.get("Mode")                 + "</td></tr>"
                       + "<tr><td>ObservationTimeStart</td><td>" + feature.get("ObservationTimeStart") + "</td></tr>"
                       + "<tr><td>ObservationTimeStop </td><td>" + feature.get("ObservationTimeStop")  + "</td></tr>"
                       + "<tr><td>ObservationDuration </td><td>" + feature.get("ObservationDuration")  + "</td></tr>"
                       + "<tr><td>OrbitAbsolute       </td><td>" + feature.get("OrbitAbsolute")        + "</td></tr>"
                       + "<tr><td>OrbitRelative       </td><td>" + feature.get("OrbitRelative")        + "</td></tr>"
                       + "<tr><td>Scenes              </td><td>" + feature.get("Scenes")               + "</td></tr></table>"
       });
    }else if (layer === s1a_layer || layer === s1b_layer){
       info.popover({
         animation: false,
         trigger: 'manual',
         html: true,
         placement: 'top',
         content: "<table><tr><td>SatelliteId         </td><td>" + feature.get("SatelliteId")          + "</td></tr>"
                       + "<tr><td>DatatakeId          </td><td>" + feature.get("DatatakeId")           + "</td></tr>"
                       + "<tr><td>Mode                </td><td>" + feature.get("Mode")                 + "</td></tr>"
                       + "<tr><td>Swath               </td><td>" + feature.get("Swath")                + "</td></tr>"
                       + "<tr><td>Polarisation        </td><td>" + feature.get("Polarisation")         + "</td></tr>"
                       + "<tr><td>ObservationTimeStart</td><td>" + feature.get("ObservationTimeStart") + "</td></tr>"
                       + "<tr><td>ObservationTimeStop </td><td>" + feature.get("ObservationTimeStop")  + "</td></tr>"
                       + "<tr><td>ObservationDuration </td><td>" + feature.get("ObservationDuration")  + "</td></tr>"
                       + "<tr><td>OrbitAbsolute       </td><td>" + feature.get("OrbitAbsolute")        + "</td></tr>"
                       + "<tr><td>OrbitRelative       </td><td>" + feature.get("OrbitRelative")        + "</td></tr></table>"
       });
  }
    info.popover("show");
  } else if (doPopup) {
    info.popover('destroy');
    info.css({
      display: 'none'
    });
  } 
};

map.on('pointermove', function(evt) {
  if (evt.dragging) {
    info.popover('destroy');
     return;
  }
  displayFeatureInfo(map.getEventPixel(evt.originalEvent), false);
});

map.on('click', function(evt) {
  displayFeatureInfo(evt.pixel, true);
});
