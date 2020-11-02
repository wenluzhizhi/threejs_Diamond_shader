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
}
void main() {
  vec3 vNormal = normal.xyz;
  vec3 vModlePosition = position.xyz;
  vec3 vertexViewDir = vec3(cameraWorldPos[0] - vModlePosition.x, cameraWorldPos[1] - vModlePosition.y, cameraWorldPos[2] - vModlePosition.z);
  vertexViewDir = vertexViewDir * -1.0;
  vertexViewDir = normalize(vertexViewDir);
  vNormal = normalize(vNormal);
  uv2 = 2.0 * vNormal * dot(vNormal, vertexViewDir) - vertexViewDir;
  uv2 = refract2(vertexViewDir, vNormal, 0.7);
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
}

uniform samplerCube tCube;
uniform samplerCube RefractTex;
uniform vec3 Color;
uniform float EnvironmentLight;
uniform float Emission;
uniform float backAlpha;
varying vec3 uv2;
void main() {
    vec3 refraction = textureCube(RefractTex, uv2).xyz;
    vec4 reflection = textureCube(tCube, uv2);
    vec3 multiplier = reflection.xyz * EnvironmentLight + vec3(Emission, Emission, Emission);
    gl_FragColor = vec4(refraction.xyz *multiplier.xyz , backAlpha);
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
      uv2 = 2.0 * vNormal * dot(vNormal, vertexViewDir) - vertexViewDir;
      uv2 = (modelMatrix * vec4(uv2, 0.0)).xyz;


      fresnel = 1.0 - dot(vNormal, vertexViewDir);
      fresnel = clamp(fresnel, 0.0, 1.0);

      float FRACT = 2.4;
      float _Power = 5.0;
      float r0 = ((1.0 - FRACT) * (1.0 - FRACT)) / ((1.0 + FRACT) * (1.0 + FRACT));
      // 菲涅尔公式
      fresnel = r0 + (1.0- r0) * pow(1.0- clamp(dot(vNormal, vertexViewDir), 0.0, 1.0), _Power);



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
    uniform float frontAlpha;
    void main() {
        vec3 refraction = textureCube(RefractTex, uv2).xyz;
        vec4 reflection = textureCube(tCube, uv2);
        vec3 Color = vec3(1.0, 1.0, 1.0);
        Color *= fresnel;
        vec3 multiplier = reflection.xyz * ReflectionStrength * fresnel + refraction + vec3(Emission, Emission, Emission) * (1.0 - fresnel);
        gl_FragColor =  vec4(multiplier, frontAlpha);
    }

`;


function getFrontMaterial(THREE, cubeTexture, refractTexture) {
   return new THREE.ShaderMaterial({
    vertexShader : frontMaterial_vert,
   fragmentShader: frontMaterial_frag,
    side: THREE.FrontSide,
    transparent: true,
    depthWrite: false,
    uniforms:{
      "tCube": { type: "t", value: cubeTexture },
      "cameraWorldPos":{value:[0, 0, 0]},
      "modelMatrix":{value:new THREE.Matrix4()},
      "Color":{value: new THREE.Vector3(1, 1, 1)},
      "EnvironmentLight":{value: 0.4},
      "Emission":{value: 0.7},
      "backAlpha":{value:0.5},
      "frontAlpha":{value:0.5},
      "ReflectionStrength": {value: 2.0},
      "RefractTex": { type: "t", value: refractTexture },
    },
  });
}

function getBackMaterial(THREE, cubeTexture, refractTexture) {
  return new THREE.ShaderMaterial({
    vertexShader : backMaterial_vert,
    fragmentShader: backMaterial_frag,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    uniforms:{
      "tCube": { type: "t", value: cubeTexture },
      "RefractTex": { type: "t", value: refractTexture },
      "cameraWorldPos":{value:[0, 0, 0]},
      "modelMatrix":{value:new THREE.Matrix4()},
      "Color":{value: new THREE.Vector3(1, 1, 1)},
      "EnvironmentLight":{value: 0.4},
      "Emission":{value: 0.7},
      "backAlpha":{value:0.5},
      "frontAlpha":{value:0.5},
      "ReflectionStrength": {value: 2.0},
    },
  }); 
}

export {getBackMaterial, getFrontMaterial}

//export {backMaterial_frag, backMaterial_vert, frontMaterial_frag, frontMaterial_vert};