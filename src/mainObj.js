import {defer} from '../lib/promise';
import {mainObjLoaded} from './loaderManager';

var deferred = defer();
export var ready = () => deferred.promise;

export var obj;

(async () => {
    obj = await mainObjLoaded();
    if (obj.children.length) {
        for (let child of obj.children) {
            child.material.side = THREE.DoubleSide;
        }
    } else {
        obj.material.side = THREE.DoubleSide;
    }
    obj.scale.set(1, 1, 1);
    obj.rotation.set(-Math.PI / 2, 0, Math.PI);
    deferred.resolve();
})();
