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
            size: 10, 
            map: texture,
            alphaTest: 0.5, 
            transparent: true,
            sizeAttenuation: false,
            fog: true
        });
        pointHaloMaterial = new THREE.PointsMaterial({
            size: 15,
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
export const X_MAX = 10;
export const Y_MIN = 0;
export const Y_MAX = 10;
export const Z_MIN = 0;
export const Z_MAX = 10;
export const X_INTER = 100;
export const Y_INTER = 100;
export const Z_INTER = 100;
export const X_LENGTH = X_MAX - X_MIN + 1;
export const Y_LENGTH = Y_MAX - Y_MIN + 1;
export const Z_LENGTH = Z_MAX - Z_MIN + 1;

export var xSize = () => X_LENGTH * X_INTER;
export var ySize = () => Y_LENGTH * Y_INTER;
export var zSize = () => Z_LENGTH * Z_INTER;

var points = [];
var lines = [];

export const LINE_CURVE_DIST = 2;
export function lineCurve(x, y, z) {
    var cp = Math.random() * 0.4 + 0.3;
    var curve1 = new THREE.CubicBezierCurve3(
        new THREE.Vector3(0, (y - LINE_CURVE_DIST) * Y_INTER, z * Z_INTER),
        new THREE.Vector3(0, (y - LINE_CURVE_DIST * (1 - cp) ) * Y_INTER, z * Z_INTER),
        new THREE.Vector3(x * X_INTER, (y - LINE_CURVE_DIST * cp) * Y_INTER,  z * Z_INTER),
        new THREE.Vector3(x * X_INTER, y * Y_INTER, z * Z_INTER)
    );
    var curve2 = new THREE.CubicBezierCurve3(
        new THREE.Vector3(x * X_INTER, y * Y_INTER, z * Z_INTER),
        new THREE.Vector3(x * X_INTER, (y + LINE_CURVE_DIST * cp) * Y_INTER, z * Z_INTER),
        new THREE.Vector3(0, (y + LINE_CURVE_DIST * (1 - cp)) * Y_INTER,  z * Z_INTER),
        new THREE.Vector3(0, (y + LINE_CURVE_DIST) * Y_INTER, z * Z_INTER)
    );

    var curvePoints = curve1.getPoints(1000).concat(curve2.getPoints(1000));

    return curvePoints;
}

export function beatAt(x, y) {
    var deferred = defer(); 

    var ticks = [];

    lines.forEach(function(lineGroup) {
        var originX = lineGroup.position.x / X_INTER;
        var originZ = lineGroup.position.z / Z_INTER;

        lineGroup.children.slice(1, 2).forEach(function(line) {
            var geometry = line.geometry;
            if (geometry.vertices.length > 2) {
                geometry.vertices.splice(1, geometry.vertices.length - 2);
            }

            ticks.push({
                tick(x1, x2) {
                    var curvePoints = lineCurve(x2, y, 0);
                    line.geometry = geometry.clone();
                    line.geometry.vertices.splice(1, 0, ...curvePoints);
                },
                start: x - originX - (x - originX) / originX,
                end: 0
            });

            // geometry.vertices.splice(1, 0, ...curvePoints);
            // geometry.verticesNeedUpdate = true;
        });
    });

    for (let originX in points) {
        // originX = parseFloat(originX);
        let kx = x + 0.5;
        let offset = kx - originX;
        let sign = Math.sign(offset);
        let group = points[originX];
        let y1 = y, y2 = y;
        let step1 = offset / (y1 - Y_MIN);
        let step2 = offset / (Y_MAX - y2);

        while (y1 >= Y_MIN || y2 <= Y_MAX) {
            if (y1 >= Y_MIN) {
                let point = group[y1];
                let originY = point.position.y / Y_INTER;
                ticks.push({
                    tick(x1, x2) {
                        point.position.x = x2[0] * X_INTER;
                        point.position.y = x2[1] * X_INTER;
                    },
                    start: [kx - step1 * (y - y1), originY * (1 + Math.random() * 0.5)],
                    end: [originX, originY]
                });
                y1--;  
            }

            if (y2 <= Y_MAX) {
                let point = group[y2];
                let originY = point.position.y / Y_INTER;
                ticks.push({
                    tick(x1, x2) {
                        point.position.x = x2[0] * X_INTER;
                        point.position.y = x2[1] * X_INTER;
                    },
                    start: [kx - step2 * (y2 - y), originY * (1 - Math.random() * 0.5)],
                    end: [originX, originY]
                });
                y2++; 
            }
        }
    }

    var bezier = CubicBezier.easeInOut;
    var i = 0;
    requestAnimationFrame(function tween() {
        if (i > 1) return deferred.resolve();
        requestAnimationFrame(tween);
        ticks.forEach(function(tick) {
            var i1, i2;
            if (tick.start instanceof Array && 
                    tick.end instanceof Array) {
                i1 = tick.start.map(function(start, idx) {
                    var end = tick.end[idx];
                    return start + (end - start) * i;
                });
                i2 = tick.start.map(function(start, idx) {
                    var end = tick.end[idx];
                    return start + (end - start) * bezier(i);
                });
            } else {
                var i1 = tick.start + (tick.end - tick.start) * i;
                var i2 = tick.start + (tick.end - tick.start) * bezier(i);
            }
            tick.tick(i1, i2);
        });
        i += 0.05;
    });

    return deferred.promise;
}

(async () => {
    await Promise.all([
        pointMaterialDeferred.promise,
        lineMaterialDeferred.promise
    ]);

    object = new THREE.Object3D();

    var vec31 = new THREE.Vector3(0, 0, 0);
    function makePoint() {
        var pointGeometry = new THREE.Geometry();
        pointGeometry.vertices.push(vec31.clone());
        var pointHalo = new THREE.Points(pointGeometry.clone(), pointHaloMaterial);
        var point = new THREE.Points(pointGeometry, pointMaterial);
        var pointGroup = new THREE.Group();
        pointGroup.add(pointHalo, point);
        return pointGroup;
    }

    var vec32 = new THREE.Vector3(0, Y_MIN, 0);
    var vec33 = new THREE.Vector3(0, Y_MAX * Y_INTER, 0); 
    function makeLine() {
        var lineGeometry = new THREE.Geometry();
        lineGeometry.vertices.push(vec32.clone());
        lineGeometry.vertices.push(vec33.clone());
        var lineHalo = new THREE.Line(lineGeometry.clone(), lineHaloMaterial);
        var line = new THREE.Line(lineGeometry, lineMaterial);
        var lineGroup = new THREE.Group();
        lineGroup.add(lineHalo, line);
        return lineGroup;
    }

    for (let i = 0; i <= X_LENGTH * Y_LENGTH * Z_LENGTH;) {
        let clonedPointGroup = makePoint();
        clonedPointGroup.position.set(
            (Math.random() * X_LENGTH + X_MIN) * X_INTER,
            (Math.random() * Y_LENGTH + Z_MIN) * Y_INTER,
            (Math.random() * Z_LENGTH + Z_MIN) * Z_INTER
        );
        points.push(clonedPointGroup);
        object.add(clonedPointGroup);
    }

    for (let x = X_MIN; x <= X_MAX; x++) {


        for (let z = Z_MIN; z <= Z_MAX; z++) {
            let clonedLineGroup = makeLine();
            clonedLineGroup.position.x = x * X_INTER;
            clonedLineGroup.position.z = z * Z_INTER;
            lines.push(clonedLineGroup);
            object.add(clonedLineGroup);
        }
    }

    deferred.resolve();
})();
