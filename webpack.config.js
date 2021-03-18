const path = require('path')
module.exports = {
    entry: './src/basic-roguelike.ts',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: [ '.ts', '.tsx', '.js' ]
    },
    output: {
        filename: 'basic-roguelike-bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    mode: 'development',
}
