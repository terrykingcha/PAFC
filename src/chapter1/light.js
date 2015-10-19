import {defer} from '../lib/promise';
import {time} from '../lib/env';

const COLOR = {
    'drawn': 0xb5905c,
    'daylight': 0xa2e3e0,
    'sunset': 0xd5ab70,
    'night': 0xcdf1f1
};
const X = 0;
const Y = 0;
const Z = 0;

var deferred = defer();
export var ready = () => deferred.promise;

export var light = new THREE.PointLight(COLOR[time()]);
light.position.set(X, Y, Z);

deferred.resolve();
