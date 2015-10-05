import {defer} from '../lib/promise';

import {manager, onProgress, onError} from '../prologue';

var deferred = defer();
export var ready = () => deferred.promise;

export var object;

export function render() {
    var time = Date.now() * 0.00005;
    var h = ( 360 * ( 1.0 + time ) % 360 ) / 360;
    pointMaterial.color.setHSL(h, 0.5, 0.5);
    lineMaterial.color.setHSL(h, 0.5, 0.5);
}

var pointMaterial;
var pointMaterialDeferred = defer();
var pointMaterialLoader = new THREE.TextureLoader(manager);
pointMaterialLoader.load(
    'assets/images/disc.png',
    function(texture) {
        pointMaterial = new THREE.PointsMaterial({
            size: 5, 
            map: texture, 
            // sizeAttenuation: false,
            alphaTest: 0.5, 
            transparent: true,
            fog: true
        });
        pointMaterial.color.setHSL( 1.0, 0.3, 0.7 );
        pointMaterialDeferred.resolve();
    },
    onProgress, 
    onError
);

var lineMaterialDeferred = defer();
var lineMaterial = new THREE.LineBasicMaterial({
    linewidth: 2.5,
    // sizeAttenuation: false,
    fog: true
});
lineMaterialDeferred.resolve();
// var lineMaterialLoader = new THREE.OBJMTLLoader(manager);
// lineMaterialLoader.load(
//     'assets/obj/others/ball.obj',
//     'assets/obj/others/ball.mtl',
//     function (material) {
//         object = material;
//         deferred.resolve();
//         // lineMaterial = material;
//         // lineMaterialDeferred.resolve();
//     }, 
//     onProgress, 
//     onError
// );

(async () => {
    await Promise.all([
        pointMaterialDeferred.promise,
        lineMaterialDeferred.promise
    ]);

    pointMaterial.color.setHSL(1.0, 0.3, 0.7);
    lineMaterial.color.setHSL(1.0, 0.3, 0.7);

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
            let line = new THREE.Line(lineGeometry, lineMaterial);
            object.add(line);
        }

        if (pointGeometry) {
            let point = new THREE.Points(pointGeometry, pointMaterial);
            object.add(point);
        }
    }

    deferred.resolve();
})();
