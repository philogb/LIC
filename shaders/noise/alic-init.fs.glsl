#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTexCoord1;

uniform sampler2D sampler1;
uniform float r;

//4.3 Coordinate Integration
void main(void) {
  vec4 vPacked = texture2D(sampler1, vTexCoord1);
  gl_FragColor = vPacked * r;
}
