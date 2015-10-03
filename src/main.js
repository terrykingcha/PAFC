import './main.less';
import {delay, waitForEvent} from '../lib/promise';

class ChapterI {
    constructor () {
        this.bg = require('./bgScene');
        this.scene = require('./mainScene');
        this.obj = require('./mainObj');
        this.controls = require('./mainControls');
    }

    async init() {
        await this.bg.ready();
        await this.scene.ready();
        await this.obj.ready();

        document.body.appendChild(this.bg.domElement);
        document.body.appendChild(this.scene.domElement);

        this.scene.scene.add(this.obj.obj);
        this.scene.camera.position.set(0, 0, 5);
        this.scene.camera.lookAt(new THREE.Vector3(0, 1.5, 0));
        this.scene.light.position.set(-10, 10, 10);

        this.controls.init(this.scene.camera);

        window.scene = this.scene.scene;
        window.camera = this.scene.camera;
        window.renderer = this.scene.renderer;

        window.addEventListener('resize', () => this._resize(), false);

        this.isStarting = true;
    }

    _resize() {
        if (!this.isStarting) return;

        this.bg.resize();
        this.scene.resize();
    }

    _render() {
        if (!this.isStarting) return;
        this.bg.render();
        this.scene.render();
    }

    start() {
        requestAnimationFrame(() => this.start());
        this._render();
    }

    end() {
        return this.controls.end().then(() => this.isStarting = false);
    }

    show() {
        this.scene.domElement.style.opacity = '1';
    }

    hide() {
        var el = this.scene.domElement;
        el.style.transition = 'opacity 0.4s ease-in 0s';
        el.style.opacity = 0;
        return waitForEvent(el, 'transitionend');
    }

    destory() {
        document.body.removeChild(this.scene.domElement);
    }
}

class ChapterII {
    constructor () {
        this.scene = require('./subScene');
        this.obj = require('./subObj');
    }

    async init() {
        await this.scene.ready();
        await this.obj.ready();

        document.body.appendChild(this.scene.domElement);

        this.scene.scene.add(this.obj.obj);
        this.obj.obj.position.set(-140, -90, 0);
        this.scene.camera.position.set(0, 0, 200);
        this.scene.camera.lookAt(new THREE.Vector3(0, 0, 0));
        this.scene.light.position.set(-10, 10, 10);

        window.scene = this.scene.scene;
        window.camera = this.scene.camera;
        window.renderer = this.scene.renderer;

        window.addEventListener('resize', () => this._resize(), false);

        this.isStarting = true;
    }

    _resize() {
        if (!this.isStarting) return;
        this.scene.resize();
    }

    _render() {
        if (!this.isStarting) return;
        this.obj.render();
        this.scene.render();
    }

    start() {
        requestAnimationFrame(() => this.start());
        this._render();
    }

    end() {
        //return this.controls.end().then(() => this.isStarting = false);
    }

    show() {
        var el = this.scene.domElement;
        el.style.transition = 'opacity 0.4s ease-out 0s';
        el.style.opacity = 1;
        return waitForEvent(el, 'transitionend');
    }

    hide() {
        // TODO
    }

    destory() {
        // TODO
    }
}

(async () => {

    var one = new ChapterI();
    await one.init();
    await one.show();
    one.start();
    await one.end();

    var two = new ChapterII();
    await two.init();
    await delay(50);
    await Promise.all([one.hide(), two.show()]);

    one.destory();
    two.start();
})();