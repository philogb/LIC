PhiloGL.unpack();

var width = 512,
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

      setCamera(app);

      app.setTexture('image', {
        width: width,
        height: height,
        data: {
          value: img
        }
      });

      function draw() {
        Media.Image.postProcess({
          width: canvas.width,
          height: canvas.height,
          aspectRatio: 1,
          fromTexture: 'background',
          toScreen: true,
          program: 'sobel',
          uniforms: {
            type: type,
            width: width,
            height: height
          }
        });
      }

      Fx.requestAnimationFrame(function loop() {
        if (setCamera.canvas) {
          updateBackground(setCamera.video, setCamera.canvas, setCamera.ctx, app);
          draw();
        }
        Fx.requestAnimationFrame(loop);
      });
    }
  });
}

function setCamera(app) {
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
  window.URL = window.URL || window.webkitURL;

  if (navigator.getUserMedia) {
    var video = document.createElement('video');
    video.style.visibility = 'hidden';
    video.style.position = 'absolute';
    video.style.left = '-1000px';
    document.body.appendChild(video);
    video.autoplay = true;
    video.addEventListener('play', function() {
      console.log(video.offsetWidth, video.offsetHeight);

      var canvas = document.createElement('canvas');
      document.body.appendChild(canvas);
      app.canvas.width = canvas.width = video.offsetWidth;
      app.canvas.height = canvas.height = video.offsetHeight;
      canvas.style.display = 'none';
      var ctx = canvas.getContext('2d');

      setCamera.canvas = canvas;
      setCamera.video = video;
      setCamera.ctx = ctx;

    });

    navigator.getUserMedia({ video: true }, function(stream) {
      var url = window.URL.createObjectURL(stream);
      video.src = url;

    }, function() { console.log('error'); });
  }
}

function updateBackground(video, canvas, ctx, app) {
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  var gl = app.gl;

  app.setTexture('background', {
    data: {
      value: ctx.getImageData(0, 0, width, height)
    }
  });
}


window.addEventListener('DOMContentLoaded', function loadImage() {
  var img = new Image();
  img.src = 'img/flowers.jpg';
  img.onload = function() { init(img); };
});

