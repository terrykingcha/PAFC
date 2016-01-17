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

var clouds = [];
var properties = [
    [-15, 2, 10, 0.6],
    [-25, -5, 15, 0.7],
    [5, -4, 20, 0.5],
    [-5, -3, 25, 0.3],
    [50, 10, -20, 0.4],
    [25, -2, 10, 0.55],
    [-15, 2, 15, 0.2]
];
export function render() {
    for (let i = 0; i < clouds.length; i++) {
        let cloud = clouds[i];
        cloud.position.x += cloud.xSpeed;
        if (Math.abs(cloud.position.x) > 100) {
            cloud.xSpeed -= cloud.xSpeed;
            cloud.position.x = 100 * Math.sign(cloud.position.x);
        }
    }
}

(async () => {
    object = new THREE.Object3D();
    var materials = await Promise.all(materialPromises);


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
            mesh.xSpeed = 0.003 * Math.random() * Math.sign(Math.random() - 0.5);
            clouds.push(mesh);
            object.add(mesh);       
        }
    });

    deferred.resolve();
})();
