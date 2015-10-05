import {defer} from '../lib/promise';
import {width, height} from '../lib/env';


import {manager, onProgress, onError} from '../prologue';

var deferred = defer();
export var ready = () => deferred.promise;

export var object;

var skyMaterial;
var skyMaterialDeferred = defer();
var skyMaterialLoader = new THREE.TextureLoader(manager);
skyMaterialLoader.load(
    'assets/images/bg4.jpg',
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
        50, 64, 64, 
        0, Math.PI * 2, 
        THREE.Math.degToRad(55), THREE.Math.degToRad(75)
    );
    object = new THREE.Mesh(shpereGeometry, skyMaterial);
    deferred.resolve();
})();

