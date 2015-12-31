import {defer} from '../lib/promise';
import {width, height}from '../lib/env';
import CubicBezier from '../lib/cubicbezier';
import {requestAnimationFrame}from '../lib/util';
import {manager, onProgress, onError} from '../prologue';

var deferred = defer();
export var ready = () => deferred.promise;
export var object;

const THREE_TRUNK_COLOR = 0x8792B9;
const THREE_TRUNK_EMISSIVE = 0x494949;
const THREE_LEAF_COLOR = 0xE220BF;
const THREE_LEAF_EMISSIVE = 0x494949;

var texturePrmoises = [];
var loader = new THREE.TextureLoader(manager);
for (let i = 0; i < 4; i++) {
    texturePrmoises.push(new Promise(function(resolve, reject) {
        loader.load(`assets/images/fog_cloud${i+1}.png`, function(texture) {
            var material = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                side: THREE.FrontSide
            });
            resolve(material);
        }, onProgress, onError);
    }))
}

var planes = [];
export const WIDTH = 10;

export function render() {
    for (let plane of planes) {
        plane.position.x -= 0.001 * Math.random() + 0.001;
        if (plane.position.x < -WIDTH / 2) {
            plane.position.x = WIDTH / 2;
        }
    }
}

(async () => {
    object = new THREE.Object3D();

    var planeMaterials = await Promise.all(texturePrmoises);

    planeMaterials.forEach(function(material) {
        var image = material.map.image;
        var width = image.width / 400;
        var height = image.height / 400;
        var geometry = new THREE.PlaneGeometry(width, height);
        var mesh = new THREE.Mesh(geometry, material);
        mesh.position.x = Math.random() * WIDTH / 2 - WIDTH / 4
        mesh.position.y = -Math.random() * 0.3;
        mesh.position.z = Math.random() * 5 - 10;
        planes.push(mesh);
        object.add(mesh);
    });

    deferred.resolve();
})();