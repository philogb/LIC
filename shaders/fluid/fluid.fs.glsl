#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTexCoord1;
uniform sampler2D sampler1;

uniform float width;
uniform float height;
uniform vec4 mouse;

void main(void) {
  vec2 xy = gl_FragCoord.xy;
  vec2 mousePos = mouse.xy;
  vec2 mouseSpeed = mouse.zw;
  vec2 v = texture2D(sampler1, vTexCoord1).xy;
  float d = distance(mousePos, xy);

	if(length(mouseSpeed) > 0.) {
		v = mix(v, mouseSpeed * 50., clamp(1. / d, 0., 1.));
  }

  gl_FragColor = vec4(v.x, v.y, 0, 0);
}
