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
uniform float maxDim;
uniform float r;

//4.3 Coordinate Integration
void main(void) {
  float rw = width / (width - 1.);
  float rh = height / (height - 1.);

  float cx = texture2D(sampler1, vTexCoord1).x;
  float cy = texture2D(sampler2, vTexCoord1).x;

  vec4 nb = texture2D(sampler3, vec2(rw * cx / width, rh * cy / height));
  vec4 lic = texture2D(sampler4, vTexCoord1);

  gl_FragColor = lic + r * nb;
}
