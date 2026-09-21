// Browser stand-ins for the native-only APIs Buried City calls (jsb.* and the
// Android Java bridge). Loaded before any game script. Nothing here talks to a server.
(function () {
    var global = window;

    // --- MD5 (CommonUtil.md5 on Android; used to sign achievement backups in the radio) ---
    function md5(str) {
        function add(x, y) {
            var l = (x & 0xffff) + (y & 0xffff);
            return (((x >> 16) + (y >> 16) + (l >> 16)) << 16) | (l & 0xffff);
        }
        function rol(n, c) { return (n << c) | (n >>> (32 - c)); }
        function cmn(q, a, b, x, s, t) { return add(rol(add(add(a, q), add(x, t)), s), b); }
        function ff(a, b, c, d, x, s, t) { return cmn((b & c) | (~b & d), a, b, x, s, t); }
        function gg(a, b, c, d, x, s, t) { return cmn((b & d) | (c & ~d), a, b, x, s, t); }
        function hh(a, b, c, d, x, s, t) { return cmn(b ^ c ^ d, a, b, x, s, t); }
        function ii(a, b, c, d, x, s, t) { return cmn(c ^ (b | ~d), a, b, x, s, t); }

        var bytes = unescape(encodeURIComponent(str));
        var n = bytes.length, words = [], i;
        for (i = 0; i < n; i++) words[i >> 2] |= bytes.charCodeAt(i) << ((i % 4) * 8);
        words[n >> 2] |= 0x80 << ((n % 4) * 8);
        words[(((n + 8) >> 6) + 1) * 16 - 2] = n * 8;

        var a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
        for (i = 0; i < words.length; i += 16) {
            var x = [];
            for (var j = 0; j < 16; j++) x[j] = words[i + j] | 0;
            var oa = a, ob = b, oc = c, od = d;
            a = ff(a, b, c, d, x[0], 7, -680876936); d = ff(d, a, b, c, x[1], 12, -389564586); c = ff(c, d, a, b, x[2], 17, 606105819); b = ff(b, c, d, a, x[3], 22, -1044525330);
            a = ff(a, b, c, d, x[4], 7, -176418897); d = ff(d, a, b, c, x[5], 12, 1200080426); c = ff(c, d, a, b, x[6], 17, -1473231341); b = ff(b, c, d, a, x[7], 22, -45705983);
            a = ff(a, b, c, d, x[8], 7, 1770035416); d = ff(d, a, b, c, x[9], 12, -1958414417); c = ff(c, d, a, b, x[10], 17, -42063); b = ff(b, c, d, a, x[11], 22, -1990404162);
            a = ff(a, b, c, d, x[12], 7, 1804603682); d = ff(d, a, b, c, x[13], 12, -40341101); c = ff(c, d, a, b, x[14], 17, -1502002290); b = ff(b, c, d, a, x[15], 22, 1236535329);
            a = gg(a, b, c, d, x[1], 5, -165796510); d = gg(d, a, b, c, x[6], 9, -1069501632); c = gg(c, d, a, b, x[11], 14, 643717713); b = gg(b, c, d, a, x[0], 20, -373897302);
            a = gg(a, b, c, d, x[5], 5, -701558691); d = gg(d, a, b, c, x[10], 9, 38016083); c = gg(c, d, a, b, x[15], 14, -660478335); b = gg(b, c, d, a, x[4], 20, -405537848);
            a = gg(a, b, c, d, x[9], 5, 568446438); d = gg(d, a, b, c, x[14], 9, -1019803690); c = gg(c, d, a, b, x[3], 14, -187363961); b = gg(b, c, d, a, x[8], 20, 1163531501);
            a = gg(a, b, c, d, x[13], 5, -1444681467); d = gg(d, a, b, c, x[2], 9, -51403784); c = gg(c, d, a, b, x[7], 14, 1735328473); b = gg(b, c, d, a, x[12], 20, -1926607734);
            a = hh(a, b, c, d, x[5], 4, -378558); d = hh(d, a, b, c, x[8], 11, -2022574463); c = hh(c, d, a, b, x[11], 16, 1839030562); b = hh(b, c, d, a, x[14], 23, -35309556);
            a = hh(a, b, c, d, x[1], 4, -1530992060); d = hh(d, a, b, c, x[4], 11, 1272893353); c = hh(c, d, a, b, x[7], 16, -155497632); b = hh(b, c, d, a, x[10], 23, -1094730640);
            a = hh(a, b, c, d, x[13], 4, 681279174); d = hh(d, a, b, c, x[0], 11, -358537222); c = hh(c, d, a, b, x[3], 16, -722521979); b = hh(b, c, d, a, x[6], 23, 76029189);
            a = hh(a, b, c, d, x[9], 4, -640364487); d = hh(d, a, b, c, x[12], 11, -421815835); c = hh(c, d, a, b, x[15], 16, 530742520); b = hh(b, c, d, a, x[2], 23, -995338651);
            a = ii(a, b, c, d, x[0], 6, -198630844); d = ii(d, a, b, c, x[7], 10, 1126891415); c = ii(c, d, a, b, x[14], 15, -1416354905); b = ii(b, c, d, a, x[5], 21, -57434055);
            a = ii(a, b, c, d, x[12], 6, 1700485571); d = ii(d, a, b, c, x[3], 10, -1894986606); c = ii(c, d, a, b, x[10], 15, -1051523); b = ii(b, c, d, a, x[1], 21, -2054922799);
            a = ii(a, b, c, d, x[8], 6, 1873313359); d = ii(d, a, b, c, x[15], 10, -30611744); c = ii(c, d, a, b, x[6], 15, -1560198380); b = ii(b, c, d, a, x[13], 21, 1309151649);
            a = ii(a, b, c, d, x[4], 6, -145523070); d = ii(d, a, b, c, x[11], 10, -1120210379); c = ii(c, d, a, b, x[2], 15, 718787259); b = ii(b, c, d, a, x[9], 21, -343485551);
            a = add(a, oa); b = add(b, ob); c = add(c, oc); d = add(d, od);
        }
        var hex = "";
        [a, b, c, d].forEach(function (v) {
            for (var k = 0; k < 4; k++) hex += ("0" + ((v >> (k * 8)) & 0xff).toString(16)).slice(-2);
        });
        return hex;
    }

    // --- jsb.reflection: the Java bridge (CommonUtil, PayHelper) ---
    var javaStubs = {
        "org/cocos2dx/javascript/CommonUtil": {
            gotoUrl: function (url) { global.open(url, "_blank", "noopener"); },
            md5: md5,
            getMetaData: function () { return ""; },
            getLocaleLanguage: function () { return navigator.language || "en"; }
        },
        "net/dice7/pay/PayHelper": {
            // IAP is already free in the mod; init/exit have no browser equivalent.
            init: function () {},
            exitGame: function () {}
        }
    };

    // --- jsb.fileUtils: only the search-path / existence calls the loader uses ---
    var searchPaths = [""];

    global.jsb = global.jsb || {};
    jsb.reflection = {
        callStaticMethod: function (className, methodName, signature) {
            var cls = javaStubs[className];
            if (cls && cls[methodName]) return cls[methodName].apply(null, Array.prototype.slice.call(arguments, 3));
            cc.log("[web] unhandled native call " + className + "." + methodName);
        }
    };
    jsb.fileUtils = {
        getSearchPaths: function () { return searchPaths.slice(); },
        setSearchPaths: function (paths) { searchPaths = paths.slice(); },
        isFileExist: function (path) {
            var xhr = new XMLHttpRequest();
            try {
                xhr.open("HEAD", path, false);
                xhr.send();
                return xhr.status >= 200 && xhr.status < 300;
            } catch (e) {
                return false;
            }
        }
    };

    // --- JSB script loading (used when switching language in Settings) ---
    // Native `require` executes a script synchronously in global scope.
    global.require = function (path) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", path, false);
        xhr.send();
        if (xhr.status < 200 || xhr.status >= 300) throw new Error("require failed: " + path);
        (0, eval)(xhr.responseText + "\n//# sourceURL=" + path);
    };
    global.__cleanScript = function () {};
})();
