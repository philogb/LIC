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

//4.8 Coordinate Re-Initialization
void main(void) {
  vec2 coord = gl_FragCoord.xy / vec2(width, height);

  float idx;
  if (cxFlag == 1.0) {
    idx = gl_FragCoord.x;
  } else {
    idx = gl_FragCoord.y;
  }

  vec4 cPacked = texture2D(sampler1, coord);
  float c = unpackFloatFromVec4i(cPacked) * maxDim;
  float ci = fract(c) + idx;
  gl_FragColor = packFloatToVec4i(ci / maxDim);
}

