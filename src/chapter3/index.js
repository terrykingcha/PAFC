import './index.less';
import {delay, waitForEvent, pageLoad} from '../lib/promise';
import {width, height} from '../lib/env';

import * as Scene from './scene';
import * as Camera from './camera';
import * as Renderer from './renderer';
import * as Light from './light';
import * as Controls from './controls';
import * as Cube from './cube';

var scene, camera, renderer, domElement, lights, cube;

export var init = async () => {    
    await Promise.all([
        Scene.ready(),
        Camera.ready(),
        Renderer.ready(),
        Cube.ready(),
        Light.ready()
    ]);

    scene = Scene.scene;
    camera = Camera.camera;
    renderer = Renderer.renderer;
    domElement = Renderer.domElement;
    lights = Light.lights;
    cube = Cube.object;

    scene.add(camera);
    scene.add(lights[0]);
    scene.add(lights[1]);
    scene.add(lights[2]);
    scene.add(cube);

    cube.position.set(        
        -Cube.xSize() / 2, 
        -Cube.ySize() / 2, 
        -Cube.zSize() / 2);
    camera.position.set(10, 10, Cube.zSize() / 2);
    camera.lookAt(camera.position);

    lights[0].position.set(Cube.xSize(), Cube.ySize(), Cube.zSize());
    lights[1].position.set(-Cube.xSize(), -Cube.ySize(), -Cube.zSize());
    lights[2].position.set(0, 0, 0);

    Controls.init(camera, renderer);
    Controls.controls.minDistance = Cube.zSize() / 4;
    Controls.controls.maxDistance = Cube.zSize();

    await pageLoad();
    domElement.setAttribute('chapter', 'three');
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
    Light.render();
    Controls.update();
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