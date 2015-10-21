function parse(argsLength, isGeterSeter, dom, ...args) {
    if (!isGeterSeter && args.length === argsLength - 1 || 
            isGeterSeter && !(dom instanceof HTMLElement) ||
            argsLength === 0) {
        args.unshift(dom);
        dom = this === window ? document : this;
    }

    return [dom, ...args];
}

export function find() {
    var [dom, selector] = this::parse(1, false, ...arguments);
    return dom.querySelector(selector);
}

export function findAll() {
    var [dom, selector] = this::parse(1, false, ...arguments);
    return dom.querySelectorAll(selector);
}

export function text() {
    var [dom, content] = this::parse(1, true, ...arguments);
    if (typeof content === 'undefined') {
        return dom.textContent;
    } else {
        dom.textContent = content;
        return dom;
    }
}

export function show() {
    var [dom] = this::parse(0, false, ...arguments);
    dom.style.display = dom._originStyleDisplay || 'block';
    return dom;
}

export function hide() {
    var [dom] = this::parse(0, false, ...arguments);
    dom._originStyleDisplay = dom.style.display;
    dom.style.display = 'none';
    return dom;
}

export function matches() {
    var [dom, selector, parent: document] = this::parse(1, false, ...arguments);
    var m;
    if (parent === document) {
        m = dom.matches || 
                dom.webkitMatchesSelector || 
                dom.mozMatchesSelector || 
                dom.msMatchesSelector;
    }
    if (!m || parent !== document) {
        m = function (s) {
            return [...parent.querySelectorAll(s)].indexOf(this) !== -1;
        }
    }

    return dom::m(selector);
}

export function on() {
    var [dom, event, handler] = this::parse(2, false, ...arguments);
    dom.addEventListener(event, handler, false);
    return dom;
}