import * as Clock from './clock.js';

var timeColorType;
export function changeColor(type) {
    document.body
        ::$removeClass('white black')
        ::$addClass(type || timeColorType);
}

(async () => {
    await Clock.timeReady();

    var state = Clock.state();
    timeColorType = state === 'daylight' ? 'black' : 'white';
    changeColor(timeColorType);
})();

