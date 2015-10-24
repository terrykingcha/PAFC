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

export var light1;
export var light2;
export var light3;
export var light4;

(async () => {
    await Clock.ready();

    var state = Clock.state();
    var color1 = new THREE.Color(testPlight || COLOR[state]);
    light1 = new THREE.PointLight(color1);
    light1.position.set(X, Y, Z);

    var color2 = new THREE.Color(testPlight || COLOR[state]);
    color2.offsetHSL(0, 0, -0.01);
    light2 = new THREE.PointLight(color2);
    light2.position.set(X, Y, Z);

    var color3 = new THREE.Color(testPlight || COLOR[state]);
    color3.offsetHSL(0, 0, -0.02);
    light3 = new THREE.PointLight(color3);
    light3.position.set(X, Y, Z);

    var color4 = new THREE.Color(testPlight || COLOR[state]);
    color4.offsetHSL(0, 0, -0.03);
    light4 = new THREE.PointLight(color4);
    light4.position.set(X, Y, Z);

    deferred.resolve();
})();

