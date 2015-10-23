import {defer} from '../lib/promise';
import * as Clock from '../clock';

const COLOR = {
    'drawn': 0xb5905c,
    'daylight': 0xa2e3e0,
    'sunset': 0xd5ab70,
    'night': 0xcdf1f1
};

var testState;
if ((testState = location.search.match(/time=([^=&]+)/))) {
    testState = testState[1];
}

var testPlight;
if ((testPlight = location.search.match(/plight=([^=&]+)/))) {
    testPlight = Number(testPlight[1]);
}

const X = 0;
const Y = 0;
const Z = 0;

var deferred = defer();
export var ready = () => deferred.promise;

export var light;

(async () => {
    await Clock.ready();

    var state = Clock.state();
    var color = testPlight || COLOR[state];
    light = new THREE.PointLight(color);
    light.position.set(X, Y, Z);

    deferred.resolve();
})();

