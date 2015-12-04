import {defer} from '../lib/promise';
import {width, height}from '../lib/env';
import CubicBezier from '../lib/cubicbezier';
import {requestAnimationFrame, cancelAnimationFrame}from '../lib/util';
import {manager, onProgress, onError} from '../prologue';

var deferred = defer();
export var ready = () => deferred.promise;

export var object;

const OCEAN_SURFACE_VERT = `
    varying vec3 v_objColor;

    void main() {
        v_objColor = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const OCEAN_SURFACE_FRAG = `
    uniform vec3 u_color;
    varying vec3 v_objColor;

    float remap (float value, float initStart, float initEnd, float finalStart, float finalEnd) {
        float mapped = (( (value - initStart) *(finalEnd - finalStart) ) / (initEnd- initStart)) + finalStart;
        return mapped;
    }

    void main() {
        vec3 cameraPos = vec3(-338.0, -48.0, 2000.0);
        float border = -100.0;

        float alpha = remap(v_objColor.y + border, 0.0, cameraPos.z * 3.0, 0.0, 1.0);
        float red = remap(v_objColor.z, -500.0, 500.0, 0.2, 0.4);
        float green = remap(v_objColor.z, -500.0, 500.0, 0.2, 0.4);
        float blue = remap(v_objColor.z, -500.0, 500.0, 0.2, 0.4);

        gl_FragColor=vec4(red, green, blue, alpha);
    }
`;

const OCEAN_WIDTH = 3000 * 3;
const OCEAN_HEIGHT = 3000 * 3;
const OCEAN_FRAG = 30 * 3;

// var ocean;
// var oceanMask;

var vertices = [];
var lines = [];

var waveTime = 0;
var waveHeightA = 265;
var waveSpeedA = 7.1;
var waveOffsetA = 1.2834448552536923;
var waveHeightB = 0.01;
var waveSpeedB = 2.96;
var waveOffsetB = 2.3;
function waveA (x, y, t) {
    return Math.sin( ( x / 20 ) * waveOffsetA + ( t / waveSpeedA ) ) * Math.cos( ( y / 20 ) * waveOffsetA + ( t / waveSpeedA ) ) * waveHeightA;
}

function waveB (x, y, t) {
    return Math.sin( ( x / 2 ) * waveOffsetB + ( t / waveSpeedB ) ) * Math.cos( ( y / 2 ) * waveOffsetB + ( t / waveSpeedB ) ) * waveHeightB;
}

function waves(vertices, t) {
    // var geometry = obj.geometry;
    // var vertices = geometry.vertices;

    //big waves
    for (let vertex of vertices) {
        vertex.z = waveA(vertex.x, vertex.y, t);
    }
    
    //small waves
    for (let vertex of vertices) {       
        vertex.z = vertex.z + waveB(vertex.x, vertex.z, t);
    }

    // geometry.verticesNeedUpdate = true;
}

export function render() {
    // return;
    // waves(ocean, waveTime * 0.013);
    // waves(oceanMask, waveTime * 0.013);
    waves(vertices, waveTime * 0.013);

    for (let line of lines) {
        line.geometry.verticesNeedUpdate = true;
    }
    waveTime++;
}

(async () => {
object = new THREE.Object3D();

/*
var oceanUniforms = {
    u_color: {
        type: 'c', 
        value: new THREE.Color(0x383A49)
    }
};
    
var oceanMaterial = new THREE.ShaderMaterial({
    uniforms: oceanUniforms,
    wireframe: true,
    wireframeLinewidth: 0.2,
    side: THREE.DoubleSide,
    vertexShader: OCEAN_SURFACE_VERT,
    fragmentShader: OCEAN_SURFACE_FRAG
});

var oceanPlane = new THREE.PlaneGeometry(OCEAN_WIDTH, OCEAN_HEIGHT, OCEAN_FRAG, OCEAN_FRAG);
oceanPlane.dynamic = true;
oceanPlane.computeFaceNormals();
oceanPlane.computeVertexNormals();

ocean = new THREE.Mesh(oceanPlane, oceanMaterial);
ocean.rotation.x = Math.PI / 2;
object.add(ocean);

oceanMask = new THREE.Mesh(oceanPlane.clone(), new THREE.MeshBasicMaterial({
    color: 0x000000
}));
oceanMask.rotation.x = Math.PI / 2;
oceanMask.position.set(0, 0, -10);
oceanMask.material.wireframe = false;
object.add(oceanMask);
*/
 
var linesPlane = new THREE.Object3D();

var lineMaterial = new THREE.LineBasicMaterial({
    color: 0x666666,
    linewidth: 0.05,
    opacity: 0.3,
    transparent: 0
});

for (let y = 0; y <= OCEAN_FRAG; y++) {
    let yLineGeometry = new THREE.Geometry();
    for (let x = 0; x <= OCEAN_FRAG; x++) {
        let vertex = new THREE.Vector3(
            -OCEAN_WIDTH / 2 + (OCEAN_WIDTH / OCEAN_FRAG) * x,
            -OCEAN_HEIGHT / 2 + (OCEAN_HEIGHT / OCEAN_FRAG) * y,
            0
        );
        yLineGeometry.vertices.push(vertex);
        vertices.push(vertex);
    }
    let yLine = new THREE.Line(yLineGeometry, lineMaterial);
    lines.push(yLine);
    linesPlane.add(yLine);
}

for (let x = 0; x <= OCEAN_FRAG; x++) {
    let xLineGeometry = new THREE.Geometry();
    for (let y = 0; y <= OCEAN_FRAG; y++) {
        xLineGeometry.vertices.push(vertices[x + y * (OCEAN_FRAG + 1)]);
    }
    let xLine = new THREE.Line(xLineGeometry, lineMaterial);
    lines.push(xLine);
    linesPlane.add(xLine);
}

linesPlane.rotation.x = Math.PI / 2;
object.add(linesPlane)

deferred.resolve();
})();