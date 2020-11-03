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


const rayMaterial_vert = `
   
    varying vec4 screenPos;
    vec4 ComputeScreenPos(const in vec4 pos) {
      vec4 o = pos * 0.5;
      o.xy = vec2(o.x, o.y) + o.w;
      o.zw = pos.zw;
      return o;
    }

    void main() {
      vec4 clipPos = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      screenPos = ComputeScreenPos(clipPos);
      gl_Position = clipPos;
    }
`;

const rayMaterial_frag = `
    uniform mat4 UNITY_MATRIX_I_V;
    uniform mat4 localToWorldMatrix;
    uniform mat4 unity_CameraInvProjection;
    uniform vec3 _Specular;
    uniform vec3 pos[234];
    uniform vec3 normal[234];
    uniform vec3 _Color;
    uniform float _TraceCount;
    uniform float _IOR;
    uniform samplerCube _Cubemap;
    uniform float _AbsorbIntensity;
    uniform float _ColorMultiply;
    uniform float _ColorAddp;
   




    varying vec4 screenPos;
   
    float EPSILON = 1e-8;
    struct Ray
    {
        vec3 origin;
        vec3 direction;
        vec3 energy;
        float absorbDistance;
    };

    Ray CreateRay(const in vec3 origin, const in vec3 direction)
    {
      Ray ray;
      ray.origin = origin;
      ray.direction = direction;
      ray.energy = vec3(1.0, 1.0, 1.0);
      ray.absorbDistance = 0.0;
      return ray;
    }

    Ray CreateCameraRay(const in vec2 uv)
    {
        // Transform the camera origin to world space
        vec3 origin = (UNITY_MATRIX_I_V * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        vec3 direction = (unity_CameraInvProjection * vec4(uv, 0.0, 1.0)).xyz;
        direction = (UNITY_MATRIX_I_V * vec4(direction, 0.0)).xyz;
        direction = normalize(direction);
        return CreateRay(origin, direction);
    }


    struct RayHit
    {
        vec3 position;
        float distance;
        vec3 normal;
    };

    RayHit CreateRayHit()
    {
        RayHit hit;
        hit.position = vec3(0.0, 0.0, 0.0);
        hit.distance = 999999.0;
        hit.normal = vec3(0.0, 0.0, 0.0);
        return hit;
    }

    bool IntersectTriangle_MT97_NoCull(Ray ray, vec3 vert0, vec3 vert1, vec3 vert2,
      inout float t, inout float u, inout float v)
      {
          // find vectors for two edges sharing vert0
          vec3 edge1 = vert1 - vert0;
          vec3 edge2 = vert2 - vert0;
          
          // begin calculating determinant - also used to calculate U parameter
          vec3 pvec = cross(ray.direction, edge2);
          
          // if determinant is near zero, ray lies in plane of triangle
          float det = dot(edge1, pvec);
          
          // use no culling
          if (det > - EPSILON && det < EPSILON)
              return false;
          float inv_det = 1.0 / det;
          
          // calculate distance from vert0 to ray origin
          vec3 tvec = ray.origin - vert0;
          
          // calculate U parameter and test bounds
          u = dot(tvec, pvec) * inv_det;
          if (u < 0.0 || u > 1.0)
              return false;
          
          // prepare to test V parameter
          vec3 qvec = cross(tvec, edge1);
          
          // calculate V parameter and test bounds
          v = dot(ray.direction, qvec) * inv_det;
          if (v < 0.0 || u + v > 1.0)
              return false;
          
          // calculate t, ray intersects triangle
          t = dot(edge2, qvec) * inv_det;
          
          return true;
      }

    void IntersectMeshObject(Ray ray, inout RayHit bestHit)
    {
        int offset = 0;
        int count = 78;
        for (int i = 0; i < 78; i ++) {
          vec3 v0 = (localToWorldMatrix * vec4(pos[i * 3], 1.0)).xyz;
          vec3 v1 = (localToWorldMatrix * vec4(pos[i * 3 + 1], 1.0)).xyz;
          vec3 v2 = (localToWorldMatrix * vec4(pos[i * 3 + 2], 1.0)).xyz;
          float t, u, v;
          if (IntersectTriangle_MT97_NoCull(ray, v0, v1, v2, t, u, v))
          {
             if(t > 0.0 && t < bestHit.distance) {
              bestHit.distance = t;
              bestHit.position = ray.origin + t * ray.direction;
              bestHit.normal = normalize(cross(v1 - v0, v2 - v0));
             }
          }
        }
  
    }

    RayHit Trace(const in Ray ray)
    {
        RayHit bestHit = CreateRayHit();
        IntersectMeshObject(ray, bestHit);
        return bestHit;
    }
    

    float step2(const in float a1, const in float x1) {
      if (x1 < a1) {
        return 0.0;
      } 
      return 1.0;
    }

    float Refract(vec3 i, vec3 n, float eta, inout vec3 o)
    {
        float cosi = dot(-i, n);
        float cost2 = 1.0 - eta * eta * (1.0 - cosi * cosi);
        
        o = eta * i + ((eta * cosi - sqrt(cost2)) * n);
        return 1.0 - step2(cost2, 0.0);
    }

    float FresnelSchlick(vec3 normal, vec3 incident, float ref_idx)
    {
        float cosine = dot(-incident, normal);
        float r0 = (1.0 - ref_idx) / (1.0 + ref_idx);
        r0 = r0 * r0;
        float ret = r0 + (1.0 - r0) * pow((1.0 - cosine), 5.0);
        return ret;
    }
    

    vec3 SampleCubemap(vec3 direction)
    {
        return textureCube(_Cubemap, direction).xyz;
    }

    vec3 Shade(inout Ray ray, RayHit hit, int depth)
    {
        if(hit.distance < 99999.0 && depth < 4) {
         vec3 specular = vec3(0.0, 0.0, 0.0);
        
         float eta;
         vec3 normal;
          
          // out
          if (dot(ray.direction, hit.normal) > 0.0)
          {
              normal = -hit.normal;
              eta = _IOR;
          }
          // in
          else
          {
              normal = hit.normal;
              eta = 1.0 / _IOR;
          }
          
          ray.origin = hit.position - normal * 0.001;
          
          vec3 refractRay;
          float refracted = Refract(ray.direction, normal, eta, refractRay);
          if (depth == 0)
          {
             vec3 reflectDir = reflect(ray.direction, hit.normal);
             reflectDir = normalize(reflectDir);
            
             vec3 reflectProb = FresnelSchlick(normal, ray.direction, eta) * _Specular;
             specular = SampleCubemap(reflectDir) * reflectProb;
             ray.energy *= 1.0 - reflectProb;
           }
            else
            {
                ray.absorbDistance += hit.distance;
            }


            if (refracted == 1.0)
            {
                ray.direction = refractRay;
            }
            // Total Internal Reflection
            else
            {
                ray.direction = reflect(ray.direction, normal);
            }
            
            ray.direction = normalize(ray.direction);
            
            return specular;
        
        } else {
           ray.energy = vec3(0.0, 0.0, 0.0);

          vec3 cubeColor = SampleCubemap(ray.direction);
          vec3 absorbColor = vec3(1.0, 1.0, 1.0) - _Color;
          vec3 absorb = exp(-absorbColor * ray.absorbDistance * _AbsorbIntensity);
  
          return cubeColor * absorb * _ColorMultiply ;
        }
    }

    bool any(vec3 v) {
      if (v.x == 0.0 && v.y == 0.0 && v.z == 0.0){
        return false;
      }
      return true;
    }
   
    void main() {
      vec2 screenUV = screenPos.xy / screenPos.w;
      screenUV = screenUV * 2.0 - 1.0;
      Ray ray = CreateCameraRay(screenUV);
      vec3 result = vec3(0.0, 0.0, 0.0);
      //#pragma unroll_loop_start
      for ( int i = 0; i < 10; i ++ ) {
        RayHit hit = Trace(ray);
        result = result + ray.energy * Shade(ray, hit, i);
        if (!any(ray.energy))
          break;
      }
      //#pragma unroll_loop_end
      gl_FragColor =  vec4(result, 1.0);
    }
`;



function getRayMaterial(THREE, cubeTexture) {
  return new THREE.ShaderMaterial({
    vertexShader : rayMaterial_vert,
    fragmentShader: rayMaterial_frag,
    uniforms:{
      "pos":{value:[]},
      "normal":{value:[]},
      "UNITY_MATRIX_I_V":{value: new THREE.Matrix4()},
      "unity_CameraInvProjection":{value: new THREE.Matrix4()},
      "_TraceCount":{value:5},
      "localToWorldMatrix":{value: new THREE.Matrix4()},
      "_IOR":{value:2.47},
      "_Specular":{value:new THREE.Vector3(1, 1, 1)},
      "_Color":{value:new THREE.Vector3(1, 1, 1)},
      "_AbsorbIntensity": {value:2.89},
      "_ColorMultiply":{value:1.18},
      "_ColorAdd" :{value:0.05},
      "_Cubemap": { type: "t", value: cubeTexture },
    }

  }); 
}

export {getBackMaterial, getFrontMaterial, getRayMaterial}

//export {backMaterial_frag, backMaterial_vert, frontMaterial_frag, frontMaterial_vert};