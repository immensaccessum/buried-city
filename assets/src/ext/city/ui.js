// Map-corner danger marks. Entity is rebuilt every time the map opens.
ExtAssets.add("map_danger_0.png");
ExtAssets.add("map_danger_1.png");
ExtAssets.add("map_danger_2.png");
ExtAssets.add("map_danger_3.png");
ExtAssets.add("map_empty.png");

(function () {
    var orig = Entity.prototype.updateStatus;
    Entity.prototype.updateStatus = function () {
        orig.call(this);
        var old = this.getChildByName("cityDanger");
        if (old) {
            this.removeChild(old);
        }
        if (!this.baseSite || !CityExt.isTracked(this.baseSite)) {
            return;
        }
        var state = CityExt.siteState(this.baseSite.id);
        var filename = state.clearedDay != null
            ? "map_empty.png"
            : "map_danger_" + CityExt.dangerLevel(state) + ".png";
        var icon = autoSpriteFrameController.getSpriteFromSpriteName(filename);
        icon.setName("cityDanger");
        icon.setScale(0.9);
        icon.setAnchorPoint(0.5, 0.5);
        icon.setPosition(this.width - 14, this.height - 14);
        this.addChild(icon);
    };
})();
