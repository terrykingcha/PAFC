import './common.less';
import './main.less';
import './lib/zepto';

import * as prologue from './prologue';
import * as title from './title';
import * as clock from './clock';
import * as share from './share';
import * as nav from './nav';
import * as menu from './menu';
import Visualizer from './visualizer';
import * as opening from './opening';
import * as chapter1 from './chapter1';


var chapters = [chapter1];
var currentChapter;

var openingMusic = new Visualizer(prologue.manager);
openingMusic.load('./assets/sounds/opening.mp3');
openingMusic.ready().then(function() {
    openingMusic.togglePlayback(true);
});

var chapterMusics = [];
for (let i = 1; i <= 6; i++) {
    var music = new Visualizer(prologue.manager);
    music.load(`./assets/sounds/c${i}.mp3`);
    chapterMusics.push(music);
}

var currentMusic = openingMusic;

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
        // ...chapters.map((c) => c.init())
    ]);

    opening.render();

    await Promise.all([
        prologue.hide(),
        opening.show()
    ]);

    await title.show();
    await title.hide();

    clock.show();
    clock.run();
    share.show();
    nav.show();

    await opening.start();

    resize();
    tick();

    // nav.onmusic(function(on) {
    //     currentMusic.togglePlayback(on);
    // });

    // menu.onsymbol(function(symbol) {
    //     var index = symbol.substr(1) >> 0 / 3;
    //     changeChapter(index);
    // });

    // opening.ontowerclick(function() {
    //     changeChapter(1);
    // });
})();