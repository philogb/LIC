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

void main(void) {
  float x = gl_FragCoord.x;
  float y = gl_FragCoord.y;
  float rw = (width - 1.) / width;
  float rh = (height - 1.) / height;

  vec4 texel = texture2D(sampler1, vTexCoord1);
  float cx = texel.x;
  float cy = texel.y;

  float cpx = cx / width;
  float cpy = cy / height;
  vec2 pixel = vec2(cpx, cpy);

  //4.5 Edge Treatment
  texel = texture2D(sampler2, pixel);
  vec4 background = texture2D(sampler3, vTexCoord1);
  gl_FragColor = texel;
}
