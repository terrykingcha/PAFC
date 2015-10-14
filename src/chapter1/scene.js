import {defer} from '../lib/promise';

var deferred = defer();
export var ready = () => deferred.promise;

export var scene = new THREE.Scene();
deferred.resolve();
