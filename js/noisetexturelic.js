PhiloGL.unpack();

var alic = false,
    width = 1024, //canvas width
    height = 1024, //canvas height
    vWidth = width, //domain width for the vector field
    vHeight = height, //domain height for the vector field
    lmax = 30, //maximum displacement distance (in pixels)
    vmax = 512, //maximum vector field value
    maxDim = Math.max(width, height) + 1,
    ctx =  document.createElement('canvas').getContext('2d'),
    field = function(x, y) {
      x -= width / 2;
      y -= height / 2;
      return [y, x];
    };

lmax = 25;
vmax = 200;
field = function(x, y) {
  x -= width / 2;
  y -= height / 2;
  x /= 50;
  y /= 50;
  var charge = 10000,
      rq = 10,
      v1 = [ rq - x, -y],
      v2 = [-rq - x, -y],
      d1 = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1]),
      d2 = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1]);

  if (d1 < 3 || d2 < 3) {
    return [0, 0];
  }

  v1[0] = charge / (d1 * d1 * d1) * v1[0];
  v1[1] = charge / (d1 * d1 * d1) * v1[1];

  v2[0] = charge / (d2 * d2 * d2) * v2[0];
  v2[1] = charge / (d2 * d2 * d2) * v2[1];

  return [v1[0] - v2[0], v1[1] - v2[1]];
};

function fract(x) {
  return x - Math.floor(x);
}

function packFloatToRGBA(val) {
  var bitSh = [256.0 * 256.0 * 256.0, 256.0 * 256.0, 256.0, 1.0];
  var bitMsk = [0.0, 1.0 / 256.0, 1.0 / 256.0, 1.0 / 256.0];
  for (var i = 0; i < 4; ++i) {
    bitSh[i] = fract(bitSh[i] * val);
  }
  return [bitSh[0],
          bitSh[1] - bitSh[0] * bitMsk[1],
          bitSh[2] - bitSh[1] * bitMsk[2],
          bitSh[3] - bitSh[2] * bitMsk[3]];
}

function unpackFloatFromVec4i(value){
   var bitSh = [1.0 / (256.0 * 256.0 * 256.0), 1.0 / (256.0 * 256.0), 1.0 / 256.0, 1.0];
   return bitSh[0] * value[0] + bitSh[1] * value[1] + bitSh[2] * value[2] + bitSh[3] * value[3];
}


function createFieldTextureArray(field) {
  var vxImageData = ctx.createImageData(width, height),
      vyImageData = ctx.createImageData(width, height),
      vx = vxImageData.data,
      vy = vyImageData.data,
      v, pvx, pvy, idx;

  for (var x = 0; x < width; ++x) {
    for (var y = 0; y < height; ++y) {
      idx = (x + y * width) * 4;
      v = field(x, height - y);
      pvx = v[0] / (2 * maxDim) + 0.5;
      pvy = v[1] / (2 * maxDim) + 0.5;
      pvx = packFloatToRGBA(pvx);
      pvy = packFloatToRGBA(pvy);
      vx[idx    ] = (pvx[0] * 255) >> 0;
      vx[idx + 1] = (pvx[1] * 255) >> 0;
      vx[idx + 2] = (pvx[2] * 255) >> 0;
      vx[idx + 3] = (pvx[3] * 255) >> 0;

      vy[idx    ] = (pvy[0] * 255) >> 0;
      vy[idx + 1] = (pvy[1] * 255) >> 0;
      vy[idx + 2] = (pvy[2] * 255) >> 0;
      vy[idx + 3] = (pvy[3] * 255) >> 0;
    }
  }

  return [vxImageData, vyImageData];
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
  var imageData = ctx.createImageData(width, height),
      ans = imageData.data,
      rand = Math.random;

  for (var i = 0, l = width * height; i < l; ++i) {
    var idx = i * 4,
        value = index(i),
        val = packFloatToRGBA(value / maxDim);

    val[0] = (val[0] * 255) >> 0;
    val[1] = (val[1] * 255) >> 0;
    val[2] = (val[2] * 255) >> 0;
    val[3] = (val[3] * 255) >> 0;

    ans[idx    ] = val[0];
    ans[idx + 1] = val[1];
    ans[idx + 2] = val[2];
    ans[idx + 3] = val[3];
  }

  return imageData;
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
      from: 'uris',
      noCache: true
    }, {
      path: 'shaders/noise/',
      id: 'coord-reinit',
      vs: 'postprocess.vs.glsl',
      fs: 'cri.fs.glsl',
      from: 'uris',
      noCache: true
    }, {
      path: 'shaders/noise/',
      id: 'Np',
      vs: 'postprocess.vs.glsl',
      fs: 'np.fs.glsl',
      from: 'uris',
      noCache: true
    }, {
      path: 'shaders/noise/',
      id: 'Na',
      vs: 'postprocess.vs.glsl',
      fs: 'na.fs.glsl',
      from: 'uris',
      noCache: true
    }, {
      path: 'shaders/noise/',
      id: 'alic-init',
      vs: 'postprocess.vs.glsl',
      fs: 'alic-init.fs.glsl',
      from: 'uris',
      noCache: true
    }, {
      path: 'shaders/noise/',
      id: 'alic-int',
      vs: 'postprocess.vs.glsl',
      fs: 'alic-int.fs.glsl',
      from: 'uris',
      noCache: true
    }, {
      path: 'shaders/noise/',
      id: 'alic-accum',
      vs: 'postprocess.vs.glsl',
      fs: 'alic-accum.fs.glsl',
      from: 'uris',
      noCache: true
    }, {
      path: 'shaders/noise/',
      id: 'alic-copy',
      vs: 'postprocess.vs.glsl',
      fs: 'alic-copy.fs.glsl',
      from: 'uris',
      noCache: true
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
        width: width,
        height: height,
        data: {
          value: v[0]
        }
      });

      app.setTexture('field-y', {
        width: width,
        height: height,
        data: {
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
            value: cx
          }
        }
      });

      app.setFrameBuffer('cy', {
        width: width,
        height: height,
        bindToTexture: {
          data: {
            value: cy
          }
        }
      });

      app.setFrameBuffer('cxp', {
        width: width,
        height: height,
        bindToTexture: {}
      });

      app.setFrameBuffer('cyp', {
        width: width,
        height: height,
        bindToTexture: {}
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
          maxDim: maxDim
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
                  value: cxx
                }
              }
            },
            'cyy': {
              width: width,
              height: height,
              bindToTexture: {
                data: {
                  value: cyy
                }
              }
            },
            'cxxp': {
              width: width,
              height: height,
              bindToTexture: {
                data: {
                  value: cxx
                }
              }
            },
            'cyyp': {
              width: width,
              height: height,
              bindToTexture: {
                data: {
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

        //Media.Image.postProcess({
          //aspectRatio: 1,
          //fromTexture: [ 'Nlic-texture' ],
          //toFrameBuffer: from,
          //program: 'alic-copy'
        //});
      }

      Fx.requestAnimationFrame(function loop() {
        draw(noiseTex);
        noiseTex = !noiseTex;
        Fx.requestAnimationFrame(loop);
      });
    }
  });
}


//function load() {
  //new IO.XHR.Group({
    //urls: ['data/u.txt', 'data/v.txt'],
    ////noCache: true,
    ////responseType: 'arraybuffer',
    //onError: function() {
      //console.log('error', arguments);
    //},
    //onComplete: function(map) {
      //var u = JSON.parse(map[0]),
          //v = JSON.parse(map[1]),
          //mapWidth = 400,
          //mapHeight = 120;

      //field = function(x, y) {
        //x = (x * mapWidth / width) >> 0;
        //x = (x + 120) % mapWidth;
        //y = mapHeight - ((y * mapHeight / height) >> 0);
        //var idx = x + y * mapWidth;
        //var uval = u[idx] * maxDim,
            //vval = v[idx] * maxDim;
        //return [uval, vval];
      //};

      //init();
    //}
  //}).send();
//}

window.addEventListener('DOMContentLoaded', init);
