#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTexCoord1;

uniform sampler2D sampler1;
uniform sampler2D sampler2;
uniform sampler2D sampler3;
uniform sampler2D sampler4;
uniform sampler2D sampler5;

uniform float width;
uniform float height;
uniform float vWidth;
uniform float vHeight;
uniform float vmax;
uniform float lmax;
uniform float maxDim;
uniform float timer;

float rand(vec2 co){
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void main(void) {
  float x = gl_FragCoord.x;
  float y = gl_FragCoord.y;
  float b = lmax;
  float rw = (width - 1.) / width;
  float rh = (height - 1.) / height;

  float cx = texture2D(sampler1, vTexCoord1).x;
  float cy = texture2D(sampler2, vTexCoord1).x;

  float cpx = floor(cx) / width * rw;
  float cpy = floor(cy) / height * rh;
  vec4 texel;
  vec2 pixel = vec2(cpx, cpy);

  //4.5 Edge Treatment
  if (cx > width || cx < 0.
   || cy > height || cy < 0.) {
    //out of bounds. inject random white noise.
    texel = texture2D(sampler4, rand(pixel + mod(timer, 37.)) * pixel);
    /*texel = texture2D(sampler4, pixel);*/
  } else {
    texel = texture2D(sampler3, pixel);
  }

  //4.7 Noise Injection
  if (texture2D(sampler5, rand(pixel + mod(timer, 37.)) * pixel).r > 0.5) {
    texel = vec4(vec3(1. - texel.rgb), 1);
  }

  /*gl_FragColor = mix(texel, background, 0.5);*/
  gl_FragColor = texel;
}
