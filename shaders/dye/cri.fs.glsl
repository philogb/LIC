#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTexCoord1;
uniform sampler2D sampler1;

uniform float width;
uniform float height;
uniform int init;

//4.8 Coordinate Re-Initialization
void main(void) {
  vec2 coord = vTexCoord1;

  float idx = gl_FragCoord.x, idy = gl_FragCoord.y;
  vec4 texel = texture2D(sampler1, coord);
  float cx = texel.x;
  float cy = texel.y;
  if (init == 0) {
    idx += fract(cx) / 10.;
    idy += fract(cy) / 10.;
  }

  gl_FragColor = vec4(idx, idy, 0, 0);
}

