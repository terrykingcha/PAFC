import {defer} from './lib/promise';

var audioContext = new(window.AudioContext || window.webkitAudioContext)();

audioContext.createGain = audioContext.createGain || 
                            audioContext.createGainNode;
audioContext.createDelay = audioContext.createDelay ||
                            audioContext.createDelayNode;
audioContext.createScriptProcessor = audioContext.createScriptProcessor || 
                            audioContext.createJavaScriptNode;

class BufferLoader {
    constructor(audioContext, urlList, callback) {
        this.audioContext = audioContext;
        this.urlList = urlList;
        this.onload = callback;
        this.bufferList = new Array();
        this.loadCount = 0; 
    }

    loadBuffer(url, index) {
        // Load buffer asynchronously
        var request = new XMLHttpRequest();
        request.open("GET", url, true);
        request.responseType = "arraybuffer";

        var loader = this;

        request.onload = function() {
            // Asynchronously decode the audio file data in request.response
            loader.audioContext.decodeAudioData(
                request.response,
                function(buffer) {
                    if (!buffer) {
                        alert('error decoding file data: ' + url);
                        return;
                    }
                    loader.bufferList[index] = buffer;
                    if (++loader.loadCount == loader.urlList.length)
                        loader.onload(loader.bufferList);
                },
                function(error) {
                    console.error('decodeAudioData error', error);
                }
            );
        }

        request.onerror = function() {
            alert('BufferLoader: XHR error');
        }

        request.send();
    }

    load() {
        for (var i = 0; i < this.urlList.length; ++i)
            this.loadBuffer(this.urlList[i], i);
    }
}

// Interesting parameters to tweak!
const SMOOTHING = 0.8;
const FFT_SIZE = 64; // 快速傅里叶变换

export default class Visualizer {
    constructor(loadManager) {
        var that = this;
        this.analyser = audioContext.createAnalyser();

        this.analyser.connect(audioContext.destination);
        this.analyser.minDecibels = -140;
        this.analyser.maxDecibels = 0;

        this.freqs = new Uint8Array(this.analyser.frequencyBinCount);
        this.times = new Uint8Array(this.analyser.frequencyBinCount);

        this.isPlaying = false;
        this.startTime = 0;
        this.startOffset = 0;

        this.deferred = defer();
        this.loadManager = loadManager;
    }

    ready () {
        return this.deferred.promise;
    }

    load(path) {
        var that = this;
        var soundMap = {
            buffer: path
        };
        var names = [];
        var paths = [];
        for (var name in soundMap) {
            var path = soundMap[name];
            names.push(name);
            paths.push(path);
        }

        that.loadManager.itemStart(path);
        var bufferLoader = new BufferLoader(
            audioContext, paths, function(bufferList) {
            for (var i = 0; i < bufferList.length; i++) {
                var buffer = bufferList[i];
                var name = names[i];
                that[name] = buffer;
            }
            that.loadManager.itemEnd(path);
            that.deferred.resolve();
        });
        bufferLoader.load();
    }

    togglePlayback(play) {
        if (!play && this.isPlaying) {
            // Stop playback
            this.source[this.source.stop ? 'stop' : 'noteOff'](0);
            this.startOffset += audioContext.currentTime - this.startTime;
            console.debug('paused at', this.startOffset);
            // Save the position of the play head.
        } else if (play && !this.isPlaying) {
            this.startTime = audioContext.currentTime;
            console.debug('started at', this.startOffset);
            this.source = audioContext.createBufferSource();
            // Connect graph
            this.source.connect(this.analyser);
            this.source.buffer = this.buffer;
            this.source.loop = true;
            // Start playback, but make sure we stay in bound of the buffer.
            this.source[this.source.start ? 'start' : 'noteOn'](0, this.startOffset % this.buffer.duration);
        }

        this.isPlaying = play;
    }

    analysis() {
        this.analyser.smoothingTimeConstant = SMOOTHING;
        this.analyser.fftSize = FFT_SIZE;

        // Get the frequency data from the currently playing music
        this.analyser.getByteFrequencyData(this.freqs); // 频率数据
        this.analyser.getByteTimeDomainData(this.times); // 波形数据
    }

    getFrequencyValue(freq) {
        var nyquist = audioContext.sampleRate / 2;
        var index = Math.round(freq / nyquist * this.freqs.length);
        return this.freqs[index];
    }

    getTimeValue(time) {
        var nyquist = audioContext.sampleRate / 2;
        var index = Math.round(time / nyquist * this.times.length);
        return this.times[index];
    }
}