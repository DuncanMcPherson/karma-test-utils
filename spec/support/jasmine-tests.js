const Jasmine = require("jasmine");
const jasmine = new Jasmine();
const SpecReporter = require('jasmine-reporters').JUnitXmlReporter;
const reporter = new SpecReporter({savePath: 'test-results'});
jasmine.loadConfigFile("spec/support/jasmine-plain.json")
jasmine.addReporter(reporter);
jasmine.execute();

