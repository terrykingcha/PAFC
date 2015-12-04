import {defer} from '../lib/promise';

const COLOR = 0xEEEEEE;
const X = 0;
const Y = 0;
const Z = 0;

var deferred = defer();
export var ready = () => deferred.promise;

export var light1 = new THREE.PointLight(COLOR);
light1.position.set(X, Y, Z);

export var light2 = new THREE.PointLight(COLOR);
light2.position.set(X, Y, Z);

export var light3 = new THREE.PointLight(COLOR);
light3.position.set(X, Y, Z);

deferred.resolve();
