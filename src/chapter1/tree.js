import {defer} from '../lib/promise';
import {width, height}from '../lib/env';
import CubicBezier from '../lib/cubicbezier';
import {requestAnimationFrame}from '../lib/util';
import {manager, onProgress, onError} from '../prologue';

var deferred = defer();
export var ready = () => deferred.promise;
export var object;

var loader = new THREE.JSONLoader(manager);
loader.load('assets/obj/01_fog/tree.js', function(geometry, materials) {
    materials[0].color.setHex(0xAAAAAA);
    materials[0].emissive.setHex(0x6F5811);
    materials[1].color.setHex(0x00F954);
    materials[1].emissive.setHex(0x36D140);

    var material = new THREE.MeshFaceMaterial(materials);
    var mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.set(0.3, 0, 0);
    mesh.scale.set(1, 1, 1);

    object = new THREE.Object3D();
    object.add(mesh);

    deferred.resolve();

}, onProgress, onError);