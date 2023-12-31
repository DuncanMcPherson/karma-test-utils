const SpecReporter = require('jasmine-reporters').JUnitXmlReporter;
module.exports = {
  "spec_dir": "spec",
  "spec_files": [
    "**/*[sS]pec.ts"
  ],
  "env": {
    "stopSpecOnExpectationFailure": false,
    "random": true
  }
}
const reporter = new SpecReporter({savePath: 'test-results'})
const env = jasmine.getEnv();
env.addReporter(reporter);
env.execute();

