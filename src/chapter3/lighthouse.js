import {defer} from '../lib/promise';
import {width, height}from '../lib/env';
import CubicBezier from '../lib/cubicbezier';
import {requestAnimationFrame}from '../lib/util';
import {manager, onProgress, onError} from '../prologue';

var deferred = defer();
export var ready = () => deferred.promise;
export var object;

var lighthouse = new THREE.Object3D()
var topGroup = new THREE.Object3D();
lighthouse.add(topGroup);
var loader = new THREE.JSONLoader(manager);

loader.load('assets/obj/03_sun/top.js', function(geometry, materials) {
    materials.forEach(function(material) {
        material.color.setRGB(1, 1, 1)
    })
    topGroup.add(new THREE.Mesh(
        geometry, 
        new THREE.MeshFaceMaterial(materials)
    ))
}, onProgress, onError);

loader.load('assets/obj/03_sun/middle.js', function(geometry, materials) {
    materials.forEach(function(material) {
        material.color.setRGB(1, 1, 1)
    })
    topGroup.add(new THREE.Mesh(
        geometry, 
        new THREE.MeshFaceMaterial(materials)
    ))
}, onProgress, onError);

loader.load('assets/obj/03_sun/bottom.js', function(geometry, materials) {
    materials.forEach(function(material) {
        material.color.setRGB(1, 1, 1)
    })
    lighthouse.add(new THREE.Mesh(
        geometry, 
        new THREE.MeshFaceMaterial(materials)
    ))
}, onProgress, onError);


export function render() {
    topGroup.rotation.y += 0.005;
}

(async () => {
    object = new THREE.Object3D();

    var light = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 3, 100, 64, 1, true),
        new THREE.MeshBasicMaterial({
            color: 0xCCCCCC,
            opacity: 0.5,
            transparent: true,
            side: THREE.DoubleSide
        })
    );
    light.rotation.x = Math.PI / 2
    light.position.set(0, 7.5, -50)
    topGroup.add(light);

    lighthouse.scale.set(100, 100, 100);
    object.add(lighthouse);

    deferred.resolve();
})();

