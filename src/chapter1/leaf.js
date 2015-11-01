import {defer} from '../lib/promise';
import {width, height}from '../lib/env';
import CubicBezier from '../lib/cubicbezier';
import {requestAnimationFrame}from '../lib/util';
import {manager, onProgress, onError} from '../prologue';

var deferred = defer();
export var ready = () => deferred.promise;
export var object;

var geometry;
var material;
var mesh;
var leafs = [];
export function down() {
    var count = Math.floor(3 + Math.random() * 3);
    for (let i = 0; i < count; i++) {
        let leaf = mesh.clone();
        let scale = Math.random() * 1.5 + 1.5;
        leaf.scale.set(scale, scale, scale);
        leaf.rotation.set(Math.random(), Math.random(), Math.random());
        leaf.position.set(Math.random() * 5, Math.random() * 5, Math.random() * 5);
        leaf.yspeed = Math.random() * 0.1 + 0.1;
        leaf.xspeed = -Math.random() * 0.05 - 0.1;
        leaf.zspeed = Math.random() * 0.05 * Math.sign(Math.random() - 0.5);
        leafs.push(leaf);
        object.add(leaf);
    }
}

export function render() {
    if (!leafs.length) return;

    var _leafs = leafs.slice();
    for (let i = 0; i < _leafs.length; i++) {
        let leaf = _leafs[i];
        leaf.rotation.x += Math.random() * 0.005;
        leaf.rotation.y += Math.random() * 0.001;
        leaf.rotation.z += Math.random() * 0.01;
        leaf.position.y -= leaf.yspeed;
        leaf.position.x += leaf.xspeed;
        leaf.position.z += leaf.zspeed;
        if (leaf.position.y <= -110) {
            leafs.splice(leafs.indexOf(leaf), 1);
            object.remove(leaf);
        }
    }
}

var loader = new THREE.JSONLoader(manager);
loader.load('assets/obj/01_fog/leaf.js', function(_geometry, _materials) {
    geometry = _geometry;
    _materials[0].color.setHex(0x00F954);
    _materials[0].emissive.setHex(0x36D140);
    _materials[0].side = THREE.DoubleSide;
    material = new THREE.MeshFaceMaterial(_materials);
    mesh = new THREE.Mesh(geometry, material);
    object = new THREE.Object3D();
    deferred.resolve();
}, onProgress, onError);