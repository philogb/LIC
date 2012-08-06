PhiloGL.unpack();

var width = 1024, //canvas width
    height = 1024, //canvas height
    vWidth = width, //domain width for the vector field
    vHeight = height, //domain height for the vector field
    lmax = 30, //maximum displacement distance (in pixels)
    vmax = 800, //maximum vector field value
    maxDim = Math.max(width, height) + 1;

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


function createWhiteNoiseTextureArray(cmp) {
  var imageData = document.createElement('canvas').getContext('2d').createImageData(width, height),
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
  var imageData = document.createElement('canvas').getContext('2d').createImageData(width, height),
      ans = imageData.data,
      rand = Math.random;

  for (var i = 0, l = width * height; i < l; ++i) {
    var idx = i * 4,
        value = (index(i) + rand()),
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

var rnd = Math.random;
var noise = createWhiteNoiseTextureArray(function() { return rnd() >= 0.5; });
var swapPixelProb = createWhiteNoiseTextureArray(function() { return rnd() <= 0.1; });
var cx = createCoordinatesTextureArray(function(i) { return (i % width); });
var cy = createCoordinatesTextureArray(function(i) { return Math.floor(i / width); });

function init() {

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
    }],
    onError: function(e) {
      throw e;
      console.log(e);
    },
    onLoad: function(app) {
      var gl = app.gl,
          program = app.program,
          canvas = app.canvas;

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
        var cxFrom, cxTo, cyFrom, cyTo, noiseFrom, noiseTo;
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
          fromTexture: [ cxFrom + '-texture', cyFrom + '-texture' ],
          toFrameBuffer: cxTo,
          program: 'coord-integration',
          uniforms: uniforms({ cxFlag: 1 })
        }).postProcess({
          fromTexture: [ cxFrom + '-texture', cyFrom + '-texture' ],
          toFrameBuffer: cyTo,
          program: 'coord-integration',
          uniforms: uniforms({ cxFlag: 0 })
        }).postProcess({
          fromTexture: [ cxTo + '-texture', cyTo + '-texture', noiseFrom + '-texture', blendFrom + '-texture', 'white-noise', 'prob-noise' ],
          toFrameBuffer: blendTo,
          program: 'Na',
          toScreen: true,
          uniforms: uniforms()
        }).postProcess({
          fromTexture: [ cxTo + '-texture', cyTo + '-texture', noiseFrom + '-texture', 'white-noise', 'prob-noise' ],
          toFrameBuffer: noiseTo,
          program: 'Np',
          uniforms: uniforms()
        }).postProcess({
          fromTexture: [ cxTo + '-texture' ],
          toFrameBuffer: cxFrom,
          program: 'coord-reinit',
          uniforms: uniforms({ cxFlag: 1 })
        }).postProcess({
          fromTexture: [ cyTo + '-texture' ],
          toFrameBuffer: cyFrom,
          program: 'coord-reinit',
          uniforms: uniforms({ cxFlag: 0 })
        });
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
