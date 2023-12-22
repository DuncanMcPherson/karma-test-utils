// Karma configuration
// Generated on Thu Dec 21 2023 19:22:50 GMT-0700 (Mountain Standard Time)

module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-junit-reporter'),
      require('karma-coverage')
    ],
    files: [
      '**/*.spec.ts'
    ],
    jasmineHtmlReporter: {
      suppressAll: true
    },
    exclude: [
    ],
    preprocessors: {
    },
    reporters: ['progress', 'kjhtml', 'junit', 'coverage'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome'],
    singleRun: false,
    concurrency: Infinity,
    junitReporter: {
      outputDir: 'test-results',
      useBrowserName: false
    },
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage'),
      subdir: '.',
      reporters: [
        { type: 'lcov' }
      ]
    }
  })
}
