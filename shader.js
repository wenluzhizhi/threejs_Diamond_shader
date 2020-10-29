const backMaterial_vert = `
varying vec3 uv2;
uniform float cameraWorldPos[3];
vec3 refract2(const in vec3 i, const in vec3 n, const in float eta)
{
  float cosi = dot(i * -1.0, n);
  float cost2 = 1.0 - eta * eta * (1.0 - cosi * cosi);
  vec3 t = eta * i + n * (eta * cosi - sqrt(cost2));
  if (cost2 > 0.0) {
    return t;
  } else {
    return t * -1.0;
  }
  //return t * (vec3)(cost2 > 0.0);
}
void main() {
  vec3 vNormal = normal.xyz;
  vec3 vModlePosition = position.xyz;
  vec3 vertexViewDir = vec3(cameraWorldPos[0] - vModlePosition.x, cameraWorldPos[1] - vModlePosition.y, cameraWorldPos[2] - vModlePosition.z);
  vertexViewDir = vertexViewDir * -1.0;
  vertexViewDir = normalize(vertexViewDir);
  uv2 = 2.0 * vNormal - normalize(vertexViewDir);
  uv2 = (modelMatrix * vec4(uv2, 0.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const backMaterial_frag = `
vec3 refract2(const in vec3 i, const in vec3 n, const in float eta)
{
  float cosi = dot(i * -1.0, n);
  float cost2 = 1.0 - eta * eta * (1.0 - cosi * cosi);
  vec3 t = eta * i + n * (eta * cosi - sqrt(cost2));
  if (cost2 > 0.0) {
    return t;
  } else {
    return t * -1.0;
  }
  //return t * (vec3)(cost2 > 0.0);
}

uniform samplerCube tCube;
uniform vec3 Color;
uniform float EnvironmentLight;
uniform float Emission;
varying vec3 uv2;
void main() {
    vec3 refraction = textureCube(tCube, uv2).rgb * Color.xyz;
    vec4 reflection = textureCube(tCube, uv2);
    vec3 multiplier = reflection.xyz * EnvironmentLight + vec3(Emission, Emission, Emission);
    gl_FragColor = vec4(refraction.xyz *multiplier.xyz , 0.5);
}


`;


const frontMaterial_vert = `
    varying vec3 uv2;
    varying float fresnel;
    uniform float cameraWorldPos[3];
    void main() {
      vec3 vNormal = normalize(normal.xyz);
      vec3 vModlePosition = position.xyz;
      vec3 vertexViewDir = vec3(cameraWorldPos[0] - vModlePosition.x, cameraWorldPos[1] - vModlePosition.y, cameraWorldPos[2] - vModlePosition.z);
      vertexViewDir = vertexViewDir * 1.0;
      vertexViewDir = normalize(vertexViewDir);
      uv2 = 2.0 * vNormal - normalize(vertexViewDir);
      uv2 = (modelMatrix * vec4(uv2, 0.0)).xyz;
      fresnel = 1.0 - dot(vNormal, vertexViewDir);
      if ( fresnel > 1.0) {
        fresnel = 1.0;
      }
      if (fresnel < 0.0) {
        fresnel = 0.0;
      }
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const frontMaterial_frag = `
    varying vec3 uv2;
    varying float fresnel;
    uniform samplerCube tCube;
    uniform samplerCube RefractTex;
    uniform vec3 Color;
    uniform float EnvironmentLight;
    uniform float Emission;
    uniform float ReflectionStrength;
   
    void main() {
        vec3 refraction = textureCube(RefractTex, uv2).xyz * Color.xyz;
        vec4 reflection = textureCube(tCube, uv2);
        vec3 multiplier = reflection.xyz * ReflectionStrength * fresnel  + vec3(Emission, Emission, Emission);
        gl_FragColor =  vec4(multiplier + refraction, 0.7);
        //gl_FragColor =  vec4(refraction,   1.0);
    }

`;



export {backMaterial_frag, backMaterial_vert, frontMaterial_frag, frontMaterial_vert};