import './index.less';
import {delay, waitForEvent, pageLoad} from '../lib/promise';
import {width, height} from '../lib/env';

import * as Scene from './scene';
import * as Camera from './camera';
import * as Renderer from './renderer';
import * as Light from './light';
import * as Controls from './controls';
import * as Tower from './tower';
import * as Sky from './sky';

var scene, 
    camera, 
    renderer, 
    domElement, 
    light, 
    tower, 
    sky, 
    mouse, 
    raycaster;

export var init = async () => {    
    await Promise.all([
        Scene.ready(),
        Camera.ready(),
        Renderer.ready(),
        Light.ready(),
        Tower.ready(),
        Sky.ready()
    ]);

    scene = Scene.scene;
    camera = Camera.camera;
    renderer = Renderer.renderer;
    domElement = Renderer.domElement;
    light = Light.light;
    tower = Tower.object;
    sky = Sky.object;
    mouse = new THREE.Vector2(-100, -100);
    raycaster = new THREE.Raycaster();

    scene.add(camera);
    scene.add(light);
    scene.add(tower);
    scene.add(sky);

    camera.position.set(0, 0, 20);
    camera.lookAt(scene.position);
    light.position.set(
        sky.geometry.parameters.radius * 0.4, 
        sky.geometry.parameters.radius * 0.4, 
        -sky.geometry.parameters.radius * 0.8
    );
    tower.position.set(0, -4.5, 0)
    sky.position.set(0, 0, 0);

    Controls.init(camera);

    domElement.setAttribute('scene', 'opening');

    window.addEventListener('mousemove', function(e) {
        e.preventDefault();
        if (!starting) return;

        mouse.x = (e.clientX / width()) * 2 - 1;
        mouse.y = - (e.clientY / height()) * 2 + 1;
    }, false);

    window.addEventListener('mousedown', function(e) {
        e.preventDefault();
        if (!starting) return;

        mouse.x = (e.clientX / width()) * 2 - 1;
        mouse.y = - (e.clientY / height()) * 2 + 1;

        var intersects = raycaster.intersectObjects(tower.children);    
        if (intersects.length > 0) {
            entering();
        }
    }, false);

    await pageLoad();
    document.body.appendChild(domElement);

    // window.scene = scene;
    // window.camera = camera;
    // window.renderer = renderer;
}

export function resize() {
    Renderer.resize();
    Camera.resize();
}

function highlightTower() {
    raycaster.setFromCamera(mouse, camera);

    var intersects = raycaster.intersectObjects(tower.children);    
    var color;

    if (intersects.length > 0) {
        color = 0xFFFFFF;
        domElement.style.cursor = 'pointer';
    } else {
        color = 0x000000;
        domElement.style.cursor = 'default';
    }
}

export function render() {
    highlightTower();
    renderer.render(scene, camera);
}

var starting;
export var start = async () => {
    starting = true;
    Controls.rotation();
}

export var isEntering;

var onenteringHandlers = [];
export function onentering(handler) {
    if (onenteringHandlers.indexOf(handler) < 0) {
        onenteringHandlers.push(handler);
    }
}
export var entering = async () => {
    starting = false;
    await Controls.flyIn();
    await hide();
    isEntering = true;
    onenteringHandlers.forEach((h) => h());
}

var onleavingHandlers = [];
export function onleaving(handler) {
    if (onleavingHandlers.indexOf(handler) < 0) {
        onleavingHandlers.push(handler);
    }
}
export var leaving = async () => {
    starting = true;
    await show();
    await Controls.flyOut();
    isEntering = false;
    onleavingHandlers.forEach((h) => h());
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