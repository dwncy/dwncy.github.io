define(() => {
  class AudioVisualization {
    constructor() {
      this._src;

      this.audio;
      this.context;

      this._volume = 1;
      this.volumeInterval;
  
      this.gain;
      this.peak1;
      this.peak2;
      this.analyser;
  
      this.listener = {};
  
      this.captureInterval;
      this.data;

      this.easing = {
        easeInQuad: function (t, b, c, d) {
          return c * (t /= d) * t + b;
        }
      };
    }
  
    set src(src) {
      if (src !== this._src) {
        this._src = src;
        this.audio = document.createElement('audio');
        this.audio.addEventListener('canplay', () => {
          try {
            if (!this.context) {
              this.context = new AudioContext();
              this.context.resume();
              this.addComponents();
              this.patchComponents();
              this.data = new Float32Array(this.analyser.frequencyBinCount);
            }
          } catch (e) {
            // audio fallback
          }
        });
        this.audio.src = src;
        this.audio.loop = true;
      }
    }
  
    get src() {
      return this._src;
    }

    set volume(volume) {
      this._volume = volume;
      if (this.gain) this.gain.gain.value = volume;
    }

    get volume() {
      return this._volume;
    }
  
    addComponents() {
      this.peak1 = this.context.createBiquadFilter();
      this.peak2 = this.context.createBiquadFilter();
  
      this.peak1.frequency.value = 1000;
      this.peak1.type = 'peaking';
      this.peak1.gain.value = 24;
      this.peak1.Q.value = 3;
  
      this.peak2.frequency.value = 4200;
      this.peak2.type = 'peaking';
      this.peak2.gain.value = 24;
      this.peak2.Q.value = 4.8;
  
      this.gain = this.context.createGain();
      this.gain.gain.value = this.volume && this.volume !== 0 ? this.volume : 1;
  
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.minDecibels = -90;
      this.analyser.mmaxDecibels = -10;
      this.analyser.smoothingTimeConstant = .85;
    }
  
    patchComponents() {
      this.source = this.context.createMediaElementSource(this.audio);
      this.source.connect(this.peak1);
      this.source.connect(this.peak2);
      this.peak1.connect(this.analyser);
      this.peak2.connect(this.analyser);
      this.source.connect(this.gain);
      this.gain.connect(this.context.destination);
    }
  
    play() {
      if (this.audio) {
        const promiseAudio = this.audio.play();
        if (promiseAudio) {
          promiseAudio
            .then(() => this.trigger('autoplay'))
            .catch(() => this.trigger('notautoplay'));
        }
      }
      this.capture();
    }

    stop() {
      clearInterval(this.captureInterval);
    }
  
    capture() {
      this.captureInterval = setInterval(() => {
        if (this.analyser) {
          this.analyser.getFloatFrequencyData(this.data);
          this.analyse();
        }
      }, 1000 / 60);
    }
  
    analyse() {
      if (this.data.length) {
        for (const peak of this.peaks) {
          let total = 0;
          for (let i = peak.range[0]; i < peak.range[1]; i++) {
            total += this.data[i] + 140;
          }
          const average = total / (peak.range[1] - peak.range[0]);
          if (average > peak.threshold) {
            this.trigger('peak', {
              name: peak.name,
              value: average - peak.threshold
            });
          }
        }
      }
    }

    fadeVolume(volume, duration) {
      let interval = 10, time = 0;
      let start = this.volume;
      this.volumeInterval = setInterval(() => {
        if (start > volume) {
          this.volume = start - this.easing.easeInQuad(time, volume, start, duration);
        } else {
          this.volume = this.easing.easeInQuad(time, start, volume, duration);
        }
        if ((time += interval) > duration) clearInterval(this.volumeInterval);
      }, interval);
    }

    mute(duration) {
      if (this.volumeInterval) clearInterval(this.volumeInterval);
      this.fadeVolume(0, duration)
    }

    unmute(duration) {
      if (this.volumeInterval) clearInterval(this.volumeInterval);
      this.fadeVolume(1, duration)
    }
  
    pause() {
      if (this.audio) this.audio.pause();
    }
  
    on(key, fn) {
      if (!this.listener[key]) this.listener[key] = [];
      this.listener[key].push(fn);
    }
  
    trigger(key, data) {
      if (this.listener[key]) {
        for (const fn of this.listener[key]) fn(data);
      }
    }
  }

  return AudioVisualization;
});
