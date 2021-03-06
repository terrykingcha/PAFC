import {defer} from '../lib/promise';
import {width, height}from '../lib/env';
import CubicBezier from '../lib/cubicbezier';
import {requestAnimationFrame}from '../lib/util';
import {manager, onProgress, onError} from '../prologue';

const {degToRad} = THREE.Math;

var deferred = defer();
export var ready = () => deferred.promise;
export var object;

export const X_STEP = 4;
export const Y_STEP = 8;
export const Z_STEP = 4;
export const X_SIZE = 60 * X_STEP;
export const Y_SIZE = 20 * Y_STEP;
export const Z_SIZE = 40 * Z_STEP;

var leafMesh;
function genLeaf() {
    var mesh = leafMesh.clone();
    var scale = Math.random() * 0.3 + 0.3;
    mesh.mg = Math.random() * 0.3 + 0.3;
    mesh.scale.set(scale, scale, scale);
    mesh.rotation.set(Math.random(), Math.random(), Math.random());
    mesh.position.set(
        X_SIZE * (Math.random() * 0.2 + 0.8), 
        Y_SIZE * (Math.random() * 0.2 + 0.8), 
        Z_SIZE * (Math.random() * 0.9 + 0.1)
    );
    return mesh;
}

var windForce = 1;
var windTheta = Math.PI;
function mergeForce(mg, f, t) {
    var fx = f * Math.cos(t);
    var fy = f * Math.sin(t);
    var mgx = 0;
    var mgy = -mg;
    var cx = fx + (mgx - fx) / 2;
    var cy = fy + (mgy - fy) / 2;
    var r = Math.sqrt(cx * cx + cy * cy);
    var theta = Math.atan(cy/cx);
    if (cx > 0 && cy > 0) {
        theta = theta;
    } else if (cx < 0 && cy > 0) {
        theta += Math.PI;
    } else if (cx < 0 && cy < 0) {
        theta += Math.PI;
    } else if (cx > 0 && cy < 0) {
        theta += Math.PI * 2;
    }
    return [r, theta];
}

const LEAF_MAX_LIMIT = 200;

var leafs = [];
var isBlowWind = false;
export function blowWind() {
    isBlowWind = true;

    var count = 20;
    var originWidthTheta = windTheta;
    var origintWindForce = windForce;

    windTheta = originWidthTheta;
    windForce = Math.random() * 5 + 5;

    var thetaStep = (windTheta - originWidthTheta) / count;
    var forceStep = (windForce - origintWindForce) / count;

    function blowing() {
        if (count > 0) {
            count--;
            windForce -= forceStep;
            windTheta -= thetaStep;
            requestAnimationFrame(blowing);
        } else {
            windTheta = originWidthTheta;
            windForce = origintWindForce;
            isBlowWind = false;
        }
    }
    blowing();
}

export function render() {
    if (leafs.length < LEAF_MAX_LIMIT && Math.random() < 0.5) {
        let leaf = genLeaf();
        object.add(leaf);
        leafs.push(leaf);
    }

    if (Math.random() < 0.2 && !isBlowWind) {
        windForce = Math.random() * 1 + 1;
        windTheta = degToRad(180) + (Math.random() * degToRad(10) - degToRad(5));
    }

    var _leafs = leafs.slice();
    for (let leaf of _leafs) {
        let [r, theta] = mergeForce(leaf.mg, windForce, windTheta);
        leaf.position.x += r * Math.cos(theta);
        leaf.position.y += r * Math.sin(theta);
        leaf.rotation.z += 0.1;
        if (leaf.position.x <= 0 || 
            leaf.position.y <= 0) {
            leafs.splice(leafs.indexOf(leaf), 1);
            object.remove(leaf);
        }
    }
}

const THREE_LEAF_COLOR = 0x555555;
const THREE_LEAF_EMISSIVE = 0x333333;

var loader = new THREE.JSONLoader(manager);
loader.load('assets/obj/01_fog/leaf.js', function(geometry, materials) {
    materials[0].color.setHex(THREE_LEAF_COLOR);
    materials[0].emissive.setHex(THREE_LEAF_EMISSIVE);
    materials[0].side = THREE.DoubleSide;
    materials[1].color.setHex(THREE_LEAF_COLOR);
    materials[1].emissive.setHex(THREE_LEAF_EMISSIVE);
    materials[1].side = THREE.DoubleSide;

    var material = new THREE.MeshFaceMaterial(materials);
    leafMesh = new THREE.Mesh(geometry, material);
    object = new THREE.Object3D();
    deferred.resolve();
}, onProgress, onError);