(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,42386,e=>{"use strict";let t={type:"spring",stiffness:300,damping:25,mass:.8};e.s(["fadeIn",0,{initial:{opacity:0},animate:{opacity:1,transition:{duration:.3}},exit:{opacity:0,transition:{duration:.2}}},"fadeInUp",0,{initial:{opacity:0,y:20},animate:{opacity:1,y:0,transition:t},exit:{opacity:0,y:-10,transition:{duration:.2}}},"scaleIn",0,{initial:{opacity:0,scale:.9},animate:{opacity:1,scale:1,transition:t},exit:{opacity:0,scale:.9,transition:{duration:.2}}},"staggerContainer",0,{initial:{},animate:{transition:{staggerChildren:.1,delayChildren:.1}}},"useReducedMotion",0,function(){return"function"==typeof window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches}])},61070,e=>{"use strict";var t=e.i(73973);e.s(["useFrame",()=>t.D])},33839,e=>{"use strict";function t(){return(t=Object.assign.bind()).apply(null,arguments)}e.s(["default",()=>t])},33902,e=>{"use strict";var t=e.i(73973);e.s(["useThree",()=>t.C])},83475,16598,25733,e=>{"use strict";let t,i;var n=e.i(73973);e.s(["extend",()=>n.e],83475);var r=e.i(83879);let o=parseInt(r.REVISION.replace(/\D+/g,""));e.s(["version",0,o],16598);var a=e.i(33839),s=e.i(48845),l=e.i(33902),c=r,d=r;let f=new d.Box3,u=new d.Vector3;class p extends d.InstancedBufferGeometry{constructor(){super(),this.isLineSegmentsGeometry=!0,this.type="LineSegmentsGeometry",this.setIndex([0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5]),this.setAttribute("position",new d.Float32BufferAttribute([-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],3)),this.setAttribute("uv",new d.Float32BufferAttribute([-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],2))}applyMatrix4(e){let t=this.attributes.instanceStart,i=this.attributes.instanceEnd;return void 0!==t&&(t.applyMatrix4(e),i.applyMatrix4(e),t.needsUpdate=!0),null!==this.boundingBox&&this.computeBoundingBox(),null!==this.boundingSphere&&this.computeBoundingSphere(),this}setPositions(e){let t;e instanceof Float32Array?t=e:Array.isArray(e)&&(t=new Float32Array(e));let i=new d.InstancedInterleavedBuffer(t,6,1);return this.setAttribute("instanceStart",new d.InterleavedBufferAttribute(i,3,0)),this.setAttribute("instanceEnd",new d.InterleavedBufferAttribute(i,3,3)),this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(e,t=3){let i;e instanceof Float32Array?i=e:Array.isArray(e)&&(i=new Float32Array(e));let n=new d.InstancedInterleavedBuffer(i,2*t,1);return this.setAttribute("instanceColorStart",new d.InterleavedBufferAttribute(n,t,0)),this.setAttribute("instanceColorEnd",new d.InterleavedBufferAttribute(n,t,t)),this}fromWireframeGeometry(e){return this.setPositions(e.attributes.position.array),this}fromEdgesGeometry(e){return this.setPositions(e.attributes.position.array),this}fromMesh(e){return this.fromWireframeGeometry(new d.WireframeGeometry(e.geometry)),this}fromLineSegments(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}computeBoundingBox(){null===this.boundingBox&&(this.boundingBox=new d.Box3);let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;void 0!==e&&void 0!==t&&(this.boundingBox.setFromBufferAttribute(e),f.setFromBufferAttribute(t),this.boundingBox.union(f))}computeBoundingSphere(){null===this.boundingSphere&&(this.boundingSphere=new d.Sphere),null===this.boundingBox&&this.computeBoundingBox();let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;if(void 0!==e&&void 0!==t){let i=this.boundingSphere.center;this.boundingBox.getCenter(i);let n=0;for(let r=0,o=e.count;r<o;r++)u.fromBufferAttribute(e,r),n=Math.max(n,i.distanceToSquared(u)),u.fromBufferAttribute(t,r),n=Math.max(n,i.distanceToSquared(u));this.boundingSphere.radius=Math.sqrt(n),isNaN(this.boundingSphere.radius)&&console.error("THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.",this)}}toJSON(){}applyMatrix(e){return console.warn("THREE.LineSegmentsGeometry: applyMatrix() has been renamed to applyMatrix4()."),this.applyMatrix4(e)}}var m=r,h=e.i(17502);let v=parseInt(r.REVISION.replace(/\D+/g,""));class y extends m.ShaderMaterial{constructor(e){super({type:"LineMaterial",uniforms:m.UniformsUtils.clone(m.UniformsUtils.merge([h.UniformsLib.common,h.UniformsLib.fog,{worldUnits:{value:1},linewidth:{value:1},resolution:{value:new m.Vector2(1,1)},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}}])),vertexShader:`
				#include <common>
				#include <fog_pars_vertex>
				#include <logdepthbuf_pars_vertex>
				#include <clipping_planes_pars_vertex>

				uniform float linewidth;
				uniform vec2 resolution;

				attribute vec3 instanceStart;
				attribute vec3 instanceEnd;

				#ifdef USE_COLOR
					#ifdef USE_LINE_COLOR_ALPHA
						varying vec4 vLineColor;
						attribute vec4 instanceColorStart;
						attribute vec4 instanceColorEnd;
					#else
						varying vec3 vLineColor;
						attribute vec3 instanceColorStart;
						attribute vec3 instanceColorEnd;
					#endif
				#endif

				#ifdef WORLD_UNITS

					varying vec4 worldPos;
					varying vec3 worldStart;
					varying vec3 worldEnd;

					#ifdef USE_DASH

						varying vec2 vUv;

					#endif

				#else

					varying vec2 vUv;

				#endif

				#ifdef USE_DASH

					uniform float dashScale;
					attribute float instanceDistanceStart;
					attribute float instanceDistanceEnd;
					varying float vLineDistance;

				#endif

				void trimSegment( const in vec4 start, inout vec4 end ) {

					// trim end segment so it terminates between the camera plane and the near plane

					// conservative estimate of the near plane
					float a = projectionMatrix[ 2 ][ 2 ]; // 3nd entry in 3th column
					float b = projectionMatrix[ 3 ][ 2 ]; // 3nd entry in 4th column
					float nearEstimate = - 0.5 * b / a;

					float alpha = ( nearEstimate - start.z ) / ( end.z - start.z );

					end.xyz = mix( start.xyz, end.xyz, alpha );

				}

				void main() {

					#ifdef USE_COLOR

						vLineColor = ( position.y < 0.5 ) ? instanceColorStart : instanceColorEnd;

					#endif

					#ifdef USE_DASH

						vLineDistance = ( position.y < 0.5 ) ? dashScale * instanceDistanceStart : dashScale * instanceDistanceEnd;
						vUv = uv;

					#endif

					float aspect = resolution.x / resolution.y;

					// camera space
					vec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );
					vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );

					#ifdef WORLD_UNITS

						worldStart = start.xyz;
						worldEnd = end.xyz;

					#else

						vUv = uv;

					#endif

					// special case for perspective projection, and segments that terminate either in, or behind, the camera plane
					// clearly the gpu firmware has a way of addressing this issue when projecting into ndc space
					// but we need to perform ndc-space calculations in the shader, so we must address this issue directly
					// perhaps there is a more elegant solution -- WestLangley

					bool perspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 ); // 4th entry in the 3rd column

					if ( perspective ) {

						if ( start.z < 0.0 && end.z >= 0.0 ) {

							trimSegment( start, end );

						} else if ( end.z < 0.0 && start.z >= 0.0 ) {

							trimSegment( end, start );

						}

					}

					// clip space
					vec4 clipStart = projectionMatrix * start;
					vec4 clipEnd = projectionMatrix * end;

					// ndc space
					vec3 ndcStart = clipStart.xyz / clipStart.w;
					vec3 ndcEnd = clipEnd.xyz / clipEnd.w;

					// direction
					vec2 dir = ndcEnd.xy - ndcStart.xy;

					// account for clip-space aspect ratio
					dir.x *= aspect;
					dir = normalize( dir );

					#ifdef WORLD_UNITS

						// get the offset direction as perpendicular to the view vector
						vec3 worldDir = normalize( end.xyz - start.xyz );
						vec3 offset;
						if ( position.y < 0.5 ) {

							offset = normalize( cross( start.xyz, worldDir ) );

						} else {

							offset = normalize( cross( end.xyz, worldDir ) );

						}

						// sign flip
						if ( position.x < 0.0 ) offset *= - 1.0;

						float forwardOffset = dot( worldDir, vec3( 0.0, 0.0, 1.0 ) );

						// don't extend the line if we're rendering dashes because we
						// won't be rendering the endcaps
						#ifndef USE_DASH

							// extend the line bounds to encompass  endcaps
							start.xyz += - worldDir * linewidth * 0.5;
							end.xyz += worldDir * linewidth * 0.5;

							// shift the position of the quad so it hugs the forward edge of the line
							offset.xy -= dir * forwardOffset;
							offset.z += 0.5;

						#endif

						// endcaps
						if ( position.y > 1.0 || position.y < 0.0 ) {

							offset.xy += dir * 2.0 * forwardOffset;

						}

						// adjust for linewidth
						offset *= linewidth * 0.5;

						// set the world position
						worldPos = ( position.y < 0.5 ) ? start : end;
						worldPos.xyz += offset;

						// project the worldpos
						vec4 clip = projectionMatrix * worldPos;

						// shift the depth of the projected points so the line
						// segments overlap neatly
						vec3 clipPose = ( position.y < 0.5 ) ? ndcStart : ndcEnd;
						clip.z = clipPose.z * clip.w;

					#else

						vec2 offset = vec2( dir.y, - dir.x );
						// undo aspect ratio adjustment
						dir.x /= aspect;
						offset.x /= aspect;

						// sign flip
						if ( position.x < 0.0 ) offset *= - 1.0;

						// endcaps
						if ( position.y < 0.0 ) {

							offset += - dir;

						} else if ( position.y > 1.0 ) {

							offset += dir;

						}

						// adjust for linewidth
						offset *= linewidth;

						// adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...
						offset /= resolution.y;

						// select end
						vec4 clip = ( position.y < 0.5 ) ? clipStart : clipEnd;

						// back to clip space
						offset *= clip.w;

						clip.xy += offset;

					#endif

					gl_Position = clip;

					vec4 mvPosition = ( position.y < 0.5 ) ? start : end; // this is an approximation

					#include <logdepthbuf_vertex>
					#include <clipping_planes_vertex>
					#include <fog_vertex>

				}
			`,fragmentShader:`
				uniform vec3 diffuse;
				uniform float opacity;
				uniform float linewidth;

				#ifdef USE_DASH

					uniform float dashOffset;
					uniform float dashSize;
					uniform float gapSize;

				#endif

				varying float vLineDistance;

				#ifdef WORLD_UNITS

					varying vec4 worldPos;
					varying vec3 worldStart;
					varying vec3 worldEnd;

					#ifdef USE_DASH

						varying vec2 vUv;

					#endif

				#else

					varying vec2 vUv;

				#endif

				#include <common>
				#include <fog_pars_fragment>
				#include <logdepthbuf_pars_fragment>
				#include <clipping_planes_pars_fragment>

				#ifdef USE_COLOR
					#ifdef USE_LINE_COLOR_ALPHA
						varying vec4 vLineColor;
					#else
						varying vec3 vLineColor;
					#endif
				#endif

				vec2 closestLineToLine(vec3 p1, vec3 p2, vec3 p3, vec3 p4) {

					float mua;
					float mub;

					vec3 p13 = p1 - p3;
					vec3 p43 = p4 - p3;

					vec3 p21 = p2 - p1;

					float d1343 = dot( p13, p43 );
					float d4321 = dot( p43, p21 );
					float d1321 = dot( p13, p21 );
					float d4343 = dot( p43, p43 );
					float d2121 = dot( p21, p21 );

					float denom = d2121 * d4343 - d4321 * d4321;

					float numer = d1343 * d4321 - d1321 * d4343;

					mua = numer / denom;
					mua = clamp( mua, 0.0, 1.0 );
					mub = ( d1343 + d4321 * ( mua ) ) / d4343;
					mub = clamp( mub, 0.0, 1.0 );

					return vec2( mua, mub );

				}

				void main() {

					#include <clipping_planes_fragment>

					#ifdef USE_DASH

						if ( vUv.y < - 1.0 || vUv.y > 1.0 ) discard; // discard endcaps

						if ( mod( vLineDistance + dashOffset, dashSize + gapSize ) > dashSize ) discard; // todo - FIX

					#endif

					float alpha = opacity;

					#ifdef WORLD_UNITS

						// Find the closest points on the view ray and the line segment
						vec3 rayEnd = normalize( worldPos.xyz ) * 1e5;
						vec3 lineDir = worldEnd - worldStart;
						vec2 params = closestLineToLine( worldStart, worldEnd, vec3( 0.0, 0.0, 0.0 ), rayEnd );

						vec3 p1 = worldStart + lineDir * params.x;
						vec3 p2 = rayEnd * params.y;
						vec3 delta = p1 - p2;
						float len = length( delta );
						float norm = len / linewidth;

						#ifndef USE_DASH

							#ifdef USE_ALPHA_TO_COVERAGE

								float dnorm = fwidth( norm );
								alpha = 1.0 - smoothstep( 0.5 - dnorm, 0.5 + dnorm, norm );

							#else

								if ( norm > 0.5 ) {

									discard;

								}

							#endif

						#endif

					#else

						#ifdef USE_ALPHA_TO_COVERAGE

							// artifacts appear on some hardware if a derivative is taken within a conditional
							float a = vUv.x;
							float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
							float len2 = a * a + b * b;
							float dlen = fwidth( len2 );

							if ( abs( vUv.y ) > 1.0 ) {

								alpha = 1.0 - smoothstep( 1.0 - dlen, 1.0 + dlen, len2 );

							}

						#else

							if ( abs( vUv.y ) > 1.0 ) {

								float a = vUv.x;
								float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
								float len2 = a * a + b * b;

								if ( len2 > 1.0 ) discard;

							}

						#endif

					#endif

					vec4 diffuseColor = vec4( diffuse, alpha );
					#ifdef USE_COLOR
						#ifdef USE_LINE_COLOR_ALPHA
							diffuseColor *= vLineColor;
						#else
							diffuseColor.rgb *= vLineColor;
						#endif
					#endif

					#include <logdepthbuf_fragment>

					gl_FragColor = diffuseColor;

					#include <tonemapping_fragment>
					#include <${v>=154?"colorspace_fragment":"encodings_fragment"}>
					#include <fog_fragment>
					#include <premultiplied_alpha_fragment>

				}
			`,clipping:!0}),this.isLineMaterial=!0,this.onBeforeCompile=function(){this.transparent?this.defines.USE_LINE_COLOR_ALPHA="1":delete this.defines.USE_LINE_COLOR_ALPHA},Object.defineProperties(this,{color:{enumerable:!0,get:function(){return this.uniforms.diffuse.value},set:function(e){this.uniforms.diffuse.value=e}},worldUnits:{enumerable:!0,get:function(){return"WORLD_UNITS"in this.defines},set:function(e){!0===e?this.defines.WORLD_UNITS="":delete this.defines.WORLD_UNITS}},linewidth:{enumerable:!0,get:function(){return this.uniforms.linewidth.value},set:function(e){this.uniforms.linewidth.value=e}},dashed:{enumerable:!0,get:function(){return"USE_DASH"in this.defines},set(e){!!e!="USE_DASH"in this.defines&&(this.needsUpdate=!0),!0===e?this.defines.USE_DASH="":delete this.defines.USE_DASH}},dashScale:{enumerable:!0,get:function(){return this.uniforms.dashScale.value},set:function(e){this.uniforms.dashScale.value=e}},dashSize:{enumerable:!0,get:function(){return this.uniforms.dashSize.value},set:function(e){this.uniforms.dashSize.value=e}},dashOffset:{enumerable:!0,get:function(){return this.uniforms.dashOffset.value},set:function(e){this.uniforms.dashOffset.value=e}},gapSize:{enumerable:!0,get:function(){return this.uniforms.gapSize.value},set:function(e){this.uniforms.gapSize.value=e}},opacity:{enumerable:!0,get:function(){return this.uniforms.opacity.value},set:function(e){this.uniforms.opacity.value=e}},resolution:{enumerable:!0,get:function(){return this.uniforms.resolution.value},set:function(e){this.uniforms.resolution.value.copy(e)}},alphaToCoverage:{enumerable:!0,get:function(){return"USE_ALPHA_TO_COVERAGE"in this.defines},set:function(e){!!e!="USE_ALPHA_TO_COVERAGE"in this.defines&&(this.needsUpdate=!0),!0===e?(this.defines.USE_ALPHA_TO_COVERAGE="",this.extensions.derivatives=!0):(delete this.defines.USE_ALPHA_TO_COVERAGE,this.extensions.derivatives=!1)}}}),this.setValues(e)}}let g=v>=125?"uv1":"uv2",x=new c.Vector4,b=new c.Vector3,S=new c.Vector3,w=new c.Vector4,A=new c.Vector4,E=new c.Vector4,_=new c.Vector3,L=new c.Matrix4,z=new c.Line3,U=new c.Vector3,M=new c.Box3,C=new c.Sphere,O=new c.Vector4;function B(e,t,n){return O.set(0,0,-t,1).applyMatrix4(e.projectionMatrix),O.multiplyScalar(1/O.w),O.x=i/n.width,O.y=i/n.height,O.applyMatrix4(e.projectionMatrixInverse),O.multiplyScalar(1/O.w),Math.abs(Math.max(O.x,O.y))}class P extends c.Mesh{constructor(e=new p,t=new y({color:0xffffff*Math.random()})){super(e,t),this.isLineSegments2=!0,this.type="LineSegments2"}computeLineDistances(){let e=this.geometry,t=e.attributes.instanceStart,i=e.attributes.instanceEnd,n=new Float32Array(2*t.count);for(let e=0,r=0,o=t.count;e<o;e++,r+=2)b.fromBufferAttribute(t,e),S.fromBufferAttribute(i,e),n[r]=0===r?0:n[r-1],n[r+1]=n[r]+b.distanceTo(S);let r=new c.InstancedInterleavedBuffer(n,2,1);return e.setAttribute("instanceDistanceStart",new c.InterleavedBufferAttribute(r,1,0)),e.setAttribute("instanceDistanceEnd",new c.InterleavedBufferAttribute(r,1,1)),this}raycast(e,n){let r,o,a=this.material.worldUnits,s=e.camera;null!==s||a||console.error('LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.');let l=void 0!==e.params.Line2&&e.params.Line2.threshold||0;t=e.ray;let d=this.matrixWorld,f=this.geometry,u=this.material;if(i=u.linewidth+l,null===f.boundingSphere&&f.computeBoundingSphere(),C.copy(f.boundingSphere).applyMatrix4(d),a)r=.5*i;else{let e=Math.max(s.near,C.distanceToPoint(t.origin));r=B(s,e,u.resolution)}if(C.radius+=r,!1!==t.intersectsSphere(C)){if(null===f.boundingBox&&f.computeBoundingBox(),M.copy(f.boundingBox).applyMatrix4(d),a)o=.5*i;else{let e=Math.max(s.near,M.distanceToPoint(t.origin));o=B(s,e,u.resolution)}M.expandByScalar(o),!1!==t.intersectsBox(M)&&(a?function(e,n){let r=e.matrixWorld,o=e.geometry,a=o.attributes.instanceStart,s=o.attributes.instanceEnd,l=Math.min(o.instanceCount,a.count);for(let o=0;o<l;o++){z.start.fromBufferAttribute(a,o),z.end.fromBufferAttribute(s,o),z.applyMatrix4(r);let l=new c.Vector3,d=new c.Vector3;t.distanceSqToSegment(z.start,z.end,d,l),d.distanceTo(l)<.5*i&&n.push({point:d,pointOnLine:l,distance:t.origin.distanceTo(d),object:e,face:null,faceIndex:o,uv:null,[g]:null})}}(this,n):function(e,n,r){let o=n.projectionMatrix,a=e.material.resolution,s=e.matrixWorld,l=e.geometry,d=l.attributes.instanceStart,f=l.attributes.instanceEnd,u=Math.min(l.instanceCount,d.count),p=-n.near;t.at(1,E),E.w=1,E.applyMatrix4(n.matrixWorldInverse),E.applyMatrix4(o),E.multiplyScalar(1/E.w),E.x*=a.x/2,E.y*=a.y/2,E.z=0,_.copy(E),L.multiplyMatrices(n.matrixWorldInverse,s);for(let n=0;n<u;n++){if(w.fromBufferAttribute(d,n),A.fromBufferAttribute(f,n),w.w=1,A.w=1,w.applyMatrix4(L),A.applyMatrix4(L),w.z>p&&A.z>p)continue;if(w.z>p){let e=w.z-A.z,t=(w.z-p)/e;w.lerp(A,t)}else if(A.z>p){let e=A.z-w.z,t=(A.z-p)/e;A.lerp(w,t)}w.applyMatrix4(o),A.applyMatrix4(o),w.multiplyScalar(1/w.w),A.multiplyScalar(1/A.w),w.x*=a.x/2,w.y*=a.y/2,A.x*=a.x/2,A.y*=a.y/2,z.start.copy(w),z.start.z=0,z.end.copy(A),z.end.z=0;let l=z.closestPointToPointParameter(_,!0);z.at(l,U);let u=c.MathUtils.lerp(w.z,A.z,l),m=u>=-1&&u<=1,h=_.distanceTo(U)<.5*i;if(m&&h){z.start.fromBufferAttribute(d,n),z.end.fromBufferAttribute(f,n),z.start.applyMatrix4(s),z.end.applyMatrix4(s);let i=new c.Vector3,o=new c.Vector3;t.distanceSqToSegment(z.start,z.end,o,i),r.push({point:o,pointOnLine:i,distance:t.origin.distanceTo(o),object:e,face:null,faceIndex:n,uv:null,[g]:null})}}}(this,s,n))}}onBeforeRender(e){let t=this.material.uniforms;t&&t.resolution&&(e.getViewport(x),this.material.uniforms.resolution.value.set(x.z,x.w))}}class R extends p{constructor(){super(),this.isLineGeometry=!0,this.type="LineGeometry"}setPositions(e){let t=e.length-3,i=new Float32Array(2*t);for(let n=0;n<t;n+=3)i[2*n]=e[n],i[2*n+1]=e[n+1],i[2*n+2]=e[n+2],i[2*n+3]=e[n+3],i[2*n+4]=e[n+4],i[2*n+5]=e[n+5];return super.setPositions(i),this}setColors(e,t=3){let i=e.length-t,n=new Float32Array(2*i);if(3===t)for(let r=0;r<i;r+=t)n[2*r]=e[r],n[2*r+1]=e[r+1],n[2*r+2]=e[r+2],n[2*r+3]=e[r+3],n[2*r+4]=e[r+4],n[2*r+5]=e[r+5];else for(let r=0;r<i;r+=t)n[2*r]=e[r],n[2*r+1]=e[r+1],n[2*r+2]=e[r+2],n[2*r+3]=e[r+3],n[2*r+4]=e[r+4],n[2*r+5]=e[r+5],n[2*r+6]=e[r+6],n[2*r+7]=e[r+7];return super.setColors(n,t),this}fromLine(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}}class I extends P{constructor(e=new R,t=new y({color:0xffffff*Math.random()})){super(e,t),this.isLine2=!0,this.type="Line2"}}let T=s.forwardRef(function({points:e,color:t=0xffffff,vertexColors:i,linewidth:n,lineWidth:o,segments:c,dashed:d,...f},u){var m,h;let v=(0,l.useThree)(e=>e.size),g=s.useMemo(()=>c?new P:new I,[c]),[x]=s.useState(()=>new y),b=(null==i||null==(m=i[0])?void 0:m.length)===4?4:3,S=s.useMemo(()=>{let n=c?new p:new R,o=e.map(e=>{let t=Array.isArray(e);return e instanceof r.Vector3||e instanceof r.Vector4?[e.x,e.y,e.z]:e instanceof r.Vector2?[e.x,e.y,0]:t&&3===e.length?[e[0],e[1],e[2]]:t&&2===e.length?[e[0],e[1],0]:e});if(n.setPositions(o.flat()),i){t=0xffffff;let e=i.map(e=>e instanceof r.Color?e.toArray():e);n.setColors(e.flat(),b)}return n},[e,c,i,b]);return s.useLayoutEffect(()=>{g.computeLineDistances()},[e,g]),s.useLayoutEffect(()=>{d?x.defines.USE_DASH="":delete x.defines.USE_DASH,x.needsUpdate=!0},[d,x]),s.useEffect(()=>()=>{S.dispose(),x.dispose()},[S]),s.createElement("primitive",(0,a.default)({object:g,ref:u},f),s.createElement("primitive",{object:S,attach:"geometry"}),s.createElement("primitive",(0,a.default)({object:x,attach:"material",color:t,vertexColors:!!i,resolution:[v.width,v.height],linewidth:null!=(h=null!=n?n:o)?h:1,dashed:d,transparent:4===b},f)))});e.s(["Line",0,T],25733)},32453,e=>{"use strict";var t=e.i(88227),i=e.i(48845),n=e.i(61070),r=e.i(23458),o=e.i(33839),a=e.i(83879);let s=i.forwardRef(function({children:e,follow:t=!0,lockX:r=!1,lockY:s=!1,lockZ:l=!1,...c},d){let f=i.useRef(null),u=i.useRef(null),p=new a.Quaternion;return(0,n.useFrame)(({camera:e})=>{if(!t||!u.current)return;let i=f.current.rotation.clone();u.current.updateMatrix(),u.current.updateWorldMatrix(!1,!1),u.current.getWorldQuaternion(p),e.getWorldQuaternion(f.current.quaternion).premultiply(p.invert()),r&&(f.current.rotation.x=i.x),s&&(f.current.rotation.y=i.y),l&&(f.current.rotation.z=i.z)}),i.useImperativeHandle(d,()=>u.current,[]),i.createElement("group",(0,o.default)({ref:u},c),i.createElement("group",{ref:f},e))});var l=a,c=e.i(83475),d=e.i(33902),f=e.i(16598);class u extends l.ShaderMaterial{constructor(){super({uniforms:{time:{value:0},pixelRatio:{value:1}},vertexShader:`
        uniform float pixelRatio;
        uniform float time;
        attribute float size;  
        attribute float speed;  
        attribute float opacity;
        attribute vec3 noise;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vOpacity;

        void main() {
          vec4 modelPosition = modelMatrix * vec4(position, 1.0);
          modelPosition.y += sin(time * speed + modelPosition.x * noise.x * 100.0) * 0.2;
          modelPosition.z += cos(time * speed + modelPosition.x * noise.y * 100.0) * 0.2;
          modelPosition.x += cos(time * speed + modelPosition.x * noise.z * 100.0) * 0.2;
          vec4 viewPosition = viewMatrix * modelPosition;
          vec4 projectionPostion = projectionMatrix * viewPosition;
          gl_Position = projectionPostion;
          gl_PointSize = size * 25. * pixelRatio;
          gl_PointSize *= (1.0 / - viewPosition.z);
          vColor = color;
          vOpacity = opacity;
        }
      `,fragmentShader:`
        varying vec3 vColor;
        varying float vOpacity;
        void main() {
          float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
          float strength = 0.05 / distanceToCenter - 0.1;
          gl_FragColor = vec4(vColor, strength * vOpacity);
          #include <tonemapping_fragment>
          #include <${f.version>=154?"colorspace_fragment":"encodings_fragment"}>
        }
      `})}get time(){return this.uniforms.time.value}set time(e){this.uniforms.time.value=e}get pixelRatio(){return this.uniforms.pixelRatio.value}set pixelRatio(e){this.uniforms.pixelRatio.value=e}}let p=e=>e&&e.constructor===Float32Array,m=e=>e instanceof l.Vector2||e instanceof l.Vector3||e instanceof l.Vector4,h=e=>Array.isArray(e)?e:m(e)?e.toArray():[e,e,e];function v(e,t,n){return i.useMemo(()=>{if(void 0!==t)if(p(t))return t;else{if(t instanceof l.Color){let i=Array.from({length:3*e},()=>[t.r,t.g,t.b]).flat();return Float32Array.from(i)}if(m(t)||Array.isArray(t)){let i=Array.from({length:3*e},()=>h(t)).flat();return Float32Array.from(i)}return Float32Array.from({length:e},()=>t)}return Float32Array.from({length:e},n)},[t])}let y=i.forwardRef(({noise:e=1,count:t=100,speed:r=1,opacity:a=1,scale:s=1,size:f,color:m,children:y,...g},x)=>{i.useMemo(()=>(0,c.extend)({SparklesImplMaterial:u}),[]);let b=i.useRef(null),S=(0,d.useThree)(e=>e.viewport.dpr),w=h(s),A=i.useMemo(()=>Float32Array.from(Array.from({length:t},()=>w.map(l.MathUtils.randFloatSpread)).flat()),[t,...w]),E=v(t,f,Math.random),_=v(t,a),L=v(t,r),z=v(3*t,e),U=v(void 0===m?3*t:t,p(m)?m:new l.Color(m),()=>1);return(0,n.useFrame)(e=>{b.current&&b.current.material&&(b.current.material.time=e.clock.elapsedTime)}),i.useImperativeHandle(x,()=>b.current,[]),i.createElement("points",(0,o.default)({key:`particle-${t}-${JSON.stringify(s)}`},g,{ref:b}),i.createElement("bufferGeometry",null,i.createElement("bufferAttribute",{attach:"attributes-position",args:[A,3]}),i.createElement("bufferAttribute",{attach:"attributes-size",args:[E,1]}),i.createElement("bufferAttribute",{attach:"attributes-opacity",args:[_,1]}),i.createElement("bufferAttribute",{attach:"attributes-speed",args:[L,1]}),i.createElement("bufferAttribute",{attach:"attributes-color",args:[U,3]}),i.createElement("bufferAttribute",{attach:"attributes-noise",args:[z,3]})),y||i.createElement("sparklesImplMaterial",{transparent:!0,pixelRatio:S,depthWrite:!1}))});var g=e.i(25733),x=e.i(42386);let b={power:"POWER MONITORING","building-auto":"BUILDING AUTO",gas:"GAS DETECTION",fire:"FIRE ALARM"},S={power:{tokenName:"--sf-power-primary",fallbackHex:"#3b82f6",accentRgb:"59,130,246"},"building-auto":{tokenName:"--sf-ba-primary",fallbackHex:"#10b981",accentRgb:"16,185,129"},gas:{tokenName:"--sf-gas-primary",fallbackHex:"#f59e0b",accentRgb:"245,158,11"},fire:{tokenName:"--sf-fire-primary",fallbackHex:"#ef4444",accentRgb:"239,68,68"}},w={power:{count:16,speed:.24},"building-auto":{count:0,speed:0},gas:{count:20,speed:.32},fire:{count:24,speed:.42}};e.s(["SubsystemZone",0,function({zoneType:e,position:o,onClick:l,hasAlert:c=!1,alertCount:d,statusLabel:f}){let u=(0,i.useRef)(null),[p,m]=(0,i.useState)(!1),h=(0,x.useReducedMotion)(),v=S[e],A=("u">typeof document?getComputedStyle(document.documentElement).getPropertyValue(v.tokenName).trim():"")||v.fallbackHex,E="#0B0F19",_=b[e],L=c||(d??0)>0,{count:z,speed:U}=w[e];(0,n.useFrame)(e=>{if(u.current)if(L){let t=h?.55:.5*Math.sin(3*e.clock.elapsedTime)+.5,i=new a.Color(A);u.current.emissive=i.multiplyScalar(.15+.65*t)}else p?(u.current.emissive=new a.Color(A),u.current.emissiveIntensity=.3):(u.current.emissive=new a.Color(0),u.current.emissiveIntensity=0)});let M=o[0],C=o[1],O=o[2],B=[[[[M-5.75,C,O-5.75],[M-5.75+1.5,C,O-5.75]],"nl-x"],[[[M-5.75,C,O-5.75],[M-5.75,C,O-5.75+1.5]],"nl-z"],[[[M+5.75,C,O-5.75],[M+5.75-1.5,C,O-5.75]],"nr-x"],[[[M+5.75,C,O-5.75],[M+5.75,C,O-5.75+1.5]],"nr-z"],[[[M-5.75,C,O+5.75],[M-5.75+1.5,C,O+5.75]],"fl-x"],[[[M-5.75,C,O+5.75],[M-5.75,C,O+5.75-1.5]],"fl-z"],[[[M+5.75,C,O+5.75],[M+5.75-1.5,C,O+5.75]],"fr-x"],[[[M+5.75,C,O+5.75],[M+5.75,C,O+5.75-1.5]],"fr-z"]];return(0,t.jsxs)("group",{children:[(0,t.jsxs)("mesh",{position:o,onClick:l,onPointerOver:()=>m(!0),onPointerOut:()=>m(!1),children:[(0,t.jsx)("boxGeometry",{args:[11.5,.16,11.5]}),(0,t.jsx)("meshStandardMaterial",{ref:u,color:A,transparent:!0,opacity:p?.48:.34,roughness:.38,metalness:.12})]}),(0,t.jsxs)("mesh",{position:[o[0],o[1]+.1,o[2]],rotation:[-Math.PI/2,0,0],children:[(0,t.jsx)("ringGeometry",{args:[4.83,5.175,56]}),(0,t.jsx)("meshBasicMaterial",{color:A,transparent:!0,opacity:L?.72:.34})]}),(0,t.jsx)(s,{position:[o[0],o[1]+2,o[2]],children:(0,t.jsx)(r.Text,{fontSize:.72,color:"#e2e8f0",anchorX:"center",anchorY:"middle",outlineWidth:.05,outlineColor:E,children:_})}),(0,t.jsx)(s,{position:[o[0],o[1]+1.3,o[2]],children:(0,t.jsx)(r.Text,{fontSize:.4,color:L?A:"#94a3b8",anchorX:"center",anchorY:"middle",outlineWidth:.04,outlineColor:E,children:f||(L?`${d??0} ALERTS`:"NOMINAL")})}),L&&!h&&z>0&&(0,t.jsx)(y,{position:[o[0],o[1]+1.5,o[2]],count:z,scale:11.5,size:2,speed:U,color:A}),B.map(([e,i])=>(0,t.jsx)(g.Line,{points:e,color:A,lineWidth:1,transparent:!0,opacity:.42},i)),(0,t.jsx)(g.Line,{points:[[M-5.75,C,O],[M+5.75,C,O]],color:A,lineWidth:.5,transparent:!0,opacity:.2}),(0,t.jsx)(g.Line,{points:[[M,C,O-5.75],[M,C,O+5.75]],color:A,lineWidth:.5,transparent:!0,opacity:.2})]})}],32453)},75292,e=>{e.n(e.i(32453))}]);