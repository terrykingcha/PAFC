import './index.less';
import {delay, waitForEvent, pageLoad} from '../lib/promise';
import {width, height} from '../lib/env';
import {changeColor} from '../color';

import * as Scene from './scene';
import * as Camera from './camera';
import * as Renderer from './renderer';
import * as Light from './light';
import * as Tree from './tree';
import * as Grass from './grass';
import * as Leaf from './leaf';
import * as Controls from './controls';

var scene, camera, renderer, domElement, visualizer,
    light1, light2, light3, tree, grass, leaf;

export var init = async () => {    
    await Promise.all([
        Scene.ready(),
        Camera.ready(),
        Renderer.ready(),
        Tree.ready(),
        Grass.ready(),
        Leaf.ready(),
        Light.ready()
    ]);

    scene = Scene.scene;
    camera = Camera.camera;
    renderer = Renderer.renderer;
    domElement = Renderer.domElement;
    tree = Tree.object;
    grass = Grass.object;
    leaf = Leaf.object;
    light1 = Light.light1;
    light2 = Light.light2;
    light3 = Light.light3;

    scene.add(camera);
    scene.add(light1);
    scene.add(light2);
    scene.add(light3);
    scene.add(tree);
    scene.add(grass);
    scene.add(leaf);

    light1.position.set(0, 100, 100);
    light2.position.set(-100, 100, 0);
    light3.position.set(100, 100, 0);
    camera.position.set(0, 0, Grass.Z_SIZE * 0.5);
    grass.position.set(-Grass.X_SIZE / 2, -50, -Grass.Z_SIZE / 2);
    grass.rotation.set(-0.28, 0, 0);
    tree.position.set(0, -35, -20);
    leaf.position.set(-Leaf.X_SIZE / 2, -Leaf.Y_SIZE, -Leaf.Z_SIZE / 2);
    leaf.rotation.set(-0.28, 0, 0);
    
    // await Controls.init(camera, renderer);
    await pageLoad();
    
    domElement.setAttribute('scene', 'chapters');
    document.body.appendChild(domElement);

    window.scene = scene;
    window.camera = camera;
    window.renderer = renderer;
}

export function resize() {
    Renderer.resize();
    Camera.resize();
}

var downNote = [21, 35, 49, 60, 67, 80, 102, 116];
var downNote1 = [];
function blowLeafWind() {
    var time = visualizer.getTime();
    if (downNote.length === 0) {
        downNote = downNote1.slice(0);
        downNote1 = [];
    }
    if (Math.floor(time + 0.5) === downNote[0]) {
        downNote1.push(downNote.shift());
        Leaf.blowWind();
    }
}

export function render() {
    blowLeafWind();
    Leaf.render();
    Grass.render();
    // Controls.render();
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
    changeColor('black');
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

    changeColor('black');
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