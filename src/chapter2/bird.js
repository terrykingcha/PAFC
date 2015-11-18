import {defer} from '../lib/promise';
import {width, height}from '../lib/env';
import CubicBezier from '../lib/cubicbezier';
import {requestAnimationFrame}from '../lib/util';
import {manager, onProgress, onError} from '../prologue';

var deferred = defer();
export var ready = () => deferred.promise;
export var object;

var loader = new THREE.JSONLoader(manager);
loader.load('assets/obj/02_cloud/bird.js', function(geometry, materials) {
    console.log(geometry, materials)
    object = new THREE.Object3D();

    var material = new THREE.MeshFaceMaterial(materials);
    var mesh = new THREE.Mesh(geometry, material);
    object.add(mesh);

    deferred.resolve();
}, onProgress, onError);