const Jasmine = require("jasmine");
const JasmineConsoleReporter = require("jasmine-spec-reporter").SpecReporter;
const jasmine = new Jasmine();
const reporter = new JasmineConsoleReporter();
jasmine.addReporter(reporter);
jasmine.showColors(true);
jasmine.loadConfigFile("spec/support/istanbul-jasmine.json");
jasmine.execute();