varying vec2 vTexcoord;

varying vec3 vColor;

uniform sampler2D uTexture;
uniform vec3 uLightPosition_ws;

void main() {
  gl_FragColor.rgb = vColor;
  gl_FragColor.a = 1.0;
}