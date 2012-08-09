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

void main(void) {
  float x = gl_FragCoord.x;
  float y = gl_FragCoord.y;
  float b = lmax;

  float rw = (width - 1.) / width;
  float rh = (height - 1.) / height;

  vec2 coord = vTexCoord1;
  float cx = texture2D(sampler1, coord).x;
  float cy = texture2D(sampler2, coord).x;

  float cpx = cx / width * rw;
  float cpy = cy / height * rh;
  vec2 pixel = vec2(cpx, cpy);

  float vx = texture2D(sampler6, pixel).x;
  float vy = texture2D(sampler7, pixel).x;
  vec2 field = vec2(vx, vy);

  vec4 texel;
  //4.5 Edge Treatment
  if (cx > width || cx < 0.
   || cy > height || cy < 0.) {
    //out of bounds. inject transparency.
    texel = vec4(0);
  } else {
    texel = texture2D(sampler3, pixel);
  }

  //5.3 diffusion correction
  texel = (texel - .5) / (sharpness * (2. * abs(texel - .5) -1.) + 1.) + .5;

  //4.10.2 Velocity Mask
  /*const float m = 5.;*/
  /*const float n = 1.;*/
  /*float ratio = min(length(field) / vmax, 1.);*/
  /*vec4 alpha = (1. - pow(1. - ratio, m)) * (1. - pow(1. - texel, vec4(n)));*/
  /*texel = alpha;*/

  //4.9 Noise Blending
  vec4 blendValue = texture2D(sampler4, vTexCoord1);
  gl_FragColor = mix(texel, blendValue, 0.95);
}

