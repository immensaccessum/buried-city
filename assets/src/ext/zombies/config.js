Balance.zombies = {
    runnerDodgeMul: 0.65,
    bloatedVirus: 8,
    meleeResist: 0.4,
    armoredLoot: [{itemId: "1101011", num: 2}],
    inject: {
        chance: 0.45,
        infestPull: 1,
        kinds: [
            {id: "11", phaseMin: 0, weight: 3},
            {id: "12", phaseMin: 1, weight: 2},
            {id: "13", phaseMin: 2, weight: 2}
        ]
    }
};

monsterConfig["11"] = {
    id: 11,
    hp: 50,
    speed: 3,
    attackSpeed: 0.5,
    attack: 7,
    range: 0,
    prefixType: 11,
    kind: "runner"
};
monsterConfig["12"] = {
    id: 12,
    hp: 220,
    speed: 1,
    attackSpeed: 1,
    attack: 14,
    range: 0,
    prefixType: 12,
    kind: "burst"
};
monsterConfig["13"] = {
    id: 13,
    hp: 140,
    speed: 1,
    attackSpeed: 1,
    attack: 12,
    range: 0,
    prefixType: 13,
    kind: "armored"
};
