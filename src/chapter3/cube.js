import {defer} from '../lib/promise';
import {width, height} from '../lib/env';
import CubicBezier from '../lib/cubicbezier';
import {requestAnimationFrame} from '../lib/util';
import {manager, onProgress, onError} from '../prologue';

var deferred = defer();
export var ready = () => deferred.promise;

export var object;

export function render(visualizer) {
    var time = Date.now() * 0.00005;
    var h = ( 360 * ( 1.0 + time ) % 360 ) / 360;
    pointHaloMaterial.color.setHSL(h, 0.5, 0.5);
    lineHaloMaterial.color.setHSL(h, 0.5, 0.5);
}

var pointMaterial;
var pointHaloMaterial;
var pointMaterialDeferred = defer();
var pointMaterialLoader = new THREE.TextureLoader(manager);
pointMaterialLoader.load(
    'assets/images/disc.png',
    function(texture) {
        pointMaterial = new THREE.PointsMaterial({
            size: 20, 
            map: texture,
            alphaTest: 0.5, 
            transparent: true,
            sizeAttenuation: false,
            fog: true
        });
        pointHaloMaterial = new THREE.PointsMaterial({
            size: 30,
            opacity: 0.5,
            map: texture,
            transparent: true,
            sizeAttenuation: false,
            fog: true
        });
        pointMaterialDeferred.resolve();
    },
    onProgress, 
    onError
);

var lineMaterialDeferred = defer();
var lineMaterial = new THREE.LineBasicMaterial({
    linewidth: 3,
    color: 0xFFFFFF,
    alphaTest: 0.5,
    transparent: true,
    fog: true
});
var lineHaloMaterial = new THREE.LineBasicMaterial({
    linewidth: 10,
    opacity: 0.5,
    transparent: true,
    fog: true
});
lineMaterialDeferred.resolve();

export const X_MIN = 0;
export const X_MAX = 4;
export const Y_MIN = 0;
export const Y_MAX = 4;
export const Z_MIN = 0;
export const Z_MAX = 4;
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
        var pointGeometry = new THREE.Geometry();
        pointGeometry.vertices.push(VEC.ORIGIN.clone());
        var pointHalo = new THREE.Points(pointGeometry.clone(), pointHaloMaterial);
        var point = new THREE.Points(pointGeometry, pointMaterial);
        var pointGroup = new THREE.Group();
        pointGroup.add(pointHalo, point);
        return pointGroup;
    }

    function makeLine(dir) {
        var lineGeometry = new THREE.Geometry();
        lineGeometry.vertices.push(VEC[`${dir}_MIN`].clone());
        lineGeometry.vertices.push(VEC[`${dir}_MAX`].clone());
        var lineHalo = new THREE.Line(lineGeometry.clone(), lineHaloMaterial);
        var line = new THREE.Line(lineGeometry, lineMaterial);
        var lineGroup = new THREE.Group();
        lineGroup.add(lineHalo, line);
        return lineGroup;
    }

    // for (let i = 0; i <= X_LENGTH * Y_LENGTH * Z_LENGTH; i++) {
    //     let clonedPointGroup = makePoint();
    //     clonedPointGroup.position.set(
    //         (Math.random() * X_LENGTH + X_MIN) * X_INTER,
    //         (Math.random() * Y_LENGTH + Z_MIN) * Y_INTER,
    //         (Math.random() * Z_LENGTH + Z_MIN) * Z_INTER
    //     );
    //     points.push(clonedPointGroup);
    //     object.add(clonedPointGroup);
    // }

    for (let x = X_MIN; x <= X_MAX; x++) {
        for (let y = Y_MIN; y <= Y_MAX; y++) {
            let clonedLineGroup = makeLine('Z');
            clonedLineGroup.position.x = x * X_INTER;
            clonedLineGroup.position.y = y * Y_INTER;
            lines.push(clonedLineGroup);
            object.add(clonedLineGroup);
        }
    }

    for (let x = X_MIN; x <= X_MAX; x++) {
        for (let z = Z_MIN; z <= Z_MAX; z++) {
            let clonedLineGroup = makeLine('Y');
            clonedLineGroup.position.x = x * X_INTER;
            clonedLineGroup.position.z = z * Z_INTER;
            lines.push(clonedLineGroup);
            object.add(clonedLineGroup);
        }
    }

    for (let y = Y_MIN; y <= Y_MAX; y++) {
        for (let z = Z_MIN; z <= Z_MAX; z++) {
            let clonedLineGroup = makeLine('X');
            clonedLineGroup.position.y = y * X_INTER;
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
