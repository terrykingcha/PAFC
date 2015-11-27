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

var particalMaterial = new THREE.SpriteMaterial({
    color: 0xffffff,
    fog: true,
    program: function (context) {
        context.beginPath();
        context.arc(0, 0, 0.5, 0, Math.PI * 2, true);
        context.fill();
    }
});

var lineMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    opacity: 1,
    transparent: true,
    fog: true
});

var planMaterial = new THREE.MeshBasicMaterial({
    color: 0xFFFFFF,
    opacity: 0,
    transparent: true
});

var particleGroup;
var lineGroup;

function addLine() {
    var vertex = new THREE.Vector3(Math.random() * 2 - 1,  Math.random() * 2 - 1,  Math.random() * 2 - 1);
    vertex.normalize();
    vertex.multiplyScalar(450);

    var vertex2 = vertex.clone();
    vertex2.multiplyScalar(Math.random() * 0.3 + 1);

    var geometry = new THREE.Geometry();
    geometry.vertices.push(vertex);
    geometry.vertices.push(vertex2);

    var material = lineMaterial.clone();
    material.opacity = Math.random();

    var line = new THREE.Line(geometry, material);
    line.dropSpeed = Math.random() * 0.002 + 1.002;

    return line;
}

function getRadius(vertex) {
    return Math.sqrt(vertex.x * vertex.x + vertex.y * vertex.y + vertex.z * vertex.z);
}

export function flash() {
    var planeGeometry = new THREE.PlaneGeometry(4000, 2000);
    var plane = new THREE.Mesh(planeGeometry, planMaterial);
    object.add(plane)

    var count = 0;
    var material = plane.material;
    var step = 0.3;
    var opacity = material.opacity + step;
    requestAnimationFrame(function tick() {
        if (count === 2) {
            object.remove(plane);
            return;
        }

        requestAnimationFrame(tick);
        opacity += step;
        if (opacity >= 1 & step > 0) {
            opacity = 1;
            step = -step;
        } else if (opacity <=0 && step < 0) {
            opacity = 0;
            step = -step;
            count++;
        }
        material.opacity = opacity;
    });
}

var isRaining = false;
export function startRain() {
    isRaining = true;
}

export function stopRain() {
    isRaining = false;
}

function dropRain() {
    var array = lineGroup.children.slice();
    for (let line of array) {
        let geometry = line.geometry;
        let material = line.material;

        let vertex1 = geometry.vertices[0];
        let vertex2 = geometry.vertices[1];

        vertex1.multiplyScalar(line.dropSpeed);
        vertex2.multiplyScalar(line.dropSpeed);
        geometry.verticesNeedUpdate = true;

        material.opacity -= (line.dropSpeed - 1);

        if (getRadius(vertex1) > 1000 || material.opacity < 0) {
            lineGroup.remove(line);
        }
    }

    if (isRaining && lineGroup.children.length < LINE_AMOUNT) {
        let count = Math.min(Math.floor(Math.random() * 3), LINE_AMOUNT - lineGroup.children.length);
        for (let i = 0; i < count; i++) {
            let line = addLine();
            lineGroup.add(line);
        }
    }
}

export function render() {
    dropRain();
    particleGroup.rotation.y += 0.0005;
}

const PARTICLE_AMOUNT = 2000;
const LINE_AMOUNT = 500;

(async () => {
object = new THREE.Object3D();

particleGroup = new THREE.Group();
for (let i = 0; i < PARTICLE_AMOUNT; i ++) {
    let material = particalMaterial.clone();
    let particle = new THREE.Sprite(material);
    particle.position.x = Math.random() * 2 - 1;
    particle.position.y = Math.random() * 2 - 1;
    particle.position.z = Math.random() * 2 - 1;
    particle.position.normalize();
    particle.position.multiplyScalar(Math.random() * 10 + 450);
    particle.scale.multiplyScalar(2);
    particleGroup.add(particle);
}
object.add(particleGroup);

lineGroup = new THREE.Group();
object.add(lineGroup);

deferred.resolve();
})();