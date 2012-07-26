#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTexCoord1;

uniform sampler2D sampler1;
uniform sampler2D sampler2;

uniform float width;
uniform float height;
uniform float vWidth;
uniform float vHeight;
uniform float vmax;
uniform float lmax;
uniform float cxFlag;

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

vec2 field(vec2 point) {
  vec2 tpoint = point - vec2(width, height) / 2.;
  float norm = length(tpoint);

  if (norm < 1e-5) {
    return vec2(0);
  }

  return vec2(-tpoint.y, tpoint.x) / norm;
}

void main(void) {
  vec2 coord = gl_FragCoord.xy / vec2(width, height);
  float rwv = (vWidth - 1.) / width;
  float rhv = (vHeight - 1.) / height;
  float maxDim = max(width, height) + 1.;

  vec4 cxPacked = texture2D(sampler1, coord);
  float cx = unpackFloatFromVec4i(cxPacked) * maxDim;

  vec4 cyPacked = texture2D(sampler2, coord);
  float cy = unpackFloatFromVec4i(cyPacked) * maxDim;

  float val;
  if (cxFlag == 1.0) {
    val = cx - (lmax / vmax) * field(vec2(rwv * cx, rhv * cy)).x;
    if (val < 0. || val > width) {
      val = cx;
    }
  } else {
    val = cy - (lmax / vmax) * field(vec2(rwv * cx, rhv * cy)).y;
    if (val < 0. || val > height) {
      val = cy;
    }
  }
  gl_FragColor = packFloatToVec4i(val / maxDim);
}
