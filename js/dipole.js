PhiloGL.unpack();

var alic = false,
    width = 1024, //canvas width
    height = 512, //canvas height
    vWidth = width, //domain width for the vector field
    vHeight = height, //domain height for the vector field
    lmax = 50, //maximum displacement distance (in pixels)
    vmax = 1024, //maximum vector field value
    ctx =  document.createElement('canvas').getContext('2d'),
    field = function(x, y) {
      x -= width / 2;
      y -= height / 2;
      return [-y, x];
    },
    timer = Date.now();


lmax = 20;
vmax = 290;
field = function(x, y) {
  x -= width / 2;
  y -= height / 2;
  x /= 50;
  y /= 50;
  var charge = 800,
      rq = 2,
      v1 = [ (rq - x), -y],
      v2 = [(-rq - x), -y],
      d1 = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1]) + 1,
      d2 = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1]) + 1;

  if (d1 < 1.01 || d2 < 1.2) {
    return [0, 0];
  }

  v1[0] = charge / (d1 * d1 * d1) * v1[0];
  v1[1] = charge / (d1 * d1 * d1) * v1[1];

  v2[0] = charge / (d2 * d2 * d2) * v2[0];
  v2[1] = charge / (d2 * d2 * d2) * v2[1];

  return [v1[0] - v2[0], v1[1] - v2[1]];
};

function createFieldTextureArray(field) {
  var vx = new Float32Array(width * height * 4),
      vy = new Float32Array(width * height * 4),
      v, pvx, pvy, idx;

  for (var x = 0; x < width; ++x) {
    for (var y = 0; y < height; ++y) {
      idx = (x + y * width) * 4;
      v = field(x, y);
      pvx = v[0];
      pvy = v[1];
      vx[idx] = pvx;
      vy[idx] = pvy;
    }
  }

  return [vx, vy];
}

function createWhiteNoiseTextureArray(cmp) {
  var imageData = ctx.createImageData(width, height),
      ans = imageData.data;

  for (var i = 0, l = width * height; i < l; ++i) {
    var idx = i * 4,
        val = cmp() ? 255 : 0;

    ans[idx] = ans[idx + 1] = ans[idx + 2] = val;
    ans[idx + 3] = 255;
  }

  return imageData;
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

function init() {
  var rnd = Math.random;
  var noise = createWhiteNoiseTextureArray(function() { return rnd() >= 0.5; });
  var swapPixelProb = createWhiteNoiseTextureArray(function() { return rnd() <= 0.1; });
  var cx = createCoordinatesTextureArray(function(i) { return (i % width) + rnd(); });
  var cy = createCoordinatesTextureArray(function(i) { return Math.floor(i / width) + rnd(); });
  var cxx = createCoordinatesTextureArray(function(i) { return (i % width); });
  var cyy = createCoordinatesTextureArray(function(i) { return Math.floor(i / width); });
  var v = createFieldTextureArray(field);


  var canvas = document.getElementById('canvas');
  canvas.width = width;
  canvas.height = height;

  PhiloGL('canvas', {
    program: [{
      path: 'shaders/noise/',
      id: 'coord-integration',
      vs: 'postprocess.vs.glsl',
      fs: 'ci.fs.glsl',
      from: 'uris'
    }, {
      path: 'shaders/noise/',
      id: 'coord-reinit',
      vs: 'postprocess.vs.glsl',
      fs: 'cri.fs.glsl',
      from: 'uris'
    }, {
      path: 'shaders/noise/',
      id: 'Np',
      vs: 'postprocess.vs.glsl',
      fs: 'np.fs.glsl',
      from: 'uris'
    }, {
      path: 'shaders/noise/',
      id: 'Na',
      vs: 'postprocess.vs.glsl',
      fs: 'na.fs.glsl',
      from: 'uris'
    }, {
      path: 'shaders/noise/',
      id: 'alic-init',
      vs: 'postprocess.vs.glsl',
      fs: 'alic-init.fs.glsl',
      from: 'uris'
    }, {
      path: 'shaders/noise/',
      id: 'alic-int',
      vs: 'postprocess.vs.glsl',
      fs: 'alic-int.fs.glsl',
      from: 'uris'
    }, {
      path: 'shaders/noise/',
      id: 'alic-accum',
      vs: 'postprocess.vs.glsl',
      fs: 'alic-accum.fs.glsl',
      from: 'uris'
    }, {
      path: 'shaders/noise/',
      id: 'alic-copy',
      vs: 'postprocess.vs.glsl',
      fs: 'alic-copy.fs.glsl',
      from: 'uris'
    }],
    onError: function(e) {
      throw e;
      console.log(e);
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

      app.setTexture('white-noise', {
        width: width,
        height: height,
        data: {
          value: noise
        }
      });

      app.setTexture('prob-noise', {
        width: width,
        height: height,
        data: {
          value: swapPixelProb
        }
      });

      app.setFrameBuffer('N', {
        width: width,
        height: height,
        bindToTexture: {
          data: {
            value: noise
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

      app.setFrameBuffer('Nlic', {
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
          vmax: vmax,
          timer: Date.now() - timer
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
          noiseFrom = 'N',
          noiseTo = 'Np';
          blendFrom = 'Nb';
          blendTo = 'Na';
        } else {
          cxFrom = 'cx',
          cxTo = 'cxp',
          cyFrom = 'cy',
          cyTo = 'cyp',
          noiseFrom = 'Np',
          noiseTo = 'N';
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
          fromTexture: [ cxTo + '-texture', cyTo + '-texture', noiseFrom + '-texture', blendFrom + '-texture', 'white-noise', 'prob-noise', 'field-x', 'field-y' ],
          toFrameBuffer: blendTo,
          program: 'Na',
          toScreen: !alic,
          uniforms: uniforms()
        }).postProcess({
          aspectRatio: 1,
          fromTexture: [ cxTo + '-texture', cyTo + '-texture', noiseFrom + '-texture', 'white-noise', 'prob-noise' ],
          toFrameBuffer: noiseTo,
          program: 'Np',
          uniforms: uniforms()
        });


        if (alic) ALIC(blendTo);

        //coord reinitialization
        Media.Image.postProcess({
          aspectRatio: 1,
          fromTexture: [ cxTo + '-texture' ],
          toFrameBuffer: cxFrom,
          program: 'coord-reinit',
          uniforms: uniforms({ cxFlag: 1 })
        }).postProcess({
          aspectRatio: 1,
          fromTexture: [ cyTo + '-texture' ],
          toFrameBuffer: cyFrom,
          program: 'coord-reinit',
          uniforms: uniforms({ cxFlag: 0 })
        });
      }

      function ALIC(from) {
        var L = 10,
            L2 = L / 2,
            r = 1 / (L + 1),
            sgn = 1 / vmax;

        Media.Image.postProcess({
          aspectRatio: 1,
          fromTexture: [ from + '-texture' ],
          toFrameBuffer: 'Nlic',
          program: 'alic-init',
          uniforms: { r: r }
        });

        for (var k = 0; k < 2; k++) {
          //initialize coords
          app.setFrameBuffers({
            'cxx': {
              width: width,
              height: height,
              bindToTexture: {
                data: {
                  width: width,
                  height: height,
                  type: gl.FLOAT,
                  value: cxx
                }
              }
            },
            'cyy': {
              width: width,
              height: height,
              bindToTexture: {
                data: {
                  width: width,
                  height: height,
                  type: gl.FLOAT,
                  value: cyy
                }
              }
            },
            'cxxp': {
              width: width,
              height: height,
              bindToTexture: {
                data: {
                  width: width,
                  height: height,
                  type: gl.FLOAT,
                  value: cxx
                }
              }
            },
            'cyyp': {
              width: width,
              height: height,
              bindToTexture: {
                data: {
                  width: width,
                  height: height,
                  type: gl.FLOAT,
                  value: cyy
                }
              }
            }
          });

          //forward / backward LIC
          for (var i = 0; i < L2; ++i) {
            var texFrom, texTo, cxFrom, cyFrom, cxTo, cyTo;
            if (i % 2) {
              texFrom = 'Nlicp';
              texTo = 'Nlic';
              cxFrom = 'cxx';
              cxTo = 'cxxp';
              cyFrom = 'cyy';
              cyTo = 'cyyp';
            } else {
              texFrom = 'Nlic';
              texTo = 'Nlicp';
              cxFrom = 'cxxp';
              cxTo = 'cxx';
              cyFrom = 'cyyp';
              cyTo = 'cyy';
            }

            Media.Image.postProcess({
              aspectRatio: 1,
              fromTexture: [ cxFrom + '-texture' , cyFrom + '-texture', 'field-x'],
              toFrameBuffer: cxTo,
              program: 'alic-int',
              uniforms: uniforms({ sgn: sgn, cxFlag: 1 })
            }).postProcess({
              aspectRatio: 1,
              fromTexture: [ cxFrom + '-texture', cyFrom + '-texture', 'field-y' ],
              toFrameBuffer: cyTo,
              program: 'alic-int',
              uniforms: uniforms({ sgn: sgn, cxFlag: 0 })
            }).postProcess({
              aspectRatio: 1,
              fromTexture: [ cxTo + '-texture', cyTo + '-texture', from + '-texture', texFrom + '-texture' ],
              toFrameBuffer: texTo,
              program: 'alic-accum',
              toScreen: true,
              uniforms: uniforms({ r: r })
            });
          }
          sgn = -sgn;
        }
      }

      Fx.requestAnimationFrame(function loop() {
        draw(noiseTex);
        noiseTex = !noiseTex;
        Fx.requestAnimationFrame(loop);
      });
    }
  });
}

window.addEventListener('DOMContentLoaded', init);

