import {defer} from '../lib/promise';
import {width, height}from '../lib/env';
import CubicBezier from '../lib/cubicbezier';
import {requestAnimationFrame, cancelAnimationFrame}from '../lib/util';
import {manager, onProgress, onError} from '../prologue';


var deferred = defer();
export var ready = () => deferred.promise;

export var object;

export function render(visualizer) {

}

(async () => {

object = new THREE.Object3D();
deferred.resolve();

})();