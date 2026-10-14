// Browser replacement for the native AssetsManagerLoaderScene boot path.
// Loads the game scripts listed in src/jsList.js (with the language string
// table substituted), preloads textures/plists, then shows the menu.
var WebBoot = {
    SUPPORTED_LANGUAGES: ["en", "zh", "ru"],

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
            var stringLan = lan === "ru" ? "en" : lan;
            var scripts = jsList.map(function (f) {
                return f.indexOf("string.js") !== -1 ? f.replace("string.js", "string_" + stringLan + ".js") : f;
            }).concat(["src/web/webOverrides.js"]);
            cc.LoaderScene.preload(WEB_PRELOAD_RESOURCES, function () {
                cc.loader.loadJs(scripts, function (err) {
                    if (err) return cc.error("failed to load game scripts: " + err);
                    cc.loader.loadJs(["src/ext/extList.js"], function (err) {
                        if (err) return cc.error("failed to load extList: " + err);
                        cc.loader.loadJs(extList, function (err) {
                            if (err) return cc.error("failed to load extensions: " + err);
                            if (typeof ExtBoot !== "undefined") ExtBoot.run();
                            lanSupports.length = 0;
                            lanSupports.push("en", "zh", "ru");
                            stringName.ru = "Русский";
                            cc.director.runScene(new MenuScene(false, false));
                        });
                    });
                });
            });
        });
    }
};

// Phones are taller than the game's 640x1136 design size. The native default (fixed height +
// 0.83 "shrink screen" scale) crops the sides in a browser, so default to the game's own
// "full screen" setting (screenfix 2 = SHOW_ALL letterboxing). Players can still change it
// in Settings. Runs before main.js reads it in cc.game.onStart.
if (!cc.sys.localStorage.getItem("screenfix")) {
    cc.sys.localStorage.setItem("screenfix", 2);
}
