// Loose PNGs in res/ext/ registered under their filename, so existing UI lookups
// ("#icon_item_<id>.png") work without repacking TexturePacker atlases.
var ExtAssets = {
    frames: [],

    add: function (filename) {
        this.frames.push(filename);
    },

    register: function () {
        for (var i = 0; i < this.frames.length; i++) {
            this._registerOne(this.frames[i]);
        }
    },

    _registerOne: function (filename) {
        var path = "res/ext/" + filename;
        var sprite = new cc.Sprite(path);
        var frame = sprite.getSpriteFrame();
        if (!frame || sprite.width <= 0) {
            cc.log("ExtAssets: missing texture " + path);
            return;
        }
        cc.spriteFrameCache.addSpriteFrame(frame, filename);
    }
};
