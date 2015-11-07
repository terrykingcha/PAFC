import {defer} from '../lib/promise';
import {width, height}from '../lib/env';
import CubicBezier from '../lib/cubicbezier';
import {requestAnimationFrame, cancelAnimationFrame}from '../lib/util';
import {manager, onProgress, onError} from '../prologue';

var {degToRad} = THREE.Math;

var bezier = [
    CubicBezier.linear, 
    CubicBezier.ease,
    CubicBezier.easeIn,
    CubicBezier.easeOut,
    CubicBezier.easeInOut
];

var deferred = defer();
export var ready = () => deferred.promise;

export var object;

var cubeGeometry = new THREE.BoxGeometry(0.05, 0.05, 0.05);
var cubeMaterial = new THREE.MeshPhongMaterial({
    color: 0xFFFFFF,
    transparent: true
});

var cube
var cubes = [];
var easeIn = CubicBezier.easeIn;
function addCube(x, y, z) {
    var cube;
    var available = cubes.filter((c) => !!c.available);
    if (available.length > 0) {
        cube = available[0];
    } else {
        cube = new THREE.Mesh(cubeGeometry.clone(), cubeMaterial.clone());
        cubes.push(cube);
    }
    cube.available = false;
    cube.position.set(x, y, z);
    cube.scale.x = cube.scale.y = cube.scale.z = 2 - Math.random();
    cube.material.emissive.setHSL(Math.random(), Math.random(), Math.random());
    object.add(cube);

    var i1 = 0;
    var step = (1 + Math.random()) * 0.005;
    var bezierFunc = bezier[Math.floor(Math.random() * bezier.length)];
    function falling() {
        if (i1 < 1) {
            requestAnimationFrame(falling);
        } else {
            cube.available = true;
            object.remove(cube);
            return;
        }

        var i2 = bezierFunc(i1);

        cube.position.x = x + i1 * 2;
        cube.material.opacity = 1 - i2;
        cube.position.y = y + (-3 - y) * i2;
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
        cube.rotation.z += 0.01;

        i1 += step;
    }
    requestAnimationFrame(falling);
}

var visualizer;
var isBeating = false;
var beatingId;
var step = 360;
export function beat() {
    if (isBeating) return;
    isBeating = true;

    if (beatingId) {
        cancelAnimationFrame(beatingId);
    }

    var position = galaxy.geometry.attributes.position;
    var index = Math.floor(Math.random() * 10 + 20);

    function beating() {
        if (!isBeating) return;
        beatingId = requestAnimationFrame(beating);
        var count = visualizer.times.length / 4;
        for (let i = 0; i < count; i++) {
            let percent = visualizer.times[i * 4] / 512;
            percent *= (count - Math.abs(i - count / 2)) / count;
            for (let j = 0; j < step; j++) {
                position.setY((index + i) * step + j, percent);            
            }
        }
        position.needsUpdate = true;
    }

    beatingId = requestAnimationFrame(function() {
        isBeating = true;
        beating();
    });
}

var galaxy;
var galaxyWrap;
export function render(_visualizer) {
    galaxy.rotation.y -= 0.001;
    visualizer = _visualizer;

    // if (Math.random() < 0.01) {
    beat();
    // }

    if (Math.random() < 0.1) {
        addCube(4 - Math.random() * 10, 4, 2 - Math.random() * 5);
    }
}

(async () => {

var bezierFunc = CubicBezier.ease;
var angleSegment = 360;
var radiusStep = 0.1;
var radius = 10;
var deeps = 5;
var total = angleSegment * (radius / radiusStep);
var vertices = new Float32Array(3 * total); 
var colors = new Float32Array(3 * total);
for (let i = 0, theta = 0, deep; i < total; i++) {
    if (theta == angleSegment) {
        theta = 0;
        radius -= radiusStep;
    }
    if (radius <= 2) {
        radiusStep = 0.05;
        deep = -(1 - bezierFunc(radius / 2)) * deeps;
    } else {
        deep = -Math.random() * 0.01;
    }
    var rad = degToRad(theta / (angleSegment / 360));
    vertices[i * 3] = (radius + (Math.random() / 2 - 0.25) * radiusStep) * Math.cos(rad + Math.random() * 0.01);
    vertices[i * 3 + 1] = deep;
    vertices[i * 3 + 2] = (radius + (Math.random() / 2 - 0.25) * radiusStep) * Math.sin(rad + Math.random() * 0.01);
    colors[i * 3 + 2] = colors[i * 3 + 1] = colors[i * 3] = Math.random();
    theta++;
}

var geometry = new THREE.BufferGeometry;
geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));
geometry.computeBoundingSphere();

var material = new THREE.PointsMaterial({  // 星星
    size: 0.01,
    fog: true,
    opacity: 1,
    vertexColors: THREE.VertexColors
});

galaxy = new THREE.Points(geometry, material);
galaxyWrap = new THREE.Object3D();
galaxyWrap.add(galaxy);
galaxyWrap.rotation.set(degToRad(5), 0, degToRad(25));

object = new THREE.Object3D();
object.add(galaxyWrap);

deferred.resolve();
})();