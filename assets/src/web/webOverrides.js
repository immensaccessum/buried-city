// Browser-only overrides applied after the game scripts load (see WebBoot).
// Everything that needed a server or a native widget is replaced with an offline stand-in.

// Update check: the native build polls a code.org JSON for newer APKs. Offline here.
utils.checkVersion = function () {};
utils.getVersionString = function (cb, target) {
    if (cb) cb.call(target, {"statusCode": 304});
};

// Message wall (chatScene): backed by a code.org datablock server. Show it as offline.
chatLayer.prototype.initData = function () {};
chatLayer.prototype.fetchMessages = function () {
    this.handleNewMessages([{id: 1, m: "The message wall needs a server and is not available in the web version."}], true);
};
chatLayer.prototype.sendMessage = function () {};

// DialogMoreGame shows the bundled credits page (index_en.html / index_zh.html) in a
// native ccui.WebView, which cocos2d-html5 v3.6 does not have. Use a DOM overlay instead.
// The credits must stay reachable (license.txt, condition 2).
var DialogMoreGame = cc.Class.extend({
    ctor: function (file) {
        this.file = file;
    },
    show: function () {
        var overlay = document.createElement("div");
        overlay.style.cssText = "position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,.85);display:flex;flex-direction:column;"
            + "padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom);";
        var close = document.createElement("button");
        close.textContent = "Close";
        close.style.cssText = "font:bold 18px sans-serif;padding:14px;border:0;background:#222;color:#eee;";
        var frame = document.createElement("iframe");
        frame.src = this.file;
        frame.style.cssText = "flex:1;border:0;background:#e8eae7;width:100%;";
        close.onclick = function () {
            overlay.parentNode.removeChild(overlay);
        };
        overlay.appendChild(close);
        overlay.appendChild(frame);
        document.body.appendChild(overlay);
    }
});
