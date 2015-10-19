import {defer} from '../lib/promise';
import {width, height, time} from '../lib/env';
import {requestAnimationFrame} from '../lib/util';
import {manager, onProgress, onError} from '../prologue';

var deferred = defer();
export var ready = () => deferred.promise;
export var object;

var skyMaterial;
var skyMaterialDeferred = defer();
var skyMaterialLoader = new THREE.TextureLoader(manager);
skyMaterialLoader.load(
    `assets/images/${time()}_d.png`,
    function(texture) {
        skyMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.BackSide
        });
        skyMaterialDeferred.resolve();
    },
    onProgress, 
    onError
);

var rotateY = 0;
var radians = THREE.Math.degToRad(0.02);
function animate() {
    requestAnimationFrame(animate);
    object.rotation.y = rotateY;
    rotateY -= radians;
}

(async () => {
    await skyMaterialDeferred.promise;

    var windowW = width();
    var windowH = height();
    var imageW = skyMaterial.map.image.width;
    var imageH = skyMaterial.map.image.height;
    var ratio = Math.max(windowW / windowH, imageW / imageH);

    var shpereGeometry = new THREE.SphereGeometry(
        50, 64, 64
    );
    object = new THREE.Mesh(shpereGeometry, skyMaterial);
    deferred.resolve(object);
    animate();
})();

