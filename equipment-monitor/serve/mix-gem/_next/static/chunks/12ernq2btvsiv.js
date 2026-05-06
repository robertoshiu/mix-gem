(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,33839,e=>{"use strict";function t(){return(t=Object.assign.bind()).apply(null,arguments)}e.s(["default",()=>t])},33902,e=>{"use strict";var t=e.i(73973);e.s(["useThree",()=>t.C])},61070,e=>{"use strict";var t=e.i(73973);e.s(["useFrame",()=>t.D])},83475,16598,e=>{"use strict";var t=e.i(73973);e.s(["extend",()=>t.e],83475);let n=parseInt(e.i(83879).REVISION.replace(/\D+/g,""));e.s(["version",0,n],16598)},55044,e=>{"use strict";var t=e.i(33839),n=e.i(33902),i=e.i(61070),o=e.i(48845),r=e.i(83879),a=Object.defineProperty;class s{constructor(){((e,t,n)=>{let i;return(i="symbol"!=typeof t?t+"":t)in e?a(e,i,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[i]=n})(this,"_listeners")}addEventListener(e,t){void 0===this._listeners&&(this._listeners={});let n=this._listeners;void 0===n[e]&&(n[e]=[]),-1===n[e].indexOf(t)&&n[e].push(t)}hasEventListener(e,t){if(void 0===this._listeners)return!1;let n=this._listeners;return void 0!==n[e]&&-1!==n[e].indexOf(t)}removeEventListener(e,t){if(void 0===this._listeners)return;let n=this._listeners[e];if(void 0!==n){let e=n.indexOf(t);-1!==e&&n.splice(e,1)}}dispatchEvent(e){if(void 0===this._listeners)return;let t=this._listeners[e.type];if(void 0!==t){e.target=this;let n=t.slice(0);for(let t=0,i=n.length;t<i;t++)n[t].call(this,e);e.target=null}}}var l=Object.defineProperty,c=(e,t,n)=>{let i;return(i="symbol"!=typeof t?t+"":t)in e?l(e,i,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[i]=n,n};let d=new r.Ray,u=new r.Plane,f=Math.cos(Math.PI/180*70),p=(e,t)=>(e%t+t)%t;class m extends s{constructor(e,t){super(),c(this,"object"),c(this,"domElement"),c(this,"enabled",!0),c(this,"target",new r.Vector3),c(this,"minDistance",0),c(this,"maxDistance",1/0),c(this,"minZoom",0),c(this,"maxZoom",1/0),c(this,"minPolarAngle",0),c(this,"maxPolarAngle",Math.PI),c(this,"minAzimuthAngle",-1/0),c(this,"maxAzimuthAngle",1/0),c(this,"enableDamping",!1),c(this,"dampingFactor",.05),c(this,"enableZoom",!0),c(this,"zoomSpeed",1),c(this,"enableRotate",!0),c(this,"rotateSpeed",1),c(this,"enablePan",!0),c(this,"panSpeed",1),c(this,"screenSpacePanning",!0),c(this,"keyPanSpeed",7),c(this,"zoomToCursor",!1),c(this,"autoRotate",!1),c(this,"autoRotateSpeed",2),c(this,"reverseOrbit",!1),c(this,"reverseHorizontalOrbit",!1),c(this,"reverseVerticalOrbit",!1),c(this,"keys",{LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"}),c(this,"mouseButtons",{LEFT:r.MOUSE.ROTATE,MIDDLE:r.MOUSE.DOLLY,RIGHT:r.MOUSE.PAN}),c(this,"touches",{ONE:r.TOUCH.ROTATE,TWO:r.TOUCH.DOLLY_PAN}),c(this,"target0"),c(this,"position0"),c(this,"zoom0"),c(this,"_domElementKeyEvents",null),c(this,"getPolarAngle"),c(this,"getAzimuthalAngle"),c(this,"setPolarAngle"),c(this,"setAzimuthalAngle"),c(this,"getDistance"),c(this,"getZoomScale"),c(this,"listenToKeyEvents"),c(this,"stopListenToKeyEvents"),c(this,"saveState"),c(this,"reset"),c(this,"update"),c(this,"connect"),c(this,"dispose"),c(this,"dollyIn"),c(this,"dollyOut"),c(this,"getScale"),c(this,"setScale"),this.object=e,this.domElement=t,this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this.getPolarAngle=()=>h.phi,this.getAzimuthalAngle=()=>h.theta,this.setPolarAngle=e=>{let t=p(e,2*Math.PI),i=h.phi;i<0&&(i+=2*Math.PI),t<0&&(t+=2*Math.PI);let o=Math.abs(t-i);2*Math.PI-o<o&&(t<i?t+=2*Math.PI:i+=2*Math.PI),v.phi=t-i,n.update()},this.setAzimuthalAngle=e=>{let t=p(e,2*Math.PI),i=h.theta;i<0&&(i+=2*Math.PI),t<0&&(t+=2*Math.PI);let o=Math.abs(t-i);2*Math.PI-o<o&&(t<i?t+=2*Math.PI:i+=2*Math.PI),v.theta=t-i,n.update()},this.getDistance=()=>n.object.position.distanceTo(n.target),this.listenToKeyEvents=e=>{e.addEventListener("keydown",ee),this._domElementKeyEvents=e},this.stopListenToKeyEvents=()=>{this._domElementKeyEvents.removeEventListener("keydown",ee),this._domElementKeyEvents=null},this.saveState=()=>{n.target0.copy(n.target),n.position0.copy(n.object.position),n.zoom0=n.object.zoom},this.reset=()=>{n.target.copy(n.target0),n.object.position.copy(n.position0),n.object.zoom=n.zoom0,n.object.updateProjectionMatrix(),n.dispatchEvent(i),n.update(),l=s.NONE},this.update=(()=>{let t=new r.Vector3,o=new r.Vector3(0,1,0),a=new r.Quaternion().setFromUnitVectors(e.up,o),c=a.clone().invert(),p=new r.Vector3,y=new r.Quaternion,w=2*Math.PI;return function(){let E=n.object.position;a.setFromUnitVectors(e.up,o),c.copy(a).invert(),t.copy(E).sub(n.target),t.applyQuaternion(a),h.setFromVector3(t),n.autoRotate&&l===s.NONE&&U(2*Math.PI/60/60*n.autoRotateSpeed),n.enableDamping?(h.theta+=v.theta*n.dampingFactor,h.phi+=v.phi*n.dampingFactor):(h.theta+=v.theta,h.phi+=v.phi);let S=n.minAzimuthAngle,x=n.maxAzimuthAngle;isFinite(S)&&isFinite(x)&&(S<-Math.PI?S+=w:S>Math.PI&&(S-=w),x<-Math.PI?x+=w:x>Math.PI&&(x-=w),S<=x?h.theta=Math.max(S,Math.min(x,h.theta)):h.theta=h.theta>(S+x)/2?Math.max(S,h.theta):Math.min(x,h.theta)),h.phi=Math.max(n.minPolarAngle,Math.min(n.maxPolarAngle,h.phi)),h.makeSafe(),!0===n.enableDamping?n.target.addScaledVector(b,n.dampingFactor):n.target.add(b),n.zoomToCursor&&M||n.object.isOrthographicCamera?h.radius=H(h.radius):h.radius=H(h.radius*g),t.setFromSpherical(h),t.applyQuaternion(c),E.copy(n.target).add(t),n.object.matrixAutoUpdate||n.object.updateMatrix(),n.object.lookAt(n.target),!0===n.enableDamping?(v.theta*=1-n.dampingFactor,v.phi*=1-n.dampingFactor,b.multiplyScalar(1-n.dampingFactor)):(v.set(0,0,0),b.set(0,0,0));let P=!1;if(n.zoomToCursor&&M){let i=null;if(n.object instanceof r.PerspectiveCamera&&n.object.isPerspectiveCamera){let e=t.length();i=H(e*g);let o=e-i;n.object.position.addScaledVector(_,o),n.object.updateMatrixWorld()}else if(n.object.isOrthographicCamera){let e=new r.Vector3(T.x,T.y,0);e.unproject(n.object),n.object.zoom=Math.max(n.minZoom,Math.min(n.maxZoom,n.object.zoom/g)),n.object.updateProjectionMatrix(),P=!0;let o=new r.Vector3(T.x,T.y,0);o.unproject(n.object),n.object.position.sub(o).add(e),n.object.updateMatrixWorld(),i=t.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),n.zoomToCursor=!1;null!==i&&(n.screenSpacePanning?n.target.set(0,0,-1).transformDirection(n.object.matrix).multiplyScalar(i).add(n.object.position):(d.origin.copy(n.object.position),d.direction.set(0,0,-1).transformDirection(n.object.matrix),Math.abs(n.object.up.dot(d.direction))<f?e.lookAt(n.target):(u.setFromNormalAndCoplanarPoint(n.object.up,n.target),d.intersectPlane(u,n.target))))}else n.object instanceof r.OrthographicCamera&&n.object.isOrthographicCamera&&(P=1!==g)&&(n.object.zoom=Math.max(n.minZoom,Math.min(n.maxZoom,n.object.zoom/g)),n.object.updateProjectionMatrix());return g=1,M=!1,!!(P||p.distanceToSquared(n.object.position)>m||8*(1-y.dot(n.object.quaternion))>m)&&(n.dispatchEvent(i),p.copy(n.object.position),y.copy(n.object.quaternion),P=!1,!0)}})(),this.connect=e=>{n.domElement=e,n.domElement.style.touchAction="none",n.domElement.addEventListener("contextmenu",et),n.domElement.addEventListener("pointerdown",q),n.domElement.addEventListener("pointercancel",$),n.domElement.addEventListener("wheel",J)},this.dispose=()=>{var e,t,i,o,r,a;n.domElement&&(n.domElement.style.touchAction="auto"),null==(e=n.domElement)||e.removeEventListener("contextmenu",et),null==(t=n.domElement)||t.removeEventListener("pointerdown",q),null==(i=n.domElement)||i.removeEventListener("pointercancel",$),null==(o=n.domElement)||o.removeEventListener("wheel",J),null==(r=n.domElement)||r.ownerDocument.removeEventListener("pointermove",Q),null==(a=n.domElement)||a.ownerDocument.removeEventListener("pointerup",$),null!==n._domElementKeyEvents&&n._domElementKeyEvents.removeEventListener("keydown",ee)};const n=this,i={type:"change"},o={type:"start"},a={type:"end"},s={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6};let l=s.NONE;const m=1e-6,h=new r.Spherical,v=new r.Spherical;let g=1;const b=new r.Vector3,y=new r.Vector2,w=new r.Vector2,E=new r.Vector2,S=new r.Vector2,x=new r.Vector2,P=new r.Vector2,A=new r.Vector2,O=new r.Vector2,L=new r.Vector2,_=new r.Vector3,T=new r.Vector2;let M=!1;const j=[],C={};function z(){return Math.pow(.95,n.zoomSpeed)}function U(e){n.reverseOrbit||n.reverseHorizontalOrbit?v.theta+=e:v.theta-=e}function D(e){n.reverseOrbit||n.reverseVerticalOrbit?v.phi+=e:v.phi-=e}const I=(()=>{let e=new r.Vector3;return function(t,n){e.setFromMatrixColumn(n,0),e.multiplyScalar(-t),b.add(e)}})(),R=(()=>{let e=new r.Vector3;return function(t,i){!0===n.screenSpacePanning?e.setFromMatrixColumn(i,1):(e.setFromMatrixColumn(i,0),e.crossVectors(n.object.up,e)),e.multiplyScalar(t),b.add(e)}})(),N=(()=>{let e=new r.Vector3;return function(t,i){let o=n.domElement;if(o&&n.object instanceof r.PerspectiveCamera&&n.object.isPerspectiveCamera){let r=n.object.position;e.copy(r).sub(n.target);let a=e.length();I(2*t*(a*=Math.tan(n.object.fov/2*Math.PI/180))/o.clientHeight,n.object.matrix),R(2*i*a/o.clientHeight,n.object.matrix)}else o&&n.object instanceof r.OrthographicCamera&&n.object.isOrthographicCamera?(I(t*(n.object.right-n.object.left)/n.object.zoom/o.clientWidth,n.object.matrix),R(i*(n.object.top-n.object.bottom)/n.object.zoom/o.clientHeight,n.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),n.enablePan=!1)}})();function V(e){n.object instanceof r.PerspectiveCamera&&n.object.isPerspectiveCamera||n.object instanceof r.OrthographicCamera&&n.object.isOrthographicCamera?g=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),n.enableZoom=!1)}function B(e){if(!n.zoomToCursor||!n.domElement)return;M=!0;let t=n.domElement.getBoundingClientRect(),i=e.clientX-t.left,o=e.clientY-t.top,r=t.width,a=t.height;T.x=i/r*2-1,T.y=-(o/a*2)+1,_.set(T.x,T.y,1).unproject(n.object).sub(n.object.position).normalize()}function H(e){return Math.max(n.minDistance,Math.min(n.maxDistance,e))}function k(e){y.set(e.clientX,e.clientY)}function F(e){S.set(e.clientX,e.clientY)}function Y(){if(1==j.length)y.set(j[0].pageX,j[0].pageY);else{let e=.5*(j[0].pageX+j[1].pageX),t=.5*(j[0].pageY+j[1].pageY);y.set(e,t)}}function G(){if(1==j.length)S.set(j[0].pageX,j[0].pageY);else{let e=.5*(j[0].pageX+j[1].pageX),t=.5*(j[0].pageY+j[1].pageY);S.set(e,t)}}function W(){let e=j[0].pageX-j[1].pageX,t=j[0].pageY-j[1].pageY,n=Math.sqrt(e*e+t*t);A.set(0,n)}function X(e){if(1==j.length)w.set(e.pageX,e.pageY);else{let t=ei(e),n=.5*(e.pageX+t.x),i=.5*(e.pageY+t.y);w.set(n,i)}E.subVectors(w,y).multiplyScalar(n.rotateSpeed);let t=n.domElement;t&&(U(2*Math.PI*E.x/t.clientHeight),D(2*Math.PI*E.y/t.clientHeight)),y.copy(w)}function Z(e){if(1==j.length)x.set(e.pageX,e.pageY);else{let t=ei(e),n=.5*(e.pageX+t.x),i=.5*(e.pageY+t.y);x.set(n,i)}P.subVectors(x,S).multiplyScalar(n.panSpeed),N(P.x,P.y),S.copy(x)}function K(e){var t;let i=ei(e),o=e.pageX-i.x,r=e.pageY-i.y,a=Math.sqrt(o*o+r*r);O.set(0,a),L.set(0,Math.pow(O.y/A.y,n.zoomSpeed)),t=L.y,V(g/t),A.copy(O)}function q(e){var t,i,a;!1!==n.enabled&&(0===j.length&&(null==(t=n.domElement)||t.ownerDocument.addEventListener("pointermove",Q),null==(i=n.domElement)||i.ownerDocument.addEventListener("pointerup",$)),a=e,j.push(a),"touch"===e.pointerType?function(e){switch(en(e),j.length){case 1:switch(n.touches.ONE){case r.TOUCH.ROTATE:if(!1===n.enableRotate)return;Y(),l=s.TOUCH_ROTATE;break;case r.TOUCH.PAN:if(!1===n.enablePan)return;G(),l=s.TOUCH_PAN;break;default:l=s.NONE}break;case 2:switch(n.touches.TWO){case r.TOUCH.DOLLY_PAN:if(!1===n.enableZoom&&!1===n.enablePan)return;n.enableZoom&&W(),n.enablePan&&G(),l=s.TOUCH_DOLLY_PAN;break;case r.TOUCH.DOLLY_ROTATE:if(!1===n.enableZoom&&!1===n.enableRotate)return;n.enableZoom&&W(),n.enableRotate&&Y(),l=s.TOUCH_DOLLY_ROTATE;break;default:l=s.NONE}break;default:l=s.NONE}l!==s.NONE&&n.dispatchEvent(o)}(e):function(e){let t;switch(e.button){case 0:t=n.mouseButtons.LEFT;break;case 1:t=n.mouseButtons.MIDDLE;break;case 2:t=n.mouseButtons.RIGHT;break;default:t=-1}switch(t){case r.MOUSE.DOLLY:if(!1===n.enableZoom)return;B(e),A.set(e.clientX,e.clientY),l=s.DOLLY;break;case r.MOUSE.ROTATE:if(e.ctrlKey||e.metaKey||e.shiftKey){if(!1===n.enablePan)return;F(e),l=s.PAN}else{if(!1===n.enableRotate)return;k(e),l=s.ROTATE}break;case r.MOUSE.PAN:if(e.ctrlKey||e.metaKey||e.shiftKey){if(!1===n.enableRotate)return;k(e),l=s.ROTATE}else{if(!1===n.enablePan)return;F(e),l=s.PAN}break;default:l=s.NONE}l!==s.NONE&&n.dispatchEvent(o)}(e))}function Q(e){!1!==n.enabled&&("touch"===e.pointerType?function(e){switch(en(e),l){case s.TOUCH_ROTATE:if(!1===n.enableRotate)return;X(e),n.update();break;case s.TOUCH_PAN:if(!1===n.enablePan)return;Z(e),n.update();break;case s.TOUCH_DOLLY_PAN:if(!1===n.enableZoom&&!1===n.enablePan)return;n.enableZoom&&K(e),n.enablePan&&Z(e),n.update();break;case s.TOUCH_DOLLY_ROTATE:if(!1===n.enableZoom&&!1===n.enableRotate)return;n.enableZoom&&K(e),n.enableRotate&&X(e),n.update();break;default:l=s.NONE}}(e):function(e){if(!1!==n.enabled)switch(l){case s.ROTATE:let t;if(!1===n.enableRotate)return;w.set(e.clientX,e.clientY),E.subVectors(w,y).multiplyScalar(n.rotateSpeed),(t=n.domElement)&&(U(2*Math.PI*E.x/t.clientHeight),D(2*Math.PI*E.y/t.clientHeight)),y.copy(w),n.update();break;case s.DOLLY:var i,o;if(!1===n.enableZoom)return;(O.set(e.clientX,e.clientY),L.subVectors(O,A),L.y>0)?(i=z(),V(g/i)):L.y<0&&(o=z(),V(g*o)),A.copy(O),n.update();break;case s.PAN:if(!1===n.enablePan)return;x.set(e.clientX,e.clientY),P.subVectors(x,S).multiplyScalar(n.panSpeed),N(P.x,P.y),S.copy(x),n.update()}}(e))}function $(e){var t,i,o;(function(e){delete C[e.pointerId];for(let t=0;t<j.length;t++)if(j[t].pointerId==e.pointerId)return void j.splice(t,1)})(e),0===j.length&&(null==(t=n.domElement)||t.releasePointerCapture(e.pointerId),null==(i=n.domElement)||i.ownerDocument.removeEventListener("pointermove",Q),null==(o=n.domElement)||o.ownerDocument.removeEventListener("pointerup",$)),n.dispatchEvent(a),l=s.NONE}function J(e){if(!1!==n.enabled&&!1!==n.enableZoom&&(l===s.NONE||l===s.ROTATE)){var t,i;e.preventDefault(),n.dispatchEvent(o),(B(e),e.deltaY<0)?(t=z(),V(g*t)):e.deltaY>0&&(i=z(),V(g/i)),n.update(),n.dispatchEvent(a)}}function ee(e){if(!1!==n.enabled&&!1!==n.enablePan){let t=!1;switch(e.code){case n.keys.UP:N(0,n.keyPanSpeed),t=!0;break;case n.keys.BOTTOM:N(0,-n.keyPanSpeed),t=!0;break;case n.keys.LEFT:N(n.keyPanSpeed,0),t=!0;break;case n.keys.RIGHT:N(-n.keyPanSpeed,0),t=!0}t&&(e.preventDefault(),n.update())}}function et(e){!1!==n.enabled&&e.preventDefault()}function en(e){let t=C[e.pointerId];void 0===t&&(t=new r.Vector2,C[e.pointerId]=t),t.set(e.pageX,e.pageY)}function ei(e){return C[(e.pointerId===j[0].pointerId?j[1]:j[0]).pointerId]}this.dollyIn=(e=z())=>{V(g*e),n.update()},this.dollyOut=(e=z())=>{V(g/e),n.update()},this.getScale=()=>g,this.setScale=e=>{V(e),n.update()},this.getZoomScale=()=>z(),void 0!==t&&this.connect(t),this.update()}}let h=o.forwardRef(({makeDefault:e,camera:r,regress:a,domElement:s,enableDamping:l=!0,keyEvents:c=!1,onChange:d,onStart:u,onEnd:f,...p},h)=>{let v=(0,n.useThree)(e=>e.invalidate),g=(0,n.useThree)(e=>e.camera),b=(0,n.useThree)(e=>e.gl),y=(0,n.useThree)(e=>e.events),w=(0,n.useThree)(e=>e.setEvents),E=(0,n.useThree)(e=>e.set),S=(0,n.useThree)(e=>e.get),x=(0,n.useThree)(e=>e.performance),P=r||g,A=s||y.connected||b.domElement,O=o.useMemo(()=>new m(P),[P]);return(0,i.useFrame)(()=>{O.enabled&&O.update()},-1),o.useEffect(()=>(c&&O.connect(!0===c?A:c),O.connect(A),()=>void O.dispose()),[c,A,a,O,v]),o.useEffect(()=>{let e=e=>{v(),a&&x.regress(),d&&d(e)},t=e=>{u&&u(e)},n=e=>{f&&f(e)};return O.addEventListener("change",e),O.addEventListener("start",t),O.addEventListener("end",n),()=>{O.removeEventListener("start",t),O.removeEventListener("end",n),O.removeEventListener("change",e)}},[d,u,f,O,v,w]),o.useEffect(()=>{if(e){let e=S().controls;return E({controls:O}),()=>E({controls:e})}},[e,O]),o.createElement("primitive",(0,t.default)({ref:h,object:O,enableDamping:l},p))});e.s(["OrbitControls",0,h],55044)},21596,e=>{"use strict";let t,n;var i,o,r,a,s=e.i(88227),l=e.i(55044),c=e.i(33839),d=e.i(48845),u=e.i(83879),f=e.i(83475),p=e.i(61070),m=u,h=e.i(16598);let v=(i={cellSize:.5,sectionSize:1,fadeDistance:100,fadeStrength:1,fadeFrom:1,cellThickness:.5,sectionThickness:1,cellColor:new u.Color,sectionColor:new u.Color,infiniteGrid:!1,followCamera:!1,worldCamProjPosition:new u.Vector3,worldPlanePosition:new u.Vector3},o=`
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
  `,r=`
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
      #include <${h.version>=154?"colorspace_fragment":"encodings_fragment"}>
    }
  `,(a=class extends m.ShaderMaterial{constructor(e){for(const t in super({vertexShader:o,fragmentShader:r,...e}),i)this.uniforms[t]=new m.Uniform(i[t]),Object.defineProperty(this,t,{get(){return this.uniforms[t].value},set(e){this.uniforms[t].value=e}});this.uniforms=m.UniformsUtils.clone(this.uniforms)}}).key=m.MathUtils.generateUUID(),a),g=d.forwardRef(({args:e,cellColor:t="#000000",sectionColor:n="#2080ff",cellSize:i=.5,sectionSize:o=1,followCamera:r=!1,infiniteGrid:a=!1,fadeDistance:s=100,fadeStrength:l=1,fadeFrom:m=1,cellThickness:h=.5,sectionThickness:g=1,side:b=u.BackSide,...y},w)=>{(0,f.extend)({GridMaterial:v});let E=d.useRef(null);d.useImperativeHandle(w,()=>E.current,[]);let S=new u.Plane,x=new u.Vector3(0,1,0),P=new u.Vector3(0,0,0);return(0,p.useFrame)(e=>{S.setFromNormalAndCoplanarPoint(x,P).applyMatrix4(E.current.matrixWorld);let t=E.current.material,n=t.uniforms.worldCamProjPosition,i=t.uniforms.worldPlanePosition;S.projectPoint(e.camera.position,n.value),i.value.set(0,0,0).applyMatrix4(E.current.matrixWorld)}),d.createElement("mesh",(0,c.default)({ref:E,frustumCulled:!1},y),d.createElement("gridMaterial",(0,c.default)({transparent:!0,"extensions-derivatives":!0,side:b},{cellSize:i,sectionSize:o,cellColor:t,sectionColor:n,cellThickness:h,sectionThickness:g},{fadeDistance:s,fadeStrength:l,fadeFrom:m,infiniteGrid:a,followCamera:r})),d.createElement("planeGeometry",{args:e}))});var b=e.i(33902),y=u,w=u;let E=new w.Box3,S=new w.Vector3;class x extends w.InstancedBufferGeometry{constructor(){super(),this.isLineSegmentsGeometry=!0,this.type="LineSegmentsGeometry",this.setIndex([0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5]),this.setAttribute("position",new w.Float32BufferAttribute([-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],3)),this.setAttribute("uv",new w.Float32BufferAttribute([-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],2))}applyMatrix4(e){let t=this.attributes.instanceStart,n=this.attributes.instanceEnd;return void 0!==t&&(t.applyMatrix4(e),n.applyMatrix4(e),t.needsUpdate=!0),null!==this.boundingBox&&this.computeBoundingBox(),null!==this.boundingSphere&&this.computeBoundingSphere(),this}setPositions(e){let t;e instanceof Float32Array?t=e:Array.isArray(e)&&(t=new Float32Array(e));let n=new w.InstancedInterleavedBuffer(t,6,1);return this.setAttribute("instanceStart",new w.InterleavedBufferAttribute(n,3,0)),this.setAttribute("instanceEnd",new w.InterleavedBufferAttribute(n,3,3)),this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(e,t=3){let n;e instanceof Float32Array?n=e:Array.isArray(e)&&(n=new Float32Array(e));let i=new w.InstancedInterleavedBuffer(n,2*t,1);return this.setAttribute("instanceColorStart",new w.InterleavedBufferAttribute(i,t,0)),this.setAttribute("instanceColorEnd",new w.InterleavedBufferAttribute(i,t,t)),this}fromWireframeGeometry(e){return this.setPositions(e.attributes.position.array),this}fromEdgesGeometry(e){return this.setPositions(e.attributes.position.array),this}fromMesh(e){return this.fromWireframeGeometry(new w.WireframeGeometry(e.geometry)),this}fromLineSegments(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}computeBoundingBox(){null===this.boundingBox&&(this.boundingBox=new w.Box3);let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;void 0!==e&&void 0!==t&&(this.boundingBox.setFromBufferAttribute(e),E.setFromBufferAttribute(t),this.boundingBox.union(E))}computeBoundingSphere(){null===this.boundingSphere&&(this.boundingSphere=new w.Sphere),null===this.boundingBox&&this.computeBoundingBox();let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;if(void 0!==e&&void 0!==t){let n=this.boundingSphere.center;this.boundingBox.getCenter(n);let i=0;for(let o=0,r=e.count;o<r;o++)S.fromBufferAttribute(e,o),i=Math.max(i,n.distanceToSquared(S)),S.fromBufferAttribute(t,o),i=Math.max(i,n.distanceToSquared(S));this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&console.error("THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.",this)}}toJSON(){}applyMatrix(e){return console.warn("THREE.LineSegmentsGeometry: applyMatrix() has been renamed to applyMatrix4()."),this.applyMatrix4(e)}}var P=u,A=e.i(17502);let O=parseInt(u.REVISION.replace(/\D+/g,""));class L extends P.ShaderMaterial{constructor(e){super({type:"LineMaterial",uniforms:P.UniformsUtils.clone(P.UniformsUtils.merge([A.UniformsLib.common,A.UniformsLib.fog,{worldUnits:{value:1},linewidth:{value:1},resolution:{value:new P.Vector2(1,1)},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}}])),vertexShader:`
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
					#include <${O>=154?"colorspace_fragment":"encodings_fragment"}>
					#include <fog_fragment>
					#include <premultiplied_alpha_fragment>

				}
			`,clipping:!0}),this.isLineMaterial=!0,this.onBeforeCompile=function(){this.transparent?this.defines.USE_LINE_COLOR_ALPHA="1":delete this.defines.USE_LINE_COLOR_ALPHA},Object.defineProperties(this,{color:{enumerable:!0,get:function(){return this.uniforms.diffuse.value},set:function(e){this.uniforms.diffuse.value=e}},worldUnits:{enumerable:!0,get:function(){return"WORLD_UNITS"in this.defines},set:function(e){!0===e?this.defines.WORLD_UNITS="":delete this.defines.WORLD_UNITS}},linewidth:{enumerable:!0,get:function(){return this.uniforms.linewidth.value},set:function(e){this.uniforms.linewidth.value=e}},dashed:{enumerable:!0,get:function(){return"USE_DASH"in this.defines},set(e){!!e!="USE_DASH"in this.defines&&(this.needsUpdate=!0),!0===e?this.defines.USE_DASH="":delete this.defines.USE_DASH}},dashScale:{enumerable:!0,get:function(){return this.uniforms.dashScale.value},set:function(e){this.uniforms.dashScale.value=e}},dashSize:{enumerable:!0,get:function(){return this.uniforms.dashSize.value},set:function(e){this.uniforms.dashSize.value=e}},dashOffset:{enumerable:!0,get:function(){return this.uniforms.dashOffset.value},set:function(e){this.uniforms.dashOffset.value=e}},gapSize:{enumerable:!0,get:function(){return this.uniforms.gapSize.value},set:function(e){this.uniforms.gapSize.value=e}},opacity:{enumerable:!0,get:function(){return this.uniforms.opacity.value},set:function(e){this.uniforms.opacity.value=e}},resolution:{enumerable:!0,get:function(){return this.uniforms.resolution.value},set:function(e){this.uniforms.resolution.value.copy(e)}},alphaToCoverage:{enumerable:!0,get:function(){return"USE_ALPHA_TO_COVERAGE"in this.defines},set:function(e){!!e!="USE_ALPHA_TO_COVERAGE"in this.defines&&(this.needsUpdate=!0),!0===e?(this.defines.USE_ALPHA_TO_COVERAGE="",this.extensions.derivatives=!0):(delete this.defines.USE_ALPHA_TO_COVERAGE,this.extensions.derivatives=!1)}}}),this.setValues(e)}}let _=O>=125?"uv1":"uv2",T=new y.Vector4,M=new y.Vector3,j=new y.Vector3,C=new y.Vector4,z=new y.Vector4,U=new y.Vector4,D=new y.Vector3,I=new y.Matrix4,R=new y.Line3,N=new y.Vector3,V=new y.Box3,B=new y.Sphere,H=new y.Vector4;function k(e,t,i){return H.set(0,0,-t,1).applyMatrix4(e.projectionMatrix),H.multiplyScalar(1/H.w),H.x=n/i.width,H.y=n/i.height,H.applyMatrix4(e.projectionMatrixInverse),H.multiplyScalar(1/H.w),Math.abs(Math.max(H.x,H.y))}class F extends y.Mesh{constructor(e=new x,t=new L({color:0xffffff*Math.random()})){super(e,t),this.isLineSegments2=!0,this.type="LineSegments2"}computeLineDistances(){let e=this.geometry,t=e.attributes.instanceStart,n=e.attributes.instanceEnd,i=new Float32Array(2*t.count);for(let e=0,o=0,r=t.count;e<r;e++,o+=2)M.fromBufferAttribute(t,e),j.fromBufferAttribute(n,e),i[o]=0===o?0:i[o-1],i[o+1]=i[o]+M.distanceTo(j);let o=new y.InstancedInterleavedBuffer(i,2,1);return e.setAttribute("instanceDistanceStart",new y.InterleavedBufferAttribute(o,1,0)),e.setAttribute("instanceDistanceEnd",new y.InterleavedBufferAttribute(o,1,1)),this}raycast(e,i){let o,r,a=this.material.worldUnits,s=e.camera;null!==s||a||console.error('LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.');let l=void 0!==e.params.Line2&&e.params.Line2.threshold||0;t=e.ray;let c=this.matrixWorld,d=this.geometry,u=this.material;if(n=u.linewidth+l,null===d.boundingSphere&&d.computeBoundingSphere(),B.copy(d.boundingSphere).applyMatrix4(c),a)o=.5*n;else{let e=Math.max(s.near,B.distanceToPoint(t.origin));o=k(s,e,u.resolution)}if(B.radius+=o,!1!==t.intersectsSphere(B)){if(null===d.boundingBox&&d.computeBoundingBox(),V.copy(d.boundingBox).applyMatrix4(c),a)r=.5*n;else{let e=Math.max(s.near,V.distanceToPoint(t.origin));r=k(s,e,u.resolution)}V.expandByScalar(r),!1!==t.intersectsBox(V)&&(a?function(e,i){let o=e.matrixWorld,r=e.geometry,a=r.attributes.instanceStart,s=r.attributes.instanceEnd,l=Math.min(r.instanceCount,a.count);for(let r=0;r<l;r++){R.start.fromBufferAttribute(a,r),R.end.fromBufferAttribute(s,r),R.applyMatrix4(o);let l=new y.Vector3,c=new y.Vector3;t.distanceSqToSegment(R.start,R.end,c,l),c.distanceTo(l)<.5*n&&i.push({point:c,pointOnLine:l,distance:t.origin.distanceTo(c),object:e,face:null,faceIndex:r,uv:null,[_]:null})}}(this,i):function(e,i,o){let r=i.projectionMatrix,a=e.material.resolution,s=e.matrixWorld,l=e.geometry,c=l.attributes.instanceStart,d=l.attributes.instanceEnd,u=Math.min(l.instanceCount,c.count),f=-i.near;t.at(1,U),U.w=1,U.applyMatrix4(i.matrixWorldInverse),U.applyMatrix4(r),U.multiplyScalar(1/U.w),U.x*=a.x/2,U.y*=a.y/2,U.z=0,D.copy(U),I.multiplyMatrices(i.matrixWorldInverse,s);for(let i=0;i<u;i++){if(C.fromBufferAttribute(c,i),z.fromBufferAttribute(d,i),C.w=1,z.w=1,C.applyMatrix4(I),z.applyMatrix4(I),C.z>f&&z.z>f)continue;if(C.z>f){let e=C.z-z.z,t=(C.z-f)/e;C.lerp(z,t)}else if(z.z>f){let e=z.z-C.z,t=(z.z-f)/e;z.lerp(C,t)}C.applyMatrix4(r),z.applyMatrix4(r),C.multiplyScalar(1/C.w),z.multiplyScalar(1/z.w),C.x*=a.x/2,C.y*=a.y/2,z.x*=a.x/2,z.y*=a.y/2,R.start.copy(C),R.start.z=0,R.end.copy(z),R.end.z=0;let l=R.closestPointToPointParameter(D,!0);R.at(l,N);let u=y.MathUtils.lerp(C.z,z.z,l),p=u>=-1&&u<=1,m=D.distanceTo(N)<.5*n;if(p&&m){R.start.fromBufferAttribute(c,i),R.end.fromBufferAttribute(d,i),R.start.applyMatrix4(s),R.end.applyMatrix4(s);let n=new y.Vector3,r=new y.Vector3;t.distanceSqToSegment(R.start,R.end,r,n),o.push({point:r,pointOnLine:n,distance:t.origin.distanceTo(r),object:e,face:null,faceIndex:i,uv:null,[_]:null})}}}(this,s,i))}}onBeforeRender(e){let t=this.material.uniforms;t&&t.resolution&&(e.getViewport(T),this.material.uniforms.resolution.value.set(T.z,T.w))}}class Y extends x{constructor(){super(),this.isLineGeometry=!0,this.type="LineGeometry"}setPositions(e){let t=e.length-3,n=new Float32Array(2*t);for(let i=0;i<t;i+=3)n[2*i]=e[i],n[2*i+1]=e[i+1],n[2*i+2]=e[i+2],n[2*i+3]=e[i+3],n[2*i+4]=e[i+4],n[2*i+5]=e[i+5];return super.setPositions(n),this}setColors(e,t=3){let n=e.length-t,i=new Float32Array(2*n);if(3===t)for(let o=0;o<n;o+=t)i[2*o]=e[o],i[2*o+1]=e[o+1],i[2*o+2]=e[o+2],i[2*o+3]=e[o+3],i[2*o+4]=e[o+4],i[2*o+5]=e[o+5];else for(let o=0;o<n;o+=t)i[2*o]=e[o],i[2*o+1]=e[o+1],i[2*o+2]=e[o+2],i[2*o+3]=e[o+3],i[2*o+4]=e[o+4],i[2*o+5]=e[o+5],i[2*o+6]=e[o+6],i[2*o+7]=e[o+7];return super.setColors(i,t),this}fromLine(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}}class G extends F{constructor(e=new Y,t=new L({color:0xffffff*Math.random()})){super(e,t),this.isLine2=!0,this.type="Line2"}}let W=d.forwardRef(function({points:e,color:t=0xffffff,vertexColors:n,linewidth:i,lineWidth:o,segments:r,dashed:a,...s},l){var f,p;let m=(0,b.useThree)(e=>e.size),h=d.useMemo(()=>r?new F:new G,[r]),[v]=d.useState(()=>new L),g=(null==n||null==(f=n[0])?void 0:f.length)===4?4:3,y=d.useMemo(()=>{let i=r?new x:new Y,o=e.map(e=>{let t=Array.isArray(e);return e instanceof u.Vector3||e instanceof u.Vector4?[e.x,e.y,e.z]:e instanceof u.Vector2?[e.x,e.y,0]:t&&3===e.length?[e[0],e[1],e[2]]:t&&2===e.length?[e[0],e[1],0]:e});if(i.setPositions(o.flat()),n){t=0xffffff;let e=n.map(e=>e instanceof u.Color?e.toArray():e);i.setColors(e.flat(),g)}return i},[e,r,n,g]);return d.useLayoutEffect(()=>{h.computeLineDistances()},[e,h]),d.useLayoutEffect(()=>{a?v.defines.USE_DASH="":delete v.defines.USE_DASH,v.needsUpdate=!0},[a,v]),d.useEffect(()=>()=>{y.dispose(),v.dispose()},[y]),d.createElement("primitive",(0,c.default)({object:h,ref:l},s),d.createElement("primitive",{object:y,attach:"geometry"}),d.createElement("primitive",(0,c.default)({object:v,attach:"material",color:t,vertexColors:!!n,resolution:[m.width,m.height],linewidth:null!=(p=null!=i?i:o)?p:1,dashed:a,transparent:4===g},s)))}),X=[[-16,.08,-16],[16,.08,-16],[16,.08,16],[-16,.08,16],[-16,.08,-16]];e.s(["FactoryScene",0,function(){return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)("ambientLight",{intensity:.65}),(0,s.jsx)("directionalLight",{position:[10,18,12],intensity:1.1,castShadow:!0}),(0,s.jsx)("pointLight",{position:[0,8,0],intensity:1.6,color:"#22d3ee"}),(0,s.jsx)(l.OrbitControls,{enableRotate:!0,enableZoom:!0,enablePan:!0,target:[0,.3,0],minDistance:10,maxDistance:56,maxPolarAngle:Math.PI/2.15}),(0,s.jsx)(g,{position:[0,0,0],args:[42,42],cellSize:1,cellThickness:.55,cellColor:"#1E3A5F",sectionSize:6,sectionThickness:1.3,sectionColor:"#22D3EE",fadeDistance:45,fadeStrength:1.7,infiniteGrid:!1}),(0,s.jsx)(W,{points:X,color:"#38bdf8",lineWidth:1.8,transparent:!0,opacity:.58}),(0,s.jsxs)("mesh",{position:[0,1.1,0],children:[(0,s.jsx)("boxGeometry",{args:[4.8,2.2,4.8]}),(0,s.jsx)("meshStandardMaterial",{color:"#94a3b8",wireframe:!0,transparent:!0,opacity:.72})]}),(0,s.jsxs)("mesh",{position:[0,.16,0],rotation:[-Math.PI/2,0,0],children:[(0,s.jsx)("ringGeometry",{args:[3.2,3.35,64]}),(0,s.jsx)("meshBasicMaterial",{color:"#22d3ee",transparent:!0,opacity:.42})]})]})}],21596)},55333,e=>{e.n(e.i(21596))}]);