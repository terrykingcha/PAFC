import {defer} from '../lib/promise';

const COLOR = 0x333333;
const X = 0;
const Y = 0;
const Z = 0;

var deferred = defer();
export var ready = () => deferred.promise;

export var light = new THREE.PointLight(COLOR);
light.position.set(X, Y, Z);

deferred.resolve();
