define(() => {
  class AnimateText {
    constructor (el, opts) {
      this.el = this.getElement(el)
      this.opts = this.getOptions(opts)
      this.textArr = this.getInnerText()
      this.init()
    }
  
    getElement (el) {
      if (!el) {
        return console.error('Specify the element')
      }
      if (typeof el === 'string') {
        const node = document.querySelector(el)
        if (!node) {
          return console.error('Cannot find the element', el)
        }
        return node
      }
      return el
    }
  
    getOptions (opts) {
      const baseOpts = {
        time: 500,
        letter: 'char',
        onAnimated () {}
      }
      return Object.assign(baseOpts, opts)
    }
  
    getInnerText () {
      const splitter = this.opts.letter === 'char' ? '' : ' '
      const innerText = this.el.innerText
      return innerText.split(splitter)
    }
  
    init () {
      this.el.innerText = ''
      const textArr = [...this.textArr]
      let currTextArr = []
      this.timer = setInterval(() => {
        const text = textArr.shift()
        if (!text) {
          clearInterval(this.timer)
          return this.onEndAnimate()
        }
        currTextArr.push(text)
        this.el.innerText = currTextArr.join(this.opts.letter === 'char' ? '' : ' ')
      }, this.opts.time / textArr.length)
    }
  
    onEndAnimate () {
      const cb = this.opts.onAnimated
      if (typeof cb !== 'function') {
        return console.warn('Expected onAnimated to be function')
      }
      cb()
    }
  }
  
  return AnimateText;
});
