import {defer} from '../lib/promise';

const COLOR = 0xFFFFFF;
const X = 0;
const Y = 0;
const Z = 0;

var deferred = defer();
export var ready = () => deferred.promise;

export var light = new THREE.DirectionalLight(COLOR);
light.position.set(X, Y, Z);

deferred.resolve();
