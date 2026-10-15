// Corridor 081 with the original credits. Choice buttons come from StoryExt.
ExtAssets.add("icon_item_1106071.png");
ExtAssets.add("dig_item_1106071.png");

(function () {
    var orig = ExtAssets._registerOne;
    ExtAssets._registerOne = function (filename) {
        orig.call(ExtAssets, filename);
        if (filename !== "icon_item_1106071.png" && filename !== "dig_item_1106071.png") {
            return;
        }
        var frame = cc.spriteFrameCache.getSpriteFrame(filename);
        if (!frame) {
            return;
        }
        cc.spriteFrameCache.addSpriteFrame(frame, filename.replace("1106071", "1106072"));
        cc.spriteFrameCache.addSpriteFrame(frame, filename.replace("1106071", "1106073"));
    };
})();

var StoryEndLayer = cc.Layer.extend({
    ctor: function () {
        this._super();
        return true;
    },

    fadeDur: function () {
        return StoryExt.stepMs >= 1000 ? 1 : 0.05;
    },

    reveal: function (nodes, done, gap) {
        var self = this;
        var wait = gap || StoryExt.stepMs;
        var i = 0;
        function next() {
            nodes[i].runAction(cc.fadeIn(self.fadeDur()));
            i++;
            if (i < nodes.length) {
                setTimeout(next, wait);
            } else if (done) {
                setTimeout(done, wait);
            }
        }
        next();
    },

    hideThen: function (nodes, done) {
        var self = this;
        var i;
        for (i = 0; i < nodes.length; i++) {
            nodes[i].runAction(cc.fadeOut(this.fadeDur()));
        }
        setTimeout(done, StoryExt.stepMs);
    },

    placeChoices: function (buttons) {
        var n = buttons.length;
        var cx = cc.winSize.width / 2;
        var gap = 250;
        var i;
        function fit(btn, cols) {
            var maxW = (cc.winSize.width - 36) / cols;
            if (btn.width > maxW) {
                btn.setScale(maxW / btn.width);
            }
        }
        if (n <= 3) {
            var start = cx - (n - 1) * gap / 2;
            for (i = 0; i < n; i++) {
                fit(buttons[i], n);
                buttons[i].setPosition(start + i * gap, 150);
            }
            return;
        }
        if (n === 4) {
            var top = [buttons[0], buttons[1]];
            var bot = [buttons[2], buttons[3]];
            for (i = 0; i < 2; i++) {
                fit(top[i], 2);
                fit(bot[i], 2);
                top[i].setPosition(cx + (i === 0 ? -gap / 2 : gap / 2), 230);
                bot[i].setPosition(cx + (i === 0 ? -gap / 2 : gap / 2), 110);
            }
            return;
        }
        fit(buttons[0], 2);
        fit(buttons[1], 2);
        buttons[0].setPosition(cx - gap / 2, 230);
        buttons[1].setPosition(cx + gap / 2, 230);
        var rest = n - 2;
        var origin = cx - (rest - 1) * gap / 2;
        for (i = 0; i < rest; i++) {
            fit(buttons[i + 2], rest);
            buttons[i + 2].setPosition(origin + i * gap, 110);
        }
    },

    onEnter: function () {
        this._super();
        game.stop();
        var layer = this;
        this.setName("storyEnd");
        this.phase = 0;
        var sequence = 0;
        var chosen = null;
        var endings = StoryExt.choices();

        var bg = new Button(cc.winSize);
        bg.setName("storyBg");
        bg.x = cc.winSize.width / 2;
        bg.y = cc.winSize.height / 2;
        this.addChild(bg);

        var txtNode = new cc.Node();
        txtNode.setContentSize(500, 750);
        txtNode.setAnchorPoint(0.5, 1);
        txtNode.x = cc.winSize.width / 2;
        txtNode.y = cc.winSize.height - 150;
        this.addChild(txtNode);

        function makeLine(text, y) {
            var label = new cc.LabelTTF(stringUtil.getString(text), uiUtil.fontFamily.normal, uiUtil.fontSize.COMMON_2, cc.size(txtNode.width, 0));
            label.setAnchorPoint(0, 1);
            label.setPosition(0, y);
            label.setColor(cc.color.WHITE);
            txtNode.addChild(label);
            return label;
        }

        var txt1 = makeLine(8000, txtNode.height);
        var txt2 = makeLine(8001, txt1.y - txt1.height - 120);
        var txt3 = makeLine(8002, txt2.y - txt2.height - 120);
        var txt4 = makeLine(8003, txtNode.height);
        var txt5 = makeLine(8004, txt4.y - txt4.height - 120);
        var txt6 = makeLine(8005, txt5.y - txt5.height - 120);
        var txt7 = makeLine(8006, txt5.y - txt5.height - 120);
        var pageA = [txt1, txt2, txt3];
        var pageB = [txt4, txt5, txt6];
        var lines = [txt1, txt2, txt3, txt4, txt5, txt6, txt7];

        var endingSpriteOne = autoSpriteFrameController.getSpriteFromSpriteName("#ending_1.png");
        endingSpriteOne.setAnchorPoint(0, 1);
        endingSpriteOne.setPosition(0, txtNode.height - 50);
        txtNode.addChild(endingSpriteOne);
        var endingSpriteTwo = autoSpriteFrameController.getSpriteFromSpriteName("#ending_2.png");
        endingSpriteTwo.setAnchorPoint(0, 1);
        endingSpriteTwo.setPosition(0, txtNode.height - 50);
        txtNode.addChild(endingSpriteTwo);

        var endtxt1 = new cc.LabelTTF("Dice7 (Buried Town)\n果农C    Lancelot    Alex", uiUtil.fontFamily.normal, uiUtil.fontSize.COMMON_2, cc.size(txtNode.width, 0));
        endtxt1.setAnchorPoint(0, 1);
        endtxt1.setPosition(0, txtNode.height + 20);
        endtxt1.setColor(cc.color.WHITE);
        txtNode.addChild(endtxt1);

        var endtxt2 = new cc.LabelTTF(stringUtil.getString(8027) + "\nEpidemic Sound, 罗杨, Blue Wizard Studio, Brambles", uiUtil.fontFamily.normal, uiUtil.fontSize.COMMON_2, cc.size(txtNode.width, 0));
        endtxt2.setAnchorPoint(0, 1);
        endtxt2.setPosition(0, endtxt1.y - endtxt1.height - 60);
        endtxt2.setColor(cc.color.WHITE);
        txtNode.addChild(endtxt2);

        var endtxt3 = new cc.LabelTTF(stringUtil.getString(8028) + "\ntrue    Miao", uiUtil.fontFamily.normal, uiUtil.fontSize.COMMON_2, cc.size(txtNode.width, 0));
        endtxt3.setAnchorPoint(0, 1);
        endtxt3.setPosition(0, endtxt2.y - endtxt2.height - 60);
        endtxt3.setColor(cc.color.WHITE);
        txtNode.addChild(endtxt3);

        var endtxt4 = new cc.LabelTTF("Buried City\nArithSeq", uiUtil.fontFamily.normal, uiUtil.fontSize.COMMON_2, cc.size(txtNode.width, 0));
        endtxt4.setAnchorPoint(0, 1);
        endtxt4.setPosition(0, endtxt3.y - endtxt3.height - 60);
        endtxt4.setColor(cc.color.WHITE);
        txtNode.addChild(endtxt4);

        var endtxt5 = new cc.LabelTTF("Recall - ARForest\nDrowned Night - Max Anson", uiUtil.fontFamily.normal, uiUtil.fontSize.COMMON_2, cc.size(txtNode.width, 0));
        endtxt5.setAnchorPoint(0, 1);
        endtxt5.setPosition(0, endtxt4.y - endtxt4.height - 60);
        endtxt5.setColor(cc.color.WHITE);
        txtNode.addChild(endtxt5);

        var endtxt6 = new cc.LabelTTF(stringUtil.getString(8029), uiUtil.fontFamily.normal, uiUtil.fontSize.COMMON_2, cc.size(txtNode.width, 0));
        endtxt6.setAnchorPoint(0, 1);
        endtxt6.setPosition(0, endtxt5.y - endtxt5.height - 60);
        endtxt6.setColor(cc.color.WHITE);
        txtNode.addChild(endtxt6);
        var credits = [endtxt1, endtxt2, endtxt3, endtxt4, endtxt5, endtxt6];

        function setPages(pages) {
            var i;
            for (i = 0; i < lines.length && i < pages.length; i++) {
                lines[i].setString(stringUtil.getString(pages[i]));
            }
        }

        function showSprite() {
            if (chosen && chosen.sprite === "ending_1") {
                endingSpriteOne.runAction(cc.fadeIn(layer.fadeDur()));
            } else {
                endingSpriteTwo.runAction(cc.fadeIn(layer.fadeDur()));
            }
        }

        var choiceButtons = [];
        function onPick(ending) {
            var i;
            for (i = 0; i < choiceButtons.length; i++) {
                choiceButtons[i].setVisible(false);
                choiceButtons[i].setEnabled(false);
            }
            txt7.runAction(cc.fadeOut(layer.fadeDur()));
            setTimeout(function () {
                chosen = ending;
                setPages(ending.pages);
                var k;
                for (k = 0; k < pageA.length; k++) {
                    pageA[k].setOpacity(0);
                }
                layer.reveal(pageA, function () {
                    bg.setEnabled(true);
                });
            }, StoryExt.stepMs);
        }

        var c;
        for (c = 0; c < endings.length; c++) {
            (function (ending) {
                var btn = uiUtil.createBigBtnWhite(stringUtil.getString(ending.btn), layer, function () {
                    onPick(ending);
                });
                btn.setName("storyChoice");
                btn.setAnchorPoint(0.5, 0.5);
                btn.storyFire = function () {
                    if (btn.isEnabled && !btn.isEnabled()) {
                        return;
                    }
                    onPick(ending);
                };
                layer.addChild(btn);
                choiceButtons.push(btn);
            })(endings[c]);
        }
        this.placeChoices(choiceButtons);

        var continueBtn;
        function onContinue() {
            if (sequence === 4) {
                audioManager.stopMusic(audioManager.music.RECALL);
                txt7.setOpacity(0);
                endingSpriteOne.setOpacity(0);
                endingSpriteTwo.setOpacity(0);
                continueBtn.setEnabled(false);
                continueBtn.setOpacity(0);
                sequence++;
                audioManager.playMusic(audioManager.music.CREDITS, false);
                setTimeout(function () {
                    layer.reveal(credits, function () {
                        continueBtn.setEnabled(true);
                        continueBtn.runAction(cc.fadeIn(layer.fadeDur()));
                    }, StoryExt.creditMs);
                }, StoryExt.creditLeadMs);
            } else {
                cc.director.runScene(new MenuScene());
            }
        }
        continueBtn = uiUtil.createBigBtnWhite(stringUtil.getString(1030), this, onContinue);
        continueBtn.setName("storyContinue");
        continueBtn.setAnchorPoint(0.5, 0.5);
        continueBtn.setPosition(cc.winSize.width / 2, 150);
        continueBtn.storyFire = function () {
            if (continueBtn.isEnabled && !continueBtn.isEnabled()) {
                return;
            }
            onContinue();
        };
        this.addChild(continueBtn);

        var hidden = lines.concat([endingSpriteOne, endingSpriteTwo], credits, choiceButtons, [continueBtn]);
        var h;
        for (h = 0; h < hidden.length; h++) {
            hidden[h].setOpacity(0);
        }
        for (h = 0; h < choiceButtons.length; h++) {
            choiceButtons[h].setEnabled(false);
        }
        continueBtn.setEnabled(false);
        bg.setEnabled(false);

        bg.setClickListener(layer, function () {
            if (!bg.enabled) {
                return;
            }
            bg.setEnabled(false);
            sequence++;
            layer.phase = sequence;
            if (sequence === 1) {
                layer.hideThen(pageA, function () {
                    layer.reveal(pageB, function () {
                        bg.setEnabled(true);
                    });
                });
            } else if (sequence === 2) {
                layer.hideThen(pageB, function () {
                    txt7.runAction(cc.fadeIn(layer.fadeDur()));
                    setTimeout(function () {
                        var i;
                        layer.phase = "choices";
                        for (i = 0; i < choiceButtons.length; i++) {
                            choiceButtons[i].setEnabled(true);
                            choiceButtons[i].runAction(cc.fadeIn(layer.fadeDur()));
                        }
                    }, StoryExt.stepMs);
                });
            } else if (sequence === 3) {
                layer.hideThen(pageA, function () {
                    layer.reveal(pageB, function () {
                        bg.setEnabled(true);
                    });
                });
            } else if (sequence === 4) {
                layer.hideThen(pageB, function () {
                    showSprite();
                    txt7.runAction(cc.fadeIn(layer.fadeDur()));
                    setTimeout(function () {
                        continueBtn.runAction(cc.fadeIn(layer.fadeDur()));
                        setTimeout(function () {
                            layer.phase = "continue";
                            continueBtn.setEnabled(true);
                        }, StoryExt.stepMs);
                    }, StoryExt.stepMs);
                });
            }
        });

        audioManager.playEffect(audioManager.sound.OPEN_DOOR);
        setTimeout(function () {
            txt1.runAction(cc.fadeIn(layer.fadeDur()));
            audioManager.playMusic(audioManager.music.RECALL, false);
            setTimeout(function () {
                layer.reveal([txt2, txt3], function () {
                    bg.setEnabled(true);
                });
            }, StoryExt.stepMs);
        }, StoryExt.leadMs);
        return true;
    }
});

(function () {
    EndStoryScene.prototype.onEnter = function () {
        cc.Scene.prototype.onEnter.call(this);
        this.addChild(new StoryEndLayer());
    };
})();
