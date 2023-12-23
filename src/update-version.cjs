const fs = require("fs")

// DO NOT DELETE THIS FILE

function main() {
	const source = fs.readFileSync("C:/Users/Duncan McPherson/WebstormProjects/karma-test-utils/package.json").toString("utf-8");
	const sourceObj = JSON.parse(source);
	const version = sourceObj.version;

	const versionParts = version.split('.');
	let patchVersion = +versionParts[2];
	let minorVersion = +versionParts[1];
	let majorVersion = +versionParts[0];
	if (patchVersion++ >= 10) {
		minorVersion++;
		patchVersion = 0;
	}
	if (minorVersion === 10) {
		majorVersion++;
		minorVersion = 0;
	}
	const newVersion = `${majorVersion}.${minorVersion}.${patchVersion}`
	sourceObj.version = newVersion;
	console.log("new version:", newVersion)
	fs.writeFileSync("C:/Users/Duncan McPherson/WebstormProjects/karma-test-utils/package.json", Buffer.from(JSON.stringify(sourceObj, null, 2), "utf-8"));
}

main();