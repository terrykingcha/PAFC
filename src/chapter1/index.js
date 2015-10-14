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

var scene, camera, renderer, domElement, 
    plight, dlight, alight, tower, 
    sky;
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
    plight = Light.pointLight;
    dlight = Light.directionallight;
    alight = Light.ambientlight;
    tower = Tower.object;
    sky = Sky.object;

    scene.add(camera);
    scene.add(plight);
    scene.add(tower);
    scene.add(sky);

    camera.position.set(0, 0, 4);
    camera.lookAt(scene.position);
    plight.position.set(
        sky.geometry.parameters.radius * 0.4, 
        sky.geometry.parameters.radius * 0.4, 
        -sky.geometry.parameters.radius * 0.8
    );
    tower.position.set(0, -1.2, 0);
    sky.position.set(0, 0, 0);
    Controls.init(camera);

    var SkyDynamic = require('./skyDynamic');
    SkyDynamic.ready().then(function(obj) {
        scene.add(obj);
        obj.position.set(0, 0, 0);
        obj.scale.set(0.95, 0.95, 0.95);
    });

    await pageLoad();
    domElement.setAttribute('chapter', 'one');
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