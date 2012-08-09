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

//4.3 Coordinate Integration
void main(void) {
  float rwv = (vWidth - 1.) / width;
  float rhv = (vHeight - 1.) / height;
  float h = lmax / vmax;

  vec4 cxPacked = texture2D(sampler1, vTexCoord1);
  float cx = unpackFloatFromVec4i(cxPacked) * maxDim;

  vec4 cyPacked = texture2D(sampler2, vTexCoord1);
  float cy = unpackFloatFromVec4i(cyPacked) * maxDim;

  //5.2 Dye Advection RK2
  float vx0 = (unpackFloatFromVec4i(texture2D(sampler3, vTexCoord1)) - .5) * maxDim * 2.;
  float vy0 = (unpackFloatFromVec4i(texture2D(sampler4, vTexCoord1)) - .5) * maxDim * 2.;

  float cxx = (cx + h / 2. * vx0) / width;
  float cyy = (cy + h / 2. * vy0) / height;

  float vx1 = (unpackFloatFromVec4i(texture2D(sampler3, vec2(cxx, cyy))) - .5) * maxDim * 2.;
  float vy1 = (unpackFloatFromVec4i(texture2D(sampler4, vec2(cxx, cyy))) - .5) * maxDim * 2.;

  float val;
  if (cxFlag == 1.0) {
    val = cx + h * vx1;
    gl_FragColor = cxPacked;
    return;
    //4.4 Noise Advection
    if (val < 0. || val > width) {
      val = cx;
    }
  } else {
    val = cy + h * vy1;
    gl_FragColor = cyPacked;
    return;
    //4.4 Noise Advection
    if (val < 0. || val > height) {
      val = cy;
    }
  }
  gl_FragColor = packFloatToVec4i(val / maxDim);
}
