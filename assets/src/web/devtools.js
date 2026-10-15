// Web-only helpers for exercising day phases and loot without playing for hours.
// Loaded from project.json; every call reads globals at use time, after the game starts.
window.bt = {
    skipDays: function (n) {
        if (!cc.timer) {
            return;
        }
        cc.timer.updateTime((n || 1) * 24 * 60 * 60);
    },
    setDay: function (n) {
        if (!cc.timer) {
            return;
        }
        var dayIndex = Math.max(0, (n || 1) - 1);
        cc.timer.time = dayIndex * 24 * 60 * 60 + 6 * 60 * 60 + 1;
        cc.timer.realTime = cc.timer.time / cc.timer.timeScale;
        cc.timer.currentSeason = cc.timer.getSeason();
    },
    give: function (itemId, n) {
        player.storage.increaseItem(itemId, n || 1, true);
        Record.saveAll();
    },
    dump: function () {
        return {
            day: cc.timer.getTimeNum(),
            hp: player.hp,
            spirit: player.spirit,
            ext: player.save().ext
        };
    },
    city: function () {
        if (typeof CityExt === "undefined") {
            return null;
        }
        return {
            phase: CityExt.phase(),
            sites: CityExt.sites
        };
    },
    events: function () {
        if (typeof EventsExt === "undefined") {
            return null;
        }
        return {
            last: EventsExt.last,
            flags: EventsExt.flags,
            pending: EventsExt.pending,
            raidTonight: EventsExt.raidTonight,
            fogToday: EventsExt.fogToday
        };
    },
    event: function (id) {
        if (typeof EventsExt === "undefined") {
            return null;
        }
        var ev = EventsExt.byId(id);
        if (!ev) {
            return "unknown";
        }
        EventsExt.fire(ev, {trigger: ev.trigger, siteId: player && player.nowSiteId});
        return ev.id;
    },
    zombies: function () {
        if (typeof ZombiesExt === "undefined") {
            return null;
        }
        return {
            injected: ZombiesExt.stats.injected,
            bloatedPopped: ZombiesExt.stats.bloatedPopped
        };
    },
    exp: function () {
        if (typeof ExpeditionExt === "undefined") {
            return null;
        }
        var site = null;
        if (player && player.map && player.nowSiteId != null) {
            site = player.map.getSite(player.nowSiteId);
        }
        return {
            noise: ExpeditionExt.noiseLevel(),
            load: ExpeditionExt.loadLevel(),
            summary: ExpeditionExt.summaryLine(),
            scout: site ? ExpeditionExt.scoutLine(site) : ""
        };
    }
};
