define(['app/svg-distortion'], (SVGDistortion) => {
  class HeadlineDistortion extends SVGDistortion {
    constructor(svg) {
      super(svg);

      this.padding = 25;
    }
  
    update() {
      super.update();

      if (this.frame > 0 && !(this.frame % 2)) {
        if (this.frame > 24) {
          this.generateRandomChunks(.05);
          this.transformChunksRandom(.25, [25, 10], [1, 1]);
          this.addRandomFragment([.1, .025]);
          Math.random() > .5 ? this.addRandomBlur(0, 7.5) : this.addRandomRGBSplit(0, 7.5);
          this.addRandomTranslate(10);
        } else {
          this.generateLines(1);
          this.generateWaves(.8);
          this.addWaves(this.frame / 2);
          this.addRandomFragment([.05, .005], 2);
          Math.random() > .5 ? this.addRandomBlur(0, 7.5) : this.addRandomRGBSplit(0, 7.5);
          this.addRandomTranslate(2.5);
        }
        this.changed = true;
      } else if (this.frame === 0) {
        this.reset();
      }
      this.changed = true;
    }

    audioOnPeak(name, value) {
      const action = {
        'bass': (value) => {
          this.frame = 35;
        }
      };
      if (action[name]) action[name](value);
    }
  }

  return HeadlineDistortion;
});
