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
uniform float enable;
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

  float cx = texture2D(sampler1, vTexCoord1).x;
  float cy = texture2D(sampler2, vTexCoord1).x;

  float cpx = cx / width;// * rw;
  float cpy = cy / height;// * rh;
  vec4 texel;
  vec2 pixel = vec2(cpx, cpy);

  //4.5 Edge Treatment
  if (cx > width || cx < 0.
   || cy > height || cy < 0.) {
    /*//out of bounds. inject transparent.*/
    texel = vec4(0);
  } else {
    texel = texture2D(sampler3, pixel);
  }

  //5.3 diffusion correction
  texel = (texel - .5) / (sharpness * (2. * abs(texel - .5) -1.) + 1.) + .5;

  vec4 background = texture2D(sampler4, vTexCoord1);

  /*if (enable > -0.99) {*/
    /*background = vec4(0);*/
  /*}*/

  /*gl_FragColor = mix(texel, background, 0.5);*/
  gl_FragColor = texel;
}
