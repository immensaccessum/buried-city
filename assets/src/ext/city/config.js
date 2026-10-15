// Day bands for the living city. Starting numbers, not a final balance pass.
// day is cc.timer.getTimeNum() (1 on the morning the game begins).
Balance.city = {
    depletionStep: 0.2,
    depletionMax: 3,
    lootFloor: 0.3,
    // Pocket change in a searchable room. Not every room, and less once a district is picked over.
    cashChance: 0.6,
    cashMin: 1,
    cashMax: 5,
    phases: [
        {day: [1, 10], lootMul: 1, diffShift: 0, regenDays: 4, infestDays: 6, infestMax: 1},
        {day: [11, 30], lootMul: 0.85, diffShift: 1, regenDays: 5, infestDays: 5, infestMax: 2},
        {day: [31, 60], lootMul: 0.7, diffShift: 2, regenDays: 6, infestDays: 4, infestMax: 3},
        {day: [61], lootMul: 0.5, diffShift: 3, regenDays: 7, infestDays: 3, infestMax: 3}
    ]
};
