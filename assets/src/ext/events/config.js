Balance.events = {
    travelReplace: 0.4,
    raidMul: 1.4,
    fogEncounterMul: 1.2,
    plantWaitChance: 0.5,
    stealCount: 2
};

var EventConfig = [
    {
        id: "distress",
        trigger: "day.start",
        weight: 10,
        cooldown: 8,
        when: {day: [3], atHome: true},
        choices: [
            {id: "a", outcome: {attrs: {spirit: 5}, log: "evt_distress_log_a"}},
            {id: "b", outcome: {flag: "distress_noted", log: "evt_distress_log_b"}},
            {id: "c", outcome: {attrs: {spirit: -5}, log: "evt_distress_log_c"}}
        ]
    },
    {
        id: "plant_fail",
        trigger: "day.start",
        weight: 8,
        cooldown: 10,
        when: {day: [6], atHome: true, plant: true},
        choices: [
            {id: "a", need: {item: 1102063, num: 1}, outcome: {log: "evt_plant_fail_log_a"}},
            {id: "b", outcome: {plant: false, log: "evt_plant_fail_log_b"}},
            {id: "c", outcome: {chance: 0.5, plant: false, log: "evt_plant_fail_log_c"}}
        ]
    },
    {
        id: "neighbor_meds",
        trigger: "day.start",
        weight: 8,
        cooldown: 6,
        when: {atHome: true, npc: 2},
        choices: [
            {id: "a", need: {item: 1104011, num: 1}, outcome: {reputation: {npc: 2, d: 1}, log: "evt_neighbor_meds_log_a"}},
            {id: "b", outcome: {reputation: {npc: 2, d: -1}, log: "evt_neighbor_meds_log_b"}}
        ]
    },
    {
        id: "jeff_wood",
        trigger: "day.start",
        weight: 8,
        cooldown: 6,
        when: {atHome: true, npc: 3},
        choices: [
            {id: "a", need: {item: 1101011, num: 2}, outcome: {reputation: {npc: 3, d: 1}, log: "evt_jeff_wood_log_a"}},
            {id: "b", outcome: {reputation: {npc: 3, d: -1}, log: "evt_jeff_wood_log_b"}}
        ]
    },
    {
        id: "masako_coffee",
        trigger: "day.start",
        weight: 8,
        cooldown: 6,
        when: {atHome: true, npc: 4},
        choices: [
            {id: "a", need: {item: 1105011, num: 1}, outcome: {reputation: {npc: 4, d: 1}, log: "evt_masako_coffee_log_a"}},
            {id: "b", outcome: {reputation: {npc: 4, d: -1}, log: "evt_masako_coffee_log_b"}}
        ]
    },
    {
        id: "stranger_night",
        trigger: "night.start",
        weight: 9,
        cooldown: 7,
        when: {atHome: true},
        choices: [
            {id: "a", outcome: {roll: [
                {w: 1, items: [{itemId: "1103083", num: 2}], log: "evt_stranger_night_log_a1"},
                {w: 1, steal: 2, log: "evt_stranger_night_log_a2"}
            ]}},
            {id: "b", outcome: {log: "evt_stranger_night_log_b"}}
        ]
    },
    {
        id: "bill_watch",
        trigger: "night.start",
        weight: 8,
        cooldown: 8,
        when: {atHome: true, npc: 5},
        choices: [
            {id: "a", outcome: {attrs: {spirit: 4}, raidTonight: true, log: "evt_bill_watch_log_a"}},
            {id: "b", outcome: {log: "evt_bill_watch_log_b"}}
        ]
    },
    {
        id: "night_herd",
        trigger: "night.start",
        weight: 10,
        cooldown: 7,
        when: {atHome: true, phaseMin: 1},
        choices: [
            {id: "a", outcome: {attrs: {spirit: -6}, log: "evt_night_herd_log_a"}},
            {id: "b", outcome: {infest: {mode: "neighbors", n: 2}, log: "evt_night_herd_log_b"}},
            {id: "c", outcome: {infest: {mode: "neighbors", n: 1}, log: "evt_night_herd_log_c"}}
        ]
    },
    {
        id: "dog_alert",
        trigger: "night.start",
        weight: 8,
        cooldown: 6,
        when: {atHome: true, dog: true},
        choices: [
            {id: "a", outcome: {attrs: {vigour: -15}, infest: {mode: "neighbors", n: 2, set: 0}, log: "evt_dog_alert_log_a"}},
            {id: "b", outcome: {log: "evt_dog_alert_log_b"}}
        ]
    },
    {
        id: "fog_day",
        trigger: "day.start",
        weight: 7,
        cooldown: 5,
        when: {atHome: true, weatherId: 4},
        choices: [
            {id: "a", outcome: {attrs: {spirit: -4}, log: "evt_fog_day_log_a"}},
            {id: "b", outcome: {fogToday: true, log: "evt_fog_day_log_b"}}
        ]
    },
    {
        id: "caravan",
        trigger: "travel",
        weight: 10,
        cooldown: 8,
        when: {day: [5]},
        choices: [
            {id: "a", need: {currency: 8}, outcome: {currency: -8, bagItems: [{itemId: "1103083", num: 2}], log: "evt_caravan_log_a"}},
            {id: "b", outcome: {log: "evt_caravan_log_b"}},
            {id: "c", outcome: {bagItems: [{itemId: "1103083", num: 3}], reputationAll: -1, log: "evt_caravan_log_c"}}
        ]
    },
    {
        id: "road_pack",
        trigger: "travel",
        weight: 12,
        cooldown: 5,
        choices: [
            {id: "a", outcome: {bagItems: [{itemId: "1101011", num: 3}, {itemId: "1104011", num: 1}], log: "evt_road_pack_log_a"}},
            {id: "b", outcome: {log: "evt_road_pack_log_b"}}
        ]
    },
    {
        id: "gunshots",
        trigger: "travel",
        weight: 10,
        cooldown: 5,
        choices: [
            {id: "a", outcome: {log: "evt_gunshots_log_a"}},
            {id: "b", outcome: {battle: true, log: "evt_gunshots_log_b"}}
        ]
    },
    {
        id: "infected_crate",
        trigger: "site.enter",
        weight: 9,
        cooldown: 6,
        when: {siteTracked: true},
        choices: [
            {id: "a", outcome: {bagItems: [{itemId: "1103083", num: 2}], attrs: {infect: 8}, log: "evt_infected_crate_log_a"}},
            {id: "b", outcome: {log: "evt_infected_crate_log_b"}},
            {id: "c", outcome: {attrs: {spirit: 4}, log: "evt_infected_crate_log_c"}}
        ]
    },
    {
        id: "rumor_cache",
        trigger: "site.enter",
        weight: 8,
        cooldown: 7,
        when: {siteTracked: true, item: 1106061, num: 1},
        choices: [
            {id: "a", outcome: {siteItems: [{itemId: "1103083", num: 1}, {itemId: "1101011", num: 4}], log: "evt_rumor_cache_log_a"}},
            {id: "b", outcome: {log: "evt_rumor_cache_log_b"}}
        ]
    },
    {
        id: "bad_water",
        trigger: "site.enter",
        weight: 9,
        cooldown: 6,
        when: {siteTracked: true},
        choices: [
            {id: "a", outcome: {attrs: {water: 20, infect: 6}, log: "evt_bad_water_log_a"}},
            {id: "b", outcome: {log: "evt_bad_water_log_b"}}
        ]
    }
];
