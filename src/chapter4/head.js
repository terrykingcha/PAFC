import {defer} from '../lib/promise';
import {width, height}from '../lib/env';
import CubicBezier from '../lib/cubicbezier';
import {requestAnimationFrame}from '../lib/util';
import {manager, onProgress, onError} from '../prologue';

var deferred = defer();
export var ready = () => deferred.promise;
export var object;

var clock = new THREE.Clock();
var mixer;
export var render = () => {
    var delta = clock.getDelta();
    mixer.update(delta);
}

var loader = new THREE.JSONLoader(manager);
var head = new Promise(function(resolve, reject) {
    loader.load('assets/obj/04_thunder/head.js', function(geometry, materials) {
        resolve([geometry, materials]);
    }, onProgress, onError);
});


(async () => {
    var [geometry, materials] = await head;

    object = new THREE.Object3D();

    var material = materials[0];
    material.wireframe = true;
    material.wireframeLinewidth = 0.5;
    material.side = THREE.FrontSide;
    material.color.setHex(0xEEEEEE);
    // material.emissive.setHex(0xFFFFFF);
    material.morphTargets = true;

    var headMesh = new THREE.MorphBlendMesh(geometry, material);
    // headMesh.createAnimation('FRAME001', 0, 90, 60);
    // headMesh.playAnimation('FRAME001');

    mixer = headMesh;
    // mixer = new THREE.AnimationMixer(headMesh);
    // var clip = THREE.AnimationClip.CreateFromMorphTargetSequence('gallop', geometry.morphTargets, 30 );
    // mixer.addAction(new THREE.AnimationAction(clip).warpToDuration(1));
    object.add(headMesh);
    deferred.resolve();
})()