import './common.less';
import './menu.less';
import {defer, domReady, delay} from './lib/promise';
import {
    find, 
    findAll, 
    on, 
    show as visible, 
    hide as hidden,
    addClass,
    removeClass,
    hasClass,
    attr
} from './lib/dom';
import {manager,onProgress,onError} from './prologue';

var symbolClickHandlers = [];
export function onsymbol(handler) {
    if (symbolClickHandlers.indexOf(handler) < 0) {
        symbolClickHandlers.push(handler);
    }
}

var $video;
var videoEl = document.createElement('video');
videoEl.autoplay = false;
videoEl.autobuffer = true;
videoEl.controls = true;
videoEl.crossorigin = 'use-credentials';
videoEl.src = './assets/videos/project.mp4';
function toggleVideo(isPlayback) {
    if (!videoEl.parentNode) {
        var rect = $video.getBoundingClientRect();
        videoEl.width = rect.width;
        videoEl.height = rect.height;
        $video.appendChild(videoEl);
    }
    if (isPlayback) {
        videoEl.play();
    } else {
        videoEl.pause();
    }
}

var $menu;
var isBindEvents = false;
export async function show() {
    await domReady();

    if (!$menu) {
        $menu = document::find('#menu');
    }
    if (!$video) {
        $video = $menu::find('.project-video');
    }

    $menu::visible()
        ::removeClass('fadeOut')
        ::addClass('fadeIn');

    if (!isBindEvents) {
        isBindEvents = true;
        var times = [for (j of new Array(8).fill(0).map((v, i) => i)) 't' + j * 3];
        times.forEach(function(t) {
            $menu::find(`.trigger[for="${t}"]`)
                ::on('mouseenter', function(e) {
                    $menu::find(`.hover.${t}`)
                        ::removeClass('fadeOut')
                        ::addClass('fadeIn');

                    $menu::find('.symbol').className = `symbol ${t} fadeIn`;
                })
                ::on('mouseleave', function(e) {
                    $menu::find(`.hover.${t}`)
                        ::removeClass('fadeIn')
                        ::addClass('fadeOut');
                        
                    $menu::find('.symbol').className = `symbol ${t} fadeOut`;
                })
                ::on('click', function(e) {
                    symbolClickHandlers.forEach((h) => h(t));
                });
        });

        $menu::find('ul')
            ::on('click', function(e) {
                var target = e.target;
                if (target.tagName.toUpperCase() === 'A' &&
                        !target::hasClass('cur')) {
                    var lastTarget = $menu::find('ul .cur');

                    lastTarget::removeClass('cur');
                    target::addClass('cur');

                    var lastActive = $menu::find('.' + lastTarget::attr('for'));
                    var active = $menu::find('.' + target::attr('for'));

                    lastActive::removeClass('cur');
                    active::addClass('cur');

                    if (lastTarget::attr('for') === 'project-video') {
                        toggleVideo(false);
                    }

                    if (target::attr('for') === 'project-video') {
                        toggleVideo(true);
                    }
                }
            }); 

        $menu::find('.close')
            ::on('click', function(e) {
                hide();
            });
    }
}

export async function hide() {

    if ($menu) {
        $menu::removeClass('fadeIn')
            ::addClass('fadeOut');

        await delay(400);

        $menu::hidden();
    }
}