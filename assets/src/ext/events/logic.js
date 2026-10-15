var EventsExt = {
    last: {},
    flags: {},
    pending: [],
    raidTonight: false,
    fogToday: false,
    open: false,
    lastShown: null,
    current: null,
    travelCb: null,
    _emitter: null,
    _flushScheduled: false,

    blank: function () {
        return {
            last: {},
            flags: {},
            pending: [],
            raidTonight: false,
            fogToday: false
        };
    },

    today: function () {
        if (cc.timer && cc.timer.getTimeNum) {
            return cc.timer.getTimeNum();
        }
        return 1;
    },

    byId: function (id) {
        var i;
        for (i = 0; i < EventConfig.length; i++) {
            if (EventConfig[i].id === id) {
                return EventConfig[i];
            }
        }
        return null;
    },

    hasNeed: function (need) {
        if (!need || !player) {
            return true;
        }
        if (need.currency) {
            return player.currency >= need.currency;
        }
        if (need.item) {
            var num = need.num || 1;
            if (player.bag && player.bag.validateItem(need.item, num)) {
                return true;
            }
            if (player.storage && player.storage.validateItem(need.item, num)) {
                return true;
            }
            return false;
        }
        return true;
    },

    takeNeed: function (need) {
        if (!need || !player) {
            return;
        }
        if (need.currency) {
            player.onCurrencyChange(-need.currency);
            return;
        }
        if (need.item) {
            var num = need.num || 1;
            if (player.bag && player.bag.validateItem(need.item, num)) {
                player.bag.decreaseItem(need.item, num);
                return;
            }
            if (player.storage && player.storage.validateItem(need.item, num)) {
                player.storage.decreaseItem(need.item, num);
            }
        }
    },

    eligible: function (ev, ctx) {
        ctx = ctx || {};
        if (!ev) {
            return false;
        }
        if (ctx.trigger && ev.trigger !== ctx.trigger) {
            return false;
        }
        if (this.last[ev.id] && ev.once) {
            return false;
        }
        var when = ev.when || {};
        var day = this.today();
        if (when.day) {
            if (day < when.day[0]) {
                return false;
            }
            if (when.day[1] && day > when.day[1]) {
                return false;
            }
        }
        if (ev.cooldown && this.last[ev.id] != null && day - this.last[ev.id] < ev.cooldown) {
            return false;
        }
        if (when.phaseMin != null && typeof CityExt !== "undefined") {
            if (CityExt.phaseIndex(day) < when.phaseMin) {
                return false;
            }
        }
        if (when.atHome && !(player && player.isAtHome)) {
            return false;
        }
        if (when.plant != null) {
            var plant = player && player.map && player.map.getSite(WORK_SITE);
            var active = !!(plant && plant.isActive);
            if (active !== when.plant) {
                return false;
            }
        }
        if (when.npc) {
            var npc = player && player.npcManager && player.npcManager.getNPC(when.npc);
            if (!npc || !npc.isUnlocked) {
                return false;
            }
            if (when.npcRepMin != null && npc.reputation < when.npcRepMin) {
                return false;
            }
        }
        if (when.item) {
            if (!this.hasNeed({item: when.item, num: when.num || 1})) {
                return false;
            }
        }
        if (when.dog && !(player && player.dogState)) {
            return false;
        }
        if (when.weatherId != null) {
            if (!player || !player.weather || player.weather.weatherId !== when.weatherId) {
                return false;
            }
        }
        if (when.flag && !this.flags[when.flag]) {
            return false;
        }
        if (when.notFlag && this.flags[when.notFlag]) {
            return false;
        }
        if (when.siteTracked) {
            var siteId = ctx.siteId != null ? ctx.siteId : (player && player.nowSiteId);
            var site = player && player.map && player.map.getSite(siteId);
            if (typeof CityExt === "undefined" || !CityExt.isTracked(site)) {
                return false;
            }
        }
        return true;
    },

    pick: function (trigger, ctx) {
        ctx = ctx || {};
        ctx.trigger = trigger;
        var pool = [];
        var i;
        for (i = 0; i < EventConfig.length; i++) {
            var ev = EventConfig[i];
            if (this.eligible(ev, ctx)) {
                pool.push(ev);
            }
        }
        if (!pool.length) {
            return null;
        }
        var total = 0;
        for (i = 0; i < pool.length; i++) {
            total += pool[i].weight || 1;
        }
        var roll = Math.random() * total;
        for (i = 0; i < pool.length; i++) {
            roll -= pool[i].weight || 1;
            if (roll <= 0) {
                return pool[i];
            }
        }
        return pool[pool.length - 1];
    },

    tryFire: function (trigger, ctx) {
        ctx = ctx || {};
        ctx.trigger = trigger;
        var ev = this.pick(trigger, ctx);
        if (!ev) {
            return false;
        }
        this.fire(ev, ctx);
        return true;
    },

    fire: function (ev, ctx) {
        this.last[ev.id] = this.today();
        this.lastShown = ev.id;
        if (this.open || (typeof GLOBAL_DIALOGS !== "undefined" && GLOBAL_DIALOGS > 0)) {
            this.pending.push({id: ev.id, ctx: ctx || {}});
            return;
        }
        this.show(ev, ctx || {});
    },

    visibleChoices: function (ev) {
        var list = [];
        var i;
        for (i = 0; i < ev.choices.length; i++) {
            if (this.hasNeed(ev.choices[i].need)) {
                list.push(ev.choices[i]);
            }
        }
        return list;
    },

    show: function (ev, ctx) {
        this.open = true;
        this.current = {ev: ev, ctx: ctx || {}};
        if (ctx && ctx.travelCb) {
            this.travelCb = ctx.travelCb;
        }
        if (typeof EventsExt.openDialog === "function") {
            EventsExt.openDialog(ev, this.visibleChoices(ev));
            return;
        }
        this.open = false;
    },

    choose: function (choice) {
        var current = this.current;
        this.current = null;
        this.open = false;
        if (!current) {
            this.finishTravel();
            return;
        }
        if (choice && choice.need) {
            this.takeNeed(choice.need);
        }
        var outcome = choice && choice.outcome ? choice.outcome : {};
        this.apply(outcome, current.ctx || {});
        var logKey = outcome.log;
        if (outcome.roll && outcome._rolled && outcome._rolled.log) {
            logKey = outcome._rolled.log;
        }
        var battle = !!(outcome.battle || (outcome._rolled && outcome._rolled.battle));
        if (typeof EventsExt.openResult === "function" && logKey && string[logKey]) {
            EventsExt.openResult(string[logKey], battle);
            return;
        }
        this.afterResult(battle);
    },

    afterResult: function (battle) {
        if (cc.timer && cc.timer.isPaused && cc.timer.isPaused()) {
            cc.timer.resume();
        }
        if (battle) {
            this.startTravelBattle();
            return;
        }
        this.finishTravel();
        this.scheduleFlush();
    },

    finishTravel: function () {
        var cb = this.travelCb;
        this.travelCb = null;
        if (cb) {
            cb();
        }
    },

    startTravelBattle: function () {
        var cb = this.travelCb;
        this.travelCb = null;
        if (!player || !player.randomAttack) {
            if (cb) {
                cb();
            }
            return;
        }
        var stage = cc.timer.getStage();
        var timeObj = cc.timer.formatTime();
        var config;
        var i;
        for (i = 0; i < RandomBattleConfig.strength.length; i++) {
            var strengthObj = RandomBattleConfig.strength[i];
            if (timeObj.d >= strengthObj.time[0] && timeObj.d <= (strengthObj.time[1] ? strengthObj.time[1] : Number.MAX_VALUE)) {
                config = strengthObj[stage];
                break;
            }
        }
        var diff = utils.getRandomInt(config.difficulty[0], config.difficulty[1]);
        diff = utils.hook("battle.difficulty", diff, {source: "travel"});
        var list = utils.getMonsterListByDifficulty(diff);
        player.mapBattle = {a: diff, b: list, c: 0, d: null};
        Record.saveAll();
        EventsExt._origRandomAttack.call(player, cb, true);
    },

    neighbors: function (count, originId) {
        if (!player || !player.map) {
            return [];
        }
        originId = originId || player.nowSiteId || HOME_SITE;
        var origin = player.map.getSite(originId) || player.map.getSite(HOME_SITE);
        if (!origin || !origin.pos) {
            return [];
        }
        var ranked = [];
        var id;
        for (id in player.map.siteMap) {
            var site = player.map.siteMap[id];
            if (typeof CityExt === "undefined" || !CityExt.isTracked(site) || site.id == origin.id) {
                continue;
            }
            var dx = site.pos.x - origin.pos.x;
            var dy = site.pos.y - origin.pos.y;
            ranked.push({site: site, d: dx * dx + dy * dy});
        }
        ranked.sort(function (a, b) {
            return a.d - b.d;
        });
        var out = [];
        var i;
        for (i = 0; i < ranked.length && out.length < count; i++) {
            out.push(ranked[i].site);
        }
        return out;
    },

    infestSites: function (sites, spec) {
        if (typeof CityExt === "undefined" || !sites) {
            return;
        }
        var i;
        for (i = 0; i < sites.length; i++) {
            var state = CityExt.siteState(sites[i].id);
            var max = CityExt.phaseRow().infestMax;
            if (spec.set != null) {
                state.infestation = spec.set;
            } else {
                state.infestation = (state.infestation || 0) + (spec.n > 0 ? 1 : 0);
            }
            if (state.infestation > max) {
                state.infestation = max;
            }
            if (state.infestation < 0) {
                state.infestation = 0;
            }
        }
    },

    stealFromStorage: function (count) {
        if (!player || !player.storage) {
            return;
        }
        var ids = [];
        player.storage.forEach(function (item, num) {
            if (num > 0) {
                ids.push(item.id);
            }
        });
        var i;
        for (i = 0; i < count && ids.length; i++) {
            var index = utils.getRandomInt(0, ids.length - 1);
            var itemId = ids[index];
            if (player.storage.validateItem(itemId, 1)) {
                player.storage.decreaseItem(itemId, 1);
            }
            if (!player.storage.validateItem(itemId, 1)) {
                ids.splice(index, 1);
            }
        }
    },

    apply: function (outcome, ctx) {
        if (!outcome) {
            return;
        }
        if (outcome.roll) {
            var total = 0;
            var i;
            for (i = 0; i < outcome.roll.length; i++) {
                total += outcome.roll[i].w || 1;
            }
            var roll = Math.random() * total;
            var picked = outcome.roll[outcome.roll.length - 1];
            for (i = 0; i < outcome.roll.length; i++) {
                roll -= outcome.roll[i].w || 1;
                if (roll <= 0) {
                    picked = outcome.roll[i];
                    break;
                }
            }
            outcome._rolled = picked;
            this.apply(picked, ctx);
            return;
        }
        var blocked = outcome.chance != null && Math.random() >= outcome.chance;
        if (!blocked) {
        if (outcome.items && player && player.gainItems) {
            player.gainItems(outcome.items);
        }
        if (outcome.bagItems && player && player.gainItemsInBag) {
            player.gainItemsInBag(outcome.bagItems);
        }
        if (outcome.siteItems && player && player.map) {
            var siteId = ctx && ctx.siteId != null ? ctx.siteId : player.nowSiteId;
            var site = player.map.getSite(siteId);
            if (site && site.storage) {
                outcome.siteItems.forEach(function (item) {
                    site.storage.increaseItem(item.itemId, item.num, true);
                });
            }
        }
        if (outcome.currency && player && player.onCurrencyChange) {
            player.onCurrencyChange(outcome.currency);
        }
        if (outcome.attrs && player && player.changeAttr) {
            var key;
            for (key in outcome.attrs) {
                player.changeAttr(key, outcome.attrs[key]);
            }
        }
        if (outcome.reputation && player && player.npcManager) {
            var npc = player.npcManager.getNPC(outcome.reputation.npc);
            if (npc) {
                npc.changeReputation(outcome.reputation.d);
            }
        }
        if (outcome.reputationAll && player && player.npcManager) {
            var npcId;
            for (npcId in player.npcManager.npcList) {
                var n = player.npcManager.npcList[npcId];
                if (n && n.isUnlocked) {
                    n.changeReputation(outcome.reputationAll);
                }
            }
        }
        if (outcome.flag) {
            this.flags[outcome.flag] = 1;
        }
        if (outcome.plant === false && player && player.map) {
            var plant = player.map.getSite(WORK_SITE);
            if (plant && plant.isActive) {
                plant.isActive = false;
                Record.saveAll();
                utils.emitter.emit("onWorkSiteChange", false);
                player.log.addMsg(6679);
            }
        }
        if (outcome.infest) {
            var targets;
            if (outcome.infest.mode === "current") {
                var cur = player && player.map && player.map.getSite(player.nowSiteId);
                targets = cur ? [cur] : [];
            } else {
                var howMany = outcome.infest.n || 1;
                if (outcome.infest.set != null) {
                    howMany = Math.max(howMany, 1);
                }
                targets = this.neighbors(howMany);
            }
            this.infestSites(targets, outcome.infest);
        }
        if (outcome.raidTonight) {
            this.raidTonight = true;
        }
        if (outcome.fogToday) {
            this.fogToday = true;
        }
        if (outcome.steal) {
            this.stealFromStorage(outcome.steal);
        }
        }
        if (outcome.log && player && player.log) {
            var text = stringUtil.getString(outcome.log);
            if (text) {
                player.log.addMsg(text);
            }
        }
    },

    scheduleFlush: function () {
        if (this._flushScheduled) {
            return;
        }
        if (!cc.director || !player) {
            this.flush();
            return;
        }
        this._flushScheduled = true;
        var self = this;
        cc.director.getScheduler().scheduleCallbackForTarget(player, function () {
            self._flushScheduled = false;
            self.flush();
        }, 0, 0, 0);
    },

    flush: function () {
        if (this.open || (typeof GLOBAL_DIALOGS !== "undefined" && GLOBAL_DIALOGS > 0)) {
            return;
        }
        if (!this.pending.length) {
            return;
        }
        var next = this.pending.shift();
        var ev = this.byId(next.id);
        if (ev) {
            this.show(ev, next.ctx || {});
        }
    },

    bind: function () {
        if (!utils.emitter || this._emitter === utils.emitter) {
            return;
        }
        this._emitter = utils.emitter;
        var self = this;
        utils.emitter.on("day.start", function () {
            self.raidTonight = false;
            self.tryFire("day.start", {});
        });
        utils.emitter.on("night.start", function () {
            self.fogToday = false;
            self.tryFire("night.start", {});
        });
        utils.emitter.on("site.enter", function (ctx) {
            self.tryFire("site.enter", ctx || {});
        });
    }
};

Hooks.add("home.raidChance", function (chance) {
    if (EventsExt.raidTonight) {
        return chance * Balance.events.raidMul;
    }
    return chance;
});

Hooks.add("travel.encounterChance", function (chance) {
    if (EventsExt.fogToday) {
        return chance * Balance.events.fogEncounterMul;
    }
    return chance;
});

(function () {
    EventsExt._origRandomAttack = Player.prototype.randomAttack;
    Player.prototype.randomAttack = function (cb, override) {
        if (override) {
            return EventsExt._origRandomAttack.call(this, cb, true);
        }
        if (Math.random() < Balance.events.travelReplace) {
            var ev = EventsExt.pick("travel", {});
            if (ev) {
                var stage = cc.timer.getStage();
                var timeObj = cc.timer.formatTime();
                var config;
                var i;
                for (i = 0; i < RandomBattleConfig.strength.length; i++) {
                    var strengthObj = RandomBattleConfig.strength[i];
                    if (timeObj.d >= strengthObj.time[0] && timeObj.d <= (strengthObj.time[1] ? strengthObj.time[1] : Number.MAX_VALUE)) {
                        config = strengthObj[stage];
                        break;
                    }
                }
                if (config) {
                    var rand = Math.random();
                    var probability = config.probability;
                    if (IAPPackage.isStealthUnlocked() && !this.stealthInactive) {
                        probability -= probability * Balance.travel.stealthReduction;
                    }
                    if (player.equip && player.equip.isEquiped(1305053)) {
                        probability -= probability * Balance.travel.detectorReduction;
                    }
                    probability = utils.hook("travel.encounterChance", probability, {stage: stage, day: timeObj.d, config: config});
                    if (rand <= probability) {
                        this.mapBattle = {};
                        EventsExt.fire(ev, {trigger: "travel", travelCb: cb});
                        return true;
                    }
                }
            }
        }
        return EventsExt._origRandomAttack.call(this, cb, false);
    };

    var origDismiss = Dialog.prototype.dismiss;
    Dialog.prototype.dismiss = function () {
        origDismiss.apply(this, arguments);
        if (typeof EventsExt !== "undefined") {
            EventsExt.scheduleFlush();
        }
    };
})();

Ext.register({
    id: "events",
    save: function () {
        return {
            last: EventsExt.last,
            flags: EventsExt.flags,
            pending: EventsExt.pending,
            raidTonight: EventsExt.raidTonight,
            fogToday: EventsExt.fogToday
        };
    },
    restore: function (saved) {
        var data = saved || {};
        EventsExt.last = data.last || {};
        EventsExt.flags = data.flags || {};
        EventsExt.pending = data.pending || [];
        EventsExt.raidTonight = !!data.raidTonight;
        EventsExt.fogToday = !!data.fogToday;
        EventsExt.open = false;
        EventsExt.current = null;
        EventsExt.bind();
    },
    onNewGame: function () {
        var blank = EventsExt.blank();
        EventsExt.last = blank.last;
        EventsExt.flags = blank.flags;
        EventsExt.pending = blank.pending;
        EventsExt.raidTonight = false;
        EventsExt.fogToday = false;
        EventsExt.open = false;
        EventsExt.current = null;
        EventsExt.bind();
    }
});
