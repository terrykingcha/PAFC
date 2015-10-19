import {defer} from '../lib/promise';

import {manager, onProgress, onError} from '../prologue';

var deferred = defer();
export var ready = () => deferred.promise;

export var object;

var loader = new THREE.OBJLoader(manager);
loader.load(
    'assets/obj/building/building2.obj',
    function (obj) {
        object = new THREE.Group();

        var buildingMesh = obj.children[0];
        buildingMesh.material = new THREE.MeshLambertMaterial({
            color: 0xFFFFFF,
            essive: 0xFFFFFF,
            side: THREE.DoubleSide,
            wireframe: true
        });
        buildingMesh.rotation.set(-Math.PI / 2, 0, 0);
        buildingMesh.scale.set(0.1, 0.1, 0.1);
        object.add(buildingMesh);

        var buildingInnerMesh = new THREE.Mesh(
            buildingMesh.geometry.clone(), 
            new THREE.MeshLambertMaterial({
                color: 0x000000,
                essive: 0x000000,
                side: THREE.DoubleSide,
            })
        );
        buildingInnerMesh.rotation.set(-Math.PI / 2, 0, 0);
        buildingInnerMesh.scale.set(0.1,0.1,0.1);
        object.add(buildingInnerMesh);

        deferred.resolve();
    }, 
    onProgress, 
    onError
);

// var loader = new THREE.JSONLoader(manager);
// loader.load(
//     'assets/obj/building/building1.json',
//     function (geometry, materials) {
//         object = new THREE.Mesh(geometry);
//         object.material = new THREE.MeshFaceMaterial([
//             new THREE.MeshLambertMaterial({
//                 color: 0x000000,
//                 emissive: 0x000000,
//                 side: THREE.DoubleSide
//             })
//         ]);
//         object.scale.set(50, 50, 50);
//         deferred.resolve();
//     }, 
//     onProgress, 
//     onError
// );

