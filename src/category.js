import './category.less';
import {defer, domReady, delay} from './lib/promise';
import {manager, onProgress, onError} from './prologue';

var categorys = ['雾', '云', '日', '雷', '雨', '星'];

export var length = categorys.length;

var images = ['circle.png', 'c1.png', 'c2.png', 'c3.png', 'c4.png', 'c5.png', 'c6.png'];
images = images.map(function(image) {
    var loader = new THREE.ImageLoader(manager);

    return new Promise(function(resolve, reject) {
        loader.load(
            `./assets/images/${image}`, 
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

var $category;
var $circle;
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

function bindCategoryEvents() {
    var {width: circleWidth, height: circleHeight, 
            left: circleLeft, top: circleTop} = 
            $circle.getBoundingClientRect();

    var centerX = circleLeft + circleWidth / 2;
    var centerY = circleTop + circleHeight / 2;

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

    var changed;
    $circle::$on('mousemove mouseleave mousedown mouseup', function(e) {
            var eventName = e.type;
            $circle::$findAll('img').forEach(img => img::$removeClass('hover'));
            
            if (eventName === 'mouseleave' ||
                    eventName === 'mouseup') return;

            var {radius, rad} = parse(e);
            if (radius <= circleWidth / 2 &&
                    radius <= circleHeight / 2) {
                var index = Math.floor(rad / (Math.PI * 2 / categorys.length)) + 1;
                $circle::$find(`.c${index}`)::$addClass('hover');

                if (eventName === 'mousemove') return;

                $circle::$trigger('change', [index, changed]);
                changed = index;
            }
        })::$on('mouseleave', function(e) {
            $circle::$findAll('img').forEach(img => img::$removeClass('hover'));
        });
}

function bindBackEvents() {
    $category::$find('.back')
        ::$on('click', hide);
}

var isBoundEvents = false;
export async function show() {
    $category::$show();
    await delay(1);
    $category::$addClass('fadeIn');
    await delay(450);

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
            <div class="circle"></div>
        </div>
        <div id="category-name"></div>
    `;
}

(async () => {
    await domReady();

    $category = document.body::$append(template())::$find('#category');
    $categoryName = document.body::$find('#category-name');
    $circle = $category::$find('.circle');

    var imgs = await Promise.all(images);
    imgs.forEach(function(image, i) {
        if (image::$attr('src').indexOf('circle.png') > -1) {
            return;
        }
        image::$addClass(`c${i}`);
        $circle::$append(image);
    });
})();