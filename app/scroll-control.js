/**
 * Class for scroll control
 * 1. Measure dimension of main and the dimenstion of window
 * 2. Have 2 listeners
 *    - onScroll
 *    - onWheel
 * 3. determineActiveSection
 */
define(() => {
  class ScrollControl {
    constructor($sections) {
      // private
      this._activeSection;

      this.$sections = $sections;
      this.$window = $(window);
      this.$scrollel = $('html, body');

      // config
      this.DATA_ID_SELECTOR = 'section-id';
      this.SCROLL_TIMEOUT = 250;
      this.MOUSEWHEEL_TIMEOUT = 750;
      this.SCROLL_DURATION = 750;
      this.SWITCH_SECTION_TIMEOUT = 1000;
      this.JUMP_SCROLL = false; // whether to complete the current animation immediately
      this.SCROLL_EASING = 'easeInOutCirc';
      this.ACTIVE_CLASS = 'active';

      // measure
      this.dimension = {}; // {width, height, middle}
      this.sections = []; // [id, id, id]
      this.sectionDimension = {}; // {width, height, top, left}

      this.switchingSection = false; // event that switching section

      this.mousewheelDirection = 0;
      this.mousewheelEasing = false;
      this.mousewheelDeltaY = 0;
      this.mousewheelTimeout;

      this.scrollTop = 0;
      this.scrollTimeout; // timeout function to scroll

      this.enabled = true; // enable scroll?
    }

    start() {
      this.measure();
      this.addEventListeners();
      this.determineActiveSection();
    }

    measure() {
      this.sections = [];
      this.sectionDimension = {};

      const width = this.$window.outerWidth();
      const height = this.$window.outerHeight();
      const middle = height / 2;
      this.dimension = {
        width,
        height,
        middle
      };

      this.$sections.each((k, v) => {
        const $el = $(v);
        const id = $el.data(this.DATA_ID_SELECTOR);
        const width = $el.outerWidth(true);
        const height = $el.outerHeight(true);
        const offset = $el.offset();
        const left = offset.left;
        const top = offset.top;

        this.sections.push(id);
        this.sectionDimension[id] = {
          width,
          height,
          top,
          left
        };
      });
    }

    /**
     * this.activeSection -> prev
     * id -> next
     */
    set activeSection(id) {
      if (id && id !== this.activeSection) {
        const $section = this.$sections.filter(`[data-${this.DATA_ID_SELECTOR}="${id}"]`);
        // requestAnimationFrame(() => {
          this.$sections.removeClass(this.ACTIVE_CLASS);
          $section.addClass(this.ACTIVE_CLASS);
        // });

        this._activeSection = id;
      }
    }

    get activeSection() {
      return this._activeSection;
    }

    determineActiveSection() {
      const scrollMiddle = this.scrollTop + this.dimension.middle;
      this.sections.forEach(section => {
        const dimension = this.sectionDimension[section];
        if (scrollMiddle >= dimension.top && scrollMiddle <= dimension.top + dimension.height) {
          this.activeSection = section;
        }
      });
    }

    switchSection(direction) {
      const index = this.sections.indexOf(this.activeSection) + direction;
      if (index >= 0 && index < this.sections.length) {
        this.scrollToSection(this.sections[index]);
      }
    }

    scrollToSection(id) {
      const top = this.sectionDimension[id].top;

      this.switchingSection = true;

      const clearQueue = true;
      this.$scrollel
        .stop(clearQueue, this.JUMP_SCROLL)
        .animate({ scrollTop: top }, {
          duration: this.SCROLL_DURATION,
          easing: this.SCROLL_EASING
        });

      setTimeout(() => {
        this.switchingSection = false;
      }, this.SWITCH_SECTION_TIMEOUT);
    }

    windowOnScroll(e) {
      if (this.enabled) {
        this.scrollTop = this.$window.scrollTop();
        this.determineActiveSection();
        if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
        this.scrollTimeout = setTimeout(() => {
          this.scrollToSection(this.activeSection);
        }, this.SCROLL_TIMEOUT);
      }
    }

    windowOnMousewheel(e) {
      if (this.enabled) {
        const delta = e.originalEvent.deltaY || e.originalEvent.detail;

        let direction = 1;
        if (delta < 0 || (delta === -0 && this.mousewheelDirection < 0)) {
          direction = -1;
        }
        this.mousewheelDirection = direction;

        this.mousewheelEasing = this.mousewheelDirection > 0 ?
          delta < this.mousewheelDeltaY + 1 :
          delta > this.mousewheelDeltaY - 1;
        this.mousewheelDeltaY = delta;

        // scroll again it’ll clear it and remake it.
        // it'll only run if I don’t do any scrolling for the allotted time.
        // it's called debounce. (throttle consist x in y)
        if (this.mousewheelTimeout) clearTimeout(this.mousewheelTimeout);
        this.mousewheelTimeout = setTimeout(() => {
          this.mousewheelEasing = false;
        }, this.MOUSEWHEEL_TIMEOUT);

        if (!this.switchingSection && !this.mousewheelEasing) {
          this.switchSection(this.mousewheelDirection);
        }

        e.preventDefault();
        return false;
      }
    }

    windowOnResize() {
      this.measure();
    }

    addEventListeners() {
      // mostly for determine active section
      this.$window.on('scroll', this.windowOnScroll.bind(this));
      this.$window.on('resize', this.windowOnResize.bind(this));

      const event = 'onwheel' in document.createElement('div') ?
        'wheel' :
        document.onmousewheel !== undefined ? 'mousewheel' : 'DOMMouseScroll';

      this.$window.on(event, this.windowOnMousewheel.bind(this));
    }
  }
  return ScrollControl;
});
