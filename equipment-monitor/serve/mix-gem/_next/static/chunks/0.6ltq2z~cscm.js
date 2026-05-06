(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,61070,e=>{"use strict";var t=e.i(73973);e.s(["useFrame",()=>t.D])},33839,e=>{"use strict";function t(){return(t=Object.assign.bind()).apply(null,arguments)}e.s(["default",()=>t])},33902,e=>{"use strict";var t=e.i(73973);e.s(["useThree",()=>t.C])},83475,16598,e=>{"use strict";var t=e.i(73973);e.s(["extend",()=>t.e],83475);let r=parseInt(e.i(83879).REVISION.replace(/\D+/g,""));e.s(["version",0,r],16598)},32453,e=>{"use strict";var t=e.i(88227),r=e.i(48845),i=e.i(61070),o=e.i(23458),a=e.i(33839),n=e.i(83879);let s=r.forwardRef(function({children:e,follow:t=!0,lockX:o=!1,lockY:s=!1,lockZ:l=!1,...u},c){let f=r.useRef(null),m=r.useRef(null),p=new n.Quaternion;return(0,i.useFrame)(({camera:e})=>{if(!t||!m.current)return;let r=f.current.rotation.clone();m.current.updateMatrix(),m.current.updateWorldMatrix(!1,!1),m.current.getWorldQuaternion(p),e.getWorldQuaternion(f.current.quaternion).premultiply(p.invert()),o&&(f.current.rotation.x=r.x),s&&(f.current.rotation.y=r.y),l&&(f.current.rotation.z=r.z)}),r.useImperativeHandle(c,()=>m.current,[]),r.createElement("group",(0,a.default)({ref:m},u),r.createElement("group",{ref:f},e))});var l=n,u=e.i(83475),c=e.i(33902),f=e.i(16598);class m extends l.ShaderMaterial{constructor(){super({uniforms:{time:{value:0},pixelRatio:{value:1}},vertexShader:`
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
      `})}get time(){return this.uniforms.time.value}set time(e){this.uniforms.time.value=e}get pixelRatio(){return this.uniforms.pixelRatio.value}set pixelRatio(e){this.uniforms.pixelRatio.value=e}}let p=e=>e&&e.constructor===Float32Array,d=e=>e instanceof l.Vector2||e instanceof l.Vector3||e instanceof l.Vector4,v=e=>Array.isArray(e)?e:d(e)?e.toArray():[e,e,e];function g(e,t,i){return r.useMemo(()=>{if(void 0!==t)if(p(t))return t;else{if(t instanceof l.Color){let r=Array.from({length:3*e},()=>[t.r,t.g,t.b]).flat();return Float32Array.from(r)}if(d(t)||Array.isArray(t)){let r=Array.from({length:3*e},()=>v(t)).flat();return Float32Array.from(r)}return Float32Array.from({length:e},()=>t)}return Float32Array.from({length:e},i)},[t])}let y=r.forwardRef(({noise:e=1,count:t=100,speed:o=1,opacity:n=1,scale:s=1,size:f,color:d,children:y,...b},h)=>{r.useMemo(()=>(0,u.extend)({SparklesImplMaterial:m}),[]);let x=r.useRef(null),A=(0,c.useThree)(e=>e.viewport.dpr),P=v(s),R=r.useMemo(()=>Float32Array.from(Array.from({length:t},()=>P.map(l.MathUtils.randFloatSpread)).flat()),[t,...P]),C=g(t,f,Math.random),E=g(t,n),S=g(t,o),w=g(3*t,e),M=g(void 0===d?3*t:t,p(d)?d:new l.Color(d),()=>1);return(0,i.useFrame)(e=>{x.current&&x.current.material&&(x.current.material.time=e.clock.elapsedTime)}),r.useImperativeHandle(h,()=>x.current,[]),r.createElement("points",(0,a.default)({key:`particle-${t}-${JSON.stringify(s)}`},b,{ref:x}),r.createElement("bufferGeometry",null,r.createElement("bufferAttribute",{attach:"attributes-position",args:[R,3]}),r.createElement("bufferAttribute",{attach:"attributes-size",args:[C,1]}),r.createElement("bufferAttribute",{attach:"attributes-opacity",args:[E,1]}),r.createElement("bufferAttribute",{attach:"attributes-speed",args:[S,1]}),r.createElement("bufferAttribute",{attach:"attributes-color",args:[M,3]}),r.createElement("bufferAttribute",{attach:"attributes-noise",args:[w,3]})),y||r.createElement("sparklesImplMaterial",{transparent:!0,pixelRatio:A,depthWrite:!1}))}),b={power:"POWER MONITORING","building-auto":"BUILDING AUTO",gas:"GAS DETECTION",fire:"FIRE ALARM"};function h(e,t){let[i,o]=(0,r.useState)(t);return(0,r.useEffect)(()=>{o(getComputedStyle(document.documentElement).getPropertyValue(e).trim()||t)},[e,t]),i}e.s(["SubsystemZone",0,function({zoneType:e,position:a,onClick:l,hasAlert:u=!1}){let c=(0,r.useRef)(null),[f,m]=(0,r.useState)(!1),p=h("power"===e?"--sf-power-primary":"building-auto"===e?"--sf-ba-primary":"gas"===e?"--sf-gas-primary":"--sf-fire-primary","power"===e?"#3b82f6":"building-auto"===e?"#10b981":"gas"===e?"#f59e0b":"#ef4444"),d=h("--sf-text-primary","#e2e8f0"),v=h("--sf-bg-base","#0B0F19"),g=b[e];return(0,i.useFrame)(e=>{if(c.current)if(u){let t=.5*Math.sin(3*e.clock.elapsedTime)+.5,r=new n.Color(p);c.current.emissive=r.multiplyScalar(.15+.65*t)}else f?(c.current.emissive=new n.Color(p),c.current.emissiveIntensity=.3):(c.current.emissive=new n.Color(0),c.current.emissiveIntensity=0)}),(0,t.jsxs)("group",{children:[(0,t.jsxs)("mesh",{position:a,onClick:l,onPointerOver:()=>m(!0),onPointerOut:()=>m(!1),children:[(0,t.jsx)("boxGeometry",{args:[12,.1,12]}),(0,t.jsx)("meshStandardMaterial",{ref:c,color:p,transparent:!0,opacity:.25})]}),(0,t.jsx)(s,{position:[a[0],a[1]+2,a[2]],children:(0,t.jsx)(o.Text,{fontSize:.8,color:d,anchorX:"center",anchorY:"middle",outlineWidth:.05,outlineColor:v,children:g})}),u&&(0,t.jsx)(y,{position:[a[0],a[1]+1.5,a[2]],count:30,scale:12,size:2,speed:.3,color:p})]})}],32453)},75292,e=>{e.n(e.i(32453))}]);