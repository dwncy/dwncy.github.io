define(['app/helpers/distortion'], (Distortion) => {
  class SVGDistortion extends Distortion {
    constructor(svg) {
      super(svg);

      this.$el = svg;

      this.wrapCanvas();
      this.loadSVG();
    }

    update() {
      super.update();
    }

    resize() {
      super.resize();
    }
  }

  return SVGDistortion;
});
