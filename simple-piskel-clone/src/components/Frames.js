import Preview from './Preview';

export default class Frames {
  constructor() {
    this.DIMENSION = 1280;
    this.framesBlock = document.getElementById('frames-block');
    this.framesList = document.querySelector('.frames-list');
    this.framesUnits = () => document.querySelectorAll('.frames-list li');
    this.lastFrame = () => document.querySelector('.frames-list li:last-child canvas');
  }

  controller() {
    this.frameHover();
    this.frameDragDrop();
    this.countFrames();
    Preview.setSlides();

    const framesObj = this;
    const frameEvents = {
      addFrame() {
        framesObj.addNewFrame();
      },
      frameDelete(e) {
        framesObj.frameDelete(e);
      },
      frameDuplicate(e) {
        Frames.frameDuplicate(e);
      },
    };

    this.framesBlock.addEventListener('click', (e) => {
      if (e.target.closest('[data-frame-action]')) {
        const actionElem = e.target.closest('[data-frame-action]');
        const action = actionElem.dataset.frameAction;
        frameEvents[action](e);

        this.countFrames();
        Preview.setSlides();
      }

      if (e.target.closest('.frame-wrap') && !e.target.closest('[data-frame-action]')) {
        const activeFrame = e.target.closest('.frame-wrap');
        const frameCanvas = activeFrame.querySelector('canvas');
        Frames.putFrameData(frameCanvas);
        this.activeFrame(activeFrame);
      }
    });
  }

  static putFrameData(frameCanvas) {
    const ctxFrame = frameCanvas.getContext('2d');
    const frameData = ctxFrame.getImageData(0, 0, frameCanvas.width, frameCanvas.height);

    const canvasDraw = document.getElementById('canvas');
    const ctxCanvas = canvasDraw.getContext('2d');
    ctxCanvas.putImageData(frameData, 0, 0);
  }

  getFrameCanvas() {
    return this.currentFrame.querySelector('.frame-unit');
  }

  addNewFrame() {
    this.activeFrame();

    this.framesList.insertAdjacentHTML('beforeend',
      `<li class="frame-wrap active-frame">
        <p class="frame-num"></p>
        <canvas class="frame-unit" width="${this.DIMENSION}" height="${this.DIMENSION}"></canvas>
        <div class="frame-tools" hidden>
          <button class="frame-duplicate" data-frame-action="frameDuplicate"><i class="fas fa-clone"></i></button>
          <button class="frame-delete" data-frame-action="frameDelete"><i class="fas fa-trash-alt"></i></button>
          <button class="frame-move"><i class="fas fa-arrows-alt-v"></i></button>
        </div>
      </li>`);
    this.currentFrame = document.querySelector('.active-frame');
  }

  activeFrame(frame) {
    const prevActiveFrame = document.querySelector('.active-frame');
    if (prevActiveFrame) prevActiveFrame.classList.remove('active-frame');

    if (frame) {
      frame.classList.add('active-frame');
      this.currentFrame = frame;
    }
  }

  frameDelete(e) {
    const targetFrame = e.target.closest('li');

    let nextFrame = targetFrame.previousElementSibling;
    if (!nextFrame) nextFrame = targetFrame.nextElementSibling;

    const nextCanvas = nextFrame.querySelector('canvas');
    Frames.putFrameData(nextCanvas);
    this.activeFrame(nextFrame);

    targetFrame.remove();
  }

  static frameDuplicate(e) {
    const targetFrameLi = e.target.closest('li');
    const targetCanvas = targetFrameLi.querySelector('canvas');
    const targetCanvasCtx = targetCanvas.getContext('2d');

    const targetCanvasData = targetCanvasCtx
      .getImageData(0, 0, targetCanvas.width, targetCanvas.height);

    const cloneFrameLi = targetFrameLi.cloneNode(true);
    const cloneCanvas = cloneFrameLi.querySelector('canvas');
    const cloneCanvasCtx = cloneCanvas.getContext('2d');
    cloneCanvasCtx.putImageData(targetCanvasData, 0, 0);

    cloneFrameLi.classList.remove('active-frame');
    targetFrameLi.after(cloneFrameLi);
  }

  countFrames() {
    const frames = this.framesUnits();
    Frames.chekFrameTools(frames);

    let counter = 1;
    for (let i = 0; i < frames.length; i += 1) {
      const frameNumber = frames[i].querySelector('.frame-num');
      frameNumber.innerHTML = `${counter}`;
      counter += 1;
    }
  }

  static chekFrameTools(frames) {
    const delToolFirstFrame = document.querySelector('.frame-delete');
    const moveToolFirstFrame = document.querySelector('.frame-move');

    if (frames.length === 1) {
      delToolFirstFrame.hidden = true;
      moveToolFirstFrame.hidden = true;
    } else {
      delToolFirstFrame.hidden = false;
      moveToolFirstFrame.hidden = false;
    }
  }

  frameHover() {
    let frameTools;
    let targetLi;

    this.framesList.addEventListener('mouseover', (e) => {
      if (e.target.closest('li')) {
        targetLi = e.target.closest('li');
        frameTools = targetLi.querySelector('.frame-tools');
        frameTools.hidden = false;

        if (targetLi !== this.currentFrame) targetLi.classList.add('frame-hover');
      }
    });

    this.framesList.addEventListener('mouseout', () => {
      if (targetLi) {
        frameTools.hidden = true;
        targetLi.classList.remove('frame-hover');
      }
    });
  }

  frameDragDrop() {
    const allFrames = this.framesList;
    let targetFrameLi = null;
    const frameParam = {};

    const framesLayout = () => {
      const frames = this.framesUnits();
      for (let i = 0; i < frames.length; i += 1) {
        frames[i].style.zIndex = '11';
      }
    };

    const chekElement = (evt) => {
      const dropElemProxy = frameParam.proxy;

      frameParam.previousSibling = dropElemProxy.previousElementSibling;
      frameParam.nextSibling = dropElemProxy.nextElementSibling;

      targetFrameLi.style.zIndex = '-1';
      const elem = document.elementFromPoint(evt.clientX, evt.clientY);
      const replaceFrame = elem.closest('li');

      if (frameParam.nextSibling && replaceFrame === frameParam.nextSibling) {
        replaceFrame.after(dropElemProxy);
      }

      if (frameParam.previousSibling && replaceFrame === frameParam.previousSibling) {
        replaceFrame.before(dropElemProxy);
      }
      targetFrameLi.style.zIndex = '99';
    };

    const startMove = () => {
      framesLayout();
      const dropElemProxy = document.createElement('li');
      dropElemProxy.className = 'drop-elem-proxy frame-wrap';

      targetFrameLi.style.zIndex = '99';
      targetFrameLi.style.top = `${frameParam.startTop}px`;
      targetFrameLi.style.left = `${frameParam.startLeft}px`;
      targetFrameLi.style.position = 'absolute';
      targetFrameLi.after(dropElemProxy);
      document.body.appendChild(targetFrameLi);
      return dropElemProxy;
    };

    const frameMove = (evt) => {
      const startY = frameParam.startTop;
      const firstTouch = frameParam.firstTouchY;
      const moveY = (firstTouch - evt.clientY) - startY;
      if (Math.abs(moveY) > 3) {
        if (!frameParam.proxy) {
          frameParam.proxy = startMove();
        }

        targetFrameLi.style.top = `${-moveY}px`;
        setInterval(chekElement(evt), 1000);
      }
    };

    allFrames.addEventListener('mousedown', (e) => {
      if (this.framesUnits().length === 1) return;
      targetFrameLi = e.target.closest('li');

      frameParam.firstTouchY = e.clientY;
      frameParam.startTop = targetFrameLi.offsetTop;
      frameParam.startLeft = targetFrameLi.offsetLeft;

      targetFrameLi.addEventListener('mousemove', frameMove);

      targetFrameLi.addEventListener('mouseup', () => {
        targetFrameLi.removeEventListener('mousemove', frameMove);

        if (frameParam.proxy) frameParam.proxy.replaceWith(targetFrameLi);
        frameParam.proxy = null;
        targetFrameLi.style.position = 'relative';
        targetFrameLi.style.top = '';
        targetFrameLi.style.left = '';
        Preview.setSlides();
        this.countFrames();
      });
    });
  }
}
