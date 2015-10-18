import './main.less';
import {delay, waitForEvent} from './lib/promise';

import * as prologue from './prologue';
import * as chapter1 from './chapter1';
// import * as chapter2 from './chapter2';
// import * as chapter3 from './chapter3';

var chapters = [
    chapter1, 
    // chapter2,
    // chapter3
];

var matched;
if ((matched = location.search.match(/chapter=(\d+)/))) {
    var no = matched[1] >> 0;
    chapters = chapters.slice(no - 1, no);
}

(async () => {
    // await prologue.ready();

    var lastChapter;
    for (var i = 0; i < chapters.length; i++) {
        let chapter = chapters[i];

        await chapter.init();
        console.log('Chapter ' + i + ' Init');

        await delay(50);

        if (lastChapter) {
            await Promise.all([
                lastChapter.hide(),
                chapter.show()
            ]);
            console.log('Chapter ' + (i - 1) + ' Hide', 
                'Chapter ' + i + ' Show');
            await lastChapter.destory();
            lastChapter = chapter;
        } else {
            await chapter.show();
            console.log('Chapter ' + i + ' Show');
        }

        await chapter.start();
        console.log('Chapter ' + i + ' Start');

        await chapter.end();
        console.log('Chapter ' + i + ' End');
    }
})();