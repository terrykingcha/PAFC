import {defer} from '../lib/promise';
import {width, height}from '../lib/env';
import CubicBezier from '../lib/cubicbezier';
import {requestAnimationFrame}from '../lib/util';
import {manager, onProgress, onError} from '../prologue';

var deferred = defer();
export var ready = () => deferred.promise;
export var object;

export var render = () => {

}

var loader = new THREE.JSONLoader(manager);
loader.load('assets/obj/01_fog/grass.js', function(geometry, materials) {
    object = new THREE.Object3D();

    materials.forEach(function(m) {
        m.fog = true;
    });

    var material = new THREE.MeshFaceMaterial(materials);

    for (let x = 0; x < 5; x++) {
        for (let z = 0; z < 6; z++) {
            let mesh = new THREE.SkinnedMesh(geometry.clone(), material);
            mesh.position.set(x * 50, 0, z * 40);
            mesh.scale.set(20, 20, 20);
            mesh.rotation.set(0, Math.PI / 2, 0);
            object.add(mesh);
        }
    }

    deferred.resolve();
}, onProgress, onError);