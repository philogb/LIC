PhiloGL.unpack();

var width = 512, //canvas width
    height = 512, //canvas height
    vWidth = width, //domain width for the vector field
    vHeight = height, //domain height for the vector field
    lmax = 2, //maximum displacement distance (in pixels)
    vmax = 1; //maximum vector field value

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


function createWhiteNoiseTextureArray() {
  //var imageData = document.createElement('canvas').getContext('2d').createImageData(width + 2 * lmax, height + 2 * lmax),
  var imageData = document.createElement('canvas').getContext('2d').createImageData(width, height),
      ans = imageData.data,//new Uint8Array((width + 2 * lmax) * (height + 2 * lmax)* 4),
      rand = Math.random;

  for (var i = 0, l = (width + 2 * lmax) * (height + 2 * lmax); i < l; ++i) {
    var idx = i * 4,
        val = rand() >= 0.5 ? 255 : 0;

    ans[idx] = ans[idx + 1] = ans[idx + 2] = val;
    ans[idx + 3] = 255;
  }

  return imageData;
}

function createCoordinatesTextureArray(index) {
  var imageData = document.createElement('canvas').getContext('2d').createImageData(width, height),
      ans = imageData.data,//new Uint8Array(width * height * 4),
      rand = Math.random;

  for (var i = 0, l = width * height; i < l; ++i) {
    var idx = i * 4,
        value = rand(),
        val = packFloatToRGBA(value);

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

//create texture arrays
var noise = createWhiteNoiseTextureArray();
var cx = createCoordinatesTextureArray(function(i) { return (i % width); });
var cy = createCoordinatesTextureArray(function(i) { return Math.floor(i / width); });

function init() {

  var canvas = document.getElementById('canvas');
  canvas.width = width;
  canvas.height = height;

  PhiloGL('canvas', {
    program: [{
      path: 'shaders/',
      id: 'coord-integration',
      vs: 'postprocess.vs.glsl',
      fs: 'ci.fs.glsl',
      from: 'uris',
      noCache: true
    }, {
      path: 'shaders/',
      id: 'Np',
      vs: 'postprocess.vs.glsl',
      fs: 'np.fs.glsl',
      from: 'uris',
      noCache: true
    }, {
      path: 'shaders/',
      id: 'Na',
      vs: 'postprocess.vs.glsl',
      fs: 'na.fs.glsl',
      from: 'uris',
      noCache: true
    }],
    onError: function(e) {
      console.log(e);
    },
    onLoad: function(app) {
      var gl = app.gl,
          program = app.program,
          canvas = app.canvas;

      app.setFrameBuffer('N', {
        width: width, //+ lmax * 2,
        height: height, //+ lmax * 2,
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

      app.setFrameBuffer('Np', {
        width: width,
        height: height,
        bindToTexture: {}
      });

      app.setFrameBuffer('Na', {
        width: width,
        height: height,
        bindToTexture: {}
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
        Media.Image.postProcess({
          fromTexture: ['cx-texture', 'cy-texture'],
          toFrameBuffer: 'cx',
          program: 'coord-integration',
          uniforms: uniforms({ cx: 1 })
        }).postProcess({
          fromTexture: ['cx-texture', 'cy-texture'],
          toFrameBuffer: 'cy',
          program: 'coord-integration',
          uniforms: uniforms({ cx: 0 })
        }).postProcess({
          fromTexture: ['cx-texture', 'cy-texture', noiseTex ? 'N-texture' : 'Np-texture'],
          toFrameBuffer: 'Na',
          program: 'Na',
          uniforms: uniforms()
        }).postProcess({
          fromTexture: ['cx-texture', 'cy-texture', noiseTex ? 'N-texture' : 'Np-texture'],
          toFrameBuffer: noiseTex ? 'Np' : 'N',
          toScreen: true,
          program: 'Np',
          uniforms: uniforms()
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
