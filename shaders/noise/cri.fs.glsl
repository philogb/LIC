#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTexCoord1;
uniform sampler2D sampler1;

uniform float width;
uniform float height;
uniform float vWidth;
uniform float vHeight;
uniform float vmax;
uniform float lmax;
uniform float cxFlag;
uniform float maxDim;
uniform float time;

//4.8 Coordinate Re-Initialization
void main(void) {
  vec2 coord = gl_FragCoord.xy / vec2(width, height);

  float idx;
  if (cxFlag == 1.0) {
    idx = gl_FragCoord.x;
  } else {
    idx = gl_FragCoord.y;
  }

  float c = texture2D(sampler1, coord).x;
  float ci = fract(c) + idx;
  gl_FragColor = vec4(ci);
}


