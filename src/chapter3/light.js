import {defer} from '../lib/promise';

const COLOR = 0xFFFFFF;

var deferred = defer();
export var ready = () => deferred.promise;

var rColor = 255;
var rColorStep = -0.003;
var gColor = 255;
var gColorStep = -0.001;
var bColor = 255;
var bColorStep = -0.002;

var rDist = 1000;
var rDistStep = 0.5;
var gDist = 1000;
var gDistStep = 1;
var bDist = 1000;
var bDistStep = 1.5;

export function render(visualizer) {
    rColor += rColorStep * (Math.random() * 0.2 + 0.9);
    rColor = Math.min(rColor, 1);
    rColor = Math.max(rColor, 0.5);
    if (rColor <= 0.5 ||
            rColor >= 1) {
        rColorStep *= -1;
    }

    gColor += gColorStep * (Math.random() * 0.2 + 0.9);
    gColor = Math.min(gColor, 1);
    gColor = Math.max(gColor, 0.5);
    if (gColor <= 0.5 ||
            gColor >= 1) {
        gColorStep *= -1;
    }

    bColor += bColorStep * (Math.random() * 0.2 + 0.9);
    bColor = Math.min(bColor, 1);
    bColor = Math.max(bColor, 0.5);
    if (bColor <= 0.5 ||
            bColor >= 1) {
        bColorStep *= -1;
    }

    rDist += rDistStep * (Math.random() * 0.2 + 0.9);
    rDist = Math.min(rDist, 1000);
    rDist = Math.max(rDist, 800);
    if (rDist <= 800 ||
            rDist >= 1000) {
        rDist *= -1;
    }

    gDist += gDistStep * (Math.random() * 0.2 + 0.9);
    gDist = Math.min(gDist, 1000);
    gDist = Math.max(gDist, 800);
    if (gDist <= 800 ||
            gDist >= 1000) {
        gDist *= -1;
    }

    bDist += bDistStep * (Math.random() * 0.2 + 0.9);
    bDist = Math.min(bDist, 1000);
    bDist = Math.max(bDist, 800);
    if (bDist <= 800 ||
            bDist >= 1000) {
        bDist *= -1;
    }

    lights[0].color.r = rColor;
    // lights[0].intensity = Math.random() * 100;
    lights[0].distance = rDist;


    lights[1].color.g = gColor;
    // lights[1].intensity = Math.random() * 100;
    lights[1].distance = gDist;

    lights[2].color.b = bColor;
    // lights[2].intensity = Math.random() * 100;
    lights[2].distance = bDist;
}


export var lights = [
    new THREE.PointLight(0xFF0000),
    new THREE.PointLight(0x00FF00),
    new THREE.PointLight(0x0000FF)
];

deferred.resolve();
