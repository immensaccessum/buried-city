// Drops one binoculars into supermarket (site 1) loot. The item has no behavior yet.
var SampleExt = {
    migrated: false,
    data: null
};

ExtAssets.add("icon_item_1106061.png");
ExtAssets.add("dig_item_1106061.png");

Hooks.add("loot.itemIds", function (itemIds, ctx) {
    if (ctx.site && ctx.site.id == 1) {
        itemIds = itemIds.slice();
        itemIds.push("1106061");
    }
    return itemIds;
});

Ext.register({
    id: "sample",
    save: function () {
        return {binoculars: true};
    },
    restore: function (saved) {
        SampleExt.migrated = false;
        SampleExt.data = saved;
    },
    onNewGame: function () {
        SampleExt.migrated = true;
        SampleExt.data = null;
    }
});
