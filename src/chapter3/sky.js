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
            texture.wrapS = THREE.RepeatWrapping;
            resolve(texture);
        }, 
        onProgress, 
        onError
    );
});


(async () => {
    var image = await texture;
    var geometry = new THREE.PlaneGeometry(
        16000, 4000
    );
    image.wrapS = THREE.RepeatWrapping;
    image.wrapT = THREE.RepeatWrapping;
    image.repeat.set(2, 1);
    var material = new THREE.MeshBasicMaterial({
        map: image,
        side: THREE.FrontSide
    });
    object = new THREE.Mesh(geometry, material);
    deferred.resolve();
})();
