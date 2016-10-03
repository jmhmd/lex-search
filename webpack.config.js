module.exports = {
  entry: './public/index.js',
  output: {
    path: './public/dist',
    filename: 'bundle.js'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        query: {
          presets: ['babel-preset-es2015', 'babel-preset-react'].map(require.resolve)
        }
      },
      { test: /\.css$/, loader: 'style-loader!css-loader' },
    ]
  },
  resolve: {
    // you can now require('file') instead of require('file.coffee')
    extensions: ['', '.js', '.json']
  }
};
