import {defer} from '../lib/promise';

import {manager, onProgress, onError} from '../prologue';

var deferred = defer();
export var ready = () => deferred.promise;

export var object;

THREE.Loader.Handlers.add(/\.tag$/i, new THREE.TGALoader());

var loader = new THREE.JSONLoader(manager);
loader.load(
    'assets/obj/others/ball.js',
    function(geometry, materials) {
        object = new THREE.Mesh(geometry,
                new THREE.MeshFaceMaterial(materials));
        deferred.resolve();
    },
    onProgress, 
    onError
);

