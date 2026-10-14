// Named balance constants. Gameplay reads these instead of literals so later
// systems (city phases, difficulty presets) can retune without hunting magic numbers.
// The big day-band tables stay in MoonlightingConfig.js and are aliased here.
var Balance = {
    moonlighting: MoonlightingConfig,
    randomBattle: RandomBattleConfig,
    virusGain: virusGainConfig,

    food: {
        winterMul: 1.25,
        summerMul: 0.75
    },

    theft: {
        stealthSkipChance: 0.25
    },

    mood: {
        newbieDays: 6,
        newbieSpirit: 20,
        suicideBelow: 5,
        suicideChance: [0.6, 0.45, 0.32, 0.21, 0.12],
        filter30: 0.85,
        filter20: 0.7,
        filter10: 0.55
    },

    bazaar: {
        tier15: 0.05,
        tier10: 0.15,
        tier5: 0.3,
        off15: 15,
        off10: 10,
        off5: 5
    },

    travel: {
        stealthReduction: 0.25,
        detectorReduction: 0.25,
        banditChance: 0.25,
        banditChanceStealthOff: 0.1875,
        banditDifficulty: [1, 2]
    },

    home: {
        fencePerLevel: 10,
        dogDef: 10,
        electricDef: 30,
        bombDef: 30,
        fullDefense: 80,
        stealthRaidReduction: 0.25,
        raidImmuneDays: 2
    },

    power: {
        plantLastMinutes: 96 * 60,
        plantBreakChance: 0.03,
        gasLastMinutes: 72 * 60,
        gasBreakChance: 0.03
    },

    combat: {
        moodPreciseFloor: 80,
        moodPrecisePerPoint: 0.006,
        goodBulletPrecise: 0.15,
        alcoholWindow: 43200,
        alcoholHour: 3600,
        alcoholPrecisePerHour: 0.02,
        dogLootAbove: 0.8
    }
};
