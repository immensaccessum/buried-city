EventsExt.openDialog = function (ev, choices) {
    var scene = cc.director.getRunningScene && cc.director.getRunningScene();
    if (typeof DialogSmall === "undefined" || !scene || !scene.getChildByName("main")) {
        EventsExt.open = false;
        EventsExt.current = null;
        EventsExt.afterResult(false);
        return;
    }
    if (cc.timer && cc.timer.pause) {
        cc.timer.pause();
    }
    var config = {
        title: {title: stringUtil.getString("evt_" + ev.id + "_title")},
        content: {des: stringUtil.getString("evt_" + ev.id + "_des")},
        action: {}
    };
    var names = ["btn_1", "btn_2", "btn_3"];
    var i;
    for (i = 0; i < choices.length && i < 3; i++) {
        (function (choice) {
            config.action[names[i]] = {
                txt: stringUtil.getString("evt_" + ev.id + "_" + choice.id),
                cb: function () {
                    EventsExt.choose(choice);
                }
            };
        })(choices[i]);
    }
    var dialog = new DialogSmall(config);
    dialog.show();
};

EventsExt.openResult = function (des, battle) {
    if (typeof DialogTiny === "undefined" || !cc.director.getRunningScene()) {
        EventsExt.afterResult(battle);
        return;
    }
    var config = {
        title: {title: ""},
        content: {des: des},
        action: {
            btn_1: {
                txt: stringUtil.getString(1073),
                cb: function () {
                    EventsExt.afterResult(battle);
                }
            }
        }
    };
    var dialog = new DialogTiny(config);
    dialog.show();
};
