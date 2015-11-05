import {defer} from '../lib/promise';
import {width, height}from '../lib/env';
import CubicBezier from '../lib/cubicbezier';
import {requestAnimationFrame}from '../lib/util';
import {manager, onProgress, onError} from '../prologue';

var deferred = defer();
export var ready = () => deferred.promise;
export var object;

var loader = new THREE.JSONLoader(manager);
loader.load('assets/obj/01_fog/ground.js', function(geometry, materials) {
    materials[0].color.setHex(0xFFFFFF);
    materials[0].emissive.setHex(0xFFFFFF);
    materials[0].fog = true;
    materials[0].vertexColors = THREE.VertexColors;
    materials[0].wireframe = false;
    materials[0].side = THREE.DoubleSide;

    var material = new THREE.MeshFaceMaterial(materials);
    object = new THREE.Mesh(geometry, material);
    object.scale.set(10, 0.5, 10);
    deferred.resolve();

}, onProgress, onError);