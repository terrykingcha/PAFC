import {defer} from '../lib/promise';
import {width, height} from '../lib/env';
import {manager, onProgress, onError} from '../prologue';

var bgIndex = location.search.match(/bgi=(\d+)/);
if (bgIndex) {
    bgIndex = bgIndex[1] >> 0;
} else {
    bgIndex = 1;
}

var deferred = defer();
export var ready = () => deferred.promise;
export var object;

var skyMaterial;
var skyMaterialDeferred = defer();
var skyMaterialLoader = new THREE.TextureLoader(manager);
skyMaterialLoader.load(
    `assets/images/bg${bgIndex}.jpg`,
    function(texture) {
        skyMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.BackSide
        });
        skyMaterialDeferred.resolve();
    },
    onProgress, 
    onError
);

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
    deferred.resolve();
})();

