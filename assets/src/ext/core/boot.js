// Runs after every extension script. Merges strings for the active language
// and publishes loose sprites into the frame cache.

// Cocos wraps Latin words on spaces and cuts everything else per character.
// Cyrillic was cut mid-word ("управляю / т"). Treat it as a word too.
(function () {
    if (typeof cc === "undefined" || !cc.LabelTTF) {
        return;
    }
    var letters = "a-zA-Z0-9ÄÖÜäöüßéèçàùêâîôûА-Яа-яЁё";
    cc.LabelTTF._wordRex = new RegExp("([" + letters + "]+|\\S)");
    cc.LabelTTF._lastWordRex = new RegExp("([" + letters + "]+|\\S)$");
    cc.LabelTTF._lastEnglish = new RegExp("[" + letters + "]+$");
    cc.LabelTTF._firsrEnglish = new RegExp("^[" + letters + "]");
})();

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
