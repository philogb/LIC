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

// Packing a [0-1] float value into a 4D vector where each component will be a 8-bits integer
vec4 packFloatToVec4i(const float value) {
   const vec4 bitSh = vec4(256.0 * 256.0 * 256.0, 256.0 * 256.0, 256.0, 1.0);
   const vec4 bitMsk = vec4(0.0, 1.0 / 256.0, 1.0 / 256.0, 1.0 / 256.0);
   vec4 res = fract(value * bitSh);
   res -= res.xxyz * bitMsk;
   return res;
}

// Unpacking a [0-1] float value from a 4D vector where each component was a 8-bits integer
float unpackFloatFromVec4i(const vec4 value){
   const vec4 bitSh = vec4(1.0 / (256.0 * 256.0 * 256.0), 1.0 / (256.0 * 256.0), 1.0 / 256.0, 1.0);
   return(dot(value, bitSh));
}

float lerpInTexture(float delta) {
  return lmax / (width + 2. * lmax) + delta * width / (width + 2. * lmax);
}

void main(void) {
  float x = gl_FragCoord.x;
  float y = gl_FragCoord.y;
  float b = lmax;

  vec2 coord  =  gl_FragCoord.xy / vec2(width, height);

  float cpx = (gl_FragCoord.x + unpackFloatFromVec4i(texture2D(sampler1, coord))) / width;
  float cpy = (gl_FragCoord.y + unpackFloatFromVec4i(texture2D(sampler2, coord))) / height;

  cpx = lerpInTexture(cpx);
  cpy = lerpInTexture(cpy);

  gl_FragColor = texture2D(sampler3, vec2(cpx, cpy));
}

