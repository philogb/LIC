#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTexCoord1;

uniform sampler2D sampler1;
uniform sampler2D sampler2;

uniform float width;
uniform float height;
uniform float vWidth;
uniform float vHeight;
uniform float vmax;
uniform float lmax;

//4.3 Coordinate Integration
void main(void) {
  float rwv = (vWidth - 1.) / width;
  float rhv = (vHeight - 1.) / height;
  float h = lmax / vmax;

  vec4 texel = texture2D(sampler1, vTexCoord1);
  float cx = texel.x;
  float cy = texel.y;

  //5.2 Dye Advection RK2
  texel = texture2D(sampler2, vTexCoord1);
  float vx0 = texel.x;
  float vy0 = texel.y;

  float cxx = (cx + h / 2. * vx0) / width;
  float cyy = (cy + h / 2. * vy0) / height;

  texel = texture2D(sampler2, vec2(cxx, cyy));
  float vx1 = texel.x;
  float vy1 = texel.y;

  float valx = cx + h * vx1;
  float valy = cy + h * vy1;

  gl_FragColor = vec4(valx, valy, 0, 0);
}
