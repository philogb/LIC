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

vec2 field(vec2 point) {
  vec2 tpoint = point - vec2(width, height) / 2.;
  return vec2(-tpoint.y, tpoint.x);
}

//electric dipole
/*vec2 field(vec2 point) {*/
  /*vec2 tpoint = (point - vec2(width, height) / 2.) / 50.;*/
  /*const float charge = 1000.;*/
  /*float rq = 10.;*/
  /*vec2 v1 = vec2(rq, 0) - tpoint;*/
  /*float d1 = length(v1);*/
  /*vec2 v2 = vec2(-rq, 0) - tpoint;*/
  /*float d2 = length(v2);*/

  /*if (d1 < 3. || d2 < 3.) {*/
    /*return vec2(0);*/
  /*}*/

  /*v1 = v1 / d1;*/
  /*v2 = v2 / d2;*/

  /*return charge / (d1 * d1) * v1 - charge / (d2 * d2) * v2;*/
/*}*/

//4.3 Coordinate Integration
void main(void) {
  vec2 coord = gl_FragCoord.xy / vec2(width, height);
  float rwv = (vWidth - 1.) / width;
  float rhv = (vHeight - 1.) / height;

  vec4 cxPacked = texture2D(sampler1, coord);
  float cx = unpackFloatFromVec4i(cxPacked) * maxDim;

  vec4 cyPacked = texture2D(sampler2, coord);
  float cy = unpackFloatFromVec4i(cyPacked) * maxDim;

  float val;
  if (cxFlag == 1.0) {
    val = cx - (lmax / vmax) * field(vec2(rwv * cx, rhv * cy)).x;
    //4.4 Noise Advection
    if (val < 0. || val > width) {
      val = cx;
      gl_FragColor = vec4(1., 0, 0, 0);
      return;
    }
  } else {
    val = cy - (lmax / vmax) * field(vec2(rwv * cx, rhv * cy)).y;
    //4.4 Noise Advection
    if (val < 0. || val > height) {
      val = cy;
      gl_FragColor = vec4(1., 0, 0, 0);
      return;
    }
  }
  gl_FragColor = packFloatToVec4i(val / maxDim);
}
