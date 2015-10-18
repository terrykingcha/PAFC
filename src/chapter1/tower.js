import {defer} from '../lib/promise';

import {manager, onProgress, onError} from '../prologue';

var deferred = defer();
export var ready = () => deferred.promise;

export var object;

THREE.Loader.Handlers.add(/\.png$/i, new THREE.ImageLoader());
THREE.Loader.Handlers.add(/\.tag$/i, new THREE.TGALoader());
THREE.Loader.Handlers.add(/\.dds$/i, new THREE.DDSLoader());

var loader = new THREE.OBJLoader(manager);
loader.load(
    'assets/obj/building/pafc.obj',
    // 'assets/obj/BeautifulGirl/test.mtl',
    function (_object) {
        object = _object;
        object.traverse(function(mesh) {
            if (mesh instanceof THREE.Mesh) {
                mesh.position.set(-8.5, 11.5, 14);
                mesh.material = new THREE.MeshLambertMaterial({
                    color: 0xFFFFFF,
                    essive: 0xFFFFFF,
                    side: THREE.DoubleSide
                });
            }
        });

        object.scale.set(1, 1, 1);
        deferred.resolve();
    }, 
    onProgress, 
    onError
);

// var loader = new THREE.JSONLoader(manager);
// loader.load(
//     'assets/obj/BeautifulGirl/Beautiful Girl.js',
//     function (geometry, materials) {
//         console.log(geometry, materials);
//         object = new THREE.Mesh(geometry, 
//             new THREE.MeshFaceMaterial(materials))
//         // object = _object;
//         object.traverse(function(mesh) {
//             if (mesh instanceof THREE.Mesh) {
//                 mesh.material.side = THREE.DoubleSide;
//             }
//         });

//         object.scale.set(1, 1, 1);
//         object.rotation.set(-Math.PI / 2, 0, Math.PI);
//         deferred.resolve();
//     }, 
//     onProgress, 
//     onError
// );

