import './index.less';
import {delay, waitForEvent, pageLoad} from '../lib/promise';
import {width, height} from '../lib/env';
import {changeColor} from '../color';

import * as Scene from './scene';
import * as Camera from './camera';
import * as Renderer from './renderer';
import * as Light from './light';
import * as Head from './head';
import * as Wave from './wave';

import * as Controls from './controls';

var scene, camera, renderer, domElement, light, head, wave, visualizer;

export var init = async () => {    
    await Promise.all([
        Scene.ready(),
        Camera.ready(),
        Renderer.ready(),
        Wave.ready(),
        Head.ready(),
        Light.ready()
    ]);

    scene = Scene.scene;
    camera = Camera.camera;
    renderer = Renderer.renderer;
    domElement = Renderer.domElement;
    wave = Wave.object;
    head = Head.object;
    light = Light.light;

    scene.add(camera);
    scene.add(light);
    scene.add(wave);
    scene.add(head);

    light.position.set(50, 100, 100);
    camera.position.set(0, 0, 200);
    wave.position.set(0, -30, 30);
    head.scale.set(10, 10, 10);
    head.position.set(0, -470, -20);

    
    // await Controls.init(camera, renderer);
    await pageLoad();

    // scene.add(new THREE.AxisHelper(100));
    
    domElement.setAttribute('scene', 'chapters');
    document.body.appendChild(domElement);

    // window.scene = scene;
    // window.camera = camera;
    // window.renderer = renderer;
}


export function resize() {
    Renderer.resize();
    Camera.resize();
}

var note = [0, 7,13, 24,29, 40,45, 56,61, 66,72, 80, 85, 96,101, 112,117, 128,141];
var tempNode = [];
function toggleHead() {
    var time = visualizer.getTime();
    if (note.length === 0 && time < 1) {
        note = tempNode.slice(0);
        tempNode = [];
    }
    if (Math.floor(time) >= note[0]) {
        tempNode.push(note.shift());
        Head.toggle();
    }
}

var lastTime = 0;
var waveInterval = 0.1;
function renderWave() {
    var time = visualizer.getTime();
    if (time - lastTime >= 0.1 || time - lastTime < 0) {
        lastTime = time;
        Wave.render(visualizer);
    }
}

export function render() {
    // Controls.render();
    toggleHead();
    renderWave();
    Head.render();
    renderer.render(scene, camera);
}

var starting;
export var start = async () => {
    starting = true;
}

export var isEntering;

var onenteringHandlers = [];
export function onentering(handler) {
    if (onenteringHandlers.indexOf(handler) < 0) {
        onenteringHandlers.push(handler);
    }
}
export var entering = async (_visualizer) => {
    visualizer = _visualizer;
    starting = false;
    await show();
    await visualizer.ready();
    isEntering = true;
    onenteringHandlers.forEach((h) => h());
    visualizer.togglePlayback(true);
    changeColor('white');
}

var onleavingHandlers = [];
export function onleaving(handler) {
    if (onleavingHandlers.indexOf(handler) < 0) {
        onleavingHandlers.push(handler);
    }
}
export var leaving = async () => {
    starting = true;
    await hide();
    isEntering = false;
    onleavingHandlers.forEach((h) => h());
    visualizer.togglePlayback(false);
}

export var show = async () => {
    domElement.style.display = 'block';

    await delay(50);

    domElement.style.transition = 'opacity 0.4s ease-out 0s';
    domElement.style.opacity = 1;

    await Promise.race([
        waitForEvent(domElement, 'transitionend'),
        delay(450)
    ]);

    changeColor('white');
}

export var hide = async () => {
    domElement.style.transition = 'opacity 0.4s ease-in 0s';
    domElement.style.opacity = 0;
    
    await Promise.race([
        waitForEvent(domElement, 'transitionend'),
        delay(450)
    ]);

    domElement.style.display = 'none';
}