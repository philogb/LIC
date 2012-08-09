PhiloGL.unpack();

var sharpness = 0,
    width = 512, //canvas width
    height = 512, //canvas height
    vWidth = width, //domain width for the vector field
    vHeight = height, //domain height for the vector field
    lmax = 20, //maximum displacement distance (in pixels)
    vmax = 50, //maximum vector field value
    ctx =  document.createElement('canvas').getContext('2d'),
    field = function(x, y) {
      x -= width / 2;
      y -= height / 2;
      var norm = Math.sqrt(x * x + y * y);
      return [y / norm * 10, x / norm * 10];
    };

function createFieldTextureArray(field) {
  var vx = new Float32Array(width * height * 4),
      vy = new Float32Array(width * height * 4),
      v, pvx, pvy, idx;

  for (var x = 0; x < width; ++x) {
    for (var y = 0; y < height; ++y) {
      idx = (x + y * width) * 4;
      v = field(x, height - y);
      pvx = v[0];
      pvy = v[1];
      vx[idx] = pvx;
      vy[idx] = pvy;
    }
  }

  return [vx, vy];
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

function createCoordinatesTextureArray(index) {
  var ans = new Float32Array(width * height * 4);

  for (var i = 0, l = width * height; i < l; ++i) {
    var idx = i * 4,
        value = index(i);

    ans[idx] = value;
  }

  return ans;
}

function init(opt) {
  var rnd = Math.random;
  var cx = createCoordinatesTextureArray(function(i) { return (i % width) + rnd(); });
  var cy = createCoordinatesTextureArray(function(i) { return Math.floor(i / width) + rnd(); });
  var v = createFieldTextureArray(field);


  var canvas = document.getElementById('canvas');
  canvas.width = width;
  canvas.height = height;

  PhiloGL('canvas', {
    program: [{
      path: 'shaders/dye/',
      id: 'coord-integration',
      vs: 'postprocess.vs.glsl',
      fs: 'ci.fs.glsl',
      from: 'uris',
      noCache: true
    }, {
      path: 'shaders/dye/',
      id: 'coord-reinit',
      vs: 'postprocess.vs.glsl',
      fs: 'cri.fs.glsl',
      from: 'uris',
      noCache: true
    }, {
      path: 'shaders/dye/',
      id: 'Np',
      vs: 'postprocess.vs.glsl',
      fs: 'np.fs.glsl',
      from: 'uris',
      noCache: true
    }, {
      path: 'shaders/dye/',
      id: 'Na',
      vs: 'postprocess.vs.glsl',
      fs: 'na.fs.glsl',
      from: 'uris',
      noCache: true
    }],
    onError: function(e) {
      throw e;
    },
    onLoad: function(app) {
      var gl = app.gl,
          program = app.program,
          canvas = app.canvas;
       app.setTexture('field-x', {
        pixelStore: [{
          name: gl.UNPACK_FLIP_Y_WEBGL,
          value: false
        }],
        data: {
          type: gl.FLOAT,
          width: width,
          height: height,
          value: v[0]
        }
      });

      app.setTexture('field-y', {
        pixelStore: [{
          name: gl.UNPACK_FLIP_Y_WEBGL,
          value: false
        }],
        data: {
          type: gl.FLOAT,
          width: width,
          height: height,
          value: v[1]
        }
      });

      app.setTexture('background', {
        pixelStore: [{
          name: gl.UNPACK_FLIP_Y_WEBGL,
          value: false
        }],
        width: width,
        height: height,
        data: {
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

      app.setFrameBuffer('cx', {
        width: width,
        height: height,
        bindToTexture: {
          data: {
            type: gl.FLOAT,
            width: width,
            height: height,
            value: cx
          }
        }
      });

      app.setFrameBuffer('cy', {
        width: width,
        height: height,
        bindToTexture: {
          data: {
            type: gl.FLOAT,
            width: width,
            height: height,
            value: cy
          }
        }
      });

      app.setFrameBuffer('cxp', {
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

      app.setFrameBuffer('cyp', {
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

      var noiseTex = true;
      function draw(noiseTex) {
        var cxFrom, cxTo, cyFrom, cyTo, noiseFrom, noiseTo, blendFrom, blendTo;
        if (noiseTex) {
          cxFrom = 'cx',
          cxTo = 'cxp',
          cyFrom = 'cy',
          cyTo = 'cyp',
          texFrom = 'N',
          texTo = 'Np';
          blendFrom = 'Nb';
          blendTo = 'Na';
        } else {
          cxFrom = 'cx',
          cxTo = 'cxp',
          cyFrom = 'cy',
          cyTo = 'cyp',
          texFrom = 'Np',
          texTo = 'N';
          blendFrom = 'Na';
          blendTo = 'Nb';
        }

        Media.Image.postProcess({
          aspectRatio: 1,
          fromTexture: [ cxFrom + '-texture', cyFrom + '-texture', 'field-x', 'field-y' ],
          toFrameBuffer: cxTo,
          program: 'coord-integration',
          uniforms: uniforms({ cxFlag: 1 })
        }).postProcess({
          aspectRatio: 1,
          fromTexture: [ cxFrom + '-texture', cyFrom + '-texture', 'field-x', 'field-y' ],
          toFrameBuffer: cyTo,
          program: 'coord-integration',
          uniforms: uniforms({ cxFlag: 0 })
        }).postProcess({
          aspectRatio: 1,
          fromTexture: [ cxTo + '-texture', cyTo + '-texture', texFrom + '-texture', blendFrom + '-texture', 'background', 'field-x', 'field-y' ],
          toFrameBuffer: blendTo,
          program: 'Na',
          toScreen: true,
          uniforms: uniforms({ sharpness: sharpness })
        }).postProcess({
          aspectRatio: 1,
          fromTexture: [ cxTo + '-texture', cyTo + '-texture', texFrom + '-texture', 'background' ],
          toFrameBuffer: texTo,
          program: 'Np',
          uniforms: uniforms({
            enable: Math.sin(Date.now() / 500),
            sharpness: sharpness
          })
          //re-initialization
        }).postProcess({
          aspectRatio: 1,
          fromTexture: [ cxTo + '-texture' ],
          toFrameBuffer: cxFrom,
          program: 'coord-reinit',
          uniforms: uniforms({ cxFlag: 1, time: Date.now() })
        }).postProcess({
          aspectRatio: 1,
          fromTexture: [ cyTo + '-texture' ],
          toFrameBuffer: cyFrom,
          program: 'coord-reinit',
          uniforms: uniforms({ cxFlag: 0, time: Date.now() })
        });
      }

      Fx.requestAnimationFrame(function loop() {
        draw(noiseTex);
        noiseTex = !noiseTex;
        //draw(noiseTex);
        //noiseTex = !noiseTex;
        //draw(noiseTex);
        //noiseTex = !noiseTex;
        //draw(noiseTex);
        //noiseTex = !noiseTex;
        //draw(noiseTex);
        //noiseTex = !noiseTex;
        //draw(noiseTex);
        //noiseTex = !noiseTex;
        //draw(noiseTex);
        //noiseTex = !noiseTex;
        //draw(noiseTex);
        //noiseTex = !noiseTex;
        //draw(noiseTex);
        //noiseTex = !noiseTex;
        //draw(noiseTex);
        Fx.requestAnimationFrame(loop);
      });
    }
  });
}


function map(img) {
  new IO.XHR.Group({
    urls: ['data/u.txt', 'data/v.txt'],
    //noCache: true,
    //responseType: 'arraybuffer',
    onError: function() {
      console.log('error', arguments);
    },
    onComplete: function(map) {
      var u = JSON.parse(map[0]),
          v = JSON.parse(map[1]),
          mapWidth = 400,
          mapHeight = 120;

      lmax = 3; //maximum displacement distance (in pixels)
      vmax = 10; //maximum vector field value
      field = function(x, y) {
        x = (x * mapWidth / width) >> 0;
        x = (x + 120) % mapWidth;
        y = mapHeight - ((y * mapHeight / height) >> 0);
        var idx = x + y * mapWidth;
        var uval = u[idx],
            vval = v[idx];
        return [uval, vval];
      };

      init(img);
    }
  }).send();
}

function load() {
  var img;
  createImageTextureArray('img/flowers.jpg', function(background) {
    createImageTextureArray('img/v.jpg', function(v) {
        //v = v.data;
        //function sq(v) {
           //for (var i = 0, l = v.length; i < l; ++i) {
              //v[i] *= v[i];
           //}
           //return v;
        //};
        //lmax = 20;
        //vmax = 100;
        //field = function(x, y) {
          //var idx = (x + y * width) * 4,
              //norm = v[idx] / 255 * vmax,
              //angle = v[idx + 1] / 255 * Math.PI * 2;

          ////return [5, 0];
          ////return [2, 0];
          //return [Math.cos(angle) * norm, Math.sin(angle) * norm];

        //};
        init({
          background: background
        });
    });
  });
}

window.addEventListener('DOMContentLoaded', load);
