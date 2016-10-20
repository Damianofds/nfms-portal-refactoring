export interface LayersJson {
  layers: {
    layer: {
      id: string,
      baseUrl: string,
      wmsName: string,
      imageFormat: string,
      visible: string,
      legend: string,
      sourceLink: string,
      sourceLabel: string
    }[]
  },
  contexts: {
    context: {} [] // TODO
  },
  contextGroups: {} // TODO
}
