import {defer} from '../lib/promise';
import {width, height} from '../lib/env';
import {manager, onProgress, onError} from '../prologue';
import * as Clock from '../clock';

var deferred = defer();
export var ready = () => deferred.promise;
export var object;

var materialPromises = {
    daylight: [],
    night: []
};
for (let state of Object.keys(materialPromises)) {
    for (let i = 0; i < 4; i++) {
        materialPromises[state][i] = new Promise(function(resolve, reject) {
            var loader = new THREE.TextureLoader(manager);
            loader.load(
                `assets/images/cloud-${state}-${i + 1}.png`,
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
}

var tranverse = 1;
export function render() {
    object.children.forEach(function(obj, i) {
        var sign = (i % 2 === 0 ? 1 : -1) * tranverse;
        obj.position.x += 0.0005 * sign;
        if (Math.abs(obj.position.x) > 10) {
            tranverse *= -1;
        } 
    });
}


(async () => {
    await Clock.ready();

    object = new THREE.Object3D();
    
    var state = Clock.state();
    var materials = await Promise.all(materialPromises[state]);

    materials.forEach(function(material, i) {
        var width = 20;
        var height = 10;
        var geometry = new THREE.PlaneGeometry(width, height);
        var mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, -Math.random(), Math.random() * 10 + 5);
        object.add(mesh);
    });

    deferred.resolve();
})();

