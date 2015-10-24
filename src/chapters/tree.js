import {defer} from '../lib/promise';
import {manager, onProgress, onError} from '../prologue';

var deferred = defer();
export var ready = () => deferred.promise;

export var object;

var loader = new THREE.JSONLoader(manager);
loader.load(
    'assets/obj/02_tree/tree.js',
    function(geometry, materials) {
        materials.forEach(function(m) {
            m.color.setHex(0xFFFFFF);
        });
        var material = new THREE.MeshFaceMaterial(materials);
        object = new THREE.Mesh(geometry, material);
        object.rotation.set(0, 0, 0);
        object.scale.set(0.5, 0.5, 0.5);
        deferred.resolve();
    }
);

