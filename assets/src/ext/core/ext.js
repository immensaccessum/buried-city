// Per-slot subsystem persistence. Modules register; Player.save/restore stores
// the whole map under one "ext" field, so new systems do not edit player.js again.
var Ext = {
    modules: [],

    register: function (mod) {
        this.modules.push(mod);
    },

    saveAll: function () {
        var out = {};
        for (var i = 0; i < this.modules.length; i++) {
            var mod = this.modules[i];
            if (mod.save) {
                out[mod.id] = mod.save();
            }
        }
        return out;
    },

    // saved === undefined/null (Buried City v45 slots) runs onNewGame per module.
    restoreAll: function (saved) {
        var has = saved && typeof saved === "object";
        for (var i = 0; i < this.modules.length; i++) {
            var mod = this.modules[i];
            if (has && Object.prototype.hasOwnProperty.call(saved, mod.id)) {
                if (mod.restore) {
                    mod.restore(saved[mod.id]);
                }
            } else if (mod.onNewGame) {
                mod.onNewGame();
            }
        }
    }
};
