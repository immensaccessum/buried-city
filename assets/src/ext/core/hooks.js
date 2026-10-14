// Ordered filters. Core seams call utils.hook(), which delegates here once this
// file has loaded. Listeners that only need a notification use utils.emitter.
var Hooks = {
    _filters: {},

    add: function (name, fn, priority) {
        var list = this._filters[name];
        if (!list) {
            list = [];
            this._filters[name] = list;
        }
        list.push({fn: fn, priority: priority || 0});
        list.sort(function (a, b) {
            return a.priority - b.priority;
        });
    },

    filter: function (name, value, ctx) {
        var list = this._filters[name];
        if (!list) {
            return value;
        }
        for (var i = 0; i < list.length; i++) {
            var next = list[i].fn(value, ctx || {});
            if (next !== undefined) {
                value = next;
            }
        }
        return value;
    }
};
