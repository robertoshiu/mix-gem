(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,201632,e=>{"use strict";var t=e.i(263537);let o="helperFunctions",i=`const float PI=3.1415926535897932384626433832795;const float TWO_PI=6.283185307179586;const float HALF_PI=1.5707963267948966;const float RECIPROCAL_PI=0.3183098861837907;const float RECIPROCAL_PI2=0.15915494309189535;const float RECIPROCAL_PI4=0.07957747154594767;const float HALF_MIN=5.96046448e-08; 
const float LinearEncodePowerApprox=2.2;const float GammaEncodePowerApprox=1.0/LinearEncodePowerApprox;const vec3 LuminanceEncodeApprox=vec3(0.2126,0.7152,0.0722);const float Epsilon=0.0000001;
#define saturate(x) clamp(x,0.0,1.0)
#define absEps(x) abs(x)+Epsilon
#define maxEps(x) max(x,Epsilon)
#define saturateEps(x) clamp(x,Epsilon,1.0)
mat3 transposeMat3(mat3 inMatrix) {vec3 i0=inMatrix[0];vec3 i1=inMatrix[1];vec3 i2=inMatrix[2];mat3 outMatrix=mat3(
vec3(i0.x,i1.x,i2.x),
vec3(i0.y,i1.y,i2.y),
vec3(i0.z,i1.z,i2.z)
);return outMatrix;}
mat3 inverseMat3(mat3 inMatrix) {float a00=inMatrix[0][0],a01=inMatrix[0][1],a02=inMatrix[0][2];float a10=inMatrix[1][0],a11=inMatrix[1][1],a12=inMatrix[1][2];float a20=inMatrix[2][0],a21=inMatrix[2][1],a22=inMatrix[2][2];float b01=a22*a11-a12*a21;float b11=-a22*a10+a12*a20;float b21=a21*a10-a11*a20;float det=a00*b01+a01*b11+a02*b21;return mat3(b01,(-a22*a01+a02*a21),(a12*a01-a02*a11),
b11,(a22*a00-a02*a20),(-a12*a00+a02*a10),
b21,(-a21*a00+a01*a20),(a11*a00-a01*a10))/det;}
#if USE_EXACT_SRGB_CONVERSIONS
vec3 toLinearSpaceExact(vec3 color)
{vec3 nearZeroSection=0.0773993808*color;vec3 remainingSection=pow(0.947867299*(color+vec3(0.055)),vec3(2.4));
#if defined(WEBGL2) || defined(WEBGPU) || defined(NATIVE)
return mix(remainingSection,nearZeroSection,lessThanEqual(color,vec3(0.04045)));
#else
return
vec3(
color.r<=0.04045 ? nearZeroSection.r : remainingSection.r,
color.g<=0.04045 ? nearZeroSection.g : remainingSection.g,
color.b<=0.04045 ? nearZeroSection.b : remainingSection.b);
#endif
}
vec3 toGammaSpaceExact(vec3 color)
{vec3 nearZeroSection=12.92*color;vec3 remainingSection=1.055*pow(color,vec3(0.41666))-vec3(0.055);
#if defined(WEBGL2) || defined(WEBGPU) || defined(NATIVE)
return mix(remainingSection,nearZeroSection,lessThanEqual(color,vec3(0.0031308)));
#else
return
vec3(
color.r<=0.0031308 ? nearZeroSection.r : remainingSection.r,
color.g<=0.0031308 ? nearZeroSection.g : remainingSection.g,
color.b<=0.0031308 ? nearZeroSection.b : remainingSection.b);
#endif
}
#endif
float toLinearSpace(float color)
{
#if USE_EXACT_SRGB_CONVERSIONS
float nearZeroSection=0.0773993808*color;float remainingSection=pow(0.947867299*(color+0.055),2.4);return color<=0.04045 ? nearZeroSection : remainingSection;
#else
return pow(color,LinearEncodePowerApprox);
#endif
}
vec3 toLinearSpace(vec3 color)
{
#if USE_EXACT_SRGB_CONVERSIONS
return toLinearSpaceExact(color);
#else
return pow(color,vec3(LinearEncodePowerApprox));
#endif
}
vec4 toLinearSpace(vec4 color)
{
#if USE_EXACT_SRGB_CONVERSIONS
return vec4(toLinearSpaceExact(color.rgb),color.a);
#else
return vec4(pow(color.rgb,vec3(LinearEncodePowerApprox)),color.a);
#endif
}
float toGammaSpace(float color)
{
#if USE_EXACT_SRGB_CONVERSIONS
float nearZeroSection=12.92*color;float remainingSection=1.055*pow(color,0.41666)-0.055;return color<=0.0031308 ? nearZeroSection : remainingSection;
#else
return pow(color,GammaEncodePowerApprox);
#endif
}
vec3 toGammaSpace(vec3 color)
{
#if USE_EXACT_SRGB_CONVERSIONS
return toGammaSpaceExact(color);
#else
return pow(color,vec3(GammaEncodePowerApprox));
#endif
}
vec4 toGammaSpace(vec4 color)
{
#if USE_EXACT_SRGB_CONVERSIONS
return vec4(toGammaSpaceExact(color.rgb),color.a);
#else
return vec4(pow(color.rgb,vec3(GammaEncodePowerApprox)),color.a);
#endif
}
float square(float value)
{return value*value;}
vec3 square(vec3 value)
{return value*value;}
float pow5(float value) {float sq=value*value;return sq*sq*value;}
vec3 double_refract(vec3 I,vec3 N,float eta) {vec3 Tfront=refract(I,N,1.0/eta);vec3 Nback=normalize(reflect(N,Tfront));return refract(Tfront,-Nback,eta);}
float getLuminanceUnclamped(vec3 color)
{return dot(color,LuminanceEncodeApprox);}
float getLuminance(vec3 color)
{return saturate(getLuminanceUnclamped(color));}
float getRand(vec2 seed) {return fract(sin(dot(seed.xy ,vec2(12.9898,78.233)))*43758.5453);}
float dither(vec2 seed,float varianceAmount) {float rand=getRand(seed);float normVariance=varianceAmount/255.0;float dither=mix(-normVariance,normVariance,rand);return dither;}
const float rgbdMaxRange=255.;vec4 toRGBD(vec3 color) {float maxRGB=maxEps(max(color.r,max(color.g,color.b)));float D =max(rgbdMaxRange/maxRGB,1.);D =saturate(floor(D)/255.);vec3 rgb=color.rgb*D;rgb=toGammaSpace(rgb);return vec4(saturate(rgb),D);}
vec3 fromRGBD(vec4 rgbd) {rgbd.rgb=toLinearSpace(rgbd.rgb);return rgbd.rgb/rgbd.a;}
vec3 parallaxCorrectNormal( vec3 vertexPos,vec3 origVec,vec3 cubeSize,vec3 cubePos ) {vec3 invOrigVec=vec3(1.)/origVec;vec3 halfSize=cubeSize*0.5;vec3 intersecAtMaxPlane=(cubePos+halfSize-vertexPos)*invOrigVec;vec3 intersecAtMinPlane=(cubePos-halfSize-vertexPos)*invOrigVec;vec3 largestIntersec=max(intersecAtMaxPlane,intersecAtMinPlane);float distance=min(min(largestIntersec.x,largestIntersec.y),largestIntersec.z);vec3 intersectPositionWS=vertexPos+origVec*distance;return intersectPositionWS-cubePos;}
vec3 equirectangularToCubemapDirection(vec2 uv) {float longitude=uv.x*TWO_PI-PI;float latitude=HALF_PI-uv.y*PI;vec3 direction;direction.x=cos(latitude)*sin(longitude);direction.y=sin(latitude);direction.z=cos(latitude)*cos(longitude);return direction;}
float sqrtClamped(float value) {return sqrt(max(value,0.));}
float avg(vec3 value) {return dot(value,vec3(0.333333333));}
#if defined(WEBGL2) || defined(WEBGPU) || defined(NATIVE) 
uint extractBits(uint value,int offset,int width) {return (value>>offset) & ((1u<<width)-1u);}
int onlyBitPosition(uint value) {return (floatBitsToInt(float(value))>>23)-0x7f;}
vec3 singleScatterToMultiScatterAlbedo(vec3 rho_ss) {vec3 s=sqrt(max(vec3(1.0)-rho_ss,vec3(0.0)));return (vec3(1.0)-s)*(vec3(1.0)-vec3(0.139)*s)/(vec3(1.0)+vec3(1.17)*s);}
vec3 multiScatterToSingleScatterAlbedo(vec3 rho_ms) {vec3 s=4.09712+4.20863*rho_ms-sqrt(9.59217+41.6808*rho_ms+17.7126*rho_ms*rho_ms);return 1.0-s*s;}
vec3 multiScatterToSingleScatterAlbedo(vec3 rho_ms,float aniso) {vec3 s=4.09712+4.20863*rho_ms-sqrt(9.59217+41.6808*rho_ms+17.7126*rho_ms*rho_ms);return (1.0-s*s)/maxEps(1.0-aniso*s*s);}
float min3(vec3 v) {return min(v.x,min(v.y,v.z));}
float max3(vec3 v) {return max(v.x,max(v.y,v.z));}
float uint2float(uint i) {return uintBitsToFloat(0x3F800000u | (i>>9u))-1.0;}
vec2 plasticSequence(const uint rstate) {return vec2(uint2float(rstate*3242174889u),
uint2float(rstate*2447445414u));}
#endif
`;t.ShaderStore.IncludesShadersStore[o]||(t.ShaderStore.IncludesShadersStore[o]=i),e.s(["helperFunctions",0,{name:o,shader:i}])},424192,e=>{"use strict";var t=e.i(263537);let o="pbrBRDFFunctions",i=`#define FRESNEL_MAXIMUM_ON_ROUGH 0.25
#define BRDF_DIFFUSE_MODEL_EON 0
#define BRDF_DIFFUSE_MODEL_BURLEY 1
#define BRDF_DIFFUSE_MODEL_LAMBERT 2
#define BRDF_DIFFUSE_MODEL_LEGACY 3
#define DIELECTRIC_SPECULAR_MODEL_GLTF 0
#define DIELECTRIC_SPECULAR_MODEL_OPENPBR 1
#define CONDUCTOR_SPECULAR_MODEL_GLTF 0
#define CONDUCTOR_SPECULAR_MODEL_OPENPBR 1
#if !defined(PBR_VERTEX_SHADER) && !defined(OPENPBR_VERTEX_SHADER)
#ifdef MS_BRDF_ENERGY_CONSERVATION
vec3 getEnergyConservationFactor(const vec3 specularEnvironmentR0,const vec3 environmentBrdf) {return 1.0+specularEnvironmentR0*(1.0/environmentBrdf.y-1.0);}
#endif
#if CONDUCTOR_SPECULAR_MODEL==CONDUCTOR_SPECULAR_MODEL_OPENPBR
#define F82_COS_THETA_MAX 0.142857143
#define F82_ONE_MINUS_CTM_POW5 0.462664366 
#define F82_ONE_MINUS_CTM_POW6 0.396569457 
#define F82_B_DENOMINATOR_RECIP 17.6512785 
#define BRDF_Z_SCALE 16.0
vec3 getF82Specular(float NdotV,vec3 F0,vec3 edgeTint,float roughness) {vec3 white_minus_F0=vec3(1.0)-F0;vec3 b=(F0+white_minus_F0*F82_ONE_MINUS_CTM_POW5)*(vec3(1.0)-edgeTint)*F82_B_DENOMINATOR_RECIP;float cos_theta=max(roughness,NdotV);float one_minus_cos_theta=1.0-cos_theta;vec3 offset_from_F0=(white_minus_F0-b*cos_theta*one_minus_cos_theta)*pow(one_minus_cos_theta,5.0);return clamp(F0+offset_from_F0,0.0,1.0);}
vec3 getF82B(vec3 F0,vec3 edgeTint) {return (F0+(vec3(1.0)-F0)*F82_ONE_MINUS_CTM_POW5)*(vec3(1.0)-edgeTint)*F82_B_DENOMINATOR_RECIP;}
vec3 getF82DirectionalAlbedo(vec3 F0,vec3 F90,vec3 b,vec3 environmentBrdf) {return (F90-F0)*environmentBrdf.x+F0*environmentBrdf.y-b*environmentBrdf.z;}
vec3 getF82AverageFresnel(vec3 F0,vec3 b) {return F0+(vec3(1.0)-F0)/21.0-b/126.0;}
#endif
#ifdef FUZZENVIRONMENTBRDF
vec3 getFuzzBRDFLookup(float NdotV,float perceptualRoughness) {vec2 UV=vec2(perceptualRoughness,NdotV);vec4 brdfLookup=texture2D(environmentFuzzBrdfSampler,UV);const vec2 RiRange=vec2(0.0,0.75);const vec2 ARange =vec2(0.005,0.88);const vec2 BRange =vec2(-0.18,0.002);brdfLookup.r=mix(ARange.x, ARange.y, brdfLookup.r);brdfLookup.g=mix(BRange.x, BRange.y, brdfLookup.g);brdfLookup.b=mix(RiRange.x,RiRange.y,brdfLookup.b);return brdfLookup.rgb;}
#endif
#ifdef ENVIRONMENTBRDF
vec3 getBRDFLookup(float NdotV,float perceptualRoughness) {vec2 UV=vec2(NdotV,perceptualRoughness);vec4 brdfLookup=texture2D(environmentBrdfSampler,UV);
#ifdef ENVIRONMENTBRDF_RGBD
brdfLookup.rgb=fromRGBD(brdfLookup.rgba);
#endif
return brdfLookup.rgb;}
vec3 getReflectanceFromBRDFLookup(const vec3 specularEnvironmentR0,const vec3 specularEnvironmentR90,const vec3 environmentBrdf) {
#ifdef BRDF_V_HEIGHT_CORRELATED
vec3 reflectance=(specularEnvironmentR90-specularEnvironmentR0)*environmentBrdf.x+specularEnvironmentR0*environmentBrdf.y;
#else
vec3 reflectance=specularEnvironmentR0*environmentBrdf.x+specularEnvironmentR90*environmentBrdf.y;
#endif
return reflectance;}
vec3 getReflectanceFromBRDFLookup(const vec3 specularEnvironmentR0,const vec3 environmentBrdf) {
#ifdef BRDF_V_HEIGHT_CORRELATED
vec3 reflectance=mix(environmentBrdf.xxx,environmentBrdf.yyy,specularEnvironmentR0);
#else
vec3 reflectance=specularEnvironmentR0*environmentBrdf.x+environmentBrdf.y;
#endif
return reflectance;}
#endif
/* NOT USED
#if defined(SHEEN) && defined(SHEEN_SOFTER)
float getBRDFLookupCharlieSheen(float NdotV,float perceptualRoughness)
{float c=1.0-NdotV;float c3=c*c*c;return 0.65584461*c3+1.0/(4.16526551+exp(-7.97291361*perceptualRoughness+6.33516894));}
#endif
*/
#if !defined(ENVIRONMENTBRDF) || defined(REFLECTIONMAP_SKYBOX) || defined(ALPHAFRESNEL)
vec3 getReflectanceFromAnalyticalBRDFLookup_Jones(float VdotN,vec3 reflectance0,vec3 reflectance90,float smoothness)
{float weight=mix(FRESNEL_MAXIMUM_ON_ROUGH,1.0,smoothness);return reflectance0+weight*(reflectance90-reflectance0)*pow5(saturate(1.0-VdotN));}
#endif
#if defined(SHEEN) && defined(ENVIRONMENTBRDF)
/**
* The sheen BRDF not containing F can be easily stored in the blue channel of the BRDF texture.
* The blue channel contains DCharlie*VAshikhmin*NdotL as a lokkup table
*/
vec3 getSheenReflectanceFromBRDFLookup(const vec3 reflectance0,const vec3 environmentBrdf) {vec3 sheenEnvironmentReflectance=reflectance0*environmentBrdf.b;return sheenEnvironmentReflectance;}
#endif
vec3 fresnelSchlickGGX(float VdotH,vec3 reflectance0,vec3 reflectance90)
{return reflectance0+(reflectance90-reflectance0)*pow5(1.0-VdotH);}
float fresnelSchlickGGX(float VdotH,float reflectance0,float reflectance90)
{return reflectance0+(reflectance90-reflectance0)*pow5(1.0-VdotH);}
#ifdef CLEARCOAT
vec3 getR0RemappedForClearCoat(vec3 f0) {
#ifdef CLEARCOAT_DEFAULTIOR
#ifdef MOBILE
return saturate(f0*(f0*0.526868+0.529324)-0.0482256);
#else
return saturate(f0*(f0*(0.941892-0.263008*f0)+0.346479)-0.0285998);
#endif
#else
vec3 s=sqrt(f0);vec3 t=(vClearCoatRefractionParams.z+vClearCoatRefractionParams.w*s)/(vClearCoatRefractionParams.w+vClearCoatRefractionParams.z*s);return square(t);
#endif
}
#endif
#ifdef IRIDESCENCE
const mat3 XYZ_TO_REC709=mat3(
3.2404542,-0.9692660, 0.0556434,
-1.5371385, 1.8760108,-0.2040259,
-0.4985314, 0.0415560, 1.0572252
);vec3 getIORTfromAirToSurfaceR0(vec3 f0) {vec3 sqrtF0=sqrt(f0);return (1.+sqrtF0)/(1.-sqrtF0);}
vec3 getR0fromIORs(vec3 iorT,float iorI) {return square((iorT-vec3(iorI))/(iorT+vec3(iorI)));}
float getR0fromIORs(float iorT,float iorI) {return square((iorT-iorI)/(iorT+iorI));}
vec3 evalSensitivity(float opd,vec3 shift) {float phase=2.0*PI*opd*1.0e-9;const vec3 val=vec3(5.4856e-13,4.4201e-13,5.2481e-13);const vec3 pos=vec3(1.6810e+06,1.7953e+06,2.2084e+06);const vec3 var=vec3(4.3278e+09,9.3046e+09,6.6121e+09);vec3 xyz=val*sqrt(2.0*PI*var)*cos(pos*phase+shift)*exp(-square(phase)*var);xyz.x+=9.7470e-14*sqrt(2.0*PI*4.5282e+09)*cos(2.2399e+06*phase+shift[0])*exp(-4.5282e+09*square(phase));xyz/=1.0685e-7;vec3 srgb=XYZ_TO_REC709*xyz;return srgb;}
vec3 evalIridescence(float outsideIOR,float eta2,float cosTheta1,float thinFilmThickness,vec3 baseF0) {vec3 I=vec3(1.0);float iridescenceIOR=mix(outsideIOR,eta2,smoothstep(0.0,0.03,thinFilmThickness));float sinTheta2Sq=square(outsideIOR/iridescenceIOR)*(1.0-square(cosTheta1));float cosTheta2Sq=1.0-sinTheta2Sq;if (cosTheta2Sq<0.0) {return I;}
float cosTheta2=sqrt(cosTheta2Sq);float R0=getR0fromIORs(iridescenceIOR,outsideIOR);float R12=fresnelSchlickGGX(cosTheta1,R0,1.);float R21=R12;float T121=1.0-R12;float phi12=0.0;if (iridescenceIOR<outsideIOR) phi12=PI;float phi21=PI-phi12;vec3 baseIOR=getIORTfromAirToSurfaceR0(clamp(baseF0,0.0,0.9999)); 
vec3 R1=getR0fromIORs(baseIOR,iridescenceIOR);float maxR1=max(R1.r,max(R1.g,R1.b));if (maxR1<1e-6) {return max(vec3(R12),vec3(0.0));}
vec3 R23=fresnelSchlickGGX(cosTheta2,R1,vec3(1.));vec3 phi23=vec3(0.0);if (baseIOR[0]<iridescenceIOR) phi23[0]=PI;if (baseIOR[1]<iridescenceIOR) phi23[1]=PI;if (baseIOR[2]<iridescenceIOR) phi23[2]=PI;float opd=2.0*iridescenceIOR*thinFilmThickness*cosTheta2;vec3 phi=vec3(phi21)+phi23;vec3 R123=clamp(R12*R23,1e-5,0.9999);vec3 r123=sqrt(R123);vec3 Rs=square(T121)*R23/(vec3(1.0)-R123);vec3 C0=R12+Rs;I=C0;vec3 Cm=Rs-T121;for (int m=1; m<=2; ++m)
{Cm*=r123;vec3 Sm=2.0*evalSensitivity(float(m)*opd,float(m)*phi);I+=Cm*Sm;}
return max(I,vec3(0.0));}
#endif
float normalDistributionFunction_TrowbridgeReitzGGX(float NdotH,float alphaG)
{float a2=square(alphaG);float d=NdotH*NdotH*(a2-1.0)+1.0;return a2/(PI*d*d);}
#ifdef SHEEN
float normalDistributionFunction_CharlieSheen(float NdotH,float alphaG)
{float invR=1./alphaG;float cos2h=NdotH*NdotH;float sin2h=1.-cos2h;return (2.+invR)*pow(sin2h,invR*.5)/(2.*PI);}
#endif
#ifdef ANISOTROPIC
float normalDistributionFunction_BurleyGGX_Anisotropic(float NdotH,float TdotH,float BdotH,const vec2 alphaTB) {float a2=alphaTB.x*alphaTB.y;vec3 v=vec3(alphaTB.y*TdotH,alphaTB.x *BdotH,a2*NdotH);float v2=dot(v,v);float w2=a2/v2;return a2*w2*w2*RECIPROCAL_PI;}
#endif
#ifdef BRDF_V_HEIGHT_CORRELATED
float smithVisibility_GGXCorrelated(float NdotL,float NdotV,float alphaG) {
#ifdef MOBILE
float GGXV=NdotL*(NdotV*(1.0-alphaG)+alphaG);float GGXL=NdotV*(NdotL*(1.0-alphaG)+alphaG);return 0.5/(GGXV+GGXL);
#else
float a2=alphaG*alphaG;float GGXV=NdotL*sqrt(NdotV*(NdotV-a2*NdotV)+a2);float GGXL=NdotV*sqrt(NdotL*(NdotL-a2*NdotL)+a2);return 0.5/(GGXV+GGXL);
#endif
}
#else
float smithVisibilityG1_TrowbridgeReitzGGXFast(float dot,float alphaG)
{
#ifdef MOBILE
return 1.0/(dot+alphaG+(1.0-alphaG)*dot ));
#else
float alphaSquared=alphaG*alphaG;return 1.0/(dot+sqrt(alphaSquared+(1.0-alphaSquared)*dot*dot));
#endif
}
float smithVisibility_TrowbridgeReitzGGXFast(float NdotL,float NdotV,float alphaG)
{float visibility=smithVisibilityG1_TrowbridgeReitzGGXFast(NdotL,alphaG)*smithVisibilityG1_TrowbridgeReitzGGXFast(NdotV,alphaG);return visibility;}
#endif
#ifdef ANISOTROPIC
float smithVisibility_GGXCorrelated_Anisotropic(float NdotL,float NdotV,float TdotV,float BdotV,float TdotL,float BdotL,const vec2 alphaTB) {float lambdaV=NdotL*length(vec3(alphaTB.x*TdotV,alphaTB.y*BdotV,NdotV));float lambdaL=NdotV*length(vec3(alphaTB.x*TdotL,alphaTB.y*BdotL,NdotL));float v=0.5/(lambdaV+lambdaL);return v;}
#endif
#ifdef CLEARCOAT
float visibility_Kelemen(float VdotH) {return 0.25/(VdotH*VdotH); }
#endif
#ifdef SHEEN
float visibility_Ashikhmin(float NdotL,float NdotV)
{return 1./(4.*(NdotL+NdotV-NdotL*NdotV));}
/* NOT USED
#ifdef SHEEN_SOFTER
float l(float x,float alphaG)
{float oneMinusAlphaSq=(1.0-alphaG)*(1.0-alphaG);float a=mix(21.5473,25.3245,oneMinusAlphaSq);float b=mix(3.82987,3.32435,oneMinusAlphaSq);float c=mix(0.19823,0.16801,oneMinusAlphaSq);float d=mix(-1.97760,-1.27393,oneMinusAlphaSq);float e=mix(-4.32054,-4.85967,oneMinusAlphaSq);return a/(1.0+b*pow(x,c))+d*x+e;}
float lambdaSheen(float cosTheta,float alphaG)
{return abs(cosTheta)<0.5 ? exp(l(cosTheta,alphaG)) : exp(2.0*l(0.5,alphaG)-l(1.0-cosTheta,alphaG));}
float visibility_CharlieSheen(float NdotL,float NdotV,float alphaG)
{float G=1.0/(1.0+lambdaSheen(NdotV,alphaG)+lambdaSheen(NdotL,alphaG));return G/(4.0*NdotV*NdotL);}
#endif
*/
#endif
float diffuseBRDF_Burley(float NdotL,float NdotV,float VdotH,float roughness) {float diffuseFresnelNV=pow5(saturateEps(1.0-NdotL));float diffuseFresnelNL=pow5(saturateEps(1.0-NdotV));float diffuseFresnel90=0.5+2.0*VdotH*VdotH*roughness;float fresnel =
(1.0+(diffuseFresnel90-1.0)*diffuseFresnelNL) *
(1.0+(diffuseFresnel90-1.0)*diffuseFresnelNV);return fresnel/PI;}
const float constant1_FON=0.5-2.0/(3.0*PI);const float constant2_FON=2.0/3.0-28.0/(15.0*PI);float E_FON_approx(float mu,float roughness)
{float sigma=roughness; 
float mucomp=1.0-mu;float mucomp2=mucomp*mucomp;const mat2 Gcoeffs=mat2(0.0571085289,-0.332181442,
0.491881867,0.0714429953);float GoverPi=dot(Gcoeffs*vec2(mucomp,mucomp2),vec2(1.0,mucomp2));return (1.0+sigma*GoverPi)/(1.0+constant1_FON*sigma);}
vec3 diffuseBRDF_EON(vec3 albedo,float roughness,float NdotL,float NdotV,float LdotV)
{vec3 rho=albedo;float sigma=roughness; 
float mu_i=NdotL; 
float mu_o=NdotV; 
float s=LdotV-mu_i*mu_o; 
float sovertF=s>0.0 ? s/max(mu_i,mu_o) : s; 
float AF=1.0/(1.0+constant1_FON*sigma); 
vec3 f_ss=(rho*RECIPROCAL_PI)*AF*(1.0+sigma*sovertF); 
float EFo=E_FON_approx(mu_o,sigma); 
float EFi=E_FON_approx(mu_i,sigma); 
float avgEF=AF*(1.0+constant2_FON*sigma); 
vec3 rho_ms=(rho*rho)*avgEF/(vec3(1.0)-rho*(1.0-avgEF));const float eps=1.0e-7;vec3 f_ms=(rho_ms*RECIPROCAL_PI)*max(eps,1.0-EFo) 
* max(eps,1.0-EFi)
/ max(eps,1.0-avgEF);return (f_ss+f_ms);}
#ifdef SS_TRANSLUCENCY
vec3 transmittanceBRDF_Burley(const vec3 tintColor,const vec3 diffusionDistance,float thickness) {vec3 S=1./maxEps(diffusionDistance);vec3 temp=exp((-0.333333333*thickness)*S);return tintColor.rgb*0.25*(temp*temp*temp+3.0*temp);}
float computeWrappedDiffuseNdotL(float NdotL,float w) {float t=1.0+w;float invt2=1.0/square(t);return saturate((NdotL+w)*invt2);}
#endif
#endif 
`;t.ShaderStore.IncludesShadersStore[o]||(t.ShaderStore.IncludesShadersStore[o]=i),e.s([])},442357,289258,e=>{"use strict";var t=e.i(263537);let o="importanceSampling",i=`vec3 hemisphereCosSample(vec2 u) {float phi=2.*PI*u.x;float cosTheta2=1.-u.y;float cosTheta=sqrt(cosTheta2);float sinTheta=sqrt(1.-cosTheta2);return vec3(sinTheta*cos(phi),sinTheta*sin(phi),cosTheta);}
vec3 hemisphereImportanceSampleDggx(vec2 u,float a) {float phi=2.*PI*u.x;float cosTheta2=(1.-u.y)/(1.+(a+1.)*((a-1.)*u.y));float cosTheta=sqrt(cosTheta2);float sinTheta=sqrt(1.-cosTheta2);return vec3(sinTheta*cos(phi),sinTheta*sin(phi),cosTheta);}
vec3 hemisphereImportanceSampleDggxAnisotropic(vec2 Xi,float alphaTangent,float alphaBitangent)
{alphaTangent=max(alphaTangent,0.0001);alphaBitangent=max(alphaBitangent,0.0001);float phi=atan(alphaBitangent/alphaTangent*tan(2.0*3.14159265*Xi.x));if (Xi.x>0.5) phi+=3.14159265; 
float cosPhi=cos(phi);float sinPhi=sin(phi);float alpha2=(cosPhi*cosPhi)/(alphaTangent*alphaTangent) +
(sinPhi*sinPhi)/(alphaBitangent*alphaBitangent);float tanTheta2=Xi.y/(1.0-Xi.y)/alpha2;float cosTheta=1.0/sqrt(1.0+tanTheta2);float sinTheta=sqrt(max(0.0,1.0-cosTheta*cosTheta));return vec3(sinTheta*cosPhi,sinTheta*sinPhi,cosTheta);}
vec3 hemisphereImportanceSampleDCharlie(vec2 u,float a) { 
float phi=2.*PI*u.x;float sinTheta=pow(u.y,a/(2.*a+1.));float cosTheta=sqrt(1.-sinTheta*sinTheta);return vec3(sinTheta*cos(phi),sinTheta*sin(phi),cosTheta);}`;t.ShaderStore.IncludesShadersStore[o]||(t.ShaderStore.IncludesShadersStore[o]=i),e.s([],442357);let a="hdrFilteringFunctions",r=`#if NUM_SAMPLES
#if NUM_SAMPLES>0
#if defined(WEBGL2) || defined(WEBGPU) || defined(NATIVE)
float radicalInverse_VdC(uint bits) 
{bits=(bits<<16u) | (bits>>16u);bits=((bits & 0x55555555u)<<1u) | ((bits & 0xAAAAAAAAu)>>1u);bits=((bits & 0x33333333u)<<2u) | ((bits & 0xCCCCCCCCu)>>2u);bits=((bits & 0x0F0F0F0Fu)<<4u) | ((bits & 0xF0F0F0F0u)>>4u);bits=((bits & 0x00FF00FFu)<<8u) | ((bits & 0xFF00FF00u)>>8u);return float(bits)*2.3283064365386963e-10; }
vec2 hammersley(uint i,uint N)
{return vec2(float(i)/float(N),radicalInverse_VdC(i));}
#else
float vanDerCorpus(int n,int base)
{float invBase=1.0/float(base);float denom =1.0;float result =0.0;for(int i=0; i<32; ++i)
{if(n>0)
{denom =mod(float(n),2.0);result+=denom*invBase;invBase=invBase/2.0;n =int(float(n)/2.0);}}
return result;}
vec2 hammersley(int i,int N)
{return vec2(float(i)/float(N),vanDerCorpus(i,2));}
#endif
float log4(float x) {return log2(x)/2.;}
vec3 uv_to_normal(vec2 uv) {vec3 N;vec2 uvRange=uv;float theta=uvRange.x*2.*PI;float phi=uvRange.y*PI;float sinPhi=sin(phi);N.x=cos(theta)*sinPhi;N.z=sin(theta)*sinPhi;N.y=cos(phi);return N;}
const float NUM_SAMPLES_FLOAT=float(NUM_SAMPLES);const float NUM_SAMPLES_FLOAT_INVERSED=1./NUM_SAMPLES_FLOAT;const float K=4.;
#define inline
vec3 irradiance(
#ifdef CUSTOM_IRRADIANCE_FILTERING_INPUT
CUSTOM_IRRADIANCE_FILTERING_INPUT
#else
samplerCube inputTexture,
#endif
vec3 inputN,vec2 filteringInfo,
float diffuseRoughness,
vec3 surfaceAlbedo,
vec3 inputV
#if IBL_CDF_FILTERING
,sampler2D icdfSampler
#endif
)
{vec3 n=normalize(inputN);vec3 result=vec3(0.);
#ifndef IBL_CDF_FILTERING
vec3 tangent=abs(n.z)<0.999 ? vec3(0.,0.,1.) : vec3(1.,0.,0.);tangent=normalize(cross(tangent,n));vec3 bitangent=cross(n,tangent);mat3 tbn=mat3(tangent,bitangent,n);mat3 tbnInverse=mat3(tangent.x,bitangent.x,n.x,tangent.y,bitangent.y,n.y,tangent.z,bitangent.z,n.z);
#endif
float maxLevel=filteringInfo.y;float dim0=filteringInfo.x;float omegaP=(4.*PI)/(6.*dim0*dim0);vec3 clampedAlbedo=clamp(surfaceAlbedo,vec3(0.1),vec3(1.0));
#if defined(WEBGL2) || defined(WEBGPU) || defined(NATIVE)
for(uint i=0u; i<NUM_SAMPLES; ++i)
#else
for(int i=0; i<NUM_SAMPLES; ++i)
#endif
{vec2 Xi=hammersley(i,NUM_SAMPLES);
#if IBL_CDF_FILTERING
vec2 T;T.x=texture2D(icdfSampler,vec2(Xi.x,0.)).x;T.y=texture2D(icdfSampler,vec2(T.x,Xi.y)).y;vec3 Ls=uv_to_normal(vec2(1.0-fract(T.x+0.25),T.y));float NoL=dot(n,Ls);float NoV=dot(n,inputV);
#if BASE_DIFFUSE_MODEL==BRDF_DIFFUSE_MODEL_EON
float LoV=dot (Ls,inputV);
#elif BASE_DIFFUSE_MODEL==BRDF_DIFFUSE_MODEL_BURLEY
vec3 H=(inputV+Ls)*0.5;float VoH=dot(inputV,H);
#endif
#else
vec3 Ls=hemisphereCosSample(Xi);Ls=normalize(Ls);float NoL=Ls.z; 
vec3 V=tbnInverse*inputV;float NoV=V.z; 
#if BASE_DIFFUSE_MODEL==BRDF_DIFFUSE_MODEL_EON
float LoV=dot (Ls,V);
#elif BASE_DIFFUSE_MODEL==BRDF_DIFFUSE_MODEL_BURLEY
vec3 H=(V+Ls)*0.5;float VoH=dot(V,H);
#endif
#endif
if (NoL>0.) {
#if IBL_CDF_FILTERING
float pdf=texture2D(icdfSampler,T).z;vec3 c=textureCubeLodEXT(inputTexture,Ls,0.).rgb;
#else
float pdf_inversed=PI/NoL;float omegaS=NUM_SAMPLES_FLOAT_INVERSED*pdf_inversed;float l=log4(omegaS)-log4(omegaP)+log4(K);float mipLevel=clamp(l,0.,maxLevel);
#ifdef CUSTOM_IRRADIANCE_FILTERING_FUNCTION
CUSTOM_IRRADIANCE_FILTERING_FUNCTION
#else
vec3 c=textureCubeLodEXT(inputTexture,tbn*Ls,mipLevel).rgb;
#endif
#endif
#if GAMMA_INPUT
c=toLinearSpace(c);
#endif
vec3 diffuseRoughnessTerm=vec3(1.0);
#if BASE_DIFFUSE_MODEL==BRDF_DIFFUSE_MODEL_EON
diffuseRoughnessTerm=diffuseBRDF_EON(clampedAlbedo,diffuseRoughness,NoL,NoV,LoV)*PI;
#elif BASE_DIFFUSE_MODEL==BRDF_DIFFUSE_MODEL_BURLEY
diffuseRoughnessTerm=vec3(diffuseBRDF_Burley(NoL,NoV,VoH,diffuseRoughness)*PI);
#endif
#if IBL_CDF_FILTERING
vec3 light=pdf<1e-6 ? vec3(0.0) : vec3(1.0)/vec3(pdf)*c;result+=NoL*diffuseRoughnessTerm*light;
#else
result+=c*diffuseRoughnessTerm;
#endif
}}
result=result*NUM_SAMPLES_FLOAT_INVERSED;
#if BASE_DIFFUSE_MODEL==BRDF_DIFFUSE_MODEL_EON
result=result/clampedAlbedo;
#endif
return result;}
#define inline
vec3 radiance(float alphaG,samplerCube inputTexture,vec3 inputN,vec2 filteringInfo)
{vec3 n=normalize(inputN);vec3 c=textureCubeLodEXT(inputTexture,n,0.).rgb; 
if (alphaG==0.) {
#if GAMMA_INPUT
c=toLinearSpace(c);
#endif
return c;} else {vec3 result=vec3(0.);vec3 tangent=abs(n.z)<0.999 ? vec3(0.,0.,1.) : vec3(1.,0.,0.);tangent=normalize(cross(tangent,n));vec3 bitangent=cross(n,tangent);mat3 tbn=mat3(tangent,bitangent,n);float maxLevel=filteringInfo.y;float dim0=filteringInfo.x;float omegaP=(4.*PI)/(6.*dim0*dim0);float weight=0.;
#if defined(WEBGL2) || defined(WEBGPU) || defined(NATIVE)
for(uint i=0u; i<NUM_SAMPLES; ++i)
#else
for(int i=0; i<NUM_SAMPLES; ++i)
#endif
{vec2 Xi=hammersley(i,NUM_SAMPLES);vec3 H=hemisphereImportanceSampleDggx(Xi,alphaG);float NoV=1.;float NoH=H.z;float NoH2=H.z*H.z;float NoL=2.*NoH2-1.;vec3 L=vec3(2.*NoH*H.x,2.*NoH*H.y,NoL);L=normalize(L);if (NoL>0.) {float pdf_inversed=4./normalDistributionFunction_TrowbridgeReitzGGX(NoH,alphaG);float omegaS=NUM_SAMPLES_FLOAT_INVERSED*pdf_inversed;float l=log4(omegaS)-log4(omegaP)+log4(K);float mipLevel=clamp(float(l),0.0,maxLevel);weight+=NoL;vec3 c=textureCubeLodEXT(inputTexture,tbn*L,mipLevel).rgb;
#if GAMMA_INPUT
c=toLinearSpace(c);
#endif
result+=c*NoL;}}
result=result/weight;return result;}}
#ifdef ANISOTROPIC
#define inline
vec3 radianceAnisotropic(
float alphaTangent, 
float alphaBitangent, 
samplerCube inputTexture,
vec3 inputView, 
vec3 inputTangent, 
vec3 inputBitangent, 
vec3 inputNormal, 
vec2 filteringInfo,
vec2 noiseInput, 
bool isRefraction,
float ior 
)
{vec3 V=inputView;vec3 N=inputNormal;vec3 T=inputTangent;vec3 B=inputBitangent;vec3 result=vec3(0.);float maxLevel=filteringInfo.y;float dim0=filteringInfo.x;float clampedAlphaT=max(alphaTangent,MINIMUMVARIANCE);float clampedAlphaB=max(alphaBitangent,MINIMUMVARIANCE);float effectiveDim=dim0*sqrt(clampedAlphaT*clampedAlphaB);float omegaP=(4.*PI)/(6.*effectiveDim*effectiveDim);const float noiseScale=clamp(log2(float(NUM_SAMPLES))/12.0f,0.0f,1.0f);float weight=0.;
#if defined(WEBGL2) || defined(WEBGPU) || defined(NATIVE)
for(uint i=0u; i<NUM_SAMPLES; ++i)
#else
for(int i=0; i<NUM_SAMPLES; ++i)
#endif
{vec2 Xi=hammersley(i,NUM_SAMPLES);Xi=fract(Xi+noiseInput*mix(0.5f,0.015f,noiseScale)); 
vec3 H_tangent=hemisphereImportanceSampleDggxAnisotropic(Xi,clampedAlphaT,clampedAlphaB);vec3 H=normalize(H_tangent.x*T+H_tangent.y*B+H_tangent.z*N);vec3 L;if (isRefraction) {L=refract(-V,H,1.0/ior);} else {L=reflect(-V,H);}
float NoH=max(dot(N,H),0.001);float VoH=max(dot(V,H),0.001);float NoL=max(dot(N,L),0.001);if (NoL>0.) {float pdf_inversed=4./normalDistributionFunction_BurleyGGX_Anisotropic(
H_tangent.z,H_tangent.x,H_tangent.y,vec2(clampedAlphaT,clampedAlphaB)
);float omegaS=NUM_SAMPLES_FLOAT_INVERSED*pdf_inversed;float l=log4(omegaS)-log4(omegaP)+log4(K);float mipLevel=clamp(float(l),0.0,maxLevel);weight+=NoL;vec3 c=textureCubeLodEXT(inputTexture,L,mipLevel).rgb;
#if GAMMA_INPUT
c=toLinearSpace(c);
#endif
result+=c*NoL;}}
result=result/weight;return result;}
#endif
#endif
#endif
`;t.ShaderStore.IncludesShadersStore[a]||(t.ShaderStore.IncludesShadersStore[a]=r),e.s([],289258)},656864,913724,498659,714090,608404,541499,264704,65018,510465,e=>{"use strict";var t=e.i(263537);e.i(654740);let o="pbrFragmentExtraDeclaration",i=`varying vec3 vPositionW;
#if DEBUGMODE>0
varying vec4 vClipSpacePosition;
#endif
#include<mainUVVaryingDeclaration>[1..7]
#ifdef NORMAL
varying vec3 vNormalW;
#if defined(USESPHERICALFROMREFLECTIONMAP) && defined(USESPHERICALINVERTEX)
varying vec3 vEnvironmentIrradiance;
#endif
#endif
#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
varying vec4 vColor;
#endif
#if defined(CLUSTLIGHT_BATCH) && CLUSTLIGHT_BATCH>0
varying float vViewDepth;
#endif
`;t.ShaderStore.IncludesShadersStore[o]||(t.ShaderStore.IncludesShadersStore[o]=i),e.s([],656864);let a="subSurfaceScatteringFunctions",r=`bool testLightingForSSS(float diffusionProfile)
{return diffusionProfile<1.;}`;t.ShaderStore.IncludesShadersStore[a]||(t.ShaderStore.IncludesShadersStore[a]=r),e.s([],913724);let l="pbrHelperFunctions",n=`#define MINIMUMVARIANCE 0.0005
float convertRoughnessToAverageSlope(float roughness)
{return square(roughness)+MINIMUMVARIANCE;}
float fresnelGrazingReflectance(float reflectance0) {float reflectance90=saturate(reflectance0*25.0);return reflectance90;}
vec2 getAARoughnessFactors(vec3 normalVector) {
#ifdef SPECULARAA
vec3 nDfdx=dFdx(normalVector.xyz);vec3 nDfdy=dFdy(normalVector.xyz);float slopeSquare=max(dot(nDfdx,nDfdx),dot(nDfdy,nDfdy));float geometricRoughnessFactor=pow(saturate(slopeSquare),0.333);float geometricAlphaGFactor=sqrt(slopeSquare);geometricAlphaGFactor*=0.75;return vec2(geometricRoughnessFactor,geometricAlphaGFactor);
#else
return vec2(0.);
#endif
}
#ifdef ANISOTROPIC
#ifdef ANISOTROPIC_LEGACY
vec2 getAnisotropicRoughness(float alphaG,float anisotropy) {float alphaT=max(alphaG*(1.0+anisotropy),MINIMUMVARIANCE);float alphaB=max(alphaG*(1.0-anisotropy),MINIMUMVARIANCE);return vec2(alphaT,alphaB);}
vec3 getAnisotropicBentNormals(const vec3 T,const vec3 B,const vec3 N,const vec3 V,float anisotropy,float roughness) {vec3 anisotropicFrameDirection;if (anisotropy>=0.0) {anisotropicFrameDirection=B;} else {anisotropicFrameDirection=T;}
vec3 anisotropicFrameTangent=cross(normalize(anisotropicFrameDirection),V);vec3 anisotropicFrameNormal=cross(anisotropicFrameTangent,anisotropicFrameDirection);vec3 anisotropicNormal=normalize(mix(N,anisotropicFrameNormal,abs(anisotropy)));return anisotropicNormal;}
#elif ANISOTROPIC_OPENPBR
vec2 getAnisotropicRoughness(float alphaG,float anisotropy) {float alphaT=max(alphaG*alphaG*sqrt(2.0/(1.0+(1.0-anisotropy)*(1.0-anisotropy))),MINIMUMVARIANCE);float alphaB=max(alphaT*(1.0-anisotropy),MINIMUMVARIANCE);return vec2(alphaT,alphaB);}
#else
vec2 getAnisotropicRoughness(float alphaG,float anisotropy) {float alphaT=max(mix(alphaG,1.0,anisotropy*anisotropy),MINIMUMVARIANCE);float alphaB=max(alphaG,MINIMUMVARIANCE);return vec2(alphaT,alphaB);}
vec3 getAnisotropicBentNormals(const vec3 T,const vec3 B,const vec3 N,const vec3 V,float anisotropy,float roughness) {vec3 bentNormal=cross(B,V);bentNormal=normalize(cross(bentNormal,B));float a=square(square(1.0-anisotropy*(1.0-roughness)));bentNormal=normalize(mix(bentNormal,N,a));return bentNormal;}
#endif
#endif
#if defined(CLEARCOAT) || defined(SS_REFRACTION)
vec3 cocaLambert(vec3 alpha,float distance) {return exp(-alpha*distance);}
vec3 cocaLambert(float NdotVRefract,float NdotLRefract,vec3 alpha,float thickness) {return cocaLambert(alpha,(thickness*((NdotLRefract+NdotVRefract)/(NdotLRefract*NdotVRefract))));}
vec3 computeColorAtDistanceInMedia(vec3 color,float distance) {return -log(color)/distance;}
vec3 computeClearCoatAbsorption(float NdotVRefract,float NdotLRefract,vec3 clearCoatColor,float clearCoatThickness,float clearCoatIntensity) {vec3 clearCoatAbsorption=mix(vec3(1.0),
cocaLambert(NdotVRefract,NdotLRefract,clearCoatColor,clearCoatThickness),
clearCoatIntensity);return clearCoatAbsorption;}
#endif
#ifdef MICROSURFACEAUTOMATIC
float computeDefaultMicroSurface(float microSurface,vec3 reflectivityColor)
{const float kReflectivityNoAlphaWorkflow_SmoothnessMax=0.95;float reflectivityLuminance=getLuminance(reflectivityColor);float reflectivityLuma=sqrt(reflectivityLuminance);microSurface=reflectivityLuma*kReflectivityNoAlphaWorkflow_SmoothnessMax;return microSurface;}
#endif
`;t.ShaderStore.IncludesShadersStore[l]||(t.ShaderStore.IncludesShadersStore[l]=n),e.s([],498659),e.i(562740);let c="pbrDirectLightingSetupFunctions",s=`struct preLightingInfo
{vec3 lightOffset;float lightDistanceSquared;float lightDistance;float attenuation;vec3 L;vec3 H;float NdotV;float NdotLUnclamped;float NdotL;float VdotH;float LdotV;float roughness;float diffuseRoughness;vec3 surfaceAlbedo;
#ifdef IRIDESCENCE
float iridescenceIntensity;
#endif
#if defined(AREALIGHTUSED) && defined(AREALIGHTSUPPORTED)
vec3 areaLightDiffuse;
#ifdef SPECULARTERM
vec3 areaLightSpecular;vec4 areaLightFresnel;
#endif
#endif
};preLightingInfo computePointAndSpotPreLightingInfo(vec4 lightData,vec3 V,vec3 N,vec3 posW) {preLightingInfo result;result.lightOffset=lightData.xyz-posW;result.lightDistanceSquared=dot(result.lightOffset,result.lightOffset);result.lightDistance=sqrt(result.lightDistanceSquared);result.L=normalize(result.lightOffset);result.H=normalize(V+result.L);result.VdotH=saturate(dot(V,result.H));result.NdotLUnclamped=dot(N,result.L);result.NdotL=saturateEps(result.NdotLUnclamped);result.LdotV=0.;result.roughness=0.;result.diffuseRoughness=0.;result.surfaceAlbedo=vec3(0.);return result;}
preLightingInfo computeDirectionalPreLightingInfo(vec4 lightData,vec3 V,vec3 N) {preLightingInfo result;result.lightDistance=length(-lightData.xyz);result.L=normalize(-lightData.xyz);result.H=normalize(V+result.L);result.VdotH=saturate(dot(V,result.H));result.NdotLUnclamped=dot(N,result.L);result.NdotL=saturateEps(result.NdotLUnclamped);result.LdotV=dot(result.L,V);result.roughness=0.;result.diffuseRoughness=0.;result.surfaceAlbedo=vec3(0.);return result;}
preLightingInfo computeHemisphericPreLightingInfo(vec4 lightData,vec3 V,vec3 N) {preLightingInfo result;result.NdotL=dot(N,lightData.xyz)*0.5+0.5;result.NdotL=saturateEps(result.NdotL);result.NdotLUnclamped=result.NdotL;
#ifdef SPECULARTERM
result.L=normalize(lightData.xyz);result.H=normalize(V+result.L);result.VdotH=saturate(dot(V,result.H));
#endif
result.LdotV=0.;result.roughness=0.;result.diffuseRoughness=0.;result.surfaceAlbedo=vec3(0.);return result;}
#if defined(AREALIGHTUSED) && defined(AREALIGHTSUPPORTED)
#include<ltcHelperFunctions>
uniform sampler2D areaLightsLTC1Sampler;uniform sampler2D areaLightsLTC2Sampler;preLightingInfo computeAreaPreLightingInfo(sampler2D ltc1,sampler2D ltc2,vec3 viewDirectionW,vec3 vNormal,vec3 vPosition,vec4 lightData,vec3 halfWidth,vec3 halfHeight,float roughness )
{preLightingInfo result;result.lightOffset=lightData.xyz-vPosition;result.lightDistanceSquared=dot(result.lightOffset,result.lightOffset);result.lightDistance=sqrt(result.lightDistanceSquared);areaLightData data=computeAreaLightSpecularDiffuseFresnel(ltc1,ltc2,viewDirectionW,vNormal,vPosition,lightData.xyz,halfWidth,halfHeight,roughness);
#ifdef SPECULARTERM
result.areaLightFresnel=data.Fresnel;result.areaLightSpecular=data.Specular;
#endif
result.areaLightDiffuse=data.Diffuse;result.LdotV=0.;result.roughness=0.;result.diffuseRoughness=0.;result.surfaceAlbedo=vec3(0.);return result;}
preLightingInfo computeAreaPreLightingInfoWithTexture(sampler2D ltc1,sampler2D ltc2,sampler2D emissionTexture,vec3 viewDirectionW,vec3 vNormal,vec3 vPosition,vec4 lightData,vec3 halfWidth,vec3 halfHeight,float roughness )
{preLightingInfo result;result.lightOffset=lightData.xyz-vPosition;result.lightDistanceSquared=dot(result.lightOffset,result.lightOffset);result.lightDistance=sqrt(result.lightDistanceSquared);areaLightData data=computeAreaLightSpecularDiffuseFresnelWithEmission(ltc1,ltc2,emissionTexture,viewDirectionW,vNormal,vPosition,lightData.xyz,halfWidth,halfHeight,roughness);
#ifdef SPECULARTERM
result.areaLightFresnel=data.Fresnel;result.areaLightSpecular=data.Specular;
#endif
result.areaLightDiffuse=data.Diffuse;result.LdotV=0.;result.roughness=0.;result.diffuseRoughness=0.;result.surfaceAlbedo=vec3(0.);return result;}
#endif
`;t.ShaderStore.IncludesShadersStore[c]||(t.ShaderStore.IncludesShadersStore[c]=s),e.s([],714090);let f="pbrDirectLightingFalloffFunctions",d=`float computeDistanceLightFalloff_Standard(vec3 lightOffset,float range)
{return max(0.,1.0-length(lightOffset)/range);}
float computeDistanceLightFalloff_Physical(float lightDistanceSquared)
{return 1.0/maxEps(lightDistanceSquared);}
float computeDistanceLightFalloff_GLTF(float lightDistanceSquared,float inverseSquaredRange)
{float lightDistanceFalloff=1.0/maxEps(lightDistanceSquared);float factor=lightDistanceSquared*inverseSquaredRange;float attenuation=saturate(1.0-factor*factor);attenuation*=attenuation;lightDistanceFalloff*=attenuation;return lightDistanceFalloff;}
float computeDistanceLightFalloff(vec3 lightOffset,float lightDistanceSquared,float range,float inverseSquaredRange)
{
#ifdef USEPHYSICALLIGHTFALLOFF
return computeDistanceLightFalloff_Physical(lightDistanceSquared);
#elif defined(USEGLTFLIGHTFALLOFF)
return computeDistanceLightFalloff_GLTF(lightDistanceSquared,inverseSquaredRange);
#else
return computeDistanceLightFalloff_Standard(lightOffset,range);
#endif
}
float computeDirectionalLightFalloff_Standard(vec3 lightDirection,vec3 directionToLightCenterW,float cosHalfAngle,float exponent)
{float falloff=0.0;float cosAngle=maxEps(dot(-lightDirection,directionToLightCenterW));if (cosAngle>=cosHalfAngle)
{falloff=max(0.,pow(cosAngle,exponent));}
return falloff;}
float computeDirectionalLightFalloff_IES(vec3 lightDirection,vec3 directionToLightCenterW,sampler2D iesLightSampler)
{float cosAngle=dot(-lightDirection,directionToLightCenterW);float angle=acos(cosAngle)/PI;return texture2D(iesLightSampler,vec2(angle,0.)).r;}
float computeDirectionalLightFalloff_Physical(vec3 lightDirection,vec3 directionToLightCenterW,float cosHalfAngle)
{const float kMinusLog2ConeAngleIntensityRatio=6.64385618977; 
float concentrationKappa=kMinusLog2ConeAngleIntensityRatio/(1.0-cosHalfAngle);vec4 lightDirectionSpreadSG=vec4(-lightDirection*concentrationKappa,-concentrationKappa);float falloff=exp2(dot(vec4(directionToLightCenterW,1.0),lightDirectionSpreadSG));return falloff;}
float computeDirectionalLightFalloff_GLTF(vec3 lightDirection,vec3 directionToLightCenterW,float lightAngleScale,float lightAngleOffset)
{float cd=dot(-lightDirection,directionToLightCenterW);float falloff=saturate(cd*lightAngleScale+lightAngleOffset);falloff*=falloff;return falloff;}
float computeDirectionalLightFalloff(vec3 lightDirection,vec3 directionToLightCenterW,float cosHalfAngle,float exponent,float lightAngleScale,float lightAngleOffset)
{
#ifdef USEPHYSICALLIGHTFALLOFF
return computeDirectionalLightFalloff_Physical(lightDirection,directionToLightCenterW,cosHalfAngle);
#elif defined(USEGLTFLIGHTFALLOFF)
return computeDirectionalLightFalloff_GLTF(lightDirection,directionToLightCenterW,lightAngleScale,lightAngleOffset);
#else
return computeDirectionalLightFalloff_Standard(lightDirection,directionToLightCenterW,cosHalfAngle,exponent);
#endif
}`;t.ShaderStore.IncludesShadersStore[f]||(t.ShaderStore.IncludesShadersStore[f]=d),e.s([],608404);let u="pbrDirectLightingFunctions",v=`#define CLEARCOATREFLECTANCE90 1.0
struct lightingInfo
{vec3 diffuse;
#ifdef SS_TRANSLUCENCY
vec3 diffuseTransmission;
#endif
#ifdef SPECULARTERM
vec3 specular;
#endif
#ifdef CLEARCOAT
vec4 clearCoat;
#endif
#ifdef SHEEN
vec3 sheen;
#endif
};float adjustRoughnessFromLightProperties(float roughness,float lightRadius,float lightDistance) {
#if defined(USEPHYSICALLIGHTFALLOFF) || defined(USEGLTFLIGHTFALLOFF)
float lightRoughness=lightRadius/lightDistance;float totalRoughness=saturate(lightRoughness+roughness);return totalRoughness;
#else
return roughness;
#endif
}
vec3 computeHemisphericDiffuseLighting(preLightingInfo info,vec3 lightColor,vec3 groundColor) {return mix(groundColor,lightColor,info.NdotL);}
#if defined(AREALIGHTUSED) && defined(AREALIGHTSUPPORTED)
vec3 computeAreaDiffuseLighting(preLightingInfo info,vec3 lightColor) {return info.areaLightDiffuse*lightColor;}
#endif
vec3 computeDiffuseLighting(preLightingInfo info,vec3 lightColor) {vec3 diffuseTerm=vec3(1.0/PI);
#if BASE_DIFFUSE_MODEL==BRDF_DIFFUSE_MODEL_LEGACY
diffuseTerm=vec3(diffuseBRDF_Burley(info.NdotL,info.NdotV,info.VdotH,info.roughness));
#elif BASE_DIFFUSE_MODEL==BRDF_DIFFUSE_MODEL_BURLEY
diffuseTerm=vec3(diffuseBRDF_Burley(info.NdotL,info.NdotV,info.VdotH,info.diffuseRoughness));
#elif BASE_DIFFUSE_MODEL==BRDF_DIFFUSE_MODEL_EON
vec3 clampedAlbedo=clamp(info.surfaceAlbedo,vec3(0.1),vec3(1.0));diffuseTerm=diffuseBRDF_EON(clampedAlbedo,info.diffuseRoughness,info.NdotL,info.NdotV,info.LdotV);diffuseTerm/=clampedAlbedo;
#endif
return diffuseTerm*info.attenuation*info.NdotL*lightColor;}
#define inline
vec3 computeProjectionTextureDiffuseLighting(sampler2D projectionLightSampler,mat4 textureProjectionMatrix,vec3 posW){vec4 strq=textureProjectionMatrix*vec4(posW,1.0);strq/=strq.w;vec3 textureColor=texture2D(projectionLightSampler,strq.xy).rgb;return toLinearSpace(textureColor);}
#ifdef SS_TRANSLUCENCY
vec3 computeDiffuseTransmittedLighting(preLightingInfo info,vec3 lightColor,vec3 transmittance) {vec3 transmittanceNdotL=vec3(0.);float NdotL=absEps(info.NdotLUnclamped);
#ifndef SS_TRANSLUCENCY_LEGACY
if (info.NdotLUnclamped<0.0) {
#endif
float wrapNdotL=computeWrappedDiffuseNdotL(NdotL,0.02);float trAdapt=step(0.,info.NdotLUnclamped);transmittanceNdotL=mix(transmittance*wrapNdotL,vec3(wrapNdotL),trAdapt);
#ifndef SS_TRANSLUCENCY_LEGACY
}
vec3 diffuseTerm=vec3(1.0/PI);
#if BASE_DIFFUSE_MODEL==BRDF_DIFFUSE_MODEL_LEGACY
diffuseTerm=vec3(diffuseBRDF_Burley(info.NdotL,info.NdotV,info.VdotH,info.roughness));
#elif BASE_DIFFUSE_MODEL==BRDF_DIFFUSE_MODEL_BURLEY
diffuseTerm=vec3(diffuseBRDF_Burley(info.NdotL,info.NdotV,info.VdotH,info.diffuseRoughness));
#elif BASE_DIFFUSE_MODEL==BRDF_DIFFUSE_MODEL_EON
vec3 clampedAlbedo=clamp(info.surfaceAlbedo,vec3(0.1),vec3(1.0));diffuseTerm=diffuseBRDF_EON(clampedAlbedo,info.diffuseRoughness,info.NdotL,info.NdotV,info.LdotV);diffuseTerm/=clampedAlbedo;
#endif
#else
float diffuseTerm=diffuseBRDF_Burley(NdotL,info.NdotV,info.VdotH,info.roughness);
#endif
return diffuseTerm*transmittanceNdotL*info.attenuation*lightColor;}
#endif
#ifdef SPECULARTERM
vec3 computeSpecularLighting(preLightingInfo info,vec3 N,vec3 reflectance0,vec3 fresnel,float geometricRoughnessFactor,vec3 lightColor) {float NdotH=saturateEps(dot(N,info.H));float roughness=max(info.roughness,geometricRoughnessFactor);float alphaG=convertRoughnessToAverageSlope(roughness);
#ifdef IRIDESCENCE
fresnel=mix(fresnel,reflectance0,info.iridescenceIntensity);
#endif
float distribution=normalDistributionFunction_TrowbridgeReitzGGX(NdotH,alphaG);
#ifdef BRDF_V_HEIGHT_CORRELATED
float smithVisibility=smithVisibility_GGXCorrelated(info.NdotL,info.NdotV,alphaG);
#else
float smithVisibility=smithVisibility_TrowbridgeReitzGGXFast(info.NdotL,info.NdotV,alphaG);
#endif
vec3 specTerm=fresnel*distribution*smithVisibility;return specTerm*info.attenuation*info.NdotL*lightColor;}
#if defined(AREALIGHTUSED) && defined(AREALIGHTSUPPORTED)
vec3 computeAreaSpecularLighting(preLightingInfo info,vec3 specularColor,vec3 reflectance0,vec3 reflectance90) {vec3 fresnel=specularColor*info.areaLightFresnel.x*reflectance0+( vec3( 1.0 )-specularColor )*info.areaLightFresnel.y*reflectance90;return specularColor*fresnel*info.areaLightSpecular;}
#endif
#endif
#ifdef FUZZ
float evalFuzz(vec3 L,float NdotL,float NdotV,vec3 T,vec3 B,vec3 ltcLut)
{if (NdotL<=0.0 || NdotV<=0.0)
return 0.0;mat3 M=mat3(
vec3(ltcLut.r,0.0,0.0),
vec3(ltcLut.g,1.0,0.0),
vec3(0.0,0.0,1.0)
);vec3 Llocal=vec3(dot(L,T),dot(L,B),NdotL);vec3 Lwarp=normalize(M*Llocal);float cosThetaWarp=max(Lwarp.z,0.0);return cosThetaWarp*NdotL;}
#endif
#if defined(ANISOTROPIC) && defined(ANISOTROPIC_OPENPBR)
vec3 computeAnisotropicSpecularLighting(preLightingInfo info,vec3 V,vec3 N,vec3 T,vec3 B,float anisotropy,float geometricRoughnessFactor,vec3 lightColor) {float NdotH=saturateEps(dot(N,info.H));float TdotH=dot(T,info.H);float BdotH=dot(B,info.H);float TdotV=dot(T,V);float BdotV=dot(B,V);float TdotL=dot(T,info.L);float BdotL=dot(B,info.L);float alphaG=convertRoughnessToAverageSlope(info.roughness);vec2 alphaTB=getAnisotropicRoughness(alphaG,anisotropy);float distribution=normalDistributionFunction_BurleyGGX_Anisotropic(NdotH,TdotH,BdotH,alphaTB);float smithVisibility=smithVisibility_GGXCorrelated_Anisotropic(info.NdotL,info.NdotV,TdotV,BdotV,TdotL,BdotL,alphaTB);vec3 specTerm=vec3(distribution*smithVisibility);return specTerm*info.attenuation*info.NdotL*lightColor;}
#elif defined(ANISOTROPIC)
vec3 computeAnisotropicSpecularLighting(preLightingInfo info,vec3 V,vec3 N,vec3 T,vec3 B,float anisotropy,vec3 reflectance0,vec3 reflectance90,float geometricRoughnessFactor,vec3 lightColor) {float NdotH=saturateEps(dot(N,info.H));float TdotH=dot(T,info.H);float BdotH=dot(B,info.H);float TdotV=dot(T,V);float BdotV=dot(B,V);float TdotL=dot(T,info.L);float BdotL=dot(B,info.L);float alphaG=convertRoughnessToAverageSlope(info.roughness);vec2 alphaTB=getAnisotropicRoughness(alphaG,anisotropy);alphaTB=max(alphaTB,square(geometricRoughnessFactor));vec3 fresnel=fresnelSchlickGGX(info.VdotH,reflectance0,reflectance90);
#ifdef IRIDESCENCE
fresnel=mix(fresnel,reflectance0,info.iridescenceIntensity);
#endif
float distribution=normalDistributionFunction_BurleyGGX_Anisotropic(NdotH,TdotH,BdotH,alphaTB);float smithVisibility=smithVisibility_GGXCorrelated_Anisotropic(info.NdotL,info.NdotV,TdotV,BdotV,TdotL,BdotL,alphaTB);vec3 specTerm=fresnel*distribution*smithVisibility;return specTerm*info.attenuation*info.NdotL*lightColor;}
#endif
#ifdef CLEARCOAT
vec4 computeClearCoatLighting(preLightingInfo info,vec3 Ncc,float geometricRoughnessFactor,float clearCoatIntensity,vec3 lightColor) {float NccdotL=saturateEps(dot(Ncc,info.L));float NccdotH=saturateEps(dot(Ncc,info.H));float clearCoatRoughness=max(info.roughness,geometricRoughnessFactor);float alphaG=convertRoughnessToAverageSlope(clearCoatRoughness);float fresnel=fresnelSchlickGGX(info.VdotH,vClearCoatRefractionParams.x,CLEARCOATREFLECTANCE90);fresnel*=clearCoatIntensity;float distribution=normalDistributionFunction_TrowbridgeReitzGGX(NccdotH,alphaG);float kelemenVisibility=visibility_Kelemen(info.VdotH);float clearCoatTerm=fresnel*distribution*kelemenVisibility;return vec4(
clearCoatTerm*info.attenuation*NccdotL*lightColor,
1.0-fresnel
);}
vec3 computeClearCoatLightingAbsorption(float NdotVRefract,vec3 L,vec3 Ncc,vec3 clearCoatColor,float clearCoatThickness,float clearCoatIntensity) {vec3 LRefract=-refract(L,Ncc,vClearCoatRefractionParams.y);float NdotLRefract=saturateEps(dot(Ncc,LRefract));vec3 absorption=computeClearCoatAbsorption(NdotVRefract,NdotLRefract,clearCoatColor,clearCoatThickness,clearCoatIntensity);return absorption;}
#endif
#ifdef SHEEN
vec3 computeSheenLighting(preLightingInfo info,vec3 N,vec3 reflectance0,vec3 reflectance90,float geometricRoughnessFactor,vec3 lightColor) {float NdotH=saturateEps(dot(N,info.H));float roughness=max(info.roughness,geometricRoughnessFactor);float alphaG=convertRoughnessToAverageSlope(roughness);float fresnel=1.;float distribution=normalDistributionFunction_CharlieSheen(NdotH,alphaG);/*#ifdef SHEEN_SOFTER
float visibility=visibility_CharlieSheen(info.NdotL,info.NdotV,alphaG);
#else */
float visibility=visibility_Ashikhmin(info.NdotL,info.NdotV);/* #endif */
float sheenTerm=fresnel*distribution*visibility;return sheenTerm*info.attenuation*info.NdotL*lightColor;}
#endif
`;t.ShaderStore.IncludesShadersStore[u]||(t.ShaderStore.IncludesShadersStore[u]=v),e.s([],541499);let h="pbrBlockNormalGeometric",p=`vec3 viewDirectionW=normalize(vEyePosition.xyz-vPositionW);
#ifdef NORMAL
vec3 normalW=normalize(vNormalW);
#else
vec3 normalW=normalize(cross(dFdx(vPositionW),dFdy(vPositionW)))*vEyePosition.w;
#endif
vec3 geometricNormalW=normalW;
#if defined(TWOSIDEDLIGHTING) && defined(NORMAL)
geometricNormalW=gl_FrontFacing ? geometricNormalW : -geometricNormalW;
#endif
`;t.ShaderStore.IncludesShadersStore[h]||(t.ShaderStore.IncludesShadersStore[h]=p),e.s([],264704);let g="pbrBlockImageProcessing",S=`#if defined(IMAGEPROCESSINGPOSTPROCESS) || defined(SS_SCATTERING)
#if !defined(SKIPFINALCOLORCLAMP)
finalColor.rgb=clamp(finalColor.rgb,0.,30.0);
#endif
#else
finalColor=applyImageProcessing(finalColor);
#endif
finalColor.a*=visibility;
#ifdef PREMULTIPLYALPHA
finalColor.rgb*=finalColor.a;
#endif
`;t.ShaderStore.IncludesShadersStore[g]||(t.ShaderStore.IncludesShadersStore[g]=S),e.s([],65018);let m="pbrDebug",E=`#if DEBUGMODE>0
if (vClipSpacePosition.x/vClipSpacePosition.w>=vDebugMode.x) {
#if DEBUGMODE==1
gl_FragColor.rgb=vPositionW.rgb;
#define DEBUGMODE_NORMALIZE
#elif DEBUGMODE==2 && defined(NORMAL)
gl_FragColor.rgb=vNormalW.rgb;
#define DEBUGMODE_NORMALIZE
#elif DEBUGMODE==3 && defined(BUMP) || DEBUGMODE==3 && defined(PARALLAX) || DEBUGMODE==3 && defined(ANISOTROPIC)
gl_FragColor.rgb=TBN[0];
#define DEBUGMODE_NORMALIZE
#elif DEBUGMODE==4 && defined(BUMP) || DEBUGMODE==4 && defined(PARALLAX) || DEBUGMODE==4 && defined(ANISOTROPIC)
gl_FragColor.rgb=TBN[1];
#define DEBUGMODE_NORMALIZE
#elif DEBUGMODE==5
gl_FragColor.rgb=normalW;
#define DEBUGMODE_NORMALIZE
#elif DEBUGMODE==6 && defined(MAINUV1)
gl_FragColor.rgb=vec3(vMainUV1,0.0);
#elif DEBUGMODE==7 && defined(MAINUV2)
gl_FragColor.rgb=vec3(vMainUV2,0.0);
#elif DEBUGMODE==8 && defined(CLEARCOAT) && defined(CLEARCOAT_BUMP)
gl_FragColor.rgb=clearcoatOut.TBNClearCoat[0];
#define DEBUGMODE_NORMALIZE
#elif DEBUGMODE==9 && defined(CLEARCOAT) && defined(CLEARCOAT_BUMP)
gl_FragColor.rgb=clearcoatOut.TBNClearCoat[1];
#define DEBUGMODE_NORMALIZE
#elif DEBUGMODE==10 && defined(CLEARCOAT)
gl_FragColor.rgb=clearcoatOut.clearCoatNormalW;
#define DEBUGMODE_NORMALIZE
#elif DEBUGMODE==11 && defined(ANISOTROPIC)
gl_FragColor.rgb=anisotropicOut.anisotropicNormal;
#define DEBUGMODE_NORMALIZE
#elif DEBUGMODE==12 && defined(ANISOTROPIC)
gl_FragColor.rgb=anisotropicOut.anisotropicTangent;
#define DEBUGMODE_NORMALIZE
#elif DEBUGMODE==13 && defined(ANISOTROPIC)
gl_FragColor.rgb=anisotropicOut.anisotropicBitangent;
#define DEBUGMODE_NORMALIZE
#elif DEBUGMODE==20 && defined(ALBEDO)
gl_FragColor.rgb=albedoTexture.rgb;
#ifndef GAMMAALBEDO
#define DEBUGMODE_GAMMA
#endif
#elif DEBUGMODE==21 && defined(AMBIENT)
gl_FragColor.rgb=aoOut.ambientOcclusionColorMap.rgb;
#elif DEBUGMODE==22 && defined(OPACITY)
gl_FragColor.rgb=opacityMap.rgb;
#elif DEBUGMODE==23 && defined(EMISSIVE)
gl_FragColor.rgb=emissiveColorTex.rgb;
#ifndef GAMMAEMISSIVE
#define DEBUGMODE_GAMMA
#endif
#elif DEBUGMODE==24 && defined(LIGHTMAP)
gl_FragColor.rgb=lightmapColor.rgb;
#ifndef GAMMALIGHTMAP
#define DEBUGMODE_GAMMA
#endif
#elif DEBUGMODE==25 && defined(REFLECTIVITY) && defined(METALLICWORKFLOW)
gl_FragColor.rgb=reflectivityOut.surfaceMetallicColorMap.rgb;
#elif DEBUGMODE==26 && defined(REFLECTIVITY) && !defined(METALLICWORKFLOW)
gl_FragColor.rgb=reflectivityOut.surfaceReflectivityColorMap.rgb;
#define DEBUGMODE_GAMMA
#elif DEBUGMODE==27 && defined(CLEARCOAT) && defined(CLEARCOAT_TEXTURE)
gl_FragColor.rgb=vec3(clearcoatOut.clearCoatMapData.rg,0.0);
#elif DEBUGMODE==28 && defined(CLEARCOAT) && defined(CLEARCOAT_TINT) && defined(CLEARCOAT_TINT_TEXTURE)
gl_FragColor.rgb=clearcoatOut.clearCoatTintMapData.rgb;
#elif DEBUGMODE==29 && defined(SHEEN) && defined(SHEEN_TEXTURE)
gl_FragColor.rgb=sheenOut.sheenMapData.rgb;
#elif DEBUGMODE==30 && defined(ANISOTROPIC) && defined(ANISOTROPIC_TEXTURE)
gl_FragColor.rgb=anisotropicOut.anisotropyMapData.rgb;
#elif DEBUGMODE==31 && defined(SUBSURFACE) && defined(SS_THICKNESSANDMASK_TEXTURE)
gl_FragColor.rgb=subSurfaceOut.thicknessMap.rgb;
#elif DEBUGMODE==32 && defined(BUMP)
gl_FragColor.rgb=texture2D(bumpSampler,vBumpUV).rgb;
#elif DEBUGMODE==40 && defined(SS_REFRACTION)
gl_FragColor.rgb=subSurfaceOut.environmentRefraction.rgb;
#define DEBUGMODE_GAMMA
#elif DEBUGMODE==41 && defined(REFLECTION)
gl_FragColor.rgb=reflectionOut.environmentRadiance.rgb;
#ifndef GAMMAREFLECTION
#define DEBUGMODE_GAMMA
#endif
#elif DEBUGMODE==42 && defined(CLEARCOAT) && defined(REFLECTION)
gl_FragColor.rgb=clearcoatOut.environmentClearCoatRadiance.rgb;
#define DEBUGMODE_GAMMA
#elif DEBUGMODE==50
gl_FragColor.rgb=diffuseBase.rgb;
#define DEBUGMODE_GAMMA
#elif DEBUGMODE==51 && defined(SPECULARTERM)
gl_FragColor.rgb=specularBase.rgb;
#define DEBUGMODE_GAMMA
#elif DEBUGMODE==52 && defined(CLEARCOAT)
gl_FragColor.rgb=clearCoatBase.rgb;
#define DEBUGMODE_GAMMA
#elif DEBUGMODE==53 && defined(SHEEN)
gl_FragColor.rgb=sheenBase.rgb;
#define DEBUGMODE_GAMMA
#elif DEBUGMODE==54 && defined(REFLECTION)
gl_FragColor.rgb=reflectionOut.environmentIrradiance.rgb;
#ifndef GAMMAREFLECTION
#define DEBUGMODE_GAMMA
#endif
#elif DEBUGMODE==60
gl_FragColor.rgb=surfaceAlbedo.rgb;
#define DEBUGMODE_GAMMA
#elif DEBUGMODE==61
gl_FragColor.rgb=clearcoatOut.specularEnvironmentR0;
#define DEBUGMODE_GAMMA
#elif DEBUGMODE==62 && defined(METALLICWORKFLOW)
gl_FragColor.rgb=vec3(reflectivityOut.metallic);
#elif DEBUGMODE==71 && defined(METALLICWORKFLOW)
gl_FragColor.rgb=reflectivityOut.metallicF0;
#elif DEBUGMODE==63
gl_FragColor.rgb=vec3(roughness);
#elif DEBUGMODE==64
gl_FragColor.rgb=vec3(alphaG);
#elif DEBUGMODE==65
gl_FragColor.rgb=vec3(NdotV);
#elif DEBUGMODE==66 && defined(CLEARCOAT) && defined(CLEARCOAT_TINT)
gl_FragColor.rgb=clearcoatOut.clearCoatColor.rgb;
#define DEBUGMODE_GAMMA
#elif DEBUGMODE==67 && defined(CLEARCOAT)
gl_FragColor.rgb=vec3(clearcoatOut.clearCoatRoughness);
#elif DEBUGMODE==68 && defined(CLEARCOAT)
gl_FragColor.rgb=vec3(clearcoatOut.clearCoatNdotV);
#elif DEBUGMODE==69 && defined(SUBSURFACE) && defined(SS_TRANSLUCENCY)
gl_FragColor.rgb=subSurfaceOut.transmittance;
#elif DEBUGMODE==70 && defined(SUBSURFACE) && defined(SS_REFRACTION)
gl_FragColor.rgb=subSurfaceOut.refractionTransmittance;
#elif DEBUGMODE==72
gl_FragColor.rgb=vec3(microSurface);
#elif DEBUGMODE==73
gl_FragColor.rgb=vAlbedoColor.rgb;
#define DEBUGMODE_GAMMA
#elif DEBUGMODE==74 && !defined(METALLICWORKFLOW)
gl_FragColor.rgb=vReflectivityColor.rgb;
#define DEBUGMODE_GAMMA
#elif DEBUGMODE==75
gl_FragColor.rgb=vEmissiveColor.rgb;
#define DEBUGMODE_GAMMA
#elif DEBUGMODE==80 && defined(RADIANCEOCCLUSION)
gl_FragColor.rgb=vec3(seo);
#elif DEBUGMODE==81 && defined(HORIZONOCCLUSION) && defined(BUMP) && defined(REFLECTIONMAP_3D)
gl_FragColor.rgb=vec3(eho);
#elif DEBUGMODE==82 && defined(MS_BRDF_ENERGY_CONSERVATION)
gl_FragColor.rgb=vec3(energyConservationFactor);
#elif DEBUGMODE==83 && defined(ENVIRONMENTBRDF) && !defined(REFLECTIONMAP_SKYBOX)
gl_FragColor.rgb=baseSpecularEnvironmentReflectance;
#define DEBUGMODE_GAMMA
#elif DEBUGMODE==84 && defined(CLEARCOAT) && defined(ENVIRONMENTBRDF) && !defined(REFLECTIONMAP_SKYBOX)
gl_FragColor.rgb=clearcoatOut.clearCoatEnvironmentReflectance;
#define DEBUGMODE_GAMMA
#elif DEBUGMODE==85 && defined(SHEEN) && defined(REFLECTION)
gl_FragColor.rgb=sheenOut.sheenEnvironmentReflectance;
#define DEBUGMODE_GAMMA
#elif DEBUGMODE==86 && defined(ALPHABLEND)
gl_FragColor.rgb=vec3(luminanceOverAlpha);
#elif DEBUGMODE==87
gl_FragColor.rgb=vec3(alpha);
#elif DEBUGMODE==88 && defined(ALBEDO)
gl_FragColor.rgb=vec3(albedoTexture.a);
#elif DEBUGMODE==89
gl_FragColor.rgb=aoOut.ambientOcclusionColor.rgb;
#else
float stripeWidth=30.;float stripePos=floor(gl_FragCoord.x/stripeWidth);float whichColor=mod(stripePos,2.);vec3 color1=vec3(.6,.2,.2);vec3 color2=vec3(.3,.1,.1);gl_FragColor.rgb=mix(color1,color2,whichColor);
#endif
gl_FragColor.rgb*=vDebugMode.y;
#ifdef DEBUGMODE_NORMALIZE
gl_FragColor.rgb=normalize(gl_FragColor.rgb)*0.5+0.5;
#endif
#ifdef DEBUGMODE_GAMMA
gl_FragColor.rgb=toGammaSpace(gl_FragColor.rgb);
#endif
gl_FragColor.a=1.0;
#ifdef PREPASS
gl_FragData[0]=toLinearSpace(gl_FragColor); 
gl_FragData[1]=vec4(0.,0.,0.,0.); 
#endif
#ifdef DEBUGMODE_FORCERETURN
return;
#endif
}
#endif
`;t.ShaderStore.IncludesShadersStore[m]||(t.ShaderStore.IncludesShadersStore[m]=E),e.s([],510465)},629238,e=>{"use strict";var t=e.i(263537);let o="sceneUboDeclaration",i=`layout(std140,column_major) uniform;uniform Scene {mat4 viewProjection;
#ifdef MULTIVIEW
mat4 viewProjectionR;
#endif 
mat4 view;mat4 projection;vec4 vEyePosition;mat4 inverseProjection;};
`;t.ShaderStore.IncludesShadersStore[o]||(t.ShaderStore.IncludesShadersStore[o]=i),e.s([])},997900,e=>{"use strict";var t=e.i(263537);let o="meshUboDeclaration",i=`#ifdef WEBGL2
uniform mat4 world;uniform float visibility;
#else
layout(std140,column_major) uniform;uniform Mesh
{mat4 world;float visibility;};
#endif
#define WORLD_UBO
`;t.ShaderStore.IncludesShadersStore[o]||(t.ShaderStore.IncludesShadersStore[o]=i),e.s([])},654740,e=>{"use strict";var t=e.i(263537);let o="mainUVVaryingDeclaration",i=`#ifdef MAINUV{X}
varying vec2 vMainUV{X};
#endif
`;t.ShaderStore.IncludesShadersStore[o]||(t.ShaderStore.IncludesShadersStore[o]=i),e.s([])},241326,e=>{"use strict";var t=e.i(263537);let o="harmonicsFunctions",i=`#ifdef USESPHERICALFROMREFLECTIONMAP
#ifdef SPHERICAL_HARMONICS
vec3 computeEnvironmentIrradiance(vec3 normal) {return vSphericalL00
+ vSphericalL1_1*(normal.y)
+ vSphericalL10*(normal.z)
+ vSphericalL11*(normal.x)
+ vSphericalL2_2*(normal.y*normal.x)
+ vSphericalL2_1*(normal.y*normal.z)
+ vSphericalL20*((3.0*normal.z*normal.z)-1.0)
+ vSphericalL21*(normal.z*normal.x)
+ vSphericalL22*(normal.x*normal.x-(normal.y*normal.y));}
#else
vec3 computeEnvironmentIrradiance(vec3 normal) {float Nx=normal.x;float Ny=normal.y;float Nz=normal.z;vec3 C1=vSphericalZZ.rgb;vec3 Cx=vSphericalX.rgb;vec3 Cy=vSphericalY.rgb;vec3 Cz=vSphericalZ.rgb;vec3 Cxx_zz=vSphericalXX_ZZ.rgb;vec3 Cyy_zz=vSphericalYY_ZZ.rgb;vec3 Cxy=vSphericalXY.rgb;vec3 Cyz=vSphericalYZ.rgb;vec3 Czx=vSphericalZX.rgb;vec3 a1=Cyy_zz*Ny+Cy;vec3 a2=Cyz*Nz+a1;vec3 b1=Czx*Nz+Cx;vec3 b2=Cxy*Ny+b1;vec3 b3=Cxx_zz*Nx+b2;vec3 t1=Cz *Nz+C1;vec3 t2=a2 *Ny+t1;vec3 t3=b3 *Nx+t2;return t3;}
#endif
#endif
`;t.ShaderStore.IncludesShadersStore[o]||(t.ShaderStore.IncludesShadersStore[o]=i),e.s([])},534236,e=>{"use strict";var t=e.i(263537);let o="reflectionFunction",i=`vec3 computeFixedEquirectangularCoords(vec4 worldPos,vec3 worldNormal,vec3 direction)
{float lon=atan(direction.z,direction.x);float lat=acos(direction.y);vec2 sphereCoords=vec2(lon,lat)*RECIPROCAL_PI2*2.0;float s=sphereCoords.x*0.5+0.5;float t=sphereCoords.y;return vec3(s,t,0); }
vec3 computeMirroredFixedEquirectangularCoords(vec4 worldPos,vec3 worldNormal,vec3 direction)
{float lon=atan(direction.z,direction.x);float lat=acos(direction.y);vec2 sphereCoords=vec2(lon,lat)*RECIPROCAL_PI2*2.0;float s=sphereCoords.x*0.5+0.5;float t=sphereCoords.y;return vec3(1.0-s,t,0); }
vec3 computeEquirectangularCoords(vec4 worldPos,vec3 worldNormal,vec3 eyePosition,mat4 reflectionMatrix)
{vec3 cameraToVertex=normalize(worldPos.xyz-eyePosition);vec3 r=normalize(reflect(cameraToVertex,worldNormal));r=vec3(reflectionMatrix*vec4(r,0));float lon=atan(r.z,r.x);float lat=acos(r.y);vec2 sphereCoords=vec2(lon,lat)*RECIPROCAL_PI2*2.0;float s=sphereCoords.x*0.5+0.5;float t=sphereCoords.y;return vec3(s,t,0);}
vec3 computeSphericalCoords(vec4 worldPos,vec3 worldNormal,mat4 view,mat4 reflectionMatrix)
{vec3 viewDir=normalize(vec3(view*worldPos));vec3 viewNormal=normalize(vec3(view*vec4(worldNormal,0.0)));vec3 r=reflect(viewDir,viewNormal);r=vec3(reflectionMatrix*vec4(r,0));r.z=r.z-1.0;float m=2.0*length(r);return vec3(r.x/m+0.5,1.0-r.y/m-0.5,0);}
vec3 computePlanarCoords(vec4 worldPos,vec3 worldNormal,vec3 eyePosition,mat4 reflectionMatrix)
{vec3 viewDir=worldPos.xyz-eyePosition;vec3 coords=normalize(reflect(viewDir,worldNormal));return vec3(reflectionMatrix*vec4(coords,1));}
vec3 computeCubicCoords(vec4 worldPos,vec3 worldNormal,vec3 eyePosition,mat4 reflectionMatrix)
{vec3 viewDir=normalize(worldPos.xyz-eyePosition);vec3 coords=reflect(viewDir,worldNormal);coords=vec3(reflectionMatrix*vec4(coords,0));
#ifdef INVERTCUBICMAP
coords.y*=-1.0;
#endif
return coords;}
vec3 computeCubicLocalCoords(vec4 worldPos,vec3 worldNormal,vec3 eyePosition,mat4 reflectionMatrix,vec3 reflectionSize,vec3 reflectionPosition)
{vec3 viewDir=normalize(worldPos.xyz-eyePosition);vec3 coords=reflect(viewDir,worldNormal);coords=parallaxCorrectNormal(worldPos.xyz,coords,reflectionSize,reflectionPosition);coords=vec3(reflectionMatrix*vec4(coords,0));
#ifdef INVERTCUBICMAP
coords.y*=-1.0;
#endif
return coords;}
vec3 computeProjectionCoords(vec4 worldPos,mat4 view,mat4 reflectionMatrix)
{return vec3(reflectionMatrix*(view*worldPos));}
vec3 computeSkyBoxCoords(vec3 positionW,mat4 reflectionMatrix)
{return vec3(reflectionMatrix*vec4(positionW,1.));}
#ifdef REFLECTION
vec3 computeReflectionCoords(vec4 worldPos,vec3 worldNormal)
{
#ifdef REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED
vec3 direction=normalize(vDirectionW);return computeMirroredFixedEquirectangularCoords(worldPos,worldNormal,direction);
#endif
#ifdef REFLECTIONMAP_EQUIRECTANGULAR_FIXED
vec3 direction=normalize(vDirectionW);return computeFixedEquirectangularCoords(worldPos,worldNormal,direction);
#endif
#ifdef REFLECTIONMAP_EQUIRECTANGULAR
return computeEquirectangularCoords(worldPos,worldNormal,vEyePosition.xyz,reflectionMatrix);
#endif
#ifdef REFLECTIONMAP_SPHERICAL
return computeSphericalCoords(worldPos,worldNormal,view,reflectionMatrix);
#endif
#ifdef REFLECTIONMAP_PLANAR
return computePlanarCoords(worldPos,worldNormal,vEyePosition.xyz,reflectionMatrix);
#endif
#ifdef REFLECTIONMAP_CUBIC
#ifdef USE_LOCAL_REFLECTIONMAP_CUBIC
return computeCubicLocalCoords(worldPos,worldNormal,vEyePosition.xyz,reflectionMatrix,vReflectionSize,vReflectionPosition);
#else
return computeCubicCoords(worldPos,worldNormal,vEyePosition.xyz,reflectionMatrix);
#endif
#endif
#ifdef REFLECTIONMAP_PROJECTION
return computeProjectionCoords(worldPos,view,reflectionMatrix);
#endif
#ifdef REFLECTIONMAP_SKYBOX
return computeSkyBoxCoords(vPositionUVW,reflectionMatrix);
#endif
#ifdef REFLECTIONMAP_EXPLICIT
return vec3(0,0,0);
#endif
}
#endif
`;t.ShaderStore.IncludesShadersStore[o]||(t.ShaderStore.IncludesShadersStore[o]=i),e.s(["reflectionFunction",0,{name:o,shader:i}])},10564,e=>{"use strict";var t=e.i(263537);let o="lightUboDeclaration",i=`#ifdef LIGHT{X}
uniform Light{X}
{vec4 vLightData;vec4 vLightDiffuse;vec4 vLightSpecular;
#ifdef SPOTLIGHT{X}
vec4 vLightDirection;vec4 vLightFalloff;
#elif defined(POINTLIGHT{X})
vec4 vLightFalloff;
#elif defined(HEMILIGHT{X})
vec3 vLightGround;
#elif defined(CLUSTLIGHT{X})
vec2 vSliceData;vec2 vSliceRanges[CLUSTLIGHT_SLICES];
#endif
#if defined(AREALIGHT{X}) && defined(AREALIGHTUSED) && defined(AREALIGHTSUPPORTED)
vec4 vLightWidth;vec4 vLightHeight;
#endif
vec4 shadowsInfo;vec2 depthValues;} light{X};
#ifdef IESLIGHTTEXTURE{X}
uniform sampler2D iesLightTexture{X};
#endif
#ifdef RECTAREALIGHTEMISSIONTEXTURE{X}
uniform sampler2D rectAreaLightEmissionTexture{X};
#endif
#ifdef PROJECTEDLIGHTTEXTURE{X}
uniform mat4 textureProjectionMatrix{X};uniform sampler2D projectionLightTexture{X};
#endif
#ifdef CLUSTLIGHT{X}
uniform sampler2D lightDataTexture{X};uniform highp sampler2D tileMaskTexture{X};
#endif
#ifdef SHADOW{X}
#ifdef SHADOWCSM{X}
uniform mat4 lightMatrix{X}[SHADOWCSMNUM_CASCADES{X}];uniform float viewFrustumZ{X}[SHADOWCSMNUM_CASCADES{X}];uniform float frustumLengths{X}[SHADOWCSMNUM_CASCADES{X}];uniform float cascadeBlendFactor{X};varying vec4 vPositionFromLight{X}[SHADOWCSMNUM_CASCADES{X}];varying float vDepthMetric{X}[SHADOWCSMNUM_CASCADES{X}];varying vec4 vPositionFromCamera{X};
#if defined(SHADOWPCSS{X})
uniform highp sampler2DArrayShadow shadowTexture{X};uniform highp sampler2DArray depthTexture{X};uniform vec2 lightSizeUVCorrection{X}[SHADOWCSMNUM_CASCADES{X}];uniform float depthCorrection{X}[SHADOWCSMNUM_CASCADES{X}];uniform float penumbraDarkness{X};
#elif defined(SHADOWPCF{X})
uniform highp sampler2DArrayShadow shadowTexture{X};
#else
uniform highp sampler2DArray shadowTexture{X};
#endif
#ifdef SHADOWCSMDEBUG{X}
const vec3 vCascadeColorsMultiplier{X}[8]=vec3[8]
(
vec3 ( 1.5,0.0,0.0 ),
vec3 ( 0.0,1.5,0.0 ),
vec3 ( 0.0,0.0,5.5 ),
vec3 ( 1.5,0.0,5.5 ),
vec3 ( 1.5,1.5,0.0 ),
vec3 ( 1.0,1.0,1.0 ),
vec3 ( 0.0,1.0,5.5 ),
vec3 ( 0.5,3.5,0.75 )
);vec3 shadowDebug{X};
#endif
#ifdef SHADOWCSMUSESHADOWMAXZ{X}
int index{X}=-1;
#else
int index{X}=SHADOWCSMNUM_CASCADES{X}-1;
#endif
float diff{X}=0.;
#elif defined(SHADOWCUBE{X})
uniform samplerCube shadowTexture{X}; 
#else
varying vec4 vPositionFromLight{X};varying float vDepthMetric{X};
#if defined(SHADOWPCSS{X})
uniform highp sampler2DShadow shadowTexture{X};uniform highp sampler2D depthTexture{X};
#elif defined(SHADOWPCF{X})
uniform highp sampler2DShadow shadowTexture{X};
#else
uniform sampler2D shadowTexture{X};
#endif
uniform mat4 lightMatrix{X};
#endif
#endif
#endif
`;t.ShaderStore.IncludesShadersStore[o]||(t.ShaderStore.IncludesShadersStore[o]=i),e.s(["lightUboDeclaration",0,{name:o,shader:i}])},697427,e=>{"use strict";var t=e.i(263537);let o="lightFragmentDeclaration",i=`#ifdef LIGHT{X}
uniform vec4 vLightData{X};uniform vec4 vLightDiffuse{X};
#ifdef SPECULARTERM
uniform vec4 vLightSpecular{X};
#else
vec4 vLightSpecular{X}=vec4(0.);
#endif
#ifdef SHADOW{X}
#ifdef SHADOWCSM{X}
uniform mat4 lightMatrix{X}[SHADOWCSMNUM_CASCADES{X}];uniform float viewFrustumZ{X}[SHADOWCSMNUM_CASCADES{X}];uniform float frustumLengths{X}[SHADOWCSMNUM_CASCADES{X}];uniform float cascadeBlendFactor{X};varying vec4 vPositionFromLight{X}[SHADOWCSMNUM_CASCADES{X}];varying float vDepthMetric{X}[SHADOWCSMNUM_CASCADES{X}];varying vec4 vPositionFromCamera{X};
#if defined(SHADOWPCSS{X})
uniform highp sampler2DArrayShadow shadowTexture{X};uniform highp sampler2DArray depthTexture{X};uniform vec2 lightSizeUVCorrection{X}[SHADOWCSMNUM_CASCADES{X}];uniform float depthCorrection{X}[SHADOWCSMNUM_CASCADES{X}];uniform float penumbraDarkness{X};
#elif defined(SHADOWPCF{X})
uniform highp sampler2DArrayShadow shadowTexture{X};
#else
uniform highp sampler2DArray shadowTexture{X};
#endif
#ifdef SHADOWCSMDEBUG{X}
const vec3 vCascadeColorsMultiplier{X}[8]=vec3[8]
(
vec3 ( 1.5,0.0,0.0 ),
vec3 ( 0.0,1.5,0.0 ),
vec3 ( 0.0,0.0,5.5 ),
vec3 ( 1.5,0.0,5.5 ),
vec3 ( 1.5,1.5,0.0 ),
vec3 ( 1.0,1.0,1.0 ),
vec3 ( 0.0,1.0,5.5 ),
vec3 ( 0.5,3.5,0.75 )
);vec3 shadowDebug{X};
#endif
#ifdef SHADOWCSMUSESHADOWMAXZ{X}
int index{X}=-1;
#else
int index{X}=SHADOWCSMNUM_CASCADES{X}-1;
#endif
float diff{X}=0.;
#elif defined(SHADOWCUBE{X})
uniform samplerCube shadowTexture{X};
#else
varying vec4 vPositionFromLight{X};varying float vDepthMetric{X};
#if defined(SHADOWPCSS{X})
uniform highp sampler2DShadow shadowTexture{X};uniform highp sampler2D depthTexture{X};
#elif defined(SHADOWPCF{X})
uniform highp sampler2DShadow shadowTexture{X};
#else
uniform sampler2D shadowTexture{X};
#endif
uniform mat4 lightMatrix{X};
#endif
uniform vec4 shadowsInfo{X};uniform vec2 depthValues{X};
#endif
#ifdef SPOTLIGHT{X}
uniform vec4 vLightDirection{X};uniform vec4 vLightFalloff{X};
#elif defined(POINTLIGHT{X})
uniform vec4 vLightFalloff{X};
#elif defined(HEMILIGHT{X})
uniform vec3 vLightGround{X};
#endif
#ifdef AREALIGHT{X}
uniform vec4 vLightWidth{X};uniform vec4 vLightHeight{X};
#ifdef RECTAREALIGHTEMISSIONTEXTURE{X}
uniform sampler2D rectAreaLightEmissionTexture{X};
#endif
#endif
#ifdef IESLIGHTTEXTURE{X}
uniform sampler2D iesLightTexture{X};
#endif
#ifdef PROJECTEDLIGHTTEXTURE{X}
uniform mat4 textureProjectionMatrix{X};uniform sampler2D projectionLightTexture{X};
#endif
#ifdef CLUSTLIGHT{X}
uniform vec2 vSliceData{X};uniform vec2 vSliceRanges{X}[CLUSTLIGHT_SLICES];uniform sampler2D lightDataTexture{X};uniform highp sampler2D tileMaskTexture{X};
#endif
#endif
`;t.ShaderStore.IncludesShadersStore[o]||(t.ShaderStore.IncludesShadersStore[o]=i),e.s(["lightFragmentDeclaration",0,{name:o,shader:i}])},190688,e=>{"use strict";var t=e.i(263537);let o="fogFragmentDeclaration",i=`#ifdef FOG
#define FOGMODE_NONE 0.
#define FOGMODE_EXP 1.
#define FOGMODE_EXP2 2.
#define FOGMODE_LINEAR 3.
#define E 2.71828
uniform vec4 vFogInfos;uniform vec3 vFogColor;varying vec3 vFogDistance;float CalcFogFactor()
{float fogCoeff=1.0;float fogStart=vFogInfos.y;float fogEnd=vFogInfos.z;float fogDensity=vFogInfos.w;float fogDistance=length(vFogDistance);if (FOGMODE_LINEAR==vFogInfos.x)
{fogCoeff=(fogEnd-fogDistance)/(fogEnd-fogStart);}
else if (FOGMODE_EXP==vFogInfos.x)
{fogCoeff=1.0/pow(E,fogDistance*fogDensity);}
else if (FOGMODE_EXP2==vFogInfos.x)
{fogCoeff=1.0/pow(E,fogDistance*fogDistance*fogDensity*fogDensity);}
return clamp(fogCoeff,0.0,1.0);}
#endif
`;t.ShaderStore.IncludesShadersStore[o]||(t.ShaderStore.IncludesShadersStore[o]=i),e.s(["fogFragmentDeclaration",0,{name:o,shader:i}])},313119,e=>{"use strict";var t=e.i(263537);let o="fogFragment",i=`#ifdef FOG
float fog=CalcFogFactor();
#ifdef PBR
fog=toLinearSpace(fog);
#endif
color.rgb=mix(vFogColor,color.rgb,fog);
#endif
`;t.ShaderStore.IncludesShadersStore[o]||(t.ShaderStore.IncludesShadersStore[o]=i),e.s([])},261937,e=>{"use strict";var t=e.i(263537);let o="clipPlaneFragmentDeclaration",i=`#ifdef CLIPPLANE
varying float fClipDistance;
#endif
#ifdef CLIPPLANE2
varying float fClipDistance2;
#endif
#ifdef CLIPPLANE3
varying float fClipDistance3;
#endif
#ifdef CLIPPLANE4
varying float fClipDistance4;
#endif
#ifdef CLIPPLANE5
varying float fClipDistance5;
#endif
#ifdef CLIPPLANE6
varying float fClipDistance6;
#endif
`;t.ShaderStore.IncludesShadersStore[o]||(t.ShaderStore.IncludesShadersStore[o]=i),e.s(["clipPlaneFragmentDeclaration",0,{name:o,shader:i}])},141687,e=>{"use strict";var t=e.i(263537);let o="clipPlaneFragment",i=`#if defined(CLIPPLANE) || defined(CLIPPLANE2) || defined(CLIPPLANE3) || defined(CLIPPLANE4) || defined(CLIPPLANE5) || defined(CLIPPLANE6)
if (false) {}
#endif
#ifdef CLIPPLANE
else if (fClipDistance>0.0)
{discard;}
#endif
#ifdef CLIPPLANE2
else if (fClipDistance2>0.0)
{discard;}
#endif
#ifdef CLIPPLANE3
else if (fClipDistance3>0.0)
{discard;}
#endif
#ifdef CLIPPLANE4
else if (fClipDistance4>0.0)
{discard;}
#endif
#ifdef CLIPPLANE5
else if (fClipDistance5>0.0)
{discard;}
#endif
#ifdef CLIPPLANE6
else if (fClipDistance6>0.0)
{discard;}
#endif
`;t.ShaderStore.IncludesShadersStore[o]||(t.ShaderStore.IncludesShadersStore[o]=i),e.s(["clipPlaneFragment",0,{name:o,shader:i}])},127010,e=>{"use strict";var t=e.i(263537);let o="logDepthDeclaration",i=`#ifdef LOGARITHMICDEPTH
uniform float logarithmicDepthConstant;varying float vFragmentDepth;
#endif
`;t.ShaderStore.IncludesShadersStore[o]||(t.ShaderStore.IncludesShadersStore[o]=i),e.s([])},358759,e=>{"use strict";var t=e.i(263537);let o="logDepthFragment",i=`#ifdef LOGARITHMICDEPTH
gl_FragDepthEXT=log2(vFragmentDepth)*logarithmicDepthConstant*0.5;
#endif
`;t.ShaderStore.IncludesShadersStore[o]||(t.ShaderStore.IncludesShadersStore[o]=i),e.s([])},315647,e=>{"use strict";var t=e.i(263537);let o="imageProcessingDeclaration",i=`#ifdef EXPOSURE
uniform float exposureLinear;
#endif
#ifdef CONTRAST
uniform float contrast;
#endif
#if defined(VIGNETTE) || defined(DITHER)
uniform vec2 vInverseScreenSize;
#endif
#ifdef VIGNETTE
uniform vec4 vignetteSettings1;uniform vec4 vignetteSettings2;
#endif
#ifdef COLORCURVES
uniform vec4 vCameraColorCurveNegative;uniform vec4 vCameraColorCurveNeutral;uniform vec4 vCameraColorCurvePositive;
#endif
#ifdef COLORGRADING
#ifdef COLORGRADING3D
uniform highp sampler3D txColorTransform;
#else
uniform sampler2D txColorTransform;
#endif
uniform vec4 colorTransformSettings;
#endif
#ifdef DITHER
uniform float ditherIntensity;
#endif
`;t.ShaderStore.IncludesShadersStore[o]||(t.ShaderStore.IncludesShadersStore[o]=i),e.s(["imageProcessingDeclaration",0,{name:o,shader:i}])},310063,e=>{"use strict";var t=e.i(263537);let o="imageProcessingFunctions",i=`#if defined(COLORGRADING) && !defined(COLORGRADING3D)
/** 
* Polyfill for SAMPLE_TEXTURE_3D,which is unsupported in WebGL.
* sampler3dSetting.x=textureOffset (0.5/textureSize).
* sampler3dSetting.y=textureSize.
*/
#define inline
vec3 sampleTexture3D(sampler2D colorTransform,vec3 color,vec2 sampler3dSetting)
{float sliceSize=2.0*sampler3dSetting.x; 
#ifdef SAMPLER3DGREENDEPTH
float sliceContinuous=(color.g-sampler3dSetting.x)*sampler3dSetting.y;
#else
float sliceContinuous=(color.b-sampler3dSetting.x)*sampler3dSetting.y;
#endif
float sliceInteger=floor(sliceContinuous);float sliceFraction=sliceContinuous-sliceInteger;
#ifdef SAMPLER3DGREENDEPTH
vec2 sliceUV=color.rb;
#else
vec2 sliceUV=color.rg;
#endif
sliceUV.x*=sliceSize;sliceUV.x+=sliceInteger*sliceSize;sliceUV=saturate(sliceUV);vec4 slice0Color=texture2D(colorTransform,sliceUV);sliceUV.x+=sliceSize;sliceUV=saturate(sliceUV);vec4 slice1Color=texture2D(colorTransform,sliceUV);vec3 result=mix(slice0Color.rgb,slice1Color.rgb,sliceFraction);
#ifdef SAMPLER3DBGRMAP
color.rgb=result.rgb;
#else
color.rgb=result.bgr;
#endif
return color;}
#endif
#if TONEMAPPING==3
const float PBRNeutralStartCompression=0.8-0.04;const float PBRNeutralDesaturation=0.15;vec3 PBRNeutralToneMapping( vec3 color ) {float x=min(color.r,min(color.g,color.b));float offset=x<0.08 ? x-6.25*x*x : 0.04;color-=offset;float peak=max(color.r,max(color.g,color.b));if (peak<PBRNeutralStartCompression) return color;float d=1.-PBRNeutralStartCompression;float newPeak=1.-d*d/(peak+d-PBRNeutralStartCompression);color*=newPeak/peak;float g=1.-1./(PBRNeutralDesaturation*(peak-newPeak)+1.);return mix(color,newPeak*vec3(1,1,1),g);}
#endif
#if TONEMAPPING==2
const mat3 ACESInputMat=mat3(
vec3(0.59719,0.07600,0.02840),
vec3(0.35458,0.90834,0.13383),
vec3(0.04823,0.01566,0.83777)
);const mat3 ACESOutputMat=mat3(
vec3( 1.60475,-0.10208,-0.00327),
vec3(-0.53108, 1.10813,-0.07276),
vec3(-0.07367,-0.00605, 1.07602)
);vec3 RRTAndODTFit(vec3 v)
{vec3 a=v*(v+0.0245786)-0.000090537;vec3 b=v*(0.983729*v+0.4329510)+0.238081;return a/b;}
vec3 ACESFitted(vec3 color)
{color=ACESInputMat*color;color=RRTAndODTFit(color);color=ACESOutputMat*color;color=saturate(color);return color;}
#endif
#define CUSTOM_IMAGEPROCESSINGFUNCTIONS_DEFINITIONS
vec4 applyImageProcessing(vec4 result) {
#define CUSTOM_IMAGEPROCESSINGFUNCTIONS_UPDATERESULT_ATSTART
#ifdef EXPOSURE
result.rgb*=exposureLinear;
#endif
#ifdef VIGNETTE
vec2 viewportXY=gl_FragCoord.xy*vInverseScreenSize;viewportXY=viewportXY*2.0-1.0;vec3 vignetteXY1=vec3(viewportXY*vignetteSettings1.xy+vignetteSettings1.zw,1.0);float vignetteTerm=dot(vignetteXY1,vignetteXY1);float vignette=pow(vignetteTerm,vignetteSettings2.w);vec3 vignetteColor=vignetteSettings2.rgb;
#ifdef VIGNETTEBLENDMODEMULTIPLY
vec3 vignetteColorMultiplier=mix(vignetteColor,vec3(1,1,1),vignette);result.rgb*=vignetteColorMultiplier;
#endif
#ifdef VIGNETTEBLENDMODEOPAQUE
result.rgb=mix(vignetteColor,result.rgb,vignette);
#endif
#endif
#if TONEMAPPING==3
result.rgb=PBRNeutralToneMapping(result.rgb);
#elif TONEMAPPING==2
result.rgb=ACESFitted(result.rgb);
#elif TONEMAPPING==1
const float tonemappingCalibration=1.590579;result.rgb=1.0-exp2(-tonemappingCalibration*result.rgb);
#endif
result.rgb=toGammaSpace(result.rgb);result.rgb=saturate(result.rgb);
#ifdef CONTRAST
vec3 resultHighContrast=result.rgb*result.rgb*(3.0-2.0*result.rgb);if (contrast<1.0) {result.rgb=mix(vec3(0.5,0.5,0.5),result.rgb,contrast);} else {result.rgb=mix(result.rgb,resultHighContrast,contrast-1.0);}
result.rgb=max(result.rgb,0.);
#endif
#ifdef COLORGRADING
vec3 colorTransformInput=result.rgb*colorTransformSettings.xxx+colorTransformSettings.yyy;
#ifdef COLORGRADING3D
vec3 colorTransformOutput=texture(txColorTransform,colorTransformInput).rgb;
#else
vec3 colorTransformOutput=sampleTexture3D(txColorTransform,colorTransformInput,colorTransformSettings.yz).rgb;
#endif
result.rgb=mix(result.rgb,colorTransformOutput,colorTransformSettings.www);
#endif
#ifdef COLORCURVES
float luma=getLuminance(result.rgb);vec2 curveMix=clamp(vec2(luma*3.0-1.5,luma*-3.0+1.5),vec2(0.0),vec2(1.0));vec4 colorCurve=vCameraColorCurveNeutral+curveMix.x*vCameraColorCurvePositive-curveMix.y*vCameraColorCurveNegative;result.rgb*=colorCurve.rgb;result.rgb=mix(vec3(luma),result.rgb,colorCurve.a);
#endif
#ifdef DITHER
float rand=getRand(gl_FragCoord.xy*vInverseScreenSize);float dither=mix(-ditherIntensity,ditherIntensity,rand);result.rgb=saturate(result.rgb+vec3(dither));
#endif
#define CUSTOM_IMAGEPROCESSINGFUNCTIONS_UPDATERESULT_ATEND
return result;}`;t.ShaderStore.IncludesShadersStore[o]||(t.ShaderStore.IncludesShadersStore[o]=i),e.s(["imageProcessingFunctions",0,{name:o,shader:i}])},121541,e=>{"use strict";var t=e.i(263537);let o="shadowsFragmentFunctions",i=`#ifdef SHADOWS
#if defined(WEBGL2) || defined(WEBGPU) || defined(NATIVE)
#define TEXTUREFUNC(s,c,l) texture2DLodEXT(s,c,l)
#else
#define TEXTUREFUNC(s,c,b) texture2D(s,c,b)
#endif
#ifndef SHADOWFLOAT
float unpack(vec4 color)
{const vec4 bit_shift=vec4(1.0/(255.0*255.0*255.0),1.0/(255.0*255.0),1.0/255.0,1.0);return dot(color,bit_shift);}
#endif
float computeFallOff(float value,vec2 clipSpace,float frustumEdgeFalloff)
{float mask=smoothstep(1.0-frustumEdgeFalloff,1.00000012,clamp(dot(clipSpace,clipSpace),0.,1.));return mix(value,1.0,mask);}
#define inline
float computeShadowCube(vec3 worldPos,vec3 lightPosition,samplerCube shadowSampler,float darkness,vec2 depthValues)
{vec3 directionToLight=worldPos-lightPosition;float depth=length(directionToLight);depth=(depth+depthValues.x)/(depthValues.y);depth=clamp(depth,0.,1.0);directionToLight=normalize(directionToLight);directionToLight.y=-directionToLight.y;
#ifndef SHADOWFLOAT
float shadow=unpack(textureCube(shadowSampler,directionToLight));
#else
float shadow=textureCube(shadowSampler,directionToLight).x;
#endif
return depth>shadow ? darkness : 1.0;}
#define inline
float computeShadowWithPoissonSamplingCube(vec3 worldPos,vec3 lightPosition,samplerCube shadowSampler,float mapSize,float darkness,vec2 depthValues)
{vec3 directionToLight=worldPos-lightPosition;float depth=length(directionToLight);depth=(depth+depthValues.x)/(depthValues.y);depth=clamp(depth,0.,1.0);directionToLight=normalize(directionToLight);directionToLight.y=-directionToLight.y;float visibility=1.;vec3 poissonDisk[4];poissonDisk[0]=vec3(-1.0,1.0,-1.0);poissonDisk[1]=vec3(1.0,-1.0,-1.0);poissonDisk[2]=vec3(-1.0,-1.0,-1.0);poissonDisk[3]=vec3(1.0,-1.0,1.0);
#ifndef SHADOWFLOAT
if (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[0]*mapSize))<depth) visibility-=0.25;if (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[1]*mapSize))<depth) visibility-=0.25;if (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[2]*mapSize))<depth) visibility-=0.25;if (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[3]*mapSize))<depth) visibility-=0.25;
#else
if (textureCube(shadowSampler,directionToLight+poissonDisk[0]*mapSize).x<depth) visibility-=0.25;if (textureCube(shadowSampler,directionToLight+poissonDisk[1]*mapSize).x<depth) visibility-=0.25;if (textureCube(shadowSampler,directionToLight+poissonDisk[2]*mapSize).x<depth) visibility-=0.25;if (textureCube(shadowSampler,directionToLight+poissonDisk[3]*mapSize).x<depth) visibility-=0.25;
#endif
return min(1.0,visibility+darkness);}
#define inline
float computeShadowWithESMCube(vec3 worldPos,vec3 lightPosition,samplerCube shadowSampler,float darkness,float depthScale,vec2 depthValues)
{vec3 directionToLight=worldPos-lightPosition;float depth=length(directionToLight);depth=(depth+depthValues.x)/(depthValues.y);float shadowPixelDepth=clamp(depth,0.,1.0);directionToLight=normalize(directionToLight);directionToLight.y=-directionToLight.y;
#ifndef SHADOWFLOAT
float shadowMapSample=unpack(textureCube(shadowSampler,directionToLight));
#else
float shadowMapSample=textureCube(shadowSampler,directionToLight).x;
#endif
float esm=1.0-clamp(exp(min(87.,depthScale*shadowPixelDepth))*shadowMapSample,0.,1.-darkness);return esm;}
#define inline
float computeShadowWithCloseESMCube(vec3 worldPos,vec3 lightPosition,samplerCube shadowSampler,float darkness,float depthScale,vec2 depthValues)
{vec3 directionToLight=worldPos-lightPosition;float depth=length(directionToLight);depth=(depth+depthValues.x)/(depthValues.y);float shadowPixelDepth=clamp(depth,0.,1.0);directionToLight=normalize(directionToLight);directionToLight.y=-directionToLight.y;
#ifndef SHADOWFLOAT
float shadowMapSample=unpack(textureCube(shadowSampler,directionToLight));
#else
float shadowMapSample=textureCube(shadowSampler,directionToLight).x;
#endif
float esm=clamp(exp(min(87.,-depthScale*(shadowPixelDepth-shadowMapSample))),darkness,1.);return esm;}
#if defined(WEBGL2) || defined(WEBGPU) || defined(NATIVE)
#define inline
float computeShadowCSM(float layer,vec4 vPositionFromLight,float depthMetric,highp sampler2DArray shadowSampler,float darkness,float frustumEdgeFalloff)
{vec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;vec2 uv=0.5*clipSpace.xy+vec2(0.5);vec3 uvLayer=vec3(uv.x,uv.y,layer);float shadowPixelDepth=clamp(depthMetric,0.,1.0);
#ifndef SHADOWFLOAT
float shadow=unpack(texture2D(shadowSampler,uvLayer));
#else
float shadow=texture2D(shadowSampler,uvLayer).x;
#endif
return shadowPixelDepth>shadow ? computeFallOff(darkness,clipSpace.xy,frustumEdgeFalloff) : 1.;}
#endif
#define inline
float computeShadow(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float darkness,float frustumEdgeFalloff)
{vec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;vec2 uv=0.5*clipSpace.xy+vec2(0.5);if (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)
{return 1.0;}
else
{float shadowPixelDepth=clamp(depthMetric,0.,1.0);
#ifndef SHADOWFLOAT
float shadow=unpack(TEXTUREFUNC(shadowSampler,uv,0.));
#else
float shadow=TEXTUREFUNC(shadowSampler,uv,0.).x;
#endif
return shadowPixelDepth>shadow ? computeFallOff(darkness,clipSpace.xy,frustumEdgeFalloff) : 1.;}}
#define inline
float computeShadowWithPoissonSampling(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float mapSize,float darkness,float frustumEdgeFalloff)
{vec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;vec2 uv=0.5*clipSpace.xy+vec2(0.5);if (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)
{return 1.0;}
else
{float shadowPixelDepth=clamp(depthMetric,0.,1.0);float visibility=1.;vec2 poissonDisk[4];poissonDisk[0]=vec2(-0.94201624,-0.39906216);poissonDisk[1]=vec2(0.94558609,-0.76890725);poissonDisk[2]=vec2(-0.094184101,-0.92938870);poissonDisk[3]=vec2(0.34495938,0.29387760);
#ifndef SHADOWFLOAT
if (unpack(TEXTUREFUNC(shadowSampler,uv+poissonDisk[0]*mapSize,0.))<shadowPixelDepth) visibility-=0.25;if (unpack(TEXTUREFUNC(shadowSampler,uv+poissonDisk[1]*mapSize,0.))<shadowPixelDepth) visibility-=0.25;if (unpack(TEXTUREFUNC(shadowSampler,uv+poissonDisk[2]*mapSize,0.))<shadowPixelDepth) visibility-=0.25;if (unpack(TEXTUREFUNC(shadowSampler,uv+poissonDisk[3]*mapSize,0.))<shadowPixelDepth) visibility-=0.25;
#else
if (TEXTUREFUNC(shadowSampler,uv+poissonDisk[0]*mapSize,0.).x<shadowPixelDepth) visibility-=0.25;if (TEXTUREFUNC(shadowSampler,uv+poissonDisk[1]*mapSize,0.).x<shadowPixelDepth) visibility-=0.25;if (TEXTUREFUNC(shadowSampler,uv+poissonDisk[2]*mapSize,0.).x<shadowPixelDepth) visibility-=0.25;if (TEXTUREFUNC(shadowSampler,uv+poissonDisk[3]*mapSize,0.).x<shadowPixelDepth) visibility-=0.25;
#endif
return computeFallOff(min(1.0,visibility+darkness),clipSpace.xy,frustumEdgeFalloff);}}
#define inline
float computeShadowWithESM(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float darkness,float depthScale,float frustumEdgeFalloff)
{vec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;vec2 uv=0.5*clipSpace.xy+vec2(0.5);if (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)
{return 1.0;}
else
{float shadowPixelDepth=clamp(depthMetric,0.,1.0);
#ifndef SHADOWFLOAT
float shadowMapSample=unpack(TEXTUREFUNC(shadowSampler,uv,0.));
#else
float shadowMapSample=TEXTUREFUNC(shadowSampler,uv,0.).x;
#endif
float esm=1.0-clamp(exp(min(87.,depthScale*shadowPixelDepth))*shadowMapSample,0.,1.-darkness);return computeFallOff(esm,clipSpace.xy,frustumEdgeFalloff);}}
#define inline
float computeShadowWithCloseESM(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float darkness,float depthScale,float frustumEdgeFalloff)
{vec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;vec2 uv=0.5*clipSpace.xy+vec2(0.5);if (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)
{return 1.0;}
else
{float shadowPixelDepth=clamp(depthMetric,0.,1.0); 
#ifndef SHADOWFLOAT
float shadowMapSample=unpack(TEXTUREFUNC(shadowSampler,uv,0.));
#else
float shadowMapSample=TEXTUREFUNC(shadowSampler,uv,0.).x;
#endif
float esm=clamp(exp(min(87.,-depthScale*(shadowPixelDepth-shadowMapSample))),darkness,1.);return computeFallOff(esm,clipSpace.xy,frustumEdgeFalloff);}}
#ifdef IS_NDC_HALF_ZRANGE
#define ZINCLIP clipSpace.z
#else
#define ZINCLIP uvDepth.z
#endif
#if defined(WEBGL2) || defined(WEBGPU) || defined(NATIVE)
#define SMALLEST_ABOVE_ZERO 1.1754943508e-38
#define GREATEST_LESS_THAN_ONE 0.99999994
#define DISABLE_UNIFORMITY_ANALYSIS
#define inline
float computeShadowWithCSMPCF1(float layer,vec4 vPositionFromLight,float depthMetric,highp sampler2DArrayShadow shadowSampler,float darkness,float frustumEdgeFalloff)
{vec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;vec3 uvDepth=vec3(0.5*clipSpace.xyz+vec3(0.5));
#ifdef USE_REVERSE_DEPTHBUFFER
uvDepth.z=clamp(ZINCLIP,SMALLEST_ABOVE_ZERO,1.);
#else
uvDepth.z=clamp(ZINCLIP,0.,GREATEST_LESS_THAN_ONE);
#endif
vec4 uvDepthLayer=vec4(uvDepth.x,uvDepth.y,layer,uvDepth.z);float shadow=texture2D(shadowSampler,uvDepthLayer);shadow=mix(darkness,1.,shadow);return computeFallOff(shadow,clipSpace.xy,frustumEdgeFalloff);}
#define inline
float computeShadowWithCSMPCF3(float layer,vec4 vPositionFromLight,float depthMetric,highp sampler2DArrayShadow shadowSampler,vec2 shadowMapSizeAndInverse,float darkness,float frustumEdgeFalloff)
{vec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;vec3 uvDepth=vec3(0.5*clipSpace.xyz+vec3(0.5));
#ifdef USE_REVERSE_DEPTHBUFFER
uvDepth.z=clamp(ZINCLIP,SMALLEST_ABOVE_ZERO,1.);
#else
uvDepth.z=clamp(ZINCLIP,0.,GREATEST_LESS_THAN_ONE);
#endif
vec2 uv=uvDepth.xy*shadowMapSizeAndInverse.x; 
uv+=0.5; 
vec2 st=fract(uv); 
vec2 base_uv=floor(uv)-0.5; 
base_uv*=shadowMapSizeAndInverse.y; 
vec2 uvw0=3.-2.*st;vec2 uvw1=1.+2.*st;vec2 u=vec2((2.-st.x)/uvw0.x-1.,st.x/uvw1.x+1.)*shadowMapSizeAndInverse.y;vec2 v=vec2((2.-st.y)/uvw0.y-1.,st.y/uvw1.y+1.)*shadowMapSizeAndInverse.y;float shadow=0.;shadow+=uvw0.x*uvw0.y*texture2D(shadowSampler,vec4(base_uv.xy+vec2(u[0],v[0]),layer,uvDepth.z));shadow+=uvw1.x*uvw0.y*texture2D(shadowSampler,vec4(base_uv.xy+vec2(u[1],v[0]),layer,uvDepth.z));shadow+=uvw0.x*uvw1.y*texture2D(shadowSampler,vec4(base_uv.xy+vec2(u[0],v[1]),layer,uvDepth.z));shadow+=uvw1.x*uvw1.y*texture2D(shadowSampler,vec4(base_uv.xy+vec2(u[1],v[1]),layer,uvDepth.z));shadow=shadow/16.;shadow=mix(darkness,1.,shadow);return computeFallOff(shadow,clipSpace.xy,frustumEdgeFalloff);}
#define inline
float computeShadowWithCSMPCF5(float layer,vec4 vPositionFromLight,float depthMetric,highp sampler2DArrayShadow shadowSampler,vec2 shadowMapSizeAndInverse,float darkness,float frustumEdgeFalloff)
{vec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;vec3 uvDepth=vec3(0.5*clipSpace.xyz+vec3(0.5));
#ifdef USE_REVERSE_DEPTHBUFFER
uvDepth.z=clamp(ZINCLIP,SMALLEST_ABOVE_ZERO,1.);
#else
uvDepth.z=clamp(ZINCLIP,0.,GREATEST_LESS_THAN_ONE);
#endif
vec2 uv=uvDepth.xy*shadowMapSizeAndInverse.x; 
uv+=0.5; 
vec2 st=fract(uv); 
vec2 base_uv=floor(uv)-0.5; 
base_uv*=shadowMapSizeAndInverse.y; 
vec2 uvw0=4.-3.*st;vec2 uvw1=vec2(7.);vec2 uvw2=1.+3.*st;vec3 u=vec3((3.-2.*st.x)/uvw0.x-2.,(3.+st.x)/uvw1.x,st.x/uvw2.x+2.)*shadowMapSizeAndInverse.y;vec3 v=vec3((3.-2.*st.y)/uvw0.y-2.,(3.+st.y)/uvw1.y,st.y/uvw2.y+2.)*shadowMapSizeAndInverse.y;float shadow=0.;shadow+=uvw0.x*uvw0.y*texture2D(shadowSampler,vec4(base_uv.xy+vec2(u[0],v[0]),layer,uvDepth.z));shadow+=uvw1.x*uvw0.y*texture2D(shadowSampler,vec4(base_uv.xy+vec2(u[1],v[0]),layer,uvDepth.z));shadow+=uvw2.x*uvw0.y*texture2D(shadowSampler,vec4(base_uv.xy+vec2(u[2],v[0]),layer,uvDepth.z));shadow+=uvw0.x*uvw1.y*texture2D(shadowSampler,vec4(base_uv.xy+vec2(u[0],v[1]),layer,uvDepth.z));shadow+=uvw1.x*uvw1.y*texture2D(shadowSampler,vec4(base_uv.xy+vec2(u[1],v[1]),layer,uvDepth.z));shadow+=uvw2.x*uvw1.y*texture2D(shadowSampler,vec4(base_uv.xy+vec2(u[2],v[1]),layer,uvDepth.z));shadow+=uvw0.x*uvw2.y*texture2D(shadowSampler,vec4(base_uv.xy+vec2(u[0],v[2]),layer,uvDepth.z));shadow+=uvw1.x*uvw2.y*texture2D(shadowSampler,vec4(base_uv.xy+vec2(u[1],v[2]),layer,uvDepth.z));shadow+=uvw2.x*uvw2.y*texture2D(shadowSampler,vec4(base_uv.xy+vec2(u[2],v[2]),layer,uvDepth.z));shadow=shadow/144.;shadow=mix(darkness,1.,shadow);return computeFallOff(shadow,clipSpace.xy,frustumEdgeFalloff);}
#define inline
float computeShadowWithPCF1(vec4 vPositionFromLight,float depthMetric,highp sampler2DShadow shadowSampler,float darkness,float frustumEdgeFalloff)
{vec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;vec3 uvDepth=vec3(0.5*clipSpace.xyz+vec3(0.5));uvDepth.z=ZINCLIP;if (depthMetric<0.0 || depthMetric>1.0 || uvDepth.x<0. || uvDepth.x>1.0 || uvDepth.y<0. || uvDepth.y>1.0) {return 1.0;} else {float shadow=TEXTUREFUNC(shadowSampler,uvDepth,0.);shadow=mix(darkness,1.,shadow);return computeFallOff(shadow,clipSpace.xy,frustumEdgeFalloff);}}
#define inline
float computeShadowWithPCF3(vec4 vPositionFromLight,float depthMetric,highp sampler2DShadow shadowSampler,vec2 shadowMapSizeAndInverse,float darkness,float frustumEdgeFalloff)
{vec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;vec3 uvDepth=vec3(0.5*clipSpace.xyz+vec3(0.5));uvDepth.z=ZINCLIP;if (depthMetric<0.0 || depthMetric>1.0 || uvDepth.x<0. || uvDepth.x>1.0 || uvDepth.y<0. || uvDepth.y>1.0) {return 1.0;} else {vec2 uv=uvDepth.xy*shadowMapSizeAndInverse.x; 
uv+=0.5; 
vec2 st=fract(uv); 
vec2 base_uv=floor(uv)-0.5; 
base_uv*=shadowMapSizeAndInverse.y; 
vec2 uvw0=3.-2.*st;vec2 uvw1=1.+2.*st;vec2 u=vec2((2.-st.x)/uvw0.x-1.,st.x/uvw1.x+1.)*shadowMapSizeAndInverse.y;vec2 v=vec2((2.-st.y)/uvw0.y-1.,st.y/uvw1.y+1.)*shadowMapSizeAndInverse.y;float shadow=0.;shadow+=uvw0.x*uvw0.y*TEXTUREFUNC(shadowSampler,vec3(base_uv.xy+vec2(u[0],v[0]),uvDepth.z),0.);shadow+=uvw1.x*uvw0.y*TEXTUREFUNC(shadowSampler,vec3(base_uv.xy+vec2(u[1],v[0]),uvDepth.z),0.);shadow+=uvw0.x*uvw1.y*TEXTUREFUNC(shadowSampler,vec3(base_uv.xy+vec2(u[0],v[1]),uvDepth.z),0.);shadow+=uvw1.x*uvw1.y*TEXTUREFUNC(shadowSampler,vec3(base_uv.xy+vec2(u[1],v[1]),uvDepth.z),0.);shadow=shadow/16.;shadow=mix(darkness,1.,shadow);return computeFallOff(shadow,clipSpace.xy,frustumEdgeFalloff);}}
#define inline
float computeShadowWithPCF5(vec4 vPositionFromLight,float depthMetric,highp sampler2DShadow shadowSampler,vec2 shadowMapSizeAndInverse,float darkness,float frustumEdgeFalloff)
{vec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;vec3 uvDepth=vec3(0.5*clipSpace.xyz+vec3(0.5));uvDepth.z=ZINCLIP;if (depthMetric<0.0 || depthMetric>1.0 || uvDepth.x<0. || uvDepth.x>1.0 || uvDepth.y<0. || uvDepth.y>1.0) {return 1.0;} else {vec2 uv=uvDepth.xy*shadowMapSizeAndInverse.x; 
uv+=0.5; 
vec2 st=fract(uv); 
vec2 base_uv=floor(uv)-0.5; 
base_uv*=shadowMapSizeAndInverse.y; 
vec2 uvw0=4.-3.*st;vec2 uvw1=vec2(7.);vec2 uvw2=1.+3.*st;vec3 u=vec3((3.-2.*st.x)/uvw0.x-2.,(3.+st.x)/uvw1.x,st.x/uvw2.x+2.)*shadowMapSizeAndInverse.y;vec3 v=vec3((3.-2.*st.y)/uvw0.y-2.,(3.+st.y)/uvw1.y,st.y/uvw2.y+2.)*shadowMapSizeAndInverse.y;float shadow=0.;shadow+=uvw0.x*uvw0.y*TEXTUREFUNC(shadowSampler,vec3(base_uv.xy+vec2(u[0],v[0]),uvDepth.z),0.);shadow+=uvw1.x*uvw0.y*TEXTUREFUNC(shadowSampler,vec3(base_uv.xy+vec2(u[1],v[0]),uvDepth.z),0.);shadow+=uvw2.x*uvw0.y*TEXTUREFUNC(shadowSampler,vec3(base_uv.xy+vec2(u[2],v[0]),uvDepth.z),0.);shadow+=uvw0.x*uvw1.y*TEXTUREFUNC(shadowSampler,vec3(base_uv.xy+vec2(u[0],v[1]),uvDepth.z),0.);shadow+=uvw1.x*uvw1.y*TEXTUREFUNC(shadowSampler,vec3(base_uv.xy+vec2(u[1],v[1]),uvDepth.z),0.);shadow+=uvw2.x*uvw1.y*TEXTUREFUNC(shadowSampler,vec3(base_uv.xy+vec2(u[2],v[1]),uvDepth.z),0.);shadow+=uvw0.x*uvw2.y*TEXTUREFUNC(shadowSampler,vec3(base_uv.xy+vec2(u[0],v[2]),uvDepth.z),0.);shadow+=uvw1.x*uvw2.y*TEXTUREFUNC(shadowSampler,vec3(base_uv.xy+vec2(u[1],v[2]),uvDepth.z),0.);shadow+=uvw2.x*uvw2.y*TEXTUREFUNC(shadowSampler,vec3(base_uv.xy+vec2(u[2],v[2]),uvDepth.z),0.);shadow=shadow/144.;shadow=mix(darkness,1.,shadow);return computeFallOff(shadow,clipSpace.xy,frustumEdgeFalloff);}}
const vec3 PoissonSamplers32[64]=vec3[64](
vec3(0.06407013,0.05409927,0.),
vec3(0.7366577,0.5789394,0.),
vec3(-0.6270542,-0.5320278,0.),
vec3(-0.4096107,0.8411095,0.),
vec3(0.6849564,-0.4990818,0.),
vec3(-0.874181,-0.04579735,0.),
vec3(0.9989998,0.0009880066,0.),
vec3(-0.004920578,-0.9151649,0.),
vec3(0.1805763,0.9747483,0.),
vec3(-0.2138451,0.2635818,0.),
vec3(0.109845,0.3884785,0.),
vec3(0.06876755,-0.3581074,0.),
vec3(0.374073,-0.7661266,0.),
vec3(0.3079132,-0.1216763,0.),
vec3(-0.3794335,-0.8271583,0.),
vec3(-0.203878,-0.07715034,0.),
vec3(0.5912697,0.1469799,0.),
vec3(-0.88069,0.3031784,0.),
vec3(0.5040108,0.8283722,0.),
vec3(-0.5844124,0.5494877,0.),
vec3(0.6017799,-0.1726654,0.),
vec3(-0.5554981,0.1559997,0.),
vec3(-0.3016369,-0.3900928,0.),
vec3(-0.5550632,-0.1723762,0.),
vec3(0.925029,0.2995041,0.),
vec3(-0.2473137,0.5538505,0.),
vec3(0.9183037,-0.2862392,0.),
vec3(0.2469421,0.6718712,0.),
vec3(0.3916397,-0.4328209,0.),
vec3(-0.03576927,-0.6220032,0.),
vec3(-0.04661255,0.7995201,0.),
vec3(0.4402924,0.3640312,0.),
vec3(0.),
vec3(0.),
vec3(0.),
vec3(0.),
vec3(0.),
vec3(0.),
vec3(0.),
vec3(0.),
vec3(0.),
vec3(0.),
vec3(0.),
vec3(0.),
vec3(0.),
vec3(0.),
vec3(0.),
vec3(0.),
vec3(0.),
vec3(0.),
vec3(0.),
vec3(0.),
vec3(0.),
vec3(0.),
vec3(0.),
vec3(0.),
vec3(0.),
vec3(0.),
vec3(0.),
vec3(0.),
vec3(0.),
vec3(0.),
vec3(0.),
vec3(0.)
);const vec3 PoissonSamplers64[64]=vec3[64](
vec3(-0.613392,0.617481,0.),
vec3(0.170019,-0.040254,0.),
vec3(-0.299417,0.791925,0.),
vec3(0.645680,0.493210,0.),
vec3(-0.651784,0.717887,0.),
vec3(0.421003,0.027070,0.),
vec3(-0.817194,-0.271096,0.),
vec3(-0.705374,-0.668203,0.),
vec3(0.977050,-0.108615,0.),
vec3(0.063326,0.142369,0.),
vec3(0.203528,0.214331,0.),
vec3(-0.667531,0.326090,0.),
vec3(-0.098422,-0.295755,0.),
vec3(-0.885922,0.215369,0.),
vec3(0.566637,0.605213,0.),
vec3(0.039766,-0.396100,0.),
vec3(0.751946,0.453352,0.),
vec3(0.078707,-0.715323,0.),
vec3(-0.075838,-0.529344,0.),
vec3(0.724479,-0.580798,0.),
vec3(0.222999,-0.215125,0.),
vec3(-0.467574,-0.405438,0.),
vec3(-0.248268,-0.814753,0.),
vec3(0.354411,-0.887570,0.),
vec3(0.175817,0.382366,0.),
vec3(0.487472,-0.063082,0.),
vec3(-0.084078,0.898312,0.),
vec3(0.488876,-0.783441,0.),
vec3(0.470016,0.217933,0.),
vec3(-0.696890,-0.549791,0.),
vec3(-0.149693,0.605762,0.),
vec3(0.034211,0.979980,0.),
vec3(0.503098,-0.308878,0.),
vec3(-0.016205,-0.872921,0.),
vec3(0.385784,-0.393902,0.),
vec3(-0.146886,-0.859249,0.),
vec3(0.643361,0.164098,0.),
vec3(0.634388,-0.049471,0.),
vec3(-0.688894,0.007843,0.),
vec3(0.464034,-0.188818,0.),
vec3(-0.440840,0.137486,0.),
vec3(0.364483,0.511704,0.),
vec3(0.034028,0.325968,0.),
vec3(0.099094,-0.308023,0.),
vec3(0.693960,-0.366253,0.),
vec3(0.678884,-0.204688,0.),
vec3(0.001801,0.780328,0.),
vec3(0.145177,-0.898984,0.),
vec3(0.062655,-0.611866,0.),
vec3(0.315226,-0.604297,0.),
vec3(-0.780145,0.486251,0.),
vec3(-0.371868,0.882138,0.),
vec3(0.200476,0.494430,0.),
vec3(-0.494552,-0.711051,0.),
vec3(0.612476,0.705252,0.),
vec3(-0.578845,-0.768792,0.),
vec3(-0.772454,-0.090976,0.),
vec3(0.504440,0.372295,0.),
vec3(0.155736,0.065157,0.),
vec3(0.391522,0.849605,0.),
vec3(-0.620106,-0.328104,0.),
vec3(0.789239,-0.419965,0.),
vec3(-0.545396,0.538133,0.),
vec3(-0.178564,-0.596057,0.)
);
#define inline
float computeShadowWithCSMPCSS(float layer,vec4 vPositionFromLight,float depthMetric,highp sampler2DArray depthSampler,highp sampler2DArrayShadow shadowSampler,float shadowMapSizeInverse,float lightSizeUV,float darkness,float frustumEdgeFalloff,int searchTapCount,int pcfTapCount,vec3[64] poissonSamplers,vec2 lightSizeUVCorrection,float depthCorrection,float penumbraDarkness)
{vec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;vec3 uvDepth=vec3(0.5*clipSpace.xyz+vec3(0.5));
#ifdef USE_REVERSE_DEPTHBUFFER
uvDepth.z=clamp(ZINCLIP,SMALLEST_ABOVE_ZERO,1.);
#else
uvDepth.z=clamp(ZINCLIP,0.,GREATEST_LESS_THAN_ONE);
#endif
vec4 uvDepthLayer=vec4(uvDepth.x,uvDepth.y,layer,uvDepth.z);float blockerDepth=0.0;float sumBlockerDepth=0.0;float numBlocker=0.0;for (int i=0; i<searchTapCount; i ++) {blockerDepth=texture2D(depthSampler,vec3(uvDepth.xy+(lightSizeUV*lightSizeUVCorrection*shadowMapSizeInverse*PoissonSamplers32[i].xy),layer)).r;if (blockerDepth<depthMetric) {sumBlockerDepth+=blockerDepth;numBlocker++;}}
float avgBlockerDepth=sumBlockerDepth/numBlocker;float AAOffset=shadowMapSizeInverse*10.;float penumbraRatio=((depthMetric-avgBlockerDepth)*depthCorrection+AAOffset);vec4 filterRadius=vec4(penumbraRatio*lightSizeUV*lightSizeUVCorrection*shadowMapSizeInverse,0.,0.);float random=getRand(vPositionFromLight.xy);float rotationAngle=random*3.1415926;vec2 rotationVector=vec2(cos(rotationAngle),sin(rotationAngle));float shadow=0.;for (int i=0; i<pcfTapCount; i++) {vec4 offset=vec4(poissonSamplers[i],0.);offset=vec4(offset.x*rotationVector.x-offset.y*rotationVector.y,offset.y*rotationVector.x+offset.x*rotationVector.y,0.,0.);shadow+=texture2D(shadowSampler,uvDepthLayer+offset*filterRadius);}
shadow/=float(pcfTapCount);shadow=mix(shadow,1.,min((depthMetric-avgBlockerDepth)*depthCorrection*penumbraDarkness,1.));shadow=mix(darkness,1.,shadow);if (numBlocker<1.0) {return 1.0;}
else
{return computeFallOff(shadow,clipSpace.xy,frustumEdgeFalloff);}}
#define inline
float computeShadowWithPCSS(vec4 vPositionFromLight,float depthMetric,sampler2D depthSampler,highp sampler2DShadow shadowSampler,float shadowMapSizeInverse,float lightSizeUV,float darkness,float frustumEdgeFalloff,int searchTapCount,int pcfTapCount,vec3[64] poissonSamplers)
{vec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;vec3 uvDepth=vec3(0.5*clipSpace.xyz+vec3(0.5));uvDepth.z=ZINCLIP;if (depthMetric<0.0 || depthMetric>1.0 || uvDepth.x<0. || uvDepth.x>1.0 || uvDepth.y<0. || uvDepth.y>1.0) {return 1.0;} else {float blockerDepth=0.0;float sumBlockerDepth=0.0;float numBlocker=0.0;for (int i=0; i<searchTapCount; i ++) {blockerDepth=TEXTUREFUNC(depthSampler,uvDepth.xy+(lightSizeUV*shadowMapSizeInverse*PoissonSamplers32[i].xy),0.).r;if (blockerDepth<depthMetric) {sumBlockerDepth+=blockerDepth;numBlocker++;}}
if (numBlocker<1.0) {return 1.0;}
else
{float avgBlockerDepth=sumBlockerDepth/numBlocker;float AAOffset=shadowMapSizeInverse*10.;float penumbraRatio=((depthMetric-avgBlockerDepth)+AAOffset);float filterRadius=penumbraRatio*lightSizeUV*shadowMapSizeInverse;float random=getRand(vPositionFromLight.xy);float rotationAngle=random*3.1415926;vec2 rotationVector=vec2(cos(rotationAngle),sin(rotationAngle));float shadow=0.;for (int i=0; i<pcfTapCount; i++) {vec3 offset=poissonSamplers[i];offset=vec3(offset.x*rotationVector.x-offset.y*rotationVector.y,offset.y*rotationVector.x+offset.x*rotationVector.y,0.);shadow+=TEXTUREFUNC(shadowSampler,uvDepth+offset*filterRadius,0.);}
shadow/=float(pcfTapCount);shadow=mix(shadow,1.,depthMetric-avgBlockerDepth);shadow=mix(darkness,1.,shadow);return computeFallOff(shadow,clipSpace.xy,frustumEdgeFalloff);}}}
#define inline
float computeShadowWithPCSS16(vec4 vPositionFromLight,float depthMetric,sampler2D depthSampler,highp sampler2DShadow shadowSampler,float shadowMapSizeInverse,float lightSizeUV,float darkness,float frustumEdgeFalloff)
{return computeShadowWithPCSS(vPositionFromLight,depthMetric,depthSampler,shadowSampler,shadowMapSizeInverse,lightSizeUV,darkness,frustumEdgeFalloff,16,16,PoissonSamplers32);}
#define inline
float computeShadowWithPCSS32(vec4 vPositionFromLight,float depthMetric,sampler2D depthSampler,highp sampler2DShadow shadowSampler,float shadowMapSizeInverse,float lightSizeUV,float darkness,float frustumEdgeFalloff)
{return computeShadowWithPCSS(vPositionFromLight,depthMetric,depthSampler,shadowSampler,shadowMapSizeInverse,lightSizeUV,darkness,frustumEdgeFalloff,16,32,PoissonSamplers32);}
#define inline
float computeShadowWithPCSS64(vec4 vPositionFromLight,float depthMetric,sampler2D depthSampler,highp sampler2DShadow shadowSampler,float shadowMapSizeInverse,float lightSizeUV,float darkness,float frustumEdgeFalloff)
{return computeShadowWithPCSS(vPositionFromLight,depthMetric,depthSampler,shadowSampler,shadowMapSizeInverse,lightSizeUV,darkness,frustumEdgeFalloff,32,64,PoissonSamplers64);}
#define inline
float computeShadowWithCSMPCSS16(float layer,vec4 vPositionFromLight,float depthMetric,highp sampler2DArray depthSampler,highp sampler2DArrayShadow shadowSampler,float shadowMapSizeInverse,float lightSizeUV,float darkness,float frustumEdgeFalloff,vec2 lightSizeUVCorrection,float depthCorrection,float penumbraDarkness)
{return computeShadowWithCSMPCSS(layer,vPositionFromLight,depthMetric,depthSampler,shadowSampler,shadowMapSizeInverse,lightSizeUV,darkness,frustumEdgeFalloff,16,16,PoissonSamplers32,lightSizeUVCorrection,depthCorrection,penumbraDarkness);}
#define inline
float computeShadowWithCSMPCSS32(float layer,vec4 vPositionFromLight,float depthMetric,highp sampler2DArray depthSampler,highp sampler2DArrayShadow shadowSampler,float shadowMapSizeInverse,float lightSizeUV,float darkness,float frustumEdgeFalloff,vec2 lightSizeUVCorrection,float depthCorrection,float penumbraDarkness)
{return computeShadowWithCSMPCSS(layer,vPositionFromLight,depthMetric,depthSampler,shadowSampler,shadowMapSizeInverse,lightSizeUV,darkness,frustumEdgeFalloff,16,32,PoissonSamplers32,lightSizeUVCorrection,depthCorrection,penumbraDarkness);}
#define inline
float computeShadowWithCSMPCSS64(float layer,vec4 vPositionFromLight,float depthMetric,highp sampler2DArray depthSampler,highp sampler2DArrayShadow shadowSampler,float shadowMapSizeInverse,float lightSizeUV,float darkness,float frustumEdgeFalloff,vec2 lightSizeUVCorrection,float depthCorrection,float penumbraDarkness)
{return computeShadowWithCSMPCSS(layer,vPositionFromLight,depthMetric,depthSampler,shadowSampler,shadowMapSizeInverse,lightSizeUV,darkness,frustumEdgeFalloff,32,64,PoissonSamplers64,lightSizeUVCorrection,depthCorrection,penumbraDarkness);}
#endif
#endif
`;t.ShaderStore.IncludesShadersStore[o]||(t.ShaderStore.IncludesShadersStore[o]=i),e.s(["shadowsFragmentFunctions",0,{name:o,shader:i}])},65434,423568,e=>{"use strict";var t=e.i(263537);let o="prePassDeclaration",i=`#ifdef PREPASS
#extension GL_EXT_draw_buffers : require
layout(location=0) out highp vec4 glFragData[{X}];highp vec4 gl_FragColor;
#ifdef PREPASS_LOCAL_POSITION
varying highp vec3 vPosition;
#endif
#ifdef PREPASS_DEPTH
varying highp vec3 vViewPos;
#endif
#ifdef PREPASS_NORMALIZED_VIEW_DEPTH
varying highp float vNormViewDepth;
#endif
#if defined(PREPASS_VELOCITY) || defined(PREPASS_VELOCITY_LINEAR)
varying highp vec4 vCurrentPosition;varying highp vec4 vPreviousPosition;
#endif
#endif
`;t.ShaderStore.IncludesShadersStore[o]||(t.ShaderStore.IncludesShadersStore[o]=i),e.s([],65434);let a="oitDeclaration",r=`#ifdef ORDER_INDEPENDENT_TRANSPARENCY
#extension GL_EXT_draw_buffers : require
layout(location=0) out vec2 depth; 
layout(location=1) out vec4 frontColor;layout(location=2) out vec4 backColor;
#define MAX_DEPTH 99999.0
highp vec4 gl_FragColor;uniform sampler2D oitDepthSampler;uniform sampler2D oitFrontColorSampler;
#endif
`;t.ShaderStore.IncludesShadersStore[a]||(t.ShaderStore.IncludesShadersStore[a]=r),e.s([],423568)},464797,e=>{"use strict";var t=e.i(263537);let o="decalFragmentDeclaration",i=`#ifdef DECAL
uniform vec4 vDecalInfos;
#endif
`;t.ShaderStore.IncludesShadersStore[o]||(t.ShaderStore.IncludesShadersStore[o]=i),e.s([])},449399,776892,e=>{"use strict";var t=e.i(263537);let o="depthPrePass",i=`#ifdef DEPTHPREPASS
gl_FragColor=vec4(0.,0.,0.,1.0);return;
#endif
`;t.ShaderStore.IncludesShadersStore[o]||(t.ShaderStore.IncludesShadersStore[o]=i),e.s([],449399);let a="oitFragment",r=`#ifdef ORDER_INDEPENDENT_TRANSPARENCY
float fragDepth=gl_FragCoord.z; 
#ifdef ORDER_INDEPENDENT_TRANSPARENCY_16BITS
uint halfFloat=packHalf2x16(vec2(fragDepth));vec2 full=unpackHalf2x16(halfFloat);fragDepth=full.x;
#endif
ivec2 fragCoord=ivec2(gl_FragCoord.xy);vec2 lastDepth=texelFetch(oitDepthSampler,fragCoord,0).rg;vec4 lastFrontColor=texelFetch(oitFrontColorSampler,fragCoord,0);depth.rg=vec2(-MAX_DEPTH);frontColor=lastFrontColor;backColor=vec4(0.0);
#ifdef USE_REVERSE_DEPTHBUFFER
float furthestDepth=-lastDepth.x;float nearestDepth=lastDepth.y;
#else
float nearestDepth=-lastDepth.x;float furthestDepth=lastDepth.y;
#endif
float alphaMultiplier=1.0-lastFrontColor.a;
#ifdef USE_REVERSE_DEPTHBUFFER
if (fragDepth>nearestDepth || fragDepth<furthestDepth) {
#else
if (fragDepth<nearestDepth || fragDepth>furthestDepth) {
#endif
return;}
#ifdef USE_REVERSE_DEPTHBUFFER
if (fragDepth<nearestDepth && fragDepth>furthestDepth) {
#else
if (fragDepth>nearestDepth && fragDepth<furthestDepth) {
#endif
depth.rg=vec2(-fragDepth,fragDepth);return;}
#endif
`;t.ShaderStore.IncludesShadersStore[a]||(t.ShaderStore.IncludesShadersStore[a]=r),e.s([],776892)}]);