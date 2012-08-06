#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTexCoord1;

uniform sampler2D sampler1;
uniform sampler2D sampler2;
uniform sampler2D sampler3;
uniform sampler2D sampler4;
uniform sampler2D sampler5;
uniform sampler2D sampler6;

uniform float width;
uniform float height;
uniform float vWidth;
uniform float vHeight;
uniform float vmax;
uniform float lmax;
uniform float maxDim;

vec2 field(vec2 point) {
  vec2 tpoint = point - vec2(width, height) / 2.;
  return vec2(-tpoint.y, tpoint.x);
}

//electric dipole
/*vec2 field(vec2 point, float t) {*/
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

void main(void) {
  float x = gl_FragCoord.x;
  float y = gl_FragCoord.y;
  float b = lmax;

  vec2 coord = gl_FragCoord.xy / vec2(width, height);
  vec4 cxPacked = texture2D(sampler1, coord);
  float cx = unpackFloatFromVec4i(cxPacked) * maxDim;
  vec4 cyPacked = texture2D(sampler2, coord);
  float cy = unpackFloatFromVec4i(cyPacked) * maxDim;


  float cpx = cx / width;
  float cpy = cy / height;
  vec2 pixel = vec2(cpx, cpy);
  vec4 texel;

  //4.5 Edge Treatment
  if (cxPacked.r == 1. && cxPacked.g == 0.
   || cyPacked.r == 1. && cyPacked.g == 0.) {
    //out of bounds. inject random white noise.
    texel = texture2D(sampler5, pixel);
  } else {
    texel = texture2D(sampler3, pixel);
  }

  //4.7 Noise Injection
  if (texture2D(sampler6, pixel).r > 0.5) {
    /*texel = vec4(1. - texel.rgb, 1.);*/
    texel = 1. - texel;
  }

  //4.10.2 Velocity Mask
  const float m = 1.;
  const float n = 1.;
  float ratio = min(length(field(vec2(cx, cy))) / vmax, 1.);
  vec4 alpha = (1. - pow(1. - ratio, m)) * (1. - pow(1. - texel, vec4(n)));
  texel = alpha;

  //4.9 Noise Blending
  vec4 blendValue = texture2D(sampler4, vTexCoord1);

  gl_FragColor = mix(texel, blendValue, 0.96);
}

