import './main.less';
import {delay, waitForEvent} from './lib/promise';
import {find, show, hide, on, off} from './lib/dom';

import * as prologue from './prologue';
import * as clock from './clock';
import * as share from './share';
import * as nav from './nav';
import * as menu from './menu';
import Visualizer from './visualizer';
import * as opening from './opening';
import * as chapter1 from './chapter1';

var openingMusic = new Visualizer(prologue.manager);
openingMusic.load('./assets/sounds/opening.mp3');
openingMusic.ready().then(function() {
    openingMusic.togglePlayback(true);
});
var currentMusic = openingMusic;

var chapters = [chapter1];
var currentChapter;

var chapterMusics = new Array(8).fill(1).map(function(v, i) {
    var t = 't' + v * i * 3;
    var music = new Visualizer(prologue.manager);
    music.load(`./assets/sounds/${t}.mp3`);
    return music;
});

var resizeHandler = ::opening.resize;
function resize() {
    window.addEventListener('resize', function() {
        resizeHandler && resizeHandler();
    });
}

var renderHandler = ::opening.render;
function tick() {
    requestAnimationFrame(tick);
    renderHandler && renderHandler();
}

async function changeChapter(index) {
    var chapter = chapters[index];
    var chapterMusic = chapterMusics[index];

    if (chapter && chapterMusic) {
        openingMusic.togglePlayback(false);

        currentMusic = chapterMusic;

        await menu.hide();

        resizeHandler = ::opening.resize;
        renderHandler = ::opening.render;

        if (currentChapter) {
            await Promise.all([
                opening.leaving(),
                currentChapter.leaving()
            ]);
        }

        await opening.entering();

        currentChapter = chapter;
        resizeHandler = ::chapter.resize;
        renderHandler = ::chapter.render;

        await chapter.entering(currentMusic);
    }
}

(async () => {
    await prologue.ready();

    await Promise.all([
        opening.init(),
        ...chapters.map((c) => c.init())
    ]);

    opening.show();
    opening.render();

    await prologue.title();
    await prologue.hide();

    clock.show();
    clock.run();
    share.show();
    nav.show();

    await opening.start();

    resize();
    tick();

    share.onshare(function(type) {
        if (type === 'weixin') {
            var $weixinCode = document::find('#weixin_code');
            $weixinCode::show()
                ::on('click', function handler() {
                    $weixinCode::hide();
                    $weixinCode::off('click', handler);
                });
        }
    });

    nav.onmusic(function(on) {
        currentMusic.togglePlayback(on);
    });

    menu.onsymbol(function(symbol) {
        var index = symbol.substr(1) >> 0 / 3;
        changeChapter(index);
    });

    opening.ontowerclick(function() {
        changeChapter(0);
    });
})();