define(() => {
  class DistortionChunk {
    constructor(x, y, width, height) {
      this.original = { x, y, width, height };
      this.distorted = { x, y, width, height };
      this.alpha = 1;
    }
  }

  class DistortionFragment {
    constructor(x, y, width, height) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
    }
  }

  class DistortionWave {
    constructor (from, to) {
      this.from = from
      this.to = to
      this.direction = Math.random() > .5 ? 1 : -1
    }
  }

  class Distortion {
    constructor() {
      this._$el;
      this._padding = 0;
  
      this.chunks = []; // chunk generated
      this.fragments = []; // for little chunk fragment
      this.translate = [0, 0]; // random translate
      this.layout; // for generate lines
      this.waves = [];
      this.blur;
  
      this.RGBSplit; // rgb
  
      // Core Canvas
      this.canvas = document.createElement('canvas');
      this.context = this.canvas.getContext('2d');
      this.$canvas = $(this.canvas);
      this.$canvas.css({ position: 'absolute' });
  
      // RGB Canvas
      this.split = {};
      this.split.canvas = document.createElement('canvas')
      this.split.context = this.split.canvas.getContext('2d')
  
      // Dimension of element _$el
      this.dimension = {} // {width, height, outerWidth, outerHeight}
  
      this.loaded = false;
      this.changed = false;
      this.frame = 0;
    }
  
    set $el(el) {
      this._$el = el;
      this.measure();
      this.resize();
    }
  
    get $el() {
      return this._$el;
    }
  
    set padding(padding) {
      if (this._padding !== padding) {
        this._padding = padding;
        this.dimension.outerWidth = this.dimension.width + padding * 2;
        this.dimension.outerHeight = this.dimension.height + padding * 2;
        this.renderStyles();
        this.resize();
        this.changed = true;
      }
    }
  
    get padding() {
      return this._padding || 0;
    }
  
    clear() {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.split.context.clearRect(0, 0, this.split.canvas.width, this.split.canvas.height);
    }
  
    renderStyles() {
      $(this.canvas).css({
        'width': `calc(100% + ${this.padding * 2}px)`,
        'height': `calc(100% + ${this.padding * 2}px)`,
        'left': -this.padding,
        'top': -this.padding
      });
    }
  
    update() {
      if (this.frame) this.frame--;
  
      this.chunks = [];
      this.fragments = [];
      this.translate = [0, 0];
      this.RGBSplit = null;
      this.layout = null;
      this.waves = [];
      this.blur = null;    
    }
  
    reset() {
      this.frame = 0;
  
      this.chunks = [];
      this.fragments = [];
      this.translate = [0, 0];
      this.RGBSplit = null;
      this.layout = null;
      this.waves = [];
      this.blur = null;    
    }
  
    /**
     * Create chunks based on img canvas
     * @param {Number} size 
     */
    generateRandomChunks(size) {
      const divideChunk = (x, y, width, height) => {
        if ((width * height) / (this.dimension.width * this.dimension.height) > size ) {
          if (width >= height) {
            const split = Math.random() * width
            divideChunk(x, y, split, height)
            divideChunk(x + split, y, width - split, height)
          } else {
            const split = Math.random() * height
            divideChunk(x, y, width, split)
            divideChunk(x, y + split, width, height - split)
          }
        } else {
          this.chunks.push(new DistortionChunk(x, y, width, height))
        }
      }
      divideChunk(0, 0, this.dimension.width, this.dimension.height)
    }
  
    /**
     * Render canvas each line
     * @param {Number} size - height of line
     */
    generateLines(size) {
      this.layout = [1, Math.floor(this.dimension.height / size)]; // [1, 300]
      const width = this.dimension.width / this.layout[0]; // 150
      const height = this.dimension.height / this.layout[1]; // 1
  
      for (let row = 0; row < this.layout[1]; row++) {
        for (let col = 0; col < this.layout[0]; col++) {
          this.chunks.push(new DistortionChunk(width * col, height * row, width, height));
        }
      }
    }
  
    /**
     * Split height to 2/3/n section
     * @param {Number} size - 0 to 1 how many split heigh
     * ex: this.layout = [1, 150]
     */
    generateWaves(size) {
      const divideRows = (from, to) => {
        const rows = Math.floor(to - from); // 150
        if (rows > this.layout[1] * size) {
          const split = Math.floor(Math.random() * rows);
          divideRows(from, split);
          divideRows(split, to);
        } else {
          this.waves.push(new DistortionWave(from, to));
        }
      };
  
      divideRows(0, this.layout[1]);
    }
  
    /**
     * Don't discover yet
     * @param {*} intensity 
     */
    addWaves(intensity) {
      if (this.waves.length) {
        for (const wave of this.waves) {
          let offset = 0;
          for (let i = wave.from; i < wave.to; i++) {
            offset += Math.PI * 2 / (wave.to - wave.from);
            this.chunks[i].distorted.x += Math.sin(offset) * (intensity * wave.direction);
          }
        }
      }
    }
  
    /**
     * 
     * @param {Number} min 
     * @param {Number} max
     * ex: [0, 7.5] -> range random
     */
    addRandomBlur(min, max) {
      this.blur = Math.random() * (max - min) + min;
    }
  
    /**
     * 
     * @param {Number} probability 
     * @param {Array([x, y])} translate (per px)
     * @param {Array([x, y])} scale (per 1)
     * Mutates the distorted!
     */
    transformChunksRandom(probability, translate, scale) {
      this.chunks.forEach(chunk => {
        if (Math.random() < probability) {
          const width = chunk.distorted.width * scale[0];
          const height = chunk.distorted.height * scale[1];
  
          // 25 -> [-25, 25]
          // x + (1 * 50) - 25;
          // 25
          const x = chunk.distorted.x + (Math.random() * (translate[0] * 2)) - translate[0];
          const y = chunk.distorted.y + (Math.random() * (translate[1] * 2)) - translate[1];
  
          // width = 50
          // distorted width = 40
          // x = 25
          // 25 - (50 - 40) / 2
          // 20
          chunk.distorted.x = x - (width - chunk.distorted.width) / 2;
          chunk.distorted.y = y - (height - chunk.distorted.height) / 2;
          chunk.distorted.width = width;
          chunk.distorted.height = height;
        }
      });
    }
  
    /**
     * 
     * @param {Number} translate - range
     * translate 10
     * [-5, 5]
     */
    addRandomTranslate(translate) {
      this.translate[0] = (Math.random() * translate) - (translate / 2);
      this.translate[1] = (Math.random() * translate) - (translate / 2);
    }
  
    /**
     * 
     * @param {Array<scaleX, scaleY>} size 
     * @param {Number} amount - how many fragment
     */
    addRandomFragment(size, amount = 1) {
      for (let i = 0; i < amount; i++) {
        const width = Math.random() * (this.dimension.width * size[0]) + 1;
        const height = Math.random() * (this.dimension.height * size[1]) + 1;
        this.fragments.push(
          new DistortionFragment(
            Math.random() * (this.dimension.width - width) + this.padding,
            Math.random() * (this.dimension.height - height) + this.padding,
            width,
            height
          )
        );
      }
    }
  
    addRandomRGBSplit(min, max) {
      const random = Math.random() * (max - min) + min
      this.RGBSplit = [random, random / 2];    
    }

    wrapCanvas() {
      const classes = this.$el.attr('class');
      const $div = $('<div />');
      if (classes) $div.addClass(classes);
      this.$el.removeAttr('class').wrap($div);
      this.$el.before(this.canvas);
    }
  
    loadSVG() {
      const img = new Image();
      const svg = new Blob([this.$el[0].outerHTML], {type: 'image/svg+xml'});
      const url = URL.createObjectURL(svg);
      // const src = this.$el.attr('src') || ''
  
      return new Promise((resolve, reject) => {
        img.onload = () => {
          URL.revokeObjectURL(url);
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          this.image = {
            raw: img,
            canvas,
            context
          };
          this.resizeImage();
          this.attachToCanvas();
          this.render();
          this.loaded = true;
          this.changed = true;
          resolve(img);
        }
        img.src = url;
      });
    }
  
    resize() {
      this.canvas.width = this.split.canvas.width = this.dimension.outerWidth;
      this.canvas.height = this.split.canvas.height = this.dimension.outerHeight;
      this.renderStyles();
  
      if (this.image) {
        this.resizeImage();
        if (this.image.raw) this.attachToCanvas();
      }
  
      this.changed = true;
    }
  
    resizeImage() {
      this.image.canvas.width = this.dimension.width ? this.dimension.width : (this.image.raw ? this.image.raw.naturalWidth : 0);
      this.image.canvas.height = this.dimension.height ? this.dimension.height : (this.image.raw ? this.image.raw.naturalHeight: 0);
    }
  
    attachToCanvas() {
      this.image.context.drawImage(
        this.image.raw,
        0,
        0,
        this.dimension.width,
        this.dimension.height
      );
    }
  
    render() {
      if (this.chunks.length) {
        for (const chunk of this.chunks) {
          const o = chunk.original;
          const d = chunk.distorted;
          this.context.globalAlpha = chunk.alpha;
          this.context.drawImage(
            this.image.canvas,
            o.x, // sx
            o.y, // sy
            o.width,
            o.height,
            d.x + this.padding + this.translate[0], // dx
            d.y + this.padding + this.translate[1], // dy
            d.width,
            d.height
          );
        }
      } else {
        this.context.drawImage(
          this.image.canvas,
          this.padding,
          this.padding
        )
      }
  
      if (this.fragments.length) {
        this.context.fillStyle = '#fff';
        this.context.globalCompositeOperation = 'difference';
        for (const fragment of this.fragments) {
          this.context.fillRect(fragment.x , fragment.y, fragment.width, fragment.height);
        }
        this.context.globalCompositeOperation = 'source-over';      
      }
  
      if (this.blur) {
        this.split.context.drawImage(this.canvas, 0, 0);
        this.context.globalAlpha = 0.15;
        this.context.drawImage(this.split.canvas, -this.blur, 0);
        this.context.drawImage(this.split.canvas, this.blur, 0);
        this.context.drawImage(this.split.canvas, -this.blur / 2, 0);
        this.context.drawImage(this.split.canvas, this.blur / 2, 0);
        this.context.globalAlpha = 1;
      }
  
      if (this.RGBSplit) {
        // new shapes are drawn behind the existing canvas content.
        this.context.globalCompositeOperation = 'destination-over';
  
        this.split.context.drawImage(this.canvas, 0, 0);
        // just render based on old canvas filled.
        this.split.context.globalCompositeOperation = 'source-in'
  
        // create pink
        this.split.context.fillStyle = 'rgba(255, 0, 255, 1)'
        this.split.context.fillRect(0, 0, this.dimension.outerWidth, this.dimension.outerHeight)
        this.context.drawImage(this.split.canvas, this.RGBSplit[0], 0);
  
        // create light blue
        this.split.context.fillStyle = 'rgba(0, 255, 255, 1)'
        this.split.context.fillRect(0, 0, this.dimension.outerWidth, this.dimension.outerHeight)
        this.context.drawImage(this.split.canvas, -this.RGBSplit[0], 0);
  
        this.context.drawImage(this.split.canvas, 0, 0);
  
        // reset to source over!!!!
        this.split.context.globalCompositeOperation = 'source-over';
        this.context.globalCompositeOperation = 'source-over';
      }
    }
  
    measure() {
      const width = this.$el.width()
      const height = this.$el.height()
      this.dimension = {
        width,
        height,
        outerWidth: width + (this.padding * 2),
        outerHeight: height + (this.padding * 2)
      };
    }
  }

  return Distortion;
});
