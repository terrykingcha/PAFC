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

const OCEAN_WIDTH = 4000 * 3;
const OCEAN_HEIGHT = 4000 * 3;
const OCEAN_FRAG = 10 * 3;

var ocean;

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

function waves(obj, t) {
    var geometry = obj.geometry;
    var vertices = geometry.vertices;

    //big waves
    for (let vertex of vertices) {
        vertex.z = waveA(vertex.x, vertex.y, t);
    }
    
    //small waves
    for (let vertex of vertices) {       
        vertex.z = vertex.z + waveB(vertex.x, vertex.z, t);
    }

    geometry.verticesNeedUpdate = true;
}

export function render() {
    waves(ocean, waveTime * 0.013);
    waveTime++;
}

(async () => {
object = new THREE.Object3D();


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
    // side: THREE.DoubleSide,
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

deferred.resolve();
})();