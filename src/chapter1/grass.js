import {defer} from '../lib/promise';
import {width, height}from '../lib/env';
import CubicBezier from '../lib/cubicbezier';
import {requestAnimationFrame}from '../lib/util';
import {manager, onProgress, onError} from '../prologue';

var deferred = defer();
export var ready = () => deferred.promise;
export var object;

var clock = new THREE.Clock();
var mixers = [];
export var render = () => {
    var delta = 0.75 * clock.getDelta();
    for(let mixer of mixers) {
        if (Math.random() < 0.95) continue;
        mixer.update(delta);
    }
}

export const X_STEP = 2;
export const Z_STEP = 2;
export const X_SIZE = 120 * X_STEP;
export const Z_SIZE = 80 * Z_STEP;

var loader = new THREE.ObjectLoader(manager);
loader.load('assets/obj/01_fog/grass4.js', function(loadedScene) {
    object = new THREE.Object3D();

    var originMeshs = loadedScene.children[0].children.slice(1);
    var grassMeshs = [];

    for (let mesh of originMeshs) {
        let grassMesh = new THREE.SkinnedMesh(mesh.geometry, mesh.material);
        grassMesh.material.color.setHex(0xFFFFFF);
        grassMesh.material.emissive.setHex(0xFFFFFF);
        grassMesh.material.skinning = true;
        grassMesh.scale.set(2.5, 2.5, 2.5);
        grassMesh.rotation.set(Math.PI / 2, Math.PI, -Math.PI / 2);
        grassMeshs.push(grassMesh);
    }

    for (let x = X_SIZE * 0.2; x < X_SIZE * 0.8; x += X_STEP * 1.2) {
        for (let z = Z_SIZE / 4; z < Z_SIZE; z += Z_STEP * 1.2) {
            let mesh = grassMeshs[Math.floor(Math.random() * grassMeshs.length)].clone();
            mesh.scale.x += Math.random() * 1 - 0.5;
            mesh.scale.y += Math.random() * 1 - 0.5;
            mesh.scale.z += Math.random() * 1 - 0.5;
            mesh.rotation.set(Math.PI / 2, Math.PI * 0.9, -Math.PI / 2);
            mesh.position.x += x + (Math.random() * 1 - 0.5) * X_STEP;
            mesh.position.z += z + (Math.random() * 1 - 0.5) * Z_STEP;
            object.add(mesh);

            let mixer = new THREE.AnimationMixer(mesh);
            mixer.play(new THREE.AnimationAction(mesh.geometry.animations[0]));
            mixers.push(mixer);
        }
    }

    var plane = new THREE.PlaneGeometry(X_SIZE, Z_SIZE);
    var planeMesh = new THREE.Mesh(plane, new THREE.MeshBasicMaterial({
        color: 0x000000,
        side: THREE.FontSide
    }));
    planeMesh.rotation.set(-Math.PI / 2, 0, 0);
    planeMesh.position.set(X_SIZE / 2, 0, Z_SIZE / 2);
    object.add(planeMesh);

    deferred.resolve();
}, onProgress, onError);