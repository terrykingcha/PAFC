import {defer} from './lib/promise';

var deferred = defer();
export var ready = () => deferred.promise;

export var manager = new THREE.LoadingManager();
manager.onProgress = function (item, loaded, total) {
    console.log(item, loaded, total);

    if (loaded === total) {
        deferred.resolve();
    }
};

export function onProgress(xhr) {
    if (xhr.lengthComputable) {
        var percentComplete = xhr.loaded / xhr.total * 100;
        console.log(Math.round(percentComplete, 2) + '% downloaded');
    }
};

export function onError(xhr) {
}