import './category.less';
import {defer, domReady, delay} from './lib/promise';
import {requestAnimationFrame, cancelAnimationFrame} from './lib/util';
import {manager, onProgress, onError} from './prologue';

var categorys = ['雾', '云', '日', '雷', '雨', '星'];
var disables = ['雷'];
var iconfonts = ['&#xe60b;', '&#xe608;', '&#xe60c;', '&#xe60d;', '&#xe609;', '&#xe60a;'];
var titles = [
    'The wind shows us its different forms in different times. enjoy the vioce of nature.',
    'Behold My Vision', 
    'The Flow of Wisdom', 
    'Hear the Silence',
    'Moonstone Stardust',
    'Amethyst Whispers',
    'Elegies of Spring'
]
export var length = categorys.length;

const IMG_PATH = './assets/images';

var circles = [
    'circle.png', 
    'c1_new.png', 
    'c2_new.png', 
    'c3_new.png', 
    'c4_new.png', 
    'c5_new.png', 
    'c6_new.png'
];
circles = circles.map(function(image) {
    var loader = new THREE.ImageLoader(manager);

    return new Promise(function(resolve, reject) {
        loader.load(
            `${IMG_PATH}/${image}`, 
            img => resolve(img),
            onProgress,
            onError
        );
    });
});

var logos = {
    'c1': [],
    'c2': [],
    'c3': [],
    'c4': [],
    'c5': [],
    'c6': []
};
Object.keys(logos).forEach(function(s) {
    for (let i = 0; i <= 20; i++) {
        let loader = new THREE.ImageLoader(manager);
        logos[s].push(new Promise(function(resolve, reject) {
            loader.load(
                `${IMG_PATH}/categorys/${s}/i${i}.png`,
                img => resolve(img),
                onProgress,
                onError
            );
        }));
    }
});

export function get(index) {
    return categorys[index];
}

export function getIconFont(index) {
    return iconfonts[index];
}

var $category;
var $circle;
var $canvas;
var $title;
export function on() {
    $category::$on(...arguments);
}

export function off() {
    $category::$off(...arguments);
}

var $categoryName;
export function showName(text) {
    $categoryName::$show();
    if (!!text) {
        $categoryName::$text(text);
    }
}

export function hideName() {
    $categoryName::$hide();
}

var circleWidth, circleHeight, circleLeft, circleTop;
var centerX, centerY;

function resizeHandler() {
    var circleRect = $circle.getBoundingClientRect();
    circleWidth = circleRect.width;
    circleHeight = circleRect.height;
    circleLeft = circleRect.left;
    circleTop = circleRect.top;
    centerX = circleLeft + circleWidth / 2;
    centerY = circleTop + circleHeight / 2;


    var canvasRect = $canvas.getBoundingClientRect();
    $canvas.width = canvasRect.width * window.devicePixelRatio;
    $canvas.height = canvasRect.height * window.devicePixelRatio;
}

function bindCategoryEvents() {
    window::$on('resize', resizeHandler);

    function parse(e) {
        var relX = e.pageX - centerX;
        var relY = centerY - e.pageY;
        var radius = Math.sqrt(relX * relX + relY * relY);
        var rad;
        if (relX > 0 && relY > 0) {
            rad = Math.atan(relX/relY);
        } else if (relX > 0 && relY < 0) {
            rad = Math.PI / 2 + Math.atan(-relY/relX);
        } else if (relX < 0 && relY < 0) {
            rad = Math.PI + Math.atan(relX/relY);
        } else {
            rad = Math.PI * 1.5 + Math.atan(-relY/relX);
        }
        return {
            radius,
            rad
        };
    }

    var logoId;
    function showLogo(name) {
        if (logoId) {
            clearTimeout(logoId);
        }

        var index = 0;
        var $logo = $circle::$find(`.c${name} .logo`);
        logoId = setTimeout(async function handler() {
            logoId = setTimeout(handler, 60);
            index %= logos[`c${name}`].length;
            var img = await logos[`c${name}`][index++];
            $logo::$html('')
                ::$append(img);
        }, 60);
    }

    function hideLogo() {
        if (logoId) {
            clearTimeout(logoId)
        }
    }

    var lastIndex;
    var changed;
    $circle::$on('mousemove mousedown', function(e) {
            var eventName = e.type;
            $circle::$findAll('.wrap').forEach(
                $wrap => $wrap::$removeClass('hover')
            );

            var {radius, rad} = parse(e);
            if (radius <= circleWidth / 2 &&
                    radius <= circleHeight / 2) {
                var index = Math.floor(rad / (Math.PI * 2 / categorys.length)) + 1;

                if (disables.indexOf(categorys[index - 1]) > -1) {
                    clearArc();
                    hideLogo();
                    $title::$html(titles[0]);
                    return;
                };

                $circle::$find(`.c${index}`)::$addClass('hover');
                if (index !== lastIndex) {
                    lastIndex = index;
                    clearArc();
                    drawArc(index - 1);
                    showLogo(index);
                    $title::$html(titles[index]);
                }

                if (eventName === 'mousedown') {
                    $circle::$trigger('change', [index, changed]);
                    changed = index;
                }
            }
        })::$on('mouseup mouseleave', function(e) {
            clearArc();
            hideLogo();
            $title::$html(titles[0]);
            $circle::$findAll('.wrap').forEach(
                $wrap => $wrap::$removeClass('hover')
            );
        });
}

function bindBackEvents() {
    $category::$find('.back')
        ::$on('click', hide);
}

var arcId;
const PI2 = Math.PI * 2;
function drawArc(i) {
    var {width, height} = $canvas;
    var context = $canvas.getContext('2d');
    var percent = 0;

    arcId = requestAnimationFrame(function draw() {
        if (percent < 1) {
            arcId = requestAnimationFrame(draw);
        }
        percent = Math.min(percent + 0.05, 1);
        context.clearRect(0, 0, width, height);
        let c = PI2 / 6 * i + PI2 / 12 - PI2 / 4;
        let s = c - PI2 / 12 * percent;
        let e = c + PI2 / 12 * percent;
        context.beginPath();
        context.arc(width / 2, height / 2 - 4, width * 0.905 / 2, s, e, false);
        context.strokeStyle = 'white';
        context.lineWidth = 2;
        context.stroke();
    });
}

function clearArc() {
    if (arcId) {
        cancelAnimationFrame(arcId);
    }
    var {width, height} = $canvas;
    var context = $canvas.getContext('2d');
    context.clearRect(0, 0, width, height);
}

var isBoundEvents = false;
export async function show() {
    $category::$show();
    await delay(1);
    $category::$addClass('fadeIn');
    await delay(450);

    resizeHandler();
    
    if (!isBoundEvents) {
        isBoundEvents = true;
        bindBackEvents();
        bindCategoryEvents();
    }
}

export async function hide() {
    $category::$removeClass('fadeIn')::$addClass('fadeOut');
    await delay(450);
    $category::$removeClass('fadeOut')::$hide();
}

function template() {
    return `
        <div id="category">
            <a class="back">Back</a>
            <div class="circle">
                <canvas></canvas>
            </div>
            <p>The wind shows us its different forms in different times.
enjoy the vioce of nature.</p>
        </div>
        <div id="category-name" class="bounceIn"></div>
    `;
}

(async () => {
    await domReady();

    $category = document.body::$append(template())::$find('#category');
    $categoryName = document.body::$find('#category-name');
    $circle = $category::$find('.circle');
    $canvas = $category::$find('canvas');
    $title = $category::$find('p');

    var imgs = await Promise.all(circles);
    imgs.forEach(function($image) {
        var $wrap = document.createElement('div');
        $wrap::$addClass('wrap');
        var src = $image::$attr('src');
        var name = src.match(/(c\d)(?:_new)?.png/);

        if (name) {
            $wrap::$addClass(name[1])
                ::$html('<div class="logo"></div>')
                ::$append($image);

            $circle::$prepend($wrap);
        }
    });


})();