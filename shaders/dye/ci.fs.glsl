#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTexCoord1;

uniform sampler2D sampler1;
uniform sampler2D sampler2;
uniform sampler2D sampler3;
uniform sampler2D sampler4;

uniform float width;
uniform float height;
uniform float vWidth;
uniform float vHeight;
uniform float vmax;
uniform float lmax;
uniform float cxFlag;

//4.3 Coordinate Integration
void main(void) {
  float rwv = (vWidth - 1.) / width;
  float rhv = (vHeight - 1.) / height;
  float h = lmax / vmax;

  float cx = texture2D(sampler1, vTexCoord1).x;
  float cy = texture2D(sampler2, vTexCoord1).x;

  //5.2 Dye Advection RK2
  float vx0 = texture2D(sampler3, vTexCoord1).x;
  float vy0 = texture2D(sampler4, vTexCoord1).x;

  float cxx = (cx + h / 2. * vx0) / width;
  float cyy = (cy + h / 2. * vy0) / height;

  float vx1 = texture2D(sampler3, vec2(cxx, cyy)).x;
  float vy1 = texture2D(sampler4, vec2(cxx, cyy)).x;

  float val;
  if (cxFlag == 1.0) {
    val = cx + h * vx1;
  } else {
    val = cy + h * vy1;
  }
  gl_FragColor = vec4(val);
}
