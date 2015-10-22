import './index.less';
import {delay, waitForEvent, pageLoad} from '../lib/promise';
import {width, height} from '../lib/env';

import * as Scene from './scene';
import * as Camera from './camera';
import * as Renderer from './renderer';
import * as Light from './light';
import * as Controls from './controls';
import * as Box from './box';
import * as Box2 from './box2';
import * as Box3 from './box3';
import Visualizer from '../visualizer';

var scene, camera, renderer, domElement, light, box, box2, box3, visualizer;

var music = location.search.match(/music=(\d+)/);
if (music) {
    music = music[1];
} else {
    music = '01';
}

export var init = async () => {    
    await Promise.all([
        Scene.ready(),
        Camera.ready(),
        Renderer.ready(),
        Box.ready(),
        Box2.ready(),
        Box3.ready(),
        Light.ready()
    ]);

    scene = Scene.scene;
    camera = Camera.camera;
    renderer = Renderer.renderer;
    domElement = Renderer.domElement;
    light = Light.light;
    box = Box.object;
    box2 = Box2.object;
    box3 = Box3.object;
    // visualizer = new Visualizer();
    // visualizer.load(`./assets/sounds/${music}.mp3`);

    scene.add(camera);
    scene.add(light);
    // scene.add(box);
    // scene.add(box2);
    scene.add(box3);


    // box.position.set(Box.xSize() / -2, Box.ySize() / -2, 0);
    // camera.left = Box.xSize() / -2;
    // camera.right = Box.xSize() / 2;
    // camera.top = Box.ySize() / 2;
    // camera.bottom = Box.ySize() / -2;
    // camera.position.set(100, 0, Box.xSize() / 2);
    camera.position.set(100, 0, 500);

    light.position.set(0, 0, 100);
    Controls.init(camera, renderer);

    await pageLoad();
    domElement.setAttribute('chapter', 'two');
    document.body.appendChild(domElement);
    window.addEventListener('resize', resize, false);
    window.scene = scene;
    window.camera = camera;
    window.renderer = renderer;
}


export function resize() {
    Renderer.resize();
    Camera.resize();
}

export function render() {
    // visualizer.analysis();
    // Box.render(visualizer);
    Box3.render();
    Camera.render();
    renderer.render(scene, camera);
}

var requestFrameId;
export var start = () => {
    requestFrameId = requestAnimationFrame(start);
    render();
}

export var end = () => {
    return Controls.end().then(function() {
        requestFrameId && cancelAnimationFrame(requestFrameId);
        window.removeEventListener('resize', resize);
    });
}

export var show = () => {
    domElement.style.transition = 'opacity 0.4s ease-out 0s';
    domElement.style.opacity = 1;
    return waitForEvent(domElement, 'transitionend');
}

export var hide = () => {
    domElement.style.transition = 'opacity 0.4s ease-in 0s';
    domElement.style.opacity = 0;
    return waitForEvent(domElement, 'transitionend');
}

export var destory = () => {
    document.body.removeChild(domElement);
}