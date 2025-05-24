const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const fs = require('fs');

// Check if public directory exists, create it if it doesn't
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

module.exports = {
  mode: 'development',
  entry: './src/js/index.js',
  output: {
    filename: 'bundle.[contenthash].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true
  },
  devtool: 'source-map',
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html'
    }),
    new CopyWebpackPlugin({
      patterns: [
        { 
          from: 'public',
          to: '',
          noErrorOnMissing: true
        }
      ]
    })
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    hot: true,
    compress: true,
    port: 3001,
  }
}; 