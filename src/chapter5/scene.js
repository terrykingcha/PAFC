import {defer} from '../lib/promise';

const COLOR = 0x333333;

var deferred = defer();
export var ready = () => deferred.promise;

export var scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(COLOR, 0.001);

deferred.resolve();
