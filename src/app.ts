// OpenLayers.ProxyHost = "proxy?url=";
// OpenLayers.ImgPath = "images/openlayers/";

// var RecaptchaOptions = {
//   lang: languageCode,
//   theme: 'blackglass'
// };

import { LayersJson } from './layers';
import TimeSlider from './time-slider';

// declare var UNREDD;
// declare var messages;

// interface Date {
//   setISO8601(a: string): boolean;
// }

let languageCode = 'en', // TODO
    layers_json = {}; // TODO

let messages = { data_source: "Source", months: null }; // TODO

let UNREDD = {
  allLayers: {},
  visibleLayers: [],
  queryableLayers: [],
  timeDependentLayers: [],
  mapContexts: {},
  fb_toolbar: {},
  stats_toolbar: {},
  times: [],

  Layer: null,
  wmsServers: [],
  Context: null,
  maxResolution: null,
  maxExtent: null,
  restrictedExtent: null,
  map: null,
  layerInfo: null,
  customInit: null
};

UNREDD.Layer = function(layerId, layerDefinition) {
  this.name = layerId
  this.configuration = layerDefinition;
  
  // set WMS servers urls
  let baseUrl = layerDefinition.baseUrl,
      urls = [];

  if ((/^http:/).test(baseUrl)) {
    // If LayerDefinition is an absolute URL, don't use UNREDD.wmsServers
    urls = [baseUrl];
  } else {
    let urlsLength = UNREDD.wmsServers.length;
    for (let i = 0; i < urlsLength; i++) {
      let server = UNREDD.wmsServers[i];
      urls.push(server + baseUrl);
    }
  }
  
  // Set WMS paramaters that are common to all layers
  let wmsParams = { layers: layerDefinition.wmsName, format: layerDefinition.imageFormat, transparent: true };

  // Add custom wms parameters
  let wmsParameters = layerDefinition.wmsParameters;
  for (let paramName in wmsParameters) {
    if (wmsParameters.hasOwnProperty(paramName)) {
      wmsParams[paramName] = wmsParameters[paramName];
    }
  }

  // Create the OpenLayers object for this layer
  this.olLayer = new OpenLayers.Layer.WMS(
    layerId,
    urls,
    wmsParams,
    { transitionEffect: 'resize', removeBackBufferDelay: 0, isBaseLayer: false, 'buffer': 0, visibility: layerDefinition.visible === 'true', projection: 'EPSG:900913', noMagic: true, wrapDateLine: true }
  );
}

UNREDD.Context = function(contextId, contextDefinition)
{
  /*
  contextDefinition object example:

  "administrativeUnits":{
    "id": "context_id",
    "infoFile": "administrative_boundaries_def.html",
    "label": "<spring:message code="admin_units" />",
    "layers": ["administrativeUnits", "administrativeUnits_simp"],
    "inlineLegendUrl": "/geoserver_drc/wms?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=20&HEIGHT=20&LAYER=unredd:admin_units&TRANSPARENT=true"
  }
  */

  let nLayers = 0;

  this.name = contextId;
  this.configuration = contextDefinition;
  this.layers = [];

  this.setVisibility = function(active) {
    for (let i = 0; i < nLayers; i++) {
      this.layers[i].olLayer.setVisibility(active);
      this.configuration.active = active;
    }
  }

  if (contextDefinition.layers) {
    nLayers = contextDefinition.layers.length;
    console.log('nLayers = ' + nLayers);
    for (let i = 0; i < nLayers; i++) {
      let layerName = contextDefinition.layers[i];
      this.layers.push(UNREDD.allLayers[layerName]);
        if (contextDefinition.layersCustomParams && contextDefinition.layersCustomParams[layerName]) {
          UNREDD.allLayers[layerName].olLayer.mergeNewParams(contextDefinition.layersCustomParams[layerName]);
        }
     }
  }

  this.hasLegend = (function() {
    for (let i = 0; i < nLayers; i++) {
      if (this.layers[i].configuration.hasOwnProperty('legend')) return true;
    }
    return false;
  }).call(this);
}

Date.prototype['setISO8601'] = function(string) {
  let regexp = "([0-9]{4})(-([0-9]{2})(-([0-9]{2})" +
               "(Z|(([-+])([0-9]{2}):([0-9]{2})))?)?)?)?",
      d = string.match(new RegExp(regexp));
  if (d) {
    let date = new Date(+d[1], 0, 1),
        offset = 0,
        time;
  
    if (d[3])  { date.setMonth(+d[3] - 1); }
    if (d[5])  { date.setDate(+d[5]); }
    if (d[7])  { date.setHours(+d[7]); }
    if (d[8])  { date.setMinutes(+d[8]); }
    if (d[10]) { date.setSeconds(+d[10]); }
    if (d[12]) { date.setMilliseconds(Number("0." + d[12]) * 1000); }
    if (d[14]) {
      offset = (Number(d[16]) * 60) + Number(d[17]);
      offset *= ((d[15] === '-') ? 1 : -1);
    }
  
    offset -= date.getTimezoneOffset();
    time = (Number(date) + (offset * 60 * 1000));
  
    this.setTime(Number(time));
    return true;
  } else {
    return false;
  }
};

let isoDateString = function(d) {
  // 2000-01-01T00:00:00.000Z
  function pad(n) {
    return n < 10 ? '0' + n : n;
  }
  return d.getUTCFullYear() + '-'
    + pad(d.getUTCMonth() + 1) + '-'
    + pad(d.getUTCDate()) + 'T'
    + pad(d.getUTCHours()) + ':'
    + pad(d.getUTCMinutes()) + ':'
    + pad(d.getUTCSeconds()) + '.'
    + pad(d.getUTCMilliseconds()) + 'Z';
};

$(document).ready(function() {
  // disable text selection on Explorer (done with CSS in other browsers)
  document.body.onselectstart = function() { return false; };
});

$(window).load(function() {
  let parseLayersJson,
      openLayersOptions,
      styleMap, // TODO: check if the following ones can be local to some function
      highlightLayer,
      showInfo,
      setLayersTime,
      selectedDate,
      legendOn = false,
      year,
      infoControl,
      getClosestPastDate,
      getClosestFutureDate,
      getLocalizedDate,
      updateActiveLayersPane,
      mapContexts = {},
      setContextVisibility,
      resizeMapDiv;

  // Set map div height
  resizeMapDiv = function() {
    var bannerHeight = $('#banner').height() + $('#toolbar').height();

    $('#map').css('top', bannerHeight);
    $('#map').css('height', $(window).height() - bannerHeight);
    $('#map').css('width', $(window).width());
  }
  
  $(window).resize(function() {
    resizeMapDiv();
  });

  resizeMapDiv();
  
  setContextVisibility = function(context, active) {
    context.setVisibility(active);

    var icon = $('#' + context.name + '_inline_legend_icon');
    if (active) {
      icon.addClass('on');
      icon.click(function(event) {
        openLegend($('#' + context.name + '_legend'));
        event.stopPropagation();
        return false;
      });
    } else {
      icon.removeClass('on');
      icon.off('click');
      icon.click(function(event) {
        event.stopPropagation();
        return false;
      });
    }
  };
  
  // Initialize UNREDD.wmsServers to this same server, in case it is not defined or empty
  if (!UNREDD.wmsServers || typeof UNREDD.wmsServers === "undefined" || !UNREDD.wmsServers.length) {
    UNREDD["wmsServers"] = [""];
  };
  
  openLayersOptions = {
    theme:             null,
    projection:        new OpenLayers.Projection("EPSG:900913"),
    displayProjection: new OpenLayers.Projection("EPSG:4326"),
    units:             "m",
    maxResolution:     UNREDD.maxResolution,
    maxExtent:         UNREDD.maxExtent,
    restrictedExtent:  UNREDD.restrictedExtent,
    allOverlays:       true,
    controls:          [
      new OpenLayers.Control.Navigation({ dragPanOptions:{ enableKinetic: true } }),
      new OpenLayers.Control.Scale()
    ]
  };

  UNREDD.map = new OpenLayers.Map('map', openLayersOptions);

  parseLayersJson = function(data_: LayersJson) {
    let setupAllContexts,
        setLegends,
        loadContextGroups;

    // Create layers objects
    $.each(data_.layers, function(i, layerDefinition) {
      var layerId = layerDefinition.id;
      var layer = new UNREDD.Layer(layerId, layerDefinition);
      var oldIsoTimeRegexp = new RegExp("([0-9]{4})-01-01T00:00:00\\.000Z"); /** See wmsTime hack **/

      if (layerDefinition.visible) {
        UNREDD.visibleLayers.push(layer.olLayer);
      }

      UNREDD.allLayers[layerId] = layer;
      if (layerDefinition.queryable) {
        UNREDD.queryableLayers.push(layer.olLayer);
      }
      if (typeof layer.configuration.wmsTime !== 'undefined') {
        /** Backwards-compatibility hack: convert former ISO times to simple years **/
        var times = layer.configuration.wmsTime.split(",");
        for(i=0; i < times.length; i++) {
          var match = times[i].match(oldIsoTimeRegexp);
          if (match) {
            times[i] = match[1];
          }
        }
        layer.configuration.wmsTime = times.join(",");
        /** end-of-hack **/
        UNREDD.timeDependentLayers.push(layer);
      }
    });

    // Create context objects
    $.each(data_.contexts, function(i, contextDefinition) {
      var contextId = contextDefinition.id;
      var context = new UNREDD.Context(contextId, contextDefinition);
      UNREDD.mapContexts[contextId] = context;
    });

    var contextGroups = data_.contextGroups;

    setupAllContexts = function() {
      // look for active contexts
      $.each(UNREDD.mapContexts, function(contextName, context) {
        var active = typeof context.configuration.active !== 'undefined' && context.configuration.active;
        setContextVisibility(context, active);
      });
    };

    updateActiveLayersPane = function() {
      var //div,
      table, tr, td, td2, layers, inlineLegend, transparencyDiv;
      // empty the active_layers div (layer on the UI -> context here)
      $('#active_layers_pane div').empty();

      table = $('<table style="width:90%;margin:auto"></table>');
      $('#active_layers_pane div').append(table);

      $.each(UNREDD.mapContexts, function(contextName, context) {
        var contextConf = context.configuration;
      
        if (contextConf.active) {
          // First row: inline legend and context name
          tr = $('<tr></tr>');

          if (contextConf.hasOwnProperty('inlineLegendUrl')) {
            td = $('<td style="width:20px"></td>');
            inlineLegend = $('<img class="inline-legend" src="' + UNREDD.wmsServers[0] + contextConf.inlineLegendUrl + '">');
            td.append(inlineLegend);
            tr.append(td);
            td2 = $('<td></td>');
          } else {
            td2 = $('<td colspan="2"></td>');
          }
          td2.append(contextConf.label);
          tr.append(td2);
          table.append(tr);

          // Another row
          tr = $('<tr></tr>');
          transparencyDiv = $('<div style="margin-top:4px; margin-bottom:12px;" id="' + contextName + '_transparency_slider"></div>');
          td = $('<td colspan="2"></td>');
          td.append(transparencyDiv);
          tr.append(td);
          table.append(tr);

          layers = contextConf.layers;

          (function(contextLayers) {
            $(transparencyDiv).slider({
              min: 0,
              max: 100,
              value: 100,
              slide: function(event, ui) {
                $.each(contextLayers, function(n, layer) {
                  layer.olLayer.setOpacity(ui.value / 100);
                });
              }
            });
          }(context.layers));
        }
      });
    };

    // Add the legend images to the legend pane.
    // This implementation works only if two contexts don't have a layer in common.
    // A better implementation would have to scan all the active contexts and see which layers should be visible
    setLegends = function(context, contextIsActive) {
      $.each(context.layers, function(n, layer) {
        var //legendFile,
        layerConf = layer.configuration,
        table,
        legendName;

        if (layerConf.visible && typeof layerConf.legend !== "undefined") {
          //legendFile = layerDef.legend;
          legendName = context.name + '_legend';

          if (!contextIsActive) {
            $('#' + legendName).remove();
          } else {
            table  = '<table class="layer_legend" id="' + legendName + '">';
            table += '<tr class="legend_header">';
            table += '<td class="layer_name">' + layerConf.label + '</td>';
          
            if (typeof layerConf.sourceLink !== "undefined") {
              table += '<td class="data_source_link"><span class="lang" id="data_source">' + messages.data_source + ':</span> <a target="_blank" href="' + layerConf.sourceLink + '">' + layerConf.sourceLabel + '</a></td>';
            } else {
              table += "<td></td>";
            }
            table += '</tr>';
            table += '<tr class="legend_image">';
            table += '<td colspan="2" style="width:100%;background-color:white"><img src="static/loc/' + languageCode + '/images/' + layerConf.legend + '" /></td>';
            table += '</tr>';
            table += '</table>';
          }

          $('#legend_pane_content').append(table);
        }
      });
    };

    // Though recursive and ready for n level groupings with some adjustments, this function
    // is meant to work with three level grouping of contexts
    // TODO: use some templating engine?
    loadContextGroups = function(contextGroups, level, element) {
      $.each(contextGroups.items, function(contextGroupName, contextGroupDefinition) {
        var innerElement = null,
            accordionHeader,
            contextsDiv,
            header,
            contextName,
            tr,
            td1,
            td2,
            td3,
            td4,
            infoButton,
            inlineLegend,
            active,
            context,
            contextConf,
            checkbox;

        if (contextGroupDefinition.hasOwnProperty('group')) {
          // it's a group
          if (level === 0) {
            // it's an accordion header
            if (typeof contextGroupDefinition.group.infoFile !== 'undefined') {
              // accordion header has a info file - we add info button
              accordionHeader = $('<div style="position:relative" class="accordion_header"><a style="width:190px" href="#">' + contextGroupDefinition.group.label
                + '</a></div>');
              infoButton = $('<a style="position:absolute;top:3px;right:7px;width:16px;height:16px;padding:0;" class="layer_info_button" href="static/loc/' + languageCode + '/html/' + contextGroupDefinition.group.infoFile + '"></a>')
              accordionHeader.append(infoButton);
            
              // prevent accordion item from expanding when clicking on the info button
              infoButton.click(function(event) {
                event.stopPropagation();
              });
              
              infoButton.fancybox({
                'autoScale' : false,
                'openEffect' : 'elastic',
                'closeEffect' : 'elastic',
                'type': 'ajax',
                'overlayOpacity': 0.5
              });
            } else {
              accordionHeader = $("<div class=\"accordion_header\"><a href=\"#\">" +  contextGroupDefinition.group.label + "</a></div>");
            }
            element.append(accordionHeader);
            contextsDiv = $("<div class=\"context_buttonset\"></div>");
            innerElement = $('<table style="width:100%;border-collapse:collapse"></table>');

            contextsDiv.append(innerElement);
            element.append(contextsDiv);
          } else {
            // we are inside of an accordion element
            header = $("<div><a style=\"color:white;\" href=\"#\">" + contextGroupDefinition.group.label + "</a></div>");
            element.append(header);
            innerElement = $('<table class="second_level" style="width:100%"></table>');
            element.append(innerElement);
          }

          loadContextGroups(contextGroupDefinition.group, level + 1, innerElement);
        } else {
          // it's a context in a group
          if (element !== null) {
            contextName = contextGroupDefinition.context;
            active = UNREDD.mapContexts[contextName].configuration.active;
            
            context = UNREDD.mapContexts[contextName];
            contextConf = context.configuration;

            if (typeof context !== "undefined" && typeof context.configuration.layers !== "undefined") {

              tr = $('<tr class="layer_row">');

              if (contextConf.hasOwnProperty('inlineLegendUrl')) {
                // context has an inline legend
                td1 = $('<td style="width:20px">');
                inlineLegend = $('<img class="inline-legend" src="' + UNREDD.wmsServers[0] + contextConf.inlineLegendUrl + '">');
                td1.append(inlineLegend);
              } else if (context.hasLegend) {
                // context has a legend to be shown on the legend pane - we add a link to show the legend pane
                if (active) {
                  td1 = $('<td style="font-size:9px;width:20px;height:20px"><a id="' + contextName + '_inline_legend_icon" class="inline_legend_icon on"></a></td>');
                  // add the legend to the legend pane (hidden when page loads)
                  setLegends(context, true);
                } else {
                  td1 = $('<td style="font-size:9px;width:20px;height:20px"><a id="' + contextName + '_inline_legend_icon" class="inline_legend_icon"></a></td>');
                }
              } else {
                td1 = $('<td></td>');
              }

              checkbox = $('<div class="checkbox" id="' + contextName + "_checkbox" + '"></div>');
              if (active) {
                checkbox.addClass('checked');
              }
              td2 = $('<td style="width:16px"></td>');
              td2.append(checkbox);

              td3 = $('<td style="color:#FFF">');
              td3.text(contextConf.label);
              
              // Add date for label if time dependant layer
              var layerName = context.configuration.layers[0];
              if (UNREDD.allLayers[layerName].configuration.wmsTime) {
                let datespan = $('<span id="' + layerName + '_date"></span>"');
                td3.append(datespan);
              }
              
              td4 = $('<td style="width:16px;padding:0">');

              if (typeof contextConf.infoFile !== 'undefined') { // TODO: put previous line inside this
                infoButton = $('<a class="layer_info_button" id="' + contextName + '_info_button" href="static/loc/' + languageCode + '/html/' + contextConf.infoFile + '"></a>');
                td4.append(infoButton);
              }
              if (td1) {
                tr.append(td1);
              }
              tr.append(td2, td3, td4);

              element.append(tr);

              // The :hover pseudo-selector on non-anchor elements is known to make IE7 and IE8 slow in some cases
              /*
              tr.mouseenter(function() {
                tr.addClass('hover');
              }).mouseleave(function() {
                tr.removeClass('hover');
              });
              */

              (function(element) {
                // emulate native checkbox behaviour
                element.mousedown(function() {
                  element.addClass('mousedown');
                }).mouseup(function() {
                  element.removeClass('mousedown');
                }).mouseleave(function() {
                  element.removeClass('in');
                }).mouseenter(function() {
                  element.addClass('in');
                }).click(function() {
                  element.toggleClass('checked');
                  
                  active = !active;
                  setContextVisibility(context, active);
                  setLegends(context, active);
                  updateActiveLayersPane(mapContexts);
                });
              }(checkbox))
            
            } else if (typeof contextConf !== "undefined") {
              tr = $('<tr style="font-size:10px;height:22px">');
              td1 = $('<td style="color:#FFF" colspan="3">');
              td1.text(contextConf.label);
              td2 = $('<td style="width:16px;padding:0">');
              infoButton = $('<a class="layer_info_button" id="' + contextName + '_info_button" href="static/loc/' + languageCode + '/html/' + contextConf.infoFile + '"></a>');

              td2.append(infoButton);

              tr.append(td1, td2);
              element.append(tr);
            }
            
            if (typeof infoButton !== "undefined") {
              infoButton.fancybox({
                'autoScale' : false,
                'openEffect' : 'elastic',
                'closeEffect' : 'elastic',
                'type': 'ajax',
                'overlayOpacity': 0.5
              });
            }
          }
        }
      });
    };
    
    
    loadContextGroups(contextGroups, 0, $("#layers_pane"));

    $("#layers_pane").accordion({
      collapsible: true, 
      autoHeight: false, 
      header: ".accordion_header", 
      animated: false
    } );

    if (getURLParameter('layer_pane') !== 'off')
    {
      $("#layers_pane").show();
    }

    setupAllContexts();


    // create info dialog
    var selectedFeatures = {};
    $("#info_popup").dialog({
      closeOnEscape: true,
      //height: 170,
      //minHeight: 400,
      //maxHeight: 800,
      width: 300,
      zIndex: 2000,
      resizable: false,
      close: function(event, ui) {
        // destroy all features
        $.each(selectedFeatures, function(layerId, feature) {
          feature.destroy();
        });
      },
      autoOpen: false
    });

    showInfo = function(evt, infoHTML) {
      var x = evt.xy.x - 100,
          y = evt.xy.y - 200,
          i,
          feature,
          featureType,
          nSelectedFeatures = 0,
          infoPopup = $("#info_popup");

      highlightLayer.destroyFeatures();
      selectedFeatures = {};

      if (evt.features && evt.features.length) {
        var viewportExtent = UNREDD.map.getExtent();

        // re-project to Google projection
        for (i = 0; i < evt.features.length; i++) {
          if(evt.features[i].geometry){
            evt.features[i].geometry.transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913"));

            // don't select it if most of the polygon falls outside of the viewport
            if (!viewportExtent.scale(1.3).containsBounds(evt.features[i].geometry.getBounds())) {
              continue;
            }
          }
          
          feature = evt.features[i];
          featureType = feature.gml.featureType;
          selectedFeatures[featureType] = feature;
          nSelectedFeatures += 1;
        }

        infoPopup.empty();

        // handle custom popup - info will be taken from json but for now it's in the custom.js. Don't have time
        var customPopupLayer = null;
        $.each(selectedFeatures, function(layerId, feature) {
          // check for each layer selected if one of them has a custom popup implementation in custom.js, 
          // otherwise will be shown
          if(typeof(UNREDD.layerInfo[layerId]) != "undefined"){
            let info = UNREDD.layerInfo[layerId](feature);
            if (typeof(info.customPopup) != "undefined") {
              customPopupLayer = layerId;
              info.customPopup();

              $.fancybox({
                href: '#custom_popup'
              });
              return false; // only show the custom info dialog for the first layer that has it
            }
          }
          return true;
        });

        if (customPopupLayer !== null)
        {
          //infoPopup.dialog('close');
          return;
        }
        let flag = true;
        $.each(selectedFeatures, function(layerId, feature) {
          var table,
              info,
              td1, td2, td3,
              tr1, tr2, tr3;
          
          if (UNREDD.layerInfo.hasOwnProperty(layerId)) {
            info = UNREDD.layerInfo[layerId](feature);
          } else {
            // That's an horrible system to avoid that the HTML generate by geoserver will be displayed more than one time.
            // ISSUE 1 : the content can be positioned in the middle of stats section (better show all stats link then the getFeaturesInfo)
            // ISUE 2 : JUST ONE BUTTON FOR EACH FEATURE!!! Generate it server side!
            if(flag){
              flag = false;
              info = infoHTML;//genericInfoContent(feature);
            }
            else{
              info = "";
              return true;      
            }     
          }
          
          table = $("<table>");
          tr1 = $("<tr/>");
          td1 = $('<td colspan="2" class="area_name" />');
          tr1.append(td1);
          table.append(tr1);
          table.mouseover(function() {
            highlightLayer.removeAllFeatures();
            highlightLayer.addFeatures(feature);
            highlightLayer.redraw();
          });
          table.mouseout(function() {
            highlightLayer.removeAllFeatures();
            highlightLayer.redraw();
          });
          td1.append(info);

          tr2 = $("<tr/>");
          td2 = $("<td class=\"td_left\"/>");
          tr2.append(td2);
          table.append(tr2);

          // TODO: localize statistics and zoom to area buttons
          
          // Check if the info object contains the stats link method. If not, don't append the stats. 
          if(typeof(info.statsLink) == "function"){
            td2.append("<a style=\"color:white\" class=\"feature_link fancybox.iframe\" id=\"stats_link_" + layerId + "\" href=\"" + info.statsLink() + "\">Statistics</a>");
          }
          td3 = $("<td class=\"td_right\"/>");
          td3.append("<a style=\"color:white\" class=\"feature_link\" href=\"#\" id=\"zoom_to_feature_" + layerId + "\">Zoom to area</a>");
          tr2.append(td3);
          infoPopup.append(table);

          $('#stats_link_' + layerId).fancybox({
            maxWidth    : 840,
            maxHeight : 600,
            fitToView : false,
            width       : 840,
            height      : 590,
            autoSize    : false,
            closeClick  : false,
            openEffect  : 'none',
            closeEffect : 'fade'
          });

          if (info.info && info.info()) {
            tr3 = $("<tr/>");
            td3 = $("<td class=\"td_left\" colspan=\"2\"/>");
            tr3.append(td3);
            table.append(tr3);
            td3.append(info.info());
          }


          $('#drivers_data_link').fancybox({
            'autoScale': false,
            'type': 'iframe',
            'scrolling': 'no',
            'width': 500,
            'height': 600,
            'openEffect': 'none',
            'closeEffect': 'fade'
          });

          $("#zoom_to_feature_" + layerId).click(function() {
            UNREDD.map.zoomToExtent(feature.geometry.getBounds().scale(1.2));
          });
        });
      }

      var totalHeight = 0;

      // If no features selected then close the dialog        
      if (nSelectedFeatures == 0) {
        infoPopup.dialog('close');
      }
      else {
        // Don't reposition the dialog if already open
        if (!infoPopup.dialog('isOpen')) {
          infoPopup.dialog('option', 'position', [x, y]);

          // Finally open the dialog
          infoPopup.dialog('open');
        }

        $.each($('#info_popup table'), function(id, elem) {
          totalHeight += $(elem).height() + 12;
        });

        infoPopup.dialog('option', 'height', totalHeight/* + 35*/);
      }
    };
  };
  

  $.ajax({
    url: "src/layers.json",
    type: "GET",
    dataType: "json",
    contentType: "application/json; charset=utf-8"
  }).then(res => {
    parseLayersJson(res as LayersJson);
    setupTimeSlider();
  })

  /*
  $.ajax({
    url: 'layers.json', 
    dataType: 'json', 
    async: false, 
    cache: false,
    success: function(data_) { parse_layers_json(data_); }
  });
  */
  
  // setup various UI elements
  $("#legend_pane").dialog({
    position: ['right', 'bottom'],
    closeOnEscape: false,
    height: 300,
    minHeight: 400,
    maxHeight: 400,
    width: 430,
    zIndex: 2000,
    resizable: false,
    close: function(event, ui) {
      legendOn = false;
    }
  });

  var openLegend = function(scrollToId) {
    if (!legendOn) {
      $("#legend_pane").dialog('open');
    }

    legendOn = true;

    if (scrollToId) {
      $("#legend_pane").animate({ scrollTop: scrollToId.offset().top - $('#legend_pane_content').offset().top }, 'slow');
    }
  }

  var closeLegend = function() {
    $("#legend_pane").dialog('close');
    legendOn = false;
  }

  $("#legend_pane").dialog('close'); // using autoOpen, it doesn't show when you click the button - don't have time
  $("#toggle_legend").click(function() {
    if (!legendOn) {
      openLegend(false);
    } else {
      closeLegend();
    }
    
    return false;
  });

  $("#layer_list_selector_pane").buttonset();
  if (getURLParameter('layer_pane') !== 'off')
  {
    $("#layer_list_selector_pane").show();
  }
  
  $("#all_layers").click(function() {
    $("#layers_pane").show();
    $("#active_layers_pane").hide();
  });

  $("#active_layers").click(function() {
    $("#layers_pane").hide();

    $("#active_layers_pane").accordion({
      collapsible: false,
      autoHeight: false,
      animated: false,
      create: function(event, ui) {
        $('#active_layers_pane .ui-icon-triangle-1-s').hide();
        updateActiveLayersPane(mapContexts);
      }
    });
    if (getURLParameter('layer_pane') !== 'off')
    {
      $("#active_layers_pane").show();
    }
  });

  // Time slider management
  getClosestPastDate = function(date, dateArray, layer) {
    var result = null,
        dateInArray,
        i, d;

    for (i = 0; i < dateArray.length; i++) {
      dateInArray = dateArray[i];
      if (date >= dateInArray && (result === null || result < dateInArray)) {
        result = dateInArray;
        d = i;
      }
    }
    layer.selectedDate = layer.configuration.wmsTime.split(",")[d];
    return result;
  };

  getClosestFutureDate = function(date, dateArray, layer) {
    var result = null,
        dateInArray,
        i, d;

    for (i = 0; i < dateArray.length; i++) {
      dateInArray = dateArray[i];
      if (date <= dateInArray && (result === null || result > dateInArray)) {
        result = dateInArray;
        d = i;
      }
    }
    layer.selectedDate = layer.configuration.wmsTime.split(",")[d];
    return result;
  };
  
  getLocalizedDate = function(date) {
    let months = messages.months ? eval(messages.months) : ["Jan.", "Feb.", "Mar.", "Apr.", "May", "June", "July", "Aug.", "Sep.", "Oct.", "Nov.", "Des."],
        arr = date.split("-");
    if (arr[1]) arr[1] = months[arr[1] - 1];
    return arr.reverse().join(" ");
  };
  
  setLayersTime = function(selectedDate) {
    // loop through layers to see if they are time dependent'type': 'iframe',
    $.each(UNREDD.timeDependentLayers, function(layerName, layer) {
      var sDates,
          dates = [],
          i,
          d,
          newDate,
          layerInfo = layer.configuration;

      // parse the wmsTime string
      sDates = layerInfo.wmsTime.split(",");
      for (i = 0; i < sDates.length; i++) {
        d = new Date();
        if (d.setISO8601(sDates[i])) {
          dates.push(d);
        }
      }

      if (dates.length) {
        newDate = getClosestPastDate(selectedDate, dates, layer);
        if (newDate === null) {
          newDate = getClosestFutureDate(selectedDate, dates, layer);
        }
        layer.olLayer.mergeNewParams({ 'time': isoDateString(newDate) });
        $("#"+layer.name+"_date").text(" ("+getLocalizedDate(layer.selectedDate)+")");
        UNREDD.map.events.triggerEvent("changelayer", {
          layer: layer.olLayer,
          selectedDate: layer.selectedDate,
          property: "time"
        });
      }
    });
  };
  
  const setupTimeSlider = function() {
    let wmsTimes = Object.keys(UNREDD.allLayers)
                        .map(k => UNREDD.allLayers[k]) // get object values
                        .map(layer => layer.configuration && layer.configuration.wmsTime)
                        .filter(time => !!time);

    let timeSlider = new TimeSlider(wmsTimes);

    if (false) {
      let timesObj = {};
      for (let layer in UNREDD.allLayers) {
        var layerTimes = UNREDD.allLayers[layer].configuration.wmsTime;
        if (layerTimes) {
          layerTimes = layerTimes.split(",");
          for (let i in layerTimes) {
            var datetime = new Date();
            datetime.setISO8601(layerTimes[i]);
            timesObj[layerTimes[i]]=0; // Put it in an object to avoid duplicate dates.
          }
        }
      }
      for (let time in timesObj) {
        UNREDD.times.push(time);
      }
      UNREDD.times.sort();
      
      // Create time slider
      if (UNREDD.times.length) {
        $("#time_slider_label").text(getLocalizedDate(UNREDD.times[UNREDD.times.length-1]));
        $("#time_slider").slider({
          min: 0,
          max: UNREDD.times.length-1,
          value: UNREDD.times[UNREDD.times.length-1].replace(/\-/g,""),
          slide: function(event, ui) {
            $("#time_slider_label").text(getLocalizedDate(UNREDD.times[ui.value]));
          },
          change: function(event, ui) {
            var d = new Date();
            d.setISO8601(UNREDD.times[ui.value]);
            setLayersTime(d);
          }
        });
      
        // Init layers time
        let datestr = UNREDD.times[$("#time_slider").slider("value")],
            selectedDate = new Date();
        selectedDate.setISO8601(datestr);
        setLayersTime(selectedDate);
      } else {
        $("#time_slider_pane").hide();
      }
    }
  }



  // Info click handler
  // Perform getFeatureInfo requesting GML outputformat to get the geometry
  var ouptputGetFeatureInfoGML;
  
  infoControl = new OpenLayers.Control.WMSGetFeatureInfo({
    url: UNREDD.wmsServers[0],
    title: 'Identify features by clicking',
    layers: UNREDD.queryableLayers,
    queryVisible: true,
    infoFormat: 'application/vnd.ogc.gml',
    hover: false,
    drillDown: true,
    maxFeatures: 5,
    handlerOptions: {
      "click": {
        'single': true,
        'double': false
      }
    },
    eventListeners: {
      getfeatureinfo: function(evt) {
        if (evt.features && evt.features.length) {
          ouptputGetFeatureInfoGML = evt;
          infoAsHTML = UNREDD.map.getControl("infoAsHTML");
          infoAsHTML.activate();
          infoAsHTML.request(evt.xy);
          infoAsHTML.deactivate();
        }
      }
    },
    formatOptions: {
      typeName: 'XXX', featureNS: 'http://www.openplans.org/unredd'
    }
  });
  UNREDD.map.addControl(infoControl);
  infoControl.activate();

  // Perform getFeatureInfo requesting HTML outputformat to get the HTML template
  let infoAsHTML = new OpenLayers.Control.WMSGetFeatureInfo({
    url: UNREDD.wmsServers[0],
    title: 'Display feature\'s HTML template by clicking on it',
    layers: UNREDD.queryableLayers,
    queryVisible: true,
    infoFormat: 'text/html',
    hover: false,
    drillDown: true,
    maxFeatures: 5,
    handlerOptions: {
      "click": {
        'single': true,
        'double': false
      }
    },
    eventListeners: {
      getfeatureinfo: function(evt) {
        showInfo(ouptputGetFeatureInfoGML, evt.text);   
      }
    },
    formatOptions: {
      typeName: 'XXX', featureNS: 'http://www.openplans.org/unredd'
    }
  });
  
  infoAsHTML.id = "infoAsHTML";
  UNREDD.map.addControl(infoAsHTML);
  
  UNREDD.map.addLayers(UNREDD.visibleLayers);
  //var wikimapia = new OpenLayers.Layer.Wikimapia( "Wikimapia",
  //  { sphericalMercator: true, isBaseLayer: false, 'buffer': 0 });
  //map.addLayer(wikimapia);
  
  // StyleMap for the highlight layer
  styleMap = new OpenLayers.StyleMap({
    'strokeWidth': 5,
    fillOpacity: 0,
    strokeColor: '#ee4400',
    strokeOpacity: 0.5,
    strokeLinecap: 'round' });
  highlightLayer = new OpenLayers.Layer.Vector("Highlighted Features", { styleMap: styleMap });
  UNREDD.map.addLayer(highlightLayer);
 
  $("#disclaimer_popup").fancybox({
    'width': 600,
    'height': 400,
    'autoScale': true,
    'openEffect': 'fade',
    'closeEffect': 'none',
    'type': 'ajax'
  });
  
  if (UNREDD.customInit != undefined) {
    UNREDD.customInit();
  }
});

// given a feature this method create a html snippets to show its getFeatureInfo results
function genericInfoContent(feature) {
  let ret = "<div><table>";
  $.each(feature.attributes, function(index, attribute) {
    ret += "<tr><td>" + index + "</td><td>" + attribute + "</td></tr>";
    return true;
  });

  ret += "</table></div>";

  return {
    title() {
      return ret;
    }
  };
}

function getURLParameter(name) {
  return decodeURI(
    (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]
  );
}