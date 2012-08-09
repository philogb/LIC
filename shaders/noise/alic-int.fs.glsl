#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTexCoord1;

uniform sampler2D sampler1;
uniform sampler2D sampler2;
uniform sampler2D sampler3;

uniform float width;
uniform float height;
uniform float vWidth;
uniform float vHeight;
uniform float vmax;
uniform float lmax;
uniform float cxFlag;
uniform float maxDim;
uniform float sgn;

//4.3 Coordinate Integration
void main(void) {
  float rwv = (vWidth - 1.) / width;
  float rhv = (vHeight - 1.) / height;

  float cx = texture2D(sampler1, vTexCoord1).x;
  float cy = texture2D(sampler2, vTexCoord1).x;

  float val;
  vec2 coord = vec2( rwv * cx, rhv * cy );
  float v = texture2D(sampler3, coord).x;
  if (cxFlag == 1.0) {
    val = mod(cx + sgn * v + width, width);
  } else {
    val = mod(cy + sgn * v + height, height);
  }
  gl_FragColor = vec4(val);
}
