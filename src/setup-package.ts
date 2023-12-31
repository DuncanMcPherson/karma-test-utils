import fs from "fs";
import path from "path";

function main() {
	const sourcePath = path.join(__dirname, "..", "package.json");
	const source = fs.readFileSync(sourcePath).toString('utf-8');
	const sourceObj = JSON.parse(source);

	sourceObj.scripts = {};
	sourceObj.devDependencies = {};
	if (sourceObj.main.startsWith("dist/")) {
		sourceObj.main = sourceObj.main.slice(5);
	}
	fs.writeFileSync(path.join(__dirname + "/package.json"), Buffer.from(JSON.stringify(sourceObj, null, 2), "utf-8"));
	fs.copyFileSync(path.join(__dirname, "..", ".npmignore"), path.join(__dirname, "..", "dist", ".npmignore"));
}

main()