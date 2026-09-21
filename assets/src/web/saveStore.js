// SaveStore - the single storage backend for Buried City on the web.
//
// The game persists everything through cc.sys.localStorage.{getItem,setItem,removeItem}
// (on Android that API is backed by an encrypted sqlite3 database inside the native
// engine). Every save slot, achievement, medal, setting and the cemetery log goes
// through those three calls, so this module replaces that object and nothing else in
// the game needs to know where the data lives.
//
// Keys the game uses (for reference / future sync):
//   record                       JSON blob: player<N>, time<N>, navigation<N> for every slot N
//   chosenTalent<N> radio<N> medalTemp<N> ad<N> weather<N>   per-slot extras
//   achievement medal dataLog lastScore cheat               cross-save progress
//   language sound music screenfix ftue modVer uuid username  settings / device
//
// Design: reads are served from an in-memory copy (the game API is synchronous);
// every write goes to the in-memory copy, then to window.localStorage, then to change
// listeners. A future cloud-sync module can subscribe with SaveStore.onChange() to push,
// and call SaveStore.importAll() with remote data to pull. No sync is implemented here.
var SaveStore = (function () {
    var PREFIX = "buriedcity:";
    var data = {};
    var listeners = [];
    var persistent = null;

    try {
        var probe = PREFIX + "__probe__";
        window.localStorage.setItem(probe, "1");
        window.localStorage.removeItem(probe);
        persistent = window.localStorage;
    } catch (e) {
        console.warn("[SaveStore] localStorage unavailable, progress will not survive a reload", e);
    }

    if (persistent) {
        for (var i = 0; i < persistent.length; i++) {
            var k = persistent.key(i);
            if (k && k.indexOf(PREFIX) === 0) data[k.substr(PREFIX.length)] = persistent.getItem(k);
        }
    }

    function persist(key, value) {
        if (!persistent) return;
        try {
            if (value === null) persistent.removeItem(PREFIX + key);
            else persistent.setItem(PREFIX + key, value);
        } catch (e) {
            console.error("[SaveStore] write failed for " + key, e);
        }
    }

    function emit(key, value) {
        for (var i = 0; i < listeners.length; i++) {
            try {
                listeners[i](key, value);
            } catch (e) {
                console.error("[SaveStore] listener error", e);
            }
        }
    }

    function set(key, value, silent) {
        key = String(key);
        if (value !== null) value = String(value);
        if (data[key] === value || (value === null && !(key in data))) return;
        if (value === null) delete data[key];
        else data[key] = value;
        persist(key, value);
        if (!silent) emit(key, value);
    }

    return {
        // --- cc.sys.localStorage API used by the game ---
        getItem: function (key) {
            key = String(key);
            return key in data ? data[key] : null;
        },
        setItem: function (key, value) {
            set(key, value === undefined || value === null ? "" : value);
        },
        removeItem: function (key) {
            set(key, null);
        },
        clear: function () {
            Object.keys(data).forEach(function (k) {
                set(k, null);
            });
        },

        // --- hooks for tooling / a future sync module ---
        keys: function () {
            return Object.keys(data);
        },
        // Plain object copy of everything the game has stored.
        exportAll: function () {
            var out = {};
            for (var k in data) out[k] = data[k];
            return out;
        },
        // Replace (or merge) stored data, e.g. with a snapshot fetched from a server.
        // Listeners are not notified (the data came from outside). The game reads most
        // state on scene start, so reload the page (or return to the menu) afterwards.
        importAll: function (snapshot, merge) {
            if (!merge) {
                Object.keys(data).forEach(function (k) {
                    if (!(k in snapshot)) set(k, null, true);
                });
            }
            for (var k in snapshot) set(k, snapshot[k], true);
        },
        // fn(key, valueOrNull) after each local write. Returns an unsubscribe function.
        onChange: function (fn) {
            listeners.push(fn);
            return function () {
                var i = listeners.indexOf(fn);
                if (i !== -1) listeners.splice(i, 1);
            };
        },
        isPersistent: function () {
            return !!persistent;
        }
    };
})();

cc.sys.localStorage = SaveStore;
