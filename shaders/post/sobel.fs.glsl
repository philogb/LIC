#ifdef GL_ES
precision highp float;
#endif

#define PI 3.1415926535
#define PI2 6.28318530717959

varying vec2 vTexCoord1;
uniform sampler2D sampler1;

uniform float width;
uniform float height;
uniform int type;

void main(void) {
  const mat3 Gx = mat3(-1, 0, 1, -2, 0, 2, -1, 0, 1);
  const mat3 Gy = mat3(-1, -2, -1, 0, 0, 0, 1, 2, 1);
//  const mat3 id = mat3(1, 0, 0, 0, 0, 0, 0, 0, 0);
  vec2 dim = vec2(width, height);

  vec2 p = gl_FragCoord.xy;

  vec2 x0y0 = (p + vec2(-1, -1)) / dim;
  vec2 x0y1 = (p + vec2(-1,  0)) / dim;
  vec2 x0y2 = (p + vec2(-1,  1)) / dim;

  vec2 x1y0 = (p + vec2(0, -1)) / dim;
  vec2 x1y1 = (p + vec2(0,  0)) / dim;
  vec2 x1y2 = (p + vec2(0,  1)) / dim;

  vec2 x2y0 = (p + vec2(1, -1)) / dim;
  vec2 x2y1 = (p + vec2(1,  0)) / dim;
  vec2 x2y2 = (p + vec2(1,  1)) / dim;

  vec4 tx0y0 = texture2D(sampler1, x0y0);
  vec4 tx0y1 = texture2D(sampler1, x0y1);
  vec4 tx0y2 = texture2D(sampler1, x0y2);

  vec4 tx1y0 = texture2D(sampler1, x1y0);
  vec4 tx1y1 = texture2D(sampler1, x1y1);
  vec4 tx1y2 = texture2D(sampler1, x1y2);

  vec4 tx2y0 = texture2D(sampler1, x2y0);
  vec4 tx2y1 = texture2D(sampler1, x2y1);
  vec4 tx2y2 = texture2D(sampler1, x2y2);

  mat3 id = Gx;

  vec4 colorGx = id[0][0] * tx0y0 + id[0][1] * tx1y0 + id[0][2] * tx2y0 +
                 id[1][0] * tx0y1 + id[1][1] * tx1y1 + id[1][2] * tx2y1 +
                 id[2][0] * tx0y2 + id[2][1] * tx1y2 + id[2][2] * tx2y2;

  id = Gy;

  vec4 colorGy = id[0][0] * tx0y0 + id[0][1] * tx1y0 + id[0][2] * tx2y0 +
                 id[1][0] * tx0y1 + id[1][1] * tx1y1 + id[1][2] * tx2y1 +
                 id[2][0] * tx0y2 + id[2][1] * tx1y2 + id[2][2] * tx2y2;

  /*float fColorGx = (colorGx.r + colorGx.g + colorGx.b + colorGx.a) / 4.;*/
  /*float fColorGy = (colorGy.r + colorGy.g + colorGy.b + colorGy.a) / 4.;*/

  float fColorGx = colorGx.r;
  float fColorGy = colorGy.r;

  float norm = sqrt(fColorGx * fColorGx + fColorGy * fColorGy);
  float angle = atan(fColorGy, fColorGx) + PI;
  angle /= PI2;

  if (type == 0) {
    gl_FragColor = sqrt(colorGx * colorGx + colorGy * colorGy);
  } else if (type == 1) {
    gl_FragColor = colorGx;
  } else if (type == 2) {
    gl_FragColor = colorGy;
  }
  gl_FragColor = vec4(norm, /*angle*/, 0, 0);

}
