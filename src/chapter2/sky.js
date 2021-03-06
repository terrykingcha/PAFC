import {defer} from '../lib/promise';
import {width, height} from '../lib/env';
import {manager, onProgress, onError} from '../prologue';

var deferred = defer();
export var ready = () => deferred.promise;
export var object;

var material;
var loader = new THREE.TextureLoader(manager);
var texture = new Promise(function(resolve, reject) {
    loader.load(
        'assets/images/black_bg.jpg', 
        function(texture) {
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            resolve(texture);
        }, 
        onProgress, 
        onError
    );
});


(async () => {
    var image = await texture;
    var geometry = new THREE.SphereGeometry(
        100, 64, 64
    );
    var material = new THREE.MeshBasicMaterial({
        map: image,
        side: THREE.BackSide
    });
    object = new THREE.Mesh(geometry, material);
    deferred.resolve();
})();
