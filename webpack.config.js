const path = require("path");
const webpack = require("webpack");
const HtmlPlugin = require("html-webpack-plugin");
const CleanPlugin = require("clean-webpack-plugin");
const BrowserSyncPlugin = require("browser-sync-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const StyleLintPlugin = require("stylelint-webpack-plugin");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const stylelintFormatter = require("stylelint-formatter-pretty");
const { getIfUtils, removeEmpty } = require("webpack-config-utils");

const CWD = process.cwd();
module.exports = (env) => {
  const { ifProd, ifDev } = getIfUtils(env);

  const babelOptions = {
    presets: [
      ["env", {
        modules: false
      }]
    ]
  };

  const jsModules = {
    test: /\.js$/,
    include: [path.resolve(CWD, "app")],
    use: [
      {
        loader: "babel-loader",
        options: babelOptions
      }
    ]
  };

  const cssLoaders = removeEmpty([
    ifDev({ loader: "style-loader" }),
    {
      loader: "css-loader",
      options: {
        sourceMap: ifDev(true, false),
        importLoaders: 1
        /* In some cases the minification is destructive to the css, 
         * so you can provide your own options to the cssnano-based minifier if needed.
         * minimize: true || { CSSNano Options } 
         */

        /* Create aliases to import certain modules more easily
         *alias: {}
         */
      }
    },
    {
      loader: "postcss-loader"
    }

  ]);

  const cssConfig = {
    test: /\.css$/,
    include: [path.resolve(process.cwd(), "app", "css")],
    use: ifProd(
      ExtractTextPlugin.extract({
        fallback: "style-loader",
        use: cssLoaders,
        publicPath: "css/"
      }),
      cssLoaders
    )
  }

  const cssLibs = {
    test: /\.css$/,
    include: [path.resolve(CWD, "node_modules"), path.resolve(CWD, "app", "vendors")],
    use: ifProd(
      ExtractTextPlugin.extract({
        fallback: "style-loader",
        use: ["css-loader?sourceMap=false&minimize=false"]
      }),
      [ "style-loader", "css-loader?sourceMap=false&minimize=false"]
    )
  }

  return {
    entry: "./js/index.js",

    output: {
      path: path.resolve(CWD, "dist"),
      filename: "js/app.js",
      publicPath: ""

    },

    devtool: "eval",

    context: path.resolve(CWD, "app"),

    resolve: {
      extensions: [".js", ".json", ".css"],
      modules: ["node_modules", path.resolve(CWD, "app")]
    },

    module: {
      rules: [
        jsModules,
        cssConfig,
        cssLibs,
        {
          /*
           * That template can be used for extracting html (add html to entry point)
          {
            test: /\.html$/,
            use: ['file-loader?name=[path][name].[ext]!extract-loader!html-loader']
          }
           */
          test: /\.(html)$/,
          use: {
            loader: 'html-loader',
          }
        },
        {
          test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
          include: [path.resolve(CWD, "app", "css")], 
          loader: "url-loader?limit=10000&mimetype=application/font-woff&name=[path][name].[ext]"
        },
        {
          test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
          include: [path.resolve(CWD, "node_modules"), path.resolve(CWD, "app", "vendors")],
          loader: "url-loader?limit=10000&mimetype=application/font-woff&name=fonts/[name].[ext]" // FIXME: Something wrong with paths  in prod
        },
        {
          test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
          include: [path.resolve(CWD, "app", "css")],
          loader: "file-loader?name=fonts/[path][name].[ext]"
        },
        {
          test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
          include: [path.resolve(CWD, "node_modules"), path.resolve(CWD, "app", "vendors")],
          loader: "file-loader?name=fonts/[name].[ext]" // FIXME: Something wrong with paths in prod
        },
        {
          test: /\.(jpe?g|png|gif)$/,
          include: [path.resolve(CWD, "app", "img"), path.resolve(CWD, "app", "css")],
          loader: 'file-loader?name=[path][name].[ext]'
        }
      ]
    },

    plugins: removeEmpty([
      new StyleLintPlugin({
        configFile: path.resolve(CWD, ".stylelintrc"),
        failOnError: false,
        files: ["css/**/*.css"],
        quiet: false,
        formatter: stylelintFormatter
      }),
      ifProd(new webpack.optimize.UglifyJsPlugin()),
      ifProd(new ExtractTextPlugin({
        filename: 'css/[name]--[contenthash].css',
        allChunks: true
      })),
      new HtmlPlugin({
        template: "./index.html",
        filename: "index.html"
      }),
      new BrowserSyncPlugin({
        server: {
          baseDir: ['dist']
        },
        port: 3000,
        host: 'localhost',
        open: false
      }),
      new CleanPlugin(["dist"], {
        root: CWD
      }),
      new CopyPlugin([
        {
          from: './manifest.json'
        }, {
          from: './robots.txt'
        }, {
          from: './favicon.ico'
        }
      ])
    ])
  }
}