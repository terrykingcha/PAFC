import './common.less';
import './main.less';
import './lib/zepto';
import './font';

import * as prologue from './prologue';
import * as title from './title';
import * as clock from './clock';
import * as share from './share';
import * as nav from './nav';
import * as category from './category';
import * as video  from './video';
import Visualizer from './visualizer';
import * as opening from './opening';
import * as chapter1 from './chapter1';
import * as chapter2 from './chapter2';
import * as chapter3 from './chapter3';
import * as chapter4 from './chapter4';
import * as chapter5 from './chapter5';
import * as chapter6 from './chapter6';

var chapters = new Array(6);
chapters[0] = chapter1;
chapters[1] = chapter2;
chapters[2] = chapter3;
chapters[3] = chapter4;
chapters[4] = chapter5;
chapters[5] = chapter6;
var currentChapter;

var openingMusic = new Visualizer(prologue.manager);
openingMusic.load('./assets/sounds/opening.mp3');

var chapterMusics = [];
for (let i = 1; i <= 6; i++) {
    var music = new Visualizer(prologue.manager);
    music.load(`./assets/sounds/c${i}.mp3`);
    chapterMusics.push(music);
}

var currentMusic = openingMusic;

var resizeHandler = [::opening.resize];
chapters.forEach(capter => resizeHandler.push(::capter.resize));
function resize() {
    window.addEventListener('resize', function() {
        resizeHandler.forEach(h => h && h());
    });
}

var renderHandler = ::opening.render;
function tick() {
    requestAnimationFrame(tick);
    renderHandler && renderHandler();
}

var lastScene;
var currentScene;

async function enteringChapter(index) {
    var chapter = chapters[index - 1];
    var chapterMusic = chapterMusics[index - 1];
    var categoryName = category.get(index - 1);

    if (chapter && 
            chapterMusic && 
            currentScene !== 'chapter' + index) {

        currentMusic.togglePlayback(false);

        if (currentChapter) {
            await currentChapter.leaving();
        } else {
            await opening.entering();
        }

        currentChapter = chapter;
        currentMusic = chapterMusic;
        renderHandler = ::chapter.render;

        await currentChapter.entering(currentMusic);

        nav.enable('index');
        category.showName(categoryName);
        clock.hide();

        lastScene = currentScene;
        currentScene = 'chapter' + index;
    }
}

async function leavingChapter() {
    currentMusic.togglePlayback(false);
    openingMusic.togglePlayback(true);
    currentMusic = openingMusic;

    renderHandler = ::opening.render;

    await opening.show();

    await Promise.all([
        opening.leaving(),
        currentChapter.leaving()
    ]);

    nav.disable('index');
    category.hideName();
    clock.show();

    currentChapter = null;
    lastScene = currentScene;
    currentScene = 'index';
}

(async () => {
    await prologue.ready();

    await Promise.all([
        opening.init(),
        ...chapters.map((c) => c.init())
    ]);

    opening.render();

    await Promise.all([
        prologue.hide(),
        opening.show()
    ]);

    openingMusic.togglePlayback(true);

    await title.ready();
    await title.show();
    await title.hide();

    await Promise.all([
        clock.ready(),
        share.ready(),
        nav.ready(),
        video.ready()
    ]);

    clock.show();
    clock.run();
    share.show();

    nav.disable('index');
    nav.show();

    await opening.start();
    resize();
    tick();

    currentScene = 'index';

    nav.on('change', function(e, newValue, oldValue) {
        if (newValue === 'index') {
            leavingChapter();
        } else if (newValue === 'info') {
            video.show(currentMusic);
        } else if (newValue === 'clock') {
            category.show();
        } else if (newValue === 'music') {
            currentMusic.togglePlayback();
        }
    });

    category.on('change', async function(e, newValue, oldValue) {
        await category.hide();
        enteringChapter(newValue);
    });

    opening.ontowerclick(function() {
        enteringChapter(1);
    });
})();