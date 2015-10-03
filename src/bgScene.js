import './bgScene.less';
import {defer, pageLoad} from '../lib/promise';
import {width, height} from './env';

export var domElement;

var deferred = defer();
export var ready = () => deferred.promise;

const BG_WIDTH = 1300;
const BG_HEIGHT = 640;
export var render = () => {
    domElement.style.backgroundImage = 'url(assets/images/bg1.jpg)';
};

export var resize = async () => {
    var w = await width();
    var h = await height();

    domElement.style.width = w + 'px';
    domElement.style.height = h + 'px';
};

function init(w, h) {
    domElement = document.createElement('div');
    domElement.setAttribute('id', 'bgScene');

    domElement.style.width = w + 'px';
    domElement.style.height = h + 'px';
}

(async () => {
    await pageLoad();
    var w = await width();
    var h = await height();

    init(w, h);
    deferred.resolve();
})();