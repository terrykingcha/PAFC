import {defer} from '../lib/promise';
import {width, height} from '../lib/env';
import {manager, onProgress, onError} from '../prologue';
import * as Clock from '../clock';

var deferred = defer();
export var ready = () => deferred.promise;
export var object;

var materialPromises = [];
for (let i = 0; i < 4; i++) {
    materialPromises[i] = new Promise(function(resolve, reject) {
        var loader = new THREE.TextureLoader(manager);
        loader.load(
            `assets/images/cloud${i + 1}.png`,
            function(texture) {
                texture.minFilter = THREE.LinearFilter;
                texture.magFilter = THREE.LinearFilter;
                var material = new THREE.MeshBasicMaterial({
                    map: texture,
                    side: THREE.DoubleSide,
                    transparent: true
                });
                resolve(material);
            },
            onProgress, 
            onError
        );  
    });
}

var rotationY = 0.001;
export function render() {
    object.children.forEach(function(obj, i) {
        var sign = i % 2 === 0 ? 1 : -1;
        obj.rotation.y += rotationY * i * sign;
    });
}


(async () => {
    object = new THREE.Object3D();

    var materials = await Promise.all(materialPromises);

    materials.forEach(function(material, i) {
        var geometry = new THREE.SphereGeometry(
            45 - i * 6, 64, 64
        );
        var mesh = new THREE.Mesh(geometry, material);
        object.add(mesh);
    });

    deferred.resolve();
})();

