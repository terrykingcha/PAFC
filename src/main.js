import './main.less';
import {delay, waitForEvent} from './lib/promise';

import * as prologue from './prologue';
import * as chapteri from './chapterOne';
import * as chapterii from './chapterTwo';

var chapters = [chapteri, chapterii];

(async () => {
    await prologue.ready();

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