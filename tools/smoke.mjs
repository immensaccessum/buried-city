// Headless Chrome smoke test. Node 20: node --experimental-websocket tools/smoke.mjs
import { spawn } from "node:child_process";

const PORT = process.env.BT_PORT || "8091";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const chrome = spawn("google-chrome", [
    "--headless=new", "--disable-gpu", "--no-sandbox",
    "--remote-debugging-port=9334",
    "--window-size=640,1136",
    "--user-data-dir=/tmp/bt15-chrome",
    "about:blank"
], { stdio: "ignore" });

let failed = 0;
function fail(msg) {
    failed = 1;
    console.error("FAIL " + msg);
}
function ok(msg) {
    console.log("ok " + msg);
}

try {
    await sleep(2000);
    const tabs = await (await fetch("http://localhost:9334/json")).json();
    const tab = tabs.find((t) => t.type === "page") || tabs.find((t) => t.url === "about:blank");
    if (!tab) throw new Error("no page target in " + JSON.stringify(tabs.map((t) => t.url)));
    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    await new Promise((r) => { ws.onopen = r; });
    let id = 0;
    const pending = new Map();
    const logs = [];
    ws.onmessage = (e) => {
        const m = JSON.parse(e.data);
        if (m.id && pending.has(m.id)) {
            pending.get(m.id)(m);
            pending.delete(m.id);
        } else if (m.method === "Runtime.exceptionThrown") {
            logs.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
        }
    };
    const send = (method, params = {}) => new Promise((r) => {
        const i = ++id;
        pending.set(i, r);
        ws.send(JSON.stringify({ id: i, method, params }));
    });
    await send("Runtime.enable");
    await send("Page.navigate", { url: "http://localhost:" + PORT + "/index.html" });

    let booted = "";
    for (let n = 0; n < 40; n++) {
        await sleep(500);
        const ev = await send("Runtime.evaluate", {
            expression: "typeof itemConfig !== 'undefined' && typeof ExtBoot !== 'undefined' ? 'ready' : ''",
            returnByValue: true
        });
        booted = ev.result.result.value || "";
        if (booted === "ready") break;
    }
    if (booted !== "ready") fail("game scripts did not load");
    else ok("scripts loaded");

    const check = async (expr) => (await send("Runtime.evaluate", {
        expression: expr,
        returnByValue: true
    })).result.result.value;

    const report = await check(`(function () {
        cc.sys.localStorage.setItem("chosenTalent1", "[]");
        utils.SAVE_SLOT = 1;
        var problems = [];
        if (typeof Hooks === "undefined") problems.push("Hooks");
        if (typeof Ext === "undefined") problems.push("Ext");
        if (typeof Balance === "undefined") problems.push("Balance");
        if (!itemConfig["1106061"]) problems.push("item");
        if (!string["1106061"] || string["1106061"].title !== "Binoculars") problems.push("string:" + (string["1106061"] && string["1106061"].title));
        if (!cc.spriteFrameCache.getSpriteFrame("icon_item_1106061.png")) problems.push("icon");
        if (!cc.spriteFrameCache.getSpriteFrame("dig_item_1106061.png")) problems.push("dig");
        var site = new Site(1);
        site.genRooms();
        var found = false;
        site.rooms.forEach(function (room) {
            if (room.type !== "work" || !room.list) return;
            room.list.forEach(function (cell) {
                if (String(cell.itemId || (cell.item && cell.item.id)) === "1106061") found = true;
            });
        });
        if (!found) problems.push("loot");
        return problems.join(",") || "clean";
    })()`);
    if (report !== "clean") fail("pipeline " + report);
    else ok("hooks, item, strings, sprites, supermarket loot");

    const migrated = await check(`(function () {
        Record.init("record");
        Record.save("player1", {
            hpMax: 240, hp: 200, hpMaxOrigin: 240,
            spirit: 80, spiritMax: 100, starve: 40, starveMax: 100,
            vigour: 90, vigourMax: 100, injury: 0, injuryMax: 100,
            infect: 0, infectMax: 100, temperature: 15,
            cured: false, binded: false, isAtHome: true, isAtBazaar: false,
            isAtSite: false, nowSiteId: null, deathCausedInfect: false,
            setting: {}, bag: {}, safe: {}, storage: {"1101011": 3},
            isBombActive: false, Steal: 50, totalDistance: 0, currency: 10,
            shopList: [], leftHomeTime: 0, lastCoffeeTime: -999999, lastAlcoholTime: -999999,
            water: 100, waterMax: 100, virus: 0, virusMax: 90, lastWaterTime: -999999,
            weaponRound: {}, mapBattle: {}, fuel: 0, shoeTime: 0, useMoto: true,
            useGoodBullet: true, alcoholPrice: 1, dogState: 0
        });
        Record.save("time1", {time: 6 * 60 * 60 + 1});
        game.init();
        if (!SampleExt.migrated) return "not-migrated";
        if (!CityExt.migrated || !player.save().ext.city) return "city-not-migrated";
        if (player.storage.getNumByItemId(1101011) !== 3) return "wood";
        bt.give(1106061, 1);
        if (player.storage.getNumByItemId(1106061) !== 1) return "give";
        var ext = player.save().ext;
        if (!ext || !ext.sample || !ext.sample.binoculars) return "ext-save";
        Record.saveAll();
        var raw = JSON.parse(cc.sys.localStorage.getItem("record"));
        if (!raw.player1.ext || !raw.player1.ext.sample) return "blob";
        if (!raw.player1.storage["1106061"]) return "blob-item";
        game.init();
        if (SampleExt.migrated) return "remigrated";
        if (CityExt.migrated) return "city-remigrated";
        if (!player.save().ext.city) return "city-lost";
        if (!SampleExt.data || !SampleExt.data.binoculars) return "restore";
        if (player.storage.getNumByItemId(1106061) !== 1) return "item-after-reload";
        return "clean";
    })()`);
    if (migrated !== "clean") fail("save " + migrated);
    else ok("v45 save migrates, binoculars round-trip");

    const city = await check(`(function () {
        function lootValue(rooms) {
            var sum = 0;
            rooms.forEach(function (room) {
                room.forEach(function (cell) {
                    var cfg = itemConfig[cell.itemId];
                    if (cfg) sum += (cfg.value || 0) * (cell.num || 1);
                });
            });
            return sum;
        }
        try {
            if (!Balance.city || typeof CityExt === "undefined") return "missing";
            bt.setDay(1);
            if (CityExt.phase() !== 0) return "phase0:" + CityExt.phase();
            bt.setDay(31);
            if (CityExt.phase() !== 2) return "phase2:" + CityExt.phase();

            bt.setDay(1);
            delete CityExt.sites["2"];
            var early = lootValue(new Site(2).genWorkRoom());
            bt.setDay(61);
            delete CityExt.sites["2"];
            var late = lootValue(new Site(2).genWorkRoom());
            if (!(late < early)) return "loot:" + early + "," + late;

            if (!player.map.getSite(2)) player.map.unlockSite(2);
            var site = player.map.getSite(2);
            var addedTalent = false;
            if (!IAPPackage.isAllItemUnlocked()) {
                IAPPackage.chooseTalent(110);
                addedTalent = true;
            }
            var finished = site.rooms.length;
            site.step = finished;
            site.getProgressStr(1, site.id);
            if (site.step !== finished) return "progress-reset:" + site.step;
            if (addedTalent) IAPPackage.chooseTalent(110);
            site.step = 0;
            delete CityExt.sites["2"];
            bt.setDay(1);
            utils.hookEmit("site.enter", {siteId: 2});
            utils.hookEmit("site.enter", {siteId: 2});
            if (CityExt.sites["2"].depletion !== 1) return "depletion:" + CityExt.sites["2"].depletion;

            CityExt.siteState(2).infestation = 2;
            var diff = utils.hook("battle.difficulty", 3, {site: site, source: "site"});
            if (diff !== 5) return "diff:" + diff;

            site.rooms = [{type: "marker"}];
            site.step = site.rooms.length;
            utils.hookEmit("site.roomEnd", {site: site, room: site.rooms[0], win: true});
            if (CityExt.sites["2"].clearedDay == null) return "not-cleared";
            if (CityExt.sites["2"].infestation !== 0) return "infest-left";
            var regen = CityExt.phaseRow().regenDays;
            if (!player._citySmokeStarted) {
                game.start();
                player._citySmokeStarted = true;
            }
            bt.skipDays(regen + 1);
            if (site.step !== 0) return "step:" + site.step;
            if (site.closed) return "still-closed";
            if (site.rooms[0] && site.rooms[0].type === "marker") return "not-rebuilt";
            if (CityExt.sites["2"].clearedDay != null) return "cleared-stuck";

            if (!player.save().ext.city) return "ext-city";
            Record.saveAll();
            game.init();
            if (CityExt.migrated) return "round-remigrated";
            if (!CityExt.sites || !CityExt.sites["2"]) return "round-restore";

            bt.setDay(1);
            site = player.map.getSite(2);
            site.closed = true;
            Ext.modules.forEach(function (mod) {
                if (mod.id === "city") mod.onNewGame();
            });
            if (site.closed) return "migrate-closed";
            if (CityExt.sites["2"].depletion !== 1) return "migrate-depletion";
            var expectCleared = 1 - Balance.city.phases[0].regenDays;
            if (CityExt.sites["2"].clearedDay !== expectCleared) return "migrate-cleared:" + CityExt.sites["2"].clearedDay;

            CityExt.sites["2"].infestation = 3;
            CityExt.sites["2"].clearedDay = null;
            autoSpriteFrameController.addSpriteFrames("res/site.plist");
            var entity = new Entity(site);
            if (!entity.getChildByName("cityDanger")) return "no-icon";
            return "clean";
        } catch (err) {
            return "throw:" + (err && err.message ? err.message : err);
        }
    })()`);
    if (city !== "clean") fail("city " + city);
    else ok("city phases, depletion, regen, save, migration, map icon");

    const expedition = await check(`(function () {
        var bag = player.bag;
        var origWeight = bag.getCurrentWeight;
        var origMoto = player.hasMotocycle;
        var origUse = player.useMoto;
        var origGun = player.equip.getEquip(EquipmentPos.GUN);
        var origDog = player.dogState;
        var origSite = player.nowSiteId;
        try {
            if (!Balance.expedition || typeof ExpeditionExt === "undefined") return "missing";
            if (!string["exp_summary"] || !string["exp_bait_btn"]) return "strings";

            bag.getCurrentWeight = function () { return 0; };
            if (ExpeditionExt.loadLevel() !== 0) return "load0:" + ExpeditionExt.loadLevel();
            var light = utils.hook("travel.speed", 100, {});
            if (Math.abs(light - 100) > 0.01) return "speed-light:" + light;

            bag.getCurrentWeight = function () { return bag.getTotalWeight(); };
            if (ExpeditionExt.loadLevel() !== 2) return "load2:" + ExpeditionExt.loadLevel();
            var heavy = utils.hook("travel.speed", 100, {});
            if (Math.abs(heavy - 70) > 0.01) return "speed-heavy:" + heavy;
            if (ExpeditionExt.dodgeMul() !== 1.5) return "dodge:" + ExpeditionExt.dodgeMul();
            bag.getCurrentWeight = origWeight;

            player.dogState = 0;
            player.useMoto = false;
            player.equip.unequip(EquipmentPos.GUN);
            if (ExpeditionExt.noiseLevel() !== 0) return "noise0:" + ExpeditionExt.noiseLevel();
            var quiet = utils.hook("travel.encounterChance", 1, {});
            if (Math.abs(quiet - 0.8) > 0.001) return "enc-quiet:" + quiet;

            player.hasMotocycle = function () { return true; };
            player.useMoto = true;
            player.equip.equipPos[EquipmentPos.GUN] = "1301011";
            if (ExpeditionExt.noiseLevel() !== 2) return "noise2:" + ExpeditionExt.noisePoints();
            var loud = utils.hook("travel.encounterChance", 1, {});
            if (Math.abs(loud - 1.3) > 0.001) return "enc-loud:" + loud;

            player.nowSiteId = 1;
            var site = new Site(1);
            site.genRooms();
            var idx = -1;
            var i;
            for (i = 0; i < site.rooms.length; i++) {
                if (site.rooms[i].type === "battle" && site.rooms[i].list && site.rooms[i].list.length) {
                    idx = i;
                    break;
                }
            }
            if (idx < 0) return "no-battle";
            site.step = idx;
            var before = site.rooms[idx].list.length;
            var origRandom = Math.random;
            Math.random = function () { return 0; };
            var room = site.roomBegin();
            Math.random = origRandom;
            if (!room.noiseRolled) return "not-rolled";
            if (room.list.length !== before + 1) return "extra:" + before + "," + room.list.length;
            if (site.roomBegin().list.length !== before + 1) return "rolled-twice";

            player.bag.increaseItem(1103041, 2);
            var had = player.bag.getNumByItemId(1103041);
            var baitRoom = {type: "battle", list: ["m1", "m2", "m3", "m4"]};
            var removed = ExpeditionExt.applyBait(baitRoom);
            if (player.bag.getNumByItemId(1103041) !== had - 1) return "meat";
            if (removed < 1 || removed > 2) return "removed:" + removed;
            if (baitRoom.list.length !== 4 - removed) return "list:" + baitRoom.list.length;
            if (!baitRoom.baited) return "not-baited";
            var one = {type: "battle", list: ["only"]};
            if (ExpeditionExt.applyBait(one) !== 1 || one.list.length !== 0) return "solo";

            ExpeditionExt.inMapDialog = true;
            var des = site.getDes();
            ExpeditionExt.inMapDialog = false;
            if (des.indexOf(string["exp_noise_2"]) < 0) return "summary";
            player.bag.increaseItem(1106061, 1);
            ExpeditionExt.inMapDialog = true;
            des = site.getDes();
            ExpeditionExt.inMapDialog = false;
            if (des.indexOf(string["exp_scout"].slice(0, 5)) < 0 && des.indexOf("Scout") < 0 && des.indexOf("Разведка") < 0 && des.indexOf("侦察") < 0) return "scout:" + des;

            ExpeditionExt.stats.baits = 7;
            ExpeditionExt.stats.extraZombies = 3;
            Record.saveAll();
            game.init();
            if (!player.save().ext.expedition) return "ext-missing";
            if (ExpeditionExt.stats.baits !== 7) return "round-baits:" + ExpeditionExt.stats.baits;
            if (ExpeditionExt.stats.extraZombies !== 3) return "round-extra";
            Ext.modules.forEach(function (mod) {
                if (mod.id === "expedition") mod.onNewGame();
            });
            if (ExpeditionExt.stats.baits !== 0 || ExpeditionExt.stats.extraZombies !== 0) return "newgame";
            return "clean";
        } catch (err) {
            return "throw:" + (err && err.stack ? err.stack : err);
        } finally {
            if (player && player.bag) player.bag.getCurrentWeight = origWeight;
            if (player) {
                player.hasMotocycle = origMoto;
                player.useMoto = origUse;
                player.dogState = origDog;
                player.nowSiteId = origSite;
                if (player.equip) {
                    if (origGun) player.equip.equipPos[EquipmentPos.GUN] = origGun;
                    else player.equip.unequip(EquipmentPos.GUN);
                }
            }
            ExpeditionExt.inMapDialog = false;
        }
    })()`);
    if (expedition !== "clean") fail("expedition " + expedition);
    else ok("expedition load, noise, bait, scout, save");

    if (logs.length) fail("exceptions:\\n" + logs.slice(0, 5).join("\\n"));
    else ok("no exceptions");
} catch (err) {
    fail(err && err.stack ? err.stack : String(err));
} finally {
    chrome.kill();
}
process.exit(failed);
