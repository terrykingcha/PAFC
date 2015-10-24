import {defer} from '../lib/promise';
import {manager, onProgress, onError} from '../prologue';

var deferred = defer();
export var ready = () => deferred.promise;

export var object;

var loader = new THREE.JSONLoader(manager);
loader.load(
    'assets/obj/00_building/building.js',
    function(geometry, materials) {
        object = new THREE.Object3D();

        var buildingMesh = new THREE.Mesh(
            geometry, 
            new THREE.MeshLambertMaterial({
                color: 0xFFFFFF,
                side: THREE.DoubleSide,
                wireframe: true,
                wireframeLinewidth: 1
            })
        );
        buildingMesh.scale.set(0.1, 0.1, 0.1);
        object.add(buildingMesh);

        var buildingInnerMesh = new THREE.Mesh(
            geometry, 
            new THREE.MeshPhongMaterial({
                color: 0x000000,
                emissive: 0x222222,
                opacity: 0.95,
                transparent: true,
                side: THREE.DoubleSide,
            })
        );
        buildingInnerMesh.scale.set(0.099,0.099,0.099);
        object.add(buildingInnerMesh);

        var trigger = new THREE.Mesh(
            new THREE.BoxGeometry(2.5, 22, 2.5),
            new THREE.MeshBasicMaterial({
                color: 0x000000,
                opacity: 0,
                transparent: true
            })
        );
        object.add(trigger);

        deferred.resolve();
    }
)

// var loader = new THREE.OBJLoader(manager);
// loader.load(
//     'assets/obj/building/building2.obj',
//     function (obj) {
//         object = new THREE.Group();

//         var buildingMesh = obj.children[0];
//         buildingMesh.material = new THREE.MeshLambertMaterial({
//             color: 0xFFFFFF,
//             side: THREE.DoubleSide,
//             wireframe: true
//         });
//         buildingMesh.rotation.set(-Math.PI / 2, 0, 0);
//         buildingMesh.scale.set(0.1, 0.1, 0.1);
//         object.add(buildingMesh);

//         var buildingInnerMesh = new THREE.Mesh(
//             buildingMesh.geometry.clone(), 
//             new THREE.MeshLambertMaterial({
//                 color: 0x000000,
//                 side: THREE.DoubleSide,
//             })
//         );
//         buildingInnerMesh.rotation.set(-Math.PI / 2, 0, 0);
//         buildingInnerMesh.scale.set(0.1,0.1,0.1);
//         object.add(buildingInnerMesh);

//         deferred.resolve();
//     }, 
//     onProgress, 
//     onError
// );

