#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTexCoord1;

uniform sampler2D sampler1;

void main(void) {
  gl_FragColor = texture2D(sampler1, vTexCoord1);
}
