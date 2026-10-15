// Radio log, note flags, and which endings the corridor may offer.
// Listeners bind from restore/onNewGame because game.init() replaces utils.emitter.
var StoryExt = {
    radioNext: 0,
    flags: {},
    notes: {},
    preview: null,
    stepMs: 2500,
    leadMs: 2000,
    creditMs: 3000,
    creditLeadMs: 4000,
    _emitter: null,

    blank: function () {
        return {radioNext: 0, flags: {}, notes: {}};
    },

    today: function () {
        if (cc.timer && cc.timer.getTimeNum) {
            return cc.timer.getTimeNum();
        }
        return 1;
    },

    noteById: function (itemId) {
        var id = String(itemId);
        var i;
        for (i = 0; i < StoryConfig.notes.length; i++) {
            if (StoryConfig.notes[i].id === id) {
                return StoryConfig.notes[i];
            }
        }
        return null;
    },

    noteForSite: function (siteId) {
        var i;
        for (i = 0; i < StoryConfig.notes.length; i++) {
            if (Number(StoryConfig.notes[i].site) === Number(siteId)) {
                return StoryConfig.notes[i];
            }
        }
        return null;
    },

    noteCount: function () {
        var n = 0;
        var id;
        for (id in this.notes) {
            if (this.notes.hasOwnProperty(id) && this.notes[id]) {
                n++;
            }
        }
        return n;
    },

    noteFound: function (itemId) {
        var note = this.noteById(itemId);
        if (!note) {
            return;
        }
        this.notes[note.id] = 1;
    },

    signalReady: function () {
        if (!this.flags.radio_done) {
            return false;
        }
        var distress = typeof EventsExt !== "undefined" && EventsExt.flags && EventsExt.flags.distress_noted;
        return !!(distress || this.noteCount() >= Balance.story.signalNeedNotes);
    },

    peopleReady: function () {
        if (!player || !player.npcManager) {
            return false;
        }
        var n = 0;
        var ids = Balance.story.peopleIds;
        var i;
        for (i = 0; i < ids.length; i++) {
            var npc = player.npcManager.getNPC(ids[i]);
            if (npc && npc.isUnlocked && npc.reputation >= Balance.story.peopleRep) {
                n++;
            }
        }
        return n >= Balance.story.peopleNeed;
    },

    filterChoices: function () {
        var self = this;
        return StoryConfig.endings.filter(function (ending) {
            if (ending.always) {
                return true;
            }
            if (ending.when === "signal") {
                return self.signalReady();
            }
            if (ending.when === "people") {
                return self.peopleReady();
            }
            return false;
        });
    },

    choices: function () {
        if (this.preview) {
            var want = this.preview;
            this.preview = null;
            var picked = StoryConfig.endings.filter(function (ending) {
                return ending.id === want;
            });
            if (picked.length) {
                return picked;
            }
        }
        return this.filterChoices();
    },

    radioKey: function () {
        return "radio" + utils.SAVE_SLOT;
    },

    pushRadio: function (text) {
        var log = [];
        try {
            log = JSON.parse(cc.sys.localStorage.getItem(this.radioKey()) || "[]");
        } catch (err) {
            log = [];
        }
        if (!Array.isArray(log)) {
            log = [];
        }
        log.unshift({
            uid: StoryConfig.radioUid,
            msg: text,
            time: Math.round(cc.timer && cc.timer.time ? cc.timer.time : 0)
        });
        if (log.length > 30) {
            log.pop();
        }
        cc.sys.localStorage.setItem(this.radioKey(), JSON.stringify(log));
    },

    catchUp: function () {
        if (!player || !player.room || !player.room.getBuild) {
            return;
        }
        if (player.room.getBuildLevel(Balance.story.radioBuild) < 0) {
            return;
        }
        var day = this.today();
        while (this.radioNext < StoryConfig.radio.length && StoryConfig.radio[this.radioNext].day <= day) {
            var entry = StoryConfig.radio[this.radioNext];
            this.pushRadio(stringUtil.getString(entry.key));
            if (entry.flag) {
                this.flags[entry.flag] = 1;
            }
            this.radioNext++;
        }
    },

    bind: function () {
        if (!utils.emitter || this._emitter === utils.emitter) {
            return;
        }
        this._emitter = utils.emitter;
        var self = this;
        utils.emitter.on("day.start", function () {
            self.catchUp();
        });
        utils.emitter.on("build_node_update", function () {
            self.catchUp();
        });
        this.catchUp();
    },

    fast: function (on) {
        if (on) {
            this.stepMs = 40;
            this.leadMs = 40;
            this.creditMs = 40;
            this.creditLeadMs = 40;
        } else {
            this.stepMs = 2500;
            this.leadMs = 2000;
            this.creditMs = 3000;
            this.creditLeadMs = 4000;
        }
    }
};

Hooks.add("loot.itemIds", function (itemIds, ctx) {
    if (!ctx || !ctx.site) {
        return itemIds;
    }
    var note = StoryExt.noteForSite(ctx.site.id);
    if (!note || StoryExt.notes[note.id]) {
        return itemIds;
    }
    itemIds = itemIds.slice();
    itemIds.push(note.id);
    return itemIds;
});

(function () {
    var orig = Storage.prototype.increaseItem;
    Storage.prototype.increaseItem = function (itemId, num, includeWater, bypassCheck) {
        var result = orig.call(this, itemId, num, includeWater, bypassCheck);
        if (Number(num) > 0) {
            StoryExt.noteFound(itemId);
        }
        return result;
    };
})();

Ext.register({
    id: "story",
    save: function () {
        return {
            radioNext: StoryExt.radioNext,
            flags: StoryExt.flags,
            notes: StoryExt.notes
        };
    },
    restore: function (saved) {
        var data = saved || {};
        StoryExt.radioNext = data.radioNext || 0;
        StoryExt.flags = data.flags || {};
        StoryExt.notes = data.notes || {};
        StoryExt.preview = null;
        StoryExt._emitter = null;
        StoryExt.bind();
    },
    onNewGame: function () {
        var blank = StoryExt.blank();
        StoryExt.radioNext = blank.radioNext;
        StoryExt.flags = blank.flags;
        StoryExt.notes = blank.notes;
        StoryExt.preview = null;
        StoryExt._emitter = null;
        StoryExt.bind();
    }
});
