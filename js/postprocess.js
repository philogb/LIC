PhiloGL.unpack();

var width = 1024,
    height = 512,
    type = 2;

function init(img) {
  var canvas = document.getElementById('canvas');
  canvas.width = width;
  canvas.height = height;

  PhiloGL('canvas', {
    context: {
      preserveDrawingBuffer: true
    },
    program: [{
      from: 'uris',
      path: 'shaders/post/',
      id: 'sobel',
      vs: 'postprocess.vs.glsl',
      fs: 'sobel.fs.glsl',
      noCache: true
    }],
    onError: function(e) {
      throw e;
    },
    onLoad: function(app) {
      var gl = app.gl,
          program = app.program,
          canvas = app.canvas;

      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      app.setTexture('image', {
        width: width,
        height: height,
        data: {
          value: img
        }
      });

      function draw() {
        Media.Image.postProcess({
          aspectRatio: 1,
          fromTexture: [ 'image' ],
          toScreen: true,
          program: 'sobel',
          uniforms: {
            type: type,
            width: width,
            height: height
          }
        });
      }

      //Fx.requestAnimationFrame(function loop() {
        draw();
        //var pixels = new Uint8Array(width * height * 4);
        //Fx.requestAnimationFrame(loop);
      //});
    }
  });
}


window.addEventListener('DOMContentLoaded', function loadImage() {
  var img = new Image();
  img.src = 'img/flowers.jpg';
  img.onload = function() { init(img); };
});

