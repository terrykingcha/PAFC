import './main.less';
import {delay, waitForEvent} from './lib/promise';

THREE.Loader.Handlers.add(/\.png$/i, new THREE.ImageLoader());
THREE.Loader.Handlers.add(/\.tag$/i, new THREE.TGALoader());

import * as prologue from './prologue';
import * as clock from './clock';
import * as share from './share';
import * as nav from './nav';
import * as menu from './menu';
import Visualizer from './visualizer';
import * as chapter1 from './chapter1';
// import * as chapter2 from './chapter2';
// import * as chapter3 from './chapter3';

var openingMusic = new Visualizer(prologue.manager);
openingMusic.load('./assets/sounds/opening.mp3');

var chapters = {
    cp1: chapter1
    // ,cp2: chapter2
    // chapter2,
    // chapter3
}

var matched;
var chapter = chapters.cp1;
if ((matched = location.search.match(/cp=(\d+)/))) {
    var no = matched[1] >> 0;
    chapter = chapters['cp' + no];
}

(async () => {
    await prologue.ready();

    await chapter.init();
    chapter.show();
    chapter.render();

    await prologue.opening();
    await prologue.hide();

    await clock.ready();

    await Promise.all([
        clock.show(),
        share.show(),
        nav.show()
    ]);

    openingMusic.togglePlayback(true);
    clock.run();

    share.onshare(function(type) {
        console.log(type);
    });

    menu.onsymbol(function(symbol) {
        console.log(symbol);
    });

    nav.onmusic(function(on) {
        openingMusic.togglePlayback(on);
    });

    await chapter.start();
    // var lastChapter;
    // for (var i = 0; i < chapters.length; i++) {
    //     let chapter = chapters[i];

    //     await chapter.init();
    //     console.log('Chapter ' + i + ' Init');

    //     await delay(50);

    //     if (lastChapter) {
    //         await Promise.all([
    //             lastChapter.hide(),
    //             chapter.show()
    //         ]);
    //         console.log('Chapter ' + (i - 1) + ' Hide', 
    //             'Chapter ' + i + ' Show');
    //         await lastChapter.destory();
    //         lastChapter = chapter;
    //     } else {
    //         await chapter.show();
    //         console.log('Chapter ' + i + ' Show');
    //     }

    //     await chapter.start();
    //     console.log('Chapter ' + i + ' Start');

    //     await chapter.end();
    //     console.log('Chapter ' + i + ' End');
    // }
})();