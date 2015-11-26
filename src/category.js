import './category.less';
import {defer, domReady, delay} from './lib/promise';
import {manager, onProgress, onError} from './prologue';

var categorys = ['雾', '云', '日', '雷', '雨', '星'];
var avialables = ['雾', '云', '日', '雨', '星'];

export var length = categorys.length;

var images = [
    'circle.png', 'c1.png', 'c2.png', 'c3.png', 'c4.png', 'c5.png', 'c6.png',
    'c1_disable.png', 'c2_disable.png', 'c3_disable.png', 'c4_disable.png', 'c5_disable.png', 'c6_disable.png'
];
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

    var changed;
    $circle::$on('mousemove mousedown', function(e) {
            var eventName = e.type;
            $circle::$findAll('img').forEach(img => img::$removeClass('hover'));

            var {radius, rad} = parse(e);
            if (radius <= circleWidth / 2 &&
                    radius <= circleHeight / 2) {
                var index = Math.floor(rad / (Math.PI * 2 / categorys.length)) + 1;
                var name = get(index - 1);

                var type;
                if (avialables.indexOf(name) < 0) {
                    $circle::$find(`.c${index}.disable`)::$addClass('hover');
                } else {
                    $circle::$find(`.c${index}.enable`)::$addClass('hover');

                    if (eventName === 'mousedown') {
                        $circle::$trigger('change', [index, changed]);
                        changed = index;
                    }
                }
            }
        })::$on('mouseup mouseleave', function(e) {
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
    imgs.forEach(function(image) {
        var src = image::$attr('src');
        var name = src.match(/(c\d)(?:_disable)?.png/);

        if (name) {
            image::$addClass(name[1]);
            if (src.indexOf('disable') > 0) {
                image::$addClass('disable');
            } else {
                image::$addClass('enable');
            }
            $circle::$append(image);
        }
    });
})();