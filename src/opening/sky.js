import {defer} from '../lib/promise';
import {width, height} from '../lib/env';
import {manager, onProgress, onError} from '../prologue';
import * as Clock from '../clock';

var deferred = defer();
export var ready = () => deferred.promise;
export var object;

var materials = {
    daylight: new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        side: THREE.DoubleSide
    }),
    night: new THREE.MeshBasicMaterial({
        color: 0x000000,
        side: THREE.DoubleSide
    })
};
deferred.resolve();

(async () => {
    await Clock.timeReady();

    var state = Clock.state();
    var material = materials[state];
    var geometry = new THREE.SphereGeometry(
        50, 64, 64
    );
    object = new THREE.Mesh(geometry, material);
    deferred.resolve();
})();

