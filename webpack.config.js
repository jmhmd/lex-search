const webpack = require('webpack');
const NODE_ENV = process.env.NODE_ENV || 'production';

module.exports = {
  entry: './public/src/index.js',
  output: {
    path: './public/dist',
    filename: 'bundle.js',
  },
  module: {
    loaders: [
      {
        test: /\.js$|\.jsx$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        /*query: {
          presets: ['babel-preset-es2015', 'babel-preset-react'].map(require.resolve),
        },*/
      }, {
        test: /\.css$/,
        loader: 'style-loader!css-loader',
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(NODE_ENV),
      },
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
      },
      output: {
        comments: false,
      },
    }),
  ],
  resolve: {
    // you can now require('file') instead of require('file.js')
    extensions: ['', '.js', '.jsx', '.json'],
  },
  devtool: 'cheap-source-map',
};
