import {defer} from '../lib/promise';

class MainControls {
    constructor(camera, onend) {
        this.camera = camera;
        this.onend = onend;
        this.active = true;

        document.addEventListener(
            'mousewheel', 
            e => this.onMouseWheel(e), 
            false
        );
    }

    onMouseWheel(e) {
        e.preventDefault();

        if (this.active) {
            var offset = -event.wheelDeltaY * 0.01;
     
            this.camera.fov += offset;
            this.camera.fov = Math.min(this.camera.fov, 45);
            this.camera.fov = Math.max(this.camera.fov, 0.01);  

            if (this.camera.fov === 0.01) {
                this.active = false;
                this.onend && this.onend();
            }

            this.camera.updateProjectionMatrix();
        }
    }
}

var deferred = defer();
export var end = () => deferred.promise;

export function init(camera) {
    var controls = new MainControls(camera, function() {
        deferred.resolve();
    });
    return controls;
}