// Behaviour differences between the native JSB engine the game was written against
// and cocos2d-html5 v3.6. Loaded right after the engine, before any game script.
(function () {
    // JSB: new cc.ControlButton(label) -> button with that title and an empty background.
    // html5: a single argument is taken as the background sprite. Normalise to JSB.
    var buttonCtor = cc.ControlButton.prototype.ctor;
    cc.ControlButton.prototype.ctor = function (label, backgroundSprite, fontSize) {
        if (label && backgroundSprite === undefined && fontSize === undefined && !(label instanceof cc.Scale9Sprite))
            return buttonCtor.call(this, label, new cc.Scale9Sprite());
        return buttonCtor.apply(this, arguments);
    };

    // cocos2d-x/JSB API missing from html5 v3.6.
    cc.Node.prototype.removeChildByName = function (name, cleanup) {
        var child = this.getChildByName(name);
        if (child) this.removeChild(child, cleanup);
    };

    // JSB reports a script error and keeps running. In html5 an exception thrown during a
    // frame stops the requestAnimationFrame loop (frozen game), and one thrown during touch
    // dispatch leaves the event manager in "dispatching" state so new listeners never
    // register. Log and continue, like native.
    function logError(where, e) {
        console.error("[" + where + "] " + ((e && e.stack) || e));
    }
    var mainLoop = cc.DisplayLinkDirector.prototype.mainLoop;
    cc.DisplayLinkDirector.prototype.mainLoop = function () {
        try {
            mainLoop.apply(this, arguments);
        } catch (e) {
            logError("mainLoop", e);
        }
    };
    var dispatchEvent = cc.eventManager.dispatchEvent;
    cc.eventManager.dispatchEvent = function (event) {
        var depth = this._inDispatch;
        try {
            return dispatchEvent.apply(this, arguments);
        } catch (e) {
            this._inDispatch = depth;
            logError("event", e);
        }
    };
})();
