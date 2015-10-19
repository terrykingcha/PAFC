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

    pointFlow();

    if (visualizer && visualizer.isPlaying) {
        var bitCount = visualizer.analyser.frequencyBinCount;
        var freqs = visualizer.freqs.slice(0, bitCount);
        var offsets = freqs.map((freq) => X_INTER * freq / 256);
        lineRhythm(offsets);
    }
}

var pointMaterialDeferred = defer();
var pointMaterial = new THREE.PointsMaterial({
    size: 2, 
    color: 0xFFFFFF,
    alphaTest: 0.5, 
    transparent: true,
    sizeAttenuation: false,
    fog: true
});
var pointHaloMaterial = new THREE.PointsMaterial({
    size: 4,
    opacity: 0.5,
    transparent: true,
    sizeAttenuation: false,
    fog: true
});
pointMaterialDeferred.resolve();

var lineMaterialDeferred = defer();
var lineMaterial = new THREE.LineBasicMaterial({
    linewidth: 1,
    color: 0xFFFFFF,
    opacity: 0.5,
    transparent: true,
    fog: true
});
var lineHaloMaterial = new THREE.LineBasicMaterial({
    linewidth: 2,
    opacity: 0.5,
    transparent: true,
    fog: true
});
lineMaterialDeferred.resolve();

const X_MIN = 0;
const X_MAX = 8;
const Y_MIN = 0;
const Y_MAX = 20;
const Z_MIN = -7;
const Z_MAX = 0;
const X_INTER = 100;
const Y_INTER = 40;
const Z_INTER = 50;
const X_LENGTH = X_MAX - X_MIN + 1;
const Y_LENGTH = Y_MAX - Y_MIN + 1;
const Z_LENGTH = Z_MAX - Z_MIN + 1;

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

const PL_AMOUNT = 10;  // 组合点的总数
const PL_POINTS = 100; // 组合点中点的个数
const PL_THETA = THREE.Math.degToRad(10); // 组合线条的角度

function makePoint() {
    var pointGroup = new THREE.Group();

    var pointGeometry = new THREE.Geometry();
    pointGeometry.vertices.push(VEC.ORIGIN.clone());
    var point = new THREE.Points(pointGeometry, pointMaterial);
    pointGroup.add(point);

    var pointHalo = new THREE.Points(pointGeometry.clone(), pointHaloMaterial);
    pointGroup.add(pointHalo);

    return pointGroup;
}

function makePointLine() {
    var x = 0;
    var group = new THREE.Group();
    for (let i = 0; i < PL_POINTS; i++) {
        let clonedPoint = makePoint();
        let height = x * Math.tan(PL_THETA);

        clonedPoint.position.set(
            x,
            height - Math.random() * height,
            0
        );
        group.add(clonedPoint);

        clonedPoint = makePoint();
        clonedPoint.position.set(
            x,
            -height + Math.random() * height,
            0
        );
        group.add(clonedPoint);

        x += Math.random() * 10;
    }

    group.size = x;

    for (let point of group.children) {
        point.position.z = -(group.size - point.position.x) * Math.tan(PL_THETA);
    }
    return group;
}

const POINT_FLOW_X_OFFSET = -0.15;
function pointFlow() {
    var originTheta = PL_THETA;

    for (let pointGroup of points) {
        for (let point of pointGroup.children) {
            let theta = Math.atan(point.position.y / point.position.x);
            let x = point.position.x + POINT_FLOW_X_OFFSET;
            point.position.x = x;
            point.position.y = x * Math.tan(theta);
            if (point.position.x < 0) {
                point.position.x = pointGroup.size;
                point.position.y = pointGroup.size * Math.tan(theta);
            }
        }
    }
}

function makeLine() {
    var lineGroup = new THREE.Group();

    var lineGeometry = new THREE.Geometry();
    lineGeometry.vertices.push(VEC.Y_MIN.clone());
    lineGeometry.vertices.push(VEC.Y_MAX.clone());
    var line = new THREE.Line(lineGeometry, lineMaterial);
    line.scale.x = 0.5;
    lineGroup.add(line);

    var lineHalo = new THREE.Line(lineGeometry.clone(), lineHaloMaterial);
    lineHalo.scale.x = 0.5
    lineGroup.add(lineHalo);

    return lineGroup;
}

const LINE_CURVE_POINTS = 10;
const LINE_Y_OFFSET = Y_INTER * 1.2;
function getCurvePoints(x, y, z) {
    var curve1 = new THREE.CubicBezierCurve3(
        new THREE.Vector3(0, y + LINE_Y_OFFSET, z),
        new THREE.Vector3(0, y + LINE_Y_OFFSET / 2, z),
        new THREE.Vector3(x, y + LINE_Y_OFFSET / 2, z),
        new THREE.Vector3(x, y, z)
    );
    var curve2 = new THREE.CubicBezierCurve3(
        new THREE.Vector3(x, y, z),
        new THREE.Vector3(x, y - LINE_Y_OFFSET / 2, z),
        new THREE.Vector3(0, y - LINE_Y_OFFSET / 2,  z),
        new THREE.Vector3(0, y - LINE_Y_OFFSET, z)
    );

    var curvePoints = curve1.getPoints(LINE_CURVE_POINTS).concat(curve2.getPoints(LINE_CURVE_POINTS)).reverse();
    return curvePoints;
}

function duplicatePoints(points) {
    // for (var i = 1; i < points.length;) {
    //     if (points[i].y <= points[i - 1].y) {
    //         points.splice(i - 1, 2);
    //     } else {
    //         i++;
    //     }
    // }
}


let lowYOffset = ySize() / 2 - LINE_Y_OFFSET * 2;
let midYOffset = ySize() / 2;
let highYOffset = ySize() / 2 + LINE_Y_OFFSET * 2;

function lineRhythm(offsets) {
    var lows = offsets.slice(0, Z_LENGTH);
    var mids = offsets.slice(offsets.length / 2 - Z_LENGTH / 2, offsets.length / 2 + Z_LENGTH / 2);
    var highs = offsets.slice(offsets.length -  Z_LENGTH, offsets.length);
    var centerX = xSize() / 2;

    lowYOffset += (Math.random() - 0.5) * (Math.random() * 11 > 5 ? 1 : -1);
    midYOffset += (Math.random() - 0.5) * (Math.random() * 11 > 5 ? 1 : -1);
    highYOffset += (Math.random() - 0.5) * (Math.random() * 11 > 5 ? 1 : -1);

    for (let lineGroup of lines) {
        let zPos = lineGroup.position.z / Z_INTER - Z_MIN;
        let lowXOffset = lows[zPos] || 1;
        let lowPoints = [];
        let midXOffset = mids[zPos] || 1;
        let midPoints = [];
        let highXOffset = highs[zPos] || 1;
        let highPoints = [];
        let firstLine = lineGroup.children[0];
        let zOffset = firstLine.position.z;

        if (lineGroup.position.x < centerX) {
            [lowXOffset, midXOffset, highXOffset] = 
                [lowXOffset, midXOffset, highXOffset].map(
                    (o) => lineGroup.position.x / centerX * o
                );
        } else {
            [lowXOffset, midXOffset, highXOffset] = 
                [lowXOffset, midXOffset, highXOffset].map(
                    (o) => ((lineGroup.position.x - centerX) / centerX + 2) * o
                );
        }
        if (lowXOffset > 0) {
            lowPoints = getCurvePoints(firstLine.position.x - lowXOffset, lowYOffset, zOffset);
        }
        if (midXOffset > 0) {
            midPoints = getCurvePoints(firstLine.position.x - midXOffset, midYOffset, zOffset);
        }
        if (highXOffset > 0) {
            highPoints = getCurvePoints(firstLine.position.x - highXOffset, highYOffset, zOffset);
        }

        for (let line of lineGroup.children) {
            let geometry = line.geometry.clone();
            if (geometry.vertices.length > 2) {
                geometry.vertices.splice(1, geometry.vertices.length - 2);
            }
            let points = [...lowPoints, ...midPoints, ...highPoints];
            // duplicatePoints(points);
            geometry.vertices.splice(1, 0, ...points);
            geometry.verticesNeedUpdate = true;
            line.geometry = geometry;
        }
    }
}

(async () => {
    await Promise.all([
        pointMaterialDeferred.promise,
        lineMaterialDeferred.promise
    ]);

    object = new THREE.Object3D();

    for (let r = 0; r < PL_AMOUNT; r++) {
        let clonedPointLineGroup = makePointLine();
        var theta = Math.PI * 2 / PL_AMOUNT * r;
        clonedPointLineGroup.position.set(
            xSize() / 2 + (1 + Math.random()) * X_INTER / 2 * Math.cos(theta),
            ySize() / 2 + (1 + Math.random()) * Y_INTER / 2 * Math.sin(theta),
            -zSize() / 2
        );
        clonedPointLineGroup.rotation.set(
            0,
            0,
            theta
        )
        points.push(clonedPointLineGroup);
        object.add(clonedPointLineGroup);
    }

    for (let x = X_MIN; x <= X_MAX; x++) {
        for (let z = Z_MIN; z <= Z_MAX; z++) {
            let clonedLineGroup = makeLine();
            clonedLineGroup.position.x = x * X_INTER;
            clonedLineGroup.position.z = z * Z_INTER;
            if (x * X_INTER === xSize() / 2) {
                let sign = z % 2 === 0 ? 1 : -1;
                clonedLineGroup.position.x += sign * X_INTER / 2 / Z_LENGTH * z;
                clonedLineGroup.position.z = (Z_MIN - z) * Z_INTER;
            }
            lines.push(clonedLineGroup);
            object.add(clonedLineGroup);
        }
    }

    deferred.resolve();
})();
