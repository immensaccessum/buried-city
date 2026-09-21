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
})();
