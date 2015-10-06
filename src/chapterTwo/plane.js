import {defer} from '../lib/promise';

import {manager, onProgress, onError} from '../prologue';

var deferred = defer();
export var ready = () => deferred.promise;

export var object;

export function render() {
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
            size: 5, 
            map: texture,
            alphaTest: 0.5, 
            transparent: true,
            sizeAttenuation: true,
            fog: true
        });
        pointHaloMaterial = new THREE.PointsMaterial({
            size: 7,
            opacity: 0.5,
            map: texture,
            transparent: true,
            sizeAttenuation: true,
            fog: true
        });
        pointMaterialDeferred.resolve();
    },
    onProgress, 
    onError
);

var lineMaterialDeferred = defer();
var lineMaterial = new THREE.LineBasicMaterial({
    linewidth: 5,
    color: 0xFFFFFF,
    fog: true
});
var lineHaloMaterial = new THREE.LineBasicMaterial({
    linewidth: 12,
    opacity: 0.5,
    transparent: true,
    fog: true
});
lineMaterialDeferred.resolve();

(async () => {
    await Promise.all([
        pointMaterialDeferred.promise,
        lineMaterialDeferred.promise
    ]);

    object = new THREE.Object3D();

    const X_MIN = 0;
    const X_MAX = 49;
    const Y_MIN = 0;
    const Y_MAX = 29;
    const X_INTER = 5;
    const Y_INTER = 5;
    for (let x = X_MIN; x <= X_MAX; x++) {
        let pointGeometry;
        let lineGeometry;

        if (x % 2 === 0) {
            pointGeometry = new THREE.Geometry();
        }

        if (x > X_MIN && x < X_MAX && x % 2 === 1) {
            lineGeometry = new THREE.Geometry();
        }

        for (let y = Y_MIN; y < Y_MAX; y++) {
            let vector = new THREE.Vector3(x * X_INTER, y * Y_INTER, 0);

            if (lineGeometry) {
                lineGeometry.vertices.push(vector.clone());
            }

            if (pointGeometry) {
                pointGeometry.vertices.push(vector.clone());
            }
        }

        if (lineGeometry) {
            let lineHalo = new THREE.Line(lineGeometry.clone(), lineHaloMaterial);
            let line = new THREE.Line(lineGeometry, lineMaterial);
            let lineGroup = new THREE.Group();
            lineGroup.add(lineHalo, line);
            object.add(lineGroup);
        }

        if (pointGeometry) {
            let pointHalo = new THREE.Points(pointGeometry.clone(), pointHaloMaterial);
            let point = new THREE.Points(pointGeometry, pointMaterial);
            let pointGroup = new THREE.Group();
            pointGroup.add(pointHalo, point);
            object.add(pointGroup);
        }
    }

    deferred.resolve();
})();
