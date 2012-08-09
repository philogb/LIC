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
uniform sampler2D sampler7;

uniform float width;
uniform float height;
uniform float vWidth;
uniform float vHeight;
uniform float vmax;
uniform float lmax;
uniform float maxDim;
uniform float sharpness;

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

  float rw = (width - 1.) / width;
  float rh = (height - 1.) / height;

  vec2 coord = vTexCoord1;
  vec4 cxPacked = texture2D(sampler1, coord);
  float cx = unpackFloatFromVec4i(cxPacked) * maxDim;
  vec4 cyPacked = texture2D(sampler2, coord);
  float cy = unpackFloatFromVec4i(cyPacked) * maxDim;

  float cpx = cx / width * rw;
  float cpy = cy / height * rh;
  vec2 pixel = vec2(cpx, cpy);

  float vx = (unpackFloatFromVec4i(texture2D(sampler6, pixel)) - .5) * maxDim * 2.;
  float vy = (unpackFloatFromVec4i(texture2D(sampler7, pixel)) - .5) * maxDim * 2.;
  vec2 field = vec2(vx, vy);

  vec4 texel;
  //4.5 Edge Treatment
  if (cxPacked.r == 1. && cxPacked.g == 0.
   || cyPacked.r == 1. && cyPacked.g == 0.) {
    //out of bounds. inject transparency.
    texel = vec4(0);
  } else {
    texel = texture2D(sampler3, pixel);
  }

  //5.3 diffusion correction
  texel = (texel - .5) / (sharpness * (2. * abs(texel - .5) -1.) + 1.) + .5;

  //4.10.2 Velocity Mask
  const float m = 1.;
  const float n = 1.;
  float ratio = min(length(field) / vmax, 1.);
  vec4 alpha = (1. - pow(1. - ratio, m)) * (1. - pow(1. - texel, vec4(n)));
  texel = alpha;

  //4.9 Noise Blending
  vec4 blendValue = texture2D(sampler4, vTexCoord1);
  /*gl_FragColor = 0.2 * texel + 0.96 * blendValue;*/
  gl_FragColor = mix(texel, blendValue, 0.95);
  gl_FragColor = texel;
}

