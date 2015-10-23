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
import * as chapters from './chapters';

var currentMusic;
var openingMusic = new Visualizer(prologue.manager);
openingMusic.load('./assets/sounds/opening.mp3');

var chapterMusics = new Array(8).fill(1).map(function(v, i) {
    var t = 't' + v * i * 3;
    var music = new Visualizer(prologue.manager);
    music.load(`./assets/sounds/${t}.mp3`);
    return music;
});

var resizeHandler;
function resize() {
    window.addEventListener('resize', function() {
        resizeHandler && resizeHandler();
    });
}

var renderHandler;
function tick() {
    requestAnimationFrame(tick);
    renderHandler && renderHandler();
}

(async () => {
    resize();
    tick();

    await prologue.ready();

    await Promise.all([
        opening.init(),
        chapters.init()
    ]);

    opening.show();
    opening.render();

    await prologue.opening();
    await prologue.hide();

    await Promise.all([
        clock.ready(),
        openingMusic.ready()
    ]);

    await Promise.all([
        clock.show(),
        share.show(),
        nav.show()
    ]);

    await opening.start();
    resizeHandler = ::opening.resize;
    renderHandler = ::opening.render;

    clock.run();
    currentMusic = openingMusic;
    openingMusic.togglePlayback(true);

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

    menu.onsymbol(async function(symbol) {
        var index = symbol.substr(1) >> 0;
        var chapterMusic = chapterMusics[index / 3];

        if (chapterMusic) {
            currentMusic = chapterMusic;

            await menu.hide();

            if (opening.isEntering && 
                    chapters.isEntering) {
                await Promise.all([
                    opening.leaving(),
                    chapters.leaving()
                ]);
            }

            await opening.entering();
        }
    });

    nav.onmusic(function(on) {
        currentMusic.togglePlayback(on);
    });

    opening.onentering(async function() {
        openingMusic.togglePlayback(false);
        await chapters.entering(currentMusic);
    });

    opening.onleaving(async function() {
        resizeHandler = ::opening.resize;
        renderHandler = ::opening.render;
    });

    chapters.onentering(async function() {
        resizeHandler = ::chapters.resize;
        renderHandler = ::chapters.render;
    });

    chapters.onleaving(async function() {
        resizeHandler = ::opening.resize;
        renderHandler = ::opening.render;
    });
})();