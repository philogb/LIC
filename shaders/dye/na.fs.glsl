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
uniform float sharpness;

void main(void) {
  float x = gl_FragCoord.x;
  float y = gl_FragCoord.y;
  float b = lmax;

  float rw = (width - 1.) / width;
  float rh = (height - 1.) / height;

  vec2 coord = vTexCoord1;
  vec4 texel = texture2D(sampler1, coord);
  float cx = texel.x;
  float cy = texel.y;

  float cpx = cx / width * rw;
  float cpy = cy / height * rh;
  vec2 pixel = vec2(cpx, cpy);

  texel = texture2D(sampler4, pixel);
  float vx = texel.x;
  float vy = texel.y;
  vec2 field = vec2(vx, vy);

  //4.5 Edge Treatment
  if (cx > width || cx < 0.
   || cy > height || cy < 0.) {
    //out of bounds. inject transparency.
    texel = vec4(0);
  } else {
    texel = texture2D(sampler2, pixel);
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
  vec4 blendValue = texture2D(sampler3, vTexCoord1);
  gl_FragColor = mix(texel, blendValue, 0.95);
}

