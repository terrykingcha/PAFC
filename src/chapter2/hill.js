import {defer} from '../lib/promise';
import {width, height}from '../lib/env';
import CubicBezier from '../lib/cubicbezier';
import {requestAnimationFrame}from '../lib/util';
import {manager, onProgress, onError} from '../prologue';

var deferred = defer();
export var ready = () => deferred.promise;
export var object;

export function render() {
    // object.rotation.y += 0.01;
}

var hillDeferred = defer();
var loader = new THREE.JSONLoader(manager);
loader.load('assets/obj/02_cloud/hill2.js', function(geometry, materials) {
    var material = new THREE.MeshFaceMaterial(materials);
    hillDeferred.resolve([geometry, material]);
}, onProgress, onError);

(async () => {
    var [hillGeometry, hillMaterial] = await hillDeferred.promise;

    object = new THREE.Object3D();

    var hillMesh = new THREE.Mesh(hillGeometry, hillMaterial);
    for (let m of hillMesh.material.materials) {
        m.opacity = 0.9;
        m.emissive.setHex(0x000000)
    }
    object.add(hillMesh);

    var outerMesh = new THREE.Mesh(hillGeometry.clone(), hillMaterial.clone());
    outerMesh.position.set(0, 1, 0);
    for (let m of outerMesh.material.materials) {
        m.opacity = 0.2;
        m.wireframe = true;
        m.wireframeLinewidth = 0.1;
        m.transparent = true;
        m.color.setHex(0xFFFFFF);
        m.emissive.setHex(0xFFFFFF);
    }
 
    object.add(outerMesh);

    deferred.resolve();
})();