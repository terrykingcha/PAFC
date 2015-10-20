import {defer} from '../lib/promise';
import {time} from '../lib/env';

const COLOR = {
    'drawn': 0xb5905c,
    'daylight': 0xa2e3e0,
    'sunset': 0xd5ab70,
    'night': 0xcdf1f1
};

var bgTime;
if ((bgTime = location.search.match(/time=([^=&]+)/))) {
    bgTime = bgTime[1];
} else {
    bgTime = time();
}

var plight;
if ((plight = location.search.match(/plight=([^=&]+)/))) {
    plight = Number(plight[1]);
} else {
    plight = COLOR[bgTime];
}

const X = 0;
const Y = 0;
const Z = 0;

var deferred = defer();
export var ready = () => deferred.promise;

export var light = new THREE.PointLight(plight);
light.position.set(X, Y, Z);

deferred.resolve();
