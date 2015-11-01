import './index.less';
import {delay, waitForEvent, pageLoad} from '../lib/promise';
import {width, height} from '../lib/env';

import * as Scene from './scene';
import * as Camera from './camera';
import * as Renderer from './renderer';
import * as Light from './light';
import * as Circle from './circle';
// import * as Tree from './tree';
import * as Controls from './controls';

var scene, camera, renderer, domElement, light, circle, tree, visualizer;

export var init = async () => {    
    await Promise.all([
        Scene.ready(),
        Camera.ready(),
        Renderer.ready(),
        Circle.ready(),
        // Tree.ready(),
        Light.ready()
    ]);

    scene = Scene.scene;
    camera = Camera.camera;
    renderer = Renderer.renderer;
    domElement = Renderer.domElement;
    circle = Circle.object;
    // tree = Tree.object;
    light = Light.light;

    scene.add(camera);
    scene.add(light);
    scene.add(circle);
    // scene.add(tree);

    light.position.set(0, 0, 100);
    camera.position.set(0, 0, 100);
    // tree.position.set(0, -20, 0);
    
    await Controls.init(camera, renderer);
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

export function render() {
    Circle.render();
    Camera.render();
    Controls.render();
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