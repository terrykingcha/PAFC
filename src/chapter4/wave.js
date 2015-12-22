import {defer} from '../lib/promise';
import {width, height}from '../lib/env';
import CubicBezier from '../lib/cubicbezier';
import {requestAnimationFrame, cancelAnimationFrame}from '../lib/util';
import {manager, onProgress, onError} from '../prologue';


var deferred = defer();
export var ready = () => deferred.promise;

export var object;

var lines = [];
var lineMaterial = new THREE.LineBasicMaterial({
    color: 0xFFFFFF,
    linewidth: 2
});
var count = 0;
export function render(visualizer) {
    visualizer.analysis();
    var times = visualizer.times;
    times = times.filter(i => !!i);
    var max = Math.max(...times);
    var min = Math.min(...times);
    var offset = max - min;

    var lineList = [...lines];
    for (let line of lineList) {
        line.position.x -= 4;
        if (line.position.x < -100) {
            object.remove(line);
            lines.splice(lines.indexOf(line), 1);
        }
    }

    var lineGeometry = new THREE.Geometry();
    lineGeometry.vertices.push(new THREE.Vector3(0, offset / 4, 0))
    lineGeometry.vertices.push(new THREE.Vector3(0, -offset / 4, 0))

    var line = new THREE.Line(
        lineGeometry,
        lineMaterial.clone()
    );
    line.position.x = 100;
    lines.push(line);
    object.add(line);
}

(async () => {

object = new THREE.Object3D();
deferred.resolve();

})();