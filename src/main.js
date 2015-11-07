import './common.less';
import './main.less';
import './lib/zepto';
import './font';

import {changeColor} from './color';
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
import * as chapter6 from './chapter6';
// import * as chapter2 from './chapters';

var chapters = new Array(6);
chapters[0] = chapter1;
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

var lastScene;
var currentScene;

async function backToIndex() {
    if (currentScene === 'video') {
        await hideVideo();
    }
    if (currentScene.indexOf('chapter') === 0) {
        await leavingChapter();
    }
}

async function enteringChapter(index) {
    var chapter = chapters[index - 1];
    var chapterMusic = chapterMusics[index - 1];
    var categoryName = category.get(index - 1);

    if (chapter && 
            chapterMusic && 
            currentScene !== 'chapter' + index) {

        openingMusic.togglePlayback(false);

        currentMusic = chapterMusic;

        resizeHandler = ::opening.resize;
        renderHandler = ::opening.render;

        if (currentScene === 'video') {
            await hideVideo();
        }

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

        await Promise.all([
            opening.hide(),
            chapter.entering(currentMusic)
        ]);

        nav.enableAll();
        nav.disable('category');
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

    resizeHandler = ::opening.resize;
    renderHandler = ::opening.render;

    await opening.show();

    await Promise.all([
        opening.leaving(),
        currentChapter.leaving()
    ]);

    nav.enableAll();
    nav.disable('index');
    category.hideName();
    clock.show();

    currentChapter = null;
    lastScene = currentScene;
    currentScene = 'index';
}

async function showVideo() {
    var navDisableName;
    if (currentScene === 'index') {
        await Promise.all([
            opening.hide(),
            video.show()
        ]);
        navDisableName = 'category'
    } else if (currentScene.indexOf('chapter') === 0) {
        await Promise.all([
            currentChapter.hide(),
            video.show()
        ]);
        navDisableName = 'index'
    }
    nav.enableAll();
    nav.disable('video');
    nav.disable(navDisableName);
    changeColor('black');
    lastScene = currentScene;
    currentScene = 'video';
}

async function hideVideo() {
    var navDisableName;
    if (lastScene === 'index') {
        await Promise.all([
            opening.show(),
            video.hide()
        ]);
        navDisableName = 'index';
    } else if (lastScene && lastScene.indexOf('chapter') === 0) {
        await Promise.all([
            currentChapter.show(),
            video.hide()
        ]);
        navDisableName = 'category';
    }
    nav.enableAll();
    nav.disable(navDisableName);
    currentScene = lastScene;
}

async function showCategory() {
    if (currentScene === 'video') {
        await hideVideo();
    } else {
        await category.show();
    }
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
        nav.ready()
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
            backToIndex();
        } else if (newValue === 'video') {
            showVideo();
        } else if (newValue === 'category') {
            showCategory();
        } else if (newValue === 'music') {
            currentMusic.togglePlayback();
        }
    });

    category.on('change', function(e, newValue, oldValue) {
        category.hide();
        enteringChapter(newValue);
    });

    opening.ontowerclick(function() {
        enteringChapter(1);
    });
})();