// Runs after every extension script. Merges strings for the active language
// and publishes loose sprites into the frame cache.
var ExtBoot = {
    languageKey: function () {
        var lan = cc.sys.localStorage.getItem("language") || "en";
        if (lan === "zh" || lan === "zh-Hant" || lan === "en" || lan === "ru") {
            return lan;
        }
        if (lan.indexOf("zh") === 0) {
            return "zh";
        }
        return "en";
    },

    run: function () {
        var lan = this.languageKey();
        var fallback = ExtStrings.en || {};
        var table = ExtStrings[lan] || {};
        var key;
        for (key in fallback) {
            if (fallback.hasOwnProperty(key)) {
                string[key] = fallback[key];
            }
        }
        for (key in table) {
            if (table.hasOwnProperty(key)) {
                string[key] = table[key];
            }
        }
        ExtAssets.register();
    }
};
