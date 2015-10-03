import './mainScene.less';
import {defer, pageLoad} from '../lib/promise';
import {width, height} from './env';

// renderer
const BG_COLOR = 0x000000;
const BG_ALPHA = 0;

// camera
const VIEW_ANGLE = 45;
const NEAR = 1;
const FAR = 100000;
const CAMERA_X = 0;
const CAMERA_Y = 0;
const CAMERA_Z = 0;

// light
const LIGHT_COLOR = 0xFFFFFF;
const LIGHT_X = 0;
const LIGHT_Y = 0;
const LIGHT_Z = 0;

export var scene;
export var renderer;
export var camera;
export var light;
export var domElement;

var deferred = defer();
export var ready = () => deferred.promise;

export var render = () => {
    renderer.render(scene, camera);
}

export var resize = async () => {
    var w = await width();
    var h = await height();

    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
};

function init(w, h) {
    scene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer({
        alpha: true
    }); //有Canvas，WebGL，SVG三种模式
    renderer.setSize(w, h);
    renderer.setClearColor(BG_COLOR, BG_ALPHA);
    renderer.domElement.setAttribute('id', 'mainScene');
    domElement = renderer.domElement;

    camera = new THREE.PerspectiveCamera(VIEW_ANGLE, w / h, NEAR, FAR); /* 摄像机视角，视口长宽比，近切面，远切面 */
    camera.position.set(CAMERA_X, CAMERA_Y, CAMERA_Z); //放置位置

    light = new THREE.PointLight(LIGHT_COLOR);
    light.position.set(LIGHT_X, LIGHT_Y, LIGHT_Z);

    scene.add(camera);
    scene.add(light);
}

(async () => {
    await pageLoad();
    var w = await width();
    var h = await height();

    init(w, h);
    deferred.resolve();
})();