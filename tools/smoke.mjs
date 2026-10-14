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
        if (!SampleExt.data || !SampleExt.data.binoculars) return "restore";
        if (player.storage.getNumByItemId(1106061) !== 1) return "item-after-reload";
        return "clean";
    })()`);
    if (migrated !== "clean") fail("save " + migrated);
    else ok("v45 save migrates, binoculars round-trip");

    if (logs.length) fail("exceptions:\\n" + logs.slice(0, 5).join("\\n"));
    else ok("no exceptions");
} catch (err) {
    fail(err && err.stack ? err.stack : String(err));
} finally {
    chrome.kill();
}
process.exit(failed);
