(function () {

var $ = function(d) { return document.getElementById(d); };

PhiloGL.unpack();

if (!PhiloGL.hasWebGL()) {
  return;
}

var sharpness = 0,
    width = 512, //canvas width
    height = 512, //canvas height
    canvasWidth = 1024,
    canvasHeight = 512,
    vWidth = width, //domain width for the vector field
    vHeight = height, //domain height for the vector field
    lmax = 5, //maximum displacement distance (in pixels)
    vmax = 50, //maximum vector field value
    ctx =  document.createElement('canvas').getContext('2d'),
    field = function(x, y) {
      return [0, 0];
    };

function createFieldTextureArray(field) {
  var vf = new Float32Array(width * height * 4),
      v, idx;

  for (var x = 0; x < width; ++x) {
    for (var y = 0; y < height; ++y) {
      idx = (x + y * width) * 4;
      v = field(x, (height -1) - y);
      vf[idx] = v[0];
      vf[idx + 1] = v[1];
    }
  }

  return vf;
}

function createImageTextureArray(filename, callback) {
  var canvas = document.createElement('canvas'),
      ctx = canvas.getContext('2d');

  canvas.width = width;
  canvas.height = height;

  var img = new Image();
  img.src = filename;
  img.onload = function() {
    ctx.drawImage(img, 0, 0);
    callback(ctx.getImageData(0, 0, width, height));
  };
}

//Log singleton
var Log = {
  elem: null,
  timer: null,

  getElem: function() {
    if (!this.elem) {
      return (this.elem = $('log-message'));
    }
    return this.elem;
  },

  write: function(text, hide) {
    if (this.timer) {
      this.timer = clearTimeout(this.timer);
    }

    var elem = this.getElem(),
    style = elem.parentNode.style;

    elem.innerHTML = text;
    style.display = '';

    if (hide) {
      this.timer = setTimeout(function() {
        style.display = 'none';
      }, 2000);
    }
  }
};

function init(opt) {
  Log.write('Loading...');

  var v = createFieldTextureArray(field);

  var canvas = document.getElementById('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  var maximized = false;
  function maximize() {
    if (!maximized) {
      canvasWidth = window.innerWidth;
      canvasHeight = window.innerHeight;
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      canvas.className = 'floating';
      document.body.appendChild(canvas);
      document.querySelector('div.title').style.display = '';
    } else {
      var container = document.querySelector('div.canvas-container');
      canvas.width = width;
      canvas.height = height;
      canvasWidth = width;
      canvasHeight = height;
      canvas.className = '';
      container.appendChild(canvas);
      document.querySelector('div.title').style.display = 'none';
    }
    maximized = !maximized;
  }

  document.querySelector('a.fullscreen').addEventListener('click', function(e) {
    e.preventDefault();
    maximize();
  });

  document.querySelector('div.title a').addEventListener('click', function(e) {
    e.preventDefault();
    if (maximized) {
      maximize();
    }
  });

  window.addEventListener('resize', function() {
    if (maximized) {
      canvasWidth = window.innerWidth;
      canvasHeight = window.innerHeight;
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
    }
  });

  PhiloGL('canvas', {
    program: [{
      path: 'shaders/fluid/',
      id: 'coord-integration',
      vs: 'postprocess.vs.glsl',
      fs: 'ci.fs.glsl',
      from: 'uris'
    }, {
      path: 'shaders/fluid/',
      id: 'coord-reinit',
      vs: 'postprocess.vs.glsl',
      fs: 'cri.fs.glsl',
      from: 'uris'
    }, {
      path: 'shaders/fluid/',
      id: 'Np',
      vs: 'postprocess.vs.glsl',
      fs: 'np.fs.glsl',
      from: 'uris'
    }, {
      path: 'shaders/fluid/',
      id: 'Na',
      vs: 'postprocess.vs.glsl',
      fs: 'na.fs.glsl',
      from: 'uris'
    }, {
      path: 'shaders/fluid/',
      id: 'fluid',
      vs: 'postprocess.vs.glsl',
      fs: 'fluid.fs.glsl',
      from: 'uris'
    }, {
      path: 'shaders/fluid/',
      id: 'fluid-slow',
      vs: 'postprocess.vs.glsl',
      fs: 'fluid-slow.fs.glsl',
      from: 'uris'
    }, {
      path: 'shaders/fluid/',
      id: 'copy',
      vs: 'postprocess.vs.glsl',
      fs: 'copy.fs.glsl',
      from: 'uris'
    }],
    events: {
      cacheSize: false,
      centerOrigin: false,
      cachePosition: false,
      onDragStart: function(e) {
        this.dragging = true;
      },
      onDragCancel: function() {
        this.dragging = false;
      },
      onDragEnd: function() {
        this.dragging = false;
      },
      onMouseMove: function(e) {
        if (!this.pos) {
          this.pos = {
            x: e.x,
            y: e.y
          };
          return;
        }
        var pos = this.pos,
            from = this.vFrom,
            to = this.vTo,
            ex = e.x / canvasWidth * width,
            ey = e.y / canvasHeight * height,
            px = pos.x / canvasWidth * width,
            py = pos.y / canvasHeight * height;

        Media.Image.postProcess({
          width: width,
          height: height,
          program: 'fluid',
          fromTexture: from + '-texture',
          toFrameBuffer: to,
          uniforms: {
            mouse: [px, height - py, px - ex, ey - py],
            width: width,
            height: height
          }
        });

        pos.x = e.x;
        pos.y = e.y;
      },
      onMouseOut: function() {
        this.pos = false;
      },
      onTouchStart: function(e) {
        this.pos = {
          x: e.x,
          y: e.y
        };
      },
      onTouchCancel: function(e) {
        this.events.onMouseOut.call(this, e);
      },
      onTouchMove: function(e) {
        this.events.onMouseMove.call(this, e);
      },
      onTouchEnd: function(e) {
        this.events.onMouseOut.call(this, e);
      },
      onKeyUp: function(e) {
        if (e.key == 'esc' && maximized) {
          maximize();
        }
      }
    },
    onError: function(e) {
      throw e;
    },
    onLoad: function(app) {
      var gl = app.gl,
          program = app.program,
          canvas = app.canvas;

       app.vFrom = 'field';
       app.vTo = 'fieldp';


       app.setFrameBuffer('field', {
        width: width,
        height: height,
        bindToTexture: {
          pixelStore: [{
            name: gl.UNPACK_FLIP_Y_WEBGL,
            value: false
          }],
          data: {
            type: gl.FLOAT,
            width: width,
            height: height,
            value: v
          }
        }
      });

      app.setFrameBuffer('fieldp', {
        width: width,
        height: height,
        bindToTexture: {
          pixelStore: [{
            name: gl.UNPACK_FLIP_Y_WEBGL,
            value: false
          }],
          data: {
            type: gl.FLOAT,
            width: width,
            height: height,
            value: v
          }
        }
      });

      app.setTexture('background', {
        pixelStore: [{
          name: gl.UNPACK_FLIP_Y_WEBGL,
          value: false
        }],
        data: {
          width: width,
          height: height,
          value: opt.background
        }
      });

      app.setFrameBuffer('N', {
        width: width,
        height: height,
        bindToTexture: {
          data: {
            value: opt.background
          }
        }
      });

      app.setFrameBuffer('c', {
        width: width,
        height: height,
        bindToTexture: {
          data: {
            type: gl.FLOAT,
            width: width,
            height: height
          }
        }
      });

      app.setFrameBuffer('cp', {
        width: width,
        height: height,
        bindToTexture: {
          data: {
            width: width,
            height: height,
            type: gl.FLOAT
          }
        }
      });

      app.setFrameBuffer('Np', {
        width: width,
        height: height,
        bindToTexture: {}
      });

      app.setFrameBuffer('Na', {
        width: width,
        height: height,
        bindToTexture: {
          parameters: [{
            name: gl.TEXTURE_MAG_FILTER,
            value: gl.LINEAR
          }, {
            name: gl.TEXTURE_MIN_FILTER,
            value: gl.LINEAR
          }]
        }
      });

      app.setFrameBuffer('Nb', {
        width: width,
        height: height,
        bindToTexture: {
          parameters: [{
            name: gl.TEXTURE_MAG_FILTER,
            value: gl.LINEAR
          }, {
            name: gl.TEXTURE_MIN_FILTER,
            value: gl.LINEAR
          }]
        }
      });

      animate(app);

      Log.write('done.', true);
    }
  });
}

function animate(app) {
  function uniforms(opt) {
    opt = opt || {};
    var ans = {
      width: width,
      height: height,
      vWidth: vWidth,
      vHeight: vHeight,
      lmax: lmax,
      vmax: vmax
    };
    for (var k in opt) {
      ans[k] = opt[k];
    }
    return ans;
  }

  //initialize cx cy
  Media.Image.postProcess({
    width: width,
    height: height,
    toFrameBuffer: 'c',
    program: 'coord-reinit',
    uniforms: uniforms({ init: 1 })
  });

  var noiseTex = true;
  function draw(noiseTex) {
    var cxFrom, cxTo, cyFrom, cyTo, noiseFrom, noiseTo, blendFrom, blendTo;
    if (noiseTex) {
      cFrom = 'c',
      cTo = 'cp',
      texFrom = 'N',
      texTo = 'Np';
      blendFrom = 'Nb';
      blendTo = 'Na';
    } else {
      cFrom = 'c',
      cTo = 'cp',
      texFrom = 'Np',
      texTo = 'N';
      blendFrom = 'Na';
      blendTo = 'Nb';
    }

    Media.Image.postProcess({
      width: width,
      height: height,
      fromTexture: [ cFrom + '-texture', app.vTo + '-texture' ],
      toFrameBuffer: cTo,
      program: 'coord-integration',
      uniforms: uniforms()
    }).postProcess({
      width: width,
      height: height,
      fromTexture: [ cTo + '-texture', texFrom + '-texture', blendFrom + '-texture', app.vTo + '-texture' ],
      toFrameBuffer: blendTo,
      //toScreen: true,
      program: 'Na',
      uniforms: uniforms({ sharpness: sharpness })
    }).postProcess({
      width: width,
      height: height,
      fromTexture: [ cTo + '-texture', texFrom + '-texture', 'background' ],
      toFrameBuffer: texTo,
      program: 'Np',
      uniforms: uniforms({
        sharpness: sharpness
      })
    }).postProcess({
      width: width,
      height: height,
      fromTexture: cTo + '-texture',
      toFrameBuffer: cFrom,
      program: 'coord-reinit',
      uniforms: uniforms({ init: 0 })
    }).postProcess({
      width: width,
      height: height,
      fromTexture: app.vTo + '-texture',
      toFrameBuffer: app.vFrom,
      program: 'fluid-slow'
    }).postProcess({
      aspectRatio: 1,
      fromTexture: blendTo + '-texture',
      toScreen: true,
      program: 'copy',
      width: canvasWidth,
      height: canvasHeight
    });

    var tmp = app.vTo;
    app.vTo = app.vFrom;
    app.vFrom = tmp;
  }

  Fx.requestAnimationFrame(function loop() {
    draw(noiseTex);
    noiseTex = !noiseTex;
    Fx.requestAnimationFrame(loop);
  });
}

function load() {
  createImageTextureArray('img/pattern00.png', function(background) {
    init({
      background: background
    });
  });
}

window.addEventListener('DOMContentLoaded', load);

})();
