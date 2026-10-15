// Sleep is a real rest. Mood does not sink in bed, and a night brings some of it back.
// Coffee and vodka stay the fast spike.
Balance.mood.sleepSpiritMul = 6;
Balance.mood.coffeeSleepSeconds = 21600;

var MoodExt = {
    bedRate: function () {
        if (!player || !player.room) {
            return 0;
        }
        var bedLevel = player.room.getBuildLevel(9);
        if (player.isInSleepHotel) {
            bedLevel = 2;
        }
        if (bedLevel < 0) {
            bedLevel = 0;
        }
        if (!buildActionConfig[9] || !buildActionConfig[9][bedLevel]) {
            return 0;
        }
        var rate = buildActionConfig[9][bedLevel].rate;
        rate = rate * 0.5 + player.starve / player.starveMax * 0.2 + player.spirit / player.spiritMax * 0.3;
        return rate;
    },

    recoverSleepSpirit: function () {
        if (!player || !player.isInSleep) {
            return 0;
        }
        var gain = Math.ceil(this.bedRate() * Balance.mood.sleepSpiritMul);
        var sinceCoffee = Number(cc.timer.time) - player.lastCoffeeTime;
        if (sinceCoffee <= Balance.mood.coffeeSleepSeconds) {
            gain = Math.ceil(gain * 0.2);
        }
        if (gain > 0) {
            player.changeSpirit(gain, "sleep");
        }
        return gain;
    }
};

(function () {
    var origAttr = Player.prototype.changeAttr;
    Player.prototype.changeAttr = function (key, value, isSleep) {
        if (key === "spirit" && this.isInSleep && value < 0) {
            return;
        }
        return origAttr.call(this, key, value, isSleep);
    };

    var origUpdate = Player.prototype.updateByTime;
    Player.prototype.updateByTime = function () {
        origUpdate.call(this);
        MoodExt.recoverSleepSpirit();
    };
})();
