(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,33839,e=>{"use strict";function t(){return(t=Object.assign.bind()).apply(null,arguments)}e.s(["default",()=>t])},33902,e=>{"use strict";var t=e.i(73973);e.s(["useThree",()=>t.C])},61070,e=>{"use strict";var t=e.i(73973);e.s(["useFrame",()=>t.D])},83475,16598,25733,e=>{"use strict";let t,n;var i=e.i(73973);e.s(["extend",()=>i.e],83475);var o=e.i(83879);let r=parseInt(o.REVISION.replace(/\D+/g,""));e.s(["version",0,r],16598);var a=e.i(33839),s=e.i(48845),l=e.i(33902),c=o,d=o;let u=new d.Box3,f=new d.Vector3;class p extends d.InstancedBufferGeometry{constructor(){super(),this.isLineSegmentsGeometry=!0,this.type="LineSegmentsGeometry",this.setIndex([0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5]),this.setAttribute("position",new d.Float32BufferAttribute([-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],3)),this.setAttribute("uv",new d.Float32BufferAttribute([-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],2))}applyMatrix4(e){let t=this.attributes.instanceStart,n=this.attributes.instanceEnd;return void 0!==t&&(t.applyMatrix4(e),n.applyMatrix4(e),t.needsUpdate=!0),null!==this.boundingBox&&this.computeBoundingBox(),null!==this.boundingSphere&&this.computeBoundingSphere(),this}setPositions(e){let t;e instanceof Float32Array?t=e:Array.isArray(e)&&(t=new Float32Array(e));let n=new d.InstancedInterleavedBuffer(t,6,1);return this.setAttribute("instanceStart",new d.InterleavedBufferAttribute(n,3,0)),this.setAttribute("instanceEnd",new d.InterleavedBufferAttribute(n,3,3)),this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(e,t=3){let n;e instanceof Float32Array?n=e:Array.isArray(e)&&(n=new Float32Array(e));let i=new d.InstancedInterleavedBuffer(n,2*t,1);return this.setAttribute("instanceColorStart",new d.InterleavedBufferAttribute(i,t,0)),this.setAttribute("instanceColorEnd",new d.InterleavedBufferAttribute(i,t,t)),this}fromWireframeGeometry(e){return this.setPositions(e.attributes.position.array),this}fromEdgesGeometry(e){return this.setPositions(e.attributes.position.array),this}fromMesh(e){return this.fromWireframeGeometry(new d.WireframeGeometry(e.geometry)),this}fromLineSegments(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}computeBoundingBox(){null===this.boundingBox&&(this.boundingBox=new d.Box3);let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;void 0!==e&&void 0!==t&&(this.boundingBox.setFromBufferAttribute(e),u.setFromBufferAttribute(t),this.boundingBox.union(u))}computeBoundingSphere(){null===this.boundingSphere&&(this.boundingSphere=new d.Sphere),null===this.boundingBox&&this.computeBoundingBox();let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;if(void 0!==e&&void 0!==t){let n=this.boundingSphere.center;this.boundingBox.getCenter(n);let i=0;for(let o=0,r=e.count;o<r;o++)f.fromBufferAttribute(e,o),i=Math.max(i,n.distanceToSquared(f)),f.fromBufferAttribute(t,o),i=Math.max(i,n.distanceToSquared(f));this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&console.error("THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.",this)}}toJSON(){}applyMatrix(e){return console.warn("THREE.LineSegmentsGeometry: applyMatrix() has been renamed to applyMatrix4()."),this.applyMatrix4(e)}}var m=o,h=e.i(17502);let v=parseInt(o.REVISION.replace(/\D+/g,""));class g extends m.ShaderMaterial{constructor(e){super({type:"LineMaterial",uniforms:m.UniformsUtils.clone(m.UniformsUtils.merge([h.UniformsLib.common,h.UniformsLib.fog,{worldUnits:{value:1},linewidth:{value:1},resolution:{value:new m.Vector2(1,1)},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}}])),vertexShader:`
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
			`,clipping:!0}),this.isLineMaterial=!0,this.onBeforeCompile=function(){this.transparent?this.defines.USE_LINE_COLOR_ALPHA="1":delete this.defines.USE_LINE_COLOR_ALPHA},Object.defineProperties(this,{color:{enumerable:!0,get:function(){return this.uniforms.diffuse.value},set:function(e){this.uniforms.diffuse.value=e}},worldUnits:{enumerable:!0,get:function(){return"WORLD_UNITS"in this.defines},set:function(e){!0===e?this.defines.WORLD_UNITS="":delete this.defines.WORLD_UNITS}},linewidth:{enumerable:!0,get:function(){return this.uniforms.linewidth.value},set:function(e){this.uniforms.linewidth.value=e}},dashed:{enumerable:!0,get:function(){return"USE_DASH"in this.defines},set(e){!!e!="USE_DASH"in this.defines&&(this.needsUpdate=!0),!0===e?this.defines.USE_DASH="":delete this.defines.USE_DASH}},dashScale:{enumerable:!0,get:function(){return this.uniforms.dashScale.value},set:function(e){this.uniforms.dashScale.value=e}},dashSize:{enumerable:!0,get:function(){return this.uniforms.dashSize.value},set:function(e){this.uniforms.dashSize.value=e}},dashOffset:{enumerable:!0,get:function(){return this.uniforms.dashOffset.value},set:function(e){this.uniforms.dashOffset.value=e}},gapSize:{enumerable:!0,get:function(){return this.uniforms.gapSize.value},set:function(e){this.uniforms.gapSize.value=e}},opacity:{enumerable:!0,get:function(){return this.uniforms.opacity.value},set:function(e){this.uniforms.opacity.value=e}},resolution:{enumerable:!0,get:function(){return this.uniforms.resolution.value},set:function(e){this.uniforms.resolution.value.copy(e)}},alphaToCoverage:{enumerable:!0,get:function(){return"USE_ALPHA_TO_COVERAGE"in this.defines},set:function(e){!!e!="USE_ALPHA_TO_COVERAGE"in this.defines&&(this.needsUpdate=!0),!0===e?(this.defines.USE_ALPHA_TO_COVERAGE="",this.extensions.derivatives=!0):(delete this.defines.USE_ALPHA_TO_COVERAGE,this.extensions.derivatives=!1)}}}),this.setValues(e)}}let b=v>=125?"uv1":"uv2",y=new c.Vector4,x=new c.Vector3,w=new c.Vector3,E=new c.Vector4,S=new c.Vector4,j=new c.Vector4,P=new c.Vector3,A=new c.Matrix4,O=new c.Line3,L=new c.Vector3,M=new c.Box3,_=new c.Sphere,T=new c.Vector4;function C(e,t,i){return T.set(0,0,-t,1).applyMatrix4(e.projectionMatrix),T.multiplyScalar(1/T.w),T.x=n/i.width,T.y=n/i.height,T.applyMatrix4(e.projectionMatrixInverse),T.multiplyScalar(1/T.w),Math.abs(Math.max(T.x,T.y))}class z extends c.Mesh{constructor(e=new p,t=new g({color:0xffffff*Math.random()})){super(e,t),this.isLineSegments2=!0,this.type="LineSegments2"}computeLineDistances(){let e=this.geometry,t=e.attributes.instanceStart,n=e.attributes.instanceEnd,i=new Float32Array(2*t.count);for(let e=0,o=0,r=t.count;e<r;e++,o+=2)x.fromBufferAttribute(t,e),w.fromBufferAttribute(n,e),i[o]=0===o?0:i[o-1],i[o+1]=i[o]+x.distanceTo(w);let o=new c.InstancedInterleavedBuffer(i,2,1);return e.setAttribute("instanceDistanceStart",new c.InterleavedBufferAttribute(o,1,0)),e.setAttribute("instanceDistanceEnd",new c.InterleavedBufferAttribute(o,1,1)),this}raycast(e,i){let o,r,a=this.material.worldUnits,s=e.camera;null!==s||a||console.error('LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.');let l=void 0!==e.params.Line2&&e.params.Line2.threshold||0;t=e.ray;let d=this.matrixWorld,u=this.geometry,f=this.material;if(n=f.linewidth+l,null===u.boundingSphere&&u.computeBoundingSphere(),_.copy(u.boundingSphere).applyMatrix4(d),a)o=.5*n;else{let e=Math.max(s.near,_.distanceToPoint(t.origin));o=C(s,e,f.resolution)}if(_.radius+=o,!1!==t.intersectsSphere(_)){if(null===u.boundingBox&&u.computeBoundingBox(),M.copy(u.boundingBox).applyMatrix4(d),a)r=.5*n;else{let e=Math.max(s.near,M.distanceToPoint(t.origin));r=C(s,e,f.resolution)}M.expandByScalar(r),!1!==t.intersectsBox(M)&&(a?function(e,i){let o=e.matrixWorld,r=e.geometry,a=r.attributes.instanceStart,s=r.attributes.instanceEnd,l=Math.min(r.instanceCount,a.count);for(let r=0;r<l;r++){O.start.fromBufferAttribute(a,r),O.end.fromBufferAttribute(s,r),O.applyMatrix4(o);let l=new c.Vector3,d=new c.Vector3;t.distanceSqToSegment(O.start,O.end,d,l),d.distanceTo(l)<.5*n&&i.push({point:d,pointOnLine:l,distance:t.origin.distanceTo(d),object:e,face:null,faceIndex:r,uv:null,[b]:null})}}(this,i):function(e,i,o){let r=i.projectionMatrix,a=e.material.resolution,s=e.matrixWorld,l=e.geometry,d=l.attributes.instanceStart,u=l.attributes.instanceEnd,f=Math.min(l.instanceCount,d.count),p=-i.near;t.at(1,j),j.w=1,j.applyMatrix4(i.matrixWorldInverse),j.applyMatrix4(r),j.multiplyScalar(1/j.w),j.x*=a.x/2,j.y*=a.y/2,j.z=0,P.copy(j),A.multiplyMatrices(i.matrixWorldInverse,s);for(let i=0;i<f;i++){if(E.fromBufferAttribute(d,i),S.fromBufferAttribute(u,i),E.w=1,S.w=1,E.applyMatrix4(A),S.applyMatrix4(A),E.z>p&&S.z>p)continue;if(E.z>p){let e=E.z-S.z,t=(E.z-p)/e;E.lerp(S,t)}else if(S.z>p){let e=S.z-E.z,t=(S.z-p)/e;S.lerp(E,t)}E.applyMatrix4(r),S.applyMatrix4(r),E.multiplyScalar(1/E.w),S.multiplyScalar(1/S.w),E.x*=a.x/2,E.y*=a.y/2,S.x*=a.x/2,S.y*=a.y/2,O.start.copy(E),O.start.z=0,O.end.copy(S),O.end.z=0;let l=O.closestPointToPointParameter(P,!0);O.at(l,L);let f=c.MathUtils.lerp(E.z,S.z,l),m=f>=-1&&f<=1,h=P.distanceTo(L)<.5*n;if(m&&h){O.start.fromBufferAttribute(d,i),O.end.fromBufferAttribute(u,i),O.start.applyMatrix4(s),O.end.applyMatrix4(s);let n=new c.Vector3,r=new c.Vector3;t.distanceSqToSegment(O.start,O.end,r,n),o.push({point:r,pointOnLine:n,distance:t.origin.distanceTo(r),object:e,face:null,faceIndex:i,uv:null,[b]:null})}}}(this,s,i))}}onBeforeRender(e){let t=this.material.uniforms;t&&t.resolution&&(e.getViewport(y),this.material.uniforms.resolution.value.set(y.z,y.w))}}class U extends p{constructor(){super(),this.isLineGeometry=!0,this.type="LineGeometry"}setPositions(e){let t=e.length-3,n=new Float32Array(2*t);for(let i=0;i<t;i+=3)n[2*i]=e[i],n[2*i+1]=e[i+1],n[2*i+2]=e[i+2],n[2*i+3]=e[i+3],n[2*i+4]=e[i+4],n[2*i+5]=e[i+5];return super.setPositions(n),this}setColors(e,t=3){let n=e.length-t,i=new Float32Array(2*n);if(3===t)for(let o=0;o<n;o+=t)i[2*o]=e[o],i[2*o+1]=e[o+1],i[2*o+2]=e[o+2],i[2*o+3]=e[o+3],i[2*o+4]=e[o+4],i[2*o+5]=e[o+5];else for(let o=0;o<n;o+=t)i[2*o]=e[o],i[2*o+1]=e[o+1],i[2*o+2]=e[o+2],i[2*o+3]=e[o+3],i[2*o+4]=e[o+4],i[2*o+5]=e[o+5],i[2*o+6]=e[o+6],i[2*o+7]=e[o+7];return super.setColors(i,t),this}fromLine(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}}class D extends z{constructor(e=new U,t=new g({color:0xffffff*Math.random()})){super(e,t),this.isLine2=!0,this.type="Line2"}}let I=s.forwardRef(function({points:e,color:t=0xffffff,vertexColors:n,linewidth:i,lineWidth:r,segments:c,dashed:d,...u},f){var m,h;let v=(0,l.useThree)(e=>e.size),b=s.useMemo(()=>c?new z:new D,[c]),[y]=s.useState(()=>new g),x=(null==n||null==(m=n[0])?void 0:m.length)===4?4:3,w=s.useMemo(()=>{let i=c?new p:new U,r=e.map(e=>{let t=Array.isArray(e);return e instanceof o.Vector3||e instanceof o.Vector4?[e.x,e.y,e.z]:e instanceof o.Vector2?[e.x,e.y,0]:t&&3===e.length?[e[0],e[1],e[2]]:t&&2===e.length?[e[0],e[1],0]:e});if(i.setPositions(r.flat()),n){t=0xffffff;let e=n.map(e=>e instanceof o.Color?e.toArray():e);i.setColors(e.flat(),x)}return i},[e,c,n,x]);return s.useLayoutEffect(()=>{b.computeLineDistances()},[e,b]),s.useLayoutEffect(()=>{d?y.defines.USE_DASH="":delete y.defines.USE_DASH,y.needsUpdate=!0},[d,y]),s.useEffect(()=>()=>{w.dispose(),y.dispose()},[w]),s.createElement("primitive",(0,a.default)({object:b,ref:f},u),s.createElement("primitive",{object:w,attach:"geometry"}),s.createElement("primitive",(0,a.default)({object:y,attach:"material",color:t,vertexColors:!!n,resolution:[v.width,v.height],linewidth:null!=(h=null!=i?i:r)?h:1,dashed:d,transparent:4===x},u)))});e.s(["Line",0,I],25733)},55044,e=>{"use strict";var t=e.i(33839),n=e.i(33902),i=e.i(61070),o=e.i(48845),r=e.i(83879),a=Object.defineProperty;class s{constructor(){((e,t,n)=>{let i;return(i="symbol"!=typeof t?t+"":t)in e?a(e,i,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[i]=n})(this,"_listeners")}addEventListener(e,t){void 0===this._listeners&&(this._listeners={});let n=this._listeners;void 0===n[e]&&(n[e]=[]),-1===n[e].indexOf(t)&&n[e].push(t)}hasEventListener(e,t){if(void 0===this._listeners)return!1;let n=this._listeners;return void 0!==n[e]&&-1!==n[e].indexOf(t)}removeEventListener(e,t){if(void 0===this._listeners)return;let n=this._listeners[e];if(void 0!==n){let e=n.indexOf(t);-1!==e&&n.splice(e,1)}}dispatchEvent(e){if(void 0===this._listeners)return;let t=this._listeners[e.type];if(void 0!==t){e.target=this;let n=t.slice(0);for(let t=0,i=n.length;t<i;t++)n[t].call(this,e);e.target=null}}}var l=Object.defineProperty,c=(e,t,n)=>{let i;return(i="symbol"!=typeof t?t+"":t)in e?l(e,i,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[i]=n,n};let d=new r.Ray,u=new r.Plane,f=Math.cos(Math.PI/180*70),p=(e,t)=>(e%t+t)%t;class m extends s{constructor(e,t){super(),c(this,"object"),c(this,"domElement"),c(this,"enabled",!0),c(this,"target",new r.Vector3),c(this,"minDistance",0),c(this,"maxDistance",1/0),c(this,"minZoom",0),c(this,"maxZoom",1/0),c(this,"minPolarAngle",0),c(this,"maxPolarAngle",Math.PI),c(this,"minAzimuthAngle",-1/0),c(this,"maxAzimuthAngle",1/0),c(this,"enableDamping",!1),c(this,"dampingFactor",.05),c(this,"enableZoom",!0),c(this,"zoomSpeed",1),c(this,"enableRotate",!0),c(this,"rotateSpeed",1),c(this,"enablePan",!0),c(this,"panSpeed",1),c(this,"screenSpacePanning",!0),c(this,"keyPanSpeed",7),c(this,"zoomToCursor",!1),c(this,"autoRotate",!1),c(this,"autoRotateSpeed",2),c(this,"reverseOrbit",!1),c(this,"reverseHorizontalOrbit",!1),c(this,"reverseVerticalOrbit",!1),c(this,"keys",{LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"}),c(this,"mouseButtons",{LEFT:r.MOUSE.ROTATE,MIDDLE:r.MOUSE.DOLLY,RIGHT:r.MOUSE.PAN}),c(this,"touches",{ONE:r.TOUCH.ROTATE,TWO:r.TOUCH.DOLLY_PAN}),c(this,"target0"),c(this,"position0"),c(this,"zoom0"),c(this,"_domElementKeyEvents",null),c(this,"getPolarAngle"),c(this,"getAzimuthalAngle"),c(this,"setPolarAngle"),c(this,"setAzimuthalAngle"),c(this,"getDistance"),c(this,"getZoomScale"),c(this,"listenToKeyEvents"),c(this,"stopListenToKeyEvents"),c(this,"saveState"),c(this,"reset"),c(this,"update"),c(this,"connect"),c(this,"dispose"),c(this,"dollyIn"),c(this,"dollyOut"),c(this,"getScale"),c(this,"setScale"),this.object=e,this.domElement=t,this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this.getPolarAngle=()=>h.phi,this.getAzimuthalAngle=()=>h.theta,this.setPolarAngle=e=>{let t=p(e,2*Math.PI),i=h.phi;i<0&&(i+=2*Math.PI),t<0&&(t+=2*Math.PI);let o=Math.abs(t-i);2*Math.PI-o<o&&(t<i?t+=2*Math.PI:i+=2*Math.PI),v.phi=t-i,n.update()},this.setAzimuthalAngle=e=>{let t=p(e,2*Math.PI),i=h.theta;i<0&&(i+=2*Math.PI),t<0&&(t+=2*Math.PI);let o=Math.abs(t-i);2*Math.PI-o<o&&(t<i?t+=2*Math.PI:i+=2*Math.PI),v.theta=t-i,n.update()},this.getDistance=()=>n.object.position.distanceTo(n.target),this.listenToKeyEvents=e=>{e.addEventListener("keydown",ee),this._domElementKeyEvents=e},this.stopListenToKeyEvents=()=>{this._domElementKeyEvents.removeEventListener("keydown",ee),this._domElementKeyEvents=null},this.saveState=()=>{n.target0.copy(n.target),n.position0.copy(n.object.position),n.zoom0=n.object.zoom},this.reset=()=>{n.target.copy(n.target0),n.object.position.copy(n.position0),n.object.zoom=n.zoom0,n.object.updateProjectionMatrix(),n.dispatchEvent(i),n.update(),l=s.NONE},this.update=(()=>{let t=new r.Vector3,o=new r.Vector3(0,1,0),a=new r.Quaternion().setFromUnitVectors(e.up,o),c=a.clone().invert(),p=new r.Vector3,y=new r.Quaternion,x=2*Math.PI;return function(){let w=n.object.position;a.setFromUnitVectors(e.up,o),c.copy(a).invert(),t.copy(w).sub(n.target),t.applyQuaternion(a),h.setFromVector3(t),n.autoRotate&&l===s.NONE&&U(2*Math.PI/60/60*n.autoRotateSpeed),n.enableDamping?(h.theta+=v.theta*n.dampingFactor,h.phi+=v.phi*n.dampingFactor):(h.theta+=v.theta,h.phi+=v.phi);let E=n.minAzimuthAngle,S=n.maxAzimuthAngle;isFinite(E)&&isFinite(S)&&(E<-Math.PI?E+=x:E>Math.PI&&(E-=x),S<-Math.PI?S+=x:S>Math.PI&&(S-=x),E<=S?h.theta=Math.max(E,Math.min(S,h.theta)):h.theta=h.theta>(E+S)/2?Math.max(E,h.theta):Math.min(S,h.theta)),h.phi=Math.max(n.minPolarAngle,Math.min(n.maxPolarAngle,h.phi)),h.makeSafe(),!0===n.enableDamping?n.target.addScaledVector(b,n.dampingFactor):n.target.add(b),n.zoomToCursor&&_||n.object.isOrthographicCamera?h.radius=H(h.radius):h.radius=H(h.radius*g),t.setFromSpherical(h),t.applyQuaternion(c),w.copy(n.target).add(t),n.object.matrixAutoUpdate||n.object.updateMatrix(),n.object.lookAt(n.target),!0===n.enableDamping?(v.theta*=1-n.dampingFactor,v.phi*=1-n.dampingFactor,b.multiplyScalar(1-n.dampingFactor)):(v.set(0,0,0),b.set(0,0,0));let j=!1;if(n.zoomToCursor&&_){let i=null;if(n.object instanceof r.PerspectiveCamera&&n.object.isPerspectiveCamera){let e=t.length();i=H(e*g);let o=e-i;n.object.position.addScaledVector(L,o),n.object.updateMatrixWorld()}else if(n.object.isOrthographicCamera){let e=new r.Vector3(M.x,M.y,0);e.unproject(n.object),n.object.zoom=Math.max(n.minZoom,Math.min(n.maxZoom,n.object.zoom/g)),n.object.updateProjectionMatrix(),j=!0;let o=new r.Vector3(M.x,M.y,0);o.unproject(n.object),n.object.position.sub(o).add(e),n.object.updateMatrixWorld(),i=t.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),n.zoomToCursor=!1;null!==i&&(n.screenSpacePanning?n.target.set(0,0,-1).transformDirection(n.object.matrix).multiplyScalar(i).add(n.object.position):(d.origin.copy(n.object.position),d.direction.set(0,0,-1).transformDirection(n.object.matrix),Math.abs(n.object.up.dot(d.direction))<f?e.lookAt(n.target):(u.setFromNormalAndCoplanarPoint(n.object.up,n.target),d.intersectPlane(u,n.target))))}else n.object instanceof r.OrthographicCamera&&n.object.isOrthographicCamera&&(j=1!==g)&&(n.object.zoom=Math.max(n.minZoom,Math.min(n.maxZoom,n.object.zoom/g)),n.object.updateProjectionMatrix());return g=1,_=!1,!!(j||p.distanceToSquared(n.object.position)>m||8*(1-y.dot(n.object.quaternion))>m)&&(n.dispatchEvent(i),p.copy(n.object.position),y.copy(n.object.quaternion),j=!1,!0)}})(),this.connect=e=>{n.domElement=e,n.domElement.style.touchAction="none",n.domElement.addEventListener("contextmenu",et),n.domElement.addEventListener("pointerdown",q),n.domElement.addEventListener("pointercancel",$),n.domElement.addEventListener("wheel",J)},this.dispose=()=>{var e,t,i,o,r,a;n.domElement&&(n.domElement.style.touchAction="auto"),null==(e=n.domElement)||e.removeEventListener("contextmenu",et),null==(t=n.domElement)||t.removeEventListener("pointerdown",q),null==(i=n.domElement)||i.removeEventListener("pointercancel",$),null==(o=n.domElement)||o.removeEventListener("wheel",J),null==(r=n.domElement)||r.ownerDocument.removeEventListener("pointermove",Q),null==(a=n.domElement)||a.ownerDocument.removeEventListener("pointerup",$),null!==n._domElementKeyEvents&&n._domElementKeyEvents.removeEventListener("keydown",ee)};const n=this,i={type:"change"},o={type:"start"},a={type:"end"},s={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6};let l=s.NONE;const m=1e-6,h=new r.Spherical,v=new r.Spherical;let g=1;const b=new r.Vector3,y=new r.Vector2,x=new r.Vector2,w=new r.Vector2,E=new r.Vector2,S=new r.Vector2,j=new r.Vector2,P=new r.Vector2,A=new r.Vector2,O=new r.Vector2,L=new r.Vector3,M=new r.Vector2;let _=!1;const T=[],C={};function z(){return Math.pow(.95,n.zoomSpeed)}function U(e){n.reverseOrbit||n.reverseHorizontalOrbit?v.theta+=e:v.theta-=e}function D(e){n.reverseOrbit||n.reverseVerticalOrbit?v.phi+=e:v.phi-=e}const I=(()=>{let e=new r.Vector3;return function(t,n){e.setFromMatrixColumn(n,0),e.multiplyScalar(-t),b.add(e)}})(),R=(()=>{let e=new r.Vector3;return function(t,i){!0===n.screenSpacePanning?e.setFromMatrixColumn(i,1):(e.setFromMatrixColumn(i,0),e.crossVectors(n.object.up,e)),e.multiplyScalar(t),b.add(e)}})(),N=(()=>{let e=new r.Vector3;return function(t,i){let o=n.domElement;if(o&&n.object instanceof r.PerspectiveCamera&&n.object.isPerspectiveCamera){let r=n.object.position;e.copy(r).sub(n.target);let a=e.length();I(2*t*(a*=Math.tan(n.object.fov/2*Math.PI/180))/o.clientHeight,n.object.matrix),R(2*i*a/o.clientHeight,n.object.matrix)}else o&&n.object instanceof r.OrthographicCamera&&n.object.isOrthographicCamera?(I(t*(n.object.right-n.object.left)/n.object.zoom/o.clientWidth,n.object.matrix),R(i*(n.object.top-n.object.bottom)/n.object.zoom/o.clientHeight,n.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),n.enablePan=!1)}})();function V(e){n.object instanceof r.PerspectiveCamera&&n.object.isPerspectiveCamera||n.object instanceof r.OrthographicCamera&&n.object.isOrthographicCamera?g=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),n.enableZoom=!1)}function B(e){if(!n.zoomToCursor||!n.domElement)return;_=!0;let t=n.domElement.getBoundingClientRect(),i=e.clientX-t.left,o=e.clientY-t.top,r=t.width,a=t.height;M.x=i/r*2-1,M.y=-(o/a*2)+1,L.set(M.x,M.y,1).unproject(n.object).sub(n.object.position).normalize()}function H(e){return Math.max(n.minDistance,Math.min(n.maxDistance,e))}function k(e){y.set(e.clientX,e.clientY)}function F(e){E.set(e.clientX,e.clientY)}function G(){if(1==T.length)y.set(T[0].pageX,T[0].pageY);else{let e=.5*(T[0].pageX+T[1].pageX),t=.5*(T[0].pageY+T[1].pageY);y.set(e,t)}}function Y(){if(1==T.length)E.set(T[0].pageX,T[0].pageY);else{let e=.5*(T[0].pageX+T[1].pageX),t=.5*(T[0].pageY+T[1].pageY);E.set(e,t)}}function W(){let e=T[0].pageX-T[1].pageX,t=T[0].pageY-T[1].pageY,n=Math.sqrt(e*e+t*t);P.set(0,n)}function X(e){if(1==T.length)x.set(e.pageX,e.pageY);else{let t=ei(e),n=.5*(e.pageX+t.x),i=.5*(e.pageY+t.y);x.set(n,i)}w.subVectors(x,y).multiplyScalar(n.rotateSpeed);let t=n.domElement;t&&(U(2*Math.PI*w.x/t.clientHeight),D(2*Math.PI*w.y/t.clientHeight)),y.copy(x)}function Z(e){if(1==T.length)S.set(e.pageX,e.pageY);else{let t=ei(e),n=.5*(e.pageX+t.x),i=.5*(e.pageY+t.y);S.set(n,i)}j.subVectors(S,E).multiplyScalar(n.panSpeed),N(j.x,j.y),E.copy(S)}function K(e){var t;let i=ei(e),o=e.pageX-i.x,r=e.pageY-i.y,a=Math.sqrt(o*o+r*r);A.set(0,a),O.set(0,Math.pow(A.y/P.y,n.zoomSpeed)),t=O.y,V(g/t),P.copy(A)}function q(e){var t,i,a;!1!==n.enabled&&(0===T.length&&(null==(t=n.domElement)||t.ownerDocument.addEventListener("pointermove",Q),null==(i=n.domElement)||i.ownerDocument.addEventListener("pointerup",$)),a=e,T.push(a),"touch"===e.pointerType?function(e){switch(en(e),T.length){case 1:switch(n.touches.ONE){case r.TOUCH.ROTATE:if(!1===n.enableRotate)return;G(),l=s.TOUCH_ROTATE;break;case r.TOUCH.PAN:if(!1===n.enablePan)return;Y(),l=s.TOUCH_PAN;break;default:l=s.NONE}break;case 2:switch(n.touches.TWO){case r.TOUCH.DOLLY_PAN:if(!1===n.enableZoom&&!1===n.enablePan)return;n.enableZoom&&W(),n.enablePan&&Y(),l=s.TOUCH_DOLLY_PAN;break;case r.TOUCH.DOLLY_ROTATE:if(!1===n.enableZoom&&!1===n.enableRotate)return;n.enableZoom&&W(),n.enableRotate&&G(),l=s.TOUCH_DOLLY_ROTATE;break;default:l=s.NONE}break;default:l=s.NONE}l!==s.NONE&&n.dispatchEvent(o)}(e):function(e){let t;switch(e.button){case 0:t=n.mouseButtons.LEFT;break;case 1:t=n.mouseButtons.MIDDLE;break;case 2:t=n.mouseButtons.RIGHT;break;default:t=-1}switch(t){case r.MOUSE.DOLLY:if(!1===n.enableZoom)return;B(e),P.set(e.clientX,e.clientY),l=s.DOLLY;break;case r.MOUSE.ROTATE:if(e.ctrlKey||e.metaKey||e.shiftKey){if(!1===n.enablePan)return;F(e),l=s.PAN}else{if(!1===n.enableRotate)return;k(e),l=s.ROTATE}break;case r.MOUSE.PAN:if(e.ctrlKey||e.metaKey||e.shiftKey){if(!1===n.enableRotate)return;k(e),l=s.ROTATE}else{if(!1===n.enablePan)return;F(e),l=s.PAN}break;default:l=s.NONE}l!==s.NONE&&n.dispatchEvent(o)}(e))}function Q(e){!1!==n.enabled&&("touch"===e.pointerType?function(e){switch(en(e),l){case s.TOUCH_ROTATE:if(!1===n.enableRotate)return;X(e),n.update();break;case s.TOUCH_PAN:if(!1===n.enablePan)return;Z(e),n.update();break;case s.TOUCH_DOLLY_PAN:if(!1===n.enableZoom&&!1===n.enablePan)return;n.enableZoom&&K(e),n.enablePan&&Z(e),n.update();break;case s.TOUCH_DOLLY_ROTATE:if(!1===n.enableZoom&&!1===n.enableRotate)return;n.enableZoom&&K(e),n.enableRotate&&X(e),n.update();break;default:l=s.NONE}}(e):function(e){if(!1!==n.enabled)switch(l){case s.ROTATE:let t;if(!1===n.enableRotate)return;x.set(e.clientX,e.clientY),w.subVectors(x,y).multiplyScalar(n.rotateSpeed),(t=n.domElement)&&(U(2*Math.PI*w.x/t.clientHeight),D(2*Math.PI*w.y/t.clientHeight)),y.copy(x),n.update();break;case s.DOLLY:var i,o;if(!1===n.enableZoom)return;(A.set(e.clientX,e.clientY),O.subVectors(A,P),O.y>0)?(i=z(),V(g/i)):O.y<0&&(o=z(),V(g*o)),P.copy(A),n.update();break;case s.PAN:if(!1===n.enablePan)return;S.set(e.clientX,e.clientY),j.subVectors(S,E).multiplyScalar(n.panSpeed),N(j.x,j.y),E.copy(S),n.update()}}(e))}function $(e){var t,i,o;(function(e){delete C[e.pointerId];for(let t=0;t<T.length;t++)if(T[t].pointerId==e.pointerId)return void T.splice(t,1)})(e),0===T.length&&(null==(t=n.domElement)||t.releasePointerCapture(e.pointerId),null==(i=n.domElement)||i.ownerDocument.removeEventListener("pointermove",Q),null==(o=n.domElement)||o.ownerDocument.removeEventListener("pointerup",$)),n.dispatchEvent(a),l=s.NONE}function J(e){if(!1!==n.enabled&&!1!==n.enableZoom&&(l===s.NONE||l===s.ROTATE)){var t,i;e.preventDefault(),n.dispatchEvent(o),(B(e),e.deltaY<0)?(t=z(),V(g*t)):e.deltaY>0&&(i=z(),V(g/i)),n.update(),n.dispatchEvent(a)}}function ee(e){if(!1!==n.enabled&&!1!==n.enablePan){let t=!1;switch(e.code){case n.keys.UP:N(0,n.keyPanSpeed),t=!0;break;case n.keys.BOTTOM:N(0,-n.keyPanSpeed),t=!0;break;case n.keys.LEFT:N(n.keyPanSpeed,0),t=!0;break;case n.keys.RIGHT:N(-n.keyPanSpeed,0),t=!0}t&&(e.preventDefault(),n.update())}}function et(e){!1!==n.enabled&&e.preventDefault()}function en(e){let t=C[e.pointerId];void 0===t&&(t=new r.Vector2,C[e.pointerId]=t),t.set(e.pageX,e.pageY)}function ei(e){return C[(e.pointerId===T[0].pointerId?T[1]:T[0]).pointerId]}this.dollyIn=(e=z())=>{V(g*e),n.update()},this.dollyOut=(e=z())=>{V(g/e),n.update()},this.getScale=()=>g,this.setScale=e=>{V(e),n.update()},this.getZoomScale=()=>z(),void 0!==t&&this.connect(t),this.update()}}let h=o.forwardRef(({makeDefault:e,camera:r,regress:a,domElement:s,enableDamping:l=!0,keyEvents:c=!1,onChange:d,onStart:u,onEnd:f,...p},h)=>{let v=(0,n.useThree)(e=>e.invalidate),g=(0,n.useThree)(e=>e.camera),b=(0,n.useThree)(e=>e.gl),y=(0,n.useThree)(e=>e.events),x=(0,n.useThree)(e=>e.setEvents),w=(0,n.useThree)(e=>e.set),E=(0,n.useThree)(e=>e.get),S=(0,n.useThree)(e=>e.performance),j=r||g,P=s||y.connected||b.domElement,A=o.useMemo(()=>new m(j),[j]);return(0,i.useFrame)(()=>{A.enabled&&A.update()},-1),o.useEffect(()=>(c&&A.connect(!0===c?P:c),A.connect(P),()=>void A.dispose()),[c,P,a,A,v]),o.useEffect(()=>{let e=e=>{v(),a&&S.regress(),d&&d(e)},t=e=>{u&&u(e)},n=e=>{f&&f(e)};return A.addEventListener("change",e),A.addEventListener("start",t),A.addEventListener("end",n),()=>{A.removeEventListener("start",t),A.removeEventListener("end",n),A.removeEventListener("change",e)}},[d,u,f,A,v,x]),o.useEffect(()=>{if(e){let e=E().controls;return w({controls:A}),()=>w({controls:e})}},[e,A]),o.createElement("primitive",(0,t.default)({ref:h,object:A,enableDamping:l},p))});e.s(["OrbitControls",0,h],55044)},21596,e=>{"use strict";var t,n,i,o,r=e.i(88227),a=e.i(55044),s=e.i(33839),l=e.i(48845),c=e.i(83879),d=e.i(83475),u=e.i(61070),f=c,p=e.i(16598);let m=(t={cellSize:.5,sectionSize:1,fadeDistance:100,fadeStrength:1,fadeFrom:1,cellThickness:.5,sectionThickness:1,cellColor:new c.Color,sectionColor:new c.Color,infiniteGrid:!1,followCamera:!1,worldCamProjPosition:new c.Vector3,worldPlanePosition:new c.Vector3},n=`
    varying vec3 localPosition;
    varying vec4 worldPosition;

    uniform vec3 worldCamProjPosition;
    uniform vec3 worldPlanePosition;
    uniform float fadeDistance;
    uniform bool infiniteGrid;
    uniform bool followCamera;

    void main() {
      localPosition = position.xzy;
      if (infiniteGrid) localPosition *= 1.0 + fadeDistance;
      
      worldPosition = modelMatrix * vec4(localPosition, 1.0);
      if (followCamera) {
        worldPosition.xyz += (worldCamProjPosition - worldPlanePosition);
        localPosition = (inverse(modelMatrix) * worldPosition).xyz;
      }

      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,i=`
    varying vec3 localPosition;
    varying vec4 worldPosition;

    uniform vec3 worldCamProjPosition;
    uniform float cellSize;
    uniform float sectionSize;
    uniform vec3 cellColor;
    uniform vec3 sectionColor;
    uniform float fadeDistance;
    uniform float fadeStrength;
    uniform float fadeFrom;
    uniform float cellThickness;
    uniform float sectionThickness;

    float getGrid(float size, float thickness) {
      vec2 r = localPosition.xz / size;
      vec2 grid = abs(fract(r - 0.5) - 0.5) / fwidth(r);
      float line = min(grid.x, grid.y) + 1.0 - thickness;
      return 1.0 - min(line, 1.0);
    }

    void main() {
      float g1 = getGrid(cellSize, cellThickness);
      float g2 = getGrid(sectionSize, sectionThickness);

      vec3 from = worldCamProjPosition*vec3(fadeFrom);
      float dist = distance(from, worldPosition.xyz);
      float d = 1.0 - min(dist / fadeDistance, 1.0);
      vec3 color = mix(cellColor, sectionColor, min(1.0, sectionThickness * g2));

      gl_FragColor = vec4(color, (g1 + g2) * pow(d, fadeStrength));
      gl_FragColor.a = mix(0.75 * gl_FragColor.a, gl_FragColor.a, g2);
      if (gl_FragColor.a <= 0.0) discard;

      #include <tonemapping_fragment>
      #include <${p.version>=154?"colorspace_fragment":"encodings_fragment"}>
    }
  `,(o=class extends f.ShaderMaterial{constructor(e){for(const o in super({vertexShader:n,fragmentShader:i,...e}),t)this.uniforms[o]=new f.Uniform(t[o]),Object.defineProperty(this,o,{get(){return this.uniforms[o].value},set(e){this.uniforms[o].value=e}});this.uniforms=f.UniformsUtils.clone(this.uniforms)}}).key=f.MathUtils.generateUUID(),o),h=l.forwardRef(({args:e,cellColor:t="#000000",sectionColor:n="#2080ff",cellSize:i=.5,sectionSize:o=1,followCamera:r=!1,infiniteGrid:a=!1,fadeDistance:f=100,fadeStrength:p=1,fadeFrom:h=1,cellThickness:v=.5,sectionThickness:g=1,side:b=c.BackSide,...y},x)=>{(0,d.extend)({GridMaterial:m});let w=l.useRef(null);l.useImperativeHandle(x,()=>w.current,[]);let E=new c.Plane,S=new c.Vector3(0,1,0),j=new c.Vector3(0,0,0);return(0,u.useFrame)(e=>{E.setFromNormalAndCoplanarPoint(S,j).applyMatrix4(w.current.matrixWorld);let t=w.current.material,n=t.uniforms.worldCamProjPosition,i=t.uniforms.worldPlanePosition;E.projectPoint(e.camera.position,n.value),i.value.set(0,0,0).applyMatrix4(w.current.matrixWorld)}),l.createElement("mesh",(0,s.default)({ref:w,frustumCulled:!1},y),l.createElement("gridMaterial",(0,s.default)({transparent:!0,"extensions-derivatives":!0,side:b},{cellSize:i,sectionSize:o,cellColor:t,sectionColor:n,cellThickness:v,sectionThickness:g},{fadeDistance:f,fadeStrength:p,fadeFrom:h,infiniteGrid:a,followCamera:r})),l.createElement("planeGeometry",{args:e}))});var v=e.i(25733);function g(){return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsxs)("mesh",{position:[0,3.5,-16],children:[(0,r.jsx)("boxGeometry",{args:[32,3.5,.2]}),(0,r.jsx)("meshStandardMaterial",{color:"#64748b",wireframe:!0,transparent:!0,opacity:.25})]}),(0,r.jsxs)("mesh",{position:[0,3.5,16],children:[(0,r.jsx)("boxGeometry",{args:[32,3.5,.2]}),(0,r.jsx)("meshStandardMaterial",{color:"#64748b",wireframe:!0,transparent:!0,opacity:.25})]}),(0,r.jsxs)("mesh",{position:[-16,3.5,0],children:[(0,r.jsx)("boxGeometry",{args:[.2,3.5,32]}),(0,r.jsx)("meshStandardMaterial",{color:"#64748b",wireframe:!0,transparent:!0,opacity:.25})]}),(0,r.jsxs)("mesh",{position:[16,3.5,0],children:[(0,r.jsx)("boxGeometry",{args:[.2,3.5,32]}),(0,r.jsx)("meshStandardMaterial",{color:"#64748b",wireframe:!0,transparent:!0,opacity:.25})]})]})}function b({position:e,color:t}){let n=[0,1.5,3].map((n,i)=>(0,r.jsxs)("mesh",{position:[e[0]+n,.5,e[2]],children:[(0,r.jsx)("boxGeometry",{args:[1.2,1,.8]}),(0,r.jsx)("meshStandardMaterial",{color:t,roughness:.7,metalness:.3,transparent:!0,opacity:.6})]},i));return(0,r.jsx)("group",{children:n})}function y({from:e,to:t}){let n=(e[0]+t[0])/2,i=(e[2]+t[2])/2,o=Math.sqrt(Math.pow(t[0]-e[0],2)+Math.pow(t[2]-e[2],2));return(0,r.jsxs)("mesh",{position:[n,2.8,i],rotation:[0,Math.atan2(t[0]-e[0],t[2]-e[2]),0],children:[(0,r.jsx)("boxGeometry",{args:[.3,.3,o]}),(0,r.jsx)("meshStandardMaterial",{color:"#94a3b8",roughness:.8,metalness:.5,transparent:!0,opacity:.5})]})}function x({from:e,to:t}){return(0,r.jsx)(v.Line,{points:[e,t],color:"#38bdf8",lineWidth:1,dashed:!0,dashSize:.5,gapSize:.3,transparent:!0,opacity:.45})}function w({position:e,color:t,pulse:n=!1}){let i=(0,l.useRef)(null);return(0,u.useFrame)(e=>{if(i.current&&n){let t=1+.2*Math.sin(2*e.clock.elapsedTime);i.current.scale.setScalar(t)}}),(0,r.jsxs)("group",{position:e,children:[(0,r.jsxs)("mesh",{position:[0,1.5,0],children:[(0,r.jsx)("cylinderGeometry",{args:[.05,.05,3,8]}),(0,r.jsx)("meshStandardMaterial",{color:"#64748b"})]}),(0,r.jsxs)("mesh",{ref:i,position:[0,3.2,0],children:[(0,r.jsx)("sphereGeometry",{args:[.15,16,16]}),(0,r.jsx)("meshStandardMaterial",{color:t,emissive:t,emissiveIntensity:n?.8:.3})]})]})}function E({position:e,color:t,intensity:n=.8}){return(0,r.jsx)("pointLight",{position:e,intensity:n,color:t})}let S=[[-16,.08,-16],[16,.08,-16],[16,.08,16],[-16,.08,16],[-16,.08,-16]];e.s(["FactoryScene",0,function(){return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)("ambientLight",{intensity:.35,color:"#1a2744"}),(0,r.jsx)("directionalLight",{position:[15,25,10],intensity:.9,color:"#e8edf5"}),(0,r.jsx)("directionalLight",{position:[-10,12,-8],intensity:.3,color:"#4a90d9"}),(0,r.jsx)(a.OrbitControls,{enableRotate:!0,enableZoom:!0,enablePan:!0,target:[0,.3,0],minDistance:10,maxDistance:56,maxPolarAngle:Math.PI/2.15}),(0,r.jsx)(h,{position:[0,0,0],args:[42,42],cellSize:1,cellThickness:.55,cellColor:"#1E3A5F",sectionSize:6,sectionThickness:1.3,sectionColor:"#22D3EE",fadeDistance:45,fadeStrength:1.7,infiniteGrid:!1}),(0,r.jsx)(v.Line,{points:S,color:"#38bdf8",lineWidth:1.8,transparent:!0,opacity:.58}),(0,r.jsx)(g,{}),(0,r.jsx)(b,{position:[-6.5,.12,-6.5],color:"#3b82f6"}),(0,r.jsx)(b,{position:[6.5,.12,-6.5],color:"#10b981"}),(0,r.jsx)(b,{position:[-6.5,.12,6.5],color:"#f59e0b"}),(0,r.jsx)(b,{position:[6.5,.12,6.5],color:"#ef4444"}),(0,r.jsx)(y,{from:[-6.5,2.8,-6.5],to:[6.5,2.8,6.5]}),(0,r.jsx)(y,{from:[-6.5,2.8,6.5],to:[6.5,2.8,-6.5]}),(0,r.jsx)(x,{from:[-6.5,2,-6.5],to:[0,2,0]}),(0,r.jsx)(x,{from:[6.5,2,-6.5],to:[0,2,0]}),(0,r.jsx)(x,{from:[-6.5,2,6.5],to:[0,2,0]}),(0,r.jsx)(x,{from:[6.5,2,6.5],to:[0,2,0]}),(0,r.jsx)(E,{position:[-6.5,4,-6.5],color:"#3b82f6"}),(0,r.jsx)(E,{position:[6.5,4,-6.5],color:"#10b981"}),(0,r.jsx)(E,{position:[-6.5,4,6.5],color:"#f59e0b"}),(0,r.jsx)(E,{position:[6.5,4,6.5],color:"#ef4444"}),(0,r.jsx)(w,{position:[-3,0,-3],color:"#3b82f6",pulse:!0}),(0,r.jsxs)("mesh",{position:[0,1.1,0],children:[(0,r.jsx)("boxGeometry",{args:[4.8,2.2,4.8]}),(0,r.jsx)("meshStandardMaterial",{color:"#94a3b8",wireframe:!0,transparent:!0,opacity:.72})]}),(0,r.jsxs)("mesh",{position:[0,.16,0],rotation:[-Math.PI/2,0,0],children:[(0,r.jsx)("ringGeometry",{args:[3.2,3.35,64]}),(0,r.jsx)("meshBasicMaterial",{color:"#22d3ee",transparent:!0,opacity:.42})]})]})}],21596)},55333,e=>{e.n(e.i(21596))}]);