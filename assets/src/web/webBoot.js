// Browser replacement for the native AssetsManagerLoaderScene boot path.
// Loads the game scripts listed in src/jsList.js (with the language string
// table substituted), preloads textures/plists, then shows the menu.
var WebBoot = {
    SUPPORTED_LANGUAGES: ["en", "zh"],

    getLanguage: function () {
        var lan = cc.sys.localStorage.getItem("language");
        if (this.SUPPORTED_LANGUAGES.indexOf(lan) === -1) {
            lan = "en";
            cc.sys.localStorage.setItem("language", lan);
        }
        return lan;
    },

    run: function () {
        var lan = this.getLanguage();
        cc.loader.loadJs(["src/jsList.js"], function (err) {
            if (err) return cc.error("failed to load jsList: " + err);
            var scripts = jsList.map(function (f) {
                return f.indexOf("string.js") !== -1 ? f.replace("string.js", "string_" + lan + ".js") : f;
            }).concat(["src/web/webOverrides.js"]);
            cc.LoaderScene.preload(WEB_PRELOAD_RESOURCES, function () {
                cc.loader.loadJs(scripts, function (err) {
                    if (err) return cc.error("failed to load game scripts: " + err);
                    cc.director.runScene(new MenuScene(false, false));
                });
            });
        });
    }
};
