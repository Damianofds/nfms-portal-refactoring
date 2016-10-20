export default class TimeSlider {
  constructor(wmsTimes: string[]) {
    // wmsTimes.reduce((previous, current) => [], [])
    let times = wmsTimes.reduce((previous, current) => previous.concat(current.split(',')), [])
                        .filter((elem, pos, arr) => arr.indexOf(elem) == pos); // remove duplicates - TODO use sets

    console.log('ecchice!');
    console.log(times);
  }
}


  // var timesObj = {};
  // for (let layer in UNREDD.allLayers) {
  //   var layerTimes = UNREDD.allLayers[layer].configuration.wmsTime;
  //   if (layerTimes) {
  //     layerTimes = layerTimes.split(",");
  //     for (let i in layerTimes) {
  //       var datetime = new Date();
  //       datetime.setISO8601(layerTimes[i]);
  //       timesObj[layerTimes[i]] = 0; // Put it in an object to avoid duplicate dates.
  //     }
  //   }
  // }
  // for (let time in timesObj) {
  //   UNREDD.times.push(time);
  // }
  // UNREDD.times.sort();
  
  // // Create time slider
  // if (UNREDD.times.length) {
  //   $("#time_slider_label").text(getLocalizedDate(UNREDD.times[UNREDD.times.length-1]));
  //   $("#time_slider").slider({
  //     min: 0,
  //     max: UNREDD.times.length-1,
  //     value: UNREDD.times[UNREDD.times.length-1].replace(/\-/g,""),
  //     slide: function(event, ui) {
  //       $("#time_slider_label").text(getLocalizedDate(UNREDD.times[ui.value]));
  //     },
  //     change: function(event, ui) {
  //       var d = new Date();
  //       d.setISO8601(UNREDD.times[ui.value]);
  //       setLayersTime(d);
  //     }
  //   });
  
  //   // Init layers time
  //   let datestr = UNREDD.times[$("#time_slider").slider("value")],
  //       selectedDate = new Date();
  //   selectedDate.setISO8601(datestr);
  //   setLayersTime(selectedDate);
  // } else {
  //   $("#time_slider_pane").hide();
  // }
