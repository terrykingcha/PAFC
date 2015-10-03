import {defer, domReady} from '../lib/promise';

export var width = async () => 
    {await domReady(); return window.innerWidth};
export var height = async () => 
    {await domReady(); return window.innerHeight};


