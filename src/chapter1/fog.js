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

var textureDeferred = defer();
var loader = new THREE.TextureLoader(manager);
loader.load('assets/images/fog.png', function(texture) {
    var material = new THREE.MeshBasicMaterial({
        // color: 0x000000,
        map: texture,
        transparent: true,
        side: THREE.DoubleSide
    });
    textureDeferred.resolve(material);
}, onProgress, onError);

var planes = [];
export const WIDTH = 7.3;
export const HEIGHT = 1;

export function render() {
    for (let plane of planes) {
        plane.position.x -= 0.03 * Math.random() + 0.01;
        if (plane.position.x < -WIDTH / 2) {
            plane.position.x = WIDTH / 2;
        }
    }
}

(async () => {
    object = new THREE.Object3D();

    var planeMaterial = await textureDeferred.promise;
    var planeGemoetry = new THREE.PlaneGeometry(WIDTH, HEIGHT);
    var plane = new THREE.Mesh(planeGemoetry, planeMaterial);

    for (var i = 0; i < 4; i++) {
        let clonedPlane = plane.clone();
        clonedPlane.position.set(-Math.random() * WIDTH / 2, 0, Math.random() * 50 - 25);
        planes.push(clonedPlane);
        object.add(clonedPlane);
    }
    deferred.resolve();
})();