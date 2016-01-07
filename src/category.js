import './category.less';
import {defer, domReady, delay} from './lib/promise';
import {requestAnimationFrame, cancelAnimationFrame} from './lib/util';
import {manager, onProgress, onError} from './prologue';

var categorys = ['雾', '云', '日', '雷', '雨', '星'];
var iconfonts = ['&#xe60b;', '&#xe608;', '&#xe60c;', '&#xe60d;', '&#xe609;', '&#xe60a;'];

export var length = categorys.length;

const IMG_PATH = './assets/images';
var images = [
    'circle.png', 'c1_new.png', 'c2_new.png', 'c3_new.png', 'c4_new.png', 'c5_new.png', 'c6_new.png',
    'c1_a1.png', 'c1_a2.png', 'c1_a3.png', 'c2_a1.png', 'c3_a1.png', 'c3_a2.png', 'c4_a1.png', 'c5_a1.png', 'c5_a2.png', 'c6_a1.png'
];
images = images.map(function(image) {
    var loader = new THREE.ImageLoader(manager);

    return new Promise(function(resolve, reject) {
        loader.load(
            `${IMG_PATH}/${image}`, 
            function(img) {
                resolve(img);
            },
            onProgress,
            onError
        );
    });
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

                $circle::$find(`.c${index}`)::$addClass('hover');
                if (index !== lastIndex) {
                    lastIndex = index;
                    clearArc();
                    drawArc(index - 1);
                }

                if (eventName === 'mousedown') {
                    $circle::$trigger('change', [index, changed]);
                    changed = index;
                }
            }
        })::$on('mouseup mouseleave', function(e) {
            clearArc();
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

function logoTemplate(name) {
    switch(name) {
        case 'c1':
            return `
                <img src="${IMG_PATH}/c1_a1.png">
                <img src="${IMG_PATH}/c1_a2.png">
                <img src="${IMG_PATH}/c1_a3.png">
            `;
            break;
        case 'c2':
            return `
                <img src="${IMG_PATH}/c2_a1.png">
            `;
            break;
        case 'c3':
            return `
                <img src="${IMG_PATH}/c3_a1.png">
                <img src="${IMG_PATH}/c3_a2.png">
                <img src="${IMG_PATH}/c3_a2.png">
                <img src="${IMG_PATH}/c3_a2.png">
                <img src="${IMG_PATH}/c3_a2.png">
                <img src="${IMG_PATH}/c3_a2.png">
                <img src="${IMG_PATH}/c3_a2.png">
                <img src="${IMG_PATH}/c3_a2.png">
                <img src="${IMG_PATH}/c3_a2.png">
            `;
            break;
        case 'c4':
            return `
                <img src="${IMG_PATH}/c4_a1.png">
            `;
            break;
        case 'c5':
            return `
                <img src="${IMG_PATH}/c5_a1.png">
                <img src="${IMG_PATH}/c5_a1.png">
            `;
            break;
        case 'c6':
            return `
                <img src="${IMG_PATH}/c6_a1.png">
            `;
            break;
    }
}

(async () => {
    await domReady();

    $category = document.body::$append(template())::$find('#category');
    $categoryName = document.body::$find('#category-name');
    $circle = $category::$find('.circle');
    $canvas = $category::$find('canvas');

    var imgs = await Promise.all(images);
    imgs.forEach(function($image) {
        var $wrap = document.createElement('div');
        $wrap::$addClass('wrap');
        var src = $image::$attr('src');
        var name = src.match(/(c\d)(?:_new)?.png/);

        if (name) {
            $wrap::$addClass(name[1])
                ::$html(`<div class="logo">${logoTemplate(name[1])}</div>`)
                ::$append($image);

            $circle::$prepend($wrap);
        }
    });


})();