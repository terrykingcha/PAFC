import {
    defer
}
from '../lib/promise';
import {
    width, height
}
from '../lib/env';
import CubicBezier from '../lib/cubicbezier';
import {
    requestAnimationFrame
}
from '../lib/util';
import {
    manager, onProgress, onError
}
from '../prologue';

var deferred = defer();
export var ready = () => deferred.promise;

export var object;

var prevTime;
export var render = () => {
    if (!prevTime) {
        prevTime = Date.now();
        return;
    }

    var time = Date.now();
    object.updateAnimation(time - prevTime);
    prevTime = time;
}

function morphColorsToFaceColors(geometry) {
    if (geometry.morphColors && geometry.morphColors.length) {
        var colorMap = geometry.morphColors[0];
        for (var i = 0; i < colorMap.colors.length; i++) {
            geometry.faces[i].color = colorMap.colors[i];
        }
    }
}

var loader = new THREE.JSONLoader(manager);
loader.load('assets/obj/box01.js', function(geometry) {
    morphColorsToFaceColors(geometry);

    var material = new THREE.MeshPhongMaterial( { color: 0xffffff, specular: 0xffffff, shininess: 20, morphTargets: true, vertexColors: THREE.FaceColors, shading: THREE.FlatShading } );
    object = new THREE.MorphAnimMesh(geometry, material);
    object.duration = 5000;
    // object.setFrameRange(0, 50);
    // object.matrixAutoUpdate = false;
    // object.updateMatrix();
    deferred.resolve();
}, onProgress, onError);