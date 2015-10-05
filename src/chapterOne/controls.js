import {defer} from '../lib/promise';
import {width, height} from '../lib/env';

export var camera;

var deferred = defer();
export var end = () => deferred.promise;

var lat = 10;
var latStep = 0.1;
var lon = 90;
var lonStep = 0.3;
var initRaduis;
var raduis;
var raduisStep;
var xOffsetPercent = 0;
var yOffsetPercent = 0;
var requestFrameId;
var zoomIn = false;
function animate() {
    requestFrameId = requestAnimationFrame(animate);

    if (typeof raduis === 'undefined') {
        raduis = initRaduis;
        raduisStep = initRaduis / ((360 + 45) / lonStep);
    }

    if (zoomIn) {
        raduis -= xOffsetPercent * raduisStep;
    }
    raduis = Math.min(raduis, 4);
    raduis = Math.max(raduis, 0);

    if (raduis < 0.75) {
        document.removeEventListener('mousewheel', onMouseWheel);
        document.removeEventListener('mouseenter', onMouseEnter);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseleave', onMouseLeave);
        cancelAnimationFrame(requestFrameId);
        deferred.resolve();
    } else {
        lon += xOffsetPercent * lonStep;
        lat += yOffsetPercent * latStep;
        lat = Math.min(lat, 10);
        lat = Math.max(lat, -10);
        var theta = THREE.Math.degToRad(lon);
        var phi = THREE.Math.degToRad(lat);
        camera.position.x = raduis * Math.cos(theta);
        camera.position.y = raduis * Math.sin(phi);
        camera.position.z = raduis * Math.sin(theta);
        camera.lookAt(new THREE.Vector3(0, 0, 0)); 
    }
    camera.updateProjectionMatrix();
}

function onMouseWheel(e) {
    e.preventDefault();
}

function parseXY(e) {
    var screenX = e.screenX;
    var screenY = e.screenY;
    var halfScreenWidth = width() / 2;
    var halfScreenHeight = height() / 2;
    xOffsetPercent = (screenX - halfScreenWidth) / halfScreenWidth;
    yOffsetPercent = (screenY - halfScreenHeight) / halfScreenHeight;

}

function onMouseEnter(e) {
    zoomIn = true;
    parseXY(e);
}

function onMouseMove(e) {
    parseXY(e);
}

function onMouseLeave(e) {
    parseXY(e);
    zoomIn = false;
}

export function init(_camera) {
    camera = _camera;
    initRaduis = camera.position.z;
    document.addEventListener('mousewheel', onMouseWheel, false);
    document.addEventListener('mouseenter', onMouseEnter, false);
    document.addEventListener('mousemove', onMouseMove, false);
    document.addEventListener('mouseleave', onMouseLeave, false);
    animate();
}