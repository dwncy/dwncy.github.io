/**
 * This file is define how engine works.
 * Always update first, then render.
 */
define(() => {
  class RenderEngine {
    constructor() {
      this.animations = [];
      this.animationFrame;
  
      this.heartbeatInterval;
    }
  
    heartbeat() {
      this.heartbeatInterval = setInterval(() => {
        for (const anim of this.animations) {
          if (anim.update) anim.update();
        }
      }, 1000 / 60); // 60fps
    }

    step() {
      for (const anim of this.animations) {
        if (anim.loaded && anim.changed) {
          if (anim.clear) anim.clear(); // ctx.clearRect
          if (anim.render) anim.render(); // chunks, fragments, waves, dll
          anim.changed = false; // it will set true when anim.update
        }
      }

      this.animationFrame = requestAnimationFrame(this.step.bind(this));
    }
  
    start() {
      this.heartbeat();
      this.animationFrame = requestAnimationFrame(this.step.bind(this));
    }
  }
  
  return RenderEngine;
});
