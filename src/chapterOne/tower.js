import {defer} from '../lib/promise';

import {manager, onProgress, onError} from '../prologue';

var deferred = defer();
export var ready = () => deferred.promise;

export var object;

// THREE.Loader.Handlers.add(/\.dds$/i, new THREE.DDSLoader());

var loader = new THREE.OBJLoader(manager);
loader.load(
    'assets/obj/BeautifulGirl/BeautifulGirl.obj',
    // 'assets/obj/BeautifulGirl/BeautifulGirl.mtl',
    function (_object) {
        object = _object;
        object.material = new THREE.MeshPhongMaterial({
            color: 0x000000,
            side: THREE.BackSide,
            wireframe: true
        });
        object.scale.set(1, 1, 1);
        object.rotation.set(-Math.PI / 2, 0, Math.PI);
        deferred.resolve();
    }, 
    onProgress, 
    onError
);

