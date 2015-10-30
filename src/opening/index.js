import './index.less';
import {delay, waitForEvent, pageLoad} from '../lib/promise';
import {width, height} from '../lib/env';
import * as Clock from '../clock';

import * as Scene from './scene';
import * as Camera from './camera';
import * as Renderer from './renderer';
import * as Light from './light';
import * as Controls from './controls';
import * as Tower from './tower';
import * as Sky from './sky';
import * as Cloud from './cloud';
import * as Star  from './star';

var state,
    scene, 
    camera, 
    renderer, 
    domElement, 
    light1, light2, light3, light4,
    tower, 
    sky, 
    cloud,
    star,
    mouse, 
    raycaster;

export var init = async () => {    
    await Promise.all([
        Scene.ready(),
        Camera.ready(),
        Renderer.ready(),
        Light.ready(),
        Tower.ready(),
        Sky.ready(),
        Cloud.ready(),
        Star.ready(),
        Clock.timeReady()
    ]);

    state = Clock.state();
    scene = Scene.scene;
    camera = Camera.camera;
    renderer = Renderer.renderer;
    domElement = Renderer.domElement;
    light1 = Light.light1;
    light2 = Light.light2;
    light3 = Light.light3;
    light4 = Light.light4;
    tower = Tower.object;
    sky = Sky.object;
    cloud = Cloud.object;
    star = Star.object;
    mouse = new THREE.Vector2(-100, -100);
    raycaster = new THREE.Raycaster();

    scene.add(camera);
    scene.add(light1);
    scene.add(light2);
    scene.add(light3);
    scene.add(light4);
    scene.add(tower);
    scene.add(sky);
    if (state === 'daylight') {
        scene.add(cloud);
    } else if (state === 'night') {
        scene.add(star);
    }

    camera.position.set(0, 0, 20);
    camera.lookAt(scene.position);
    var radius = sky.geometry.parameters.radius;
    light1.position.set(
        0,
        radius, 
        -radius
    );
    light2.position.set(
        0, 
        radius, 
        radius
    );
    light3.position.set(
        radius, 
        radius, 
        0
    );
    light4.position.set(
        -radius, 
        radius, 
        0
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

        var intersects = raycaster.intersectObject(tower.children[2]);    
        var color;

        if (intersects.length > 0) {
            color = 0x282930;
            domElement.style.cursor = 'pointer';
        } else {
            color = 0x000000;
            domElement.style.cursor = 'default';
        }

        tower.children[1].material.emissive.setHex(color);
    }, false);

    window.addEventListener('mousedown', function(e) {
        e.preventDefault();
        if (!starting) return;

        mouse.x = (e.clientX / width()) * 2 - 1;
        mouse.y = - (e.clientY / height()) * 2 + 1;

        var intersects = raycaster.intersectObject(tower.children[2]);    
        if (intersects.length > 0) {
            ontowerclickHandlers.forEach((h) => h());
        }
    }, false);

    await pageLoad();
    document.body.appendChild(domElement);

    window.scene = scene;
    window.camera = camera;
    window.renderer = renderer;
}

export function resize() {
    Renderer.resize();
    Camera.resize();
}

var ontowerclickHandlers = [];
export function ontowerclick(h) {
    if (h && ontowerclickHandlers.indexOf(h) < 0) {
        ontowerclickHandlers.push(h);
    }
}

export function render() {
    if (state === 'daylight') {
        Cloud.render();
    } else if (state === 'night') {
        Star.render();
    }
    raycaster.setFromCamera(mouse, camera);
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