const path = require('path')
const CopyPlugin = require('copy-webpack-plugin')

module.exports = {
  entry: {
    fileaction: path.join(__dirname, 'src', 'fileaction.jsx'),
  },
  output: {
    path: path.join(__dirname, 'js'),
    filename: '[name].js',
    publicPath: '/custom_apps/excalidraw/js/',
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: path.join(__dirname, 'node_modules/@excalidraw/excalidraw/dist/prod/fonts'),
          to: path.join(__dirname, 'js/fonts'),
        },
      ],
    }),
  ],
  module: {
    rules: [
      {
        // Excalidraw's ESM dist imports roughjs without .js extension;
        // disable fullySpecified so webpack resolves them normally
        test: /\.m?js$/,
        resolve: { fullySpecified: false },
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              ['@babel/preset-react', { runtime: 'automatic' }],
            ],
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    fallback: {
      // @nextcloud/files pulls in string_decoder (Node built-in); not needed in browser
      string_decoder: false,
    },
  },
}
