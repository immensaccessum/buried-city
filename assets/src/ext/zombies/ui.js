ExtAssets.add("monster_dig_type_11.png");
ExtAssets.add("monster_dig_type_12.png");
ExtAssets.add("monster_dig_type_13.png");

(function () {
    function swapDig(getName, run) {
        var orig = autoSpriteFrameController.getSpriteFromSpriteName;
        autoSpriteFrameController.getSpriteFromSpriteName = function (name) {
            if (typeof name === "string" && name.indexOf("#monster_dig_") === 0 && name.indexOf("type_") < 0 && name.indexOf("mid") < 0) {
                var frame = getName();
                if (frame && frame !== name) {
                    return orig.call(autoSpriteFrameController, frame);
                }
            }
            return orig.call(autoSpriteFrameController, name);
        };
        try {
            run();
        } finally {
            autoSpriteFrameController.getSpriteFromSpriteName = orig;
        }
    }

    var origBegin = BattleAndWorkNode.prototype.createBattleBeginView;
    BattleAndWorkNode.prototype.createBattleBeginView = function () {
        var room = this.room;
        swapDig(function () {
            return ZombiesExt.digFrame(room && room.list, room && room.difficulty, player && player.nowSiteId == 500);
        }, origBegin.bind(this));
    };

    var origDialog = RandomBattleDialog.prototype.ctor;
    RandomBattleDialog.prototype.ctor = function (battleInfo, cb) {
        swapDig(function () {
            return ZombiesExt.digFrame(battleInfo && battleInfo.list, battleInfo && battleInfo.difficulty, battleInfo && battleInfo.type);
        }, origDialog.bind(this, battleInfo, cb));
    };
})();
