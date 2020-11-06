const backMaterial_vert = `
varying vec3 refractUV;
varying vec3 reflectUV;
varying float fresnel;
uniform float backreflectRatio;
uniform float cameraWorldPos[3];
void main() {
  vec3 vNormal = normal.xyz;
  vec3 vModlePosition = position.xyz;
  vec3 vertexViewDir = vec3(cameraWorldPos[0] - vModlePosition.x, cameraWorldPos[1] - vModlePosition.y, cameraWorldPos[2] - vModlePosition.z);
  vertexViewDir = normalize(vertexViewDir);
  vNormal = normalize(vNormal);
  refractUV = refract(vertexViewDir * -1.0 , vNormal * -1.0, 0.7);
  reflectUV = 2.0 * vNormal * dot(vNormal, vertexViewDir) - vertexViewDir;
  refractUV = (modelMatrix * vec4(refractUV, 0.0)).xyz;
  reflectUV = (modelMatrix * vec4(reflectUV, 0.0)).xyz;
  float FRACT = 2.4;
  float _Power = 5.0;
  float r0 = ((1.0 - FRACT) * (1.0 - FRACT)) / ((1.0 + FRACT) * (1.0 + FRACT));
      // 菲涅尔公式
  fresnel = r0 + (1.0- r0) * pow(1.0- clamp(dot(vNormal, vertexViewDir), 0.0, 1.0), _Power);
  fresnel = clamp(fresnel, 0.0, 1.0);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const backMaterial_frag = `
uniform samplerCube tCube;
uniform samplerCube RefractTex;
uniform float BackRefractionStrength;
uniform float BackReflectionStrength;
uniform vec3 Color;
uniform float backAlpha;
varying vec3 refractUV;
varying vec3 reflectUV;
varying float fresnel;
void main() {
    vec4 refractColor = textureCube(tCube, refractUV)  * BackRefractionStrength;
    vec4 reflectionColor = textureCube(tCube, reflectUV) * fresnel * BackReflectionStrength;
    gl_FragColor = vec4(refractColor.xyz + reflectionColor.xyz , backAlpha);
}
`;

const frontMaterial_vert = `
    varying vec3 uv2;
    varying vec3 refractUV;
    varying vec3 reflectUV;
    varying float fresnel;
    uniform float cameraWorldPos[3];
    void main() {
      vec3 vNormal = normalize(normal.xyz);
      vec3 vModlePosition = position.xyz;
      vec3 vertexViewDir = vec3(cameraWorldPos[0] - vModlePosition.x, cameraWorldPos[1] - vModlePosition.y, cameraWorldPos[2] - vModlePosition.z);
      vertexViewDir = normalize(vertexViewDir);
      vNormal = normalize(vNormal);
      refractUV = refract(vertexViewDir * -1.0 , vNormal * -1.0, 0.7);
      reflectUV = 2.0 * vNormal * dot(vNormal, vertexViewDir) - vertexViewDir;
      refractUV = (modelMatrix * vec4(refractUV, 0.0)).xyz;
      reflectUV = (modelMatrix * vec4(reflectUV, 0.0)).xyz;
      float FRACT = 2.4;
      float _Power = 5.0;
      float r0 = ((1.0 - FRACT) * (1.0 - FRACT)) / ((1.0 + FRACT) * (1.0 + FRACT));
          // 菲涅尔公式
      fresnel = r0 + (1.0- r0) * pow(1.0- clamp(dot(vNormal, vertexViewDir), 0.0, 1.0), _Power);
      fresnel = clamp(fresnel, 0.0, 1.0);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const frontMaterial_frag = `
    varying vec3 uv2;
    varying float fresnel;
    varying vec3 refractUV;
    varying vec3 reflectUV;
    uniform samplerCube tCube;
    uniform samplerCube RefractTex;
    uniform vec3 Color;
    uniform float EnvironmentLight;
    uniform float Emission;
    uniform float FrontReflectionStrength;
    uniform float FrontRefractionStrength;
    uniform float FrontEmissionStrength;
    uniform float frontAlpha;
    void main() {
        
        vec3 refraction = textureCube(RefractTex, refractUV).xyz;
        vec3 reflection = textureCube(tCube, reflectUV).xyz;
        vec3 emissionColor = Color * fresnel * FrontEmissionStrength;
        vec3 multiplier = (reflection * FrontReflectionStrength  + refraction * FrontRefractionStrength) * fresnel;
        gl_FragColor =  vec4(multiplier + emissionColor, frontAlpha);
    }

`;


function getFrontMaterial(THREE, cubeTexture, refractTexture) {
   return new THREE.ShaderMaterial({
    vertexShader : frontMaterial_vert,
   fragmentShader: frontMaterial_frag,
    side: THREE.FrontSide,
    transparent: true,
    depthWrite: true,
    uniforms:{
      "tCube": { type: "t", value: cubeTexture },
      "cameraWorldPos":{value:[0, 0, 0]},
      "modelMatrix":{value:new THREE.Matrix4()},
      "Color":{value: new THREE.Vector3(1, 1, 1)},
      "EnvironmentLight":{value: 0.4},
      "Emission":{value: 0.7},
      "backAlpha":{value:0.5},
      "frontAlpha":{value:0.36},
      "FrontReflectionStrength": {value: 1.0},
      "FrontRefractionStrength": {value: 16.7},
      "FrontEmissionStrength":{value: 1.0},
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
    depthWrite: true,
    uniforms:{
      "tCube": { type: "t", value: cubeTexture },
      "RefractTex": { type: "t", value: refractTexture },
      "cameraWorldPos":{value:[0, 0, 0]},
      "modelMatrix":{value:new THREE.Matrix4()},
      "Color":{value: new THREE.Vector3(1, 1, 1)},
      "EnvironmentLight":{value: 0.4},
      "Emission":{value: 0.7},
      "backAlpha":{value:0.49},
      "BackRefractionStrength": {value: 1.0},
      "BackReflectionStrength":{value: 1.0}
    },
  }); 
}

const finalPassVertex = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;

const finalPassFrag = `
    uniform sampler2D baseTexture;
    uniform sampler2D bloomTexture;
    varying vec2 vUv;
    vec4 getTexture( sampler2D texelToLinearTexture ) {
      return mapTexelToLinear( texture2D( texelToLinearTexture , vUv ) );
    }
    void main() {
      vec4 v1 =  getTexture( baseTexture );
      vec4 v2 = vec4( 1.0 ) * getTexture( bloomTexture );
      gl_FragColor = v1 + v2;
    }
`;


function getFinalPassShader(renderTexture, THREE) {
  return new THREE.ShaderMaterial({
    uniforms: {
      baseTexture: { value: null },
      bloomTexture: { value: renderTexture }
    },
    vertexShader: finalPassVertex,
    fragmentShader: finalPassFrag,
    defines: {}
  })
}


export {getBackMaterial, getFrontMaterial, getFinalPassShader}