import {defer} from '../lib/promise';
import {width, height} from '../lib/env';
import {manager, onProgress, onError} from '../prologue';

var deferred = defer();
export var ready = () => deferred.promise;
export var object;

var material;
var loader = new THREE.TextureLoader(manager);
loader.load(
    'assets/images/blackstar.jpg', 
    function(texture) {
        object = new THREE.Object3D();

        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        var geometry = new THREE.PlaneGeometry(380, 200);
        var material = new THREE.MeshBasicMaterial({
            map: texture
        });
        var mesh = new THREE.Mesh(geometry, material);
        object.add(mesh);

        deferred.resolve();
    }, 
    onProgress, 
    onError
)

