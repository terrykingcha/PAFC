import {defer} from '../lib/promise';
import {width, height} from '../lib/env';
import {manager, onProgress, onError} from '../prologue';
import * as Clock from '../clock';

var deferred = defer();
export var ready = () => deferred.promise;
export var object;

var materialPromise = new Promise(function(resolve, reject) {
    var loader = new THREE.TextureLoader(manager);
    loader.load(
        `assets/images/night1.jpg`,
        function(texture) {
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            var material = new THREE.MeshBasicMaterial({
                map: texture,
                side: THREE.BackSide
            });
            resolve(material);
        },
        onProgress, 
        onError
    );  
});


function buildStars(i) {
    var material = new THREE.PointsMaterial({  // 星星
        size: 0.1 * Math.random()  + 0.1,
        opacity: 1,
        vertexColors: THREE.VertexColors,
        side: THREE.DoubleSide
    });

    var total = 2000;
    var vertices = new Float32Array(3 * total); 
    var colors = new Float32Array(3 * total);
    var radius = 50 - i / 10;
    while (total-- > 0) {
        let theta = Math.PI * 2 * Math.random();
        let lamda = Math.PI * 2 * Math.random();
        vertices[total * 3] = radius * Math.cos(lamda) * Math.cos(theta);
        vertices[total * 3 + 1] = radius * Math.cos(lamda) * Math.sin(theta);
        vertices[total * 3 + 2] = radius * Math.sin(lamda);
        colors[total * 3 + 2] = colors[total * 3 + 1] = colors[total * 3] = Math.random();
    }

    var geometry = new THREE.BufferGeometry;
    geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeBoundingSphere();

    return new THREE.Points(geometry, material);

}

var rotationY = 0.0001;
export function render() {
    object.children.forEach(function(obj, i) {
        var sign = i % 2 === 0 ? 1 : -1;
        obj.rotation.y += rotationY * i * sign;
    });
}


(async () => {
    object = new THREE.Object3D();

    var material = await materialPromise;
    var geometry = new THREE.SphereGeometry(
        50, 64, 64
    );
    var mesh = new THREE.Mesh(geometry, material);
    object.add(mesh);

    for (var i = 1; i < 4; i++) {
        object.add(buildStars(i));
    }

    deferred.resolve();
})();

