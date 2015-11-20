import {defer} from '../lib/promise';
import {width, height}from '../lib/env';
import CubicBezier from '../lib/cubicbezier';
import {requestAnimationFrame}from '../lib/util';
import {manager, onProgress, onError} from '../prologue';

var {degToRad} = THREE.Math;

var deferred = defer();
export var ready = () => deferred.promise;
export var object;

class BirdGeometry extends THREE.Geometry {
    constructor() {
        super();

        var self = this;

        v(   5,   0,   0 );
        v( - 5, - 2,   1 );
        v( - 5,   0,   0 );
        v( - 5, - 2, - 1 );

        v(   0,   2, - 6 );
        v(   0,   2,   6 );
        v(   2,   0,   0 );
        v( - 3,   0,   0 );

        f3( 0, 2, 1 );
        f3( 4, 7, 6 );
        f3( 5, 6, 7 );

        this.computeFaceNormals();

        function v( x, y, z ) {
            self.vertices.push(new THREE.Vector3( x, y, z ));

        }

        function f3( a, b, c ) {
            self.faces.push(new THREE.Face3( a, b, c ));
        }
    }
};

var birds = [];
const WINDS_MAX_Y = 5;
const WINDS_MIN_Y = -5;
const ANGLE_MIN = 100;
export function render() {
    var array = birds.slice();
    for (let i = 0; i < array.length; i++) {
        let bird = array[i];
        let windsSpeed = bird.wingsSpeed;
        let windsY = bird.geometry.vertices[5].y;
        if (windsY >= WINDS_MAX_Y || windsY <= WINDS_MIN_Y) {
            windsSpeed = bird.wingsSpeed = -windsSpeed;
            windsY = Math.max(windsY, WINDS_MIN_Y);
            windsY = Math.min(windsY, WINDS_MAX_Y);
        }
        bird.geometry.vertices[5].y = 
            bird.geometry.vertices[4].y = windsY + windsSpeed;
        bird.geometry.verticesNeedUpdate = true;

        // bird.angle += bird.angleSpeed;
        // bird.angle = Math.min(bird.angle, ANGLE_MIN);
        bird.position.x += bird.xSpeed;
        // let ySpeed = bird.xSpeed * Math.tan(degToRad(bird.angle));
        bird.position.y += bird.ySpeed;

        bird.ySpeed += 0.001;
        bird.ySpeed = Math.min(bird.ySpeed, 1);

        if (bird.position.x < -300) {
            birds.splice(birds.indexOf(bird), 1);
            object.remove(bird);
        }
    }
}

function addBird() {
    var geometry = new BirdGeometry();
    var material = new THREE.MeshBasicMaterial({
        color: Math.random() * 0xffffff, 
        side: THREE.DoubleSide
    });
    
    var bird = new THREE.Mesh(geometry, material);
    bird.rotation.y = Math.PI;
    bird.scale.set(0.2, 0.2, 0.2);
    birds.push(bird);
    return bird;
}

const BIRDS_AMOUNT = 100;
export function flying() {
    for (let i = 0; i < BIRDS_AMOUNT; i++) {
        let bird = addBird();
        bird.position.x = 50 * Math.random() + 20;
        bird.position.y = (10 * Math.random() + 10);
        bird.position.z = (10 * Math.random() + 20) * Math.sign(Math.random() - 0.5);
        bird.xSpeed = -(Math.random() * 0.5 + 0.5);
        bird.ySpeed = Math.random() * 0.2 + 0.2;
        bird.wingsSpeed = Math.random() * 0.5 + 0.5;

        var color = bird.material.color;
        color.r = color.g = color.b = Math.abs(bird.position.z / 50);

        birds.push(bird);
        object.add(bird);
    }
}

// window.flyingBirds = flyingBirds;

(async () => {
    object = new THREE.Object3D();
    deferred.resolve();
})();