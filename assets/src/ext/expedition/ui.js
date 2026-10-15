(function () {
    var origShowSiteDialog = uiUtil.showSiteDialog;
    uiUtil.showSiteDialog = function () {
        ExpeditionExt.inMapDialog = true;
        try {
            return origShowSiteDialog.apply(this, arguments);
        } finally {
            ExpeditionExt.inMapDialog = false;
        }
    };

    var origBattleBegin = BattleAndWorkNode.prototype.createBattleBeginView;
    BattleAndWorkNode.prototype.createBattleBeginView = function () {
        origBattleBegin.call(this);
        var room = this.room;
        if (!room || room.type !== "battle" || room.baited) {
            return;
        }
        if (!player || player.nowSiteId == 500 || !ExpeditionExt.hasMeat()) {
            return;
        }
        var node = this.bg.getChildByName("node");
        var fight = node && node.getChildByName("btn");
        if (!node || !fight) {
            return;
        }
        fight.setPosition(node.width * 0.3, 60);
        var self = this;
        var bait = uiUtil.createCommonBtnWhite(stringUtil.getString("exp_bait_btn"), this, function () {
            if (self._baitUsed) {
                return;
            }
            self._baitUsed = true;
            ExpeditionExt.applyBait(self.room);
            if (node.getParent()) {
                node.removeFromParent();
            }
            if (!self.room.list.length) {
                if (self.site.isInSecretRooms) {
                    self.site.secretRoomEnd();
                } else {
                    self.site.roomEnd(true);
                    self.site.testSecretRoomsBegin();
                }
            }
            self._baitUsed = false;
            self.updateView();
        });
        bait.setName("bait");
        bait.setPosition(node.width * 0.7, 60);
        node.addChild(bait);
    };
})();
