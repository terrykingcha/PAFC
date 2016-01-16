import {defer} from '../lib/promise';
import {width, height}from '../lib/env';
import CubicBezier from '../lib/cubicbezier';
import {requestAnimationFrame}from '../lib/util';
import {manager, onProgress, onError} from '../prologue';

var deferred = defer();
export var ready = () => deferred.promise;
export var object;

var loader = new THREE.JSONLoader(manager);
loader.load('assets/obj/02_cloud/hill2.js', function(geometry, materials) {
    object = new THREE.Object3D();

    var hillMaterial = new THREE.MeshFaceMaterial(materials);
    var hillMesh = new THREE.Mesh(geometry, hillMaterial);
    object.add(hillMesh);

    var outerMesh = new THREE.Mesh(geometry.clone(), hillMaterial.clone());
    outerMesh.position.set(0, 1, 0);
    outerMesh.material.materials[0].opacity = 0.2;
    outerMesh.material.materials[0].transparent = true;
    outerMesh.material.materials[0].color.setHex(0xFFFFFF);
    outerMesh.material.materials[0].emissive.setHex(0xFFFFFF);
    object.add(outerMesh);

    // mesh.rotation.set(-0.25, Math.PI * 0.35, 0);
    // mesh.scale.set(6, 6, 6);

    deferred.resolve();
}, onProgress, onError);