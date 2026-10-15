var ExpeditionExt = {
    inMapDialog: false,
    stats: {
        baits: 0,
        extraZombies: 0
    },

    noisePoints: function () {
        if (!player || !player.equip) {
            return 0;
        }
        var cfg = Balance.expedition.noise;
        var points = 0;
        if (player.equip.getEquip(EquipmentPos.GUN)) {
            points += cfg.gun;
        }
        if (player.dogState) {
            points += cfg.dog;
        }
        if (player.useMoto && player.hasMotocycle && player.hasMotocycle()) {
            points += cfg.moto;
        }
        return points;
    },

    noiseLevel: function () {
        var points = this.noisePoints();
        var levels = Balance.expedition.noise.levels;
        if (points >= levels[1]) {
            return 2;
        }
        if (points >= levels[0]) {
            return 1;
        }
        return 0;
    },

    loadRatio: function () {
        if (!player || !player.bag) {
            return 0;
        }
        var total = player.bag.getTotalWeight() || 1;
        return player.bag.getCurrentWeight() / total;
    },

    loadLevel: function () {
        var ratio = this.loadRatio();
        var levels = Balance.expedition.load.levels;
        if (ratio >= levels[1]) {
            return 2;
        }
        if (ratio >= levels[0]) {
            return 1;
        }
        return 0;
    },

    dodgeMul: function () {
        return Balance.expedition.load.dodgeMul[this.loadLevel()];
    },

    hasBinoculars: function () {
        if (!player || !player.bag) {
            return false;
        }
        return player.bag.getNumByItemId(Balance.expedition.scout.itemId) > 0;
    },

    hasMeat: function () {
        if (!player || !player.bag) {
            return false;
        }
        var bait = Balance.expedition.bait;
        return player.bag.getNumByItemId(bait.itemId) >= bait.num;
    },

    summaryLine: function () {
        var noise = string["exp_noise_" + this.noiseLevel()] || "";
        var load = string["exp_load_" + this.loadLevel()] || "";
        var current = 0;
        var total = 0;
        if (player && player.bag) {
            current = Math.round(player.bag.getCurrentWeight());
            total = player.bag.getTotalWeight();
        }
        return cc.formatStr(string["exp_summary"] || "", noise, current, total, load);
    },

    scoutLine: function (site) {
        if (!this.hasBinoculars() || !site || !site.rooms) {
            return "";
        }
        var battles = 0;
        var loot = 0;
        var dangerLo = 0;
        var dangerHi = 0;
        var start = site.step || 0;
        var i;
        for (i = start; i < site.rooms.length; i++) {
            var room = site.rooms[i];
            if (!room) {
                continue;
            }
            if (room.type === "battle") {
                battles++;
                var diff = room.difficulty || 0;
                if (diff > 0) {
                    if (!dangerLo || diff < dangerLo) {
                        dangerLo = diff;
                    }
                    if (diff > dangerHi) {
                        dangerHi = diff;
                    }
                }
            }
            if (room.type === "work" && room.list) {
                room.list.forEach(function (cell) {
                    loot += cell.num || 1;
                });
            }
        }
        var danger = "0";
        if (dangerHi) {
            danger = dangerLo === dangerHi ? String(dangerHi) : dangerLo + "–" + dangerHi;
        }
        var marks = Balance.expedition.scout.lootLevels;
        var lootLevel = 0;
        if (loot >= marks[1]) {
            lootLevel = 2;
        } else if (loot >= marks[0]) {
            lootLevel = 1;
        }
        var lootName = string["exp_loot_" + lootLevel] || "";
        return cc.formatStr(string["exp_scout"] || "", danger, battles, lootName);
    },

    dialogExtra: function (site) {
        var parts = [];
        var summary = this.summaryLine();
        if (summary) {
            parts.push(summary);
        }
        var scout = this.scoutLine(site);
        if (scout) {
            parts.push(scout);
        }
        return parts.join("\n");
    },

    log: function (key, num) {
        if (!player || !player.log) {
            return;
        }
        var text = stringUtil.getString(key, num);
        if (text) {
            player.log.addMsg(text);
        }
    },

    // One roll per battle room. The flag is stored on the room, so a save keeps it.
    rollExtra: function (site, room) {
        if (!room || room.type !== "battle" || room.noiseRolled || !room.list || !room.list.length) {
            return;
        }
        if (!site || typeof CityExt === "undefined" || !CityExt.isTracked(site)) {
            return;
        }
        if (!player || player.nowSiteId == 500 || player.nowSiteId == 502) {
            return;
        }
        room.noiseRolled = 1;
        var chance = Balance.expedition.noise.extraZombieChance[this.noiseLevel()];
        if (Math.random() >= chance) {
            return;
        }
        room.list.push(room.list[0]);
        this.stats.extraZombies++;
        this.log("exp_log_noise", 1);
    },

    // Drops 1-2 zombies, but leaves one standing unless the room had only one.
    applyBait: function (room) {
        var bait = Balance.expedition.bait;
        if (!room || !room.list || !player || !player.bag) {
            return 0;
        }
        if (!player.bag.validateItem(bait.itemId, bait.num)) {
            return 0;
        }
        player.bag.decreaseItem(bait.itemId, bait.num);
        var remove = utils.getRandomInt(bait.remove[0], bait.remove[1]);
        if (room.list.length <= 1) {
            remove = room.list.length;
        } else if (remove > room.list.length - 1) {
            remove = room.list.length - 1;
        }
        if (remove > 0) {
            room.list.splice(room.list.length - remove, remove);
        }
        room.baited = 1;
        this.stats.baits++;
        this.log("exp_log_bait", remove);
        return remove;
    }
};

Hooks.add("travel.speed", function (speed) {
    var mul = Balance.expedition.load.speedMul[ExpeditionExt.loadLevel()];
    return speed * mul;
});

Hooks.add("travel.encounterChance", function (chance) {
    var mul = Balance.expedition.noise.encounterMul[ExpeditionExt.noiseLevel()];
    return chance * mul;
});

(function () {
    var origRoomBegin = Site.prototype.roomBegin;
    Site.prototype.roomBegin = function () {
        var room = origRoomBegin.call(this);
        ExpeditionExt.rollExtra(this, room);
        return room;
    };

    var origGetDes = Site.prototype.getDes;
    Site.prototype.getDes = function () {
        var base = origGetDes.call(this);
        if (!ExpeditionExt.inMapDialog) {
            return base;
        }
        var extra = ExpeditionExt.dialogExtra(this);
        if (!extra) {
            return base;
        }
        return base + "\n" + extra;
    };

    var ExpeditionBattle = Battle.extend({
        ctor: function (battleInfo, isDodge, difficulty, banditOverride, endLogOverride) {
            this._super(battleInfo, isDodge, difficulty, banditOverride, endLogOverride);
            if (this.isDodge && this.dodgeTime) {
                this.dodgeTime *= ExpeditionExt.dodgeMul();
            }
        }
    });
    Battle = ExpeditionBattle;
})();

Ext.register({
    id: "expedition",
    save: function () {
        return {
            baits: ExpeditionExt.stats.baits,
            extraZombies: ExpeditionExt.stats.extraZombies
        };
    },
    restore: function (saved) {
        ExpeditionExt.stats = {
            baits: (saved && saved.baits) || 0,
            extraZombies: (saved && saved.extraZombies) || 0
        };
    },
    onNewGame: function () {
        ExpeditionExt.stats = {
            baits: 0,
            extraZombies: 0
        };
    }
});
