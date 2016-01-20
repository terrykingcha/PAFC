import './index.less';
import {delay, waitForEvent, pageLoad} from '../lib/promise';
import {width, height} from '../lib/env';
import {changeColor} from '../color';

import * as Scene from './scene';
import * as Camera from './camera';
import * as Renderer from './renderer';
import * as Light from './light';
import * as Wave from './wave';
// import * as Star from './star';
import * as Sky from './sky';
import * as Lighthouse from './lighthouse';
import * as Controls from './controls';

var scene, camera, renderer, domElement, light, wave, star, sky, lighthouse, visualizer;

export var init = async () => {    
    await Promise.all([
        Scene.ready(),
        Camera.ready(),
        Renderer.ready(),
        Light.ready(),
        Wave.ready(),
        // Star.ready(),
        Sky.ready(),
        Lighthouse.ready()
    ]);

    scene = Scene.scene;
    camera = Camera.camera;
    renderer = Renderer.renderer;
    domElement = Renderer.domElement;
    light = Light.light;
    wave = Wave.object;
    // star = Star.object;
    sky = Sky.object;
    lighthouse = Lighthouse.object;

    scene.add(camera);
    scene.add(light);
    scene.add(wave);
    // scene.add(star);
    scene.add(sky);
    scene.add(lighthouse);

    light.position.set(1000, 1000, 1000);
    wave.position.set(0, 0, 0);
    // star.position.set(0, 2000, -4000);
    sky.position.set(0, 2000, -4000);
    lighthouse.position.set(-2500, 0, -3000);
    camera.position.set(0, 400, 3000);
    camera.lookAt(new THREE.Vector3(0, 400, 0));
    
    // await Controls.init(camera, renderer);
    await pageLoad();
    
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

export function render() {
    // Controls.render();
    Wave.render();
    Lighthouse.render();
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