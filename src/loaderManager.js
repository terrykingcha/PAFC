import {defer} from '../lib/promise';

export var manager = new THREE.LoadingManager();
manager.onProgress = function (item, loaded, total) {
    console.log(item, loaded, total);
};

function onProgress(xhr) {
    if (xhr.lengthComputable) {
        var percentComplete = xhr.loaded / xhr.total * 100;
        console.log(Math.round(percentComplete, 2) + '% downloaded');
    }
};

function onError(xhr) {
}

var mainObjLoaderDeferred = defer();
export var mainObjLoaded = () => mainObjLoaderDeferred.promise;

// THREE.Loader.Handlers.add( /\.dds$/i, new THREE.DDSLoader());
// THREE.Loader.Handlers.add( /\.tga$/i, new THREE.TGALoader());

var mainObjLoader = new THREE.OBJMTLLoader(manager);
mainObjLoader.load(
    'assets/obj/BeautifulGirl/BeautifulGirl.obj',
    'assets/obj/BeautifulGirl/BeautifulGirl.mtl',
    // 'assets/obj/Lara_Croft/Lara_Croft.obj',
    // 'assets/obj/Lara_Croft/Lara_Croft.mtl',
    function (object) {
        mainObjLoaderDeferred.resolve(object);
    }, 
    onProgress, 
    onError
);

var subMaterialLoaderDeferred = defer();
export var subMaterialLoaded = () => subMaterialLoaderDeferred.promise;

var subMaterialLoader = new THREE.TextureLoader(manager);
subMaterialLoader.load(
    'assets/images/disc.png',
    function(texture) {
        subMaterialLoaderDeferred.resolve(texture);
    },
    onProgress, 
    onError
)