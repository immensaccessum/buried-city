// Radio chain, three notes, and the endings offered in corridor 081.
// No new map sites. Numbers that tune the gates live on Balance.story.
Balance.story = {
    radioBuild: 15,
    signalNeedNotes: 2,
    peopleNeed: 3,
    peopleRep: 5,
    peopleIds: [2, 3, 4, 5]
};

var StoryConfig = {
    radioUid: "081",
    radio: [
        {day: 5, key: "story_radio_1"},
        {day: 12, key: "story_radio_2"},
        {day: 20, key: "story_radio_3"},
        {day: 28, key: "story_radio_4"},
        {day: 40, key: "story_radio_5"},
        {day: 55, key: "story_radio_6", flag: "radio_done"}
    ],
    notes: [
        {id: "1106071", site: 1},
        {id: "1106072", site: 32},
        {id: "1106073", site: 2}
    ],
    endings: [
        {id: "gas", btn: 8100, pages: [8010, 8011, 8012, 8013, 8014, 8015, 8016], sprite: "ending_1", always: true},
        {id: "void", btn: 8101, pages: [8020, 8021, 8022, 8023, 8024, 8025, 8026], sprite: "ending_2", always: true},
        {id: "stay", btn: "story_btn_stay", pages: ["story_stay_1", "story_stay_2", "story_stay_3", "story_stay_4", "story_stay_5", "story_stay_6", "story_stay_7"], sprite: "ending_2", always: true},
        {id: "signal", btn: "story_btn_signal", pages: ["story_signal_1", "story_signal_2", "story_signal_3", "story_signal_4", "story_signal_5", "story_signal_6", "story_signal_7"], sprite: "ending_1", when: "signal"},
        {id: "people", btn: "story_btn_people", pages: ["story_people_1", "story_people_2", "story_people_3", "story_people_4", "story_people_5", "story_people_6", "story_people_7"], sprite: "ending_2", when: "people"}
    ]
};

(function () {
    var i;
    for (i = 0; i < StoryConfig.notes.length; i++) {
        var id = StoryConfig.notes[i].id;
        itemConfig[id] = {
            id: id,
            weight: 1,
            price: 1,
            value: 1
        };
        blackList.randomLoop.push(Number(id));
    }
})();
