import {defer} from '../lib/promise';
import {width, height} from '../lib/env';
import CubicBezier from '../lib/cubicbezier';
import {requestAnimationFrame} from '../lib/util';
import {manager, onProgress, onError} from '../prologue';

var deferred = defer();
export var ready = () => deferred.promise;

export var object;

var pointMaterialDeferred = defer();
var pointMaterial = new THREE.MeshBasicMaterial({
    color: 0xFFFFFF,
    emissive: 0x000000,
    side: THREE.DoubleSide,
    fog: true
});
var pointHaloMaterial = new THREE.MeshPhongMaterial({
    color: 0xFFFFFF,
    emissive: 0x000000,
    opacity: 0.5,
    transparent: true,
    fog: true
});
pointMaterialDeferred.resolve();


var lineMaterialDeferred = defer();
var lineMaterial = new THREE.MeshPhongMaterial({
    color: 0xFFFFFF,
    emissive: 0x000000,
    side: THREE.DoubleSide,
    fog: true
});
var lineHaloMaterial = new THREE.MeshLambertMaterial({
    color: 0xFFFFFF,
    emissive: 0x000000,
    opacity: 0.5,
    transparent: true,
    fog: true
});
lineMaterialDeferred.resolve();

export const X_MIN = 0;
export const X_MAX = 3;
export const Y_MIN = 0;
export const Y_MAX = 3;
export const Z_MIN = 0;
export const Z_MAX = 3;
export const X_INTER = 100;
export const Y_INTER = 100;
export const Z_INTER = 100;
export const X_LENGTH = X_MAX - X_MIN + 1;
export const Y_LENGTH = Y_MAX - Y_MIN + 1;
export const Z_LENGTH = Z_MAX - Z_MIN + 1;

const VEC = {
    ORIGIN: new THREE.Vector3(0, 0, 0),
    X_MIN: new THREE.Vector3(X_MIN * X_INTER, 0, 0),
    X_MAX: new THREE.Vector3(X_MAX * Y_INTER, 0, 0),
    Y_MIN: new THREE.Vector3(0, Y_MIN * Y_INTER, 0),
    Y_MAX: new THREE.Vector3(0, Y_MAX * Y_INTER, 0),
    Z_MIN: new THREE.Vector3(0, 0, Z_MIN * Z_INTER),
    Z_MAX: new THREE.Vector3(0, 0, Z_MAX * Z_INTER)
}

export var xSize = () => (X_LENGTH - 1) * X_INTER;
export var ySize = () => (Y_LENGTH - 1) * Y_INTER;
export var zSize = () => (Z_LENGTH - 1) * Z_INTER;

var points = [];
var lines = [];

(async () => {
    await Promise.all([
        pointMaterialDeferred.promise,
        lineMaterialDeferred.promise
    ]);

    object = new THREE.Object3D();

    function makePoint() {
        var pointGeometry = new THREE.SphereGeometry(2, 32, 32);
        var pointGroup = new THREE.Group();
        var point = new THREE.Mesh(pointGeometry, pointMaterial);
        pointGroup.add(point);

        var pointHalo = new THREE.Mesh(pointGeometry.clone(), pointHaloMaterial);
        pointHalo.scale.set(1.2, 1.2, 1.2);
        pointGroup.add(pointHalo);

        return pointGroup;
    }

    function makeLine(dir) {
        var width = dir === 'X' ? xSize() : 1.5;
        var height = dir === 'Y' ? ySize() : 1.5;
        var depth = dir === 'Z' ? zSize() : 1.5;
        var widthSegments = dir === 'X' ? xSize() : 10;
        var heightSegments = dir === 'Y' ? ySize() : 10;
        var depthSegments = dir === 'Z' ? zSize() : 10;
        var lineGeometry = new THREE.BoxGeometry(
            width, height, depth,
            widthSegments, heightSegments, depthSegments
        );
        var lineGroup = new THREE.Group();

        var line = new THREE.Mesh(lineGeometry, lineMaterial);
        lineGroup.add(line);

        // var lineHalo = new THREE.Mesh(lineGeometry.clone(), lineHaloMaterial);
        // lineHalo.scale.x = dir === 'X' ? 1 : 2;
        // lineHalo.scale.y = dir === 'Y' ? 1 : 2;
        // lineHalo.scale.z = dir === 'Z' ? 1 : 2;
        // lineGroup.add(lineHalo);

        return lineGroup;
    }

    for (let x = X_MIN; x <= X_MAX; x++) {
        for (let y = Y_MIN; y <= Y_MAX; y++) {
            let clonedLineGroup = makeLine('Z');
            clonedLineGroup.position.x = x * X_INTER;
            clonedLineGroup.position.y = y * Y_INTER;
            clonedLineGroup.position.z = zSize() / 2;
            lines.push(clonedLineGroup);
            object.add(clonedLineGroup);
        }
    }

    for (let x = X_MIN; x <= X_MAX; x++) {
        for (let z = Z_MIN; z <= Z_MAX; z++) {
            let clonedLineGroup = makeLine('Y');
            clonedLineGroup.position.x = x * X_INTER;
            clonedLineGroup.position.y = ySize() / 2;
            clonedLineGroup.position.z = z * Z_INTER;
            lines.push(clonedLineGroup);
            object.add(clonedLineGroup);
        }
    }

    for (let y = Y_MIN; y <= Y_MAX; y++) {
        for (let z = Z_MIN; z <= Z_MAX; z++) {
            let clonedLineGroup = makeLine('X');
            clonedLineGroup.position.x = xSize() / 2;
            clonedLineGroup.position.y = y * Y_INTER;
            clonedLineGroup.position.z = z * Z_INTER;
            lines.push(clonedLineGroup);
            object.add(clonedLineGroup);

            for (var i = 0; i <= Z_LENGTH; i++) {
                if (y + 0.25 > Y_MAX ||
                    (z + i / Z_LENGTH) > Z_MAX) continue;

                let clonedPointGroup = makePoint();
                clonedPointGroup.position.set(
                    (X_MIN + 1) * X_INTER,
                    (y + 0.25) * Y_INTER,
                    (z + i / Z_LENGTH) * Z_INTER
                );
                points.push(clonedPointGroup);
                object.add(clonedPointGroup);

                clonedPointGroup = clonedPointGroup.clone();
                clonedPointGroup.position.x = (X_MAX - 1) * X_INTER;
                points.push(clonedPointGroup);
                object.add(clonedPointGroup);
            }
        }
    }

    deferred.resolve();
})();
