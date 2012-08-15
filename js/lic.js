(function () {

//utility functions
var $ = function(d) { return document.getElementById(d); },
    $$ = function(d) { return document.querySelectorAll(d); };

//algorithm params
var h = 0.5,
    L = 20,
    M = 10,
    width = 300,
    height = 300,
    minNumHits = 5,
    offset = 0,
    //intensity data
    Idata, numHits, texdata;

//white noise texture data
texdata = new Float32Array(width * height);
//generate white noise
for (var i = 0, l = texdata.length; i < l; ++i) {
  texdata[i] = Math.random();
}

//initialize data
function initializeVectors() {
  //intensity data
  Idata = new Float32Array(width * height);
  //pixel hit data
  numHits = new Uint32Array(width * height);

}

//vector
function vec2(x, y) {
  return [x, y];
}

Array.prototype.add = function(v) {
  return [this[0] + v[0], this[1] + v[1]];
};

Array.prototype.scale = function(s) {
  return [this[0] * s, this[1] * s];
};

Array.prototype.$add = function(v) {
  this[0] += v[0];
  this[1] += v[1];
  return this;
};

Array.prototype.$scale = function(s) {
  this[0] *= s;
  this[1] *= s;
  return this;
};

//vector field definition
var field = function(v2) {
  var x = v2[0] - width / 2,
      y = v2[1] - height / 2,
      norm = Math.sqrt(x * x + y * y);

  if (norm == 0) {
    return vec2(0, 0);
  }

  return vec2(-y / norm, x / norm);
};

function init() {
  var canvas = $('canvas'),
      ctx = canvas.getContext('2d');

  canvas.width = width;
  canvas.height = height;

  //canvas.addEventListener('mousemove', function(e) {
    //var bb = canvas.getBoundingClientRect(),
        //x = e.clientX - bb.left,
        //y = e.clientY - bb.top,
        //stream = computeStreamLine(x + h, y + h);

    //renderStreamLine(ctx, stream);
  //});

  initializeVectors();
  computeLIC();
  renderLIC(ctx);
}


function inBounds(p) {
  return p[0] >= 0 && p[0] < width && p[1] >= 0 && p[1] < height;
}

function texCoord(p) {
  return texdata[p[0] + p[1] * width];
}

function I(streamLine) {
  var l = streamLine.length,
      n = L,
      mid = ((l / 2) >> 0) + offset,
      x0 = streamLine[mid],
      k = 0;

  //compute integral for center of streamline
  for (var i = -n, Ix0 = 0; i < n; ++i) {
    var xi = streamLine[mid + i];
    if (inBounds(xi)) {
      Ix0 += texCoord(xi);
      k++;
    }
  }
  Ix0 /= k;

  Idata[x0[0] + x0[1] * width] += Ix0;
  numHits[x0[0] + x0[1] * width]++;

  var IxFwd = Ix0,
      IxBwd = Ix0;
  //compute integral for left and right points along the streamline
  for (var i = 1; i < M; ++i) {
    //compute fwd integral
    var iFwd = i + mid,
        iFwdRight = iFwd + n + 1,
        iFwdLeft  = iFwd - n,
        xFwd = streamLine[iFwd];

    if (iFwdLeft >= 0 && iFwdRight < l) {
      var xFwdLeft = streamLine[iFwdLeft],
          xFwdRight = streamLine[iFwdRight];

      if (inBounds(xFwdLeft) && inBounds(xFwdRight)) {
        IxFwd += (texCoord(xFwdRight) - texCoord(xFwdLeft)) / k;
        Idata[xFwd[0] + xFwd[1] * width] += IxFwd;
        numHits[xFwd[0] + xFwd[1] * width]++;
      }
    }

    //compute bwd integral
    var iBwd = -i + mid,
        iBwdRight = iBwd - n - 1,
        iBwdLeft  = iBwd + n,
        xBwd = streamLine[iBwd];

    if (iBwdRight >= 0 && iBwdLeft < l) {
      var xBwdLeft = streamLine[iBwdLeft],
          xBwdRight = streamLine[iBwdRight];

      if (inBounds(xBwdLeft) && inBounds(xBwdRight)) {
        IxBwd += (texCoord(xBwdRight) - texCoord(xBwdLeft)) / k;
        Idata[xBwd[0] + xBwd[1] * width] += IxBwd;
        numHits[xBwd[0] + xBwd[1] * width]++;
      }
    }
  }
}

function computeStreamLine(x, y) {
  var fwd = [],
      bwd = [],
      f = vec2(x, y),
      b = vec2(x, y);

  for (var i = 0; i < L + M -1; ++i) {
    f = RK(f,  h);
    fwd[i] = f;

    b = RK(b, -h);
    bwd[i] = b;
  }

  bwd.reverse();
  bwd.push.apply(bwd, fwd);

  //convert to pixel
  for (var i = 0, l = bwd.length; i < l; ++i) {
    var p = bwd[i];
    p[0] >>= 0;
    p[1] >>= 0;
  }
  return bwd;
}

function RK(p, h) {
  var v = field(p),
      k1, k2, k3, k4;

  k1 = v.$scale(h);

  v = field(p.add(k1.scale(0.5)));
  k2 = v.$scale(h);

  v = field(p.add(k2.scale(0.5)));
  k3 = v.$scale(h);

  v = field(p.add(k3));
  k4 = v.$scale(h);

  p = p.add(k1.$scale(1/6).$add(k2.$scale(1/3)).$add(k3.$scale(1/3)).$add(k4.$scale(1/6)));

  return p;
}

function renderStreamLine(ctx, stream) {
  ctx.lineWidth = 0.8;
  ctx.strokeStyle = '#ccc';

  ctx.beginPath();
  ctx.moveTo.apply(ctx, stream[0]);
  for (var i = 1, l = stream.length; i < l; ++i) {
    ctx.lineTo.apply(ctx, stream[i]);
  }
  ctx.closePath();
  ctx.stroke();
}

function computeLIC() {
  //compute LICs
  var w2 = width / 2,
      h2 = height / 2;
  for (var i = 0; i < w2 * h2; i++) {
    var p1x = i % w2,
        p1y = (i / w2) >> 0,
        p2x = (i % w2) + w2,
        p2y = p1y,
        p3x = p1x,
        p3y = ((i / w2) >> 0) + h2,
        p4x = p2x,
        p4y = p3y,
        streamLine;

    if (numHits[p1x + p1y * width] < minNumHits) {
      streamLine = computeStreamLine(p1x, p1y);
      I(streamLine);
    }
    if (numHits[p2x + p2y * width] < minNumHits) {
      streamLine = computeStreamLine(p2x, p2y);
      I(streamLine);
    }
    if (numHits[p3x + p3y * width] < minNumHits) {
      streamLine = computeStreamLine(p3x, p3y);
      I(streamLine);
    }
    if (numHits[p4x + p4y * width] < minNumHits) {
      streamLine = computeStreamLine(p4x, p4y);
      I(streamLine);
    }
  }

  //normalize LICs
  for (var i = 0; i < width * height; ++i) {
    Idata[i] /= (numHits[i] || 1);
  }
}

function renderLIC(ctx) {
  var imageData = ctx.createImageData(width, height),
      data = imageData.data;

  for (var i = 0; i < width * height; ++i) {
    var i4 = i * 4,
        gray = (Idata[i] * 255) >> 0;

    data[i4    ] = gray;
    data[i4 + 1] = gray;
    data[i4 + 2] = gray;
    data[i4 + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);
}

window.addEventListener('DOMContentLoaded', init);

})();
