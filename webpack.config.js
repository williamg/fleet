module.exports = {
	entry: "./client/js/main.ts",
	output: {
		filename: "bundle.js",
		path: __dirname + "/client"
	},

	node: {
		fs: "empty"
	},

	devtool: "source-map",

	resolve: {
		extensions: [".ts", ".js", ".json"]
	},

	module: {
		rules: [
			{ test: /\.ts?$/, loader: "awesome-typescript-loader" },
			{ enforce: "pre", test: /\.js$/, loader: "source-map-loader" }
		]
	},
};
