var ZombiesExt = {
    stats: {injected: 0, bloatedPopped: 0},
    _emitter: null,

    blankStats: function () {
        return {injected: 0, bloatedPopped: 0};
    },

    hasKind: function (list, kind) {
        if (!list) {
            return false;
        }
        var i;
        for (i = 0; i < list.length; i++) {
            var cfg = monsterConfig[String(list[i])];
            if (cfg && cfg.kind === kind) {
                return true;
            }
        }
        return false;
    },

    hasSpecial: function (list) {
        return this.hasKind(list, "runner") || this.hasKind(list, "burst") || this.hasKind(list, "armored");
    },

    digFrame: function (list, difficulty, bandit) {
        if (!bandit && list) {
            var i;
            for (i = 0; i < list.length; i++) {
                var id = String(list[i]);
                if (id === "11" || id === "12" || id === "13") {
                    return "#monster_dig_type_" + id + ".png";
                }
            }
        }
        if (bandit) {
            return "#bandit_dig_" + difficulty + ".png";
        }
        return "#monster_dig_" + difficulty + ".png";
    },

    pickKind: function () {
        var phase = (typeof CityExt !== "undefined") ? CityExt.phase() : 0;
        var infest = 0;
        if (player && player.nowSiteId != null && typeof CityExt !== "undefined" && player.map) {
            var site = player.map.getSite(player.nowSiteId);
            if (CityExt.isTracked(site)) {
                infest = CityExt.siteState(site.id).infestation || 0;
            }
        }
        var rows = Balance.zombies.inject.kinds;
        var pool = [];
        var total = 0;
        var i;
        for (i = 0; i < rows.length; i++) {
            if (phase < rows[i].phaseMin) {
                continue;
            }
            var weight = rows[i].weight;
            if (rows[i].id !== "11") {
                weight += infest * Balance.zombies.inject.infestPull;
            }
            pool.push({id: rows[i].id, w: weight});
            total += weight;
        }
        if (!pool.length || total <= 0) {
            return null;
        }
        var roll = Math.random() * total;
        for (i = 0; i < pool.length; i++) {
            roll -= pool[i].w;
            if (roll <= 0) {
                return pool[i].id;
            }
        }
        return pool[pool.length - 1].id;
    },

    scaleHarm: function (monster, obj, harm) {
        if (!monster || !monster.attr || monster.attr.kind !== "armored") {
            return harm;
        }
        if (harm === Number.MAX_VALUE) {
            return harm;
        }
        if (obj instanceof Gun || obj instanceof Bomb || obj instanceof Flamethrower || obj === "Dog") {
            return harm;
        }
        if (obj instanceof Weapon) {
            return Math.max(1, Math.floor(harm * Balance.zombies.meleeResist));
        }
        return harm;
    },

    onBurstDie: function (monster) {
        if (!monster || !monster.attr || monster.attr.kind !== "burst") {
            return;
        }
        if (monster.useBandit && monster.useBandit()) {
            return;
        }
        this.stats.bloatedPopped++;
        if (player && player.changeAttr) {
            player.changeAttr("virus", Balance.zombies.bloatedVirus);
        }
        var site = player && player.map && player.map.getSite(player.nowSiteId);
        if (typeof CityExt !== "undefined" && CityExt.isTracked(site)) {
            var state = CityExt.siteState(site.id);
            var max = CityExt.phaseRow().infestMax;
            state.infestation = (state.infestation || 0) + 1;
            if (state.infestation > max) {
                state.infestation = max;
            }
        }
        this.log("zom_log_burst");
    },

    onBattleEnd: function (ctx) {
        if (!ctx || !ctx.win || !ctx.battle) {
            return;
        }
        var battle = ctx.battle;
        if (battle.useBandit && battle.useBandit()) {
            return;
        }
        var list = battle.battleInfo && battle.battleInfo.monsterList;
        if (!this.hasKind(list, "armored")) {
            return;
        }
        var site = player && player.map && player.map.getSite(player.nowSiteId);
        if (typeof CityExt === "undefined" || !CityExt.isTracked(site)) {
            return;
        }
        if (player.gainItemsInBag) {
            player.gainItemsInBag(Balance.zombies.armoredLoot);
        }
        this.log("zom_log_armor");
    },

    log: function (key) {
        if (!player || !player.log) {
            return;
        }
        var text = stringUtil.getString(key);
        if (text) {
            player.log.addMsg(text);
        }
    },

    bind: function () {
        if (!utils.emitter || this._emitter === utils.emitter) {
            return;
        }
        this._emitter = utils.emitter;
        var self = this;
        utils.emitter.on("battle.end", function (ctx) {
            self.onBattleEnd(ctx);
        });
    }
};

Hooks.add("battle.monsterList", function (list) {
    if (!list || !list.length || !player) {
        return list;
    }
    var siteId = Number(player.nowSiteId);
    if (siteId === 500 || siteId === 502) {
        return list;
    }
    if (ZombiesExt.hasSpecial(list)) {
        return list;
    }
    if (Math.random() >= Balance.zombies.inject.chance) {
        return list;
    }
    var id = ZombiesExt.pickKind();
    if (!id) {
        return list;
    }
    var copy = list.slice();
    copy[copy.length - 1] = id;
    ZombiesExt.stats.injected++;
    return copy;
});

(function () {
    var origUnder = Monster.prototype.underAtk;
    Monster.prototype.underAtk = function (obj, providedHarm) {
        var scaled = false;
        var origGet;
        if (this.attr && this.attr.kind === "armored" && obj instanceof Weapon && !(obj instanceof Gun) && obj.getHarm) {
            origGet = obj.getHarm;
            var self = this;
            obj.getHarm = function (mon) {
                return ZombiesExt.scaleHarm(self, obj, origGet.call(obj, mon));
            };
            scaled = true;
        }
        try {
            origUnder.call(this, obj, providedHarm);
        } finally {
            if (scaled) {
                obj.getHarm = origGet;
            }
        }
    };

    var origDie = Monster.prototype.die;
    Monster.prototype.die = function (obj) {
        var burst = this.attr && this.attr.kind === "burst" && !(this.useBandit && this.useBandit());
        origDie.call(this, obj);
        if (burst) {
            ZombiesExt.onBurstDie(this);
        }
    };

    var ZombieBattle = Battle.extend({
        ctor: function (battleInfo, isDodge, difficulty, banditOverride, endLogOverride) {
            ZombiesExt.bind();
            this._super(battleInfo, isDodge, difficulty, banditOverride, endLogOverride);
            if (this.isDodge && this.dodgeTime && ZombiesExt.hasKind(battleInfo && battleInfo.monsterList, "runner")) {
                this.dodgeTime *= Balance.zombies.runnerDodgeMul;
                ZombiesExt.log("zom_log_runner");
            }
        }
    });
    Battle = ZombieBattle;
})();

Ext.register({
    id: "zombies",
    save: function () {
        return {
            injected: ZombiesExt.stats.injected,
            bloatedPopped: ZombiesExt.stats.bloatedPopped
        };
    },
    restore: function (saved) {
        var data = saved || {};
        ZombiesExt.stats = {
            injected: data.injected || 0,
            bloatedPopped: data.bloatedPopped || 0
        };
        ZombiesExt._emitter = null;
        ZombiesExt.bind();
    },
    onNewGame: function () {
        ZombiesExt.stats = ZombiesExt.blankStats();
        ZombiesExt._emitter = null;
        ZombiesExt.bind();
    }
});
