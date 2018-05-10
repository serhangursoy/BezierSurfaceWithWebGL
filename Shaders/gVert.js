precision mediump float;

attribute vec3 aNormal_ms;
attribute vec4 aVertexPosition_ms;
attribute vec2 aTexcoord;

varying vec3 vColor;

uniform vec3 uLightPosition_ws;

uniform mat4 M;
uniform mat4 V;
uniform mat4 P;

uniform mat3 N;

void main() {
  gl_Position = P * V * M * aVertexPosition_ms;
  vec3 lightPosition_cs = (V * vec4(uLightPosition_ws, 1)).xyz;
  vec3 vertexPosition_cs = (V * M * aVertexPosition_ms).xyz;

  vec3 LightColor = vec3(1, 1, 1);

  vec3 MaterialDiffuseColor = texture2D(uTexture, aTexcoord).rgb;

  vec3 MaterialAmbientColor = 0.9 * MaterialDiffuseColor;

  vec3 MaterialSpecularColor = vec3(0.3, 0.3, 0.3);

  float distance = length(uLightPosition_ws - (M * aVertexPosition_ms).xyz);

  vec3 n = normalize(N * aNormal_ms);
  vec3 l = normalize(lightPosition_cs - vertexPosition_cs);
  vec3 e = normalize(vec3(0, 0, 0) - vertexPosition_cs);
  vec3 r = reflect(-l, n);

  float cosTheta = clamp(dot(n, l), 0.0, 1.0);

  float cosAlpha = clamp(dot(e, r), 0.0, 1.0);

  float LightPower = 4000.0 / (distance * distance);

  float shininess = 35.0;

  vColor = MaterialAmbientColor +
    MaterialDiffuseColor * LightColor * LightPower * cosTheta +
    MaterialSpecularColor * LightColor * LightPower * pow(cosAlpha, shininess);
}