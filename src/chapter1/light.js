import {defer} from '../lib/promise';

const COLOR = 0x00FF00;
const X = 0;
const Y = 0;
const Z = 0;

var deferred = defer();
export var ready = () => deferred.promise;

export var pointLight = new THREE.PointLight(COLOR);
pointLight.position.set(X, Y, Z);

export var directionallight = new THREE.DirectionalLight(COLOR);
directionallight.position.set(X, Y, Z);

export var ambientlight = new THREE.AmbientLight(COLOR);
ambientlight.position.set(X, Y, Z);

deferred.resolve();
