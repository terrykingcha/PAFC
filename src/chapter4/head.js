import {defer} from '../lib/promise';
import {width, height}from '../lib/env';
import CubicBezier from '../lib/cubicbezier';
import {requestAnimationFrame}from '../lib/util';
import {manager, onProgress, onError} from '../prologue';

var deferred = defer();
export var ready = () => deferred.promise;
export var object;

var loader = new THREE.JSONLoader(manager);
var headPromise = [
    new Promise(function(resolve, reject) {
        loader.load('assets/obj/04_thunder/head01.js', function(geometry, materials) {
            resolve([geometry, materials]);
        }, onProgress, onError);
    }),

    new Promise(function(resolve, reject) {
        loader.load('assets/obj/04_thunder/head02.js', function(geometry, materials) {
            resolve([geometry, materials]);
        }, onProgress, onError);
    })
];

var heads = [];
function build([geometry, materials]) {
    var material = materials[0];
    material.wireframe = true;
    material.wireframeLinewidth = 0.5;
    material.side = THREE.FrontSide;
    material.color.setHex(0xEEEEEE);
    material.morphTargets = true;

    var headMesh = new THREE.Mesh(geometry, material);
    heads.push(headMesh);
    headMesh.position.z = 9999;

    return headMesh;
}

export function render() {
    object.rotation.y -= 0.0015;
}

export function toggle() {
    var head = heads.shift();

    head.position.z = 0;
    heads[0].position.z = 9999;

    heads.push(head);
}


(async () => {
    var [head1, head2] = await Promise.all(headPromise);

    object = new THREE.Object3D();
    object.add(build(head1));
    object.add(build(head2));
    deferred.resolve();
})()