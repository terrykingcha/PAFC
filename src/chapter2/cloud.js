import {defer} from '../lib/promise';
import {width, height}from '../lib/env';
import CubicBezier from '../lib/cubicbezier';
import {requestAnimationFrame}from '../lib/util';
import {manager, onProgress, onError} from '../prologue';

var deferred = defer();
export var ready = () => deferred.promise;
export var object;

var materialPromises = [];
for (let i = 0; i < 7; i++) {
    materialPromises[i] = new Promise(function(resolve, reject) {
        var loader = new THREE.TextureLoader(manager);
        loader.load(
            `assets/images/hill-cloud-${i + 1}.png`,
            function(texture) {
                console.log(texture);
                texture.minFilter = THREE.LinearFilter;
                texture.magFilter = THREE.LinearFilter;
                var material = new THREE.MeshBasicMaterial({
                    map: texture,
                    side: THREE.DoubleSide,
                    // wireframe: true,
                    transparent: true
                });
                resolve(material);
            },
            onProgress, 
            onError
        );  
    });
}

(async () => {
    object = new THREE.Object3D();
    var materials = await Promise.all(materialPromises);
    var properties = [
        [-15, 2, 10, 0.6],
        [-25, -5, 15, 0.7],
        [5, -4, 20, 0.5],
        [-5, -3, 25, 0.3],
        [50, 10, -20, 0.4],
        [25, -2, 10, 0.6],
        [-15, 2, 15, 0.2]
    ];

    materials.forEach(function(material, i) {
        var image = material.map.image;
        var width = 60;
        var height = width / image.width * image.height;
        var geometry = new THREE.PlaneGeometry(width, height);
        var mesh = new THREE.Mesh(geometry, material);
        if (properties[i]) {
            let prop = properties[i];
            mesh.position.set(prop[0], prop[1], prop[2]);
            mesh.scale.set(prop[3], prop[3], prop[3]);
            object.add(mesh);       
        }
    });

    deferred.resolve();
})();
