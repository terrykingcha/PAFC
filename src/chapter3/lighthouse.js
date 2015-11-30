import {defer} from '../lib/promise';
import {width, height}from '../lib/env';
import CubicBezier from '../lib/cubicbezier';
import {requestAnimationFrame}from '../lib/util';
import {manager, onProgress, onError} from '../prologue';

var deferred = defer();
export var ready = () => deferred.promise;
export var object;

var lighthouse;
var houseTopGroup;
var lightPlane;
var lighthouseDeferred = defer();
var loader = new THREE.ObjectLoader(manager);
loader.load('assets/obj/03_sun/lighthouse1.js', function(scene) {
    lighthouse = scene.children[0];
    houseTopGroup = lighthouse.children[0].children[0];
    lightPlane = houseTopGroup.children[2];
    lighthouseDeferred.resolve();
}, onProgress, onError);

export function render() {
    houseTopGroup.rotation.z += 0.01;
}

(async () => {
    await lighthouseDeferred.promise;
    object = new THREE.Object3D();

    var lightCylinder = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 3, 80, 64, 1),
        new THREE.MeshBasicMaterial({
            color: 0xCCCCCC,
            opacity: 0.5,
            transparent: true,
            side: THREE.DoubleSide
        })
    );
    lightCylinder.position.set(0, -40, 7.5)
    houseTopGroup.add(lightCylinder);
    houseTopGroup.remove(lightPlane);
    // lightPlane.material = new THREE.MeshBasicMaterial({
    //     color: 0x333333,
    //     opacity: 0.3,
    //     transparent: true,
    //     side: THREE.DoubleSide
    // });
    lighthouse.scale.set(50, 50, 50);
    object.add(lighthouse);
    deferred.resolve();
})();

