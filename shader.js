const simpleRayMaterial_vert = ` 
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const simpleRayMaterial_frag= `
void main() {
    gl_FragColor = vec4(1.0, 1.0, 1.0 , 1.0);
}
`;

function simpleRayMaterial(THREE, cubeTexture, refractTexture) {
  return new THREE.ShaderMaterial({
    vertexShader : simpleRayMaterial_vert,
    fragmentShader: simpleRayMaterial_frag,
    uniforms:{
    },
  }); 
}

export {simpleRayMaterial}
