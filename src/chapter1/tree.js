import {defer} from '../lib/promise';
import {width, height}from '../lib/env';
import CubicBezier from '../lib/cubicbezier';
import {requestAnimationFrame}from '../lib/util';
import {manager, onProgress, onError} from '../prologue';

var deferred = defer();
export var ready = () => deferred.promise;
export var object;

const THREE_TRUNK_COLOR = 0x7b7b7b;
const THREE_TRUNK_EMISSIVE = 0x494949;
const THREE_LEAF_COLOR = 0x333333;
const THREE_LEAF_EMISSIVE = 0x333333;

var loader = new THREE.JSONLoader(manager);
loader.load('assets/obj/01_fog/tree1.js', function(geometry, materials) {
    materials[0].color.setHex(THREE_LEAF_COLOR);
    materials[0].emissive.setHex(THREE_LEAF_EMISSIVE);
    materials[0].side = THREE.DoubleSide;
    materials[0].fog = false;
    materials[1].color.setHex(THREE_TRUNK_COLOR);
    materials[1].emissive.setHex(THREE_TRUNK_EMISSIVE);
    materials[1].side = THREE.DoubleSide;
    materials[1].fog = false;
    materials[2].color.setHex(THREE_TRUNK_COLOR);
    materials[2].emissive.setHex(THREE_TRUNK_EMISSIVE);
    materials[2].side = THREE.DoubleSide;
    materials[2].fog = false;
    materials[3].color.setHex(THREE_LEAF_COLOR);
    materials[3].emissive.setHex(THREE_LEAF_EMISSIVE);
    materials[3].side = THREE.DoubleSide;
    materials[3].fog = false;
    materials[4].color.setHex(THREE_LEAF_COLOR);
    materials[4].emissive.setHex(THREE_LEAF_EMISSIVE);
    materials[4].side = THREE.DoubleSide;
    materials[4].fog = false;
    materials[5].color.setHex(THREE_TRUNK_COLOR);
    materials[5].emissive.setHex(THREE_TRUNK_EMISSIVE);
    materials[5].side = THREE.DoubleSide;
    materials[5].fog = false;

    var material = new THREE.MeshFaceMaterial(materials);
    var mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.set(-0.25, Math.PI * 0.35, 0);
    mesh.scale.set(6, 6, 6);

    object = new THREE.Object3D();
    object.add(mesh);

    deferred.resolve();

}, onProgress, onError);