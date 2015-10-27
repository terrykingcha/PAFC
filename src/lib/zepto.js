import 'zepto/zepto.min.js';

const Zepto = window.Zepto;
const originFn = Zepto.fn;

function isUndef() {
    return typeof this === 'undefined';
}

function isNull() {
    return typeof this == null;
}

export var fn = {};

for (let name in originFn) {
    let value = originFn[value];
    fn[name] = window[`$${name}`] = function() {
        if (this::isUndef()) {
            throw new Error(`Uncaught TypeError: Cannot read property '${name}' of undefined`);
        } else if (this::isNull()) {
            throw new Error(`Uncaught TypeError: Cannot read property '${name}' of null`);
        }
        var r = Zepto(this)[name](...arguments);
        if (r.__proto__ === originFn) {
            return r[0];
        } else {
            return r;
        }
    }
}

fn.findAll = window.$findAll = function() {
    if (this::isUndef()) {
        throw new Error(`Uncaught TypeError: Cannot read property 'findAll' of undefined`);
    } else if (this::isNull()) {
        throw new Error(`Uncaught TypeError: Cannot read property 'findAll' of null`);
    }
    return Array.from(Zepto(this).find(...arguments));
}