define(['app/svg-distortion'], (SVGDistortion) => {
  class WrapDistortion extends SVGDistortion {
    constructor(svg) {
      super(svg);

      this.padding = 25;
    }
  
    update() {
      super.update();

      if (this.frame > 0 && !(this.frame % 2)) {
        if (this.frame > 30) {
          this.generateLines(2);
          this.generateWaves(.9);
          this.addWaves(this.frame / 3);
          this.transformChunksRandom(.9, [5, 0], [1, 1]);
          this.addRandomTranslate(5);
          this.addRandomBlur(5, 15);
        } else {
          this.generateLines(2);
          this.generateWaves(.9);
          this.addWaves(this.frame / 2);
          this.addRandomBlur(5, 10);
        }
        this.changed = true;
      } else if (this.frame === 0) {
        this.reset();
      }
      this.changed = true;
    }

    audioOnPeak(name, value) {
      const action = {
        'shakes': (value) => {
          this.frame = 35;
        }
      };
      if (action[name]) action[name](value);
    }
  }

  return WrapDistortion;
});
