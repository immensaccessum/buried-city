// Concatenates the cocos2d-html5 v3.6 engine sources (modules used by Buried City)
// into one file, the same way CCBoot resolves modules from moduleConfig.json.
// Usage: node tools/build-engine.js <path-to-cocos2d-html5-v3.6 checkout>
var fs = require("fs");
var path = require("path");

var engineDir = process.argv[2] || path.join(__dirname, ".cache", "cocos2d-html5");
var outFile = path.join(__dirname, "..", "assets", "frameworks", "cocos2d-js-v3.6.js");
var MODULES = ["cocos2d", "extensions", "ccui"];

var config = JSON.parse(fs.readFileSync(path.join(engineDir, "moduleConfig.json"), "utf8"));
var files = [config.bootFile];
var seen = {};
function addModule(name) {
    if (seen[name]) return;
    seen[name] = true;
    config.module[name].forEach(function (item) {
        if (config.module[item]) addModule(item);
        else if (files.indexOf(item) === -1 && /\.js$/.test(item)) files.push(item);
    });
}
MODULES.forEach(addModule);

var out = ["/* cocos2d-html5 v3.6 (MIT, see frameworks/cocos2d-html5-LICENSE.txt) - modules: " + MODULES.join(", ") + " */"];
files.forEach(function (f) {
    out.push("\n// ---- " + f + " ----\n" + fs.readFileSync(path.join(engineDir, f), "utf8"));
});
fs.writeFileSync(outFile, out.join("\n"));
fs.copyFileSync(path.join(engineDir, "licenses", "LICENSE_cocos2d-html5.txt"), path.join(path.dirname(outFile), "cocos2d-html5-LICENSE.txt"));
console.log("wrote " + outFile + " (" + files.length + " files)");
