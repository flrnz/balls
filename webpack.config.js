const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      { test: /\.json$/, loader: 'json-loader' },
	  { test:/\.(s*)css$/, loader: [ 'style-loader', 'css-loader' ] }
    ]
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ]
  },
  devServer: {
    contentBase: [path.resolve(__dirname, "dist")],
    port: 3001
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  plugins: [
    new HtmlWebpackPlugin({
        template: './src/index.template.ejs',
        inject: 'body',
        filename: 'index.html'
    }),
  ]
};