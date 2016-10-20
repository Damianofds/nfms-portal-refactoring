module.exports = {
  entry: "./src/app.ts",
  // Enable es6 polyfill
  // entry: ['babel-polyfill', './src/app.ts'],
  output: {
    filename: "./dist/bundle.js",
  },

  // Enable sourcemaps for debugging webpack's output.
  devtool: "source-map",

  resolve: {
    // alias:      { OpenLayers: "src/OpenLayers_UNREDD.jss" },
    extensions: ["", ".webpack.js", ".web.js", ".ts", ".js"]
  },

  module: {
    // // To be used when setting "target": "ES6" in tsconfig.json 
		// loaders: [
		// 	// note that babel-loader is configured to run after ts-loader
		// 	{ test: /\.ts(x?)$/, loader: "babel-loader?presets[]=es2015!ts-loader" }
		// ],
    loaders: [
      { test: /\.ts$/, loader: 'ts-loader' }
    ],

    preLoaders: [
      // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
      { test: /\.js$/, loader: "source-map-loader" }
    ]
  },

  // When importing a module whose path matches one of the following, just
  // assume a corresponding global variable exists and use that instead.
  // This is important because it allows us to avoid bundling all of our
  // dependencies, which allows browsers to cache those libraries between builds.
  // externals: {
  //   "jquery": "jQuery"
  // }
};
