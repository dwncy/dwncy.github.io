define([
  'jquery',
  'app/config',
  'app/render-engine',
  'app/scroll-control',
  'app/audio-visualization',
  'app/distortions/headline-distortion',
  'app/distortions/wrap-distortion',
  'app/helpers/animate-text',
], (
  $,
  config,
  RenderEngine,
  ScrollControl,
  AudioVisualization,
  HeadlineDistortion,
  WrapDistortion,
  AnimateText,
) => {
  class App {
    constructor() {
      this.$window = $(window);
      this.$document = $(document);
      this.$body = $('body');
      this.$main = $('main');
      this.$toggleMute = $('.toggle-mute');

      this.$blankText = $('.blank__text');
      this.$blankExplore = $('.blank__explore');
  
      this.engine = new RenderEngine();
      this.scroll = new ScrollControl(this.$main.find('section[data-section-id]'));

      this.audio = new AudioVisualization();

      this.audio.src = config.audio.src;
      this.audio.peaks = config.audio.peaks;
      this.audio.play();

      this.mute = false;

      this.addEventListeners();

      this.scroll.start();
      this.engine.start();
    }

    audioOnPeak(data) {
      for (const anim of this.engine.animations) {
        anim.audioOnPeak(data.name, data.value);
      }
    }

    initMain() {
      this.engine.animations.push(new HeadlineDistortion($('.intro__content svg')));
      this.engine.animations.push(new WrapDistortion($('.intro__img')));

      $('html, body').scrollTop(0);
      this.$body.addClass('initialized');
    }

    initBlank() {
      setTimeout(() => {
        this.$body.addClass('initialize');
        new AnimateText('.blank__text', {
          time: 800,
          onAnimated: () => {
            this.$blankText.addClass('inactive');
            this.$blankExplore.addClass('active');
          }
        });
      }, 0);
    }

    blankExploreOnClick(e) {
      e.preventDefault();
      this.$body.removeClass('initialize');
      this.audio.stop();
      this.audio.play();
    }

    toggleMuteOnClick() {
      if (!this.mute) {
        this.audio.mute(750);
        this.mute = true;
        this.$toggleMute.addClass('muted');
      } else {
        this.audio.unmute(1000);
        this.mute = false;
        this.$toggleMute.removeClass('muted');
      }
    }

    addEventListeners() {
      this.audio.on('peak', this.audioOnPeak.bind(this));
      this.audio.on('autoplay', this.initMain.bind(this));
      this.audio.on('notautoplay', this.initBlank.bind(this));

      this.$blankExplore.on('click', this.blankExploreOnClick.bind(this));
      this.$toggleMute.on('click', this.toggleMuteOnClick.bind(this));
    }
  }

  $(document).ready(() => new App());
});
