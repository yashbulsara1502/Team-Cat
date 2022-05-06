const path = require('path')

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  entry: ['./quill.js',  './automerge.js'],
  output: {
    globalObject: 'self',
    path: path.resolve(__dirname, './dist/'),
    filename: 'quill.bundle.js',
    publicPath: '/quill/dist/'
  },
  devServer: {
    host:'0.0.0.0',
    port:8081,
    disableHostCheck: true,
    contentBase: path.join(__dirname),
    compress: true,
    publicPath: '/dist/'
  }
}
