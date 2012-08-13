#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTexCoord1;
uniform sampler2D sampler1;

void main(void) {
  vec2 v = texture2D(sampler1, vTexCoord1).xy;
  const float deg = 0.94;
  gl_FragColor = vec4(v.x * deg, v.y * deg, 0, 0);
}

