import './chapterii.less';
import {delay, waitForEvent, pageLoad} from '../lib/promise';
import {width, height} from '../lib/env';

import * as Scene from './scene';
import * as Camera from './camera';
import * as Renderer from './renderer';
import * as Light from './light';
import * as Controls from './controls';
import * as Plane from './plane';
import * as Ball from './ball';

var scene, camera, renderer, domElement, light, plane, ball;

export var init = async () => {    
    await Promise.all([
        Scene.ready(),
        Camera.ready(),
        Renderer.ready(),
        Light.ready(),
        Plane.ready(),
        Ball.ready()
    ]);

    scene = Scene.scene;
    camera = Camera.camera;
    renderer = Renderer.renderer;
    domElement = Renderer.domElement;
    light = Light.light;
    plane = Plane.object;

    scene.add(camera);
    scene.add(light);
    scene.add(plane);

    camera.position.set(0, 0, 200);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    light.position.set(-10, 10, 10);
    plane.position.set(-125, -75, 0);
    Controls.init(camera, renderer);

    await pageLoad();
    domElement.setAttribute('chapter', 'two');
    document.body.appendChild(domElement);
    window.addEventListener('resize', resize, false);
    window.scene = scene;
    window.camera = camera;
    window.renderer = renderer;
}


function resize() {
    Renderer.resize();
    Camera.resize();
}

function render() {
    Plane.render();
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