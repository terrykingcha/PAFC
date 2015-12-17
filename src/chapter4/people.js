import {defer} from '../lib/promise';
import {width, height}from '../lib/env';
import CubicBezier from '../lib/cubicbezier';
import {requestAnimationFrame, cancelAnimationFrame}from '../lib/util';
import {manager, onProgress, onError} from '../prologue';


var deferred = defer();
export var ready = () => deferred.promise;

export var object;

var peoplePromises = [];
for (let i = 0; i < 2; i++) {
    peoplePromises[i] = new Promise(function(resolve, reject) {
        var loader = new THREE.TextureLoader(manager);
        loader.load(
            `assets/images/people${i + 1}.jpg`,
            function(texture) {
                // texture.minFilter = THREE.LinearFilter;
                // texture.magFilter = THREE.LinearFilter;
                var material = new THREE.MeshBasicMaterial({
                    map: texture,
                    side: THREE.DoubleSide,
                    transparent: false
                });
                var geometry = new THREE.PlaneGeometry(192, 108);
                resolve(new THREE.Mesh(geometry, material));
            },
            onProgress, 
            onError
        );  
    });
}

var peoples = [];
var currentPeople;
export function toggle() {
    if (currentPeople != null) {
        object.remove(currentPeople);
    }

    currentPeople = peoples.shift();
    object.add(currentPeople);
    peoples.push(currentPeople);
}

(async () => {

object = new THREE.Object3D();
peoples = await Promise.all(peoplePromises);

deferred.resolve();
})();