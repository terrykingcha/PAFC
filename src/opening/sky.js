import {defer} from '../lib/promise';
import {width, height} from '../lib/env';
import {manager, onProgress, onError} from '../prologue';
import * as Clock from '../clock';

var testState;
if ((testState = location.search.match(/time=([^=&]+)/))) {
    testState = testState[1];
}

var deferred = defer();
export var ready = () => deferred.promise;
export var object;

var materials = {
    drawn: false,
    daylight: false,
    sunset: false,
    night: false
};

for (let state in materials) {
    materials[state] = new Promise(function(resolve, reject) {
        var loader = new THREE.TextureLoader(manager);
        loader.load(
            `assets/images/${state}.jpg`,
            function(texture) {
                var material = new THREE.MeshBasicMaterial({
                    map: texture,
                    side: THREE.BackSide
                });
                resolve(material);
            },
            onProgress, 
            onError
        );  
    });
}


(async () => {
    await Clock.ready();
    var state = testState || Clock.state();
    var material = await materials[state];

    var windowW = width();
    var windowH = height();
    var imageW = material.map.image.width;
    var imageH = material.map.image.height;
    var ratio = Math.max(windowW / windowH, imageW / imageH);

    var geometry = new THREE.SphereGeometry(
        50, 64, 64
    );
    object = new THREE.Mesh(geometry, material);
    deferred.resolve();
})();

