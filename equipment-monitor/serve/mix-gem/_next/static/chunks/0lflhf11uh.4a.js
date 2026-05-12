(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,43955,e=>{"use strict";var t=e.i(263537);let r="volumetricLightingBlendVolumePixelShader",i=`varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;var depthSampler: texture_2d<f32>;uniform invProjection: mat4x4<f32>;uniform outputTextureSize: vec2f;
#ifdef USE_EXTINCTION
uniform extinction: vec3f;
#endif
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {fragmentOutputs.color=textureSample(textureSampler,textureSamplerSampler,input.vUV);
#ifdef USE_EXTINCTION
let depth=textureLoad(depthSampler,vec2u(fragmentInputs.position.xy),0).r;let ndc=vec4f((fragmentInputs.position.xy/uniforms.outputTextureSize)*2.-1.,depth,1.0);var viewPos=uniforms.invProjection*ndc;viewPos=viewPos/viewPos.w;let eyeDist=length(viewPos);fragmentOutputs.color2=vec4f(exp(-uniforms.extinction*eyeDist),1.0);
#endif
}
`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["volumetricLightingBlendVolumePixelShaderWGSL",0,{name:r,shader:i}])}]);