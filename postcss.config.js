module.exports = {
  plugins: [
    require("autoprefixer"),    
    require("postcss-normalize") // { forceImport: true, browsers: [], allowDuplicates: false}; use @import-normalize
    // Maybe add postcss-import, postcss-next, postcss-reporter
  ]
}