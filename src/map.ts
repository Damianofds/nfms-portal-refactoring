type Bbox = [number, number, number, number]

class Map {
  maxExtent: Bbox = [-20037508, -20037508, 20037508, 20037508];
  restrictedExtent: Bbox = this.maxExtent;
  maxResolution: number = 4891.969809375;

  // openLayersMapOptions = {
  //   theme:             null,
  //   projection:        new OpenLayers.Projection('EPSG:900913'),
  //   displayProjection: new OpenLayers.Projection('EPSG:4326'),
  //   units:             'm',
  //   maxResolution:     UNREDD.maxResolution,
  //   maxExtent:         UNREDD.maxExtent,
  //   restrictedExtent:  UNREDD.restrictedExtent,
  //   allOverlays:       true,
  //   controls:          [
  //     new OpenLayers.Control.Navigation({ dragPanOptions:{ enableKinetic: true } }),
  //     new OpenLayers.Control.Scale()
  //   ]
  // };

  // UNREDD.map = new OpenLayers.Map('map', openLayersMapOptions);



  
  // map: new OpenLayers.Map();

  // constructor(layerDefinition: layersJson.Layer) {
  //   this.name = layerDefinition.id;
  //   this.configuration = layerDefinition;
  // }

  test() {
    return 'Hello, ' + this.name;
  }
}
