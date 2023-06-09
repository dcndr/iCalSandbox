const path = require('path')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
    entry: {
        times: {
            import: './src/times.ts',
            dependOn: ['jquery'],
        },
        circle: {
            import: './src/circle.ts',
            dependOn: ['jquery', 'pixi']
        },
        jquery: 'jquery',
        pixi: 'pixi.js'
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                include: path.resolve(__dirname, 'src'),
                use: 'ts-loader',
            },
            {
                test: /\.css$/i,
                include: path.resolve(__dirname, 'src'),
                use: ['style-loader', 'css-loader', 'postcss-loader'],
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        fallback: {
            "fs": false
        },
    },
    output: {
        filename: '[name].[contenthash].js',
        path: path.resolve(__dirname, 'public'),
    },
    mode: 'development',
    optimization: {
        runtimeChunk: 'single',
    },
    devServer: {
        devMiddleware: {
            writeToDisk: true,
        },
    },
    plugins: [
        new CleanWebpackPlugin({
            protectWebpackAssets: false,
        }),
        new HtmlWebpackPlugin({ template: 'src/index.html'}),
    ],
    devtool: "source-map",
}
