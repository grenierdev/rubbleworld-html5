const webpack = require('webpack');
const path = require('path');

module.exports = {
	entry: {
		'js/webclient': './src/webclient.tsx',
		'js/vendor': ['react', 'react-dom']
	},
	output: {
		path: path.join(__dirname, 'dist'),
		filename: '[name].js'
	},

	// Enable sourcemaps for debugging webpack's output.
	devtool: 'source-map',

	resolve: {
		// Add '.ts' and '.tsx' as resolvable extensions.
		extensions: ['.ts', '.tsx', '.js', '.json']
	},

	module: {
		rules: [
			// All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
			{
				test: /\.tsx?$/,
				loader: 'awesome-typescript-loader',
				options: {
					configFileName: 'tsconfig.client.json'
				}
			},

			// All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
			{ enforce: 'pre', test: /\.js$/, loader: 'source-map-loader' }
		]
	},
	externals: {
	},
	plugins: [
		new webpack.DefinePlugin({
			'process.env': {
				NODE_ENV: JSON.stringify('production')
			}
		}),
		new webpack.optimize.CommonsChunkPlugin({
			name: 'js/vendor',
			minChunks: Infinity,
		})
	]
};