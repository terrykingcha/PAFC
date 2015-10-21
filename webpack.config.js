var webpack = require('webpack');

sourceMapPlugin = new webpack.SourceMapDevToolPlugin({
  // asset matching
  test: /\.js$/,

  // file and reference
  filename: './temp/[name].js.map',
  append: '//# sourceMappingURL=[url]',

  moduleFilenameTemplate: '../[resourcePath]'
});

module.exports = {
  entry: {
    pafc: './src/main.js'
  },
  output: {
    filename: './temp/[name].js',
    devtoolModuleFilenameTemplate: '/[resourcePath]'
  },
  module: {
    loaders: [
      { test: /\.(less|css)$/, loader: 'style-loader!raw-loader!less-loader' },
      { test: /\.(jpg|gif|png)/, loader: 'url!img'},
      {
        test: /\.js$/, 
        exclude: /(node_modules|bower_components)/, 
        loader: 'babel-loader',
        query: {
          stage: 0
          // optional: ['runtime']
          // blacklist: ['promise']
        }
      } ,
    ]
  },
  plugins: [
    sourceMapPlugin
  ],
  resolve: {
    modulesDirectories: ['node_modules', 'bower_components', 'lib'],
    extensions: ['', '.js', '.less', '.jpg', '.gif', '.png']
  }
};