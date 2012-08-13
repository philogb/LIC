PhiloGL.unpack();

var sharpness = 0,
    width = 512, //canvas width
    height = 512, //canvas height
    vWidth = width, //domain width for the vector field
    vHeight = height, //domain height for the vector field
    lmax = 10, //maximum displacement distance (in pixels)
    vmax = 15, //maximum vector field value
    ctx =  document.createElement('canvas').getContext('2d'),
    field = function(x, y) {
      x -= width / 2;
      y -= height / 2;
      var norm = Math.sqrt(x * x + y * y);
      //return [0, 0];
      return [y / norm * 10, x / norm * 10];
    };

function createFieldTextureArray(field) {
  var vf = new Float32Array(width * height * 4),
      v, pvx, pvy, idx;

  for (var x = 0; x < width; ++x) {
    for (var y = 0; y < height; ++y) {
      idx = (x + y * width) * 4;
      v = field(x, (height -1) - y);
      pvx = v[0];
      pvy = v[1];
      vf[idx] = pvx;
      vf[idx + 1] = pvy;
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

function init(opt) {
  var rnd = Math.random;
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
       app.setTexture('field', {
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

      app.setFrameBuffer('c', {
        width: width,
        height: height,
        bindToTexture: {
          data: {
            type: gl.FLOAT,
            width: width,
            height: height
            //value: cx
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
          fromTexture: [ cFrom + '-texture', 'field' ],
          toFrameBuffer: cTo,
          program: 'coord-integration',
          uniforms: uniforms()
        }).postProcess({
          aspectRatio: 1,
          fromTexture: [ cTo + '-texture', texFrom + '-texture', blendFrom + '-texture', 'field' ],
          toFrameBuffer: blendTo,
          program: 'Na',
          toScreen: true,
          uniforms: uniforms({ sharpness: sharpness })
        }).postProcess({
          fromTexture: [ cTo + '-texture', texFrom + '-texture', 'background' ],
          toFrameBuffer: texTo,
          program: 'Np',
          uniforms: uniforms({
            enable: Math.sin(Date.now() / 500),
            sharpness: sharpness
          })
          //re-initialization
        }).postProcess({
          fromTexture: [ cTo + '-texture' ],
          toFrameBuffer: cFrom,
          program: 'coord-reinit',
          uniforms: uniforms({ init: 0 })
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
        //var vdata = v.data;
        //lmax = 20;
        //vmax = 50;
        //field = function(x, y) {
          //var idx = (x + y * width) * 4,
              //norm = vdata[idx] / 255 * vmax / 2,
              //angle = vdata[idx + 1] / 255 * Math.PI * 2;

          //return [Math.cos(angle) * norm, Math.sin(angle) * norm];

        //};
        init({
          background: background
        });
    });
  });
}

window.addEventListener('DOMContentLoaded', load);
