import './index.less';
import {delay, waitForEvent, pageLoad} from '../lib/promise';
import {width, height} from '../lib/env';
import {changeColor} from '../color';

import * as Scene from './scene';
import * as Camera from './camera';
import * as Renderer from './renderer';
import * as Light from './light';
import * as Hill from './hill';
import * as Sky from './sky';
import * as Cloud from './cloud';
import * as Bird from './bird';

import * as Controls from './controls';

var scene, camera, renderer, domElement, visualizer,
    light1, light2, light3, light4, hill, sky, cloud, bird;

export var init = async () => {    
    await Promise.all([
        Scene.ready(),
        Camera.ready(),
        Renderer.ready(),
        Light.ready(),
        Hill.ready(),
        Sky.ready(),
        Bird.ready(),
        Cloud.ready()
    ]);

    scene = Scene.scene;
    camera = Camera.camera;
    renderer = Renderer.renderer;
    domElement = Renderer.domElement;
    light1 = Light.light1;
    light2 = Light.light2;
    light3 = Light.light3;
    light4 = Light.light4;
    hill = Hill.object;
    sky = Sky.object;
    bird = Bird.object;
    cloud = Cloud.object;


    scene.add(camera);
    scene.add(light1);
    scene.add(light2);
    scene.add(light3);
    scene.add(light4);
    scene.add(hill);
    scene.add(sky);
    scene.add(bird);
    scene.add(cloud);

    light1.position.set(0, 20, 20);
    light2.position.set(-20, 20, 0);
    light3.position.set(50, 20, 0);
    light4.position.set(0, 0, -50);
    camera.position.set(0, -5, 60);
    camera.rotation.set(THREE.Math.degToRad(18), 0, 0);
    hill.position.set(0, 0, 0);
    sky.position.set(0, 60, -100);
    bird.position.set(0, -30, -30);
    
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

var note = [14, 29, 44, 86];
var note1 = [];
function flyingBirds() {
    var time = visualizer.getTime();
    if (note.length === 0 && time < 1) {
        note = note1.slice();
        note1 = [];
    }
    if (Math.floor(time) >= note[0]) {
        note1.push(note.shift());
        Bird.flying();
    }
}

export function render() {
    Controls.render();
    flyingBirds();
    Bird.render();
    Cloud.render();
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