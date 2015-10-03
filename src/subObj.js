import {defer} from '../lib/promise';
import {subMaterialLoaded} from './loaderManager';


var deferred = defer();
export var ready = () => deferred.promise;

export var obj;

export var pointMaterial;

export var lineMaterial;

export function render() {
    var time = Date.now() * 0.00005;
    var h = ( 360 * ( 1.0 + time ) % 360 ) / 360;
    pointMaterial.color.setHSL(h, 0.5, 0.5);
    lineMaterial.color.setHSL(h, 0.5, 0.5);
}

(async () => {
    obj = new THREE.Object3D();

    var texture = await subMaterialLoaded();
    pointMaterial = new THREE.PointsMaterial({
        size: 10, 
        map: texture, 
        alphaTest: 0.5, 
        transparent: true
    });
    pointMaterial.color.setHSL( 1.0, 0.3, 0.7 );

    lineMaterial = new THREE.LineBasicMaterial({
        linewidth: 5
    });
    lineMaterial.color.setHSL(1.0, 0.3, 0.7);

    const X_MIN = 0;
    const X_MAX = 29;
    const Y_MIN = 0;
    const Y_MAX = 19;
    const X_INTER = 10;
    const Y_INTER = 10;
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
            obj.add(line);
        }

        if (pointGeometry) {
            let point = new THREE.Points(pointGeometry, pointMaterial);
            obj.add(point);
        }
    }

    deferred.resolve();
})();
