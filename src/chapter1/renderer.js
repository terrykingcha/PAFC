import {defer, domReady} from '../lib/promise';
import {width, height} from '../lib/env';

const COLOR = 0xFFFFFF;
const ALPHA = 1;

var deferred = defer();
export var ready = () => deferred.promise;

export var renderer;
export var domElement;

export function resize() {
    var w = width();
    var h = height();

    renderer.setSize(w, h);
}

(async () => {
    await domReady();
    var w = width();
    var h = height();

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(w, h);
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setClearColor(COLOR, ALPHA);
    
    domElement = renderer.domElement;

    deferred.resolve();
})();
