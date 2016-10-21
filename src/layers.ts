export interface LayersJson {
  layers: Layer[],
  contexts: Context[],
  contextGroups: ContextGroup[]
}

export interface Layer {
  id: string,
  baseUrl?: string,
  wmsName: string,
  imageFormat?: string,
  visible?: boolean,
  legend?: string,
  sourceLink?: string,
  sourceLabel?: string,
  wmsParameters?: any,
  queryable: boolean
};

export interface Context {
  id: string,
  active?: boolean,
  infoFile?: string,
  label: string,
  layers?: string[],
  inlineLegendUrl?: string
};

export interface ContextGroup {
  group: {
    label?: string,
    infoFile?: string,
    items?: ContextGroupItem[]
  }
}

interface ContextInGroup {
  context: string
}

export type ContextGroupItem = (Context | ContextInGroup)[]


  // "group": 
  // {
  //   "items": [
  //     {
  //       "group": {
  //         "label": "Base Layers",
  //         "items": [
  //           { "context": "blueMarble" },
  //           { "context": "FnFMask1990" },
  //           { "context": "facetForestClassification" },
  //           { "context": "uclForestClassification" },
  //           { "context": "landsat" },
  //           { "context": "hillshade" }
  //         ]
  //       }
  //     }, {
  //       "group": {
  //         "label": "Administrative Areas",
  //         "items": [
  //           { "context": "countryBoundaries" },
  //           { "context": "provinces" },
  //           { "context": "administrativeUnits" }
  //         ]
  //       }
  //     }, {
  //       "group": {
  //         "label": "REDD+ Initiatives",
  //         "infoFile" : "redd_plus_activities_def.html",
  //         "items": [
  //           { "context": "reddPlusActivitiesDeforestation" },
  //           { "context": "reddPlusActivitiesDegradation" },
  //           { "context": "reddPlusActivitiesEnhancement" },
  //           { "context": "reddPlusActivitiesConservation" },
  //           { "context": "reddPlusActivitiesSustainableForestManagement" }
  //         ]
  //       }
  //     }, {
  //       "group": {
  //         "label": "REDD+ Registry",
  //         "items": [
  //           { "context": "reddPlusProjects" },
  //           { "context": "reddPlusInitiatives" }
  //         ]
  //       }
  //     }, {
  //       "group": {
  //         "label": "Forest area and forest area change",
  //         "infoFile": "forest_area_and_forest_area_changes_def.html",
  //         "items": [
  //           {
  //             "group": {
  //               "label": "Forest land remaining forest land",
  //               "items": [
  //                 { "context": "degradation" },
  //                 { "context": "regrowth" },
  //                 { "context": "conservation" }
  //               ]
  //             }
  //           }, {
  //             "group": {
  //               "label": "Forest land converted to non-forest land",
  //               "items": [
  //                 { "context": "deforestation" },
  //                 { "context": "trainingData" },
  //                 { "context": "intactForest" }
  //               ]
  //             }
  //           }, {
  //             "group": {
  //               "label": "Non-forest land converted to forest land",
  //               "items": [
  //                 { "context": "afforestation" },
  //                 { "context": "reforestation" }
  //               ]
  //             }
  //           }, {
  //             "group": {
  //               "label": "Biomass fire",
  //               "items": [
  //                 { "context": "activeFire" },
  //                 { "context": "burntArea" }
  //               ]
  //             }
  //           }
  //         ]
  //       }
  //     }, {
  //       "group": {
  //         "label": "Other",
  //         "items": [
  //           { "context": "plots" },
  //           { "context": "protectedAreas" },
  //           { "context": "loggingConcessions" },
  //           { "context": "hydrography" },
  //           { "context": "ecoregions" },
  //           { "context": "roads" },
  //           { "context": "settlements" }
  //         ]
  //       }
  //     }
  //   ]
  // }
