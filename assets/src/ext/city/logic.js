// Loose change is not a real item. The wallet is player.currency.
itemConfig.money = {
    id: "money",
    weight: 0,
    price: 1,
    value: 0
};

// Living city: day phases, per-site depletion and infestation, loot that returns.
// Listeners are bound from restore/onNewGame because game.init() replaces utils.emitter.
var CityExt = {
    migrated: false,
    sites: {},
    _emitter: null,

    blank: function () {
        return {
            visits: 0,
            lastVisitDay: null,
            clearedDay: null,
            depletion: 0,
            infestation: 0,
            decayApplied: 0
        };
    },

    today: function () {
        if (cc.timer && cc.timer.getTimeNum) {
            return cc.timer.getTimeNum();
        }
        return 1;
    },

    phaseIndex: function (day) {
        day = day || this.today();
        var phases = Balance.city.phases;
        var found = 0;
        for (var i = 0; i < phases.length; i++) {
            var band = phases[i].day;
            if (band.length === 1) {
                if (day >= band[0]) {
                    found = i;
                }
            } else if (day >= band[0] && day <= band[1]) {
                found = i;
            }
        }
        return found;
    },

    // Index of the active day band. Day 1 is phase 0.
    phase: function (day) {
        return this.phaseIndex(day);
    },

    phaseRow: function (day) {
        return Balance.city.phases[this.phaseIndex(day)];
    },

    isTracked: function (site) {
        if (!site || !(site instanceof Site)) {
            return false;
        }
        if (site instanceof AdSite || site instanceof WorkSite || site instanceof BazaarSite || site instanceof BossSite) {
            return false;
        }
        var id = Number(site.id);
        if (id === HOME_SITE || id === AD_SITE || id === WORK_SITE || id === GAS_SITE || id === BAZAAR_SITE || id === BOSS_SITE) {
            return false;
        }
        if (id >= 301 && id <= 312) {
            return false;
        }
        var rooms = (site.config.battleRoom || 0) + (site.config.workRoom || 0);
        return rooms > 0;
    },

    siteState: function (siteId) {
        var key = String(siteId);
        if (!this.sites[key]) {
            this.sites[key] = this.blank();
        }
        return this.sites[key];
    },

    dangerLevel: function (state) {
        var level = (state.infestation || 0) + this.phaseRow().diffShift;
        if (level < 0) {
            level = 0;
        }
        if (level > 3) {
            level = 3;
        }
        return level;
    },

    log: function (key, site) {
        if (!player || !player.log || !site || !site.getName) {
            return;
        }
        var text = stringUtil.getString(key, site.getName());
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
        utils.emitter.on("site.enter", function (ctx) {
            self.onEnter(ctx);
        });
        utils.emitter.on("site.roomEnd", function (ctx) {
            self.onRoomEnd(ctx);
        });
        utils.emitter.on("day.midnight", function () {
            self.onMidnight();
        });
    },

    onEnter: function (ctx) {
        if (!player || !player.map || !ctx) {
            return;
        }
        var site = player.map.getSite(ctx.siteId);
        if (!this.isTracked(site)) {
            return;
        }
        var state = this.siteState(site.id);
        var today = this.today();
        var row = this.phaseRow(today);
        if (state.lastVisitDay != null && today - state.lastVisitDay < row.regenDays) {
            if (state.depletion < Balance.city.depletionMax) {
                state.depletion++;
                this.log("city_log_deplete", site);
            }
        }
        state.visits++;
        state.lastVisitDay = today;
        state.decayApplied = 0;
        this.seedOpenRooms(site);
    },

    ensureMoneyArt: function () {
        if (typeof cc === "undefined" || !cc.spriteFrameCache) {
            return;
        }
        if (cc.spriteFrameCache.getSpriteFrame("dig_item_money.png")) {
            return;
        }
        var frame = cc.spriteFrameCache.getSpriteFrame("icon_item_money.png");
        if (frame) {
            cc.spriteFrameCache.addSpriteFrame(frame, "dig_item_money.png");
        }
    },

    // How many coins a group of searchable rooms is hiding.
    rollCash: function (site, rooms) {
        var mul = 1;
        if (site && this.isTracked(site)) {
            var state = this.siteState(site.id);
            var row = this.phaseRow();
            mul = row.lootMul * (1 - Balance.city.depletionStep * (state.depletion || 0));
            if (mul < Balance.city.lootFloor) {
                mul = Balance.city.lootFloor;
            }
        }
        var total = 0;
        var i;
        for (i = 0; i < rooms; i++) {
            if (Math.random() >= Balance.city.cashChance) {
                continue;
            }
            total += utils.getRandomInt(Balance.city.cashMin, Balance.city.cashMax);
        }
        return Math.round(total * mul);
    },

    seedOpenRooms: function (site) {
        this.ensureMoneyArt();
        this.seedRooms(site, site.rooms, site.step || 0);
        this.seedRooms(site, site.secretRooms, site.secretRoomsStep || 0);
    },

    // Rooms generated before cash existed have no flag. Mark them so a second visit does not add more.
    seedRooms: function (site, rooms, from) {
        if (!rooms) {
            return;
        }
        var i;
        for (i = from; i < rooms.length; i++) {
            var room = rooms[i];
            if (!room || room.cashRolled || room.type !== "work" || !room.list) {
                continue;
            }
            room.cashRolled = 1;
            var n = this.rollCash(site, 1);
            if (n > 0) {
                room.list.push({itemId: "money", num: n});
            }
        }
    },

    onRoomEnd: function (ctx) {
        if (!ctx || !ctx.win || !ctx.site || !this.isTracked(ctx.site)) {
            return;
        }
        if (!ctx.site.isSiteEnd()) {
            return;
        }
        var state = this.siteState(ctx.site.id);
        state.clearedDay = this.today();
        state.infestation = 0;
    },

    onMidnight: function () {
        if (!player || !player.map) {
            return;
        }
        var today = this.today();
        var row = this.phaseRow(today);
        for (var id in player.map.siteMap) {
            var site = player.map.siteMap[id];
            if (!this.isTracked(site)) {
                continue;
            }
            var state = this.siteState(site.id);
            if (state.clearedDay != null && today - state.clearedDay >= row.regenDays) {
                site.genRooms();
                site.step = 0;
                site.closed = false;
                state.clearedDay = null;
                this.log("city_log_regen", site);
            }
            var seen = state.lastVisitDay == null ? 1 : state.lastVisitDay;
            if (today - seen > row.infestDays && state.infestation < row.infestMax) {
                state.infestation++;
                this.log("city_log_infest", site);
            }
            if (state.depletion > 0 && state.lastVisitDay != null) {
                var periods = Math.floor((today - state.lastVisitDay) / row.regenDays);
                var applied = state.decayApplied || 0;
                if (periods > applied) {
                    state.depletion = Math.max(0, state.depletion - (periods - applied));
                    state.decayApplied = periods;
                }
            }
        }
    },

    // v45 slots and any new game: a closed district stays on the map and restocks next midnight.
    reopenClosed: function () {
        if (!player || !player.map) {
            return;
        }
        var today = this.today();
        var regen = this.phaseRow(today).regenDays;
        for (var id in player.map.siteMap) {
            var site = player.map.siteMap[id];
            if (!this.isTracked(site) || !site.closed) {
                continue;
            }
            site.closed = false;
            var state = this.siteState(site.id);
            state.clearedDay = today - regen;
            state.depletion = 1;
        }
    },

    describe: function (site) {
        var state = this.siteState(site.id);
        var today = this.today();
        var row = this.phaseRow(today);
        var parts = [];
        var phaseName = string["city_phase_" + this.phaseIndex(today)];
        var dangerName = string["city_danger_" + this.dangerLevel(state)];
        if (phaseName) {
            parts.push(phaseName);
        }
        if (dangerName) {
            parts.push(dangerName);
        }
        if (state.depletion > 0 && string["city_depleted"]) {
            parts.push(string["city_depleted"]);
        }
        if (state.clearedDay != null && string["city_regen_in"]) {
            var left = row.regenDays - (today - state.clearedDay);
            if (left < 0) {
                left = 0;
            }
            parts.push(cc.formatStr(string["city_regen_in"], left));
        }
        return parts.map(function (part) {
            part = String(part).replace(/\s+$/, "");
            if (!/[.!?…]$/.test(part)) {
                part += ".";
            }
            return part;
        }).join(" ");
    }
};

Hooks.add("loot.itemIds", function (itemIds, ctx) {
    CityExt.ensureMoneyArt();
    var rooms = (ctx.site && ctx.site.config && ctx.site.config.workRoom) || 0;
    var n = CityExt.rollCash(ctx.site, rooms);
    if (n <= 0) {
        return itemIds;
    }
    itemIds = itemIds.slice();
    var i;
    for (i = 0; i < n; i++) {
        itemIds.push("money");
    }
    return itemIds;
});

Hooks.add("loot.produceValue", function (value, ctx) {
    if (!ctx.site || !CityExt.isTracked(ctx.site)) {
        return value;
    }
    var state = CityExt.siteState(ctx.site.id);
    var row = CityExt.phaseRow();
    var mul = row.lootMul * (1 - Balance.city.depletionStep * state.depletion);
    if (mul < Balance.city.lootFloor) {
        mul = Balance.city.lootFloor;
    }
    return Math.max(1, Math.round(value * mul));
});

Hooks.add("battle.difficulty", function (diff, ctx) {
    if (ctx.source !== "site" && ctx.source !== "travel") {
        return diff;
    }
    var next = diff + CityExt.phaseRow().diffShift;
    if (ctx.source === "site" && ctx.site && CityExt.isTracked(ctx.site)) {
        next += CityExt.siteState(ctx.site.id).infestation || 0;
    }
    return cc.clampf(next, 1, 12);
});

(function () {
    var origGenRooms = Site.prototype.genRooms;
    Site.prototype.genRooms = function () {
        origGenRooms.call(this);
        if (!this.rooms) {
            return;
        }
        var i;
        for (i = 0; i < this.rooms.length; i++) {
            this.rooms[i].cashRolled = 1;
        }
    };

    var origSecret = Site.prototype.genSecretRooms;
    Site.prototype.genSecretRooms = function () {
        origSecret.call(this);
        var rooms = this.secretRooms;
        if (!rooms || !rooms.length) {
            return;
        }
        var last = rooms[rooms.length - 1];
        if (!last || last.type !== "work" || !last.list) {
            return;
        }
        last.cashRolled = 1;
        var n = CityExt.rollCash(this, 1);
        if (n > 0) {
            last.list.push({itemId: "money", num: n});
        }
    };

    var origBagIncrease = Bag.prototype.increaseItem;
    Bag.prototype.increaseItem = function (itemId, num, includeWater, bypassCheck) {
        if (String(itemId) === "money") {
            player.onCurrencyChange(Number(num) || 0);
            return;
        }
        return origBagIncrease.call(this, itemId, num, includeWater, bypassCheck);
    };

    var origBagWeight = Bag.prototype.validateItemWeight;
    Bag.prototype.validateItemWeight = function (itemId, num) {
        if (String(itemId) === "money") {
            return true;
        }
        return origBagWeight.call(this, itemId, num);
    };

    var origCanClose = Site.prototype.canClose;
    Site.prototype.canClose = function () {
        if (CityExt.isTracked(this)) {
            return false;
        }
        return origCanClose.call(this);
    };

    // The "all items" talent rewinds a finished site every time its map dialog opens.
    // City districts restock on the midnight timer instead, so the same day stays cleared.
    var origGetProgressStr = Site.prototype.getProgressStr;
    Site.prototype.getProgressStr = function (val, id) {
        if (CityExt.isTracked(this)) {
            return this.step + "/" + this.rooms.length;
        }
        return origGetProgressStr.call(this, val, id);
    };

    var origGetDes = Site.prototype.getDes;
    Site.prototype.getDes = function () {
        var base = origGetDes.call(this);
        if (!CityExt.isTracked(this)) {
            return base;
        }
        var extra = CityExt.describe(this);
        if (!extra) {
            return base;
        }
        return base + "\n" + extra;
    };
})();

Ext.register({
    id: "city",
    save: function () {
        return {sites: CityExt.sites};
    },
    restore: function (saved) {
        CityExt.migrated = false;
        CityExt.sites = (saved && saved.sites) ? saved.sites : {};
        CityExt.bind();
    },
    onNewGame: function () {
        CityExt.migrated = true;
        CityExt.sites = {};
        CityExt.bind();
        CityExt.reopenClosed();
    }
});
