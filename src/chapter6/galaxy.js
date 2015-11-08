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

var isSpeedUp = 1;
var speed = 0.001;
var ratio = 0.1;
var xstep = 2;
export function toggleSpeedUp() {
    var bezierFunc = bezier[Math.floor(Math.random() * bezier.length)];

    if (isSpeedUp === 1) {
        isSpeedUp = Math.random() * 2 + 4;
        let originSpeed = speed;
        let targetSpeed = speed * isSpeedUp;
        let originRatio = ratio;
        let targetRatio = ratio * isSpeedUp;
        let originXStep = xstep;
        let targetXStep = xstep * isSpeedUp;
        let i1 = 0;
        function speedUp() {
            if (i1 < 1) {
                requestAnimationFrame(speedUp);
                var i2 = bezierFunc(i1);
                speed = originSpeed + (targetSpeed - originSpeed) * i2;
                ratio = originRatio + (targetRatio - originRatio) * i2;
                xstep = originXStep + (targetXStep - originXStep) * i2;
                i1 += 0.01;
            } else {
                speed = targetSpeed;
                ratio = targetRatio;
                xstep = targetXStep;
            }

        }
        speedUp();
    } else {
        let originSpeed = speed;
        let targetSpeed = speed / isSpeedUp;
        let originRatio = ratio;
        let targetRatio = ratio / isSpeedUp;
        let originXStep = xstep;
        let targetXStep = xstep / isSpeedUp;
        let i1 = 0;
        isSpeedUp = 1;
        function speedDown() {
            if (i1 < 1) {
                requestAnimationFrame(speedDown);
                var i2 = bezierFunc(i1);
                speed = originSpeed + (targetSpeed - originSpeed) * i2;
                ratio = originRatio + (targetRatio - originRatio) * i2;
                xstep = originXStep + (targetXStep - originXStep) * i2;
                i1 += 0.005;
            } else {
                speed = targetSpeed;
                ratio = targetRatio;
                xstep = targetXStep;
            }

        }
        speedDown();
    }
}

var cube
var cubes = [];
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

        cube.position.x = x - i1 * xstep;
        cube.material.opacity = 1 - i2;
        cube.position.y = y + (-3 - y) * i2;
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
        cube.rotation.z += 0.01;

        i1 += step;
    }
    requestAnimationFrame(falling);
}


var galaxy;
var galaxyWrap;
export function render() {
    galaxy.rotation.y -= speed;
    if (Math.random() < ratio) {
        addCube(6 - Math.random() * 10, 4, 2 - Math.random() * 5);
    }
}

(async () => {

var bezierFunc = CubicBezier.ease;
var angleSegment = 720;
var radiusStep = 0.05;
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
        radiusStep = 0.02;
        deep = -(1 - bezierFunc(radius / 2)) * deeps;
    } else {
        deep = Math.random() * 0.1 - 0.05;
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
galaxyWrap.rotation.set(degToRad(5), 0, degToRad(20));

object = new THREE.Object3D();
object.add(galaxyWrap);

deferred.resolve();
})();