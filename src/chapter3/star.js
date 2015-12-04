import {defer} from '../lib/promise';
import {width, height} from '../lib/env';
import {manager, onProgress, onError} from '../prologue';
import * as Clock from '../clock';

var deferred = defer();
export var ready = () => deferred.promise;
export var object;

function buildStars(z) {
    var material = new THREE.PointsMaterial({  // 星星
        size: 2 * Math.random() + 2,
        opacity: 0.5 + Math.random() * 0.5,
        vertexColors: THREE.VertexColors,
        side: THREE.FontSide
    });

    var total = 20000;
    var vertices = new Float32Array(3 * total); 
    var colors = new Float32Array(3 * total);
    while (total-- > 0) {
        vertices[total * 3] = Math.random() * 10000 - 5000;
        vertices[total * 3 + 1] = Math.random() * 4000 - 2000;
        vertices[total * 3 + 2] = z * Math.random() * -100;
        colors[total * 3 + 2] = colors[total * 3 + 1] = colors[total * 3] = Math.random();
    }

    var geometry = new THREE.BufferGeometry;
    geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeBoundingSphere();

    return new THREE.Points(geometry, material);
}

(async () => {
    object = new THREE.Object3D();

    for (var i = 1; i < 4; i++) {
        object.add(buildStars(i));
    }

    deferred.resolve();
})();

