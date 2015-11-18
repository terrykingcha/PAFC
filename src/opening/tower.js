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
                emissive: 0x000000,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.2,
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
                opacity: 1,
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
                depthTest: false,
                transparent: true
            })
        );
        object.add(trigger);

        deferred.resolve();
    }
)

