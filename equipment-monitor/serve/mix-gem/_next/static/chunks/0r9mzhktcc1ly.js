(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,711835,e=>{"use strict";function t(e){return"number"==typeof e?e:e.value}e.s(["_AreSameIntegerClass",0,function(e,t){return"FlowGraphInteger"===e&&"FlowGraphInteger"===t},"_AreSameMatrixClass",0,function(e,t){return e===t&&("Matrix"===e||"Matrix2D"===e||"Matrix3D"===e)},"_AreSameVectorOrQuaternionClass",0,function(e,t){return e===t&&("Vector2"===e||"Vector3"===e||"Vector4"===e||"Quaternion"===e)},"_GetClassNameOf",0,function(e){if(e.getClassName)return e.getClassName()},"_IsDescendantOf",0,function e(t,r){return!!(t.parent&&(t.parent===r||e(t.parent,r)))},"getNumericValue",0,t,"isNumeric",0,function(e,r){let i="number"==typeof e||"number"==typeof e?.value;return i&&!r?!isNaN(t(e)):i}])},916624,774100,763946,e=>{"use strict";var t,r,i=e.i(202286),a=e.i(788601),o=e.i(774685);class n{constructor(e){this.value=this._toInt(e)}_toInt(e){return 0|e}add(e){return new n(this.value+e.value)}subtract(e){return new n(this.value-e.value)}multiply(e){return new n(Math.imul(this.value,e.value))}divide(e){return new n(this.value/e.value)}getClassName(){return n.ClassName}equals(e){return this.value===e.value}static FromValue(e){return new n(e)}toString(){return this.value.toString()}}n.ClassName="FlowGraphInteger",(0,o.RegisterClass)("FlowGraphInteger",n),e.s(["FlowGraphInteger",0,n],774100);class s{constructor(e=[1,0,0,1]){this._m=e}get m(){return this._m}transformVector(e){return this.transformVectorToRef(e,new i.Vector2)}transformVectorToRef(e,t){return t.x=e.x*this._m[0]+e.y*this._m[1],t.y=e.x*this._m[2]+e.y*this._m[3],t}asArray(){return this.toArray()}toArray(e=[]){for(let t=0;t<4;t++)e[t]=this._m[t];return e}fromArray(e){for(let t=0;t<4;t++)this._m[t]=e[t];return this}multiplyToRef(e,t){let r=e._m,i=this._m,a=t._m;return a[0]=r[0]*i[0]+r[1]*i[2],a[1]=r[0]*i[1]+r[1]*i[3],a[2]=r[2]*i[0]+r[3]*i[2],a[3]=r[2]*i[1]+r[3]*i[3],t}multiply(e){return this.multiplyToRef(e,new s)}divideToRef(e,t){let r=this._m,i=e._m,a=t._m;return a[0]=r[0]/i[0],a[1]=r[1]/i[1],a[2]=r[2]/i[2],a[3]=r[3]/i[3],t}divide(e){return this.divideToRef(e,new s)}addToRef(e,t){let r=this._m,i=e.m,a=t.m;return a[0]=r[0]+i[0],a[1]=r[1]+i[1],a[2]=r[2]+i[2],a[3]=r[3]+i[3],t}add(e){return this.addToRef(e,new s)}subtractToRef(e,t){let r=this._m,i=e.m,a=t.m;return a[0]=r[0]-i[0],a[1]=r[1]-i[1],a[2]=r[2]-i[2],a[3]=r[3]-i[3],t}subtract(e){return this.subtractToRef(e,new s)}transpose(){let e=this._m;return new s([e[0],e[2],e[1],e[3]])}determinant(){let e=this._m;return e[0]*e[3]-e[1]*e[2]}inverse(){let e=this.determinant();if(0===e)throw Error("Matrix is not invertible");let t=this._m,r=1/e;return new s([t[3]*r,-t[1]*r,-t[2]*r,t[0]*r])}equals(e,t=0){let r=this._m,i=e.m;return 0===t?r[0]===i[0]&&r[1]===i[1]&&r[2]===i[2]&&r[3]===i[3]:Math.abs(r[0]-i[0])<t&&Math.abs(r[1]-i[1])<t&&Math.abs(r[2]-i[2])<t&&Math.abs(r[3]-i[3])<t}getClassName(){return"FlowGraphMatrix2D"}toString(){return`FlowGraphMatrix2D(${this._m.join(", ")})`}}class l{constructor(e=[1,0,0,0,1,0,0,0,1]){this._m=e}get m(){return this._m}transformVector(e){return this.transformVectorToRef(e,new i.Vector3)}transformVectorToRef(e,t){let r=this._m;return t.x=e.x*r[0]+e.y*r[1]+e.z*r[2],t.y=e.x*r[3]+e.y*r[4]+e.z*r[5],t.z=e.x*r[6]+e.y*r[7]+e.z*r[8],t}multiplyToRef(e,t){let r=e._m,i=this._m,a=t.m;return a[0]=r[0]*i[0]+r[1]*i[3]+r[2]*i[6],a[1]=r[0]*i[1]+r[1]*i[4]+r[2]*i[7],a[2]=r[0]*i[2]+r[1]*i[5]+r[2]*i[8],a[3]=r[3]*i[0]+r[4]*i[3]+r[5]*i[6],a[4]=r[3]*i[1]+r[4]*i[4]+r[5]*i[7],a[5]=r[3]*i[2]+r[4]*i[5]+r[5]*i[8],a[6]=r[6]*i[0]+r[7]*i[3]+r[8]*i[6],a[7]=r[6]*i[1]+r[7]*i[4]+r[8]*i[7],a[8]=r[6]*i[2]+r[7]*i[5]+r[8]*i[8],t}multiply(e){return this.multiplyToRef(e,new l)}divideToRef(e,t){let r=this._m,i=e.m,a=t.m;return a[0]=r[0]/i[0],a[1]=r[1]/i[1],a[2]=r[2]/i[2],a[3]=r[3]/i[3],a[4]=r[4]/i[4],a[5]=r[5]/i[5],a[6]=r[6]/i[6],a[7]=r[7]/i[7],a[8]=r[8]/i[8],t}divide(e){return this.divideToRef(e,new l)}addToRef(e,t){let r=this._m,i=e.m,a=t.m;return a[0]=r[0]+i[0],a[1]=r[1]+i[1],a[2]=r[2]+i[2],a[3]=r[3]+i[3],a[4]=r[4]+i[4],a[5]=r[5]+i[5],a[6]=r[6]+i[6],a[7]=r[7]+i[7],a[8]=r[8]+i[8],t}add(e){return this.addToRef(e,new l)}subtractToRef(e,t){let r=this._m,i=e.m,a=t.m;return a[0]=r[0]-i[0],a[1]=r[1]-i[1],a[2]=r[2]-i[2],a[3]=r[3]-i[3],a[4]=r[4]-i[4],a[5]=r[5]-i[5],a[6]=r[6]-i[6],a[7]=r[7]-i[7],a[8]=r[8]-i[8],t}subtract(e){return this.subtractToRef(e,new l)}toArray(e=[]){for(let t=0;t<9;t++)e[t]=this._m[t];return e}asArray(){return this.toArray()}fromArray(e){for(let t=0;t<9;t++)this._m[t]=e[t];return this}transpose(){let e=this._m;return new l([e[0],e[3],e[6],e[1],e[4],e[7],e[2],e[5],e[8]])}determinant(){let e=this._m;return e[0]*(e[4]*e[8]-e[5]*e[7])-e[1]*(e[3]*e[8]-e[5]*e[6])+e[2]*(e[3]*e[7]-e[4]*e[6])}inverse(){let e=this.determinant();if(0===e)throw Error("Matrix is not invertible");let t=this._m,r=1/e;return new l([(t[4]*t[8]-t[5]*t[7])*r,(t[2]*t[7]-t[1]*t[8])*r,(t[1]*t[5]-t[2]*t[4])*r,(t[5]*t[6]-t[3]*t[8])*r,(t[0]*t[8]-t[2]*t[6])*r,(t[2]*t[3]-t[0]*t[5])*r,(t[3]*t[7]-t[4]*t[6])*r,(t[1]*t[6]-t[0]*t[7])*r,(t[0]*t[4]-t[1]*t[3])*r])}equals(e,t=0){let r=this._m,i=e.m;return 0===t?r[0]===i[0]&&r[1]===i[1]&&r[2]===i[2]&&r[3]===i[3]&&r[4]===i[4]&&r[5]===i[5]&&r[6]===i[6]&&r[7]===i[7]&&r[8]===i[8]:Math.abs(r[0]-i[0])<t&&Math.abs(r[1]-i[1])<t&&Math.abs(r[2]-i[2])<t&&Math.abs(r[3]-i[3])<t&&Math.abs(r[4]-i[4])<t&&Math.abs(r[5]-i[5])<t&&Math.abs(r[6]-i[6])<t&&Math.abs(r[7]-i[7])<t&&Math.abs(r[8]-i[8])<t}getClassName(){return"FlowGraphMatrix3D"}toString(){return`FlowGraphMatrix3D(${this._m.join(", ")})`}}e.s(["FlowGraphMatrix2D",0,s,"FlowGraphMatrix3D",0,l],763946),(t=r||(r={})).Any="any",t.String="string",t.Number="number",t.Boolean="boolean",t.Object="object",t.Integer="FlowGraphInteger",t.Vector2="Vector2",t.Vector3="Vector3",t.Vector4="Vector4",t.Quaternion="Quaternion",t.Matrix="Matrix",t.Matrix2D="Matrix2D",t.Matrix3D="Matrix3D",t.Color3="Color3",t.Color4="Color4";class f{constructor(e,t,r=-1){this.typeName=e,this.defaultValue=t,this.animationType=r}serialize(e){e.typeName=this.typeName,e.defaultValue=this.defaultValue}}let c=new f("any",void 0),d=new f("string",""),u=new f("number",0,0),m=new f("boolean",!1),p=new f("Vector2",i.Vector2.Zero(),5),v=new f("Vector3",i.Vector3.Zero(),1),S=new f("Vector4",i.Vector4.Zero()),h=new f("Matrix",i.Matrix.Identity(),3),x=new f("Matrix2D",new s),g=new f("Matrix3D",new l),E=new f("Color3",a.Color3.Black(),4),_=new f("Color4",new a.Color4(0,0,0,0),7),I=new f("Quaternion",i.Quaternion.Identity(),2);I.typeTransformer=e=>{if(e.getClassName){if("Vector4"===e.getClassName())return i.Quaternion.FromArray(e.asArray());else if("Vector3"===e.getClassName())return i.Quaternion.FromEulerVector(e);else if("Matrix"===e.getClassName())return i.Quaternion.FromRotationMatrix(e)}return e};let T=new f("FlowGraphInteger",new n(0),0);e.s(["RichTypeAny",0,c,"RichTypeBoolean",0,m,"RichTypeFlowGraphInteger",0,T,"RichTypeMatrix",0,h,"RichTypeMatrix2D",0,x,"RichTypeMatrix3D",0,g,"RichTypeNumber",0,u,"RichTypeQuaternion",0,I,"RichTypeString",0,d,"RichTypeVector2",0,p,"RichTypeVector3",0,v,"RichTypeVector4",0,S,"getRichTypeByAnimationType",0,function(e){switch(e){case 0:return u;case 5:return p;case 1:return v;case 3:return h;case 4:return E;case 7:return _;case 2:return I;default:return c}},"getRichTypeByFlowGraphType",0,function(e){switch(e){case"string":return d;case"number":return u;case"boolean":return m;case"Vector2":return p;case"Vector3":return v;case"Vector4":return S;case"Matrix":return h;case"Color3":return E;case"Color4":return _;case"Quaternion":return I;case"FlowGraphInteger":return T;case"Matrix2D":return x;case"Matrix3D":return g;default:return c}},"getRichTypeFromValue",0,function(e){switch(typeof e){case"string":return d;case"number":return u;case"boolean":return m;case"object":if(e.getClassName)switch(e.getClassName()){case"Vector2":return p;case"Vector3":return v;case"Vector4":return S;case"Matrix":return h;case"Color3":return E;case"Color4":return _;case"Quaternion":return I;case"FlowGraphInteger":return T;case"Matrix2D":return x;case"Matrix3D":return g}return c;default:return c}}],916624)},906115,e=>{"use strict";var t=e.i(700183);e.i(788601),e.i(202286),e.i(774100),e.i(916624),e.i(763946),e.s(["defaultValueSerializationFunction",0,function(e,r,i){var a;let o=r?.getClassName?.()??"";if("Vector2"===o||"Vector3"===o||"Vector4"===o||"Quaternion"===o||"Color3"===o||"Color4"===o||"Matrix"===(a=o)||"Matrix2D"===a||"Matrix3D"===a)i[e]={value:r.asArray(),className:o};else if("FlowGraphInteger"===o)i[e]={value:r.value,className:o};else if(o&&(r.id||r.name))i[e]={id:r.id,name:r.name,className:o,uniqueId:r.uniqueId};else if("object"!=typeof r||null===r)i[e]=r;else{if("pathConverter"===e||Object.values(r).some(e=>"function"==typeof e))return;try{i[e]=JSON.parse(JSON.stringify(r))}catch{t.Logger.Warn(`FlowGraph serialization: value for key "${e}" is not JSON-serializable and was skipped.`)}}}])},871681,e=>{"use strict";var t,r,i=e.i(14994);(t=r||(r={}))[t.Input=0]="Input",t[t.Output=1]="Output",e.s(["FlowGraphConnection",0,class{constructor(e,t,r){this._ownerBlock=r,this._connectedPoint=[],this.uniqueId=(0,i.RandomGUID)(),this.connectedPointIds=[],this.name=e,this._connectionType=t}get connectionType(){return this._connectionType}_isSingularConnection(){return!0}isConnected(){return this._connectedPoint.length>0}connectTo(e){if(this._connectionType===e._connectionType)throw Error(`Cannot connect two points of type ${this.connectionType}`);if(this._isSingularConnection()&&this._connectedPoint.length>0||e._isSingularConnection()&&e._connectedPoint.length>0)throw Error("Max number of connections for point reached");this._connectedPoint.push(e),e._connectedPoint.push(this)}disconnectFrom(e,t=!0){let r=this._connectedPoint.indexOf(e),i=e._connectedPoint.indexOf(this);-1!==r&&-1!==i&&(t&&this._connectedPoint.splice(r,1),e._connectedPoint.splice(i,1))}disconnectFromAll(){for(let e of this._connectedPoint)this.disconnectFrom(e,!1);this._connectedPoint.length=0}dispose(){for(let e of this._connectedPoint)this.disconnectFrom(e)}serialize(e={}){for(let t of(e.uniqueId=this.uniqueId,e.name=this.name,e._connectionType=this._connectionType,e.connectedPointIds=[],e.className=this.getClassName(),this._connectedPoint))e.connectedPointIds.push(t.uniqueId)}getClassName(){return"FGConnection"}deserialize(e){this.uniqueId=e.uniqueId,this.name=e.name,this._connectionType=e._connectionType,this.connectedPointIds=e.connectedPointIds}}])},440163,312932,e=>{"use strict";var t=e.i(14994),r=e.i(774685),i=e.i(871681),a=e.i(814624),o=e.i(906115);class n extends i.FlowGraphConnection{constructor(e,t,r,i,o=i.defaultValue,n=!1){super(e,t,r),this.richType=i,this._defaultValue=o,this._optional=n,this._isDisabled=!1,this._lastValue=null,this.dataTransformer=null,this.onValueChangedObservable=new a.Observable}get optional(){return this._optional}get isDisabled(){return this._isDisabled}set isDisabled(e){this._isDisabled!==e&&(this._isDisabled=e,this._isDisabled&&this.disconnectFromAll())}_isSingularConnection(){return 0===this.connectionType}setValue(e,t){t._getConnectionValue(this)!==e&&(t._setConnectionValue(this,e),this.onValueChangedObservable.notifyObservers(e))}resetToDefaultValue(e){e._setConnectionValue(this,this._defaultValue)}connectTo(e){this._isDisabled||super.connectTo(e)}_getValueOrDefault(e){let t=e._getConnectionValue(this)??this._defaultValue;return this.dataTransformer?this.dataTransformer(t):t}getValue(e){if(1===this.connectionType){e._notifyExecuteNode(this._ownerBlock),this._ownerBlock._updateOutputs(e);let t=this._getValueOrDefault(e);return this._lastValue=t,this.richType.typeTransformer?this.richType.typeTransformer(t):t}let t=this.isConnected()?this._connectedPoint[0].getValue(e):this._getValueOrDefault(e);return this._lastValue=t,this.richType.typeTransformer?this.richType.typeTransformer(t):t}_getLastValue(){return this._lastValue}getClassName(){return"FlowGraphDataConnection"}serialize(e={}){super.serialize(e),e.richType={},this.richType.serialize(e.richType),e.optional=this._optional,(0,o.defaultValueSerializationFunction)("defaultValue",this._defaultValue,e)}}(0,r.RegisterClass)("FlowGraphDataConnection",n),e.s(["FlowGraphDataConnection",0,n],312932),e.s(["FlowGraphBlock",0,class{constructor(e){this.config=e,this.uniqueId=(0,t.RandomGUID)(),this.name=this.config?.name??this.getClassName(),this.dataInputs=[],this.dataOutputs=[]}_updateOutputs(e){}registerDataInput(e,t,r){let i=new n(e,0,this,t,r);return this.dataInputs.push(i),i}registerDataOutput(e,t,r){let i=new n(e,1,this,t,r);return this.dataOutputs.push(i),i}getDataInput(e){return this.dataInputs.find(t=>t.name===e)}getDataOutput(e){return this.dataOutputs.find(t=>t.name===e)}serialize(e={},t=o.defaultValueSerializationFunction){if(e.uniqueId=this.uniqueId,e.config={},this.config){let r=this.config;for(let i of Object.keys(r))t(i,r[i],e.config)}for(let t of(e.dataInputs=[],e.dataOutputs=[],e.className=this.getClassName(),this.dataInputs)){let r={};t.serialize(r),e.dataInputs.push(r)}for(let t of this.dataOutputs){let r={};t.serialize(r),e.dataOutputs.push(r)}}deserialize(e){}_log(e,t,r){e.logger?.addLogItem({action:t,payload:r,className:this.getClassName(),uniqueId:this.uniqueId})}getClassName(){return"FlowGraphBlock"}}],440163)},303663,524261,e=>{"use strict";var t=e.i(440163),r=e.i(871681),i=e.i(774685);class a extends r.FlowGraphConnection{constructor(){super(...arguments),this.priority=0,this._lastActivationTime=-1}_isSingularConnection(){return!1}connectTo(e){super.connectTo(e),this._connectedPoint.sort((e,t)=>t.priority-e.priority)}_activateSignal(e){if(this._lastActivationTime=performance.now(),e.logger?.addLogItem({action:"ActivateSignal",className:this._ownerBlock.getClassName(),uniqueId:this._ownerBlock.uniqueId,payload:{connectionType:this.connectionType,name:this.name}}),0===this.connectionType){if(e._shouldBreak(this._ownerBlock,this))return;e._notifyExecuteNode(this._ownerBlock);let t=performance.now();this._ownerBlock._execute(e,this),this._ownerBlock._lastExecutionTime=performance.now()-t,e._increaseExecutionId()}else for(let t of this._connectedPoint)t._activateSignal(e)}}(0,i.RegisterClass)("FlowGraphSignalConnection",a),e.s(["FlowGraphSignalConnection",0,a],524261);class o extends t.FlowGraphBlock{constructor(e){super(e),this.priority=0,this._lastExecutionTime=-1,this.signalInputs=[],this.signalOutputs=[],this.in=this._registerSignalInput("in"),this.error=this._registerSignalOutput("error")}_registerSignalInput(e){let t=new a(e,0,this);return this.signalInputs.push(t),t}_registerSignalOutput(e){let t=new a(e,1,this);return this.signalOutputs.push(t),t}_unregisterSignalInput(e){let t=this.signalInputs.findIndex(t=>t.name===e);-1!==t&&(this.signalInputs[t].dispose(),this.signalInputs.splice(t,1))}_unregisterSignalOutput(e){let t=this.signalOutputs.findIndex(t=>t.name===e);-1!==t&&(this.signalOutputs[t].dispose(),this.signalOutputs.splice(t,1))}_reportError(e,t){this.error.payload="string"==typeof t?Error(t):t,this.error._activateSignal(e)}getSignalInput(e){return this.signalInputs.find(t=>t.name===e)}getSignalOutput(e){return this.signalOutputs.find(t=>t.name===e)}serialize(e={}){for(let t of(super.serialize(e),e.signalInputs=[],e.signalOutputs=[],this.signalInputs)){let r={};t.serialize(r),e.signalInputs.push(r)}for(let t of this.signalOutputs){let r={};t.serialize(r),e.signalOutputs.push(r)}}deserialize(e){for(let t=0;t<e.signalInputs.length;t++){let r=this.getSignalInput(e.signalInputs[t].name);if(r)r.deserialize(e.signalInputs[t]);else throw Error("Could not find signal input with name "+e.signalInputs[t].name+" in block "+e.className)}for(let t=0;t<e.signalOutputs.length;t++){let r=this.getSignalOutput(e.signalOutputs[t].name);if(r)r.deserialize(e.signalOutputs[t]);else throw Error("Could not find signal output with name "+e.signalOutputs[t].name+" in block "+e.className)}}getClassName(){return"FlowGraphExecutionBlock"}}e.s(["FlowGraphExecutionBlock",0,o],303663)},353679,e=>{"use strict";var t=e.i(303663);class r extends t.FlowGraphExecutionBlock{constructor(e){super(e),this.out=this._registerSignalOutput("out")}}e.s(["FlowGraphExecutionBlockWithOutSignal",0,r])},706840,e=>{"use strict";var t=e.i(353679);class r extends t.FlowGraphExecutionBlockWithOutSignal{constructor(e,t){if(super(e),this._eventsSignalOutputs={},this.done=this._registerSignalOutput("done"),t)for(const e of t)this._eventsSignalOutputs[e]=this._registerSignalOutput(e+"Event")}_executeOnTick(e){}_startPendingTasks(e){e._getExecutionVariable(this,"_initialized",!1)&&(this._cancelPendingTasks(e),this._resetAfterCanceled(e)),this._preparePendingTasks(e),e._addPendingBlock(this),this.out._activateSignal(e),e._setExecutionVariable(this,"_initialized",!0)}_resetAfterCanceled(e){e._deleteExecutionVariable(this,"_initialized"),e._removePendingBlock(this)}}e.s(["FlowGraphAsyncExecutionBlock",0,r])},868738,e=>{"use strict";var t=e.i(706840);class r extends t.FlowGraphAsyncExecutionBlock{constructor(e){super(e),this.initPriority=0,this.type="NoTrigger",this._unregisterSignalInput("in")}deserialize(e){let t={...e};t.signalInputs=(e.signalInputs??[]).filter(e=>"in"!==e.name),super.deserialize(t)}_execute(e){e._notifyExecuteNode(this),this.done._activateSignal(e),this.out._activateSignal(e)}_startPendingTasks(e){e._getExecutionVariable(this,"_initialized",!1)&&(this._cancelPendingTasks(e),this._resetAfterCanceled(e)),this._preparePendingTasks(e),e._addPendingBlock(this),e._setExecutionVariable(this,"_initialized",!0)}}e.s(["FlowGraphEventBlock",0,r])},959848,e=>{"use strict";var t=e.i(868738),r=e.i(916624),i=e.i(774685),a=e.i(711835);class o extends t.FlowGraphEventBlock{constructor(e){super(e),this.type="PointerOver",this.pointerId=this.registerDataOutput("pointerId",r.RichTypeNumber),this.targetMesh=this.registerDataInput("targetMesh",r.RichTypeAny,e?.targetMesh),this.meshUnderPointer=this.registerDataOutput("meshUnderPointer",r.RichTypeAny)}_executeEvent(e,t){let r=this.targetMesh.getValue(e);this.meshUnderPointer.setValue(t.mesh,e);let i=t.out&&(0,a._IsDescendantOf)(t.out,r);return this.pointerId.setValue(t.pointerId,e),!(!i&&(t.mesh===r||(0,a._IsDescendantOf)(t.mesh,r)))||(this._execute(e),!this.config?.stopPropagation)}_preparePendingTasks(e){}_cancelPendingTasks(e){}getClassName(){return"FlowGraphPointerOverEventBlock"}}(0,i.RegisterClass)("FlowGraphPointerOverEventBlock",o),e.s(["FlowGraphPointerOverEventBlock",0,o])},603187,21590,845675,846635,10308,781829,e=>{"use strict";var t,r,i,a,o,n,s=e.i(868738),l=e.i(900280),f=e.i(916624),c=e.i(774685),d=e.i(814624),u=e.i(730939),m=e.i(548894),p=e.i(14994),v=e.i(906115),S=e.i(967946),h=e.i(700183);(t=a||(a={})).ExecuteBlock="ExecuteBlock",t.ExecuteEvent="ExecuteEvent",t.TriggerConnection="TriggerConnection",t.ContextVariableSet="ContextVariableSet",t.GlobalVariableSet="GlobalVariableSet",t.GlobalVariableDelete="GlobalVariableDelete",t.GlobalVariableGet="GlobalVariableGet",t.AddConnection="AddConnection",t.GetConnectionValue="GetConnectionValue",t.SetConnectionValue="SetConnectionValue",t.ActivateSignal="ActivateSignal",t.ContextVariableGet="ContextVariableGet";class x{constructor(){this.logToConsole=!1,this.log=[]}addLogItem(e){if(e.time||(e.time=Date.now()),this.log.push(e),this.logToConsole){let t=e.payload?.value;"object"==typeof t&&t.getClassName?h.Logger.Log(`[FGLog] ${e.className}:${e.uniqueId.split("-")[0]} ${e.action} - ${JSON.stringify(t.getClassName())}: ${t.toString()}`):h.Logger.Log(`[FGLog] ${e.className}:${e.uniqueId.split("-")[0]} ${e.action} - ${JSON.stringify(e.payload)}`)}}getItemsOfType(e){return this.log.filter(t=>t.action===e)}}e.s(["FlowGraphLogger",0,x],21590);class g{get enableLogging(){return this._enableLogging}set enableLogging(e){this._enableLogging!==e&&(this._enableLogging=e,this._enableLogging?(this.logger=new x,this.logger.logToConsole=!0):this.logger=null)}constructor(e){this.uniqueId=(0,p.RandomGUID)(),this.name="",this._userVariables={},this._variableTypes={},this._executionVariables={},this._globalContextVariables={},this._connectionValues={},this._pendingBlocks=[],this._executionId=0,this.onNodeExecutedObservable=new d.Observable,this.onBreakpointHitObservable=new d.Observable,this.breakpointPredicate=null,this._pendingActivation=null,this._stepMode=!1,this._skipBreakpointForBlockId=null,this.treatDataAsRightHanded=!1,this._enableLogging=!1,this._configuration=e,this.assetsContext=e.assetsContext??e.scene}hasVariable(e){return e in this._userVariables}setVariable(e,t){this._userVariables[e]=t,this.logger?.addLogItem({time:Date.now(),className:this.getClassName(),uniqueId:this.uniqueId,action:"ContextVariableSet",payload:{name:e,value:t}})}getAsset(e,t){return(0,S.GetFlowGraphAssetWithType)(this.assetsContext,e,t)}getVariable(e){return this.logger?.addLogItem({time:Date.now(),className:this.getClassName(),uniqueId:this.uniqueId,action:"ContextVariableGet",payload:{name:e,value:this._userVariables[e]}}),this._userVariables[e]}get userVariables(){return this._userVariables}setVariableType(e,t){this._variableTypes[e]=t}getVariableType(e){return this._variableTypes[e]}get variableTypes(){return this._variableTypes}getScene(){return this._configuration.scene}_getUniqueIdPrefixedName(e,t){return`${e.uniqueId}_${t}`}_getGlobalContextVariable(e,t){return(this.logger?.addLogItem({time:Date.now(),className:this.getClassName(),uniqueId:this.uniqueId,action:"GlobalVariableGet",payload:{name:e,defaultValue:t,possibleValue:this._globalContextVariables[e]}}),this._hasGlobalContextVariable(e))?this._globalContextVariables[e]:t}_setGlobalContextVariable(e,t){this.logger?.addLogItem({time:Date.now(),className:this.getClassName(),uniqueId:this.uniqueId,action:"GlobalVariableSet",payload:{name:e,value:t}}),this._globalContextVariables[e]=t}_deleteGlobalContextVariable(e){this.logger?.addLogItem({time:Date.now(),className:this.getClassName(),uniqueId:this.uniqueId,action:"GlobalVariableDelete",payload:{name:e}}),delete this._globalContextVariables[e]}_hasGlobalContextVariable(e){return e in this._globalContextVariables}_setExecutionVariable(e,t,r){this._executionVariables[this._getUniqueIdPrefixedName(e,t)]=r}_getExecutionVariable(e,t,r){return this._hasExecutionVariable(e,t)?this._executionVariables[this._getUniqueIdPrefixedName(e,t)]:r}_deleteExecutionVariable(e,t){delete this._executionVariables[this._getUniqueIdPrefixedName(e,t)]}_hasExecutionVariable(e,t){return this._getUniqueIdPrefixedName(e,t)in this._executionVariables}_hasConnectionValue(e){return e.uniqueId in this._connectionValues}_setConnectionValue(e,t){this._connectionValues[e.uniqueId]=t,this.logger?.addLogItem({time:Date.now(),className:this.getClassName(),uniqueId:this.uniqueId,action:"SetConnectionValue",payload:{connectionPointId:e.uniqueId,value:t}})}_setConnectionValueByKey(e,t){this._connectionValues[e]=t}_getConnectionValue(e){return this.logger?.addLogItem({time:Date.now(),className:this.getClassName(),uniqueId:this.uniqueId,action:"GetConnectionValue",payload:{connectionPointId:e.uniqueId,value:this._connectionValues[e.uniqueId]}}),this._connectionValues[e.uniqueId]}get configuration(){return this._configuration}get hasPendingBlocks(){return this._pendingBlocks.length>0}_addPendingBlock(e){this._pendingBlocks.includes(e)||(this._pendingBlocks.push(e),this._pendingBlocks.sort((e,t)=>e.priority-t.priority))}_removePendingBlock(e){let t=this._pendingBlocks.indexOf(e);-1!==t&&this._pendingBlocks.splice(t,1)}_clearPendingBlocks(){for(let e of this._pendingBlocks)e._cancelPendingTasks(this);this._pendingBlocks.length=0}_notifyExecuteNode(e){this.onNodeExecutedObservable.notifyObservers(e),this.logger?.addLogItem({time:Date.now(),className:e.getClassName(),uniqueId:e.uniqueId,action:"ExecuteBlock"})}_notifyOnTick(e){for(let t of(this._setGlobalContextVariable("timeSinceStart",e.timeSinceStart),this._setGlobalContextVariable("deltaTime",e.deltaTime),this._pendingBlocks))t._executeOnTick?.(this)}_increaseExecutionId(){this._executionId++}get executionId(){return this._executionId}_shouldBreak(e,t){return this._skipBreakpointForBlockId===e.uniqueId?(this._skipBreakpointForBlockId=null,!1):!!this._pendingActivation||(this._stepMode?(this._stepMode=!1,this._pendingActivation={block:e,context:this,signal:t},this.onBreakpointHitObservable.notifyObservers(this._pendingActivation),!0):!!(this.breakpointPredicate&&this.breakpointPredicate(e))&&(this._pendingActivation={block:e,context:this,signal:t},this.onBreakpointHitObservable.notifyObservers(this._pendingActivation),!0))}get pendingActivation(){return this._pendingActivation}continueExecution(){let e=this._pendingActivation;e&&(this._pendingActivation=null,this._skipBreakpointForBlockId=e.block.uniqueId,e.signal._activateSignal(this),this._skipBreakpointForBlockId=null)}stepExecution(){let e=this._pendingActivation;e&&(this._pendingActivation=null,this._stepMode=!0,this._skipBreakpointForBlockId=e.block.uniqueId,e.signal._activateSignal(this),this._stepMode=!1,this._skipBreakpointForBlockId=null)}_clearPendingActivation(){this._pendingActivation=null,this._stepMode=!1,this._skipBreakpointForBlockId=null}serialize(e={},t=v.defaultValueSerializationFunction){for(let r in e.uniqueId=this.uniqueId,e.name=this.name,e._userVariables={},this._userVariables)t(r,this._userVariables[r],e._userVariables);for(let r in Object.keys(this._variableTypes).length>0&&(e._variableTypes={...this._variableTypes}),e._connectionValues={},this._connectionValues)t(r,this._connectionValues[r],e._connectionValues);this.assetsContext!==this.getScene()&&(e._assetsContext={meshes:this.assetsContext.meshes.map(e=>e.id),materials:this.assetsContext.materials.map(e=>e.id),textures:this.assetsContext.textures.map(e=>e.name),animations:this.assetsContext.animations.map(e=>e.name),lights:this.assetsContext.lights.map(e=>e.id),cameras:this.assetsContext.cameras.map(e=>e.id),sounds:this.assetsContext.sounds?.map(e=>e.name),skeletons:this.assetsContext.skeletons.map(e=>e.id),particleSystems:this.assetsContext.particleSystems.map(e=>e.name),geometries:this.assetsContext.geometries.map(e=>e.id),multiMaterials:this.assetsContext.multiMaterials.map(e=>e.id),transformNodes:this.assetsContext.transformNodes.map(e=>e.id)})}getClassName(){return"FlowGraphContext"}}(0,u.__decorate)([(0,m.serialize)()],g.prototype,"uniqueId",void 0),(0,u.__decorate)([(0,m.serialize)()],g.prototype,"name",void 0),e.s(["FlowGraphContext",0,g],845675);var E=e.i(303663),_=e.i(706840),I=e.i(805664);class T{constructor(e){this.onEventTriggeredObservable=new d.Observable,this.sceneReadyTriggered=!1,this._pointerUnderMeshState={},this._startingTime=0,this._scene=e,this._initialize()}_initialize(){this._sceneReadyObserver=this._scene.onReadyObservable.addOnce(()=>{this.sceneReadyTriggered||(this.onEventTriggeredObservable.notifyObservers({type:"SceneReady"}),this.sceneReadyTriggered=!0)}),this._sceneDisposeObserver=this._scene.onDisposeObservable.add(()=>{this.onEventTriggeredObservable.notifyObservers({type:"SceneDispose"})}),this._sceneOnBeforeRenderObserver=this._scene.onBeforeRenderObservable.add(()=>{let e=this._scene.getEngine().getDeltaTime()/1e3;this.onEventTriggeredObservable.notifyObservers({type:"SceneBeforeRender",payload:{timeSinceStart:this._startingTime,deltaTime:e}}),this._startingTime+=e}),this._meshPickedObserver=this._scene.onPointerObservable.add(e=>{this.onEventTriggeredObservable.notifyObservers({type:"MeshPick",payload:e})},I.PointerEventTypes.POINTERPICK),this._pointerDownObserver=this._scene.onPointerObservable.add(e=>{this.onEventTriggeredObservable.notifyObservers({type:"PointerDown",payload:e})},I.PointerEventTypes.POINTERDOWN),this._pointerUpObserver=this._scene.onPointerObservable.add(e=>{this.onEventTriggeredObservable.notifyObservers({type:"PointerUp",payload:e})},I.PointerEventTypes.POINTERUP),this._pointerMoveObserver=this._scene.onPointerObservable.add(e=>{this.onEventTriggeredObservable.notifyObservers({type:"PointerMove",payload:e})},I.PointerEventTypes.POINTERMOVE),this._meshUnderPointerObserver=this._scene.onMeshUnderPointerUpdatedObservable.add(e=>{let t=e.pointerId,r=e.mesh,i=this._pointerUnderMeshState[t];!i&&r?this.onEventTriggeredObservable.notifyObservers({type:"PointerOver",payload:{pointerId:t,mesh:r}}):i&&!r?this.onEventTriggeredObservable.notifyObservers({type:"PointerOut",payload:{pointerId:t,mesh:i}}):i&&r&&i!==r&&(this.onEventTriggeredObservable.notifyObservers({type:"PointerOut",payload:{pointerId:t,mesh:i,over:r}}),this.onEventTriggeredObservable.notifyObservers({type:"PointerOver",payload:{pointerId:t,mesh:r,out:i}})),this._pointerUnderMeshState[t]=r},I.PointerEventTypes.POINTERMOVE)}dispose(){this._sceneDisposeObserver?.remove(),this._sceneReadyObserver?.remove(),this._sceneOnBeforeRenderObserver?.remove(),this._meshPickedObserver?.remove(),this._meshUnderPointerObserver?.remove(),this._pointerDownObserver?.remove(),this._pointerUpObserver?.remove(),this._pointerMoveObserver?.remove(),this.onEventTriggeredObservable.clear()}}var C=e.i(711835);(r=o||(o={}))[r.Error=0]="Error",r[r.Warning=1]="Warning";let A=new Set(["number","FlowGraphInteger","boolean"]),N=new Set(["Vector4","Quaternion"]),R=new Set(["Color3","Color4"]);function D(e,t){let r=function(e){let t=[],r=new Map,i=e=>{if(t.push(e),e.block){let t=r.get(e.block.uniqueId);t||(t=[],r.set(e.block.uniqueId,t)),t.push(e)}},a=[];for(let t of(e.visitAllBlocks(e=>{a.push(e)}),0===function(e){let t=[];for(let r in e._eventBlocks)for(let i of e._eventBlocks[r])t.push(i);return t}(e).length&&i({severity:0,message:"Graph has no event blocks — nothing will trigger execution."}),a))for(let e of t.dataInputs)e.optional||e.isDisabled||e.isConnected()||i({severity:1,message:`"${e.name}" is not connected and will use its default value.`,block:t,connectionName:e.name});for(let e of a)if(e instanceof E.FlowGraphExecutionBlock){if(M(e))continue;let t=e.signalInputs.find(e=>"in"===e.name);t&&!t.isConnected()&&i({severity:0,message:"Execution block has no incoming signal — it will never execute.",block:e,connectionName:"in"})}for(let e of a)for(let t of e.dataInputs){if(!t.isConnected())continue;let r=t._connectedPoint[0],a=r.richType?.typeName,o=t.richType?.typeName;if(a&&o&&!(a===o||"any"===a||"any"===o||A.has(a)&&A.has(o)||N.has(a)&&N.has(o)||R.has(a)&&R.has(o))){if(void 0!==r.richType.typeTransformer||void 0!==t.richType.typeTransformer)continue;i({severity:1,message:`Type mismatch: "${r._ownerBlock.name}.${r.name}" (${a}) → "${e.name}.${t.name}" (${o}).`,block:e,connectionName:t.name})}}let o=new Set;return e.visitAllBlocks(e=>{o.add(e.uniqueId)}),function(e,t){let r=new Map;for(let t of e)r.set(t.uniqueId,0);let i=new Map;for(let t of e)i.set(t.uniqueId,t);let a=new Set;for(let i of e)0===r.get(i.uniqueId)&&function e(i){for(let o of(r.set(i.uniqueId,1),i.dataInputs))if(o.isConnected())for(let n of o._connectedPoint){let o=n._ownerBlock;if(o instanceof E.FlowGraphExecutionBlock)continue;let s=r.get(o.uniqueId);if(1===s)return a.has(i.uniqueId)||(a.add(i.uniqueId),t({severity:0,message:"Data dependency cycle detected — getValue() will recurse infinitely.",block:i})),a.has(o.uniqueId)||(a.add(o.uniqueId),t({severity:0,message:"Data dependency cycle detected — getValue() will recurse infinitely.",block:o})),!0;0===s&&e(o)}return r.set(i.uniqueId,2),!1}(i)}(a,i),t.sort((e,t)=>e.severity-t.severity),{isValid:t.every(e=>0!==e.severity),issues:t,errorCount:t.filter(e=>0===e.severity).length,warningCount:t.filter(e=>1===e.severity).length,issuesByBlock:r}}(e),i=new Set;for(let a of(e.visitAllBlocks(e=>{i.add(e.uniqueId)}),t))if(!i.has(a.uniqueId)){let e={severity:1,message:"Block is unreachable from any event block.",block:a};r.issues.push(e),r.warningCount++;let t=r.issuesByBlock.get(a.uniqueId);for(let i of(t||(t=[],r.issuesByBlock.set(a.uniqueId,t)),t.push(e),a.dataInputs))if(!i.optional&&!i.isDisabled&&!i.isConnected()){let e={severity:1,message:`"${i.name}" is not connected and will use its default value.`,block:a,connectionName:i.name};r.issues.push(e),r.warningCount++,t.push(e)}if(a instanceof E.FlowGraphExecutionBlock&&!M(a)){let e=a.signalInputs.find(e=>"in"===e.name);if(e&&!e.isConnected()){let e={severity:0,message:"Execution block has no incoming signal — it will never execute.",block:a,connectionName:"in"};r.issues.push(e),r.errorCount++,t.push(e)}}}return r.isValid=r.issues.every(e=>0!==e.severity),r.issues.sort((e,t)=>e.severity-t.severity),r}function M(e){return e instanceof s.FlowGraphEventBlock}e.s(["ValidateFlowGraphWithBlockList",0,D],846635),(i=n||(n={}))[i.Stopped=0]="Stopped",i[i.Started=1]="Started",i[i.Paused=2]="Paused";class P{get scene(){return this._scene}get coordinator(){return this._coordinator}get state(){return this._state}set state(e){this._state=e,this.onStateChangedObservable.notifyObservers(e)}constructor(e){this.onStateChangedObservable=new d.Observable,this._eventBlocks={SceneReady:[],SceneDispose:[],SceneBeforeRender:[],MeshPick:[],PointerDown:[],PointerUp:[],PointerMove:[],PointerOver:[],PointerOut:[],SceneAfterRender:[],NoTrigger:[]},this._allBlocks=[],this._executionContexts=[],this._state=0,this._scene=e.scene,this._sceneEventCoordinator=new T(this._scene),this._coordinator=e.coordinator,this.name=e.name??"Graph",this.uniqueId=e.uniqueId??(0,p.RandomGUID)()}_attachEventObserver(){this._eventObserver||(this._eventObserver=this._sceneEventCoordinator.onEventTriggeredObservable.add(e=>{if("SceneDispose"===e.type)return void this.dispose();if(1===this.state){for(let t of this._executionContexts)for(let r of this._getContextualOrder(e.type,t))if(!r._executeEvent(t,e.payload))break;switch(e.type){case"SceneReady":this._sceneEventCoordinator.sceneReadyTriggered=!0;break;case"SceneBeforeRender":for(let t of this._executionContexts)t._notifyOnTick(e.payload)}}}))}_detachEventObserver(){this._eventObserver?.remove(),this._eventObserver=null}setScene(e){e!==this._scene&&(1===this.state&&this.stop(),this._detachEventObserver(),this._sceneEventCoordinator.dispose(),this._executionContexts.length=0,this._scene=e,this._scene.constantlyUpdateMeshUnderPointer=!0,this._sceneEventCoordinator=new T(this._scene),this._attachEventObserver())}createContext(){let e=new g({scene:this._scene,coordinator:this._coordinator});return this._executionContexts.push(e),e}getContext(e){return this._executionContexts[e]}get contextCount(){return this._executionContexts.length}removeContext(e){if(e<0||e>=this._executionContexts.length)return;let[t]=this._executionContexts.splice(e,1);return t._clearPendingBlocks(),t}getAllBlocks(){return this._allBlocks}addBlock(e){-1===this._allBlocks.indexOf(e)&&this._allBlocks.push(e)}removeBlock(e){let t=this._allBlocks.indexOf(e);if(-1!==t&&this._allBlocks.splice(t,1),e instanceof E.FlowGraphExecutionBlock&&"type"in e){let t=this._eventBlocks[e.type];if(t){let r=t.indexOf(e);-1!==r&&t.splice(r,1)}}if(e instanceof _.FlowGraphAsyncExecutionBlock)for(let t of this._executionContexts)e._cancelPendingTasks(t),e._resetAfterCanceled(t);for(let t of e.dataInputs)t.disconnectFromAll();for(let t of e.dataOutputs)t.disconnectFromAll();if(e instanceof E.FlowGraphExecutionBlock){for(let t of e.signalInputs)t.disconnectFromAll();for(let t of e.signalOutputs)t.disconnectFromAll()}}addEventBlock(e){if(this.addBlock(e),("PointerOver"===e.type||"PointerOut"===e.type)&&(this._scene.constantlyUpdateMeshUnderPointer=!0),this._eventBlocks[e.type].push(e),1===this.state)for(let t of this._executionContexts)e._startPendingTasks(t);else this.onStateChangedObservable.addOnce(t=>{if(1===t)for(let t of this._executionContexts)e._startPendingTasks(t)})}stop(){if(0!==this.state){for(let e of(this._detachEventObserver(),this.state=0,this._executionContexts))e._clearPendingBlocks(),e._clearPendingActivation();this._executionContexts.length=0}}pause(){if(1===this.state)for(let e of(this._detachEventObserver(),this.state=2,this._executionContexts))e._clearPendingBlocks()}start(){if(1===this.state)return;let e=2===this.state;0===this._executionContexts.length&&this.createContext(),this._attachEventObserver(),this.state=1,this._startPendingEvents(),e||(this._sceneEventCoordinator.sceneReadyTriggered=!1,this._scene.isReady(!0)?(this._sceneEventCoordinator.sceneReadyTriggered=!0,this._sceneEventCoordinator.onEventTriggeredObservable.notifyObservers({type:"SceneReady"})):this._scene.executeWhenReady(()=>{1!==this.state||this._sceneEventCoordinator.sceneReadyTriggered||(this._sceneEventCoordinator.sceneReadyTriggered=!0,this._sceneEventCoordinator.onEventTriggeredObservable.notifyObservers({type:"SceneReady"}))},!0))}_startPendingEvents(){for(let e of this._executionContexts)for(let t in this._eventBlocks)for(let r of this._getContextualOrder(t,e))r._startPendingTasks(e)}_getContextualOrder(e,t){let r=this._eventBlocks[e].sort((e,t)=>t.initPriority-e.initPriority);if("MeshPick"===e){let e=[];for(let i of r){let a=i.asset.getValue(t),o=0;for(;o<r.length;o++){let e=r[o].asset.getValue(t);if(a&&e&&(0,C._IsDescendantOf)(a,e))break}e.splice(o,0,i)}return e}return r}dispose(){if(0!==this.state){for(let e of(this.state=0,this._executionContexts))e._clearPendingBlocks(),e._clearPendingActivation();for(let e in this._executionContexts.length=0,this._eventBlocks)this._eventBlocks[e].length=0;this._allBlocks.length=0,this._detachEventObserver(),this._sceneEventCoordinator.dispose()}}visitAllBlocks(e){let t=[],r=new Set;for(let e in this._eventBlocks)for(let i of this._eventBlocks[e])t.push(i),r.add(i.uniqueId);for(;t.length>0;){let i=t.pop();for(let a of(e(i),i.dataInputs))for(let e of a._connectedPoint)r.has(e._ownerBlock.uniqueId)||(t.push(e._ownerBlock),r.add(e._ownerBlock.uniqueId));if(i instanceof E.FlowGraphExecutionBlock)for(let e of i.signalOutputs)for(let i of e._connectedPoint)r.has(i._ownerBlock.uniqueId)||(t.push(i._ownerBlock),r.add(i._ownerBlock.uniqueId))}}validate(){return D(this,this._allBlocks)}serialize(e={},t){e.name=this.name,e.uniqueId=this.uniqueId,e.allBlocks=[];let r=new Set,i=t=>{if(r.has(t.uniqueId))return;r.add(t.uniqueId);let i={};t.serialize(i),e.allBlocks.push(i)};for(let e of(this.visitAllBlocks(i),this._allBlocks))i(e);for(let r of(e.executionContexts=[],this._executionContexts)){let i={};r.serialize(i,t),e.executionContexts.push(i)}}}e.s(["FlowGraph",0,P],10308);class y{constructor(e){this.config=e,this.dispatchEventsSynchronously=!0,this._flowGraphs=[],this._customEventsMap=new Map,this._eventExecutionCounter=new Map,this._executeOnNextFrame=[],this._eventUniqueId=0,this._disposeObserver=this.config.scene.onDisposeObservable.add(()=>{this.dispose()}),this._onBeforeRenderObserver=this.config.scene.onBeforeRenderObservable.add(()=>{this._eventExecutionCounter.clear();let e=this._executeOnNextFrame.slice(0);if(e.length)for(let t of e){this.notifyCustomEvent(t.id,t.data,!1);let e=this._executeOnNextFrame.findIndex(e=>e.uniqueId===t.uniqueId);-1!==e&&this._executeOnNextFrame.splice(e,1)}});let t=y.SceneCoordinators.get(this.config.scene);t||(t=[],y.SceneCoordinators.set(this.config.scene,t)),t.push(this)}createGraph(e){let t=e??`Graph ${this._flowGraphs.length+1}`,r=new P({scene:this.config.scene,coordinator:this,name:t});return this._flowGraphs.push(r),r}removeGraph(e){let t=this._flowGraphs.indexOf(e);-1!==t&&(e.dispose(),this._flowGraphs.splice(t,1))}start(){for(let e of this._flowGraphs)e.start()}dispose(){for(let e of this._flowGraphs)e.dispose();this._flowGraphs.length=0,this._disposeObserver?.remove(),this._onBeforeRenderObserver?.remove();let e=y.SceneCoordinators.get(this.config.scene)??[],t=e.indexOf(this);-1!==t&&e.splice(t,1)}serialize(e,t){for(let r of(e._flowGraphs=[],this._flowGraphs)){let i={};r.serialize(i,t),e._flowGraphs.push(i)}e.dispatchEventsSynchronously=this.dispatchEventsSynchronously}get flowGraphs(){return this._flowGraphs}getCustomEventObservable(e){let t=this._customEventsMap.get(e);return t||(t=new d.Observable,this._customEventsMap.set(e,t)),t}notifyCustomEvent(e,t,r=!this.dispatchEventsSynchronously){if(r)return void this._executeOnNextFrame.push({id:e,data:t,uniqueId:this._eventUniqueId++});if(this._eventExecutionCounter.has(e)){let t=this._eventExecutionCounter.get(e);if(this._eventExecutionCounter.set(e,t+1),t>=y.MaxEventTypeExecutionPerFrame){t===y.MaxEventTypeExecutionPerFrame&&h.Logger.Warn(`FlowGraphCoordinator: Too many executions of event "${e}".`);return}}else this._eventExecutionCounter.set(e,1);let i=this._customEventsMap.get(e);i&&i.notifyObservers(t)}}y.MaxEventsPerType=30,y.MaxEventTypeExecutionPerFrame=30,y.SceneCoordinators=new Map,e.s(["FlowGraphCoordinator",0,y],781829);class O extends s.FlowGraphEventBlock{constructor(e){for(const t in super(e),this.config=e,this.initPriority=1,this.config.eventData){const e=this.config.eventData[t],r="string"==typeof e.type?e.type:e.type?.typeName,i="function"==typeof e.type?.serialize?e.type:(0,f.getRichTypeByFlowGraphType)(r);e.type=i,this.registerDataOutput(t,i)}}_preparePendingTasks(e){let t=e.configuration.coordinator.getCustomEventObservable(this.config.eventId);if(t&&t.hasObservers()&&t.observers.length>y.MaxEventsPerType)return void this._reportError(e,`FlowGraphReceiveCustomEventBlock: Too many observers for event ${this.config.eventId}. Max is ${y.MaxEventsPerType}.`);let r=t.add(t=>{for(let r of Object.keys(t))this.getDataOutput(r)?.setValue(t[r],e);this._execute(e)});e._setExecutionVariable(this,"_eventObserver",r)}_cancelPendingTasks(e){let t=e.configuration.coordinator.getCustomEventObservable(this.config.eventId);if(t){let r=e._getExecutionVariable(this,"_eventObserver",null);t.remove(r)}else l.Tools.Warn(`FlowGraphReceiveCustomEventBlock: Missing observable for event ${this.config.eventId}`)}_executeEvent(e,t){return!0}serialize(e={}){super.serialize(e);let t={};for(let e in this.config.eventData)t[e]={type:this.config.eventData[e].type.typeName};e.config.eventData=t}getClassName(){return"FlowGraphReceiveCustomEventBlock"}}(0,c.RegisterClass)("FlowGraphReceiveCustomEventBlock",O),e.s(["FlowGraphReceiveCustomEventBlock",0,O],603187)},866493,e=>{"use strict";var t=e.i(700183);let r=new Map;function i(e,i){var a;a=e,r.delete(a)&&t.Logger.Warn(`Extension with the name '${e}' already exists`),r.set(e,i)}e.s(["_GetCompatibleTextureLoader",0,function(t,a){("image/ktx"===a||"image/ktx2"===a)&&(t=".ktx"),!r.has(t)&&(t.endsWith(".ies")&&i(".ies",async()=>await e.A(719390).then(e=>new e._IESTextureLoader)),t.endsWith(".dds")&&i(".dds",async()=>await e.A(378358).then(e=>new e._DDSTextureLoader)),t.endsWith(".basis")&&i(".basis",async()=>await e.A(346399).then(e=>new e._BasisTextureLoader)),t.endsWith(".env")&&i(".env",async()=>await e.A(142291).then(e=>new e._ENVTextureLoader)),t.endsWith(".hdr")&&i(".hdr",async()=>await e.A(289392).then(e=>new e._HDRTextureLoader)),(t.endsWith(".ktx")||t.endsWith(".ktx2"))&&(i(".ktx",async()=>await e.A(49343).then(e=>new e._KTXTextureLoader)),i(".ktx2",async()=>await e.A(49343).then(e=>new e._KTXTextureLoader))),t.endsWith(".tga")&&i(".tga",async()=>await e.A(531494).then(e=>new e._TGATextureLoader)),t.endsWith(".exr")&&i(".exr",async()=>await e.A(302454).then(e=>new e._ExrTextureLoader)));let o=r.get(t);return o?Promise.resolve(o(a)):null}])},585430,e=>{"use strict";var t=e.i(202286),r=e.i(213361),i=e.i(90341),a=e.i(375043),o=e.i(788601);class n{constructor(e,t,r,i){this.name=e,this.worldAxisForNormal=t,this.worldAxisForFileX=r,this.worldAxisForFileY=i}}class s{static _NearestPow2Floor(e){return e<=1?1:1<<Math.floor(Math.log2(e))}static ConvertCubeMapTextureToSphericalPolynomial(e){let t,r;if(!e.isCube)return null;e.getScene()?.getEngine().flushFramebuffer();let i=e.getSize().width,a=e._sphericalPolynomialTargetSize,o=a>0?this._NearestPow2Floor(a):0,n=!e.noMipmap&&e._texture?.generateMipMaps===!0,s=o>0&&o<i&&n,l=s?Math.max(0,Math.round(Math.log2(i/o))):0,f=s?Math.max(1,Math.floor(i/Math.pow(2,l))):i,c=e.readPixels(0,l,void 0,!1),d=e.readPixels(1,l,void 0,!1);e.isRenderTarget?(t=e.readPixels(3,l,void 0,!1),r=e.readPixels(2,l,void 0,!1)):(t=e.readPixels(2,l,void 0,!1),r=e.readPixels(3,l,void 0,!1));let u=e.readPixels(4,l,void 0,!1),m=e.readPixels(5,l,void 0,!1),p=e.gammaSpace,v=o>0&&o<i&&!s;return new Promise(e=>{Promise.all([d,c,t,r,u,m]).then(([t,r,a,n,s,l])=>{let c=f;v&&(t=this._DownsampleFace(t,i,o,4),r=this._DownsampleFace(r,i,o,4),a=this._DownsampleFace(a,i,o,4),n=this._DownsampleFace(n,i,o,4),s=this._DownsampleFace(s,i,o,4),l=this._DownsampleFace(l,i,o,4),c=o);let d={size:c,right:r,left:t,up:a,down:n,front:s,back:l,format:5,type:+(t instanceof Float32Array),gammaSpace:p};e(this.ConvertCubeMapToSphericalPolynomial(d))})})}static _AreaElement(e,t){return Math.atan2(e*t,Math.sqrt(e*e+t*t+1))}static _DownsampleFace(e,t,r,i){let a=e instanceof Float32Array?e:Float32Array.from(e),o=r*r*i,n=new Float32Array(o),s=t/r,l=1/(s*s);for(let e=0;e<r;e++){let o=Math.floor(e*s),f=Math.floor((e+1)*s);for(let c=0;c<r;c++){let d=Math.floor(c*s),u=Math.floor((c+1)*s),m=(e*r+c)*i;for(let e=0;e<i;e++){let r=0;for(let n=o;n<f;n++)for(let o=d;o<u;o++)r+=a[(n*t+o)*i+e];n[m+e]=r*l}}}if(e instanceof Float32Array)return n;let f=new e.constructor(o);for(let e=0;e<o;e++)f[e]=n[e]+.5|0;return f}static ConvertCubeMapToSphericalPolynomial(e,t=0){let n=t>0?this._NearestPow2Floor(t):0;if(n>0&&e.size>n){let t=5===e.format?4:3,r={};for(let i of["right","left","up","down","front","back"])r[i]=this._DownsampleFace(e[i],e.size,n,t);e={...e,...r,size:n}}let s=new i.SphericalHarmonics,l=0,f=2/e.size,c=.5*f,d=c-1;for(let t=0;t<6;t++){let i=this._FileFaces[t],n=e[i.name],u=d,m=5===e.format?4:3;for(let t=0;t<e.size;t++){let p=d;for(let d=0;d<e.size;d++){let v=i.worldAxisForFileX.scale(p).add(i.worldAxisForFileY.scale(u)).add(i.worldAxisForNormal);v.normalize();let S=this._AreaElement(p-c,u-c)-this._AreaElement(p-c,u+c)-this._AreaElement(p+c,u-c)+this._AreaElement(p+c,u+c),h=n[t*e.size*m+d*m+0],x=n[t*e.size*m+d*m+1],g=n[t*e.size*m+d*m+2];isNaN(h)&&(h=0),isNaN(x)&&(x=0),isNaN(g)&&(g=0),0===e.type&&(h/=255,x/=255,g/=255),e.gammaSpace&&(h=Math.pow((0,r.Clamp)(h),a.ToLinearSpace),x=Math.pow((0,r.Clamp)(x),a.ToLinearSpace),g=Math.pow((0,r.Clamp)(g),a.ToLinearSpace));let E=this.MAX_HDRI_VALUE;if(this.PRESERVE_CLAMPED_COLORS){let e=Math.max(h,x,g);if(e>E){let t=E/e;h*=t,x*=t,g*=t}}else h=(0,r.Clamp)(h,0,E),x=(0,r.Clamp)(x,0,E),g=(0,r.Clamp)(g,0,E);let _=new o.Color3(h,x,g);s.addLight(v,_,S),l+=S,p+=f}u+=f}}let u=4*Math.PI*6/6/l;return s.scaleInPlace(u),s.convertIncidentRadianceToIrradiance(),s.convertIrradianceToLambertianRadiance(),i.SphericalPolynomial.FromHarmonics(s)}}s._FileFaces=[new n("right",new t.Vector3(1,0,0),new t.Vector3(0,0,-1),new t.Vector3(0,-1,0)),new n("left",new t.Vector3(-1,0,0),new t.Vector3(0,0,1),new t.Vector3(0,-1,0)),new n("up",new t.Vector3(0,1,0),new t.Vector3(1,0,0),new t.Vector3(0,0,1)),new n("down",new t.Vector3(0,-1,0),new t.Vector3(1,0,0),new t.Vector3(0,0,-1)),new n("front",new t.Vector3(0,0,1),new t.Vector3(1,0,0),new t.Vector3(0,-1,0)),new n("back",new t.Vector3(0,0,-1),new t.Vector3(-1,0,0),new t.Vector3(0,-1,0))],s.MAX_HDRI_VALUE=4096,s.PRESERVE_CLAMPED_COLORS=!1,e.s(["CubeMapToSphericalPolynomialTools",0,s])},633810,359207,284359,e=>{"use strict";var t=e.i(213361),r=e.i(700183),i=e.i(585430),a=e.i(509629),o=e.i(489899),n=e.i(328028),s=e.i(14994),l=e.i(667067),f=e.i(866493);function c(e){let t=e.split("?")[0],r=t.lastIndexOf(".");return r>-1?t.substring(r).toLowerCase():""}function d(e){return e.charCodeAt(0)+(e.charCodeAt(1)<<8)+(e.charCodeAt(2)<<16)+(e.charCodeAt(3)<<24)}e.s(["GetExtensionFromUrl",0,c],359207),l.AbstractEngine.prototype._partialLoadFile=function(e,t,r,i,a=null){this._loadFile(e,e=>{r[t]=e,r._internalCount++,6===r._internalCount&&i(r)},void 0,void 0,!0,(e,t)=>{a&&e&&a(e.status+" "+e.statusText,t)})},l.AbstractEngine.prototype._cascadeLoadFiles=function(e,t,r,i=null){let a=[];a._internalCount=0;for(let e=0;e<6;e++)this._partialLoadFile(r[e],e,a,t,i)},l.AbstractEngine.prototype._cascadeLoadImgs=function(e,t,r,i,a=null,o){let n=[];n._internalCount=0;for(let s=0;s<6;s++)this._partialLoadImg(i[s],s,n,e,t,r,a,o)},l.AbstractEngine.prototype._partialLoadImg=function(e,t,r,i,a,o,l=null,f){let c=(0,s.RandomGUID)();(0,n.LoadImage)(e,e=>{r[t]=e,r._internalCount++,i&&i.removePendingData(c),6===r._internalCount&&o&&o(a,r)},(e,t)=>{i&&i.removePendingData(c),l&&l(e,t)},i?i.offlineProvider:null,f),i&&i.addPendingData(c)},l.AbstractEngine.prototype.createCubeTextureBase=function(e,t,i,a,n=null,s=null,l,d=null,u=!1,m=0,p=0,v=null,S=null,h=null,x=!1,g=null){let E=v||new o.InternalTexture(this,7);E.isCube=!0,E.url=e,E.generateMipMaps=!a,E._lodGenerationScale=m,E._lodGenerationOffset=p,E._useSRGBBuffer=!!x&&this._caps.supportSRGBBuffers&&(this.version>1||this.isWebGPU||!!a),E!==v&&(E.label=e.substring(0,60)),this._doNotHandleContextLost||(E._extension=d,E._files=i,E._buffer=g);let _=e;this._transformTextureUrl&&!v&&(e=this._transformTextureUrl(e));let I=d??c(e),T=(0,f._GetCompatibleTextureLoader)(I),C=(e,t)=>{E.dispose(),s?s(e,t):e&&r.Logger.Warn(e)},A=(o,s)=>{e===_?o&&C(o.status+" "+o.statusText,s):(r.Logger.Warn(`Failed to load ${e}, falling back to the ${_}`),this.createCubeTextureBase(_,t,i,!!a,n,C,l,d,u,m,p,E,S,h,x,g))};if(T)T.then(r=>{let a=e=>{S&&S(E,e),r.loadCubeData(e,E,u,n,(e,t)=>{C(e,t)})};g?a(g):i&&6===i.length?r.supportCascades?this._cascadeLoadFiles(t,e=>a(e.map(e=>new Uint8Array(e))),i,C):C("Textures type does not support cascades."):this._loadFile(e,e=>a(new Uint8Array(e)),void 0,t?t.offlineProvider||null:void 0,!0,A)});else{if(!i||0===i.length)throw Error("Cannot load cubemap because files were not defined, or the correct loader was not found.");this._cascadeLoadImgs(t,E,(e,t)=>{h&&h(e,t)},i,C)}return this._internalTexturesCache.push(E),E},e.s([],284359);let u=d("DXT1"),m=d("DXT3"),p=d("DXT5"),v=d("DX10");class S{static GetDDSInfo(e){let t=new Int32Array(e.buffer,e.byteOffset,31),r=new Int32Array(e.buffer,e.byteOffset,35),i=1;131072&t[2]&&(i=Math.max(1,t[7]));let a=t[21],o=a===v?r[32]:0,n=0;switch(a){case 113:n=2;break;case 116:n=1;break;case v:if(10===o){n=2;break}2===o&&(n=1)}return{width:t[4],height:t[3],mipmapCount:i,isFourCC:(4&t[20])==4,isRGB:(64&t[20])==64,isLuminance:(131072&t[20])==131072,isCube:(512&t[28])==512,isCompressed:a===u||a===m||a===p,dxgiFormat:o,textureType:n}}static _GetHalfFloatAsFloatRGBAArrayBuffer(e,t,r,i,o,n){let s=new Float32Array(i),l=new Uint16Array(o,r),f=0;for(let r=0;r<t;r++)for(let t=0;t<e;t++){let i=(t+r*e)*4;s[f]=(0,a.FromHalfFloat)(l[i]),s[f+1]=(0,a.FromHalfFloat)(l[i+1]),s[f+2]=(0,a.FromHalfFloat)(l[i+2]),S.StoreLODInAlphaChannel?s[f+3]=n:s[f+3]=(0,a.FromHalfFloat)(l[i+3]),f+=4}return s}static _GetHalfFloatRGBAArrayBuffer(e,t,r,i,o,n){if(S.StoreLODInAlphaChannel){let s=new Uint16Array(i),l=new Uint16Array(o,r),f=0;for(let r=0;r<t;r++)for(let t=0;t<e;t++){let i=(t+r*e)*4;s[f]=l[i],s[f+1]=l[i+1],s[f+2]=l[i+2],s[f+3]=(0,a.ToHalfFloat)(n),f+=4}return s}return new Uint16Array(o,r,i)}static _GetFloatRGBAArrayBuffer(e,t,r,i,a,o){if(S.StoreLODInAlphaChannel){let n=new Float32Array(i),s=new Float32Array(a,r),l=0;for(let r=0;r<t;r++)for(let t=0;t<e;t++){let i=(t+r*e)*4;n[l]=s[i],n[l+1]=s[i+1],n[l+2]=s[i+2],n[l+3]=o,l+=4}return n}return new Float32Array(a,r,i)}static _GetFloatAsHalfFloatRGBAArrayBuffer(e,t,r,i,o,n){let s=new Uint16Array(i),l=new Float32Array(o,r),f=0;for(let r=0;r<t;r++)for(let t=0;t<e;t++)s[f]=(0,a.ToHalfFloat)(l[f]),s[f+1]=(0,a.ToHalfFloat)(l[f+1]),s[f+2]=(0,a.ToHalfFloat)(l[f+2]),S.StoreLODInAlphaChannel?s[f+3]=(0,a.ToHalfFloat)(n):s[f+3]=(0,a.ToHalfFloat)(l[f+3]),f+=4;return s}static _GetFloatAsUIntRGBAArrayBuffer(e,r,i,a,o,n){let s=new Uint8Array(a),l=new Float32Array(o,i),f=0;for(let i=0;i<r;i++)for(let r=0;r<e;r++){let a=(r+i*e)*4;s[f]=255*(0,t.Clamp)(l[a]),s[f+1]=255*(0,t.Clamp)(l[a+1]),s[f+2]=255*(0,t.Clamp)(l[a+2]),S.StoreLODInAlphaChannel?s[f+3]=n:s[f+3]=255*(0,t.Clamp)(l[a+3]),f+=4}return s}static _GetHalfFloatAsUIntRGBAArrayBuffer(e,r,i,o,n,s){let l=new Uint8Array(o),f=new Uint16Array(n,i),c=0;for(let i=0;i<r;i++)for(let r=0;r<e;r++){let o=(r+i*e)*4;l[c]=255*(0,t.Clamp)((0,a.FromHalfFloat)(f[o])),l[c+1]=255*(0,t.Clamp)((0,a.FromHalfFloat)(f[o+1])),l[c+2]=255*(0,t.Clamp)((0,a.FromHalfFloat)(f[o+2])),S.StoreLODInAlphaChannel?l[c+3]=s:l[c+3]=255*(0,t.Clamp)((0,a.FromHalfFloat)(f[o+3])),c+=4}return l}static _GetRGBAArrayBuffer(e,t,r,i,a,o,n,s,l){let f=new Uint8Array(i),c=new Uint8Array(a,r),d=0;for(let r=0;r<t;r++)for(let t=0;t<e;t++){let i=(t+r*e)*4;f[d]=c[i+o],f[d+1]=c[i+n],f[d+2]=c[i+s],f[d+3]=c[i+l],d+=4}return f}static _ExtractLongWordOrder(e){return 0===e||255===e||-0x1000000===e?0:1+S._ExtractLongWordOrder(e>>8)}static _GetRGBArrayBuffer(e,t,r,i,a,o,n,s){let l=new Uint8Array(i),f=new Uint8Array(a,r),c=0;for(let r=0;r<t;r++)for(let t=0;t<e;t++){let i=(t+r*e)*3;l[c]=f[i+o],l[c+1]=f[i+n],l[c+2]=f[i+s],c+=3}return l}static _GetLuminanceArrayBuffer(e,t,r,i,a){let o=new Uint8Array(i),n=new Uint8Array(a,r),s=0;for(let r=0;r<t;r++)for(let t=0;t<e;t++){let i=t+r*e;o[s]=n[i],s++}return o}static UploadDDSLevels(e,t,a,o,n,s,l=-1,f,c=!0){let d,h,x,g=null;o.sphericalPolynomial&&(g=[]);let E=!!e.getCaps().s3tc;t.generateMipMaps=n;let _=new Int32Array(a.buffer,a.byteOffset,31),I,T,C,A=0,N,R=0,D=1;if(0x20534444!==_[0])return void r.Logger.Error("Invalid magic number in DDS header");if(!o.isFourCC&&!o.isRGB&&!o.isLuminance)return void r.Logger.Error("Unsupported format, must contain a FourCC, RGB or LUMINANCE code");if(o.isCompressed&&!E)return void r.Logger.Error("Compressed textures are not supported on this platform.");let M=_[22];N=_[1]+4;let P=!1;if(o.isFourCC)switch(I=_[21]){case u:D=8,R=33777;break;case m:D=16,R=33778;break;case p:D=16,R=33779;break;case 113:P=!0,M=64;break;case 116:P=!0,M=128;break;case v:{N+=20;let e=!1;switch(o.dxgiFormat){case 10:P=!0,M=64,e=!0;break;case 2:P=!0,M=128,e=!0;break;case 88:o.isRGB=!0,o.isFourCC=!1,M=32,e=!0}if(e)break}default:r.Logger.Error(["Unsupported FourCC code:",String.fromCharCode(255&I,I>>8&255,I>>16&255,I>>24&255)]);return}let y=S._ExtractLongWordOrder(_[23]),O=S._ExtractLongWordOrder(_[24]),F=S._ExtractLongWordOrder(_[25]),b=S._ExtractLongWordOrder(_[26]);P&&(R=e._getRGBABufferInternalSizedFormat(o.textureType)),h=1,131072&_[2]&&!1!==n&&(h=Math.max(1,_[7]));let L=f||0,V=e.getCaps();for(let r=L;r<s;r++){for(x=0,T=_[4],C=_[3];x<h;++x){if(-1===l||l===x){let i=-1===l?x:0;if(!o.isCompressed&&o.isFourCC){t.format=5,A=T*C*4;let o=null;if(e._badOS||e._badDesktopOS||!V.textureHalfFloat&&!V.textureFloat)128===M?(o=S._GetFloatAsUIntRGBAArrayBuffer(T,C,a.byteOffset+N,A,a.buffer,i),g&&0==i&&g.push(S._GetFloatRGBAArrayBuffer(T,C,a.byteOffset+N,A,a.buffer,i))):64===M&&(o=S._GetHalfFloatAsUIntRGBAArrayBuffer(T,C,a.byteOffset+N,A,a.buffer,i),g&&0==i&&g.push(S._GetHalfFloatAsFloatRGBAArrayBuffer(T,C,a.byteOffset+N,A,a.buffer,i))),t.type=0;else{let e,r=V.textureFloat&&(c&&V.textureFloatLinearFiltering||!c),n=V.textureHalfFloat&&(c&&V.textureHalfFloatLinearFiltering||!c),s=(128===M||64===M&&!n)&&r?1:(64===M||128===M&&!r)&&n?2:0,l=null;if(128===M)switch(s){case 1:e=S._GetFloatRGBAArrayBuffer,l=null;break;case 2:e=S._GetFloatAsHalfFloatRGBAArrayBuffer,l=S._GetFloatRGBAArrayBuffer;break;case 0:e=S._GetFloatAsUIntRGBAArrayBuffer,l=S._GetFloatRGBAArrayBuffer}else switch(s){case 1:e=S._GetHalfFloatAsFloatRGBAArrayBuffer,l=null;break;case 2:e=S._GetHalfFloatRGBAArrayBuffer,l=S._GetHalfFloatAsFloatRGBAArrayBuffer;break;case 0:e=S._GetHalfFloatAsUIntRGBAArrayBuffer,l=S._GetHalfFloatAsFloatRGBAArrayBuffer}t.type=s,o=e(T,C,a.byteOffset+N,A,a.buffer,i),g&&0==i&&g.push(l?l(T,C,a.byteOffset+N,A,a.buffer,i):o)}o&&e._uploadDataToTextureDirectly(t,o,r,i)}else if(o.isRGB)t.type=0,24===M?(t.format=4,A=T*C*3,d=S._GetRGBArrayBuffer(T,C,a.byteOffset+N,A,a.buffer,y,O,F)):(t.format=5,A=T*C*4,d=S._GetRGBAArrayBuffer(T,C,a.byteOffset+N,A,a.buffer,y,O,F,b)),e._uploadDataToTextureDirectly(t,d,r,i);else if(o.isLuminance){let o=e._getUnpackAlignement(),n=T;A=Math.floor((T+o-1)/o)*o*(C-1)+n,d=S._GetLuminanceArrayBuffer(T,C,a.byteOffset+N,A,a.buffer),t.format=1,t.type=0,e._uploadDataToTextureDirectly(t,d,r,i)}else A=Math.max(4,T)/4*Math.max(4,C)/4*D,d=new Uint8Array(a.buffer,a.byteOffset+N,A),t.type=0,e._uploadCompressedDataToTextureDirectly(t,R,T,C,d,r,i)}N+=M?T*C*(M/8):A,T*=.5,C*=.5,T=Math.max(1,T),C=Math.max(1,C)}if(void 0!==f)break}g&&g.length>0?o.sphericalPolynomial=i.CubeMapToSphericalPolynomialTools.ConvertCubeMapToSphericalPolynomial({size:_[4],right:g[0],left:g[1],up:g[2],down:g[3],front:g[4],back:g[5],format:5,type:1,gammaSpace:!1}):o.sphericalPolynomial=void 0}}S.StoreLODInAlphaChannel=!1,e.s(["DDSTools",0,S],633810)},306273,e=>{"use strict";var t=e.i(90341),r=e.i(633810);e.s(["_DDSTextureLoader",0,class{constructor(){this.supportCascades=!0}loadCubeData(e,i,a,o){let n,s=i.getEngine(),l=!1,f=1e3;if(Array.isArray(e))for(let t=0;t<e.length;t++){let a=e[t];i.width=(n=r.DDSTools.GetDDSInfo(a)).width,i.height=n.height,l=(n.isRGB||n.isLuminance||n.mipmapCount>1)&&i.generateMipMaps,s._unpackFlipY(n.isCompressed),r.DDSTools.UploadDDSLevels(s,i,a,n,l,6,-1,t),n.isFourCC||1!==n.mipmapCount?f=n.mipmapCount-1:s.generateMipMapsForCubemap(i)}else i.width=(n=r.DDSTools.GetDDSInfo(e)).width,i.height=n.height,a&&(n.sphericalPolynomial=new t.SphericalPolynomial),l=(n.isRGB||n.isLuminance||n.mipmapCount>1)&&i.generateMipMaps,s._unpackFlipY(n.isCompressed),r.DDSTools.UploadDDSLevels(s,i,e,n,l,6),n.isFourCC||1!==n.mipmapCount?f=n.mipmapCount-1:s.generateMipMapsForCubemap(i,!1);s._setCubeMapTextureParams(i,l,f),i.isReady=!0,i.onLoadedObservable.notifyObservers(i),i.onLoadedObservable.clear(),o&&o({isDDS:!0,width:i.width,info:n,data:e,texture:i})}loadData(e,t,i){let a=r.DDSTools.GetDDSInfo(e),o=(a.isRGB||a.isLuminance||a.mipmapCount>1)&&t.generateMipMaps&&Math.max(a.width,a.height)>>a.mipmapCount-1==1;i(a.width,a.height,o,a.isFourCC,()=>{r.DDSTools.UploadDDSLevels(t.getEngine(),t,e,a,o,1)})}}])},4118,e=>{"use strict";var t=e.i(263537);e.i(861230);let r="pbrVertexDeclaration",i=`uniform mat4 view;uniform mat4 viewProjection;uniform vec4 vEyePosition;
#ifdef MULTIVIEW
mat4 viewProjectionR;
#endif
#ifdef ALBEDO
uniform mat4 albedoMatrix;uniform vec2 vAlbedoInfos;
#endif
#ifdef BASE_WEIGHT
uniform mat4 baseWeightMatrix;uniform vec2 vBaseWeightInfos;
#endif
uniform float baseDiffuseRoughness;
#ifdef BASE_DIFFUSE_ROUGHNESS
uniform mat4 baseDiffuseRoughnessMatrix;uniform vec2 vBaseDiffuseRoughnessInfos;
#endif
#ifdef AMBIENT
uniform mat4 ambientMatrix;uniform vec4 vAmbientInfos;
#endif
#ifdef OPACITY
uniform mat4 opacityMatrix;uniform vec2 vOpacityInfos;
#endif
#ifdef EMISSIVE
uniform vec2 vEmissiveInfos;uniform mat4 emissiveMatrix;
#endif
#ifdef LIGHTMAP
uniform vec2 vLightmapInfos;uniform mat4 lightmapMatrix;
#endif
#ifdef REFLECTIVITY
uniform vec3 vReflectivityInfos;uniform mat4 reflectivityMatrix;
#endif
#ifdef METALLIC_REFLECTANCE
uniform vec2 vMetallicReflectanceInfos;uniform mat4 metallicReflectanceMatrix;
#endif
#ifdef REFLECTANCE
uniform vec2 vReflectanceInfos;uniform mat4 reflectanceMatrix;
#endif
#ifdef MICROSURFACEMAP
uniform vec2 vMicroSurfaceSamplerInfos;uniform mat4 microSurfaceSamplerMatrix;
#endif
#ifdef BUMP
uniform vec3 vBumpInfos;uniform mat4 bumpMatrix;
#endif
#ifdef POINTSIZE
uniform float pointSize;
#endif
uniform vec4 cameraInfo;
#ifdef REFLECTION
uniform vec2 vReflectionInfos;uniform mat4 reflectionMatrix;
#endif
#ifdef CLEARCOAT
#if defined(CLEARCOAT_TEXTURE) || defined(CLEARCOAT_TEXTURE_ROUGHNESS)
uniform vec4 vClearCoatInfos;
#endif
#ifdef CLEARCOAT_TEXTURE
uniform mat4 clearCoatMatrix;
#endif
#ifdef CLEARCOAT_TEXTURE_ROUGHNESS
uniform mat4 clearCoatRoughnessMatrix;
#endif
#ifdef CLEARCOAT_BUMP
uniform vec2 vClearCoatBumpInfos;uniform mat4 clearCoatBumpMatrix;
#endif
#ifdef CLEARCOAT_TINT_TEXTURE
uniform vec2 vClearCoatTintInfos;uniform mat4 clearCoatTintMatrix;
#endif
#endif
#ifdef IRIDESCENCE
#if defined(IRIDESCENCE_TEXTURE) || defined(IRIDESCENCE_THICKNESS_TEXTURE)
uniform vec4 vIridescenceInfos;
#endif
#ifdef IRIDESCENCE_TEXTURE
uniform mat4 iridescenceMatrix;
#endif
#ifdef IRIDESCENCE_THICKNESS_TEXTURE
uniform mat4 iridescenceThicknessMatrix;
#endif
#endif
#ifdef ANISOTROPIC
#ifdef ANISOTROPIC_TEXTURE
uniform vec2 vAnisotropyInfos;uniform mat4 anisotropyMatrix;
#endif
#endif
#ifdef SHEEN
#if defined(SHEEN_TEXTURE) || defined(SHEEN_TEXTURE_ROUGHNESS)
uniform vec4 vSheenInfos;
#endif
#ifdef SHEEN_TEXTURE
uniform mat4 sheenMatrix;
#endif
#ifdef SHEEN_TEXTURE_ROUGHNESS
uniform mat4 sheenRoughnessMatrix;
#endif
#endif
#ifdef SUBSURFACE
#ifdef SS_REFRACTION
uniform vec4 vRefractionInfos;uniform mat4 refractionMatrix;
#endif
#ifdef SS_THICKNESSANDMASK_TEXTURE
uniform vec2 vThicknessInfos;uniform mat4 thicknessMatrix;
#endif
#ifdef SS_REFRACTIONINTENSITY_TEXTURE
uniform vec2 vRefractionIntensityInfos;uniform mat4 refractionIntensityMatrix;
#endif
#ifdef SS_TRANSLUCENCYINTENSITY_TEXTURE
uniform vec2 vTranslucencyIntensityInfos;uniform mat4 translucencyIntensityMatrix;
#endif
#ifdef SS_TRANSLUCENCYCOLOR_TEXTURE
uniform vec2 vTranslucencyColorInfos;uniform mat4 translucencyColorMatrix;
#endif
#endif
#ifdef NORMAL
#if defined(USESPHERICALFROMREFLECTIONMAP) && defined(USESPHERICALINVERTEX)
#ifdef USESPHERICALFROMREFLECTIONMAP
#ifdef SPHERICAL_HARMONICS
uniform vec3 vSphericalL00;uniform vec3 vSphericalL1_1;uniform vec3 vSphericalL10;uniform vec3 vSphericalL11;uniform vec3 vSphericalL2_2;uniform vec3 vSphericalL2_1;uniform vec3 vSphericalL20;uniform vec3 vSphericalL21;uniform vec3 vSphericalL22;
#else
uniform vec3 vSphericalX;uniform vec3 vSphericalY;uniform vec3 vSphericalZ;uniform vec3 vSphericalXX_ZZ;uniform vec3 vSphericalYY_ZZ;uniform vec3 vSphericalZZ;uniform vec3 vSphericalXY;uniform vec3 vSphericalYZ;uniform vec3 vSphericalZX;
#endif
#endif
#endif
#endif
#ifdef DETAIL
uniform vec4 vDetailInfos;uniform mat4 detailMatrix;
#endif
#include<decalVertexDeclaration>
#define ADDITIONAL_VERTEX_DECLARATION
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.i(835189),e.i(816086),e.i(654740),e.i(201632),e.i(424192),e.i(624154),e.i(568039),e.i(880779),e.i(561967),e.i(491476),e.i(241326),e.i(983789),e.i(182478),e.i(30653),e.i(957479),e.i(889952),e.i(298378),e.i(369136),e.i(127010),e.i(675406),e.i(610460),e.i(587630),e.i(761523),e.i(479126),e.i(46566),e.i(591573),e.i(631130),e.i(443018),e.i(781801),e.i(313976),e.i(294715),e.i(146259),e.i(94556);let a="pbrVertexShader",o=`#define PBR_VERTEX_SHADER
#define CUSTOM_VERTEX_EXTENSION
precision highp float;
#include<__decl__pbrVertex>
#define CUSTOM_VERTEX_BEGIN
attribute vec3 position;
#ifdef NORMAL
attribute vec3 normal;
#endif
#ifdef TANGENT
attribute vec4 tangent;
#endif
#ifdef UV1
attribute vec2 uv;
#endif
#include<uvAttributeDeclaration>[2..7]
#include<mainUVVaryingDeclaration>[1..7]
#ifdef VERTEXCOLOR
attribute vec4 color;
#endif
#include<helperFunctions>
#include<pbrBRDFFunctions>
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<instancesDeclaration>
#include<prePassVertexDeclaration>
#include<samplerVertexDeclaration>(_DEFINENAME_,ALBEDO,_VARYINGNAME_,Albedo)
#include<samplerVertexDeclaration>(_DEFINENAME_,BASE_WEIGHT,_VARYINGNAME_,BaseWeight)
#include<samplerVertexDeclaration>(_DEFINENAME_,BASE_DIFFUSE_ROUGHNESS,_VARYINGNAME_,BaseDiffuseRoughness)
#include<samplerVertexDeclaration>(_DEFINENAME_,DETAIL,_VARYINGNAME_,Detail)
#include<samplerVertexDeclaration>(_DEFINENAME_,AMBIENT,_VARYINGNAME_,Ambient)
#include<samplerVertexDeclaration>(_DEFINENAME_,OPACITY,_VARYINGNAME_,Opacity)
#include<samplerVertexDeclaration>(_DEFINENAME_,EMISSIVE,_VARYINGNAME_,Emissive)
#include<samplerVertexDeclaration>(_DEFINENAME_,LIGHTMAP,_VARYINGNAME_,Lightmap)
#include<samplerVertexDeclaration>(_DEFINENAME_,REFLECTIVITY,_VARYINGNAME_,Reflectivity)
#include<samplerVertexDeclaration>(_DEFINENAME_,MICROSURFACEMAP,_VARYINGNAME_,MicroSurfaceSampler)
#include<samplerVertexDeclaration>(_DEFINENAME_,METALLIC_REFLECTANCE,_VARYINGNAME_,MetallicReflectance)
#include<samplerVertexDeclaration>(_DEFINENAME_,REFLECTANCE,_VARYINGNAME_,Reflectance)
#include<samplerVertexDeclaration>(_DEFINENAME_,BUMP,_VARYINGNAME_,Bump)
#include<samplerVertexDeclaration>(_DEFINENAME_,DECAL,_VARYINGNAME_,Decal)
#ifdef CLEARCOAT
#include<samplerVertexDeclaration>(_DEFINENAME_,CLEARCOAT_TEXTURE,_VARYINGNAME_,ClearCoat)
#include<samplerVertexDeclaration>(_DEFINENAME_,CLEARCOAT_TEXTURE_ROUGHNESS,_VARYINGNAME_,ClearCoatRoughness)
#include<samplerVertexDeclaration>(_DEFINENAME_,CLEARCOAT_BUMP,_VARYINGNAME_,ClearCoatBump)
#include<samplerVertexDeclaration>(_DEFINENAME_,CLEARCOAT_TINT_TEXTURE,_VARYINGNAME_,ClearCoatTint)
#endif
#ifdef IRIDESCENCE
#include<samplerVertexDeclaration>(_DEFINENAME_,IRIDESCENCE_TEXTURE,_VARYINGNAME_,Iridescence)
#include<samplerVertexDeclaration>(_DEFINENAME_,IRIDESCENCE_THICKNESS_TEXTURE,_VARYINGNAME_,IridescenceThickness)
#endif
#ifdef SHEEN
#include<samplerVertexDeclaration>(_DEFINENAME_,SHEEN_TEXTURE,_VARYINGNAME_,Sheen)
#include<samplerVertexDeclaration>(_DEFINENAME_,SHEEN_TEXTURE_ROUGHNESS,_VARYINGNAME_,SheenRoughness)
#endif
#ifdef ANISOTROPIC
#include<samplerVertexDeclaration>(_DEFINENAME_,ANISOTROPIC_TEXTURE,_VARYINGNAME_,Anisotropy)
#endif
#ifdef SUBSURFACE
#include<samplerVertexDeclaration>(_DEFINENAME_,SS_THICKNESSANDMASK_TEXTURE,_VARYINGNAME_,Thickness)
#include<samplerVertexDeclaration>(_DEFINENAME_,SS_REFRACTIONINTENSITY_TEXTURE,_VARYINGNAME_,RefractionIntensity)
#include<samplerVertexDeclaration>(_DEFINENAME_,SS_TRANSLUCENCYINTENSITY_TEXTURE,_VARYINGNAME_,TranslucencyIntensity)
#include<samplerVertexDeclaration>(_DEFINENAME_,SS_TRANSLUCENCYCOLOR_TEXTURE,_VARYINGNAME_,TranslucencyColor)
#endif
varying vec3 vPositionW;
#if DEBUGMODE>0
varying vec4 vClipSpacePosition;
#endif
#ifdef NORMAL
varying vec3 vNormalW;
#if defined(USESPHERICALFROMREFLECTIONMAP) && defined(USESPHERICALINVERTEX)
varying vec3 vEnvironmentIrradiance;
#include<harmonicsFunctions>
#endif
#endif
#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
varying vec4 vColor;
#endif
#include<bumpVertexDeclaration>
#include<clipPlaneVertexDeclaration>
#include<fogVertexDeclaration>
#include<__decl__lightVxFragment>[0..maxSimultaneousLights]
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]
#ifdef REFLECTIONMAP_SKYBOX
varying vec3 vPositionUVW;
#endif
#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)
varying vec3 vDirectionW;
#endif
#if defined(CLUSTLIGHT_BATCH) && CLUSTLIGHT_BATCH>0
varying float vViewDepth;
#endif
#include<logDepthDeclaration>
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
vec3 positionUpdated=position;
#ifdef NORMAL
vec3 normalUpdated=normal;
#endif
#ifdef TANGENT
vec4 tangentUpdated=tangent;
#endif
#ifdef UV1
vec2 uvUpdated=uv;
#endif
#ifdef UV2
vec2 uv2Updated=uv2;
#endif
#ifdef VERTEXCOLOR
vec4 colorUpdated=color;
#endif
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
#ifdef REFLECTIONMAP_SKYBOX
vPositionUVW=positionUpdated;
#endif
#define CUSTOM_VERTEX_UPDATE_POSITION
#define CUSTOM_VERTEX_UPDATE_NORMAL
#include<instancesVertex>
#if defined(PREPASS) && ((defined(PREPASS_VELOCITY) || defined(PREPASS_VELOCITY_LINEAR)) && !defined(BONES_VELOCITY_ENABLED)
vCurrentPosition=viewProjection*finalWorld*vec4(positionUpdated,1.0);vPreviousPosition=previousViewProjection*finalPreviousWorld*vec4(positionUpdated,1.0);
#endif
#include<bonesVertex>
#include<bakedVertexAnimation>
vec4 worldPos=finalWorld*vec4(positionUpdated,1.0);vPositionW=vec3(worldPos);
#ifdef PREPASS
#include<prePassVertex>
#endif
#ifdef NORMAL
mat3 normalWorld=mat3(finalWorld);
#if defined(INSTANCES) && defined(THIN_INSTANCES)
vNormalW=normalUpdated/vec3(dot(normalWorld[0],normalWorld[0]),dot(normalWorld[1],normalWorld[1]),dot(normalWorld[2],normalWorld[2]));vNormalW=normalize(normalWorld*vNormalW);
#else
#ifdef NONUNIFORMSCALING
normalWorld=transposeMat3(inverseMat3(normalWorld));
#endif
vNormalW=normalize(normalWorld*normalUpdated);
#endif
#if defined(USESPHERICALFROMREFLECTIONMAP) && defined(USESPHERICALINVERTEX)
#if BASE_DIFFUSE_MODEL != BRDF_DIFFUSE_MODEL_LAMBERT && BASE_DIFFUSE_MODEL != BRDF_DIFFUSE_MODEL_LEGACY
vec3 viewDirectionW=normalize(vEyePosition.xyz-vPositionW);float NdotV=max(dot(vNormalW,viewDirectionW),0.0);vec3 roughNormal=mix(vNormalW,viewDirectionW,(0.5*(1.0-NdotV))*baseDiffuseRoughness);vec3 reflectionVector=vec3(reflectionMatrix*vec4(roughNormal,0)).xyz;
#else
vec3 reflectionVector=vec3(reflectionMatrix*vec4(vNormalW,0)).xyz;
#endif
#ifdef REFLECTIONMAP_OPPOSITEZ
reflectionVector.z*=-1.0;
#endif
vEnvironmentIrradiance=computeEnvironmentIrradiance(reflectionVector);
#endif
#endif
#define CUSTOM_VERTEX_UPDATE_WORLDPOS
#ifdef MULTIVIEW
if (gl_ViewID_OVR==0u) {gl_Position=viewProjection*worldPos;} else {gl_Position=viewProjectionR*worldPos;}
#else
gl_Position=viewProjection*worldPos;
#endif
#if DEBUGMODE>0
vClipSpacePosition=gl_Position;
#endif
#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)
vDirectionW=normalize(vec3(finalWorld*vec4(positionUpdated,0.0)));
#endif
#if defined(CLUSTLIGHT_BATCH) && CLUSTLIGHT_BATCH>0
#ifdef RIGHT_HANDED
vViewDepth=-(view*worldPos).z;
#else
vViewDepth=(view*worldPos).z;
#endif
#endif
#ifndef UV1
vec2 uvUpdated=vec2(0.,0.);
#endif
#ifndef UV2
vec2 uv2Updated=vec2(0.,0.);
#endif
#ifdef MAINUV1
vMainUV1=uvUpdated;
#endif
#ifdef MAINUV2
vMainUV2=uv2Updated;
#endif
#include<uvVariableDeclaration>[3..7]
#include<samplerVertexImplementation>(_DEFINENAME_,ALBEDO,_VARYINGNAME_,Albedo,_MATRIXNAME_,albedo,_INFONAME_,AlbedoInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,BASE_WEIGHT,_VARYINGNAME_,BaseWeight,_MATRIXNAME_,baseWeight,_INFONAME_,BaseWeightInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,BASE_DIFFUSE_ROUGHNESS,_VARYINGNAME_,BaseDiffuseRoughness,_MATRIXNAME_,baseDiffuseRoughness,_INFONAME_,BaseDiffuseRoughnessInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,DETAIL,_VARYINGNAME_,Detail,_MATRIXNAME_,detail,_INFONAME_,DetailInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,AMBIENT,_VARYINGNAME_,Ambient,_MATRIXNAME_,ambient,_INFONAME_,AmbientInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,OPACITY,_VARYINGNAME_,Opacity,_MATRIXNAME_,opacity,_INFONAME_,OpacityInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,EMISSIVE,_VARYINGNAME_,Emissive,_MATRIXNAME_,emissive,_INFONAME_,EmissiveInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,LIGHTMAP,_VARYINGNAME_,Lightmap,_MATRIXNAME_,lightmap,_INFONAME_,LightmapInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,REFLECTIVITY,_VARYINGNAME_,Reflectivity,_MATRIXNAME_,reflectivity,_INFONAME_,ReflectivityInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,MICROSURFACEMAP,_VARYINGNAME_,MicroSurfaceSampler,_MATRIXNAME_,microSurfaceSampler,_INFONAME_,MicroSurfaceSamplerInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,METALLIC_REFLECTANCE,_VARYINGNAME_,MetallicReflectance,_MATRIXNAME_,metallicReflectance,_INFONAME_,MetallicReflectanceInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,REFLECTANCE,_VARYINGNAME_,Reflectance,_MATRIXNAME_,reflectance,_INFONAME_,ReflectanceInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,BUMP,_VARYINGNAME_,Bump,_MATRIXNAME_,bump,_INFONAME_,BumpInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,DECAL,_VARYINGNAME_,Decal,_MATRIXNAME_,decal,_INFONAME_,DecalInfos.x)
#ifdef CLEARCOAT
#include<samplerVertexImplementation>(_DEFINENAME_,CLEARCOAT_TEXTURE,_VARYINGNAME_,ClearCoat,_MATRIXNAME_,clearCoat,_INFONAME_,ClearCoatInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,CLEARCOAT_TEXTURE_ROUGHNESS,_VARYINGNAME_,ClearCoatRoughness,_MATRIXNAME_,clearCoatRoughness,_INFONAME_,ClearCoatInfos.z)
#include<samplerVertexImplementation>(_DEFINENAME_,CLEARCOAT_BUMP,_VARYINGNAME_,ClearCoatBump,_MATRIXNAME_,clearCoatBump,_INFONAME_,ClearCoatBumpInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,CLEARCOAT_TINT_TEXTURE,_VARYINGNAME_,ClearCoatTint,_MATRIXNAME_,clearCoatTint,_INFONAME_,ClearCoatTintInfos.x)
#endif
#ifdef IRIDESCENCE
#include<samplerVertexImplementation>(_DEFINENAME_,IRIDESCENCE_TEXTURE,_VARYINGNAME_,Iridescence,_MATRIXNAME_,iridescence,_INFONAME_,IridescenceInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,IRIDESCENCE_THICKNESS_TEXTURE,_VARYINGNAME_,IridescenceThickness,_MATRIXNAME_,iridescenceThickness,_INFONAME_,IridescenceInfos.z)
#endif
#ifdef SHEEN
#include<samplerVertexImplementation>(_DEFINENAME_,SHEEN_TEXTURE,_VARYINGNAME_,Sheen,_MATRIXNAME_,sheen,_INFONAME_,SheenInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,SHEEN_TEXTURE_ROUGHNESS,_VARYINGNAME_,SheenRoughness,_MATRIXNAME_,sheenRoughness,_INFONAME_,SheenInfos.z)
#endif
#ifdef ANISOTROPIC
#include<samplerVertexImplementation>(_DEFINENAME_,ANISOTROPIC_TEXTURE,_VARYINGNAME_,Anisotropy,_MATRIXNAME_,anisotropy,_INFONAME_,AnisotropyInfos.x)
#endif
#ifdef SUBSURFACE
#include<samplerVertexImplementation>(_DEFINENAME_,SS_THICKNESSANDMASK_TEXTURE,_VARYINGNAME_,Thickness,_MATRIXNAME_,thickness,_INFONAME_,ThicknessInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,SS_REFRACTIONINTENSITY_TEXTURE,_VARYINGNAME_,RefractionIntensity,_MATRIXNAME_,refractionIntensity,_INFONAME_,RefractionIntensityInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,SS_TRANSLUCENCYINTENSITY_TEXTURE,_VARYINGNAME_,TranslucencyIntensity,_MATRIXNAME_,translucencyIntensity,_INFONAME_,TranslucencyIntensityInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,SS_TRANSLUCENCYCOLOR_TEXTURE,_VARYINGNAME_,TranslucencyColor,_MATRIXNAME_,translucencyColor,_INFONAME_,TranslucencyColorInfos.x)
#endif
#include<bumpVertex>
#include<clipPlaneVertex>
#include<fogVertex>
#include<shadowsVertex>[0..maxSimultaneousLights]
#include<vertexColorMixing>
#if defined(POINTSIZE) && !defined(WEBGPU)
gl_PointSize=pointSize;
#endif
#include<logDepthVertex>
#define CUSTOM_VERTEX_MAIN_END
}
`;t.ShaderStore.ShadersStore[a]||(t.ShaderStore.ShadersStore[a]=o),e.s(["pbrVertexShader",0,{name:a,shader:o}],4118)},835189,e=>{"use strict";var t=e.i(263537);e.i(629238),e.i(997900);let r="pbrUboDeclaration",i=`layout(std140,column_major) uniform;uniform Material {vec2 vAlbedoInfos;vec2 vBaseWeightInfos;vec2 vBaseDiffuseRoughnessInfos;vec4 vAmbientInfos;vec2 vOpacityInfos;vec2 vEmissiveInfos;vec2 vLightmapInfos;vec3 vReflectivityInfos;vec2 vMicroSurfaceSamplerInfos;vec3 vBumpInfos;mat4 albedoMatrix;mat4 baseWeightMatrix;mat4 baseDiffuseRoughnessMatrix;mat4 ambientMatrix;mat4 opacityMatrix;mat4 emissiveMatrix;mat4 lightmapMatrix;mat4 reflectivityMatrix;mat4 microSurfaceSamplerMatrix;mat4 bumpMatrix;vec2 vTangentSpaceParams;vec4 vAlbedoColor;float baseWeight;float baseDiffuseRoughness;vec4 vLightingIntensity;float pointSize;vec4 vReflectivityColor;vec3 vEmissiveColor;vec3 vAmbientColor;vec2 vDebugMode;vec4 vMetallicReflectanceFactors;vec2 vMetallicReflectanceInfos;mat4 metallicReflectanceMatrix;vec2 vReflectanceInfos;mat4 reflectanceMatrix;vec4 cameraInfo;vec2 vReflectionInfos;mat4 reflectionMatrix;vec3 vReflectionMicrosurfaceInfos;vec3 vReflectionPosition;vec3 vReflectionSize;vec2 vReflectionFilteringInfo;vec3 vReflectionDominantDirection;vec3 vReflectionColor;vec3 vSphericalL00;vec3 vSphericalL1_1;vec3 vSphericalL10;vec3 vSphericalL11;vec3 vSphericalL2_2;vec3 vSphericalL2_1;vec3 vSphericalL20;vec3 vSphericalL21;vec3 vSphericalL22;vec3 vSphericalX;vec3 vSphericalY;vec3 vSphericalZ;vec3 vSphericalXX_ZZ;vec3 vSphericalYY_ZZ;vec3 vSphericalZZ;vec3 vSphericalXY;vec3 vSphericalYZ;vec3 vSphericalZX;
#define ADDITIONAL_UBO_DECLARATION
};
#include<sceneUboDeclaration>
#include<meshUboDeclaration>
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.s([])},861230,816086,561967,491476,46566,591573,631130,e=>{"use strict";var t=e.i(263537);let r="decalVertexDeclaration",i=`#ifdef DECAL
uniform vec4 vDecalInfos;uniform mat4 decalMatrix;
#endif
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.s([],861230);let a="uvAttributeDeclaration",o=`#ifdef UV{X}
attribute vec2 uv{X};
#endif
`;t.ShaderStore.IncludesShadersStore[a]||(t.ShaderStore.IncludesShadersStore[a]=o),e.s([],816086);let n="prePassVertexDeclaration",s=`#ifdef PREPASS
#ifdef PREPASS_LOCAL_POSITION
varying vec3 vPosition;
#endif
#ifdef PREPASS_DEPTH
varying vec3 vViewPos;
#endif
#ifdef PREPASS_NORMALIZED_VIEW_DEPTH
varying float vNormViewDepth;
#endif
#if defined(PREPASS_VELOCITY) || defined(PREPASS_VELOCITY_LINEAR)
uniform mat4 previousViewProjection;varying vec4 vCurrentPosition;varying vec4 vPreviousPosition;
#endif
#endif
`;t.ShaderStore.IncludesShadersStore[n]||(t.ShaderStore.IncludesShadersStore[n]=s),e.s([],561967);let l="samplerVertexDeclaration",f=`#if defined(_DEFINENAME_) && _DEFINENAME_DIRECTUV==0
varying vec2 v_VARYINGNAME_UV;
#endif
`;t.ShaderStore.IncludesShadersStore[l]||(t.ShaderStore.IncludesShadersStore[l]=f),e.s([],491476);let c="prePassVertex",d=`#ifdef PREPASS_DEPTH
vViewPos=(view*worldPos).rgb;
#endif
#ifdef PREPASS_NORMALIZED_VIEW_DEPTH
vNormViewDepth=((view*worldPos).z-cameraInfo.x)/(cameraInfo.y-cameraInfo.x);
#endif
#ifdef PREPASS_LOCAL_POSITION
vPosition=positionUpdated.xyz;
#endif
#if (defined(PREPASS_VELOCITY) || defined(PREPASS_VELOCITY_LINEAR)) && defined(BONES_VELOCITY_ENABLED)
vCurrentPosition=viewProjection*worldPos;
#if NUM_BONE_INFLUENCERS>0
mat4 previousInfluence;previousInfluence=mPreviousBones[int(matricesIndices[0])]*matricesWeights[0];
#if NUM_BONE_INFLUENCERS>1
previousInfluence+=mPreviousBones[int(matricesIndices[1])]*matricesWeights[1];
#endif 
#if NUM_BONE_INFLUENCERS>2
previousInfluence+=mPreviousBones[int(matricesIndices[2])]*matricesWeights[2];
#endif 
#if NUM_BONE_INFLUENCERS>3
previousInfluence+=mPreviousBones[int(matricesIndices[3])]*matricesWeights[3];
#endif
#if NUM_BONE_INFLUENCERS>4
previousInfluence+=mPreviousBones[int(matricesIndicesExtra[0])]*matricesWeightsExtra[0];
#endif 
#if NUM_BONE_INFLUENCERS>5
previousInfluence+=mPreviousBones[int(matricesIndicesExtra[1])]*matricesWeightsExtra[1];
#endif 
#if NUM_BONE_INFLUENCERS>6
previousInfluence+=mPreviousBones[int(matricesIndicesExtra[2])]*matricesWeightsExtra[2];
#endif 
#if NUM_BONE_INFLUENCERS>7
previousInfluence+=mPreviousBones[int(matricesIndicesExtra[3])]*matricesWeightsExtra[3];
#endif
vPreviousPosition=previousViewProjection*finalPreviousWorld*previousInfluence*vec4(positionUpdated,1.0);
#else
vPreviousPosition=previousViewProjection*finalPreviousWorld*vec4(positionUpdated,1.0);
#endif
#endif
`;t.ShaderStore.IncludesShadersStore[c]||(t.ShaderStore.IncludesShadersStore[c]=d),e.s([],46566);let u="uvVariableDeclaration",m=`#if !defined(UV{X}) && defined(MAINUV{X})
vec2 uv{X}=vec2(0.,0.);
#endif
#ifdef MAINUV{X}
vMainUV{X}=uv{X};
#endif
`;t.ShaderStore.IncludesShadersStore[u]||(t.ShaderStore.IncludesShadersStore[u]=m),e.s([],591573);let p="samplerVertexImplementation",v=`#if defined(_DEFINENAME_) && _DEFINENAME_DIRECTUV==0
if (v_INFONAME_==0.)
{v_VARYINGNAME_UV=vec2(_MATRIXNAME_Matrix*vec4(uvUpdated,1.0,0.0));}
#ifdef UV2
else if (v_INFONAME_==1.)
{v_VARYINGNAME_UV=vec2(_MATRIXNAME_Matrix*vec4(uv2Updated,1.0,0.0));}
#endif
#ifdef UV3
else if (v_INFONAME_==2.)
{v_VARYINGNAME_UV=vec2(_MATRIXNAME_Matrix*vec4(uv3,1.0,0.0));}
#endif
#ifdef UV4
else if (v_INFONAME_==3.)
{v_VARYINGNAME_UV=vec2(_MATRIXNAME_Matrix*vec4(uv4,1.0,0.0));}
#endif
#ifdef UV5
else if (v_INFONAME_==4.)
{v_VARYINGNAME_UV=vec2(_MATRIXNAME_Matrix*vec4(uv5,1.0,0.0));}
#endif
#ifdef UV6
else if (v_INFONAME_==5.)
{v_VARYINGNAME_UV=vec2(_MATRIXNAME_Matrix*vec4(uv6,1.0,0.0));}
#endif
#endif
`;t.ShaderStore.IncludesShadersStore[p]||(t.ShaderStore.IncludesShadersStore[p]=v),e.s([],631130)},146259,e=>{"use strict";var t=e.i(263537);let r="vertexColorMixing",i=`#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
vColor=vec4(1.0);
#ifdef VERTEXCOLOR
#ifdef VERTEXALPHA
vColor*=colorUpdated;
#else
vColor.rgb*=colorUpdated.rgb;
#endif
#endif
#ifdef INSTANCESCOLOR
vColor*=instanceColor;
#endif
#endif
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.s([])},182478,e=>{"use strict";var t=e.i(263537);let r="clipPlaneVertexDeclaration",i=`#ifdef CLIPPLANE
uniform vec4 vClipPlane;varying float fClipDistance;
#endif
#ifdef CLIPPLANE2
uniform vec4 vClipPlane2;varying float fClipDistance2;
#endif
#ifdef CLIPPLANE3
uniform vec4 vClipPlane3;varying float fClipDistance3;
#endif
#ifdef CLIPPLANE4
uniform vec4 vClipPlane4;varying float fClipDistance4;
#endif
#ifdef CLIPPLANE5
uniform vec4 vClipPlane5;varying float fClipDistance5;
#endif
#ifdef CLIPPLANE6
uniform vec4 vClipPlane6;varying float fClipDistance6;
#endif
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.s(["clipPlaneVertexDeclaration",0,{name:r,shader:i}])},781801,e=>{"use strict";var t=e.i(263537);let r="clipPlaneVertex",i=`#ifdef CLIPPLANE
fClipDistance=dot(worldPos,vClipPlane);
#endif
#ifdef CLIPPLANE2
fClipDistance2=dot(worldPos,vClipPlane2);
#endif
#ifdef CLIPPLANE3
fClipDistance3=dot(worldPos,vClipPlane3);
#endif
#ifdef CLIPPLANE4
fClipDistance4=dot(worldPos,vClipPlane4);
#endif
#ifdef CLIPPLANE5
fClipDistance5=dot(worldPos,vClipPlane5);
#endif
#ifdef CLIPPLANE6
fClipDistance6=dot(worldPos,vClipPlane6);
#endif
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.s(["clipPlaneVertex",0,{name:r,shader:i}])},127010,e=>{"use strict";var t=e.i(263537);let r="logDepthDeclaration",i=`#ifdef LOGARITHMICDEPTH
uniform float logarithmicDepthConstant;varying float vFragmentDepth;
#endif
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.s([])},94556,e=>{"use strict";var t=e.i(263537);let r="logDepthVertex",i=`#ifdef LOGARITHMICDEPTH
vFragmentDepth=1.0+gl_Position.w;gl_Position.z=log2(max(0.000001,vFragmentDepth))*logarithmicDepthConstant;
#endif
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.s([])},30653,e=>{"use strict";var t=e.i(263537);let r="fogVertexDeclaration",i=`#ifdef FOG
varying vec3 vFogDistance;
#endif
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.s([])},313976,e=>{"use strict";var t=e.i(263537);let r="fogVertex",i=`#ifdef FOG
vFogDistance=(view*worldPos).xyz;
#endif
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.s([])},889952,e=>{"use strict";var t=e.i(263537);let r="lightVxUboDeclaration",i=`#ifdef LIGHT{X}
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
#ifdef SHADOW{X}
#ifdef SHADOWCSM{X}
uniform mat4 lightMatrix{X}[SHADOWCSMNUM_CASCADES{X}];varying vec4 vPositionFromLight{X}[SHADOWCSMNUM_CASCADES{X}];varying float vDepthMetric{X}[SHADOWCSMNUM_CASCADES{X}];varying vec4 vPositionFromCamera{X};
#elif defined(SHADOWCUBE{X})
#else
varying vec4 vPositionFromLight{X};varying float vDepthMetric{X};uniform mat4 lightMatrix{X};
#endif
#endif
#endif
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.s(["lightVxUboDeclaration",0,{name:r,shader:i}])},957479,e=>{"use strict";var t=e.i(263537);let r="lightVxFragmentDeclaration",i=`#ifdef LIGHT{X}
uniform vec4 vLightData{X};uniform vec4 vLightDiffuse{X};
#ifdef SPECULARTERM
uniform vec4 vLightSpecular{X};
#else
vec4 vLightSpecular{X}=vec4(0.);
#endif
#ifdef SHADOW{X}
#ifdef SHADOWCSM{X}
uniform mat4 lightMatrix{X}[SHADOWCSMNUM_CASCADES{X}];varying vec4 vPositionFromLight{X}[SHADOWCSMNUM_CASCADES{X}];varying float vDepthMetric{X}[SHADOWCSMNUM_CASCADES{X}];varying vec4 vPositionFromCamera{X};
#elif defined(SHADOWCUBE{X})
#else
varying vec4 vPositionFromLight{X};varying float vDepthMetric{X};uniform mat4 lightMatrix{X};
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
#if defined(AREALIGHT{X}) && defined(AREALIGHTUSED) && defined(AREALIGHTSUPPORTED)
uniform vec4 vLightWidth{X};uniform vec4 vLightHeight{X};
#endif
#endif
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.s(["lightVxFragmentDeclaration",0,{name:r,shader:i}])},294715,e=>{"use strict";var t=e.i(263537);let r="shadowsVertex",i=`#ifdef SHADOWS
#if defined(SHADOWCSM{X})
vPositionFromCamera{X}=view*worldPos;for (int i=0; i<SHADOWCSMNUM_CASCADES{X}; i++) {vPositionFromLight{X}[i]=lightMatrix{X}[i]*worldPos;
#ifdef USE_REVERSE_DEPTHBUFFER
vDepthMetric{X}[i]=(-vPositionFromLight{X}[i].z+light{X}.depthValues.x)/light{X}.depthValues.y;
#else
vDepthMetric{X}[i]=(vPositionFromLight{X}[i].z+light{X}.depthValues.x)/light{X}.depthValues.y;
#endif
}
#elif defined(SHADOW{X}) && !defined(SHADOWCUBE{X})
vPositionFromLight{X}=lightMatrix{X}*worldPos;
#ifdef USE_REVERSE_DEPTHBUFFER
vDepthMetric{X}=(-vPositionFromLight{X}.z+light{X}.depthValues.x)/light{X}.depthValues.y;
#else
vDepthMetric{X}=(vPositionFromLight{X}.z+light{X}.depthValues.x)/light{X}.depthValues.y;
#endif
#endif
#endif
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.s(["shadowsVertex",0,{name:r,shader:i}])},587630,e=>{"use strict";var t=e.i(263537);let r="instancesVertex",i=`#ifdef INSTANCES
mat4 finalWorld=mat4(world0,world1,world2,world3);
#if defined(PREPASS_VELOCITY) || defined(VELOCITY) || defined(PREPASS_VELOCITY_LINEAR) || defined(VELOCITY_LINEAR)
mat4 finalPreviousWorld=mat4(previousWorld0,previousWorld1,
previousWorld2,previousWorld3);
#endif
#ifdef THIN_INSTANCES
finalWorld=world*finalWorld;
#if defined(PREPASS_VELOCITY) || defined(VELOCITY) || defined(PREPASS_VELOCITY_LINEAR) || defined(VELOCITY_LINEAR)
finalPreviousWorld=previousWorld*finalPreviousWorld;
#endif
#endif
#else
mat4 finalWorld=world;
#if defined(PREPASS_VELOCITY) || defined(VELOCITY) || defined(PREPASS_VELOCITY_LINEAR) || defined(VELOCITY_LINEAR)
mat4 finalPreviousWorld=previousWorld;
#endif
#endif
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.s([])},880779,e=>{"use strict";var t=e.i(263537);let r="instancesDeclaration",i=`#ifdef INSTANCES
attribute vec4 world0;attribute vec4 world1;attribute vec4 world2;attribute vec4 world3;
#ifdef INSTANCESCOLOR
attribute vec4 instanceColor;
#endif
#if defined(THIN_INSTANCES) && !defined(WORLD_UBO)
uniform mat4 world;
#endif
#if defined(VELOCITY) || defined(PREPASS_VELOCITY) || defined(PREPASS_VELOCITY_LINEAR) || defined(VELOCITY_LINEAR)
attribute vec4 previousWorld0;attribute vec4 previousWorld1;attribute vec4 previousWorld2;attribute vec4 previousWorld3;
#ifdef THIN_INSTANCES
uniform mat4 previousWorld;
#endif
#endif
#else
#if !defined(WORLD_UBO)
uniform mat4 world;
#endif
#if defined(VELOCITY) || defined(PREPASS_VELOCITY) || defined(PREPASS_VELOCITY_LINEAR) || defined(VELOCITY_LINEAR)
uniform mat4 previousWorld;
#endif
#endif
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.s([])},761523,e=>{"use strict";var t=e.i(263537);let r="bonesVertex",i=`#ifndef BAKED_VERTEX_ANIMATION_TEXTURE
#if NUM_BONE_INFLUENCERS>0
mat4 influence;
#ifdef BONETEXTURE
influence=readMatrixFromRawSampler(boneSampler,matricesIndices[0])*matricesWeights[0];
#if NUM_BONE_INFLUENCERS>1
influence+=readMatrixFromRawSampler(boneSampler,matricesIndices[1])*matricesWeights[1];
#endif
#if NUM_BONE_INFLUENCERS>2
influence+=readMatrixFromRawSampler(boneSampler,matricesIndices[2])*matricesWeights[2];
#endif
#if NUM_BONE_INFLUENCERS>3
influence+=readMatrixFromRawSampler(boneSampler,matricesIndices[3])*matricesWeights[3];
#endif
#if NUM_BONE_INFLUENCERS>4
influence+=readMatrixFromRawSampler(boneSampler,matricesIndicesExtra[0])*matricesWeightsExtra[0];
#endif
#if NUM_BONE_INFLUENCERS>5
influence+=readMatrixFromRawSampler(boneSampler,matricesIndicesExtra[1])*matricesWeightsExtra[1];
#endif
#if NUM_BONE_INFLUENCERS>6
influence+=readMatrixFromRawSampler(boneSampler,matricesIndicesExtra[2])*matricesWeightsExtra[2];
#endif
#if NUM_BONE_INFLUENCERS>7
influence+=readMatrixFromRawSampler(boneSampler,matricesIndicesExtra[3])*matricesWeightsExtra[3];
#endif
#else
influence=mBones[int(matricesIndices[0])]*matricesWeights[0];
#if NUM_BONE_INFLUENCERS>1
influence+=mBones[int(matricesIndices[1])]*matricesWeights[1];
#endif
#if NUM_BONE_INFLUENCERS>2
influence+=mBones[int(matricesIndices[2])]*matricesWeights[2];
#endif
#if NUM_BONE_INFLUENCERS>3
influence+=mBones[int(matricesIndices[3])]*matricesWeights[3];
#endif
#if NUM_BONE_INFLUENCERS>4
influence+=mBones[int(matricesIndicesExtra[0])]*matricesWeightsExtra[0];
#endif
#if NUM_BONE_INFLUENCERS>5
influence+=mBones[int(matricesIndicesExtra[1])]*matricesWeightsExtra[1];
#endif
#if NUM_BONE_INFLUENCERS>6
influence+=mBones[int(matricesIndicesExtra[2])]*matricesWeightsExtra[2];
#endif
#if NUM_BONE_INFLUENCERS>7
influence+=mBones[int(matricesIndicesExtra[3])]*matricesWeightsExtra[3];
#endif
#endif
finalWorld=finalWorld*influence;
#endif
#endif
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.s(["bonesVertex",0,{name:r,shader:i}])},624154,e=>{"use strict";var t=e.i(263537);let r="bonesDeclaration",i=`#if NUM_BONE_INFLUENCERS>0
attribute vec4 matricesIndices;attribute vec4 matricesWeights;
#if NUM_BONE_INFLUENCERS>4
attribute vec4 matricesIndicesExtra;attribute vec4 matricesWeightsExtra;
#endif
#ifndef BAKED_VERTEX_ANIMATION_TEXTURE
#ifdef BONETEXTURE
uniform highp sampler2D boneSampler;uniform vec2 boneTextureInfo;
#else
uniform mat4 mBones[BonesPerMesh];
#endif
#ifdef BONES_VELOCITY_ENABLED
uniform mat4 mPreviousBones[BonesPerMesh];
#endif
#ifdef BONETEXTURE
#define inline
mat4 readMatrixFromRawSampler(sampler2D smp,float index)
{
#if defined(WEBGL2) || defined(WEBGPU)
int offset=int(index)*4; 
int textureWidth=int(boneTextureInfo.x);int y=int(offset)/textureWidth;int x=int(offset) % textureWidth;vec4 m0=texelFetch(smp,ivec2(x+0,y),0);vec4 m1=texelFetch(smp,ivec2(x+1,y),0);vec4 m2=texelFetch(smp,ivec2(x+2,y),0);vec4 m3=texelFetch(smp,ivec2(x+3,y),0);return mat4(m0,m1,m2,m3);
#else
float offset=index*4.0;float y=floor(offset/boneTextureInfo.x);float x=offset-y*boneTextureInfo.x;float dy=1.0/boneTextureInfo.y;float dx=1.0/boneTextureInfo.x;vec4 m0=texture2D(smp,vec2(dx*(x+0.5),dy*(y+0.5)));vec4 m1=texture2D(smp,vec2(dx*(x+1.5),dy*(y+0.5)));vec4 m2=texture2D(smp,vec2(dx*(x+2.5),dy*(y+0.5)));vec4 m3=texture2D(smp,vec2(dx*(x+3.5),dy*(y+0.5))); 
return mat4(m0,m1,m2,m3);
#endif
}
#endif
#endif
#endif
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.s(["bonesDeclaration",0,{name:r,shader:i}])},568039,479126,e=>{"use strict";var t=e.i(263537);let r="bakedVertexAnimationDeclaration",i=`#ifdef BAKED_VERTEX_ANIMATION_TEXTURE
uniform float bakedVertexAnimationTime;
#if !defined(WEBGL2) && !defined(WEBGPU)
uniform vec2 bakedVertexAnimationTextureSizeInverted;
#endif
uniform vec4 bakedVertexAnimationSettings;uniform sampler2D bakedVertexAnimationTexture;
#ifdef INSTANCES
attribute vec4 bakedVertexAnimationSettingsInstanced;
#endif
#define inline
mat4 readMatrixFromRawSamplerVAT(sampler2D smp,float index,float frame)
{
#if defined(WEBGL2) || defined(WEBGPU)
int offset=int(index)*4;int frameUV=int(frame);vec4 m0=texelFetch(smp,ivec2(offset+0,frameUV),0);vec4 m1=texelFetch(smp,ivec2(offset+1,frameUV),0);vec4 m2=texelFetch(smp,ivec2(offset+2,frameUV),0);vec4 m3=texelFetch(smp,ivec2(offset+3,frameUV),0);return mat4(m0,m1,m2,m3);
#else
float offset=index*4.0;float frameUV=(frame+0.5)*bakedVertexAnimationTextureSizeInverted.y;float dx=bakedVertexAnimationTextureSizeInverted.x;vec4 m0=texture2D(smp,vec2(dx*(offset+0.5),frameUV));vec4 m1=texture2D(smp,vec2(dx*(offset+1.5),frameUV));vec4 m2=texture2D(smp,vec2(dx*(offset+2.5),frameUV));vec4 m3=texture2D(smp,vec2(dx*(offset+3.5),frameUV));return mat4(m0,m1,m2,m3);
#endif
}
#endif
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.s([],568039);let a="bakedVertexAnimation",o=`#ifdef BAKED_VERTEX_ANIMATION_TEXTURE
{
#ifdef INSTANCES
#define BVASNAME bakedVertexAnimationSettingsInstanced
#else
#define BVASNAME bakedVertexAnimationSettings
#endif
float VATStartFrame=BVASNAME.x;float VATEndFrame=BVASNAME.y;float VATOffsetFrame=BVASNAME.z;float VATSpeed=BVASNAME.w;float totalFrames=VATEndFrame-VATStartFrame+1.0;float time=bakedVertexAnimationTime*VATSpeed/totalFrames;float frameCorrection=time<1.0 ? 0.0 : 1.0;float numOfFrames=totalFrames-frameCorrection;float VATFrameNum=fract(time)*numOfFrames;VATFrameNum=mod(VATFrameNum+VATOffsetFrame,numOfFrames);VATFrameNum=floor(VATFrameNum);VATFrameNum+=VATStartFrame+frameCorrection;mat4 VATInfluence;VATInfluence=readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture,matricesIndices[0],VATFrameNum)*matricesWeights[0];
#if NUM_BONE_INFLUENCERS>1
VATInfluence+=readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture,matricesIndices[1],VATFrameNum)*matricesWeights[1];
#endif
#if NUM_BONE_INFLUENCERS>2
VATInfluence+=readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture,matricesIndices[2],VATFrameNum)*matricesWeights[2];
#endif
#if NUM_BONE_INFLUENCERS>3
VATInfluence+=readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture,matricesIndices[3],VATFrameNum)*matricesWeights[3];
#endif
#if NUM_BONE_INFLUENCERS>4
VATInfluence+=readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture,matricesIndicesExtra[0],VATFrameNum)*matricesWeightsExtra[0];
#endif
#if NUM_BONE_INFLUENCERS>5
VATInfluence+=readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture,matricesIndicesExtra[1],VATFrameNum)*matricesWeightsExtra[1];
#endif
#if NUM_BONE_INFLUENCERS>6
VATInfluence+=readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture,matricesIndicesExtra[2],VATFrameNum)*matricesWeightsExtra[2];
#endif
#if NUM_BONE_INFLUENCERS>7
VATInfluence+=readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture,matricesIndicesExtra[3],VATFrameNum)*matricesWeightsExtra[3];
#endif
finalWorld=finalWorld*VATInfluence;}
#endif
`;t.ShaderStore.IncludesShadersStore[a]||(t.ShaderStore.IncludesShadersStore[a]=o),e.s([],479126)},610460,e=>{"use strict";var t=e.i(263537);let r="morphTargetsVertex",i=`#ifdef MORPHTARGETS
#ifdef MORPHTARGETS_TEXTURE
#if {X}==0
for (int i=0; i<NUM_MORPH_INFLUENCERS; i++) {if (float(i)>=morphTargetCount) break;vertexID=float(gl_VertexID)*morphTargetTextureInfo.x;
#ifdef MORPHTARGETS_POSITION
positionUpdated+=(readVector3FromRawSampler(i,vertexID)-position)*morphTargetInfluences[i];
#endif
#ifdef MORPHTARGETTEXTURE_HASPOSITIONS
vertexID+=1.0;
#endif
#ifdef MORPHTARGETS_NORMAL
normalUpdated+=(readVector3FromRawSampler(i,vertexID) -normal)*morphTargetInfluences[i];
#endif
#ifdef MORPHTARGETTEXTURE_HASNORMALS
vertexID+=1.0;
#endif
#ifdef MORPHTARGETS_UV
uvUpdated+=(readVector3FromRawSampler(i,vertexID).xy-uv)*morphTargetInfluences[i];
#endif
#ifdef MORPHTARGETTEXTURE_HASUVS
vertexID+=1.0;
#endif
#ifdef MORPHTARGETS_TANGENT
tangentUpdated.xyz+=(readVector3FromRawSampler(i,vertexID) -tangent.xyz)*morphTargetInfluences[i];
#endif
#ifdef MORPHTARGETTEXTURE_HASTANGENTS
vertexID+=1.0;
#endif
#ifdef MORPHTARGETS_UV2
uv2Updated+=(readVector3FromRawSampler(i,vertexID).xy-uv2)*morphTargetInfluences[i];
#endif
#ifdef MORPHTARGETTEXTURE_HASUV2S
vertexID+=1.0;
#endif
#ifdef MORPHTARGETS_COLOR
colorUpdated+=(readVector4FromRawSampler(i,vertexID)-color)*morphTargetInfluences[i];
#endif
}
#endif
#else
#ifdef MORPHTARGETS_POSITION
positionUpdated+=(position{X}-position)*morphTargetInfluences[{X}];
#endif
#ifdef MORPHTARGETS_NORMAL
normalUpdated+=(normal{X}-normal)*morphTargetInfluences[{X}];
#endif
#ifdef MORPHTARGETS_TANGENT
tangentUpdated.xyz+=(tangent{X}-tangent.xyz)*morphTargetInfluences[{X}];
#endif
#ifdef MORPHTARGETS_UV
uvUpdated+=(uv_{X}-uv)*morphTargetInfluences[{X}];
#endif
#ifdef MORPHTARGETS_UV2
uv2Updated+=(uv2_{X}-uv2)*morphTargetInfluences[{X}];
#endif
#ifdef MORPHTARGETS_COLOR
colorUpdated+=(color{X}-color)*morphTargetInfluences[{X}];
#endif
#endif
#endif
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.s(["morphTargetsVertex",0,{name:r,shader:i}])},298378,e=>{"use strict";var t=e.i(263537);let r="morphTargetsVertexGlobalDeclaration",i=`#ifdef MORPHTARGETS
uniform float morphTargetInfluences[NUM_MORPH_INFLUENCERS];
#ifdef MORPHTARGETS_TEXTURE 
uniform float morphTargetTextureIndices[NUM_MORPH_INFLUENCERS];uniform vec3 morphTargetTextureInfo;uniform highp sampler2DArray morphTargets;vec3 readVector3FromRawSampler(int targetIndex,float vertexIndex)
{ 
#if defined(WEBGL2) || defined(WEBGPU)
int textureWidth=int(morphTargetTextureInfo.y);int y=int(vertexIndex)/textureWidth;int x=int(vertexIndex) % textureWidth;return texelFetch(morphTargets,ivec3(x,y,int(morphTargetTextureIndices[targetIndex])),0).xyz;
#else
float y=floor(vertexIndex/morphTargetTextureInfo.y);float x=vertexIndex-y*morphTargetTextureInfo.y;vec3 textureUV=vec3((x+0.5)/morphTargetTextureInfo.y,(y+0.5)/morphTargetTextureInfo.z,morphTargetTextureIndices[targetIndex]);return texture(morphTargets,textureUV).xyz;
#endif
}
vec4 readVector4FromRawSampler(int targetIndex,float vertexIndex)
{ 
#if defined(WEBGL2) || defined(WEBGPU)
int textureWidth=int(morphTargetTextureInfo.y);int y=int(vertexIndex)/textureWidth;int x=int(vertexIndex) % textureWidth;return texelFetch(morphTargets,ivec3(x,y,int(morphTargetTextureIndices[targetIndex])),0);
#else
float y=floor(vertexIndex/morphTargetTextureInfo.y);float x=vertexIndex-y*morphTargetTextureInfo.y;vec3 textureUV=vec3((x+0.5)/morphTargetTextureInfo.y,(y+0.5)/morphTargetTextureInfo.z,morphTargetTextureIndices[targetIndex]);return texture(morphTargets,textureUV);
#endif
}
#endif
#endif
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.s(["morphTargetsVertexGlobalDeclaration",0,{name:r,shader:i}])},675406,e=>{"use strict";var t=e.i(263537);let r="morphTargetsVertexGlobal",i=`#ifdef MORPHTARGETS
#ifdef MORPHTARGETS_TEXTURE
float vertexID;
#endif
#endif
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.s(["morphTargetsVertexGlobal",0,{name:r,shader:i}])},369136,e=>{"use strict";var t=e.i(263537);let r="morphTargetsVertexDeclaration",i=`#ifdef MORPHTARGETS
#ifndef MORPHTARGETS_TEXTURE
#ifdef MORPHTARGETS_POSITION
attribute vec3 position{X};
#endif
#ifdef MORPHTARGETS_NORMAL
attribute vec3 normal{X};
#endif
#ifdef MORPHTARGETS_TANGENT
attribute vec3 tangent{X};
#endif
#ifdef MORPHTARGETS_UV
attribute vec2 uv_{X};
#endif
#ifdef MORPHTARGETS_UV2
attribute vec2 uv2_{X};
#endif
#ifdef MORPHTARGETS_COLOR
attribute vec4 color{X};
#endif
#elif {X}==0
uniform float morphTargetCount;
#endif
#endif
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.s(["morphTargetsVertexDeclaration",0,{name:r,shader:i}])},443018,e=>{"use strict";var t=e.i(263537);let r="bumpVertex",i=`#if defined(BUMP) || defined(PARALLAX) || defined(CLEARCOAT_BUMP) || defined(ANISOTROPIC)
#if defined(TANGENT) && defined(NORMAL)
vec3 tbnNormal=normalize(normalUpdated);vec3 tbnTangent=normalize(tangentUpdated.xyz);vec3 tbnBitangent=cross(tbnNormal,tbnTangent)*tangentUpdated.w;vTBN=mat3(finalWorld)*mat3(tbnTangent,tbnBitangent,tbnNormal);
#endif
#endif
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.s([])},347918,29140,733460,30081,59782,359202,e=>{"use strict";var t,r,i,a,o,n,s=e.i(700183);class l{constructor(e,t){if(this.data=e,this.isInvalid=!1,!l.IsValid(e)){this.isInvalid=!0,s.Logger.Error("texture missing KTX identifier");return}const r=Uint32Array.BYTES_PER_ELEMENT,i=new DataView(this.data.buffer,this.data.byteOffset+12,13*r),a=0x4030201===i.getUint32(0,!0);if(this.glType=i.getUint32(+r,a),this.glTypeSize=i.getUint32(2*r,a),this.glFormat=i.getUint32(3*r,a),this.glInternalFormat=i.getUint32(4*r,a),this.glBaseInternalFormat=i.getUint32(5*r,a),this.pixelWidth=i.getUint32(6*r,a),this.pixelHeight=i.getUint32(7*r,a),this.pixelDepth=i.getUint32(8*r,a),this.numberOfArrayElements=i.getUint32(9*r,a),this.numberOfFaces=i.getUint32(10*r,a),this.numberOfMipmapLevels=i.getUint32(11*r,a),this.bytesOfKeyValueData=i.getUint32(12*r,a),0!==this.glType){s.Logger.Error("only compressed formats currently supported"),this.isInvalid=!0;return}if(this.numberOfMipmapLevels=Math.max(1,this.numberOfMipmapLevels),0===this.pixelHeight||0!==this.pixelDepth){s.Logger.Error("only 2D textures currently supported"),this.isInvalid=!0;return}if(0!==this.numberOfArrayElements){s.Logger.Error("texture arrays not currently supported"),this.isInvalid=!0;return}if(this.numberOfFaces!==t){s.Logger.Error("number of faces expected"+t+", but found "+this.numberOfFaces),this.isInvalid=!0;return}this.loadType=l.COMPRESSED_2D}uploadLevels(e,t){switch(this.loadType){case l.COMPRESSED_2D:this._upload2DCompressedLevels(e,t);case l.TEX_2D:case l.COMPRESSED_3D:case l.TEX_3D:}}_upload2DCompressedLevels(e,t){let r=l.HEADER_LEN+this.bytesOfKeyValueData,i=this.pixelWidth,a=this.pixelHeight,o=t?this.numberOfMipmapLevels:1;for(let t=0;t<o;t++){let o=new Int32Array(this.data.buffer,this.data.byteOffset+r,1)[0];r+=4;for(let n=0;n<this.numberOfFaces;n++){let s=new Uint8Array(this.data.buffer,this.data.byteOffset+r,o);e.getEngine()._uploadCompressedDataToTextureDirectly(e,e.format,i,a,s,n,t),r+=o,r+=3-(o+3)%4}i=Math.max(1,.5*i),a=Math.max(1,.5*a)}}static IsValid(e){if(e.byteLength>=12){let t=new Uint8Array(e.buffer,e.byteOffset,12);if(171===t[0]&&75===t[1]&&84===t[2]&&88===t[3]&&32===t[4]&&49===t[5]&&49===t[6]&&187===t[7]&&13===t[8]&&10===t[9]&&26===t[10]&&10===t[11])return!0}return!1}}l.HEADER_LEN=64,l.COMPRESSED_2D=0,l.COMPRESSED_3D=1,l.TEX_2D=2,l.TEX_3D=3,e.s(["KhronosTextureContainer",0,l],29140);class f{constructor(e){this._pendingActions=[],this._workerInfos=e.map(e=>({workerPromise:Promise.resolve(e),idle:!0}))}dispose(){for(let e of this._workerInfos)e.workerPromise.then(e=>{e.terminate()});this._workerInfos.length=0,this._pendingActions.length=0}push(e){this._executeOnIdleWorker(e)||this._pendingActions.push(e)}_executeOnIdleWorker(e){for(let t of this._workerInfos)if(t.idle)return this._execute(t,e),!0;return!1}_execute(e,t){e.idle=!1,e.workerPromise.then(r=>{t(r,()=>{let t=this._pendingActions.shift();t?this._execute(e,t):e.idle=!0})})}}class c extends f{constructor(e,t,r=c.DefaultOptions){super([]),this._maxWorkers=e,this._createWorkerAsync=t,this._options=r}push(e){if(!this._executeOnIdleWorker(e))if(this._workerInfos.length<this._maxWorkers){let t={workerPromise:this._createWorkerAsync(),idle:!1};this._workerInfos.push(t),this._execute(t,e)}else this._pendingActions.push(e)}_execute(e,t){e.timeoutId&&(clearTimeout(e.timeoutId),delete e.timeoutId),super._execute(e,(r,i)=>{t(r,()=>{i(),e.idle&&(e.timeoutId=setTimeout(()=>{e.workerPromise.then(e=>{e.terminate()});let t=this._workerInfos.indexOf(e);-1!==t&&this._workerInfos.splice(t,1)},this._options.idleTimeElapsedBeforeRelease))})})}}c.DefaultOptions={idleTimeElapsedBeforeRelease:1e3},e.s(["AutoReleaseWorkerPool",0,c],733460);var d=e.i(900280);function u(e,t){let r=t?.jsDecoderModule||KTX2DECODER;e&&(e.wasmBaseUrl&&(r.Transcoder.WasmBaseUrl=e.wasmBaseUrl),e.wasmUASTCToASTC&&(r.LiteTranscoder_UASTC_ASTC.WasmModuleURL=e.wasmUASTCToASTC),e.wasmUASTCToBC7&&(r.LiteTranscoder_UASTC_BC7.WasmModuleURL=e.wasmUASTCToBC7),e.wasmUASTCToRGBA_UNORM&&(r.LiteTranscoder_UASTC_RGBA_UNORM.WasmModuleURL=e.wasmUASTCToRGBA_UNORM),e.wasmUASTCToRGBA_SRGB&&(r.LiteTranscoder_UASTC_RGBA_SRGB.WasmModuleURL=e.wasmUASTCToRGBA_SRGB),e.wasmUASTCToR8_UNORM&&(r.LiteTranscoder_UASTC_R8_UNORM.WasmModuleURL=e.wasmUASTCToR8_UNORM),e.wasmUASTCToRG8_UNORM&&(r.LiteTranscoder_UASTC_RG8_UNORM.WasmModuleURL=e.wasmUASTCToRG8_UNORM),e.jsMSCTranscoder&&(r.MSCTranscoder.JSModuleURL=e.jsMSCTranscoder),e.wasmMSCTranscoder&&(r.MSCTranscoder.WasmModuleURL=e.wasmMSCTranscoder),e.wasmZSTDDecoder&&(r.ZSTDDecoder.WasmModuleURL=e.wasmZSTDDecoder)),t&&(t.wasmUASTCToASTC&&(r.LiteTranscoder_UASTC_ASTC.WasmBinary=t.wasmUASTCToASTC),t.wasmUASTCToBC7&&(r.LiteTranscoder_UASTC_BC7.WasmBinary=t.wasmUASTCToBC7),t.wasmUASTCToRGBA_UNORM&&(r.LiteTranscoder_UASTC_RGBA_UNORM.WasmBinary=t.wasmUASTCToRGBA_UNORM),t.wasmUASTCToRGBA_SRGB&&(r.LiteTranscoder_UASTC_RGBA_SRGB.WasmBinary=t.wasmUASTCToRGBA_SRGB),t.wasmUASTCToR8_UNORM&&(r.LiteTranscoder_UASTC_R8_UNORM.WasmBinary=t.wasmUASTCToR8_UNORM),t.wasmUASTCToRG8_UNORM&&(r.LiteTranscoder_UASTC_RG8_UNORM.WasmBinary=t.wasmUASTCToRG8_UNORM),t.jsMSCTranscoder&&(r.MSCTranscoder.JSModule=t.jsMSCTranscoder),t.wasmMSCTranscoder&&(r.MSCTranscoder.WasmBinary=t.wasmMSCTranscoder),t.wasmZSTDDecoder&&(r.ZSTDDecoder.WasmBinary=t.wasmZSTDDecoder))}function m(e){let t;void 0===e&&"u">typeof KTX2DECODER&&(e=KTX2DECODER),onmessage=r=>{if(r.data)switch(r.data.action){case"init":{let i=r.data.urls;i&&(i.jsDecoderModule&&void 0===e&&(importScripts(i.jsDecoderModule),e=KTX2DECODER),u(i)),r.data.wasmBinaries&&u(void 0,{...r.data.wasmBinaries,jsDecoderModule:e}),t=new e.KTX2Decoder,postMessage({action:"init"});break}case"setDefaultDecoderOptions":e.KTX2Decoder.DefaultDecoderOptions=r.data.options;break;case"decode":t.decode(r.data.data,r.data.caps,r.data.options).then(e=>{let t=[];for(let r=0;r<e.mipmaps.length;++r){let i=e.mipmaps[r];i&&i.data&&t.push(i.data.buffer)}postMessage({action:"decoded",success:!0,decodedData:e},t)}).catch(e=>{postMessage({action:"decoded",success:!1,msg:e})})}}}async function p(e,t,r){return await new Promise((i,a)=>{let o=t=>{e.removeEventListener("error",o),e.removeEventListener("message",n),a(t)},n=t=>{"init"===t.data.action&&(e.removeEventListener("error",o),e.removeEventListener("message",n),i(e))};e.addEventListener("error",o),e.addEventListener("message",n),e.postMessage({action:"init",urls:r,wasmBinaries:t})})}(t=a||(a={}))[t.ETC1S=0]="ETC1S",t[t.UASTC4x4=1]="UASTC4x4",(r=o||(o={}))[r.ASTC_4X4_RGBA=0]="ASTC_4X4_RGBA",r[r.ASTC_4x4_RGBA=0]="ASTC_4x4_RGBA",r[r.BC7_RGBA=1]="BC7_RGBA",r[r.BC3_RGBA=2]="BC3_RGBA",r[r.BC1_RGB=3]="BC1_RGB",r[r.PVRTC1_4_RGBA=4]="PVRTC1_4_RGBA",r[r.PVRTC1_4_RGB=5]="PVRTC1_4_RGB",r[r.ETC2_RGBA=6]="ETC2_RGBA",r[r.ETC1_RGB=7]="ETC1_RGB",r[r.RGBA32=8]="RGBA32",r[r.R8=9]="R8",r[r.RG8=10]="RG8",(i=n||(n={}))[i.COMPRESSED_RGBA_BPTC_UNORM_EXT=36492]="COMPRESSED_RGBA_BPTC_UNORM_EXT",i[i.COMPRESSED_RGBA_ASTC_4X4_KHR=37808]="COMPRESSED_RGBA_ASTC_4X4_KHR",i[i.COMPRESSED_RGB_S3TC_DXT1_EXT=33776]="COMPRESSED_RGB_S3TC_DXT1_EXT",i[i.COMPRESSED_RGBA_S3TC_DXT5_EXT=33779]="COMPRESSED_RGBA_S3TC_DXT5_EXT",i[i.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG=35842]="COMPRESSED_RGBA_PVRTC_4BPPV1_IMG",i[i.COMPRESSED_RGB_PVRTC_4BPPV1_IMG=35840]="COMPRESSED_RGB_PVRTC_4BPPV1_IMG",i[i.COMPRESSED_RGBA8_ETC2_EAC=37496]="COMPRESSED_RGBA8_ETC2_EAC",i[i.COMPRESSED_RGB8_ETC2=37492]="COMPRESSED_RGB8_ETC2",i[i.COMPRESSED_RGB_ETC1_WEBGL=36196]="COMPRESSED_RGB_ETC1_WEBGL",i[i.RGBA8Format=32856]="RGBA8Format",i[i.R8Format=33321]="R8Format",i[i.RG8Format=33323]="RG8Format",e.s(["TranscodeTarget",0,o],30081),e.s(["applyConfig",0,u,"initializeWebWorker",0,p,"workerFunction",0,m],59782);class v{static GetDefaultNumWorkers(){return"object"==typeof navigator&&navigator.hardwareConcurrency?Math.min(Math.floor(.5*navigator.hardwareConcurrency),4):1}static _Initialize(e){if(v._WorkerPoolPromise||v._DecoderModulePromise)return;let t={wasmBaseUrl:d.Tools.ScriptBaseUrl,jsDecoderModule:d.Tools.GetBabylonScriptURL(this.URLConfig.jsDecoderModule,!0),wasmUASTCToASTC:d.Tools.GetBabylonScriptURL(this.URLConfig.wasmUASTCToASTC,!0),wasmUASTCToBC7:d.Tools.GetBabylonScriptURL(this.URLConfig.wasmUASTCToBC7,!0),wasmUASTCToRGBA_UNORM:d.Tools.GetBabylonScriptURL(this.URLConfig.wasmUASTCToRGBA_UNORM,!0),wasmUASTCToRGBA_SRGB:d.Tools.GetBabylonScriptURL(this.URLConfig.wasmUASTCToRGBA_SRGB,!0),wasmUASTCToR8_UNORM:d.Tools.GetBabylonScriptURL(this.URLConfig.wasmUASTCToR8_UNORM,!0),wasmUASTCToRG8_UNORM:d.Tools.GetBabylonScriptURL(this.URLConfig.wasmUASTCToRG8_UNORM,!0),jsMSCTranscoder:d.Tools.GetBabylonScriptURL(this.URLConfig.jsMSCTranscoder,!0),wasmMSCTranscoder:d.Tools.GetBabylonScriptURL(this.URLConfig.wasmMSCTranscoder,!0),wasmZSTDDecoder:d.Tools.GetBabylonScriptURL(this.URLConfig.wasmZSTDDecoder,!0)};e&&"function"==typeof Worker&&"u">typeof URL?v._WorkerPoolPromise=new Promise(r=>{let i=`${u}(${m})()`,a=URL.createObjectURL(new Blob([i],{type:"application/javascript"}));r(new c(e,async()=>await p(new Worker(a),void 0,t)))}):void 0===v._KTX2DecoderModule?v._DecoderModulePromise=d.Tools.LoadBabylonScriptAsync(t.jsDecoderModule).then(()=>(v._KTX2DecoderModule=KTX2DECODER,v._KTX2DecoderModule.MSCTranscoder.UseFromWorkerThread=!1,v._KTX2DecoderModule.WASMMemoryManager.LoadBinariesFromCurrentThread=!0,u(t,v._KTX2DecoderModule),new v._KTX2DecoderModule.KTX2Decoder)):(v._KTX2DecoderModule.MSCTranscoder.UseFromWorkerThread=!1,v._KTX2DecoderModule.WASMMemoryManager.LoadBinariesFromCurrentThread=!0,v._DecoderModulePromise=Promise.resolve(new v._KTX2DecoderModule.KTX2Decoder))}constructor(e,t=v.DefaultNumWorkers){this._engine=e;const r="object"==typeof t&&t.workerPool||v.WorkerPool;if(r)v._WorkerPoolPromise=Promise.resolve(r);else{"object"==typeof t?v._KTX2DecoderModule=t?.binariesAndModulesContainer?.jsDecoderModule:"u">typeof KTX2DECODER&&(v._KTX2DecoderModule=KTX2DECODER);const e="number"==typeof t?t:t.numWorkers??v.DefaultNumWorkers;v._Initialize(e)}}async _uploadAsync(e,t,r){let i=this._engine.getCaps(),a={astc:!!i.astc,bptc:!!i.bptc,s3tc:!!i.s3tc,pvrtc:!!i.pvrtc,etc2:!!i.etc2,etc1:!!i.etc1};if(v._WorkerPoolPromise){let i=await v._WorkerPoolPromise;return await new Promise((o,n)=>{i.push((i,s)=>{let l=e=>{i.removeEventListener("error",l),i.removeEventListener("message",f),n(e),s()},f=e=>{if("decoded"===e.data.action){if(i.removeEventListener("error",l),i.removeEventListener("message",f),e.data.success)try{this._createTexture(e.data.decodedData,t,r),o()}catch(e){n({message:e})}else n({message:e.data.msg});s()}};i.addEventListener("error",l),i.addEventListener("message",f),i.postMessage({action:"setDefaultDecoderOptions",options:v.DefaultDecoderOptions._getKTX2DecoderOptions()});let c=new Uint8Array(e.byteLength);c.set(new Uint8Array(e.buffer,e.byteOffset,e.byteLength)),i.postMessage({action:"decode",data:c,caps:a,options:r},[c.buffer])})})}if(v._DecoderModulePromise){let r=await v._DecoderModulePromise;return v.DefaultDecoderOptions.isDirty&&(v._KTX2DecoderModule.KTX2Decoder.DefaultDecoderOptions=v.DefaultDecoderOptions._getKTX2DecoderOptions()),await new Promise((a,o)=>{r.decode(e,i).then(e=>{this._createTexture(e,t),a()}).catch(e=>{o({message:e})})})}throw Error("KTX2 decoder module is not available")}_createTexture(e,t,r){this._engine._bindTextureDirectly(3553,t),r&&(r.transcodedFormat=e.transcodedFormat,r.isInGammaSpace=e.isInGammaSpace,r.hasAlpha=e.hasAlpha,r.transcoderName=e.transcoderName);let i=!0;switch(e.transcodedFormat){case 32856:t.type=0,t.format=5;break;case 33321:t.type=0,t.format=6;break;case 33323:t.type=0,t.format=7;break;default:t.format=e.transcodedFormat,i=!1}if(t._gammaSpace=e.isInGammaSpace,t.generateMipMaps=e.mipmaps.length>1,t.width=e.mipmaps[0].width,t.height=e.mipmaps[0].height,e.errors)throw Error("KTX2 container - could not transcode the data. "+e.errors);for(let r=0;r<e.mipmaps.length;++r){let a=e.mipmaps[r];if(!a||!a.data)throw Error("KTX2 container - could not transcode one of the image");i?(t.width=a.width,t.height=a.height,this._engine._uploadDataToTextureDirectly(t,a.data,0,r,void 0,!0)):this._engine._uploadCompressedDataToTextureDirectly(t,e.transcodedFormat,a.width,a.height,a.data,0,r)}t._extension=".ktx2",t.isReady=!0,this._engine._bindTextureDirectly(3553,null)}static IsValid(e){if(e.byteLength>=12){let t=new Uint8Array(e.buffer,e.byteOffset,12);if(171===t[0]&&75===t[1]&&84===t[2]&&88===t[3]&&32===t[4]&&50===t[5]&&48===t[6]&&187===t[7]&&13===t[8]&&10===t[9]&&26===t[10]&&10===t[11])return!0}return!1}}v.URLConfig={jsDecoderModule:"https://cdn.babylonjs.com/babylon.ktx2Decoder.js",wasmUASTCToASTC:null,wasmUASTCToBC7:null,wasmUASTCToRGBA_UNORM:null,wasmUASTCToRGBA_SRGB:null,wasmUASTCToR8_UNORM:null,wasmUASTCToRG8_UNORM:null,jsMSCTranscoder:null,wasmMSCTranscoder:null,wasmZSTDDecoder:null},v.DefaultNumWorkers=v.GetDefaultNumWorkers(),v.DefaultDecoderOptions=new class{constructor(){this._isDirty=!0,this._useRGBAIfOnlyBC1BC3AvailableWhenUASTC=!0,this._ktx2DecoderOptions={}}get isDirty(){return this._isDirty}get useRGBAIfASTCBC7NotAvailableWhenUASTC(){return this._useRGBAIfASTCBC7NotAvailableWhenUASTC}set useRGBAIfASTCBC7NotAvailableWhenUASTC(e){this._useRGBAIfASTCBC7NotAvailableWhenUASTC!==e&&(this._useRGBAIfASTCBC7NotAvailableWhenUASTC=e,this._isDirty=!0)}get useRGBAIfOnlyBC1BC3AvailableWhenUASTC(){return this._useRGBAIfOnlyBC1BC3AvailableWhenUASTC}set useRGBAIfOnlyBC1BC3AvailableWhenUASTC(e){this._useRGBAIfOnlyBC1BC3AvailableWhenUASTC!==e&&(this._useRGBAIfOnlyBC1BC3AvailableWhenUASTC=e,this._isDirty=!0)}get forceRGBA(){return this._forceRGBA}set forceRGBA(e){this._forceRGBA!==e&&(this._forceRGBA=e,this._isDirty=!0)}get forceR8(){return this._forceR8}set forceR8(e){this._forceR8!==e&&(this._forceR8=e,this._isDirty=!0)}get forceRG8(){return this._forceRG8}set forceRG8(e){this._forceRG8!==e&&(this._forceRG8=e,this._isDirty=!0)}get bypassTranscoders(){return this._bypassTranscoders}set bypassTranscoders(e){this._bypassTranscoders!==e&&(this._bypassTranscoders=e,this._isDirty=!0)}_getKTX2DecoderOptions(){if(!this._isDirty)return this._ktx2DecoderOptions;this._isDirty=!1;let e={};return void 0!==this._useRGBAIfASTCBC7NotAvailableWhenUASTC&&(e.useRGBAIfASTCBC7NotAvailableWhenUASTC=this._useRGBAIfASTCBC7NotAvailableWhenUASTC),void 0!==this._forceRGBA&&(e.forceRGBA=this._forceRGBA),void 0!==this._forceR8&&(e.forceR8=this._forceR8),void 0!==this._forceRG8&&(e.forceRG8=this._forceRG8),void 0!==this._bypassTranscoders&&(e.bypassTranscoders=this._bypassTranscoders),this.useRGBAIfOnlyBC1BC3AvailableWhenUASTC&&(e.transcodeFormatDecisionTree={UASTC:{transcodeFormat:[o.BC1_RGB,o.BC3_RGBA],yes:{transcodeFormat:o.RGBA32,engineFormat:32856,roundToMultiple4:!1}}}),this._ktx2DecoderOptions=e,e}},e.s(["KhronosTextureContainer2",0,v],359202),e.s(["_KTXTextureLoader",0,class{constructor(){this.supportCascades=!1}loadCubeData(e,t,r,i){if(Array.isArray(e))return;t._invertVScale=!t.invertY;let a=t.getEngine(),o=new l(e,6),n=o.numberOfMipmapLevels>1&&t.generateMipMaps;a._unpackFlipY(!0),o.uploadLevels(t,t.generateMipMaps),t.width=o.pixelWidth,t.height=o.pixelHeight,a._setCubeMapTextureParams(t,n,o.numberOfMipmapLevels-1),t.isReady=!0,t.onLoadedObservable.notifyObservers(t),t.onLoadedObservable.clear(),i&&i()}loadData(e,t,r,i){if(l.IsValid(e)){t._invertVScale=!t.invertY;let i=new l(e,1),a=function(e){switch(e){case 35916:return 33776;case 35918:return 33778;case 35919:return 33779;case 37493:return 37492;case 37497:return 37496;case 37495:return 37494;case 37840:return 37808;case 37841:return 37809;case 37842:return 37810;case 37843:return 37811;case 37844:return 37812;case 37845:return 37813;case 37846:return 37814;case 37847:return 37815;case 37848:return 37816;case 37849:return 37817;case 37850:return 37818;case 37851:return 37819;case 37852:return 37820;case 37853:return 37821;case 36493:return 36492}return null}(i.glInternalFormat);a?(t.format=a,t._useSRGBBuffer=t.getEngine()._getUseSRGBBuffer(!0,t.generateMipMaps),t._gammaSpace=!0):t.format=i.glInternalFormat,r(i.pixelWidth,i.pixelHeight,t.generateMipMaps,!0,()=>{i.uploadLevels(t,t.generateMipMaps)},i.isInvalid)}else v.IsValid(e)?new v(t.getEngine())._uploadAsync(e,t,i).then(()=>{r(t.width,t.height,t.generateMipMaps,!0,()=>{},!1)},e=>{s.Logger.Warn(`Failed to load KTX2 texture data: ${e.message}`),r(0,0,!1,!1,()=>{},!0)}):(s.Logger.Error("texture missing KTX identifier"),r(0,0,!1,!1,()=>{},!0))}}],347918)},52165,e=>{"use strict";var t=e.i(263537);e.i(579618),e.i(738124),e.i(216596),e.i(144628),e.i(507534),e.i(393484),e.i(803174),e.i(352483),e.i(357351),e.i(755704),e.i(562396);let r="intersectionFunctions",i=`fn diskIntersectWithBackFaceCulling(ro: vec3f,rd: vec3f,c: vec3f,r: f32)->f32 {var d: f32=rd.y;if(d>0.0) { return 1e6; }
var o: vec3f=ro-c;var t: f32=-o.y/d;var q: vec3f=o+rd*t;return select(1e6,t,(dot(q,q)<r*r));}
fn sphereIntersect(ro: vec3f,rd: vec3f,ce: vec3f,ra: f32)->vec2f {var oc: vec3f=ro-ce;var b: f32=dot(oc,rd);var c: f32=dot(oc,oc)-ra*ra;var h: f32=b*b-c;if(h<0.0) { return vec2f(-1.,-1.); }
h=sqrt(h);return vec2f(-b+h,-b-h);}
fn sphereIntersectFromOrigin(ro: vec3f,rd: vec3f,ra: f32)->vec2f {var b: f32=dot(ro,rd);var c: f32=dot(ro,ro)-ra*ra;var h: f32=b*b-c;if(h<0.0) { return vec2f(-1.,-1.); }
h=sqrt(h);return vec2f(-b+h,-b-h);}`;t.ShaderStore.IncludesShadersStoreWGSL[r]||(t.ShaderStore.IncludesShadersStoreWGSL[r]=i),e.i(212954),e.i(296253),e.i(476129),e.i(922446);let a="backgroundPixelShader",o=`#include<backgroundUboDeclaration>
#include<helperFunctions>
varying vPositionW: vec3f;
#ifdef MAINUV1
varying vMainUV1: vec2f;
#endif 
#ifdef MAINUV2 
varying vMainUV2: vec2f; 
#endif 
#ifdef NORMAL
varying vNormalW: vec3f;
#endif
#ifdef DIFFUSE
#if DIFFUSEDIRECTUV==1
#define vDiffuseUV vMainUV1
#elif DIFFUSEDIRECTUV==2
#define vDiffuseUV vMainUV2
#else
varying vDiffuseUV: vec2f;
#endif
var diffuseSamplerSampler: sampler;var diffuseSampler: texture_2d<f32>;
#endif
#ifdef REFLECTION
#ifdef REFLECTIONMAP_3D
var reflectionSamplerSampler: sampler;var reflectionSampler: texture_cube<f32>;
#ifdef TEXTURELODSUPPORT
#else
var reflectionLowSamplerSampler: sampler;var reflectionLowSampler: texture_cube<f32>;var reflectionHighSamplerSampler: sampler;var reflectionHighSampler: texture_cube<f32>;
#endif
#else
var reflectionSamplerSampler: sampler;var reflectionSampler: texture_2d<f32>;
#ifdef TEXTURELODSUPPORT
#else
var reflectionLowSamplerSampler: sampler;var reflectionLowSampler: texture_2d<f32>;var reflectionHighSamplerSampler: sampler;var reflectionHighSampler: texture_2d<f32>;
#endif
#endif
#ifdef REFLECTIONMAP_SKYBOX
varying vPositionUVW: vec3f;
#else
#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)
varying vDirectionW: vec3f;
#endif
#endif
#include<reflectionFunction>
#endif
#ifndef FROMLINEARSPACE
#define FROMLINEARSPACE;
#endif
#ifndef SHADOWONLY
#define SHADOWONLY;
#endif
#include<imageProcessingDeclaration>
#include<lightUboDeclaration>[0..maxSimultaneousLights]
#include<lightsFragmentFunctions>
#include<shadowsFragmentFunctions>
#include<imageProcessingFunctions>
#include<logDepthDeclaration>
#include<clipPlaneFragmentDeclaration>
#include<fogFragmentDeclaration>
#ifdef REFLECTIONFRESNEL
#define FRESNEL_MAXIMUM_ON_ROUGH 0.25
fn fresnelSchlickEnvironmentGGX(VdotN: f32,reflectance0: vec3f,reflectance90: vec3f,smoothness: f32)->vec3f
{var weight: f32=mix(FRESNEL_MAXIMUM_ON_ROUGH,1.0,smoothness);return reflectance0+weight*(reflectance90-reflectance0)*pow5(saturate(1.0-VdotN));}
#endif
#ifdef PROJECTED_GROUND
#include<intersectionFunctions>
fn project(viewDirectionW: vec3f,eyePosition: vec3f)->vec3f {var radius: f32=uniforms.projectedGroundInfos.x;var height: f32=uniforms.projectedGroundInfos.y;var camDir: vec3f=-viewDirectionW;var skySphereDistance: f32=sphereIntersectFromOrigin(eyePosition,camDir,radius).x;var skySpherePositionW: vec3f=eyePosition+camDir*skySphereDistance;var p: vec3f=normalize(skySpherePositionW);var upEyePosition=vec3f(eyePosition.x,eyePosition.y-height,eyePosition.z);var sIntersection: f32=sphereIntersectFromOrigin(upEyePosition,p,radius).x;var h: vec3f= vec3f(0.0,-height,0.0);var dIntersection: f32=diskIntersectWithBackFaceCulling(upEyePosition,p,h,radius);p=(upEyePosition+min(sIntersection,dIntersection)*p);return p;}
#endif
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
#include<clipPlaneFragment>
var viewDirectionW: vec3f=normalize(scene.vEyePosition.xyz-input.vPositionW);
#ifdef NORMAL
var normalW: vec3f=normalize(fragmentInputs.vNormalW);
#else
var normalW: vec3f= vec3f(0.0,1.0,0.0);
#endif
var shadow: f32=1.;var globalShadow: f32=0.;var shadowLightCount: f32=0.;var aggShadow: f32=0.;var numLights: f32=0.;
#include<lightFragment>[0..maxSimultaneousLights]
#ifdef SHADOWINUSE
globalShadow/=shadowLightCount;
#else
globalShadow=1.0;
#endif
#ifndef BACKMAT_SHADOWONLY
var reflectionColor: vec4f= vec4f(1.,1.,1.,1.);
#ifdef REFLECTION
#ifdef PROJECTED_GROUND
var reflectionVector: vec3f=project(viewDirectionW,scene.vEyePosition.xyz);reflectionVector= (uniforms.reflectionMatrix*vec4f(reflectionVector,1.)).xyz;
#else
var reflectionVector: vec3f=computeReflectionCoords( vec4f(fragmentInputs.vPositionW,1.0),normalW);
#endif
#ifdef REFLECTIONMAP_OPPOSITEZ
reflectionVector.z*=-1.0;
#endif
#ifdef REFLECTIONMAP_3D
var reflectionCoords: vec3f=reflectionVector;
#else
var reflectionCoords: vec2f=reflectionVector.xy;
#ifdef REFLECTIONMAP_PROJECTION
reflectionCoords/=reflectionVector.z;
#endif
reflectionCoords.y=1.0-reflectionCoords.y;
#endif
#ifdef REFLECTIONBLUR
var reflectionLOD: f32=uniforms.vReflectionInfos.y;
#ifdef TEXTURELODSUPPORT
reflectionLOD=reflectionLOD*log2(uniforms.vReflectionMicrosurfaceInfos.x)*uniforms.vReflectionMicrosurfaceInfos.y+uniforms.vReflectionMicrosurfaceInfos.z;reflectionColor=textureSampleLevel(reflectionSampler,reflectionSamplerSampler,reflectionCoords,reflectionLOD);
#else
var lodReflectionNormalized: f32=saturate(reflectionLOD);var lodReflectionNormalizedDoubled: f32=lodReflectionNormalized*2.0;var reflectionSpecularMid: vec4f=textureSample(reflectionSampler,reflectionSamplerSampler,reflectionCoords);if(lodReflectionNormalizedDoubled<1.0){reflectionColor=mix(
textureSample(reflectionrHighSampler,reflectionrHighSamplerSampler,reflectionCoords),
reflectionSpecularMid,
lodReflectionNormalizedDoubled
);} else {reflectionColor=mix(
reflectionSpecularMid,
textureSample(reflectionLowSampler,reflectionLowSamplerSampler,reflectionCoords),
lodReflectionNormalizedDoubled-1.0
);}
#endif
#else
var reflectionSample: vec4f=textureSample(reflectionSampler,reflectionSamplerSampler,reflectionCoords);reflectionColor=reflectionSample;
#endif
#ifdef RGBDREFLECTION
reflectionColor=vec4f(fromRGBD(reflectionColor).rgb,reflectionColor.a);
#endif
#ifdef GAMMAREFLECTION
reflectionColor=vec4f(toLinearSpaceVec3(reflectionColor.rgb),reflectionColor.a);
#endif
#ifdef REFLECTIONBGR
reflectionColor=vec4f(reflectionColor.bgr,reflectionColor.a);
#endif
reflectionColor=vec4f(reflectionColor.rgb*uniforms.vReflectionInfos.x,reflectionColor.a);
#endif
var diffuseColor: vec3f= vec3f(1.,1.,1.);var finalAlpha: f32=uniforms.alpha;
#ifdef DIFFUSE
var diffuseMap: vec4f=textureSample(diffuseSampler,diffuseSamplerSampler,input.vDiffuseUV);
#ifdef GAMMADIFFUSE
diffuseMap=vec4f(toLinearSpaceVec3(diffuseMap.rgb),diffuseMap.a);
#endif
diffuseMap=vec4f(diffuseMap.rgb *uniforms.vDiffuseInfos.y,diffuseMap.a);
#ifdef DIFFUSEHASALPHA
finalAlpha*=diffuseMap.a;
#endif
diffuseColor=diffuseMap.rgb;
#endif
#ifdef REFLECTIONFRESNEL
var colorBase: vec3f=diffuseColor;
#else
var colorBase: vec3f=reflectionColor.rgb*diffuseColor;
#endif
colorBase=max(colorBase,vec3f(0.0));
#ifdef USERGBCOLOR
var finalColor: vec3f=colorBase;
#else
#ifdef USEHIGHLIGHTANDSHADOWCOLORS
var mainColor: vec3f=mix(uniforms.vPrimaryColorShadow.rgb,uniforms.vPrimaryColor.rgb,colorBase);
#else
var mainColor: vec3f=uniforms.vPrimaryColor.rgb;
#endif
var finalColor: vec3f=colorBase*mainColor;
#endif
#ifdef REFLECTIONFRESNEL
var reflectionAmount: vec3f=uniforms.vReflectionControl.xxx;var reflectionReflectance0: vec3f=uniforms.vReflectionControl.yyy;var reflectionReflectance90: vec3f=uniforms.vReflectionControl.zzz;var VdotN: f32=dot(normalize(scene.vEyePosition.xyz),normalW);var planarReflectionFresnel: vec3f=fresnelSchlickEnvironmentGGX(saturate(VdotN),reflectionReflectance0,reflectionReflectance90,1.0);reflectionAmount*=planarReflectionFresnel;
#ifdef REFLECTIONFALLOFF
var reflectionDistanceFalloff: f32=1.0-saturate(length(fragmentInputs.vPositionW.xyz-uniforms.vBackgroundCenter)*uniforms.vReflectionControl.w);reflectionDistanceFalloff*=reflectionDistanceFalloff;reflectionAmount*=reflectionDistanceFalloff;
#endif
finalColor=mix(finalColor,reflectionColor.rgb,saturateVec3(reflectionAmount));
#endif
#ifdef OPACITYFRESNEL
var viewAngleToFloor: f32=dot(normalW,normalize(scene.vEyePosition.xyz-uniforms.vBackgroundCenter));const startAngle: f32=0.1;var fadeFactor: f32=saturate(viewAngleToFloor/startAngle);finalAlpha*=fadeFactor*fadeFactor;
#endif
#ifdef SHADOWINUSE
finalColor=mix(finalColor*uniforms.shadowLevel,finalColor,globalShadow);
#endif
var color: vec4f= vec4f(finalColor,finalAlpha);
#else
var color: vec4f= vec4f(uniforms.vPrimaryColor.rgb,(1.0-clamp(globalShadow,0.,1.))*uniforms.alpha);
#endif
#include<logDepthFragment>
#include<fogFragment>
#ifdef IMAGEPROCESSINGPOSTPROCESS
#if !defined(SKIPFINALCOLORCLAMP)
color=vec4f(clamp(color.rgb,vec3f(0.),vec3f(30.0)),color.a);
#endif
#else
color=applyImageProcessing(color);
#endif
#ifdef PREMULTIPLYALPHA
color=vec4f(color.rgb *color.a,color.a);
#endif
#ifdef NOISE
color=vec4f(color.rgb+dither(fragmentInputs.vPositionW.xy,0.5),color.a);color=max(color,vec4f(0.0));
#endif
fragmentOutputs.color=color;
#define CUSTOM_FRAGMENT_MAIN_END
}
`;t.ShaderStore.ShadersStoreWGSL[a]||(t.ShaderStore.ShadersStoreWGSL[a]=o),e.s(["backgroundPixelShaderWGSL",0,{name:a,shader:o}],52165)},579618,e=>{"use strict";var t=e.i(263537);e.i(243400);let r="backgroundUboDeclaration",i=`uniform vPrimaryColor: vec4f;uniform vPrimaryColorShadow: vec4f;uniform vDiffuseInfos : vec2f;uniform diffuseMatrix : mat4x4f;uniform fFovMultiplier: f32;uniform pointSize: f32;uniform shadowLevel: f32;uniform alpha: f32;uniform vBackgroundCenter: vec3f;uniform vReflectionControl: vec4f;uniform projectedGroundInfos: vec2f;uniform vReflectionInfos : vec2f;uniform reflectionMatrix : mat4x4f;uniform vReflectionMicrosurfaceInfos : vec3f;
#include<sceneUboDeclaration>
`;t.ShaderStore.IncludesShadersStoreWGSL[r]||(t.ShaderStore.IncludesShadersStoreWGSL[r]=i),e.s([])},296253,e=>{"use strict";var t=e.i(263537);let r="lightFragment",i=`#ifdef LIGHT{X}
#if defined(SHADOWONLY) || defined(LIGHTMAP) && defined(LIGHTMAPEXCLUDED{X}) && defined(LIGHTMAPNOSPECULAR{X})
#else
var diffuse{X}: vec4f=light{X}.vLightDiffuse;
#define CUSTOM_LIGHT{X}_COLOR 
#if defined(PBR) && defined(CLUSTLIGHT{X})
{let sliceIndex=min(getClusteredSliceIndex(light{X}.vSliceData,fragmentInputs.vViewDepth),CLUSTLIGHT_SLICES-1);info=computeClusteredLighting(
lightDataTexture{X},
&tileMaskBuffer{X},
light{X}.vLightData,
vec2u(light{X}.vSliceRanges[sliceIndex].xy),
viewDirectionW,
normalW,
fragmentInputs.vPositionW,
surfaceAlbedo,
reflectivityOut,
#ifdef IRIDESCENCE
iridescenceIntensity,
#endif
#ifdef SS_TRANSLUCENCY
subSurfaceOut,
#endif
#ifdef SPECULARTERM
AARoughnessFactors.x,
#endif
#ifdef ANISOTROPIC
anisotropicOut,
#endif
#ifdef SHEEN
sheenOut,
#endif
#ifdef CLEARCOAT
clearcoatOut,
#endif
);}
#elif defined(PBR)
#ifdef SPOTLIGHT{X}
preInfo=computePointAndSpotPreLightingInfo(light{X}.vLightData,viewDirectionW,normalW,fragmentInputs.vPositionW);
#elif defined(POINTLIGHT{X})
preInfo=computePointAndSpotPreLightingInfo(light{X}.vLightData,viewDirectionW,normalW,fragmentInputs.vPositionW);
#elif defined(HEMILIGHT{X})
preInfo=computeHemisphericPreLightingInfo(light{X}.vLightData,viewDirectionW,normalW);
#elif defined(DIRLIGHT{X})
preInfo=computeDirectionalPreLightingInfo(light{X}.vLightData,viewDirectionW,normalW);
#elif defined(AREALIGHT{X}) && defined(AREALIGHTUSED) && defined(AREALIGHTSUPPORTED)
#if defined(RECTAREALIGHTEMISSIONTEXTURE{X})
preInfo=computeAreaPreLightingInfoWithTexture(areaLightsLTC1Sampler,areaLightsLTC1SamplerSampler,areaLightsLTC2Sampler,areaLightsLTC2SamplerSampler,rectAreaLightEmissionTexture{X},rectAreaLightEmissionTexture{X}Sampler,viewDirectionW,normalW,fragmentInputs.vPositionW,light{X}.vLightData.xyz,light{X}.vLightWidth.xyz,light{X}.vLightHeight.xyz,roughness);
#else
preInfo=computeAreaPreLightingInfo(areaLightsLTC1Sampler,areaLightsLTC1SamplerSampler,areaLightsLTC2Sampler,areaLightsLTC2SamplerSampler,viewDirectionW,normalW,fragmentInputs.vPositionW,light{X}.vLightData.xyz,light{X}.vLightWidth.xyz,light{X}.vLightHeight.xyz,roughness);
#endif
#endif
preInfo.NdotV=NdotV;
#ifdef SPOTLIGHT{X}
#ifdef LIGHT_FALLOFF_GLTF{X}
preInfo.attenuation=computeDistanceLightFalloff_GLTF(preInfo.lightDistanceSquared,light{X}.vLightFalloff.y);
#ifdef IESLIGHTTEXTURE{X}
preInfo.attenuation*=computeDirectionalLightFalloff_IES(light{X}.vLightDirection.xyz,preInfo.L,iesLightTexture{X},iesLightTexture{X}Sampler);
#else
preInfo.attenuation*=computeDirectionalLightFalloff_GLTF(light{X}.vLightDirection.xyz,preInfo.L,light{X}.vLightFalloff.z,light{X}.vLightFalloff.w);
#endif
#elif defined(LIGHT_FALLOFF_PHYSICAL{X})
preInfo.attenuation=computeDistanceLightFalloff_Physical(preInfo.lightDistanceSquared);
#ifdef IESLIGHTTEXTURE{X}
preInfo.attenuation*=computeDirectionalLightFalloff_IES(light{X}.vLightDirection.xyz,preInfo.L,iesLightTexture{X},iesLightTexture{X}Sampler);
#else
preInfo.attenuation*=computeDirectionalLightFalloff_Physical(light{X}.vLightDirection.xyz,preInfo.L,light{X}.vLightDirection.w);
#endif
#elif defined(LIGHT_FALLOFF_STANDARD{X})
preInfo.attenuation=computeDistanceLightFalloff_Standard(preInfo.lightOffset,light{X}.vLightFalloff.x);
#ifdef IESLIGHTTEXTURE{X}
preInfo.attenuation*=computeDirectionalLightFalloff_IES(light{X}.vLightDirection.xyz,preInfo.L,iesLightTexture{X},iesLightTexture{X}Sampler);
#else
preInfo.attenuation*=computeDirectionalLightFalloff_Standard(light{X}.vLightDirection.xyz,preInfo.L,light{X}.vLightDirection.w,light{X}.vLightData.w);
#endif
#else
preInfo.attenuation=computeDistanceLightFalloff(preInfo.lightOffset,preInfo.lightDistanceSquared,light{X}.vLightFalloff.x,light{X}.vLightFalloff.y);
#ifdef IESLIGHTTEXTURE{X}
preInfo.attenuation*=computeDirectionalLightFalloff_IES(light{X}.vLightDirection.xyz,preInfo.L,iesLightTexture{X},iesLightTexture{X}Sampler);
#else
preInfo.attenuation*=computeDirectionalLightFalloff(light{X}.vLightDirection.xyz,preInfo.L,light{X}.vLightDirection.w,light{X}.vLightData.w,light{X}.vLightFalloff.z,light{X}.vLightFalloff.w);
#endif
#endif
#elif defined(POINTLIGHT{X})
#ifdef LIGHT_FALLOFF_GLTF{X}
preInfo.attenuation=computeDistanceLightFalloff_GLTF(preInfo.lightDistanceSquared,light{X}.vLightFalloff.y);
#elif defined(LIGHT_FALLOFF_PHYSICAL{X})
preInfo.attenuation=computeDistanceLightFalloff_Physical(preInfo.lightDistanceSquared);
#elif defined(LIGHT_FALLOFF_STANDARD{X})
preInfo.attenuation=computeDistanceLightFalloff_Standard(preInfo.lightOffset,light{X}.vLightFalloff.x);
#else
preInfo.attenuation=computeDistanceLightFalloff(preInfo.lightOffset,preInfo.lightDistanceSquared,light{X}.vLightFalloff.x,light{X}.vLightFalloff.y);
#endif
#else
preInfo.attenuation=1.0;
#endif
#if defined(HEMILIGHT{X})
preInfo.roughness=roughness;
#elif defined(AREALIGHT{X}) && defined(AREALIGHTUSED) && defined(AREALIGHTSUPPORTED)
preInfo.roughness=roughness;
#else
preInfo.roughness=adjustRoughnessFromLightProperties(roughness,light{X}.vLightSpecular.a,preInfo.lightDistance);
#endif
preInfo.diffuseRoughness=diffuseRoughness;preInfo.surfaceAlbedo=surfaceAlbedo;
#ifdef IRIDESCENCE
preInfo.iridescenceIntensity=iridescenceIntensity;
#endif
#ifdef SS_TRANSLUCENCY
info.diffuseTransmission=vec3f(0.0);
#endif
#ifdef HEMILIGHT{X}
info.diffuse=computeHemisphericDiffuseLighting(preInfo,diffuse{X}.rgb,light{X}.vLightGround);
#elif defined(AREALIGHT{X}) && defined(AREALIGHTUSED) && defined(AREALIGHTSUPPORTED)
info.diffuse=computeAreaDiffuseLighting(preInfo,diffuse{X}.rgb);
#elif defined(SS_TRANSLUCENCY)
#ifndef SS_TRANSLUCENCY_LEGACY
info.diffuse=computeDiffuseLighting(preInfo,diffuse{X}.rgb)*(1.0-subSurfaceOut.translucencyIntensity);info.diffuseTransmission=computeDiffuseTransmittedLighting(preInfo,diffuse{X}.rgb,subSurfaceOut.transmittance); 
#else
info.diffuse=computeDiffuseTransmittedLighting(preInfo,diffuse{X}.rgb,subSurfaceOut.transmittance);
#endif
#else
info.diffuse=computeDiffuseLighting(preInfo,diffuse{X}.rgb);
#endif
#ifdef SPECULARTERM
#if defined(AREALIGHT{X}) && defined(AREALIGHTUSED) && defined(AREALIGHTSUPPORTED)
info.specular=computeAreaSpecularLighting(preInfo,light{X}.vLightSpecular.rgb,clearcoatOut.specularEnvironmentR0,reflectivityOut.colorReflectanceF90);
#else
#if (CONDUCTOR_SPECULAR_MODEL==CONDUCTOR_SPECULAR_MODEL_OPENPBR)
{let metalFresnel: vec3f=vec3f(reflectivityOut.specularWeight)*getF82Specular(preInfo.VdotH,clearcoatOut.specularEnvironmentR0,reflectivityOut.colorReflectanceF90,reflectivityOut.roughness);let dielectricFresnel: vec3f=fresnelSchlickGGXVec3(preInfo.VdotH,reflectivityOut.dielectricColorF0,reflectivityOut.colorReflectanceF90);coloredFresnel=mix(dielectricFresnel,metalFresnel,reflectivityOut.metallic);}
#else
coloredFresnel=fresnelSchlickGGXVec3(preInfo.VdotH,clearcoatOut.specularEnvironmentR0,reflectivityOut.colorReflectanceF90);
#endif
#ifndef LEGACY_SPECULAR_ENERGY_CONSERVATION
{let NdotH: f32=dot(normalW,preInfo.H);let fresnel: vec3f=fresnelSchlickGGXVec3(NdotH,vec3f(reflectanceF0),specularEnvironmentR90);info.diffuse*=(vec3f(1.0)-fresnel);}
#endif
#ifdef ANISOTROPIC
info.specular=computeAnisotropicSpecularLighting(preInfo,viewDirectionW,normalW,anisotropicOut.anisotropicTangent,anisotropicOut.anisotropicBitangent,anisotropicOut.anisotropy,clearcoatOut.specularEnvironmentR0,specularEnvironmentR90,AARoughnessFactors.x,diffuse{X}.rgb);
#else
info.specular=computeSpecularLighting(preInfo,normalW,clearcoatOut.specularEnvironmentR0,coloredFresnel,AARoughnessFactors.x,diffuse{X}.rgb);
#endif
#endif
#endif
#ifndef AREALIGHT{X}
#ifdef SHEEN
#ifdef SHEEN_LINKWITHALBEDO
preInfo.roughness=sheenOut.sheenIntensity;
#else
#ifdef HEMILIGHT{X}
preInfo.roughness=sheenOut.sheenRoughness;
#else
preInfo.roughness=adjustRoughnessFromLightProperties(sheenOut.sheenRoughness,light{X}.vLightSpecular.a,preInfo.lightDistance);
#endif
#endif
info.sheen=computeSheenLighting(preInfo,normalW,sheenOut.sheenColor,specularEnvironmentR90,AARoughnessFactors.x,diffuse{X}.rgb);
#endif
#ifdef CLEARCOAT
#ifdef HEMILIGHT{X}
preInfo.roughness=clearcoatOut.clearCoatRoughness;
#else
preInfo.roughness=adjustRoughnessFromLightProperties(clearcoatOut.clearCoatRoughness,light{X}.vLightSpecular.a,preInfo.lightDistance);
#endif
info.clearCoat=computeClearCoatLighting(preInfo,clearcoatOut.clearCoatNormalW,clearcoatOut.clearCoatAARoughnessFactors.x,clearcoatOut.clearCoatIntensity,diffuse{X}.rgb);
#ifdef CLEARCOAT_TINT
absorption=computeClearCoatLightingAbsorption(clearcoatOut.clearCoatNdotVRefract,preInfo.L,clearcoatOut.clearCoatNormalW,clearcoatOut.clearCoatColor,clearcoatOut.clearCoatThickness,clearcoatOut.clearCoatIntensity);info.diffuse*=absorption;
#ifdef SS_TRANSLUCENCY
info.diffuseTransmission*=absorption;
#endif
#ifdef SPECULARTERM
info.specular*=absorption;
#endif
#endif
info.diffuse*=info.clearCoat.w;
#ifdef SS_TRANSLUCENCY
info.diffuseTransmission*=info.clearCoat.w;
#endif
#ifdef SPECULARTERM
info.specular*=info.clearCoat.w;
#endif
#ifdef SHEEN
info.sheen*=info.clearCoat.w;
#endif
#endif
#endif
#else
#ifdef SPOTLIGHT{X}
#ifdef IESLIGHTTEXTURE{X}
info=computeIESSpotLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDirection,diffuse{X}.rgb,light{X}.vLightSpecular.rgb,diffuse{X}.a,glossiness,iesLightTexture{X},iesLightTexture{X}Sampler);
#else
info=computeSpotLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDirection,diffuse{X}.rgb,light{X}.vLightSpecular.rgb,diffuse{X}.a,glossiness);
#endif
#elif defined(HEMILIGHT{X})
info=computeHemisphericLighting(viewDirectionW,normalW,light{X}.vLightData,diffuse{X}.rgb,light{X}.vLightSpecular.rgb,light{X}.vLightGround,glossiness);
#elif defined(POINTLIGHT{X}) || defined(DIRLIGHT{X})
info=computeLighting(viewDirectionW,normalW,light{X}.vLightData,diffuse{X}.rgb,light{X}.vLightSpecular.rgb,diffuse{X}.a,glossiness);
#elif define(AREALIGHT{X}) && defined(AREALIGHTSUPPORTED)
#if defined(RECTAREALIGHTEMISSIONTEXTURE{X})
info=computeAreaLightingWithTexture(areaLightsLTC1Sampler,areaLightsLTC1SamplerSampler,areaLightsLTC2Sampler,areaLightsLTC2SamplerSampler,rectAreaLightEmissionTexture{X},rectAreaLightEmissionTexture{X}Sampler,viewDirectionW,normalW,fragmentInputs.vPositionW,light{X}.vLightData.xyz,light{X}.vLightWidth.xyz,light{X}.vLightHeight.xyz,diffuse{X}.rgb,light{X}.vLightSpecular.rgb,
#ifdef AREALIGHTNOROUGHTNESS
0.5
#else
uniforms.vReflectionInfos.y
#endif
);
#else
info=computeAreaLighting(areaLightsLTC1Sampler,areaLightsLTC1SamplerSampler,areaLightsLTC2Sampler,areaLightsLTC2SamplerSampler,viewDirectionW,normalW,fragmentInputs.vPositionW,light{X}.vLightData.xyz,light{X}.vLightWidth.xyz,light{X}.vLightHeight.xyz,diffuse{X}.rgb,light{X}.vLightSpecular.rgb,
#ifdef AREALIGHTNOROUGHTNESS
0.5
#else
uniforms.vReflectionInfos.y
#endif
);
#endif
#elif defined(CLUSTLIGHT{X})
{let sliceIndex=min(getClusteredSliceIndex(light{X}.vSliceData,fragmentInputs.vViewDepth),CLUSTLIGHT_SLICES-1);info=computeClusteredLighting(lightDataTexture{X},&tileMaskBuffer{X},viewDirectionW,normalW,light{X}.vLightData,vec2u(light{X}.vSliceRanges[sliceIndex].xy),glossiness);}
#endif
#endif
#ifdef PROJECTEDLIGHTTEXTURE{X}
info.diffuse*=computeProjectionTextureDiffuseLighting(projectionLightTexture{X},projectionLightTexture{X}Sampler,uniforms.textureProjectionMatrix{X},fragmentInputs.vPositionW);
#endif
#endif
#ifdef SHADOW{X}
#ifdef SHADOWCSMDEBUG{X}
var shadowDebug{X}: vec3f;
#endif
#ifdef SHADOWCSM{X}
#ifdef SHADOWCSMUSESHADOWMAXZ{X}
var index{X}: i32=-1;
#else
var index{X}: i32=SHADOWCSMNUM_CASCADES{X}-1;
#endif
var diff{X}: f32=0.;vPositionFromLight{X}[0]=fragmentInputs.vPositionFromLight{X}_0;vPositionFromLight{X}[1]=fragmentInputs.vPositionFromLight{X}_1;vPositionFromLight{X}[2]=fragmentInputs.vPositionFromLight{X}_2;vPositionFromLight{X}[3]=fragmentInputs.vPositionFromLight{X}_3;vDepthMetric{X}[0]=fragmentInputs.vDepthMetric{X}_0;vDepthMetric{X}[1]=fragmentInputs.vDepthMetric{X}_1;vDepthMetric{X}[2]=fragmentInputs.vDepthMetric{X}_2;vDepthMetric{X}[3]=fragmentInputs.vDepthMetric{X}_3;for (var i:i32=0; i<SHADOWCSMNUM_CASCADES{X}; i++)
{
#ifdef SHADOWCSM_RIGHTHANDED{X}
diff{X}=uniforms.viewFrustumZ{X}[i]+fragmentInputs.vPositionFromCamera{X}.z;
#else
diff{X}=uniforms.viewFrustumZ{X}[i]-fragmentInputs.vPositionFromCamera{X}.z;
#endif
if (diff{X}>=0.) {index{X}=i;break;}}
#ifdef SHADOWCSMUSESHADOWMAXZ{X}
if (index{X}>=0)
#endif
{
#if defined(SHADOWPCF{X})
#if defined(SHADOWLOWQUALITY{X})
shadow=computeShadowWithCSMPCF1(index{X},vPositionFromLight{X}[index{X}],vDepthMetric{X}[index{X}],shadowTexture{X},shadowTexture{X}Sampler,light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);
#elif defined(SHADOWMEDIUMQUALITY{X})
shadow=computeShadowWithCSMPCF3(index{X},vPositionFromLight{X}[index{X}],vDepthMetric{X}[index{X}],shadowTexture{X},shadowTexture{X}Sampler,light{X}.shadowsInfo.yz,light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);
#else
shadow=computeShadowWithCSMPCF5(index{X},vPositionFromLight{X}[index{X}],vDepthMetric{X}[index{X}],shadowTexture{X},shadowTexture{X}Sampler,light{X}.shadowsInfo.yz,light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);
#endif
#elif defined(SHADOWPCSS{X})
#if defined(SHADOWLOWQUALITY{X})
shadow=computeShadowWithCSMPCSS16(index{X},vPositionFromLight{X}[index{X}],vDepthMetric{X}[index{X}],depthTexture{X},depthTexture{X}Sampler,shadowTexture{X},shadowTexture{X}Sampler,light{X}.shadowsInfo.y,light{X}.shadowsInfo.z,light{X}.shadowsInfo.x,light{X}.shadowsInfo.w,uniforms.lightSizeUVCorrection{X}[index{X}],uniforms.depthCorrection{X}[index{X}],uniforms.penumbraDarkness{X});
#elif defined(SHADOWMEDIUMQUALITY{X})
shadow=computeShadowWithCSMPCSS32(index{X},vPositionFromLight{X}[index{X}],vDepthMetric{X}[index{X}],depthTexture{X},depthTexture{X}Sampler,shadowTexture{X},shadowTexture{X}Sampler,light{X}.shadowsInfo.y,light{X}.shadowsInfo.z,light{X}.shadowsInfo.x,light{X}.shadowsInfo.w,uniforms.lightSizeUVCorrection{X}[index{X}],uniforms.depthCorrection{X}[index{X}],uniforms.penumbraDarkness{X});
#else
shadow=computeShadowWithCSMPCSS64(index{X},vPositionFromLight{X}[index{X}],vDepthMetric{X}[index{X}],depthTexture{X},depthTexture{X}Sampler,shadowTexture{X},shadowTexture{X}Sampler,light{X}.shadowsInfo.y,light{X}.shadowsInfo.z,light{X}.shadowsInfo.x,light{X}.shadowsInfo.w,uniforms.lightSizeUVCorrection{X}[index{X}],uniforms.depthCorrection{X}[index{X}],uniforms.penumbraDarkness{X});
#endif
#else
shadow=computeShadowCSM(index{X},vPositionFromLight{X}[index{X}],vDepthMetric{X}[index{X}],shadowTexture{X},shadowTexture{X}Sampler,light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);
#endif
#ifdef SHADOWCSMDEBUG{X}
shadowDebug{X}=vec3f(shadow)*vCascadeColorsMultiplier{X}[index{X}];
#endif
#ifndef SHADOWCSMNOBLEND{X}
var frustumLength:f32=uniforms.frustumLengths{X}[index{X}];var diffRatio:f32=clamp(diff{X}/frustumLength,0.,1.)*uniforms.cascadeBlendFactor{X};if (index{X}<(SHADOWCSMNUM_CASCADES{X}-1) && diffRatio<1.)
{index{X}+=1;var nextShadow: f32=0.;
#if defined(SHADOWPCF{X})
#if defined(SHADOWLOWQUALITY{X})
nextShadow=computeShadowWithCSMPCF1(index{X},vPositionFromLight{X}[index{X}],vDepthMetric{X}[index{X}],,shadowTexture{X}Sampler,light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);
#elif defined(SHADOWMEDIUMQUALITY{X})
nextShadow=computeShadowWithCSMPCF3(index{X},vPositionFromLight{X}[index{X}],vDepthMetric{X}[index{X}],shadowTexture{X},shadowTexture{X}Sampler,light{X}.shadowsInfo.yz,light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);
#else
nextShadow=computeShadowWithCSMPCF5(index{X},vPositionFromLight{X}[index{X}],vDepthMetric{X}[index{X}],shadowTexture{X},shadowTexture{X}Sampler,light{X}.shadowsInfo.yz,light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);
#endif
#elif defined(SHADOWPCSS{X})
#if defined(SHADOWLOWQUALITY{X})
nextShadow=computeShadowWithCSMPCSS16(index{X},vPositionFromLight{X}[index{X}],vDepthMetric{X}[index{X}],depthTexture{X},depthTexture{X}Sampler,shadowTexture{X},shadowTexture{X}Sampler,light{X}.shadowsInfo.y,light{X}.shadowsInfo.z,light{X}.shadowsInfo.x,light{X}.shadowsInfo.w,uniforms.lightSizeUVCorrection{X}[index{X}],uniforms.depthCorrection{X}[index{X}],uniforms.penumbraDarkness{X});
#elif defined(SHADOWMEDIUMQUALITY{X})
nextShadow=computeShadowWithCSMPCSS32(index{X},vPositionFromLight{X}[index{X}],vDepthMetric{X}[index{X}],depthTexture{X},depthTexture{X}Sampler,shadowTexture{X},shadowTexture{X}Sampler,light{X}.shadowsInfo.y,light{X}.shadowsInfo.z,light{X}.shadowsInfo.x,light{X}.shadowsInfo.w,uniforms.lightSizeUVCorrection{X}[index{X}],uniforms.depthCorrection{X}[index{X}],uniforms.penumbraDarkness{X});
#else
nextShadow=computeShadowWithCSMPCSS64(index{X},vPositionFromLight{X}[index{X}],vDepthMetric{X}[index{X}],depthTexture{X},depthTexture{X}Sampler,shadowTexture{X},shadowTexture{X}Sampler,light{X}.shadowsInfo.y,light{X}.shadowsInfo.z,light{X}.shadowsInfo.x,light{X}.shadowsInfo.w,uniforms.lightSizeUVCorrection{X}[index{X}],uniforms.depthCorrection{X}[index{X}],uniforms.penumbraDarkness{X});
#endif
#else
nextShadow=computeShadowCSM(index{X},vPositionFromLight{X}[index{X}],vDepthMetric{X}[index{X}],shadowTexture{X},shadowTexture{X}Sampler,light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);
#endif
shadow=mix(nextShadow,shadow,diffRatio);
#ifdef SHADOWCSMDEBUG{X}
shadowDebug{X}=mix(vec3(nextShadow)*vCascadeColorsMultiplier{X}[index{X}],shadowDebug{X},diffRatio);
#endif
}
#endif
}
#elif defined(SHADOWCLOSEESM{X})
#if defined(SHADOWCUBE{X})
shadow=computeShadowWithCloseESMCube(fragmentInputs.vPositionW,light{X}.vLightData.xyz,shadowTexture{X},shadowTexture{X}Sampler,light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.depthValues);
#else
shadow=computeShadowWithCloseESM(fragmentInputs.vPositionFromLight{X},fragmentInputs.vDepthMetric{X},shadowTexture{X},shadowTexture{X}Sampler,light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.shadowsInfo.w);
#endif
#elif defined(SHADOWESM{X})
#if defined(SHADOWCUBE{X})
shadow=computeShadowWithESMCube(fragmentInputs.vPositionW,light{X}.vLightData.xyz,shadowTexture{X},shadowTexture{X}Sampler,light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.depthValues);
#else
shadow=computeShadowWithESM(fragmentInputs.vPositionFromLight{X},fragmentInputs.vDepthMetric{X},shadowTexture{X},shadowTexture{X}Sampler,light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.shadowsInfo.w);
#endif
#elif defined(SHADOWPOISSON{X})
#if defined(SHADOWCUBE{X})
shadow=computeShadowWithPoissonSamplingCube(fragmentInputs.vPositionW,light{X}.vLightData.xyz,shadowTexture{X},shadowTexture{X}Sampler,light{X}.shadowsInfo.y,light{X}.shadowsInfo.x,light{X}.depthValues);
#else
shadow=computeShadowWithPoissonSampling(fragmentInputs.vPositionFromLight{X},fragmentInputs.vDepthMetric{X},shadowTexture{X},shadowTexture{X}Sampler,light{X}.shadowsInfo.y,light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);
#endif
#elif defined(SHADOWPCF{X})
#if defined(SHADOWLOWQUALITY{X})
shadow=computeShadowWithPCF1(fragmentInputs.vPositionFromLight{X},fragmentInputs.vDepthMetric{X},shadowTexture{X},shadowTexture{X}Sampler,light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);
#elif defined(SHADOWMEDIUMQUALITY{X})
shadow=computeShadowWithPCF3(fragmentInputs.vPositionFromLight{X},fragmentInputs.vDepthMetric{X},shadowTexture{X},shadowTexture{X}Sampler,light{X}.shadowsInfo.yz,light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);
#else
shadow=computeShadowWithPCF5(fragmentInputs.vPositionFromLight{X},fragmentInputs.vDepthMetric{X},shadowTexture{X},shadowTexture{X}Sampler,light{X}.shadowsInfo.yz,light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);
#endif
#elif defined(SHADOWPCSS{X})
#if defined(SHADOWLOWQUALITY{X})
shadow=computeShadowWithPCSS16(fragmentInputs.vPositionFromLight{X},fragmentInputs.vDepthMetric{X},depthTexture{X},depthTexture{X}Sampler,shadowTexture{X},shadowTexture{X}Sampler,light{X}.shadowsInfo.y,light{X}.shadowsInfo.z,light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);
#elif defined(SHADOWMEDIUMQUALITY{X})
shadow=computeShadowWithPCSS32(fragmentInputs.vPositionFromLight{X},fragmentInputs.vDepthMetric{X},depthTexture{X},depthTexture{X}Sampler,shadowTexture{X},shadowTexture{X}Sampler,light{X}.shadowsInfo.y,light{X}.shadowsInfo.z,light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);
#else
shadow=computeShadowWithPCSS64(fragmentInputs.vPositionFromLight{X},fragmentInputs.vDepthMetric{X},depthTexture{X},depthTexture{X}Sampler,shadowTexture{X},shadowTexture{X}Sampler,light{X}.shadowsInfo.y,light{X}.shadowsInfo.z,light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);
#endif
#else
#if defined(SHADOWCUBE{X})
shadow=computeShadowCube(fragmentInputs.vPositionW,light{X}.vLightData.xyz,shadowTexture{X},shadowTexture{X}Sampler,light{X}.shadowsInfo.x,light{X}.depthValues);
#else
shadow=computeShadow(fragmentInputs.vPositionFromLight{X},fragmentInputs.vDepthMetric{X},shadowTexture{X},shadowTexture{X}Sampler,light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);
#endif
#endif
#ifdef SHADOWONLY
#ifndef SHADOWINUSE
#define SHADOWINUSE
#endif
globalShadow+=shadow;shadowLightCount+=1.0;
#endif
#else
shadow=1.;
#endif
aggShadow+=shadow;numLights+=1.0;
#ifndef SHADOWONLY
#ifdef CUSTOMUSERLIGHTING
diffuseBase+=computeCustomDiffuseLighting(info,diffuseBase,shadow);
#ifdef SPECULARTERM
specularBase+=computeCustomSpecularLighting(info,specularBase,shadow);
#endif
#elif defined(LIGHTMAP) && defined(LIGHTMAPEXCLUDED{X})
diffuseBase+=lightmapColor.rgb*shadow;
#ifdef SPECULARTERM
#ifndef LIGHTMAPNOSPECULAR{X}
specularBase+=info.specular*shadow*lightmapColor.rgb;
#endif
#endif
#ifdef CLEARCOAT
#ifndef LIGHTMAPNOSPECULAR{X}
clearCoatBase+=info.clearCoat.rgb*shadow*lightmapColor.rgb;
#endif
#endif
#ifdef SHEEN
#ifndef LIGHTMAPNOSPECULAR{X}
sheenBase+=info.sheen.rgb*shadow;
#endif
#endif
#else
#ifdef SHADOWCSMDEBUG{X}
diffuseBase+=info.diffuse*shadowDebug{X};
#else
diffuseBase+=info.diffuse*shadow;
#endif
#ifdef SS_TRANSLUCENCY
diffuseTransmissionBase+=info.diffuseTransmission*shadow;
#endif
#ifdef SPECULARTERM
specularBase+=info.specular*shadow;
#endif
#ifdef CLEARCOAT
clearCoatBase+=info.clearCoat.rgb*shadow;
#endif
#ifdef SHEEN
sheenBase+=info.sheen.rgb*shadow;
#endif
#endif
#endif
#endif
`;t.ShaderStore.IncludesShadersStoreWGSL[r]||(t.ShaderStore.IncludesShadersStoreWGSL[r]=i),e.s(["lightFragmentWGSL",0,{name:r,shader:i}])},393484,e=>{"use strict";var t=e.i(263537);e.i(643597),e.i(561525);let r="lightsFragmentFunctions",i=`struct lightingInfo
{diffuse: vec3f,
#ifdef SPECULARTERM
specular: vec3f,
#endif
#ifdef NDOTL
ndl: f32,
#endif
};fn computeLighting(viewDirectionW: vec3f,vNormal: vec3f,lightData: vec4f,diffuseColor: vec3f,specularColor: vec3f,range: f32,glossiness: f32)->lightingInfo {var result: lightingInfo;var lightVectorW: vec3f;var attenuation: f32=1.0;if (lightData.w==0.)
{var direction: vec3f=lightData.xyz-fragmentInputs.vPositionW;attenuation=max(0.,1.0-length(direction)/range);lightVectorW=normalize(direction);}
else
{lightVectorW=normalize(-lightData.xyz);}
var ndl: f32=max(0.,dot(vNormal,lightVectorW));
#ifdef NDOTL
result.ndl=ndl;
#endif
result.diffuse=ndl*diffuseColor*attenuation;
#ifdef SPECULARTERM
var angleW: vec3f=normalize(viewDirectionW+lightVectorW);var specComp: f32=max(0.,dot(vNormal,angleW));specComp=pow(specComp,max(1.,glossiness));result.specular=specComp*specularColor*attenuation;
#endif
return result;}
fn getAttenuation(cosAngle: f32,exponent: f32)->f32 {return max(0.,pow(cosAngle,exponent));}
fn getIESAttenuation(cosAngle: f32,iesLightTexture: texture_2d<f32>,iesLightTextureSampler: sampler)->f32 {var angle=acos(cosAngle)/PI;return textureSampleLevel(iesLightTexture,iesLightTextureSampler,vec2f(angle,0),0.).r;}
fn computeBasicSpotLighting(viewDirectionW: vec3f,lightVectorW: vec3f,vNormal: vec3f,attenuation: f32,diffuseColor: vec3f,specularColor: vec3f,glossiness: f32)->lightingInfo {var result: lightingInfo;var ndl: f32=max(0.,dot(vNormal,lightVectorW));
#ifdef NDOTL
result.ndl=ndl;
#endif
result.diffuse=ndl*diffuseColor*attenuation;
#ifdef SPECULARTERM
var angleW: vec3f=normalize(viewDirectionW+lightVectorW);var specComp: f32=max(0.,dot(vNormal,angleW));specComp=pow(specComp,max(1.,glossiness));result.specular=specComp*specularColor*attenuation;
#endif
return result;}
fn computeIESSpotLighting(viewDirectionW: vec3f,vNormal: vec3f,lightData: vec4f,lightDirection: vec4f,diffuseColor: vec3f,specularColor: vec3f,range: f32,glossiness: f32,iesLightTexture: texture_2d<f32>,iesLightTextureSampler: sampler)->lightingInfo {var direction: vec3f=lightData.xyz-fragmentInputs.vPositionW;var lightVectorW: vec3f=normalize(direction);var attenuation: f32=max(0.,1.0-length(direction)/range);var dotProduct=dot(lightDirection.xyz,-lightVectorW);var cosAngle: f32=max(0.,dotProduct);if (cosAngle>=lightDirection.w)
{attenuation*=getIESAttenuation(dotProduct,iesLightTexture,iesLightTextureSampler);return computeBasicSpotLighting(viewDirectionW,lightVectorW,vNormal,attenuation,diffuseColor,specularColor,glossiness);}
var result: lightingInfo;result.diffuse=vec3f(0.);
#ifdef SPECULARTERM
result.specular=vec3f(0.);
#endif
#ifdef NDOTL
result.ndl=0.;
#endif
return result;}
fn computeSpotLighting(viewDirectionW: vec3f,vNormal: vec3f ,lightData: vec4f,lightDirection: vec4f,diffuseColor: vec3f,specularColor: vec3f,range: f32,glossiness: f32)->lightingInfo {var direction: vec3f=lightData.xyz-fragmentInputs.vPositionW;var lightVectorW: vec3f=normalize(direction);var attenuation: f32=max(0.,1.0-length(direction)/range);var cosAngle: f32=max(0.,dot(lightDirection.xyz,-lightVectorW));if (cosAngle>=lightDirection.w)
{attenuation*=getAttenuation(cosAngle,lightData.w);return computeBasicSpotLighting(viewDirectionW,lightVectorW,vNormal,attenuation,diffuseColor,specularColor,glossiness);}
var result: lightingInfo;result.diffuse=vec3f(0.);
#ifdef SPECULARTERM
result.specular=vec3f(0.);
#endif
#ifdef NDOTL
result.ndl=0.;
#endif
return result;}
fn computeHemisphericLighting(viewDirectionW: vec3f,vNormal: vec3f,lightData: vec4f,diffuseColor: vec3f,specularColor: vec3f,groundColor: vec3f,glossiness: f32)->lightingInfo {var result: lightingInfo;var ndl: f32=dot(vNormal,lightData.xyz)*0.5+0.5;
#ifdef NDOTL
result.ndl=ndl;
#endif
result.diffuse=mix(groundColor,diffuseColor,ndl);
#ifdef SPECULARTERM
var angleW: vec3f=normalize(viewDirectionW+lightData.xyz);var specComp: f32=max(0.,dot(vNormal,angleW));specComp=pow(specComp,max(1.,glossiness));result.specular=specComp*specularColor;
#endif
return result;}
fn computeProjectionTextureDiffuseLighting(projectionLightTexture: texture_2d<f32>,projectionLightSampler: sampler,textureProjectionMatrix: mat4x4f,posW: vec3f)->vec3f {var strq: vec4f=textureProjectionMatrix*vec4f(posW,1.0);strq/=strq.w;var textureColor: vec3f=textureSample(projectionLightTexture,projectionLightSampler,strq.xy).rgb;return textureColor;}
#if defined(AREALIGHTUSED) && defined(AREALIGHTSUPPORTED)
#include<ltcHelperFunctions>
var areaLightsLTC1SamplerSampler: sampler;var areaLightsLTC1Sampler: texture_2d<f32>;var areaLightsLTC2SamplerSampler: sampler;var areaLightsLTC2Sampler: texture_2d<f32>;fn computeAreaLighting(ltc1: texture_2d<f32>,ltc1Sampler:sampler,ltc2:texture_2d<f32>,ltc2Sampler:sampler,viewDirectionW: vec3f,vNormal:vec3f,vPosition:vec3f,lightPosition:vec3f,halfWidth:vec3f, halfHeight:vec3f,diffuseColor:vec3f,specularColor:vec3f,roughness:f32 )->lightingInfo
{var result: lightingInfo;var data: areaLightData=computeAreaLightSpecularDiffuseFresnel(ltc1,ltc1Sampler,ltc2,ltc2Sampler,viewDirectionW,vNormal,vPosition,lightPosition,halfWidth,halfHeight,roughness);
#ifdef SPECULARTERM
var fresnel:vec3f=( specularColor*data.Fresnel.x+( vec3f( 1.0 )-specularColor )*data.Fresnel.y );result.specular+=specularColor*fresnel*data.Specular;
#endif
result.diffuse+=diffuseColor*data.Diffuse;return result;}
fn computeAreaLightingWithTexture(ltc1: texture_2d<f32>,ltc1Sampler:sampler,ltc2:texture_2d<f32>,ltc2Sampler:sampler,emissionTexture: texture_2d<f32>,emissionTextureSampler:sampler,viewDirectionW: vec3f,vNormal:vec3f,vPosition:vec3f,lightPosition:vec3f,halfWidth:vec3f, halfHeight:vec3f,diffuseColor:vec3f,specularColor:vec3f,roughness:f32 )->lightingInfo
{var result: lightingInfo;var data: areaLightData=computeAreaLightSpecularDiffuseFresnelWithEmission(ltc1,ltc1Sampler,ltc2,ltc2Sampler,emissionTexture,emissionTextureSampler,viewDirectionW,vNormal,vPosition,lightPosition,halfWidth,halfHeight,roughness);
#ifdef SPECULARTERM
var fresnel: vec3f=( specularColor*data.Fresnel.x+( vec3f( 1.0 )-specularColor )*data.Fresnel.y );result.specular+=specularColor*fresnel*data.Specular;
#endif
result.diffuse+=diffuseColor*data.Diffuse;return result;}
#endif
#if defined(CLUSTLIGHT_BATCH) && CLUSTLIGHT_BATCH>0
#include<clusteredLightingFunctions>
fn computeClusteredLighting(
lightDataTexture: texture_2d<f32>,
tileMaskBuffer: ptr<storage,array<u32>>,
viewDirectionW: vec3f,
vNormal: vec3f,
lightData: vec4f,
sliceRange: vec2u,
glossiness: f32
)->lightingInfo {var result: lightingInfo;let tilePosition=vec2u(fragmentInputs.position.xy*lightData.xy);let maskResolution=vec2u(lightData.zw);var tileIndex=(tilePosition.x*maskResolution.x+tilePosition.y)*maskResolution.y;let batchRange=sliceRange/CLUSTLIGHT_BATCH;var batchOffset=batchRange.x*CLUSTLIGHT_BATCH;tileIndex+=batchRange.x;for (var i=batchRange.x; i<=batchRange.y; i+=1) {var mask=tileMaskBuffer[tileIndex];tileIndex+=1;let maskOffset=max(sliceRange.x,batchOffset)-batchOffset; 
let maskWidth=min(sliceRange.y-batchOffset+1,CLUSTLIGHT_BATCH);mask=extractBits(mask,maskOffset,maskWidth);while mask != 0 {let trailing=firstTrailingBit(mask);mask ^= 1u<<trailing;let light=getClusteredLight(lightDataTexture,batchOffset+maskOffset+trailing);var info: lightingInfo;if light.vLightDirection.w<0.0 {info=computeLighting(viewDirectionW,vNormal,light.vLightData,light.vLightDiffuse.rgb,light.vLightSpecular.rgb,light.vLightDiffuse.a,glossiness);} else {info=computeSpotLighting(viewDirectionW,vNormal,light.vLightData,light.vLightDirection,light.vLightDiffuse.rgb,light.vLightSpecular.rgb,light.vLightDiffuse.a,glossiness);}
result.diffuse+=info.diffuse;
#ifdef SPECULARTERM
result.specular+=info.specular;
#endif
}
batchOffset+=CLUSTLIGHT_BATCH;}
return result;}
#endif
`;t.ShaderStore.IncludesShadersStoreWGSL[r]||(t.ShaderStore.IncludesShadersStoreWGSL[r]=i),e.s(["lightsFragmentFunctionsWGSL",0,{name:r,shader:i}])},20924,e=>{"use strict";e.s(["StorageBuffer",0,class{constructor(e,t,r=3,i){this._engine=e,this._label=i,this._engine._storageBuffers.push(this),this._create(t,r)}_create(e,t){this._bufferSize=e,this._creationFlags=t,this._buffer=this._engine.createStorageBuffer(e,t,this._label)}_rebuild(){this._create(this._bufferSize,this._creationFlags)}getBuffer(){return this._buffer}clear(e,t){this._engine.clearStorageBuffer(this._buffer,e,t)}update(e,t,r){this._buffer&&this._engine.updateStorageBuffer(this._buffer,e,t,r)}async read(e,t,r,i){return await this._engine.readFromStorageBuffer(this._buffer,e,t,r,i)}dispose(){let e=this._engine._storageBuffers,t=e.indexOf(this);-1!==t&&(e[t]=e[e.length-1],e.pop()),this._engine._releaseBuffer(this._buffer),this._buffer=null}}])},677468,e=>{"use strict";var t=e.i(730939),r=e.i(548894),i=e.i(170160),a=e.i(774685),o=e.i(269671),n=e.i(894436),s=e.i(700183),l=e.i(917155),f=e.i(490826),c=e.i(725224);class d{get options(){return this._options}get shaderPath(){return this._shaderPath}constructor(e,t,r,i={}){if(this._bindings={},this._samplers={},this._contextIsDirty=!1,this.fastMode=!1,this.onCompiled=null,this.onError=null,this.triggerContextRebuild=!1,this.name=e,this._engine=t,this.uniqueId=n.UniqueIdGenerator.UniqueId,t.enableGPUTimingMeasurements&&(this.gpuTimeInFrame=new f.WebGPUPerfCounter),!this._engine.getCaps().supportComputeShaders)return void s.Logger.Error("This engine does not support compute shaders!");if(!i.bindingsMapping)return void s.Logger.Error("You must provide the binding mappings as browsers don't support reflection for wgsl shaders yet!");this._context=t.createComputeContext(),this._shaderPath=r,this._options={bindingsMapping:{},defines:[],entryPoint:"main",...i}}getClassName(){return"ComputeShader"}setTexture(e,t,r=!0){let i=this._bindings[e];this._bindings[e]={type:4*!r,object:t,indexInGroupEntries:i?.indexInGroupEntries},this._contextIsDirty||(this._contextIsDirty=!i||i.object!==t||i.type!==this._bindings[e].type)}setInternalTexture(e,t){let r=this._bindings[e];this._bindings[e]={type:8,object:t,indexInGroupEntries:r?.indexInGroupEntries},this._contextIsDirty||(this._contextIsDirty=!r||r.object!==t||r.type!==this._bindings[e].type)}setStorageTexture(e,t){let r=this._bindings[e];this._contextIsDirty||(this._contextIsDirty=!r||r.object!==t),this._bindings[e]={type:1,object:t,indexInGroupEntries:r?.indexInGroupEntries}}setExternalTexture(e,t){let r=this._bindings[e];this._contextIsDirty||(this._contextIsDirty=!r||r.object!==t),this._bindings[e]={type:6,object:t,indexInGroupEntries:r?.indexInGroupEntries}}setVideoTexture(e,t){return!!t.externalTexture&&(this.setExternalTexture(e,t.externalTexture),!0)}setUniformBuffer(e,t){let r=this._bindings[e];this._contextIsDirty||(this._contextIsDirty=!r||r.object!==t),this._bindings[e]={type:d._BufferIsDataBuffer(t)?7:2,object:t,indexInGroupEntries:r?.indexInGroupEntries}}setStorageBuffer(e,t){let r=this._bindings[e];this._contextIsDirty||(this._contextIsDirty=!r||r.object!==t),this._bindings[e]={type:d._BufferIsDataBuffer(t)?7:3,object:t,indexInGroupEntries:r?.indexInGroupEntries}}setTextureSampler(e,t){let r=this._bindings[e];this._contextIsDirty||(this._contextIsDirty=!r||!t.compareSampler(r.object)),this._bindings[e]={type:5,object:t,indexInGroupEntries:r?.indexInGroupEntries}}isReady(){let e=this._effect;for(let e in this._bindings){let t=this._bindings[e],r=t.type,i=t.object;switch(r){case 0:case 4:case 1:case 6:if(!i.isReady())return!1}}let t=["#define "+this._options.entryPoint],r=this._shaderPath;if(this._options.defines)for(let e=0;e<this._options.defines.length;e++)t.push(this._options.defines[e]);let i=t.join("\n");return this._cachedDefines!==i&&(this._cachedDefines=i,e=this._engine.createComputeEffect(r,{defines:i,entryPoint:this._options.entryPoint,onCompiled:this.onCompiled,onError:this.onError}),this._effect=e),!!e.isReady()}dispatch(e,t,r){return(!!this.fastMode&&!this.triggerContextRebuild||!!this._checkContext())&&(this._engine.computeDispatch(this._effect,this._context,this._bindings,e,t,r,this._options.bindingsMapping,this.gpuTimeInFrame),!0)}dispatchIndirect(e,t=0){if((!this.fastMode||this.triggerContextRebuild)&&!this._checkContext())return!1;let r=d._BufferIsDataBuffer(e)?e:e.getBuffer();return this._engine.computeDispatchIndirect(this._effect,this._context,this._bindings,r,t,this._options.bindingsMapping,this.gpuTimeInFrame),!0}_checkContext(){if(!this.isReady())return!1;for(let e in this._bindings){let t=this._bindings[e];if(!this._options.bindingsMapping[e])throw Error("ComputeShader ('"+this.name+"'): No binding mapping has been provided for the property '"+e+"'");switch(t.type){case 0:{let r=this._samplers[e],i=t.object;r&&i._texture&&r.compareSampler(i._texture)||(this._samplers[e]=new l.TextureSampler().setParameters(i.wrapU,i.wrapV,i.wrapR,i.anisotropicFilteringLevel,i._texture.samplingMode,i._texture?._comparisonFunction),this._contextIsDirty=!0);break}case 6:this._contextIsDirty=!0;break;case 2:{let e=t.object;e.getBuffer()!==t.buffer&&(t.buffer=e.getBuffer(),this._contextIsDirty=!0)}}}return this._contextIsDirty&&(this.triggerContextRebuild=!1,this._contextIsDirty=!1,this._context.clear()),!0}async dispatchWhenReady(e,t,r,i=10){return await new Promise(a=>{(0,c._RetryWithInterval)(()=>this.dispatch(e,t,r),a,void 0,i)})}serialize(){let e=i.SerializationHelper.Serialize(this);for(let t in e.options=this._options,e.shaderPath=this._shaderPath,e.bindings={},e.textures={},this._bindings){let r=this._bindings[t],i=r.object;switch(r.type){case 0:case 4:case 1:{let a=i.serialize();a&&(e.textures[t]=a,e.bindings[t]={type:r.type})}}}return e}static Parse(e,t,r){let a=i.SerializationHelper.Parse(()=>new d(e.name,t.getEngine(),e.shaderPath,e.options),e,t,r);for(let i in e.textures){let n=e.bindings[i],s=o.Texture.Parse(e.textures[i],t,r);0===n.type?a.setTexture(i,s):4===n.type?a.setTexture(i,s,!1):a.setStorageTexture(i,s)}return a}static _BufferIsDataBuffer(e){return void 0!==e.underlyingResource}}(0,t.__decorate)([(0,r.serialize)()],d.prototype,"name",void 0),(0,t.__decorate)([(0,r.serialize)()],d.prototype,"fastMode",void 0),(0,a.RegisterClass)("BABYLON.ComputeShader",d),e.s(["ComputeShader",0,d])},737439,e=>{"use strict";var t=e.i(677468),r=e.i(20924),i=e.i(874947),a=e.i(202286),o=e.i(916817),n=e.i(263537);let s="boundingInfoComputeShader",l=`struct Results {minX : atomic<i32>,
minY : atomic<i32>,
minZ : atomic<i32>,
maxX : atomic<i32>,
maxY : atomic<i32>,
maxZ : atomic<i32>,
dummy1 : i32,
dummy2 : i32,};fn floatToBits(value: f32)->i32 {return bitcast<i32>(value);}
fn bitsToFloat(value: i32)->f32 {return bitcast<f32>(value);}
fn atomicMinFloat(atomicVar: ptr<storage,atomic<i32>,read_write>,value: f32) {let intValue=floatToBits(value);loop {let oldIntValue=atomicLoad(atomicVar);let oldValue=bitsToFloat(oldIntValue);if (value>=oldValue) {break;}
if (atomicCompareExchangeWeak(atomicVar,oldIntValue,intValue).old_value==oldIntValue) {break;}}}
fn atomicMaxFloat(atomicVar: ptr<storage,atomic<i32>,read_write>,value: f32) {let intValue=floatToBits(value);loop {let oldIntValue=atomicLoad(atomicVar);let oldValue=bitsToFloat(oldIntValue);if (value<=oldValue) {break;}
if (atomicCompareExchangeWeak(atomicVar,oldIntValue,intValue).old_value==oldIntValue) {break;}}}
fn readMatrixFromRawSampler(smp : texture_2d<f32>,index : f32)->mat4x4<f32>
{let offset=i32(index)*4; 
let textureWidth=i32(settings.boneTextureInfo.x);let y=offset/textureWidth;let x=offset % textureWidth;let m0=textureLoad(smp,vec2<i32>(x+0,y),0);let m1=textureLoad(smp,vec2<i32>(x+1,y),0);let m2=textureLoad(smp,vec2<i32>(x+2,y),0);let m3=textureLoad(smp,vec2<i32>(x+3,y),0);return mat4x4<f32>(m0,m1,m2,m3);}
const identity=mat4x4f(
vec4f(1.0,0.0,0.0,0.0),
vec4f(0.0,1.0,0.0,0.0),
vec4f(0.0,0.0,1.0,0.0),
vec4f(0.0,0.0,0.0,1.0)
);struct Settings {boneTextureInfo: vec2f,
morphTargetTextureInfo: vec3f,
morphTargetCount: f32,
indexResult : u32,};@group(0) @binding(0) var<storage,read> positionBuffer : array<f32>;@group(0) @binding(1) var<storage,read_write> resultBuffer : array<Results>;@group(0) @binding(7) var<uniform> settings : Settings;
#if NUM_BONE_INFLUENCERS>0
@group(0) @binding(2) var boneSampler : texture_2d<f32>;@group(0) @binding(3) var<storage,read> indexBuffer : array<vec4f>;@group(0) @binding(4) var<storage,read> weightBuffer : array<vec4f>;
#if NUM_BONE_INFLUENCERS>4
@group(0) @binding(5) var<storage,read> indexExtraBuffer : array<vec4f>;@group(0) @binding(6) var<storage,read> weightExtraBuffer : array<vec4f>;
#endif
#endif
#ifdef MORPHTARGETS
@group(0) @binding(8) var morphTargets : texture_2d_array<f32>;@group(0) @binding(9) var<storage,read> morphTargetInfluences : array<f32>;@group(0) @binding(10) var<storage,read> morphTargetTextureIndices : array<f32>;
#endif
#ifdef MORPHTARGETS
fn readVector3FromRawSampler(targetIndex : i32,vertexIndex : u32)->vec3f
{ 
let vertexID: u32=vertexIndex*u32(settings.morphTargetTextureInfo.x);let textureWidth: u32=u32(settings.morphTargetTextureInfo.y);let y: u32=vertexID/textureWidth;let x: u32=vertexID % textureWidth;return textureLoad(morphTargets,vec2u(x,y),u32(morphTargetTextureIndices[targetIndex]),0).xyz;}
fn readVector4FromRawSampler(targetIndex : i32,vertexIndex : u32)->vec4f
{ 
let vertexID: u32=vertexIndex*u32(settings.morphTargetTextureInfo.x);let textureWidth: u32=u32(settings.morphTargetTextureInfo.y);let y: u32=vertexID/textureWidth;let x: u32=vertexID % textureWidth;return textureLoad(morphTargets,vec2u(x,y),u32(morphTargetTextureIndices[targetIndex]),0);}
#endif
@compute @workgroup_size(256,1,1)
fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {let index=global_id.x;if (index>=arrayLength(&positionBuffer)/3) {return;}
let position=vec3f(positionBuffer[index*3],positionBuffer[index*3+1],positionBuffer[index*3+2]);var finalWorld=identity;var positionUpdated=position;
#if NUM_BONE_INFLUENCERS>0
var influence : mat4x4<f32>;let matricesIndices=indexBuffer[index];let matricesWeights=weightBuffer[index];influence=readMatrixFromRawSampler(boneSampler,matricesIndices[0])*matricesWeights[0];
#if NUM_BONE_INFLUENCERS>1
influence=influence+readMatrixFromRawSampler(boneSampler,matricesIndices[1])*matricesWeights[1];
#endif 
#if NUM_BONE_INFLUENCERS>2
influence=influence+readMatrixFromRawSampler(boneSampler,matricesIndices[2])*matricesWeights[2];
#endif 
#if NUM_BONE_INFLUENCERS>3
influence=influence+readMatrixFromRawSampler(boneSampler,matricesIndices[3])*matricesWeights[3];
#endif 
#if NUM_BONE_INFLUENCERS>4
let matricesIndicesExtra=indexExtraBuffer[index];let matricesWeightsExtra=weightExtraBuffer[index];influence=influence+readMatrixFromRawSampler(boneSampler,matricesIndicesExtra.x)*matricesWeightsExtra.x;
#if NUM_BONE_INFLUENCERS>5
influence=influence+readMatrixFromRawSampler(boneSampler,matricesIndicesExtra.y)*matricesWeightsExtra.y;
#endif 
#if NUM_BONE_INFLUENCERS>6
influence=influence+readMatrixFromRawSampler(boneSampler,matricesIndicesExtra.z)*matricesWeightsExtra.z;
#endif 
#if NUM_BONE_INFLUENCERS>7
influence=influence+readMatrixFromRawSampler(boneSampler,matricesIndicesExtra.w)*matricesWeightsExtra.w;
#endif 
#endif 
finalWorld=finalWorld*influence;
#endif
#ifdef MORPHTARGETS
for (var i=0; i<NUM_MORPH_INFLUENCERS; i=i+1) {if (f32(i)>=settings.morphTargetCount) {break;}
positionUpdated=positionUpdated+(readVector3FromRawSampler(i,index)-position)*morphTargetInfluences[i];}
#endif
var worldPos=finalWorld*vec4f(positionUpdated.x,positionUpdated.y,positionUpdated.z,1.0);atomicMinFloat(&resultBuffer[settings.indexResult].minX,worldPos.x);atomicMinFloat(&resultBuffer[settings.indexResult].minY,worldPos.y);atomicMinFloat(&resultBuffer[settings.indexResult].minZ,worldPos.z);atomicMaxFloat(&resultBuffer[settings.indexResult].maxX,worldPos.x);atomicMaxFloat(&resultBuffer[settings.indexResult].maxY,worldPos.y);atomicMaxFloat(&resultBuffer[settings.indexResult].maxZ,worldPos.z);}
`;n.ShaderStore.ShadersStoreWGSL[s]||(n.ShaderStore.ShadersStoreWGSL[s]=l);var f=e.i(725224);e.s(["ComputeShaderBoundingHelper",0,class{constructor(e){this._computeShadersCache={},this._positionBuffers={},this._indexBuffers={},this._weightBuffers={},this._indexExtraBuffers={},this._weightExtraBuffers={},this._morphTargetInfluenceBuffers={},this._morphTargetTextureIndexBuffers={},this._ubos=[],this._uboIndex=0,this._processedMeshes=[],this._computeShaders=[],this._uniqueComputeShaders=new Set,this._resultBuffers=[],this._engine=e}_getComputeShader(e,r,i){let a,o=e.join("\n");if(this._computeShadersCache[o])a=this._computeShadersCache[o];else{let n={positionBuffer:{group:0,binding:0},resultBuffer:{group:0,binding:1},settings:{group:0,binding:7}};r&&(n.boneSampler={group:0,binding:2},n.indexBuffer={group:0,binding:3},n.weightBuffer={group:0,binding:4},n.indexExtraBuffer={group:0,binding:5},n.weightExtraBuffer={group:0,binding:6}),i&&(n.morphTargets={group:0,binding:8},n.morphTargetInfluences={group:0,binding:9},n.morphTargetTextureIndices={group:0,binding:10}),a=new t.ComputeShader(`boundingInfoCompute${r?"_bones":""}${i?"_morphs":""}`,this._engine,"boundingInfo",{bindingsMapping:n,defines:e}),this._computeShadersCache[o]=a}return a}_getUBO(){if(this._uboIndex>=this._ubos.length){let e=new o.UniformBuffer(this._engine);e.addFloat2("boneTextureInfo",0,0),e.addFloat3("morphTargetTextureInfo",0,0,0),e.addUniform("morphTargetCount",1),e.addUniform("indexResult",1),this._ubos.push(e)}return this._ubos[this._uboIndex++]}_extractDataAndLink(e,t,i,a,o,n){let s,l=t.getTotalVertices();if(n[t.uniqueId])s=n[t.uniqueId];else{let e=t.getVertexBuffer(i)?.getFloatData(l);(s=new r.StorageBuffer(this._engine,Float32Array.BYTES_PER_ELEMENT*l*a)).update(e),n[t.uniqueId]=s}e.setStorageBuffer(o,s)}_prepareStorage(e,t,i,a,o,n){let s;a[i]?s=a[i]:(s=new r.StorageBuffer(this._engine,Float32Array.BYTES_PER_ELEMENT*o),a[i]=s),s.update(n),e.setStorageBuffer(t,s)}async processAsync(e){await this.registerMeshListAsync(e),this.processMeshList(),await this.fetchResultsForMeshListAsync()}registerMeshListAsync(e){this._disposeForMeshList(),Array.isArray(e)||(e=[e]);let t=0;for(let r=0;r<e.length;r++){let a=e[r];if(0===a.getTotalVertices()||!a.getVertexBuffer||!a.getVertexBuffer(i.VertexBuffer.PositionKind))continue;this._processedMeshes.push(a);let o=a.morphTargetManager;o&&o.supportsPositions&&(t=Math.max(t,o.numTargets))}for(let e=0;e<this._processedMeshes.length;e++){let r=this._processedMeshes[e],i=[""],a=!1;r&&r.useBones&&r.computeBonesUsingShaders&&r.skeleton&&(i.push("#define NUM_BONE_INFLUENCERS "+r.numBoneInfluencers),a=!0);let o=this._getComputeShader(i,a,!1);this._uniqueComputeShaders.add(o);let n=r.morphTargetManager;if(n&&n.supportsPositions){(i=i.slice()).push("#define MORPHTARGETS"),i.push("#define NUM_MORPH_INFLUENCERS "+t);let e=this._getComputeShader(i,a,!0);this._uniqueComputeShaders.add(e),this._computeShaders.push([o,e])}else this._computeShaders.push([o,o]);let s=this._getUBO();s.updateUInt("indexResult",e),s.update()}return new Promise(e=>{(0,f._RetryWithInterval)(()=>{let e=this._uniqueComputeShaders.keys();for(let t=e.next();!0!==t.done;t=e.next())if(!t.value.isReady())return!1;return!0},e)})}processMeshList(){if(0===this._processedMeshes.length)return;this._uboIndex=0;let e=8*this._processedMeshes.length,t=new Float32Array(e),a=new r.StorageBuffer(this._engine,Float32Array.BYTES_PER_ELEMENT*e);this._resultBuffers.push(a);for(let e=0;e<this._processedMeshes.length;e++)t[8*e+0]=1/0,t[8*e+1]=1/0,t[8*e+2]=1/0,t[8*e+3]=-1/0,t[8*e+4]=-1/0,t[8*e+5]=-1/0;a.update(t);for(let e=0;e<this._processedMeshes.length;e++){let t=this._processedMeshes[e],r=t.getTotalVertices(),[o,n]=this._computeShaders[e],s=t.morphTargetManager,l=s&&s.numInfluencers>0&&s.supportsPositions,f=l?n:o;this._extractDataAndLink(f,t,i.VertexBuffer.PositionKind,3,"positionBuffer",this._positionBuffers);let c=this._getUBO(),d=!1;if(t&&t.useBones&&t.computeBonesUsingShaders&&t.skeleton&&t.skeleton.useTextureToStoreBoneMatrices){this._extractDataAndLink(f,t,i.VertexBuffer.MatricesIndicesKind,4,"indexBuffer",this._indexBuffers),this._extractDataAndLink(f,t,i.VertexBuffer.MatricesWeightsKind,4,"weightBuffer",this._weightBuffers);let e=t.skeleton.getTransformMatrixTexture(t);f.setTexture("boneSampler",e,!1),c.updateFloat2("boneTextureInfo",t.skeleton._textureWidth,t.skeleton._textureHeight),d=!0,t.numBoneInfluencers>4&&(this._extractDataAndLink(f,t,i.VertexBuffer.MatricesIndicesExtraKind,4,"indexExtraBuffer",this._indexExtraBuffers),this._extractDataAndLink(f,t,i.VertexBuffer.MatricesWeightsExtraKind,4,"weightExtraBuffer",this._weightExtraBuffers))}if(l){let e=s._targetStoreTexture;f.setTexture("morphTargets",e,!1),this._prepareStorage(f,"morphTargetInfluences",t.uniqueId,this._morphTargetInfluenceBuffers,s.numInfluencers,s.influences),this._prepareStorage(f,"morphTargetTextureIndices",t.uniqueId,this._morphTargetTextureIndexBuffers,s.numInfluencers,s._morphTargetTextureIndices),c.updateFloat3("morphTargetTextureInfo",s._textureVertexStride,s._textureWidth,s._textureHeight),c.updateFloat("morphTargetCount",s.numInfluencers),d=!0}d&&c.update(),f.setStorageBuffer("resultBuffer",a),f.setUniformBuffer("settings",c),f.dispatch(Math.ceil(r/256)),this._engine.flushFramebuffer()}}async fetchResultsForMeshListAsync(){return await new Promise(e=>{let t=[],r=0;for(let e=0;e<this._resultBuffers.length;e++){let i=this._resultBuffers[e].getBuffer();t.push(i),r+=i.capacity}let i=new Float32Array(r/Float32Array.BYTES_PER_ELEMENT),o=a.Vector3.Zero(),n=a.Vector3.Zero(),s={minimum:o,maximum:n};this._engine.readFromMultipleStorageBuffers(t,0,void 0,i,!0).then(()=>{let t=0;for(let e=0;e<this._resultBuffers.length;e++){for(let r=0;r<this._processedMeshes.length;r++){let l=this._processedMeshes[r];a.Vector3.FromArrayToRef(i,t+8*r,o),a.Vector3.FromArrayToRef(i,t+8*r+3,n),e>0&&(o.minimizeInPlace(l.getBoundingInfo().minimum),n.maximizeInPlace(l.getBoundingInfo().maximum)),l._refreshBoundingInfoDirect(s)}t+=8*this._processedMeshes.length}for(let e of this._resultBuffers)e.dispose();this._resultBuffers=[],this._uboIndex=0,e()})})}_disposeCache(e){for(let t in e)e[t].dispose()}_disposeForMeshList(){for(let e of this._resultBuffers)e.dispose();this._resultBuffers=[],this._processedMeshes=[],this._computeShaders=[],this._uniqueComputeShaders=new Set}dispose(){for(let e of(this._disposeCache(this._positionBuffers),this._positionBuffers={},this._disposeCache(this._indexBuffers),this._indexBuffers={},this._disposeCache(this._weightBuffers),this._weightBuffers={},this._disposeCache(this._morphTargetInfluenceBuffers),this._morphTargetInfluenceBuffers={},this._disposeCache(this._morphTargetTextureIndexBuffers),this._morphTargetTextureIndexBuffers={},this._ubos))e.dispose();this._ubos=[],this._computeShadersCache={},this._engine=void 0,this._disposeForMeshList()}}],737439)},13308,559844,732809,566784,255759,346339,856952,402131,e=>{"use strict";var t,r,i,a,o,n,s=e.i(700183),l=e.i(213361);(t=a||(a={}))[t.NO_COMPRESSION=0]="NO_COMPRESSION",t[t.RLE_COMPRESSION=1]="RLE_COMPRESSION",t[t.ZIPS_COMPRESSION=2]="ZIPS_COMPRESSION",t[t.ZIP_COMPRESSION=3]="ZIP_COMPRESSION",t[t.PIZ_COMPRESSION=4]="PIZ_COMPRESSION",t[t.PXR24_COMPRESSION=5]="PXR24_COMPRESSION",(r=o||(o={}))[r.INCREASING_Y=0]="INCREASING_Y",r[r.DECREASING_Y=1]="DECREASING_Y";let f=function(){let e=new ArrayBuffer(4),t=new Float32Array(e),r=new Uint32Array(e),i=new Uint32Array(512),a=new Uint32Array(512);for(let e=0;e<256;++e){let t=e-127;t<-27?(i[e]=0,i[256|e]=32768,a[e]=24,a[256|e]=24):t<-14?(i[e]=1024>>-t-14,i[256|e]=1024>>-t-14|32768,a[e]=-t-1,a[256|e]=-t-1):t<=15?(i[e]=t+15<<10,i[256|e]=t+15<<10|32768,a[e]=13,a[256|e]=13):t<128?(i[e]=31744,i[256|e]=64512,a[e]=24,a[256|e]=24):(i[e]=31744,i[256|e]=64512,a[e]=13,a[256|e]=13)}let o=new Uint32Array(2048),n=new Uint32Array(64),s=new Uint32Array(64);for(let e=1;e<1024;++e){let t=e<<13,r=0;for(;(8388608&t)==0;)t<<=1,r-=8388608;t&=-8388609,r+=0x38800000,o[e]=t|r}for(let e=1024;e<2048;++e)o[e]=0x38000000+(e-1024<<13);for(let e=1;e<31;++e)n[e]=e<<23;n[31]=0x47800000,n[32]=0x80000000;for(let e=33;e<63;++e)n[e]=0x80000000+(e-32<<23);n[63]=0xc7800000;for(let e=1;e<64;++e)32!==e&&(s[e]=1024);return{floatView:t,uint32View:r,baseTable:i,shiftTable:a,mantissaTable:o,exponentTable:n,offsetTable:s}}();function c(e,t){let r=new Uint8Array(e),i=0;for(;0!=r[t.value+i];)i+=1;let a=new TextDecoder().decode(r.slice(t.value,t.value+i));return t.value=t.value+i+1,a}function d(e,t){let r=e.getInt32(t.value,!0);return t.value+=4,r}function u(e,t){let r=e.getUint32(t.value,!0);return t.value+=4,r}function m(e,t){let r=e.getUint8(t.value);return t.value+=1,r}function p(e,t){let r=e.getUint16(t.value,!0);return t.value+=2,r}function v(e,t){let r=e[t.value];return t.value+=1,r}function S(e,t){let r;return r="getBigInt64"in DataView.prototype?Number(e.getBigInt64(t.value,!0)):e.getUint32(t.value+4,!0)+Number(e.getUint32(t.value,!0)<<32),t.value+=8,r}function h(e,t){let r=e.getFloat32(t.value,!0);return t.value+=4,r}function x(e,t){var r;let i,a;return i=(31744&(r=p(e,t)))>>10,a=1023&r,(r>>15?-1:1)*(i?31===i?a?NaN:1/0:Math.pow(2,i-15)*(1+a/1024):a/1024*6103515625e-14)}function g(e,t){var r=h(e,t);if(Math.abs(r)>65504)throw Error("Value out of range.Consider using float instead of half-float.");r=(0,l.Clamp)(r,-65504,65504),f.floatView[0]=r;let i=f.uint32View[0],a=i>>23&511;return f.baseTable[a]+((8388607&i)>>f.shiftTable[a])}function E(e,t,r,i){var a;switch(r){case"string":case"stringvector":case"iccProfile":let n;return a=e.buffer,n=new TextDecoder().decode(new Uint8Array(a).slice(t.value,t.value+i)),t.value=t.value+i,n;case"chlist":return function(e,t,r){let i=t.value,a=[];for(;t.value<i+r-1;){let r=c(e.buffer,t),i=d(e,t),o=m(e,t);t.value+=3;let n=d(e,t),s=d(e,t);a.push({name:r,pixelType:i,pLinear:o,xSampling:n,ySampling:s})}return t.value+=1,a}(e,t,i);case"chromaticities":let s,l,f,p,v,S;return s=h(e,t),l=h(e,t),f=h(e,t),p=h(e,t),v=h(e,t),S=h(e,t),{redX:s,redY:l,greenX:f,greenY:p,blueX:v,blueY:S,whiteX:h(e,t),whiteY:h(e,t)};case"compression":return m(e,t);case"box2i":let x,g;return x=d(e,t),g=d(e,t),{xMin:x,yMin:g,xMax:d(e,t),yMax:d(e,t)};case"lineOrder":return o[m(e,t)];case"float":return h(e,t);case"v2f":return[h(e,t),h(e,t)];case"v3f":let E;return E=h(e,t),[E,h(e,t),h(e,t)];case"int":return d(e,t);case"rational":return[d(e,t),u(e,t)];case"timecode":return[u(e,t),u(e,t)];case"preview":return t.value+=i,"skipped";default:t.value+=i;return}}function _(e){for(let t=1;t<e.length;t++){let r=e[t-1]+e[t]-128;e[t]=r}}function I(e,t){let r=0,i=Math.floor((e.length+1)/2),a=0,o=e.length-1;for(;!(a>o)&&(t[a++]=e[r++],!(a>o));){;t[a++]=e[i++]}}function T(e,t){if(0x1312f76!=e.getUint32(0,!0))throw Error("Incorrect OpenEXR format");let r=e.getUint8(4),i=e.getUint8(5);t.value=8;let a={},o=!0;for(;o;){let r=c(e.buffer,t);if(r){let i=c(e.buffer,t),o=u(e,t),n=E(e,t,i,o);void 0===n?s.Logger.Warn(`Unknown header attribute type ${i}'.`):a[r]=n}else o=!1}if((-5&i)!=0)throw Error("Unsupported file format");return{version:r,spec:{singleTile:!!(2&i),longName:!!(4&i),deepFormat:!!(8&i),multiPart:!!(16&i)},...a}}e.s(["CompressionCodes",0,a,"DecodeFloat32",0,g,"InterleaveScalar",0,I,"ParseFloat16",0,x,"ParseFloat32",0,h,"ParseInt32",0,d,"ParseInt64",0,S,"ParseNullTerminatedString",0,c,"ParseUint16",0,p,"ParseUint32",0,u,"ParseUint8",0,m,"ParseUint8Array",0,v,"ParseValue",0,E,"Predictor",0,_],559844),e.s(["GetExrHeader",0,T],732809);function C(e,t){let r=0;for(let i=0;i<65536;++i)(0==i||e[i>>3]&1<<(7&i))&&(t[r++]=i);let i=r-1;for(;r<65536;)t[r++]=0;return i}function A(e,t,r,i,a){for(;r<e;)t=t<<8|v(i,a),r+=8;return{l:t>>(r-=e)&(1<<e)-1,c:t,lc:r}}function N(e,t,r,i){return{c:e=e<<8|v(r,i),lc:t+=8}}function R(e,t,r,i,a,o,n,s,l){if(e==t){if(i<8){let e=N(r,i,a,o);r=e.c,i=e.lc}let e=r>>(i-=8);if(e=new Uint8Array([e])[0],s.value+e>l)return null;let t=n[s.value-1];for(;e-- >0;)n[s.value++]=t}else{if(!(s.value<l))return null;n[s.value++]=e}return{c:r,lc:i}}let D=Array(59);function M(e,t,r,i,a,o){let n=r.value,s=u(t,r),l=u(t,r);r.value+=4;let f=u(t,r);if(r.value+=4,s<0||s>=65537||l<0||l>=65537)throw Error("Wrong HUF_ENCSIZE");let c=Array(65537),d=Array(16384);for(let e=0;e<16384;e++)d[e]={},d[e].len=0,d[e].lit=0,d[e].p=null;let m=i-(r.value-n);if(!function(e,t,r,i,a,o){let n=0,s=0;for(;i<=a;i++){if(t.value-t.value>r)return;let l=A(6,n,s,e,t),f=l.l;if(n=l.c,s=l.lc,o[i]=f,63==f){if(t.value-t.value>r)throw Error("Error in HufUnpackEncTable");let f=(l=A(8,n,s,e,t)).l+6;if(n=l.c,s=l.lc,i+f>a+1)throw Error("Error in HufUnpackEncTable");for(;f--;)o[i++]=0;i--}else if(f>=59){let e=f-59+2;if(i+e>a+1)throw Error("Error in HufUnpackEncTable");for(;e--;)o[i++]=0;i--}}!function(e){for(let e=0;e<=58;++e)D[e]=0;for(let t=0;t<65537;++t)D[e[t]]+=1;let t=0;for(let e=58;e>0;--e){let r=t+D[e]>>1;D[e]=t,t=r}for(let t=0;t<65537;++t){let r=e[t];r>0&&(e[t]=r|D[r]++<<6)}}(o)}(e,r,m,s,l,c),f>8*(i-(r.value-n)))throw Error("Wrong hufUncompress");!function(e,t,r,i){for(;t<=r;t++){let r=e[t]>>6,a=63&e[t];if(r>>a)throw Error("Invalid table entry");if(a>14){let e=i[r>>a-14];if(e.len)throw Error("Invalid table entry");if(e.lit++,e.p){let t=e.p;e.p=Array(e.lit);for(let r=0;r<e.lit-1;++r)e.p[r]=t[r]}else e.p=[,];e.p[e.lit-1]=t}else if(a){let e=0;for(let o=1<<14-a;o>0;o--){let o=i[(r<<14-a)+e];if(o.len||o.p)throw Error("Invalid table entry");o.len=a,o.lit=t,e++}}}}(c,s,l,d),function(e,t,r,i,a,o,n,s,l){let f=0,c=0,d=Math.trunc(i.value+(a+7)/8);for(;i.value<d;){let a=N(f,c,r,i);for(f=a.c,c=a.lc;c>=14;){let u=t[f>>c-14&16383];if(u.len){c-=u.len;let e=R(u.lit,o,f,c,r,i,s,l,n);e&&(f=e.c,c=e.lc)}else{let t;if(!u.p)throw Error("hufDecode issues");for(t=0;t<u.lit;t++){let m=63&e[u.p[t]];for(;c<m&&i.value<d;)f=(a=N(f,c,r,i)).c,c=a.lc;if(c>=m&&e[u.p[t]]>>6==(f>>c-m&(1<<m)-1)){c-=m;let e=R(u.p[t],o,f,c,r,i,s,l,n);e&&(f=e.c,c=e.lc);break}}if(t==u.lit)throw Error("HufDecode issues")}}}let u=8-a&7;for(f>>=u,c-=u;c>0;){let e=t[f<<14-c&16383];if(e.len){c-=e.len;let t=R(e.lit,o,f,c,r,i,s,l,n);t&&(f=t.c,c=t.lc)}else throw Error("HufDecode issues")}}(c,d,e,r,f,l,o,a,{value:0})}function P(e){let t=65535&e;return t>32767?t-65536:t}function y(e,t){let r=P(e),i=P(t),a=r+(1&i)+(i>>1);return{a:a,b:a-i}}function O(e,t){let r=65535&t,i=(65535&e)-(r>>1)&65535;return{a:r+i-32768&65535,b:i}}function F(e,t,r,i,a,o,n){let s,l,f=n<16384,c=r>a?a:r,d=1;for(;d<=c;)d<<=1;for(d>>=1,s=d,d>>=1;d>=1;){let n,c,u,m,p=(l=0)+o*(a-s),v=o*d,S=o*s,h=i*d,x=i*s;for(;l<=p;l+=S){let a=l,o=l+i*(r-s);for(;a<=o;a+=x){let r=a+h,i=a+v,o=i+h;if(f){let s=y(e[a+t],e[i+t]);n=s.a,u=s.b,c=(s=y(e[r+t],e[o+t])).a,m=s.b,s=y(n,c),e[a+t]=s.a,e[r+t]=s.b,s=y(u,m),e[i+t]=s.a,e[o+t]=s.b}else{let s=O(e[a+t],e[i+t]);n=s.a,u=s.b,c=(s=O(e[r+t],e[o+t])).a,m=s.b,s=O(n,c),e[a+t]=s.a,e[r+t]=s.b,s=O(u,m),e[i+t]=s.a,e[o+t]=s.b}}if(r&d){let r,i=a+v;n=(r=f?y(e[a+t],e[i+t]):O(e[a+t],e[i+t])).a,e[i+t]=r.b,e[a+t]=n}}if(a&d){let a=l,o=l+i*(r-s);for(;a<=o;a+=x){let r,i=a+h;n=(r=f?y(e[a+t],e[i+t]):O(e[a+t],e[i+t])).a,e[i+t]=r.b,e[a+t]=n}}s=d,d>>=1}return l}function b(e,t,r){for(let i=0;i<r;++i)t[i]=e[t[i]]}function L(e){let t=e.byteLength,r=[],i=0,a=new DataView(e);for(;t>0;){let e=a.getInt8(i++);if(e<0){let o=-e;t-=o+1;for(let e=0;e<o;e++)r.push(a.getUint8(i++))}else{t-=2;let o=a.getUint8(i++);for(let t=0;t<e+1;t++)r.push(o)}}return r}function V(e){return new DataView(e.array.buffer,e.offset.value,e.size)}function U(e){let t=new Uint8Array(L(e.viewer.buffer.slice(e.offset.value,e.offset.value+e.size))),r=new Uint8Array(t.length);return _(t),I(t,r),new DataView(r.buffer)}function w(e){let t=e.array.slice(e.offset.value,e.offset.value+e.size),r=fflate.unzlibSync(t),i=new Uint8Array(r.length);return _(r),I(r,i),new DataView(i.buffer)}function G(e){let t=e.array.slice(e.offset.value,e.offset.value+e.size),r=fflate.unzlibSync(t),i=e.lines*e.channels*e.width,a=1==e.type?new Uint16Array(i):new Uint32Array(i),o=0,n=0,s=[,,,,];for(let t=0;t<e.lines;t++)for(let t=0;t<e.channels;t++){let t=0;switch(e.type){case 1:s[0]=o,s[1]=s[0]+e.width,o=s[1]+e.width;for(let i=0;i<e.width;++i)t+=r[s[0]++]<<8|r[s[1]++],a[n]=t,n++;break;case 2:s[0]=o,s[1]=s[0]+e.width,s[2]=s[1]+e.width,o=s[2]+e.width;for(let i=0;i<e.width;++i)t+=r[s[0]++]<<24|r[s[1]++]<<16|r[s[2]++]<<8,a[n]=t,n++}}return new DataView(a.buffer)}function B(e){let t=e.viewer,r={value:e.offset.value},i=new Uint16Array(e.width*e.scanlineBlockSize*(e.channels*e.type)),a=new Uint8Array(8192),o=0,n=Array(e.channels);for(let t=0;t<e.channels;t++)n[t]={},n[t].start=o,n[t].end=n[t].start,n[t].nx=e.width,n[t].ny=e.lines,n[t].size=e.type,o+=n[t].nx*n[t].ny*n[t].size;let s=p(t,r),l=p(t,r);if(l>=8192)throw Error("Wrong PIZ_COMPRESSION BITMAP_SIZE");if(s<=l)for(let e=0;e<l-s+1;e++)a[e+s]=m(t,r);let f=new Uint16Array(65536),c=C(a,f),d=u(t,r);M(e.array,t,r,d,i,o);for(let t=0;t<e.channels;++t){let e=n[t];for(let r=0;r<n[t].size;++r)F(i,e.start+r,e.nx,e.size,e.ny,e.nx*e.size,c)}b(f,i,o);let v=0,S=new Uint8Array(i.buffer.byteLength);for(let t=0;t<e.lines;t++)for(let t=0;t<e.channels;t++){let e=n[t],r=e.nx*e.size,a=new Uint8Array(i.buffer,2*e.end,2*r);S.set(a,v),v+=2*r,e.end+=r}return new DataView(S.buffer)}e.s(["ApplyLut",0,b,"HufUncompress",0,M,"ReverseLutFromBitmap",0,C,"Wav2Decode",0,F],566784),e.s(["DecodeRunLength",0,L],255759),e.s(["UncompressPIZ",0,B,"UncompressPXR",0,G,"UncompressRAW",0,V,"UncompressRLE",0,U,"UncompressZIP",0,w],346339);var W=e.i(900280);(i=n||(n={}))[i.Float=0]="Float",i[i.HalfFloat=1]="HalfFloat";class z{}async function X(e,t,r,i){let o={size:0,viewer:t,array:new Uint8Array(t.buffer),offset:r,width:e.dataWindow.xMax-e.dataWindow.xMin+1,height:e.dataWindow.yMax-e.dataWindow.yMin+1,channels:e.channels.length,channelLineOffsets:{},scanOrder:()=>0,bytesPerLine:0,outLineWidth:0,lines:0,scanlineBlockSize:0,inputSize:null,type:0,uncompress:null,getter:()=>0,format:5,outputChannels:0,decodeChannels:{},blockCount:null,byteArray:null,linearSpace:!1,textureType:0};switch(e.compression){case a.NO_COMPRESSION:o.lines=1,o.uncompress=V;break;case a.RLE_COMPRESSION:o.lines=1,o.uncompress=U;break;case a.ZIPS_COMPRESSION:o.lines=1,o.uncompress=w,await W.Tools.LoadScriptAsync(z.FFLATEUrl);break;case a.ZIP_COMPRESSION:o.lines=16,o.uncompress=w,await W.Tools.LoadScriptAsync(z.FFLATEUrl);break;case a.PIZ_COMPRESSION:o.lines=32,o.uncompress=B;break;case a.PXR24_COMPRESSION:o.lines=16,o.uncompress=G,await W.Tools.LoadScriptAsync(z.FFLATEUrl);break;default:throw Error(a[e.compression]+" is unsupported")}o.scanlineBlockSize=o.lines;let s={};for(let t of e.channels)switch(t.name){case"R":case"G":case"B":case"A":case"Y":s[t.name]=!0,o.type=t.pixelType}let l=!1;if(s.R&&s.G&&s.B&&s.A)o.outputChannels=4,o.decodeChannels={R:0,G:1,B:2,A:3};else if(s.R&&s.G&&s.B)l=!0,o.outputChannels=4,o.decodeChannels={R:0,G:1,B:2,A:3};else if(s.R&&s.G)o.outputChannels=2,o.decodeChannels={R:0,G:1};else if(s.R)o.outputChannels=1,o.decodeChannels={R:0};else if(s.Y)o.outputChannels=1,o.decodeChannels={Y:0};else throw Error("EXRLoader.parse: file contains unsupported data channels.");if(1===o.type)switch(i){case n.Float:o.getter=x,o.inputSize=2;break;case n.HalfFloat:o.getter=p,o.inputSize=2}else if(2===o.type)switch(i){case n.Float:o.getter=h,o.inputSize=4;break;case n.HalfFloat:o.getter=g,o.inputSize=4}else throw Error("Unsupported pixelType "+o.type+" for "+e.compression);o.blockCount=o.height/o.scanlineBlockSize;for(let e=0;e<o.blockCount;e++)S(t,r);let f=o.width*o.height*o.outputChannels;switch(i){case n.Float:o.byteArray=new Float32Array(f),o.textureType=1,l&&o.byteArray.fill(1,0,f);break;case n.HalfFloat:o.byteArray=new Uint16Array(f),o.textureType=2,l&&o.byteArray.fill(15360,0,f);break;default:throw Error("Unsupported type: "+i)}let c=0;for(let t of e.channels)void 0!==o.decodeChannels[t.name]&&(o.channelLineOffsets[t.name]=c*o.width),c+=2*t.pixelType;return o.bytesPerLine=o.width*c,o.outLineWidth=o.width*o.outputChannels,"INCREASING_Y"===e.lineOrder?o.scanOrder=e=>e:o.scanOrder=e=>o.height-1-e,4==o.outputChannels?(o.format=5,o.linearSpace=!0):(o.format=6,o.linearSpace=!1),o}function H(e,t,r,i){let a={value:0};for(let o=0;o<e.height/e.scanlineBlockSize;o++){let n=d(r,i)-t.dataWindow.yMin;e.size=u(r,i),e.lines=n+e.scanlineBlockSize>e.height?e.height-n:e.scanlineBlockSize;let s=e.size<e.lines*e.bytesPerLine&&e.uncompress?e.uncompress(e):V(e);i.value+=e.size;for(let r=0;r<e.scanlineBlockSize;r++){let i=o*e.scanlineBlockSize,n=r+e.scanOrder(i);if(n>=e.height)continue;let l=r*e.bytesPerLine,f=(e.height-1-n)*e.outLineWidth;for(let r=0;r<e.channels;r++){let i=t.channels[r].name,o=e.channelLineOffsets[i],n=e.decodeChannels[i];if(void 0!==n){a.value=l+o;for(let t=0;t<e.width;t++){let r=f+t*e.outputChannels+n;e.byteArray&&(e.byteArray[r]=e.getter(s,a))}}}}}}async function k(e){let t=new DataView(e),r={value:0},i=T(t,r);try{let e=await X(i,t,r,n.Float);if(H(e,i,t,r),!e.byteArray)return s.Logger.Error("Failed to decode EXR data: No byte array available."),{width:0,height:0,data:null};return{width:i.dataWindow.xMax-i.dataWindow.xMin+1,height:i.dataWindow.yMax-i.dataWindow.yMin+1,data:new Float32Array(e.byteArray)}}catch(e){s.Logger.Error("Failed to load EXR data: ",e)}return{width:0,height:0,data:null}}z.DefaultOutputType=n.HalfFloat,z.FFLATEUrl="https://unpkg.com/fflate@0.8.2",e.s(["EXROutputType",0,n,"ExrLoaderGlobalConfiguration",0,z],856952),e.s(["CreateDecoderAsync",0,X,"ScanData",0,H],402131),e.s(["ReadExrDataAsync",0,k,"_ExrTextureLoader",0,class{constructor(){this.supportCascades=!1}loadCubeData(e,t,r,i,a){throw".exr not supported in Cube."}loadData(e,t,r){let i=new DataView(e.buffer),a={value:0},o=T(i,a);X(o,i,a,z.DefaultOutputType).then(e=>{H(e,o,i,a),r(o.dataWindow.xMax-o.dataWindow.xMin+1,o.dataWindow.yMax-o.dataWindow.yMin+1,t.generateMipMaps,!1,()=>{let r=t.getEngine();t.format=o.format,t.type=e.textureType,t.invertY=!1,t._gammaSpace=!o.linearSpace,e.byteArray&&r._uploadDataToTextureDirectly(t,e.byteArray,0,0,void 0,!0)})}).catch(e=>{s.Logger.Error("Failed to load EXR texture: ",e)})}}],13308)},929870,e=>{"use strict";var t=e.i(263537);e.i(243400),e.i(706568);let r="defaultUboDeclaration",i=`uniform diffuseLeftColor: vec4f;uniform diffuseRightColor: vec4f;uniform opacityParts: vec4f;uniform reflectionLeftColor: vec4f;uniform reflectionRightColor: vec4f;uniform refractionLeftColor: vec4f;uniform refractionRightColor: vec4f;uniform emissiveLeftColor: vec4f;uniform emissiveRightColor: vec4f;uniform vDiffuseInfos: vec2f;uniform vAmbientInfos: vec2f;uniform vOpacityInfos: vec2f;uniform vEmissiveInfos: vec2f;uniform vLightmapInfos: vec2f;uniform vSpecularInfos: vec2f;uniform vBumpInfos: vec3f;uniform diffuseMatrix: mat4x4f;uniform ambientMatrix: mat4x4f;uniform opacityMatrix: mat4x4f;uniform emissiveMatrix: mat4x4f;uniform lightmapMatrix: mat4x4f;uniform specularMatrix: mat4x4f;uniform bumpMatrix: mat4x4f;uniform vTangentSpaceParams: vec2f;uniform pointSize: f32;uniform alphaCutOff: f32;uniform refractionMatrix: mat4x4f;uniform vRefractionInfos: vec4f;uniform vRefractionPosition: vec3f;uniform vRefractionSize: vec3f;uniform vSpecularColor: vec4f;uniform vEmissiveColor: vec3f;uniform vDiffuseColor: vec4f;uniform vAmbientColor: vec3f;uniform cameraInfo: vec4f;uniform vReflectionInfos: vec2f;uniform reflectionMatrix: mat4x4f;uniform vReflectionPosition: vec3f;uniform vReflectionSize: vec3f;
#define ADDITIONAL_UBO_DECLARATION
#include<sceneUboDeclaration>
#include<meshUboDeclaration>
`;t.ShaderStore.IncludesShadersStoreWGSL[r]||(t.ShaderStore.IncludesShadersStoreWGSL[r]=i),e.s([])},695623,e=>{"use strict";var t=e.i(263537);let r="decalFragment",i=`#ifdef DECAL
var decalTempColor=decalColor.rgb;var decalTempAlpha=decalColor.a;
#ifdef GAMMADECAL
decalTempColor=toLinearSpaceVec3(decalColor.rgb);
#endif
#ifdef DECAL_SMOOTHALPHA
decalTempAlpha=decalColor.a*decalColor.a;
#endif
surfaceAlbedo=mix(surfaceAlbedo.rgb,decalTempColor,decalTempAlpha);
#endif
`;t.ShaderStore.IncludesShadersStoreWGSL[r]||(t.ShaderStore.IncludesShadersStoreWGSL[r]=i),e.s([])},588404,e=>{"use strict";var t=e.i(263537);let r="bumpFragment",i=`var uvOffset: vec2f= vec2f(0.0,0.0);
#if defined(BUMP) || defined(PARALLAX) || defined(DETAIL)
#ifdef NORMALXYSCALE
var normalScale: f32=1.0;
#elif defined(BUMP)
var normalScale: f32=uniforms.vBumpInfos.y;
#else
var normalScale: f32=1.0;
#endif
#if defined(TANGENT) && defined(NORMAL)
var TBN: mat3x3f=mat3x3<f32>(input.vTBN0,input.vTBN1,input.vTBN2); 
#elif defined(BUMP)
var TBNUV: vec2f=select(-fragmentInputs.vBumpUV,fragmentInputs.vBumpUV,fragmentInputs.frontFacing);var TBN: mat3x3f=cotangent_frame(normalW*normalScale,input.vPositionW,TBNUV,uniforms.vTangentSpaceParams);
#else
var TBNUV: vec2f=select(-fragmentInputs.vDetailUV,fragmentInputs.vDetailUV,fragmentInputs.frontFacing);var TBN: mat3x3f=cotangent_frame(normalW*normalScale,input.vPositionW,TBNUV, vec2f(1.,1.));
#endif
#elif defined(ANISOTROPIC)
#if defined(TANGENT) && defined(NORMAL)
var TBN: mat3x3f=mat3x3<f32>(input.vTBN0,input.vTBN1,input.vTBN2); 
#else
var TBNUV: vec2f=select( -fragmentInputs.vMainUV1,fragmentInputs.vMainUV1,fragmentInputs.frontFacing);var TBN: mat3x3f=cotangent_frame(normalW,input.vPositionW,TBNUV, vec2f(1.,1.));
#endif
#endif
#ifdef PARALLAX
var invTBN: mat3x3f=transposeMat3(TBN);
#ifdef PARALLAXOCCLUSION
uvOffset=parallaxOcclusion(invTBN*-viewDirectionW,invTBN*normalW,fragmentInputs.vBumpUV,uniforms.vBumpInfos.z);
#else
uvOffset=parallaxOffset(invTBN*viewDirectionW,uniforms.vBumpInfos.z);
#endif
#endif
#ifdef DETAIL
var detailColor: vec4f=textureSample(detailSampler,detailSamplerSampler,fragmentInputs.vDetailUV+uvOffset);var detailNormalRG: vec2f=detailColor.wy*2.0-1.0;var detailNormalB: f32=sqrt(1.-saturate(dot(detailNormalRG,detailNormalRG)));var detailNormal: vec3f= vec3f(detailNormalRG,detailNormalB);
#endif
#ifdef BUMP
#ifdef OBJECTSPACE_NORMALMAP
#define CUSTOM_FRAGMENT_BUMP_FRAGMENT
normalW=normalize(textureSample(bumpSampler,bumpSamplerSampler,fragmentInputs.vBumpUV).xyz *2.0-1.0);normalW=normalize(mat3x3f(uniforms.normalMatrix[0].xyz,uniforms.normalMatrix[1].xyz,uniforms.normalMatrix[2].xyz)*normalW);
#elif !defined(DETAIL)
normalW=perturbNormal(TBN,textureSample(bumpSampler,bumpSamplerSampler,fragmentInputs.vBumpUV+uvOffset).xyz,uniforms.vBumpInfos.y);
#else
var bumpNormal: vec3f=textureSample(bumpSampler,bumpSamplerSampler,fragmentInputs.vBumpUV+uvOffset).xyz*2.0-1.0;
#if DETAIL_NORMALBLENDMETHOD==0 
detailNormal=vec3f(detailNormal.xy*uniforms.vDetailInfos.z,detailNormal.z);var blendedNormal: vec3f=normalize( vec3f(bumpNormal.xy+detailNormal.xy,bumpNormal.z*detailNormal.z));
#elif DETAIL_NORMALBLENDMETHOD==1 
detailNormal=vec3f(detailNormal.xy*uniforms.vDetailInfos.z,detailNormal.z);bumpNormal+= vec3f(0.0,0.0,1.0);detailNormal*= vec3f(-1.0,-1.0,1.0);var blendedNormal: vec3f=bumpNormal*dot(bumpNormal,detailNormal)/bumpNormal.z-detailNormal;
#endif
normalW=perturbNormalBase(TBN,blendedNormal,uniforms.vBumpInfos.y);
#endif
#elif defined(DETAIL)
detailNormal=vec3f(detailNormal.xy*uniforms.vDetailInfos.z,detailNormal.z);normalW=perturbNormalBase(TBN,detailNormal,uniforms.vDetailInfos.z);
#endif
`;t.ShaderStore.IncludesShadersStoreWGSL[r]||(t.ShaderStore.IncludesShadersStoreWGSL[r]=i),e.s(["bumpFragmentWGSL",0,{name:r,shader:i}])},339586,e=>{"use strict";var t=e.i(263537);let r="samplerFragmentDeclaration",i=`#ifdef _DEFINENAME_
#if _DEFINENAME_DIRECTUV==1
#define v_VARYINGNAME_UV vMainUV1
#elif _DEFINENAME_DIRECTUV==2
#define v_VARYINGNAME_UV vMainUV2
#elif _DEFINENAME_DIRECTUV==3
#define v_VARYINGNAME_UV vMainUV3
#elif _DEFINENAME_DIRECTUV==4
#define v_VARYINGNAME_UV vMainUV4
#elif _DEFINENAME_DIRECTUV==5
#define v_VARYINGNAME_UV vMainUV5
#elif _DEFINENAME_DIRECTUV==6
#define v_VARYINGNAME_UV vMainUV6
#else
varying v_VARYINGNAME_UV: vec2f;
#endif
var _SAMPLERNAME_SamplerSampler: sampler;var _SAMPLERNAME_Sampler: texture_2d<f32>;
#endif
`;t.ShaderStore.IncludesShadersStoreWGSL[r]||(t.ShaderStore.IncludesShadersStoreWGSL[r]=i),e.s([])},769226,e=>{"use strict";var t=e.i(263537);e.i(339586);let r="bumpFragmentFunctions",i=`#if defined(BUMP)
#include<samplerFragmentDeclaration>(_DEFINENAME_,BUMP,_VARYINGNAME_,Bump,_SAMPLERNAME_,bump)
#endif
#if defined(DETAIL)
#include<samplerFragmentDeclaration>(_DEFINENAME_,DETAIL,_VARYINGNAME_,Detail,_SAMPLERNAME_,detail)
#endif
#if defined(BUMP) && defined(PARALLAX)
const minSamples: f32=4.;const maxSamples: f32=15.;const iMaxSamples: i32=15;fn parallaxOcclusion(vViewDirCoT: vec3f,vNormalCoT: vec3f,texCoord: vec2f,parallaxScale: f32)->vec2f {var parallaxLimit: f32=length(vViewDirCoT.xy)/vViewDirCoT.z;parallaxLimit*=parallaxScale;var vOffsetDir: vec2f=normalize(vViewDirCoT.xy);var vMaxOffset: vec2f=vOffsetDir*parallaxLimit;var numSamples: f32=maxSamples+(dot(vViewDirCoT,vNormalCoT)*(minSamples-maxSamples));var stepSize: f32=1.0/numSamples;var currRayHeight: f32=1.0;var vCurrOffset: vec2f= vec2f(0,0);var vLastOffset: vec2f= vec2f(0,0);var lastSampledHeight: f32=1.0;var currSampledHeight: f32=1.0;var keepWorking: bool=true;for (var i: i32=0; i<iMaxSamples; i++)
{currSampledHeight=textureSample(bumpSampler,bumpSamplerSampler,texCoord+vCurrOffset).w;if (!keepWorking)
{}
else if (currSampledHeight>currRayHeight)
{var delta1: f32=currSampledHeight-currRayHeight;var delta2: f32=(currRayHeight+stepSize)-lastSampledHeight;var ratio: f32=delta1/(delta1+delta2);vCurrOffset=(ratio)* vLastOffset+(1.0-ratio)*vCurrOffset;keepWorking=false;}
else
{currRayHeight-=stepSize;vLastOffset=vCurrOffset;
#ifdef PARALLAX_RHS
vCurrOffset-=stepSize*vMaxOffset;
#else
vCurrOffset+=stepSize*vMaxOffset;
#endif
lastSampledHeight=currSampledHeight;}}
return vCurrOffset;}
fn parallaxOffset(viewDir: vec3f,heightScale: f32)->vec2f
{var height: f32=textureSample(bumpSampler,bumpSamplerSampler,fragmentInputs.vBumpUV).w;var texCoordOffset: vec2f=heightScale*viewDir.xy*height;
#ifdef PARALLAX_RHS
return texCoordOffset;
#else
return -texCoordOffset;
#endif
}
#endif
`;t.ShaderStore.IncludesShadersStoreWGSL[r]||(t.ShaderStore.IncludesShadersStoreWGSL[r]=i),e.s(["bumpFragmentFunctionsWGSL",0,{name:r,shader:i}])},766397,e=>{"use strict";var t=e.i(263537);let r="bumpFragmentMainFunctions",i=`#if defined(BUMP) || defined(CLEARCOAT_BUMP) || defined(ANISOTROPIC) || defined(DETAIL)
#if defined(TANGENT) && defined(NORMAL) 
varying vTBN0: vec3f;varying vTBN1: vec3f;varying vTBN2: vec3f;
#endif
#ifdef OBJECTSPACE_NORMALMAP
uniform normalMatrix: mat4x4f;fn toNormalMatrix(m: mat4x4f)->mat4x4f
{var a00=m[0][0];var a01=m[0][1];var a02=m[0][2];var a03=m[0][3];var a10=m[1][0];var a11=m[1][1];var a12=m[1][2];var a13=m[1][3];var a20=m[2][0]; 
var a21=m[2][1];var a22=m[2][2];var a23=m[2][3];var a30=m[3][0]; 
var a31=m[3][1];var a32=m[3][2];var a33=m[3][3];var b00=a00*a11-a01*a10;var b01=a00*a12-a02*a10;var b02=a00*a13-a03*a10;var b03=a01*a12-a02*a11;var b04=a01*a13-a03*a11;var b05=a02*a13-a03*a12;var b06=a20*a31-a21*a30;var b07=a20*a32-a22*a30;var b08=a20*a33-a23*a30;var b09=a21*a32-a22*a31;var b10=a21*a33-a23*a31;var b11=a22*a33-a23*a32;var det=b00*b11-b01*b10+b02*b09+b03*b08-b04*b07+b05*b06;var mi=mat4x4<f32>(
(a11*b11-a12*b10+a13*b09)/det,
(a02*b10-a01*b11-a03*b09)/det,
(a31*b05-a32*b04+a33*b03)/det,
(a22*b04-a21*b05-a23*b03)/det,
(a12*b08-a10*b11-a13*b07)/det,
(a00*b11-a02*b08+a03*b07)/det,
(a32*b02-a30*b05-a33*b01)/det,
(a20*b05-a22*b02+a23*b01)/det,
(a10*b10-a11*b08+a13*b06)/det,
(a01*b08-a00*b10-a03*b06)/det,
(a30*b04-a31*b02+a33*b00)/det,
(a21*b02-a20*b04-a23*b00)/det,
(a11*b07-a10*b09-a12*b06)/det,
(a00*b09-a01*b07+a02*b06)/det,
(a31*b01-a30*b03-a32*b00)/det,
(a20*b03-a21*b01+a22*b00)/det);return mat4x4<f32>(mi[0][0],mi[1][0],mi[2][0],mi[3][0],
mi[0][1],mi[1][1],mi[2][1],mi[3][1],
mi[0][2],mi[1][2],mi[2][2],mi[3][2],
mi[0][3],mi[1][3],mi[2][3],mi[3][3]);}
#endif
fn perturbNormalBase(cotangentFrame: mat3x3f,normal: vec3f,scale: f32)->vec3f
{var output=normal;
#ifdef NORMALXYSCALE
output=normalize(output* vec3f(scale,scale,1.0));
#endif
return normalize(cotangentFrame*output);}
fn perturbNormal(cotangentFrame: mat3x3f,textureSample: vec3f,scale: f32)->vec3f
{return perturbNormalBase(cotangentFrame,textureSample*2.0-1.0,scale);}
fn cotangent_frame(normal: vec3f,p: vec3f,uv: vec2f,tangentSpaceParams: vec2f)->mat3x3f
{var dp1: vec3f=dpdx(p);var dp2: vec3f=dpdy(p);var duv1: vec2f=dpdx(uv);var duv2: vec2f=dpdy(uv);var dp2perp: vec3f=cross(dp2,normal);var dp1perp: vec3f=cross(normal,dp1);var tangent: vec3f=dp2perp*duv1.x+dp1perp*duv2.x;var bitangent: vec3f=dp2perp*duv1.y+dp1perp*duv2.y;tangent*=tangentSpaceParams.x;bitangent*=tangentSpaceParams.y;var det: f32=max(dot(tangent,tangent),dot(bitangent,bitangent));var invmax: f32=select(inverseSqrt(det),0.0,det==0.0);return mat3x3f(tangent*invmax,bitangent*invmax,normal);}
#endif
`;t.ShaderStore.IncludesShadersStoreWGSL[r]||(t.ShaderStore.IncludesShadersStoreWGSL[r]=i),e.s(["bumpFragmentMainFunctionsWGSL",0,{name:r,shader:i}])},363008,e=>{"use strict";var t=e.i(263537);e.i(929870),e.i(160009),e.i(733570),e.i(865557),e.i(738124),e.i(507534),e.i(393484),e.i(803174),e.i(339586),e.i(800161),e.i(216596),e.i(144628),e.i(352483),e.i(766397),e.i(769226),e.i(755704),e.i(357351),e.i(562396),e.i(212954),e.i(588404),e.i(695623),e.i(249748),e.i(296253),e.i(476129),e.i(922446),e.i(328530);let r="defaultPixelShader",i=`#include<defaultUboDeclaration>
#include<prePassDeclaration>[SCENE_MRT_COUNT]
#include<oitDeclaration>
#define CUSTOM_FRAGMENT_BEGIN
varying vPositionW: vec3f;
#ifdef NORMAL
varying vNormalW: vec3f;
#endif
#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
varying vColor: vec4f;
#endif
#if defined(CLUSTLIGHT_BATCH) && CLUSTLIGHT_BATCH>0
varying vViewDepth: f32;
#endif
#include<mainUVVaryingDeclaration>[1..7]
#include<helperFunctions>
#include<lightUboDeclaration>[0..maxSimultaneousLights]
#include<lightsFragmentFunctions>
#include<shadowsFragmentFunctions>
#include<samplerFragmentDeclaration>(_DEFINENAME_,DIFFUSE,_VARYINGNAME_,Diffuse,_SAMPLERNAME_,diffuse)
#include<samplerFragmentDeclaration>(_DEFINENAME_,AMBIENT,_VARYINGNAME_,Ambient,_SAMPLERNAME_,ambient)
#include<samplerFragmentDeclaration>(_DEFINENAME_,OPACITY,_VARYINGNAME_,Opacity,_SAMPLERNAME_,opacity)
#include<samplerFragmentDeclaration>(_DEFINENAME_,EMISSIVE,_VARYINGNAME_,Emissive,_SAMPLERNAME_,emissive)
#include<samplerFragmentDeclaration>(_DEFINENAME_,LIGHTMAP,_VARYINGNAME_,Lightmap,_SAMPLERNAME_,lightmap)
#include<samplerFragmentDeclaration>(_DEFINENAME_,DECAL,_VARYINGNAME_,Decal,_SAMPLERNAME_,decal)
#ifdef REFRACTION
#ifdef REFRACTIONMAP_3D
var refractionCubeSamplerSampler: sampler;var refractionCubeSampler: texture_cube<f32>;
#else
var refraction2DSamplerSampler: sampler;var refraction2DSampler: texture_2d<f32>;
#endif
#endif
#if defined(SPECULARTERM)
#include<samplerFragmentDeclaration>(_DEFINENAME_,SPECULAR,_VARYINGNAME_,Specular,_SAMPLERNAME_,specular)
#endif
#include<fresnelFunction>
#ifdef REFLECTION
#ifdef REFLECTIONMAP_3D
var reflectionCubeSamplerSampler: sampler;var reflectionCubeSampler: texture_cube<f32>;
#else
var reflection2DSamplerSampler: sampler;var reflection2DSampler: texture_2d<f32>;
#endif
#ifdef REFLECTIONMAP_SKYBOX
varying vPositionUVW: vec3f;
#else
#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)
varying vDirectionW: vec3f;
#endif
#endif
#include<reflectionFunction>
#endif
#include<imageProcessingDeclaration>
#include<imageProcessingFunctions>
#include<bumpFragmentMainFunctions>
#include<bumpFragmentFunctions>
#include<clipPlaneFragmentDeclaration>
#include<logDepthDeclaration>
#include<fogFragmentDeclaration>
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
#include<clipPlaneFragment>
var viewDirectionW: vec3f=normalize(scene.vEyePosition.xyz-fragmentInputs.vPositionW);var baseColor: vec4f= vec4f(1.,1.,1.,1.);var diffuseColor: vec3f=uniforms.vDiffuseColor.rgb;var alpha: f32=uniforms.vDiffuseColor.a;
#ifdef NORMAL
var normalW: vec3f=normalize(fragmentInputs.vNormalW);
#else
var normalW: vec3f=normalize(cross(dpdx(fragmentInputs.vPositionW),dpdy(fragmentInputs.vPositionW)))* scene.vEyePosition.w;
#endif
#include<bumpFragment>
#ifdef TWOSIDEDLIGHTING
normalW=select(-normalW,normalW,fragmentInputs.frontFacing);
#endif
#ifdef DIFFUSE
baseColor=textureSample(diffuseSampler,diffuseSamplerSampler,fragmentInputs.vDiffuseUV+uvOffset);
#if defined(ALPHATEST) && !defined(ALPHATEST_AFTERALLALPHACOMPUTATIONS)
if (baseColor.a<uniforms.alphaCutOff) {discard;}
#endif
#ifdef ALPHAFROMDIFFUSE
alpha*=baseColor.a;
#endif
#define CUSTOM_FRAGMENT_UPDATE_ALPHA
baseColor=vec4f(baseColor.rgb*uniforms.vDiffuseInfos.y,baseColor.a);
#endif
#if defined(DECAL) && !defined(DECAL_AFTER_DETAIL)
var decalColor: vec4f=textureSample(decalSampler,decalSamplerSampler,fragmentInputs.vDecalUV+uvOffset);
#include<decalFragment>(surfaceAlbedo,baseColor,GAMMADECAL,_GAMMADECAL_NOTUSED_)
#endif
#include<depthPrePass>
#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
baseColor=vec4f(baseColor.rgb*fragmentInputs.vColor.rgb,baseColor.a);
#endif
#ifdef DETAIL
baseColor=vec4f(baseColor.rgb*2.0*mix(0.5,detailColor.r,uniforms.vDetailInfos.y),baseColor.a);
#endif
#if defined(DECAL) && defined(DECAL_AFTER_DETAIL)
var decalColor: vec4f=textureSample(decalSampler,decalSamplerSampler,fragmentInputs.vDecalUV+uvOffset);
#include<decalFragment>(surfaceAlbedo,baseColor,GAMMADECAL,_GAMMADECAL_NOTUSED_)
#endif
#define CUSTOM_FRAGMENT_UPDATE_DIFFUSE
var baseAmbientColor: vec3f= vec3f(1.,1.,1.);
#ifdef AMBIENT
baseAmbientColor=textureSample(ambientSampler,ambientSamplerSampler,fragmentInputs.vAmbientUV+uvOffset).rgb*uniforms.vAmbientInfos.y;
#endif
#define CUSTOM_FRAGMENT_BEFORE_LIGHTS
var glossiness: f32=uniforms.vSpecularColor.a;var specularColor: vec3f=uniforms.vSpecularColor.rgb;
#ifdef SPECULARTERM
#ifdef SPECULAR
var specularMapColor: vec4f=textureSample(specularSampler,specularSamplerSampler,fragmentInputs.vSpecularUV+uvOffset);specularColor=specularMapColor.rgb;
#ifdef GLOSSINESS
glossiness=glossiness*specularMapColor.a;
#endif
#endif
#endif
var diffuseBase: vec3f= vec3f(0.,0.,0.);var info: lightingInfo;
#ifdef SPECULARTERM
var specularBase: vec3f= vec3f(0.,0.,0.);
#endif
var shadow: f32=1.;var aggShadow: f32=0.;var numLights: f32=0.;
#ifdef LIGHTMAP
var lightmapColor: vec4f=textureSample(lightmapSampler,lightmapSamplerSampler,fragmentInputs.vLightmapUV+uvOffset);
#ifdef RGBDLIGHTMAP
lightmapColor=vec4f(fromRGBD(lightmapColor),lightmapColor.a);
#endif
lightmapColor=vec4f(lightmapColor.rgb*uniforms.vLightmapInfos.y,lightmapColor.a);
#endif
#include<lightFragment>[0..maxSimultaneousLights]
aggShadow=aggShadow/numLights;var refractionColor: vec4f= vec4f(0.,0.,0.,1.);
#ifdef REFRACTION
var refractionVector: vec3f=normalize(refract(-viewDirectionW,normalW,uniforms.vRefractionInfos.y));
#ifdef REFRACTIONMAP_3D
#ifdef USE_LOCAL_REFRACTIONMAP_CUBIC
refractionVector=parallaxCorrectNormal(fragmentInputs.vPositionW,refractionVector,uniforms.vRefractionSize,uniforms.vRefractionPosition);
#endif
refractionVector.y=refractionVector.y*uniforms.vRefractionInfos.w;var refractionLookup: vec4f=textureSample(refractionCubeSampler,refractionCubeSamplerSampler,refractionVector);if (dot(refractionVector,viewDirectionW)<1.0) {refractionColor=refractionLookup;}
#else
var vRefractionUVW: vec3f= (uniforms.refractionMatrix*(scene.view* vec4f(fragmentInputs.vPositionW+refractionVector*uniforms.vRefractionInfos.z,1.0))).xyz;var refractionCoords: vec2f=vRefractionUVW.xy/vRefractionUVW.z;refractionCoords.y=1.0-refractionCoords.y;refractionColor=textureSample(refraction2DSampler,refraction2DSamplerSampler,refractionCoords);
#endif
#ifdef RGBDREFRACTION
refractionColor=vec4f(fromRGBD(refractionColor),refractionColor.a);
#endif
#ifdef IS_REFRACTION_LINEAR
refractionColor=vec4f(toGammaSpaceVec3(refractionColor.rgb),refractionColor.a);
#endif
refractionColor=vec4f(refractionColor.rgb*uniforms.vRefractionInfos.x,refractionColor.a);
#endif
var reflectionColor: vec4f= vec4f(0.,0.,0.,1.);
#ifdef REFLECTION
var vReflectionUVW: vec3f=computeReflectionCoords( vec4f(fragmentInputs.vPositionW,1.0),normalW);
#ifdef REFLECTIONMAP_OPPOSITEZ
vReflectionUVW=vec3f(vReflectionUVW.x,vReflectionUVW.y,vReflectionUVW.z*-1.0);
#endif
#ifdef REFLECTIONMAP_3D
#ifdef ROUGHNESS
var bias: f32=uniforms.vReflectionInfos.y;
#ifdef SPECULARTERM
#ifdef SPECULAR
#ifdef GLOSSINESS
bias*=(1.0-specularMapColor.a);
#endif
#endif
#endif
reflectionColor=textureSampleLevel(reflectionCubeSampler,reflectionCubeSamplerSampler,vReflectionUVW,bias);
#else
reflectionColor=textureSample(reflectionCubeSampler,reflectionCubeSamplerSampler,vReflectionUVW);
#endif
#else
var coords: vec2f=vReflectionUVW.xy;
#ifdef REFLECTIONMAP_PROJECTION
coords/=vReflectionUVW.z;
#endif
coords.y=1.0-coords.y;reflectionColor=textureSample(reflection2DSampler,reflection2DSamplerSampler,coords);
#endif
#ifdef RGBDREFLECTION
reflectionColor=vec4f(fromRGBD(reflectionColor),reflectionColor.a);
#endif
#ifdef IS_REFLECTION_LINEAR
reflectionColor=vec4f(toGammaSpaceVec3(reflectionColor.rgb),reflectionColor.a);
#endif
reflectionColor=vec4f(reflectionColor.rgb*uniforms.vReflectionInfos.x,reflectionColor.a);
#ifdef REFLECTIONFRESNEL
var reflectionFresnelTerm: f32=computeFresnelTerm(viewDirectionW,normalW,uniforms.reflectionRightColor.a,uniforms.reflectionLeftColor.a);
#ifdef REFLECTIONFRESNELFROMSPECULAR
#ifdef SPECULARTERM
reflectionColor=vec4f(reflectionColor.rgb*specularColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*uniforms.reflectionRightColor.rgb,reflectionColor.a);
#else
reflectionColor=vec4f(reflectionColor.rgb*uniforms.reflectionLeftColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*uniforms.reflectionRightColor.rgb,reflectionColor.a);
#endif
#else
reflectionColor=vec4f(reflectionColor.rgb*uniforms.reflectionLeftColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*uniforms.reflectionRightColor.rgb,reflectionColor.a);
#endif
#endif
#endif
#ifdef REFRACTIONFRESNEL
var refractionFresnelTerm: f32=computeFresnelTerm(viewDirectionW,normalW,uniforms.refractionRightColor.a,uniforms.refractionLeftColor.a);refractionColor=vec4f(refractionColor.rgb*uniforms.refractionLeftColor.rgb*(1.0-refractionFresnelTerm)+refractionFresnelTerm*uniforms.refractionRightColor.rgb,refractionColor.a);
#endif
#ifdef OPACITY
var opacityMap: vec4f=textureSample(opacitySampler,opacitySamplerSampler,fragmentInputs.vOpacityUV+uvOffset);
#ifdef OPACITYRGB
opacityMap=vec4f(opacityMap.rgb* vec3f(0.3,0.59,0.11),opacityMap.a);alpha*=(opacityMap.x+opacityMap.y+opacityMap.z)* uniforms.vOpacityInfos.y;
#else
alpha*=opacityMap.a*uniforms.vOpacityInfos.y;
#endif
#endif
#if defined(VERTEXALPHA) || defined(INSTANCESCOLOR) && defined(INSTANCES)
alpha*=fragmentInputs.vColor.a;
#endif
#ifdef OPACITYFRESNEL
var opacityFresnelTerm: f32=computeFresnelTerm(viewDirectionW,normalW,uniforms.opacityParts.z,uniforms.opacityParts.w);alpha+=uniforms.opacityParts.x*(1.0-opacityFresnelTerm)+opacityFresnelTerm*uniforms.opacityParts.y;
#endif
#ifdef ALPHATEST
#ifdef ALPHATEST_AFTERALLALPHACOMPUTATIONS
if (alpha<uniforms.alphaCutOff) {discard;}
#endif
#ifndef ALPHABLEND
alpha=1.0;
#endif
#endif
var emissiveColor: vec3f=uniforms.vEmissiveColor;
#ifdef EMISSIVE
emissiveColor+=textureSample(emissiveSampler,emissiveSamplerSampler,fragmentInputs.vEmissiveUV+uvOffset).rgb*uniforms.vEmissiveInfos.y;
#endif
#ifdef EMISSIVEFRESNEL
var emissiveFresnelTerm: f32=computeFresnelTerm(viewDirectionW,normalW,uniforms.emissiveRightColor.a,uniforms.emissiveLeftColor.a);emissiveColor*=uniforms.emissiveLeftColor.rgb*(1.0-emissiveFresnelTerm)+emissiveFresnelTerm*uniforms.emissiveRightColor.rgb;
#endif
#ifdef DIFFUSEFRESNEL
var diffuseFresnelTerm: f32=computeFresnelTerm(viewDirectionW,normalW,uniforms.diffuseRightColor.a,uniforms.diffuseLeftColor.a);diffuseBase*=uniforms.diffuseLeftColor.rgb*(1.0-diffuseFresnelTerm)+diffuseFresnelTerm*uniforms.diffuseRightColor.rgb;
#endif
#ifdef EMISSIVEASILLUMINATION
var finalDiffuse: vec3f=clamp(diffuseBase*diffuseColor+uniforms.vAmbientColor,vec3f(0.0),vec3f(1.0))*baseColor.rgb;
#else
#ifdef LINKEMISSIVEWITHDIFFUSE
var finalDiffuse: vec3f=clamp((diffuseBase+emissiveColor)*diffuseColor+uniforms.vAmbientColor,vec3f(0.0),vec3f(1.0))*baseColor.rgb;
#else
var finalDiffuse: vec3f=clamp(diffuseBase*diffuseColor+emissiveColor+uniforms.vAmbientColor,vec3f(0.0),vec3f(1.0))*baseColor.rgb;
#endif
#endif
#ifdef SPECULARTERM
var finalSpecular: vec3f=specularBase*specularColor;
#ifdef SPECULAROVERALPHA
alpha=clamp(alpha+dot(finalSpecular, vec3f(0.3,0.59,0.11)),0.0,1.0);
#endif
#else
var finalSpecular: vec3f= vec3f(0.0);
#endif
#ifdef REFLECTIONOVERALPHA
alpha=clamp(alpha+dot(reflectionColor.rgb, vec3f(0.3,0.59,0.11)),0.0,1.0);
#endif
#ifdef EMISSIVEASILLUMINATION
var color: vec4f= vec4f(clamp(finalDiffuse*baseAmbientColor+finalSpecular+reflectionColor.rgb+emissiveColor+refractionColor.rgb,vec3f(0.0),vec3f(1.0)),alpha);
#else
var color: vec4f= vec4f(finalDiffuse*baseAmbientColor+finalSpecular+reflectionColor.rgb+refractionColor.rgb,alpha);
#endif
#ifdef LIGHTMAP
#ifndef LIGHTMAPEXCLUDED
#ifdef USELIGHTMAPASSHADOWMAP
color=vec4f(color.rgb*lightmapColor.rgb,color.a);
#else
color=vec4f(color.rgb+lightmapColor.rgb,color.a);
#endif
#endif
#endif
#define CUSTOM_FRAGMENT_BEFORE_FOG
color=vec4f(max(color.rgb,vec3f(0.)),color.a);
#include<logDepthFragment>
#include<fogFragment>
#ifdef IMAGEPROCESSINGPOSTPROCESS
color=vec4f(toLinearSpaceVec3(color.rgb),color.a);
#else
#ifdef IMAGEPROCESSING
color=vec4f(toLinearSpaceVec3(color.rgb),color.a);color=applyImageProcessing(color);
#endif
#endif
color=vec4f(color.rgb,color.a*mesh.visibility);
#ifdef PREMULTIPLYALPHA
color=vec4f(color.rgb*color.a, color.a);
#endif
#define CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR
#ifdef PREPASS
#if SCENE_MRT_COUNT>0
var writeGeometryInfo: f32=select(0.0,1.0,color.a>0.4);var fragData: array<vec4<f32>,SCENE_MRT_COUNT>;
#ifdef PREPASS_COLOR
fragData[PREPASS_COLOR_INDEX]=color; 
#endif
#ifdef PREPASS_POSITION
fragData[PREPASS_POSITION_INDEX]=vec4f(fragmentInputs.vPositionW,writeGeometryInfo);
#endif
#ifdef PREPASS_LOCAL_POSITION
fragData[PREPASS_LOCAL_POSITION_INDEX]=vec4f(fragmentInputs.vPosition,writeGeometryInfo);
#endif
#ifdef PREPASS_VELOCITY
var a: vec2f=(fragmentInputs.vCurrentPosition.xy/fragmentInputs.vCurrentPosition.w)*0.5+0.5;var b: vec2f=(fragmentInputs.vPreviousPosition.xy/fragmentInputs.vPreviousPosition.w)*0.5+0.5;var velocity: vec2f=abs(a-b);velocity= vec2f(pow(velocity.x,1.0/3.0),pow(velocity.y,1.0/3.0))*sign(a-b)*0.5+0.5;fragData[PREPASS_VELOCITY_INDEX]= vec4f(velocity,0.0,writeGeometryInfo);
#elif defined(PREPASS_VELOCITY_LINEAR)
var velocity : vec2f=vec2f(0.5)*((fragmentInputs.vPreviousPosition.xy/fragmentInputs.vPreviousPosition.w) -
(fragmentInputs.vCurrentPosition.xy/fragmentInputs.vCurrentPosition.w));fragData[PREPASS_VELOCITY_LINEAR_INDEX]=vec4f(velocity,0.0,writeGeometryInfo);
#endif
#ifdef PREPASS_IRRADIANCE
fragData[PREPASS_IRRADIANCE_INDEX]=vec4f(0.0,0.0,0.0,writeGeometryInfo); 
#endif
#ifdef PREPASS_DEPTH
fragData[PREPASS_DEPTH_INDEX]=vec4f(fragmentInputs.vViewPos.z,0.0,0.0,writeGeometryInfo); 
#endif
#ifdef PREPASS_SCREENSPACE_DEPTH
fragData[PREPASS_SCREENSPACE_DEPTH_INDEX]=vec4f(fragmentInputs.position.z,0.0,0.0,writeGeometryInfo);
#endif
#ifdef PREPASS_NORMALIZED_VIEW_DEPTH
fragData[PREPASS_NORMALIZED_VIEW_DEPTH_INDEX]=vec4f(fragmentInputs.vNormViewDepth,0.0,0.0,writeGeometryInfo);
#endif
#ifdef PREPASS_NORMAL
#ifdef PREPASS_NORMAL_WORLDSPACE
fragData[PREPASS_NORMAL_INDEX]=vec4f(normalW,writeGeometryInfo);
#else
fragData[PREPASS_NORMAL_INDEX]=vec4f(normalize((scene.view*vec4f(normalW,0.0)).rgb),writeGeometryInfo);
#endif
#endif
#ifdef PREPASS_WORLD_NORMAL
fragData[PREPASS_WORLD_NORMAL_INDEX]=vec4f(normalW*0.5+0.5,writeGeometryInfo);
#endif
#ifdef PREPASS_ALBEDO
fragData[PREPASS_ALBEDO_INDEX]=vec4f(baseColor.rgb,writeGeometryInfo);
#endif
#ifdef PREPASS_ALBEDO_SQRT
fragData[PREPASS_ALBEDO_SQRT_INDEX]=vec4f(sqrt(baseColor.rgb),writeGeometryInfo);
#endif
#ifdef PREPASS_REFLECTIVITY
#if defined(SPECULAR)
fragData[PREPASS_REFLECTIVITY_INDEX]=vec4f(toLinearSpaceVec4(specularMapColor))*writeGeometryInfo; 
#else
fragData[PREPASS_REFLECTIVITY_INDEX]=vec4f(toLinearSpaceVec3(specularColor),1.0)*writeGeometryInfo;
#endif
#endif
#if SCENE_MRT_COUNT>0
fragmentOutputs.fragData0=fragData[0];
#endif
#if SCENE_MRT_COUNT>1
fragmentOutputs.fragData1=fragData[1];
#endif
#if SCENE_MRT_COUNT>2
fragmentOutputs.fragData2=fragData[2];
#endif
#if SCENE_MRT_COUNT>3
fragmentOutputs.fragData3=fragData[3];
#endif
#if SCENE_MRT_COUNT>4
fragmentOutputs.fragData4=fragData[4];
#endif
#if SCENE_MRT_COUNT>5
fragmentOutputs.fragData5=fragData[5];
#endif
#if SCENE_MRT_COUNT>6
fragmentOutputs.fragData6=fragData[6];
#endif
#if SCENE_MRT_COUNT>7
fragmentOutputs.fragData7=fragData[7];
#endif
#endif
#endif
#if !defined(PREPASS) && !defined(ORDER_INDEPENDENT_TRANSPARENCY)
fragmentOutputs.color=color;
#endif
#include<oitFragment>
#if ORDER_INDEPENDENT_TRANSPARENCY
if (fragDepth==nearestDepth) {fragmentOutputs.frontColor=vec4f(fragmentOutputs.frontColor.rgb+color.rgb*color.a*alphaMultiplier,1.0-alphaMultiplier*(1.0-color.a));} else {fragmentOutputs.backColor+=color;}
#endif
#define CUSTOM_FRAGMENT_MAIN_END
}
`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["defaultPixelShaderWGSL",0,{name:r,shader:i}])},932361,e=>{"use strict";var t=e.i(263537);e.i(629238);let r="backgroundUboDeclaration",i=`layout(std140,column_major) uniform;uniform Material
{uniform vec4 vPrimaryColor;uniform vec4 vPrimaryColorShadow;uniform vec2 vDiffuseInfos;uniform mat4 diffuseMatrix;uniform float fFovMultiplier;uniform float pointSize;uniform float shadowLevel;uniform float alpha;uniform vec3 vBackgroundCenter;uniform vec4 vReflectionControl;uniform vec2 projectedGroundInfos;uniform vec2 vReflectionInfos;uniform mat4 reflectionMatrix;uniform vec3 vReflectionMicrosurfaceInfos;};
#include<sceneUboDeclaration>
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.s([])},274561,e=>{"use strict";var t=e.i(263537);let r="lightFragment",i=`#ifdef LIGHT{X}
#if defined(SHADOWONLY) || defined(LIGHTMAP) && defined(LIGHTMAPEXCLUDED{X}) && defined(LIGHTMAPNOSPECULAR{X})
#else
vec4 diffuse{X}=light{X}.vLightDiffuse;
#define CUSTOM_LIGHT{X}_COLOR 
#if defined(PBR) && defined(CLUSTLIGHT{X}) && defined(CLUSTLIGHT_BATCH) && CLUSTLIGHT_BATCH>0
{int sliceIndex=min(getClusteredSliceIndex(light{X}.vSliceData,vViewDepth),CLUSTLIGHT_SLICES-1);info=computeClusteredLighting(
lightDataTexture{X},
tileMaskTexture{X},
light{X}.vLightData,
ivec2(light{X}.vSliceRanges[sliceIndex]),
viewDirectionW,
normalW,
vPositionW,
surfaceAlbedo,
reflectivityOut
#ifdef IRIDESCENCE
,iridescenceIntensity
#endif
#ifdef SS_TRANSLUCENCY
,subSurfaceOut
#endif
#ifdef SPECULARTERM
,AARoughnessFactors.x
#endif
#ifdef ANISOTROPIC
,anisotropicOut
#endif
#ifdef SHEEN
,sheenOut
#endif
#ifdef CLEARCOAT
,clearcoatOut
#endif
);}
#elif defined(PBR)
#ifdef SPOTLIGHT{X}
preInfo=computePointAndSpotPreLightingInfo(light{X}.vLightData,viewDirectionW,normalW,vPositionW);
#elif defined(POINTLIGHT{X})
preInfo=computePointAndSpotPreLightingInfo(light{X}.vLightData,viewDirectionW,normalW,vPositionW);
#elif defined(HEMILIGHT{X})
preInfo=computeHemisphericPreLightingInfo(light{X}.vLightData,viewDirectionW,normalW);
#elif defined(DIRLIGHT{X})
preInfo=computeDirectionalPreLightingInfo(light{X}.vLightData,viewDirectionW,normalW);
#elif defined(AREALIGHT{X}) && defined(AREALIGHTUSED) && defined(AREALIGHTSUPPORTED)
#if defined(RECTAREALIGHTEMISSIONTEXTURE{X})
preInfo=computeAreaPreLightingInfoWithTexture(areaLightsLTC1Sampler,areaLightsLTC2Sampler,rectAreaLightEmissionTexture{X},viewDirectionW,normalW,vPositionW,light{X}.vLightData,light{X}.vLightWidth.xyz,light{X}.vLightHeight.xyz,roughness);
#else
preInfo=computeAreaPreLightingInfo(areaLightsLTC1Sampler,areaLightsLTC2Sampler,viewDirectionW,normalW,vPositionW,light{X}.vLightData,light{X}.vLightWidth.xyz,light{X}.vLightHeight.xyz,roughness);
#endif
#endif
preInfo.NdotV=NdotV;
#ifdef SPOTLIGHT{X}
#ifdef LIGHT_FALLOFF_GLTF{X}
preInfo.attenuation=computeDistanceLightFalloff_GLTF(preInfo.lightDistanceSquared,light{X}.vLightFalloff.y);
#ifdef IESLIGHTTEXTURE{X}
preInfo.attenuation*=computeDirectionalLightFalloff_IES(light{X}.vLightDirection.xyz,preInfo.L,iesLightTexture{X});
#else
preInfo.attenuation*=computeDirectionalLightFalloff_GLTF(light{X}.vLightDirection.xyz,preInfo.L,light{X}.vLightFalloff.z,light{X}.vLightFalloff.w);
#endif
#elif defined(LIGHT_FALLOFF_PHYSICAL{X})
preInfo.attenuation=computeDistanceLightFalloff_Physical(preInfo.lightDistanceSquared);
#ifdef IESLIGHTTEXTURE{X}
preInfo.attenuation*=computeDirectionalLightFalloff_IES(light{X}.vLightDirection.xyz,preInfo.L,iesLightTexture{X});
#else
preInfo.attenuation*=computeDirectionalLightFalloff_Physical(light{X}.vLightDirection.xyz,preInfo.L,light{X}.vLightDirection.w);
#endif
#elif defined(LIGHT_FALLOFF_STANDARD{X})
preInfo.attenuation=computeDistanceLightFalloff_Standard(preInfo.lightOffset,light{X}.vLightFalloff.x);
#ifdef IESLIGHTTEXTURE{X}
preInfo.attenuation*=computeDirectionalLightFalloff_IES(light{X}.vLightDirection.xyz,preInfo.L,iesLightTexture{X});
#else
preInfo.attenuation*=computeDirectionalLightFalloff_Standard(light{X}.vLightDirection.xyz,preInfo.L,light{X}.vLightDirection.w,light{X}.vLightData.w);
#endif
#else
preInfo.attenuation=computeDistanceLightFalloff(preInfo.lightOffset,preInfo.lightDistanceSquared,light{X}.vLightFalloff.x,light{X}.vLightFalloff.y);
#ifdef IESLIGHTTEXTURE{X}
preInfo.attenuation*=computeDirectionalLightFalloff_IES(light{X}.vLightDirection.xyz,preInfo.L,iesLightTexture{X});
#else
preInfo.attenuation*=computeDirectionalLightFalloff(light{X}.vLightDirection.xyz,preInfo.L,light{X}.vLightDirection.w,light{X}.vLightData.w,light{X}.vLightFalloff.z,light{X}.vLightFalloff.w);
#endif
#endif
#elif defined(POINTLIGHT{X})
#ifdef LIGHT_FALLOFF_GLTF{X}
preInfo.attenuation=computeDistanceLightFalloff_GLTF(preInfo.lightDistanceSquared,light{X}.vLightFalloff.y);
#elif defined(LIGHT_FALLOFF_PHYSICAL{X})
preInfo.attenuation=computeDistanceLightFalloff_Physical(preInfo.lightDistanceSquared);
#elif defined(LIGHT_FALLOFF_STANDARD{X})
preInfo.attenuation=computeDistanceLightFalloff_Standard(preInfo.lightOffset,light{X}.vLightFalloff.x);
#else
preInfo.attenuation=computeDistanceLightFalloff(preInfo.lightOffset,preInfo.lightDistanceSquared,light{X}.vLightFalloff.x,light{X}.vLightFalloff.y);
#endif
#else
preInfo.attenuation=1.0;
#endif
#if defined(HEMILIGHT{X})
preInfo.roughness=roughness;
#elif defined(AREALIGHT{X}) && defined(AREALIGHTUSED) && defined(AREALIGHTSUPPORTED)
preInfo.roughness=roughness;
#else
preInfo.roughness=adjustRoughnessFromLightProperties(roughness,light{X}.vLightSpecular.a,preInfo.lightDistance);
#endif
preInfo.diffuseRoughness=diffuseRoughness;preInfo.surfaceAlbedo=surfaceAlbedo;
#ifdef IRIDESCENCE
preInfo.iridescenceIntensity=iridescenceIntensity;
#endif
#ifdef SS_TRANSLUCENCY
info.diffuseTransmission=vec3(0.0);
#endif
#ifdef HEMILIGHT{X}
info.diffuse=computeHemisphericDiffuseLighting(preInfo,diffuse{X}.rgb,light{X}.vLightGround);
#elif defined(AREALIGHT{X}) && defined(AREALIGHTUSED) && defined(AREALIGHTSUPPORTED)
info.diffuse=computeAreaDiffuseLighting(preInfo,diffuse{X}.rgb);
#elif defined(SS_TRANSLUCENCY)
#ifndef SS_TRANSLUCENCY_LEGACY
info.diffuse=computeDiffuseLighting(preInfo,diffuse{X}.rgb)*(1.0-subSurfaceOut.translucencyIntensity);info.diffuseTransmission=computeDiffuseTransmittedLighting(preInfo,diffuse{X}.rgb,subSurfaceOut.transmittance); 
#else
info.diffuse=computeDiffuseTransmittedLighting(preInfo,diffuse{X}.rgb,subSurfaceOut.transmittance);
#endif
#else
info.diffuse=computeDiffuseLighting(preInfo,diffuse{X}.rgb);
#endif
#ifdef SPECULARTERM
#if defined(AREALIGHT{X}) && defined(AREALIGHTUSED) && defined(AREALIGHTSUPPORTED)
info.specular=computeAreaSpecularLighting(preInfo,light{X}.vLightSpecular.rgb,clearcoatOut.specularEnvironmentR0,reflectivityOut.colorReflectanceF90);
#else
#if (CONDUCTOR_SPECULAR_MODEL==CONDUCTOR_SPECULAR_MODEL_OPENPBR)
{vec3 metalFresnel=reflectivityOut.specularWeight*getF82Specular(preInfo.VdotH,clearcoatOut.specularEnvironmentR0,reflectivityOut.colorReflectanceF90,reflectivityOut.roughness);vec3 dielectricFresnel=fresnelSchlickGGX(preInfo.VdotH,reflectivityOut.dielectricColorF0,reflectivityOut.colorReflectanceF90);coloredFresnel=mix(dielectricFresnel,metalFresnel,reflectivityOut.metallic);}
#else
coloredFresnel=fresnelSchlickGGX(preInfo.VdotH,clearcoatOut.specularEnvironmentR0,reflectivityOut.colorReflectanceF90);
#endif
#ifndef LEGACY_SPECULAR_ENERGY_CONSERVATION
{float NdotH=dot(normalW,preInfo.H);vec3 fresnel=fresnelSchlickGGX(NdotH,vec3(reflectanceF0),specularEnvironmentR90);info.diffuse*=(vec3(1.0)-fresnel);}
#endif
#ifdef ANISOTROPIC
info.specular=computeAnisotropicSpecularLighting(preInfo,viewDirectionW,normalW,anisotropicOut.anisotropicTangent,anisotropicOut.anisotropicBitangent,anisotropicOut.anisotropy,clearcoatOut.specularEnvironmentR0,specularEnvironmentR90,AARoughnessFactors.x,diffuse{X}.rgb);
#else
info.specular=computeSpecularLighting(preInfo,normalW,clearcoatOut.specularEnvironmentR0,coloredFresnel,AARoughnessFactors.x,diffuse{X}.rgb);
#endif
#endif
#endif
#ifndef AREALIGHT{X}
#ifdef SHEEN
#ifdef SHEEN_LINKWITHALBEDO
preInfo.roughness=sheenOut.sheenIntensity;
#else
#ifdef HEMILIGHT{X}
preInfo.roughness=sheenOut.sheenRoughness;
#else
preInfo.roughness=adjustRoughnessFromLightProperties(sheenOut.sheenRoughness,light{X}.vLightSpecular.a,preInfo.lightDistance);
#endif
#endif
info.sheen=computeSheenLighting(preInfo,normalW,sheenOut.sheenColor,specularEnvironmentR90,AARoughnessFactors.x,diffuse{X}.rgb);
#endif
#ifdef CLEARCOAT
#ifdef HEMILIGHT{X}
preInfo.roughness=clearcoatOut.clearCoatRoughness;
#else
preInfo.roughness=adjustRoughnessFromLightProperties(clearcoatOut.clearCoatRoughness,light{X}.vLightSpecular.a,preInfo.lightDistance);
#endif
info.clearCoat=computeClearCoatLighting(preInfo,clearcoatOut.clearCoatNormalW,clearcoatOut.clearCoatAARoughnessFactors.x,clearcoatOut.clearCoatIntensity,diffuse{X}.rgb);
#ifdef CLEARCOAT_TINT
absorption=computeClearCoatLightingAbsorption(clearcoatOut.clearCoatNdotVRefract,preInfo.L,clearcoatOut.clearCoatNormalW,clearcoatOut.clearCoatColor,clearcoatOut.clearCoatThickness,clearcoatOut.clearCoatIntensity);info.diffuse*=absorption;
#ifdef SS_TRANSLUCENCY
info.diffuseTransmission*=absorption;
#endif
#ifdef SPECULARTERM
info.specular*=absorption;
#endif
#endif
info.diffuse*=info.clearCoat.w;
#ifdef SS_TRANSLUCENCY
info.diffuseTransmission*=info.clearCoat.w;
#endif
#ifdef SPECULARTERM
info.specular*=info.clearCoat.w;
#endif
#ifdef SHEEN
info.sheen*=info.clearCoat.w;
#endif
#endif
#endif
#else
#ifdef SPOTLIGHT{X}
#ifdef IESLIGHTTEXTURE{X}
info=computeIESSpotLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDirection,diffuse{X}.rgb,light{X}.vLightSpecular.rgb,diffuse{X}.a,glossiness,iesLightTexture{X});
#else
info=computeSpotLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDirection,diffuse{X}.rgb,light{X}.vLightSpecular.rgb,diffuse{X}.a,glossiness);
#endif
#elif defined(HEMILIGHT{X})
info=computeHemisphericLighting(viewDirectionW,normalW,light{X}.vLightData,diffuse{X}.rgb,light{X}.vLightSpecular.rgb,light{X}.vLightGround,glossiness);
#elif defined(POINTLIGHT{X}) || defined(DIRLIGHT{X})
info=computeLighting(viewDirectionW,normalW,light{X}.vLightData,diffuse{X}.rgb,light{X}.vLightSpecular.rgb,diffuse{X}.a,glossiness);
#elif defined(AREALIGHT{X}) && defined(AREALIGHTUSED) && defined(AREALIGHTSUPPORTED)
#if defined(RECTAREALIGHTEMISSIONTEXTURE{X})
info=computeAreaLightingWithTexture(areaLightsLTC1Sampler,areaLightsLTC2Sampler,rectAreaLightEmissionTexture{X},viewDirectionW,normalW,vPositionW,light{X}.vLightData.xyz,light{X}.vLightWidth.rgb,light{X}.vLightHeight.rgb,diffuse{X}.rgb,light{X}.vLightSpecular.rgb,
#ifdef AREALIGHTNOROUGHTNESS
0.5
#else
vReflectionInfos.y
#endif
#else
info=computeAreaLighting(areaLightsLTC1Sampler,areaLightsLTC2Sampler,viewDirectionW,normalW,vPositionW,light{X}.vLightData.xyz,light{X}.vLightWidth.rgb,light{X}.vLightHeight.rgb,diffuse{X}.rgb,light{X}.vLightSpecular.rgb,
#ifdef AREALIGHTNOROUGHTNESS
0.5
#else
vReflectionInfos.y
#endif
#endif
);
#elif defined(CLUSTLIGHT{X}) && CLUSTLIGHT_BATCH>0
{int sliceIndex=min(getClusteredSliceIndex(light{X}.vSliceData,vViewDepth),CLUSTLIGHT_SLICES-1);info=computeClusteredLighting(lightDataTexture{X},tileMaskTexture{X},viewDirectionW,normalW,light{X}.vLightData,ivec2(light{X}.vSliceRanges[sliceIndex]),glossiness);}
#endif
#endif
#ifdef PROJECTEDLIGHTTEXTURE{X}
info.diffuse*=computeProjectionTextureDiffuseLighting(projectionLightTexture{X},textureProjectionMatrix{X},vPositionW);
#endif
#endif
#ifdef SHADOW{X}
#ifdef SHADOWCSM{X}
for (int i=0; i<SHADOWCSMNUM_CASCADES{X}; i++)
{
#ifdef SHADOWCSM_RIGHTHANDED{X}
diff{X}=viewFrustumZ{X}[i]+vPositionFromCamera{X}.z;
#else
diff{X}=viewFrustumZ{X}[i]-vPositionFromCamera{X}.z;
#endif
if (diff{X}>=0.) {index{X}=i;break;}}
#ifdef SHADOWCSMUSESHADOWMAXZ{X}
if (index{X}>=0)
#endif
{
#if defined(SHADOWPCF{X})
#if defined(SHADOWLOWQUALITY{X})
shadow=computeShadowWithCSMPCF1(float(index{X}),vPositionFromLight{X}[index{X}],vDepthMetric{X}[index{X}],shadowTexture{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);
#elif defined(SHADOWMEDIUMQUALITY{X})
shadow=computeShadowWithCSMPCF3(float(index{X}),vPositionFromLight{X}[index{X}],vDepthMetric{X}[index{X}],shadowTexture{X},light{X}.shadowsInfo.yz,light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);
#else
shadow=computeShadowWithCSMPCF5(float(index{X}),vPositionFromLight{X}[index{X}],vDepthMetric{X}[index{X}],shadowTexture{X},light{X}.shadowsInfo.yz,light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);
#endif
#elif defined(SHADOWPCSS{X})
#if defined(SHADOWLOWQUALITY{X})
shadow=computeShadowWithCSMPCSS16(float(index{X}),vPositionFromLight{X}[index{X}],vDepthMetric{X}[index{X}],depthTexture{X},shadowTexture{X},light{X}.shadowsInfo.y,light{X}.shadowsInfo.z,light{X}.shadowsInfo.x,light{X}.shadowsInfo.w,lightSizeUVCorrection{X}[index{X}],depthCorrection{X}[index{X}],penumbraDarkness{X});
#elif defined(SHADOWMEDIUMQUALITY{X})
shadow=computeShadowWithCSMPCSS32(float(index{X}),vPositionFromLight{X}[index{X}],vDepthMetric{X}[index{X}],depthTexture{X},shadowTexture{X},light{X}.shadowsInfo.y,light{X}.shadowsInfo.z,light{X}.shadowsInfo.x,light{X}.shadowsInfo.w,lightSizeUVCorrection{X}[index{X}],depthCorrection{X}[index{X}],penumbraDarkness{X});
#else
shadow=computeShadowWithCSMPCSS64(float(index{X}),vPositionFromLight{X}[index{X}],vDepthMetric{X}[index{X}],depthTexture{X},shadowTexture{X},light{X}.shadowsInfo.y,light{X}.shadowsInfo.z,light{X}.shadowsInfo.x,light{X}.shadowsInfo.w,lightSizeUVCorrection{X}[index{X}],depthCorrection{X}[index{X}],penumbraDarkness{X});
#endif
#else
shadow=computeShadowCSM(float(index{X}),vPositionFromLight{X}[index{X}],vDepthMetric{X}[index{X}],shadowTexture{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);
#endif
#ifdef SHADOWCSMDEBUG{X}
shadowDebug{X}=vec3(shadow)*vCascadeColorsMultiplier{X}[index{X}];
#endif
#ifndef SHADOWCSMNOBLEND{X}
float frustumLength=frustumLengths{X}[index{X}];float diffRatio=clamp(diff{X}/frustumLength,0.,1.)*cascadeBlendFactor{X};if (index{X}<(SHADOWCSMNUM_CASCADES{X}-1) && diffRatio<1.)
{index{X}+=1;float nextShadow=0.;
#if defined(SHADOWPCF{X})
#if defined(SHADOWLOWQUALITY{X})
nextShadow=computeShadowWithCSMPCF1(float(index{X}),vPositionFromLight{X}[index{X}],vDepthMetric{X}[index{X}],shadowTexture{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);
#elif defined(SHADOWMEDIUMQUALITY{X})
nextShadow=computeShadowWithCSMPCF3(float(index{X}),vPositionFromLight{X}[index{X}],vDepthMetric{X}[index{X}],shadowTexture{X},light{X}.shadowsInfo.yz,light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);
#else
nextShadow=computeShadowWithCSMPCF5(float(index{X}),vPositionFromLight{X}[index{X}],vDepthMetric{X}[index{X}],shadowTexture{X},light{X}.shadowsInfo.yz,light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);
#endif
#elif defined(SHADOWPCSS{X})
#if defined(SHADOWLOWQUALITY{X})
nextShadow=computeShadowWithCSMPCSS16(float(index{X}),vPositionFromLight{X}[index{X}],vDepthMetric{X}[index{X}],depthTexture{X},shadowTexture{X},light{X}.shadowsInfo.y,light{X}.shadowsInfo.z,light{X}.shadowsInfo.x,light{X}.shadowsInfo.w,lightSizeUVCorrection{X}[index{X}],depthCorrection{X}[index{X}],penumbraDarkness{X});
#elif defined(SHADOWMEDIUMQUALITY{X})
nextShadow=computeShadowWithCSMPCSS32(float(index{X}),vPositionFromLight{X}[index{X}],vDepthMetric{X}[index{X}],depthTexture{X},shadowTexture{X},light{X}.shadowsInfo.y,light{X}.shadowsInfo.z,light{X}.shadowsInfo.x,light{X}.shadowsInfo.w,lightSizeUVCorrection{X}[index{X}],depthCorrection{X}[index{X}],penumbraDarkness{X});
#else
nextShadow=computeShadowWithCSMPCSS64(float(index{X}),vPositionFromLight{X}[index{X}],vDepthMetric{X}[index{X}],depthTexture{X},shadowTexture{X},light{X}.shadowsInfo.y,light{X}.shadowsInfo.z,light{X}.shadowsInfo.x,light{X}.shadowsInfo.w,lightSizeUVCorrection{X}[index{X}],depthCorrection{X}[index{X}],penumbraDarkness{X});
#endif
#else
nextShadow=computeShadowCSM(float(index{X}),vPositionFromLight{X}[index{X}],vDepthMetric{X}[index{X}],shadowTexture{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);
#endif
shadow=mix(nextShadow,shadow,diffRatio);
#ifdef SHADOWCSMDEBUG{X}
shadowDebug{X}=mix(vec3(nextShadow)*vCascadeColorsMultiplier{X}[index{X}],shadowDebug{X},diffRatio);
#endif
}
#endif
}
#elif defined(SHADOWCLOSEESM{X})
#if defined(SHADOWCUBE{X})
shadow=computeShadowWithCloseESMCube(vPositionW,light{X}.vLightData.xyz,shadowTexture{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.depthValues);
#else
shadow=computeShadowWithCloseESM(vPositionFromLight{X},vDepthMetric{X},shadowTexture{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.shadowsInfo.w);
#endif
#elif defined(SHADOWESM{X})
#if defined(SHADOWCUBE{X})
shadow=computeShadowWithESMCube(vPositionW,light{X}.vLightData.xyz,shadowTexture{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.depthValues);
#else
shadow=computeShadowWithESM(vPositionFromLight{X},vDepthMetric{X},shadowTexture{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.shadowsInfo.w);
#endif
#elif defined(SHADOWPOISSON{X})
#if defined(SHADOWCUBE{X})
shadow=computeShadowWithPoissonSamplingCube(vPositionW,light{X}.vLightData.xyz,shadowTexture{X},light{X}.shadowsInfo.y,light{X}.shadowsInfo.x,light{X}.depthValues);
#else
shadow=computeShadowWithPoissonSampling(vPositionFromLight{X},vDepthMetric{X},shadowTexture{X},light{X}.shadowsInfo.y,light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);
#endif
#elif defined(SHADOWPCF{X})
#if defined(SHADOWLOWQUALITY{X})
shadow=computeShadowWithPCF1(vPositionFromLight{X},vDepthMetric{X},shadowTexture{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);
#elif defined(SHADOWMEDIUMQUALITY{X})
shadow=computeShadowWithPCF3(vPositionFromLight{X},vDepthMetric{X},shadowTexture{X},light{X}.shadowsInfo.yz,light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);
#else
shadow=computeShadowWithPCF5(vPositionFromLight{X},vDepthMetric{X},shadowTexture{X},light{X}.shadowsInfo.yz,light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);
#endif
#elif defined(SHADOWPCSS{X})
#if defined(SHADOWLOWQUALITY{X})
shadow=computeShadowWithPCSS16(vPositionFromLight{X},vDepthMetric{X},depthTexture{X},shadowTexture{X},light{X}.shadowsInfo.y,light{X}.shadowsInfo.z,light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);
#elif defined(SHADOWMEDIUMQUALITY{X})
shadow=computeShadowWithPCSS32(vPositionFromLight{X},vDepthMetric{X},depthTexture{X},shadowTexture{X},light{X}.shadowsInfo.y,light{X}.shadowsInfo.z,light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);
#else
shadow=computeShadowWithPCSS64(vPositionFromLight{X},vDepthMetric{X},depthTexture{X},shadowTexture{X},light{X}.shadowsInfo.y,light{X}.shadowsInfo.z,light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);
#endif
#else
#if defined(SHADOWCUBE{X})
shadow=computeShadowCube(vPositionW,light{X}.vLightData.xyz,shadowTexture{X},light{X}.shadowsInfo.x,light{X}.depthValues);
#else
shadow=computeShadow(vPositionFromLight{X},vDepthMetric{X},shadowTexture{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);
#endif
#endif
#ifdef SHADOWONLY
#ifndef SHADOWINUSE
#define SHADOWINUSE
#endif
globalShadow+=shadow;shadowLightCount+=1.0;
#endif
#else
shadow=1.;
#endif
aggShadow+=shadow;numLights+=1.0;
#ifndef SHADOWONLY
#ifdef CUSTOMUSERLIGHTING
diffuseBase+=computeCustomDiffuseLighting(info,diffuseBase,shadow);
#ifdef SPECULARTERM
specularBase+=computeCustomSpecularLighting(info,specularBase,shadow);
#endif
#elif defined(LIGHTMAP) && defined(LIGHTMAPEXCLUDED{X})
diffuseBase+=lightmapColor.rgb*shadow;
#ifdef SPECULARTERM
#ifndef LIGHTMAPNOSPECULAR{X}
specularBase+=info.specular*shadow*lightmapColor.rgb;
#endif
#endif
#ifdef CLEARCOAT
#ifndef LIGHTMAPNOSPECULAR{X}
clearCoatBase+=info.clearCoat.rgb*shadow*lightmapColor.rgb;
#endif
#endif
#ifdef SHEEN
#ifndef LIGHTMAPNOSPECULAR{X}
sheenBase+=info.sheen.rgb*shadow;
#endif
#endif
#else
#ifdef SHADOWCSMDEBUG{X}
diffuseBase+=info.diffuse*shadowDebug{X};
#else
diffuseBase+=info.diffuse*shadow;
#endif
#ifdef SS_TRANSLUCENCY
diffuseTransmissionBase+=info.diffuseTransmission*shadow;
#endif
#ifdef SPECULARTERM
specularBase+=info.specular*shadow;
#endif
#ifdef CLEARCOAT
clearCoatBase+=info.clearCoat.rgb*shadow;
#endif
#ifdef SHEEN
sheenBase+=info.sheen.rgb*shadow;
#endif
#endif
#endif
#endif
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.s(["lightFragment",0,{name:r,shader:i}])},367959,e=>{"use strict";var t=e.i(263537);let r="clusteredLightingFunctions",i=`struct ClusteredLight {vec4 vLightData;vec4 vLightDiffuse;vec4 vLightSpecular;vec4 vLightDirection;vec4 vLightFalloff;};
#define inline
ClusteredLight getClusteredLight(sampler2D lightDataTexture,int index) {return ClusteredLight(
texelFetch(lightDataTexture,ivec2(0,index),0),
texelFetch(lightDataTexture,ivec2(1,index),0),
texelFetch(lightDataTexture,ivec2(2,index),0),
texelFetch(lightDataTexture,ivec2(3,index),0),
texelFetch(lightDataTexture,ivec2(4,index),0)
);}
int getClusteredSliceIndex(vec2 sliceData,float viewDepth) {return int(log(viewDepth)*sliceData.x+sliceData.y);}
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.s([])},562740,e=>{"use strict";var t=e.i(263537);let r="ltcHelperFunctions",i=`vec2 LTCUv( const in vec3 N,const in vec3 V,const in float roughness ) {const float LUTSIZE=64.0;const float LUTSCALE=( LUTSIZE-1.0 )/LUTSIZE;const float LUTBIAS=0.5/LUTSIZE;float dotNV=saturate( dot( N,V ) );vec2 uv=vec2( roughness,sqrt( 1.0-dotNV ) );uv=uv*LUTSCALE+LUTBIAS;return uv;}
float LTCClippedSphereFormFactor( const in vec3 f ) {float l=length( f );return max( ( l*l+f.z )/( l+1.0 ),0.0 );}
vec3 LTCEdgeVectorFormFactor( const in vec3 v1,const in vec3 v2 ) {float x=dot( v1,v2 );float y=abs( x );float a=0.8543985+( 0.4965155+0.0145206*y )*y;float b=3.4175940+( 4.1616724+y )*y;float v=a/b;float thetaSintheta=0.0;if( x>0.0 )
{thetaSintheta=v;}
else
{thetaSintheta=0.5*inversesqrt( max( 1.0-x*x,1e-7 ) )-v;}
return cross( v1,v2 )*thetaSintheta;}
vec3 LTCEvaluate( const in vec3 N,const in vec3 V,const in vec3 P,const in mat3 mInv,const in vec3 rectCoords[ 4 ] ) {vec3 v1=rectCoords[ 1 ]-rectCoords[ 0 ];vec3 v2=rectCoords[ 3 ]-rectCoords[ 0 ];vec3 lightNormal=cross( v1,v2 );if( dot( lightNormal,P-rectCoords[ 0 ] )<0.0 ) return vec3( 0.0 );vec3 T1,T2;T1=normalize( V-N*dot( V,N ) );T2=- cross( N,T1 ); 
mat3 mat=mInv*transposeMat3( mat3( T1,T2,N ) );vec3 coords[ 4 ];coords[ 0 ]=mat*( rectCoords[ 0 ]-P );coords[ 1 ]=mat*( rectCoords[ 1 ]-P );coords[ 2 ]=mat*( rectCoords[ 2 ]-P );coords[ 3 ]=mat*( rectCoords[ 3 ]-P );coords[ 0 ]=normalize( coords[ 0 ] );coords[ 1 ]=normalize( coords[ 1 ] );coords[ 2 ]=normalize( coords[ 2 ] );coords[ 3 ]=normalize( coords[ 3 ] );vec3 vectorFormFactor=vec3( 0.0 );vectorFormFactor+=LTCEdgeVectorFormFactor( coords[ 0 ],coords[ 1 ] );vectorFormFactor+=LTCEdgeVectorFormFactor( coords[ 1 ],coords[ 2 ] );vectorFormFactor+=LTCEdgeVectorFormFactor( coords[ 2 ],coords[ 3 ] );vectorFormFactor+=LTCEdgeVectorFormFactor( coords[ 3 ],coords[ 0 ] );float result=LTCClippedSphereFormFactor( vectorFormFactor );return vec3( result );}
vec3 FetchDiffuseFilteredTexture(sampler2D texLightFiltered,vec3 p1_,vec3 p2_,vec3 p3_,vec3 p4_)
{vec3 V1=p2_-p1_;vec3 V2=p4_-p1_;vec3 planeOrtho=(cross(V1,V2));float planeAreaSquared=dot(planeOrtho,planeOrtho);float planeDistxPlaneArea=dot(planeOrtho,p1_);vec3 P=planeDistxPlaneArea*planeOrtho/planeAreaSquared-p1_;float dot_V1_V2=dot(V1,V2);float inv_dot_V1_V1=1.0/dot(V1,V1);vec3 V2_=V2-V1*dot_V1_V2*inv_dot_V1_V1;vec2 Puv;Puv.y=dot(V2_,P)/dot(V2_,V2_);Puv.x=dot(V1,P)*inv_dot_V1_V1-dot_V1_V2*inv_dot_V1_V1*Puv.y ;float d=abs(planeDistxPlaneArea)/pow(planeAreaSquared,0.75);float sampleLOD=log(2048.0*d)/log(3.0);vec2 sampleUV=vec2(0.125,0.125)+(vec2(0.75)*Puv);sampleUV.x=1.0-sampleUV.x;return texture2DLodEXT(texLightFiltered,sampleUV,sampleLOD).rgb;}
vec3 LTCEvaluateWithEmission( const in vec3 N,const in vec3 V,const in vec3 P,const in mat3 mInv,const in vec3 rectCoords[ 4 ],const in sampler2D texFilteredMap ) {vec3 v1=rectCoords[ 1 ]-rectCoords[ 0 ];vec3 v2=rectCoords[ 3 ]-rectCoords[ 0 ];vec3 lightNormal=cross( v1,v2 );if( dot( lightNormal,P-rectCoords[ 0 ] )<0.0 ) return vec3( 0.0 );vec3 T1,T2;T1=normalize( V-N*dot( V,N ) );T2=- cross( N,T1 ); 
mat3 mat=mInv*transposeMat3( mat3( T1,T2,N ) );vec3 coords[ 4 ];coords[ 0 ]=mat*( rectCoords[ 0 ]-P );coords[ 1 ]=mat*( rectCoords[ 1 ]-P );coords[ 2 ]=mat*( rectCoords[ 2 ]-P );coords[ 3 ]=mat*( rectCoords[ 3 ]-P );vec3 textureLight=FetchDiffuseFilteredTexture(texFilteredMap,coords[0],coords[1],coords[2],coords[3]);coords[ 0 ]=normalize( coords[ 0 ] );coords[ 1 ]=normalize( coords[ 1 ] );coords[ 2 ]=normalize( coords[ 2 ] );coords[ 3 ]=normalize( coords[ 3 ] );vec3 vectorFormFactor=vec3( 0.0 );vectorFormFactor+=LTCEdgeVectorFormFactor( coords[ 0 ],coords[ 1 ] );vectorFormFactor+=LTCEdgeVectorFormFactor( coords[ 1 ],coords[ 2 ] );vectorFormFactor+=LTCEdgeVectorFormFactor( coords[ 2 ],coords[ 3 ] );vectorFormFactor+=LTCEdgeVectorFormFactor( coords[ 3 ],coords[ 0 ] );float result=LTCClippedSphereFormFactor( vectorFormFactor );return vec3( result )*textureLight;}
struct areaLightData
{vec3 Diffuse;vec3 Specular;vec4 Fresnel;};
#define inline
areaLightData computeAreaLightSpecularDiffuseFresnel(const in sampler2D ltc1,const in sampler2D ltc2,const in vec3 viewDir,const in vec3 normal,const in vec3 position,const in vec3 lightPos,const in vec3 halfWidth,const in vec3 halfHeight,const in float roughness) 
{areaLightData result;vec3 rectCoords[ 4 ];rectCoords[ 0 ]=lightPos+halfWidth-halfHeight; 
rectCoords[ 1 ]=lightPos-halfWidth-halfHeight;rectCoords[ 2 ]=lightPos-halfWidth+halfHeight;rectCoords[ 3 ]=lightPos+halfWidth+halfHeight;
#ifdef SPECULARTERM
vec2 uv=LTCUv( normal,viewDir,roughness );vec4 t1=texture2D( ltc1,uv );vec4 t2=texture2D( ltc2,uv );mat3 mInv=mat3(
vec3( t1.x,0,t1.y ),
vec3( 0,1, 0 ),
vec3( t1.z,0,t1.w )
);result.Specular=LTCEvaluate( normal,viewDir,position,mInv,rectCoords );result.Fresnel=t2;
#endif
result.Diffuse=LTCEvaluate( normal,viewDir,position,mat3( 1.0 ),rectCoords );return result;}
#define inline
areaLightData computeAreaLightSpecularDiffuseFresnelWithEmission(const in sampler2D ltc1,const in sampler2D ltc2,const in sampler2D texFilteredMap,const in vec3 viewDir,const in vec3 normal,const in vec3 position,const in vec3 lightPos,const in vec3 halfWidth,const in vec3 halfHeight,const in float roughness) 
{areaLightData result;vec3 rectCoords[ 4 ];rectCoords[ 0 ]=lightPos+halfWidth-halfHeight; 
rectCoords[ 1 ]=lightPos-halfWidth-halfHeight;rectCoords[ 2 ]=lightPos-halfWidth+halfHeight;rectCoords[ 3 ]=lightPos+halfWidth+halfHeight;
#ifdef SPECULARTERM
vec2 uv=LTCUv( normal,viewDir,roughness );vec4 t1=texture2D( ltc1,uv );vec4 t2=texture2D( ltc2,uv );mat3 mInv=mat3(
vec3( t1.x,0,t1.y ),
vec3( 0,1, 0 ),
vec3( t1.z,0,t1.w )
);result.Specular=LTCEvaluateWithEmission( normal,viewDir,position,mInv,rectCoords,texFilteredMap );result.Fresnel=t2;
#endif
result.Diffuse=LTCEvaluateWithEmission( normal,viewDir,position,mat3( 1.0 ),rectCoords,texFilteredMap );return result;}`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.s([])},648054,e=>{"use strict";var t=e.i(263537);e.i(562740),e.i(367959);let r="lightsFragmentFunctions",i=`struct lightingInfo
{vec3 diffuse;
#ifdef SPECULARTERM
vec3 specular;
#endif
#ifdef NDOTL
float ndl;
#endif
};lightingInfo computeLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec3 diffuseColor,vec3 specularColor,float range,float glossiness) {lightingInfo result;vec3 lightVectorW;float attenuation=1.0;if (lightData.w==0.)
{vec3 direction=lightData.xyz-vPositionW;attenuation=max(0.,1.0-length(direction)/range);lightVectorW=normalize(direction);}
else
{lightVectorW=normalize(-lightData.xyz);}
float ndl=max(0.,dot(vNormal,lightVectorW));
#ifdef NDOTL
result.ndl=ndl;
#endif
result.diffuse=ndl*diffuseColor*attenuation;
#ifdef SPECULARTERM
vec3 angleW=normalize(viewDirectionW+lightVectorW);float specComp=max(0.,dot(vNormal,angleW));specComp=pow(specComp,max(1.,glossiness));result.specular=specComp*specularColor*attenuation;
#endif
return result;}
float getAttenuation(float cosAngle,float exponent) {return max(0.,pow(cosAngle,exponent));}
float getIESAttenuation(float cosAngle,sampler2D iesLightSampler) {float angle=acos(cosAngle)/PI;return texture2D(iesLightSampler,vec2(angle,0.)).r;}
lightingInfo basicSpotLighting(vec3 viewDirectionW,vec3 lightVectorW,vec3 vNormal,float attenuation,vec3 diffuseColor,vec3 specularColor,float glossiness) {lightingInfo result; 
float ndl=max(0.,dot(vNormal,lightVectorW));
#ifdef NDOTL
result.ndl=ndl;
#endif
result.diffuse=ndl*diffuseColor*attenuation;
#ifdef SPECULARTERM
vec3 angleW=normalize(viewDirectionW+lightVectorW);float specComp=max(0.,dot(vNormal,angleW));specComp=pow(specComp,max(1.,glossiness));result.specular=specComp*specularColor*attenuation;
#endif
return result;}
lightingInfo computeIESSpotLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec4 lightDirection,vec3 diffuseColor,vec3 specularColor,float range,float glossiness,sampler2D iesLightSampler) { 
vec3 direction=lightData.xyz-vPositionW;vec3 lightVectorW=normalize(direction);float attenuation=max(0.,1.0-length(direction)/range);float dotProduct=dot(lightDirection.xyz,-lightVectorW);float cosAngle=max(0.,dotProduct);if (cosAngle>=lightDirection.w)
{ 
attenuation*=getIESAttenuation(dotProduct,iesLightSampler);return basicSpotLighting(viewDirectionW,lightVectorW,vNormal,attenuation,diffuseColor,specularColor,glossiness);}
lightingInfo result;result.diffuse=vec3(0.);
#ifdef SPECULARTERM
result.specular=vec3(0.);
#endif
#ifdef NDOTL
result.ndl=0.;
#endif
return result;}
lightingInfo computeSpotLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec4 lightDirection,vec3 diffuseColor,vec3 specularColor,float range,float glossiness) {vec3 direction=lightData.xyz-vPositionW;vec3 lightVectorW=normalize(direction);float attenuation=max(0.,1.0-length(direction)/range);float cosAngle=max(0.,dot(lightDirection.xyz,-lightVectorW));if (cosAngle>=lightDirection.w)
{ 
attenuation*=getAttenuation(cosAngle,lightData.w);return basicSpotLighting(viewDirectionW,lightVectorW,vNormal,attenuation,diffuseColor,specularColor,glossiness);}
lightingInfo result;result.diffuse=vec3(0.);
#ifdef SPECULARTERM
result.specular=vec3(0.);
#endif
#ifdef NDOTL
result.ndl=0.;
#endif
return result;}
lightingInfo computeHemisphericLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec3 diffuseColor,vec3 specularColor,vec3 groundColor,float glossiness) {lightingInfo result;float ndl=dot(vNormal,lightData.xyz)*0.5+0.5;
#ifdef NDOTL
result.ndl=ndl;
#endif
result.diffuse=mix(groundColor,diffuseColor,ndl);
#ifdef SPECULARTERM
vec3 angleW=normalize(viewDirectionW+lightData.xyz);float specComp=max(0.,dot(vNormal,angleW));specComp=pow(specComp,max(1.,glossiness));result.specular=specComp*specularColor;
#endif
return result;}
#define inline
vec3 computeProjectionTextureDiffuseLighting(sampler2D projectionLightSampler,mat4 textureProjectionMatrix,vec3 posW){vec4 strq=textureProjectionMatrix*vec4(posW,1.0);strq/=strq.w;vec3 textureColor=texture2D(projectionLightSampler,strq.xy).rgb;return textureColor;}
#if defined(AREALIGHTUSED) && defined(AREALIGHTSUPPORTED)
#include<ltcHelperFunctions>
uniform sampler2D areaLightsLTC1Sampler;uniform sampler2D areaLightsLTC2Sampler;
#define inline
lightingInfo computeAreaLighting(sampler2D ltc1,sampler2D ltc2,vec3 viewDirectionW,vec3 vNormal,vec3 vPosition,vec3 lightPosition,vec3 halfWidth,vec3 halfHeight,vec3 diffuseColor,vec3 specularColor,float roughness) 
{lightingInfo result;areaLightData data=computeAreaLightSpecularDiffuseFresnel(ltc1,ltc2,viewDirectionW,vNormal,vPosition,lightPosition,halfWidth,halfHeight,roughness);
#ifdef SPECULARTERM
vec3 fresnel=( specularColor*data.Fresnel.x+( vec3( 1.0 )-specularColor )*data.Fresnel.y );result.specular+=specularColor*fresnel*data.Specular;
#endif
result.diffuse+=diffuseColor*data.Diffuse;return result;}
lightingInfo computeAreaLightingWithTexture(sampler2D ltc1,sampler2D ltc2,sampler2D emissionTexture,vec3 viewDirectionW,vec3 vNormal,vec3 vPosition,vec3 lightPosition,vec3 halfWidth,vec3 halfHeight,vec3 diffuseColor,vec3 specularColor,float roughness) 
{lightingInfo result;areaLightData data=computeAreaLightSpecularDiffuseFresnelWithEmission(ltc1,ltc2,emissionTexture,viewDirectionW,vNormal,vPosition,lightPosition,halfWidth,halfHeight,roughness);
#ifdef SPECULARTERM
vec3 fresnel=( specularColor*data.Fresnel.x+( vec3( 1.0 )-specularColor )*data.Fresnel.y );result.specular+=specularColor*fresnel*data.Specular;
#endif
result.diffuse+=diffuseColor*data.Diffuse;return result;}
#endif
#if defined(CLUSTLIGHT_BATCH) && CLUSTLIGHT_BATCH>0
#include<clusteredLightingFunctions>
#define inline
lightingInfo computeClusteredLighting(
sampler2D lightDataTexture,
sampler2D tileMaskTexture,
vec3 viewDirectionW,
vec3 vNormal,
vec4 lightData,
ivec2 sliceRange,
float glossiness
) {lightingInfo result;ivec2 tilePosition=ivec2(gl_FragCoord.xy*lightData.xy);int maskHeight=int(lightData.z);tilePosition.y=min(tilePosition.y,maskHeight-1);ivec2 batchRange=sliceRange/CLUSTLIGHT_BATCH;int batchOffset=batchRange.x*CLUSTLIGHT_BATCH;tilePosition.y+=maskHeight*batchRange.x;for (int i=batchRange.x; i<=batchRange.y; i+=1) {uint mask=uint(texelFetch(tileMaskTexture,tilePosition,0).r);tilePosition.y+=maskHeight;int maskOffset=max(sliceRange.x-batchOffset,0);int maskWidth=min(sliceRange.y-batchOffset+1,CLUSTLIGHT_BATCH);mask=extractBits(mask,maskOffset,maskWidth);while (mask != 0u) {uint bit=mask & -mask;mask ^= bit;int position=onlyBitPosition(bit);ClusteredLight light=getClusteredLight(lightDataTexture,batchOffset+maskOffset+position);lightingInfo info;if (light.vLightDirection.w<0.0) {info=computeLighting(viewDirectionW,vNormal,light.vLightData,light.vLightDiffuse.rgb,light.vLightSpecular.rgb,light.vLightDiffuse.a,glossiness);} else {info=computeSpotLighting(viewDirectionW,vNormal,light.vLightData,light.vLightDirection,light.vLightDiffuse.rgb,light.vLightSpecular.rgb,light.vLightDiffuse.a,glossiness);}
result.diffuse+=info.diffuse;
#ifdef SPECULARTERM
result.specular+=info.specular;
#endif
}
batchOffset+=CLUSTLIGHT_BATCH;}
return result;}
#endif
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.s(["lightsFragmentFunctions",0,{name:r,shader:i}])},948489,242511,e=>{"use strict";var t=e.i(440163),r=e.i(916624),i=e.i(774685),a=e.i(884079),o=e.i(842442),n=e.i(202286),s=e.i(711835),l=e.i(213361);function f(e,t){return e.x*t.x+e.y*t.y+e.z*t.z}function c(e,t){return e.x*t.x+e.y*t.y+e.z*t.z+e.w*t.w}e.s(["Vector2ToFixed",0,function(e,t){return`{X: ${e.x.toFixed(t)} Y: ${e.y.toFixed(t)}}`},"Vector3CopyToRef",0,function(e,t){return t.x=e.x,t.y=e.y,t.z=e.z,t},"Vector3Distance",0,function(e,t){let r,i,a;return Math.sqrt((r=t.x-e.x,i=t.y-e.y,r*r+i*i+(a=t.z-e.z)*a))},"Vector3Dot",0,f,"Vector3SubtractToRef",0,function(e,t,r){return r.x=e.x-t.x,r.y=e.y-t.y,r.z=e.z-t.z,r},"Vector3ToFixed",0,function(e,t){return`{X: ${e.x.toFixed(t)} Y: ${e.y.toFixed(t)} Z: ${e.z.toFixed(t)}}`},"Vector4Dot",0,c,"Vector4ToFixed",0,function(e,t){return`{X: ${e.x.toFixed(t)} Y: ${e.y.toFixed(t)} Z: ${e.z.toFixed(t)} W: ${e.w.toFixed(t)}}`}],242511);let d="cachedOperationAxis",u="cachedOperationAngle",m="cachedExecutionId";class p extends o.FlowGraphUnaryOperationBlock{constructor(e){super(r.RichTypeAny,r.RichTypeNumber,e=>this._polymorphicLength(e),"FlowGraphLengthBlock",e)}_polymorphicLength(e){switch((0,s._GetClassNameOf)(e)){case"Vector2":case"Vector3":case"Vector4":case"Quaternion":return e.length();default:throw Error(`Cannot compute length of value ${e}`)}}}(0,i.RegisterClass)("FlowGraphLengthBlock",p);class v extends o.FlowGraphUnaryOperationBlock{constructor(e){super(r.RichTypeAny,r.RichTypeAny,e=>this._polymorphicNormalize(e),"FlowGraphNormalizeBlock",e)}_polymorphicNormalize(e){let t;switch((0,s._GetClassNameOf)(e)){case"Vector2":case"Vector3":case"Vector4":case"Quaternion":return t=e.normalizeToNew(),this.config?.nanOnZeroLength&&0===e.length()&&t.setAll(NaN),t;default:throw Error(`Cannot normalize value ${e}`)}}}(0,i.RegisterClass)("FlowGraphNormalizeBlock",v);class S extends a.FlowGraphBinaryOperationBlock{constructor(e){super(r.RichTypeAny,r.RichTypeAny,r.RichTypeNumber,(e,t)=>this._polymorphicDot(e,t),"FlowGraphDotBlock",e)}_polymorphicDot(e,t){switch((0,s._GetClassNameOf)(e)){case"Vector2":case"Vector3":case"Vector4":case"Quaternion":return e.dot(t);default:throw Error(`Cannot get dot product of ${e} and ${t}`)}}}(0,i.RegisterClass)("FlowGraphDotBlock",S);class h extends a.FlowGraphBinaryOperationBlock{constructor(e){super(r.RichTypeVector3,r.RichTypeVector3,r.RichTypeVector3,(e,t)=>n.Vector3.Cross(e,t),"FlowGraphCrossBlock",e)}}(0,i.RegisterClass)("FlowGraphCrossBlock",h);class x extends a.FlowGraphBinaryOperationBlock{constructor(e){super(r.RichTypeVector2,r.RichTypeNumber,r.RichTypeVector2,(e,t)=>e.rotate(t),"FlowGraphRotate2DBlock",e)}}(0,i.RegisterClass)("FlowGraphRotate2DBlock",x);class g extends a.FlowGraphBinaryOperationBlock{constructor(e){super(r.RichTypeVector3,r.RichTypeQuaternion,r.RichTypeVector3,(e,t)=>e.applyRotationQuaternion(t),"FlowGraphRotate3DBlock",e)}}function E(e,t){switch((0,s._GetClassNameOf)(e)){case"Vector2":case"Vector3":return t.transformVector(e);case"Vector4":return new n.Vector4(e.x*t.m[0]+e.y*t.m[1]+e.z*t.m[2]+e.w*t.m[3],e.x*t.m[4]+e.y*t.m[5]+e.z*t.m[6]+e.w*t.m[7],e.x*t.m[8]+e.y*t.m[9]+e.z*t.m[10]+e.w*t.m[11],e.x*t.m[12]+e.y*t.m[13]+e.z*t.m[14]+e.w*t.m[15]);default:throw Error(`Cannot transform value ${e}`)}}(0,i.RegisterClass)("FlowGraphRotate3DBlock",g);class _ extends a.FlowGraphBinaryOperationBlock{constructor(e){const t=e?.vectorType||"Vector3",i="Vector2"===t?"Matrix2D":"Vector3"===t?"Matrix3D":"Matrix";super((0,r.getRichTypeByFlowGraphType)(t),(0,r.getRichTypeByFlowGraphType)(i),(0,r.getRichTypeByFlowGraphType)(t),E,"FlowGraphTransformVectorBlock",e)}}(0,i.RegisterClass)("FlowGraphTransformVectorBlock",_);class I extends a.FlowGraphBinaryOperationBlock{constructor(e){super(r.RichTypeVector3,r.RichTypeMatrix,r.RichTypeVector3,(e,t)=>n.Vector3.TransformCoordinates(e,t),"FlowGraphTransformCoordinatesBlock",e)}}(0,i.RegisterClass)("FlowGraphTransformCoordinatesBlock",I);class T extends o.FlowGraphUnaryOperationBlock{constructor(e){super(r.RichTypeQuaternion,r.RichTypeQuaternion,e=>e.conjugate(),"FlowGraphConjugateBlock",e)}}(0,i.RegisterClass)("FlowGraphConjugateBlock",T);class C extends a.FlowGraphBinaryOperationBlock{constructor(e){super(r.RichTypeQuaternion,r.RichTypeQuaternion,r.RichTypeNumber,(e,t)=>2*Math.acos((0,l.Clamp)(c(e,t),-1,1)),"FlowGraphAngleBetweenBlock",e)}}(0,i.RegisterClass)("FlowGraphAngleBetweenBlock",C);class A extends a.FlowGraphBinaryOperationBlock{constructor(e){super(r.RichTypeVector3,r.RichTypeNumber,r.RichTypeQuaternion,(e,t)=>n.Quaternion.RotationAxis(e,t),"FlowGraphQuaternionFromAxisAngleBlock",e)}}(0,i.RegisterClass)("FlowGraphQuaternionFromAxisAngleBlock",A);class N extends t.FlowGraphBlock{constructor(e){super(e),this.a=this.registerDataInput("a",r.RichTypeQuaternion),this.axis=this.registerDataOutput("axis",r.RichTypeVector3),this.angle=this.registerDataOutput("angle",r.RichTypeNumber),this.isValid=this.registerDataOutput("isValid",r.RichTypeBoolean)}_updateOutputs(e){let t=e._getExecutionVariable(this,m,-1),r=e._getExecutionVariable(this,d,null),i=e._getExecutionVariable(this,u,null);if(null!=r&&null!=i&&t===e.executionId)this.axis.setValue(r,e),this.angle.setValue(i,e);else try{let{axis:t,angle:r}=this.a.getValue(e).toAxisAngle();e._setExecutionVariable(this,d,t),e._setExecutionVariable(this,u,r),e._setExecutionVariable(this,m,e.executionId),this.axis.setValue(t,e),this.angle.setValue(r,e),this.isValid.setValue(!0,e)}catch(t){this.isValid.setValue(!1,e)}}getClassName(){return"FlowGraphAxisAngleFromQuaternionBlock"}}(0,i.RegisterClass)("FlowGraphAxisAngleFromQuaternionBlock",N);class R extends a.FlowGraphBinaryOperationBlock{constructor(e){super(r.RichTypeVector3,r.RichTypeVector3,r.RichTypeQuaternion,(e,t)=>{var r,i,a;let o,s,c;return o=new n.Quaternion,r=e,i=t,a=o,s=n.Vector3.Cross(r,i),c=Math.acos((0,l.Clamp)(f(r,i),-1,1)),n.Quaternion.RotationAxisToRef(s,c,a),o},"FlowGraphQuaternionFromDirectionsBlock",e)}}e.s(["FlowGraphAngleBetweenBlock",0,C,"FlowGraphAxisAngleFromQuaternionBlock",0,N,"FlowGraphConjugateBlock",0,T,"FlowGraphCrossBlock",0,h,"FlowGraphDotBlock",0,S,"FlowGraphLengthBlock",0,p,"FlowGraphNormalizeBlock",0,v,"FlowGraphQuaternionFromAxisAngleBlock",0,A,"FlowGraphQuaternionFromDirectionsBlock",0,R,"FlowGraphRotate2DBlock",0,x,"FlowGraphRotate3DBlock",0,g,"FlowGraphTransformBlock",0,_,"FlowGraphTransformCoordinatesBlock",0,I],948489)},413073,e=>{"use strict";var t=e.i(263537);e.i(629238),e.i(997900);let r="defaultUboDeclaration",i=`layout(std140,column_major) uniform;uniform Material
{vec4 diffuseLeftColor;vec4 diffuseRightColor;vec4 opacityParts;vec4 reflectionLeftColor;vec4 reflectionRightColor;vec4 refractionLeftColor;vec4 refractionRightColor;vec4 emissiveLeftColor;vec4 emissiveRightColor;vec2 vDiffuseInfos;vec2 vAmbientInfos;vec2 vOpacityInfos;vec2 vEmissiveInfos;vec2 vLightmapInfos;vec2 vSpecularInfos;vec3 vBumpInfos;mat4 diffuseMatrix;mat4 ambientMatrix;mat4 opacityMatrix;mat4 emissiveMatrix;mat4 lightmapMatrix;mat4 specularMatrix;mat4 bumpMatrix;vec2 vTangentSpaceParams;float pointSize;float alphaCutOff;mat4 refractionMatrix;vec4 vRefractionInfos;vec3 vRefractionPosition;vec3 vRefractionSize;vec4 vSpecularColor;vec3 vEmissiveColor;vec4 vDiffuseColor;vec3 vAmbientColor;vec4 cameraInfo;vec2 vReflectionInfos;mat4 reflectionMatrix;vec3 vReflectionPosition;vec3 vReflectionSize;
#define ADDITIONAL_UBO_DECLARATION
};
#include<sceneUboDeclaration>
#include<meshUboDeclaration>
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.s([])},959117,e=>{"use strict";var t=e.i(263537);let r="samplerFragmentDeclaration",i=`#ifdef _DEFINENAME_
#if _DEFINENAME_DIRECTUV==1
#define v_VARYINGNAME_UV vMainUV1
#elif _DEFINENAME_DIRECTUV==2
#define v_VARYINGNAME_UV vMainUV2
#elif _DEFINENAME_DIRECTUV==3
#define v_VARYINGNAME_UV vMainUV3
#elif _DEFINENAME_DIRECTUV==4
#define v_VARYINGNAME_UV vMainUV4
#elif _DEFINENAME_DIRECTUV==5
#define v_VARYINGNAME_UV vMainUV5
#elif _DEFINENAME_DIRECTUV==6
#define v_VARYINGNAME_UV vMainUV6
#else
varying vec2 v_VARYINGNAME_UV;
#endif
uniform sampler2D _SAMPLERNAME_Sampler;
#endif
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.s([])},376170,e=>{"use strict";var t=e.i(263537);e.i(959117);let r="bumpFragmentFunctions",i=`#if defined(BUMP)
#include<samplerFragmentDeclaration>(_DEFINENAME_,BUMP,_VARYINGNAME_,Bump,_SAMPLERNAME_,bump)
#endif
#if defined(DETAIL)
#include<samplerFragmentDeclaration>(_DEFINENAME_,DETAIL,_VARYINGNAME_,Detail,_SAMPLERNAME_,detail)
#endif
#if defined(BUMP) && defined(PARALLAX)
const float minSamples=4.;const float maxSamples=15.;const int iMaxSamples=15;vec2 parallaxOcclusion(vec3 vViewDirCoT,vec3 vNormalCoT,vec2 texCoord,float parallaxScale) {float parallaxLimit=length(vViewDirCoT.xy)/vViewDirCoT.z;parallaxLimit*=parallaxScale;vec2 vOffsetDir=normalize(vViewDirCoT.xy);vec2 vMaxOffset=vOffsetDir*parallaxLimit;float numSamples=maxSamples+(dot(vViewDirCoT,vNormalCoT)*(minSamples-maxSamples));float stepSize=1.0/numSamples;float currRayHeight=1.0;vec2 vCurrOffset=vec2(0,0);vec2 vLastOffset=vec2(0,0);float lastSampledHeight=1.0;float currSampledHeight=1.0;bool keepWorking=true;for (int i=0; i<iMaxSamples; i++)
{currSampledHeight=texture2D(bumpSampler,texCoord+vCurrOffset).w;if (!keepWorking)
{}
else if (currSampledHeight>currRayHeight)
{float delta1=currSampledHeight-currRayHeight;float delta2=(currRayHeight+stepSize)-lastSampledHeight;float ratio=delta1/(delta1+delta2);vCurrOffset=(ratio)* vLastOffset+(1.0-ratio)*vCurrOffset;keepWorking=false;}
else
{currRayHeight-=stepSize;vLastOffset=vCurrOffset;
#ifdef PARALLAX_RHS
vCurrOffset-=stepSize*vMaxOffset;
#else
vCurrOffset+=stepSize*vMaxOffset;
#endif
lastSampledHeight=currSampledHeight;}}
return vCurrOffset;}
vec2 parallaxOffset(vec3 viewDir,float heightScale)
{float height=texture2D(bumpSampler,vBumpUV).w;vec2 texCoordOffset=heightScale*viewDir.xy*height;
#ifdef PARALLAX_RHS
return texCoordOffset;
#else
return -texCoordOffset;
#endif
}
#endif
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.s(["bumpFragmentFunctions",0,{name:r,shader:i}])},120238,e=>{"use strict";var t=e.i(263537);let r="bumpFragmentMainFunctions",i=`#if defined(BUMP) || defined(CLEARCOAT_BUMP) || defined(ANISOTROPIC) || defined(DETAIL)
#if defined(TANGENT) && defined(NORMAL) 
varying mat3 vTBN;
#endif
#ifdef OBJECTSPACE_NORMALMAP
uniform mat4 normalMatrix;
#if defined(WEBGL2) || defined(WEBGPU)
mat4 toNormalMatrix(mat4 wMatrix)
{mat4 ret=inverse(wMatrix);ret=transpose(ret);ret[0][3]=0.;ret[1][3]=0.;ret[2][3]=0.;ret[3]=vec4(0.,0.,0.,1.);return ret;}
#else
mat4 toNormalMatrix(mat4 m)
{float
a00=m[0][0],a01=m[0][1],a02=m[0][2],a03=m[0][3],
a10=m[1][0],a11=m[1][1],a12=m[1][2],a13=m[1][3],
a20=m[2][0],a21=m[2][1],a22=m[2][2],a23=m[2][3],
a30=m[3][0],a31=m[3][1],a32=m[3][2],a33=m[3][3],
b00=a00*a11-a01*a10,
b01=a00*a12-a02*a10,
b02=a00*a13-a03*a10,
b03=a01*a12-a02*a11,
b04=a01*a13-a03*a11,
b05=a02*a13-a03*a12,
b06=a20*a31-a21*a30,
b07=a20*a32-a22*a30,
b08=a20*a33-a23*a30,
b09=a21*a32-a22*a31,
b10=a21*a33-a23*a31,
b11=a22*a33-a23*a32,
det=b00*b11-b01*b10+b02*b09+b03*b08-b04*b07+b05*b06;mat4 mi=mat4(
a11*b11-a12*b10+a13*b09,
a02*b10-a01*b11-a03*b09,
a31*b05-a32*b04+a33*b03,
a22*b04-a21*b05-a23*b03,
a12*b08-a10*b11-a13*b07,
a00*b11-a02*b08+a03*b07,
a32*b02-a30*b05-a33*b01,
a20*b05-a22*b02+a23*b01,
a10*b10-a11*b08+a13*b06,
a01*b08-a00*b10-a03*b06,
a30*b04-a31*b02+a33*b00,
a21*b02-a20*b04-a23*b00,
a11*b07-a10*b09-a12*b06,
a00*b09-a01*b07+a02*b06,
a31*b01-a30*b03-a32*b00,
a20*b03-a21*b01+a22*b00)/det;return mat4(mi[0][0],mi[1][0],mi[2][0],mi[3][0],
mi[0][1],mi[1][1],mi[2][1],mi[3][1],
mi[0][2],mi[1][2],mi[2][2],mi[3][2],
mi[0][3],mi[1][3],mi[2][3],mi[3][3]);}
#endif
#endif
vec3 perturbNormalBase(mat3 cotangentFrame,vec3 normal,float scale)
{
#ifdef NORMALXYSCALE
normal=normalize(normal*vec3(scale,scale,1.0));
#endif
return normalize(cotangentFrame*normal);}
vec3 perturbNormal(mat3 cotangentFrame,vec3 textureSample,float scale)
{return perturbNormalBase(cotangentFrame,textureSample*2.0-1.0,scale);}
mat3 cotangent_frame(vec3 normal,vec3 p,vec2 uv,vec2 tangentSpaceParams)
{vec3 dp1=dFdx(p);vec3 dp2=dFdy(p);vec2 duv1=dFdx(uv);vec2 duv2=dFdy(uv);vec3 dp2perp=cross(dp2,normal);vec3 dp1perp=cross(normal,dp1);vec3 tangent=dp2perp*duv1.x+dp1perp*duv2.x;vec3 bitangent=dp2perp*duv1.y+dp1perp*duv2.y;tangent*=tangentSpaceParams.x;bitangent*=tangentSpaceParams.y;float det=max(dot(tangent,tangent),dot(bitangent,bitangent));float invmax=det==0.0 ? 0.0 : inversesqrt(det);return mat3(tangent*invmax,bitangent*invmax,normal);}
#endif
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.s(["bumpFragmentMainFunctions",0,{name:r,shader:i}])},48973,e=>{"use strict";var t=e.i(263537);let r="bumpFragment",i=`vec2 uvOffset=vec2(0.0,0.0);
#if defined(BUMP) || defined(PARALLAX) || defined(DETAIL)
#ifdef NORMALXYSCALE
float normalScale=1.0;
#elif defined(BUMP)
float normalScale=vBumpInfos.y;
#else
float normalScale=1.0;
#endif
#if defined(TANGENT) && defined(NORMAL)
mat3 TBN=vTBN;
#elif defined(BUMP)
vec2 TBNUV=gl_FrontFacing ? vBumpUV : -vBumpUV;mat3 TBN=cotangent_frame(normalW*normalScale,vPositionW,TBNUV,vTangentSpaceParams);
#else
vec2 TBNUV=gl_FrontFacing ? vDetailUV : -vDetailUV;mat3 TBN=cotangent_frame(normalW*normalScale,vPositionW,TBNUV,vec2(1.,1.));
#endif
#elif defined(ANISOTROPIC)
#if defined(TANGENT) && defined(NORMAL)
mat3 TBN=vTBN;
#else
vec2 TBNUV=gl_FrontFacing ? vMainUV1 : -vMainUV1;mat3 TBN=cotangent_frame(normalW,vPositionW,TBNUV,vec2(1.,1.));
#endif
#endif
#ifdef PARALLAX
mat3 invTBN=transposeMat3(TBN);
#ifdef PARALLAXOCCLUSION
uvOffset=parallaxOcclusion(invTBN*-viewDirectionW,invTBN*normalW,vBumpUV,vBumpInfos.z);
#else
uvOffset=parallaxOffset(invTBN*viewDirectionW,vBumpInfos.z);
#endif
#endif
#ifdef DETAIL
vec4 detailColor=texture2D(detailSampler,vDetailUV+uvOffset);vec2 detailNormalRG=detailColor.wy*2.0-1.0;float detailNormalB=sqrt(1.-saturate(dot(detailNormalRG,detailNormalRG)));vec3 detailNormal=vec3(detailNormalRG,detailNormalB);
#endif
#ifdef BUMP
#ifdef OBJECTSPACE_NORMALMAP
#define CUSTOM_FRAGMENT_BUMP_FRAGMENT
normalW=normalize(texture2D(bumpSampler,vBumpUV).xyz *2.0-1.0);normalW=normalize(mat3(normalMatrix)*normalW);
#elif !defined(DETAIL)
normalW=perturbNormal(TBN,texture2D(bumpSampler,vBumpUV+uvOffset).xyz,vBumpInfos.y);
#else
vec3 bumpNormal=texture2D(bumpSampler,vBumpUV+uvOffset).xyz*2.0-1.0;
#if DETAIL_NORMALBLENDMETHOD==0 
detailNormal.xy*=vDetailInfos.z;vec3 blendedNormal=normalize(vec3(bumpNormal.xy+detailNormal.xy,bumpNormal.z*detailNormal.z));
#elif DETAIL_NORMALBLENDMETHOD==1 
detailNormal.xy*=vDetailInfos.z;bumpNormal+=vec3(0.0,0.0,1.0);detailNormal*=vec3(-1.0,-1.0,1.0);vec3 blendedNormal=bumpNormal*dot(bumpNormal,detailNormal)/bumpNormal.z-detailNormal;
#endif
normalW=perturbNormalBase(TBN,blendedNormal,vBumpInfos.y);
#endif
#elif defined(DETAIL)
detailNormal.xy*=vDetailInfos.z;normalW=perturbNormalBase(TBN,detailNormal,vDetailInfos.z);
#endif
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.s(["bumpFragment",0,{name:r,shader:i}])},95199,e=>{"use strict";var t=e.i(263537);let r="decalFragment",i=`#ifdef DECAL
#ifdef GAMMADECAL
decalColor.rgb=toLinearSpace(decalColor.rgb);
#endif
#ifdef DECAL_SMOOTHALPHA
decalColor.a*=decalColor.a;
#endif
surfaceAlbedo.rgb=mix(surfaceAlbedo.rgb,decalColor.rgb,decalColor.a);
#endif
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.s([])},951184,e=>{"use strict";var t=e.i(263537);let r="fresnelFunction",i=`#ifdef FRESNEL
float computeFresnelTerm(vec3 viewDirection,vec3 worldNormal,float bias,float power)
{float fresnelTerm=pow(bias+abs(dot(viewDirection,worldNormal)),power);return clamp(fresnelTerm,0.,1.);}
#endif
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.s([])},630956,e=>{"use strict";var t=e.i(263537);e.i(464797);let r="defaultFragmentDeclaration",i=`uniform vec4 vEyePosition;uniform vec4 vDiffuseColor;uniform vec4 vSpecularColor;uniform vec3 vEmissiveColor;uniform vec3 vAmbientColor;uniform float visibility;
#ifdef DIFFUSE
uniform vec2 vDiffuseInfos;
#endif
#ifdef AMBIENT
uniform vec2 vAmbientInfos;
#endif
#ifdef OPACITY 
uniform vec2 vOpacityInfos;
#endif
#ifdef EMISSIVE
uniform vec2 vEmissiveInfos;
#endif
#ifdef LIGHTMAP
uniform vec2 vLightmapInfos;
#endif
#ifdef BUMP
uniform vec3 vBumpInfos;uniform vec2 vTangentSpaceParams;
#endif
#ifdef ALPHATEST
uniform float alphaCutOff;
#endif
#if defined(REFLECTIONMAP_SPHERICAL) || defined(REFLECTIONMAP_PROJECTION) || defined(REFRACTION) || defined(PREPASS)
uniform mat4 view;
#endif
#ifdef REFRACTION
uniform vec4 vRefractionInfos;
#ifndef REFRACTIONMAP_3D
uniform mat4 refractionMatrix;
#endif
#ifdef REFRACTIONFRESNEL
uniform vec4 refractionLeftColor;uniform vec4 refractionRightColor;
#endif
#if defined(USE_LOCAL_REFRACTIONMAP_CUBIC) && defined(REFRACTIONMAP_3D)
uniform vec3 vRefractionPosition;uniform vec3 vRefractionSize; 
#endif
#endif
#if defined(SPECULAR) && defined(SPECULARTERM)
uniform vec2 vSpecularInfos;
#endif
#ifdef DIFFUSEFRESNEL
uniform vec4 diffuseLeftColor;uniform vec4 diffuseRightColor;
#endif
#ifdef OPACITYFRESNEL
uniform vec4 opacityParts;
#endif
#ifdef EMISSIVEFRESNEL
uniform vec4 emissiveLeftColor;uniform vec4 emissiveRightColor;
#endif
#if defined(REFLECTION) || (defined(AREALIGHTUSED) && defined(AREALIGHTSUPPORTED))
uniform vec2 vReflectionInfos;
#if defined(REFLECTIONMAP_PLANAR) || defined(REFLECTIONMAP_CUBIC) || defined(REFLECTIONMAP_PROJECTION) || defined(REFLECTIONMAP_EQUIRECTANGULAR) || defined(REFLECTIONMAP_SPHERICAL) || defined(REFLECTIONMAP_SKYBOX)
uniform mat4 reflectionMatrix;
#endif
#ifndef REFLECTIONMAP_SKYBOX
#if defined(USE_LOCAL_REFLECTIONMAP_CUBIC) && defined(REFLECTIONMAP_CUBIC)
uniform vec3 vReflectionPosition;uniform vec3 vReflectionSize; 
#endif
#endif
#ifdef REFLECTIONFRESNEL
uniform vec4 reflectionLeftColor;uniform vec4 reflectionRightColor;
#endif
#endif
#ifdef DETAIL
uniform vec4 vDetailInfos;
#endif
#include<decalFragmentDeclaration>
#define ADDITIONAL_FRAGMENT_DECLARATION
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.s([])},79643,e=>{"use strict";var t=e.i(263537);e.i(630956),e.i(413073),e.i(65434),e.i(423568),e.i(654740),e.i(201632),e.i(697427),e.i(10564),e.i(648054),e.i(121541),e.i(959117),e.i(951184),e.i(534236),e.i(315647),e.i(310063),e.i(120238),e.i(376170),e.i(261937),e.i(127010),e.i(190688),e.i(141687),e.i(48973),e.i(95199),e.i(449399),e.i(274561),e.i(358759),e.i(313119),e.i(776892);let r="defaultPixelShader",i=`#define CUSTOM_FRAGMENT_EXTENSION
#include<__decl__defaultFragment>
#if defined(BUMP) || !defined(NORMAL)
#extension GL_OES_standard_derivatives : enable
#endif
#include<prePassDeclaration>[SCENE_MRT_COUNT]
#include<oitDeclaration>
#define CUSTOM_FRAGMENT_BEGIN
#ifdef LOGARITHMICDEPTH
#extension GL_EXT_frag_depth : enable
#endif
varying vec3 vPositionW;
#ifdef NORMAL
varying vec3 vNormalW;
#endif
#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
varying vec4 vColor;
#endif
#if defined(CLUSTLIGHT_BATCH) && CLUSTLIGHT_BATCH>0
varying float vViewDepth;
#endif
#include<mainUVVaryingDeclaration>[1..7]
#include<helperFunctions>
#include<__decl__lightFragment>[0..maxSimultaneousLights]
#include<lightsFragmentFunctions>
#include<shadowsFragmentFunctions>
#include<samplerFragmentDeclaration>(_DEFINENAME_,DIFFUSE,_VARYINGNAME_,Diffuse,_SAMPLERNAME_,diffuse)
#include<samplerFragmentDeclaration>(_DEFINENAME_,AMBIENT,_VARYINGNAME_,Ambient,_SAMPLERNAME_,ambient)
#include<samplerFragmentDeclaration>(_DEFINENAME_,OPACITY,_VARYINGNAME_,Opacity,_SAMPLERNAME_,opacity)
#include<samplerFragmentDeclaration>(_DEFINENAME_,EMISSIVE,_VARYINGNAME_,Emissive,_SAMPLERNAME_,emissive)
#include<samplerFragmentDeclaration>(_DEFINENAME_,LIGHTMAP,_VARYINGNAME_,Lightmap,_SAMPLERNAME_,lightmap)
#include<samplerFragmentDeclaration>(_DEFINENAME_,DECAL,_VARYINGNAME_,Decal,_SAMPLERNAME_,decal)
#ifdef REFRACTION
#ifdef REFRACTIONMAP_3D
uniform samplerCube refractionCubeSampler;
#else
uniform sampler2D refraction2DSampler;
#endif
#endif
#if defined(SPECULARTERM)
#include<samplerFragmentDeclaration>(_DEFINENAME_,SPECULAR,_VARYINGNAME_,Specular,_SAMPLERNAME_,specular)
#endif
#include<fresnelFunction>
#ifdef REFLECTION
#ifdef REFLECTIONMAP_3D
uniform samplerCube reflectionCubeSampler;
#else
uniform sampler2D reflection2DSampler;
#endif
#ifdef REFLECTIONMAP_SKYBOX
varying vec3 vPositionUVW;
#else
#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)
varying vec3 vDirectionW;
#endif
#endif
#include<reflectionFunction>
#endif
#include<imageProcessingDeclaration>
#include<imageProcessingFunctions>
#include<bumpFragmentMainFunctions>
#include<bumpFragmentFunctions>
#include<clipPlaneFragmentDeclaration>
#include<logDepthDeclaration>
#include<fogFragmentDeclaration>
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
#include<clipPlaneFragment>
vec3 viewDirectionW=normalize(vEyePosition.xyz-vPositionW);vec4 baseColor=vec4(1.,1.,1.,1.);vec3 diffuseColor=vDiffuseColor.rgb;float alpha=vDiffuseColor.a;
#ifdef NORMAL
vec3 normalW=normalize(vNormalW);
#else
vec3 normalW=normalize(cross(dFdx(vPositionW),dFdy(vPositionW)))*vEyePosition.w;
#endif
#include<bumpFragment>
#ifdef TWOSIDEDLIGHTING
normalW=gl_FrontFacing ? normalW : -normalW;
#endif
#ifdef DIFFUSE
baseColor=texture2D(diffuseSampler,vDiffuseUV+uvOffset);
#if defined(ALPHATEST) && !defined(ALPHATEST_AFTERALLALPHACOMPUTATIONS)
if (baseColor.a<alphaCutOff)
discard;
#endif
#ifdef ALPHAFROMDIFFUSE
alpha*=baseColor.a;
#endif
#define CUSTOM_FRAGMENT_UPDATE_ALPHA
baseColor.rgb*=vDiffuseInfos.y;
#endif
#if defined(DECAL) && !defined(DECAL_AFTER_DETAIL)
vec4 decalColor=texture2D(decalSampler,vDecalUV+uvOffset);
#include<decalFragment>(surfaceAlbedo,baseColor,GAMMADECAL,_GAMMADECAL_NOTUSED_)
#endif
#include<depthPrePass>
#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
baseColor.rgb*=vColor.rgb;
#endif
#ifdef DETAIL
baseColor.rgb=baseColor.rgb*2.0*mix(0.5,detailColor.r,vDetailInfos.y);
#endif
#if defined(DECAL) && defined(DECAL_AFTER_DETAIL)
vec4 decalColor=texture2D(decalSampler,vDecalUV+uvOffset);
#include<decalFragment>(surfaceAlbedo,baseColor,GAMMADECAL,_GAMMADECAL_NOTUSED_)
#endif
#define CUSTOM_FRAGMENT_UPDATE_DIFFUSE
vec3 baseAmbientColor=vec3(1.,1.,1.);
#ifdef AMBIENT
baseAmbientColor=texture2D(ambientSampler,vAmbientUV+uvOffset).rgb*vAmbientInfos.y;
#endif
#define CUSTOM_FRAGMENT_BEFORE_LIGHTS
float glossiness=vSpecularColor.a;vec3 specularColor=vSpecularColor.rgb;
#ifdef SPECULARTERM
#ifdef SPECULAR
vec4 specularMapColor=texture2D(specularSampler,vSpecularUV+uvOffset);specularColor=specularMapColor.rgb;
#ifdef GLOSSINESS
glossiness=glossiness*specularMapColor.a;
#endif
#endif
#endif
vec3 diffuseBase=vec3(0.,0.,0.);lightingInfo info;
#ifdef SPECULARTERM
vec3 specularBase=vec3(0.,0.,0.);
#endif
float shadow=1.;float aggShadow=0.;float numLights=0.;
#ifdef LIGHTMAP
vec4 lightmapColor=texture2D(lightmapSampler,vLightmapUV+uvOffset);
#ifdef RGBDLIGHTMAP
lightmapColor.rgb=fromRGBD(lightmapColor);
#endif
lightmapColor.rgb*=vLightmapInfos.y;
#endif
#include<lightFragment>[0..maxSimultaneousLights]
aggShadow=aggShadow/numLights;vec4 refractionColor=vec4(0.,0.,0.,1.);
#ifdef REFRACTION
vec3 refractionVector=normalize(refract(-viewDirectionW,normalW,vRefractionInfos.y));
#ifdef REFRACTIONMAP_3D
#ifdef USE_LOCAL_REFRACTIONMAP_CUBIC
refractionVector=parallaxCorrectNormal(vPositionW,refractionVector,vRefractionSize,vRefractionPosition);
#endif
refractionVector.y=refractionVector.y*vRefractionInfos.w;vec4 refractionLookup=textureCube(refractionCubeSampler,refractionVector);if (dot(refractionVector,viewDirectionW)<1.0) {refractionColor=refractionLookup;}
#else
vec3 vRefractionUVW=vec3(refractionMatrix*(view*vec4(vPositionW+refractionVector*vRefractionInfos.z,1.0)));vec2 refractionCoords=vRefractionUVW.xy/vRefractionUVW.z;refractionCoords.y=1.0-refractionCoords.y;refractionColor=texture2D(refraction2DSampler,refractionCoords);
#endif
#ifdef RGBDREFRACTION
refractionColor.rgb=fromRGBD(refractionColor);
#endif
#ifdef IS_REFRACTION_LINEAR
refractionColor.rgb=toGammaSpace(refractionColor.rgb);
#endif
refractionColor.rgb*=vRefractionInfos.x;
#endif
vec4 reflectionColor=vec4(0.,0.,0.,1.);
#ifdef REFLECTION
vec3 vReflectionUVW=computeReflectionCoords(vec4(vPositionW,1.0),normalW);
#ifdef REFLECTIONMAP_OPPOSITEZ
vReflectionUVW.z*=-1.0;
#endif
#ifdef REFLECTIONMAP_3D
#ifdef ROUGHNESS
float bias=vReflectionInfos.y;
#ifdef SPECULARTERM
#ifdef SPECULAR
#ifdef GLOSSINESS
bias*=(1.0-specularMapColor.a);
#endif
#endif
#endif
reflectionColor=textureCube(reflectionCubeSampler,vReflectionUVW,bias);
#else
reflectionColor=textureCube(reflectionCubeSampler,vReflectionUVW);
#endif
#else
vec2 coords=vReflectionUVW.xy;
#ifdef REFLECTIONMAP_PROJECTION
coords/=vReflectionUVW.z;
#endif
coords.y=1.0-coords.y;reflectionColor=texture2D(reflection2DSampler,coords);
#endif
#ifdef RGBDREFLECTION
reflectionColor.rgb=fromRGBD(reflectionColor);
#endif
#ifdef IS_REFLECTION_LINEAR
reflectionColor.rgb=toGammaSpace(reflectionColor.rgb);
#endif
reflectionColor.rgb*=vReflectionInfos.x;
#ifdef REFLECTIONFRESNEL
float reflectionFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,reflectionRightColor.a,reflectionLeftColor.a);
#ifdef REFLECTIONFRESNELFROMSPECULAR
#ifdef SPECULARTERM
reflectionColor.rgb*=specularColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;
#else
reflectionColor.rgb*=reflectionLeftColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;
#endif
#else
reflectionColor.rgb*=reflectionLeftColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;
#endif
#endif
#endif
#ifdef REFRACTIONFRESNEL
float refractionFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,refractionRightColor.a,refractionLeftColor.a);refractionColor.rgb*=refractionLeftColor.rgb*(1.0-refractionFresnelTerm)+refractionFresnelTerm*refractionRightColor.rgb;
#endif
#ifdef OPACITY
vec4 opacityMap=texture2D(opacitySampler,vOpacityUV+uvOffset);
#ifdef OPACITYRGB
opacityMap.rgb=opacityMap.rgb*vec3(0.3,0.59,0.11);alpha*=(opacityMap.x+opacityMap.y+opacityMap.z)* vOpacityInfos.y;
#else
alpha*=opacityMap.a*vOpacityInfos.y;
#endif
#endif
#if defined(VERTEXALPHA) || defined(INSTANCESCOLOR) && defined(INSTANCES)
alpha*=vColor.a;
#endif
#ifdef OPACITYFRESNEL
float opacityFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,opacityParts.z,opacityParts.w);alpha+=opacityParts.x*(1.0-opacityFresnelTerm)+opacityFresnelTerm*opacityParts.y;
#endif
#ifdef ALPHATEST
#ifdef ALPHATEST_AFTERALLALPHACOMPUTATIONS
if (alpha<alphaCutOff)
discard;
#endif
#ifndef ALPHABLEND
alpha=1.0;
#endif
#endif
vec3 emissiveColor=vEmissiveColor;
#ifdef EMISSIVE
emissiveColor+=texture2D(emissiveSampler,vEmissiveUV+uvOffset).rgb*vEmissiveInfos.y;
#endif
#ifdef EMISSIVEFRESNEL
float emissiveFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,emissiveRightColor.a,emissiveLeftColor.a);emissiveColor*=emissiveLeftColor.rgb*(1.0-emissiveFresnelTerm)+emissiveFresnelTerm*emissiveRightColor.rgb;
#endif
#ifdef DIFFUSEFRESNEL
float diffuseFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,diffuseRightColor.a,diffuseLeftColor.a);diffuseBase*=diffuseLeftColor.rgb*(1.0-diffuseFresnelTerm)+diffuseFresnelTerm*diffuseRightColor.rgb;
#endif
#ifdef EMISSIVEASILLUMINATION
vec3 finalDiffuse=clamp(diffuseBase*diffuseColor+vAmbientColor,0.0,1.0)*baseColor.rgb;
#else
#ifdef LINKEMISSIVEWITHDIFFUSE
vec3 finalDiffuse=clamp((diffuseBase+emissiveColor)*diffuseColor+vAmbientColor,0.0,1.0)*baseColor.rgb;
#else
vec3 finalDiffuse=clamp(diffuseBase*diffuseColor+emissiveColor+vAmbientColor,0.0,1.0)*baseColor.rgb;
#endif
#endif
#ifdef SPECULARTERM
vec3 finalSpecular=specularBase*specularColor;
#ifdef SPECULAROVERALPHA
alpha=clamp(alpha+dot(finalSpecular,vec3(0.3,0.59,0.11)),0.,1.);
#endif
#else
vec3 finalSpecular=vec3(0.0);
#endif
#ifdef REFLECTIONOVERALPHA
alpha=clamp(alpha+dot(reflectionColor.rgb,vec3(0.3,0.59,0.11)),0.,1.);
#endif
#ifdef EMISSIVEASILLUMINATION
vec4 color=vec4(clamp(finalDiffuse*baseAmbientColor+finalSpecular+reflectionColor.rgb+emissiveColor+refractionColor.rgb,0.0,1.0),alpha);
#else
vec4 color=vec4(finalDiffuse*baseAmbientColor+finalSpecular+reflectionColor.rgb+refractionColor.rgb,alpha);
#endif
#ifdef LIGHTMAP
#ifndef LIGHTMAPEXCLUDED
#ifdef USELIGHTMAPASSHADOWMAP
color.rgb*=lightmapColor.rgb;
#else
color.rgb+=lightmapColor.rgb;
#endif
#endif
#endif
#define CUSTOM_FRAGMENT_BEFORE_FOG
color.rgb=max(color.rgb,0.);
#include<logDepthFragment>
#include<fogFragment>
#ifdef IMAGEPROCESSINGPOSTPROCESS
color.rgb=toLinearSpace(color.rgb);
#else
#ifdef IMAGEPROCESSING
color.rgb=toLinearSpace(color.rgb);color=applyImageProcessing(color);
#endif
#endif
color.a*=visibility;
#ifdef PREMULTIPLYALPHA
color.rgb*=color.a;
#endif
#define CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR
#ifdef PREPASS
#if SCENE_MRT_COUNT>0
float writeGeometryInfo=color.a>0.4 ? 1.0 : 0.0;
#ifdef PREPASS_COLOR
gl_FragData[PREPASS_COLOR_INDEX]=color; 
#endif
#ifdef PREPASS_POSITION
gl_FragData[PREPASS_POSITION_INDEX]=vec4(vPositionW,writeGeometryInfo);
#endif
#ifdef PREPASS_LOCAL_POSITION
gl_FragData[PREPASS_LOCAL_POSITION_INDEX]=vec4(vPosition,writeGeometryInfo);
#endif
#if defined(PREPASS_VELOCITY)
vec2 a=(vCurrentPosition.xy/vCurrentPosition.w)*0.5+0.5;vec2 b=(vPreviousPosition.xy/vPreviousPosition.w)*0.5+0.5;vec2 velocity=abs(a-b);velocity=vec2(pow(velocity.x,1.0/3.0),pow(velocity.y,1.0/3.0))*sign(a-b)*0.5+0.5;gl_FragData[PREPASS_VELOCITY_INDEX]=vec4(velocity,0.0,writeGeometryInfo);
#elif defined(PREPASS_VELOCITY_LINEAR)
vec2 velocity=vec2(0.5)*((vPreviousPosition.xy/vPreviousPosition.w)-(vCurrentPosition.xy/vCurrentPosition.w));gl_FragData[PREPASS_VELOCITY_LINEAR_INDEX]=vec4(velocity,0.0,writeGeometryInfo);
#endif
#ifdef PREPASS_IRRADIANCE
gl_FragData[PREPASS_IRRADIANCE_INDEX]=vec4(0.0,0.0,0.0,writeGeometryInfo); 
#endif
#ifdef PREPASS_DEPTH
gl_FragData[PREPASS_DEPTH_INDEX]=vec4(vViewPos.z,0.0,0.0,writeGeometryInfo); 
#endif
#ifdef PREPASS_SCREENSPACE_DEPTH
gl_FragData[PREPASS_SCREENSPACE_DEPTH_INDEX]=vec4(gl_FragCoord.z,0.0,0.0,writeGeometryInfo);
#endif
#ifdef PREPASS_NORMALIZED_VIEW_DEPTH
gl_FragData[PREPASS_NORMALIZED_VIEW_DEPTH_INDEX]=vec4(vNormViewDepth,0.0,0.0,writeGeometryInfo);
#endif
#ifdef PREPASS_NORMAL
#ifdef PREPASS_NORMAL_WORLDSPACE
gl_FragData[PREPASS_NORMAL_INDEX]=vec4(normalW,writeGeometryInfo);
#else
gl_FragData[PREPASS_NORMAL_INDEX]=vec4(normalize((view*vec4(normalW,0.0)).rgb),writeGeometryInfo);
#endif
#endif
#ifdef PREPASS_WORLD_NORMAL
gl_FragData[PREPASS_WORLD_NORMAL_INDEX]=vec4(normalW*0.5+0.5,writeGeometryInfo);
#endif
#ifdef PREPASS_ALBEDO
gl_FragData[PREPASS_ALBEDO_INDEX]=vec4(baseColor.rgb,writeGeometryInfo);
#endif
#ifdef PREPASS_ALBEDO_SQRT
gl_FragData[PREPASS_ALBEDO_SQRT_INDEX]=vec4(sqrt(baseColor.rgb),writeGeometryInfo);
#endif
#ifdef PREPASS_REFLECTIVITY
#if defined(SPECULAR)
gl_FragData[PREPASS_REFLECTIVITY_INDEX]=vec4(toLinearSpace(specularMapColor))*writeGeometryInfo; 
#else
gl_FragData[PREPASS_REFLECTIVITY_INDEX]=vec4(toLinearSpace(specularColor),1.0)*writeGeometryInfo;
#endif
#endif
#endif
#endif
#if !defined(PREPASS) || defined(WEBGL2)
gl_FragColor=color;
#endif
#include<oitFragment>
#if ORDER_INDEPENDENT_TRANSPARENCY
if (fragDepth==nearestDepth) {frontColor.rgb+=color.rgb*color.a*alphaMultiplier;frontColor.a=1.0-alphaMultiplier*(1.0-color.a);} else {backColor+=color;}
#endif
#define CUSTOM_FRAGMENT_MAIN_END
}
`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["defaultPixelShader",0,{name:r,shader:i}])},179676,961656,e=>{"use strict";var t,r,i=e.i(900280),a=e.i(269671),o=e.i(489899);function n(){let e=null;onmessage=t=>{if("init"===t.data.action){if(t.data.url)try{importScripts(t.data.url)}catch(e){postMessage({action:"error",error:e})}e||(e=BASIS({wasmBinary:t.data.wasmBinary})),null!==e&&e.then(e=>{BASIS=e,e.initializeBasis(),postMessage({action:"init"})})}else if("transcode"===t.data.action){var r,i;let e,a=t.data.config,o=t.data.imageData,n=new BASIS.BasisFile(o),s=function(e){let t=e.getHasAlpha(),r=e.getNumImages(),i=[];for(let t=0;t<r;t++){let r={levels:[]},a=e.getNumLevels(t);for(let i=0;i<a;i++){let a={width:e.getImageWidth(t,i),height:e.getImageHeight(t,i)};r.levels.push(a)}i.push(r)}return{hasAlpha:t,images:i}}(n),l=t.data.ignoreSupportedFormats?null:(r=t.data.config,i=s,e=null,r.supportedCompressionFormats&&(e=r.supportedCompressionFormats.astc?10:r.supportedCompressionFormats.bc7?6:r.supportedCompressionFormats.s3tc?i.hasAlpha?3:2:r.supportedCompressionFormats.pvrtc?i.hasAlpha?9:8:r.supportedCompressionFormats.etc2?1:14*!r.supportedCompressionFormats.etc1),e),f=!1;null===l&&(f=!0,l=s.hasAlpha?3:2);let c=!0;n.startTranscoding()||(c=!1);let d=[];for(let e=0;e<s.images.length&&c;e++){let t=s.images[e];if(void 0===a.loadSingleImage||a.loadSingleImage===e){let r=t.levels.length;!1===a.loadMipmapLevels&&(r=1);for(let i=0;i<r;i++){let r=t.levels[i],a=function(e,t,r,i,a){let o=new Uint8Array(e.getImageTranscodedSizeInBytes(t,r,i));return e.transcodeImage(o,t,r,i,1,0)?(a&&(o=function(e,t,r){let i=new Uint16Array(4),a=new Uint16Array(t*r),o=t/4,n=r/4;for(let r=0;r<n;r++)for(let n=0;n<o;n++){let s=0+8*(r*o+n);i[0]=e[s]|e[s+1]<<8,i[1]=e[s+2]|e[s+3]<<8,i[2]=(2*(31&i[0])+ +(31&i[1]))/3|(2*(2016&i[0])+ +(2016&i[1]))/3&2016|(2*(63488&i[0])+ +(63488&i[1]))/3&63488,i[3]=(2*(31&i[1])+ +(31&i[0]))/3|(2*(2016&i[1])+ +(2016&i[0]))/3&2016|(2*(63488&i[1])+ +(63488&i[0]))/3&63488;for(let o=0;o<4;o++){let l=e[s+4+o],f=(4*r+o)*t+4*n;a[f++]=i[3&l],a[f++]=i[l>>2&3],a[f++]=i[l>>4&3],a[f]=i[l>>6&3]}}return a}(o,e.getImageWidth(t,r)+3&-4,e.getImageHeight(t,r)+3&-4)),o):null}(n,e,i,l,f);if(!a){c=!1;break}r.transcodedPixels=a,d.push(r.transcodedPixels.buffer)}}}n.close(),n.delete(),f&&(l=-1),c?postMessage({action:"transcode",success:c,id:t.data.id,fileInfo:s,format:l},d):postMessage({action:"transcode",success:c,id:t.data.id})}}}async function s(e,t,r){return await new Promise((a,o)=>{let n=t=>{"init"===t.data.action?(e.removeEventListener("message",n),a(e)):"error"===t.data.action&&o(t.data.error||"error initializing worker")};e.addEventListener("message",n),e.postMessage({action:"init",url:r?i.Tools.GetBabylonScriptURL(r):void 0,wasmBinary:t},[t])})}(t=r||(r={}))[t.cTFETC1=0]="cTFETC1",t[t.cTFETC2=1]="cTFETC2",t[t.cTFBC1=2]="cTFBC1",t[t.cTFBC3=3]="cTFBC3",t[t.cTFBC4=4]="cTFBC4",t[t.cTFBC5=5]="cTFBC5",t[t.cTFBC7=6]="cTFBC7",t[t.cTFPVRTC1_4_RGB=8]="cTFPVRTC1_4_RGB",t[t.cTFPVRTC1_4_RGBA=9]="cTFPVRTC1_4_RGBA",t[t.cTFASTC_4x4=10]="cTFASTC_4x4",t[t.cTFATC_RGB=11]="cTFATC_RGB",t[t.cTFATC_RGBA_INTERPOLATED_ALPHA=12]="cTFATC_RGBA_INTERPOLATED_ALPHA",t[t.cTFRGBA32=13]="cTFRGBA32",t[t.cTFRGB565=14]="cTFRGB565",t[t.cTFBGR565=15]="cTFBGR565",t[t.cTFRGBA4444=16]="cTFRGBA4444",t[t.cTFFXT1_RGB=17]="cTFFXT1_RGB",t[t.cTFPVRTC2_4_RGB=18]="cTFPVRTC2_4_RGB",t[t.cTFPVRTC2_4_RGBA=19]="cTFPVRTC2_4_RGBA",t[t.cTFETC2_EAC_R11=20]="cTFETC2_EAC_R11",t[t.cTFETC2_EAC_RG11=21]="cTFETC2_EAC_RG11";let l={JSModuleURL:`${i.Tools._DefaultCdnUrl}/basisTranscoder/1/basis_transcoder.js`,WasmModuleURL:`${i.Tools._DefaultCdnUrl}/basisTranscoder/1/basis_transcoder.wasm`},f=null,c=null,d=0,u=async()=>(f||(f=new Promise((e,t)=>{c?e(c):i.Tools.LoadFileAsync(i.Tools.GetBabylonScriptURL(l.WasmModuleURL)).then(r=>{if("function"!=typeof URL)return t("Basis transcoder requires an environment with a URL constructor");s(c=new Worker(URL.createObjectURL(new Blob([`(${n})()`],{type:"application/javascript"}))),r,l.JSModuleURL).then(e,t)}).catch(t)})),await f),m=async(e,t)=>{let r=e instanceof ArrayBuffer?new Uint8Array(e):e;return await new Promise((e,i)=>{u().then(()=>{let a=d++,o=t=>{"transcode"===t.data.action&&t.data.id===a&&(c.removeEventListener("message",o),t.data.success?e(t.data):i("Transcode is not supported on this device"))};c.addEventListener("message",o);let n=new Uint8Array(r.byteLength);n.set(new Uint8Array(r.buffer,r.byteOffset,r.byteLength)),c.postMessage({action:"transcode",id:a,imageData:n,config:t,ignoreSupportedFormats:!1},[n.buffer])},e=>{i(e)})})},p=(e,t)=>{let r=t._gl?.TEXTURE_2D;e.isCube&&(r=t._gl?.TEXTURE_CUBE_MAP),t._bindTextureDirectly(r,e,!0)},v=(e,t)=>{let n=e.getEngine();for(let s=0;s<t.fileInfo.images.length;s++){let l=t.fileInfo.images[s].levels[0];if(e._invertVScale=e.invertY,-1===t.format||t.format===r.cTFRGB565)if(e.type=10,e.format=4,n._features.basisNeedsPOT&&(Math.log2(l.width)%1!=0||Math.log2(l.height)%1!=0)){let t=new o.InternalTexture(n,2);e._invertVScale=e.invertY,t.type=10,t.format=4,t.width=l.width+3&-4,t.height=l.height+3&-4,p(t,n),n._uploadDataToTextureDirectly(t,new Uint16Array(l.transcodedPixels.buffer),s,0,4,!0),n._rescaleTexture(t,e,n.scenes[0],n._getInternalFormat(4),()=>{n._releaseTexture(t),p(e,n)})}else e._invertVScale=!e.invertY,e.width=l.width+3&-4,e.height=l.height+3&-4,e.samplingMode=2,p(e,n),n._uploadDataToTextureDirectly(e,new Uint16Array(l.transcodedPixels.buffer),s,0,4,!0);else{e.width=l.width,e.height=l.height,e.generateMipMaps=t.fileInfo.images[s].levels.length>1;let r=S.GetInternalFormatFromBasisFormat(t.format,n);e.format=r,p(e,n);let o=t.fileInfo.images[s].levels;for(let t=0;t<o.length;t++){let i=o[t];n._uploadCompressedDataToTextureDirectly(e,r,i.width,i.height,i.transcodedPixels,s,t)}n._features.basisNeedsPOT&&(Math.log2(e.width)%1!=0||Math.log2(e.height)%1!=0)&&(i.Tools.Warn("Loaded .basis texture width and height are not a power of two. Texture wrapping will be set to Texture.CLAMP_ADDRESSMODE as other modes are not supported with non power of two dimensions in webGL 1."),e._cachedWrapU=a.Texture.CLAMP_ADDRESSMODE,e._cachedWrapV=a.Texture.CLAMP_ADDRESSMODE)}}},S={JSModuleURL:l.JSModuleURL,WasmModuleURL:l.WasmModuleURL,GetInternalFormatFromBasisFormat:(e,t)=>{let i;switch(e){case r.cTFETC1:i=36196;break;case r.cTFBC1:i=33776;break;case r.cTFBC4:i=33779;break;case r.cTFASTC_4x4:i=37808;break;case r.cTFETC2:i=37496;break;case r.cTFBC7:i=36492}if(void 0===i)throw"The chosen Basis transcoder format is not currently supported";return i},TranscodeAsync:m,LoadTextureFromTranscodeResult:v};Object.defineProperty(S,"JSModuleURL",{get:function(){return l.JSModuleURL},set:function(e){l.JSModuleURL=e}}),Object.defineProperty(S,"WasmModuleURL",{get:function(){return l.WasmModuleURL},set:function(e){l.WasmModuleURL=e}}),e.s(["LoadTextureFromTranscodeResult",0,v,"TranscodeAsync",0,m],961656),e.s(["_BasisTextureLoader",0,class{constructor(){this.supportCascades=!1}loadCubeData(e,t,r,a,o){if(Array.isArray(e))return;let n=t.getEngine().getCaps();m(e,{supportedCompressionFormats:{etc1:!!n.etc1,s3tc:!!n.s3tc,pvrtc:!!n.pvrtc,etc2:!!n.etc2,astc:!!n.astc,bc7:!!n.bptc}}).then(e=>{let r=e.fileInfo.images[0].levels.length>1&&t.generateMipMaps;v(t,e),t.getEngine()._setCubeMapTextureParams(t,r),t.isReady=!0,t.onLoadedObservable.notifyObservers(t),t.onLoadedObservable.clear(),a&&a()}).catch(e=>{i.Tools.Warn("Failed to transcode Basis file, transcoding may not be supported on this device"),t.isReady=!0,o&&o(e)})}loadData(e,t,r){let a=t.getEngine().getCaps();m(e,{supportedCompressionFormats:{etc1:!!a.etc1,s3tc:!!a.s3tc,pvrtc:!!a.pvrtc,etc2:!!a.etc2,astc:!!a.astc,bc7:!!a.bptc}}).then(e=>{let i=e.fileInfo.images[0].levels[0],a=e.fileInfo.images[0].levels.length>1&&t.generateMipMaps;r(i.width,i.height,a,-1!==e.format,()=>{v(t,e)})}).catch(e=>{i.Tools.Warn("Failed to transcode Basis file, transcoding may not be supported on this device"),i.Tools.Warn(`Failed to transcode Basis file: ${e}`),r(0,0,!1,!1,()=>{},!0)})}}],179676)},516401,e=>{"use strict";var t=e.i(263537);e.i(915112),e.i(314530),e.i(865557),e.i(738124),e.i(590030),e.i(407892),e.i(380244),e.i(13486),e.i(794415),e.i(597792),e.i(244222);let r="openpbrNormalMapVertexDeclaration",i=`#if defined(GEOMETRY_NORMAL) || defined(PARALLAX) || defined(CLEARCOAT_BUMP) || defined(ANISOTROPIC) || defined(FUZZ)
#if defined(TANGENT) && defined(NORMAL) 
varying vTBN0: vec3f;varying vTBN1: vec3f;varying vTBN2: vec3f;
#endif
#endif
`;t.ShaderStore.IncludesShadersStoreWGSL[r]||(t.ShaderStore.IncludesShadersStoreWGSL[r]=i),e.i(349e3),e.i(158271),e.i(557330),e.i(585817),e.i(945868),e.i(357351),e.i(465697),e.i(229624),e.i(988389),e.i(431235),e.i(300889),e.i(398879),e.i(92372),e.i(355157),e.i(838597),e.i(494148);let a="openpbrNormalMapVertex",o=`#if defined(GEOMETRY_NORMAL) || defined(PARALLAX) || defined(CLEARCOAT_BUMP) || defined(ANISOTROPIC) || defined(FUZZ)
#if defined(TANGENT) && defined(NORMAL)
var tbnNormal: vec3f=normalize(normalUpdated);var tbnTangent: vec3f=normalize(tangentUpdated.xyz);var tbnBitangent: vec3f=cross(tbnNormal,tbnTangent)*tangentUpdated.w;var matTemp= mat3x3f(finalWorld[0].xyz,finalWorld[1].xyz,finalWorld[2].xyz)* mat3x3f(tbnTangent,tbnBitangent,tbnNormal);vertexOutputs.vTBN0=matTemp[0];vertexOutputs.vTBN1=matTemp[1];vertexOutputs.vTBN2=matTemp[2];
#endif
#endif
`;t.ShaderStore.IncludesShadersStoreWGSL[a]||(t.ShaderStore.IncludesShadersStoreWGSL[a]=o),e.i(84318),e.i(492952),e.i(158752),e.i(556333),e.i(505913);let n="openpbrVertexShader",s=`#define OPENPBR_VERTEX_SHADER
#include<openpbrUboDeclaration>
#define CUSTOM_VERTEX_BEGIN
#ifndef USE_VERTEX_PULLING
attribute position: vec3f;
#ifdef NORMAL
attribute normal: vec3f;
#endif
#ifdef TANGENT
attribute tangent: vec4f;
#endif
#ifdef UV1
attribute uv: vec2f;
#endif
#include<uvAttributeDeclaration>[2..7]
#ifdef VERTEXCOLOR
attribute color: vec4f;
#endif
#endif
#include<mainUVVaryingDeclaration>[1..7]
#include<helperFunctions>
#include<pbrBRDFFunctions>
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<instancesDeclaration>
#include<prePassVertexDeclaration>
#include<samplerVertexDeclaration>(_DEFINENAME_,BASE_COLOR,_VARYINGNAME_,BaseColor)
#include<samplerVertexDeclaration>(_DEFINENAME_,BASE_WEIGHT,_VARYINGNAME_,BaseWeight)
#include<samplerVertexDeclaration>(_DEFINENAME_,BASE_DIFFUSE_ROUGHNESS,_VARYINGNAME_,BaseDiffuseRoughness)
#include<samplerVertexDeclaration>(_DEFINENAME_,BASE_METALNESS,_VARYINGNAME_,BaseMetalness)
#include<samplerVertexDeclaration>(_DEFINENAME_,SPECULAR_WEIGHT,_VARYINGNAME_,SpecularWeight)
#include<samplerVertexDeclaration>(_DEFINENAME_,SPECULAR_COLOR,_VARYINGNAME_,SpecularColor)
#include<samplerVertexDeclaration>(_DEFINENAME_,SPECULAR_ROUGHNESS,_VARYINGNAME_,SpecularRoughness)
#include<samplerVertexDeclaration>(_DEFINENAME_,SPECULAR_ROUGHNESS_ANISOTROPY,_VARYINGNAME_,SpecularRoughnessAnisotropy)
#include<samplerVertexDeclaration>(_DEFINENAME_,TRANSMISSION_WEIGHT,_VARYINGNAME_,TransmissionWeight)
#include<samplerVertexDeclaration>(_DEFINENAME_,TRANSMISSION_COLOR,_VARYINGNAME_,TransmissionColor)
#include<samplerVertexDeclaration>(_DEFINENAME_,TRANSMISSION_DEPTH,_VARYINGNAME_,TransmissionDepth)
#include<samplerVertexDeclaration>(_DEFINENAME_,TRANSMISSION_SCATTER,_VARYINGNAME_,TransmissionScatter)
#include<samplerVertexDeclaration>(_DEFINENAME_,TRANSMISSION_DISPERSION_SCALE,_VARYINGNAME_,TransmissionDispersionScale)
#include<samplerVertexDeclaration>(_DEFINENAME_,SUBSURFACE_WEIGHT,_VARYINGNAME_,SubsurfaceWeight)
#include<samplerVertexDeclaration>(_DEFINENAME_,SUBSURFACE_COLOR,_VARYINGNAME_,SubsurfaceColor)
#include<samplerVertexDeclaration>(_DEFINENAME_,SUBSURFACE_RADIUS_SCALE,_VARYINGNAME_,SubsurfaceRadiusScale)
#include<samplerVertexDeclaration>(_DEFINENAME_,COAT_WEIGHT,_VARYINGNAME_,CoatWeight)
#include<samplerVertexDeclaration>(_DEFINENAME_,COAT_COLOR,_VARYINGNAME_,CoatColor)
#include<samplerVertexDeclaration>(_DEFINENAME_,COAT_ROUGHNESS,_VARYINGNAME_,CoatRoughness)
#include<samplerVertexDeclaration>(_DEFINENAME_,COAT_ROUGHNESS_ANISOTROPY,_VARYINGNAME_,CoatRoughnessAnisotropy)
#include<samplerVertexDeclaration>(_DEFINENAME_,COAT_DARKENING,_VARYINGNAME_,CoatDarkening)
#include<samplerVertexDeclaration>(_DEFINENAME_,FUZZ_WEIGHT,_VARYINGNAME_,FuzzWeight)
#include<samplerVertexDeclaration>(_DEFINENAME_,FUZZ_COLOR,_VARYINGNAME_,FuzzColor)
#include<samplerVertexDeclaration>(_DEFINENAME_,FUZZ_ROUGHNESS,_VARYINGNAME_,FuzzRoughness)
#include<samplerVertexDeclaration>(_DEFINENAME_,GEOMETRY_NORMAL,_VARYINGNAME_,GeometryNormal)
#include<samplerVertexDeclaration>(_DEFINENAME_,GEOMETRY_TANGENT,_VARYINGNAME_,GeometryTangent)
#include<samplerVertexDeclaration>(_DEFINENAME_,GEOMETRY_COAT_NORMAL,_VARYINGNAME_,GeometryCoatNormal)
#include<samplerVertexDeclaration>(_DEFINENAME_,GEOMETRY_OPACITY,_VARYINGNAME_,GeometryOpacity)
#include<samplerVertexDeclaration>(_DEFINENAME_,GEOMETRY_THICKNESS,_VARYINGNAME_,GeometryThickness)
#include<samplerVertexDeclaration>(_DEFINENAME_,EMISSION_COLOR,_VARYINGNAME_,EmissionColor)
#include<samplerVertexDeclaration>(_DEFINENAME_,THIN_FILM_WEIGHT,_VARYINGNAME_,ThinFilmWeight)
#include<samplerVertexDeclaration>(_DEFINENAME_,THIN_FILM_THICKNESS,_VARYINGNAME_,ThinFilmThickness)
#include<samplerVertexDeclaration>(_DEFINENAME_,AMBIENT_OCCLUSION,_VARYINGNAME_,AmbientOcclusion)
#include<samplerVertexDeclaration>(_DEFINENAME_,DECAL,_VARYINGNAME_,Decal)
#include<samplerVertexDeclaration>(_DEFINENAME_,DETAIL,_VARYINGNAME_,Detail)
varying vPositionW: vec3f;
#if DEBUGMODE>0
varying vClipSpacePosition: vec4f;
#endif
#ifdef NORMAL
varying vNormalW: vec3f;
#if defined(USESPHERICALFROMREFLECTIONMAP) && defined(USESPHERICALINVERTEX)
varying vEnvironmentIrradiance: vec3f;
#include<harmonicsFunctions>
#endif
#endif
#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
varying vColor: vec4f;
#endif
#include<openpbrNormalMapVertexDeclaration>
#include<clipPlaneVertexDeclaration>
#include<fogVertexDeclaration>
#include<lightVxUboDeclaration>[0..maxSimultaneousLights]
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]
#ifdef REFLECTIONMAP_SKYBOX
varying vPositionUVW: vec3f;
#endif
#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)
varying vDirectionW: vec3f;
#endif
#include<logDepthDeclaration>
#include<vertexPullingDeclaration>
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input : VertexInputs)->FragmentInputs {
#define CUSTOM_VERTEX_MAIN_BEGIN
#ifdef USE_VERTEX_PULLING
var positionUpdated: vec3f=vec3f(0.0);
#ifdef NORMAL
var normalUpdated: vec3f=vec3f(0.0);
#endif
#ifdef TANGENT
var tangentUpdated: vec4f=vec4f(0.0);
#endif
#ifdef UV1
var uvUpdated: vec2f=vec2f(0.0);
#endif
#ifdef UV2
var uv2Updated: vec2f=vec2f(0.0);
#endif
#ifdef VERTEXCOLOR
var colorUpdated: vec4f=vec4f(0.0);
#endif
#else
var positionUpdated: vec3f=vertexInputs.position;
#ifdef NORMAL
var normalUpdated: vec3f=vertexInputs.normal;
#endif
#ifdef TANGENT
var tangentUpdated: vec4f=vertexInputs.tangent;
#endif
#ifdef UV1
var uvUpdated: vec2f=vertexInputs.uv;
#endif
#ifdef UV2
var uv2Updated: vec2f=vertexInputs.uv2;
#endif
#ifdef VERTEXCOLOR
var colorUpdated: vec4f=vertexInputs.color;
#endif
#endif
#include<vertexPullingVertex>
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
#ifdef REFLECTIONMAP_SKYBOX
vertexOutputs.vPositionUVW=positionUpdated;
#endif
#define CUSTOM_VERTEX_UPDATE_POSITION
#define CUSTOM_VERTEX_UPDATE_NORMAL
#include<instancesVertex>
#if defined(PREPASS) && ((defined(PREPASS_VELOCITY) || defined(PREPASS_VELOCITY_LINEAR)) && !defined(BONES_VELOCITY_ENABLED)
vertexOutputs.vCurrentPosition=scene.viewProjection*finalWorld*vec4f(positionUpdated,1.0);vertexOutputs.vPreviousPosition=uniforms.previousViewProjection*finalPreviousWorld*vec4f(positionUpdated,1.0);
#endif
#ifdef USE_VERTEX_PULLING
#include<bonesVertex>(vertexInputs.matricesIndices,vp_matricesIndices,vertexInputs.matricesWeights,vp_matricesWeights,vertexInputs.matricesIndicesExtra,vp_matricesIndicesExtra,vertexInputs.matricesWeightsExtra,vp_matricesWeightsExtra)
#include<bakedVertexAnimation>(vertexInputs.matricesIndices,vp_matricesIndices,vertexInputs.matricesWeights,vp_matricesWeights,vertexInputs.matricesIndicesExtra,vp_matricesIndicesExtra,vertexInputs.matricesWeightsExtra,vp_matricesWeightsExtra)
#else
#include<bonesVertex>
#include<bakedVertexAnimation>
#endif
var worldPos: vec4f=finalWorld* vec4f(positionUpdated,1.0);vertexOutputs.vPositionW= worldPos.xyz;
#ifdef PREPASS
#include<prePassVertex>
#endif
#ifdef NORMAL
var normalWorld: mat3x3f= mat3x3f(finalWorld[0].xyz,finalWorld[1].xyz,finalWorld[2].xyz);
#if defined(INSTANCES) && defined(THIN_INSTANCES)
vertexOutputs.vNormalW=normalUpdated/ vec3f(dot(normalWorld[0],normalWorld[0]),dot(normalWorld[1],normalWorld[1]),dot(normalWorld[2],normalWorld[2]));vertexOutputs.vNormalW=normalize(normalWorld*vertexOutputs.vNormalW);
#else
#ifdef NONUNIFORMSCALING
normalWorld=transposeMat3(inverseMat3(normalWorld));
#endif
vertexOutputs.vNormalW=normalize(normalWorld*normalUpdated);
#endif
#if defined(USESPHERICALFROMREFLECTIONMAP) && defined(USESPHERICALINVERTEX)
#if BASE_DIFFUSE_MODEL != BRDF_DIFFUSE_MODEL_LAMBERT && BASE_DIFFUSE_MODEL != BRDF_DIFFUSE_MODEL_LEGACY
var viewDirectionW: vec3f=normalize(scene.vEyePosition.xyz-vertexOutputs.vPositionW);var NdotV: f32=max(dot(vertexOutputs.vNormalW,viewDirectionW),0.0);var roughNormal: vec3f=mix(vertexOutputs.vNormalW,viewDirectionW,(0.5*(1.0-NdotV))*uniforms.vBaseDiffuseRoughness);var reflectionVector: vec3f= (uniforms.reflectionMatrix* vec4f(roughNormal,0)).xyz;
#else
var reflectionVector: vec3f= (uniforms.reflectionMatrix* vec4f(vertexOutputs.vNormalW,0)).xyz;
#endif
#ifdef REFLECTIONMAP_OPPOSITEZ
reflectionVector.z*=-1.0;
#endif
vertexOutputs.vEnvironmentIrradiance=computeEnvironmentIrradiance(reflectionVector);
#endif
#endif
#define CUSTOM_VERTEX_UPDATE_WORLDPOS
#ifdef MULTIVIEW
if (gl_ViewID_OVR==0u) {vertexOutputs.position=scene.viewProjection*worldPos;} else {vertexOutputs.position=scene.viewProjectionR*worldPos;}
#else
vertexOutputs.position=scene.viewProjection*worldPos;
#endif
#if DEBUGMODE>0
vertexOutputs.vClipSpacePosition=vertexOutputs.position;
#endif
#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)
vertexOutputs.vDirectionW=normalize((finalWorld*vec4f(positionUpdated,0.0)).xyz);
#endif
#ifndef UV1
var uvUpdated: vec2f= vec2f(0.,0.);
#endif
#ifdef MAINUV1
vertexOutputs.vMainUV1=uvUpdated;
#endif
#ifndef UV2
var uv2Updated: vec2f= vec2f(0.,0.);
#endif
#ifdef MAINUV2
vertexOutputs.vMainUV2=uv2Updated;
#endif
#include<uvVariableDeclaration>[3..7]
#include<samplerVertexImplementation>(_DEFINENAME_,BASE_COLOR,_VARYINGNAME_,BaseColor,_MATRIXNAME_,baseColor,_INFONAME_,BaseColorInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,BASE_WEIGHT,_VARYINGNAME_,BaseWeight,_MATRIXNAME_,baseWeight,_INFONAME_,BaseWeightInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,BASE_DIFFUSE_ROUGHNESS,_VARYINGNAME_,BaseDiffuseRoughness,_MATRIXNAME_,baseDiffuseRoughness,_INFONAME_,BaseDiffuseRoughnessInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,BASE_METALNESS,_VARYINGNAME_,BaseMetalness,_MATRIXNAME_,baseMetalness,_INFONAME_,BaseMetalnessInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,SPECULAR_WEIGHT,_VARYINGNAME_,SpecularWeight,_MATRIXNAME_,specularWeight,_INFONAME_,SpecularWeightInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,SPECULAR_COLOR,_VARYINGNAME_,SpecularColor,_MATRIXNAME_,specularColor,_INFONAME_,SpecularColorInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,SPECULAR_ROUGHNESS,_VARYINGNAME_,SpecularRoughness,_MATRIXNAME_,specularRoughness,_INFONAME_,SpecularRoughnessInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,SPECULAR_ROUGHNESS_ANISOTROPY,_VARYINGNAME_,SpecularRoughnessAnisotropy,_MATRIXNAME_,specularRoughnessAnisotropy,_INFONAME_,SpecularRoughnessAnisotropyInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,TRANSMISSION_WEIGHT,_VARYINGNAME_,TransmissionWeight,_MATRIXNAME_,transmissionWeight,_INFONAME_,TransmissionWeightInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,TRANSMISSION_COLOR,_VARYINGNAME_,TransmissionColor,_MATRIXNAME_,transmissionColor,_INFONAME_,TransmissionColorInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,TRANSMISSION_DEPTH,_VARYINGNAME_,TransmissionDepth,_MATRIXNAME_,transmissionDepth,_INFONAME_,TransmissionDepthInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,TRANSMISSION_SCATTER,_VARYINGNAME_,TransmissionScatter,_MATRIXNAME_,transmissionScatter,_INFONAME_,TransmissionScatterInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,TRANSMISSION_DISPERSION_SCALE,_VARYINGNAME_,TransmissionDispersionScale,_MATRIXNAME_,transmissionDispersionScale,_INFONAME_,TransmissionDispersionScaleInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,SUBSURFACE_WEIGHT,_VARYINGNAME_,SubsurfaceWeight,_MATRIXNAME_,subsurfaceWeight,_INFONAME_,SubsurfaceWeightInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,SUBSURFACE_COLOR,_VARYINGNAME_,SubsurfaceColor,_MATRIXNAME_,subsurfaceColor,_INFONAME_,SubsurfaceColorInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,SUBSURFACE_RADIUS_SCALE,_VARYINGNAME_,SubsurfaceRadiusScale,_MATRIXNAME_,subsurfaceRadiusScale,_INFONAME_,SubsurfaceRadiusScaleInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,COAT_WEIGHT,_VARYINGNAME_,CoatWeight,_MATRIXNAME_,coatWeight,_INFONAME_,CoatWeightInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,COAT_COLOR,_VARYNAME_,CoatColor,_MATRIXNAME_,coatColor,_INFONAME_,CoatColorInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,COAT_ROUGHNESS,_VARYINGNAME_,CoatRoughness,_MATRIXNAME_,coatRoughness,_INFONAME_,CoatRoughnessInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,COAT_ROUGHNESS_ANISOTROPY,_VARYINGNAME_,CoatRoughnessAnisotropy,_MATRIXNAME_,coatRoughnessAnisotropy,_INFONAME_,CoatRoughnessAnisotropyInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,COAT_DARKENING,_VARYINGNAME_,CoatDarkening,_MATRIXNAME_,coatDarkening,_INFONAME_,CoatDarkeningInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,FUZZ_WEIGHT,_VARYINGNAME_,FuzzWeight,_MATRIXNAME_,fuzzWeight,_INFONAME_,FuzzWeightInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,FUZZ_COLOR,_VARYINGNAME_,FuzzColor,_MATRIXNAME_,fuzzColor,_INFONAME_,FuzzColorInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,FUZZ_ROUGHNESS,_VARYINGNAME_,FuzzRoughness,_MATRIXNAME_,fuzzRoughness,_INFONAME_,FuzzRoughnessInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,GEOMETRY_NORMAL,_VARYINGNAME_,GeometryNormal,_MATRIXNAME_,geometryNormal,_INFONAME_,GeometryNormalInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,GEOMETRY_TANGENT,_VARYINGNAME_,GeometryTangent,_MATRIXNAME_,geometryTangent,_INFONAME_,GeometryTangentInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,GEOMETRY_COAT_NORMAL,_VARYINGNAME_,GeometryCoatNormal,_MATRIXNAME_,geometryCoatNormal,_INFONAME_,GeometryCoatNormalInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,GEOMETRY_OPACITY,_VARYINGNAME_,GeometryOpacity,_MATRIXNAME_,geometryOpacity,_INFONAME_,GeometryOpacityInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,GEOMETRY_THICKNESS,_VARYINGNAME_,GeometryThickness,_MATRIXNAME_,geometryThickness,_INFONAME_,GeometryThicknessInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,EMISSION_COLOR,_VARYINGNAME_,EmissionColor,_MATRIXNAME_,emissionColor,_INFONAME_,EmissionColorInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,THIN_FILM_WEIGHT,_VARYINGNAME_,ThinFilmWeight,_MATRIXNAME_,thinFilmWeight,_INFONAME_,ThinFilmWeightInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,THIN_FILM_THICKNESS,_VARYINGNAME_,ThinFilmThickness,_MATRIXNAME_,thinFilmThickness,_INFONAME_,ThinFilmThicknessInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,AMBIENT_OCCLUSION,_VARYINGNAME_,AmbientOcclusion,_MATRIXNAME_,ambientOcclusion,_INFONAME_,AmbientOcclusionInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,DECAL,_VARYINGNAME_,Decal,_MATRIXNAME_,decal,_INFONAME_,DecalInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,DETAIL,_VARYINGNAME_,Detail,_MATRIXNAME_,detail,_INFONAME_,DetailInfos.x)
#include<openpbrNormalMapVertex>
#include<clipPlaneVertex>
#include<fogVertex>
#include<shadowsVertex>[0..maxSimultaneousLights]
#include<vertexColorMixing>
#include<logDepthVertex>
#define CUSTOM_VERTEX_MAIN_END
}`;t.ShaderStore.ShadersStoreWGSL[n]||(t.ShaderStore.ShadersStoreWGSL[n]=s),e.s(["openpbrVertexShaderWGSL",0,{name:n,shader:s}],516401)},661301,e=>{"use strict";var t=e.i(489899),r=e.i(700183),i=e.i(91683);i.ThinEngine.prototype.restoreSingleAttachment=function(){let e=this._gl;this.bindAttachments([e.BACK])},i.ThinEngine.prototype.restoreSingleAttachmentForRenderTarget=function(){let e=this._gl;this.bindAttachments([e.COLOR_ATTACHMENT0])},i.ThinEngine.prototype.buildTextureLayout=function(e,t=!1){let r=this._gl,i=[];if(t)i.push(r.BACK);else for(let t=0;t<e.length;t++)e[t]?i.push(r["COLOR_ATTACHMENT"+t]):i.push(r.NONE);return i},i.ThinEngine.prototype.bindAttachments=function(e){this._gl.drawBuffers(e)},i.ThinEngine.prototype.unBindMultiColorAttachmentFramebuffer=function(e,t=!1,r){this._currentRenderTarget=null,e.disableAutomaticMSAAResolve||this.resolveMultiFramebuffer(e),t||this.generateMipMapsMultiFramebuffer(e),r&&(e._MSAAFramebuffer&&this._bindUnboundFramebuffer(e._framebuffer),r()),this._bindUnboundFramebuffer(null)},i.ThinEngine.prototype.createMultipleRenderTarget=function(e,i,a=!0){let o,n=!1,s=!0,l=!1,f=!1,c=1,d=1,u=[],m=[],p=[],v=[],S=[],h=[],x=[],g=[],E=[],_=!1,I=this._createHardwareRenderTargetWrapper(!0,!1,e);void 0!==i&&(n=void 0!==i.generateMipMaps&&i.generateMipMaps,s=void 0===i.generateDepthBuffer||i.generateDepthBuffer,l=void 0!==i.generateStencilBuffer&&i.generateStencilBuffer,f=void 0!==i.generateDepthTexture&&i.generateDepthTexture,c=i.textureCount??1,d=i.samples??d,u=i.types||u,m=i.samplingModes||m,p=i.useSRGBBuffers||p,v=i.formats||v,S=i.targetTypes||S,h=i.faceIndex||h,x=i.layerIndex||x,g=i.layerCounts||g,E=i.labels||E,_=i.dontCreateTextures??!1,this.webGLVersion>1&&(13===i.depthTextureFormat||17===i.depthTextureFormat||16===i.depthTextureFormat||14===i.depthTextureFormat||18===i.depthTextureFormat)&&(o=i.depthTextureFormat)),void 0===o&&(o=l?13:14);let T=this._gl,C=this._currentFramebuffer,A=T.createFramebuffer();this._bindUnboundFramebuffer(A);let N=e.width??e,R=e.height??e,D=[],M=[],P=this.webGLVersion>1&&(13===o||17===o||18===o);I.label=i?.label??"MultiRenderTargetWrapper",I._framebuffer=A,I._generateDepthBuffer=f||s,I._generateStencilBuffer=f?P:l,I._depthStencilBuffer=this._setupFramebufferDepthAttachments(I._generateStencilBuffer,I._generateDepthBuffer,N,R,1,o),I._attachments=M;for(let e=0;e<c;e++){let i=m[e]||3,a=u[e]||0,o=p[e]||!1,s=v[e]||5,l=S[e]||3553,f=g[e]??1;(1!==a||this._caps.textureFloatLinearFiltering)&&(2!==a||this._caps.textureHalfFloatLinearFiltering)||(i=1);let c=this._getSamplingParameters(i,n);1!==a||this._caps.textureFloat||(a=0,r.Logger.Warn("Float textures are not supported. Render target forced to TEXTURETYPE_UNSIGNED_BYTE type")),o=o&&this._caps.supportSRGBBuffers&&(this.webGLVersion>1||this.isWebGPU);let d=this.webGLVersion>1,h=T[d?"COLOR_ATTACHMENT"+e:"COLOR_ATTACHMENT"+e+"_WEBGL"];if(M.push(h),-1===l||_)continue;let x=new t.InternalTexture(this,6);D[e]=x,T.activeTexture(T["TEXTURE"+e]),T.bindTexture(l,x._hardwareTexture.underlyingResource),T.texParameteri(l,T.TEXTURE_MAG_FILTER,c.mag),T.texParameteri(l,T.TEXTURE_MIN_FILTER,c.min),T.texParameteri(l,T.TEXTURE_WRAP_S,T.CLAMP_TO_EDGE),T.texParameteri(l,T.TEXTURE_WRAP_T,T.CLAMP_TO_EDGE);let C=this._getRGBABufferInternalSizedFormat(a,s,o),A=this._getInternalFormat(s),P=this._getWebGLTextureType(a);if(d&&(35866===l||32879===l))35866===l?x.is2DArray=!0:x.is3D=!0,x.baseDepth=x.depth=f,T.texImage3D(l,0,C,N,R,f,0,A,P,null);else if(34067===l){for(let e=0;e<6;e++)T.texImage2D(T.TEXTURE_CUBE_MAP_POSITIVE_X+e,0,C,N,R,0,A,P,null);x.isCube=!0}else T.texImage2D(T.TEXTURE_2D,0,C,N,R,0,A,P,null);n&&T.generateMipmap(l),this._bindTextureDirectly(l,null),x.baseWidth=N,x.baseHeight=R,x.width=N,x.height=R,x.isReady=!0,x.samples=1,x.generateMipMaps=n,x.samplingMode=i,x.type=a,x._useSRGBBuffer=o,x.format=s,x.label=E[e]??I.label+"-Texture"+e,this._internalTexturesCache.push(x)}if(f&&this._caps.depthTextureExtension&&!_){let e=new t.InternalTexture(this,14),r=5,i=T.DEPTH_COMPONENT16,a=T.DEPTH_COMPONENT,s=T.UNSIGNED_SHORT,l=T.DEPTH_ATTACHMENT;this.webGLVersion<2?i=T.DEPTH_COMPONENT:14===o?(r=1,s=T.FLOAT,i=T.DEPTH_COMPONENT32F):18===o?(r=0,s=T.FLOAT_32_UNSIGNED_INT_24_8_REV,i=T.DEPTH32F_STENCIL8,a=T.DEPTH_STENCIL,l=T.DEPTH_STENCIL_ATTACHMENT):16===o?(r=0,s=T.UNSIGNED_INT,i=T.DEPTH_COMPONENT24,l=T.DEPTH_ATTACHMENT):(13===o||17===o)&&(r=12,s=T.UNSIGNED_INT_24_8,i=T.DEPTH24_STENCIL8,a=T.DEPTH_STENCIL,l=T.DEPTH_STENCIL_ATTACHMENT),this._bindTextureDirectly(T.TEXTURE_2D,e,!0),T.texParameteri(T.TEXTURE_2D,T.TEXTURE_MAG_FILTER,T.NEAREST),T.texParameteri(T.TEXTURE_2D,T.TEXTURE_MIN_FILTER,T.NEAREST),T.texParameteri(T.TEXTURE_2D,T.TEXTURE_WRAP_S,T.CLAMP_TO_EDGE),T.texParameteri(T.TEXTURE_2D,T.TEXTURE_WRAP_T,T.CLAMP_TO_EDGE),T.texImage2D(T.TEXTURE_2D,0,i,N,R,0,a,s,null),T.framebufferTexture2D(T.FRAMEBUFFER,l,T.TEXTURE_2D,e._hardwareTexture.underlyingResource,0),this._bindTextureDirectly(T.TEXTURE_2D,null),I._depthStencilTexture=e,I._depthStencilTextureWithStencil=P,e.baseWidth=N,e.baseHeight=R,e.width=N,e.height=R,e.isReady=!0,e.samples=1,e.generateMipMaps=n,e.samplingMode=1,e.format=o,e.type=r,e.label=I.label+"-DepthStencil",D[c]=e,this._internalTexturesCache.push(e)}if(I.setTextures(D),a&&T.drawBuffers(M),this._bindUnboundFramebuffer(C),I.setLayerAndFaceIndices(x,h),this.resetTextureCache(),_){if(d>1){let e=T.createFramebuffer();if(!e)throw Error("Unable to create multi sampled framebuffer");I._samples=d,I._MSAAFramebuffer=e,c>0&&a&&(this._bindUnboundFramebuffer(e),T.drawBuffers(M),this._bindUnboundFramebuffer(C))}}else this.updateMultipleRenderTargetTextureSampleCount(I,d,a);return I},i.ThinEngine.prototype.updateMultipleRenderTargetTextureSampleCount=function(e,t,r=!0){if(this.webGLVersion<2||!e)return 1;if(e.samples===t)return t;let i=this._gl;t=Math.min(t,this.getCaps().maxMSAASamples),e._depthStencilBuffer&&(i.deleteRenderbuffer(e._depthStencilBuffer),e._depthStencilBuffer=null),e._MSAAFramebuffer&&(i.deleteFramebuffer(e._MSAAFramebuffer),e._MSAAFramebuffer=null);let a=e._attachments.length;for(let t=0;t<a;t++){let r=e.textures[t]._hardwareTexture;r?.releaseMSAARenderBuffers()}if(t>1&&"function"==typeof i.renderbufferStorageMultisample){let o=i.createFramebuffer();if(!o)throw Error("Unable to create multi sampled framebuffer");e._MSAAFramebuffer=o,this._bindUnboundFramebuffer(o);let n=[];for(let r=0;r<a;r++){let a=e.textures[r],o=a._hardwareTexture,s=i[this.webGLVersion>1?"COLOR_ATTACHMENT"+r:"COLOR_ATTACHMENT"+r+"_WEBGL"],l=this._createRenderBuffer(a.width,a.height,t,-1,this._getRGBABufferInternalSizedFormat(a.type,a.format,a._useSRGBBuffer),s);if(!l)throw Error("Unable to create multi sampled framebuffer");o.addMSAARenderBuffer(l),a.samples=t,n.push(s)}r&&i.drawBuffers(n)}else this._bindUnboundFramebuffer(e._framebuffer);let o=e._depthStencilTexture?e._depthStencilTexture.format:void 0;return e._depthStencilBuffer=this._setupFramebufferDepthAttachments(e._generateStencilBuffer,e._generateDepthBuffer,e.width,e.height,t,o),this._bindUnboundFramebuffer(null),e._samples=t,t},i.ThinEngine.prototype.generateMipMapsMultiFramebuffer=function(e){let t=this._gl;if(e.isMulti)for(let r=0;r<e._attachments.length;r++){let i=e.textures[r];!i?.generateMipMaps||i?.isCube||i?.is3D||(this._bindTextureDirectly(t.TEXTURE_2D,i,!0),t.generateMipmap(t.TEXTURE_2D),this._bindTextureDirectly(t.TEXTURE_2D,null))}},i.ThinEngine.prototype.resolveMultiFramebuffer=function(e){let t=this._gl;if(!e._MSAAFramebuffer||!e.isMulti)return;let r=e.resolveMSAAColors?t.COLOR_BUFFER_BIT:0;r|=e._generateDepthBuffer&&e.resolveMSAADepth?t.DEPTH_BUFFER_BIT:0,r|=e._generateStencilBuffer&&e.resolveMSAAStencil?t.STENCIL_BUFFER_BIT:0;let i=e._attachments,a=i.length;t.bindFramebuffer(t.READ_FRAMEBUFFER,e._MSAAFramebuffer),t.bindFramebuffer(t.DRAW_FRAMEBUFFER,e._framebuffer);for(let o=0;o<a;o++){let n=e.textures[o];for(let e=0;e<a;e++)i[e]=t.NONE;i[o]=t[this.webGLVersion>1?"COLOR_ATTACHMENT"+o:"COLOR_ATTACHMENT"+o+"_WEBGL"],t.readBuffer(i[o]),t.drawBuffers(i),t.blitFramebuffer(0,0,n.width,n.height,0,0,n.width,n.height,r,t.NEAREST)}for(let e=0;e<a;e++)i[e]=t[this.webGLVersion>1?"COLOR_ATTACHMENT"+e:"COLOR_ATTACHMENT"+e+"_WEBGL"];t.drawBuffers(i),t.bindFramebuffer(this._gl.FRAMEBUFFER,e._MSAAFramebuffer)},e.s([])},529413,e=>{"use strict";var t=e.i(263537);e.i(24012),e.i(861230);let r="openpbrVertexDeclaration",i=`#include<sceneVertexDeclaration>
#ifdef BASE_COLOR
uniform vec2 vBaseColorInfos;uniform mat4 baseColorMatrix;
#endif
#ifdef BASE_WEIGHT
uniform mat4 baseWeightMatrix;uniform vec2 vBaseWeightInfos;
#endif
uniform float vBaseDiffuseRoughness;
#ifdef BASE_DIFFUSE_ROUGHNESS
uniform mat4 baseDiffuseRoughnessMatrix;uniform vec2 vBaseDiffuseRoughnessInfos;
#endif
#ifdef AMBIENT_OCCLUSION
uniform vec2 vAmbientOcclusionInfos;uniform mat4 ambientOcclusionMatrix;
#endif
#ifdef EMISSION_COLOR
uniform vec2 vEmissionColorInfos;uniform mat4 emissionColorMatrix;
#endif
#ifdef LIGHTMAP
uniform vec2 vLightmapInfos;uniform mat4 lightmapMatrix;
#endif
#ifdef BASE_METALNESS
uniform vec2 vBaseMetalnessInfos;uniform mat4 baseMetalnessMatrix;
#endif
#ifdef SPECULAR_WEIGHT
uniform vec2 vSpecularWeightInfos;uniform mat4 specularWeightMatrix;
#endif
#ifdef SPECULAR_COLOR
uniform vec2 vSpecularColorInfos;uniform mat4 specularColorMatrix;
#endif
#ifdef SPECULAR_ROUGHNESS
uniform vec2 vSpecularRoughnessInfos;uniform mat4 specularRoughnessMatrix;
#endif
#ifdef SPECULAR_ROUGHNESS_ANISOTROPY
uniform vec2 vSpecularRoughnessAnisotropyInfos;uniform mat4 specularRoughnessAnisotropyMatrix;
#endif
#ifdef TRANSMISSION_WEIGHT
uniform vec2 vTransmissionWeightInfos;uniform mat4 transmissionWeightMatrix;
#endif
#ifdef TRANSMISSION_COLOR
uniform vec2 vTransmissionColorInfos;uniform mat4 transmissionColorMatrix;
#endif
#ifdef TRANSMISSION_DEPTH
uniform vec2 vTransmissionDepthInfos;uniform mat4 transmissionDepthMatrix;
#endif
#ifdef TRANSMISSION_DISPERSION_SCALE
uniform vec2 vTransmissionDispersionScaleInfos;uniform mat4 transmissionDispersionScaleMatrix;
#endif
#ifdef SUBSURFACE_WEIGHT
uniform vec2 vSubsurfaceWeightInfos;uniform mat4 subsurfaceWeightMatrix;
#endif
#ifdef SUBSURFACE_COLOR
uniform vec2 vSubsurfaceColorInfos;uniform mat4 subsurfaceColorMatrix;
#endif
#ifdef SUBSURFACE_RADIUS_SCALE
uniform vec2 vSubsurfaceRadiusScaleInfos;uniform mat4 subsurfaceRadiusScaleMatrix;
#endif
#ifdef COAT_WEIGHT
uniform vec2 vCoatWeightInfos;uniform mat4 coatWeightMatrix;
#endif
#ifdef COAT_COLOR
uniform vec2 vCoatColorInfos;uniform mat4 coatColorMatrix;
#endif
#ifdef COAT_ROUGHNESS
uniform vec2 vCoatRoughnessInfos;uniform mat4 coatRoughnessMatrix;
#endif
#ifdef COAT_ROUGHNESS_ANISOTROPY
uniform vec2 vCoatRoughnessAnisotropyInfos;uniform mat4 coatRoughnessAnisotropyMatrix;
#endif
#ifdef COAT_IOR
uniform vec2 vCoatIorInfos;uniform mat4 coatIorMatrix;
#endif
#ifdef COAT_DARKENING
uniform vec2 vCoatDarkeningInfos;uniform mat4 coatDarkeningMatrix;
#endif
#ifdef FUZZ_WEIGHT
uniform vec2 vFuzzWeightInfos;uniform mat4 fuzzWeightMatrix;
#endif
#ifdef FUZZ_COLOR
uniform vec2 vFuzzColorInfos;uniform mat4 fuzzColorMatrix;
#endif
#ifdef FUZZ_ROUGHNESS
uniform vec2 vFuzzRoughnessInfos;uniform mat4 fuzzRoughnessMatrix;
#endif
#ifdef GEOMETRY_NORMAL
uniform vec2 vGeometryNormalInfos;uniform mat4 geometryNormalMatrix;
#endif
#ifdef GEOMETRY_TANGENT
uniform vec2 vGeometryTangentInfos;uniform mat4 geometryTangentMatrix;
#endif
#ifdef GEOMETRY_COAT_NORMAL
uniform vec2 vGeometryCoatNormalInfos;uniform mat4 geometryCoatNormalMatrix;
#endif
#ifdef THIN_FILM_WEIGHT
uniform vec2 vThinFilmWeightInfos;uniform mat4 thinFilmWeightMatrix;
#endif
#ifdef THIN_FILM_THICKNESS
uniform vec2 vThinFilmThicknessInfos;uniform mat4 thinFilmThicknessMatrix;
#endif
#ifdef GEOMETRY_OPACITY
uniform mat4 geometryOpacityMatrix;uniform vec2 vGeometryOpacityInfos;
#endif
#ifdef GEOMETRY_THICKNESS
uniform mat4 geometryThicknessMatrix;uniform vec2 vGeometryThicknessInfos;
#endif
#ifdef POINTSIZE
uniform float pointSize;
#endif
uniform vec4 cameraInfo;
#ifdef REFLECTION
uniform vec2 vReflectionInfos;uniform mat4 reflectionMatrix;
#endif
#ifdef NORMAL
#if defined(USESPHERICALFROMREFLECTIONMAP) && defined(USESPHERICALINVERTEX)
#ifdef USESPHERICALFROMREFLECTIONMAP
#ifdef SPHERICAL_HARMONICS
uniform vec3 vSphericalL00;uniform vec3 vSphericalL1_1;uniform vec3 vSphericalL10;uniform vec3 vSphericalL11;uniform vec3 vSphericalL2_2;uniform vec3 vSphericalL2_1;uniform vec3 vSphericalL20;uniform vec3 vSphericalL21;uniform vec3 vSphericalL22;
#else
uniform vec3 vSphericalX;uniform vec3 vSphericalY;uniform vec3 vSphericalZ;uniform vec3 vSphericalXX_ZZ;uniform vec3 vSphericalYY_ZZ;uniform vec3 vSphericalZZ;uniform vec3 vSphericalXY;uniform vec3 vSphericalYZ;uniform vec3 vSphericalZX;
#endif
#endif
#endif
#endif
#ifdef DETAIL
uniform vec4 vDetailInfos;uniform mat4 detailMatrix;
#endif
#include<decalVertexDeclaration>
#define ADDITIONAL_VERTEX_DECLARATION
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.i(494429),e.i(816086),e.i(654740),e.i(201632),e.i(424192),e.i(624154),e.i(568039),e.i(880779),e.i(561967),e.i(491476),e.i(241326);let a="openpbrNormalMapVertexDeclaration",o=`#if defined(GEOMETRY_NORMAL) || defined(PARALLAX) || defined(GEOMETRY_COAT_NORMAL) || defined(ANISOTROPIC) || defined(FUZZ)
#if defined(TANGENT) && defined(NORMAL) 
varying mat3 vTBN;
#endif
#endif
`;t.ShaderStore.IncludesShadersStore[a]||(t.ShaderStore.IncludesShadersStore[a]=o),e.i(182478),e.i(30653),e.i(957479),e.i(889952),e.i(298378),e.i(369136),e.i(127010),e.i(675406),e.i(610460),e.i(587630),e.i(761523),e.i(479126),e.i(46566),e.i(591573),e.i(631130);let n="openpbrNormalMapVertex",s=`#if defined(GEOMETRY_NORMAL) || defined(PARALLAX) || defined(GEOMETRY_COAT_NORMAL) || defined(ANISOTROPIC) || defined(FUZZ)
#if defined(TANGENT) && defined(NORMAL)
vec3 tbnNormal=normalize(normalUpdated);vec3 tbnTangent=normalize(tangentUpdated.xyz);vec3 tbnBitangent=cross(tbnNormal,tbnTangent)*tangentUpdated.w;vTBN=mat3(finalWorld)*mat3(tbnTangent,tbnBitangent,tbnNormal);
#endif
#endif
`;t.ShaderStore.IncludesShadersStore[n]||(t.ShaderStore.IncludesShadersStore[n]=s),e.i(781801),e.i(313976),e.i(294715),e.i(146259),e.i(94556);let l="openpbrVertexShader",f=`#define OPENPBR_VERTEX_SHADER
#define CUSTOM_VERTEX_EXTENSION
precision highp float;
#include<__decl__openpbrVertex>
#define CUSTOM_VERTEX_BEGIN
attribute vec3 position;
#ifdef NORMAL
attribute vec3 normal;
#endif
#ifdef TANGENT
attribute vec4 tangent;
#endif
#ifdef UV1
attribute vec2 uv;
#endif
#include<uvAttributeDeclaration>[2..7]
#include<mainUVVaryingDeclaration>[1..7]
#ifdef VERTEXCOLOR
attribute vec4 color;
#endif
#include<helperFunctions>
#include<pbrBRDFFunctions>
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<instancesDeclaration>
#include<prePassVertexDeclaration>
#include<samplerVertexDeclaration>(_DEFINENAME_,BASE_COLOR,_VARYINGNAME_,BaseColor)
#include<samplerVertexDeclaration>(_DEFINENAME_,BASE_WEIGHT,_VARYINGNAME_,BaseWeight)
#include<samplerVertexDeclaration>(_DEFINENAME_,BASE_DIFFUSE_ROUGHNESS,_VARYINGNAME_,BaseDiffuseRoughness)
#include<samplerVertexDeclaration>(_DEFINENAME_,BASE_METALNESS,_VARYINGNAME_,BaseMetalness)
#include<samplerVertexDeclaration>(_DEFINENAME_,SPECULAR_WEIGHT,_VARYINGNAME_,SpecularWeight)
#include<samplerVertexDeclaration>(_DEFINENAME_,SPECULAR_COLOR,_VARYINGNAME_,SpecularColor)
#include<samplerVertexDeclaration>(_DEFINENAME_,SPECULAR_ROUGHNESS,_VARYINGNAME_,SpecularRoughness)
#include<samplerVertexDeclaration>(_DEFINENAME_,SPECULAR_ROUGHNESS_ANISOTROPY,_VARYINGNAME_,SpecularRoughnessAnisotropy)
#include<samplerVertexDeclaration>(_DEFINENAME_,TRANSMISSION_WEIGHT,_VARYINGNAME_,TransmissionWeight)
#include<samplerVertexDeclaration>(_DEFINENAME_,TRANSMISSION_COLOR,_VARYINGNAME_,TransmissionColor)
#include<samplerVertexDeclaration>(_DEFINENAME_,TRANSMISSION_DEPTH,_VARYINGNAME_,TransmissionDepth)
#include<samplerVertexDeclaration>(_DEFINENAME_,TRANSMISSION_SCATTER,_VARYINGNAME_,TransmissionScatter)
#include<samplerVertexDeclaration>(_DEFINENAME_,TRANSMISSION_DISPERSION_SCALE,_VARYINGNAME_,TransmissionDispersionScale)
#include<samplerVertexDeclaration>(_DEFINENAME_,SUBSURFACE_WEIGHT,_VARYINGNAME_,SubsurfaceWeight)
#include<samplerVertexDeclaration>(_DEFINENAME_,SUBSURFACE_COLOR,_VARYINGNAME_,SubsurfaceColor)
#include<samplerVertexDeclaration>(_DEFINENAME_,SUBSURFACE_RADIUS_SCALE,_VARYINGNAME_,SubsurfaceRadiusScale)
#include<samplerVertexDeclaration>(_DEFINENAME_,COAT_WEIGHT,_VARYINGNAME_,CoatWeight)
#include<samplerVertexDeclaration>(_DEFINENAME_,COAT_COLOR,_VARYINGNAME_,CoatColor)
#include<samplerVertexDeclaration>(_DEFINENAME_,COAT_ROUGHNESS,_VARYINGNAME_,CoatRoughness)
#include<samplerVertexDeclaration>(_DEFINENAME_,COAT_ROUGHNESS_ANISOTROPY,_VARYINGNAME_,CoatRoughnessAnisotropy)
#include<samplerVertexDeclaration>(_DEFINENAME_,COAT_DARKENING,_VARYINGNAME_,CoatDarkening)
#include<samplerVertexDeclaration>(_DEFINENAME_,FUZZ_WEIGHT,_VARYINGNAME_,FuzzWeight)
#include<samplerVertexDeclaration>(_DEFINENAME_,FUZZ_COLOR,_VARYINGNAME_,FuzzColor)
#include<samplerVertexDeclaration>(_DEFINENAME_,FUZZ_ROUGHNESS,_VARYINGNAME_,FuzzRoughness)
#include<samplerVertexDeclaration>(_DEFINENAME_,GEOMETRY_NORMAL,_VARYINGNAME_,GeometryNormal)
#include<samplerVertexDeclaration>(_DEFINENAME_,GEOMETRY_TANGENT,_VARYINGNAME_,GeometryTangent)
#include<samplerVertexDeclaration>(_DEFINENAME_,GEOMETRY_COAT_NORMAL,_VARYINGNAME_,GeometryCoatNormal)
#include<samplerVertexDeclaration>(_DEFINENAME_,GEOMETRY_OPACITY,_VARYINGNAME_,GeometryOpacity)
#include<samplerVertexDeclaration>(_DEFINENAME_,GEOMETRY_THICKNESS,_VARYINGNAME_,GeometryThickness)
#include<samplerVertexDeclaration>(_DEFINENAME_,EMISSION_COLOR,_VARYINGNAME_,EmissionColor)
#include<samplerVertexDeclaration>(_DEFINENAME_,THIN_FILM_WEIGHT,_VARYINGNAME_,ThinFilmWeight)
#include<samplerVertexDeclaration>(_DEFINENAME_,THIN_FILM_THICKNESS,_VARYINGNAME_,ThinFilmThickness)
#include<samplerVertexDeclaration>(_DEFINENAME_,AMBIENT_OCCLUSION,_VARYINGNAME_,AmbientOcclusion)
#include<samplerVertexDeclaration>(_DEFINENAME_,DECAL,_VARYINGNAME_,Decal)
#include<samplerVertexDeclaration>(_DEFINENAME_,DETAIL,_VARYINGNAME_,Detail)
varying vec3 vPositionW;
#if DEBUGMODE>0
varying vec4 vClipSpacePosition;
#endif
#ifdef NORMAL
varying vec3 vNormalW;
#if defined(USESPHERICALFROMREFLECTIONMAP) && defined(USESPHERICALINVERTEX)
varying vec3 vEnvironmentIrradiance;
#include<harmonicsFunctions>
#endif
#endif
#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
varying vec4 vColor;
#endif
#include<openpbrNormalMapVertexDeclaration>
#include<clipPlaneVertexDeclaration>
#include<fogVertexDeclaration>
#include<__decl__lightVxFragment>[0..maxSimultaneousLights]
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]
#ifdef REFLECTIONMAP_SKYBOX
varying vec3 vPositionUVW;
#endif
#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)
varying vec3 vDirectionW;
#endif
#include<logDepthDeclaration>
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
vec3 positionUpdated=position;
#ifdef NORMAL
vec3 normalUpdated=normal;
#endif
#ifdef TANGENT
vec4 tangentUpdated=tangent;
#endif
#ifdef UV1
vec2 uvUpdated=uv;
#endif
#ifdef UV2
vec2 uv2Updated=uv2;
#endif
#ifdef VERTEXCOLOR
vec4 colorUpdated=color;
#endif
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
#ifdef REFLECTIONMAP_SKYBOX
vPositionUVW=positionUpdated;
#endif
#define CUSTOM_VERTEX_UPDATE_POSITION
#define CUSTOM_VERTEX_UPDATE_NORMAL
#include<instancesVertex>
#if defined(PREPASS) && ((defined(PREPASS_VELOCITY) || defined(PREPASS_VELOCITY_LINEAR)) && !defined(BONES_VELOCITY_ENABLED)
vCurrentPosition=viewProjection*finalWorld*vec4(positionUpdated,1.0);vPreviousPosition=previousViewProjection*finalPreviousWorld*vec4(positionUpdated,1.0);
#endif
#include<bonesVertex>
#include<bakedVertexAnimation>
vec4 worldPos=finalWorld*vec4(positionUpdated,1.0);vPositionW=vec3(worldPos);
#ifdef PREPASS
#include<prePassVertex>
#endif
#ifdef NORMAL
mat3 normalWorld=mat3(finalWorld);
#if defined(INSTANCES) && defined(THIN_INSTANCES)
vNormalW=normalUpdated/vec3(dot(normalWorld[0],normalWorld[0]),dot(normalWorld[1],normalWorld[1]),dot(normalWorld[2],normalWorld[2]));vNormalW=normalize(normalWorld*vNormalW);
#else
#ifdef NONUNIFORMSCALING
normalWorld=transposeMat3(inverseMat3(normalWorld));
#endif
vNormalW=normalize(normalWorld*normalUpdated);
#endif
#if defined(USESPHERICALFROMREFLECTIONMAP) && defined(USESPHERICALINVERTEX)
#if BASE_DIFFUSE_MODEL != BRDF_DIFFUSE_MODEL_LAMBERT && BASE_DIFFUSE_MODEL != BRDF_DIFFUSE_MODEL_LEGACY
vec3 viewDirectionW=normalize(vEyePosition.xyz-vPositionW);
#if !defined(NATIVE) && !defined(WEBGPU)
bool bbb=any(isnan(position));if (bbb) { }
#endif
float NdotV=max(dot(vNormalW,viewDirectionW),0.0);vec3 roughNormal=mix(vNormalW,viewDirectionW,(0.5*(1.0-NdotV))*vBaseDiffuseRoughness);vec3 reflectionVector=vec3(reflectionMatrix*vec4(roughNormal,0)).xyz;
#else
vec3 reflectionVector=vec3(reflectionMatrix*vec4(vNormalW,0)).xyz;
#endif
#ifdef REFLECTIONMAP_OPPOSITEZ
reflectionVector.z*=-1.0;
#endif
vEnvironmentIrradiance=computeEnvironmentIrradiance(reflectionVector);
#endif
#endif
#define CUSTOM_VERTEX_UPDATE_WORLDPOS
#ifdef MULTIVIEW
if (gl_ViewID_OVR==0u) {gl_Position=viewProjection*worldPos;} else {gl_Position=viewProjectionR*worldPos;}
#else
gl_Position=viewProjection*worldPos;
#endif
#if DEBUGMODE>0
vClipSpacePosition=gl_Position;
#endif
#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)
vDirectionW=normalize(vec3(finalWorld*vec4(positionUpdated,0.0)));
#endif
#ifndef UV1
vec2 uvUpdated=vec2(0.,0.);
#endif
#ifndef UV2
vec2 uv2Updated=vec2(0.,0.);
#endif
#ifdef MAINUV1
vMainUV1=uvUpdated;
#endif
#ifdef MAINUV2
vMainUV2=uv2Updated;
#endif
#include<uvVariableDeclaration>[3..7]
#include<samplerVertexImplementation>(_DEFINENAME_,BASE_COLOR,_VARYINGNAME_,BaseColor,_MATRIXNAME_,baseColor,_INFONAME_,BaseColorInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,BASE_WEIGHT,_VARYINGNAME_,BaseWeight,_MATRIXNAME_,baseWeight,_INFONAME_,BaseWeightInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,BASE_DIFFUSE_ROUGHNESS,_VARYINGNAME_,BaseDiffuseRoughness,_MATRIXNAME_,baseDiffuseRoughness,_INFONAME_,BaseDiffuseRoughnessInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,BASE_METALNESS,_VARYINGNAME_,BaseMetalness,_MATRIXNAME_,baseMetalness,_INFONAME_,BaseMetalnessInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,SPECULAR_WEIGHT,_VARYINGNAME_,SpecularWeight,_MATRIXNAME_,specularWeight,_INFONAME_,SpecularWeightInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,SPECULAR_COLOR,_VARYINGNAME_,SpecularColor,_MATRIXNAME_,specularColor,_INFONAME_,SpecularColorInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,SPECULAR_ROUGHNESS,_VARYINGNAME_,SpecularRoughness,_MATRIXNAME_,specularRoughness,_INFONAME_,SpecularRoughnessInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,SPECULAR_ROUGHNESS_ANISOTROPY,_VARYINGNAME_,SpecularRoughnessAnisotropy,_MATRIXNAME_,specularRoughnessAnisotropy,_INFONAME_,SpecularRoughnessAnisotropyInfos.x)
#include <samplerVertexImplementation>(_DEFINENAME_,TRANSMISSION_WEIGHT,_VARYINGNAME_,TransmissionWeight,_MATRIXNAME_,transmissionWeight,_INFONAME_,TransmissionWeightInfos.x)
#include <samplerVertexImplementation>(_DEFINENAME_,TRANSMISSION_COLOR,_VARYINGNAME_,TransmissionColor,_MATRIXNAME_,transmissionColor,_INFONAME_,TransmissionColorInfos.x)
#include <samplerVertexImplementation>(_DEFINENAME_,TRANSMISSION_DEPTH,_VARYINGNAME_,TransmissionDepth,_MATRIXNAME_,transmissionDepth,_INFONAME_,TransmissionDepthInfos.x)
#include <samplerVertexImplementation>(_DEFINENAME_,TRANSMISSION_SCATTER,_VARYINGNAME_,TransmissionScatter,_MATRIXNAME_,transmissionScatter,_INFONAME_,TransmissionScatterInfos.x)
#include <samplerVertexImplementation>(_DEFINENAME_,TRANSMISSION_DISPERSION_SCALE,_VARYINGNAME_,TransmissionDispersionScale,_MATRIXNAME_,transmissionDispersionScale,_INFONAME_,TransmissionDispersionScaleInfos.x)
#include <samplerVertexImplementation>(_DEFINENAME_,SUBSURFACE_WEIGHT,_VARYINGNAME_,SubsurfaceWeight,_MATRIXNAME_,subsurfaceWeight,_INFONAME_,SubsurfaceWeightInfos.x)
#include <samplerVertexImplementation>(_DEFINENAME_,SUBSURFACE_COLOR,_VARYINGNAME_,SubsurfaceColor,_MATRIXNAME_,subsurfaceColor,_INFONAME_,SubsurfaceColorInfos.x)
#include <samplerVertexImplementation>(_DEFINENAME_,SUBSURFACE_RADIUS_SCALE,_VARYINGNAME_,SubsurfaceRadiusScale,_MATRIXNAME_,subsurfaceRadiusScale,_INFONAME_,SubsurfaceRadiusScaleInfos.x)
#include <samplerVertexImplementation>(_DEFINENAME_,COAT_WEIGHT,_VARYINGNAME_,CoatWeight,_MATRIXNAME_,coatWeight,_INFONAME_,CoatWeightInfos.x)
#include <samplerVertexImplementation>(_DEFINENAME_,COAT_COLOR,_VARYINGNAME_,CoatColor,_MATRIXNAME_,coatColor,_INFONAME_,CoatColorInfos.x)
#include <samplerVertexImplementation>(_DEFINENAME_,COAT_ROUGHNESS,_VARYINGNAME_,CoatRoughness,_MATRIXNAME_,coatRoughness,_INFONAME_,CoatRoughnessInfos.x)
#include <samplerVertexImplementation>(_DEFINENAME_,COAT_ROUGHNESS_ANISOTROPY,_VARYINGNAME_,CoatRoughnessAnisotropy,_MATRIXNAME_,coatRoughnessAnisotropy,_INFONAME_,CoatRoughnessAnisotropyInfos.x)
#include <samplerVertexImplementation>(_DEFINENAME_,COAT_DARKENING,_VARYINGNAME_,CoatDarkening,_MATRIXNAME_,coatDarkening,_INFONAME_,CoatDarkeningInfos.x)
#include <samplerVertexImplementation>(_DEFINENAME_,FUZZ_WEIGHT,_VARYINGNAME_,FuzzWeight,_MATRIXNAME_,fuzzWeight,_INFONAME_,FuzzWeightInfos.x)
#include <samplerVertexImplementation>(_DEFINENAME_,FUZZ_COLOR,_VARYINGNAME_,FuzzColor,_MATRIXNAME_,fuzzColor,_INFONAME_,FuzzColorInfos.x)
#include <samplerVertexImplementation>(_DEFINENAME_,FUZZ_ROUGHNESS,_VARYINGNAME_,FuzzRoughness,_MATRIXNAME_,fuzzRoughness,_INFONAME_,FuzzRoughnessInfos.x)
#include <samplerVertexImplementation>(_DEFINENAME_,GEOMETRY_NORMAL,_VARYINGNAME_,GeometryNormal,_MATRIXNAME_,geometryNormal,_INFONAME_,GeometryNormalInfos.x)
#include <samplerVertexImplementation>(_DEFINENAME_,GEOMETRY_COAT_NORMAL,_VARYINGNAME_,GeometryCoatNormal,_MATRIXNAME_,geometryCoatNormal,_INFONAME_,GeometryCoatNormalInfos.x)
#include <samplerVertexImplementation>(_DEFINENAME_,GEOMETRY_OPACITY,_VARYINGNAME_,GeometryOpacity,_MATRIXNAME_,geometryOpacity,_INFONAME_,GeometryOpacityInfos.x)
#include <samplerVertexImplementation>(_DEFINENAME_,GEOMETRY_THICKNESS,_VARYINGNAME_,GeometryThickness,_MATRIXNAME_,geometryThickness,_INFONAME_,GeometryThicknessInfos.x)
#include <samplerVertexImplementation>(_DEFINENAME_,GEOMETRY_TANGENT,_VARYINGNAME_,GeometryTangent,_MATRIXNAME_,geometryTangent,_INFONAME_,GeometryTangentInfos.x)
#include <samplerVertexImplementation>(_DEFINENAME_,EMISSION_COLOR,_VARYINGNAME_,EmissionColor,_MATRIXNAME_,emissionColor,_INFONAME_,EmissionColorInfos.x)
#include <samplerVertexImplementation>(_DEFINENAME_,THIN_FILM_WEIGHT,_VARYINGNAME_,ThinFilmWeight,_MATRIXNAME_,thinFilmWeight,_INFONAME_,ThinFilmWeightInfos.x)
#include <samplerVertexImplementation>(_DEFINENAME_,THIN_FILM_THICKNESS,_VARYINGNAME_,ThinFilmThickness,_MATRIXNAME_,thinFilmThickness,_INFONAME_,ThinFilmThicknessInfos.x)
#include <samplerVertexImplementation>(_DEFINENAME_,AMBIENT_OCCLUSION,_VARYINGNAME_,AmbientOcclusion,_MATRIXNAME_,ambientOcclusion,_INFONAME_,AmbientOcclusionInfos.x)
#include <samplerVertexImplementation>(_DEFINENAME_,DECAL,_VARYINGNAME_,Decal,_MATRIXNAME_,decal,_INFONAME_,DecalInfos.x)
#include <samplerVertexImplementation>(_DEFINENAME_,DETAIL,_VARYINGNAME_,Detail,_MATRIXNAME_,detail,_INFONAME_,DetailInfos.x)
#include<openpbrNormalMapVertex>
#include<clipPlaneVertex>
#include<fogVertex>
#include<shadowsVertex>[0..maxSimultaneousLights]
#include<vertexColorMixing>
#if defined(POINTSIZE) && !defined(WEBGPU)
gl_PointSize=pointSize;
#endif
#include<logDepthVertex>
#define CUSTOM_VERTEX_MAIN_END
}
`;t.ShaderStore.ShadersStore[l]||(t.ShaderStore.ShadersStore[l]=f),e.s(["openpbrVertexShader",0,{name:l,shader:f}],529413)},459435,e=>{"use strict";var t=e.i(196548),r=e.i(916624),i=e.i(440163),a=e.i(202286),o=e.i(774685),n=e.i(763946);class s extends t.FlowGraphCachedOperationBlock{constructor(e,t,i){super(t,i);for(let t=0;t<e;t++)this.registerDataInput(`input_${t}`,r.RichTypeNumber,0)}}class l extends i.FlowGraphBlock{constructor(e,t,i){super(i),this.registerDataInput("input",t);for(let t=0;t<e;t++)this.registerDataOutput(`output_${t}`,r.RichTypeNumber,0)}}class f extends s{constructor(e){super(2,r.RichTypeVector2,e)}_doOperation(e){e._hasExecutionVariable(this,"cachedVector")||e._setExecutionVariable(this,"cachedVector",new a.Vector2);let t=e._getExecutionVariable(this,"cachedVector",null);return t.set(this.getDataInput("input_0").getValue(e),this.getDataInput("input_1").getValue(e)),t}getClassName(){return"FlowGraphCombineVector2Block"}}(0,o.RegisterClass)("FlowGraphCombineVector2Block",f);class c extends s{constructor(e){super(3,r.RichTypeVector3,e)}_doOperation(e){e._hasExecutionVariable(this,"cachedVector")||e._setExecutionVariable(this,"cachedVector",new a.Vector3);let t=e._getExecutionVariable(this,"cachedVector",null);return t.set(this.getDataInput("input_0").getValue(e),this.getDataInput("input_1").getValue(e),this.getDataInput("input_2").getValue(e)),t}getClassName(){return"FlowGraphCombineVector3Block"}}(0,o.RegisterClass)("FlowGraphCombineVector3Block",c);class d extends s{constructor(e){super(4,r.RichTypeVector4,e)}_doOperation(e){e._hasExecutionVariable(this,"cachedVector")||e._setExecutionVariable(this,"cachedVector",new a.Vector4);let t=e._getExecutionVariable(this,"cachedVector",null);return t.set(this.getDataInput("input_0").getValue(e),this.getDataInput("input_1").getValue(e),this.getDataInput("input_2").getValue(e),this.getDataInput("input_3").getValue(e)),t}getClassName(){return"FlowGraphCombineVector4Block"}}(0,o.RegisterClass)("FlowGraphCombineVector4Block",d);class u extends s{constructor(e){super(16,r.RichTypeMatrix,e)}_doOperation(e){e._hasExecutionVariable(this,"cachedMatrix")||e._setExecutionVariable(this,"cachedMatrix",new a.Matrix);let t=e._getExecutionVariable(this,"cachedMatrix",null);return this.config?.inputIsColumnMajor?t.set(this.getDataInput("input_0").getValue(e),this.getDataInput("input_4").getValue(e),this.getDataInput("input_8").getValue(e),this.getDataInput("input_12").getValue(e),this.getDataInput("input_1").getValue(e),this.getDataInput("input_5").getValue(e),this.getDataInput("input_9").getValue(e),this.getDataInput("input_13").getValue(e),this.getDataInput("input_2").getValue(e),this.getDataInput("input_6").getValue(e),this.getDataInput("input_10").getValue(e),this.getDataInput("input_14").getValue(e),this.getDataInput("input_3").getValue(e),this.getDataInput("input_7").getValue(e),this.getDataInput("input_11").getValue(e),this.getDataInput("input_15").getValue(e)):t.set(this.getDataInput("input_0").getValue(e),this.getDataInput("input_1").getValue(e),this.getDataInput("input_2").getValue(e),this.getDataInput("input_3").getValue(e),this.getDataInput("input_4").getValue(e),this.getDataInput("input_5").getValue(e),this.getDataInput("input_6").getValue(e),this.getDataInput("input_7").getValue(e),this.getDataInput("input_8").getValue(e),this.getDataInput("input_9").getValue(e),this.getDataInput("input_10").getValue(e),this.getDataInput("input_11").getValue(e),this.getDataInput("input_12").getValue(e),this.getDataInput("input_13").getValue(e),this.getDataInput("input_14").getValue(e),this.getDataInput("input_15").getValue(e)),t}getClassName(){return"FlowGraphCombineMatrixBlock"}}(0,o.RegisterClass)("FlowGraphCombineMatrixBlock",u);class m extends s{constructor(e){super(4,r.RichTypeMatrix2D,e)}_doOperation(e){e._hasExecutionVariable(this,"cachedMatrix")||e._setExecutionVariable(this,"cachedMatrix",new n.FlowGraphMatrix2D);let t=e._getExecutionVariable(this,"cachedMatrix",null),r=this.config?.inputIsColumnMajor?[this.getDataInput("input_0").getValue(e),this.getDataInput("input_2").getValue(e),this.getDataInput("input_1").getValue(e),this.getDataInput("input_3").getValue(e)]:[this.getDataInput("input_0").getValue(e),this.getDataInput("input_1").getValue(e),this.getDataInput("input_2").getValue(e),this.getDataInput("input_3").getValue(e)];return t.fromArray(r),t}getClassName(){return"FlowGraphCombineMatrix2DBlock"}}(0,o.RegisterClass)("FlowGraphCombineMatrix2DBlock",m);class p extends s{constructor(e){super(9,r.RichTypeMatrix3D,e)}_doOperation(e){e._hasExecutionVariable(this,"cachedMatrix")||e._setExecutionVariable(this,"cachedMatrix",new n.FlowGraphMatrix3D);let t=e._getExecutionVariable(this,"cachedMatrix",null),r=this.config?.inputIsColumnMajor?[this.getDataInput("input_0").getValue(e),this.getDataInput("input_3").getValue(e),this.getDataInput("input_6").getValue(e),this.getDataInput("input_1").getValue(e),this.getDataInput("input_4").getValue(e),this.getDataInput("input_7").getValue(e),this.getDataInput("input_2").getValue(e),this.getDataInput("input_5").getValue(e),this.getDataInput("input_8").getValue(e)]:[this.getDataInput("input_0").getValue(e),this.getDataInput("input_1").getValue(e),this.getDataInput("input_2").getValue(e),this.getDataInput("input_3").getValue(e),this.getDataInput("input_4").getValue(e),this.getDataInput("input_5").getValue(e),this.getDataInput("input_6").getValue(e),this.getDataInput("input_7").getValue(e),this.getDataInput("input_8").getValue(e)];return t.fromArray(r),t}getClassName(){return"FlowGraphCombineMatrix3DBlock"}}(0,o.RegisterClass)("FlowGraphCombineMatrix3DBlock",p);class v extends l{constructor(e){super(2,r.RichTypeVector2,e)}_updateOutputs(e){let t=this.getDataInput("input")?.getValue(e);t||(t=a.Vector2.Zero(),this.getDataInput("input").setValue(t,e)),this.getDataOutput("output_0").setValue(t.x,e),this.getDataOutput("output_1").setValue(t.y,e)}getClassName(){return"FlowGraphExtractVector2Block"}}(0,o.RegisterClass)("FlowGraphExtractVector2Block",v);class S extends l{constructor(e){super(3,r.RichTypeVector3,e)}_updateOutputs(e){let t=this.getDataInput("input")?.getValue(e);t||(t=a.Vector3.Zero(),this.getDataInput("input").setValue(t,e)),this.getDataOutput("output_0").setValue(t.x,e),this.getDataOutput("output_1").setValue(t.y,e),this.getDataOutput("output_2").setValue(t.z,e)}getClassName(){return"FlowGraphExtractVector3Block"}}(0,o.RegisterClass)("FlowGraphExtractVector3Block",S);class h extends l{constructor(e){super(4,r.RichTypeVector4,e)}_updateOutputs(e){let t=this.getDataInput("input")?.getValue(e);t||(t=a.Vector4.Zero(),this.getDataInput("input").setValue(t,e)),this.getDataOutput("output_0").setValue(t.x,e),this.getDataOutput("output_1").setValue(t.y,e),this.getDataOutput("output_2").setValue(t.z,e),this.getDataOutput("output_3").setValue(t.w,e)}getClassName(){return"FlowGraphExtractVector4Block"}}(0,o.RegisterClass)("FlowGraphExtractVector4Block",h);class x extends l{constructor(e){super(16,r.RichTypeMatrix,e)}_updateOutputs(e){let t=this.getDataInput("input")?.getValue(e);t||(t=a.Matrix.Identity(),this.getDataInput("input").setValue(t,e));for(let r=0;r<16;r++)this.getDataOutput(`output_${r}`).setValue(t.m[r],e)}getClassName(){return"FlowGraphExtractMatrixBlock"}}(0,o.RegisterClass)("FlowGraphExtractMatrixBlock",x);class g extends l{constructor(e){super(4,r.RichTypeMatrix2D,e)}_updateOutputs(e){let t=this.getDataInput("input")?.getValue(e);t||(t=new n.FlowGraphMatrix2D,this.getDataInput("input").setValue(t,e));for(let r=0;r<4;r++)this.getDataOutput(`output_${r}`).setValue(t.m[r],e)}getClassName(){return"FlowGraphExtractMatrix2DBlock"}}(0,o.RegisterClass)("FlowGraphExtractMatrix2DBlock",g);class E extends l{constructor(e){super(9,r.RichTypeMatrix3D,e)}_updateOutputs(e){let t=this.getDataInput("input")?.getValue(e);t||(t=new n.FlowGraphMatrix3D,this.getDataInput("input").setValue(t,e));for(let r=0;r<9;r++)this.getDataOutput(`output_${r}`).setValue(t.m[r],e)}getClassName(){return"FlowGraphExtractMatrix3DBlock"}}(0,o.RegisterClass)("FlowGraphExtractMatrix3DBlock",E),e.s(["FlowGraphCombineMatrix2DBlock",0,m,"FlowGraphCombineMatrix3DBlock",0,p,"FlowGraphCombineMatrixBlock",0,u,"FlowGraphCombineVector2Block",0,f,"FlowGraphCombineVector3Block",0,c,"FlowGraphCombineVector4Block",0,d,"FlowGraphExtractMatrix2DBlock",0,g,"FlowGraphExtractMatrix3DBlock",0,E,"FlowGraphExtractMatrixBlock",0,x,"FlowGraphExtractVector2Block",0,v,"FlowGraphExtractVector3Block",0,S,"FlowGraphExtractVector4Block",0,h])},512133,961583,870024,e=>{"use strict";var t=e.i(202286);class r{static ConvertPanoramaToCubemap(e,t,r,i,a=!1,o=!0){let n;if(!e)throw"ConvertPanoramaToCubemap: input cannot be null";if(e.length!=t*r*3)if(e.length!=t*r*4)throw"ConvertPanoramaToCubemap: input size is wrong";else n=4;else n=3;return{front:this.CreateCubemapTexture(i,this.FACE_FRONT,e,t,r,a,o,n),back:this.CreateCubemapTexture(i,this.FACE_BACK,e,t,r,a,o,n),left:this.CreateCubemapTexture(i,this.FACE_LEFT,e,t,r,a,o,n),right:this.CreateCubemapTexture(i,this.FACE_RIGHT,e,t,r,a,o,n),up:this.CreateCubemapTexture(i,this.FACE_UP,e,t,r,a,o,n),down:this.CreateCubemapTexture(i,this.FACE_DOWN,e,t,r,a,o,n),size:i,type:1,format:4,gammaSpace:!1}}static CreateCubemapTexture(e,t,r,i,a,o,n,s){let l=new Float32Array(new ArrayBuffer(e*e*12)),f=o?Math.max(1,Math.round(i/4/e)):1,c=1/f,d=c*c,u=t[1].subtract(t[0]).scale(c/e),m=t[3].subtract(t[2]).scale(c/e),p=1/e,v=0;for(let o=0;o<e;o++)for(let S=0;S<f;S++){let S=t[0],h=t[2];for(let t=0;t<e;t++)for(let c=0;c<f;c++){let f=h.subtract(S).scale(v).add(S);f.normalize();let c=this.CalcProjectionSpherical(f,r,i,a,s,n);l[o*e*3+3*t+0]+=c.r*d,l[o*e*3+3*t+1]+=c.g*d,l[o*e*3+3*t+2]+=c.b*d,S=S.add(u),h=h.add(m)}v+=p*c}return l}static CalcProjectionSpherical(e,t,r,i,a,o){let n=Math.atan2(e.z,e.x),s=Math.acos(e.y);for(;n<-Math.PI;)n+=2*Math.PI;for(;n>Math.PI;)n-=2*Math.PI;let l=n/Math.PI,f=s/Math.PI,c=Math.round((l=.5*l+.5)*r);c<0?c=0:c>=r&&(c=r-1);let d=Math.round(f*i);d<0?d=0:d>=i&&(d=i-1);let u=o?i-d-1:d;return{r:t[u*r*a+c*a+0],g:t[u*r*a+c*a+1],b:t[u*r*a+c*a+2]}}}function i(e,t,r,i,a,o){if(a>0){var n;a=(n=a-136)>1023?898846567431158e293*Math.pow(2,n-1023):n<-1074?5e-324*Math.pow(2,n+1074):+Math.pow(2,n),e[o+0]=t*a,e[o+1]=r*a,e[o+2]=i*a}else e[o+0]=0,e[o+1]=0,e[o+2]=0}function a(e,t){let r,i="";for(let a=t;a<e.length-t&&"\n"!=(r=String.fromCharCode(e[a]));a++)i+=r;return i}function o(e){let t=a(e,0);if("#"!=t[0]||"?"!=t[1])throw"Bad HDR Format.";let r=!1,i=!1,o=0;do o+=t.length+1,"FORMAT=32-bit_rle_rgbe"==(t=a(e,o))?i=!0:0==t.length&&(r=!0);while(!r)if(!i)throw"HDR Bad header format, unsupported FORMAT";o+=t.length+1,t=a(e,o);let n=/^-Y (.*) \+X (.*)$/g.exec(t);if(!n||n.length<3)throw"HDR Bad header format, no size";let s=parseInt(n[2]),l=parseInt(n[1]);if(s<8||s>32767)throw"HDR Bad header format, unsupported size";return{height:l,width:s,dataPosition:o+=t.length+1}}function n(e,t){return function(e,t){let r,a,o,n,s,l,f,c,d=t.height,u=t.width,m=t.dataPosition,p=new Uint8Array(new ArrayBuffer(4*u)),v=new Float32Array(new ArrayBuffer(t.width*t.height*12));for(;d>0;){if(r=e[m++],a=e[m++],o=e[m++],n=e[m++],2!=r||2!=a||128&o||t.width<8||t.width>32767)return function(e,t){let r,a,o,n=t.height,s=t.width,l=t.dataPosition,f=new Float32Array(new ArrayBuffer(t.width*t.height*12));for(;n>0;){for(o=0;o<t.width;o++)r=e[l++],a=e[l++],i(f,r,a,e[l++],e[l++],(t.height-n)*s*3+3*o);n--}return f}(e,t);if((o<<8|n)!=u)throw"HDR Bad header format, wrong scan line width";for(c=0,l=0;c<4;c++)for(f=(c+1)*u;l<f;)if(r=e[m++],a=e[m++],r>128){if(0==(s=r-128)||s>f-l)throw"HDR Bad Format, bad scanline data (run)";for(;s-- >0;)p[l++]=a}else{if(0==(s=r)||s>f-l)throw"HDR Bad Format, bad scanline data (non-run)";if(p[l++]=a,--s>0)for(let t=0;t<s;t++)p[l++]=e[m++]}for(c=0;c<u;c++)r=p[c],a=p[c+u],i(v,r,a,o=p[c+2*u],n=p[c+3*u],(t.height-d)*u*3+3*c);d--}return v}(e,t)}r.FACE_LEFT=[new t.Vector3(-1,-1,-1),new t.Vector3(1,-1,-1),new t.Vector3(-1,1,-1),new t.Vector3(1,1,-1)],r.FACE_RIGHT=[new t.Vector3(1,-1,1),new t.Vector3(-1,-1,1),new t.Vector3(1,1,1),new t.Vector3(-1,1,1)],r.FACE_FRONT=[new t.Vector3(1,-1,-1),new t.Vector3(1,-1,1),new t.Vector3(1,1,-1),new t.Vector3(1,1,1)],r.FACE_BACK=[new t.Vector3(-1,-1,1),new t.Vector3(-1,-1,-1),new t.Vector3(-1,1,1),new t.Vector3(-1,1,-1)],r.FACE_DOWN=[new t.Vector3(1,1,-1),new t.Vector3(1,1,1),new t.Vector3(-1,1,-1),new t.Vector3(-1,1,1)],r.FACE_UP=[new t.Vector3(-1,-1,-1),new t.Vector3(-1,-1,1),new t.Vector3(1,-1,-1),new t.Vector3(1,-1,1)],e.s(["PanoramaToCubeMapTools",0,r],961583),e.s(["GetCubeMapTextureData",0,function(e,t,i=!1){let a=new Uint8Array(e),s=o(a),l=n(a,s);return r.ConvertPanoramaToCubemap(l,s.width,s.height,t,i)},"RGBE_ReadHeader",0,o,"RGBE_ReadPixels",0,n],870024),e.s(["_HDRTextureLoader",0,class{constructor(){this.supportCascades=!1}loadCubeData(){throw".hdr not supported in Cube."}loadData(e,t,r){let i=new Uint8Array(e.buffer,e.byteOffset,e.byteLength),a=o(i),s=n(i,a),l=a.width*a.height,f=new Float32Array(4*l);for(let e=0;e<l;e+=1)f[4*e]=s[3*e],f[4*e+1]=s[3*e+1],f[4*e+2]=s[3*e+2],f[4*e+3]=1;r(a.width,a.height,t.generateMipMaps,!1,()=>{let e=t.getEngine();t.type=1,t.format=5,t._gammaSpace=!1,e._uploadDataToTextureDirectly(t,f)})}}],512133)},186207,e=>{"use strict";var t=e.i(263537);let r="mrtFragmentDeclaration",i=`#if defined(WEBGL2) || defined(WEBGPU) || defined(NATIVE)
layout(location=0) out vec4 glFragData[{X}];
#endif
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.s([])},912894,e=>{"use strict";var t=e.i(263537);let r="sceneFragmentDeclaration",i=`uniform mat4 viewProjection;
#ifdef MULTIVIEW
uniform mat4 viewProjectionR;
#endif
uniform mat4 view;uniform mat4 projection;uniform vec4 vEyePosition;uniform mat4 inverseProjection;
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.s([])},533790,80054,e=>{"use strict";var t=e.i(263537);let r="pbrFragmentReflectionDeclaration",i=`#ifdef REFLECTION
#ifdef REFLECTIONMAP_3D
#define sampleReflection(s,c) textureCube(s,c)
uniform samplerCube reflectionSampler;
#ifdef LODBASEDMICROSFURACE
#define sampleReflectionLod(s,c,l) textureCubeLodEXT(s,c,l)
#else
uniform samplerCube reflectionSamplerLow;uniform samplerCube reflectionSamplerHigh;
#endif
#ifdef USEIRRADIANCEMAP
uniform samplerCube irradianceSampler;
#endif
#else
#define sampleReflection(s,c) texture2D(s,c)
uniform sampler2D reflectionSampler;
#ifdef LODBASEDMICROSFURACE
#define sampleReflectionLod(s,c,l) texture2DLodEXT(s,c,l)
#else
uniform sampler2D reflectionSamplerLow;uniform sampler2D reflectionSamplerHigh;
#endif
#ifdef USEIRRADIANCEMAP
uniform sampler2D irradianceSampler;
#endif
#endif
#ifdef REFLECTIONMAP_SKYBOX
varying vec3 vPositionUVW;
#else
#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)
varying vec3 vDirectionW;
#endif
#endif
#endif
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.s([],533790);let a="pbrIBLFunctions",o=`#if defined(REFLECTION) || defined(SS_REFRACTION)
float getLodFromAlphaG(float cubeMapDimensionPixels,float microsurfaceAverageSlope) {float microsurfaceAverageSlopeTexels=cubeMapDimensionPixels*microsurfaceAverageSlope;float lod=log2(microsurfaceAverageSlopeTexels);return lod;}
float getLinearLodFromRoughness(float cubeMapDimensionPixels,float roughness) {float lod=log2(cubeMapDimensionPixels)*roughness;return lod;}
#endif
#if defined(ENVIRONMENTBRDF) && defined(RADIANCEOCCLUSION)
float environmentRadianceOcclusion(float ambientOcclusion,float NdotVUnclamped) {float temp=NdotVUnclamped+ambientOcclusion;return saturate(square(temp)-1.0+ambientOcclusion);}
#endif
#if defined(ENVIRONMENTBRDF) && defined(HORIZONOCCLUSION)
float environmentHorizonOcclusion(vec3 view,vec3 normal,vec3 geometricNormal) {vec3 reflection=reflect(view,normal);float temp=saturate(1.0+1.1*dot(reflection,geometricNormal));return square(temp);}
#endif
#if defined(LODINREFLECTIONALPHA) || defined(SS_LODINREFRACTIONALPHA)
#define UNPACK_LOD(x) (1.0-x)*255.0
float getLodFromAlphaG(float cubeMapDimensionPixels,float alphaG,float NdotV) {float microsurfaceAverageSlope=alphaG;microsurfaceAverageSlope*=sqrt(abs(NdotV));return getLodFromAlphaG(cubeMapDimensionPixels,microsurfaceAverageSlope);}
#endif
`;t.ShaderStore.IncludesShadersStore[a]||(t.ShaderStore.IncludesShadersStore[a]=o),e.s([],80054)},950967,e=>{"use strict";var t=e.i(263537);e.i(261937),e.i(186207),e.i(120238),e.i(376170),e.i(201632),e.i(533790),e.i(912894),e.i(629238),e.i(424192),e.i(317336),e.i(80054),e.i(534236),e.i(348290),e.i(250464),e.i(959117),e.i(141687),e.i(48973),e.i(15722),e.i(442443);let r="geometryPixelShader",i=`#extension GL_EXT_draw_buffers : require
#if defined(BUMP) || !defined(NORMAL)
#extension GL_OES_standard_derivatives : enable
#endif
precision highp float;
#ifdef BUMP
varying mat4 vWorldView;varying vec3 vNormalW;
#else
varying vec3 vNormalV;
#endif
varying vec4 vViewPos;
#if defined(POSITION) || defined(BUMP) || defined(IRRADIANCE)
varying vec3 vPositionW;
#endif
#if defined(VELOCITY) || defined(VELOCITY_LINEAR)
varying vec4 vCurrentPosition;varying vec4 vPreviousPosition;
#endif
#ifdef NEED_UV
varying vec2 vUV;
#endif
#ifdef BUMP
uniform vec3 vBumpInfos;uniform vec2 vTangentSpaceParams;
#endif
#if defined(REFLECTIVITY)
#if defined(ORMTEXTURE) || defined(SPECULARGLOSSINESSTEXTURE) || defined(REFLECTIVITYTEXTURE)
uniform sampler2D reflectivitySampler;varying vec2 vReflectivityUV;
#else
#ifdef METALLIC_TEXTURE
uniform sampler2D metallicSampler;varying vec2 vMetallicUV;
#endif
#ifdef ROUGHNESS_TEXTURE
uniform sampler2D roughnessSampler;varying vec2 vRoughnessUV;
#endif
#endif
#ifdef ALBEDOTEXTURE
varying vec2 vAlbedoUV;uniform sampler2D albedoSampler;
#endif
#ifdef REFLECTIVITYCOLOR
uniform vec3 reflectivityColor;
#endif
#ifdef ALBEDOCOLOR
uniform vec3 albedoColor;
#endif
#ifdef METALLIC
uniform float metallic;
#endif
#if defined(ROUGHNESS) || defined(GLOSSINESS)
uniform float glossiness;
#endif
#endif
#if defined(ALPHATEST) && defined(NEED_UV)
uniform sampler2D diffuseSampler;
#endif
#include<clipPlaneFragmentDeclaration>
#include<mrtFragmentDeclaration>[SCENE_MRT_COUNT]
#include<bumpFragmentMainFunctions>
#include<bumpFragmentFunctions>
#include<helperFunctions>
#ifdef IRRADIANCE
#include<pbrFragmentReflectionDeclaration>
#ifdef REFLECTION
#ifdef USEIRRADIANCEMAP
#include<__decl__sceneFragment>
uniform mat4 reflectionMatrix;uniform vec2 vReflectionInfos;uniform vec3 vReflectionDominantDirection;
#include<pbrBRDFFunctions>
#include<openpbrDielectricReflectance>
#include<pbrIBLFunctions>
#include<reflectionFunction>
#include<openpbrGeometryInfo>
#include<openpbrIblFunctions>
#elif defined(USESPHERICALFROMREFLECTIONMAP)
varying vec3 vEnvironmentIrradiance;
#endif
#ifdef IBL_SHADOW_TEXTURE
uniform sampler2D iblShadowSampler;uniform vec2 shadowTextureSize;
#endif
#ifdef IRRADIANCE_SCATTER_MASK
uniform float vSubsurfaceWeight;
#include<samplerFragmentDeclaration>(_DEFINENAME_,SUBSURFACE_WEIGHT,_VARYINGNAME_,SubsurfaceWeight,_SAMPLERNAME_,subsurfaceWeight)
uniform float vSubsurfaceScatterAnisotropy;uniform float vTransmissionWeight;
#include<samplerFragmentDeclaration>(_DEFINENAME_,TRANSMISSION_WEIGHT,_VARYINGNAME_,TransmissionWeight,_SAMPLERNAME_,transmissionWeight)
uniform float vTransmissionScatterAnisotropy;
#endif
#endif
#endif
void main() {
#include<clipPlaneFragment>
#ifdef ALPHATEST
if (texture2D(diffuseSampler,vUV).a<0.4)
discard;
#endif
vec3 normalOutput;
#ifdef BUMP
vec3 normalW=normalize(vNormalW);
#include<bumpFragment>
#ifdef NORMAL_WORLDSPACE
normalOutput=normalW;
#else
normalOutput=normalize(vec3(vWorldView*vec4(normalW,0.0)));
#endif
#elif defined(HAS_NORMAL_ATTRIBUTE)
normalOutput=normalize(vNormalV);
#elif defined(POSITION)
normalOutput=normalize(-cross(dFdx(vPositionW),dFdy(vPositionW)));
#endif
#ifdef ENCODE_NORMAL
normalOutput=normalOutput*0.5+0.5;
#endif
#ifdef DEPTH
gl_FragData[DEPTH_INDEX]=vec4(vViewPos.z/vViewPos.w,0.0,0.0,1.0);
#endif
#ifdef NORMAL
gl_FragData[NORMAL_INDEX]=vec4(normalOutput,1.0);
#endif
#ifdef SCREENSPACE_DEPTH
gl_FragData[SCREENSPACE_DEPTH_INDEX]=vec4(gl_FragCoord.z,0.0,0.0,1.0);
#endif
#ifdef POSITION
gl_FragData[POSITION_INDEX]=vec4(vPositionW,1.0);
#endif
#ifdef VELOCITY
vec2 a=(vCurrentPosition.xy/vCurrentPosition.w)*0.5+0.5;vec2 b=(vPreviousPosition.xy/vPreviousPosition.w)*0.5+0.5;vec2 velocity=abs(a-b);velocity=vec2(pow(velocity.x,1.0/3.0),pow(velocity.y,1.0/3.0))*sign(a-b)*0.5+0.5;gl_FragData[VELOCITY_INDEX]=vec4(velocity,0.0,1.0);
#endif
#ifdef VELOCITY_LINEAR
vec2 velocity=vec2(0.5)*((vPreviousPosition.xy/vPreviousPosition.w) -
(vCurrentPosition.xy/vCurrentPosition.w));gl_FragData[VELOCITY_LINEAR_INDEX]=vec4(velocity,0.0,1.0);
#endif
#ifdef REFLECTIVITY
vec4 reflectivity=vec4(0.0,0.0,0.0,1.0);
#ifdef METALLICWORKFLOW
float metal=1.0;float roughness=1.0;
#ifdef ORMTEXTURE
metal*=texture2D(reflectivitySampler,vReflectivityUV).b;roughness*=texture2D(reflectivitySampler,vReflectivityUV).g;
#else
#ifdef METALLIC_TEXTURE
metal*=texture2D(metallicSampler,vMetallicUV).r;
#endif
#ifdef ROUGHNESS_TEXTURE
roughness*=texture2D(roughnessSampler,vRoughnessUV).r;
#endif
#endif
#ifdef METALLIC
metal*=metallic;
#endif
#ifdef ROUGHNESS
roughness*=(1.0-glossiness); 
#endif
reflectivity.a-=roughness;vec3 color=vec3(1.0);
#ifdef ALBEDOTEXTURE
color=texture2D(albedoSampler,vAlbedoUV).rgb;
#ifdef GAMMAALBEDO
color=toLinearSpace(color);
#endif
#endif
#ifdef ALBEDOCOLOR
color*=albedoColor.xyz;
#endif
reflectivity.rgb=mix(vec3(0.04),color,metal);
#else
#if defined(SPECULARGLOSSINESSTEXTURE) || defined(REFLECTIVITYTEXTURE)
reflectivity=texture2D(reflectivitySampler,vReflectivityUV);
#ifdef GAMMAREFLECTIVITYTEXTURE
reflectivity.rgb=toLinearSpace(reflectivity.rgb);
#endif
#else 
#ifdef REFLECTIVITYCOLOR
reflectivity.rgb=toLinearSpace(reflectivityColor.xyz);reflectivity.a=1.0;
#endif
#endif
#ifdef GLOSSINESSS
reflectivity.a*=glossiness; 
#endif
#endif
gl_FragData[REFLECTIVITY_INDEX]=reflectivity;
#endif
#ifdef IRRADIANCE
vec3 irradiance=vec3(0.0);float irradiance_alpha=1.0;
#ifdef REFLECTION
#ifdef IRRADIANCE_SCATTER_MASK
vec3 vSubsurfaceColor=vec3(1.0);float vSubsurfaceRadius=0.0;vec3 vSubsurfaceRadiusScale=vec3(1.0);
#include<openpbrSubsurfaceLayerData>
float vTransmissionDepth=1.0;vec3 vTransmissionColor=vec3(1.0);vec3 vTransmissionScatter=vec3(0.0);float vTransmissionDispersionScale=0.0;float vTransmissionDispersionAbbeNumber=0.0;
#include<openpbrTransmissionLayerData>
#endif
#ifdef IBL_SHADOW_TEXTURE
#ifdef COLORED_IBL_SHADOWS
vec3 iblShadowValue=texture(iblShadowSampler,gl_FragCoord.xy/shadowTextureSize).rgb;
#else
vec3 iblShadowValue=vec3(texture(iblShadowSampler,gl_FragCoord.xy/shadowTextureSize).r);
#endif
#endif
#if defined(USEIRRADIANCEMAP)
#ifdef IRRADIANCE_SCATTER_MASK
float bendAmount=subsurface_weight*-min(subsurface_scatter_anisotropy,0.0);bendAmount=mix(bendAmount,-min(transmission_scatter_anisotropy,0.0),transmission_weight);vec3 viewVector=normalize(vEyePosition.xyz-vPositionW.xyz);vec3 bentNormal=mix(normalOutput,viewVector,bendAmount*dot(normalOutput,viewVector));
#else
vec3 bentNormal=normalOutput;
#endif
irradiance=sampleIrradiance(
bentNormal
#if defined(NORMAL) && defined(USESPHERICALINVERTEX)
,vEnvironmentIrradiance
#endif
#if (defined(USESPHERICALFROMREFLECTIONMAP) && (!defined(NORMAL) || !defined(USESPHERICALINVERTEX))) || (defined(USEIRRADIANCEMAP) && defined(REFLECTIONMAP_3D))
,reflectionMatrix
#endif
#ifdef USEIRRADIANCEMAP
,irradianceSampler
#ifdef USE_IRRADIANCE_DOMINANT_DIRECTION
,vReflectionDominantDirection
#endif
#endif
#ifdef REALTIME_FILTERING
,vReflectionFilteringInfo
#ifdef IBL_CDF_FILTERING
,icdfSampler
#endif
#endif
,vReflectionInfos
,vViewPos.xyz
,1.0
,vec3(1.0)
);
#elif defined(USESPHERICALFROMREFLECTIONMAP)
irradiance=vEnvironmentIrradiance;
#endif
#ifdef IBL_SHADOW_TEXTURE
irradiance*=iblShadowValue;
#endif
#ifndef BUMP
vec2 uvOffset=vec2(0.0);
#endif
#ifdef IRRADIANCE_SCATTER_MASK
irradiance_alpha=min(subsurface_weight+transmission_weight,1.0);
#endif
#endif
gl_FragData[IRRADIANCE_INDEX]=vec4(irradiance,irradiance_alpha);
#endif
}
`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["geometryPixelShader",0,{name:r,shader:i}])},727515,735425,e=>{"use strict";var t=e.i(700183),r=e.i(900280),i=e.i(978377);class a extends i.AbstractSound{constructor(e,t,r){super(e,t,r),this._preloadedInstances=[]}get preloadCount(){return this._options.preloadCount??1}get preloadCompletedCount(){return this._preloadedInstances.length}preloadInstanceAsync(){let e=this._createInstance();return this._addPreloadedInstance(e),e.preloadedPromise}async preloadInstancesAsync(e){for(let t=0;t<e;t++)this.preloadInstanceAsync();await Promise.all(this._preloadedInstances.map(async e=>await e.preloadedPromise))}play(e={}){let t;if(5===this.state)return void this.resume();this.preloadCompletedCount>0?((t=this._preloadedInstances[0]).startOffset=this.startOffset,this._removePreloadedInstance(t)):t=this._createInstance();let r=()=>{3===t.state&&(this._stopExcessInstances(),t.onStateChangedObservable.removeCallback(r))};t.onStateChangedObservable.add(r),e.startOffset??(e.startOffset=this.startOffset),e.loop??(e.loop=this.loop),e.volume??(e.volume=1),this._beforePlay(t),t.play(e),this._afterPlay(t)}stop(){if(this._setState(1),this._instances)for(let e of Array.from(this._instances))e.stop()}_addPreloadedInstance(e){this._preloadedInstances.includes(e)||this._preloadedInstances.push(e)}_removePreloadedInstance(e){let t=this._preloadedInstances.indexOf(e);-1!==t&&this._preloadedInstances.splice(t,1)}}e.s(["StreamingSound",0,a],735425);var o=e.i(814624),n=e.i(823110);class s extends n._AbstractSoundInstance{constructor(e){super(e),this.onReadyObservable=new o.Observable,this.preloadedPromise=new Promise((e,t)=>{this._rejectPreloadedPromise=t,this._resolvePreloadedPromise=e}),this.onErrorObservable.add(this._rejectPreloadedPromise),this.onReadyObservable.add(this._resolvePreloadedPromise)}set startOffset(e){this._options.startOffset=e}dispose(){super.dispose(),this.onErrorObservable.clear(),this.onReadyObservable.clear(),this._resolvePreloadedPromise()}}var l=e.i(611436),f=e.i(238463),c=e.i(912792),d=e.i(861196),u=e.i(411702),m=e.i(305836);class p extends a{constructor(e,t,r){super(e,t,r),this._stereo=null,this._options={autoplay:r.autoplay??!1,loop:r.loop??!1,maxInstances:r.maxInstances??1/0,preloadCount:r.preloadCount??1,startOffset:r.startOffset??0},this._subGraph=new p._SubGraph(this)}async _initAsync(e,t){let r=this.engine._audioContext;if(!(r instanceof AudioContext))throw Error("Unsupported audio context type.");this._audioContext=r,this._source=e,t.outBus?this.outBus=t.outBus:!1!==t.outBusAutoDefault&&(await this.engine.isReadyPromise,this.outBus=this.engine.defaultMainBus),await this._subGraph.initAsync(t),(0,l._HasSpatialAudioOptions)(t)&&this._initSpatialProperty(),this.preloadCount&&await this.preloadInstancesAsync(this.preloadCount),t.autoplay&&this.play(t),this.engine._addSound(this)}get _inNode(){return this._subGraph._inNode}get _outNode(){return this._subGraph._outNode}get stereo(){return this._stereo??(this._stereo=new f._StereoAudio(this._subGraph))}dispose(){super.dispose(),this._stereo=null,this._subGraph.dispose(),this.engine._removeSound(this)}getClassName(){return"_WebAudioStreamingSound"}_createInstance(){return new v(this,this._options)}_connect(e){return!!super._connect(e)&&(e._inNode&&this._outNode?.connect(e._inNode),!0)}_disconnect(e){return!!super._disconnect(e)&&(e._inNode&&this._outNode?.disconnect(e._inNode),!0)}_createSpatialProperty(e,t){return new m._SpatialWebAudio(this._subGraph,e,t)}_getOptions(){return this._options}}p._SubGraph=class extends u._WebAudioBusAndSoundSubGraph{get _downstreamNodes(){return this._owner._downstreamNodes??null}get _upstreamNodes(){return this._owner._upstreamNodes??null}};class v extends s{constructor(e,t){if(super(e),this._currentTimeChangedWhilePaused=!1,this._enginePlayTime=1/0,this._enginePauseTime=0,this._isReady=!1,this._isReadyPromise=new Promise((e,t)=>{this._resolveIsReadyPromise=e,this._rejectIsReadyPromise=t}),this._onCanPlayThrough=()=>{this._isReady=!0,this._resolveIsReadyPromise(this._mediaElement),this.onReadyObservable.notifyObservers(this)},this._onEnded=()=>{this._setState(1)},this._onError=e=>{this._setState(4),this.onErrorObservable.notifyObservers(e),this._rejectIsReadyPromise(e),this.dispose()},this._onEngineStateChanged=()=>{"running"===this.engine.state&&(this._options.loop&&2===this.state&&this.play(),this.engine.stateChangedObservable.removeCallback(this._onEngineStateChanged))},this._onUserGesture=()=>{this.play()},this._options=t,this._volumeNode=new GainNode(e._audioContext),"string"==typeof e._source)this._initFromUrl(e._source);else if(Array.isArray(e._source))this._initFromUrls(e._source);else if(e._source instanceof HTMLMediaElement)this._initFromMediaElement(e._source);else throw Error(`Invalid streaming sound source (${e._source}).`)}get currentTime(){if(1===this._state)return 0;let e=5===this._state?0:this.engine.currentTime-this._enginePlayTime;return this._enginePauseTime+e+this._options.startOffset}set currentTime(e){let t=2===this._state||3===this._state;t&&(this._mediaElement.pause(),this._state=1),this._options.startOffset=e,t?this.play({startOffset:e}):5===this._state&&(this._currentTimeChangedWhilePaused=!0)}get _outNode(){return this._volumeNode}get startTime(){return 1===this._state?0:this._enginePlayTime}dispose(){for(let e of(super.dispose(),this.stop(),this._sourceNode?.disconnect(this._volumeNode),this._sourceNode=null,this._mediaElement.removeEventListener("error",this._onError),this._mediaElement.removeEventListener("ended",this._onEnded),this._mediaElement.removeEventListener("canplaythrough",this._onCanPlayThrough),Array.from(this._mediaElement.children)))this._mediaElement.removeChild(e);this.engine.stateChangedObservable.removeCallback(this._onEngineStateChanged),this.engine.userGestureObservable.removeCallback(this._onUserGesture)}play(e={}){if(3===this._state)return;void 0!==e.loop&&(this._options.loop=e.loop),this._mediaElement.loop=this._options.loop;let t=e.startOffset;this._currentTimeChangedWhilePaused?(t=this._options.startOffset,this._currentTimeChangedWhilePaused=!1):5===this._state&&(t=this.currentTime),t&&t>0&&(this._mediaElement.currentTime=t),this._volumeNode.gain.value=e.volume??1,this._play()}pause(){(2===this._state||3===this._state)&&(this._setState(5),this._enginePauseTime+=this.engine.currentTime-this._enginePlayTime,this._mediaElement.pause())}resume(){5===this._state?this.play():this._currentTimeChangedWhilePaused&&this.play()}stop(){1!==this._state&&this._stop()}getClassName(){return"_WebAudioStreamingSoundInstance"}_connect(e){return!!super._connect(e)&&(e instanceof p&&e._inNode&&this._outNode?.connect(e._inNode),!0)}_disconnect(e){return!!super._disconnect(e)&&(e instanceof p&&e._inNode&&this._outNode?.disconnect(e._inNode),!0)}_initFromMediaElement(e){if(r.Tools.SetCorsBehavior(e.currentSrc,e),e.controls=!1,e.loop=this._options.loop,e.preload="auto",e.addEventListener("canplaythrough",this._onCanPlayThrough,{once:!0}),e.addEventListener("ended",this._onEnded,{once:!0}),e.addEventListener("error",this._onError,{once:!0}),e.load(),this._sourceNode=new MediaElementAudioSourceNode(this._sound._audioContext,{mediaElement:e}),this._sourceNode.connect(this._volumeNode),!this._connect(this._sound))throw Error("Connect failed");this._mediaElement=e}_initFromUrl(e){let t=new Audio(d.WebRequest.IsCustomRequestAvailable?(0,c._GetUrlForStreaming)((0,c._CleanUrl)(e)):(0,c._CleanUrl)(e));this._initFromMediaElement(t)}_initFromUrls(e){let t=new Audio;for(let r of e){let e=document.createElement("source");e.src=d.WebRequest.IsCustomRequestAvailable?(0,c._GetUrlForStreaming)((0,c._CleanUrl)(r)):(0,c._CleanUrl)(r),t.appendChild(e)}this._initFromMediaElement(t)}_play(){if(this._setState(2),!this._isReady)return void this._playWhenReady();if(2===this._state)if("running"===this.engine.state){let e=this._mediaElement.play();this._enginePlayTime=this.engine.currentTime,this._setState(3),e.catch(()=>{this._setState(4),this._options.loop&&this.engine.userGestureObservable.addOnce(this._onUserGesture)})}else this._options.loop?this.engine.stateChangedObservable.add(this._onEngineStateChanged):(this.stop(),this._setState(4))}_playWhenReady(){this._isReadyPromise.then(()=>{this._play()}).catch(()=>{t.Logger.Error("Streaming sound instance failed to play"),this._setState(4)})}_stop(){this._mediaElement.pause(),this._onEnded(),this.engine.stateChangedObservable.removeCallback(this._onEngineStateChanged)}}e.s(["_WebAudioStreamingSound",0,p],727515)},12799,e=>{"use strict";var t=e.i(263537);let r="screenSpaceRayTrace",i=`fn distanceSquared(a: vec2f,b: vec2f)->f32 { 
var temp=a-b; 
return dot(temp,temp); }
#ifdef SSRAYTRACE_SCREENSPACE_DEPTH
fn linearizeDepth(depth: f32,near: f32,far: f32)->f32 {
#ifdef SSRAYTRACE_RIGHT_HANDED_SCENE
return -(near*far)/(far-depth*(far-near));
#else
return (near*far)/(far-depth*(far-near));
#endif
}
#endif
/**
param csOrigin Camera-space ray origin,which must be 
within the view volume and must have z>0.01 and project within the valid screen rectangle
param csDirection Unit length camera-space ray direction
param projectToPixelMatrix A projection matrix that maps to **pixel** coordinates 
(**not** [-1,+1] normalized device coordinates).
param csZBuffer The camera-space Z buffer
param csZBufferSize Dimensions of csZBuffer
param csZThickness Camera space csZThickness to ascribe to each pixel in the depth buffer
param nearPlaneZ Positive number. Doesn't have to be THE actual near plane,just a reasonable value
for clipping rays headed towards the camera. Should be the actual near plane if screen-space depth is enabled.
param farPlaneZ The far plane for the camera. Used when screen-space depth is enabled.
param stride Step in horizontal or vertical pixels between samples. This is a var because: f32 integer math is slow on GPUs,but should be set to an integer>=1
param jitterFraction Number between 0 and 1 for how far to bump the ray in stride units
to conceal banding artifacts,plus the stride ray offset.
param maxSteps Maximum number of iterations. Higher gives better images but may be slow
param maxRayTraceDistance Maximum camera-space distance to trace before returning a miss
param selfCollisionNumSkip Number of steps to skip at start when raytracing to avar self: voidnull collisions.
1 is a reasonable value,depending on the scene you may need to set this value to 2
param hitPixel Pixel coordinates of the first intersection with the scene
param numIterations number of iterations performed
param csHitPovar Camera: i32 space location of the ray hit
*/
fn traceScreenSpaceRay1(
csOrigin: vec3f,
csDirection: vec3f,
projectToPixelMatrix: mat4x4f,
csZBuffer: texture_2d<f32>,
csZBufferSize: vec2f,
#ifdef SSRAYTRACE_USE_BACK_DEPTHBUFFER
csZBackBuffer: texture_2d<f32>,
csZBackSizeFactor: f32,
#endif
csZThickness: f32,
nearPlaneZ: f32,
farPlaneZ: f32,
stride: f32,
jitterFraction: f32,
maxSteps: f32,
maxRayTraceDistance: f32,
selfCollisionNumSkip: f32,
startPixel: ptr<function,vec2f>,
hitPixel: ptr<function,vec2f>,
csHitPoint: ptr<function,vec3f>,
numIterations: ptr<function,f32>
#ifdef SSRAYTRACE_DEBUG
,debugColor: ptr<function,vec3f>
#endif
)->bool
{
#ifdef SSRAYTRACE_RIGHT_HANDED_SCENE
var rayLength: f32=select(maxRayTraceDistance,(-nearPlaneZ-csOrigin.z)/csDirection.z,(csOrigin.z+csDirection.z*maxRayTraceDistance)>-nearPlaneZ);
#else
var rayLength: f32=select(maxRayTraceDistance,(nearPlaneZ-csOrigin.z)/csDirection.z,(csOrigin.z+csDirection.z*maxRayTraceDistance)<nearPlaneZ);
#endif
var csEndPoint: vec3f=csOrigin+csDirection*rayLength;*hitPixel= vec2f(-1.0,-1.0);var H0: vec4f=projectToPixelMatrix* vec4f(csOrigin,1.0);var H1: vec4f=projectToPixelMatrix* vec4f(csEndPoint,1.0);var k0: f32=1.0/H0.w;var k1: f32=1.0/H1.w;var Q0: vec3f=csOrigin*k0;var Q1: vec3f=csEndPoint*k1;var P0: vec2f=H0.xy*k0;var P1: vec2f=H1.xy*k1;
#ifdef SSRAYTRACE_CLIP_TO_FRUSTUM
var xMax: f32=csZBufferSize.x-0.5;var xMin=0.5;var yMax=csZBufferSize.y-0.5;var yMin=0.5;var alpha: f32=0.0;if ((P1.y>yMax) || (P1.y<yMin)) {alpha=(P1.y-select(yMin,yMax,(P1.y>yMax)))/(P1.y-P0.y);}
if ((P1.x>xMax) || (P1.x<xMin)) {alpha=max(alpha,(P1.x-select(xMin,xMax,(P1.x>xMax)))/(P1.x-P0.x));}
P1=mix(P1,P0,alpha); k1=mix(k1,k0,alpha); Q1=mix(Q1,Q0,alpha);
#endif
P1+= vec2f(select(0.0,0.01,distanceSquared(P0,P1)<0.0001));var delta: vec2f=P1-P0;var permute: bool=false;if (abs(delta.x)<abs(delta.y)) { 
permute=true;delta=delta.yx;P0=P0.yx;P1=P1.yx; }
var stepDirection: f32=sign(delta.x);var invdx: f32=stepDirection/delta.x;var dP: vec2f= vec2f(stepDirection,delta.y*invdx);var dQ: vec3f=(Q1-Q0)*invdx;var dk: f32=(k1-k0)*invdx;var zMin: f32=min(csEndPoint.z,csOrigin.z);var zMax: f32=max(csEndPoint.z,csOrigin.z);dP*=stride; dQ*=stride; dk*=stride;P0+=dP*jitterFraction; Q0+=dQ*jitterFraction; k0+=dk*jitterFraction;var pqk: vec4f= vec4f(P0,Q0.z,k0);var dPQK: vec4f= vec4f(dP,dQ.z,dk);*startPixel=select(P0.xy,P0.yx,permute);var prevZMaxEstimate: f32=csOrigin.z;var rayZMin: f32=prevZMaxEstimate;var rayZMax=prevZMaxEstimate;var sceneZMax: f32=rayZMax+1e4;var end: f32=P1.x*stepDirection;var hit: bool=false;var stepCount: f32;for (stepCount=0.0;(stepCount<=selfCollisionNumSkip) ||
((pqk.x*stepDirection)<=end &&
stepCount<maxSteps &&
!hit);pqk+=dPQK 
)
{*hitPixel=select(pqk.xy,pqk.yx,permute);
#ifndef SSRAYTRACE_CLIP_TO_FRUSTUM
if ((*hitPixel).x<0.0 || (*hitPixel).x>=csZBufferSize.x ||
(*hitPixel).y<0.0 || (*hitPixel).y>=csZBufferSize.y) { break; }
#endif
rayZMin=prevZMaxEstimate;rayZMax=(dPQK.z*0.5+pqk.z)/(dPQK.w*0.5+pqk.w);rayZMax=clamp(rayZMax,zMin,zMax);prevZMaxEstimate=rayZMax;
#ifdef SSRAYTRACE_RIGHT_HANDED_SCENE
if (prevZMaxEstimate<-farPlaneZ) { break; }
#else
if (prevZMaxEstimate>farPlaneZ) { break; }
#endif
if (rayZMin>rayZMax) { 
var t: f32=rayZMin; rayZMin=rayZMax; rayZMax=t;}
sceneZMax=textureLoad(csZBuffer,vec2<i32>(*hitPixel),0).r;
#ifdef SSRAYTRACE_SCREENSPACE_DEPTH
sceneZMax=linearizeDepth(sceneZMax,nearPlaneZ,farPlaneZ);
#endif
if (sceneZMax==0.0) { sceneZMax=1e8; }
#ifdef SSRAYTRACE_RIGHT_HANDED_SCENE
#ifdef SSRAYTRACE_USE_BACK_DEPTHBUFFER
var sceneBackZ: f32=textureLoad(csZBackBuffer,vec2<i32>(*hitPixel/csZBackSizeFactor),0).r;
#ifdef SSRAYTRACE_SCREENSPACE_DEPTH
sceneBackZ=linearizeDepth(sceneBackZ,nearPlaneZ,farPlaneZ);
#endif
if (sceneBackZ==0.0) { sceneBackZ=-1e8; }
hit=(rayZMax>=sceneBackZ-csZThickness) && (rayZMin<=sceneZMax);
#else
hit=(rayZMax>=sceneZMax-csZThickness) && (rayZMin<=sceneZMax);
#endif
#else
#ifdef SSRAYTRACE_USE_BACK_DEPTHBUFFER
var sceneBackZ: f32=textureLoad(csZBackBuffer,vec2<i32>(*hitPixel/csZBackSizeFactor),0).r;
#ifdef SSRAYTRACE_SCREENSPACE_DEPTH
sceneBackZ=linearizeDepth(sceneBackZ,nearPlaneZ,farPlaneZ);
#endif
if (sceneBackZ==0.0) { sceneBackZ=1e8; }
hit=(rayZMin<=sceneBackZ+csZThickness) && (rayZMax>=sceneZMax);
#else
hit=(rayZMin<=sceneZMax+csZThickness) && (rayZMax>=sceneZMax);
#endif
#endif
stepCount+=1.0;}
pqk-=dPQK;stepCount-=1.0;if (((pqk.x+dPQK.x)*stepDirection)>end || (stepCount+1.0)>=maxSteps) {hit=false;}
#ifdef SSRAYTRACE_ENABLE_REFINEMENT
if (stride>1.0 && hit) {pqk-=dPQK;stepCount-=1.0;var invStride: f32=1.0/stride;dPQK*=invStride;var refinementStepCount: f32=0.0;prevZMaxEstimate=pqk.z/pqk.w;rayZMax=prevZMaxEstimate;sceneZMax=rayZMax+1e7;for (;refinementStepCount<=1.0 ||
((refinementStepCount<=stride*1.4) &&
(rayZMax<sceneZMax));pqk+=dPQK)
{rayZMin=prevZMaxEstimate;rayZMax=(dPQK.z*0.5+pqk.z)/(dPQK.w*0.5+pqk.w);rayZMax=clamp(rayZMax,zMin,zMax);prevZMaxEstimate=rayZMax;rayZMax=max(rayZMax,rayZMin);*hitPixel=select(pqk.xy,pqk.yx,permute);sceneZMax=textureLoad(csZBuffer,vec2<i32>(*hitPixel),0).r;
#ifdef SSRAYTRACE_SCREENSPACE_DEPTH
sceneZMax=linearizeDepth(sceneZMax,nearPlaneZ,farPlaneZ);
#endif
if (sceneZMax==0.0) { sceneZMax=1e8; }
refinementStepCount+=1.0;}
pqk-=dPQK;refinementStepCount-=1.0;stepCount+=refinementStepCount/stride;}
#endif
Q0=vec3f(Q0.xy+dQ.xy*stepCount,pqk.z);*csHitPoint=Q0/pqk.w;*numIterations=stepCount+1.0;
#ifdef SSRAYTRACE_DEBUG
if (((pqk.x+dPQK.x)*stepDirection)>end) {*debugColor= vec3f(0,0,1);} else if ((stepCount+1.0)>=maxSteps) {*debugColor= vec3f(1,0,0);} else if (!hit) {*debugColor= vec3f(1,1,0);} else {*debugColor= vec3f(0,stepCount/maxSteps,0);}
#endif
return hit;}
/**
texCoord: in the [0,1] range
depth: depth in view space (range [znear,zfar]])
*/
fn computeViewPosFromUVDepth(texCoord: vec2f,depth: f32,projection: mat4x4f,invProjectionMatrix: mat4x4f)->vec3f {var xy=texCoord*2.0-1.0;var z: f32;
#ifdef SSRAYTRACE_RIGHT_HANDED_SCENE
#ifdef ORTHOGRAPHIC_CAMERA
z=-projection[2].z*depth+projection[3].z;
#else
z=-projection[2].z-projection[3].z/depth;
#endif
#else
#ifdef ORTHOGRAPHIC_CAMERA
z=projection[2].z*depth+projection[3].z;
#else
z=projection[2].z+projection[3].z/depth;
#endif
#endif
var w=1.0;var ndc=vec4f(xy,z,w);var eyePos: vec4f=invProjectionMatrix*ndc;var result=eyePos.xyz/eyePos.w;return result;}
`;t.ShaderStore.IncludesShadersStoreWGSL[r]||(t.ShaderStore.IncludesShadersStoreWGSL[r]=i),e.s([])},605265,e=>{"use strict";var t=e.i(263537);e.i(738124),e.i(590030),e.i(12799);let r="screenSpaceReflection2BlurCombinerPixelShader",i=`var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>; 
var mainSamplerSampler: sampler;var mainSampler: texture_2d<f32>;var reflectivitySamplerSampler: sampler;var reflectivitySampler: texture_2d<f32>;uniform strength: f32;uniform reflectionSpecularFalloffExponent: f32;uniform reflectivityThreshold: f32;varying vUV: vec2f;
#include<helperFunctions>
#ifdef SSR_BLEND_WITH_FRESNEL
#include<pbrBRDFFunctions>
#include<screenSpaceRayTrace>
uniform projection: mat4x4f;uniform invProjectionMatrix: mat4x4f;
#ifdef SSR_NORMAL_IS_IN_WORLDSPACE
uniform view: mat4x4f;
#endif
var normalSampler: texture_2d<f32>;var depthSampler: texture_2d<f32>;
#ifdef SSRAYTRACE_SCREENSPACE_DEPTH
uniform nearPlaneZ: f32;uniform farPlaneZ: f32;
#endif
#endif
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {
#ifdef SSRAYTRACE_DEBUG
fragmentOutputs.color=textureSample(textureSampler,textureSamplerSampler,input.vUV);
#else
var SSR: vec3f=textureSample(textureSampler,textureSamplerSampler,input.vUV).rgb;var color: vec4f=textureSample(mainSampler,textureSamplerSampler,input.vUV);var reflectivity: vec4f=textureSample(reflectivitySampler,reflectivitySamplerSampler,input.vUV);
#ifndef SSR_DISABLE_REFLECTIVITY_TEST
if (max(reflectivity.r,max(reflectivity.g,reflectivity.b))<=uniforms.reflectivityThreshold) {fragmentOutputs.color=color;return fragmentOutputs;}
#endif
#ifdef SSR_INPUT_IS_GAMMA_SPACE
color=toLinearSpaceVec4(color);
#endif
#ifdef SSR_BLEND_WITH_FRESNEL
var texSize: vec2f= vec2f(textureDimensions(depthSampler,0));var csNormal: vec3f=textureLoad(normalSampler,vec2<i32>(input.vUV*texSize),0).xyz;
#ifdef SSR_DECODE_NORMAL
csNormal=csNormal*2.0-1.0;
#endif
#ifdef SSR_NORMAL_IS_IN_WORLDSPACE
csNormal=(uniforms.view*vec4f(csNormal,0.0)).xyz;
#endif
var depth: f32=textureLoad(depthSampler,vec2<i32>(input.vUV*texSize),0).r;
#ifdef SSRAYTRACE_SCREENSPACE_DEPTH
depth=linearizeDepth(depth,uniforms.nearPlaneZ,uniforms.farPlaneZ);
#endif
var csPosition: vec3f=computeViewPosFromUVDepth(input.vUV,depth,uniforms.projection,uniforms.invProjectionMatrix);var csViewDirection: vec3f=normalize(csPosition);var F0: vec3f=reflectivity.rgb;var fresnel: vec3f=fresnelSchlickGGXVec3(max(dot(csNormal,-csViewDirection),0.0),F0, vec3f(1.));var reflectionMultiplier: vec3f=clamp(pow(fresnel*uniforms.strength, vec3f(uniforms.reflectionSpecularFalloffExponent)),vec3f(0.0),vec3f(1.0));
#else
var reflectionMultiplier: vec3f=clamp(pow(reflectivity.rgb*uniforms.strength, vec3f(uniforms.reflectionSpecularFalloffExponent)),vec3f(0.0),vec3f(1.0));
#endif
var colorMultiplier: vec3f=1.0-reflectionMultiplier;var finalColor: vec3f=(color.rgb*colorMultiplier)+(SSR*reflectionMultiplier);
#ifdef SSR_OUTPUT_IS_GAMMA_SPACE
finalColor=toGammaSpaceVec3(finalColor);
#endif
fragmentOutputs.color= vec4f(finalColor,color.a);
#endif
}
`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["screenSpaceReflection2BlurCombinerPixelShaderWGSL",0,{name:r,shader:i}])},825473,e=>{"use strict";var t=e.i(263537);e.i(738124);let r="iblShadowVoxelTracingPixelShader",i=`varying vUV: vec2f;
#include<helperFunctions>
#define DISABLE_UNIFORMITY_ANALYSIS
var depthSampler: texture_2d<f32>;var worldNormalSampler : texture_2d<f32>;var blueNoiseSampler: texture_2d<f32>;var icdfSamplerSampler: sampler;var icdfSampler: texture_2d<f32>;var voxelGridSamplerSampler: sampler;var voxelGridSampler: texture_3d<f32>;
#ifdef COLOR_SHADOWS
var iblSamplerSampler: sampler;var iblSampler: texture_cube<f32>;
#endif
uniform shadowParameters: vec4f;
#define SHADOWdirs uniforms.shadowParameters.x
#define SHADOWframe uniforms.shadowParameters.y
#define SHADOWenvRot uniforms.shadowParameters.w
uniform voxelBiasParameters : vec4f;
#define highestMipLevel uniforms.voxelBiasParameters.z
uniform sssParameters: vec4f;
#define SSSsamples uniforms.sssParameters.x
#define SSSstride uniforms.sssParameters.y
#define SSSmaxDistance uniforms.sssParameters.z
#define SSSthickness uniforms.sssParameters.w
uniform shadowOpacity: vec4f;uniform projMtx: mat4x4f;uniform viewMtx: mat4x4f;uniform invProjMtx: mat4x4f;uniform invViewMtx: mat4x4f;uniform wsNormalizationMtx: mat4x4f;uniform invVPMtx: mat4x4f;
#define GOLD 0.618034
struct AABB3f {m_min: vec3f,
m_max: vec3f,};struct Ray {orig: vec3f,
dir: vec3f,
dir_rcp: vec3f,
t_min: f32,
t_max: f32,};fn make_ray(origin: vec3f,direction: vec3f,tmin: f32,
tmax: f32)->Ray {var ray: Ray;ray.orig=origin;ray.dir=direction;ray.dir_rcp=1.0f/direction;ray.t_min=tmin;ray.t_max=tmax;return ray;}
fn ray_box_intersection(aabb: AABB3f,ray: Ray ,
distance_near: ptr<function,f32>,distance_far: ptr<function,f32>)->bool{var tbot: vec3f=ray.dir_rcp*(aabb.m_min-ray.orig);var ttop: vec3f=ray.dir_rcp*(aabb.m_max-ray.orig);var tmin: vec3f=min(ttop,tbot);var tmax: vec3f=max(ttop,tbot);*distance_near=max(ray.t_min,max(tmin.x,max(tmin.y,tmin.z)));*distance_far=min(ray.t_max,min(tmax.x,min(tmax.y,tmax.z)));return *distance_near<=*distance_far;}
#if VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
struct VoxelMarchDiagnosticInfo {heat: f32,
voxel_intersect_coords: vec3i,};
#endif
fn hash(i: u32)->u32 {var temp=i ^ (i>>16u);temp*=0x7FEB352Du;temp ^= temp>>15u;temp*=0x846CA68Bu;temp ^= temp>>16u;return temp;}
fn uv_to_normal(uv: vec2f)->vec3f {var N: vec3f;var uvRange: vec2f=uv;var theta: f32=uvRange.x*2.0*PI;var phi: f32=uvRange.y*PI;N.x=cos(theta)*sin(phi);N.z=sin(theta)*sin(phi);N.y=cos(phi);return N;}
fn goldenSequence(rstate: u32)->f32 {return uint2float(rstate*2654435769u);}
fn distanceSquared(a: vec2f,b: vec2f)->f32 {var diff: vec2f=a-b;return dot(diff,diff);}
fn genTB(N: vec3f,T: ptr<function,vec3f>,B: ptr<function,vec3f>) {var s: f32=select(1.0,-1.0,N.z<0.0);var a: f32=-1.0/(s+N.z);var b: f32=N.x*N.y*a;*T= vec3f(1.0+s*N.x*N.x*a,s*b,-s*N.x);*B= vec3f(b,s+N.y*N.y*a,-N.y);}
fn lessThan(x: vec3f,y: vec3f)->vec3<bool> {return x<y;}
#ifdef VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
fn anyHitVoxels(ray_vs: Ray,
voxel_march_diagnostic_info: ptr<function,VoxelMarchDiagnosticInfo>)->bool {
#else
fn anyHitVoxels(ray_vs: Ray)->bool {
#endif
var stack=array<i32,24>(); 
var invD: vec3f=ray_vs.dir_rcp;var D: vec3f=ray_vs.dir;var O: vec3f=ray_vs.orig;var negD=vec3i(lessThan(D, vec3f(0,0,0)));var voxel0: i32=negD.x | (negD.y<<1) | (negD.z<<2);var t0: vec3f=-O*invD;var t1=(vec3f(1.0)-O)*invD;var maxLod: i32= i32(highestMipLevel);var stackLevel: i32=0;
#if VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
var steps: u32=0u;
#endif
stack[stackLevel]=maxLod<<24;stackLevel++;while (stackLevel>0) {stackLevel=stackLevel-1;var elem: i32=stack[stackLevel];var Coords: vec4i =
vec4i(elem & 0xFF,(elem>>8) & 0xFF,(elem>>16) & 0xFF,elem>>24);if (Coords.w==0) {
#if VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
*voxel_march_diagnostic_info.heat= f32(steps)/24.0;
#endif
return true;}
#if VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
++steps;
#endif
var invRes: f32=exp2(f32(Coords.w-maxLod));var bbmin: vec3f=invRes*vec3f(Coords.xyz+negD);var bbmax: vec3f=invRes*vec3f(Coords.xyz-negD+vec3i(1));var mint: vec3f=mix(t0,t1,bbmin);var maxt: vec3f=mix(t0,t1,bbmax);var midt: vec3f=0.5*(mint+maxt);mint.x=max(0.0,mint.x);midt.x=max(0.0,midt.x);var nodeMask: u32= u32(
round(textureLoad(voxelGridSampler,Coords.xyz,Coords.w).x*255.0));Coords.w--;var voxelBit: u32=u32(voxel0);Coords=vec4i((Coords.xyz<<vec3u(1))+negD,Coords.w);var packedCoords: i32 =
Coords.x | (Coords.y<<8) | (Coords.z<<16) | (Coords.w<<24);if (max(mint.x,max(mint.y,mint.z))<min(midt.x,min(midt.y,midt.z)) &&
((1u<<voxelBit) & nodeMask) != 0) {stack[stackLevel]=packedCoords;stackLevel++;}
voxelBit ^= 0x1;packedCoords ^= 0x00001;if (max(midt.x,max(mint.y,mint.z))<min(maxt.x,min(midt.y,midt.z)) &&
((1u<<voxelBit) & nodeMask) != 0) {stack[stackLevel]=packedCoords;stackLevel++;}
voxelBit ^= 0x2;packedCoords ^= 0x00100;if (max(midt.x,max(midt.y,mint.z))<min(maxt.x,min(maxt.y,midt.z)) &&
((1u<<voxelBit) & nodeMask) != 0) {stack[stackLevel]=packedCoords;stackLevel++;}
voxelBit ^= 0x1;packedCoords ^= 0x00001;if (max(mint.x,max(midt.y,mint.z))<min(midt.x,min(maxt.y,midt.z)) &&
((1u<<voxelBit) & nodeMask) != 0) {stack[stackLevel]=packedCoords;stackLevel++;}
voxelBit ^= 0x4;packedCoords ^= 0x10000;if (max(mint.x,max(midt.y,midt.z))<min(midt.x,min(maxt.y,maxt.z)) &&
((1u<<voxelBit) & nodeMask) != 0) {stack[stackLevel]=packedCoords;stackLevel++;}
voxelBit ^= 0x1;packedCoords ^= 0x00001;if (max(midt.x,max(midt.y,midt.z))<min(maxt.x,min(maxt.y,maxt.z)) &&
((1u<<voxelBit) & nodeMask) != 0) {stack[stackLevel]=packedCoords;stackLevel++;}
voxelBit ^= 0x2;packedCoords ^= 0x00100;if (max(midt.x,max(mint.y,midt.z))<min(maxt.x,min(midt.y,maxt.z)) &&
((1u<<voxelBit) & nodeMask) != 0) {stack[stackLevel]=packedCoords;stackLevel++;}
voxelBit ^= 0x1;packedCoords ^= 0x00001;if (max(mint.x,max(mint.y,midt.z))<min(midt.x,min(midt.y,maxt.z)) &&
((1u<<voxelBit) & nodeMask) != 0) {stack[stackLevel]=packedCoords;stackLevel++;}}
#if VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
*voxel_march_diagnostic_info.heat= f32(steps)/24.0;
#endif
return false;}
fn linearizeDepth(depth: f32,near: f32,far: f32)->f32 {return (near*far)/(far-depth*(far-near));}
fn screenSpaceShadow(csOrigin: vec3f,csDirection: vec3f,csZBufferSize: vec2f,
nearPlaneZ: f32,farPlaneZ: f32,noise: f32)->f32 {
#ifdef RIGHT_HANDED
var csZDir : f32=-1.0;
#else 
var csZDir : f32=1.0;
#endif
var ssSamples: f32=SSSsamples;var ssMaxDist: f32=SSSmaxDistance;var ssStride: f32=SSSstride;var ssThickness: f32=SSSthickness;var rayLength: f32 =
select(ssMaxDist,(nearPlaneZ-csOrigin.z)/csDirection.z,
csZDir*(csOrigin.z+ssMaxDist*csDirection.z)<csZDir*nearPlaneZ);var csEndPoint: vec3f=csOrigin+rayLength*csDirection;var H0: vec4f=uniforms.projMtx*vec4f(csOrigin,1.0);var H1: vec4f=uniforms.projMtx*vec4f(csEndPoint,1.0);var Z0=vec2f(csOrigin.z ,1.0)/H0.w;var Z1=vec2f(csEndPoint.z,1.0)/H1.w;var P0=csZBufferSize*(0.5*H0.xy*Z0.y+0.5);var P1=csZBufferSize*(0.5*H1.xy*Z1.y+0.5);P1+= vec2f(select(0.0,0.01,distanceSquared(P0,P1)<0.0001));var delta: vec2f=P1-P0;var permute: bool=false;if (abs(delta.x)<abs(delta.y)) {permute=true;P0=P0.yx;P1=P1.yx;delta=delta.yx;}
var stepDirection: f32=sign(delta.x);var invdx: f32=stepDirection/delta.x;var dP: vec2f=ssStride* vec2f(stepDirection,invdx*delta.y);var dZ: vec2f=ssStride*invdx*(Z1-Z0);var opacity: f32=0.0;var P: vec2f=P0+noise*dP;var Z: vec2f=Z0+noise*dZ;var end: f32=P1.x*stepDirection;var rayZMax=csZDir*Z.x/Z.y;var sceneDepth=rayZMax;Z+=dZ;for (var stepCount: f32=0.0; 
opacity<1.0 && P.x*stepDirection<end && sceneDepth>0.0 && stepCount<ssSamples;stepCount+=1) { 
var coords=vec2i(select(P,P.yx,permute));sceneDepth=textureLoad(depthSampler,coords,0).x;sceneDepth=linearizeDepth(sceneDepth,nearPlaneZ,farPlaneZ);sceneDepth=csZDir*sceneDepth;if (sceneDepth<=0.0) {break;}
var rayZMin: f32=rayZMax;rayZMax=csZDir*Z.x/Z.y;opacity+=max(opacity,step(rayZMax,sceneDepth+ssThickness)*step(sceneDepth,rayZMin));P+=dP;Z+=dZ;}
return opacity;}
#if VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
fn voxelShadow(wsOrigin: vec3f,wsDirection: vec3f,wsNormal: vec3f,
DitherNoise: vec2f,
voxel_march_diagnostic_info: ptr<function,VoxelMarchDiagnosticInfo>)->f32 {
#else
fn voxelShadow(wsOrigin: vec3f,wsDirection: vec3f,wsNormal: vec3f,
DitherNoise: vec2f)->f32 {
#endif
var vxResolution: f32=f32(textureDimensions(voxelGridSampler,0).x);var T: vec3f;var B: vec3f;genTB(wsDirection,&T,&B);var DitherXY: vec2f=sqrt(DitherNoise.x)* vec2f(cos(2.0*PI*DitherNoise.y),
sin(2.0*PI*DitherNoise.y));var Dithering : vec3f=(uniforms.voxelBiasParameters.x*wsNormal +
uniforms.voxelBiasParameters.y*wsDirection +
DitherXY.x*T+DitherXY.y*B) /
vxResolution;var O: vec3f=0.5*wsOrigin+0.5+Dithering;var ray_vs=make_ray(O,wsDirection,0.0,10.0);var voxel_aabb: AABB3f;voxel_aabb.m_min=vec3f(0);voxel_aabb.m_max=vec3f(1);var near: f32=0;var far: f32=0;if (!ray_box_intersection(voxel_aabb,ray_vs,&near,&far)) {return 0.0;}
ray_vs.t_min=max(ray_vs.t_min,near);ray_vs.t_max=min(ray_vs.t_max,far);
#if VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
return select(0.0f,1.0f,anyHitVoxels(ray_vs,voxel_march_diagnostic_info));
#else
return select(0.0f,1.0f,anyHitVoxels(ray_vs));
#endif
}
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var nbDirs=u32(SHADOWdirs);var frameId=u32(SHADOWframe);var envRot: f32=SHADOWenvRot;var Resolution: vec2f= vec2f(textureDimensions(depthSampler,0));var currentPixel=vec2i(fragmentInputs.vUV*Resolution);var GlobalIndex =
(frameId*u32(Resolution.y)+u32(currentPixel.y))*u32(Resolution.x) +
u32(currentPixel.x);var N : vec3f=textureLoad(worldNormalSampler,currentPixel,0).xyz;
#ifdef WORLD_NORMAL_UNSIGNED
N=N*vec3f(2.0)-vec3f(1.0);
#endif
if (length(N)<0.01) {fragmentOutputs.color=vec4f(1.0,1.0,0.0,1.0);return fragmentOutputs;}
var normalizedRotation: f32=envRot/(2.0*PI);var depth : f32=textureLoad(depthSampler,currentPixel,0).x;
#ifndef IS_NDC_HALF_ZRANGE
depth=depth*2.0-1.0;
#endif
var temp : vec2f=(vec2f(currentPixel)+vec2f(0.5))*2.0/Resolution -
vec2f(1.0);var VP : vec4f=uniforms.invProjMtx*vec4f(temp.x,-temp.y,depth,1.0);VP/=VP.w;N=normalize(N);var noise : vec3f=textureLoad(blueNoiseSampler,currentPixel & vec2i(0xFF),0).xyz;noise.z=fract(noise.z+goldenSequence(frameId*nbDirs));
#ifdef VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
var heat: f32=0.0f;
#endif
var shadowAccum: f32=0.001;var specShadowAccum: f32=0.001;var sampleWeight : f32=0.001;
#ifdef COLOR_SHADOWS
var totalLight: vec3f=vec3f(0.001);var shadowedLight: vec3f=vec3f(0.0);
#endif
for (var i: u32=0; i<nbDirs; i++) {var dirId: u32=nbDirs*GlobalIndex+i;var L: vec4f;var T: vec2f;{var r: vec2f=plasticSequence(frameId*nbDirs+i);r=fract(r+ vec2f(2.0)*abs(noise.xy- vec2f(0.5)));T.x=textureSampleLevel(icdfSampler,icdfSamplerSampler,vec2f(r.x,0.0),0.0).x;T.y=textureSampleLevel(icdfSampler,icdfSamplerSampler,vec2f(T.x,r.y),0.0).y;L= vec4f(uv_to_normal(vec2f(T.x-normalizedRotation,T.y)),0);
#ifndef RIGHT_HANDED
L.z*=-1.0;
#endif
}
#ifdef COLOR_SHADOWS
var lightDir: vec3f=uv_to_normal(vec2f(1.0-fract(T.x+0.25),T.y));var ibl: vec3f=textureSampleLevel(iblSampler,iblSamplerSampler,lightDir,0.0).xyz;var pdf: f32=textureSampleLevel(icdfSampler,icdfSamplerSampler,T,0.0).z;
#endif
var cosNL: f32=dot(N,L.xyz);var opacity: f32=0.0;if (cosNL>0.0) {var VP2: vec4f=VP;VP2.y*=-1.0;var unormWP : vec4f=uniforms.invViewMtx*VP2;var WP: vec3f=(uniforms.wsNormalizationMtx*unormWP).xyz;var vxNoise: vec2f=vec2f(uint2float(hash(dirId*2)),uint2float(hash(dirId*2+1)));
#ifdef VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
VoxelMarchDiagnosticInfo voxel_march_diagnostic_info;opacity=max(opacity,
uniforms.shadowOpacity.x*voxelShadow(WP,L.xyz,N,vxNoise,
voxel_march_diagnostic_info));heat+=voxel_march_diagnostic_info.heat;
#else
opacity =
max(opacity,uniforms.shadowOpacity.x*voxelShadow(WP,L.xyz,N,vxNoise));
#endif
var VL : vec3f=(uniforms.viewMtx*L).xyz;
#ifdef RIGHT_HANDED
var nearPlaneZ: f32=-2.0*uniforms.projMtx[3][2]/(uniforms.projMtx[2][2]-1.0); 
var farPlaneZ: f32=-uniforms.projMtx[3][2]/(uniforms.projMtx[2][2]+1.0);
#else
var nearPlaneZ: f32=-2.0*uniforms.projMtx[3][2]/(uniforms.projMtx[2][2]+1.0); 
var farPlaneZ: f32=-uniforms.projMtx[3][2]/(uniforms.projMtx[2][2]-1.0);
#endif
var ssShadow: f32=uniforms.shadowOpacity.y *
screenSpaceShadow(VP2.xyz,VL,Resolution,nearPlaneZ,farPlaneZ,
abs(2.0*noise.z-1.0));opacity=max(opacity,ssShadow);
#ifdef COLOR_SHADOWS
var light: vec3f=select(vec3f(0.0),vec3f(cosNL)/vec3f(pdf)*ibl,pdf>1e-6);shadowedLight+=light*opacity;totalLight+=light;
#else
var rcos: f32=1.0-cosNL;shadowAccum+=(1.0-opacity*(1.0-pow(rcos,8.0)));sampleWeight+=1.0;var VR : vec3f=abs((uniforms.viewMtx*vec4f(reflect(-L.xyz,N),0.0)).xyz);specShadowAccum+=max(1.0-(opacity*pow(VR.z,8.0)),0.0);
#endif
}
noise.z=fract(noise.z+GOLD);}
#ifdef COLOR_SHADOWS
var shadow: vec3f=(totalLight-shadowedLight)/totalLight;var maxShadow: f32=max(max(shadow.x,max(shadow.y,shadow.z)),1.0);fragmentOutputs.color=vec4f(shadow/maxShadow,1.0);
#else
#ifdef VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
fragmentOutputs.color =
vec4f(shadowAccum/sampleWeight,specShadowAccum/sampleWeight,heat/sampleWeight,1.0);
#else
fragmentOutputs.color=vec4f(shadowAccum/sampleWeight,specShadowAccum/sampleWeight,0.0,1.0);
#endif
#endif
}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["iblShadowVoxelTracingPixelShaderWGSL",0,{name:r,shader:i}])},993754,e=>{"use strict";var t=e.i(998125);class r extends t.AbstractAudioOutNode{constructor(e,t){super(e,t,3)}}e.s(["AbstractAudioBus",0,r])},440871,880080,e=>{"use strict";var t=e.i(993754);class r extends t.AbstractAudioBus{constructor(e,t){super(e,t)}}e.s(["MainAudioBus",0,r],880080);var i=e.i(661755);class a extends r{constructor(e,t){super(e,t),this._subGraph=new a._SubGraph(this)}async _initAsync(e){if(await this._subGraph.initAsync(e),this.engine.mainOut&&!this._connect(this.engine.mainOut))throw Error("Connect failed");this.engine._addMainBus(this)}dispose(){super.dispose(),this.engine._removeMainBus(this)}get _inNode(){return this._subGraph._inNode}get _outNode(){return this._subGraph._outNode}_connect(e){return!!super._connect(e)&&(e._inNode&&this._outNode?.connect(e._inNode),!0)}_disconnect(e){return!!super._disconnect(e)&&(e._inNode&&this._outNode?.disconnect(e._inNode),!0)}getClassName(){return"_WebAudioMainBus"}}a._SubGraph=class extends i._WebAudioBaseSubGraph{get _downstreamNodes(){return this._owner._downstreamNodes??null}},e.s(["_WebAudioMainBus",0,a],440871)},24012,e=>{"use strict";var t=e.i(263537);let r="sceneVertexDeclaration",i=`uniform mat4 viewProjection;
#ifdef MULTIVIEW
uniform mat4 viewProjectionR;
#endif
uniform mat4 view;uniform mat4 projection;uniform vec4 vEyePosition;
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.s([])},773111,e=>{"use strict";var t=e.i(263537);let r="meshVertexDeclaration",i=`uniform mat4 world;uniform float visibility;
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.s([])},481941,e=>{"use strict";var t=e.i(263537);let r="shadowMapVertexMetric",i=`#if SM_USEDISTANCE==1
vPositionWSM=worldPos.xyz;
#endif
#if SM_DEPTHTEXTURE==1
#ifdef IS_NDC_HALF_ZRANGE
#define BIASFACTOR 0.5
#else
#define BIASFACTOR 1.0
#endif
#ifdef USE_REVERSE_DEPTHBUFFER
gl_Position.z-=biasAndScaleSM.x*gl_Position.w*BIASFACTOR;
#else
gl_Position.z+=biasAndScaleSM.x*gl_Position.w*BIASFACTOR;
#endif
#endif
#if defined(SM_DEPTHCLAMP) && SM_DEPTHCLAMP==1
zSM=gl_Position.z;gl_Position.z=0.0;
#elif SM_USEDISTANCE==0
#ifdef USE_REVERSE_DEPTHBUFFER
vDepthMetricSM=(-gl_Position.z+depthValuesSM.x)/depthValuesSM.y+biasAndScaleSM.x;
#else
vDepthMetricSM=(gl_Position.z+depthValuesSM.x)/depthValuesSM.y+biasAndScaleSM.x;
#endif
#endif
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.s(["shadowMapVertexMetric",0,{name:r,shader:i}])},229082,e=>{"use strict";var t=e.i(263537);let r="pointCloudVertex",i=`#if defined(POINTSIZE) && !defined(WEBGPU)
gl_PointSize=pointSize;
#endif
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.s([])},983789,e=>{"use strict";var t=e.i(263537);let r="bumpVertexDeclaration",i=`#if defined(BUMP) || defined(PARALLAX) || defined(CLEARCOAT_BUMP) || defined(ANISOTROPIC)
#if defined(TANGENT) && defined(NORMAL) 
varying mat3 vTBN;
#endif
#endif
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.s([])},410845,e=>{"use strict";var t=e.i(263537);let r="anaglyphPixelShader",i=`varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;var leftSamplerSampler: sampler;var leftSampler: texture_2d<f32>;
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var leftFrag: vec4f=textureSample(leftSampler,leftSamplerSampler,input.vUV);leftFrag= vec4f(1.0,leftFrag.g,leftFrag.b,1.0);var rightFrag: vec4f=textureSample(textureSampler,textureSamplerSampler,input.vUV);rightFrag= vec4f(rightFrag.r,1.0,1.0,1.0);fragmentOutputs.color= vec4f(rightFrag.rgb*leftFrag.rgb,1.0);}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["anaglyphPixelShaderWGSL",0,{name:r,shader:i}])},12128,e=>{"use strict";var t=e.i(263537);let r="sharpenPixelShader",i=`varying vec2 vUV;uniform sampler2D textureSampler;uniform vec2 screenSize;uniform vec2 sharpnessAmounts;
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void)
{vec2 onePixel=vec2(1.0,1.0)/screenSize;vec4 color=texture2D(textureSampler,vUV);vec4 edgeDetection=texture2D(textureSampler,vUV+onePixel*vec2(0,-1)) +
texture2D(textureSampler,vUV+onePixel*vec2(-1,0)) +
texture2D(textureSampler,vUV+onePixel*vec2(1,0)) +
texture2D(textureSampler,vUV+onePixel*vec2(0,1)) -
color*4.0;gl_FragColor=max(vec4(color.rgb*sharpnessAmounts.y,color.a)-(sharpnessAmounts.x*vec4(edgeDetection.rgb,0)),0.);}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["sharpenPixelShader",0,{name:r,shader:i}])},7383,e=>{"use strict";var t=e.i(263537);let r="boundingBoxRendererVertexShader",i=`attribute position: vec3f;uniform world: mat4x4f;uniform viewProjection: mat4x4f;
#ifdef INSTANCES
attribute world0 : vec4<f32>;attribute world1 : vec4<f32>;attribute world2 : vec4<f32>;attribute world3 : vec4<f32>;
#endif
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input : VertexInputs)->FragmentInputs {
#define CUSTOM_VERTEX_MAIN_BEGIN
#ifdef INSTANCES
var finalWorld=mat4x4<f32>(vertexInputs.world0,vertexInputs.world1,vertexInputs.world2,vertexInputs.world3);var worldPos: vec4f=finalWorld* vec4f(vertexInputs.position,1.0);
#else
var worldPos: vec4f=uniforms.world* vec4f(vertexInputs.position,1.0);
#endif
vertexOutputs.position=uniforms.viewProjection*worldPos;
#define CUSTOM_VERTEX_MAIN_END
}
`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["boundingBoxRendererVertexShaderWGSL",0,{name:r,shader:i}])},49256,e=>{"use strict";var t=e.i(263537);e.i(201632),e.i(261937),e.i(141687);let r="glowMapGenerationPixelShader",i=`#if defined(DIFFUSE_ISLINEAR) || defined(EMISSIVE_ISLINEAR)
#include<helperFunctions>
#endif
#ifdef DIFFUSE
varying vec2 vUVDiffuse;uniform sampler2D diffuseSampler;
#endif
#ifdef OPACITY
varying vec2 vUVOpacity;uniform sampler2D opacitySampler;uniform float opacityIntensity;
#endif
#ifdef EMISSIVE
varying vec2 vUVEmissive;uniform sampler2D emissiveSampler;
#endif
#ifdef VERTEXALPHA
varying vec4 vColor;
#endif
uniform vec4 glowColor;uniform float glowIntensity;
#include<clipPlaneFragmentDeclaration>
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void)
{
#include<clipPlaneFragment>
vec4 finalColor=glowColor;
#ifdef DIFFUSE
vec4 albedoTexture=texture2D(diffuseSampler,vUVDiffuse);
#ifdef DIFFUSE_ISLINEAR
albedoTexture=toGammaSpace(albedoTexture);
#endif
#ifdef GLOW
finalColor.a*=albedoTexture.a;
#endif
#ifdef HIGHLIGHT
finalColor.a=albedoTexture.a;
#endif
#endif
#ifdef OPACITY
vec4 opacityMap=texture2D(opacitySampler,vUVOpacity);
#ifdef OPACITYRGB
finalColor.a*=getLuminance(opacityMap.rgb);
#else
finalColor.a*=opacityMap.a;
#endif
finalColor.a*=opacityIntensity;
#endif
#ifdef VERTEXALPHA
finalColor.a*=vColor.a;
#endif
#ifdef ALPHATEST
if (finalColor.a<ALPHATESTVALUE)
discard;
#endif
#ifdef EMISSIVE
vec4 emissive=texture2D(emissiveSampler,vUVEmissive);
#ifdef EMISSIVE_ISLINEAR
emissive=toGammaSpace(emissive);
#endif
gl_FragColor=emissive*finalColor*glowIntensity;
#else
gl_FragColor=finalColor*glowIntensity;
#endif
#ifdef HIGHLIGHT
gl_FragColor.a=glowColor.a;
#endif
}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["glowMapGenerationPixelShader",0,{name:r,shader:i}])},933678,e=>{"use strict";var t=e.i(263537);e.i(201632);let r="iblIcdfPixelShader",i=`precision highp sampler2D;
#include<helperFunctions>
varying vec2 vUV;
#ifdef IBL_USE_CUBE_MAP
uniform samplerCube iblSource;
#else
uniform sampler2D iblSource;
#endif
uniform sampler2D scaledLuminanceSampler;uniform int iblWidth;uniform int iblHeight;uniform sampler2D cdfx;uniform sampler2D cdfy;float fetchLuminance(vec2 coords) {
#ifdef IBL_USE_CUBE_MAP
vec3 direction=equirectangularToCubemapDirection(coords);vec3 color=textureCubeLodEXT(iblSource,direction,0.0).rgb;
#else
vec3 color=textureLod(iblSource,coords,0.0).rgb;
#endif
return dot(color,LuminanceEncodeApprox);}
float fetchCDFx(int x) { return texelFetch(cdfx,ivec2(x,0),0).x; }
float bisectx(int size,float targetValue) {int a=0,b=size-1;while (b-a>1) {int c=a+b>>1;if (fetchCDFx(c)<targetValue)
a=c;else
b=c;}
return mix(float(a),float(b),
(targetValue-fetchCDFx(a))/(fetchCDFx(b)-fetchCDFx(a))) /
float(size-1);}
float fetchCDFy(int y,int invocationId) {return texelFetch(cdfy,ivec2(invocationId,y),0).x;}
float bisecty(int size,float targetValue,int invocationId) {int a=0,b=size-1;while (b-a>1) {int c=a+b>>1;if (fetchCDFy(c,invocationId)<targetValue)
a=c;else
b=c;}
return mix(float(a),float(b),
(targetValue-fetchCDFy(a,invocationId)) /
(fetchCDFy(b,invocationId)-fetchCDFy(a,invocationId))) /
float(size-1);}
void main(void) {ivec2 cdfxSize=textureSize(cdfx,0);int cdfWidth=cdfxSize.x;int icdfWidth=cdfWidth-1;ivec2 currentPixel=ivec2(gl_FragCoord.xy);vec3 outputColor=vec3(1.0);if (currentPixel.x==0) {outputColor.x=0.0;} else if (currentPixel.x==icdfWidth-1) {outputColor.x=1.0;} else {float targetValue=fetchCDFx(cdfWidth-1)*vUV.x;outputColor.x=bisectx(cdfWidth,targetValue);}
ivec2 cdfySize=textureSize(cdfy,0);int cdfHeight=cdfySize.y;if (currentPixel.y==0) {outputColor.y=0.0;} else if (currentPixel.y==cdfHeight-2) {outputColor.y=1.0;} else {float targetValue=fetchCDFy(cdfHeight-1,currentPixel.x)*vUV.y;outputColor.y=max(bisecty(cdfHeight,targetValue,currentPixel.x),0.0);}
vec2 size=vec2(textureSize(scaledLuminanceSampler,0));float highestMip=floor(log2(size.x));float normalization=texture(scaledLuminanceSampler,vUV,highestMip).r;float pixelLuminance=fetchLuminance(vUV);outputColor.z=pixelLuminance/(2.0*PI*normalization);gl_FragColor=vec4(outputColor,1.0);}
`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["iblIcdfPixelShader",0,{name:r,shader:i}])},270161,e=>{"use strict";var t=e.i(263537);let r="iblShadowSpatialBlurPixelShader",i=`#define PI 3.1415927
varying vUV: vec2f;var depthSampler: texture_2d<f32>;var worldNormalSampler: texture_2d<f32>;var voxelTracingSampler : texture_2d<f32>;uniform blurParameters: vec4f;
#define stridef uniforms.blurParameters.x
#define worldScale uniforms.blurParameters.y
const weights=array<f32,5>(0.0625,0.25,0.375,0.25,0.0625);const nbWeights: i32=5;fn max2(v: vec2f,w: vec2f)->vec2f {return vec2f(max(v.x,w.x),max(v.y,w.y));}
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var gbufferRes=vec2f(textureDimensions(depthSampler,0));var gbufferPixelCoord= vec2i(fragmentInputs.vUV*gbufferRes);var shadowRes=vec2f(textureDimensions(voxelTracingSampler,0));var shadowPixelCoord= vec2i(fragmentInputs.vUV*shadowRes);var N: vec3f=textureLoad(worldNormalSampler,gbufferPixelCoord,0).xyz;if (length(N)<0.01) {fragmentOutputs.color=vec4f(1.0,1.0,0.0,1.0);return fragmentOutputs;}
var depth: f32=-textureLoad(depthSampler,gbufferPixelCoord,0).x;var X: vec4f= vec4f(0.0);for(var y: i32=0; y<nbWeights; y++) {for(var x: i32=0; x<nbWeights; x++) {var gBufferCoords: vec2i=gbufferPixelCoord+i32(stridef)*vec2i(x-(nbWeights>>1),y-(nbWeights>>1));var shadowCoords: vec2i=shadowPixelCoord+i32(stridef)*vec2i(x-(nbWeights>>1),y-(nbWeights>>1));var T : vec3f=textureLoad(voxelTracingSampler,shadowCoords,0).xyz;var ddepth: f32=-textureLoad(depthSampler,gBufferCoords,0).x-depth;var dN: vec3f=textureLoad(worldNormalSampler,gBufferCoords,0).xyz-N;var w: f32=weights[x]*weights[y] *
exp2(max(-1000.0/(worldScale*worldScale),-0.5) *
(ddepth*ddepth) -
1e1*dot(dN,dN));X+= vec4f(w*T.x,w*T.y,w*T.z,w);}}
fragmentOutputs.color= vec4f(X.x/X.w,X.y/X.w,X.z/X.w,1.0);}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["iblShadowSpatialBlurPixelShaderWGSL",0,{name:r,shader:i}])},301718,e=>{"use strict";var t=e.i(440163),r=e.i(916624),i=e.i(202286),a=e.i(774685);class o extends t.FlowGraphBlock{constructor(e){super(e),this.sourceSystem=this.registerDataInput("sourceSystem",r.RichTypeAny),this.destinationSystem=this.registerDataInput("destinationSystem",r.RichTypeAny),this.inputCoordinates=this.registerDataInput("inputCoordinates",r.RichTypeVector3),this.outputCoordinates=this.registerDataOutput("outputCoordinates",r.RichTypeVector3)}_updateOutputs(e){let t=this.sourceSystem.getValue(e),r=this.destinationSystem.getValue(e),a=this.inputCoordinates.getValue(e),o=t.getWorldMatrix(),n=r.getWorldMatrix(),s=i.TmpVectors.Matrix[0].copyFrom(n);s.invert();let l=i.TmpVectors.Matrix[1];s.multiplyToRef(o,l);let f=this.outputCoordinates.getValue(e);i.Vector3.TransformCoordinatesToRef(a,l,f)}getClassName(){return"FlowGraphTransformCoordinatesSystemBlock"}}(0,a.RegisterClass)("FlowGraphTransformCoordinatesSystemBlock",o),e.s(["FlowGraphTransformCoordinatesSystemBlock",0,o])},70280,e=>{"use strict";var t=e.i(842442),r=e.i(916624),i=e.i(774685),a=e.i(774100);class o extends t.FlowGraphUnaryOperationBlock{constructor(e){super(r.RichTypeBoolean,r.RichTypeNumber,e=>+e,"FlowGraphBooleanToFloat",e)}}(0,i.RegisterClass)("FlowGraphBooleanToFloat",o);class n extends t.FlowGraphUnaryOperationBlock{constructor(e){super(r.RichTypeBoolean,r.RichTypeFlowGraphInteger,e=>a.FlowGraphInteger.FromValue(+e),"FlowGraphBooleanToInt",e)}}(0,i.RegisterClass)("FlowGraphBooleanToInt",n);class s extends t.FlowGraphUnaryOperationBlock{constructor(e){super(r.RichTypeNumber,r.RichTypeBoolean,e=>!!e,"FlowGraphFloatToBoolean",e)}}(0,i.RegisterClass)("FlowGraphFloatToBoolean",s);class l extends t.FlowGraphUnaryOperationBlock{constructor(e){super(r.RichTypeFlowGraphInteger,r.RichTypeBoolean,e=>!!e.value,"FlowGraphIntToBoolean",e)}}(0,i.RegisterClass)("FlowGraphIntToBoolean",l);class f extends t.FlowGraphUnaryOperationBlock{constructor(e){super(r.RichTypeFlowGraphInteger,r.RichTypeNumber,e=>e.value,"FlowGraphIntToFloat",e)}}(0,i.RegisterClass)("FlowGraphIntToFloat",f);class c extends t.FlowGraphUnaryOperationBlock{constructor(e){super(r.RichTypeNumber,r.RichTypeFlowGraphInteger,t=>{switch(e?.roundingMode){case"floor":return a.FlowGraphInteger.FromValue(Math.floor(t));case"ceil":return a.FlowGraphInteger.FromValue(Math.ceil(t));case"round":return a.FlowGraphInteger.FromValue(Math.round(t));default:return a.FlowGraphInteger.FromValue(t)}},"FlowGraphFloatToInt",e)}}(0,i.RegisterClass)("FlowGraphFloatToInt",c),e.s(["FlowGraphBooleanToFloat",0,o,"FlowGraphBooleanToInt",0,n,"FlowGraphFloatToBoolean",0,s,"FlowGraphFloatToInt",0,c,"FlowGraphIntToBoolean",0,l,"FlowGraphIntToFloat",0,f])},835845,e=>{"use strict";var t=e.i(263537);e.i(182478),e.i(30653),e.i(127010),e.i(781801),e.i(313976),e.i(94556);let r="particlesVertexShader",i=`attribute vec3 position;attribute vec4 color;attribute float angle;attribute vec2 size;
#ifdef ANIMATESHEET
attribute float cellIndex;
#endif
#ifndef BILLBOARD
attribute vec3 direction;
#endif
#ifdef BILLBOARDSTRETCHED
attribute vec3 direction;
#endif
#ifdef RAMPGRADIENT
attribute vec4 remapData;
#endif
attribute vec2 offset;uniform mat4 view;uniform mat4 projection;uniform vec2 translationPivot;
#ifdef ANIMATESHEET
uniform vec3 particlesInfos; 
#endif
varying vec2 vUV;varying vec4 vColor;
#ifdef POSITIONW_AS_VARYING
varying vec3 vPositionW;
#endif
#ifdef RAMPGRADIENT
varying vec4 remapRanges;
#endif
#if defined(BILLBOARD) && !defined(BILLBOARDY) && !defined(BILLBOARDSTRETCHED)
uniform mat4 invView;
#endif
#include<clipPlaneVertexDeclaration>
#include<fogVertexDeclaration>
#include<logDepthDeclaration>
#ifdef BILLBOARD
uniform vec3 eyePosition;
#endif
vec3 rotate(vec3 yaxis,vec3 rotatedCorner) {vec3 xaxis=normalize(cross(vec3(0.,1.0,0.),yaxis));vec3 zaxis=normalize(cross(yaxis,xaxis));vec3 row0=vec3(xaxis.x,xaxis.y,xaxis.z);vec3 row1=vec3(yaxis.x,yaxis.y,yaxis.z);vec3 row2=vec3(zaxis.x,zaxis.y,zaxis.z);mat3 rotMatrix= mat3(row0,row1,row2);vec3 alignedCorner=rotMatrix*rotatedCorner;return position+alignedCorner;}
#ifdef BILLBOARDSTRETCHED
vec3 rotateAlign(vec3 toCamera,vec3 rotatedCorner) {vec3 normalizedToCamera=normalize(toCamera);vec3 normalizedCrossDirToCamera=normalize(cross(normalize(direction),normalizedToCamera));vec3 row0=vec3(normalizedCrossDirToCamera.x,normalizedCrossDirToCamera.y,normalizedCrossDirToCamera.z);vec3 row2=vec3(normalizedToCamera.x,normalizedToCamera.y,normalizedToCamera.z);
#ifdef BILLBOARDSTRETCHED_LOCAL
vec3 row1=normalize(direction);
#else
vec3 crossProduct=normalize(cross(normalizedToCamera,normalizedCrossDirToCamera));vec3 row1=vec3(crossProduct.x,crossProduct.y,crossProduct.z);
#endif
mat3 rotMatrix= mat3(row0,row1,row2);vec3 alignedCorner=rotMatrix*rotatedCorner;return position+alignedCorner;}
#endif
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
vec2 cornerPos;
#ifndef POSITIONW_AS_VARYING
vec3 vPositionW;
#endif
cornerPos=(vec2(offset.x-0.5,offset.y -0.5)-translationPivot)*size;
#ifdef BILLBOARD
vec3 rotatedCorner;
#ifdef BILLBOARDY
rotatedCorner.x=cornerPos.x*cos(angle)-cornerPos.y*sin(angle);rotatedCorner.z=cornerPos.x*sin(angle)+cornerPos.y*cos(angle);rotatedCorner.y=0.;rotatedCorner.xz+=translationPivot;vec3 yaxis=position-eyePosition;yaxis.y=0.;vPositionW=rotate(normalize(yaxis),rotatedCorner);vec3 viewPos=(view*vec4(vPositionW,1.0)).xyz;
#elif defined(BILLBOARDSTRETCHED)
rotatedCorner.x=cornerPos.x*cos(angle)-cornerPos.y*sin(angle);rotatedCorner.y=cornerPos.x*sin(angle)+cornerPos.y*cos(angle);rotatedCorner.z=0.;rotatedCorner.xy+=translationPivot;vec3 toCamera=position-eyePosition;vPositionW=rotateAlign(toCamera,rotatedCorner);vec3 viewPos=(view*vec4(vPositionW,1.0)).xyz;
#else
rotatedCorner.x=cornerPos.x*cos(angle)-cornerPos.y*sin(angle);rotatedCorner.y=cornerPos.x*sin(angle)+cornerPos.y*cos(angle);rotatedCorner.z=0.;rotatedCorner.xy+=translationPivot;vec3 viewPos=(view*vec4(position,1.0)).xyz+rotatedCorner;vPositionW=(invView*vec4(viewPos,1)).xyz;
#endif
#ifdef RAMPGRADIENT
remapRanges=remapData;
#endif
gl_Position=projection*vec4(viewPos,1.0);
#else
vec3 rotatedCorner;rotatedCorner.x=cornerPos.x*cos(angle)-cornerPos.y*sin(angle);rotatedCorner.z=cornerPos.x*sin(angle)+cornerPos.y*cos(angle);rotatedCorner.y=0.;rotatedCorner.xz+=translationPivot;vec3 yaxis=normalize(direction);vPositionW=rotate(yaxis,rotatedCorner);gl_Position=projection*view*vec4(vPositionW,1.0);
#endif
vColor=color;
#ifdef ANIMATESHEET
float rowOffset=floor(cellIndex*particlesInfos.z);float columnOffset=cellIndex-rowOffset/particlesInfos.z;vec2 uvScale=particlesInfos.xy;vec2 uvOffset=vec2(offset.x ,1.0-offset.y);vUV=(uvOffset+vec2(columnOffset,rowOffset))*uvScale;
#else
vUV=offset;
#endif
#if defined(CLIPPLANE) || defined(CLIPPLANE2) || defined(CLIPPLANE3) || defined(CLIPPLANE4) || defined(CLIPPLANE5) || defined(CLIPPLANE6) || defined(FOG)
vec4 worldPos=vec4(vPositionW,1.0);
#endif
#include<clipPlaneVertex>
#include<fogVertex>
#include<logDepthVertex>
#define CUSTOM_VERTEX_MAIN_END
}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["particlesVertexShader",0,{name:r,shader:i}])},255261,e=>{"use strict";var t=e.i(263537);e.i(201632);let r="iblCdfyPixelShader",i=`precision highp sampler2D;precision highp samplerCube;
#include<helperFunctions>
#define PI 3.1415927
varying vec2 vUV;
#ifdef IBL_USE_CUBE_MAP
uniform samplerCube iblSource;
#else
uniform sampler2D iblSource;
#endif
uniform int iblHeight;
#ifdef IBL_USE_CUBE_MAP
float fetchCube(vec2 uv) {vec3 direction=equirectangularToCubemapDirection(uv);return sin(PI*uv.y)*dot(textureCubeLodEXT(iblSource,direction,0.0).rgb,LuminanceEncodeApprox);}
#else
float fetchPanoramic(ivec2 Coords,float envmapHeight) {return sin(PI*(float(Coords.y)+0.5)/envmapHeight) *
dot(texelFetch(iblSource,Coords,0).rgb,LuminanceEncodeApprox);}
#endif
void main(void) {ivec2 coords=ivec2(gl_FragCoord.x,gl_FragCoord.y);float cdfy=0.0;for (int y=1; y<=coords.y; y++) {
#ifdef IBL_USE_CUBE_MAP
vec2 uv=vec2(vUV.x,(float(y-1)+0.5)/float(iblHeight));cdfy+=fetchCube(uv);
#else
cdfy+=fetchPanoramic(ivec2(coords.x,y-1),float(iblHeight));
#endif
}
gl_FragColor=vec4(cdfy,0.0,0.0,1.0);}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["iblCdfyPixelShader",0,{name:r,shader:i}])},101868,e=>{"use strict";var t=e.i(263537);e.i(201632),e.i(442357),e.i(424192),e.i(289258);let r="iblDominantDirectionPixelShader",i=`precision highp sampler2D;precision highp samplerCube;
#include<helperFunctions>
#include<importanceSampling>
#include<pbrBRDFFunctions>
#include<hdrFilteringFunctions>
varying vec2 vUV;uniform sampler2D icdfSampler;void main(void) {vec3 lightDir=vec3(0.0,0.0,0.0);for(uint i=0u; i<NUM_SAMPLES; ++i)
{vec2 Xi=hammersley(i,NUM_SAMPLES);vec2 T;T.x=texture2D(icdfSampler,vec2(Xi.x,0.0)).x;T.y=texture2D(icdfSampler,vec2(T.x,Xi.y)).y;vec3 Ls=uv_to_normal(vec2(1.0-fract(T.x+0.25),T.y));lightDir+=Ls;}
lightDir/=float(NUM_SAMPLES);gl_FragColor=vec4(lightDir,1.0);}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["iblDominantDirectionPixelShader",0,{name:r,shader:i}])},734062,e=>{"use strict";var t=e.i(263537);let r="fluidRenderingParticleThicknessVertexShader",i=`attribute position: vec3f;attribute offset: vec2f;uniform view: mat4x4f;uniform projection: mat4x4f;uniform size: vec2f;varying uv: vec2f;@vertex
fn main(input: VertexInputs)->FragmentInputs {var cornerPos: vec3f=vec3f(
vec2f(vertexInputs.offset.x-0.5,vertexInputs.offset.y-0.5)*uniforms.size,
0.0
);var viewPos: vec3f=(uniforms.view*vec4f(vertexInputs.position,1.0)).xyz+cornerPos;vertexOutputs.position=uniforms.projection*vec4f(viewPos,1.0);vertexOutputs.uv=vertexInputs.offset;}
`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["fluidRenderingParticleThicknessVertexShaderWGSL",0,{name:r,shader:i}])},551150,e=>{"use strict";var t=e.i(263537);e.i(315647),e.i(201632),e.i(310063);let r="imageProcessingPixelShader",i=`varying vec2 vUV;uniform sampler2D textureSampler;
#include<imageProcessingDeclaration>
#include<helperFunctions>
#include<imageProcessingFunctions>
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void)
{vec4 result=texture2D(textureSampler,vUV);result.rgb=max(result.rgb,vec3(0.));
#ifdef IMAGEPROCESSING
#ifndef FROMLINEARSPACE
result.rgb=toLinearSpace(result.rgb);
#endif
result=applyImageProcessing(result);
#else
#ifdef FROMLINEARSPACE
result=applyImageProcessing(result);
#endif
#endif
gl_FragColor=result;}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["imageProcessingPixelShader",0,{name:r,shader:i}])},139010,e=>{"use strict";var t=e.i(263537);e.i(755704),e.i(144628),e.i(357351),e.i(738124),e.i(352483),e.i(562396),e.i(212954),e.i(476129),e.i(922446);let r="particlesPixelShader",i=`varying vUV: vec2f;varying vColor: vec4f;uniform textureMask: vec4f;var diffuseSamplerSampler: sampler;var diffuseSampler: texture_2d<f32>;
#include<clipPlaneFragmentDeclaration>
#include<imageProcessingDeclaration>
#include<logDepthDeclaration>
#include<helperFunctions>
#include<imageProcessingFunctions>
#ifdef RAMPGRADIENT
varying remapRanges: vec4f;var rampSamplerSampler: sampler;var rampSampler: texture_2d<f32>;
#endif
#include<fogFragmentDeclaration>
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
#include<clipPlaneFragment>
var textureColor: vec4f=textureSample(diffuseSampler,diffuseSamplerSampler,input.vUV);var baseColor: vec4f=(textureColor*uniforms.textureMask+( vec4f(1.,1.,1.,1.)-uniforms.textureMask))*input.vColor;
#ifdef RAMPGRADIENT
var alpha: f32=baseColor.a;var remappedColorIndex: f32=clamp((alpha-input.remapRanges.x)/input.remapRanges.y,0.0,1.0);var rampColor: vec4f=textureSample(rampSampler,rampSamplerSampler,vec2f(1.0-remappedColorIndex,0.));baseColor=vec4f(baseColor.rgb*rampColor.rgb,baseColor.a);var finalAlpha: f32=baseColor.a;baseColor.a=clamp((alpha*rampColor.a-input.remapRanges.z)/input.remapRanges.w,0.0,1.0);
#endif
#ifdef BLENDMULTIPLYMODE
var sourceAlpha: f32=input.vColor.a*textureColor.a;baseColor=vec4f(baseColor.rgb*sourceAlpha+ vec3f(1.0)*(1.0-sourceAlpha),baseColor.a);
#endif
#include<logDepthFragment>
#include<fogFragment>(color,baseColor)
#ifdef IMAGEPROCESSINGPOSTPROCESS
baseColor=vec4f(toLinearSpaceVec3(baseColor.rgb),baseColor.a);
#else
#ifdef IMAGEPROCESSING
baseColor=vec4f(toLinearSpaceVec3(baseColor.rgb),baseColor.a);baseColor=applyImageProcessing(baseColor);
#endif
#endif
fragmentOutputs.color=baseColor;
#define CUSTOM_FRAGMENT_MAIN_END
}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["particlesPixelShaderWGSL",0,{name:r,shader:i}])},73033,e=>{"use strict";var t=e.i(263537);let r="gaussianSplattingVoxelPixelShader",i=`precision highp float;layout(location=0) out highp float glFragData[MAX_DRAW_BUFFERS];varying vec3 vNormalizedPosition;varying vec3 vNormalizedCenterPosition;varying float vAlpha;varying vec2 vPatchPosition;uniform float nearPlane;uniform float farPlane;uniform float stepSize;float max3(vec3 v) { return max(max(v.x,v.y),v.z); }
float prngCanonical1d(float co)
{return fract(sin(co*91.3458)*47453.5453);}
float prngCanonical2d(vec2 co)
{return fract(sin(dot(vec2(co.x,co.y),vec2(12.9898,78.233)))*43758.5453);}
float prngCanonical3d(vec3 co)
{return prngCanonical2d(vec2(co.x,co.y)+prngCanonical1d(co.z));}
void main(void) {vec3 normPos=vNormalizedPosition.xyz;if (normPos.z<nearPlane || normPos.z>farPlane) {discard;}
float distToCenter=max3(abs(vNormalizedCenterPosition-normPos));float shadowingOpacity=clamp((distToCenter<stepSize ? 1.0 : exp(-dot(vPatchPosition,vPatchPosition)))*vAlpha,0.0,1.0);if (shadowingOpacity<1.0 && shadowingOpacity<prngCanonical3d(normPos/stepSize)) {discard;}
glFragData[0]=normPos.z<nearPlane+stepSize ? 1.0 : 0.0;glFragData[1]=normPos.z>=nearPlane+stepSize && normPos.z<nearPlane+2.0*stepSize ? 1.0 : 0.0;glFragData[2]=normPos.z>=nearPlane+2.0*stepSize && normPos.z<nearPlane+3.0*stepSize ? 1.0 : 0.0;glFragData[3]=normPos.z>=nearPlane+3.0*stepSize && normPos.z<nearPlane+4.0*stepSize ? 1.0 : 0.0;
#if MAX_DRAW_BUFFERS>4
glFragData[4]=normPos.z>=nearPlane+4.0*stepSize && normPos.z<nearPlane+5.0*stepSize ? 1.0 : 0.0;glFragData[5]=normPos.z>=nearPlane+5.0*stepSize && normPos.z<nearPlane+6.0*stepSize ? 1.0 : 0.0;
#if MAX_DRAW_BUFFERS>6
glFragData[6]=normPos.z>=nearPlane+6.0*stepSize && normPos.z<nearPlane+7.0*stepSize ? 1.0 : 0.0;glFragData[7]=normPos.z>=nearPlane+7.0*stepSize && normPos.z<nearPlane+8.0*stepSize ? 1.0 : 0.0;
#endif
#endif
}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["gaussianSplattingVoxelPixelShader",0,{name:r,shader:i}])},62766,e=>{"use strict";var t=e.i(263537);let r="screenSpaceRayTrace",i=`float distanceSquared(vec2 a,vec2 b) { a-=b; return dot(a,a); }
#ifdef SSRAYTRACE_SCREENSPACE_DEPTH
float linearizeDepth(float depth,float near,float far) {
#ifdef SSRAYTRACE_RIGHT_HANDED_SCENE
return -(near*far)/(far-depth*(far-near));
#else
return (near*far)/(far-depth*(far-near));
#endif
}
#endif
/**
param csOrigin Camera-space ray origin,which must be 
within the view volume and must have z>0.01 and project within the valid screen rectangle
param csDirection Unit length camera-space ray direction
param projectToPixelMatrix A projection matrix that maps to **pixel** coordinates 
(**not** [-1,+1] normalized device coordinates).
param csZBuffer The camera-space Z buffer
param csZBufferSize Dimensions of csZBuffer
param csZThickness Camera space csZThickness to ascribe to each pixel in the depth buffer
param nearPlaneZ Positive number. Doesn't have to be THE actual near plane,just a reasonable value
for clipping rays headed towards the camera
param stride Step in horizontal or vertical pixels between samples. This is a float
because integer math is slow on GPUs,but should be set to an integer>=1
param jitterFraction Number between 0 and 1 for how far to bump the ray in stride units
to conceal banding artifacts,plus the stride ray offset.
param maxSteps Maximum number of iterations. Higher gives better images but may be slow
param maxRayTraceDistance Maximum camera-space distance to trace before returning a miss
param selfCollisionNumSkip Number of steps to skip at start when raytracing to avoid self collisions.
1 is a reasonable value,depending on the scene you may need to set this value to 2
param hitPixel Pixel coordinates of the first intersection with the scene
param numIterations number of iterations performed
param csHitPoint Camera space location of the ray hit
*/
#define inline
bool traceScreenSpaceRay1(
vec3 csOrigin,
vec3 csDirection,
mat4 projectToPixelMatrix,
sampler2D csZBuffer,
vec2 csZBufferSize,
#ifdef SSRAYTRACE_USE_BACK_DEPTHBUFFER
sampler2D csZBackBuffer,
float csZBackSizeFactor,
#endif
float csZThickness,
float nearPlaneZ,
float farPlaneZ,
float stride,
float jitterFraction,
float maxSteps,
float maxRayTraceDistance,
float selfCollisionNumSkip,
out vec2 startPixel,
out vec2 hitPixel,
out vec3 csHitPoint,
out float numIterations
#ifdef SSRAYTRACE_DEBUG
,out vec3 debugColor
#endif
)
{
#ifdef SSRAYTRACE_RIGHT_HANDED_SCENE
float rayLength=(csOrigin.z+csDirection.z*maxRayTraceDistance)>-nearPlaneZ ? (-nearPlaneZ-csOrigin.z)/csDirection.z : maxRayTraceDistance;
#else
float rayLength=(csOrigin.z+csDirection.z*maxRayTraceDistance)<nearPlaneZ ? (nearPlaneZ-csOrigin.z)/csDirection.z : maxRayTraceDistance;
#endif
vec3 csEndPoint=csOrigin+csDirection*rayLength;hitPixel=vec2(-1.0,-1.0);vec4 H0=projectToPixelMatrix*vec4(csOrigin,1.0);vec4 H1=projectToPixelMatrix*vec4(csEndPoint,1.0);float k0=1.0/H0.w;float k1=1.0/H1.w;vec3 Q0=csOrigin*k0;vec3 Q1=csEndPoint*k1;vec2 P0=H0.xy*k0;vec2 P1=H1.xy*k1;
#ifdef SSRAYTRACE_CLIP_TO_FRUSTUM
float xMax=csZBufferSize.x-0.5,xMin=0.5,yMax=csZBufferSize.y-0.5,yMin=0.5;float alpha=0.0;if ((P1.y>yMax) || (P1.y<yMin)) {alpha=(P1.y-((P1.y>yMax) ? yMax : yMin))/(P1.y-P0.y);}
if ((P1.x>xMax) || (P1.x<xMin)) {alpha=max(alpha,(P1.x-((P1.x>xMax) ? xMax : xMin))/(P1.x-P0.x));}
P1=mix(P1,P0,alpha); k1=mix(k1,k0,alpha); Q1=mix(Q1,Q0,alpha);
#endif
P1+=vec2((distanceSquared(P0,P1)<0.0001) ? 0.01 : 0.0);vec2 delta=P1-P0;bool permute=false;if (abs(delta.x)<abs(delta.y)) { 
permute=true;delta=delta.yx;P0=P0.yx;P1=P1.yx; }
float stepDirection=sign(delta.x);float invdx=stepDirection/delta.x;vec2 dP=vec2(stepDirection,delta.y*invdx);vec3 dQ=(Q1-Q0)*invdx;float dk=(k1-k0)*invdx;float zMin=min(csEndPoint.z,csOrigin.z);float zMax=max(csEndPoint.z,csOrigin.z);dP*=stride; dQ*=stride; dk*=stride;P0+=dP*jitterFraction; Q0+=dQ*jitterFraction; k0+=dk*jitterFraction;vec4 pqk=vec4(P0,Q0.z,k0);vec4 dPQK=vec4(dP,dQ.z,dk);startPixel=permute ? P0.yx : P0.xy;float prevZMaxEstimate=csOrigin.z;float rayZMin=prevZMaxEstimate,rayZMax=prevZMaxEstimate;float sceneZMax=rayZMax+1e4;float end=P1.x*stepDirection;bool hit=false;float stepCount;for (stepCount=0.0;stepCount<=selfCollisionNumSkip ||
(pqk.x*stepDirection)<=end &&
stepCount<maxSteps &&
!hit; 
pqk+=dPQK,++stepCount)
{hitPixel=permute ? pqk.yx : pqk.xy;
#ifndef SSRAYTRACE_CLIP_TO_FRUSTUM
if (hitPixel.x<0.0 || hitPixel.x>=csZBufferSize.x ||
hitPixel.y<0.0 || hitPixel.y>=csZBufferSize.y) break;
#endif
rayZMin=prevZMaxEstimate;rayZMax=(dPQK.z*0.5+pqk.z)/(dPQK.w*0.5+pqk.w);rayZMax=clamp(rayZMax,zMin,zMax);prevZMaxEstimate=rayZMax;
#ifdef SSRAYTRACE_RIGHT_HANDED_SCENE
if (prevZMaxEstimate<-farPlaneZ) break;
#else
if (prevZMaxEstimate>farPlaneZ) break;
#endif
if (rayZMin>rayZMax) { 
float t=rayZMin; rayZMin=rayZMax; rayZMax=t;}
sceneZMax=texelFetch(csZBuffer,ivec2(hitPixel),0).r;
#ifdef SSRAYTRACE_SCREENSPACE_DEPTH
sceneZMax=linearizeDepth(sceneZMax,nearPlaneZ,farPlaneZ);
#endif
if (sceneZMax==0.0) sceneZMax=1e8;
#ifdef SSRAYTRACE_RIGHT_HANDED_SCENE
#ifdef SSRAYTRACE_USE_BACK_DEPTHBUFFER
float sceneBackZ=texelFetch(csZBackBuffer,ivec2(hitPixel/csZBackSizeFactor),0).r;
#ifdef SSRAYTRACE_SCREENSPACE_DEPTH
sceneBackZ=linearizeDepth(sceneBackZ,nearPlaneZ,farPlaneZ);
#endif
if (sceneBackZ==0.0) sceneBackZ=-1e8;hit=(rayZMax>=sceneBackZ-csZThickness) && (rayZMin<=sceneZMax);
#else
hit=(rayZMax>=sceneZMax-csZThickness) && (rayZMin<=sceneZMax);
#endif
#else
#ifdef SSRAYTRACE_USE_BACK_DEPTHBUFFER
float sceneBackZ=texelFetch(csZBackBuffer,ivec2(hitPixel/csZBackSizeFactor),0).r;
#ifdef SSRAYTRACE_SCREENSPACE_DEPTH
sceneBackZ=linearizeDepth(sceneBackZ,nearPlaneZ,farPlaneZ);
#endif
if (sceneBackZ==0.0) sceneBackZ=1e8;hit=(rayZMin<=sceneBackZ+csZThickness) && (rayZMax>=sceneZMax);
#else
hit=(rayZMin<=sceneZMax+csZThickness) && (rayZMax>=sceneZMax);
#endif
#endif
}
pqk-=dPQK;stepCount-=1.0;if (((pqk.x+dPQK.x)*stepDirection)>end || (stepCount+1.0)>=maxSteps) {hit=false;}
#ifdef SSRAYTRACE_ENABLE_REFINEMENT
if (stride>1.0 && hit) {pqk-=dPQK;stepCount-=1.0;float invStride=1.0/stride;dPQK*=invStride;float refinementStepCount=0.0;prevZMaxEstimate=pqk.z/pqk.w;rayZMax=prevZMaxEstimate;sceneZMax=rayZMax+1e7;for (;refinementStepCount<=1.0 ||
(refinementStepCount<=stride*1.4) &&
(rayZMax<sceneZMax);pqk+=dPQK,refinementStepCount+=1.0)
{rayZMin=prevZMaxEstimate;rayZMax=(dPQK.z*0.5+pqk.z)/(dPQK.w*0.5+pqk.w);rayZMax=clamp(rayZMax,zMin,zMax);prevZMaxEstimate=rayZMax;rayZMax=max(rayZMax,rayZMin);hitPixel=permute ? pqk.yx : pqk.xy;sceneZMax=texelFetch(csZBuffer,ivec2(hitPixel),0).r;
#ifdef SSRAYTRACE_SCREENSPACE_DEPTH
sceneZMax=linearizeDepth(sceneZMax,nearPlaneZ,farPlaneZ);
#endif
if (sceneZMax==0.0) sceneZMax=1e8;}
pqk-=dPQK;refinementStepCount-=1.0;stepCount+=refinementStepCount/stride;}
#endif
Q0.xy+=dQ.xy*stepCount;Q0.z=pqk.z;csHitPoint=Q0/pqk.w;numIterations=stepCount+1.0;
#ifdef SSRAYTRACE_DEBUG
if (((pqk.x+dPQK.x)*stepDirection)>end) {debugColor=vec3(0,0,1);} else if ((stepCount+1.0)>=maxSteps) {debugColor=vec3(1,0,0);} else if (!hit) {debugColor=vec3(1,1,0);} else {debugColor=vec3(0,stepCount/maxSteps,0);}
#endif
return hit;}
/**
texCoord: in the [0,1] range
depth: depth in view space (range [znear,zfar]])
*/
vec3 computeViewPosFromUVDepth(vec2 texCoord,float depth,mat4 projection,mat4 invProjectionMatrix) {vec4 ndc;ndc.xy=texCoord*2.0-1.0;
#ifdef SSRAYTRACE_RIGHT_HANDED_SCENE
#ifdef ORTHOGRAPHIC_CAMERA
ndc.z=-projection[2].z*depth+projection[3].z;
#else
ndc.z=-projection[2].z-projection[3].z/depth;
#endif
#else
#ifdef ORTHOGRAPHIC_CAMERA
ndc.z=projection[2].z*depth+projection[3].z;
#else
ndc.z=projection[2].z+projection[3].z/depth;
#endif
#endif
ndc.w=1.0;vec4 eyePos=invProjectionMatrix*ndc;eyePos.xyz/=eyePos.w;return eyePos.xyz;}
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.s([])},354355,e=>{"use strict";var t=e.i(263537);e.i(201632),e.i(424192),e.i(62766);let r="screenSpaceReflection2BlurCombinerPixelShader",i=`uniform sampler2D textureSampler; 
uniform sampler2D mainSampler;uniform sampler2D reflectivitySampler;uniform float strength;uniform float reflectionSpecularFalloffExponent;uniform float reflectivityThreshold;varying vec2 vUV;
#include<helperFunctions>
#ifdef SSR_BLEND_WITH_FRESNEL
#include<pbrBRDFFunctions>
#include<screenSpaceRayTrace>
uniform mat4 projection;uniform mat4 invProjectionMatrix;
#ifdef SSR_NORMAL_IS_IN_WORLDSPACE
uniform mat4 view;
#endif
uniform sampler2D normalSampler;uniform sampler2D depthSampler;
#ifdef SSRAYTRACE_SCREENSPACE_DEPTH
uniform float nearPlaneZ;uniform float farPlaneZ;
#endif
#endif
void main()
{
#ifdef SSRAYTRACE_DEBUG
gl_FragColor=texture2D(textureSampler,vUV);
#else
vec3 SSR=texture2D(textureSampler,vUV).rgb;vec4 color=texture2D(mainSampler,vUV);vec4 reflectivity=texture2D(reflectivitySampler,vUV);
#ifndef SSR_DISABLE_REFLECTIVITY_TEST
if (max(reflectivity.r,max(reflectivity.g,reflectivity.b))<=reflectivityThreshold) {gl_FragColor=color;return;}
#endif
#ifdef SSR_INPUT_IS_GAMMA_SPACE
color=toLinearSpace(color);
#endif
#ifdef SSR_BLEND_WITH_FRESNEL
vec2 texSize=vec2(textureSize(depthSampler,0));vec3 csNormal=texelFetch(normalSampler,ivec2(vUV*texSize),0).xyz;
#ifdef SSR_DECODE_NORMAL
csNormal=csNormal*2.0-1.0;
#endif
#ifdef SSR_NORMAL_IS_IN_WORLDSPACE
csNormal=(view*vec4(csNormal,0.0)).xyz;
#endif
float depth=texelFetch(depthSampler,ivec2(vUV*texSize),0).r;
#ifdef SSRAYTRACE_SCREENSPACE_DEPTH
depth=linearizeDepth(depth,nearPlaneZ,farPlaneZ);
#endif
vec3 csPosition=computeViewPosFromUVDepth(vUV,depth,projection,invProjectionMatrix);vec3 csViewDirection=normalize(csPosition);vec3 F0=reflectivity.rgb;vec3 fresnel=fresnelSchlickGGX(max(dot(csNormal,-csViewDirection),0.0),F0,vec3(1.));vec3 reflectionMultiplier=clamp(pow(fresnel*strength,vec3(reflectionSpecularFalloffExponent)),0.0,1.0);
#else
vec3 reflectionMultiplier=clamp(pow(reflectivity.rgb*strength,vec3(reflectionSpecularFalloffExponent)),0.0,1.0);
#endif
vec3 colorMultiplier=1.0-reflectionMultiplier;vec3 finalColor=(color.rgb*colorMultiplier)+(SSR*reflectionMultiplier);
#ifdef SSR_OUTPUT_IS_GAMMA_SPACE
finalColor=toGammaSpace(finalColor);
#endif
gl_FragColor=vec4(finalColor,color.a);
#endif
}
`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["screenSpaceReflection2BlurCombinerPixelShader",0,{name:r,shader:i}])},463389,e=>{"use strict";var t=e.i(263537);e.i(407892),e.i(380244),e.i(585817),e.i(945868),e.i(13486),e.i(243400),e.i(349e3),e.i(244222),e.i(988389),e.i(431235),e.i(300889),e.i(398879),e.i(92372),e.i(84318),e.i(874826);let r="geometryVertexShader",i=`#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]
#include<instancesDeclaration>
#include<sceneUboDeclaration>
#include<clipPlaneVertexDeclaration>
#ifdef IRRADIANCE
#ifdef REFLECTION
uniform reflectionMatrix: mat4x4f;uniform vReflectionInfos: vec2f;uniform vReflectionColor: vec3f;
#ifdef USESPHERICALFROMREFLECTIONMAP
varying vEnvironmentIrradiance: vec3f;
#ifdef SPHERICAL_HARMONICS
uniform vSphericalL00: vec3f;uniform vSphericalL1_1: vec3f;uniform vSphericalL10: vec3f;uniform vSphericalL11: vec3f;uniform vSphericalL2_2: vec3f;uniform vSphericalL2_1: vec3f;uniform vSphericalL20: vec3f;uniform vSphericalL21: vec3f;uniform vSphericalL22: vec3f;
#else
uniform vSphericalX: vec3f;uniform vSphericalY: vec3f;uniform vSphericalZ: vec3f;uniform vSphericalXX_ZZ: vec3f;uniform vSphericalYY_ZZ: vec3f;uniform vSphericalZZ: vec3f;uniform vSphericalXY: vec3f;uniform vSphericalYZ: vec3f;uniform vSphericalZX: vec3f;
#endif
#include<harmonicsFunctions>
#endif
#endif
#endif
attribute position : vec3<f32>;
#ifdef HAS_NORMAL_ATTRIBUTE
attribute normal: vec3f;
#endif
#ifdef NEED_UV
varying vUV: vec2f;
#ifdef ALPHATEST
uniform diffuseMatrix: mat4x4f;
#endif
#ifdef BUMP
uniform bumpMatrix: mat4x4f;varying vBumpUV: vec2f;
#endif
#ifdef REFLECTIVITY
uniform reflectivityMatrix: mat4x4f;uniform albedoMatrix: mat4x4f;varying vReflectivityUV: vec2f;varying vAlbedoUV: vec2f;
#endif
#ifdef METALLIC_TEXTURE
varying vMetallicUV: vec2f;uniform metallicMatrix: mat4x4f;
#endif
#ifdef ROUGHNESS_TEXTURE
varying vRoughnessUV: vec2f;uniform roughnessMatrix: mat4x4f;
#endif
#ifdef SUBSURFACE_WEIGHT
varying vSubsurfaceWeightUV: vec2f;uniform subsurfaceWeightMatrix: mat4x4f;
#endif
#ifdef TRANSMISSION_WEIGHT
varying vTransmissionWeightUV: vec2f;uniform transmissionWeightMatrix: mat4x4f;
#endif
#ifdef UV1
attribute uv: vec2f;
#endif
#ifdef UV2
attribute uv2: vec2f;
#endif
#endif
#ifdef BUMP
varying vWorldView0: vec4f;varying vWorldView1: vec4f;varying vWorldView2: vec4f;varying vWorldView3: vec4f;
#endif
#ifdef BUMP
varying vNormalW: vec3f;
#else
varying vNormalV: vec3f;
#endif
varying vViewPos: vec4f;
#if defined(POSITION) || defined(BUMP) || defined(IRRADIANCE)
varying vPositionW: vec3f;
#endif
#if defined(VELOCITY) || defined(VELOCITY_LINEAR)
uniform previousViewProjection: mat4x4f;varying vCurrentPosition: vec4f;varying vPreviousPosition: vec4f;
#endif
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input : VertexInputs)->FragmentInputs {var positionUpdated: vec3f=vertexInputs.position;
#ifdef HAS_NORMAL_ATTRIBUTE
var normalUpdated: vec3f=vertexInputs.normal;
#else
var normalUpdated: vec3f=vec3f(0.0,0.0,0.0);
#endif
#ifdef UV1
var uvUpdated: vec2f=vertexInputs.uv;
#endif
#ifdef UV2
var uv2Updated: vec2f=vertexInputs.uv2;
#endif
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
#include<instancesVertex>
#if (defined(VELOCITY) || defined(VELOCITY_LINEAR)) && !defined(BONES_VELOCITY_ENABLED)
vCurrentPosition=scene.viewProjection*finalWorld*vec4f(positionUpdated,1.0);vPreviousPosition=uniforms.previousViewProjection*finalPreviousWorld* vec4f(positionUpdated,1.0);
#endif
#include<bonesVertex>
#include<bakedVertexAnimation>
var worldPos: vec4f= vec4f(finalWorld* vec4f(positionUpdated,1.0));
#ifdef BUMP
let vWorldView=scene.view*finalWorld;vertexOutputs.vWorldView0=vWorldView[0];vertexOutputs.vWorldView1=vWorldView[1];vertexOutputs.vWorldView2=vWorldView[2];vertexOutputs.vWorldView3=vWorldView[3];let normalWorld: mat3x3f= mat3x3f(finalWorld[0].xyz,finalWorld[1].xyz,finalWorld[2].xyz);vertexOutputs.vNormalW=normalize(normalWorld*normalUpdated);
#else
#ifdef NORMAL_WORLDSPACE
vertexOutputs.vNormalV=normalize((finalWorld* vec4f(normalUpdated,0.0)).xyz);
#else
vertexOutputs.vNormalV=normalize(((scene.view*finalWorld)* vec4f(normalUpdated,0.0)).xyz);
#endif
#endif
vertexOutputs.vViewPos=scene.view*worldPos;
#if (defined(VELOCITY) || defined(VELOCITY_LINEAR)) && defined(BONES_VELOCITY_ENABLED)
vertexOutputs.vCurrentPosition=scene.viewProjection*finalWorld* vec4f(positionUpdated,1.0);
#if NUM_BONE_INFLUENCERS>0
var previousInfluence: mat4x4f;previousInfluence=uniforms.mPreviousBones[ i32(vertexInputs.matricesIndices[0])]*vertexInputs.matricesWeights[0];
#if NUM_BONE_INFLUENCERS>1
previousInfluence+=uniforms.mPreviousBones[ i32(vertexInputs.matricesIndices[1])]*vertexInputs.matricesWeights[1];
#endif
#if NUM_BONE_INFLUENCERS>2
previousInfluence+=uniforms.mPreviousBones[ i32(vertexInputs.matricesIndices[2])]*vertexInputs.matricesWeights[2];
#endif
#if NUM_BONE_INFLUENCERS>3
previousInfluence+=uniforms.mPreviousBones[ i32(vertexInputs.matricesIndices[3])]*vertexInputs.matricesWeights[3];
#endif
#if NUM_BONE_INFLUENCERS>4
previousInfluence+=uniforms.mPreviousBones[ i32(vertexInputs.matricesIndicesExtra[0])]*vertexInputs.matricesWeightsExtra[0];
#endif
#if NUM_BONE_INFLUENCERS>5
previousInfluence+=uniforms.mPreviousBones[ i32(vertexInputs.matricesIndicesExtra[1])]*vertexInputs.matricesWeightsExtra[1];
#endif
#if NUM_BONE_INFLUENCERS>6
previousInfluence+=uniforms.mPreviousBones[ i32(vertexInputs.matricesIndicesExtra[2])]*vertexInputs.matricesWeightsExtra[2];
#endif
#if NUM_BONE_INFLUENCERS>7
previousInfluence+=uniforms.mPreviousBones[ i32(vertexInputs.matricesIndicesExtra[3])]*vertexInputs.matricesWeightsExtra[3];
#endif
vertexOutputs.vPreviousPosition=uniforms.previousViewProjection*finalPreviousWorld*previousInfluence* vec4f(positionUpdated,1.0);
#else
vertexOutputs.vPreviousPosition=uniforms.previousViewProjection*finalPreviousWorld* vec4f(positionUpdated,1.0);
#endif
#endif
#if defined(POSITION) || defined(BUMP) || defined(IRRADIANCE)
vertexOutputs.vPositionW=worldPos.xyz/worldPos.w;
#endif
vertexOutputs.position=scene.viewProjection*finalWorld* vec4f(positionUpdated,1.0);
#include<clipPlaneVertex>
#ifdef NEED_UV
#ifdef UV1
#if defined(ALPHATEST) && defined(ALPHATEST_UV1)
vertexOutputs.vUV=(uniforms.diffuseMatrix* vec4f(uvUpdated,1.0,0.0)).xy;
#else
vertexOutputs.vUV=uvUpdated;
#endif
#ifdef BUMP_UV1
vertexOutputs.vBumpUV=(uniforms.bumpMatrix* vec4f(uvUpdated,1.0,0.0)).xy;
#endif
#ifdef REFLECTIVITY_UV1
vertexOutputs.vReflectivityUV=(uniforms.reflectivityMatrix* vec4f(uvUpdated,1.0,0.0)).xy;
#else
#ifdef METALLIC_UV1
vertexOutputs.vMetallicUV=(uniforms.metallicMatrix* vec4f(uvUpdated,1.0,0.0)).xy;
#endif
#ifdef ROUGHNESS_UV1
vertexOutputs.vRoughnessUV=(uniforms.roughnessMatrix* vec4f(uvUpdated,1.0,0.0)).xy;
#endif
#endif
#ifdef ALBEDO_UV1
vertexOutputs.vAlbedoUV=(uniforms.albedoMatrix* vec4f(uvUpdated,1.0,0.0)).xy;
#endif
#ifdef SUBSURFACE_WEIGHT_UV1
vertexOutputs.vSubsurfaceWeightUV=(uniforms.subsurfaceWeightMatrix* vec4f(uvUpdated,1.0,0.0)).xy;
#endif
#ifdef TRANSMISSION_WEIGHT_UV1
vertexOutputs.vTransmissionWeightUV=(uniforms.transmissionWeightMatrix* vec4f(uvUpdated,1.0,0.0)).xy;
#endif
#endif
#ifdef UV2
#if defined(ALPHATEST) && defined(ALPHATEST_UV2)
vertexOutputs.vUV=(uniforms.diffuseMatrix* vec4f(uv2Updated,1.0,0.0)).xy;
#else
vertexOutputs.vUV=uv2Updated;
#endif
#ifdef BUMP_UV2
vertexOutputs.vBumpUV=(uniforms.bumpMatrix* vec4f(uv2Updated,1.0,0.0)).xy;
#endif
#ifdef REFLECTIVITY_UV2
vertexOutputs.vReflectivityUV=(uniforms.reflectivityMatrix* vec4f(uv2Updated,1.0,0.0)).xy;
#else
#ifdef METALLIC_UV2
vertexOutputs.vMetallicUV=(uniforms.metallicMatrix* vec4f(uv2Updated,1.0,0.0)).xy;
#endif
#ifdef ROUGHNESS_UV2
vertexOutputs.vRoughnessUV=(uniforms.roughnessMatrix* vec4f(uv2Updated,1.0,0.0)).xy;
#endif
#endif
#ifdef ALBEDO_UV2
vertexOutputs.vAlbedoUV=(uniforms.albedoMatrix* vec4f(uv2Updated,1.0,0.0)).xy;
#endif
#ifdef SUBSURFACE_WEIGHT_UV2
vertexOutputs.vSubsurfaceWeightUV=(uniforms.subsurfaceWeightMatrix* vec4f(uv2Updated,1.0,0.0)).xy;
#endif
#ifdef TRANSMISSION_WEIGHT_UV2
vertexOutputs.vTransmissionWeightUV=(uniforms.transmissionWeightMatrix* vec4f(uv2Updated,1.0,0.0)).xy;
#endif
#endif
#endif
#include<bumpVertex>
#ifdef IRRADIANCE
#ifdef REFLECTION
#ifdef USESPHERICALFROMREFLECTIONMAP
var reflectionVector: vec3f=(uniforms.reflectionMatrix*vec4f(normalUpdated,0.0)).xyz;
#ifdef REFLECTIONMAP_OPPOSITEZ
reflectionVector.z*=-1.0f;
#endif
vertexOutputs.vEnvironmentIrradiance=computeEnvironmentIrradiance(reflectionVector)*uniforms.vReflectionInfos.x;
#endif
#endif
#endif
}
`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["geometryVertexShaderWGSL",0,{name:r,shader:i}])},185200,e=>{"use strict";var t=e.i(353679),r=e.i(916624),i=e.i(774685);class a extends t.FlowGraphExecutionBlockWithOutSignal{constructor(e){super(e),this.config=e,this.object=this.registerDataInput("object",r.RichTypeAny,e.target),this.value=this.registerDataInput("value",r.RichTypeAny),this.propertyName=this.registerDataInput("propertyName",r.RichTypeString,e.propertyName),this.customSetFunction=this.registerDataInput("customSetFunction",r.RichTypeAny)}_execute(e,t){try{let t=this.object.getValue(e),r=this.value.getValue(e),i=this.propertyName.getValue(e);this._stopRunningAnimations(e,t,i);let a=this.customSetFunction.getValue(e);a?a(t,i,r,e):this._setPropertyValue(t,i,r)}catch(t){this._reportError(e,t)}this.out._activateSignal(e)}_stopRunningAnimations(e,t,r){let i=e._getGlobalContextVariable("currentlyRunningAnimationGroups",[]);for(let a of i){let o=e.assetsContext.animationGroups.find(e=>e.uniqueId===a);if(o){for(let n of o.targetedAnimations)if(n.target===t&&n.animation.targetProperty===r){o.stop(!0),o.dispose();let t=i.indexOf(a);-1!==t&&(i.splice(t,1),e._setGlobalContextVariable("currentlyRunningAnimationGroups",i))}}}}_setPropertyValue(e,t,r){let i=t.split("."),a=e;for(let e=0;e<i.length-1;e++){let t=i[e];void 0===a[t]&&(a[t]={}),a=a[t]}a[i[i.length-1]]=r}getClassName(){return"FlowGraphSetPropertyBlock"}}(0,i.RegisterClass)("FlowGraphSetPropertyBlock",a),e.s(["FlowGraphSetPropertyBlock",0,a])},295803,e=>{"use strict";var t=e.i(263537);let r="minmaxReduxPixelShader",i=`varying vUV: vec2f;var textureSampler: texture_2d<f32>;
#if defined(INITIAL)
uniform texSize: vec2f;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {let coord=vec2i(fragmentInputs.vUV*(uniforms.texSize-1.0));let f1=textureLoad(textureSampler,coord,0).r;let f2=textureLoad(textureSampler,coord+vec2i(1,0),0).r;let f3=textureLoad(textureSampler,coord+vec2i(1,1),0).r;let f4=textureLoad(textureSampler,coord+vec2i(0,1),0).r;
#ifdef DEPTH_REDUX
#ifdef VIEW_DEPTH
var minz=3.4e38;if (f1 != 0.0) { minz=f1; }
if (f2 != 0.0) { minz=min(minz,f2); }
if (f3 != 0.0) { minz=min(minz,f3); }
if (f4 != 0.0) { minz=min(minz,f4); }
let maxz=max(max(max(f1,f2),f3),f4);
#else
let minz=min(min(min(f1,f2),f3),f4);let maxz=max(max(max(sign(1.0-f1)*f1,sign(1.0-f2)*f2),sign(1.0-f3)*f3),sign(1.0-f4)*f4);
#endif
#else
let minz=min(min(min(f1,f2),f3),f4);let maxz=max(max(max(f1,f2),f3),f4);
#endif
fragmentOutputs.color=vec4f(minz,maxz,0.,0.);}
#elif defined(MAIN)
uniform texSize: vec2f;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {let coord=vec2i(fragmentInputs.vUV*(uniforms.texSize-1.0));let f1=textureLoad(textureSampler,coord,0).rg;let f2=textureLoad(textureSampler,coord+vec2i(1,0),0).rg;let f3=textureLoad(textureSampler,coord+vec2i(1,1),0).rg;let f4=textureLoad(textureSampler,coord+vec2i(0,1),0).rg;let minz=min(min(min(f1.x,f2.x),f3.x),f4.x);let maxz=max(max(max(f1.y,f2.y),f3.y),f4.y);fragmentOutputs.color=vec4(minz,maxz,0.,0.);}
#elif defined(ONEBEFORELAST)
uniform texSize: vec2i;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {let coord=vec2i(fragmentInputs.vUV*vec2f(uniforms.texSize-1));let f1=textureLoad(textureSampler,coord % uniforms.texSize,0).rg;let f2=textureLoad(textureSampler,(coord+vec2i(1,0)) % uniforms.texSize,0).rg;let f3=textureLoad(textureSampler,(coord+vec2i(1,1)) % uniforms.texSize,0).rg;let f4=textureLoad(textureSampler,(coord+vec2i(0,1)) % uniforms.texSize,0).rg;let minz=min(min(min(f1.x,f2.x),f3.x),f4.x);let maxz=max(max(max(f1.y,f2.y),f3.y),f4.y);fragmentOutputs.color=vec4(minz,maxz,0.,0.);}
#elif defined(LAST)
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {fragmentOutputs.color=vec4f(0.);if (true) { 
discard;}}
#endif
`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["minmaxReduxPixelShaderWGSL",0,{name:r,shader:i}])},675665,e=>{"use strict";var t=e.i(353679),r=e.i(916624),i=e.i(774685);class a extends t.FlowGraphExecutionBlockWithOutSignal{constructor(e){super(e),this.sound=this.registerDataInput("sound",r.RichTypeAny),this.volume=this.registerDataInput("volume",r.RichTypeNumber,1)}_execute(e,t){let r=this.sound.getValue(e);if(!r){this._reportError(e,"No sound provided"),this.out._activateSignal(e);return}r.volume=this.volume.getValue(e),this.out._activateSignal(e)}getClassName(){return"FlowGraphSetSoundVolumeBlock"}}(0,i.RegisterClass)("FlowGraphSetSoundVolumeBlock",a),e.s(["FlowGraphSetSoundVolumeBlock",0,a])},176372,e=>{"use strict";var t=e.i(263537);let r="vrDistortionCorrectionPixelShader",i=`varying vec2 vUV;uniform sampler2D textureSampler;uniform vec2 LensCenter;uniform vec2 Scale;uniform vec2 ScaleIn;uniform vec4 HmdWarpParam;vec2 HmdWarp(vec2 in01) {vec2 theta=(in01-LensCenter)*ScaleIn; 
float rSq=theta.x*theta.x+theta.y*theta.y;vec2 rvector=theta*(HmdWarpParam.x+HmdWarpParam.y*rSq+HmdWarpParam.z*rSq*rSq+HmdWarpParam.w*rSq*rSq*rSq);return LensCenter+Scale*rvector;}
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void)
{vec2 tc=HmdWarp(vUV);if (tc.x <0.0 || tc.x>1.0 || tc.y<0.0 || tc.y>1.0)
gl_FragColor=vec4(0.0,0.0,0.0,0.0);else{gl_FragColor=texture2D(textureSampler,tc);}}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["vrDistortionCorrectionPixelShader",0,{name:r,shader:i}])},755610,e=>{"use strict";var t=e.i(263537);let r="glowMapMergePixelShader",i=`varying vec2 vUV;uniform sampler2D textureSampler;
#ifdef EMISSIVE
uniform sampler2D textureSampler2;
#endif
uniform float offset;
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
vec4 baseColor=texture2D(textureSampler,vUV);
#ifdef EMISSIVE
baseColor+=texture2D(textureSampler2,vUV);baseColor*=offset;
#else
baseColor.a=abs(offset-baseColor.a);
#ifdef STROKE
float alpha=smoothstep(.0,.1,baseColor.a);baseColor.a=alpha;baseColor.rgb=baseColor.rgb*alpha;
#endif
#endif
#if LDR
baseColor=clamp(baseColor,0.,1.0);
#endif
gl_FragColor=baseColor;
#define CUSTOM_FRAGMENT_MAIN_END
}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["glowMapMergePixelShader",0,{name:r,shader:i}])},631981,e=>{"use strict";var t=e.i(440163),r=e.i(916624);class i extends t.FlowGraphBlock{constructor(e){super(e),this.config=e,this.executionFunction=this.registerDataInput("function",r.RichTypeAny),this.value=this.registerDataInput("value",r.RichTypeAny),this.result=this.registerDataOutput("result",r.RichTypeAny)}_updateOutputs(e){let t=this.executionFunction.getValue(e),r=this.value.getValue(e);t&&this.result.setValue(t(r,e),e)}getClassName(){return"FlowGraphCodeExecutionBlock"}}e.s(["FlowGraphCodeExecutionBlock",0,i])},209230,e=>{"use strict";var t=e.i(263537);let r="backgroundVertexDeclaration",i=`uniform mat4 view;uniform mat4 viewProjection;
#ifdef MULTIVIEW
uniform mat4 viewProjectionR;
#endif
uniform float shadowLevel;
#ifdef DIFFUSE
uniform mat4 diffuseMatrix;uniform vec2 vDiffuseInfos;
#endif
#ifdef REFLECTION
uniform vec2 vReflectionInfos;uniform mat4 reflectionMatrix;uniform vec3 vReflectionMicrosurfaceInfos;uniform float fFovMultiplier;
#endif
#ifdef POINTSIZE
uniform float pointSize;
#endif
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.i(932361),e.i(201632),e.i(624154),e.i(568039),e.i(880779),e.i(182478),e.i(30653),e.i(957479),e.i(889952),e.i(127010),e.i(587630),e.i(761523),e.i(479126),e.i(781801),e.i(313976),e.i(294715),e.i(94556);let a="backgroundVertexShader",o=`precision highp float;
#include<__decl__backgroundVertex>
#include<helperFunctions>
attribute vec3 position;
#ifdef NORMAL
attribute vec3 normal;
#endif
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<instancesDeclaration>
varying vec3 vPositionW;
#ifdef NORMAL
varying vec3 vNormalW;
#endif
#ifdef UV1
attribute vec2 uv;
#endif
#ifdef UV2
attribute vec2 uv2;
#endif
#ifdef MAINUV1
varying vec2 vMainUV1;
#endif
#ifdef MAINUV2
varying vec2 vMainUV2;
#endif
#if defined(DIFFUSE) && DIFFUSEDIRECTUV==0
varying vec2 vDiffuseUV;
#endif
#include<clipPlaneVertexDeclaration>
#include<fogVertexDeclaration>
#include<__decl__lightVxFragment>[0..maxSimultaneousLights]
#ifdef REFLECTIONMAP_SKYBOX
varying vec3 vPositionUVW;
#endif
#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)
varying vec3 vDirectionW;
#endif
#include<logDepthDeclaration>
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
#ifdef REFLECTIONMAP_SKYBOX
vPositionUVW=position;
#endif
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
#ifdef MULTIVIEW
if (gl_ViewID_OVR==0u) {gl_Position=viewProjection*finalWorld*vec4(position,1.0);} else {gl_Position=viewProjectionR*finalWorld*vec4(position,1.0);}
#else
gl_Position=viewProjection*finalWorld*vec4(position,1.0);
#endif
vec4 worldPos=finalWorld*vec4(position,1.0);vPositionW=vec3(worldPos);
#ifdef NORMAL
mat3 normalWorld=mat3(finalWorld);
#ifdef NONUNIFORMSCALING
normalWorld=transposeMat3(inverseMat3(normalWorld));
#endif
vNormalW=normalize(normalWorld*normal);
#endif
#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)
vDirectionW=normalize(vec3(finalWorld*vec4(position,0.0)));
#ifdef EQUIRECTANGULAR_RELFECTION_FOV
mat3 screenToWorld=inverseMat3(mat3(finalWorld*viewProjection));vec3 segment=mix(vDirectionW,screenToWorld*vec3(0.0,0.0,1.0),abs(fFovMultiplier-1.0));if (fFovMultiplier<=1.0) {vDirectionW=normalize(segment);} else {vDirectionW=normalize(vDirectionW+(vDirectionW-segment));}
#endif
#endif
#ifndef UV1
vec2 uv=vec2(0.,0.);
#endif
#ifndef UV2
vec2 uv2=vec2(0.,0.);
#endif
#ifdef MAINUV1
vMainUV1=uv;
#endif
#ifdef MAINUV2
vMainUV2=uv2;
#endif
#if defined(DIFFUSE) && DIFFUSEDIRECTUV==0
if (vDiffuseInfos.x==0.)
{vDiffuseUV=vec2(diffuseMatrix*vec4(uv,1.0,0.0));}
else
{vDiffuseUV=vec2(diffuseMatrix*vec4(uv2,1.0,0.0));}
#endif
#include<clipPlaneVertex>
#include<fogVertex>
#include<shadowsVertex>[0..maxSimultaneousLights]
#ifdef VERTEXCOLOR
vColor=colorUpdated;
#endif
#if defined(POINTSIZE) && !defined(WEBGPU)
gl_PointSize=pointSize;
#endif
#include<logDepthVertex>
#define CUSTOM_VERTEX_MAIN_END
}
`;t.ShaderStore.ShadersStore[a]||(t.ShaderStore.ShadersStore[a]=o),e.s(["backgroundVertexShader",0,{name:a,shader:o}],209230)},925823,e=>{"use strict";var t=e.i(263537);let r="shadowMapFragment",i=`float depthSM=vDepthMetricSM;
#if defined(SM_DEPTHCLAMP) && SM_DEPTHCLAMP==1
#if SM_USEDISTANCE==1
depthSM=(length(vPositionWSM-lightDataSM)+depthValuesSM.x)/depthValuesSM.y+biasAndScaleSM.x;
#else
#ifdef USE_REVERSE_DEPTHBUFFER
depthSM=(-zSM+depthValuesSM.x)/depthValuesSM.y+biasAndScaleSM.x;
#else
depthSM=(zSM+depthValuesSM.x)/depthValuesSM.y+biasAndScaleSM.x;
#endif
#endif
depthSM=clamp(depthSM,0.0,1.0);
#ifdef USE_REVERSE_DEPTHBUFFER
gl_FragDepth=clamp(1.0-depthSM,0.0,1.0);
#else
gl_FragDepth=clamp(depthSM,0.0,1.0); 
#endif
#elif SM_USEDISTANCE==1
depthSM=(length(vPositionWSM-lightDataSM)+depthValuesSM.x)/depthValuesSM.y+biasAndScaleSM.x;
#endif
#if SM_ESM==1
depthSM=clamp(exp(-min(87.,biasAndScaleSM.z*depthSM)),0.,1.);
#endif
#if SM_FLOAT==1
gl_FragColor=vec4(depthSM,1.0,1.0,1.0);
#else
gl_FragColor=pack(depthSM);
#endif
return;`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.s(["shadowMapFragment",0,{name:r,shader:i}])},611061,e=>{"use strict";var t=e.i(263537);e.i(346145);let r="bayerDitherFunctions",i=`float bayerDither2(vec2 _P) {return mod(2.0*_P.y+_P.x+1.0,4.0);}
float bayerDither4(vec2 _P) {vec2 P1=mod(_P,2.0); 
vec2 P2=floor(0.5*mod(_P,4.0)); 
return 4.0*bayerDither2(P1)+bayerDither2(P2);}
float bayerDither8(vec2 _P) {vec2 P1=mod(_P,2.0); 
vec2 P2=floor(0.5 *mod(_P,4.0)); 
vec2 P4=floor(0.25*mod(_P,8.0)); 
return 4.0*(4.0*bayerDither2(P1)+bayerDither2(P2))+bayerDither2(P4);}
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i);let a="shadowMapFragmentExtraDeclaration",o=`#if SM_FLOAT==0
#include<packingFunctions>
#endif
#if SM_SOFTTRANSPARENTSHADOW==1
#include<bayerDitherFunctions>
uniform vec2 softTransparentShadowSM;
#endif
varying float vDepthMetricSM;
#if SM_USEDISTANCE==1
uniform vec3 lightDataSM;varying vec3 vPositionWSM;
#endif
uniform vec3 biasAndScaleSM;uniform vec2 depthValuesSM;
#if defined(SM_DEPTHCLAMP) && SM_DEPTHCLAMP==1
varying float zSM;
#endif
`;t.ShaderStore.IncludesShadersStore[a]||(t.ShaderStore.IncludesShadersStore[a]=o),e.i(261937),e.i(141687),e.i(925823);let n="shadowMapPixelShader",s=`#include<shadowMapFragmentExtraDeclaration>
#ifdef ALPHATEXTURE
varying vec2 vUV;uniform sampler2D diffuseSampler;
#endif
#include<clipPlaneFragmentDeclaration>
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void)
{
#include<clipPlaneFragment>
#ifdef ALPHATEXTURE
vec4 opacityMap=texture2D(diffuseSampler,vUV);float alphaFromAlphaTexture=opacityMap.a;
#if SM_SOFTTRANSPARENTSHADOW==1
if (softTransparentShadowSM.y==1.0) {opacityMap.rgb=opacityMap.rgb*vec3(0.3,0.59,0.11);alphaFromAlphaTexture=opacityMap.x+opacityMap.y+opacityMap.z;}
#endif
#ifdef ALPHATESTVALUE
if (alphaFromAlphaTexture<ALPHATESTVALUE)
discard;
#endif
#endif
#if SM_SOFTTRANSPARENTSHADOW==1
#ifdef ALPHATEXTURE
if ((bayerDither8(floor(mod(gl_FragCoord.xy,8.0))))/64.0>=softTransparentShadowSM.x*alphaFromAlphaTexture) discard;
#else
if ((bayerDither8(floor(mod(gl_FragCoord.xy,8.0))))/64.0>=softTransparentShadowSM.x) discard;
#endif
#endif
#include<shadowMapFragment>
}`;t.ShaderStore.ShadersStore[n]||(t.ShaderStore.ShadersStore[n]=s),e.s(["shadowMapPixelShader",0,{name:n,shader:s}],611061)},252675,e=>{"use strict";var t=e.i(263537);e.i(738124),e.i(590030),e.i(12799);let r="screenSpaceReflection2PixelShader",i=`var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;varying vUV: vec2f;
#ifdef SSR_SUPPORTED
var reflectivitySamplerSampler: sampler;var reflectivitySampler: texture_2d<f32>;var normalSampler: texture_2d<f32>;var depthSampler: texture_2d<f32>;
#ifdef SSRAYTRACE_USE_BACK_DEPTHBUFFER
var backDepthSampler: texture_2d<f32>;uniform backSizeFactor: f32;
#endif
#ifdef SSR_USE_ENVIRONMENT_CUBE
var envCubeSamplerSampler: sampler;var envCubeSampler: texture_cube<f32>;
#ifdef SSR_USE_LOCAL_REFLECTIONMAP_CUBIC
uniform vReflectionPosition: vec3f;uniform vReflectionSize: vec3f;
#endif
#endif
uniform view: mat4x4f;uniform invView: mat4x4f;uniform projection: mat4x4f;uniform invProjectionMatrix: mat4x4f;uniform projectionPixel: mat4x4f;uniform nearPlaneZ: f32;uniform farPlaneZ: f32;uniform stepSize: f32;uniform maxSteps: f32;uniform strength: f32;uniform thickness: f32;uniform roughnessFactor: f32;uniform reflectionSpecularFalloffExponent: f32;uniform maxDistance: f32;uniform selfCollisionNumSkip: f32;uniform reflectivityThreshold: f32;
#include<helperFunctions>
#include<pbrBRDFFunctions>
#include<screenSpaceRayTrace>
fn hash(a: vec3f)->vec3f
{var result=fract(a*0.8);result+=dot(result,result.yxz+19.19);return fract((result.xxy+result.yxx)*result.zyx);}
fn computeAttenuationForIntersection(ihitPixel: vec2f,hitUV: vec2f,vsRayOrigin: vec3f,vsHitPoint: vec3f,reflectionVector: vec3f,maxRayDistance: f32,numIterations: f32)->f32 {var attenuation: f32=1.0;
#ifdef SSR_ATTENUATE_SCREEN_BORDERS
var dCoords: vec2f=smoothstep(vec2f(0.2),vec2f(0.6),abs( vec2f(0.5,0.5)-hitUV.xy));attenuation*=clamp(1.0-(dCoords.x+dCoords.y),0.0,1.0);
#endif
#ifdef SSR_ATTENUATE_INTERSECTION_DISTANCE
attenuation*=1.0-clamp(distance(vsRayOrigin,vsHitPoint)/maxRayDistance,0.0,1.0);
#endif
#ifdef SSR_ATTENUATE_INTERSECTION_NUMITERATIONS
attenuation*=1.0-(numIterations/uniforms.maxSteps);
#endif
#ifdef SSR_ATTENUATE_BACKFACE_REFLECTION
var reflectionNormal: vec3f=texelFetch(normalSampler,hitPixel,0).xyz;var directionBasedAttenuation: f32=smoothstep(-0.17,0.0,dot(reflectionNormal,-reflectionVector));attenuation*=directionBasedAttenuation;
#endif
return attenuation;}
#endif
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {
#ifdef SSR_SUPPORTED
var colorFull: vec4f=textureSampleLevel(textureSampler,textureSamplerSampler,input.vUV,0.0);var color: vec3f=colorFull.rgb;var reflectivity: vec4f=max(textureSampleLevel(reflectivitySampler,reflectivitySamplerSampler,input.vUV,0.0),vec4f(0.0));
#ifndef SSR_DISABLE_REFLECTIVITY_TEST
if (max(reflectivity.r,max(reflectivity.g,reflectivity.b))<=uniforms.reflectivityThreshold) {
#ifdef SSR_USE_BLUR
fragmentOutputs.color= vec4f(0.);
#else
fragmentOutputs.color=colorFull;
#endif
return fragmentOutputs;}
#endif
#ifdef SSR_INPUT_IS_GAMMA_SPACE
color=toLinearSpaceVec3(color);
#endif
var texSize: vec2f= vec2f(textureDimensions(depthSampler,0));var csNormal: vec3f=textureLoad(normalSampler,vec2<i32>(input.vUV*texSize),0).xyz; 
#ifdef SSR_DECODE_NORMAL
csNormal=csNormal*2.0-1.0;
#endif
#ifdef SSR_NORMAL_IS_IN_WORLDSPACE
csNormal=(uniforms.view* vec4f(csNormal,0.0)).xyz;
#endif
var depth: f32=textureLoad(depthSampler,vec2<i32>(input.vUV*texSize),0).r;
#ifdef SSRAYTRACE_SCREENSPACE_DEPTH
depth=linearizeDepth(depth,uniforms.nearPlaneZ,uniforms.farPlaneZ);
#endif
var csPosition: vec3f=computeViewPosFromUVDepth(input.vUV,depth,uniforms.projection,uniforms.invProjectionMatrix);
#ifdef ORTHOGRAPHIC_CAMERA
var csViewDirection: vec3f= vec3f(0.,0.,1.);
#else
var csViewDirection: vec3f=normalize(csPosition);
#endif
var csReflectedVector: vec3f=reflect(csViewDirection,csNormal);
#ifdef SSR_USE_ENVIRONMENT_CUBE
var wReflectedVector: vec3f=(uniforms.invView* vec4f(csReflectedVector,0.0)).xyz;
#ifdef SSR_USE_LOCAL_REFLECTIONMAP_CUBIC
var worldPos: vec4f=uniforms.invView* vec4f(csPosition,1.0);wReflectedVector=parallaxCorrectNormal(worldPos.xyz,normalize(wReflectedVector),uniforms.vReflectionSize,uniforms.vReflectionPosition);
#endif
#ifdef SSR_INVERTCUBICMAP
wReflectedVector.y*=-1.0;
#endif
#ifdef SSRAYTRACE_RIGHT_HANDED_SCENE
wReflectedVector.z*=-1.0;
#endif
var envColor: vec3f=textureSampleLevel(envCubeSampler,envCubeSamplerSampler,wReflectedVector,0.0).xyz;
#ifdef SSR_ENVIRONMENT_CUBE_IS_GAMMASPACE
envColor=toLinearSpaceVec3(envColor);
#endif
#else
var envColor: vec3f=color;
#endif
var reflectionAttenuation: f32=1.0;var rayHasHit: bool=false;var startPixel: vec2f;var hitPixel: vec2f;var hitPoint: vec3f;var numIterations: f32;
#ifdef SSRAYTRACE_DEBUG
var debugColor: vec3f;
#endif
#ifdef SSR_ATTENUATE_FACING_CAMERA
reflectionAttenuation*=1.0-smoothstep(0.25,0.5,dot(-csViewDirection,csReflectedVector));
#endif
if (reflectionAttenuation>0.0) {
#ifdef SSR_USE_BLUR
var jitt: vec3f= vec3f(0.);
#else
var roughness: f32=1.0-reflectivity.a;var jitt: vec3f=mix( vec3f(0.0),hash(csPosition)- vec3f(0.5),roughness)*uniforms.roughnessFactor; 
#endif
var uv2: vec2f=input.vUV*texSize;var c: f32=(uv2.x+uv2.y)*0.25;var jitter: f32=((c)%(1.0)); 
rayHasHit=traceScreenSpaceRay1(
csPosition,
normalize(csReflectedVector+jitt),
uniforms.projectionPixel,
depthSampler,
texSize,
#ifdef SSRAYTRACE_USE_BACK_DEPTHBUFFER
backDepthSampler,
uniforms.backSizeFactor,
#endif
uniforms.thickness,
uniforms.nearPlaneZ,
uniforms.farPlaneZ,
uniforms.stepSize,
jitter,
uniforms.maxSteps,
uniforms.maxDistance,
uniforms.selfCollisionNumSkip,
&startPixel,
&hitPixel,
&hitPoint,
&numIterations
#ifdef SSRAYTRACE_DEBUG
,&debugColor
#endif
);}
#ifdef SSRAYTRACE_DEBUG
fragmentOutputs.color= vec4f(debugColor,1.);return fragmentOutputs;
#endif
var F0: vec3f=reflectivity.rgb;var fresnel: vec3f=fresnelSchlickGGXVec3(max(dot(csNormal,-csViewDirection),0.0),F0, vec3f(1.));var SSR: vec3f=envColor;if (rayHasHit) {var reflectedColor: vec3f=textureLoad(textureSampler,vec2<i32>(hitPixel),0).rgb;
#ifdef SSR_INPUT_IS_GAMMA_SPACE
reflectedColor=toLinearSpaceVec3(reflectedColor);
#endif
reflectionAttenuation*=computeAttenuationForIntersection(hitPixel,hitPixel/texSize,csPosition,hitPoint,csReflectedVector,uniforms.maxDistance,numIterations);SSR=reflectedColor*reflectionAttenuation+(1.0-reflectionAttenuation)*envColor;}
#ifndef SSR_BLEND_WITH_FRESNEL
SSR*=fresnel;
#endif
SSR=clamp(SSR,vec3f(0.0),vec3f(1000.0)); 
#ifdef SSR_USE_BLUR
var blur_radius: f32=0.0;var roughness: f32=1.0-reflectivity.a*(1.0-uniforms.roughnessFactor);if (roughness>0.001) {var cone_angle: f32=min(roughness,0.999)*3.14159265*0.5;var cone_len: f32=distance(startPixel,hitPixel);var op_len: f32=2.0*tan(cone_angle)*cone_len; 
var a: f32=op_len;var h: f32=cone_len;var a2: f32=a*a;var fh2: f32=4.0f*h*h;blur_radius=(a*(sqrt(a2+fh2)-a))/(4.0f*h);}
fragmentOutputs.color= vec4f(SSR,blur_radius/255.0); 
#else
#ifdef SSR_BLEND_WITH_FRESNEL
var reflectionMultiplier: vec3f=clamp(pow(fresnel*uniforms.strength, vec3f(uniforms.reflectionSpecularFalloffExponent)),vec3f(0.0),vec3f(1.0));
#else
var reflectionMultiplier: vec3f=clamp(pow(reflectivity.rgb*uniforms.strength, vec3f(uniforms.reflectionSpecularFalloffExponent)),vec3f(0.0),vec3f(1.0));
#endif
var colorMultiplier: vec3f=1.0-reflectionMultiplier;var finalColor: vec3f=(color*colorMultiplier)+(SSR*reflectionMultiplier);
#ifdef SSR_OUTPUT_IS_GAMMA_SPACE
finalColor=toGammaSpaceVec3(finalColor);
#endif
fragmentOutputs.color= vec4f(finalColor,colorFull.a);
#endif
#else
fragmentOutputs.color=textureSampleLevel(textureSampler,textureSamplerSampler,input.vUV,0.0);
#endif
}
`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["screenSpaceReflection2PixelShaderWGSL",0,{name:r,shader:i}])},873146,e=>{"use strict";var t=e.i(263537);let r="backgroundFragmentDeclaration",i=`uniform vec4 vEyePosition;uniform vec4 vPrimaryColor;
#ifdef USEHIGHLIGHTANDSHADOWCOLORS
uniform vec4 vPrimaryColorShadow;
#endif
uniform float shadowLevel;uniform float alpha;
#ifdef DIFFUSE
uniform vec2 vDiffuseInfos;
#endif
#ifdef REFLECTION
uniform vec2 vReflectionInfos;uniform mat4 reflectionMatrix;uniform vec3 vReflectionMicrosurfaceInfos;
#endif
#if defined(REFLECTIONFRESNEL) || defined(OPACITYFRESNEL)
uniform vec3 vBackgroundCenter;
#endif
#ifdef REFLECTIONFRESNEL
uniform vec4 vReflectionControl;
#endif
#if defined(REFLECTIONMAP_SPHERICAL) || defined(REFLECTIONMAP_PROJECTION) || defined(REFRACTION)
uniform mat4 view;
#endif
#ifdef PROJECTED_GROUND
uniform vec2 projectedGroundInfos;
#endif
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.i(932361),e.i(201632),e.i(534236),e.i(315647),e.i(697427),e.i(10564),e.i(648054),e.i(121541),e.i(310063),e.i(127010),e.i(261937),e.i(190688);let a="intersectionFunctions",o=`float diskIntersectWithBackFaceCulling(vec3 ro,vec3 rd,vec3 c,float r) {float d=rd.y;if(d>0.0) { return 1e6; }
vec3 o=ro-c;float t=-o.y/d;vec3 q=o+rd*t;return (dot(q,q)<r*r) ? t : 1e6;}
vec2 sphereIntersect(vec3 ro,vec3 rd,vec3 ce,float ra) {vec3 oc=ro-ce;float b=dot(oc,rd);float c=dot(oc,oc)-ra*ra;float h=b*b-c;if(h<0.0) { return vec2(-1.0,-1.0); }
h=sqrt(h);return vec2(-b+h,-b-h);}
vec2 sphereIntersectFromOrigin(vec3 ro,vec3 rd,float ra) {float b=dot(ro,rd);float c=dot(ro,ro)-ra*ra;float h=b*b-c;if(h<0.0) { return vec2(-1.0,-1.0); }
h=sqrt(h);return vec2(-b+h,-b-h);}`;t.ShaderStore.IncludesShadersStore[a]||(t.ShaderStore.IncludesShadersStore[a]=o),e.i(141687),e.i(274561),e.i(358759),e.i(313119);let n="backgroundPixelShader",s=`#ifdef TEXTURELODSUPPORT
#extension GL_EXT_shader_texture_lod : enable
#endif
precision highp float;
#include<__decl__backgroundFragment>
#include<helperFunctions>
varying vec3 vPositionW;
#ifdef MAINUV1
varying vec2 vMainUV1;
#endif 
#ifdef MAINUV2 
varying vec2 vMainUV2; 
#endif 
#ifdef NORMAL
varying vec3 vNormalW;
#endif
#ifdef DIFFUSE
#if DIFFUSEDIRECTUV==1
#define vDiffuseUV vMainUV1
#elif DIFFUSEDIRECTUV==2
#define vDiffuseUV vMainUV2
#else
varying vec2 vDiffuseUV;
#endif
uniform sampler2D diffuseSampler;
#endif
#ifdef REFLECTION
#ifdef REFLECTIONMAP_3D
#define sampleReflection(s,c) textureCube(s,c)
uniform samplerCube reflectionSampler;
#ifdef TEXTURELODSUPPORT
#define sampleReflectionLod(s,c,l) textureCubeLodEXT(s,c,l)
#else
uniform samplerCube reflectionSamplerLow;uniform samplerCube reflectionSamplerHigh;
#endif
#else
#define sampleReflection(s,c) texture2D(s,c)
uniform sampler2D reflectionSampler;
#ifdef TEXTURELODSUPPORT
#define sampleReflectionLod(s,c,l) texture2DLodEXT(s,c,l)
#else
uniform samplerCube reflectionSamplerLow;uniform samplerCube reflectionSamplerHigh;
#endif
#endif
#ifdef REFLECTIONMAP_SKYBOX
varying vec3 vPositionUVW;
#else
#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)
varying vec3 vDirectionW;
#endif
#endif
#include<reflectionFunction>
#endif
#ifndef FROMLINEARSPACE
#define FROMLINEARSPACE;
#endif
#ifndef SHADOWONLY
#define SHADOWONLY;
#endif
#include<imageProcessingDeclaration>
#include<__decl__lightFragment>[0..maxSimultaneousLights]
#include<lightsFragmentFunctions>
#include<shadowsFragmentFunctions>
#include<imageProcessingFunctions>
#ifdef LOGARITHMICDEPTH
#extension GL_EXT_frag_depth : enable
#endif
#include<logDepthDeclaration>
#include<clipPlaneFragmentDeclaration>
#include<fogFragmentDeclaration>
#ifdef REFLECTIONFRESNEL
#define FRESNEL_MAXIMUM_ON_ROUGH 0.25
vec3 fresnelSchlickEnvironmentGGX(float VdotN,vec3 reflectance0,vec3 reflectance90,float smoothness)
{float weight=mix(FRESNEL_MAXIMUM_ON_ROUGH,1.0,smoothness);return reflectance0+weight*(reflectance90-reflectance0)*pow5(saturate(1.0-VdotN));}
#endif
#ifdef PROJECTED_GROUND
#include<intersectionFunctions>
vec3 project(vec3 viewDirectionW,vec3 eyePosition) {float radius=projectedGroundInfos.x;float height=projectedGroundInfos.y;vec3 camDir=-viewDirectionW;float skySphereDistance=sphereIntersectFromOrigin(eyePosition,camDir,radius).x;vec3 skySpherePositionW=eyePosition+camDir*skySphereDistance;vec3 p=normalize(skySpherePositionW);eyePosition.y-=height;float sIntersection=sphereIntersectFromOrigin(eyePosition,p,radius).x;vec3 h=vec3(0.0,-height,0.0);float dIntersection=diskIntersectWithBackFaceCulling(eyePosition,p,h,radius);p=(eyePosition+min(sIntersection,dIntersection)*p);return p;}
#endif
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
#include<clipPlaneFragment>
vec3 viewDirectionW=normalize(vEyePosition.xyz-vPositionW);
#ifdef NORMAL
vec3 normalW=normalize(vNormalW);
#else
vec3 normalW=vec3(0.0,1.0,0.0);
#endif
float shadow=1.;float globalShadow=0.;float shadowLightCount=0.;float aggShadow=0.;float numLights=0.;
#include<lightFragment>[0..maxSimultaneousLights]
#ifdef SHADOWINUSE
globalShadow/=shadowLightCount;
#else
globalShadow=1.0;
#endif
#ifndef BACKMAT_SHADOWONLY
vec4 reflectionColor=vec4(1.,1.,1.,1.);
#ifdef REFLECTION
#ifdef PROJECTED_GROUND
vec3 reflectionVector=project(viewDirectionW,vEyePosition.xyz);reflectionVector=vec3(reflectionMatrix*vec4(reflectionVector,1.));
#else
vec3 reflectionVector=computeReflectionCoords(vec4(vPositionW,1.0),normalW);
#endif
#ifdef REFLECTIONMAP_OPPOSITEZ
reflectionVector.z*=-1.0;
#endif
#ifdef REFLECTIONMAP_3D
vec3 reflectionCoords=reflectionVector;
#else
vec2 reflectionCoords=reflectionVector.xy;
#ifdef REFLECTIONMAP_PROJECTION
reflectionCoords/=reflectionVector.z;
#endif
reflectionCoords.y=1.0-reflectionCoords.y;
#endif
#ifdef REFLECTIONBLUR
float reflectionLOD=vReflectionInfos.y;
#ifdef TEXTURELODSUPPORT
reflectionLOD=reflectionLOD*log2(vReflectionMicrosurfaceInfos.x)*vReflectionMicrosurfaceInfos.y+vReflectionMicrosurfaceInfos.z;reflectionColor=sampleReflectionLod(reflectionSampler,reflectionCoords,reflectionLOD);
#else
float lodReflectionNormalized=saturate(reflectionLOD);float lodReflectionNormalizedDoubled=lodReflectionNormalized*2.0;vec4 reflectionSpecularMid=sampleReflection(reflectionSampler,reflectionCoords);if(lodReflectionNormalizedDoubled<1.0){reflectionColor=mix(
sampleReflection(reflectionSamplerHigh,reflectionCoords),
reflectionSpecularMid,
lodReflectionNormalizedDoubled
);} else {reflectionColor=mix(
reflectionSpecularMid,
sampleReflection(reflectionSamplerLow,reflectionCoords),
lodReflectionNormalizedDoubled-1.0
);}
#endif
#else
vec4 reflectionSample=sampleReflection(reflectionSampler,reflectionCoords);reflectionColor=reflectionSample;
#endif
#ifdef RGBDREFLECTION
reflectionColor.rgb=fromRGBD(reflectionColor);
#endif
#ifdef GAMMAREFLECTION
reflectionColor.rgb=toLinearSpace(reflectionColor.rgb);
#endif
#ifdef REFLECTIONBGR
reflectionColor.rgb=reflectionColor.bgr;
#endif
reflectionColor.rgb*=vReflectionInfos.x;
#endif
vec3 diffuseColor=vec3(1.,1.,1.);float finalAlpha=alpha;
#ifdef DIFFUSE
vec4 diffuseMap=texture2D(diffuseSampler,vDiffuseUV);
#ifdef GAMMADIFFUSE
diffuseMap.rgb=toLinearSpace(diffuseMap.rgb);
#endif
diffuseMap.rgb*=vDiffuseInfos.y;
#ifdef DIFFUSEHASALPHA
finalAlpha*=diffuseMap.a;
#endif
diffuseColor=diffuseMap.rgb;
#endif
#ifdef REFLECTIONFRESNEL
vec3 colorBase=diffuseColor;
#else
vec3 colorBase=reflectionColor.rgb*diffuseColor;
#endif
colorBase=max(colorBase,0.0);
#ifdef USERGBCOLOR
vec3 finalColor=colorBase;
#else
#ifdef USEHIGHLIGHTANDSHADOWCOLORS
vec3 mainColor=mix(vPrimaryColorShadow.rgb,vPrimaryColor.rgb,colorBase);
#else
vec3 mainColor=vPrimaryColor.rgb;
#endif
vec3 finalColor=colorBase*mainColor;
#endif
#ifdef REFLECTIONFRESNEL
vec3 reflectionAmount=vReflectionControl.xxx;vec3 reflectionReflectance0=vReflectionControl.yyy;vec3 reflectionReflectance90=vReflectionControl.zzz;float VdotN=dot(normalize(vEyePosition.xyz),normalW);vec3 planarReflectionFresnel=fresnelSchlickEnvironmentGGX(saturate(VdotN),reflectionReflectance0,reflectionReflectance90,1.0);reflectionAmount*=planarReflectionFresnel;
#ifdef REFLECTIONFALLOFF
float reflectionDistanceFalloff=1.0-saturate(length(vPositionW.xyz-vBackgroundCenter)*vReflectionControl.w);reflectionDistanceFalloff*=reflectionDistanceFalloff;reflectionAmount*=reflectionDistanceFalloff;
#endif
finalColor=mix(finalColor,reflectionColor.rgb,saturate(reflectionAmount));
#endif
#ifdef OPACITYFRESNEL
float viewAngleToFloor=dot(normalW,normalize(vEyePosition.xyz-vBackgroundCenter));const float startAngle=0.1;float fadeFactor=saturate(viewAngleToFloor/startAngle);finalAlpha*=fadeFactor*fadeFactor;
#endif
#ifdef SHADOWINUSE
finalColor=mix(finalColor*shadowLevel,finalColor,globalShadow);
#endif
vec4 color=vec4(finalColor,finalAlpha);
#else
vec4 color=vec4(vPrimaryColor.rgb,(1.0-clamp(globalShadow,0.,1.))*alpha);
#endif
#include<logDepthFragment>
#include<fogFragment>
#ifdef IMAGEPROCESSINGPOSTPROCESS
#if !defined(SKIPFINALCOLORCLAMP)
color.rgb=clamp(color.rgb,0.,30.0);
#endif
#else
color=applyImageProcessing(color);
#endif
#ifdef PREMULTIPLYALPHA
color.rgb*=color.a;
#endif
#ifdef NOISE
color.rgb+=dither(vPositionW.xy,0.5);color=max(color,0.0);
#endif
gl_FragColor=color;
#define CUSTOM_FRAGMENT_MAIN_END
}
`;t.ShaderStore.ShadersStore[n]||(t.ShaderStore.ShadersStore[n]=s),e.s(["backgroundPixelShader",0,{name:n,shader:s}],873146)},668740,e=>{"use strict";var t=e.i(263537);let r="displayPassPixelShader",i=`varying vec2 vUV;uniform sampler2D textureSampler;uniform sampler2D passSampler;
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void)
{gl_FragColor=texture2D(passSampler,vUV);}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["displayPassPixelShader",0,{name:r,shader:i}])},340389,e=>{"use strict";var t=e.i(263537);e.i(201632);let r="rgbdDecodePixelShader",i=`varying vec2 vUV;uniform sampler2D textureSampler;
#include<helperFunctions>
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) 
{gl_FragColor=vec4(fromRGBD(texture2D(textureSampler,vUV)),1.0);}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["rgbdDecodePixelShader",0,{name:r,shader:i}])},94203,e=>{"use strict";var t=e.i(263537);e.i(201632);let r="rgbdEncodePixelShader",i=`varying vec2 vUV;uniform sampler2D textureSampler;
#include<helperFunctions>
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) 
{gl_FragColor=toRGBD(texture2D(textureSampler,vUV).rgb);}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["rgbdEncodePixelShader",0,{name:r,shader:i}])},357742,e=>{"use strict";var t=e.i(263537);let r="oitBackBlendPixelShader",i=`precision highp float;uniform sampler2D uBackColor;void main() {glFragColor=texelFetch(uBackColor,ivec2(gl_FragCoord.xy),0);if (glFragColor.a==0.0) { 
discard;}}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["oitBackBlendPixelShader",0,{name:r,shader:i}])},212095,e=>{"use strict";var t=e.i(263537);let r="areaLightTextureProcessingPixelShader",i=`varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;uniform scalingRange: vec2f;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {let x: f32=(input.vUV.x-uniforms.scalingRange.x)/(uniforms.scalingRange.y-uniforms.scalingRange.x);let y: f32=(input.vUV.y-uniforms.scalingRange.x)/(uniforms.scalingRange.y-uniforms.scalingRange.x);let scaledUV: vec2f=vec2f(x,y);fragmentOutputs.color=textureSample(textureSampler,textureSamplerSampler,scaledUV);}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["areaLightTextureProcessingPixelShaderWGSL",0,{name:r,shader:i}])},848458,e=>{"use strict";var t=e.i(263537);e.i(738124);let r="copyTextureToTexturePixelShader",i=`uniform conversion: f32;
#ifndef NO_SAMPLER
var textureSamplerSampler: sampler;
#endif
var textureSampler: texture_2d<f32>;uniform lodLevel : f32;varying vUV: vec2f;
#include<helperFunctions>
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {
#ifdef NO_SAMPLER
var color: vec4f=textureLoad(textureSampler,vec2u(fragmentInputs.position.xy),u32(uniforms.lodLevel));
#else
var color: vec4f=textureSampleLevel(textureSampler,textureSamplerSampler,input.vUV,uniforms.lodLevel);
#endif
#ifdef DEPTH_TEXTURE
fragmentOutputs.fragDepth=color.r;
#else
if (uniforms.conversion==1.) {color=toLinearSpaceVec4(color);} else if (uniforms.conversion==2.) {color=toGammaSpace(color);}
fragmentOutputs.color=color;
#endif
}
`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["copyTextureToTexturePixelShaderWGSL",0,{name:r,shader:i}])},865820,e=>{"use strict";var t=e.i(263537);let r="lensFlareVertexShader",i=`attribute vec2 position;uniform mat4 viewportMatrix;varying vec2 vUV;const vec2 madd=vec2(0.5,0.5);
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
vUV=position*madd+madd;gl_Position=viewportMatrix*vec4(position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["lensFlareVertexShader",0,{name:r,shader:i}])},73730,e=>{"use strict";var t=e.i(263537);let r="proceduralVertexShader",i=`attribute vec2 position;varying vec2 vPosition;varying vec2 vUV;const vec2 madd=vec2(0.5,0.5);
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
vPosition=position;vUV=position*madd+madd;gl_Position=vec4(position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["proceduralVertexShader",0,{name:r,shader:i}])},291929,e=>{"use strict";var t=e.i(263537);let r="shadowMapFragmentSoftTransparentShadow",i=`#if SM_SOFTTRANSPARENTSHADOW==1
if ((bayerDither8(floor(((fragmentInputs.position.xy)%(8.0)))))/64.0>=uniforms.softTransparentShadowSM.x*alpha) {discard;}
#endif
`;t.ShaderStore.IncludesShadersStoreWGSL[r]||(t.ShaderStore.IncludesShadersStoreWGSL[r]=i),e.s(["shadowMapFragmentSoftTransparentShadowWGSL",0,{name:r,shader:i}])},670755,e=>{"use strict";var t=e.i(263537);let r="passPixelShader",i=`varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {fragmentOutputs.color=textureSample(textureSampler,textureSamplerSampler,input.vUV);}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["passPixelShaderWGSL",0,{name:r,shader:i}])},176056,e=>{"use strict";var t=e.i(353679),r=e.i(916624),i=e.i(774685);class a extends t.FlowGraphExecutionBlockWithOutSignal{constructor(e){super(e),this.sound=this.registerDataInput("sound",r.RichTypeAny)}_execute(e,t){let r=this.sound.getValue(e);if(!r){this._reportError(e,"No sound provided"),this.out._activateSignal(e);return}5===r.state?r.resume():(2===r.state||3===r.state)&&r.pause(),this.out._activateSignal(e)}getClassName(){return"FlowGraphPauseSoundBlock"}}(0,i.RegisterClass)("FlowGraphPauseSoundBlock",a),e.s(["FlowGraphPauseSoundBlock",0,a])},530324,e=>{"use strict";var t=e.i(263537);e.i(738124),e.i(120091),e.i(590030),e.i(481519);let r="hdrIrradianceFilteringPixelShader",i=`#include<helperFunctions>
#include<importanceSampling>
#include<pbrBRDFFunctions>
#include<hdrFilteringFunctions>
var inputTextureSampler: sampler;var inputTexture: texture_cube<f32>;
#ifdef IBL_CDF_FILTERING
var icdfTextureSampler: sampler;var icdfTexture: texture_2d<f32>;
#endif
uniform vFilteringInfo: vec2f;uniform hdrScale: f32;varying direction: vec3f;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var color: vec3f=irradiance(inputTexture,inputTextureSampler,input.direction,uniforms.vFilteringInfo,0.0,vec3f(1.0),input.direction
#ifdef IBL_CDF_FILTERING
,icdfTexture,icdfTextureSampler
#endif
);fragmentOutputs.color= vec4f(color*uniforms.hdrScale,1.0);}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["hdrIrradianceFilteringPixelShaderWGSL",0,{name:r,shader:i}])},381567,e=>{"use strict";var t=e.i(263537);let r="ssaoCombinePixelShader",i=`varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;var originalColorSampler: sampler;var originalColor: texture_2d<f32>;uniform viewport: vec4f;
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
var uv: vec2f=uniforms.viewport.xy+input.vUV*uniforms.viewport.zw;var ssaoColor: vec4f=textureSample(textureSampler,textureSamplerSampler,uv);var sceneColor: vec4f=textureSample(originalColor,originalColorSampler,uv);fragmentOutputs.color=sceneColor*ssaoColor;
#define CUSTOM_FRAGMENT_MAIN_END
}
`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["ssaoCombinePixelShaderWGSL",0,{name:r,shader:i}])},202596,e=>{"use strict";var t=e.i(263537);e.i(144628),e.i(738124),e.i(352483);let r="imageProcessingPixelShader",i=`varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;
#include<imageProcessingDeclaration>
#include<helperFunctions>
#include<imageProcessingFunctions>
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var result: vec4f=textureSample(textureSampler,textureSamplerSampler,input.vUV);result=vec4f(max(result.rgb,vec3f(0.)),result.a);
#ifdef IMAGEPROCESSING
#ifndef FROMLINEARSPACE
result=vec4f(toLinearSpaceVec3(result.rgb),result.a);
#endif
result=applyImageProcessing(result);
#else
#ifdef FROMLINEARSPACE
result=applyImageProcessing(result);
#endif
#endif
fragmentOutputs.color=result;}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["imageProcessingPixelShaderWGSL",0,{name:r,shader:i}])},980083,e=>{"use strict";var t=e.i(263537);e.i(738124);let r="layerPixelShader",i=`varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;uniform color: vec4f;
#include<helperFunctions>
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
var baseColor: vec4f=textureSample(textureSampler,textureSamplerSampler,input.vUV);
#if defined(CONVERT_TO_GAMMA)
baseColor=toGammaSpace(baseColor);
#elif defined(CONVERT_TO_LINEAR)
baseColor=toLinearSpaceVec4(baseColor);
#endif
#ifdef ALPHATEST
if (baseColor.a<0.4) {discard;}
#endif
fragmentOutputs.color=baseColor*uniforms.color;
#define CUSTOM_FRAGMENT_MAIN_END
}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["layerPixelShaderWGSL",0,{name:r,shader:i}])},678153,e=>{"use strict";var t=e.i(263537);let r="taaPixelShader",i=`varying vec2 vUV;uniform sampler2D textureSampler;uniform sampler2D historySampler;
#ifdef TAA_REPROJECT_HISTORY
uniform sampler2D velocitySampler;
#endif
uniform float factor;void main() {ivec2 pos=ivec2(gl_FragCoord.xy);vec4 c=texelFetch(textureSampler,pos,0);
#ifdef TAA_REPROJECT_HISTORY
vec4 v=texelFetch(velocitySampler,pos,0);vec4 h=texture2D(historySampler,vUV+v.xy);
#else
vec4 h=texelFetch(historySampler,pos,0);
#endif
#ifdef TAA_CLAMP_HISTORY
vec4 cmin=vec4(1);vec4 cmax=vec4(0);for (int x=-1; x<=1; x+=1) {for (int y=-1; y<=1; y+=1) {vec4 c=texelFetch(textureSampler,pos+ivec2(x,y),0);cmin=min(cmin,c);cmax=max(cmax,c);}}
h=clamp(h,cmin,cmax);
#endif
gl_FragColor=mix(h,c,factor);}
`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["taaPixelShader",0,{name:r,shader:i}])},614157,e=>{"use strict";var t=e.i(263537);let r="iblCdfDebugPixelShader",i=`precision highp samplerCube;
#define PI 3.1415927
varying vec2 vUV;uniform sampler2D cdfy;uniform sampler2D cdfx;uniform sampler2D icdf;uniform sampler2D pdf;
#ifdef IBL_USE_CUBE_MAP
uniform samplerCube iblSource;
#else
uniform sampler2D iblSource;
#endif
uniform sampler2D textureSampler;
#define cdfyVSize (0.8/3.0)
#define cdfxVSize 0.1
#define cdfyHSize 0.5
uniform vec4 sizeParams;
#define offsetX sizeParams.x
#define offsetY sizeParams.y
#define widthScale sizeParams.z
#define heightScale sizeParams.w
#ifdef IBL_USE_CUBE_MAP
vec3 equirectangularToCubemapDirection(vec2 uv) {float longitude=uv.x*2.0*PI-PI;float latitude=PI*0.5-uv.y*PI;vec3 direction;direction.x=cos(latitude)*sin(longitude);direction.y=sin(latitude);direction.z=cos(latitude)*cos(longitude);return direction;}
#endif
void main(void) {vec3 colour=vec3(0.0);vec2 uv =
vec2((offsetX+vUV.x)*widthScale,(offsetY+vUV.y)*heightScale);vec3 backgroundColour=texture2D(textureSampler,vUV).rgb;int cdfxWidth=textureSize(cdfx,0).x;int cdfyHeight=textureSize(cdfy,0).y;const float iblStart=1.0-cdfyVSize;const float pdfStart=1.0-2.0*cdfyVSize;const float cdfyStart=1.0-3.0*cdfyVSize;const float cdfxStart=1.0-3.0*cdfyVSize-cdfxVSize;const float icdfxStart=1.0-3.0*cdfyVSize-2.0*cdfxVSize;
#ifdef IBL_USE_CUBE_MAP
vec3 direction=equirectangularToCubemapDirection(
(uv-vec2(0.0,iblStart))*vec2(1.0,1.0/cdfyVSize));vec3 iblColour=textureCubeLodEXT(iblSource,direction,0.0).rgb;
#else
vec3 iblColour=texture2D(iblSource,(uv-vec2(0.0,iblStart)) *
vec2(1.0,1.0/cdfyVSize))
.rgb;
#endif
vec3 pdfColour=texture(icdf,(uv-vec2(0.0,pdfStart)) *
vec2(1.0,1.0/cdfyVSize)).zzz;float cdfyColour =
texture2D(cdfy,(uv-vec2(0.0,cdfyStart))*vec2(2.0,1.0/cdfyVSize))
.r;float icdfyColour =
texture2D(icdf,(uv-vec2(0.5,cdfyStart))*vec2(2.0,1.0/cdfyVSize))
.g;float cdfxColour =
texture2D(cdfx,(uv-vec2(0.0,cdfxStart))*vec2(1.0,1.0/cdfxVSize))
.r;float icdfxColour=texture2D(icdf,(uv-vec2(0.0,icdfxStart)) *
vec2(1.0,1.0/cdfxVSize))
.r;if (uv.x<0.0 || uv.x>1.0 || uv.y<0.0 || uv.y>1.0) {colour=backgroundColour;} else if (uv.y>iblStart) {colour+=iblColour;} else if (uv.y>pdfStart) {colour+=pdfColour;} else if (uv.y>cdfyStart && uv.x<0.5) {colour.r+=cdfyColour/float(cdfyHeight);} else if (uv.y>cdfyStart && uv.x>0.5) {colour.r+=icdfyColour;} else if (uv.y>cdfxStart) {colour.r+=cdfxColour/float(cdfxWidth);} else if (uv.y>icdfxStart) {colour.r+=icdfxColour;}
gl_FragColor=vec4(colour,1.0);glFragColor.rgb=mix(gl_FragColor.rgb,backgroundColour,0.5);}
`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["iblCdfDebugPixelShader",0,{name:r,shader:i}])},958070,988519,e=>{"use strict";function t(e){return Math.floor(e/8)}class r{constructor(e){this.size=e,this._byteArray=new Uint8Array(Math.ceil(this.size/8))}get(e){if(e>=this.size)throw RangeError("Bit index out of range");let r=t(e),i=1<<e%8;return(this._byteArray[r]&i)!=0}set(e,r){if(e>=this.size)throw RangeError("Bit index out of range");let i=t(e),a=1<<e%8;r?this._byteArray[i]|=a:this._byteArray[i]&=~a}}e.s(["BitArray",0,r],988519),e.s(["OptimizeIndices",0,function(e){let t=[],i=e.length/3;for(let r=0;r<i;r++)t.push([e[3*r],e[3*r+1],e[3*r+2]]);let a=new Map;for(let e=0;e<t.length;e++)for(let r of t[e]){let t=a.get(r);t||a.set(r,t=[]),t.push(e)}let o=new r(i),n=[],s=e=>{let r=[e];for(;r.length>0;){let e=r.pop();if(!o.get(e))for(let i of(o.set(e,!0),n.push(t[e]),t[e])){let e=a.get(i);if(!e)return;for(let t of e)o.get(t)||r.push(t)}}};for(let e=0;e<i;e++)o.get(e)||s(e);let l=0;for(let t of n)e[l++]=t[0],e[l++]=t[1],e[l++]=t[2]}],958070)},102174,e=>{"use strict";var t=e.i(263537);let r="vrDistortionCorrectionPixelShader",i=`#define DISABLE_UNIFORMITY_ANALYSIS
varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;uniform LensCenter: vec2f;uniform Scale: vec2f;uniform ScaleIn: vec2f;uniform HmdWarpParam: vec4f;fn HmdWarp(in01: vec2f)->vec2f {var theta: vec2f=(in01-uniforms.LensCenter)*uniforms.ScaleIn; 
var rSq: f32=theta.x*theta.x+theta.y*theta.y;var rvector: vec2f=theta*(uniforms.HmdWarpParam.x+uniforms.HmdWarpParam.y*rSq+uniforms.HmdWarpParam.z*rSq*rSq+uniforms.HmdWarpParam.w*rSq*rSq*rSq);return uniforms.LensCenter+uniforms.Scale*rvector;}
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var tc: vec2f=HmdWarp(input.vUV);if (tc.x <0.0 || tc.x>1.0 || tc.y<0.0 || tc.y>1.0) {fragmentOutputs.color=vec4f(0.0,0.0,0.0,0.0);}
else{fragmentOutputs.color=textureSample(textureSampler,textureSamplerSampler,tc);}}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["vrDistortionCorrectionPixelShaderWGSL",0,{name:r,shader:i}])},716936,e=>{"use strict";var t=e.i(263537);let r="iblCombineVoxelGridsPixelShader",i=`varying vUV: vec2f;var voxelXaxisSamplerSampler: sampler;var voxelXaxisSampler: texture_3d<f32>;var voxelYaxisSamplerSampler: sampler;var voxelYaxisSampler: texture_3d<f32>;var voxelZaxisSamplerSampler: sampler;var voxelZaxisSampler: texture_3d<f32>;uniform layer: f32;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var coordZ: vec3f= vec3f(fragmentInputs.vUV.x,fragmentInputs.vUV.y,uniforms.layer);var voxelZ: f32=textureSample(voxelZaxisSampler,voxelZaxisSamplerSampler,coordZ).r;var coordX: vec3f= vec3f(1.0-uniforms.layer,fragmentInputs.vUV.y,fragmentInputs.vUV.x);var voxelX: f32=textureSample(voxelXaxisSampler,voxelXaxisSamplerSampler,coordX).r;var coordY: vec3f= vec3f(uniforms.layer,fragmentInputs.vUV.x,fragmentInputs.vUV.y);var voxelY: f32=textureSample(voxelYaxisSampler,voxelYaxisSamplerSampler,coordY).r;var voxel=select(0.0,1.0,(voxelX>0.0 || voxelY>0.0 || voxelZ>0.0));fragmentOutputs.color= vec4f( vec3f(voxel),1.0);}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["iblCombineVoxelGridsPixelShaderWGSL",0,{name:r,shader:i}])},262614,e=>{"use strict";var t=e.i(263537);let r="sharpenPixelShader",i=`varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;uniform screenSize: vec2f;uniform sharpnessAmounts: vec2f;
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var onePixel: vec2f= vec2f(1.0,1.0)/uniforms.screenSize;var color: vec4f=textureSample(textureSampler,textureSamplerSampler,input.vUV);var edgeDetection: vec4f=textureSample(textureSampler,textureSamplerSampler,input.vUV+onePixel*vec2f(0,-1)) +
textureSample(textureSampler,textureSamplerSampler,input.vUV+onePixel*vec2f(-1,0)) +
textureSample(textureSampler,textureSamplerSampler,input.vUV+onePixel*vec2f(1,0)) +
textureSample(textureSampler,textureSamplerSampler,input.vUV+onePixel*vec2f(0,1)) -
color*4.0;fragmentOutputs.color=max(vec4f(color.rgb*uniforms.sharpnessAmounts.y,color.a)-(uniforms.sharpnessAmounts.x* vec4f(edgeDetection.rgb,0)),vec4f(0.));}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["sharpenPixelShaderWGSL",0,{name:r,shader:i}])},759944,e=>{"use strict";var t=e.i(916624),r=e.i(303663),i=e.i(774685);class a extends r.FlowGraphExecutionBlock{constructor(e){super(e),this.condition=this.registerDataInput("condition",t.RichTypeBoolean),this.onTrue=this._registerSignalOutput("onTrue"),this.onFalse=this._registerSignalOutput("onFalse")}_execute(e){this.condition.getValue(e)?this.onTrue._activateSignal(e):this.onFalse._activateSignal(e)}getClassName(){return"FlowGraphBranchBlock"}}(0,i.RegisterClass)("FlowGraphBranchBlock",a),e.s(["FlowGraphBranchBlock",0,a])},369488,e=>{"use strict";var t=e.i(263537);let r="iblGenerateVoxelMipPixelShader",i=`precision highp float;precision highp sampler3D;varying vec2 vUV;uniform sampler3D srcMip;uniform int layerNum;void main(void) {ivec3 Coords=ivec3(2)*ivec3(gl_FragCoord.x,gl_FragCoord.y,layerNum);uint tex =
uint(texelFetch(srcMip,Coords+ivec3(0,0,0),0).x>0.0f ? 1u : 0u)
<< 0u |
uint(texelFetch(srcMip,Coords+ivec3(1,0,0),0).x>0.0f ? 1u : 0u)
<< 1u |
uint(texelFetch(srcMip,Coords+ivec3(0,1,0),0).x>0.0f ? 1u : 0u)
<< 2u |
uint(texelFetch(srcMip,Coords+ivec3(1,1,0),0).x>0.0f ? 1u : 0u)
<< 3u |
uint(texelFetch(srcMip,Coords+ivec3(0,0,1),0).x>0.0f ? 1u : 0u)
<< 4u |
uint(texelFetch(srcMip,Coords+ivec3(1,0,1),0).x>0.0f ? 1u : 0u)
<< 5u |
uint(texelFetch(srcMip,Coords+ivec3(0,1,1),0).x>0.0f ? 1u : 0u)
<< 6u |
uint(texelFetch(srcMip,Coords+ivec3(1,1,1),0).x>0.0f ? 1u : 0u)
<< 7u;glFragColor.rgb=vec3(float(tex)/255.0f,0.0f,0.0f);glFragColor.a=1.0;}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["iblGenerateVoxelMipPixelShader",0,{name:r,shader:i}])},117821,e=>{"use strict";var t=e.i(263537);e.i(201632);let r="copyTextureToTexturePixelShader",i=`uniform float conversion;uniform sampler2D textureSampler;uniform float lodLevel;varying vec2 vUV;
#include<helperFunctions>
void main(void) 
{
#ifdef NO_SAMPLER
vec4 color=texelFetch(textureSampler,ivec2(gl_FragCoord.xy),0);
#else
vec4 color=textureLod(textureSampler,vUV,lodLevel);
#endif
#ifdef DEPTH_TEXTURE
gl_FragDepth=color.r;
#else
if (conversion==1.) {color=toLinearSpace(color);} else if (conversion==2.) {color=toGammaSpace(color);}
gl_FragColor=color;
#endif
}
`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["copyTextureToTexturePixelShader",0,{name:r,shader:i}])},308552,e=>{"use strict";var t=e.i(263537);e.i(704290);let r="kernelBlurVertex";t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]="sampleCoord{X}=sampleCenter+delta*KERNEL_OFFSET{X};");let i="kernelBlurVertexShader",a=`attribute vec2 position;uniform vec2 delta;varying vec2 sampleCenter;
#include<kernelBlurVaryingDeclaration>[0..varyingCount]
const vec2 madd=vec2(0.5,0.5);
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
sampleCenter=(position*madd+madd);
#include<kernelBlurVertex>[0..varyingCount]
gl_Position=vec4(position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;t.ShaderStore.ShadersStore[i]||(t.ShaderStore.ShadersStore[i]=a),e.s(["kernelBlurVertexShader",0,{name:i,shader:a}],308552)},15530,e=>{"use strict";var t=e.i(263537);e.i(261937),e.i(127010),e.i(358759),e.i(141687);let r="linePixelShader",i=`#include<clipPlaneFragmentDeclaration>
uniform vec4 color;
#ifdef LOGARITHMICDEPTH
#extension GL_EXT_frag_depth : enable
#endif
#include<logDepthDeclaration>
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
#include<logDepthFragment>
#include<clipPlaneFragment>
gl_FragColor=color;
#define CUSTOM_FRAGMENT_MAIN_END
}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["linePixelShader",0,{name:r,shader:i}])},158646,e=>{"use strict";var t=e.i(263537);let r="greasedLinePixelShader",i=`var grlColors: texture_2d<f32>;var grlColorsSampler: sampler;uniform grlUseColors: f32;uniform grlUseDash: f32;uniform grlDashArray: f32;uniform grlDashOffset: f32;uniform grlDashRatio: f32;uniform grlVisibility: f32;uniform grlColorsWidth: f32;uniform grl_colorModeAndColorDistributionType: vec2f;uniform grlColor: vec3f;varying grlCounters: f32;varying grlColorPointer: f32;
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
let grlColorMode: f32=uniforms.grl_colorModeAndColorDistributionType.x;let grlColorDistributionType: f32=uniforms.grl_colorModeAndColorDistributionType.y;var outColor=vec4(uniforms.grlColor,1.);outColor.a=step(fragmentInputs.grlCounters,uniforms.grlVisibility);if (outColor.a==0.0) {discard;}
if (uniforms.grlUseDash==1.0) {let dashPosition=(fragmentInputs.grlCounters+uniforms.grlDashOffset) % uniforms.grlDashArray;outColor.a*=ceil(dashPosition-(uniforms.grlDashArray*uniforms.grlDashRatio));if (outColor.a==0.0) {discard;}}
if (uniforms.grlUseColors==1.) {
#ifdef GREASED_LINE_COLOR_DISTRIBUTION_TYPE_LINE
let grlColor: vec4f=textureSample(grlColors,grlColorsSampler,vec2f(fragmentInputs.grlCounters,0.));
#else
let lookup: vec2f=vec2(fract(fragmentInputs.grlColorPointer/uniforms.grlColorsWidth),1.0-floor(fragmentInputs.grlColorPointer/uniforms.grlColorsWidth));let grlColor: vec4f=textureSample(grlColors,grlColorsSampler,lookup);
#endif
if (grlColorMode==COLOR_MODE_SET) {outColor=grlColor;} else if (grlColorMode==COLOR_MODE_ADD) {outColor+=grlColor;} else if (grlColorMode==COLOR_MODE_MULTIPLY) {outColor*=grlColor;}}
#if !defined(PREPASS) && !defined(ORDER_INDEPENDENT_TRANSPARENCY)
fragmentOutputs.color=outColor;
#endif
#if ORDER_INDEPENDENT_TRANSPARENCY
if (fragDepth==nearestDepth) {fragmentOutputs.frontColor=vec4f(fragmentOutputs.frontColor.rgb+outColor.rgb*outColor.a*alphaMultiplier,1.0-alphaMultiplier*(1.0-outColor.a));} else {fragmentOutputs.backColor+=outColor;}
#endif
#define CUSTOM_FRAGMENT_MAIN_END
}
`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["greasedLinePixelShaderWGSL",0,{name:r,shader:i}])},493056,e=>{"use strict";var t=e.i(353679),r=e.i(916624),i=e.i(774685),a=e.i(711835),o=e.i(774100);class n extends t.FlowGraphExecutionBlockWithOutSignal{constructor(e){super(e),this.startIndex=this.registerDataInput("startIndex",r.RichTypeAny,0),this.endIndex=this.registerDataInput("endIndex",r.RichTypeAny),this.step=this.registerDataInput("step",r.RichTypeNumber,1),this.index=this.registerDataOutput("index",r.RichTypeFlowGraphInteger,new o.FlowGraphInteger((0,a.getNumericValue)(e?.initialIndex??0))),this.executionFlow=this._registerSignalOutput("executionFlow"),this.completed=this._registerSignalOutput("completed"),this._unregisterSignalOutput("out")}_execute(e){let t=(0,a.getNumericValue)(this.startIndex.getValue(e)),r=this.step.getValue(e),i=(0,a.getNumericValue)(this.endIndex.getValue(e));for(let s=t;s<i&&(this.index.setValue(new o.FlowGraphInteger(s),e),this.executionFlow._activateSignal(e),i=(0,a.getNumericValue)(this.endIndex.getValue(e)),!(s>n.MaxLoopIterations*r));s+=r);this.config?.incrementIndexWhenLoopDone&&this.index.setValue(new o.FlowGraphInteger((0,a.getNumericValue)(this.index.getValue(e))+r),e),this.completed._activateSignal(e)}getClassName(){return"FlowGraphForLoopBlock"}}n.MaxLoopIterations=1e3,(0,i.RegisterClass)("FlowGraphForLoopBlock",n),e.s(["FlowGraphForLoopBlock",0,n])},178079,e=>{"use strict";var t=e.i(440163),r=e.i(916624),i=e.i(711835),a=e.i(774685);class o extends t.FlowGraphBlock{constructor(e){for(let t of(super(e),this.config=e,this._inputCases=new Map,this.case=this.registerDataInput("case",r.RichTypeAny,NaN),this.default=this.registerDataInput("default",r.RichTypeAny),this.value=this.registerDataOutput("value",r.RichTypeAny),this.config.cases||[])){if(t=(0,i.getNumericValue)(t),this.config.treatCasesAsIntegers&&(t|=0,this._inputCases.has(t)))return;this._inputCases.set(t,this.registerDataInput(`in_${t}`,r.RichTypeAny))}}_updateOutputs(e){let t,r=this.case.getValue(e);(0,i.isNumeric)(r)&&(t=this._getOutputValueForCase((0,i.getNumericValue)(r),e)),t||(t=this.default.getValue(e)),this.value.setValue(t,e)}_getOutputValueForCase(e,t){return this._inputCases.get(e)?.getValue(t)}getClassName(){return"FlowGraphDataSwitchBlock"}}(0,a.RegisterClass)("FlowGraphDataSwitchBlock",o),e.s(["FlowGraphDataSwitchBlock",0,o])},737331,e=>{"use strict";var t=e.i(868738),r=e.i(774685),i=e.i(916624);class a extends t.FlowGraphEventBlock{constructor(e){super(e),this.sound=this.registerDataInput("sound",i.RichTypeAny)}_preparePendingTasks(e){let t=this.sound.getValue(e);if(!t)return void this._reportError(e,"No sound provided for sound-ended event");let r=t.onEndedObservable.add(()=>{this._execute(e)});e._setExecutionVariable(this,"_soundEndedObserver",r),e._setExecutionVariable(this,"_subscribedSound",t)}_executeEvent(e,t){return!0}_cancelPendingTasks(e){let t=e._getExecutionVariable(this,"_soundEndedObserver",null),r=e._getExecutionVariable(this,"_subscribedSound",null);t&&r&&r.onEndedObservable.remove(t),e._setExecutionVariable(this,"_soundEndedObserver",null),e._setExecutionVariable(this,"_subscribedSound",null)}getClassName(){return"FlowGraphSoundEndedEventBlock"}}(0,r.RegisterClass)("FlowGraphSoundEndedEventBlock",a),e.s(["FlowGraphSoundEndedEventBlock",0,a])},78291,e=>{"use strict";var t=e.i(263537);let r="rsmFullGlobalIlluminationPixelShader",i=`/**
* The implementation is a direct application of the formula found in http:
*/
varying vUV: vec2f;uniform rsmLightMatrix: mat4x4f;uniform rsmInfo: vec4f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;var normalSamplerSampler: sampler;var normalSampler: texture_2d<f32>;var rsmPositionW: texture_2d<f32>;var rsmNormalW: texture_2d<f32>;var rsmFlux: texture_2d<f32>;
#ifdef TRANSFORM_NORMAL
uniform invView: mat4x4f;
#endif
fn computeIndirect(p: vec3f,n: vec3f)->vec3f {var indirectDiffuse: vec3f= vec3f(0.);var intensity: f32=uniforms.rsmInfo.z;var edgeArtifactCorrection: f32=uniforms.rsmInfo.w;var texRSM: vec4f=uniforms.rsmLightMatrix* vec4f(p,1.);texRSM=vec4f(texRSM.xy/texRSM.w,texRSM.z,texRSM.w);texRSM=vec4f(texRSM.xy*0.5+0.5,texRSM.z,texRSM.w);var width: i32= i32(uniforms.rsmInfo.x);var height: i32= i32(uniforms.rsmInfo.y);for (var j: i32=0; j<height; j++) {for (var i: i32=0; i<width; i++) {var uv=vec2<i32>(i,j);var vplPositionW: vec3f=textureLoad(rsmPositionW,uv,0).xyz;var vplNormalW: vec3f=textureLoad(rsmNormalW,uv,0).xyz*2.0-1.0;var vplFlux: vec3f=textureLoad(rsmFlux,uv,0).rgb;vplPositionW-=vplNormalW*edgeArtifactCorrection; 
var dist2: f32=dot(vplPositionW-p,vplPositionW-p);indirectDiffuse+=vplFlux*max(0.,dot(n,vplPositionW-p))*max(0.,dot(vplNormalW,p-vplPositionW))/(dist2*dist2);}}
return clamp(indirectDiffuse*intensity,vec3f(0.0),vec3f(1.0));}
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var positionW: vec3f=textureSample(textureSampler,textureSamplerSampler,fragmentInputs.vUV).xyz;var normalW: vec3f=textureSample(normalSampler,normalSamplerSampler,fragmentInputs.vUV).xyz;
#ifdef DECODE_NORMAL
normalW=normalW*2.0-1.0;
#endif
#ifdef TRANSFORM_NORMAL
normalW=(uniforms.invView* vec4f(normalW,0.)).xyz;
#endif
fragmentOutputs.color=vec4f(computeIndirect(positionW,normalW),1.0);}
`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["rsmFullGlobalIlluminationPixelShaderWGSL",0,{name:r,shader:i}])},584622,e=>{"use strict";var t=e.i(263537);e.i(562396),e.i(357351),e.i(476129),e.i(922446);let r="imageProcessingCompatibility",i=`#ifdef IMAGEPROCESSINGPOSTPROCESS
fragmentOutputs.color=vec4f(pow(fragmentOutputs.color.rgb, vec3f(2.2)),fragmentOutputs.color.a);
#endif
`;t.ShaderStore.IncludesShadersStoreWGSL[r]||(t.ShaderStore.IncludesShadersStoreWGSL[r]=i);let a="spritesPixelShader",o=`uniform alphaTest: i32;varying vColor: vec4f;varying vUV: vec2f;var diffuseSamplerSampler: sampler;var diffuseSampler: texture_2d<f32>;
#include<fogFragmentDeclaration>
#include<logDepthDeclaration>
#define CUSTOM_FRAGMENT_DEFINITIONS
#ifdef PIXEL_PERFECT
fn uvPixelPerfect(uv: vec2f)->vec2f {var res: vec2f= vec2f(textureDimensions(diffuseSampler,0));var uvTemp=uv*res;var seam: vec2f=floor(uvTemp+0.5);uvTemp=seam+clamp((uvTemp-seam)/fwidth(uvTemp),vec2f(-0.5),vec2f(0.5));return uvTemp/res;}
#endif
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
#ifdef PIXEL_PERFECT
var uv: vec2f=uvPixelPerfect(input.vUV);
#else
var uv: vec2f=input.vUV;
#endif
var color: vec4f=textureSample(diffuseSampler,diffuseSamplerSampler,uv);var fAlphaTest: f32= f32(uniforms.alphaTest);if (fAlphaTest != 0.)
{if (color.a<0.95) {discard;}}
color*=input.vColor;
#include<logDepthFragment>
#include<fogFragment>
fragmentOutputs.color=color;
#include<imageProcessingCompatibility>
#define CUSTOM_FRAGMENT_MAIN_END
}`;t.ShaderStore.ShadersStoreWGSL[a]||(t.ShaderStore.ShadersStoreWGSL[a]=o),e.s(["spritesPixelShaderWGSL",0,{name:a,shader:o}],584622)},946295,e=>{"use strict";var t=e.i(263537);let r="lodCubePixelShader",i=`precision highp float;const float GammaEncodePowerApprox=1.0/2.2;varying vec2 vUV;uniform samplerCube textureSampler;uniform float lod;uniform int gamma;void main(void)
{vec2 uv=vUV*2.0-1.0;
#ifdef POSITIVEX
gl_FragColor=textureCube(textureSampler,vec3(1.001,uv.y,uv.x),lod);
#endif
#ifdef NEGATIVEX
gl_FragColor=textureCube(textureSampler,vec3(-1.001,uv.y,uv.x),lod);
#endif
#ifdef POSITIVEY
gl_FragColor=textureCube(textureSampler,vec3(uv.y,1.001,uv.x),lod);
#endif
#ifdef NEGATIVEY
gl_FragColor=textureCube(textureSampler,vec3(uv.y,-1.001,uv.x),lod);
#endif
#ifdef POSITIVEZ
gl_FragColor=textureCube(textureSampler,vec3(uv,1.001),lod);
#endif
#ifdef NEGATIVEZ
gl_FragColor=textureCube(textureSampler,vec3(uv,-1.001),lod);
#endif
if (gamma==0) {gl_FragColor.rgb=pow(gl_FragColor.rgb,vec3(GammaEncodePowerApprox));}}
`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["lodCubePixelShader",0,{name:r,shader:i}])},187030,e=>{"use strict";var t=e.i(263537);e.i(261937),e.i(190688),e.i(141687),e.i(313119);let r="colorPixelShader",i=`#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
#define VERTEXCOLOR
varying vec4 vColor;
#else
uniform vec4 color;
#endif
#include<clipPlaneFragmentDeclaration>
#include<fogFragmentDeclaration>
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
#include<clipPlaneFragment>
#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
gl_FragColor=vColor;
#else
gl_FragColor=color;
#endif
#include<fogFragment>(color,gl_FragColor)
#define CUSTOM_FRAGMENT_MAIN_END
}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["colorPixelShader",0,{name:r,shader:i}])},572875,e=>{"use strict";var t=e.i(263537);e.i(738124),e.i(120091),e.i(590030),e.i(481519);let r="iblDominantDirectionPixelShader",i=`#include<helperFunctions>
#include<importanceSampling>
#include<pbrBRDFFunctions>
#include<hdrFilteringFunctions>
var icdfSamplerSampler: sampler;var icdfSampler: texture_2d<f32>;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var lightDir: vec3f=vec3f(0.0,0.0,0.0);for(var i: u32=0u; i<NUM_SAMPLES; i++)
{var Xi: vec2f=hammersley(i,NUM_SAMPLES);var T: vec2f;T.x=textureSampleLevel(icdfSampler,icdfSamplerSampler,vec2(Xi.x,0.0),0.0).x;T.y=textureSampleLevel(icdfSampler,icdfSamplerSampler,vec2(T.x,Xi.y),0.0).y;var Ls: vec3f=uv_to_normal(vec2f(1.0-fract(T.x+0.25),T.y));lightDir+=Ls;}
lightDir/=vec3f(f32(NUM_SAMPLES));fragmentOutputs.color=vec4f(lightDir,1.0);}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["iblDominantDirectionPixelShaderWGSL",0,{name:r,shader:i}])},3769,e=>{"use strict";var t=e.i(263537);let r="iblVoxelGridPixelShader",i=`var voxel_storage: texture_storage_3d<r8unorm,write>;varying vNormalizedPosition: vec3f;flat varying f_swizzle: i32;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var size: vec3f=vec3f(textureDimensions(voxel_storage));var normPos: vec3f=input.vNormalizedPosition.xyz;var outputColor: vec4f=vec4f(0.0,0.0,0.0,1.0);switch (input.f_swizzle) {case 0: {normPos=normPos.zxy; 
outputColor=vec4f(1.0,1.0,0.0,1.0);break;}
case 1: {normPos=normPos.yzx;outputColor=vec4f(1.0,1.0,1.0,1.0);break;}
default: {normPos=normPos.xyz;outputColor=vec4f(1.0,1.0,0.0,1.0);break;}}
textureStore(voxel_storage,vec3<i32>(i32(normPos.x*size.x),i32(normPos.y*size.y),i32(normPos.z*size.z)),outputColor);fragmentOutputs.color=vec4<f32>(vec3<f32>(normPos),1.);}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["iblVoxelGridPixelShaderWGSL",0,{name:r,shader:i}])},582914,e=>{"use strict";var t=e.i(263537);e.i(243400),e.i(561525);let r="lightProxyVertexShader",i=`attribute position: vec3f;flat varying vOffset: u32;flat varying vMask: u32;
#include<sceneUboDeclaration>
var lightDataTexture: texture_2d<f32>;uniform tileMaskResolution: vec3f;uniform halfTileRes: vec2f;
#include<clusteredLightingFunctions>
@vertex
fn main(input: VertexInputs)->FragmentInputs {let light=getClusteredLight(lightDataTexture,vertexInputs.instanceIndex);let range=light.vLightFalloff.x;let viewPosition=scene.view*vec4f(light.vLightData.xyz,1);let viewPositionSq=viewPosition*viewPosition;let distSq=viewPositionSq.xy+viewPositionSq.z;let sinSq=(range*range)/distSq;let cosSq=max(1.0-sinSq,vec2f(0.01));let sinCos=vertexInputs.position.xy*sqrt(sinSq*cosSq);
#ifdef RIGHT_HANDED
let rotatedX=mat2x2f(cosSq.x,sinCos.x,-sinCos.x,cosSq.x)*viewPosition.xz;let rotatedY=mat2x2f(cosSq.y,sinCos.y,-sinCos.y,cosSq.y)*viewPosition.yz;
#else
let rotatedX=mat2x2f(cosSq.x,-sinCos.x,sinCos.x,cosSq.x)*viewPosition.xz;let rotatedY=mat2x2f(cosSq.y,-sinCos.y,sinCos.y,cosSq.y)*viewPosition.yz;
#endif
let projX=scene.projection*vec4f(rotatedX.x,0,rotatedX.y,1);let projY=scene.projection*vec4f(0,rotatedY.x,rotatedY.y,1);var projPosition=vec2f(projX.x/max(projX.w,0.01),projY.y/max(projY.w,0.01));projPosition=select(vertexInputs.position.xy,projPosition,cosSq>vec2(0.01));let halfTileRes=uniforms.tileMaskResolution.xy/2.0;var tilePosition=(projPosition+1.0)*halfTileRes;tilePosition=select(floor(tilePosition)-0.01,ceil(tilePosition)+0.01,vertexInputs.position.xy>vec2f(0));vertexOutputs.position=vec4f(tilePosition/halfTileRes-1.0,0,1);vertexOutputs.vOffset=vertexInputs.instanceIndex/CLUSTLIGHT_BATCH;vertexOutputs.vMask=1u<<(vertexInputs.instanceIndex % CLUSTLIGHT_BATCH);}
`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["lightProxyVertexShaderWGSL",0,{name:r,shader:i}])},131857,e=>{"use strict";var t=e.i(263537);let r="convolutionPixelShader",i=`varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;uniform screenSize: vec2f;uniform kernel: array<f32,9>;
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var onePixel: vec2f= vec2f(1.0,1.0)/uniforms.screenSize;var colorSum: vec4f =
textureSample(textureSampler,textureSamplerSampler,input.vUV+onePixel* vec2f(-1,-1))*uniforms.kernel[0] +
textureSample(textureSampler,textureSamplerSampler,input.vUV+onePixel* vec2f(0,-1))*uniforms.kernel[1] +
textureSample(textureSampler,textureSamplerSampler,input.vUV+onePixel* vec2f(1,-1))*uniforms.kernel[2] +
textureSample(textureSampler,textureSamplerSampler,input.vUV+onePixel* vec2f(-1,0))*uniforms.kernel[3] +
textureSample(textureSampler,textureSamplerSampler,input.vUV+onePixel* vec2f(0,0))*uniforms.kernel[4] +
textureSample(textureSampler,textureSamplerSampler,input.vUV+onePixel* vec2f(1,0))*uniforms.kernel[5] +
textureSample(textureSampler,textureSamplerSampler,input.vUV+onePixel* vec2f(-1,1))*uniforms.kernel[6] +
textureSample(textureSampler,textureSamplerSampler,input.vUV+onePixel* vec2f(0,1))*uniforms.kernel[7] +
textureSample(textureSampler,textureSamplerSampler,input.vUV+onePixel* vec2f(1,1))*uniforms.kernel[8];var kernelWeight: f32 =
uniforms.kernel[0] +
uniforms.kernel[1] +
uniforms.kernel[2] +
uniforms.kernel[3] +
uniforms.kernel[4] +
uniforms.kernel[5] +
uniforms.kernel[6] +
uniforms.kernel[7] +
uniforms.kernel[8];if (kernelWeight<=0.0) {kernelWeight=1.0;}
fragmentOutputs.color= vec4f((colorSum/kernelWeight).rgb,1);}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["convolutionPixelShaderWGSL",0,{name:r,shader:i}])},735089,e=>{"use strict";var t=e.i(263537);e.i(261937),e.i(315647),e.i(127010),e.i(201632),e.i(310063),e.i(190688),e.i(141687),e.i(358759),e.i(313119);let r="particlesPixelShader",i=`#ifdef LOGARITHMICDEPTH
#extension GL_EXT_frag_depth : enable
#endif
varying vec2 vUV;varying vec4 vColor;uniform vec4 textureMask;uniform sampler2D diffuseSampler;
#include<clipPlaneFragmentDeclaration>
#include<imageProcessingDeclaration>
#include<logDepthDeclaration>
#include<helperFunctions>
#include<imageProcessingFunctions>
#ifdef RAMPGRADIENT
varying vec4 remapRanges;uniform sampler2D rampSampler;
#endif
#include<fogFragmentDeclaration>
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
#include<clipPlaneFragment>
vec4 textureColor=texture2D(diffuseSampler,vUV);vec4 baseColor=(textureColor*textureMask+(vec4(1.,1.,1.,1.)-textureMask))*vColor;
#ifdef RAMPGRADIENT
float alpha=baseColor.a;float remappedColorIndex=clamp((alpha-remapRanges.x)/remapRanges.y,0.0,1.0);vec4 rampColor=texture2D(rampSampler,vec2(1.0-remappedColorIndex,0.));baseColor.rgb*=rampColor.rgb;float finalAlpha=baseColor.a;baseColor.a=clamp((alpha*rampColor.a-remapRanges.z)/remapRanges.w,0.0,1.0);
#endif
#ifdef BLENDMULTIPLYMODE
float sourceAlpha=vColor.a*textureColor.a;baseColor.rgb=baseColor.rgb*sourceAlpha+vec3(1.0)*(1.0-sourceAlpha);
#endif
#include<logDepthFragment>
#include<fogFragment>(color,baseColor)
#ifdef IMAGEPROCESSINGPOSTPROCESS
baseColor.rgb=toLinearSpace(baseColor.rgb);
#else
#ifdef IMAGEPROCESSING
baseColor.rgb=toLinearSpace(baseColor.rgb);baseColor=applyImageProcessing(baseColor);
#endif
#endif
gl_FragColor=baseColor;
#define CUSTOM_FRAGMENT_MAIN_END
}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["particlesPixelShader",0,{name:r,shader:i}])},978597,e=>{"use strict";var t=e.i(719332),r=e.i(611436),i=e.i(238463),a=e.i(411702),o=e.i(305836);class n extends t.AbstractSoundSource{constructor(e,t,r,i){super(e,r,i),this._stereo=null,this._webAudioNode=null,this._audioContext=this.engine._audioContext,this._webAudioNode=t,this._subGraph=new n._SubGraph(this)}async _initAsync(e){e.outBus?this.outBus=e.outBus:!1!==e.outBusAutoDefault&&(await this.engine.isReadyPromise,this.outBus=this.engine.defaultMainBus),await this._subGraph.initAsync(e),(0,r._HasSpatialAudioOptions)(e)&&this._initSpatialProperty(),this.engine._addNode(this)}get _inNode(){return this._webAudioNode}get _outNode(){return this._subGraph._outNode}get stereo(){return this._stereo??(this._stereo=new i._StereoAudio(this._subGraph))}dispose(){if(super.dispose(),this._webAudioNode){if(this._webAudioNode instanceof MediaStreamAudioSourceNode)for(let e of this._webAudioNode.mediaStream.getTracks())e.stop();this._webAudioNode.disconnect(),this._webAudioNode=null}this._stereo=null,this._subGraph.dispose(),this.engine._removeNode(this)}getClassName(){return"_WebAudioSoundSource"}_connect(e){return!!super._connect(e)&&(e._inNode&&this._outNode?.connect(e._inNode),!0)}_disconnect(e){return!!super._disconnect(e)&&(e._inNode&&this._outNode?.disconnect(e._inNode),!0)}_createSpatialProperty(e,t){return new o._SpatialWebAudio(this._subGraph,e,t)}}n._SubGraph=class extends a._WebAudioBusAndSoundSubGraph{get _downstreamNodes(){return this._owner._downstreamNodes??null}get _upstreamNodes(){return this._owner._upstreamNodes??null}_onSubNodesChanged(){super._onSubNodesChanged(),this._owner._inNode?.disconnect(),this._owner._subGraph._inNode&&this._owner._inNode?.connect(this._owner._subGraph._inNode)}},e.s(["_WebAudioSoundSource",0,n])},185397,e=>{"use strict";var t=e.i(263537);e.i(407892),e.i(380244),e.i(585817),e.i(945868),e.i(13486),e.i(988389),e.i(431235),e.i(300889),e.i(398879),e.i(92372);let r="meshUVSpaceRendererVertexShader",i=`attribute position: vec3f;attribute normal: vec3f;attribute uv: vec2f;uniform projMatrix: mat4x4f;varying vDecalTC: vec2f;
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]
#include<instancesDeclaration>
@vertex
fn main(input : VertexInputs)->FragmentInputs {var positionUpdated: vec3f=vertexInputs.position;var normalUpdated: vec3f=vertexInputs.normal;
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
var worldPos: vec4f=finalWorld* vec4f(positionUpdated,1.0);var normWorldSM: mat3x3f= mat3x3f(finalWorld[0].xyz,finalWorld[1].xyz,finalWorld[2].xyz);var vNormalW: vec3f;
#if defined(INSTANCES) && defined(THIN_INSTANCES)
vNormalW=normalUpdated/ vec3f(dot(normWorldSM[0],normWorldSM[0]),dot(normWorldSM[1],normWorldSM[1]),dot(normWorldSM[2],normWorldSM[2]));vNormalW=normalize(normWorldSM*vNormalW);
#else
#ifdef NONUNIFORMSCALING
normWorldSM=transposeMat3(inverseMat3(normWorldSM));
#endif
vNormalW=normalize(normWorldSM*normalUpdated);
#endif
var normalView: vec3f=normalize((uniforms.projMatrix* vec4f(vNormalW,0.0)).xyz);var decalTC: vec3f=(uniforms.projMatrix*worldPos).xyz;vertexOutputs.vDecalTC=decalTC.xy;vertexOutputs.position=vec4f(vertexInputs.uv*2.0-1.0,select(decalTC.z,2.,normalView.z>0.0),1.0);}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["meshUVSpaceRendererVertexShaderWGSL",0,{name:r,shader:i}])},796851,e=>{"use strict";var t=e.i(916624),r=e.i(353679),i=e.i(774685);class a extends r.FlowGraphExecutionBlockWithOutSignal{constructor(e){for(const r in super(e),this.config=e,this.config.eventData){const e=this.config.eventData[r],i="string"==typeof e.type?e.type:e.type?.typeName,a="function"==typeof e.type?.serialize?e.type:(0,t.getRichTypeByFlowGraphType)(i);e.type=a,this.registerDataInput(r,a,e.value)}}_execute(e){let t=this.config.eventId,r={};for(let t of this.dataInputs)r[t.name]=t.getValue(e);e.configuration.coordinator.notifyCustomEvent(t,r),this.out._activateSignal(e)}serialize(e={}){super.serialize(e);let t={};for(let e in this.config.eventData){let r=this.config.eventData[e];t[e]={type:r.type.typeName},void 0!==r.value&&(t[e].value=r.value)}e.config.eventData=t}getClassName(){return"FlowGraphSendCustomEventBlock"}}(0,i.RegisterClass)("FlowGraphSendCustomEventBlock",a),e.s(["FlowGraphSendCustomEventBlock",0,a])},722258,e=>{"use strict";var t=e.i(263537);e.i(407892),e.i(380244),e.i(349e3),e.i(158271),e.i(13486),e.i(300889),e.i(398879),e.i(92372),e.i(84318),e.i(492952),e.i(556333);let r="colorVertexShader",i=`attribute position: vec3f;
#ifdef VERTEXCOLOR
attribute color: vec4f;
#endif
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<clipPlaneVertexDeclaration>
#include<fogVertexDeclaration>
#ifdef FOG
uniform view: mat4x4f;
#endif
#include<instancesDeclaration>
uniform viewProjection: mat4x4f;
#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
varying vColor: vec4f;
#endif
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input : VertexInputs)->FragmentInputs {
#define CUSTOM_VERTEX_MAIN_BEGIN
#ifdef VERTEXCOLOR
var colorUpdated: vec4f=vertexInputs.color;
#endif
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
var worldPos: vec4f=finalWorld* vec4f(vertexInputs.position,1.0);vertexOutputs.position=uniforms.viewProjection*worldPos;
#include<clipPlaneVertex>
#include<fogVertex>
#include<vertexColorMixing>
#define CUSTOM_VERTEX_MAIN_END
}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["colorVertexShaderWGSL",0,{name:r,shader:i}])},475086,e=>{"use strict";var t=e.i(263537);let r="meshUVSpaceRendererFinaliserPixelShader",i=`#define DISABLE_UNIFORMITY_ANALYSIS
varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;var maskTextureSamplerSampler: sampler;var maskTextureSampler: texture_2d<f32>;uniform textureSize: vec2f;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var mask: vec4f=textureSample(maskTextureSampler,maskTextureSamplerSampler,input.vUV).rgba;if (mask.r>0.5) {fragmentOutputs.color=textureSample(textureSampler,textureSamplerSampler,input.vUV);} else {var texelSize: vec2f=4.0/uniforms.textureSize;var uv_p01: vec2f=input.vUV+ vec2f(-1.0,0.0)*texelSize;var uv_p21: vec2f=input.vUV+ vec2f(1.0,0.0)*texelSize;var uv_p10: vec2f=input.vUV+ vec2f(0.0,-1.0)*texelSize;var uv_p12: vec2f=input.vUV+ vec2f(0.0,1.0)*texelSize;var mask_p01: f32=textureSample(maskTextureSampler,maskTextureSamplerSampler,uv_p01).r;var mask_p21: f32=textureSample(maskTextureSampler,maskTextureSamplerSampler,uv_p21).r;var mask_p10: f32=textureSample(maskTextureSampler,maskTextureSamplerSampler,uv_p10).r;var mask_p12: f32=textureSample(maskTextureSampler,maskTextureSamplerSampler,uv_p12).r;var col: vec4f= vec4f(0.0,0.0,0.0,0.0);var total_weight: f32=0.0;if (mask_p01>0.5) {col+=textureSample(textureSampler,textureSamplerSampler,uv_p01);total_weight+=1.0;}
if (mask_p21>0.5) {col+=textureSample(textureSampler,textureSamplerSampler,uv_p21);total_weight+=1.0;}
if (mask_p10>0.5) {col+=textureSample(textureSampler,textureSamplerSampler,uv_p10);total_weight+=1.0;}
if (mask_p12>0.5) {col+=textureSample(textureSampler,textureSamplerSampler,uv_p12);total_weight+=1.0;}
if (total_weight>0.0) {fragmentOutputs.color=col/total_weight;} else {fragmentOutputs.color=col;}}}
`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["meshUVSpaceRendererFinaliserPixelShaderWGSL",0,{name:r,shader:i}])},939689,e=>{"use strict";var t=e.i(263537);let r="passCubePixelShader",i=`varying vec2 vUV;uniform samplerCube textureSampler;
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) 
{vec2 uv=vUV*2.0-1.0;
#ifdef POSITIVEX
gl_FragColor=textureCube(textureSampler,vec3(1.001,uv.y,uv.x));
#endif
#ifdef NEGATIVEX
gl_FragColor=textureCube(textureSampler,vec3(-1.001,uv.y,uv.x));
#endif
#ifdef POSITIVEY
gl_FragColor=textureCube(textureSampler,vec3(uv.y,1.001,uv.x));
#endif
#ifdef NEGATIVEY
gl_FragColor=textureCube(textureSampler,vec3(uv.y,-1.001,uv.x));
#endif
#ifdef POSITIVEZ
gl_FragColor=textureCube(textureSampler,vec3(uv,1.001));
#endif
#ifdef NEGATIVEZ
gl_FragColor=textureCube(textureSampler,vec3(uv,-1.001));
#endif
}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["passCubePixelShader",0,{name:r,shader:i}])},321544,e=>{"use strict";var t=e.i(263537);let r="iblCombineVoxelGridsPixelShader",i="precision highp float;precision highp sampler3D;varying vec2 vUV;uniform sampler3D voxelXaxisSampler;uniform sampler3D voxelYaxisSampler;uniform sampler3D voxelZaxisSampler;uniform float layer;void main(void) {vec3 coordZ=vec3(vUV.x,vUV.y,layer);float voxelZ=texture(voxelZaxisSampler,coordZ).r;vec3 coordX=vec3(1.0-layer,vUV.y,vUV.x);float voxelX=texture(voxelXaxisSampler,coordX).r;vec3 coordY=vec3(layer,vUV.x,vUV.y);float voxelY=texture(voxelYaxisSampler,coordY).r;float voxel=(voxelX>0.0 || voxelY>0.0 || voxelZ>0.0) ? 1.0 : 0.0;glFragColor=vec4(vec3(voxel),1.0);}";t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["iblCombineVoxelGridsPixelShader",0,{name:r,shader:i}])},367376,e=>{"use strict";var t=e.i(916624),r=e.i(353679),i=e.i(774685);class a extends r.FlowGraphExecutionBlockWithOutSignal{constructor(e){super(e),this.count=this.registerDataOutput("count",t.RichTypeNumber),this.reset=this._registerSignalInput("reset")}_execute(e,t){if(t===this.reset){e._setExecutionVariable(this,"count",0),this.count.setValue(0,e);return}let r=e._getExecutionVariable(this,"count",0)+1;e._setExecutionVariable(this,"count",r),this.count.setValue(r,e),this.out._activateSignal(e)}getClassName(){return"FlowGraphCallCounterBlock"}}(0,i.RegisterClass)("FlowGraphCallCounterBlock",a),e.s(["FlowGraphCallCounterBlock",0,a])},440484,e=>{"use strict";var t=e.i(774685),r=e.i(353679),i=e.i(916624),a=e.i(711835);class o extends r.FlowGraphExecutionBlockWithOutSignal{constructor(e){super(e),this.delayIndex=this.registerDataInput("delayIndex",i.RichTypeFlowGraphInteger)}_execute(e,t){let r=(0,a.getNumericValue)(this.delayIndex.getValue(e));if(r<=0||isNaN(r)||!isFinite(r))return this._reportError(e,"Invalid delay index");let i=e._getGlobalContextVariable("pendingDelays",[])[r];i&&i.dispose(),this.out._activateSignal(e)}getClassName(){return"FlowGraphCancelDelayBlock"}}(0,t.RegisterClass)("FlowGraphCancelDelayBlock",o),e.s(["FlowGraphCancelDelayBlock",0,o])},70391,e=>{"use strict";var t=e.i(263537);let r="iblShadowGBufferDebugPixelShader",i=`varying vUV : vec2f;var textureSamplerSampler : sampler;var textureSampler : texture_2d<f32>;var depthSamplerSampler : sampler;var depthSampler : texture_2d<f32>;var normalSamplerSampler : sampler;var normalSampler : texture_2d<f32>;var positionSamplerSampler : sampler;var positionSampler : texture_2d<f32>;var velocitySamplerSampler : sampler;var velocitySampler : texture_2d<f32>;uniform sizeParams : vec4f;
#define offsetX uniforms.sizeParams.x
#define offsetY uniforms.sizeParams.y
#define widthScale uniforms.sizeParams.z
#define heightScale uniforms.sizeParams.w
@fragment fn main(input : FragmentInputs)->FragmentOutputs {var uv : vec2f=
vec2f((offsetX+input.vUV.x)*widthScale,(offsetY+input.vUV.y)*heightScale);var backgroundColour: vec4f=textureSample(textureSampler,textureSamplerSampler,input.vUV).rgba;var depth : vec4f=textureSample(depthSampler,depthSamplerSampler,input.vUV);var worldNormal: vec4f=textureSample(normalSampler,normalSamplerSampler,input.vUV);var worldPosition : vec4f=textureSample(positionSampler,positionSamplerSampler,input.vUV);var velocityLinear : vec4f=textureSample(velocitySampler,velocitySamplerSampler,input.vUV);if (uv.x<0.0 || uv.x>1.0 || uv.y<0.0 || uv.y>1.0) {fragmentOutputs.color=backgroundColour;} else {if (uv.x<=0.25) {fragmentOutputs.color=vec4f(depth.rgb,1.0);} else if (uv.x<=0.5) {velocityLinear =
vec4f(velocityLinear.r*0.5+0.5,velocityLinear.g*0.5+0.5,
velocityLinear.b,velocityLinear.a);fragmentOutputs.color=vec4f(velocityLinear.rgb,1.0);} else if (uv.x<=0.75) {fragmentOutputs.color=vec4f(worldPosition.rgb,1.0);} else {fragmentOutputs.color=vec4f(worldNormal.rgb,1.0);}}}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["iblShadowGBufferDebugPixelShaderWGSL",0,{name:r,shader:i}])},302898,e=>{"use strict";var t=e.i(263537);e.i(624154),e.i(568039),e.i(880779),e.i(298378),e.i(369136),e.i(675406),e.i(610460),e.i(587630),e.i(761523),e.i(479126);let r="iblVoxelGridVertexShader",i=`attribute vec3 position;varying vec3 vNormalizedPosition;
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<instancesDeclaration>
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]
uniform mat4 invWorldScale;uniform mat4 viewMatrix;void main(void) {vec3 positionUpdated=position;
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
vec4 worldPos=finalWorld*vec4(positionUpdated,1.0);gl_Position=viewMatrix*invWorldScale*worldPos;vNormalizedPosition.xyz=gl_Position.xyz*0.5+0.5;
#ifdef IS_NDC_HALF_ZRANGE
gl_Position.z=gl_Position.z*0.5+0.5;
#endif
}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["iblVoxelGridVertexShader",0,{name:r,shader:i}])},146032,894938,e=>{"use strict";var t=e.i(263537);e.i(755704),e.i(357351),e.i(562396),e.i(476129),e.i(922446);let r="gaussianSplattingFragmentDeclaration",i=`fn gaussianColor(inColor: vec4f,inPosition: vec2f)->vec4f
{var A : f32=-dot(inPosition,inPosition);if (A>-4.0)
{var B: f32=exp(A)*inColor.a;
#include<logDepthFragment>
var color: vec3f=inColor.rgb;
#ifdef FOG
#include<fogFragment>
#endif
return vec4f(color,B);} else {return vec4f(0.0);}}
`;t.ShaderStore.IncludesShadersStoreWGSL[r]||(t.ShaderStore.IncludesShadersStoreWGSL[r]=i),e.s([],894938),e.i(212954);let a="gaussianSplattingPixelShader",o=`#include<clipPlaneFragmentDeclaration>
#include<logDepthDeclaration>
#include<fogFragmentDeclaration>
varying vColor: vec4f;varying vPosition: vec2f;
#define CUSTOM_FRAGMENT_DEFINITIONS
#include<gaussianSplattingFragmentDeclaration>
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
#include<clipPlaneFragment>
var finalColor: vec4f=gaussianColor(input.vColor,input.vPosition);
#define CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR
fragmentOutputs.color=finalColor;
#define CUSTOM_FRAGMENT_MAIN_END
}
`;t.ShaderStore.ShadersStoreWGSL[a]||(t.ShaderStore.ShadersStoreWGSL[a]=o),e.s(["gaussianSplattingPixelShaderWGSL",0,{name:a,shader:o}],146032)},808576,e=>{"use strict";var t=e.i(263537);e.i(624154),e.i(568039),e.i(298378),e.i(369136),e.i(880779),e.i(675406),e.i(610460),e.i(587630),e.i(761523),e.i(479126);let r="meshUVSpaceRendererVertexShader",i=`precision highp float;attribute vec3 position;attribute vec3 normal;attribute vec2 uv;uniform mat4 projMatrix;varying vec2 vDecalTC;
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]
#include<instancesDeclaration>
void main(void) {vec3 positionUpdated=position;vec3 normalUpdated=normal;
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
vec4 worldPos=finalWorld*vec4(positionUpdated,1.0);mat3 normWorldSM=mat3(finalWorld);vec3 vNormalW;
#if defined(INSTANCES) && defined(THIN_INSTANCES)
vNormalW=normalUpdated/vec3(dot(normWorldSM[0],normWorldSM[0]),dot(normWorldSM[1],normWorldSM[1]),dot(normWorldSM[2],normWorldSM[2]));vNormalW=normalize(normWorldSM*vNormalW);
#else
#ifdef NONUNIFORMSCALING
normWorldSM=transposeMat3(inverseMat3(normWorldSM));
#endif
vNormalW=normalize(normWorldSM*normalUpdated);
#endif
vec3 normalView=normalize((projMatrix*vec4(vNormalW,0.0)).xyz);vec3 decalTC=(projMatrix*worldPos).xyz;vDecalTC=decalTC.xy;gl_Position=vec4(uv*2.0-1.0,normalView.z>0.0 ? 2. : decalTC.z,1.0);}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["meshUVSpaceRendererVertexShader",0,{name:r,shader:i}])},452475,e=>{"use strict";var t=e.i(263537);let r="iblShadowDebugPixelShader",i=`#ifdef GL_ES
precision mediump float;
#endif
varying vec2 vUV;uniform sampler2D textureSampler;uniform sampler2D debugSampler;uniform vec4 sizeParams;
#define offsetX sizeParams.x
#define offsetY sizeParams.y
#define widthScale sizeParams.z
#define heightScale sizeParams.w
void main(void) {vec2 uv =
vec2((offsetX+vUV.x)*widthScale,(offsetY+vUV.y)*heightScale);vec4 background=texture2D(textureSampler,vUV);vec4 debugColour=texture2D(debugSampler,vUV);if (uv.x<0.0 || uv.x>1.0 || uv.y<0.0 || uv.y>1.0) {gl_FragColor.rgba=background;} else {gl_FragColor.rgb=mix(debugColour.rgb,background.rgb,0.0);gl_FragColor.a=1.0;}}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["iblShadowDebugPixelShader",0,{name:r,shader:i}])},188709,e=>{"use strict";var t=e.i(263537);e.i(201632),e.i(442357),e.i(424192),e.i(289258);let r="hdrFilteringPixelShader",i=`#include<helperFunctions>
#include<importanceSampling>
#include<pbrBRDFFunctions>
#include<hdrFilteringFunctions>
uniform float alphaG;uniform samplerCube inputTexture;uniform vec2 vFilteringInfo;uniform float hdrScale;varying vec3 direction;void main() {vec3 color=radiance(alphaG,inputTexture,direction,vFilteringInfo);gl_FragColor=vec4(color*hdrScale,1.0);}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["hdrFilteringPixelShader",0,{name:r,shader:i}])},850215,e=>{"use strict";var t=e.i(263537);e.i(738124);let r="grainPixelShader",i=`#include<helperFunctions>
varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;uniform intensity: f32;uniform animatedSeed: f32;
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {fragmentOutputs.color=textureSample(textureSampler,textureSamplerSampler,input.vUV);var seed: vec2f=input.vUV*uniforms.animatedSeed;var grain: f32=dither(seed,uniforms.intensity);var lum: f32=getLuminance(fragmentOutputs.color.rgb);var grainAmount: f32=(cos(-PI+(lum*PI*2.))+1.)/2.;fragmentOutputs.color=vec4f(fragmentOutputs.color.rgb+grain*grainAmount,fragmentOutputs.color.a);fragmentOutputs.color=vec4f(max(fragmentOutputs.color.rgb,vec3f(0.0)),fragmentOutputs.color.a);}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["grainPixelShaderWGSL",0,{name:r,shader:i}])},259163,e=>{"use strict";var t=e.i(263537);let r="glowBlurPostProcessPixelShader",i=`varying vec2 vUV;uniform sampler2D textureSampler;uniform vec2 screenSize;uniform vec2 direction;uniform float blurWidth;float getLuminance(vec3 color)
{return dot(color,vec3(0.2126,0.7152,0.0722));}
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void)
{float weights[7];weights[0]=0.05;weights[1]=0.1;weights[2]=0.2;weights[3]=0.3;weights[4]=0.2;weights[5]=0.1;weights[6]=0.05;vec2 texelSize=vec2(1.0/screenSize.x,1.0/screenSize.y);vec2 texelStep=texelSize*direction*blurWidth;vec2 start=vUV-3.0*texelStep;vec4 baseColor=vec4(0.,0.,0.,0.);vec2 texelOffset=vec2(0.,0.);for (int i=0; i<7; i++)
{vec4 texel=texture2D(textureSampler,start+texelOffset);baseColor.a+=texel.a*weights[i];float luminance=getLuminance(baseColor.rgb);float luminanceTexel=getLuminance(texel.rgb);float choice=step(luminanceTexel,luminance);baseColor.rgb=choice*baseColor.rgb+(1.0-choice)*texel.rgb;texelOffset+=texelStep;}
gl_FragColor=baseColor;}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["glowBlurPostProcessPixelShader",0,{name:r,shader:i}])},44019,e=>{"use strict";var t=e.i(916624),r=e.i(774685),i=e.i(196548);class a extends i.FlowGraphCachedOperationBlock{constructor(e){super(t.RichTypeAny,e),this.config=e,this.object=this.registerDataInput("object",t.RichTypeAny,e.object),this.propertyName=this.registerDataInput("propertyName",t.RichTypeString,e.propertyName),this.customGetFunction=this.registerDataInput("customGetFunction",t.RichTypeAny)}_doOperation(e){let t,r=this.customGetFunction.getValue(e);if(r)t=r(this.object.getValue(e),this.propertyName.getValue(e),e);else{let r=this.object.getValue(e),i=this.propertyName.getValue(e);t=r&&i?this._getPropertyValue(r,i):void 0}return t}_getPropertyValue(e,t){let r=t.split("."),i=e;for(let e of r)if(void 0===(i=i[e]))return;return i}getClassName(){return"FlowGraphGetPropertyBlock"}}(0,r.RegisterClass)("FlowGraphGetPropertyBlock",a),e.s(["FlowGraphGetPropertyBlock",0,a])},574392,e=>{"use strict";var t=e.i(263537);e.i(880779),e.i(587630);let r="greasedLineVertexShader",i=`precision highp float;
#include<instancesDeclaration>
attribute float grl_widths;attribute vec3 grl_offsets;attribute float grl_colorPointers;attribute vec3 position;uniform mat4 viewProjection;uniform mat4 projection;varying float grlCounters;varying float grlColorPointer;
#ifdef GREASED_LINE_CAMERA_FACING
attribute vec4 grl_nextAndCounters;attribute vec4 grl_previousAndSide;uniform vec2 grlResolution;uniform float grlAspect;uniform float grlWidth;uniform float grlSizeAttenuation;vec2 grlFix( vec4 i,float aspect ) {vec2 res=i.xy/i.w;res.x*=aspect;return res;}
#else
attribute vec3 grl_slopes;attribute float grl_counters;
#endif
void main() {
#include<instancesVertex>
grlColorPointer=grl_colorPointers;mat4 grlMatrix=viewProjection*finalWorld ;
#ifdef GREASED_LINE_CAMERA_FACING
float grlBaseWidth=grlWidth;vec3 grlPrevious=grl_previousAndSide.xyz;float grlSide=grl_previousAndSide.w;vec3 grlNext=grl_nextAndCounters.xyz;grlCounters=grl_nextAndCounters.w;float grlWidth=grlBaseWidth*grl_widths;vec3 positionUpdated=position+grl_offsets;vec3 worldDir=normalize(grlNext-grlPrevious);vec3 nearPosition=positionUpdated+(worldDir*0.01);vec4 grlFinalPosition=grlMatrix*vec4( positionUpdated ,1.0);vec4 screenNearPos=grlMatrix*vec4(nearPosition,1.0);vec2 grlLinePosition=grlFix(grlFinalPosition,grlAspect);vec2 grlLineNearPosition=grlFix(screenNearPos,grlAspect);vec2 grlDir=normalize(grlLineNearPosition-grlLinePosition);vec4 grlNormal=vec4( -grlDir.y,grlDir.x,0.,1. );
#ifdef GREASED_LINE_RIGHT_HANDED_COORDINATE_SYSTEM
grlNormal.xy*=-.5*grlWidth;
#else
grlNormal.xy*=.5*grlWidth;
#endif
grlNormal*=projection;if (grlSizeAttenuation==1.) {grlNormal.xy*=grlFinalPosition.w;grlNormal.xy/=( vec4( grlResolution,0.,1. )*projection ).xy;}
grlFinalPosition.xy+=grlNormal.xy*grlSide;gl_Position=grlFinalPosition;
#else
grlCounters=grl_counters;vec4 grlFinalPosition=grlMatrix*vec4( (position+grl_offsets)+grl_slopes*grl_widths ,1.0 ) ;gl_Position=grlFinalPosition;
#endif
}
`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["greasedLineVertexShader",0,{name:r,shader:i}])},315795,e=>{"use strict";var t=e.i(263537);let r="depthOfFieldMergePixelShader",i=`varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;var circleOfConfusionSamplerSampler: sampler;var circleOfConfusionSampler: texture_2d<f32>;var blurStep0Sampler: sampler;var blurStep0: texture_2d<f32>;
#if BLUR_LEVEL>0
var blurStep1Sampler: sampler;var blurStep1: texture_2d<f32>;
#endif
#if BLUR_LEVEL>1
var blurStep2Sampler: sampler;var blurStep2: texture_2d<f32>;
#endif
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var coc: f32=textureSampleLevel(circleOfConfusionSampler,circleOfConfusionSamplerSampler,input.vUV,0.0).r;
#if BLUR_LEVEL==0
var original: vec4f=textureSampleLevel(textureSampler,textureSamplerSampler,input.vUV,0.0);var blurred0: vec4f=textureSampleLevel(blurStep0,blurStep0Sampler,input.vUV,0.0);fragmentOutputs.color=mix(original,blurred0,coc);
#endif
#if BLUR_LEVEL==1
if(coc<0.5){var original: vec4f=textureSampleLevel(textureSampler,textureSamplerSampler,input.vUV,0.0);var blurred1: vec4f=textureSampleLevel(blurStep1,blurStep1Sampler,input.vUV,0.0);fragmentOutputs.color=mix(original,blurred1,coc/0.5);}else{var blurred0: vec4f=textureSampleLevel(blurStep0,blurStep0Sampler,input.vUV,0.0);var blurred1: vec4f=textureSampleLevel(blurStep1,blurStep1Sampler,input.vUV,0.0);fragmentOutputs.color=mix(blurred1,blurred0,(coc-0.5)/0.5);}
#endif
#if BLUR_LEVEL==2
if(coc<0.33){var original: vec4f=textureSampleLevel(textureSampler,textureSamplerSampler,input.vUV,0.0);var blurred2: vec4f=textureSampleLevel(blurStep2,blurStep2Sampler,input.vUV,0.0);fragmentOutputs.color=mix(original,blurred2,coc/0.33);}else if(coc<0.66){var blurred1: vec4f=textureSampleLevel(blurStep1,blurStep1Sampler,input.vUV,0.0);var blurred2: vec4f=textureSampleLevel(blurStep2,blurStep2Sampler,input.vUV,0.0);fragmentOutputs.color=mix(blurred2,blurred1,(coc-0.33)/0.33);}else{var blurred0: vec4f=textureSampleLevel(blurStep0,blurStep0Sampler,input.vUV,0.0);var blurred1: vec4f=textureSampleLevel(blurStep1,blurStep1Sampler,input.vUV,0.0);fragmentOutputs.color=mix(blurred1,blurred0,(coc-0.66)/0.34);}
#endif
}
`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["depthOfFieldMergePixelShaderWGSL",0,{name:r,shader:i}])},564919,e=>{"use strict";var t=e.i(263537);let r="iblShadowAccumulationPixelShader",i=`varying vUV: vec2f;uniform accumulationParameters: vec4f;
#define remanence uniforms.accumulationParameters.x
#define resetb uniforms.accumulationParameters.y
#define sceneSize uniforms.accumulationParameters.z
var motionSampler: texture_2d<f32>;var positionSampler: texture_2d<f32>;var spatialBlurSampler : texture_2d<f32>;var oldAccumulationSamplerSampler: sampler;var oldAccumulationSampler: texture_2d<f32>;var prevPositionSamplerSampler: sampler;var prevPositionSampler: texture_2d<f32>;fn max2(v: vec2f,w: vec2f)->vec2f { 
return vec2f(max(v.x,w.x),max(v.y,w.y)); }
fn lessThan(x: vec2f,y: vec2f)->vec2<bool> {return x<y;}
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var reset: bool= bool(resetb);var gbufferRes : vec2f=vec2f(textureDimensions(positionSampler,0));var gbufferPixelCoord: vec2i= vec2i(input.vUV*gbufferRes);var shadowRes : vec2f=vec2f(textureDimensions(spatialBlurSampler,0));var shadowPixelCoord: vec2i= vec2i(input.vUV*shadowRes);var LP: vec4f=textureLoad(positionSampler,gbufferPixelCoord,0);if (0.0==LP.w) {fragmentOutputs.color=vec4f(1.0,0.0,0.0,1.0);return fragmentOutputs;}
var velocityColor: vec2f=textureLoad(motionSampler,gbufferPixelCoord,0).xy;var prevCoord: vec2f=input.vUV+velocityColor;var PrevLP: vec3f=textureSampleLevel(prevPositionSampler,prevPositionSamplerSampler,prevCoord,0.0).xyz;var PrevShadows: vec4f=textureSampleLevel(oldAccumulationSampler,oldAccumulationSamplerSampler,prevCoord,0.0);var newShadows : vec3f=textureLoad(spatialBlurSampler,shadowPixelCoord,0).xyz;PrevShadows.a=select(1.0,max(PrevShadows.a/(1.0+PrevShadows.a),1.0-remanence),!reset && all(lessThan(abs(prevCoord- vec2f(0.5)), vec2f(0.5))) &&
distance(LP.xyz,PrevLP)<5e-2*sceneSize);PrevShadows=max( vec4f(0.0),PrevShadows);fragmentOutputs.color= vec4f(mix(PrevShadows.x,newShadows.x,PrevShadows.a),
mix(PrevShadows.y,newShadows.y,PrevShadows.a),
mix(PrevShadows.z,newShadows.z,PrevShadows.a),PrevShadows.a);}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["iblShadowAccumulationPixelShaderWGSL",0,{name:r,shader:i}])},606294,e=>{"use strict";var t=e.i(263537);e.i(861230);let r="defaultVertexDeclaration",i=`uniform mat4 viewProjection;
#ifdef MULTIVIEW
mat4 viewProjectionR;
#endif 
uniform mat4 view;
#ifdef DIFFUSE
uniform mat4 diffuseMatrix;uniform vec2 vDiffuseInfos;
#endif
#ifdef AMBIENT
uniform mat4 ambientMatrix;uniform vec2 vAmbientInfos;
#endif
#ifdef OPACITY
uniform mat4 opacityMatrix;uniform vec2 vOpacityInfos;
#endif
#ifdef EMISSIVE
uniform vec2 vEmissiveInfos;uniform mat4 emissiveMatrix;
#endif
#ifdef LIGHTMAP
uniform vec2 vLightmapInfos;uniform mat4 lightmapMatrix;
#endif
#if defined(SPECULAR) && defined(SPECULARTERM)
uniform vec2 vSpecularInfos;uniform mat4 specularMatrix;
#endif
#ifdef BUMP
uniform vec3 vBumpInfos;uniform mat4 bumpMatrix;
#endif
#ifdef REFLECTION
uniform mat4 reflectionMatrix;
#endif
#ifdef POINTSIZE
uniform float pointSize;
#endif
#ifdef DETAIL
uniform vec4 vDetailInfos;uniform mat4 detailMatrix;
#endif
uniform vec4 cameraInfo;
#include<decalVertexDeclaration>
#define ADDITIONAL_VERTEX_DECLARATION
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.i(413073),e.i(816086),e.i(201632),e.i(624154),e.i(568039),e.i(880779),e.i(561967),e.i(654740),e.i(491476),e.i(983789),e.i(182478),e.i(30653),e.i(957479),e.i(889952),e.i(298378),e.i(369136),e.i(127010),e.i(675406),e.i(610460),e.i(587630),e.i(761523),e.i(479126),e.i(46566),e.i(591573),e.i(631130),e.i(443018),e.i(781801),e.i(313976),e.i(294715),e.i(146259),e.i(229082),e.i(94556);let a="defaultVertexShader",o=`#define CUSTOM_VERTEX_EXTENSION
#include<__decl__defaultVertex>
#define CUSTOM_VERTEX_BEGIN
attribute vec3 position;
#ifdef NORMAL
attribute vec3 normal;
#endif
#ifdef TANGENT
attribute vec4 tangent;
#endif
#ifdef UV1
attribute vec2 uv;
#endif
#include<uvAttributeDeclaration>[2..7]
#ifdef VERTEXCOLOR
attribute vec4 color;
#endif
#include<helperFunctions>
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<instancesDeclaration>
#include<prePassVertexDeclaration>
#include<mainUVVaryingDeclaration>[1..7]
#include<samplerVertexDeclaration>(_DEFINENAME_,DIFFUSE,_VARYINGNAME_,Diffuse)
#include<samplerVertexDeclaration>(_DEFINENAME_,DETAIL,_VARYINGNAME_,Detail)
#include<samplerVertexDeclaration>(_DEFINENAME_,AMBIENT,_VARYINGNAME_,Ambient)
#include<samplerVertexDeclaration>(_DEFINENAME_,OPACITY,_VARYINGNAME_,Opacity)
#include<samplerVertexDeclaration>(_DEFINENAME_,EMISSIVE,_VARYINGNAME_,Emissive)
#include<samplerVertexDeclaration>(_DEFINENAME_,LIGHTMAP,_VARYINGNAME_,Lightmap)
#if defined(SPECULARTERM)
#include<samplerVertexDeclaration>(_DEFINENAME_,SPECULAR,_VARYINGNAME_,Specular)
#endif
#include<samplerVertexDeclaration>(_DEFINENAME_,BUMP,_VARYINGNAME_,Bump)
#include<samplerVertexDeclaration>(_DEFINENAME_,DECAL,_VARYINGNAME_,Decal)
varying vec3 vPositionW;
#ifdef NORMAL
varying vec3 vNormalW;
#endif
#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
varying vec4 vColor;
#endif
#include<bumpVertexDeclaration>
#include<clipPlaneVertexDeclaration>
#include<fogVertexDeclaration>
#include<__decl__lightVxFragment>[0..maxSimultaneousLights]
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]
#ifdef REFLECTIONMAP_SKYBOX
varying vec3 vPositionUVW;
#endif
#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)
varying vec3 vDirectionW;
#endif
#if defined(CLUSTLIGHT_BATCH) && CLUSTLIGHT_BATCH>0
varying float vViewDepth;
#endif
#include<logDepthDeclaration>
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
vec3 positionUpdated=position;
#ifdef NORMAL
vec3 normalUpdated=normal;
#endif
#ifdef TANGENT
vec4 tangentUpdated=tangent;
#endif
#ifdef UV1
vec2 uvUpdated=uv;
#endif
#ifdef UV2
vec2 uv2Updated=uv2;
#endif
#ifdef VERTEXCOLOR
vec4 colorUpdated=color;
#endif
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
#ifdef REFLECTIONMAP_SKYBOX
vPositionUVW=positionUpdated;
#endif
#define CUSTOM_VERTEX_UPDATE_POSITION
#define CUSTOM_VERTEX_UPDATE_NORMAL
#include<instancesVertex>
#if defined(PREPASS) && ((defined(PREPASS_VELOCITY) || defined(PREPASS_VELOCITY_LINEAR)) && !defined(BONES_VELOCITY_ENABLED)
vCurrentPosition=viewProjection*finalWorld*vec4(positionUpdated,1.0);vPreviousPosition=previousViewProjection*finalPreviousWorld*vec4(positionUpdated,1.0);
#endif
#include<bonesVertex>
#include<bakedVertexAnimation>
vec4 worldPos=finalWorld*vec4(positionUpdated,1.0);
#ifdef NORMAL
mat3 normalWorld=mat3(finalWorld);
#if defined(INSTANCES) && defined(THIN_INSTANCES)
vNormalW=normalUpdated/vec3(dot(normalWorld[0],normalWorld[0]),dot(normalWorld[1],normalWorld[1]),dot(normalWorld[2],normalWorld[2]));vNormalW=normalize(normalWorld*vNormalW);
#else
#ifdef NONUNIFORMSCALING
normalWorld=transposeMat3(inverseMat3(normalWorld));
#endif
vNormalW=normalize(normalWorld*normalUpdated);
#endif
#endif
#define CUSTOM_VERTEX_UPDATE_WORLDPOS
#ifdef MULTIVIEW
if (gl_ViewID_OVR==0u) {gl_Position=viewProjection*worldPos;} else {gl_Position=viewProjectionR*worldPos;}
#else
gl_Position=viewProjection*worldPos;
#endif
vPositionW=vec3(worldPos);
#ifdef PREPASS
#include<prePassVertex>
#endif
#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)
vDirectionW=normalize(vec3(finalWorld*vec4(positionUpdated,0.0)));
#endif
#if defined(CLUSTLIGHT_BATCH) && CLUSTLIGHT_BATCH>0
#ifdef RIGHT_HANDED
vViewDepth=-(view*worldPos).z;
#else
vViewDepth=(view*worldPos).z;
#endif
#endif
#ifndef UV1
vec2 uvUpdated=vec2(0.,0.);
#endif
#ifndef UV2
vec2 uv2Updated=vec2(0.,0.);
#endif
#ifdef MAINUV1
vMainUV1=uvUpdated;
#endif
#ifdef MAINUV2
vMainUV2=uv2Updated;
#endif
#include<uvVariableDeclaration>[3..7]
#include<samplerVertexImplementation>(_DEFINENAME_,DIFFUSE,_VARYINGNAME_,Diffuse,_MATRIXNAME_,diffuse,_INFONAME_,DiffuseInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,DETAIL,_VARYINGNAME_,Detail,_MATRIXNAME_,detail,_INFONAME_,DetailInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,AMBIENT,_VARYINGNAME_,Ambient,_MATRIXNAME_,ambient,_INFONAME_,AmbientInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,OPACITY,_VARYINGNAME_,Opacity,_MATRIXNAME_,opacity,_INFONAME_,OpacityInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,EMISSIVE,_VARYINGNAME_,Emissive,_MATRIXNAME_,emissive,_INFONAME_,EmissiveInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,LIGHTMAP,_VARYINGNAME_,Lightmap,_MATRIXNAME_,lightmap,_INFONAME_,LightmapInfos.x)
#if defined(SPECULARTERM)
#include<samplerVertexImplementation>(_DEFINENAME_,SPECULAR,_VARYINGNAME_,Specular,_MATRIXNAME_,specular,_INFONAME_,SpecularInfos.x)
#endif
#include<samplerVertexImplementation>(_DEFINENAME_,BUMP,_VARYINGNAME_,Bump,_MATRIXNAME_,bump,_INFONAME_,BumpInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,DECAL,_VARYINGNAME_,Decal,_MATRIXNAME_,decal,_INFONAME_,DecalInfos.x)
#include<bumpVertex>
#include<clipPlaneVertex>
#include<fogVertex>
#include<shadowsVertex>[0..maxSimultaneousLights]
#include<vertexColorMixing>
#include<pointCloudVertex>
#include<logDepthVertex>
#define CUSTOM_VERTEX_MAIN_END
}
`;t.ShaderStore.ShadersStore[a]||(t.ShaderStore.ShadersStore[a]=o),e.s(["defaultVertexShader",0,{name:a,shader:o}],606294)},618642,e=>{"use strict";var t=e.i(803677);class r{constructor(){this._easingMode=r.EASINGMODE_EASEIN}setEasingMode(e){let t=Math.min(Math.max(e,0),2);this._easingMode=t}getEasingMode(){return this._easingMode}easeInCore(e){throw Error("You must implement this method")}ease(e){switch(this._easingMode){case r.EASINGMODE_EASEIN:return this.easeInCore(e);case r.EASINGMODE_EASEOUT:return 1-this.easeInCore(1-e)}return e>=.5?(1-this.easeInCore((1-e)*2))*.5+.5:.5*this.easeInCore(2*e)}}r.EASINGMODE_EASEIN=0,r.EASINGMODE_EASEOUT=1,r.EASINGMODE_EASEINOUT=2,e.s(["BackEase",0,class extends r{constructor(e=1){super(),this.amplitude=e}easeInCore(e){return Math.pow(e,3)-e*Math.max(0,this.amplitude)*Math.sin(3.141592653589793*e)}},"BezierCurveEase",0,class extends r{constructor(e=0,t=0,r=1,i=1){super(),this.x1=e,this.y1=t,this.x2=r,this.y2=i}easeInCore(e){return t.BezierCurve.Interpolate(e,this.x1,this.y1,this.x2,this.y2)}},"BounceEase",0,class extends r{constructor(e=3,t=2){super(),this.bounces=e,this.bounciness=t}easeInCore(e){let t=Math.max(0,this.bounces),r=this.bounciness;r<=1&&(r=1.001);let i=Math.pow(r,t),a=1-r,o=(1-i)/a+.5*i,n=Math.floor(Math.log(-(e*o)*(1-r)+1)/Math.log(r)),s=(1-Math.pow(r,n))/(a*o),l=(s+(1-Math.pow(r,n+1))/(a*o))*.5,f=e-l,c=l-s;return-Math.pow(1/r,t-n)/(c*c)*(f-c)*(f+c)}},"CircleEase",0,class extends r{easeInCore(e){return 1-Math.sqrt(1-(e=Math.max(0,Math.min(1,e)))*e)}},"CubicEase",0,class extends r{easeInCore(e){return e*e*e}},"EasingFunction",0,r,"ElasticEase",0,class extends r{constructor(e=3,t=3){super(),this.oscillations=e,this.springiness=t}easeInCore(e){let t=Math.max(0,this.oscillations),r=Math.max(0,this.springiness);return(0===r?e:(Math.exp(r*e)-1)/(Math.exp(r)-1))*Math.sin((6.283185307179586*t+1.5707963267948966)*e)}},"ExponentialEase",0,class extends r{constructor(e=2){super(),this.exponent=e}easeInCore(e){return this.exponent<=0?e:(Math.exp(this.exponent*e)-1)/(Math.exp(this.exponent)-1)}},"QuadraticEase",0,class extends r{easeInCore(e){return e*e}},"QuarticEase",0,class extends r{easeInCore(e){return e*e*e*e}},"QuinticEase",0,class extends r{easeInCore(e){return e*e*e*e*e}},"SineEase",0,class extends r{easeInCore(e){return 1-Math.sin(1.5707963267948966*(1-e))}}])},262286,e=>{"use strict";var t=e.i(618642),r=e.i(440163),i=e.i(916624),a=e.i(774685);class o extends r.FlowGraphBlock{constructor(e){super(e),this.config=e,this._easingFunctions={},this.mode=this.registerDataInput("mode",i.RichTypeNumber,0),this.controlPoint1=this.registerDataInput("controlPoint1",i.RichTypeVector2),this.controlPoint2=this.registerDataInput("controlPoint2",i.RichTypeVector2),this.easingFunction=this.registerDataOutput("easingFunction",i.RichTypeAny)}_updateOutputs(e){let r=this.mode.getValue(e),i=this.controlPoint1.getValue(e),a=this.controlPoint2.getValue(e);if(void 0===r)return;let o=`${r}-${i.x}-${i.y}-${a.x}-${a.y}`;if(!this._easingFunctions[o]){let e=new t.BezierCurveEase(i.x,i.y,a.x,a.y);e.setEasingMode(r),this._easingFunctions[o]=e}this.easingFunction.setValue(this._easingFunctions[o],e)}getClassName(){return"FlowGraphBezierCurveEasing"}}(0,a.RegisterClass)("FlowGraphBezierCurveEasing",o),e.s(["FlowGraphBezierCurveEasingBlock",0,o])},581982,e=>{"use strict";var t=e.i(263537);let r="lightProxyPixelShader",i=`flat varying vec2 vLimits;flat varying highp uint vMask;void main(void) {if (gl_FragCoord.y<vLimits.x || gl_FragCoord.y>vLimits.y) {discard;}
gl_FragColor=vec4(vMask,0,0,1);}
`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["lightProxyPixelShader",0,{name:r,shader:i}])},429196,e=>{"use strict";var t=e.i(263537);let r="oitBackBlendPixelShader",i=`var uBackColor: texture_2d<f32>;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {fragmentOutputs.color=textureLoad(uBackColor,vec2i(fragmentInputs.position.xy),0);if (fragmentOutputs.color.a==0.0) {discard;}}
`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["oitBackBlendPixelShaderWGSL",0,{name:r,shader:i}])},322356,e=>{"use strict";var t=e.i(263537);let r="shadowMapFragmentSoftTransparentShadow",i=`#if SM_SOFTTRANSPARENTSHADOW==1
if ((bayerDither8(floor(mod(gl_FragCoord.xy,8.0))))/64.0>=softTransparentShadowSM.x*alpha) discard;
#endif
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.s(["shadowMapFragmentSoftTransparentShadow",0,{name:r,shader:i}])},976458,e=>{"use strict";var t=e.i(263537);let r="meshUVSpaceRendererMaskerVertexShader",i=`attribute uv: vec2f;varying vUV: vec2f;@vertex
fn main(input : VertexInputs)->FragmentInputs {vertexOutputs.position= vec4f( vec2f(vertexInputs.uv.x,vertexInputs.uv.y)*2.0-1.0,0.,1.0);vertexOutputs.vUV=vertexInputs.uv;}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["meshUVSpaceRendererMaskerVertexShaderWGSL",0,{name:r,shader:i}])},593093,e=>{"use strict";var t=e.i(263537);let r="iblGenerateVoxelMipPixelShader",i=`varying vUV: vec2f;var srcMip: texture_3d<f32>;uniform layerNum: i32;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var Coords=vec3i(2)*vec3i(vec2i(fragmentInputs.position.xy),uniforms.layerNum);var tex =
(u32(select(0u,1u,textureLoad(srcMip,Coords+vec3i(0,0,0),0).x>0.0f))
<< 0u) |
(u32(select(0u,1u,textureLoad(srcMip,Coords+vec3i(1,0,0),0).x>0.0f))
<< 1u) |
(u32(select(0u,1u,textureLoad(srcMip,Coords+vec3i(0,1,0),0).x>0.0f))
<< 2u) |
(u32(select(0u,1u,textureLoad(srcMip,Coords+vec3i(1,1,0),0).x>0.0f))
<< 3u) |
(u32(select(0u,1u,textureLoad(srcMip,Coords+vec3i(0,0,1),0).x>0.0f))
<< 4u) |
(u32(select(0u,1u,textureLoad(srcMip,Coords+vec3i(1,0,1),0).x>0.0f))
<< 5u) |
(u32(select(0u,1u,textureLoad(srcMip,Coords+vec3i(0,1,1),0).x>0.0f))
<< 6u) |
(u32(select(0u,1u,textureLoad(srcMip,Coords+vec3i(1,1,1),0).x>0.0f))
<< 7u);fragmentOutputs.color=vec4f( f32(tex)/255.0f,0.0f,0.0f,1.0);}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["iblGenerateVoxelMipPixelShaderWGSL",0,{name:r,shader:i}])},521565,e=>{"use strict";var t=e.i(263537);let r="circleOfConfusionPixelShader",i=`varying vUV: vec2f;var depthSamplerSampler: sampler;var depthSampler: texture_2d<f32>;
#ifndef COC_DEPTH_NOT_NORMALIZED
uniform cameraMinMaxZ: vec2f;
#endif
uniform focusDistance: f32;uniform cocPrecalculation: f32;
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var depth: f32=textureSample(depthSampler,depthSamplerSampler,input.vUV).r;
#define CUSTOM_COC_DEPTH
#ifdef COC_DEPTH_NOT_NORMALIZED
let pixelDistance=depth*1000.0;
#else
let pixelDistance: f32=(uniforms.cameraMinMaxZ.x+uniforms.cameraMinMaxZ.y*depth)*1000.0; 
#endif
#define CUSTOM_COC_PIXELDISTANCE
var coc: f32=abs(uniforms.cocPrecalculation*((uniforms.focusDistance-pixelDistance)/pixelDistance));coc=clamp(coc,0.0,1.0);fragmentOutputs.color= vec4f(coc,coc,coc,1.0);}
`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["circleOfConfusionPixelShaderWGSL",0,{name:r,shader:i}])},668128,e=>{"use strict";var t=e.i(303663),r=e.i(916624),i=e.i(774685),a=e.i(711835);class o extends t.FlowGraphExecutionBlock{constructor(e){for(const t of(super(e),this.config=e,this.default=this._registerSignalOutput("default"),this._caseToOutputFlow=new Map,this.case=this.registerDataInput("case",r.RichTypeAny),this.config.cases||[]))this._caseToOutputFlow.set(t,this._registerSignalOutput(`out_${t}`))}_execute(e,t){let r,i=this.case.getValue(e);(r=(0,a.isNumeric)(i)?this._getOutputFlowForCase((0,a.getNumericValue)(i)):this._getOutputFlowForCase(i))?r._activateSignal(e):this.default._activateSignal(e)}addCase(e){this.config.cases.includes(e)||(this.config.cases.push(e),this._caseToOutputFlow.set(e,this._registerSignalOutput(`out_${e}`)))}removeCase(e){if(!this.config.cases.includes(e))return;let t=this.config.cases.indexOf(e);this.config.cases.splice(t,1),this._caseToOutputFlow.delete(e)}_getOutputFlowForCase(e){return this._caseToOutputFlow.get(e)}getClassName(){return"FlowGraphSwitchBlock"}serialize(e){super.serialize(e),e.cases=this.config.cases}}(0,i.RegisterClass)("FlowGraphSwitchBlock",o),e.s(["FlowGraphSwitchBlock",0,o])},640063,e=>{"use strict";var t=e.i(263537);e.i(190688),e.i(127010),e.i(358759),e.i(313119);let r="imageProcessingCompatibility",i=`#ifdef IMAGEPROCESSINGPOSTPROCESS
gl_FragColor.rgb=pow(gl_FragColor.rgb,vec3(2.2));
#endif
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i);let a="spritesPixelShader",o=`#ifdef LOGARITHMICDEPTH
#extension GL_EXT_frag_depth : enable
#endif
uniform bool alphaTest;varying vec4 vColor;varying vec2 vUV;uniform sampler2D diffuseSampler;
#include<fogFragmentDeclaration>
#include<logDepthDeclaration>
#define CUSTOM_FRAGMENT_DEFINITIONS
#ifdef PIXEL_PERFECT
vec2 uvPixelPerfect(vec2 uv) {vec2 res=vec2(textureSize(diffuseSampler,0));uv=uv*res;vec2 seam=floor(uv+0.5);uv=seam+clamp((uv-seam)/fwidth(uv),-0.5,0.5);return uv/res;}
#endif
void main(void) {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
#ifdef PIXEL_PERFECT
vec2 uv=uvPixelPerfect(vUV);
#else
vec2 uv=vUV;
#endif
vec4 color=texture2D(diffuseSampler,uv);float fAlphaTest=float(alphaTest);if (fAlphaTest != 0.)
{if (color.a<0.95)
discard;}
color*=vColor;
#include<logDepthFragment>
#include<fogFragment>
gl_FragColor=color;
#include<imageProcessingCompatibility>
#define CUSTOM_FRAGMENT_MAIN_END
}`;t.ShaderStore.ShadersStore[a]||(t.ShaderStore.ShadersStore[a]=o),e.s(["spritesPixelShader",0,{name:a,shader:o}],640063)},637012,e=>{"use strict";var t=e.i(263537);let r="fxaaPixelShader",i=`#if defined(WEBGL2) || defined(WEBGPU) || defined(NATIVE)
#define TEXTUREFUNC(s,c,l) texture2DLodEXT(s,c,l)
#else
#define TEXTUREFUNC(s,c,b) texture2D(s,c,b)
#endif
uniform sampler2D textureSampler;uniform vec2 texelSize;varying vec2 vUV;varying vec2 sampleCoordS;varying vec2 sampleCoordE;varying vec2 sampleCoordN;varying vec2 sampleCoordW;varying vec2 sampleCoordNW;varying vec2 sampleCoordSE;varying vec2 sampleCoordNE;varying vec2 sampleCoordSW;const float fxaaQualitySubpix=1.0;const float fxaaQualityEdgeThreshold=0.166;const float fxaaQualityEdgeThresholdMin=0.0833;const vec3 kLumaCoefficients=vec3(0.2126,0.7152,0.0722);
#define FxaaLuma(rgba) dot(rgba.rgb,kLumaCoefficients)
void main(){vec2 posM;posM.x=vUV.x;posM.y=vUV.y;vec4 rgbyM=TEXTUREFUNC(textureSampler,vUV,0.0);float lumaM=FxaaLuma(rgbyM);float lumaS=FxaaLuma(TEXTUREFUNC(textureSampler,sampleCoordS,0.0));float lumaE=FxaaLuma(TEXTUREFUNC(textureSampler,sampleCoordE,0.0));float lumaN=FxaaLuma(TEXTUREFUNC(textureSampler,sampleCoordN,0.0));float lumaW=FxaaLuma(TEXTUREFUNC(textureSampler,sampleCoordW,0.0));float maxSM=max(lumaS,lumaM);float minSM=min(lumaS,lumaM);float maxESM=max(lumaE,maxSM);float minESM=min(lumaE,minSM);float maxWN=max(lumaN,lumaW);float minWN=min(lumaN,lumaW);float rangeMax=max(maxWN,maxESM);float rangeMin=min(minWN,minESM);float rangeMaxScaled=rangeMax*fxaaQualityEdgeThreshold;float range=rangeMax-rangeMin;float rangeMaxClamped=max(fxaaQualityEdgeThresholdMin,rangeMaxScaled);
#ifndef MALI
if(range<rangeMaxClamped) 
{gl_FragColor=rgbyM;return;}
#endif
float lumaNW=FxaaLuma(TEXTUREFUNC(textureSampler,sampleCoordNW,0.0));float lumaSE=FxaaLuma(TEXTUREFUNC(textureSampler,sampleCoordSE,0.0));float lumaNE=FxaaLuma(TEXTUREFUNC(textureSampler,sampleCoordNE,0.0));float lumaSW=FxaaLuma(TEXTUREFUNC(textureSampler,sampleCoordSW,0.0));float lumaNS=lumaN+lumaS;float lumaWE=lumaW+lumaE;float subpixRcpRange=1.0/range;float subpixNSWE=lumaNS+lumaWE;float edgeHorz1=(-2.0*lumaM)+lumaNS;float edgeVert1=(-2.0*lumaM)+lumaWE;float lumaNESE=lumaNE+lumaSE;float lumaNWNE=lumaNW+lumaNE;float edgeHorz2=(-2.0*lumaE)+lumaNESE;float edgeVert2=(-2.0*lumaN)+lumaNWNE;float lumaNWSW=lumaNW+lumaSW;float lumaSWSE=lumaSW+lumaSE;float edgeHorz4=(abs(edgeHorz1)*2.0)+abs(edgeHorz2);float edgeVert4=(abs(edgeVert1)*2.0)+abs(edgeVert2);float edgeHorz3=(-2.0*lumaW)+lumaNWSW;float edgeVert3=(-2.0*lumaS)+lumaSWSE;float edgeHorz=abs(edgeHorz3)+edgeHorz4;float edgeVert=abs(edgeVert3)+edgeVert4;float subpixNWSWNESE=lumaNWSW+lumaNESE;float lengthSign=texelSize.x;bool horzSpan=edgeHorz>=edgeVert;float subpixA=subpixNSWE*2.0+subpixNWSWNESE;if (!horzSpan)
{lumaN=lumaW;}
if (!horzSpan) 
{lumaS=lumaE;}
if (horzSpan) 
{lengthSign=texelSize.y;}
float subpixB=(subpixA*(1.0/12.0))-lumaM;float gradientN=lumaN-lumaM;float gradientS=lumaS-lumaM;float lumaNN=lumaN+lumaM;float lumaSS=lumaS+lumaM;bool pairN=abs(gradientN)>=abs(gradientS);float gradient=max(abs(gradientN),abs(gradientS));if (pairN)
{lengthSign=-lengthSign;}
float subpixC=clamp(abs(subpixB)*subpixRcpRange,0.0,1.0);vec2 posB;posB.x=posM.x;posB.y=posM.y;vec2 offNP;offNP.x=(!horzSpan) ? 0.0 : texelSize.x;offNP.y=(horzSpan) ? 0.0 : texelSize.y;if (!horzSpan) 
{posB.x+=lengthSign*0.5;}
if (horzSpan)
{posB.y+=lengthSign*0.5;}
vec2 posN;posN.x=posB.x-offNP.x*1.5;posN.y=posB.y-offNP.y*1.5;vec2 posP;posP.x=posB.x+offNP.x*1.5;posP.y=posB.y+offNP.y*1.5;float subpixD=((-2.0)*subpixC)+3.0;float lumaEndN=FxaaLuma(TEXTUREFUNC(textureSampler,posN,0.0));float subpixE=subpixC*subpixC;float lumaEndP=FxaaLuma(TEXTUREFUNC(textureSampler,posP,0.0));if (!pairN) 
{lumaNN=lumaSS;}
float gradientScaled=gradient*1.0/4.0;float lumaMM=lumaM-lumaNN*0.5;float subpixF=subpixD*subpixE;bool lumaMLTZero=lumaMM<0.0;lumaEndN-=lumaNN*0.5;lumaEndP-=lumaNN*0.5;bool doneN=abs(lumaEndN)>=gradientScaled;bool doneP=abs(lumaEndP)>=gradientScaled;if (!doneN) 
{posN.x-=offNP.x*3.0;}
if (!doneN) 
{posN.y-=offNP.y*3.0;}
bool doneNP=(!doneN) || (!doneP);if (!doneP) 
{posP.x+=offNP.x*3.0;}
if (!doneP)
{posP.y+=offNP.y*3.0;}
if (doneNP)
{if (!doneN) lumaEndN=FxaaLuma(TEXTUREFUNC(textureSampler,posN.xy,0.0));if (!doneP) lumaEndP=FxaaLuma(TEXTUREFUNC(textureSampler,posP.xy,0.0));if (!doneN) lumaEndN=lumaEndN-lumaNN*0.5;if (!doneP) lumaEndP=lumaEndP-lumaNN*0.5;doneN=abs(lumaEndN)>=gradientScaled;doneP=abs(lumaEndP)>=gradientScaled;if (!doneN) posN.x-=offNP.x*12.0;if (!doneN) posN.y-=offNP.y*12.0;doneNP=(!doneN) || (!doneP);if (!doneP) posP.x+=offNP.x*12.0;if (!doneP) posP.y+=offNP.y*12.0;}
float dstN=posM.x-posN.x;float dstP=posP.x-posM.x;if (!horzSpan)
{dstN=posM.y-posN.y;}
if (!horzSpan) 
{dstP=posP.y-posM.y;}
bool goodSpanN=(lumaEndN<0.0) != lumaMLTZero;float spanLength=(dstP+dstN);bool goodSpanP=(lumaEndP<0.0) != lumaMLTZero;float spanLengthRcp=1.0/spanLength;bool directionN=dstN<dstP;float dst=min(dstN,dstP);bool goodSpan=directionN ? goodSpanN : goodSpanP;float subpixG=subpixF*subpixF;float pixelOffset=(dst*(-spanLengthRcp))+0.5;float subpixH=subpixG*fxaaQualitySubpix;float pixelOffsetGood=goodSpan ? pixelOffset : 0.0;float pixelOffsetSubpix=max(pixelOffsetGood,subpixH);if (!horzSpan)
{posM.x+=pixelOffsetSubpix*lengthSign;}
if (horzSpan)
{posM.y+=pixelOffsetSubpix*lengthSign;}
#ifdef MALI
if(range<rangeMaxClamped) 
{gl_FragColor=rgbyM;}
else
{gl_FragColor=TEXTUREFUNC(textureSampler,posM,0.0);}
#else
gl_FragColor=TEXTUREFUNC(textureSampler,posM,0.0);
#endif
}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["fxaaPixelShader",0,{name:r,shader:i}])},261328,e=>{"use strict";var t,r,i=e.i(618642),a=e.i(440163),o=e.i(916624),n=e.i(774685);(t=r||(r={}))[t.CircleEase=0]="CircleEase",t[t.BackEase=1]="BackEase",t[t.BounceEase=2]="BounceEase",t[t.CubicEase=3]="CubicEase",t[t.ElasticEase=4]="ElasticEase",t[t.ExponentialEase=5]="ExponentialEase",t[t.PowerEase=6]="PowerEase",t[t.QuadraticEase=7]="QuadraticEase",t[t.QuarticEase=8]="QuarticEase",t[t.QuinticEase=9]="QuinticEase",t[t.SineEase=10]="SineEase",t[t.BezierCurveEase=11]="BezierCurveEase";class s extends a.FlowGraphBlock{constructor(e){super(e),this.config=e,this._easingFunctions={},this.type=this.registerDataInput("type",o.RichTypeAny,11),this.mode=this.registerDataInput("mode",o.RichTypeNumber,0),this.parameters=this.registerDataInput("parameters",o.RichTypeAny,[1,0,0,1]),this.easingFunction=this.registerDataOutput("easingFunction",o.RichTypeAny)}_updateOutputs(e){let t=this.type.getValue(e),r=this.mode.getValue(e),a=this.parameters.getValue(e);if(void 0===t||void 0===r)return;let o=`${t}-${r}-${a.join("-")}`;if(!this._easingFunctions[o]){let e=function(e,...t){switch(e){case 11:return new i.BezierCurveEase(...t);case 0:return new i.CircleEase;case 1:return new i.BackEase(...t);case 2:return new i.BounceEase(...t);case 3:return new i.CubicEase;case 4:return new i.ElasticEase(...t);case 5:return new i.ExponentialEase(...t);default:throw Error("Easing type not yet implemented")}}(t,...a);e.setEasingMode(r),this._easingFunctions[o]=e}this.easingFunction.setValue(this._easingFunctions[o],e)}getClassName(){return"FlowGraphEasingBlock"}}(0,n.RegisterClass)("FlowGraphEasingBlock",s),e.s(["FlowGraphEasingBlock",0,s])},777959,e=>{"use strict";var t=e.i(916624),r=e.i(774685),i=e.i(196548);class a extends i.FlowGraphCachedOperationBlock{constructor(e){super(t.RichTypeBoolean,e),this.sound=this.registerDataInput("sound",t.RichTypeAny)}_doOperation(e){let t=this.sound.getValue(e);if(t)return 3===t.state||2===t.state}getClassName(){return"FlowGraphIsSoundPlayingBlock"}}(0,r.RegisterClass)("FlowGraphIsSoundPlayingBlock",a),e.s(["FlowGraphIsSoundPlayingBlock",0,a])},316109,e=>{"use strict";var t=e.i(263537);e.i(738124);let r="iblScaledLuminancePixelShader",i=`#include<helperFunctions>
#ifdef IBL_USE_CUBE_MAP
var iblSourceSampler: sampler;var iblSource: texture_cube<f32>;
#else
var iblSourceSampler: sampler;var iblSource: texture_2d<f32>;
#endif
uniform iblHeight: i32;uniform iblWidth: i32;fn fetchLuminance(coords: vec2f)->f32 {
#ifdef IBL_USE_CUBE_MAP
var direction: vec3f=equirectangularToCubemapDirection(coords);var color: vec3f=textureSampleLevel(iblSource,iblSourceSampler,direction,0.0).rgb;
#else
var color: vec3f=textureSampleLevel(iblSource,iblSourceSampler,coords,0.0).rgb;
#endif
return dot(color,LuminanceEncodeApprox);}
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var deform: f32=sin(input.vUV.y*PI);var luminance: f32=fetchLuminance(input.vUV);fragmentOutputs.color=vec4f(vec3f(deform*luminance),1.0);}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["iblScaledLuminancePixelShaderWGSL",0,{name:r,shader:i}])},507555,e=>{"use strict";var t=e.i(303663),r=e.i(916624),i=e.i(774685);class a extends t.FlowGraphExecutionBlock{constructor(e){super(e),this.onOn=this._registerSignalOutput("onOn"),this.onOff=this._registerSignalOutput("onOff"),this.value=this.registerDataOutput("value",r.RichTypeBoolean)}_execute(e,t){let r=e._getExecutionVariable(this,"value","boolean"==typeof this.config?.startValue&&!this.config.startValue);r=!r,e._setExecutionVariable(this,"value",r),this.value.setValue(r,e),r?this.onOn._activateSignal(e):this.onOff._activateSignal(e)}getClassName(){return"FlowGraphFlipFlopBlock"}}(0,i.RegisterClass)("FlowGraphFlipFlopBlock",a),e.s(["FlowGraphFlipFlopBlock",0,a])},224234,e=>{"use strict";var t=e.i(263537);e.i(201632);let r="iblScaledLuminancePixelShader",i=`precision highp sampler2D;precision highp samplerCube;
#include<helperFunctions>
varying vec2 vUV;
#ifdef IBL_USE_CUBE_MAP
uniform samplerCube iblSource;
#else
uniform sampler2D iblSource;
#endif
uniform int iblWidth;uniform int iblHeight;float fetchLuminance(vec2 coords) {
#ifdef IBL_USE_CUBE_MAP
vec3 direction=equirectangularToCubemapDirection(coords);vec3 color=textureCubeLodEXT(iblSource,direction,0.0).rgb;
#else
vec3 color=textureLod(iblSource,coords,0.0).rgb;
#endif
return dot(color,LuminanceEncodeApprox);}
void main(void) {float deform=sin(vUV.y*PI);float luminance=fetchLuminance(vUV);gl_FragColor=vec4(vec3(deform*luminance),1.0);}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["iblScaledLuminancePixelShader",0,{name:r,shader:i}])},928711,e=>{"use strict";var t=e.i(263537);let r="fxaaVertexShader",i=`attribute vec2 position;uniform vec2 texelSize;varying vec2 vUV;varying vec2 sampleCoordS;varying vec2 sampleCoordE;varying vec2 sampleCoordN;varying vec2 sampleCoordW;varying vec2 sampleCoordNW;varying vec2 sampleCoordSE;varying vec2 sampleCoordNE;varying vec2 sampleCoordSW;const vec2 madd=vec2(0.5,0.5);
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
vUV=(position*madd+madd);sampleCoordS=vUV+vec2( 0.0,1.0)*texelSize;sampleCoordE=vUV+vec2( 1.0,0.0)*texelSize;sampleCoordN=vUV+vec2( 0.0,-1.0)*texelSize;sampleCoordW=vUV+vec2(-1.0,0.0)*texelSize;sampleCoordNW=vUV+vec2(-1.0,-1.0)*texelSize;sampleCoordSE=vUV+vec2( 1.0,1.0)*texelSize;sampleCoordNE=vUV+vec2( 1.0,-1.0)*texelSize;sampleCoordSW=vUV+vec2(-1.0,1.0)*texelSize;gl_Position=vec4(position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["fxaaVertexShader",0,{name:r,shader:i}])},78938,e=>{"use strict";var t=e.i(263537);let r="fluidRenderingParticleDepthPixelShader",i=`uniform mat4 projection;varying vec2 uv;varying vec3 viewPos;varying float sphereRadius;
#ifdef FLUIDRENDERING_VELOCITY
varying float velocityNorm;
#endif
void main(void) {vec3 normal;normal.xy=uv*2.0-1.0;float r2=dot(normal.xy,normal.xy);if (r2>1.0) discard;normal.z=sqrt(1.0-r2);
#ifndef FLUIDRENDERING_RHS
normal.z=-normal.z;
#endif
vec4 realViewPos=vec4(viewPos+normal*sphereRadius,1.0);vec4 clipSpacePos=projection*realViewPos;
#ifdef WEBGPU
gl_FragDepth=clipSpacePos.z/clipSpacePos.w;
#else
gl_FragDepth=(clipSpacePos.z/clipSpacePos.w)*0.5+0.5;
#endif
#ifdef FLUIDRENDERING_RHS
realViewPos.z=-realViewPos.z;
#endif
#ifdef FLUIDRENDERING_VELOCITY
glFragColor=vec4(realViewPos.z,velocityNorm,0.,1.);
#else
glFragColor=vec4(realViewPos.z,0.,0.,1.);
#endif
}
`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["fluidRenderingParticleDepthPixelShader",0,{name:r,shader:i}])},778896,e=>{"use strict";var t=e.i(263537);let r="pickingPixelShader",i=`#if defined(INSTANCES)
flat varying float vMeshID;
#else
uniform float meshID;
#endif
void main(void) {float id;
#if defined(INSTANCES)
id=vMeshID;
#else
id=meshID;
#endif
#if defined(WEBGL2) || defined(WEBGPU) || defined(NATIVE)
int castedId=int(id);vec3 color=vec3(
float((castedId>>16) & 0xFF),
float((castedId>>8) & 0xFF),
float(castedId & 0xFF)
)/255.0;gl_FragColor=vec4(color,1.0);
#else
float castedId=floor(id+0.5);vec3 color=vec3(
floor(mod(castedId,16777216.0)/65536.0),
floor(mod(castedId,65536.0)/256.0),
mod(castedId,256.0)
)/255.0;gl_FragColor=vec4(color,1.0);
#endif
}
`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["pickingPixelShader",0,{name:r,shader:i}])},153982,e=>{"use strict";var t=e.i(263537);let r="fluidRenderingStandardBlurPixelShader",i=`uniform sampler2D textureSampler;uniform int filterSize;uniform vec2 blurDir;varying vec2 vUV;void main(void) {vec4 s=textureLod(textureSampler,vUV,0.);if (s.r==0.) {glFragColor=vec4(0.,0.,0.,1.);return;}
float sigma=float(filterSize)/3.0;float twoSigma2=2.0*sigma*sigma;vec4 sum=vec4(0.);float wsum=0.;for (int x=-filterSize; x<=filterSize; ++x) {vec2 coords=vec2(x);vec4 sampl=textureLod(textureSampler,vUV+coords*blurDir,0.);float w=exp(-coords.x*coords.x/twoSigma2);sum+=sampl*w;wsum+=w;}
sum/=wsum;glFragColor=vec4(sum.rgb,1.);}
`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["fluidRenderingStandardBlurPixelShader",0,{name:r,shader:i}])},354754,e=>{"use strict";var t=e.i(263537);let r="lensFlarePixelShader",i=`varying vec2 vUV;uniform sampler2D textureSampler;uniform vec4 color;
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
vec4 baseColor=texture2D(textureSampler,vUV);gl_FragColor=baseColor*color;
#define CUSTOM_FRAGMENT_MAIN_END
}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["lensFlarePixelShader",0,{name:r,shader:i}])},700731,e=>{"use strict";var t=e.i(263537);let r="passPixelShader",i=`varying vec2 vUV;uniform sampler2D textureSampler;
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) 
{gl_FragColor=texture2D(textureSampler,vUV);}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["passPixelShader",0,{name:r,shader:i}])},756026,e=>{"use strict";var t=e.i(263537);let r="fluidRenderingParticleDiffusePixelShader",i=`uniform float particleAlpha;varying vec2 uv;varying vec3 diffuseColor;void main(void) {vec3 normal;normal.xy=uv*2.0-1.0;float r2=dot(normal.xy,normal.xy);if (r2>1.0) discard;glFragColor=vec4(diffuseColor,1.0);}
`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["fluidRenderingParticleDiffusePixelShader",0,{name:r,shader:i}])},275586,e=>{"use strict";var t=e.i(263537);let r="meshUVSpaceRendererMaskerPixelShader",i=`varying vec2 vUV;void main(void) {gl_FragColor=vec4(1.0,1.0,1.0,1.0);}
`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["meshUVSpaceRendererMaskerPixelShader",0,{name:r,shader:i}])},302054,e=>{"use strict";var t=e.i(263537);let r="fluidRenderingParticleDepthPixelShader",i=`uniform projection: mat4x4f;varying uv: vec2f;varying viewPos: vec3f;varying sphereRadius: f32;
#ifdef FLUIDRENDERING_VELOCITY
varying velocityNorm: f32;
#endif
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var normalxy: vec2f=input.uv*2.0-1.0;var r2: f32=dot(normalxy,normalxy);if (r2>1.0) {discard;}
var normal: vec3f=vec3f(normalxy,sqrt(1.0-r2));
#ifndef FLUIDRENDERING_RHS
normal.z=-normal.z;
#endif
var realViewPos: vec4f=vec4f(input.viewPos+normal*input.sphereRadius,1.0);var clipSpacePos: vec4f=uniforms.projection*realViewPos;fragmentOutputs.fragDepth=clipSpacePos.z/clipSpacePos.w;
#ifdef FLUIDRENDERING_RHS
realViewPos.z=-realViewPos.z;
#endif
#ifdef FLUIDRENDERING_VELOCITY
fragmentOutputs.color=vec4f(realViewPos.z,input.velocityNorm,0.,1.);
#else
fragmentOutputs.color=vec4f(realViewPos.z,0.,0.,1.);
#endif
}
`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["fluidRenderingParticleDepthPixelShaderWGSL",0,{name:r,shader:i}])},121181,e=>{"use strict";var t=e.i(263537);let r="fluidRenderingStandardBlurPixelShader",i=`var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;uniform filterSize: i32;uniform blurDir: vec2f;varying vUV: vec2f;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var s: vec4f=textureSampleLevel(textureSampler,textureSamplerSampler,input.vUV,0.);if (s.r==0.) {fragmentOutputs.color=vec4f(0.,0.,0.,1.);return fragmentOutputs;}
var sigma: f32=f32(uniforms.filterSize)/3.0;var twoSigma2: f32=2.0*sigma*sigma;var sum: vec4f=vec4f(0.);var wsum: f32=0.;for (var x: i32=-uniforms.filterSize; x<=uniforms.filterSize; x++) {var coords: vec2f=vec2f(f32(x));var sampl: vec4f=textureSampleLevel(textureSampler,textureSamplerSampler,input.vUV+coords*uniforms.blurDir,0.);var w: f32=exp(-coords.x*coords.x/twoSigma2);sum+=sampl*w;wsum+=w;}
sum/=wsum;fragmentOutputs.color=vec4f(sum.rgb,1.);}
`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["fluidRenderingStandardBlurPixelShaderWGSL",0,{name:r,shader:i}])},492685,e=>{"use strict";var t=e.i(263537);let r="screenSpaceReflection2BlurPixelShader",i=`var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;varying vUV: vec2f;uniform texelOffsetScale: vec2f;const weights: array<f32,8>=array<f32,8>(0.071303,0.131514,0.189879,0.321392,0.452906, 0.584419,0.715932,0.847445);fn processSample(uv: vec2f,i: f32,stepSize: vec2f,accumulator: ptr<function,vec4f>,denominator: ptr<function,f32>)
{var offsetUV: vec2f=stepSize*i+uv;var coefficient: f32=weights[ i32(2.0-abs(i))];*accumulator+=textureSampleLevel(textureSampler,textureSamplerSampler,offsetUV,0.0)*coefficient;*denominator+=coefficient;}
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var colorFull: vec4f=textureSampleLevel(textureSampler,textureSamplerSampler,input.vUV,0.0);if (dot(colorFull, vec4f(1.0))==0.0) {fragmentOutputs.color=colorFull;return fragmentOutputs;}
var blurRadius: f32=colorFull.a*255.0; 
var stepSize: vec2f=uniforms.texelOffsetScale.xy*blurRadius;var accumulator: vec4f=textureSampleLevel(textureSampler,textureSamplerSampler,input.vUV,0.0)*0.214607;var denominator: f32=0.214607;processSample(input.vUV,1.0,stepSize,&accumulator,&denominator);processSample(input.vUV,1.0*0.2,stepSize,&accumulator,&denominator);processSample(input.vUV,1.0*0.4,stepSize,&accumulator,&denominator);processSample(input.vUV,1.0*0.6,stepSize,&accumulator,&denominator);processSample(input.vUV,1.0*0.8,stepSize,&accumulator,&denominator);processSample(input.vUV,1.0*1.2,stepSize,&accumulator,&denominator);processSample(input.vUV,1.0*1.4,stepSize,&accumulator,&denominator);processSample(input.vUV,1.0*1.6,stepSize,&accumulator,&denominator);processSample(input.vUV,1.0*1.8,stepSize,&accumulator,&denominator);processSample(input.vUV,1.0*2.0,stepSize,&accumulator,&denominator);processSample(input.vUV,-1.0,stepSize,&accumulator,&denominator);processSample(input.vUV,-1.0*0.2,stepSize,&accumulator,&denominator);processSample(input.vUV,-1.0*0.4,stepSize,&accumulator,&denominator);processSample(input.vUV,-1.0*0.6,stepSize,&accumulator,&denominator);processSample(input.vUV,-1.0*0.8,stepSize,&accumulator,&denominator);processSample(input.vUV,-1.0*1.2,stepSize,&accumulator,&denominator);processSample(input.vUV,-1.0*1.4,stepSize,&accumulator,&denominator);processSample(input.vUV,-1.0*1.6,stepSize,&accumulator,&denominator);processSample(input.vUV,-1.0*1.8,stepSize,&accumulator,&denominator);processSample(input.vUV,-1.0*2.0,stepSize,&accumulator,&denominator);fragmentOutputs.color= vec4f(accumulator.rgb/denominator,colorFull.a);}
`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["screenSpaceReflection2BlurPixelShaderWGSL",0,{name:r,shader:i}])},376665,e=>{"use strict";var t=e.i(263537);e.i(624154),e.i(568039),e.i(182478),e.i(30653),e.i(880779),e.i(587630),e.i(761523),e.i(479126),e.i(781801),e.i(313976),e.i(146259);let r="colorVertexShader",i=`attribute vec3 position;
#ifdef VERTEXCOLOR
attribute vec4 color;
#endif
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<clipPlaneVertexDeclaration>
#include<fogVertexDeclaration>
#ifdef FOG
uniform mat4 view;
#endif
#include<instancesDeclaration>
uniform mat4 viewProjection;
#ifdef MULTIVIEW
uniform mat4 viewProjectionR;
#endif
#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
varying vec4 vColor;
#endif
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
#ifdef VERTEXCOLOR
vec4 colorUpdated=color;
#endif
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
vec4 worldPos=finalWorld*vec4(position,1.0);
#ifdef MULTIVIEW
if (gl_ViewID_OVR==0u) {gl_Position=viewProjection*worldPos;} else {gl_Position=viewProjectionR*worldPos;}
#else
gl_Position=viewProjection*worldPos;
#endif
#include<clipPlaneVertex>
#include<fogVertex>
#include<vertexColorMixing>
#define CUSTOM_VERTEX_MAIN_END
}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["colorVertexShader",0,{name:r,shader:i}])},683439,e=>{"use strict";var t=e.i(263537);let r="bloomMergePixelShader",i=`varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;var bloomBlurSampler: sampler;var bloomBlur: texture_2d<f32>;uniform bloomWeight: f32;
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {fragmentOutputs.color=textureSample(textureSampler,textureSamplerSampler,input.vUV);var blurred: vec3f=textureSample(bloomBlur,bloomBlurSampler,input.vUV).rgb;fragmentOutputs.color=vec4f(fragmentOutputs.color.rgb+(blurred.rgb*uniforms.bloomWeight),fragmentOutputs.color.a);}
`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["bloomMergePixelShaderWGSL",0,{name:r,shader:i}])},37053,e=>{"use strict";var t=e.i(353679),r=e.i(916624),i=e.i(774685);class a extends t.FlowGraphExecutionBlockWithOutSignal{constructor(e){super(e),this.sound=this.registerDataInput("sound",r.RichTypeAny)}_execute(e,t){let r=this.sound.getValue(e);if(!r){this._reportError(e,"No sound provided"),this.out._activateSignal(e);return}r.stop(),this.out._activateSignal(e)}getClassName(){return"FlowGraphStopSoundBlock"}}(0,i.RegisterClass)("FlowGraphStopSoundBlock",a),e.s(["FlowGraphStopSoundBlock",0,a])},565594,e=>{"use strict";var t=e.i(263537);e.i(261937),e.i(127010),e.i(141687),e.i(358759);let r="outlinePixelShader",i=`#ifdef LOGARITHMICDEPTH
#extension GL_EXT_frag_depth : enable
#endif
uniform vec4 color;
#ifdef ALPHATEST
varying vec2 vUV;uniform sampler2D diffuseSampler;
#endif
#include<clipPlaneFragmentDeclaration>
#include<logDepthDeclaration>
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
#include<clipPlaneFragment>
#ifdef ALPHATEST
if (texture2D(diffuseSampler,vUV).a<0.4)
discard;
#endif
#include<logDepthFragment>
gl_FragColor=color;
#define CUSTOM_FRAGMENT_MAIN_END
}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["outlinePixelShader",0,{name:r,shader:i}])},24163,e=>{"use strict";var t=e.i(263537);e.i(201632),e.i(442357),e.i(424192),e.i(289258);let r="hdrIrradianceFilteringPixelShader",i=`#include<helperFunctions>
#include<importanceSampling>
#include<pbrBRDFFunctions>
#include<hdrFilteringFunctions>
uniform samplerCube inputTexture;
#ifdef IBL_CDF_FILTERING
uniform sampler2D icdfTexture;
#endif
uniform vec2 vFilteringInfo;uniform float hdrScale;varying vec3 direction;void main() {vec3 color=irradiance(inputTexture,direction,vFilteringInfo,0.0,vec3(1.0),direction
#ifdef IBL_CDF_FILTERING
,icdfTexture
#endif
);gl_FragColor=vec4(color*hdrScale,1.0);}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["hdrIrradianceFilteringPixelShader",0,{name:r,shader:i}])},182715,e=>{"use strict";var t=e.i(916624),r=e.i(353679),i=e.i(774685);class a extends r.FlowGraphExecutionBlockWithOutSignal{constructor(e){super(e),this.reset=this._registerSignalInput("reset"),this.duration=this.registerDataInput("duration",t.RichTypeNumber),this.lastRemainingTime=this.registerDataOutput("lastRemainingTime",t.RichTypeNumber,NaN)}_execute(e,t){if(t===this.reset){this.lastRemainingTime.setValue(NaN,e),e._setExecutionVariable(this,"lastRemainingTime",NaN),e._setExecutionVariable(this,"timestamp",0);return}let r=this.duration.getValue(e);if(r<=0||isNaN(r)||!isFinite(r))return this._reportError(e,"Invalid duration in Throttle block");let i=e._getExecutionVariable(this,"lastRemainingTime",NaN),a=Date.now();if(isNaN(i))return this.lastRemainingTime.setValue(0,e),e._setExecutionVariable(this,"lastRemainingTime",0),e._setExecutionVariable(this,"timestamp",a),this.out._activateSignal(e);{let t=a-e._getExecutionVariable(this,"timestamp",0),i=1e3*r;if(i<=t)return this.lastRemainingTime.setValue(0,e),e._setExecutionVariable(this,"lastRemainingTime",0),e._setExecutionVariable(this,"timestamp",a),this.out._activateSignal(e);{let r=i-t;this.lastRemainingTime.setValue(r/1e3,e),e._setExecutionVariable(this,"lastRemainingTime",r)}}}getClassName(){return"FlowGraphThrottleBlock"}}(0,i.RegisterClass)("FlowGraphThrottleBlock",a),e.s(["FlowGraphThrottleBlock",0,a])},846456,e=>{"use strict";var t=e.i(263537);e.i(24012),e.i(629238),e.i(367959);let r="lightProxyVertexShader",i=`attribute vec3 position;flat varying vec2 vLimits;flat varying highp uint vMask;
#include<__decl__sceneVertex>
uniform sampler2D lightDataTexture;uniform vec3 tileMaskResolution;
#include<clusteredLightingFunctions>
void main(void) {ClusteredLight light=getClusteredLight(lightDataTexture,gl_InstanceID);float range=light.vLightFalloff.x;vec4 viewPosition=view*vec4(light.vLightData.xyz,1);vec4 viewPositionSq=viewPosition*viewPosition;vec2 distSq=viewPositionSq.xy+viewPositionSq.z;vec2 sinSq=(range*range)/distSq;vec2 cosSq=max(1.0-sinSq,0.01);vec2 sinCos=position.xy*sqrt(sinSq*cosSq);
#ifdef RIGHT_HANDED
vec2 rotatedX=mat2(cosSq.x,sinCos.x,-sinCos.x,cosSq.x)*viewPosition.xz;vec2 rotatedY=mat2(cosSq.y,sinCos.y,-sinCos.y,cosSq.y)*viewPosition.yz;
#else
vec2 rotatedX=mat2(cosSq.x,-sinCos.x,sinCos.x,cosSq.x)*viewPosition.xz;vec2 rotatedY=mat2(cosSq.y,-sinCos.y,sinCos.y,cosSq.y)*viewPosition.yz;
#endif
vec4 projX=projection*vec4(rotatedX.x,0,rotatedX.y,1);vec4 projY=projection*vec4(0,rotatedY.x,rotatedY.y,1);vec2 projPosition=vec2(projX.x/max(projX.w,0.01),projY.y/max(projY.w,0.01));projPosition=mix(position.xy,projPosition,greaterThan(cosSq,vec2(0.01)));vec2 halfTileRes=tileMaskResolution.xy/2.0;vec2 tilePosition=(projPosition+1.0)*halfTileRes;tilePosition=mix(floor(tilePosition)-0.01,ceil(tilePosition)+0.01,greaterThan(position.xy,vec2(0)));float offset=float(gl_InstanceID/CLUSTLIGHT_BATCH)*tileMaskResolution.y;tilePosition.y=(tilePosition.y+offset)/tileMaskResolution.z;gl_Position=vec4(tilePosition/halfTileRes-1.0,0,1);vLimits=vec2(offset,offset+tileMaskResolution.y);vMask=1u<<(gl_InstanceID % CLUSTLIGHT_BATCH);}
`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["lightProxyVertexShader",0,{name:r,shader:i}])},710936,e=>{"use strict";var t=e.i(263537);let r="fluidRenderingRenderPixelShader",i=`#define DISABLE_UNIFORMITY_ANALYSIS
#define IOR 1.333
#define ETA 1.0/IOR
#define F0 0.02
uniform sampler2D textureSampler;uniform sampler2D depthSampler;
#ifdef FLUIDRENDERING_DIFFUSETEXTURE
uniform sampler2D diffuseSampler;
#else
uniform vec3 diffuseColor;
#endif
#ifdef FLUIDRENDERING_FIXED_THICKNESS
uniform float thickness;uniform sampler2D bgDepthSampler;
#else
uniform float minimumThickness;uniform sampler2D thicknessSampler;
#endif
#ifdef FLUIDRENDERING_ENVIRONMENT
uniform samplerCube reflectionSampler;
#endif
#if defined(FLUIDRENDERING_DEBUG) && defined(FLUIDRENDERING_DEBUG_TEXTURE)
uniform sampler2D debugSampler;
#endif
uniform mat4 viewMatrix;uniform mat4 projectionMatrix;uniform mat4 invProjectionMatrix;uniform vec2 texelSize;uniform vec3 dirLight;uniform float cameraFar;uniform float density;uniform float refractionStrength;uniform float fresnelClamp;uniform float specularPower;varying vec2 vUV;vec3 computeViewPosFromUVDepth(vec2 texCoord,float depth) {vec4 ndc;ndc.xy=texCoord*2.0-1.0;
#ifdef FLUIDRENDERING_RHS
ndc.z=-projectionMatrix[2].z+projectionMatrix[3].z/depth;
#else
ndc.z=projectionMatrix[2].z+projectionMatrix[3].z/depth;
#endif
ndc.w=1.0;vec4 eyePos=invProjectionMatrix*ndc;eyePos.xyz/=eyePos.w;return eyePos.xyz;}
vec3 getViewPosFromTexCoord(vec2 texCoord) {float depth=textureLod(depthSampler,texCoord,0.).x;return computeViewPosFromUVDepth(texCoord,depth);}
void main(void) {vec2 texCoord=vUV;
#if defined(FLUIDRENDERING_DEBUG) && defined(FLUIDRENDERING_DEBUG_TEXTURE)
vec4 color=texture2D(debugSampler,texCoord);
#ifdef FLUIDRENDERING_DEBUG_DEPTH
glFragColor=vec4(color.rgb/vec3(2.0),1.);if (color.r>0.999 && color.g>0.999) {glFragColor=texture2D(textureSampler,texCoord);}
#else
glFragColor=vec4(color.rgb,1.);if (color.r<0.001 && color.g<0.001 && color.b<0.001) {glFragColor=texture2D(textureSampler,texCoord);}
#endif
return;
#endif
vec2 depthVel=textureLod(depthSampler,texCoord,0.).rg;float depth=depthVel.r;
#ifndef FLUIDRENDERING_FIXED_THICKNESS
float thickness=texture2D(thicknessSampler,texCoord).x;
#else
float bgDepth=texture2D(bgDepthSampler,texCoord).x;float depthNonLinear=projectionMatrix[2].z+projectionMatrix[3].z/depth;depthNonLinear=depthNonLinear*0.5+0.5;
#endif
vec4 backColor=texture2D(textureSampler,texCoord);
#ifndef FLUIDRENDERING_FIXED_THICKNESS
if (depth>=cameraFar || depth<=0. || thickness<=minimumThickness) {
#else
if (depth>=cameraFar || depth<=0. || bgDepth<=depthNonLinear) {
#endif
#ifdef FLUIDRENDERING_COMPOSITE_MODE
glFragColor.rgb=backColor.rgb*backColor.a;glFragColor.a=backColor.a;
#else
glFragColor=backColor;
#endif
return;}
vec3 viewPos=computeViewPosFromUVDepth(texCoord,depth);vec3 ddx=getViewPosFromTexCoord(texCoord+vec2(texelSize.x,0.))-viewPos;vec3 ddy=getViewPosFromTexCoord(texCoord+vec2(0.,texelSize.y))-viewPos;vec3 ddx2=viewPos-getViewPosFromTexCoord(texCoord+vec2(-texelSize.x,0.));if (abs(ddx.z)>abs(ddx2.z)) {ddx=ddx2;}
vec3 ddy2=viewPos-getViewPosFromTexCoord(texCoord+vec2(0.,-texelSize.y));if (abs(ddy.z)>abs(ddy2.z)) {ddy=ddy2;}
vec3 normal=normalize(cross(ddy,ddx));
#ifdef FLUIDRENDERING_RHS
normal=-normal;
#endif
#ifndef WEBGPU
if(isnan(normal.x) || isnan(normal.y) || isnan(normal.z) || isinf(normal.x) || isinf(normal.y) || isinf(normal.z)) {normal=vec3(0.,0.,-1.);}
#endif
#if defined(FLUIDRENDERING_DEBUG) && defined(FLUIDRENDERING_DEBUG_SHOWNORMAL)
glFragColor=vec4(normal*0.5+0.5,1.0);return;
#endif
vec3 rayDir=normalize(viewPos); 
#ifdef FLUIDRENDERING_DIFFUSETEXTURE
vec3 diffuseColor=textureLod(diffuseSampler,texCoord,0.0).rgb;
#endif
vec3 lightDir=normalize(vec3(viewMatrix*vec4(-dirLight,0.)));vec3 H =normalize(lightDir-rayDir);float specular=pow(max(0.0,dot(H,normal)),specularPower);
#ifdef FLUIDRENDERING_DEBUG_DIFFUSERENDERING
float diffuse =max(0.0,dot(lightDir,normal))*1.0;glFragColor=vec4(vec3(0.1) /*ambient*/+vec3(0.42,0.50,1.00)*diffuse+vec3(0,0,0.2)+specular,1.);return;
#endif
vec3 refractionDir=refract(rayDir,normal,ETA);vec4 transmitted=textureLod(textureSampler,vec2(texCoord+refractionDir.xy*thickness*refractionStrength),0.0);
#ifdef FLUIDRENDERING_COMPOSITE_MODE
if (transmitted.a==0.) transmitted.a=thickness;
#endif
vec3 transmittance=exp(-density*thickness*(1.0-diffuseColor)); 
vec3 refractionColor=transmitted.rgb*transmittance;
#ifdef FLUIDRENDERING_ENVIRONMENT
vec3 reflectionDir=reflect(rayDir,normal);vec3 reflectionColor=(textureCube(reflectionSampler,reflectionDir).rgb);float fresnel=clamp(F0+(1.0-F0)*pow(1.0-dot(normal,-rayDir),5.0),0.,fresnelClamp);vec3 finalColor=mix(refractionColor,reflectionColor,fresnel)+specular;
#else
vec3 finalColor=refractionColor+specular;
#endif
#ifdef FLUIDRENDERING_VELOCITY
float velocity=depthVel.g;finalColor=mix(finalColor,vec3(1.0),smoothstep(0.3,1.0,velocity/6.0));
#endif
glFragColor=vec4(finalColor,transmitted.a);}
`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["fluidRenderingRenderPixelShader",0,{name:r,shader:i}])},831002,e=>{"use strict";var t=e.i(263537);let r="ssao2PixelShader",i=`precision highp float;uniform sampler2D textureSampler;varying vec2 vUV;
#ifdef SSAO
float scales[16]=float[16](
0.1,
0.11406250000000001,
0.131640625,
0.15625,
0.187890625,
0.2265625,
0.272265625,
0.325,
0.384765625,
0.4515625,
0.525390625,
0.60625,
0.694140625,
0.7890625,
0.891015625,
1.0
);uniform float near;uniform float radius;uniform sampler2D depthSampler;uniform sampler2D randomSampler;uniform sampler2D normalSampler;uniform float randTextureTiles;uniform float samplesFactor;uniform vec3 sampleSphere[SAMPLES];uniform float totalStrength;uniform float base;
#ifdef ORTHOGRAPHIC_CAMERA
uniform vec4 viewport;
#else
uniform float xViewport;uniform float yViewport;
#endif
uniform mat3 depthProjection;uniform float maxZ;uniform float minZAspect;uniform vec2 texelSize;uniform mat4 projection;void main()
{vec3 random=textureLod(randomSampler,vUV*randTextureTiles,0.0).rgb;float depth=textureLod(depthSampler,vUV,0.0).r;float depthSign=sign(depth);depth=depth*depthSign;vec3 normal=textureLod(normalSampler,vUV,0.0).rgb;float occlusion=0.0;float correctedRadius=min(radius,minZAspect*depth/near);
#ifdef ORTHOGRAPHIC_CAMERA
vec3 vViewRay=vec3(mix(viewport.x,viewport.y,vUV.x),mix(viewport.z,viewport.w,vUV.y),depthSign);
#else
vec3 vViewRay=vec3((vUV.x*2.0-1.0)*xViewport,(vUV.y*2.0-1.0)*yViewport,depthSign);
#endif
vec3 vDepthFactor=depthProjection*vec3(1.0,1.0,depth);vec3 origin=vViewRay*vDepthFactor;vec3 rvec=random*2.0-1.0;rvec.z=0.0;float dotProduct=dot(rvec,normal);rvec=1.0-abs(dotProduct)>1e-2 ? rvec : vec3(-rvec.y,0.0,rvec.x);vec3 tangent=normalize(rvec-normal*dot(rvec,normal));vec3 bitangent=cross(normal,tangent);mat3 tbn=mat3(tangent,bitangent,normal);float difference;for (int i=0; i<SAMPLES; ++i) {vec3 samplePosition=scales[(i+int(random.x*16.0)) % 16]*tbn*sampleSphere[(i+int(random.y*16.0)) % 16];samplePosition=samplePosition*correctedRadius+origin;vec4 offset=vec4(samplePosition,1.0);offset=projection*offset;offset.xyz/=offset.w;offset.xy=offset.xy*0.5+0.5;if (offset.x<0.0 || offset.y<0.0 || offset.x>1.0 || offset.y>1.0) {continue;}
float sampleDepth=abs(textureLod(depthSampler,offset.xy,0.0).r);difference=depthSign*samplePosition.z-sampleDepth;float rangeCheck=1.0-smoothstep(correctedRadius*0.5,correctedRadius,difference);occlusion+=step(EPSILON,difference)*rangeCheck;}
occlusion=occlusion*(1.0-smoothstep(maxZ*0.75,maxZ,depth));float ao=1.0-totalStrength*occlusion*samplesFactor;float result=clamp(ao+base,0.0,1.0);gl_FragColor=vec4(vec3(result),1.0);}
#endif
#ifdef BLUR
uniform float outSize;uniform float soften;uniform float tolerance;uniform int samples;
#ifndef BLUR_BYPASS
uniform sampler2D depthSampler;
#ifdef BLUR_LEGACY
#define inline
float blur13Bilateral(sampler2D image,vec2 uv,vec2 step) {float result=0.0;vec2 off1=vec2(1.411764705882353)*step;vec2 off2=vec2(3.2941176470588234)*step;vec2 off3=vec2(5.176470588235294)*step;float compareDepth=abs(textureLod(depthSampler,uv,0.0).r);float sampleDepth;float weight;float weightSum=30.0;result+=textureLod(image,uv,0.0).r*30.0;sampleDepth=abs(textureLod(depthSampler,uv+off1,0.0).r);weight=clamp(1.0/( 0.003+abs(compareDepth-sampleDepth)),0.0,30.0);weightSum+= weight;result+=textureLod(image,uv+off1,0.0).r*weight;sampleDepth=abs(textureLod(depthSampler,uv-off1,0.0).r);weight=clamp(1.0/( 0.003+abs(compareDepth-sampleDepth)),0.0,30.0);weightSum+= weight;result+=textureLod(image,uv-off1,0.0).r*weight;sampleDepth=abs(textureLod(depthSampler,uv+off2,0.0).r);weight=clamp(1.0/( 0.003+abs(compareDepth-sampleDepth)),0.0,30.0);weightSum+=weight;result+=textureLod(image,uv+off2,0.0).r*weight;sampleDepth=abs(textureLod(depthSampler,uv-off2,0.0).r);weight=clamp(1.0/( 0.003+abs(compareDepth-sampleDepth)),0.0,30.0);weightSum+=weight;result+=textureLod(image,uv-off2,0.0).r*weight;sampleDepth=abs(textureLod(depthSampler,uv+off3,0.0).r);weight=clamp(1.0/( 0.003+abs(compareDepth-sampleDepth)),0.0,30.0);weightSum+=weight;result+=textureLod(image,uv+off3,0.0).r*weight;sampleDepth=abs(textureLod(depthSampler,uv-off3,0.0).r);weight=clamp(1.0/( 0.003+abs(compareDepth-sampleDepth)),0.0,30.0);weightSum+=weight;result+=textureLod(image,uv-off3,0.0).r*weight;return result/weightSum;}
#endif
#endif
void main()
{float result=0.0;
#ifdef BLUR_BYPASS
result=textureLod(textureSampler,vUV,0.0).r;
#else
#ifdef BLUR_H
vec2 step=vec2(1.0/outSize,0.0);
#else
vec2 step=vec2(0.0,1.0/outSize);
#endif
#ifdef BLUR_LEGACY
result=blur13Bilateral(textureSampler,vUV,step);
#else
float compareDepth=abs(textureLod(depthSampler,vUV,0.0).r);float weightSum=0.0;for (int i=-samples; i<samples; i+=2)
{vec2 samplePos=vUV+step*(float(i)+0.5);float sampleDepth=abs(textureLod(depthSampler,samplePos,0.0).r);float falloff=smoothstep(0.0,
float(samples),
float(samples)-abs(float(i))*soften);float minDivider=tolerance*0.5+0.003;float weight=falloff/( minDivider+abs(compareDepth-sampleDepth));result+=textureLod(textureSampler,samplePos,0.0).r*weight;weightSum+=weight;}
result/=weightSum;
#endif
#endif
gl_FragColor.rgb=vec3(result);gl_FragColor.a=1.0;}
#endif
`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["ssao2PixelShader",0,{name:r,shader:i}])},104396,e=>{"use strict";var t=e.i(263537);let r="rsmGlobalIlluminationPixelShader",i=`/**
* The implementation is an application of the formula found in http:
* For better results,it also adds a random (noise) rotation to the RSM samples (the noise artifacts are easier to remove than the banding artifacts).
*/
precision highp float;varying vec2 vUV;uniform mat4 rsmLightMatrix;uniform vec4 rsmInfo;uniform vec4 rsmInfo2;uniform sampler2D textureSampler;uniform sampler2D normalSampler;uniform sampler2D rsmPositionW;uniform sampler2D rsmNormalW;uniform sampler2D rsmFlux;uniform sampler2D rsmSamples;
#ifdef TRANSFORM_NORMAL
uniform mat4 invView;
#endif
float mod289(float x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 perm(vec4 x){return mod289(((x*34.0)+1.0)*x);}
float noise(vec3 p){vec3 a=floor(p);vec3 d=p-a;d=d*d*(3.0-2.0*d);vec4 b=a.xxyy+vec4(0.0,1.0,0.0,1.0);vec4 k1=perm(b.xyxy);vec4 k2=perm(k1.xyxy+b.zzww);vec4 c=k2+a.zzzz;vec4 k3=perm(c);vec4 k4=perm(c+1.0);vec4 o1=fract(k3*(1.0/41.0));vec4 o2=fract(k4*(1.0/41.0));vec4 o3=o2*d.z+o1*(1.0-d.z);vec2 o4=o3.yw*d.x+o3.xz*(1.0-d.x);return o4.y*d.y+o4.x*(1.0-d.y);}
vec3 computeIndirect(vec3 p,vec3 n) {vec3 indirectDiffuse=vec3(0.);int numSamples=int(rsmInfo.x);float radius=rsmInfo.y;float intensity=rsmInfo.z;float edgeArtifactCorrection=rsmInfo.w;vec4 texRSM=rsmLightMatrix*vec4(p,1.);texRSM.xy/=texRSM.w;texRSM.xy=texRSM.xy*0.5+0.5;float angle=noise(p*rsmInfo2.x);float c=cos(angle);float s=sin(angle);for (int i=0; i<numSamples; i++) {vec3 rsmSample=texelFetch(rsmSamples,ivec2(i,0),0).xyz;float weightSquare=rsmSample.z;if (rsmInfo2.y==1.0) rsmSample.xy=vec2(rsmSample.x*c+rsmSample.y*s,-rsmSample.x*s+rsmSample.y*c);vec2 uv=texRSM.xy+rsmSample.xy*radius;if (uv.x<0. || uv.x>1. || uv.y<0. || uv.y>1.) continue;vec3 vplPositionW=textureLod(rsmPositionW,uv,0.).xyz;vec3 vplNormalW=textureLod(rsmNormalW,uv,0.).xyz*2.0-1.0;vec3 vplFlux=textureLod(rsmFlux,uv,0.).rgb;vplPositionW-=vplNormalW*edgeArtifactCorrection; 
float dist2=dot(vplPositionW-p,vplPositionW-p);indirectDiffuse+=vplFlux*weightSquare*max(0.,dot(n,vplPositionW-p))*max(0.,dot(vplNormalW,p-vplPositionW))/(dist2*dist2);}
return clamp(indirectDiffuse*intensity,0.0,1.0);}
void main(void) 
{vec3 positionW=texture2D(textureSampler,vUV).xyz;vec3 normalW=texture2D(normalSampler,vUV).xyz;
#ifdef DECODE_NORMAL
normalW=normalW*2.0-1.0;
#endif
#ifdef TRANSFORM_NORMAL
normalW=(invView*vec4(normalW,0.)).xyz;
#endif
gl_FragColor.rgb=computeIndirect(positionW,normalW);gl_FragColor.a=1.0;}
`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["rsmGlobalIlluminationPixelShader",0,{name:r,shader:i}])},752114,e=>{"use strict";var t=e.i(263537);e.i(738124),e.i(755704),e.i(212954);let r="glowMapGenerationPixelShader",i=`#if defined(DIFFUSE_ISLINEAR) || defined(EMISSIVE_ISLINEAR)
#include<helperFunctions>
#endif
#ifdef DIFFUSE
varying vUVDiffuse: vec2f;var diffuseSamplerSampler: sampler;var diffuseSampler: texture_2d<f32>;
#endif
#ifdef OPACITY
varying vUVOpacity: vec2f;var opacitySamplerSampler: sampler;var opacitySampler: texture_2d<f32>;uniform opacityIntensity: f32;
#endif
#ifdef EMISSIVE
varying vUVEmissive: vec2f;var emissiveSamplerSampler: sampler;var emissiveSampler: texture_2d<f32>;
#endif
#ifdef VERTEXALPHA
varying vColor: vec4f;
#endif
uniform glowColor: vec4f;uniform glowIntensity: f32;
#include<clipPlaneFragmentDeclaration>
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {
#include<clipPlaneFragment>
var finalColor: vec4f=uniforms.glowColor;
#ifdef DIFFUSE
var albedoTexture: vec4f=textureSample(diffuseSampler,diffuseSamplerSampler,fragmentInputs.vUVDiffuse);
#ifdef DIFFUSE_ISLINEAR
albedoTexture=toGammaSpace(albedoTexture);
#endif
#ifdef GLOW
finalColor=vec4f(finalColor.rgb,finalColor.a*albedoTexture.a);
#endif
#ifdef HIGHLIGHT
finalColor=vec4f(finalColor.rgb,albedoTexture.a);
#endif
#endif
#ifdef OPACITY
var opacityMap: vec4f=textureSample(opacitySampler,opacitySamplerSampler,fragmentInputs.vUVOpacity);
#ifdef OPACITYRGB
finalColor=vec4f(finalColor.rgb,finalColor.a*getLuminance(opacityMap.rgb));
#else
finalColor=vec4f(finalColor.rgb,finalColor.a*opacityMap.a);
#endif
finalColor=vec4f(finalColor.rgb,finalColor.a*uniforms.opacityIntensity);
#endif
#ifdef VERTEXALPHA
finalColor=vec4f(finalColor.rgb,finalColor.a*fragmentInputs.vColor.a);
#endif
#ifdef ALPHATEST
if (finalColor.a<ALPHATESTVALUE) {discard;}
#endif
#ifdef EMISSIVE
var emissive: vec4f=textureSample(emissiveSampler,emissiveSamplerSampler,fragmentInputs.vUVEmissive);
#ifdef EMISSIVE_ISLINEAR
emissive=toGammaSpace(emissive);
#endif
fragmentOutputs.color=emissive*finalColor*uniforms.glowIntensity;
#else
fragmentOutputs.color=finalColor*uniforms.glowIntensity;
#endif
#ifdef HIGHLIGHT
fragmentOutputs.color=vec4f(fragmentOutputs.color.rgb,uniforms.glowColor.a);
#endif
}
`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["glowMapGenerationPixelShaderWGSL",0,{name:r,shader:i}])},646964,e=>{"use strict";var t=e.i(440163),r=e.i(916624),i=e.i(774685);class a extends t.FlowGraphBlock{constructor(e){super(e),this.userVariables=this.registerDataOutput("userVariables",r.RichTypeAny),this.executionId=this.registerDataOutput("executionId",r.RichTypeNumber)}_updateOutputs(e){this.userVariables.setValue(e.userVariables,e),this.executionId.setValue(e.executionId,e)}serialize(e){super.serialize(e)}getClassName(){return"FlowGraphContextBlock"}}(0,i.RegisterClass)("FlowGraphContextBlock",a),e.s(["FlowGraphContextBlock",0,a])},133497,e=>{"use strict";var t=e.i(263537);let r="iblShadowDebugPixelShader",i=`varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;var debugSamplerSampler: sampler;var debugSampler: texture_2d<f32>;uniform sizeParams: vec4f;
#define offsetX uniforms.sizeParams.x
#define offsetY uniforms.sizeParams.y
#define widthScale uniforms.sizeParams.z
#define heightScale uniforms.sizeParams.w
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var uv: vec2f =
vec2f((offsetX+fragmentInputs.vUV.x)*widthScale,(offsetY+fragmentInputs.vUV.y)*heightScale);var background: vec4f=textureSample(textureSampler,textureSamplerSampler,fragmentInputs.vUV);var debugColour: vec4f=textureSample(debugSampler,debugSamplerSampler,fragmentInputs.vUV);if (uv.x<0.0 || uv.x>1.0 || uv.y<0.0 || uv.y>1.0) {fragmentOutputs.color=background;} else {fragmentOutputs.color=vec4f(mix(debugColour.rgb,background.rgb,0.0),1.0);}}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["iblShadowDebugPixelShaderWGSL",0,{name:r,shader:i}])},748548,e=>{"use strict";var t=e.i(440163),r=e.i(916624),i=e.i(774685);class a extends t.FlowGraphBlock{constructor(e){super(e),this.config=e,this.value=this.registerDataOutput("value",r.RichTypeAny,e.initialValue)}_updateOutputs(e){let t=this.config.variable;e.hasVariable(t)&&this.value.setValue(e.getVariable(t),e)}serialize(e){super.serialize(e),e.config.variable=this.config.variable}getClassName(){return"FlowGraphGetVariableBlock"}}(0,i.RegisterClass)("FlowGraphGetVariableBlock",a),e.s(["FlowGraphGetVariableBlock",0,a])},169418,e=>{"use strict";var t=e.i(263537);let r="fluidRenderingParticleDepthVertexShader",i=`attribute position: vec3f;attribute offset: vec2f;uniform view: mat4x4f;uniform projection: mat4x4f;uniform size: vec2f;varying uv: vec2f;varying viewPos: vec3f;varying sphereRadius: f32;
#ifdef FLUIDRENDERING_VELOCITY
attribute velocity: vec3f;varying velocityNorm: f32;
#endif
@vertex
fn main(input: VertexInputs)->FragmentInputs {var cornerPos: vec3f=vec3f(
vec2f(vertexInputs.offset.x-0.5,vertexInputs.offset.y-0.5)*uniforms.size,
0.0
);vertexOutputs.viewPos=(uniforms.view*vec4f(vertexInputs.position,1.0)).xyz;vertexOutputs.position=uniforms.projection*vec4f(vertexOutputs.viewPos+cornerPos,1.0);vertexOutputs.uv=vertexInputs.offset;vertexOutputs.sphereRadius=uniforms.size.x/2.0;
#ifdef FLUIDRENDERING_VELOCITY
vertexOutputs.velocityNorm=length(velocity);
#endif
}
`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["fluidRenderingParticleDepthVertexShaderWGSL",0,{name:r,shader:i}])},140200,e=>{"use strict";var t=e.i(353679),r=e.i(916624),i=e.i(774685);class a extends t.FlowGraphExecutionBlockWithOutSignal{constructor(e){super(e),this.animationToPause=this.registerDataInput("animationToPause",r.RichTypeAny)}_execute(e){this.animationToPause.getValue(e).pause(),this.out._activateSignal(e)}getClassName(){return"FlowGraphPauseAnimationBlock"}}(0,i.RegisterClass)("FlowGraphPauseAnimationBlock",a),e.s(["FlowGraphPauseAnimationBlock",0,a])},570029,e=>{"use strict";var t=e.i(916624),r=e.i(774685),i=e.i(196548);class a extends i.FlowGraphCachedOperationBlock{constructor(e){super(t.RichTypeNumber,e),this.sound=this.registerDataInput("sound",t.RichTypeAny)}_doOperation(e){let t=this.sound.getValue(e);if(t)return t.volume}getClassName(){return"FlowGraphGetSoundVolumeBlock"}}(0,r.RegisterClass)("FlowGraphGetSoundVolumeBlock",a),e.s(["FlowGraphGetSoundVolumeBlock",0,a])},813299,e=>{"use strict";var t=e.i(263537);e.i(738124);let r="extractHighlightsPixelShader",i=`#include<helperFunctions>
varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;uniform threshold: f32;uniform exposure: f32;
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {fragmentOutputs.color=textureSample(textureSampler,textureSamplerSampler,input.vUV);var luma: f32=dot(LuminanceEncodeApprox,fragmentOutputs.color.rgb*uniforms.exposure);fragmentOutputs.color=vec4f(step(uniforms.threshold,luma)*fragmentOutputs.color.rgb,fragmentOutputs.color.a);}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["extractHighlightsPixelShaderWGSL",0,{name:r,shader:i}])},964508,e=>{"use strict";var t=e.i(263537);e.i(738124),e.i(120091),e.i(590030),e.i(481519);let r="hdrFilteringPixelShader",i=`#include<helperFunctions>
#include<importanceSampling>
#include<pbrBRDFFunctions>
#include<hdrFilteringFunctions>
uniform alphaG: f32;var inputTextureSampler: sampler;var inputTexture: texture_cube<f32>;uniform vFilteringInfo: vec2f;uniform hdrScale: f32;varying direction: vec3f;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var color: vec3f=radiance(uniforms.alphaG,inputTexture,inputTextureSampler,input.direction,uniforms.vFilteringInfo);fragmentOutputs.color= vec4f(color*uniforms.hdrScale,1.0);}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["hdrFilteringPixelShaderWGSL",0,{name:r,shader:i}])},495562,e=>{"use strict";var t=e.i(263537);let r="motionBlurPixelShader",i=`varying vec2 vUV;uniform sampler2D textureSampler;uniform float motionStrength;uniform float motionScale;uniform vec2 screenSize;
#ifdef OBJECT_BASED
uniform sampler2D velocitySampler;
#else
uniform sampler2D depthSampler;uniform mat4 inverseViewProjection;uniform mat4 prevViewProjection;uniform mat4 projection;
#endif
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void)
{
#ifdef GEOMETRY_SUPPORTED
#ifdef OBJECT_BASED
vec2 texelSize=1.0/screenSize;vec4 velocityColor=textureLod(velocitySampler,vUV,0.0);velocityColor.rg=velocityColor.rg*2.0-vec2(1.0);vec2 signs=sign(velocityColor.rg);vec2 velocity=pow(abs(velocityColor.rg),vec2(3.0))*signs*velocityColor.a;velocity*=motionScale*motionStrength;float speed=length(velocity/texelSize);int samplesCount=int(clamp(speed,1.0,SAMPLES));velocity=normalize(velocity)*texelSize;float hlim=float(-samplesCount)*0.5+0.5;vec4 result=textureLod(textureSampler,vUV,0.0);for (int i=1; i<int(SAMPLES); ++i)
{if (i>=samplesCount)
break;vec2 offset=vUV+velocity*(hlim+float(i));result+=textureLod(textureSampler,offset,0.0);}
gl_FragColor=result/float(samplesCount);gl_FragColor.a=1.0;
#else
vec4 result=textureLod(textureSampler,vUV,0.0);vec2 texelSize=1.0/screenSize;float depth=textureLod(depthSampler,vUV,0.0).r;if (depth==0.0) {gl_FragColor=result;return;}
depth=projection[2].z+projection[3].z/depth; 
vec4 cpos=vec4(vUV*2.0-1.0,depth,1.0);cpos=inverseViewProjection*cpos;cpos/=cpos.w;vec4 ppos=prevViewProjection*cpos;ppos/=ppos.w;ppos.xy=ppos.xy*0.5+0.5;vec2 velocity=(ppos.xy-vUV)*motionScale*motionStrength;float speed=length(velocity/texelSize);int nSamples=int(clamp(speed,1.0,SAMPLES));for (int i=1; i<int(SAMPLES); ++i) {if (i>=nSamples)
break;vec2 offset1=vUV+velocity*(float(i)/float(nSamples-1)-0.5);result+=textureLod(textureSampler,offset1,0.0);}
gl_FragColor=result/float(nSamples);
#endif
#else
gl_FragColor=texture2D(textureSampler,vUV);
#endif
}
`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["motionBlurPixelShader",0,{name:r,shader:i}])},474594,e=>{"use strict";var t=e.i(263537);let r="bilateralBlurPixelShader",i=`var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;var normalSamplerSampler: sampler;var normalSampler: texture_2d<f32>;var depthSamplerSampler: sampler;var depthSampler: texture_2d<f32>;uniform filterSize: i32;uniform blurDir: vec2f;uniform depthThreshold: f32;uniform normalThreshold: f32;varying vUV: vec2f;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var color: vec3f=textureSampleLevel(textureSampler,textureSamplerSampler,input.vUV,0.).rgb;var depth: f32=textureSampleLevel(depthSampler,depthSamplerSampler,input.vUV,0.).x;if (depth>=1e6 || depth<=0.) {fragmentOutputs.color= vec4f(color,1.);return fragmentOutputs;}
var normal: vec3f=textureSampleLevel(normalSampler,normalSamplerSampler,input.vUV,0.).rgb;
#ifdef DECODE_NORMAL
normal=normal*2.0-1.0;
#endif
var sigma: f32= f32(uniforms.filterSize);var two_sigma2: f32=2.0*sigma*sigma;var sigmaDepth: f32=uniforms.depthThreshold;var two_sigmaDepth2: f32=2.0*sigmaDepth*sigmaDepth;var sigmaNormal: f32=uniforms.normalThreshold;var two_sigmaNormal2: f32=2.0*sigmaNormal*sigmaNormal;var sum: vec3f= vec3f(0.);var wsum: f32=0.;for (var x: i32=-uniforms.filterSize; x<=uniforms.filterSize; x++) {var coords=vec2f(f32(x));var sampleColor: vec3f=textureSampleLevel(textureSampler,textureSamplerSampler,input.vUV+coords*uniforms.blurDir,0.).rgb;var sampleDepth: f32=textureSampleLevel(depthSampler,depthSamplerSampler,input.vUV+coords*uniforms.blurDir,0.).r;var sampleNormal: vec3f=textureSampleLevel(normalSampler,normalSamplerSampler,input.vUV+coords*uniforms.blurDir,0.).rgb;
#ifdef DECODE_NORMAL
sampleNormal=sampleNormal*2.0-1.0;
#endif
var r: f32=dot(coords,coords);var w: f32=exp(-r/two_sigma2);var depthDelta: f32=abs(sampleDepth-depth);var wd: f32=step(depthDelta,uniforms.depthThreshold);var normalDelta: vec3f=abs(sampleNormal-normal);var wn: f32=step(normalDelta.x+normalDelta.y+normalDelta.z,uniforms.normalThreshold);sum+=sampleColor*w*wd*wn;wsum+=w*wd*wn;}
fragmentOutputs.color= vec4f(sum/wsum,1.);}
`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["bilateralBlurPixelShaderWGSL",0,{name:r,shader:i}])},165320,e=>{"use strict";var t=e.i(263537);e.i(201632);let r="iblShadowVoxelTracingPixelShader",i=`precision highp sampler2D;precision highp sampler3D;
#include<helperFunctions>
varying vec2 vUV;
#define DISABLE_UNIFORMITY_ANALYSIS
uniform sampler2D depthSampler;uniform sampler2D worldNormalSampler;uniform sampler2D blueNoiseSampler;uniform sampler2D icdfSampler;uniform sampler3D voxelGridSampler;
#ifdef COLOR_SHADOWS
uniform samplerCube iblSampler;
#endif
uniform vec4 shadowParameters;
#define SHADOWdirs shadowParameters.x
#define SHADOWframe shadowParameters.y
#define SHADOWenvRot shadowParameters.w
uniform vec4 voxelBiasParameters;
#define highestMipLevel voxelBiasParameters.z
uniform vec4 sssParameters;
#define SSSsamples sssParameters.x
#define SSSstride sssParameters.y
#define SSSmaxDistance sssParameters.z
#define SSSthickness sssParameters.w
uniform vec4 shadowOpacity;uniform mat4 projMtx;uniform mat4 viewMtx;uniform mat4 invProjMtx;uniform mat4 invViewMtx;uniform mat4 wsNormalizationMtx;uniform mat4 invVPMtx;
#define GOLD 0.618034
struct AABB3f {vec3 m_min;vec3 m_max;};struct Ray {vec3 orig;vec3 dir;vec3 dir_rcp;float t_min;float t_max;};Ray make_ray(const vec3 origin,const vec3 direction,const float tmin,
const float tmax) {Ray ray;ray.orig=origin;ray.dir=direction;ray.dir_rcp=1.0f/direction;ray.t_min=tmin;ray.t_max=tmax;return ray;}
bool ray_box_intersection(const in AABB3f aabb,const in Ray ray,
out float distance_near,out float distance_far) {vec3 tbot=ray.dir_rcp*(aabb.m_min-ray.orig);vec3 ttop=ray.dir_rcp*(aabb.m_max-ray.orig);vec3 tmin=min(ttop,tbot);vec3 tmax=max(ttop,tbot);distance_near=max(ray.t_min,max(tmin.x,max(tmin.y,tmin.z)));distance_far=min(ray.t_max,min(tmax.x,min(tmax.y,tmax.z)));return distance_near<=distance_far;}
#if VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
struct VoxelMarchDiagnosticInfo {float heat;ivec3 voxel_intersect_coords;};
#endif
uint hash(uint i) {i ^= i>>16u;i*=0x7FEB352Du;i ^= i>>15u;i*=0x846CA68Bu;i ^= i>>16u;return i;}
vec3 uv_to_normal(vec2 uv) {vec3 N;vec2 uvRange=uv;float theta=uvRange.x*2.0*PI;float phi=uvRange.y*PI;N.x=cos(theta)*sin(phi);N.z=sin(theta)*sin(phi);N.y=cos(phi);return N;}
float goldenSequence(const uint rstate) {return uint2float(rstate*2654435769u);}
float distanceSquared(vec2 a,vec2 b) {vec2 diff=a-b;return dot(diff,diff);}
void genTB(const vec3 N,out vec3 T,out vec3 B) {float s=N.z<0.0 ? -1.0 : 1.0;float a=-1.0/(s+N.z);float b=N.x*N.y*a;T=vec3(1.0+s*N.x*N.x*a,s*b,-s*N.x);B=vec3(b,s+N.y*N.y*a,-N.y);}
int stack[24]; 
#define PUSH(i) stack[stackLevel++]=i; 
#define POP() stack[--stackLevel] 
#ifdef VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
bool anyHitVoxels(const Ray ray_vs,
out VoxelMarchDiagnosticInfo voxel_march_diagnostic_info) {
#else
bool anyHitVoxels(const Ray ray_vs) {
#endif
vec3 invD=ray_vs.dir_rcp;vec3 D=ray_vs.dir;vec3 O=ray_vs.orig;ivec3 negD=ivec3(lessThan(D,vec3(0,0,0)));int voxel0=negD.x | negD.y<<1 | negD.z<<2;vec3 t0=-O*invD,t1=(vec3(1.0)-O)*invD;int maxLod=int(highestMipLevel);int stackLevel=0;
#if VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
uint steps=0u;
#endif
PUSH(maxLod<<24);while (stackLevel>0) {int elem=POP();ivec4 Coords =
ivec4(elem & 0xFF,elem>>8 & 0xFF,elem>>16 & 0xFF,elem>>24);if (Coords.w==0) {
#if VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
voxel_march_diagnostic_info.heat=float(steps)/24.0;
#endif
return true;}
#if VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
++steps;
#endif
float invRes=exp2(float(Coords.w-maxLod));vec3 bbmin=invRes*vec3(Coords.xyz+negD);vec3 bbmax=invRes*vec3(Coords.xyz-negD+ivec3(1));vec3 mint=mix(t0,t1,bbmin);vec3 maxt=mix(t0,t1,bbmax);vec3 midt=0.5*(mint+maxt);mint.x=max(0.0,mint.x);midt.x=max(0.0,midt.x);int nodeMask=int(
round(texelFetch(voxelGridSampler,Coords.xyz,Coords.w).x*255.0));Coords.w--;int voxelBit=voxel0;Coords.xyz=(Coords.xyz<<1)+negD;int packedCoords =
Coords.x | Coords.y<<8 | Coords.z<<16 | Coords.w<<24;if (max(mint.x,max(mint.y,mint.z))<min(midt.x,min(midt.y,midt.z)) &&
(1<<voxelBit & nodeMask) != 0)
PUSH(packedCoords);voxelBit ^= 0x1;packedCoords ^= 0x00001;if (max(midt.x,max(mint.y,mint.z))<min(maxt.x,min(midt.y,midt.z)) &&
(1<<voxelBit & nodeMask) != 0)
PUSH(packedCoords);voxelBit ^= 0x2;packedCoords ^= 0x00100;if (max(midt.x,max(midt.y,mint.z))<min(maxt.x,min(maxt.y,midt.z)) &&
(1<<voxelBit & nodeMask) != 0)
PUSH(packedCoords);voxelBit ^= 0x1;packedCoords ^= 0x00001;if (max(mint.x,max(midt.y,mint.z))<min(midt.x,min(maxt.y,midt.z)) &&
(1<<voxelBit & nodeMask) != 0)
PUSH(packedCoords);voxelBit ^= 0x4;packedCoords ^= 0x10000;if (max(mint.x,max(midt.y,midt.z))<min(midt.x,min(maxt.y,maxt.z)) &&
(1<<voxelBit & nodeMask) != 0)
PUSH(packedCoords);voxelBit ^= 0x1;packedCoords ^= 0x00001;if (max(midt.x,max(midt.y,midt.z))<min(maxt.x,min(maxt.y,maxt.z)) &&
(1<<voxelBit & nodeMask) != 0)
PUSH(packedCoords);voxelBit ^= 0x2;packedCoords ^= 0x00100;if (max(midt.x,max(mint.y,midt.z))<min(maxt.x,min(midt.y,maxt.z)) &&
(1<<voxelBit & nodeMask) != 0)
PUSH(packedCoords);voxelBit ^= 0x1;packedCoords ^= 0x00001;if (max(mint.x,max(mint.y,midt.z))<min(midt.x,min(midt.y,maxt.z)) &&
(1<<voxelBit & nodeMask) != 0)
PUSH(packedCoords);}
#if VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
voxel_march_diagnostic_info.heat=float(steps)/24.0;
#endif
return false;}
float linearizeDepth(float depth,float near,float far) {return (near*far)/(far-depth*(far-near));}
float screenSpaceShadow(vec3 csOrigin,vec3 csDirection,vec2 csZBufferSize,
float nearPlaneZ,float farPlaneZ,float noise) {
#ifdef RIGHT_HANDED
float csZDir=-1.0;
#else 
float csZDir=1.0;
#endif
float ssSamples=SSSsamples;float ssMaxDist=SSSmaxDistance;float ssStride=SSSstride;float ssThickness=SSSthickness;float rayLength =
csZDir*(csOrigin.z+ssMaxDist*csDirection.z)<csZDir*nearPlaneZ
? 
(nearPlaneZ-csOrigin.z)/csDirection.z
: ssMaxDist;vec3 csEndPoint=csOrigin+rayLength*csDirection;vec4 H0=projMtx*vec4(csOrigin,1.0);vec4 H1=projMtx*vec4(csEndPoint,1.0);vec2 Z0=vec2(csOrigin.z ,1.0)/H0.w;vec2 Z1=vec2(csEndPoint.z,1.0)/H1.w;vec2 P0=csZBufferSize*(0.5*H0.xy*Z0.y+0.5);vec2 P1=csZBufferSize*(0.5*H1.xy*Z1.y+0.5);P1+=vec2(distanceSquared(P0,P1)<0.0001 ? 0.01 : 0.0);vec2 delta=P1-P0;bool permute=false;if (abs(delta.x)<abs(delta.y)) {permute=true;P0=P0.yx;P1=P1.yx;delta=delta.yx;}
float stepDirection=sign(delta.x);float invdx=stepDirection/delta.x;vec2 dP=ssStride*vec2(stepDirection,invdx*delta.y);vec2 dZ=ssStride*invdx*(Z1-Z0);float opacity=0.0;vec2 P=P0+noise*dP;vec2 Z=Z0+noise*dZ;float end=P1.x*stepDirection;float rayZMax=csZDir*Z.x/Z.y;float sceneDepth=rayZMax;Z+=dZ;for (float stepCount=0.0;opacity<1.0 && P.x*stepDirection<end && sceneDepth>0.0 && stepCount<ssSamples;stepCount++,P+=dP,
Z+=dZ) { 
ivec2 coords=ivec2(permute ? P.yx : P);sceneDepth=texelFetch(depthSampler,coords,0).x;sceneDepth=linearizeDepth(sceneDepth,nearPlaneZ,farPlaneZ);sceneDepth=csZDir*sceneDepth;if (sceneDepth<=0.0) {break;}
float rayZMin=rayZMax;rayZMax=csZDir*Z.x/Z.y;opacity+=max(opacity,step(rayZMax,sceneDepth+ssThickness)*step(sceneDepth,rayZMin));}
return opacity;}
#if VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
float voxelShadow(vec3 wsOrigin,vec3 wsDirection,vec3 wsNormal,
vec2 DitherNoise,
out VoxelMarchDiagnosticInfo voxel_march_diagnostic_info) {
#else
float voxelShadow(vec3 wsOrigin,vec3 wsDirection,vec3 wsNormal,
vec2 DitherNoise) {
#endif
float vxResolution=float(textureSize(voxelGridSampler,0).x);vec3 T,B;genTB(wsDirection,T,B);vec2 DitherXY=sqrt(DitherNoise.x)*vec2(cos(2.0*PI*DitherNoise.y),
sin(2.0*PI*DitherNoise.y));float sceneScale=wsNormalizationMtx[0][0];vec3 Dithering =
(voxelBiasParameters.x*wsNormal+voxelBiasParameters.y*wsDirection +
DitherXY.x*T+DitherXY.y*B) /
vxResolution;vec3 O=0.5*wsOrigin+0.5+Dithering;Ray ray_vs=make_ray(O,wsDirection,0.0,10.0);AABB3f voxel_aabb;voxel_aabb.m_min=vec3(0);voxel_aabb.m_max=vec3(1);float near,far;if (!ray_box_intersection(voxel_aabb,ray_vs,near,far))
return 0.0;ray_vs.t_min=max(ray_vs.t_min,near);ray_vs.t_max=min(ray_vs.t_max,far);
#if VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
return anyHitVoxels(ray_vs,voxel_march_diagnostic_info) ? 1.0f : 0.0f;
#else
return anyHitVoxels(ray_vs) ? 1.0f : 0.0f;
#endif
}
void main(void) {uint nbDirs=uint(SHADOWdirs);uint frameId=uint(SHADOWframe);float envRot=SHADOWenvRot;vec2 Resolution=vec2(textureSize(depthSampler,0));ivec2 currentPixel=ivec2(vUV*Resolution);uint GlobalIndex=(frameId*uint(Resolution.y)+uint(currentPixel.y)) *
uint(Resolution.x) +
uint(currentPixel.x);vec3 N=texelFetch(worldNormalSampler,currentPixel,0).xyz;
#ifdef WORLD_NORMAL_UNSIGNED
N=N*vec3(2.0)-vec3(1.0);
#endif
if (length(N)<0.01) {glFragColor=vec4(1.0,1.0,0.0,1.0);return;}
float normalizedRotation=envRot/(2.0*PI);float depth=texelFetch(depthSampler,currentPixel,0).x;
#ifndef IS_NDC_HALF_ZRANGE
depth=depth*2.0-1.0;
#endif
vec2 temp=(vec2(currentPixel)+vec2(0.5))*2.0/Resolution-vec2(1.0);vec4 VP=invProjMtx*vec4(temp.x,-temp.y,depth,1.0);VP/=VP.w;N=normalize(N);vec3 noise=texelFetch(blueNoiseSampler,currentPixel & 0xFF,0).xyz;noise.z=fract(noise.z+goldenSequence(frameId*nbDirs));
#ifdef VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
float heat=0.0f;
#endif
float shadowAccum=0.001;float specShadowAccum=0.001;float sampleWeight=0.001;
#ifdef COLOR_SHADOWS
vec3 totalLight=vec3(0.001);vec3 shadowedLight=vec3(0.0);
#endif
for (uint i=0u; i<nbDirs; i++) {uint dirId=nbDirs*GlobalIndex+i;vec4 L;vec2 T;{vec2 r=plasticSequence(frameId*nbDirs+i);r=fract(r+vec2(2.0)*abs(noise.xy-vec2(0.5)));T.x=textureLod(icdfSampler,vec2(r.x,0.0),0.0).x;T.y=textureLod(icdfSampler,vec2(T.x,r.y),0.0).y;L=vec4(uv_to_normal(vec2(T.x-normalizedRotation,T.y)),0);
#ifndef RIGHT_HANDED
L.z*=-1.0;
#endif
}
#ifdef COLOR_SHADOWS
vec3 lightDir=uv_to_normal(vec2(1.0-fract(T.x+0.25),T.y));vec3 ibl=textureLod(iblSampler,lightDir,0.0).xyz;float pdf=textureLod(icdfSampler,T,0.0).z;
#endif
float cosNL=dot(N,L.xyz);float opacity=0.0;if (cosNL>0.0) {vec4 VP2=VP;VP2.y*=-1.0;vec4 unormWP=invViewMtx*VP2;vec3 WP=(wsNormalizationMtx*unormWP).xyz;vec2 vxNoise=vec2(uint2float(hash(dirId*2u)),uint2float(hash(dirId*2u+1u)));
#ifdef VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
VoxelMarchDiagnosticInfo voxel_march_diagnostic_info;opacity=max(opacity,shadowOpacity.x*voxelShadow(WP,L.xyz,N,vxNoise,voxel_march_diagnostic_info));heat+=voxel_march_diagnostic_info.heat;
#else
opacity =
max(opacity,shadowOpacity.x*voxelShadow(WP,L.xyz,N,vxNoise));
#endif
vec3 VL=(viewMtx*L).xyz;
#ifdef RIGHT_HANDED
float nearPlaneZ=-projMtx[3][2]/(projMtx[2][2]-1.0); 
float farPlaneZ=-projMtx[3][2]/(projMtx[2][2]+1.0);
#else
float nearPlaneZ=-projMtx[3][2]/(projMtx[2][2]+1.0); 
float farPlaneZ=-projMtx[3][2]/(projMtx[2][2]-1.0);
#endif
float ssShadow=shadowOpacity.y *
screenSpaceShadow(VP2.xyz,VL,Resolution,nearPlaneZ,farPlaneZ,
abs(2.0*noise.z-1.0));opacity=max(opacity,ssShadow);
#ifdef COLOR_SHADOWS
vec3 light=pdf<1e-6 ? vec3(0.0) : vec3(cosNL)/vec3(pdf)*ibl;shadowedLight+=light*opacity;totalLight+=light;
#else
float rcos=(1.0-cosNL);shadowAccum+=(1.0-opacity*(1.0-pow(rcos,8.0)));sampleWeight+=1.0;vec3 VR=-(viewMtx*vec4(reflect(-L.xyz,N),0.0)).xyz;specShadowAccum+=max(1.0-(opacity*pow(VR.z,8.0)),0.0);
#endif
}
noise.z=fract(noise.z+GOLD);}
#ifdef COLOR_SHADOWS
vec3 shadow=(totalLight-shadowedLight)/totalLight;float maxShadow=max(max(shadow.x,max(shadow.y,shadow.z)),1.0);glFragColor=vec4(shadow/maxShadow,1.0);
#else
#ifdef VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
gl_FragColor=vec4(shadowAccum/float(sampleWeight),
specShadowAccum/float(sampleWeight),heat/float(sampleWeight),1.0);
#else
gl_FragColor=vec4(shadowAccum/float(sampleWeight),specShadowAccum/float(sampleWeight),0.0,1.0);
#endif
#endif
}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["iblShadowVoxelTracingPixelShader",0,{name:r,shader:i}])},254958,732780,e=>{"use strict";var t=e.i(700183);function r(e){let t=0;return{id_length:e[t++],colormap_type:e[t++],image_type:e[t++],colormap_index:e[t++]|e[t++]<<8,colormap_length:e[t++]|e[t++]<<8,colormap_size:e[t++],origin:[e[t++]|e[t++]<<8,e[t++]|e[t++]<<8],width:e[t++]|e[t++]<<8,height:e[t++]|e[t++]<<8,pixel_size:e[t++],flags:e[t]}}function i(e,i){let o,n,s,l,f,c,d,u;if(i.length<19)return void t.Logger.Error("Unable to load TGA file - Not enough data to contain header");let m=18,p=r(i);if(p.id_length+m>i.length)return void t.Logger.Error("Unable to load TGA file - Not enough data");m+=p.id_length;let v=!1,S=!1,h=!1;switch(p.image_type){case 9:v=!0;case 1:S=!0;break;case 10:v=!0;case 2:break;case 11:v=!0;case 3:h=!0}let x=p.pixel_size>>3,g=p.width*p.height*x;if(S&&(n=i.subarray(m,m+=p.colormap_length*(p.colormap_size>>3))),v){let e,t,r;o=new Uint8Array(g);let a=0,n=new Uint8Array(x);for(;m<g&&a<g;)if(t=(127&(e=i[m++]))+1,128&e){for(r=0;r<x;++r)n[r]=i[m++];for(r=0;r<t;++r)o.set(n,a+r*x);a+=x*t}else{for(t*=x,r=0;r<t;++r)o[a+r]=i[m++];a+=t}}else o=i.subarray(m,m+(S?p.width*p.height:g));switch((48&p.flags)>>4){default:case 2:s=0,f=1,u=p.width,l=0,c=1,d=p.height;break;case 0:s=0,f=1,u=p.width,l=p.height-1,c=-1,d=-1;break;case 3:s=p.width-1,f=-1,u=-1,l=0,c=1,d=p.height;break;case 1:s=p.width-1,f=-1,u=-1,l=p.height-1,c=-1,d=-1}let E=a["_getImageData"+(h?"Grey":"")+p.pixel_size+"bits"](p,n,o,l,c,d,s,f,u);e.getEngine()._uploadDataToTextureDirectly(e,E)}let a={GetTGAHeader:r,UploadContent:i,_getImageData8bits:function(e,t,r,i,a,o,n,s,l){let f=e.width,c=e.height,d,u=0,m,p,v=new Uint8Array(f*c*4);for(p=i;p!==o;p+=a)for(m=n;m!==l;m+=s,u++)d=r[u],v[(m+f*p)*4+3]=255,v[(m+f*p)*4+2]=t[3*d+0],v[(m+f*p)*4+1]=t[3*d+1],v[(m+f*p)*4+0]=t[3*d+2];return v},_getImageData16bits:function(e,t,r,i,a,o,n,s,l){let f=e.width,c=e.height,d,u=0,m,p,v=new Uint8Array(f*c*4);for(p=i;p!==o;p+=a)for(m=n;m!==l;m+=s,u+=2){let e=((31744&(d=r[u+0]+(r[u+1]<<8)))>>10)*255/31|0,t=((992&d)>>5)*255/31|0,i=(31&d)*255/31|0;v[(m+f*p)*4+0]=e,v[(m+f*p)*4+1]=t,v[(m+f*p)*4+2]=i,v[(m+f*p)*4+3]=32768&d?0:255}return v},_getImageData24bits:function(e,t,r,i,a,o,n,s,l){let f=e.width,c=e.height,d=0,u,m,p=new Uint8Array(f*c*4);for(m=i;m!==o;m+=a)for(u=n;u!==l;u+=s,d+=3)p[(u+f*m)*4+3]=255,p[(u+f*m)*4+2]=r[d+0],p[(u+f*m)*4+1]=r[d+1],p[(u+f*m)*4+0]=r[d+2];return p},_getImageData32bits:function(e,t,r,i,a,o,n,s,l){let f=e.width,c=e.height,d=0,u,m,p=new Uint8Array(f*c*4);for(m=i;m!==o;m+=a)for(u=n;u!==l;u+=s,d+=4)p[(u+f*m)*4+2]=r[d+0],p[(u+f*m)*4+1]=r[d+1],p[(u+f*m)*4+0]=r[d+2],p[(u+f*m)*4+3]=r[d+3];return p},_getImageDataGrey8bits:function(e,t,r,i,a,o,n,s,l){let f=e.width,c=e.height,d,u=0,m,p,v=new Uint8Array(f*c*4);for(p=i;p!==o;p+=a)for(m=n;m!==l;m+=s,u++)d=r[u],v[(m+f*p)*4+0]=d,v[(m+f*p)*4+1]=d,v[(m+f*p)*4+2]=d,v[(m+f*p)*4+3]=255;return v},_getImageDataGrey16bits:function(e,t,r,i,a,o,n,s,l){let f=e.width,c=e.height,d=0,u,m,p=new Uint8Array(f*c*4);for(m=i;m!==o;m+=a)for(u=n;u!==l;u+=s,d+=2)p[(u+f*m)*4+0]=r[d+0],p[(u+f*m)*4+1]=r[d+0],p[(u+f*m)*4+2]=r[d+0],p[(u+f*m)*4+3]=r[d+1];return p}};e.s(["GetTGAHeader",0,r,"UploadContent",0,i],732780),e.s(["_TGATextureLoader",0,class{constructor(){this.supportCascades=!1}loadCubeData(){throw".env not supported in Cube."}loadData(e,t,a){let o=new Uint8Array(e.buffer,e.byteOffset,e.byteLength),n=r(o);a(n.width,n.height,t.generateMipMaps,!1,()=>{i(t,o)})}}],254958)},387127,e=>{"use strict";var t=e.i(263537);e.i(407892),e.i(380244),e.i(585817),e.i(945868),e.i(13486),e.i(988389),e.i(431235),e.i(300889),e.i(398879),e.i(92372);let r="pickingVertexShader",i=`attribute position: vec3f;
#if defined(INSTANCES)
attribute instanceMeshID: f32;
#endif
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]
#include<instancesDeclaration>
uniform viewProjection: mat4x4f;
#if defined(INSTANCES)
flat varying vMeshID: f32;
#endif
@vertex
fn main(input : VertexInputs)->FragmentInputs {var positionUpdated: vec3f=vertexInputs.position;
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
var worldPos: vec4f=finalWorld*vec4f(positionUpdated,1.0);vertexOutputs.position=uniforms.viewProjection*worldPos;
#if defined(INSTANCES)
vertexOutputs.vMeshID=vertexInputs.instanceMeshID;
#endif
}
`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["pickingVertexShaderWGSL",0,{name:r,shader:i}])},785935,e=>{"use strict";var t=e.i(263537);e.i(407892),e.i(380244),e.i(585817),e.i(945868),e.i(349e3),e.i(13486),e.i(357351),e.i(988389),e.i(431235),e.i(300889),e.i(398879),e.i(92372),e.i(84318),e.i(505913);let r="outlineVertexShader",i=`attribute position: vec3f;attribute normal: vec3f;
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]
#include<clipPlaneVertexDeclaration>
uniform offset: f32;
#include<instancesDeclaration>
uniform viewProjection: mat4x4f;
#ifdef ALPHATEST
varying vUV: vec2f;uniform diffuseMatrix: mat4x4f; 
#ifdef UV1
attribute uv: vec2f;
#endif
#ifdef UV2
attribute uv2: vec2f;
#endif
#endif
#include<logDepthDeclaration>
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input: VertexInputs)->FragmentInputs {var positionUpdated: vec3f=vertexInputs.position;var normalUpdated: vec3f=vertexInputs.normal;
#ifdef UV1
var uvUpdated: vec2f=vertexInputs.uv;
#endif
#ifdef UV2
var uv2Updated: vec2f=vertexInputs.uv2;
#endif
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
var offsetPosition: vec3f=positionUpdated+(normalUpdated*uniforms.offset);
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
var worldPos: vec4f=finalWorld*vec4f(offsetPosition,1.0);vertexOutputs.position=uniforms.viewProjection*worldPos;
#ifdef ALPHATEST
#ifdef UV1
vertexOutputs.vUV=(uniforms.diffuseMatrix*vec4f(uvUpdated,1.0,0.0)).xy;
#endif
#ifdef UV2
vertexOutputs.vUV=(uniforms.diffuseMatrix*vec4f(uv2Updated,1.0,0.0)).xy;
#endif
#endif
#include<clipPlaneVertex>
#include<logDepthVertex>
}
`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["outlineVertexShaderWGSL",0,{name:r,shader:i}])},266104,e=>{"use strict";var t=e.i(263537);let r="circleOfConfusionPixelShader",i=`uniform sampler2D depthSampler;varying vec2 vUV;
#ifndef COC_DEPTH_NOT_NORMALIZED
uniform vec2 cameraMinMaxZ;
#endif
uniform float focusDistance;uniform float cocPrecalculation;
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void)
{float depth=texture2D(depthSampler,vUV).r;
#define CUSTOM_COC_DEPTH
#ifdef COC_DEPTH_NOT_NORMALIZED
float pixelDistance=depth*1000.0;
#else
float pixelDistance=(cameraMinMaxZ.x+cameraMinMaxZ.y*depth)*1000.0; 
#endif
#define CUSTOM_COC_PIXELDISTANCE
float coc=abs(cocPrecalculation*((focusDistance-pixelDistance)/pixelDistance));coc=clamp(coc,0.0,1.0);gl_FragColor=vec4(coc,coc,coc,1.0);}
`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["circleOfConfusionPixelShader",0,{name:r,shader:i}])},907099,e=>{"use strict";var t=e.i(263537);e.i(261937),e.i(346145),e.i(141687);let r="depthPixelShader",i=`#ifdef ALPHATEST
varying vec2 vUV;uniform sampler2D diffuseSampler;
#endif
#include<clipPlaneFragmentDeclaration>
varying float vDepthMetric;
#ifdef PACKED
#include<packingFunctions>
#endif
#ifdef STORE_CAMERASPACE_Z
varying vec4 vViewPos;
#endif
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void)
{
#include<clipPlaneFragment>
#ifdef ALPHATEST
if (texture2D(diffuseSampler,vUV).a<0.4)
discard;
#endif
#ifdef STORE_CAMERASPACE_Z
#ifdef PACKED
gl_FragColor=pack(vViewPos.z);
#else
gl_FragColor=vec4(vViewPos.z,0.0,0.0,1.0);
#endif
#else
#ifdef NONLINEARDEPTH
#ifdef PACKED
gl_FragColor=pack(gl_FragCoord.z);
#else
gl_FragColor=vec4(gl_FragCoord.z,0.0,0.0,0.0);
#endif
#else
#ifdef PACKED
gl_FragColor=pack(vDepthMetric);
#else
gl_FragColor=vec4(vDepthMetric,0.0,0.0,1.0);
#endif
#endif
#endif
}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["depthPixelShader",0,{name:r,shader:i}])},566563,e=>{"use strict";var t=e.i(263537);let r="glowMapMergeVertexShader",i=`attribute vec2 position;varying vec2 vUV;const vec2 madd=vec2(0.5,0.5);
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
vUV=position*madd+madd;gl_Position=vec4(position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["glowMapMergeVertexShader",0,{name:r,shader:i}])},276374,e=>{"use strict";var t=e.i(263537);let r="meshUVSpaceRendererPixelShader",i=`precision highp float;varying vec2 vDecalTC;uniform sampler2D textureSampler;void main(void) {if (vDecalTC.x<0. || vDecalTC.x>1. || vDecalTC.y<0. || vDecalTC.y>1.) {discard;}
gl_FragColor=texture2D(textureSampler,vDecalTC);}
`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["meshUVSpaceRendererPixelShader",0,{name:r,shader:i}])},463195,e=>{"use strict";var t=e.i(263537);let r="meshUVSpaceRendererMaskerPixelShader",i=`varying vUV: vec2f;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {fragmentOutputs.color= vec4f(1.0,1.0,1.0,1.0);}
`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["meshUVSpaceRendererMaskerPixelShaderWGSL",0,{name:r,shader:i}])},680499,e=>{"use strict";var t=e.i(263537);let r="filterPixelShader",i=`varying vec2 vUV;uniform sampler2D textureSampler;uniform mat4 kernelMatrix;
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void)
{vec3 baseColor=texture2D(textureSampler,vUV).rgb;vec3 updatedColor=(kernelMatrix*vec4(baseColor,1.0)).rgb;gl_FragColor=vec4(updatedColor,1.0);}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["filterPixelShader",0,{name:r,shader:i}])},923802,e=>{"use strict";var t=e.i(263537);let r="convolutionPixelShader",i=`varying vec2 vUV;uniform sampler2D textureSampler;uniform vec2 screenSize;uniform float kernel[9];
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void)
{vec2 onePixel=vec2(1.0,1.0)/screenSize;vec4 colorSum =
texture2D(textureSampler,vUV+onePixel*vec2(-1,-1))*kernel[0] +
texture2D(textureSampler,vUV+onePixel*vec2(0,-1))*kernel[1] +
texture2D(textureSampler,vUV+onePixel*vec2(1,-1))*kernel[2] +
texture2D(textureSampler,vUV+onePixel*vec2(-1,0))*kernel[3] +
texture2D(textureSampler,vUV+onePixel*vec2(0,0))*kernel[4] +
texture2D(textureSampler,vUV+onePixel*vec2(1,0))*kernel[5] +
texture2D(textureSampler,vUV+onePixel*vec2(-1,1))*kernel[6] +
texture2D(textureSampler,vUV+onePixel*vec2(0,1))*kernel[7] +
texture2D(textureSampler,vUV+onePixel*vec2(1,1))*kernel[8];float kernelWeight =
kernel[0] +
kernel[1] +
kernel[2] +
kernel[3] +
kernel[4] +
kernel[5] +
kernel[6] +
kernel[7] +
kernel[8];if (kernelWeight<=0.0) {kernelWeight=1.0;}
gl_FragColor=vec4((colorSum/kernelWeight).rgb,1);}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["convolutionPixelShader",0,{name:r,shader:i}])},225893,e=>{"use strict";var t=e.i(263537);let r="taaPixelShader",i=`varying vUV: vec2f;var textureSampler: texture_2d<f32>;var historySampler: texture_2d<f32>;
#ifdef TAA_REPROJECT_HISTORY
var historySamplerSampler: sampler;var velocitySampler: texture_2d<f32>;
#endif
uniform factor: f32;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {let pos=vec2i(fragmentInputs.position.xy);let c=textureLoad(textureSampler,pos,0);
#ifdef TAA_REPROJECT_HISTORY
let v=textureLoad(velocitySampler,pos,0);var h=textureSample(historySampler,historySamplerSampler,input.vUV+v.xy);
#else
var h=textureLoad(historySampler,pos,0);
#endif
#ifdef TAA_CLAMP_HISTORY
var cmin=vec4f(1);var cmax=vec4f(0);for (var x=-1; x<=1; x+=1) {for (var y=-1; y<=1; y+=1) {let c=textureLoad(textureSampler,pos+vec2i(x,y),0);cmin=min(cmin,c);cmax=max(cmax,c);}}
h=clamp(h,cmin,cmax);
#endif
fragmentOutputs.color= mix(h,c,uniforms.factor);}
`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["taaPixelShaderWGSL",0,{name:r,shader:i}])},259652,e=>{"use strict";var t=e.i(263537);e.i(755704),e.i(562396),e.i(212954),e.i(922446);let r="colorPixelShader",i=`#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
#define VERTEXCOLOR
varying vColor: vec4f;
#else
uniform color: vec4f;
#endif
#include<clipPlaneFragmentDeclaration>
#include<fogFragmentDeclaration>
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
#include<clipPlaneFragment>
#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
fragmentOutputs.color=input.vColor;
#else
fragmentOutputs.color=uniforms.color;
#endif
#include<fogFragment>(color,fragmentOutputs.color)
#define CUSTOM_FRAGMENT_MAIN_END
}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["colorPixelShaderWGSL",0,{name:r,shader:i}])},851332,e=>{"use strict";var t=e.i(263537);e.i(755704),e.i(357351),e.i(212954),e.i(476129);let r="outlinePixelShader",i=`uniform color: vec4f;
#ifdef ALPHATEST
varying vUV: vec2f;var diffuseSamplerSampler: sampler;var diffuseSampler: texture_2d<f32>;
#endif
#include<clipPlaneFragmentDeclaration>
#include<logDepthDeclaration>
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
#include<clipPlaneFragment>
#ifdef ALPHATEST
if (textureSample(diffuseSampler,diffuseSamplerSampler,fragmentInputs.vUV).a<0.4) {discard;}
#endif
#include<logDepthFragment>
fragmentOutputs.color=uniforms.color;
#define CUSTOM_FRAGMENT_MAIN_END
}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["outlinePixelShaderWGSL",0,{name:r,shader:i}])},877693,e=>{"use strict";var t=e.i(263537);e.i(624154),e.i(568039),e.i(298378),e.i(369136),e.i(182478),e.i(880779),e.i(127010),e.i(675406),e.i(610460),e.i(587630),e.i(761523),e.i(479126),e.i(781801),e.i(94556);let r="outlineVertexShader",i=`attribute vec3 position;attribute vec3 normal;
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]
#include<clipPlaneVertexDeclaration>
uniform float offset;
#include<instancesDeclaration>
uniform mat4 viewProjection;
#ifdef ALPHATEST
varying vec2 vUV;uniform mat4 diffuseMatrix;
#ifdef UV1
attribute vec2 uv;
#endif
#ifdef UV2
attribute vec2 uv2;
#endif
#endif
#include<logDepthDeclaration>
#define CUSTOM_VERTEX_DEFINITIONS
void main(void)
{vec3 positionUpdated=position;vec3 normalUpdated=normal;
#ifdef UV1
vec2 uvUpdated=uv;
#endif
#ifdef UV2
vec2 uv2Updated=uv2;
#endif
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
vec3 offsetPosition=positionUpdated+(normalUpdated*offset);
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
vec4 worldPos=finalWorld*vec4(offsetPosition,1.0);gl_Position=viewProjection*worldPos;
#ifdef ALPHATEST
#ifdef UV1
vUV=vec2(diffuseMatrix*vec4(uvUpdated,1.0,0.0));
#endif
#ifdef UV2
vUV=vec2(diffuseMatrix*vec4(uv2Updated,1.0,0.0));
#endif
#endif
#include<clipPlaneVertex>
#include<logDepthVertex>
}
`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["outlineVertexShader",0,{name:r,shader:i}])},750373,e=>{"use strict";var t=e.i(263537);let r="screenSpaceReflection2BlurPixelShader",i=`#if defined(WEBGL2) || defined(WEBGPU) || defined(NATIVE)
#define TEXTUREFUNC(s,c,lod) texture2DLodEXT(s,c,lod)
#else
#define TEXTUREFUNC(s,c,bias) texture2D(s,c,bias)
#endif
uniform sampler2D textureSampler;varying vec2 vUV;uniform vec2 texelOffsetScale;const float weights[8]=float[8] (0.071303,0.131514,0.189879,0.321392,0.452906, 0.584419,0.715932,0.847445);void processSample(vec2 uv,float i,vec2 stepSize,inout vec4 accumulator,inout float denominator)
{vec2 offsetUV=stepSize*i+uv;float coefficient=weights[int(2.0-abs(i))];accumulator+=TEXTUREFUNC(textureSampler,offsetUV,0.0)*coefficient;denominator+=coefficient;}
void main()
{vec4 colorFull=TEXTUREFUNC(textureSampler,vUV,0.0);if (dot(colorFull,vec4(1.0))==0.0) {gl_FragColor=colorFull;return;}
float blurRadius=colorFull.a*255.0; 
vec2 stepSize=texelOffsetScale.xy*blurRadius;vec4 accumulator=TEXTUREFUNC(textureSampler,vUV,0.0)*0.214607;float denominator=0.214607;processSample(vUV,1.0,stepSize,accumulator,denominator);processSample(vUV,1.0*0.2,stepSize,accumulator,denominator);processSample(vUV,1.0*0.4,stepSize,accumulator,denominator);processSample(vUV,1.0*0.6,stepSize,accumulator,denominator);processSample(vUV,1.0*0.8,stepSize,accumulator,denominator);processSample(vUV,1.0*1.2,stepSize,accumulator,denominator);processSample(vUV,1.0*1.4,stepSize,accumulator,denominator);processSample(vUV,1.0*1.6,stepSize,accumulator,denominator);processSample(vUV,1.0*1.8,stepSize,accumulator,denominator);processSample(vUV,1.0*2.0,stepSize,accumulator,denominator);processSample(vUV,-1.0,stepSize,accumulator,denominator);processSample(vUV,-1.0*0.2,stepSize,accumulator,denominator);processSample(vUV,-1.0*0.4,stepSize,accumulator,denominator);processSample(vUV,-1.0*0.6,stepSize,accumulator,denominator);processSample(vUV,-1.0*0.8,stepSize,accumulator,denominator);processSample(vUV,-1.0*1.2,stepSize,accumulator,denominator);processSample(vUV,-1.0*1.4,stepSize,accumulator,denominator);processSample(vUV,-1.0*1.6,stepSize,accumulator,denominator);processSample(vUV,-1.0*1.8,stepSize,accumulator,denominator);processSample(vUV,-1.0*2.0,stepSize,accumulator,denominator);gl_FragColor=vec4(accumulator.rgb/denominator,colorFull.a);}
`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["screenSpaceReflection2BlurPixelShader",0,{name:r,shader:i}])},529572,e=>{"use strict";var t=e.i(440163),r=e.i(916624),i=e.i(739973),a=e.i(774685);class o extends t.FlowGraphBlock{constructor(e={}){super(e),this.keyFrames=[];const t="string"==typeof e?.animationType?(0,r.getRichTypeByFlowGraphType)(e.animationType):(0,r.getRichTypeByAnimationType)(e?.animationType??0),i=e?.keyFramesCount??1,a=this.registerDataInput("duration_0",r.RichTypeNumber,0),o=this.registerDataInput("value_0",t);this.keyFrames.push({duration:a,value:o});for(let a=1;a<i+1;a++){const o=this.registerDataInput(`duration_${a}`,r.RichTypeNumber,a===i?e.duration:void 0),n=this.registerDataInput(`value_${a}`,t);this.keyFrames.push({duration:o,value:n})}this.initialValue=this.keyFrames[0].value,this.endValue=this.keyFrames[i].value,this.easingFunction=this.registerDataInput("easingFunction",r.RichTypeAny),this.animation=this.registerDataOutput("animation",r.RichTypeAny),this.propertyName=this.registerDataInput("propertyName",r.RichTypeString,e?.propertyName),this.customBuildAnimation=this.registerDataInput("customBuildAnimation",r.RichTypeAny)}_updateOutputs(e){let t=e._getGlobalContextVariable("interpolationAnimations",[]),r=this.propertyName.getValue(e),i=this.easingFunction.getValue(e),a=this._createAnimation(e,r,i);if(this.animation.setValue(a,e),Array.isArray(a))for(let e of a)t.push(e.uniqueId);else t.push(a.uniqueId);e._setGlobalContextVariable("interpolationAnimations",t)}_createAnimation(e,t,r){let a=this.initialValue.richType,o=[],n=this.initialValue.getValue(e)||a.defaultValue;o.push({frame:0,value:n});let s=this.config?.numberOfKeyFrames??1;for(let t=1;t<s+1;t++){let r=this.keyFrames[t].duration?.getValue(e),i=this.keyFrames[t].value?.getValue(e);t===s-1&&(i=i||a.defaultValue),void 0!==r&&i&&o.push({frame:60*r,value:i})}let l=this.customBuildAnimation.getValue(e);if(l)return l(null,null,e)(o,60,a.animationType,r);if("string"!=typeof t)return t.map(e=>{let t=i.Animation.CreateAnimation(e,a.animationType,60,r);return t.setKeys(o),t});{let e=i.Animation.CreateAnimation(t,a.animationType,60,r);return e.setKeys(o),[e]}}getClassName(){return"FlowGraphInterpolationBlock"}}(0,a.RegisterClass)("FlowGraphInterpolationBlock",o),e.s(["FlowGraphInterpolationBlock",0,o])},48110,e=>{"use strict";var t=e.i(916624),r=e.i(774685),i=e.i(700183),a=e.i(706840);class o extends a.FlowGraphAsyncExecutionBlock{constructor(e){super(e),this.animationGroup=this.registerDataInput("animationGroup",t.RichTypeAny),this.stopAtFrame=this.registerDataInput("stopAtFrame",t.RichTypeNumber,-1)}_preparePendingTasks(e){let t=this.animationGroup.getValue(e),r=this.stopAtFrame.getValue(e)??-1,i=e._getGlobalContextVariable("pendingStopAnimations",[]);i.push({uniqueId:t.uniqueId,stopAtFrame:r}),e._setGlobalContextVariable("pendingStopAnimations",i)}_cancelPendingTasks(e){let t=this.animationGroup.getValue(e),r=e._getGlobalContextVariable("pendingStopAnimations",[]);for(let i=0;i<r.length;i++)if(r[i].uniqueId===t.uniqueId){r.splice(i,1),e._setGlobalContextVariable("pendingStopAnimations",r);break}}_execute(e){let t=this.animationGroup.getValue(e),r=this.stopAtFrame.getValue(e)??-1;return t?isNaN(r)?this._reportError(e,"Invalid stop time."):void(r>0?this._startPendingTasks(e):this._stopAnimation(t,e),this.out._activateSignal(e)):(i.Logger.Warn("No animation group provided to stop."),this._reportError(e,"No animation group provided to stop."))}_executeOnTick(e){let t=this.animationGroup.getValue(e),r=e._getGlobalContextVariable("pendingStopAnimations",[]);for(let i=0;i<r.length;i++)if(r[i].uniqueId===t.uniqueId&&t.getCurrentFrame()>=r[i].stopAtFrame){this._stopAnimation(t,e),r.splice(i,1),e._setGlobalContextVariable("pendingStopAnimations",r),this.done._activateSignal(e),e._removePendingBlock(this);break}}getClassName(){return"FlowGraphStopAnimationBlock"}_stopAnimation(e,t){let r=t._getGlobalContextVariable("currentlyRunningAnimationGroups",[]),i=r.indexOf(e.uniqueId);-1!==i&&(e.stop(),r.splice(i,1),t._setGlobalContextVariable("currentlyRunningAnimationGroups",r))}}(0,r.RegisterClass)("FlowGraphStopAnimationBlock",o),e.s(["FlowGraphStopAnimationBlock",0,o])},502332,e=>{"use strict";var t=e.i(263537);let r="minmaxReduxPixelShader",i=`varying vec2 vUV;uniform sampler2D textureSampler;
#if defined(INITIAL)
uniform vec2 texSize;void main(void)
{ivec2 coord=ivec2(vUV*(texSize-1.0));float f1=texelFetch(textureSampler,coord,0).r;float f2=texelFetch(textureSampler,coord+ivec2(1,0),0).r;float f3=texelFetch(textureSampler,coord+ivec2(1,1),0).r;float f4=texelFetch(textureSampler,coord+ivec2(0,1),0).r;
#ifdef DEPTH_REDUX
#ifdef VIEW_DEPTH
float minz=3.4e38;if (f1 != 0.0) { minz=f1; }
if (f2 != 0.0) { minz=min(minz,f2); }
if (f3 != 0.0) { minz=min(minz,f3); }
if (f4 != 0.0) { minz=min(minz,f4); }
float maxz=max(max(max(f1,f2),f3),f4);
#else
float minz=min(min(min(f1,f2),f3),f4);float maxz=max(max(max(sign(1.0-f1)*f1,sign(1.0-f2)*f2),sign(1.0-f3)*f3),sign(1.0-f4)*f4);
#endif
#else
float minz=min(min(min(f1,f2),f3),f4);float maxz=max(max(max(f1,f2),f3),f4);
#endif
glFragColor=vec4(minz,maxz,0.,0.);}
#elif defined(MAIN)
uniform vec2 texSize;void main(void)
{ivec2 coord=ivec2(vUV*(texSize-1.0));vec2 f1=texelFetch(textureSampler,coord,0).rg;vec2 f2=texelFetch(textureSampler,coord+ivec2(1,0),0).rg;vec2 f3=texelFetch(textureSampler,coord+ivec2(1,1),0).rg;vec2 f4=texelFetch(textureSampler,coord+ivec2(0,1),0).rg;float minz=min(min(min(f1.x,f2.x),f3.x),f4.x);float maxz=max(max(max(f1.y,f2.y),f3.y),f4.y);glFragColor=vec4(minz,maxz,0.,0.);}
#elif defined(ONEBEFORELAST)
uniform ivec2 texSize;void main(void)
{ivec2 coord=ivec2(vUV*vec2(texSize-1));vec2 f1=texelFetch(textureSampler,coord % texSize,0).rg;vec2 f2=texelFetch(textureSampler,(coord+ivec2(1,0)) % texSize,0).rg;vec2 f3=texelFetch(textureSampler,(coord+ivec2(1,1)) % texSize,0).rg;vec2 f4=texelFetch(textureSampler,(coord+ivec2(0,1)) % texSize,0).rg;float minz=min(min(min(f1.x,f2.x),f3.x),f4.x);float maxz=max(max(max(f1.y,f2.y),f3.y),f4.y);glFragColor=vec4(minz,maxz,0.,0.);}
#elif defined(LAST)
void main(void)
{glFragColor=vec4(0.);if (true) { 
discard;}}
#endif
`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["minmaxReduxPixelShader",0,{name:r,shader:i}])},948699,e=>{"use strict";var t=e.i(263537);let r="bilateralBlurQualityPixelShader",i=`var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;var normalSamplerSampler: sampler;var normalSampler: texture_2d<f32>;var depthSamplerSampler: sampler;var depthSampler: texture_2d<f32>;uniform filterSize: i32;uniform blurDir: vec2f;uniform depthThreshold: f32;uniform normalThreshold: f32;varying vUV: vec2f;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var color: vec3f=textureSampleLevel(textureSampler,textureSamplerSampler,input.vUV,0.).rgb;var depth: f32=textureSampleLevel(depthSampler,depthSamplerSampler,input.vUV,0.).x;if (depth>=1e6 || depth<=0.) {fragmentOutputs.color= vec4f(color,1.);return fragmentOutputs;}
var normal: vec3f=textureSampleLevel(normalSampler,normalSamplerSampler,input.vUV,0.).rgb;
#ifdef DECODE_NORMAL
normal=normal*2.0-1.0;
#endif
var sigma: f32= f32(uniforms.filterSize);var two_sigma2: f32=2.0*sigma*sigma;var sigmaDepth: f32=uniforms.depthThreshold;var two_sigmaDepth2: f32=2.0*sigmaDepth*sigmaDepth;var sigmaNormal: f32=uniforms.normalThreshold;var two_sigmaNormal2: f32=2.0*sigmaNormal*sigmaNormal;var sum: vec3f= vec3f(0.);var wsum: f32=0.;for (var x: i32=-uniforms.filterSize; x<=uniforms.filterSize; x++) {for (var y: i32=-uniforms.filterSize; y<=uniforms.filterSize; y++) {var coords: vec2f= vec2f(f32(x),f32(y))*uniforms.blurDir;var sampleColor: vec3f=textureSampleLevel(textureSampler,textureSamplerSampler,input.vUV+coords,0.).rgb;var sampleDepth: f32=textureSampleLevel(depthSampler,depthSamplerSampler,input.vUV+coords,0.).r;var sampleNormal: vec3f=textureSampleLevel(normalSampler,normalSamplerSampler,input.vUV+coords,0.).rgb;
#ifdef DECODE_NORMAL
sampleNormal=sampleNormal*2.0-1.0;
#endif
var r: f32=dot(coords,coords);var w: f32=exp(-r/two_sigma2);var rDepth: f32=sampleDepth-depth;var wd: f32=exp(-rDepth*rDepth/two_sigmaDepth2);var rNormal: f32=abs(sampleNormal.x-normal.x)+abs(sampleNormal.y-normal.y)+abs(sampleNormal.z-normal.z);var wn: f32=exp(-rNormal*rNormal/two_sigmaNormal2);sum+=sampleColor*w*wd*wn;wsum+=w*wd*wn;}}
fragmentOutputs.color= vec4f(sum/wsum,1.);}
`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["bilateralBlurQualityPixelShaderWGSL",0,{name:r,shader:i}])},180477,e=>{"use strict";var t=e.i(263537);let r="passCubePixelShader",i=`varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_cube<f32>;
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var uv: vec2f=input.vUV*2.0-1.0;
#ifdef POSITIVEX
fragmentOutputs.color=textureSample(textureSampler,textureSamplerSampler,vec3f(1.001,uv.y,uv.x));
#endif
#ifdef NEGATIVEX
fragmentOutputs.color=textureSample(textureSampler,textureSamplerSampler,vec3f(-1.001,uv.y,uv.x));
#endif
#ifdef POSITIVEY
fragmentOutputs.color=textureSample(textureSampler,textureSamplerSampler,vec3f(uv.y,1.001,uv.x));
#endif
#ifdef NEGATIVEY
fragmentOutputs.color=textureSample(textureSampler,textureSamplerSampler,vec3f(uv.y,-1.001,uv.x));
#endif
#ifdef POSITIVEZ
fragmentOutputs.color=textureSample(textureSampler,textureSamplerSampler,vec3f(uv,1.001));
#endif
#ifdef NEGATIVEZ
fragmentOutputs.color=textureSample(textureSampler,textureSamplerSampler,vec3f(uv,-1.001));
#endif
}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["passCubePixelShaderWGSL",0,{name:r,shader:i}])},773549,e=>{"use strict";var t=e.i(263537);let r="colorCorrectionPixelShader",i=`uniform sampler2D textureSampler; 
uniform sampler2D colorTable; 
varying vec2 vUV;const float SLICE_COUNT=16.0; 
#define inline
vec4 sampleAs3DTexture(sampler2D textureSampler,vec3 uv,float width) {float sliceSize=1.0/width; 
float slicePixelSize=sliceSize/width; 
float sliceInnerSize=slicePixelSize*(width-1.0); 
float zSlice0=min(floor(uv.z*width),width-1.0);float zSlice1=min(zSlice0+1.0,width-1.0);float xOffset=slicePixelSize*0.5+uv.x*sliceInnerSize;float s0=xOffset+(zSlice0*sliceSize);float s1=xOffset+(zSlice1*sliceSize);vec4 slice0Color=texture2D(textureSampler,vec2(s0,uv.y));vec4 slice1Color=texture2D(textureSampler,vec2(s1,uv.y));float zOffset=mod(uv.z*width,1.0);vec4 result=mix(slice0Color,slice1Color,zOffset);return result;}
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void)
{vec4 screen_color=texture2D(textureSampler,vUV);gl_FragColor=sampleAs3DTexture(colorTable,screen_color.rgb,SLICE_COUNT);}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["colorCorrectionPixelShader",0,{name:r,shader:i}])},260617,e=>{"use strict";var t=e.i(263537);e.i(201632);let r="layerPixelShader",i=`varying vec2 vUV;uniform sampler2D textureSampler;uniform vec4 color;
#include<helperFunctions>
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
vec4 baseColor=texture2D(textureSampler,vUV);
#if defined(CONVERT_TO_GAMMA)
baseColor.rgb=toGammaSpace(baseColor.rgb);
#elif defined(CONVERT_TO_LINEAR)
baseColor.rgb=toLinearSpace(baseColor.rgb);
#endif
#ifdef ALPHATEST
if (baseColor.a<0.4)
discard;
#endif
gl_FragColor=baseColor*color;
#define CUSTOM_FRAGMENT_MAIN_END
}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["layerPixelShader",0,{name:r,shader:i}])},797017,e=>{"use strict";var t=e.i(263537);let r="fluidRenderingParticleDepthVertexShader",i=`attribute vec3 position;attribute vec2 offset;uniform mat4 view;uniform mat4 projection;uniform vec2 size;varying vec2 uv;varying vec3 viewPos;varying float sphereRadius;
#ifdef FLUIDRENDERING_VELOCITY
attribute vec3 velocity;varying float velocityNorm;
#endif
void main(void) {vec3 cornerPos;cornerPos.xy=vec2(offset.x-0.5,offset.y-0.5)*size;cornerPos.z=0.0;viewPos=(view*vec4(position,1.0)).xyz;gl_Position=projection*vec4(viewPos+cornerPos,1.0);uv=offset;sphereRadius=size.x/2.0;
#ifdef FLUIDRENDERING_VELOCITY
velocityNorm=length(velocity);
#endif
}
`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["fluidRenderingParticleDepthVertexShader",0,{name:r,shader:i}])},524773,944857,e=>{"use strict";var t,r,i=e.i(706840),a=e.i(916624),o=e.i(814624);(t=r||(r={}))[t.INIT=0]="INIT",t[t.STARTED=1]="STARTED",t[t.ENDED=2]="ENDED";class n{constructor(e){this.onEachCountObservable=new o.Observable,this.onTimerAbortedObservable=new o.Observable,this.onTimerEndedObservable=new o.Observable,this.onStateChangedObservable=new o.Observable,this._observer=null,this._breakOnNextTick=!1,this._tick=e=>{let t=Date.now();this._timer=t-this._startTime;let r={startTime:this._startTime,currentTime:t,deltaTime:this._timer,completeRate:this._timer/this._timeToEnd,payload:e},i=this._breakOnNextTick||this._breakCondition(r);i||this._timer>=this._timeToEnd?this._stop(r,i):this.onEachCountObservable.notifyObservers(r)},this._setState(0),this._contextObservable=e.contextObservable,this._observableParameters=e.observableParameters??{},this._breakCondition=e.breakCondition??(()=>!1),this._timeToEnd=e.timeout,e.onEnded&&this.onTimerEndedObservable.add(e.onEnded),e.onTick&&this.onEachCountObservable.add(e.onTick),e.onAborted&&this.onTimerAbortedObservable.add(e.onAborted)}set breakCondition(e){this._breakCondition=e}clearObservables(){this.onEachCountObservable.clear(),this.onTimerAbortedObservable.clear(),this.onTimerEndedObservable.clear(),this.onStateChangedObservable.clear()}start(e=this._timeToEnd){if(1===this._state)throw Error("Timer already started. Please stop it before starting again");this._timeToEnd=e,this._startTime=Date.now(),this._timer=0,this._observer=this._contextObservable.add(this._tick,this._observableParameters.mask,this._observableParameters.insertFirst,this._observableParameters.scope),this._setState(1)}stop(){1===this._state&&(this._breakOnNextTick=!0)}dispose(){this._observer&&this._contextObservable.remove(this._observer),this.clearObservables()}_setState(e){this._state=e,this.onStateChangedObservable.notifyObservers(this._state)}_stop(e,t=!1){this._contextObservable.remove(this._observer),this._setState(2),t?this.onTimerAbortedObservable.notifyObservers(e):this.onTimerEndedObservable.notifyObservers(e)}}e.s(["AdvancedTimer",0,n,"setAndStartTimer",0,function(e){let t=0,r=Date.now();e.observableParameters=e.observableParameters??{};let i=e.contextObservable.add(a=>{let o=Date.now();t=o-r;let n={startTime:r,currentTime:o,deltaTime:t,completeRate:t/e.timeout,payload:a};if(e.breakCondition&&e.breakCondition(n)){e.contextObservable.remove(i),e.onAborted&&e.onAborted(n);return}if(t>=e.timeout){e.contextObservable.remove(i),e.onEnded&&e.onEnded(n);return}e.onTick&&e.onTick(n)},e.observableParameters.mask,e.observableParameters.insertFirst,e.observableParameters.scope);return i}],944857);var s=e.i(700183),l=e.i(774685),f=e.i(774100);class c extends i.FlowGraphAsyncExecutionBlock{constructor(e){super(e),this.cancel=this._registerSignalInput("cancel"),this.duration=this.registerDataInput("duration",a.RichTypeNumber),this.lastDelayIndex=this.registerDataOutput("lastDelayIndex",a.RichTypeFlowGraphInteger,new f.FlowGraphInteger(-1))}_preparePendingTasks(e){let t=this.duration.getValue(e);if(t<0||isNaN(t)||!isFinite(t))return this._reportError(e,"Invalid duration in SetDelay block");if(e._getGlobalContextVariable("activeDelays",0)>=c.MaxParallelDelayCount)return this._reportError(e,"Max parallel delays reached");let r=e._getGlobalContextVariable("lastDelayIndex",-1),i=e._getExecutionVariable(this,"pendingDelays",[]),a=new n({timeout:1e3*t,contextObservable:e.configuration.scene.onBeforeRenderObservable,onEnded:()=>this._onEnded(a,e)});a.start();let o=r+1;this.lastDelayIndex.setValue(new f.FlowGraphInteger(o),e),e._setGlobalContextVariable("lastDelayIndex",o),i[o]=a,e._setExecutionVariable(this,"pendingDelays",i),this._updateGlobalTimers(e)}_cancelPendingTasks(e){for(let t of e._getExecutionVariable(this,"pendingDelays",[]))t?.dispose();e._deleteExecutionVariable(this,"pendingDelays"),this.lastDelayIndex.setValue(new f.FlowGraphInteger(-1),e),this._updateGlobalTimers(e)}_execute(e,t){t===this.cancel?this._cancelPendingTasks(e):(this._preparePendingTasks(e),this.out._activateSignal(e))}getClassName(){return"FlowGraphSetDelayBlock"}_onEnded(e,t){let r=t._getExecutionVariable(this,"pendingDelays",[]),i=r.indexOf(e);-1!==i?r.splice(i,1):s.Logger.Warn("FlowGraphTimerBlock: Timer ended but was not found in the running timers list"),t._removePendingBlock(this),this.done._activateSignal(t),this._updateGlobalTimers(t)}_updateGlobalTimers(e){let t=e._getExecutionVariable(this,"pendingDelays",[]),r=e._getGlobalContextVariable("pendingDelays",[]);for(let e=0;e<t.length;e++){if(!t[e])continue;let i=t[e];r[e]&&r[e]!==i?s.Logger.Warn("FlowGraphTimerBlock: Timer ended but was not found in the running timers list"):r[e]=i}e._setGlobalContextVariable("pendingDelays",r)}}c.MaxParallelDelayCount=100,(0,l.RegisterClass)("FlowGraphSetDelayBlock",c),e.s(["FlowGraphSetDelayBlock",0,c],524773)},170833,e=>{"use strict";var t=e.i(263537);e.i(755704),e.i(766397),e.i(769226),e.i(738124),e.i(892118),e.i(243400),e.i(590030),e.i(916838),e.i(972036),e.i(216596),e.i(802378),e.i(935500),e.i(339586),e.i(212954),e.i(588404),e.i(587845),e.i(302887);let r="geometryPixelShader",i=`#ifdef BUMP
varying vWorldView0: vec4f;varying vWorldView1: vec4f;varying vWorldView2: vec4f;varying vWorldView3: vec4f;varying vNormalW: vec3f;
#else
varying vNormalV: vec3f;
#endif
varying vViewPos: vec4f;
#if defined(POSITION) || defined(BUMP) || defined(IRRADIANCE)
varying vPositionW: vec3f;
#endif
#if defined(VELOCITY) || defined(VELOCITY_LINEAR)
varying vCurrentPosition: vec4f;varying vPreviousPosition: vec4f;
#endif
#ifdef NEED_UV
varying vUV: vec2f;
#endif
#ifdef BUMP
uniform vBumpInfos: vec3f;uniform vTangentSpaceParams: vec2f;
#endif
#if defined(REFLECTIVITY)
#if defined(ORMTEXTURE) || defined(SPECULARGLOSSINESSTEXTURE) || defined(REFLECTIVITYTEXTURE)
var reflectivitySamplerSampler: sampler;var reflectivitySampler: texture_2d<f32>;varying vReflectivityUV: vec2f;
#else
#ifdef METALLIC_TEXTURE
var metallicSamplerSampler: sampler;var metallicSampler: texture_2d<f32>;varying vMetallicUV: vec2f;
#endif
#ifdef ROUGHNESS_TEXTURE
var roughnessSamplerSampler: sampler;var roughnessSampler: texture_2d<f32>;varying vRoughnessUV: vec2f;
#endif
#endif
#ifdef ALBEDOTEXTURE
varying vAlbedoUV: vec2f;var albedoSamplerSampler: sampler;var albedoSampler: texture_2d<f32>;
#endif
#ifdef REFLECTIVITYCOLOR
uniform reflectivityColor: vec3f;
#endif
#ifdef ALBEDOCOLOR
uniform albedoColor: vec3f;
#endif
#ifdef METALLIC
uniform metallic: f32;
#endif
#if defined(ROUGHNESS) || defined(GLOSSINESS)
uniform glossiness: f32;
#endif
#endif
#if defined(ALPHATEST) && defined(NEED_UV)
var diffuseSamplerSampler: sampler;var diffuseSampler: texture_2d<f32>;
#endif
#include<clipPlaneFragmentDeclaration>
#include<bumpFragmentMainFunctions>
#include<bumpFragmentFunctions>
#include<helperFunctions>
#ifdef IRRADIANCE
#include<pbrFragmentReflectionDeclaration>
#ifdef REFLECTION
#ifdef USEIRRADIANCEMAP
#include<sceneUboDeclaration>
uniform reflectionMatrix: mat4x4f;uniform vReflectionInfos: vec2f;uniform vReflectionDominantDirection: vec3f;
#include<pbrBRDFFunctions>
#include<openpbrDielectricReflectance>
#include<pbrIBLFunctions>
#include<reflectionFunction>
#include<openpbrGeometryInfo>
#include<openpbrIblFunctions>
#elif defined(USESPHERICALFROMREFLECTIONMAP)
varying vEnvironmentIrradiance: vec3f;
#endif
#ifdef IBL_SHADOW_TEXTURE
var iblShadowSampler: texture_2d<f32>;var iblShadowSamplerSampler: sampler;uniform shadowTextureSize: vec2f;
#endif
#ifdef IRRADIANCE_SCATTER_MASK
uniform vSubsurfaceWeight: f32;
#include<samplerFragmentDeclaration>(_DEFINENAME_,SUBSURFACE_WEIGHT,_VARYINGNAME_,SubsurfaceWeight,_SAMPLERNAME_,subsurfaceWeight)
uniform vSubsurfaceScatterAnisotropy: f32;uniform vTransmissionWeight: f32;
#include<samplerFragmentDeclaration>(_DEFINENAME_,TRANSMISSION_WEIGHT,_VARYINGNAME_,TransmissionWeight,_SAMPLERNAME_,transmissionWeight)
uniform vTransmissionScatterAnisotropy: f32;
#endif
#endif
#endif
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {
#include<clipPlaneFragment>
#ifdef ALPHATEST
if (textureSample(diffuseSampler,diffuseSamplerSampler,input.vUV).a<0.4) {discard;}
#endif
var normalOutput: vec3f;
#ifdef BUMP
var normalW: vec3f=normalize(input.vNormalW);
#include<bumpFragment>
#ifdef NORMAL_WORLDSPACE
normalOutput=normalW;
#else
normalOutput=normalize( (mat4x4f(input.vWorldView0,input.vWorldView1,input.vWorldView2,input.vWorldView3)* vec4f(normalW,0.0)).xyz);
#endif
#elif defined(HAS_NORMAL_ATTRIBUTE)
normalOutput=normalize(input.vNormalV);
#elif defined(POSITION)
normalOutput=normalize(-cross(dpdx(input.vPositionW),dpdy(input.vPositionW)));
#endif
#ifdef ENCODE_NORMAL
normalOutput=normalOutput*0.5+0.5;
#endif
var fragData: array<vec4<f32>,SCENE_MRT_COUNT>;
#ifdef DEPTH
fragData[DEPTH_INDEX]=vec4f(input.vViewPos.z/input.vViewPos.w,0.0,0.0,1.0);
#endif
#ifdef NORMAL
fragData[NORMAL_INDEX]=vec4f(normalOutput,1.0);
#endif
#ifdef SCREENSPACE_DEPTH
fragData[SCREENSPACE_DEPTH_INDEX]=vec4f(fragmentInputs.position.z,0.0,0.0,1.0);
#endif
#ifdef POSITION
fragData[POSITION_INDEX]= vec4f(input.vPositionW,1.0);
#endif
#ifdef VELOCITY
var a: vec2f=(input.vCurrentPosition.xy/input.vCurrentPosition.w)*0.5+0.5;var b: vec2f=(input.vPreviousPosition.xy/input.vPreviousPosition.w)*0.5+0.5;var velocity: vec2f=abs(a-b);velocity= vec2f(pow(velocity.x,1.0/3.0),pow(velocity.y,1.0/3.0))*sign(a-b)*0.5+0.5;fragData[VELOCITY_INDEX]= vec4f(velocity,0.0,1.0);
#endif
#ifdef VELOCITY_LINEAR
var velocity : vec2f=vec2f(0.5)*((input.vPreviousPosition.xy /
input.vPreviousPosition.w) -
(input.vCurrentPosition.xy /
input.vCurrentPosition.w));fragData[VELOCITY_LINEAR_INDEX]=vec4f(velocity,0.0,1.0);
#endif
#ifdef REFLECTIVITY
var reflectivity: vec4f= vec4f(0.0,0.0,0.0,1.0);
#ifdef METALLICWORKFLOW
var metal: f32=1.0;var roughness: f32=1.0;
#ifdef ORMTEXTURE
metal*=textureSample(reflectivitySampler,reflectivitySamplerSampler,input.vReflectivityUV).b;roughness*=textureSample(reflectivitySampler,reflectivitySamplerSampler,input.vReflectivityUV).g;
#else
#ifdef METALLIC_TEXTURE
metal*=textureSample(metallicSampler,metallicSamplerSampler,input.vMetallicUV).r;
#endif
#ifdef ROUGHNESS_TEXTURE
roughness*=textureSample(roughnessSampler,roughnessSamplerSampler,input.vRoughnessUV).r;
#endif
#endif
#ifdef METALLIC
metal*=uniforms.metallic;
#endif
#ifdef ROUGHNESS
roughness*=(1.0-uniforms.glossiness); 
#endif
reflectivity=vec4f(reflectivity.rgb,reflectivity.a-roughness);var color: vec3f= vec3f(1.0);
#ifdef ALBEDOTEXTURE
color=textureSample(albedoSampler,albedoSamplerSampler,input.vAlbedoUV).rgb;
#ifdef GAMMAALBEDO
color=toLinearSpaceVec4(color);
#endif
#endif
#ifdef ALBEDOCOLOR
color*=uniforms.albedoColor.xyz;
#endif
reflectivity=vec4f(mix( vec3f(0.04),color,metal),reflectivity.a);
#else
#if defined(SPECULARGLOSSINESSTEXTURE) || defined(REFLECTIVITYTEXTURE)
reflectivity=textureSample(reflectivitySampler,reflectivitySamplerSampler,input.vReflectivityUV);
#ifdef GAMMAREFLECTIVITYTEXTURE
reflectivity=vec4f(toLinearSpaceVec3(reflectivity.rgb),reflectivity.a);
#endif
#else 
#ifdef REFLECTIVITYCOLOR
reflectivity=vec4f(toLinearSpaceVec3(uniforms.reflectivityColor.xyz),1.0);
#endif
#endif
#ifdef GLOSSINESSS
reflectivity=vec4f(reflectivity.rgb,reflectivity.a*glossiness); 
#endif
#endif
fragData[REFLECTIVITY_INDEX]=reflectivity;
#endif
#ifdef IRRADIANCE
var irradiance: vec3f=vec3f(0.0);var irradiance_alpha: f32=1.0;
#ifdef REFLECTION
#ifdef IRRADIANCE_SCATTER_MASK
var vSubsurfaceColor: vec3f=vec3f(1.0);var vSubsurfaceRadius: f32=0.0;var vSubsurfaceRadiusScale: vec3f=vec3f(1.0);
#include<openpbrSubsurfaceLayerData>(uniforms.vSubsurfaceColor,vSubsurfaceColor,uniforms.vSubsurfaceRadius,vSubsurfaceRadius,uniforms.vSubsurfaceRadiusScale,vSubsurfaceRadiusScale)
var vTransmissionDepth: f32=1.0;var vTransmissionColor: vec3f=vec3f(1.0);var vTransmissionScatter: vec3f=vec3f(0.0);var vTransmissionDispersionScale: f32=0.0;var vTransmissionDispersionAbbeNumber: f32=0.0;
#include<openpbrTransmissionLayerData>(uniforms.vTransmissionDispersionScale,vTransmissionDispersionScale,uniforms.vTransmissionDispersionAbbeNumber,vTransmissionDispersionAbbeNumber,uniforms.vTransmissionColor,vTransmissionColor,uniforms.vTransmissionDepth,vTransmissionDepth,uniforms.vTransmissionScatter\\.,vTransmissionScatter.)
#endif
#ifdef IBL_SHADOW_TEXTURE
#ifdef COLORED_IBL_SHADOWS
let iblShadowValue: vec3f=textureSample(iblShadowSampler,iblShadowSamplerSampler,fragmentInputs.position.xy/uniforms.shadowTextureSize).rgb;
#else
let iblShadowValue: vec3f=vec3f(textureSample(iblShadowSampler,iblShadowSamplerSampler,fragmentInputs.position.xy/uniforms.shadowTextureSize).r);
#endif
#endif
#if defined(USEIRRADIANCEMAP)
#ifdef IRRADIANCE_SCATTER_MASK
let bendAmount: f32=subsurface_weight*-min(subsurface_scatter_anisotropy,0.0);let mixedBendAmount: f32=mix(bendAmount,-min(transmission_scatter_anisotropy,0.0),transmission_weight);let viewVector: vec3f=normalize(scene.vEyePosition.xyz-input.vPositionW);let bentNormal: vec3f=mix(normalOutput,viewVector,mixedBendAmount*dot(normalOutput,viewVector));
#else
let bentNormal: vec3f=normalOutput;
#endif
irradiance=sampleIrradiance(
bentNormal
#if defined(NORMAL) && defined(USESPHERICALINVERTEX)
,input.vEnvironmentIrradiance
#endif
#if (defined(USESPHERICALFROMREFLECTIONMAP) && (!defined(NORMAL) || !defined(USESPHERICALINVERTEX))) || (defined(USEIRRADIANCEMAP) && defined(REFLECTIONMAP_3D))
,uniforms.reflectionMatrix
#endif
#ifdef USEIRRADIANCEMAP
,irradianceSampler
,irradianceSamplerSampler
#ifdef USE_IRRADIANCE_DOMINANT_DIRECTION
,uniforms.vReflectionDominantDirection
#endif
#endif
#ifdef REALTIME_FILTERING
,uniforms.vReflectionFilteringInfo
#ifdef IBL_CDF_FILTERING
,icdfSampler
,icdfSamplerSampler
#endif
#endif
,uniforms.vReflectionInfos
,input.vViewPos.xyz
,1.0
,vec3f(1.0)
);
#elif defined(USESPHERICALFROMREFLECTIONMAP)
irradiance=input.vEnvironmentIrradiance;
#endif
#ifdef IBL_SHADOW_TEXTURE
irradiance*=iblShadowValue;
#endif
#ifndef BUMP
let uvOffset: vec2f=vec2f(0.0);
#endif
#ifdef IRRADIANCE_SCATTER_MASK
irradiance_alpha=min(subsurface_weight+transmission_weight,1.0);
#endif
#endif
fragData[IRRADIANCE_INDEX]=vec4f(irradiance,irradiance_alpha);
#endif
#if SCENE_MRT_COUNT>0
fragmentOutputs.fragData0=fragData[0];
#endif
#if SCENE_MRT_COUNT>1
fragmentOutputs.fragData1=fragData[1];
#endif
#if SCENE_MRT_COUNT>2
fragmentOutputs.fragData2=fragData[2];
#endif
#if SCENE_MRT_COUNT>3
fragmentOutputs.fragData3=fragData[3];
#endif
#if SCENE_MRT_COUNT>4
fragmentOutputs.fragData4=fragData[4];
#endif
#if SCENE_MRT_COUNT>5
fragmentOutputs.fragData5=fragData[5];
#endif
#if SCENE_MRT_COUNT>6
fragmentOutputs.fragData6=fragData[6];
#endif
#if SCENE_MRT_COUNT>7
fragmentOutputs.fragData7=fragData[7];
#endif
}
`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["geometryPixelShaderWGSL",0,{name:r,shader:i}])},767786,e=>{"use strict";var t=e.i(868738),r=e.i(774685),i=e.i(916624);class a extends t.FlowGraphEventBlock{constructor(){super(),this.type="SceneBeforeRender",this.timeSinceStart=this.registerDataOutput("timeSinceStart",i.RichTypeNumber),this.deltaTime=this.registerDataOutput("deltaTime",i.RichTypeNumber)}_preparePendingTasks(e){}_executeEvent(e,t){return this.timeSinceStart.setValue(t.timeSinceStart,e),this.deltaTime.setValue(t.deltaTime,e),this._execute(e),!0}_cancelPendingTasks(e){}getClassName(){return"FlowGraphSceneTickEventBlock"}}(0,r.RegisterClass)("FlowGraphSceneTickEventBlock",a),e.s(["FlowGraphSceneTickEventBlock",0,a])},748582,e=>{"use strict";var t=e.i(263537);let r="fluidRenderingBilateralBlurPixelShader",i=`uniform sampler2D textureSampler;uniform int maxFilterSize;uniform vec2 blurDir;uniform float projectedParticleConstant;uniform float depthThreshold;varying vec2 vUV;void main(void) {float depth=textureLod(textureSampler,vUV,0.).x;if (depth>=1e6 || depth<=0.) {glFragColor=vec4(vec3(depth),1.);return;}
int filterSize=min(maxFilterSize,int(ceil(projectedParticleConstant/depth)));float sigma=float(filterSize)/3.0;float two_sigma2=2.0*sigma*sigma;float sigmaDepth=depthThreshold/3.0;float two_sigmaDepth2=2.0*sigmaDepth*sigmaDepth;float sum=0.;float wsum=0.;float sumVel=0.;for (int x=-filterSize; x<=filterSize; ++x) {vec2 coords=vec2(x);vec2 sampleDepthVel=textureLod(textureSampler,vUV+coords*blurDir,0.).rg;float r=dot(coords,coords);float w=exp(-r/two_sigma2);float rDepth=sampleDepthVel.r-depth;float wd=exp(-rDepth*rDepth/two_sigmaDepth2);sum+=sampleDepthVel.r*w*wd;sumVel+=sampleDepthVel.g*w*wd;wsum+=w*wd;}
glFragColor=vec4(sum/wsum,sumVel/wsum,0.,1.);}
`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["fluidRenderingBilateralBlurPixelShader",0,{name:r,shader:i}])},651746,e=>{"use strict";var t=e.i(263537);e.i(755704),e.i(357351),e.i(476129),e.i(212954);let r="linePixelShader",i=`#include<clipPlaneFragmentDeclaration>
uniform color: vec4f;
#include<logDepthDeclaration>
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
#include<logDepthFragment>
#include<clipPlaneFragment>
fragmentOutputs.color=uniforms.color;
#define CUSTOM_FRAGMENT_MAIN_END
}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["linePixelShaderWGSL",0,{name:r,shader:i}])},70567,e=>{"use strict";var t=e.i(263537);let r="glowMapMergePixelShader",i=`varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;
#ifdef EMISSIVE
var textureSampler2Sampler: sampler;var textureSampler2: texture_2d<f32>;
#endif
uniform offset: f32;
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
var baseColor: vec4f=textureSample(textureSampler,textureSamplerSampler,input.vUV);
#ifdef EMISSIVE
baseColor+=textureSample(textureSampler2,textureSampler2Sampler,input.vUV);baseColor*=uniforms.offset;
#else
baseColor=vec4f(baseColor.rgb,abs(uniforms.offset-baseColor.a));
#ifdef STROKE
var alpha: f32=smoothstep(.0,.1,baseColor.a);baseColor=vec4f(baseColor.rgb*alpha,alpha);
#endif
#endif
#if LDR
baseColor=clamp(baseColor,vec4f(0.),vec4f(1.0));
#endif
fragmentOutputs.color=baseColor;
#define CUSTOM_FRAGMENT_MAIN_END
}
`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["glowMapMergePixelShaderWGSL",0,{name:r,shader:i}])},847693,e=>{"use strict";var t=e.i(263537);e.i(261937),e.i(127010),e.i(190688),e.i(358759),e.i(313119);let r="gaussianSplattingFragmentDeclaration",i=`vec4 gaussianColor(vec4 inColor)
{float A=-dot(vPosition,vPosition);if (A<-4.0) discard;float B=exp(A)*inColor.a;
#include<logDepthFragment>
vec3 color=inColor.rgb;
#ifdef FOG
#include<fogFragment>
#endif
return vec4(color,B);}
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.i(141687);let a="gaussianSplattingPixelShader",o=`#include<clipPlaneFragmentDeclaration>
#include<logDepthDeclaration>
#include<fogFragmentDeclaration>
varying vec4 vColor;varying vec2 vPosition;
#define CUSTOM_FRAGMENT_DEFINITIONS
#include<gaussianSplattingFragmentDeclaration>
void main () {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
#include<clipPlaneFragment>
vec4 finalColor=gaussianColor(vColor);
#define CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR
gl_FragColor=finalColor;
#define CUSTOM_FRAGMENT_MAIN_END
}
`;t.ShaderStore.ShadersStore[a]||(t.ShaderStore.ShadersStore[a]=o),e.s(["gaussianSplattingPixelShader",0,{name:a,shader:o}],847693)},532866,e=>{"use strict";var t=e.i(263537);e.i(158271),e.i(357351),e.i(505913);let r="spritesVertexShader",i=`attribute position: vec4f;attribute options: vec2f;attribute offsets: vec2f;attribute inverts: vec2f;attribute cellInfo: vec4f;attribute color: vec4f;uniform view: mat4x4f;uniform projection: mat4x4f;varying vUV: vec2f;varying vColor: vec4f;
#include<fogVertexDeclaration>
#include<logDepthDeclaration>
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input : VertexInputs)->FragmentInputs {
#define CUSTOM_VERTEX_MAIN_BEGIN
var viewPos: vec3f=(uniforms.view* vec4f(vertexInputs.position.xyz,1.0)).xyz; 
var cornerPos: vec2f;var angle: f32=vertexInputs.position.w;var size: vec2f= vec2f(vertexInputs.options.x,vertexInputs.options.y);var offset: vec2f=vertexInputs.offsets.xy;cornerPos= vec2f(offset.x-0.5,offset.y -0.5)*size;var rotatedCorner: vec3f;rotatedCorner.x=cornerPos.x*cos(angle)-cornerPos.y*sin(angle);rotatedCorner.y=cornerPos.x*sin(angle)+cornerPos.y*cos(angle);rotatedCorner.z=0.;viewPos+=rotatedCorner;vertexOutputs.position=uniforms.projection*vec4f(viewPos,1.0); 
vertexOutputs.vColor=vertexInputs.color;var uvOffset: vec2f= vec2f(abs(offset.x-vertexInputs.inverts.x),abs(1.0-offset.y-vertexInputs.inverts.y));var uvPlace: vec2f=vertexInputs.cellInfo.xy;var uvSize: vec2f=vertexInputs.cellInfo.zw;vertexOutputs.vUV.x=uvPlace.x+uvSize.x*uvOffset.x;vertexOutputs.vUV.y=uvPlace.y+uvSize.y*uvOffset.y;
#ifdef FOG
vertexOutputs.vFogDistance=viewPos;
#endif
#include<logDepthVertex>
#define CUSTOM_VERTEX_MAIN_END
}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["spritesVertexShaderWGSL",0,{name:r,shader:i}])},66878,e=>{"use strict";var t=e.i(263537);e.i(186207);let r="iblVoxelGridPixelShader",i=`#extension GL_EXT_draw_buffers : require
precision highp float;varying vec3 vNormalizedPosition;
#include<mrtFragmentDeclaration>[MAX_DRAW_BUFFERS]
uniform float nearPlane;uniform float farPlane;uniform float stepSize;void main(void) {vec3 normPos=vNormalizedPosition.xyz;if (normPos.z<nearPlane || normPos.z>farPlane) {discard;}
glFragData[0]=normPos.z<nearPlane+stepSize ? vec4(1.0) : vec4(0.0);
#if MAX_DRAW_BUFFERS>1
glFragData[1]=normPos.z>=nearPlane+stepSize && normPos.z<nearPlane+2.0*stepSize ? vec4(1.0) : vec4(0.0);glFragData[2]=normPos.z>=nearPlane+2.0*stepSize && normPos.z<nearPlane+3.0*stepSize ? vec4(1.0) : vec4(0.0);glFragData[3]=normPos.z>=nearPlane+3.0*stepSize && normPos.z<nearPlane+4.0*stepSize ? vec4(1.0) : vec4(0.0);
#endif
#if MAX_DRAW_BUFFERS>4
glFragData[4]=normPos.z>=nearPlane+4.0*stepSize && normPos.z<nearPlane+5.0*stepSize ? vec4(1.0) : vec4(0.0);glFragData[5]=normPos.z>=nearPlane+5.0*stepSize && normPos.z<nearPlane+6.0*stepSize ? vec4(1.0) : vec4(0.0);glFragData[6]=normPos.z>=nearPlane+6.0*stepSize && normPos.z<nearPlane+7.0*stepSize ? vec4(1.0) : vec4(0.0);glFragData[7]=normPos.z>=nearPlane+7.0*stepSize && normPos.z<nearPlane+8.0*stepSize ? vec4(1.0) : vec4(0.0);
#endif
#if MAX_DRAW_BUFFERS>8
glFragData[8]=normPos.z>=nearPlane+8.0*stepSize && normPos.z<nearPlane+9.0*stepSize ? vec4(1.0) : vec4(0.0);
#endif
#if MAX_DRAW_BUFFERS>9
glFragData[9]=normPos.z>=nearPlane+9.0*stepSize && normPos.z<nearPlane+10.0*stepSize ? vec4(1.0) : vec4(0.0);
#endif
#if MAX_DRAW_BUFFERS>10
glFragData[10]=normPos.z>=nearPlane+10.0*stepSize && normPos.z<nearPlane+11.0*stepSize ? vec4(1.0) : vec4(0.0);
#endif
#if MAX_DRAW_BUFFERS>11
glFragData[11]=normPos.z>=nearPlane+11.0*stepSize && normPos.z<nearPlane+12.0*stepSize ? vec4(1.0) : vec4(0.0);
#endif
#if MAX_DRAW_BUFFERS>12
glFragData[12]=normPos.z>=nearPlane+12.0*stepSize && normPos.z<nearPlane+13.0*stepSize ? vec4(1.0) : vec4(0.0);
#endif
#if MAX_DRAW_BUFFERS>13
glFragData[13]=normPos.z>=nearPlane+13.0*stepSize && normPos.z<nearPlane+14.0*stepSize ? vec4(1.0) : vec4(0.0);
#endif
#if MAX_DRAW_BUFFERS>14
glFragData[14]=normPos.z>=nearPlane+14.0*stepSize && normPos.z<nearPlane+15.0*stepSize ? vec4(1.0) : vec4(0.0);
#endif
#if MAX_DRAW_BUFFERS>15
glFragData[15]=normPos.z>=nearPlane+15.0*stepSize && normPos.z<nearPlane+16.0*stepSize ? vec4(1.0) : vec4(0.0);
#endif
}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["iblVoxelGridPixelShader",0,{name:r,shader:i}])},782647,e=>{"use strict";var t=e.i(263537);let r="chromaticAberrationPixelShader",i=`varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;uniform chromatic_aberration: f32;uniform radialIntensity: f32;uniform direction: vec2f;uniform centerPosition: vec2f;uniform screen_width: f32;uniform screen_height: f32;
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var centered_screen_pos: vec2f= vec2f(input.vUV.x-uniforms.centerPosition.x,input.vUV.y-uniforms.centerPosition.y);var directionOfEffect: vec2f=uniforms.direction;if(directionOfEffect.x==0. && directionOfEffect.y==0.){directionOfEffect=normalize(centered_screen_pos);}
var radius2: f32=centered_screen_pos.x*centered_screen_pos.x
+ centered_screen_pos.y*centered_screen_pos.y;var radius: f32=sqrt(radius2);var ref_indices: vec3f= vec3f(-0.3,0.0,0.3);var ref_shiftX: f32=uniforms.chromatic_aberration*pow(radius,uniforms.radialIntensity)*directionOfEffect.x/uniforms.screen_width;var ref_shiftY: f32=uniforms.chromatic_aberration*pow(radius,uniforms.radialIntensity)*directionOfEffect.y/uniforms.screen_height;var ref_coords_r: vec2f=vec2f(input.vUV.x+ref_indices.r*ref_shiftX,input.vUV.y+ref_indices.r*ref_shiftY*0.5);var ref_coords_g: vec2f=vec2f(input.vUV.x+ref_indices.g*ref_shiftX,input.vUV.y+ref_indices.g*ref_shiftY*0.5);var ref_coords_b: vec2f=vec2f(input.vUV.x+ref_indices.b*ref_shiftX,input.vUV.y+ref_indices.b*ref_shiftY*0.5);var r=textureSample(textureSampler,textureSamplerSampler,ref_coords_r);var g=textureSample(textureSampler,textureSamplerSampler,ref_coords_g);var b=textureSample(textureSampler,textureSamplerSampler,ref_coords_b);var a=clamp(r.a+g.a+b.a,0.,1.);fragmentOutputs.color=vec4f(r.r,g.g,b.b,a);}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["chromaticAberrationPixelShaderWGSL",0,{name:r,shader:i}])},745273,e=>{"use strict";var t=e.i(263537);e.i(13486),e.i(349e3),e.i(243400),e.i(706568),e.i(357351),e.i(300889),e.i(84318),e.i(505913);let r="lineVertexShader",i=`#define ADDITIONAL_VERTEX_DECLARATION
#include<instancesDeclaration>
#include<clipPlaneVertexDeclaration>
#include<sceneUboDeclaration>
#include<meshUboDeclaration>
attribute position: vec3f;attribute normal: vec4f;uniform width: f32;uniform aspectRatio: f32;
#include<logDepthDeclaration>
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input : VertexInputs)->FragmentInputs {
#define CUSTOM_VERTEX_MAIN_BEGIN
#include<instancesVertex>
var worldViewProjection: mat4x4f=scene.viewProjection*finalWorld;var viewPosition: vec4f=worldViewProjection* vec4f(vertexInputs.position,1.0);var viewPositionNext: vec4f=worldViewProjection* vec4f(vertexInputs.normal.xyz,1.0);var currentScreen: vec2f=viewPosition.xy/viewPosition.w;var nextScreen: vec2f=viewPositionNext.xy/viewPositionNext.w;currentScreen=vec2f(currentScreen.x*uniforms.aspectRatio,currentScreen.y);nextScreen=vec2f(nextScreen.x*uniforms.aspectRatio,nextScreen.y);var dir: vec2f=normalize(nextScreen-currentScreen);var normalDir: vec2f= vec2f(-dir.y,dir.x);normalDir*=uniforms.width/2.0;normalDir=vec2f(normalDir.x/uniforms.aspectRatio,normalDir.y);var offset: vec4f= vec4f(normalDir*vertexInputs.normal.w,0.0,0.0);vertexOutputs.position=viewPosition+offset;
#if defined(CLIPPLANE) || defined(CLIPPLANE2) || defined(CLIPPLANE3) || defined(CLIPPLANE4) || defined(CLIPPLANE5) || defined(CLIPPLANE6)
var worldPos: vec4f=finalWorld*vec4f(vertexInputs.position,1.0);
#include<clipPlaneVertex>
#endif
#include<logDepthVertex>
#define CUSTOM_VERTEX_MAIN_END
}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["lineVertexShaderWGSL",0,{name:r,shader:i}])},253697,e=>{"use strict";var t=e.i(774685),r=e.i(353679),i=e.i(916624);class a extends r.FlowGraphExecutionBlockWithOutSignal{constructor(e){if(super(e),e.variables&&e.variable)throw Error("FlowGraphSetVariableBlock: variable and variables are both defined");if(e.variables)for(const t of e.variables)this.registerDataInput(t,i.RichTypeAny);else this.registerDataInput("value",i.RichTypeAny)}_execute(e,t){if(this.config?.variables)for(let t of this.config.variables)this._saveVariable(e,t);else this._saveVariable(e,this.config?.variable,"value");this.out._activateSignal(e)}_saveVariable(e,t,r){let i=e._getGlobalContextVariable("currentlyRunningAnimationGroups",[]);for(let r of i){let a=e.assetsContext.animationGroups.find(e=>e.uniqueId==r);if(a){for(let o of a.targetedAnimations)if(o.target===e&&o.animation.targetProperty===t){a.stop();let t=i.indexOf(r);t>-1&&i.splice(t,1),e._setGlobalContextVariable("currentlyRunningAnimationGroups",i);break}}}let a=this.getDataInput(r||t)?.getValue(e);e.setVariable(t,a)}getClassName(){return"FlowGraphSetVariableBlock"}serialize(e){super.serialize(e),e.config.variable=this.config?.variable}}(0,t.RegisterClass)("FlowGraphSetVariableBlock",a),e.s(["FlowGraphSetVariableBlock",0,a])},436916,e=>{"use strict";var t=e.i(263537);e.i(929870),e.i(314530),e.i(738124),e.i(407892),e.i(380244),e.i(13486),e.i(794415),e.i(865557),e.i(597792),e.i(553893),e.i(349e3),e.i(158271);let r="lightVxFragmentDeclaration",i=`#ifdef LIGHT{X}
uniform vLightData{X}: vec4f;uniform vLightDiffuse{X}: vec4f;
#ifdef SPECULARTERM
uniform vLightSpecular{X}: vec4f;
#else
var vLightSpecular{X}: vec4f= vec4f(0.);
#endif
#ifdef SHADOW{X}
#ifdef SHADOWCSM{X}
uniform lightMatrix{X}: mat4x4f[SHADOWCSMNUM_CASCADES{X}];varying var vPositionFromLight{X}: vec4f[SHADOWCSMNUM_CASCADES{X}];varying var vDepthMetric{X}: f32[SHADOWCSMNUM_CASCADES{X}];varying var vPositionFromCamera{X}: vec4f;
#elif defined(SHADOWCUBE{X})
#else
varying var vPositionFromLight{X}: vec4f;varying var vDepthMetric{X}: f32;uniform lightMatrix{X}: mat4x4f;
#endif
uniform shadowsInfo{X}: vec4f;uniform depthValues{X}: vec2f;
#endif
#ifdef SPOTLIGHT{X}
uniform vLightDirection{X}: vec4f;uniform vLightFalloff{X}: vec4f;
#elif defined(POINTLIGHT{X})
uniform vLightFalloff{X}: vec4f;
#elif defined(HEMILIGHT{X})
uniform vLightGround{X}: vec3f;
#endif
#if defined(AREALIGHT{X}) && defined(AREALIGHTUSED) && defined(AREALIGHTSUPPORTED)
uniform vLightWidth{X}: vec4f;uniform vLightHeight{X}: vec4f;
#endif
#endif
`;t.ShaderStore.IncludesShadersStoreWGSL[r]||(t.ShaderStore.IncludesShadersStoreWGSL[r]=i),e.i(557330),e.i(585817),e.i(945868),e.i(357351),e.i(465697),e.i(229624),e.i(988389),e.i(431235),e.i(300889),e.i(398879),e.i(92372),e.i(355157),e.i(838597),e.i(494148),e.i(874826),e.i(84318),e.i(492952),e.i(158752),e.i(556333),e.i(505913);let a="defaultVertexShader",o=`#include<defaultUboDeclaration>
#define CUSTOM_VERTEX_BEGIN
#ifndef USE_VERTEX_PULLING
attribute position: vec3f;
#ifdef NORMAL
attribute normal: vec3f;
#endif
#ifdef TANGENT
attribute tangent: vec4f;
#endif
#ifdef UV1
attribute uv: vec2f;
#endif
#include<uvAttributeDeclaration>[2..7]
#ifdef VERTEXCOLOR
attribute color: vec4f;
#endif
#endif
#include<helperFunctions>
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<instancesDeclaration>
#include<prePassVertexDeclaration>
#include<mainUVVaryingDeclaration>[1..7]
#include<samplerVertexDeclaration>(_DEFINENAME_,DIFFUSE,_VARYINGNAME_,Diffuse)
#include<samplerVertexDeclaration>(_DEFINENAME_,DETAIL,_VARYINGNAME_,Detail)
#include<samplerVertexDeclaration>(_DEFINENAME_,AMBIENT,_VARYINGNAME_,Ambient)
#include<samplerVertexDeclaration>(_DEFINENAME_,OPACITY,_VARYINGNAME_,Opacity)
#include<samplerVertexDeclaration>(_DEFINENAME_,EMISSIVE,_VARYINGNAME_,Emissive)
#include<samplerVertexDeclaration>(_DEFINENAME_,LIGHTMAP,_VARYINGNAME_,Lightmap)
#if defined(SPECULARTERM)
#include<samplerVertexDeclaration>(_DEFINENAME_,SPECULAR,_VARYINGNAME_,Specular)
#endif
#include<samplerVertexDeclaration>(_DEFINENAME_,BUMP,_VARYINGNAME_,Bump)
#include<samplerVertexDeclaration>(_DEFINENAME_,DECAL,_VARYINGNAME_,Decal)
varying vPositionW: vec3f;
#ifdef NORMAL
varying vNormalW: vec3f;
#endif
#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
varying vColor: vec4f;
#endif
#include<bumpVertexDeclaration>
#include<clipPlaneVertexDeclaration>
#include<fogVertexDeclaration>
#include<__decl__lightVxFragment>[0..maxSimultaneousLights]
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]
#ifdef REFLECTIONMAP_SKYBOX
varying vPositionUVW: vec3f;
#endif
#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)
varying vDirectionW: vec3f;
#endif
#if defined(CLUSTLIGHT_BATCH) && CLUSTLIGHT_BATCH>0
varying vViewDepth: f32;
#endif
#include<logDepthDeclaration>
#include<vertexPullingDeclaration>
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input : VertexInputs)->FragmentInputs {
#define CUSTOM_VERTEX_MAIN_BEGIN
#ifdef USE_VERTEX_PULLING
var positionUpdated: vec3f=vec3f(0.0);
#ifdef NORMAL
var normalUpdated: vec3f=vec3f(0.0);
#endif
#ifdef TANGENT
var tangentUpdated: vec4f=vec4f(0.0);
#endif
#ifdef UV1
var uvUpdated: vec2f=vec2f(0.0);
#endif
#ifdef UV2
var uv2Updated: vec2f=vec2f(0.0);
#endif
#ifdef VERTEXCOLOR
var colorUpdated: vec4f=vec4f(0.0);
#endif
#else
var positionUpdated: vec3f=vertexInputs.position;
#ifdef NORMAL
var normalUpdated: vec3f=vertexInputs.normal;
#endif
#ifdef TANGENT
var tangentUpdated: vec4f=vertexInputs.tangent;
#endif
#ifdef UV1
var uvUpdated: vec2f=vertexInputs.uv;
#endif
#ifdef UV2
var uv2Updated: vec2f=vertexInputs.uv2;
#endif
#ifdef VERTEXCOLOR
var colorUpdated: vec4f=vertexInputs.color;
#endif
#endif
#include<vertexPullingVertex>
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
#ifdef REFLECTIONMAP_SKYBOX
vertexOutputs.vPositionUVW=positionUpdated;
#endif
#define CUSTOM_VERTEX_UPDATE_POSITION
#define CUSTOM_VERTEX_UPDATE_NORMAL
#include<instancesVertex>
#if defined(PREPASS) && ((defined(PREPASS_VELOCITY) || defined(PREPASS_VELOCITY_LINEAR)) && !defined(BONES_VELOCITY_ENABLED)
vertexOutputs.vCurrentPosition=scene.viewProjection*finalWorld*vec4f(positionUpdated,1.0);vertexOutputs.vPreviousPosition=uniforms.previousViewProjection*finalPreviousWorld*vec4f(positionUpdated,1.0);
#endif
#ifdef USE_VERTEX_PULLING
#include<bonesVertex>(vertexInputs.matricesIndices,vp_matricesIndices,vertexInputs.matricesWeights,vp_matricesWeights,vertexInputs.matricesIndicesExtra,vp_matricesIndicesExtra,vertexInputs.matricesWeightsExtra,vp_matricesWeightsExtra)
#include<bakedVertexAnimation>(vertexInputs.matricesIndices,vp_matricesIndices,vertexInputs.matricesWeights,vp_matricesWeights,vertexInputs.matricesIndicesExtra,vp_matricesIndicesExtra,vertexInputs.matricesWeightsExtra,vp_matricesWeightsExtra)
#else
#include<bonesVertex>
#include<bakedVertexAnimation>
#endif
var worldPos: vec4f=finalWorld*vec4f(positionUpdated,1.0);
#ifdef NORMAL
var normalWorld: mat3x3f= mat3x3f(finalWorld[0].xyz,finalWorld[1].xyz,finalWorld[2].xyz);
#if defined(INSTANCES) && defined(THIN_INSTANCES)
vertexOutputs.vNormalW=normalUpdated/ vec3f(dot(normalWorld[0],normalWorld[0]),dot(normalWorld[1],normalWorld[1]),dot(normalWorld[2],normalWorld[2]));vertexOutputs.vNormalW=normalize(normalWorld*vertexOutputs.vNormalW);
#else
#ifdef NONUNIFORMSCALING
normalWorld=transposeMat3(inverseMat3(normalWorld));
#endif
vertexOutputs.vNormalW=normalize(normalWorld*normalUpdated);
#endif
#endif
#define CUSTOM_VERTEX_UPDATE_WORLDPOS
#ifdef MULTIVIEW
if (gl_ViewID_OVR==0u) {vertexOutputs.position=scene.viewProjection*worldPos;} else {vertexOutputs.position=scene.viewProjectionR*worldPos;}
#else
vertexOutputs.position=scene.viewProjection*worldPos;
#endif
vertexOutputs.vPositionW= worldPos.xyz;
#ifdef PREPASS
#include<prePassVertex>
#endif
#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)
vertexOutputs.vDirectionW=normalize((finalWorld* vec4f(positionUpdated,0.0)).xyz);
#endif
#if defined(CLUSTLIGHT_BATCH) && CLUSTLIGHT_BATCH>0
#ifdef RIGHT_HANDED
vertexOutputs.vViewDepth=-(scene.view*worldPos).z;
#else
vertexOutputs.vViewDepth=(scene.view*worldPos).z;
#endif
#endif
#ifndef UV1
var uvUpdated: vec2f=vec2f(0.,0.);
#endif
#ifdef MAINUV1
vertexOutputs.vMainUV1=uvUpdated;
#endif
#ifndef UV2
var uv2Updated: vec2f=vec2f(0.,0.);
#endif
#ifdef MAINUV2
vertexOutputs.vMainUV2=uv2Updated;
#endif
#include<uvVariableDeclaration>[3..7]
#include<samplerVertexImplementation>(_DEFINENAME_,DIFFUSE,_VARYINGNAME_,Diffuse,_MATRIXNAME_,diffuse,_INFONAME_,DiffuseInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,DETAIL,_VARYINGNAME_,Detail,_MATRIXNAME_,detail,_INFONAME_,DetailInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,AMBIENT,_VARYINGNAME_,Ambient,_MATRIXNAME_,ambient,_INFONAME_,AmbientInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,OPACITY,_VARYINGNAME_,Opacity,_MATRIXNAME_,opacity,_INFONAME_,OpacityInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,EMISSIVE,_VARYINGNAME_,Emissive,_MATRIXNAME_,emissive,_INFONAME_,EmissiveInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,LIGHTMAP,_VARYINGNAME_,Lightmap,_MATRIXNAME_,lightmap,_INFONAME_,LightmapInfos.x)
#if defined(SPECULARTERM)
#include<samplerVertexImplementation>(_DEFINENAME_,SPECULAR,_VARYINGNAME_,Specular,_MATRIXNAME_,specular,_INFONAME_,SpecularInfos.x)
#endif
#include<samplerVertexImplementation>(_DEFINENAME_,BUMP,_VARYINGNAME_,Bump,_MATRIXNAME_,bump,_INFONAME_,BumpInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,DECAL,_VARYINGNAME_,Decal,_MATRIXNAME_,decal,_INFONAME_,DecalInfos.x)
#include<bumpVertex>
#include<clipPlaneVertex>
#include<fogVertex>
#include<shadowsVertex>[0..maxSimultaneousLights]
#include<vertexColorMixing>
#include<logDepthVertex>
#define CUSTOM_VERTEX_MAIN_END
}
`;t.ShaderStore.ShadersStoreWGSL[a]||(t.ShaderStore.ShadersStoreWGSL[a]=o),e.s(["defaultVertexShaderWGSL",0,{name:a,shader:o}],436916)},319240,197003,549030,e=>{"use strict";var t=e.i(263537);let r="gaussianSplattingVertexDeclaration";t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]="attribute vec3 position;attribute vec4 splatIndex0;attribute vec4 splatIndex1;attribute vec4 splatIndex2;attribute vec4 splatIndex3;uniform mat4 view;uniform mat4 projection;uniform mat4 world;uniform vec4 vEyePosition;"),e.s([],319240),e.i(629238),e.i(997900);let i="gaussianSplattingUboDeclaration",a=`#include<sceneUboDeclaration>
#include<meshUboDeclaration>
attribute vec3 position;attribute vec4 splatIndex0;attribute vec4 splatIndex1;attribute vec4 splatIndex2;attribute vec4 splatIndex3;
`;t.ShaderStore.IncludesShadersStore[i]||(t.ShaderStore.IncludesShadersStore[i]=a),e.s([],197003);let o="gaussianSplatting",n=`#if !defined(WEBGL2) && !defined(WEBGPU) && !defined(NATIVE)
mat3 transpose(mat3 matrix) {return mat3(matrix[0][0],matrix[1][0],matrix[2][0],
matrix[0][1],matrix[1][1],matrix[2][1],
matrix[0][2],matrix[1][2],matrix[2][2]);}
#endif
vec2 getDataUV(float index,vec2 textureSize) {float y=floor(index/textureSize.x);float x=index-y*textureSize.x;return vec2((x+0.5)/textureSize.x,(y+0.5)/textureSize.y);}
#if SH_DEGREE>0 || IS_COMPOUND
ivec2 getDataUVint(float index,vec2 textureSize) {float y=floor(index/textureSize.x);float x=index-y*textureSize.x;return ivec2(uint(x+0.5),uint(y+0.5));}
#endif
struct Splat {vec4 center;vec4 color;vec4 covA;vec4 covB;
#if SH_DEGREE>0
uvec4 sh0; 
#endif
#if SH_DEGREE>1
uvec4 sh1;
#endif
#if SH_DEGREE>2
uvec4 sh2;
#endif
#if SH_DEGREE>3
uvec4 sh3;uvec4 sh4;
#endif
#if IS_COMPOUND
uint partIndex;
#endif
#if defined(IS_FOR_VOXELIZATION)
vec4 rotationA;vec4 rotationB;vec4 rotationScale;
#endif
};float getSplatIndex(int localIndex)
{float splatIndex;switch (localIndex)
{case 0: splatIndex=splatIndex0.x; break;case 1: splatIndex=splatIndex0.y; break;case 2: splatIndex=splatIndex0.z; break;case 3: splatIndex=splatIndex0.w; break;case 4: splatIndex=splatIndex1.x; break;case 5: splatIndex=splatIndex1.y; break;case 6: splatIndex=splatIndex1.z; break;case 7: splatIndex=splatIndex1.w; break;case 8: splatIndex=splatIndex2.x; break;case 9: splatIndex=splatIndex2.y; break;case 10: splatIndex=splatIndex2.z; break;case 11: splatIndex=splatIndex2.w; break;case 12: splatIndex=splatIndex3.x; break;case 13: splatIndex=splatIndex3.y; break;case 14: splatIndex=splatIndex3.z; break;case 15: splatIndex=splatIndex3.w; break;}
return splatIndex;}
Splat readSplat(float splatIndex)
{Splat splat;vec2 splatUV=getDataUV(splatIndex,dataTextureSize);splat.center=texture2D(centersTexture,splatUV);splat.color=texture2D(colorsTexture,splatUV);
#if !defined(IS_FOR_VOXELIZATION)
splat.covA=texture2D(covariancesATexture,splatUV)*splat.center.w;splat.covB=texture2D(covariancesBTexture,splatUV)*splat.center.w;
#endif
#if SH_DEGREE>0 || IS_COMPOUND
ivec2 splatUVint=getDataUVint(splatIndex,dataTextureSize);
#endif
#if SH_DEGREE>0
splat.sh0=texelFetch(shTexture0,splatUVint,0);
#endif
#if SH_DEGREE>1
splat.sh1=texelFetch(shTexture1,splatUVint,0);
#endif
#if SH_DEGREE>2
splat.sh2=texelFetch(shTexture2,splatUVint,0);
#endif
#if SH_DEGREE>3
splat.sh3=texelFetch(shTexture3,splatUVint,0);splat.sh4=texelFetch(shTexture4,splatUVint,0);
#endif
#if IS_COMPOUND
splat.partIndex=uint(texture2D(partIndicesTexture,splatUV).r*255.0+0.5);
#endif
#if defined(IS_FOR_VOXELIZATION)
splat.rotationA=texture2D(rotationsATexture,splatUV);splat.rotationB=texture2D(rotationsBTexture,splatUV);splat.rotationScale=texture2D(rotationScaleTexture,splatUV);
#endif
return splat;}
#if defined(WEBGL2) || defined(WEBGPU) || defined(NATIVE)
vec3 computeColorFromSHDegree(vec3 dir,const vec3 sh[25])
{const float SH_C0=0.28209479;const float SH_C1=0.48860251;float SH_C2[5];SH_C2[0]=1.092548430;SH_C2[1]=-1.09254843;SH_C2[2]=0.315391565;SH_C2[3]=-1.09254843;SH_C2[4]=0.546274215;float SH_C3[7];SH_C3[0]=-0.59004358;SH_C3[1]=2.890611442;SH_C3[2]=-0.45704579;SH_C3[3]=0.373176332;SH_C3[4]=-0.45704579;SH_C3[5]=1.445305721;SH_C3[6]=-0.59004358;float SH_C4[9];SH_C4[0]= 2.5033429418;SH_C4[1]=-1.7701307698;SH_C4[2]= 0.9461746958;SH_C4[3]=-0.6690465436;SH_C4[4]= 0.1057855469;SH_C4[5]=-0.6690465436;SH_C4[6]= 0.4730873479;SH_C4[7]=-1.7701307698;SH_C4[8]= 0.6258357354;vec3 result=/*SH_C0**/sh[0];
#if SH_DEGREE>0
float x=dir.x;float y=dir.y;float z=dir.z;result+=- SH_C1*y*sh[1]+SH_C1*z*sh[2]-SH_C1*x*sh[3];
#if SH_DEGREE>1
float xx=x*x,yy=y*y,zz=z*z;float xy=x*y,yz=y*z,xz=x*z;result+=
SH_C2[0]*xy*sh[4] +
SH_C2[1]*yz*sh[5] +
SH_C2[2]*(2.0*zz-xx-yy)*sh[6] +
SH_C2[3]*xz*sh[7] +
SH_C2[4]*(xx-yy)*sh[8];
#if SH_DEGREE>2
result+=
SH_C3[0]*y*(3.0*xx-yy)*sh[9] +
SH_C3[1]*xy*z*sh[10] +
SH_C3[2]*y*(4.0*zz-xx-yy)*sh[11] +
SH_C3[3]*z*(2.0*zz-3.0*xx-3.0*yy)*sh[12] +
SH_C3[4]*x*(4.0*zz-xx-yy)*sh[13] +
SH_C3[5]*z*(xx-yy)*sh[14] +
SH_C3[6]*x*(xx-3.0*yy)*sh[15];
#if SH_DEGREE>3
result +=
SH_C4[0]*x*y*(xx-yy)*sh[16] +
SH_C4[1]*y*z*(3.0*xx-yy)*sh[17] +
SH_C4[2]*x*y*(7.0*zz-1.0)*sh[18] +
SH_C4[3]*y*z*(7.0*zz-3.0)*sh[19] +
SH_C4[4]*(zz*(35.0*zz-30.0)+3.0)*sh[20] +
SH_C4[5]*x*z*(7.0*zz-3.0)*sh[21] +
SH_C4[6]*(xx-yy)*(7.0*zz-1.0)*sh[22] +
SH_C4[7]*x*z*(xx-3.0*yy)*sh[23] +
SH_C4[8]*(xx*(xx-3.0*yy)-yy*(3.0*xx-yy))*sh[24];
#endif
#endif
#endif
#endif
return result;}
vec4 decompose(uint value)
{vec4 components=vec4(
float((value ) & 255u),
float((value>>uint( 8)) & 255u),
float((value>>uint(16)) & 255u),
float((value>>uint(24)) & 255u));return components*vec4(2./255.)-vec4(1.);}
vec3 computeSH(Splat splat,vec3 dir)
{vec3 sh[25];sh[0]=vec3(0.,0.,0.);
#if SH_DEGREE>0
vec4 sh00=decompose(splat.sh0.x);vec4 sh01=decompose(splat.sh0.y);vec4 sh02=decompose(splat.sh0.z);sh[1]=vec3(sh00.x,sh00.y,sh00.z);sh[2]=vec3(sh00.w,sh01.x,sh01.y);sh[3]=vec3(sh01.z,sh01.w,sh02.x);
#endif
#if SH_DEGREE>1
vec4 sh03=decompose(splat.sh0.w);vec4 sh04=decompose(splat.sh1.x);vec4 sh05=decompose(splat.sh1.y);sh[4]=vec3(sh02.y,sh02.z,sh02.w);sh[5]=vec3(sh03.x,sh03.y,sh03.z);sh[6]=vec3(sh03.w,sh04.x,sh04.y);sh[7]=vec3(sh04.z,sh04.w,sh05.x);sh[8]=vec3(sh05.y,sh05.z,sh05.w);
#endif
#if SH_DEGREE>2
vec4 sh06=decompose(splat.sh1.z);vec4 sh07=decompose(splat.sh1.w);vec4 sh08=decompose(splat.sh2.x);vec4 sh09=decompose(splat.sh2.y);vec4 sh10=decompose(splat.sh2.z);vec4 sh11=decompose(splat.sh2.w);sh[9]=vec3(sh06.x,sh06.y,sh06.z);sh[10]=vec3(sh06.w,sh07.x,sh07.y);sh[11]=vec3(sh07.z,sh07.w,sh08.x);sh[12]=vec3(sh08.y,sh08.z,sh08.w);sh[13]=vec3(sh09.x,sh09.y,sh09.z);sh[14]=vec3(sh09.w,sh10.x,sh10.y);sh[15]=vec3(sh10.z,sh10.w,sh11.x);
#endif
#if SH_DEGREE>3
vec4 sh12=decompose(splat.sh3.x);vec4 sh13=decompose(splat.sh3.y);vec4 sh14=decompose(splat.sh3.z);vec4 sh15=decompose(splat.sh3.w);vec4 sh16=decompose(splat.sh4.x);vec4 sh17=decompose(splat.sh4.y);sh[16]=vec3(sh11.y,sh11.z,sh11.w);sh[17]=vec3(sh12.x,sh12.y,sh12.z);sh[18]=vec3(sh12.w,sh13.x,sh13.y);sh[19]=vec3(sh13.z,sh13.w,sh14.x);sh[20]=vec3(sh14.y,sh14.z,sh14.w);sh[21]=vec3(sh15.x,sh15.y,sh15.z);sh[22]=vec3(sh15.w,sh16.x,sh16.y);sh[23]=vec3(sh16.z,sh16.w,sh17.x);sh[24]=vec3(sh17.y,sh17.z,sh17.w);
#endif
return computeColorFromSHDegree(dir,sh);}
#else
vec3 computeSH(Splat splat,vec3 dir)
{return vec3(0.,0.,0.);}
#endif
#if !defined(IS_FOR_VOXELIZATION)
vec4 gaussianSplatting(vec2 meshPos,vec3 worldPos,vec2 scale,vec3 covA,vec3 covB,mat4 worldMatrix,mat4 viewMatrix,mat4 projectionMatrix)
{mat4 modelView=viewMatrix*worldMatrix;vec4 camspace=viewMatrix*vec4(worldPos,1.);vec4 pos2d=projectionMatrix*camspace;float bounds=1.2*pos2d.w;if (pos2d.z<-pos2d.w || pos2d.x<-bounds || pos2d.x>bounds
|| pos2d.y<-bounds || pos2d.y>bounds) {return vec4(0.0,0.0,2.0,1.0);}
mat3 Vrk=mat3(
covA.x,covA.y,covA.z,
covA.y,covB.x,covB.y,
covA.z,covB.y,covB.z
);bool isOrtho=abs(projectionMatrix[3][3]-1.0)<0.001;mat3 J;if (isOrtho) {J=mat3(
focal.x,0.,0.,
0.,focal.y,0.,
0.,0.,0.
);} else {J=mat3(
focal.x/camspace.z,0.,-(focal.x*camspace.x)/(camspace.z*camspace.z),
0.,focal.y/camspace.z,-(focal.y*camspace.y)/(camspace.z*camspace.z),
0.,0.,0.
);}
mat3 T=transpose(mat3(modelView))*J;mat3 cov2d=transpose(T)*Vrk*T;
#if COMPENSATION
float c00=cov2d[0][0];float c11=cov2d[1][1];float c01=cov2d[0][1];float detOrig=c00*c11-c01*c01;
#endif
cov2d[0][0]+=kernelSize;cov2d[1][1]+=kernelSize;
#if COMPENSATION
vec3 c2d=vec3(cov2d[0][0],c01,cov2d[1][1]);float detBlur=c2d.x*c2d.z-c2d.y*c2d.y;float compensation=sqrt(max(0.,detOrig/detBlur));vColor.w*=compensation;
#endif
float mid=(cov2d[0][0]+cov2d[1][1])/2.0;float radius=length(vec2((cov2d[0][0]-cov2d[1][1])/2.0,cov2d[0][1]));float epsilon=0.0001;float lambda1=mid+radius+epsilon,lambda2=mid-radius+epsilon;if (lambda2<0.0)
{return vec4(0.0,0.0,2.0,1.0);}
vec2 diagonalVector=normalize(vec2(cov2d[0][1],lambda1-cov2d[0][0]));vec2 majorAxis=min(sqrt(2.0*lambda1),1024.0)*diagonalVector;vec2 minorAxis=min(sqrt(2.0*lambda2),1024.0)*vec2(diagonalVector.y,-diagonalVector.x);vec2 vCenter=vec2(pos2d);float scaleFactor=isOrtho ? 1.0 : pos2d.w;return vec4(
vCenter 
+ ((meshPos.x*majorAxis
+ meshPos.y*minorAxis)*invViewport*scaleFactor)*scale,pos2d.zw);}
#endif
#if IS_COMPOUND
mat4 getPartWorld(uint partIndex) {return partWorld[partIndex];}
#endif
#if defined(IS_FOR_VOXELIZATION)
vec4 computeVoxelSplatWorldPos(vec4 rotationA,vec4 rotationB,vec4 rotationScale,vec3 center,mat4 splatWorld,mat4 viewMatrix,mat4 invWorldScale,vec2 quadPos) {mat3 splatRotation=mat3(
vec3(rotationA.x,rotationA.y,rotationA.z),
vec3(rotationA.w,rotationB.x,rotationB.y),
vec3(rotationB.z,rotationB.w,rotationScale.x)
);vec3 splatScale=vec3(rotationScale.y,rotationScale.z,rotationScale.w);mat3 rotToView=mat3(viewMatrix)*mat3(invWorldScale)*mat3(splatWorld)*splatRotation;vec3 axisLengthInViewZ=abs(vec3(rotToView[0][2],rotToView[1][2],rotToView[2][2]));float gaussianSplatCutoffStddev=1.4142135624/2.0; 
vec3 offsetSplatSpace;if (axisLengthInViewZ.x>axisLengthInViewZ.y && axisLengthInViewZ.x>axisLengthInViewZ.z) {offsetSplatSpace=vec3(0.0,quadPos.x,quadPos.y)*splatScale*gaussianSplatCutoffStddev;} else if (axisLengthInViewZ.y>axisLengthInViewZ.z) {offsetSplatSpace=vec3(quadPos.x,0.0,quadPos.y)*splatScale*gaussianSplatCutoffStddev;} else {offsetSplatSpace=vec3(quadPos.x,quadPos.y,0.0)*splatScale*gaussianSplatCutoffStddev;}
vec3 vertexObjectSpace=center+splatRotation*offsetSplatSpace;return splatWorld*vec4(vertexObjectSpace,1.0);}
#endif
`;t.ShaderStore.IncludesShadersStore[o]||(t.ShaderStore.IncludesShadersStore[o]=n),e.s([],549030)},648033,e=>{"use strict";var t=e.i(263537);e.i(319240),e.i(197003),e.i(549030);let r="gaussianSplattingVoxelVertexShader",i=`#include<__decl__gaussianSplattingVertex>
uniform vec2 dataTextureSize;uniform float alpha;uniform mat4 invWorldScale;uniform mat4 viewMatrix;uniform sampler2D rotationsATexture;uniform sampler2D rotationsBTexture;uniform sampler2D rotationScaleTexture;uniform sampler2D centersTexture;uniform sampler2D colorsTexture;
#if IS_COMPOUND
uniform mat4 partWorld[MAX_PART_COUNT];uniform float partVisibility[MAX_PART_COUNT];uniform sampler2D partIndicesTexture;
#endif
varying vec3 vNormalizedPosition;varying vec3 vNormalizedCenterPosition;varying float vAlpha;varying vec2 vPatchPosition;
#include<gaussianSplatting>
void main(void) {float splatIndex=getSplatIndex(int(position.z+0.5));Splat splat=readSplat(splatIndex);
#if IS_COMPOUND
mat4 splatWorld=getPartWorld(splat.partIndex);
#else
mat4 splatWorld=world;
#endif
vec4 worldPos=computeVoxelSplatWorldPos(splat.rotationA,splat.rotationB,splat.rotationScale,splat.center.xyz,splatWorld,viewMatrix,invWorldScale,position.xy);gl_Position=viewMatrix*invWorldScale*worldPos;vNormalizedPosition=gl_Position.xyz*0.5+0.5;vec4 viewCenterPos=viewMatrix*invWorldScale*splatWorld*vec4(splat.center.xyz,1.0);vNormalizedCenterPosition=viewCenterPos.xyz*0.5+0.5;vAlpha=splat.color.w*alpha;
#if IS_COMPOUND
vAlpha*=partVisibility[splat.partIndex];
#endif
vPatchPosition=position.xy;}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["gaussianSplattingVoxelVertexShader",0,{name:r,shader:i}])},464291,e=>{"use strict";var t=e.i(263537);let r="shadowMapFragment",i=`var depthSM: f32=fragmentInputs.vDepthMetricSM;
#if defined(SM_DEPTHCLAMP) && SM_DEPTHCLAMP==1
#if SM_USEDISTANCE==1
depthSM=(length(fragmentInputs.vPositionWSM-uniforms.lightDataSM)+uniforms.depthValuesSM.x)/uniforms.depthValuesSM.y+uniforms.biasAndScaleSM.x;
#else
#ifdef USE_REVERSE_DEPTHBUFFER
depthSM=(-fragmentInputs.zSM+uniforms.depthValuesSM.x)/uniforms.depthValuesSM.y+uniforms.biasAndScaleSM.x;
#else
depthSM=(fragmentInputs.zSM+uniforms.depthValuesSM.x)/uniforms.depthValuesSM.y+uniforms.biasAndScaleSM.x;
#endif
#endif
depthSM=clamp(depthSM,0.0,1.0);
#ifdef USE_REVERSE_DEPTHBUFFER
fragmentOutputs.fragDepth=clamp(1.0-depthSM,0.0,1.0);
#else
fragmentOutputs.fragDepth=clamp(depthSM,0.0,1.0); 
#endif
#elif SM_USEDISTANCE==1
depthSM=(length(fragmentInputs.vPositionWSM-uniforms.lightDataSM)+uniforms.depthValuesSM.x)/uniforms.depthValuesSM.y+uniforms.biasAndScaleSM.x;
#endif
#if SM_ESM==1
depthSM=clamp(exp(-min(87.,uniforms.biasAndScaleSM.z*depthSM)),0.,1.);
#endif
#if SM_FLOAT==1
fragmentOutputs.color= vec4f(depthSM,1.0,1.0,1.0);
#else
fragmentOutputs.color=pack(depthSM);
#endif
`;t.ShaderStore.IncludesShadersStoreWGSL[r]||(t.ShaderStore.IncludesShadersStoreWGSL[r]=i),e.s(["shadowMapFragmentWGSL",0,{name:r,shader:i}])},985501,e=>{"use strict";var t=e.i(263537);e.i(739589);let r="bayerDitherFunctions",i=`fn bayerDither2(_P: vec2f)->f32 {return ((2.0*_P.y+_P.x+1.0)%(4.0));}
fn bayerDither4(_P: vec2f)->f32 {var P1: vec2f=((_P)%(2.0)); 
var P2: vec2f=floor(0.5*((_P)%(4.0))); 
return 4.0*bayerDither2(P1)+bayerDither2(P2);}
fn bayerDither8(_P: vec2f)->f32 {var P1: vec2f=((_P)%(2.0)); 
var P2: vec2f=floor(0.5 *((_P)%(4.0))); 
var P4: vec2f=floor(0.25*((_P)%(8.0))); 
return 4.0*(4.0*bayerDither2(P1)+bayerDither2(P2))+bayerDither2(P4);}
`;t.ShaderStore.IncludesShadersStoreWGSL[r]||(t.ShaderStore.IncludesShadersStoreWGSL[r]=i);let a="shadowMapFragmentExtraDeclaration",o=`#if SM_FLOAT==0
#include<packingFunctions>
#endif
#if SM_SOFTTRANSPARENTSHADOW==1
#include<bayerDitherFunctions>
uniform softTransparentShadowSM: vec2f;
#endif
varying vDepthMetricSM: f32;
#if SM_USEDISTANCE==1
uniform lightDataSM: vec3f;varying vPositionWSM: vec3f;
#endif
uniform biasAndScaleSM: vec3f;uniform depthValuesSM: vec2f;
#if defined(SM_DEPTHCLAMP) && SM_DEPTHCLAMP==1
varying zSM: f32;
#endif
`;t.ShaderStore.IncludesShadersStoreWGSL[a]||(t.ShaderStore.IncludesShadersStoreWGSL[a]=o),e.i(755704),e.i(212954),e.i(464291);let n="shadowMapPixelShader",s=`#include<shadowMapFragmentExtraDeclaration>
#ifdef ALPHATEXTURE
varying vUV: vec2f;var diffuseSamplerSampler: sampler;var diffuseSampler: texture_2d<f32>;
#endif
#include<clipPlaneFragmentDeclaration>
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {
#include<clipPlaneFragment>
#ifdef ALPHATEXTURE
var opacityMap: vec4f=textureSample(diffuseSampler,diffuseSamplerSampler,fragmentInputs.vUV);var alphaFromAlphaTexture: f32=opacityMap.a;
#if SM_SOFTTRANSPARENTSHADOW==1
if (uniforms.softTransparentShadowSM.y==1.0) {opacityMap=vec4f(opacityMap.rgb* vec3f(0.3,0.59,0.11),opacityMap.a);alphaFromAlphaTexture=opacityMap.x+opacityMap.y+opacityMap.z;}
#endif
#ifdef ALPHATESTVALUE
if (alphaFromAlphaTexture<ALPHATESTVALUE) {discard;}
#endif
#endif
#if SM_SOFTTRANSPARENTSHADOW==1
#ifdef ALPHATEXTURE
if ((bayerDither8(floor(((fragmentInputs.position.xy)%(8.0)))))/64.0>=uniforms.softTransparentShadowSM.x*alphaFromAlphaTexture) {discard;}
#else
if ((bayerDither8(floor(((fragmentInputs.position.xy)%(8.0)))))/64.0>=uniforms.softTransparentShadowSM.x) {discard;} 
#endif
#endif
#include<shadowMapFragment>
}`;t.ShaderStore.ShadersStoreWGSL[n]||(t.ShaderStore.ShadersStoreWGSL[n]=s),e.s(["shadowMapPixelShaderWGSL",0,{name:n,shader:s}],985501)},875725,e=>{"use strict";var t=e.i(730939),r=e.i(202286),i=e.i(548894);class a{static extractMinAndMaxIndexed(e,t,r,i,a,o){for(let n=r;n<r+i;n++){let r=3*t[n],i=e[r],s=e[r+1],l=e[r+2];a.minimizeInPlaceFromFloats(i,s,l),o.maximizeInPlaceFromFloats(i,s,l)}}static extractMinAndMax(e,t,r,i,a,o){for(let n=t,s=t*i;n<t+r;n++,s+=i){let t=e[s],r=e[s+1],i=e[s+2];a.minimizeInPlaceFromFloats(t,r,i),o.maximizeInPlaceFromFloats(t,r,i)}}}function o(e,t,i,n=null,s){let l=new r.Vector3(Number.MAX_VALUE,Number.MAX_VALUE,Number.MAX_VALUE),f=new r.Vector3(-Number.MAX_VALUE,-Number.MAX_VALUE,-Number.MAX_VALUE);return s||(s=3),a.extractMinAndMax(e,t,i,s,l,f),n&&(l.x-=l.x*n.x+n.y,l.y-=l.y*n.x+n.y,l.z-=l.z*n.x+n.y,f.x+=f.x*n.x+n.y,f.y+=f.y*n.x+n.y,f.z+=f.z*n.x+n.y),{minimum:l,maximum:f}}(0,t.__decorate)([i.nativeOverride.filter((...e)=>!Array.isArray(e[0])&&!Array.isArray(e[1]))],a,"extractMinAndMaxIndexed",null),(0,t.__decorate)([i.nativeOverride.filter((...e)=>!Array.isArray(e[0]))],a,"extractMinAndMax",null),e.s(["FixFlippedFaces",0,function(e,t){let i=o(e,0,e.length/3),a=i.maximum.subtract(i.minimum).scale(.5).add(i.minimum),n=new r.Vector3,s=new r.Vector3,l=new r.Vector3,f=new r.Vector3,c=new r.Vector3,d=new r.Vector3,u=new r.Vector3;for(let i=0;i<t.length;i+=3){let o=t[i],m=t[i+1],p=t[i+2];n.fromArray(e,3*o),s.fromArray(e,3*m),l.fromArray(e,3*p),s.subtractToRef(n,f),l.subtractToRef(n,c),r.Vector3.CrossToRef(f,c,d),d.normalize();let v=n.x+s.x+l.x,S=n.y+s.y+l.y,h=n.z+s.z+l.z;u.set(v/3,S/3,h/3),u.subtractInPlace(a),u.normalize(),r.Vector3.Dot(d,u)>=0&&(t[i]=p,t[i+2]=o)}},"extractMinAndMax",0,o,"extractMinAndMaxIndexed",0,function(e,t,i,o,n=null){let s=new r.Vector3(Number.MAX_VALUE,Number.MAX_VALUE,Number.MAX_VALUE),l=new r.Vector3(-Number.MAX_VALUE,-Number.MAX_VALUE,-Number.MAX_VALUE);return a.extractMinAndMaxIndexed(e,t,i,o,s,l),n&&(s.x-=s.x*n.x+n.y,s.y-=s.y*n.x+n.y,s.z-=s.z*n.x+n.y,l.x+=l.x*n.x+n.y,l.y+=l.y*n.x+n.y,l.z+=l.z*n.x+n.y),{minimum:s,maximum:l}}])},800161,e=>{"use strict";var t=e.i(263537);let r="fresnelFunction",i=`#ifdef FRESNEL
fn computeFresnelTerm(viewDirection: vec3f,worldNormal: vec3f,bias: f32,power: f32)->f32
{let fresnelTerm: f32=pow(bias+abs(dot(viewDirection,worldNormal)),power);return clamp(fresnelTerm,0.,1.);}
#endif
`;t.ShaderStore.IncludesShadersStoreWGSL[r]||(t.ShaderStore.IncludesShadersStoreWGSL[r]=i),e.s([])},490826,e=>{"use strict";var t=e.i(802319);e.s(["WebGPUPerfCounter",0,class{constructor(){this._gpuTimeInFrameId=-1,this.counter=new t.PerfCounter}_addDuration(e,t){e<this._gpuTimeInFrameId||(this._gpuTimeInFrameId!==e?(this.counter._fetchResult(),this.counter.fetchNewFrame(),this.counter.addCount(t,!1),this._gpuTimeInFrameId=e):this.counter.addCount(t,!1))}}])},739589,e=>{"use strict";var t=e.i(263537);let r="packingFunctions",i=`fn pack(depth: f32)->vec4f
{const bit_shift: vec4f= vec4f(255.0*255.0*255.0,255.0*255.0,255.0,1.0);const bit_mask: vec4f= vec4f(0.0,1.0/255.0,1.0/255.0,1.0/255.0);var res: vec4f=fract(depth*bit_shift);res-=res.xxyz*bit_mask;return res;}
fn unpack(color: vec4f)->f32
{const bit_shift: vec4f= vec4f(1.0/(255.0*255.0*255.0),1.0/(255.0*255.0),1.0/255.0,1.0);return dot(color,bit_shift);}`;t.ShaderStore.IncludesShadersStoreWGSL[r]||(t.ShaderStore.IncludesShadersStoreWGSL[r]=i),e.s(["packingFunctionsWGSL",0,{name:r,shader:i}])},828487,e=>{"use strict";var t=e.i(263537);let r="kernelBlurVaryingDeclaration";t.ShaderStore.IncludesShadersStoreWGSL[r]||(t.ShaderStore.IncludesShadersStoreWGSL[r]="varying sampleCoord{X}: vec2f;"),e.s([])},346145,e=>{"use strict";var t=e.i(263537);let r="packingFunctions",i=`vec4 pack(float depth)
{const vec4 bit_shift=vec4(255.0*255.0*255.0,255.0*255.0,255.0,1.0);const vec4 bit_mask=vec4(0.0,1.0/255.0,1.0/255.0,1.0/255.0);vec4 res=fract(depth*bit_shift);res-=res.xxyz*bit_mask;return res;}
float unpack(vec4 color)
{const vec4 bit_shift=vec4(1.0/(255.0*255.0*255.0),1.0/(255.0*255.0),1.0/255.0,1.0);return dot(color,bit_shift);}`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.s(["packingFunctions",0,{name:r,shader:i}])},704290,e=>{"use strict";var t=e.i(263537);let r="kernelBlurVaryingDeclaration";t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]="varying vec2 sampleCoord{X};"),e.s([])},2064,e=>{"use strict";var t=e.i(263537);let r="meshUVSpaceRendererFinaliserVertexShader",i=`precision highp float;attribute vec3 position;attribute vec2 uv;uniform mat4 worldViewProjection;varying vec2 vUV;void main() {gl_Position=worldViewProjection*vec4(position,1.0);vUV=uv;}
`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["meshUVSpaceRendererFinaliserVertexShader",0,{name:r,shader:i}])},618703,e=>{"use strict";var t=e.i(263537);let r="meshUVSpaceRendererMaskerVertexShader",i="attribute vec2 uv;varying vec2 vUV;void main(void) {gl_Position=vec4(vec2(uv.x,uv.y)*2.0-1.0,0.,1.0);vUV=uv;}";t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["meshUVSpaceRendererMaskerVertexShader",0,{name:r,shader:i}])},291678,e=>{"use strict";var t=e.i(263537);let r="boundingBoxRendererPixelShader",i=`uniform color: vec4f;
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
fragmentOutputs.color=uniforms.color;
#define CUSTOM_FRAGMENT_MAIN_END
}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["boundingBoxRendererPixelShaderWGSL",0,{name:r,shader:i}])},943194,e=>{"use strict";var t=e.i(263537);let r="proceduralVertexShader",i=`attribute position: vec2f;varying vPosition: vec2f;varying vUV: vec2f;const madd: vec2f= vec2f(0.5,0.5);
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input : VertexInputs)->FragmentInputs {
#define CUSTOM_VERTEX_MAIN_BEGIN
vertexOutputs.vPosition=vertexInputs.position;vertexOutputs.vUV=vertexInputs.position*madd+madd;vertexOutputs.position= vec4f(vertexInputs.position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["proceduralVertexShaderWGSL",0,{name:r,shader:i}])},424540,e=>{"use strict";var t=e.i(263537);e.i(407892),e.i(380244),e.i(585817),e.i(945868),e.i(349e3),e.i(13486),e.i(988389),e.i(431235),e.i(300889),e.i(398879),e.i(92372),e.i(84318);let r="glowMapGenerationVertexShader",i=`attribute position: vec3f;
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]
#include<clipPlaneVertexDeclaration>
#include<instancesDeclaration>
uniform viewProjection: mat4x4f;varying vPosition: vec4f;
#ifdef UV1
attribute uv: vec2f;
#endif
#ifdef UV2
attribute uv2: vec2f;
#endif
#ifdef DIFFUSE
varying vUVDiffuse: vec2f;uniform diffuseMatrix: mat4x4f;
#endif
#ifdef OPACITY
varying vUVOpacity: vec2f;uniform opacityMatrix: mat4x4f;
#endif
#ifdef EMISSIVE
varying vUVEmissive: vec2f;uniform emissiveMatrix: mat4x4f;
#endif
#ifdef VERTEXALPHA
attribute color: vec4f;varying vColor: vec4f;
#endif
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input : VertexInputs)->FragmentInputs {var positionUpdated: vec3f=vertexInputs.position;
#ifdef UV1
var uvUpdated: vec2f=vertexInputs.uv;
#endif
#ifdef UV2
var uv2Updated: vec2f=vertexInputs.uv2;
#endif
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
var worldPos: vec4f=finalWorld* vec4f(positionUpdated,1.0);
#ifdef CUBEMAP
vertexOutputs.vPosition=worldPos;vertexOutputs.position=uniforms.viewProjection*finalWorld* vec4f(vertexInputs.position,1.0);
#else
vertexOutputs.vPosition=uniforms.viewProjection*worldPos;vertexOutputs.position=vertexOutputs.vPosition;
#endif
#ifdef DIFFUSE
#ifdef DIFFUSEUV1
vertexOutputs.vUVDiffuse= (uniforms.diffuseMatrix* vec4f(uvUpdated,1.0,0.0)).xy;
#endif
#ifdef DIFFUSEUV2
vertexOutputs.vUVDiffuse= (uniforms.diffuseMatrix* vec4f(uv2Updated,1.0,0.0)).xy;
#endif
#endif
#ifdef OPACITY
#ifdef OPACITYUV1
vertexOutputs.vUVOpacity= (uniforms.opacityMatrix* vec4f(uvUpdated,1.0,0.0)).xy;
#endif
#ifdef OPACITYUV2
vertexOutputs.vUVOpacity= (uniforms.opacityMatrix* vec4f(uv2Updated,1.0,0.0)).xy;
#endif
#endif
#ifdef EMISSIVE
#ifdef EMISSIVEUV1
vertexOutputs.vUVEmissive= (uniforms.emissiveMatrix* vec4f(uvUpdated,1.0,0.0)).xy;
#endif
#ifdef EMISSIVEUV2
vertexOutputs.vUVEmissive= (uniforms.emissiveMatrix* vec4f(uv2Updated,1.0,0.0)).xy;
#endif
#endif
#ifdef VERTEXALPHA
vertexOutputs.vColor=vertexInputs.color;
#endif
#include<clipPlaneVertex>
}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["glowMapGenerationVertexShaderWGSL",0,{name:r,shader:i}])},170755,e=>{"use strict";var t=e.i(263537);let r="rsmGlobalIlluminationPixelShader",i=`/**
* The implementation is an application of the formula found in http:
* For better results,it also adds a random (noise) rotation to the RSM samples (the noise artifacts are easier to remove than the banding artifacts).
*/
varying vUV: vec2f;uniform rsmLightMatrix: mat4x4f;uniform rsmInfo: vec4f;uniform rsmInfo2: vec4f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;var normalSamplerSampler: sampler;var normalSampler: texture_2d<f32>;var rsmPositionWSampler: sampler;var rsmPositionW: texture_2d<f32>;var rsmNormalWSampler: sampler;var rsmNormalW: texture_2d<f32>;var rsmFluxSampler: sampler;var rsmFlux: texture_2d<f32>;var rsmSamples: texture_2d<f32>;
#ifdef TRANSFORM_NORMAL
uniform invView: mat4x4f;
#endif
fn mod289(x: f32)->f32{return x-floor(x*(1.0/289.0))*289.0;}
fn mod289Vec4(x: vec4f)->vec4f {return x-floor(x*(1.0/289.0))* 289.0;}
fn perm(x: vec4f)->vec4f {return mod289Vec4(((x*34.0)+1.0)*x) ;}
fn noise(p: vec3f)->f32{var a: vec3f=floor(p);var d: vec3f=p-a;d=d*d*(3.0-2.0*d);var b: vec4f=a.xxyy+ vec4f(0.0,1.0,0.0,1.0);var k1: vec4f=perm(b.xyxy);var k2: vec4f=perm(k1.xyxy+b.zzww);var c: vec4f=k2+a.zzzz;var k3: vec4f=perm(c);var k4: vec4f=perm(c+1.0);var o1: vec4f=fract(k3*(1.0/41.0));var o2: vec4f=fract(k4*(1.0/41.0));var o3: vec4f=o2*d.z+o1*(1.0-d.z);var o4: vec2f=o3.yw*d.x+o3.xz*(1.0-d.x);return o4.y*d.y+o4.x*(1.0-d.y);}
fn computeIndirect(p: vec3f,n: vec3f)->vec3f {var indirectDiffuse: vec3f= vec3f(0.);var numSamples: i32= i32(uniforms.rsmInfo.x);var radius: f32=uniforms.rsmInfo.y;var intensity: f32=uniforms.rsmInfo.z;var edgeArtifactCorrection: f32=uniforms.rsmInfo.w;var texRSM: vec4f=uniforms.rsmLightMatrix* vec4f(p,1.);texRSM=vec4f(texRSM.xy/texRSM.w,texRSM.z,texRSM.w);texRSM=vec4f(texRSM.xy*0.5+0.5,texRSM.z,texRSM.w);var angle: f32=noise(p*uniforms.rsmInfo2.x);var c: f32=cos(angle);var s: f32=sin(angle);for (var i: i32=0; i<numSamples; i++) {var rsmSample: vec3f=textureLoad(rsmSamples,vec2<i32>(i,0),0).xyz;var weightSquare: f32=rsmSample.z;if (uniforms.rsmInfo2.y==1.0){rsmSample=vec3f(rsmSample.x*c+rsmSample.y*s,-rsmSample.x*s+rsmSample.y*c,rsmSample.z);}
var uv: vec2f=texRSM.xy+rsmSample.xy*radius;if (uv.x<0. || uv.x>1. || uv.y<0. || uv.y>1.) {continue;}
var vplPositionW: vec3f=textureSampleLevel(rsmPositionW,rsmPositionWSampler,uv,0.).xyz;var vplNormalW: vec3f=textureSampleLevel(rsmNormalW,rsmNormalWSampler,uv,0.).xyz*2.0-1.0;var vplFlux: vec3f=textureSampleLevel(rsmFlux,rsmFluxSampler,uv,0.).rgb;vplPositionW-=vplNormalW*edgeArtifactCorrection; 
var dist2: f32=dot(vplPositionW-p,vplPositionW-p);indirectDiffuse+=vplFlux*weightSquare*max(0.,dot(n,vplPositionW-p))*max(0.,dot(vplNormalW,p-vplPositionW))/(dist2*dist2);}
return clamp(indirectDiffuse*intensity,vec3f(0.0),vec3f(1.0));}
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var positionW: vec3f=textureSample(textureSampler,textureSamplerSampler,input.vUV).xyz;var normalW: vec3f=textureSample(normalSampler,normalSamplerSampler,input.vUV).xyz;
#ifdef DECODE_NORMAL
normalW=normalW*2.0-1.0;
#endif
#ifdef TRANSFORM_NORMAL
normalW=(uniforms.invView* vec4f(normalW,0.)).xyz;
#endif
fragmentOutputs.color=vec4f(computeIndirect(positionW,normalW),1.0);}
`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["rsmGlobalIlluminationPixelShaderWGSL",0,{name:r,shader:i}])},196548,e=>{"use strict";var t=e.i(440163),r=e.i(916624);let i="cachedOperationValue",a="cachedExecutionId";class o extends t.FlowGraphBlock{constructor(e,t){super(t),this.value=this.registerDataOutput("value",e),this.isValid=this.registerDataOutput("isValid",r.RichTypeBoolean)}_updateOutputs(e){let t=e._getExecutionVariable(this,a,-1),r=e._getExecutionVariable(this,i,null);if(null!=r&&t===e.executionId)this.isValid.setValue(!0,e),this.value.setValue(r,e);else try{let t=this._doOperation(e);if(null==t)return void this.isValid.setValue(!1,e);e._setExecutionVariable(this,i,t),e._setExecutionVariable(this,a,e.executionId),this.value.setValue(t,e),this.isValid.setValue(!0,e)}catch(t){this.isValid.setValue(!1,e)}}}e.s(["FlowGraphCachedOperationBlock",0,o])},842442,e=>{"use strict";var t=e.i(196548);class r extends t.FlowGraphCachedOperationBlock{constructor(e,t,r,i,a){super(t,a),this._operation=r,this._className=i,this.a=this.registerDataInput("a",e)}_doOperation(e){return this._operation(this.a.getValue(e))}getClassName(){return this._className}}e.s(["FlowGraphUnaryOperationBlock",0,r])},884079,e=>{"use strict";var t=e.i(196548);class r extends t.FlowGraphCachedOperationBlock{constructor(e,t,r,i,a,o){super(r,o),this._operation=i,this._className=a,this.a=this.registerDataInput("a",e),this.b=this.registerDataInput("b",t)}_doOperation(e){let t=this.a.getValue(e),r=this.b.getValue(e);return this._operation(t,r)}getClassName(){return this._className}}e.s(["FlowGraphBinaryOperationBlock",0,r])},270901,e=>{"use strict";var t=e.i(440163),r=e.i(916624),i=e.i(202286),a=e.i(774685),o=e.i(842442),n=e.i(884079);class s extends o.FlowGraphUnaryOperationBlock{constructor(e){super((0,r.getRichTypeByFlowGraphType)(e?.matrixType||"Matrix"),(0,r.getRichTypeByFlowGraphType)(e?.matrixType||"Matrix"),e=>e.transpose?e.transpose():i.Matrix.Transpose(e),"FlowGraphTransposeBlock",e)}}(0,a.RegisterClass)("FlowGraphTransposeBlock",s);class l extends o.FlowGraphUnaryOperationBlock{constructor(e){super((0,r.getRichTypeByFlowGraphType)(e?.matrixType||"Matrix"),r.RichTypeNumber,e=>e.determinant(),"FlowGraphDeterminantBlock",e)}}(0,a.RegisterClass)("FlowGraphDeterminantBlock",l);class f extends o.FlowGraphUnaryOperationBlock{constructor(e){super((0,r.getRichTypeByFlowGraphType)(e?.matrixType||"Matrix"),(0,r.getRichTypeByFlowGraphType)(e?.matrixType||"Matrix"),e=>e.inverse?e.inverse():i.Matrix.Invert(e),"FlowGraphInvertMatrixBlock",e)}}(0,a.RegisterClass)("FlowGraphInvertMatrixBlock",f);class c extends n.FlowGraphBinaryOperationBlock{constructor(e){super((0,r.getRichTypeByFlowGraphType)(e?.matrixType||"Matrix"),(0,r.getRichTypeByFlowGraphType)(e?.matrixType||"Matrix"),(0,r.getRichTypeByFlowGraphType)(e?.matrixType||"Matrix"),(e,t)=>t.multiply(e),"FlowGraphMatrixMultiplicationBlock",e)}}(0,a.RegisterClass)("FlowGraphMatrixMultiplicationBlock",c);class d extends t.FlowGraphBlock{constructor(e){super(e),this.input=this.registerDataInput("input",r.RichTypeMatrix),this.position=this.registerDataOutput("position",r.RichTypeVector3),this.rotationQuaternion=this.registerDataOutput("rotationQuaternion",r.RichTypeQuaternion),this.scaling=this.registerDataOutput("scaling",r.RichTypeVector3),this.isValid=this.registerDataOutput("isValid",r.RichTypeBoolean,!1)}_updateOutputs(e){let t=e._getExecutionVariable(this,"executionId",-1),r=e._getExecutionVariable(this,"cachedPosition",null),a=e._getExecutionVariable(this,"cachedRotation",null),o=e._getExecutionVariable(this,"cachedScaling",null);if(t===e.executionId&&r&&a&&o)this.position.setValue(r,e),this.rotationQuaternion.setValue(a,e),this.scaling.setValue(o,e);else{let t=this.input.getValue(e),n=r||new i.Vector3,s=a||new i.Quaternion,l=o||new i.Vector3,f=Math.round(1e4*t.m[3])/1e4,c=Math.round(1e4*t.m[7])/1e4,d=Math.round(1e4*t.m[11])/1e4,u=Math.round(1e4*t.m[15])/1e4;if(0!==f||0!==c||0!==d||1!==u){this.isValid.setValue(!1,e),this.position.setValue(i.Vector3.Zero(),e),this.rotationQuaternion.setValue(i.Quaternion.Identity(),e),this.scaling.setValue(i.Vector3.One(),e);return}let m=t.decompose(l,s,n);this.isValid.setValue(m,e),this.position.setValue(n,e),this.rotationQuaternion.setValue(s,e),this.scaling.setValue(l,e),e._setExecutionVariable(this,"cachedPosition",n),e._setExecutionVariable(this,"cachedRotation",s),e._setExecutionVariable(this,"cachedScaling",l),e._setExecutionVariable(this,"executionId",e.executionId)}}getClassName(){return"FlowGraphMatrixDecompose"}}(0,a.RegisterClass)("FlowGraphMatrixDecompose",d);class u extends t.FlowGraphBlock{constructor(e){super(e),this.position=this.registerDataInput("position",r.RichTypeVector3),this.rotationQuaternion=this.registerDataInput("rotationQuaternion",r.RichTypeQuaternion),this.scaling=this.registerDataInput("scaling",r.RichTypeVector3),this.value=this.registerDataOutput("value",r.RichTypeMatrix)}_updateOutputs(e){let t=e._getExecutionVariable(this,"executionId",-1),r=e._getExecutionVariable(this,"cachedMatrix",null);if(t===e.executionId&&r)this.value.setValue(r,e);else{let t=i.Matrix.Compose(this.scaling.getValue(e),this.rotationQuaternion.getValue(e),this.position.getValue(e));this.value.setValue(t,e),e._setExecutionVariable(this,"cachedMatrix",t),e._setExecutionVariable(this,"executionId",e.executionId)}}getClassName(){return"FlowGraphMatrixCompose"}}(0,a.RegisterClass)("FlowGraphMatrixCompose",u),e.s(["FlowGraphDeterminantBlock",0,l,"FlowGraphInvertMatrixBlock",0,f,"FlowGraphMatrixComposeBlock",0,u,"FlowGraphMatrixDecomposeBlock",0,d,"FlowGraphMatrixMultiplicationBlock",0,c,"FlowGraphTransposeBlock",0,s])},134302,e=>{"use strict";var t=e.i(263537);let r="gaussianSplatting",i=`fn getDataUV(index: f32,dataTextureSize: vec2f)->vec2<f32> {let y: f32=floor(index/dataTextureSize.x);let x: f32=index-y*dataTextureSize.x;return vec2f((x+0.5),(y+0.5));}
struct Splat {center: vec4f,
color: vec4f,
covA: vec4f,
covB: vec4f,
#if SH_DEGREE>0
sh0: vec4<u32>,
#endif
#if SH_DEGREE>1
sh1: vec4<u32>,
#endif
#if SH_DEGREE>2
sh2: vec4<u32>,
#endif
#if SH_DEGREE>3
sh3: vec4<u32>,
sh4: vec4<u32>,
#endif
#if IS_COMPOUND
partIndex: u32,
#endif
#if defined(IS_FOR_VOXELIZATION)
rotationA: vec4f,
rotationB: vec4f,
rotationScale: vec4f,
#endif
};fn getSplatIndex(localIndex: i32,splatIndex0: vec4f,splatIndex1: vec4f,splatIndex2: vec4f,splatIndex3: vec4f)->f32 {var splatIndex: f32;switch (localIndex)
{case 0:
{splatIndex=splatIndex0.x;break;}
case 1:
{splatIndex=splatIndex0.y;break;}
case 2:
{splatIndex=splatIndex0.z;break;}
case 3:
{splatIndex=splatIndex0.w;break;}
case 4:
{splatIndex=splatIndex1.x;break;}
case 5:
{splatIndex=splatIndex1.y;break;}
case 6:
{splatIndex=splatIndex1.z;break;}
case 7:
{splatIndex=splatIndex1.w;break;}
case 8:
{splatIndex=splatIndex2.x;break;}
case 9:
{splatIndex=splatIndex2.y;break;}
case 10:
{splatIndex=splatIndex2.z;break;}
case 11:
{splatIndex=splatIndex2.w;break;}
case 12:
{splatIndex=splatIndex3.x;break;}
case 13:
{splatIndex=splatIndex3.y;break;}
case 14:
{splatIndex=splatIndex3.z;break;}
default:
{splatIndex=splatIndex3.w;break;}}
return splatIndex;}
fn readSplat(splatIndex: f32,dataTextureSize: vec2f)->Splat {var splat: Splat;let splatUV=getDataUV(splatIndex,dataTextureSize);let splatUVi32=vec2<i32>(i32(splatUV.x),i32(splatUV.y));splat.center=textureLoad(centersTexture,splatUVi32,0);splat.color=textureLoad(colorsTexture,splatUVi32,0);
#if !defined(IS_FOR_VOXELIZATION)
splat.covA=textureLoad(covariancesATexture,splatUVi32,0)*splat.center.w;splat.covB=textureLoad(covariancesBTexture,splatUVi32,0)*splat.center.w;
#endif
#if SH_DEGREE>0
splat.sh0=textureLoad(shTexture0,splatUVi32,0);
#endif
#if SH_DEGREE>1
splat.sh1=textureLoad(shTexture1,splatUVi32,0);
#endif
#if SH_DEGREE>2
splat.sh2=textureLoad(shTexture2,splatUVi32,0);
#endif
#if SH_DEGREE>3
splat.sh3=textureLoad(shTexture3,splatUVi32,0);splat.sh4=textureLoad(shTexture4,splatUVi32,0);
#endif
#if IS_COMPOUND
splat.partIndex=u32(textureLoad(partIndicesTexture,splatUVi32,0).r*255.0+0.5);
#endif
#if defined(IS_FOR_VOXELIZATION)
splat.rotationA=textureLoad(rotationsATexture,splatUVi32,0);splat.rotationB=textureLoad(rotationsBTexture,splatUVi32,0);splat.rotationScale=textureLoad(rotationScaleTexture,splatUVi32,0);
#endif
return splat;}
fn computeColorFromSHDegree(dir: vec3f,sh: array<vec3<f32>,25>)->vec3f
{let SH_C0: f32=0.28209479;let SH_C1: f32=0.48860251;var SH_C2: array<f32,5>=array<f32,5>(
1.092548430,
-1.09254843,
0.315391565,
-1.09254843,
0.546274215
);var SH_C3: array<f32,7>=array<f32,7>(
-0.59004358,
2.890611442,
-0.45704579,
0.373176332,
-0.45704579,
1.445305721,
-0.59004358
);var SH_C4: array<f32,9>=array<f32,9>(
2.5033429418,
-1.7701307698,
0.9461746958,
-0.6690465436,
0.1057855469,
-0.6690465436,
0.4730873479,
-1.7701307698,
0.6258357354
);var result: vec3f=/*SH_C0**/sh[0];
#if SH_DEGREE>0
let x: f32=dir.x;let y: f32=dir.y;let z: f32=dir.z;result+=-SH_C1*y*sh[1]+SH_C1*z*sh[2]-SH_C1*x*sh[3];
#if SH_DEGREE>1
let xx: f32=x*x;let yy: f32=y*y;let zz: f32=z*z;let xy: f32=x*y;let yz: f32=y*z;let xz: f32=x*z;result +=
SH_C2[0]*xy*sh[4] +
SH_C2[1]*yz*sh[5] +
SH_C2[2]*(2.0f*zz-xx-yy)*sh[6] +
SH_C2[3]*xz*sh[7] +
SH_C2[4]*(xx-yy)*sh[8];
#if SH_DEGREE>2
result +=
SH_C3[0]*y*(3.0f*xx-yy)*sh[9] +
SH_C3[1]*xy*z*sh[10] +
SH_C3[2]*y*(4.0f*zz-xx-yy)*sh[11] +
SH_C3[3]*z*(2.0f*zz-3.0f*xx-3.0f*yy)*sh[12] +
SH_C3[4]*x*(4.0f*zz-xx-yy)*sh[13] +
SH_C3[5]*z*(xx-yy)*sh[14] +
SH_C3[6]*x*(xx-3.0f*yy)*sh[15];
#if SH_DEGREE>3
result +=
SH_C4[0]*x*y*(xx-yy)*sh[16] +
SH_C4[1]*y*z*(3.0f*xx-yy)*sh[17] +
SH_C4[2]*x*y*(7.0f*zz-1.0f)*sh[18] +
SH_C4[3]*y*z*(7.0f*zz-3.0f)*sh[19] +
SH_C4[4]*(zz*(35.0f*zz-30.0f)+3.0f)*sh[20] +
SH_C4[5]*x*z*(7.0f*zz-3.0f)*sh[21] +
SH_C4[6]*(xx-yy)*(7.0f*zz-1.0f)*sh[22] +
SH_C4[7]*x*z*(xx-3.0f*yy)*sh[23] +
SH_C4[8]*(xx*(xx-3.0f*yy)-yy*(3.0f*xx-yy))*sh[24];
#endif
#endif
#endif
#endif
return result;}
fn decompose(value: u32)->vec4f
{let components : vec4f=vec4f(
f32((value ) & 255u),
f32((value>>u32( 8)) & 255u),
f32((value>>u32(16)) & 255u),
f32((value>>u32(24)) & 255u));return components*vec4f(2./255.)-vec4f(1.);}
fn computeSH(splat: Splat,dir: vec3f)->vec3f
{var sh: array<vec3<f32>,25>;sh[0]=vec3f(0.,0.,0.);
#if SH_DEGREE>0
let sh00: vec4f=decompose(splat.sh0.x);let sh01: vec4f=decompose(splat.sh0.y);let sh02: vec4f=decompose(splat.sh0.z);sh[1]=vec3f(sh00.x,sh00.y,sh00.z);sh[2]=vec3f(sh00.w,sh01.x,sh01.y);sh[3]=vec3f(sh01.z,sh01.w,sh02.x);
#endif
#if SH_DEGREE>1
let sh03: vec4f=decompose(splat.sh0.w);let sh04: vec4f=decompose(splat.sh1.x);let sh05: vec4f=decompose(splat.sh1.y);sh[4]=vec3f(sh02.y,sh02.z,sh02.w);sh[5]=vec3f(sh03.x,sh03.y,sh03.z);sh[6]=vec3f(sh03.w,sh04.x,sh04.y);sh[7]=vec3f(sh04.z,sh04.w,sh05.x);sh[8]=vec3f(sh05.y,sh05.z,sh05.w);
#endif
#if SH_DEGREE>2
let sh06: vec4f=decompose(splat.sh1.z);let sh07: vec4f=decompose(splat.sh1.w);let sh08: vec4f=decompose(splat.sh2.x);let sh09: vec4f=decompose(splat.sh2.y);let sh10: vec4f=decompose(splat.sh2.z);let sh11: vec4f=decompose(splat.sh2.w);sh[9]=vec3f(sh06.x,sh06.y,sh06.z);sh[10]=vec3f(sh06.w,sh07.x,sh07.y);sh[11]=vec3f(sh07.z,sh07.w,sh08.x);sh[12]=vec3f(sh08.y,sh08.z,sh08.w);sh[13]=vec3f(sh09.x,sh09.y,sh09.z);sh[14]=vec3f(sh09.w,sh10.x,sh10.y);sh[15]=vec3f(sh10.z,sh10.w,sh11.x);
#endif
#if SH_DEGREE>3
let sh12: vec4f=decompose(splat.sh3.x);let sh13: vec4f=decompose(splat.sh3.y);let sh14: vec4f=decompose(splat.sh3.z);let sh15: vec4f=decompose(splat.sh3.w);let sh16: vec4f=decompose(splat.sh4.x);let sh17: vec4f=decompose(splat.sh4.y);sh[16]=vec3f(sh11.y,sh11.z,sh11.w);sh[17]=vec3f(sh12.x,sh12.y,sh12.z);sh[18]=vec3f(sh12.w,sh13.x,sh13.y);sh[19]=vec3f(sh13.z,sh13.w,sh14.x);sh[20]=vec3f(sh14.y,sh14.z,sh14.w);sh[21]=vec3f(sh15.x,sh15.y,sh15.z);sh[22]=vec3f(sh15.w,sh16.x,sh16.y);sh[23]=vec3f(sh16.z,sh16.w,sh17.x);sh[24]=vec3f(sh17.y,sh17.z,sh17.w);
#endif
return computeColorFromSHDegree(dir,sh);}
fn gaussianSplatting(
meshPos: vec2<f32>,
worldPos: vec3<f32>,
scale: vec2<f32>,
covA: vec3<f32>,
covB: vec3<f32>,
worldMatrix: mat4x4<f32>,
viewMatrix: mat4x4<f32>,
projectionMatrix: mat4x4<f32>,
focal: vec2f,
invViewport: vec2f,
kernelSize: f32
)->vec4f {let modelView=viewMatrix*worldMatrix;let camspace=viewMatrix*vec4f(worldPos,1.0);let pos2d=projectionMatrix*camspace;let bounds=1.2*pos2d.w;if (pos2d.z<0. || pos2d.x<-bounds || pos2d.x>bounds || pos2d.y<-bounds || pos2d.y>bounds) {return vec4f(0.0,0.0,2.0,1.0);}
let Vrk=mat3x3<f32>(
covA.x,covA.y,covA.z,
covA.y,covB.x,covB.y,
covA.z,covB.y,covB.z
);let isOrtho=abs(projectionMatrix[3][3]-1.0)<0.001;var J: mat3x3<f32>;if (isOrtho) {J=mat3x3<f32>(
focal.x,0.0,0.0,
0.0,focal.y,0.0,
0.0,0.0,0.0
);} else {J=mat3x3<f32>(
focal.x/camspace.z,0.0,-(focal.x*camspace.x)/(camspace.z*camspace.z),
0.0,focal.y/camspace.z,-(focal.y*camspace.y)/(camspace.z*camspace.z),
0.0,0.0,0.0
);}
let T=transpose(mat3x3<f32>(
modelView[0].xyz,
modelView[1].xyz,
modelView[2].xyz))*J;var cov2d=transpose(T)*Vrk*T;
#if COMPENSATION
let c00: f32=cov2d[0][0];let c11: f32=cov2d[1][1];let c01: f32=cov2d[0][1];let detOrig: f32=c00*c11-c01*c01;
#endif
cov2d[0][0]+=kernelSize;cov2d[1][1]+=kernelSize;
#if COMPENSATION
let c2d: vec3f=vec3f(cov2d[0][0],c01,cov2d[1][1]);let detBlur: f32=c2d.x*c2d.z-c2d.y*c2d.y;let compensation: f32=sqrt(max(0.,detOrig/detBlur));vertexOutputs.vColor.w*=compensation;
#endif
let mid=(cov2d[0][0]+cov2d[1][1])/2.0;let radius=length(vec2<f32>((cov2d[0][0]-cov2d[1][1])/2.0,cov2d[0][1]));let lambda1=mid+radius;let lambda2=mid-radius;if (lambda2<0.0) {return vec4f(0.0,0.0,2.0,1.0);}
let diagonalVector=normalize(vec2<f32>(cov2d[0][1],lambda1-cov2d[0][0]));let majorAxis=min(sqrt(2.0*lambda1),1024.0)*diagonalVector;let minorAxis=min(sqrt(2.0*lambda2),1024.0)*vec2<f32>(diagonalVector.y,-diagonalVector.x);let vCenter=vec2<f32>(pos2d.x,pos2d.y);let scaleFactor=select(pos2d.w,1.0,isOrtho);return vec4f(
vCenter+((meshPos.x*majorAxis+meshPos.y*minorAxis)*invViewport*scaleFactor)*scale,
pos2d.z,
pos2d.w
);}
#if IS_COMPOUND
fn getPartWorld(partIndex: u32)->mat4x4<f32> {return uniforms.partWorld[partIndex];}
#endif
#if defined(IS_FOR_VOXELIZATION)
fn computeVoxelSplatWorldPos(rotationA: vec4f,rotationB: vec4f,rotationScale: vec4f,center: vec3f,splatWorld: mat4x4f,viewMatrix: mat4x4f,invWorldScale: mat4x4f,quadPos: vec2f)->vec4f {let splatRotation=mat3x3f(
rotationA.xyz,
vec3f(rotationA.w,rotationB.x,rotationB.y),
vec3f(rotationB.z,rotationB.w,rotationScale.x)
);let splatScale=rotationScale.yzw;let view3x3=mat3x3f(viewMatrix[0].xyz,viewMatrix[1].xyz,viewMatrix[2].xyz);let invWorldScale3x3=mat3x3f(invWorldScale[0].xyz,invWorldScale[1].xyz,invWorldScale[2].xyz);let splatWorld3x3=mat3x3f(splatWorld[0].xyz,splatWorld[1].xyz,splatWorld[2].xyz);let rotToView=view3x3*invWorldScale3x3*splatWorld3x3*splatRotation;let axisLengthInViewZ=abs(vec3f(rotToView[0][2],rotToView[1][2],rotToView[2][2]));let gaussianSplatCutoffStddev: f32=0.7071067812; 
var offsetSplatSpace: vec3f;if (axisLengthInViewZ.x>axisLengthInViewZ.y && axisLengthInViewZ.x>axisLengthInViewZ.z) {offsetSplatSpace=vec3f(0.0,quadPos.x,quadPos.y)*splatScale*gaussianSplatCutoffStddev;} else if (axisLengthInViewZ.y>axisLengthInViewZ.z) {offsetSplatSpace=vec3f(quadPos.x,0.0,quadPos.y)*splatScale*gaussianSplatCutoffStddev;} else {offsetSplatSpace=vec3f(quadPos.x,quadPos.y,0.0)*splatScale*gaussianSplatCutoffStddev;}
let vertexObjectSpace=center+splatRotation*offsetSplatSpace;return splatWorld*vec4f(vertexObjectSpace,1.0);}
#endif
`;t.ShaderStore.IncludesShadersStoreWGSL[r]||(t.ShaderStore.IncludesShadersStoreWGSL[r]=i),e.s([])},461396,e=>{"use strict";var t=e.i(263537);e.i(243400),e.i(706568),e.i(738124),e.i(349e3),e.i(158271),e.i(357351),e.i(134302),e.i(84318),e.i(492952),e.i(505913);let r="gaussianSplattingVertexShader",i=`#include<sceneUboDeclaration>
#include<meshUboDeclaration>
#include<helperFunctions>
#include<clipPlaneVertexDeclaration>
#include<fogVertexDeclaration>
#include<logDepthDeclaration>
attribute splatIndex0: vec4f;attribute splatIndex1: vec4f;attribute splatIndex2: vec4f;attribute splatIndex3: vec4f;attribute position: vec3f;uniform invViewport: vec2f;uniform dataTextureSize: vec2f;uniform focal: vec2f;uniform kernelSize: f32;uniform eyePosition: vec3f;uniform alpha: f32;
#if IS_COMPOUND
uniform partWorld: array<mat4x4<f32>,MAX_PART_COUNT>;uniform partVisibility: array<f32,MAX_PART_COUNT>;
#endif
var covariancesATexture: texture_2d<f32>;var covariancesBTexture: texture_2d<f32>;var centersTexture: texture_2d<f32>;var colorsTexture: texture_2d<f32>;
#if SH_DEGREE>0
var shTexture0: texture_2d<u32>;
#endif
#if SH_DEGREE>1
var shTexture1: texture_2d<u32>;
#endif
#if SH_DEGREE>2
var shTexture2: texture_2d<u32>;
#endif
#if SH_DEGREE>3
var shTexture3: texture_2d<u32>;var shTexture4: texture_2d<u32>;
#endif
#if IS_COMPOUND
var partIndicesTexture: texture_2d<f32>;
#endif
varying vColor: vec4f;varying vPosition: vec2f;
#define CUSTOM_VERTEX_DEFINITIONS
#include<gaussianSplatting>
@vertex
fn main(input : VertexInputs)->FragmentInputs {
#define CUSTOM_VERTEX_MAIN_BEGIN
let splatIndex: f32=getSplatIndex(i32(vertexInputs.position.z+0.5),vertexInputs.splatIndex0,vertexInputs.splatIndex1,vertexInputs.splatIndex2,vertexInputs.splatIndex3);var splat: Splat=readSplat(splatIndex,uniforms.dataTextureSize);var covA: vec3f=splat.covA.xyz;var covB: vec3f=vec3f(splat.covA.w,splat.covB.xy);
#if IS_COMPOUND
let splatWorld: mat4x4f=getPartWorld(splat.partIndex);
#else
let splatWorld: mat4x4f=mesh.world;
#endif
let worldPos: vec4f=splatWorld*vec4f(splat.center.xyz,1.0);vertexOutputs.vPosition=vertexInputs.position.xy;
#if SH_DEGREE>0
let worldRot: mat3x3f= mat3x3f(splatWorld[0].xyz,splatWorld[1].xyz,splatWorld[2].xyz);let normWorldRot: mat3x3f=inverseMat3(worldRot);var eyeToSplatLocalSpace: vec3f=normalize(normWorldRot*(worldPos.xyz-uniforms.eyePosition.xyz));vertexOutputs.vColor=vec4f(splat.color.xyz+computeSH(splat,eyeToSplatLocalSpace),splat.color.w*uniforms.alpha);
#else
vertexOutputs.vColor=vec4f(splat.color.xyz,splat.color.w*uniforms.alpha);
#endif
#if IS_COMPOUND
vertexOutputs.vColor.w*=uniforms.partVisibility[splat.partIndex];
#endif
let scale: vec2f=vec2f(1.,1.);
#define CUSTOM_VERTEX_UPDATE
vertexOutputs.position=gaussianSplatting(vertexInputs.position.xy,worldPos.xyz,scale,covA,covB,splatWorld,scene.view,scene.projection,uniforms.focal,uniforms.invViewport,uniforms.kernelSize);
#include<clipPlaneVertex>
#include<fogVertex>
#include<logDepthVertex>
#define CUSTOM_VERTEX_MAIN_END
}
`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["gaussianSplattingVertexShaderWGSL",0,{name:r,shader:i}])},626293,e=>{"use strict";var t=e.i(263537);let r="shadowMapVertexMetric",i=`#if SM_USEDISTANCE==1
vertexOutputs.vPositionWSM=worldPos.xyz;
#endif
#if SM_DEPTHTEXTURE==1
#ifdef IS_NDC_HALF_ZRANGE
#define BIASFACTOR 0.5
#else
#define BIASFACTOR 1.0
#endif
#ifdef USE_REVERSE_DEPTHBUFFER
vertexOutputs.position.z-=uniforms.biasAndScaleSM.x*vertexOutputs.position.w*BIASFACTOR;
#else
vertexOutputs.position.z+=uniforms.biasAndScaleSM.x*vertexOutputs.position.w*BIASFACTOR;
#endif
#endif
#if defined(SM_DEPTHCLAMP) && SM_DEPTHCLAMP==1
vertexOutputs.zSM=vertexOutputs.position.z;vertexOutputs.position.z=0.0;
#elif SM_USEDISTANCE==0
#ifdef USE_REVERSE_DEPTHBUFFER
vertexOutputs.vDepthMetricSM=(-vertexOutputs.position.z+uniforms.depthValuesSM.x)/uniforms.depthValuesSM.y+uniforms.biasAndScaleSM.x;
#else
vertexOutputs.vDepthMetricSM=(vertexOutputs.position.z+uniforms.depthValuesSM.x)/uniforms.depthValuesSM.y+uniforms.biasAndScaleSM.x;
#endif
#endif
`;t.ShaderStore.IncludesShadersStoreWGSL[r]||(t.ShaderStore.IncludesShadersStoreWGSL[r]=i),e.s(["shadowMapVertexMetricWGSL",0,{name:r,shader:i}])},426013,e=>{"use strict";var t=e.i(263537);e.i(407892),e.i(380244),e.i(585817),e.i(945868),e.i(738124),e.i(243400),e.i(706568);let r="shadowMapVertexExtraDeclaration",i=`#if SM_NORMALBIAS==1
uniform lightDataSM: vec3f;
#endif
uniform biasAndScaleSM: vec3f;uniform depthValuesSM: vec2f;varying vDepthMetricSM: f32;
#if SM_USEDISTANCE==1
varying vPositionWSM: vec3f;
#endif
#if defined(SM_DEPTHCLAMP) && SM_DEPTHCLAMP==1
varying zSM: f32;
#endif
`;t.ShaderStore.IncludesShadersStoreWGSL[r]||(t.ShaderStore.IncludesShadersStoreWGSL[r]=i),e.i(349e3),e.i(988389),e.i(431235),e.i(300889),e.i(398879),e.i(92372);let a="shadowMapVertexNormalBias",o=`#if SM_NORMALBIAS==1
#if SM_DIRECTIONINLIGHTDATA==1
var worldLightDirSM: vec3f=normalize(-uniforms.lightDataSM.xyz);
#else
var directionToLightSM: vec3f=uniforms.lightDataSM.xyz-worldPos.xyz;var worldLightDirSM: vec3f=normalize(directionToLightSM);
#endif
var ndlSM: f32=dot(vNormalW,worldLightDirSM);var sinNLSM: f32=sqrt(1.0-ndlSM*ndlSM);var normalBiasSM: f32=uniforms.biasAndScaleSM.y*sinNLSM;worldPos=vec4f(worldPos.xyz-vNormalW*normalBiasSM,worldPos.w);
#endif
`;t.ShaderStore.IncludesShadersStoreWGSL[a]||(t.ShaderStore.IncludesShadersStoreWGSL[a]=o),e.i(626293),e.i(84318);let n="shadowMapVertexShader",s=`attribute position: vec3f;
#ifdef NORMAL
attribute normal: vec3f;
#endif
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]
#ifdef INSTANCES
attribute world0: vec4f;attribute world1: vec4f;attribute world2: vec4f;attribute world3: vec4f;
#endif
#include<helperFunctions>
#include<sceneUboDeclaration>
#include<meshUboDeclaration>
#ifdef ALPHATEXTURE
varying vUV: vec2f;uniform diffuseMatrix: mat4x4f;
#ifdef UV1
attribute uv: vec2f;
#endif
#ifdef UV2
attribute uv2: vec2f;
#endif
#endif
#include<shadowMapVertexExtraDeclaration>
#include<clipPlaneVertexDeclaration>
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input : VertexInputs)->FragmentInputs {var positionUpdated: vec3f=vertexInputs.position;
#ifdef UV1
var uvUpdated: vec2f=vertexInputs.uv;
#endif
#ifdef UV2
var uv2Updated: vec2f=vertexInputs.uv2;
#endif
#ifdef NORMAL
var normalUpdated: vec3f=vertexInputs.normal;
#endif
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
var worldPos: vec4f=finalWorld* vec4f(positionUpdated,1.0);
#ifdef NORMAL
var normWorldSM: mat3x3f= mat3x3f(finalWorld[0].xyz,finalWorld[1].xyz,finalWorld[2].xyz);
#if defined(INSTANCES) && defined(THIN_INSTANCES)
var vNormalW: vec3f=normalUpdated/ vec3f(dot(normWorldSM[0],normWorldSM[0]),dot(normWorldSM[1],normWorldSM[1]),dot(normWorldSM[2],normWorldSM[2]));vNormalW=normalize(normWorldSM*vNormalW);
#else
#ifdef NONUNIFORMSCALING
normWorldSM=transposeMat3(inverseMat3(normWorldSM));
#endif
var vNormalW: vec3f=normalize(normWorldSM*normalUpdated);
#endif
#endif
#include<shadowMapVertexNormalBias>
vertexOutputs.position=scene.viewProjection*worldPos;
#include<shadowMapVertexMetric>
#ifdef ALPHATEXTURE
#ifdef UV1
vertexOutputs.vUV= (uniforms.diffuseMatrix* vec4f(uvUpdated,1.0,0.0)).xy;
#endif
#ifdef UV2
vertexOutputs.vUV= (uniforms.diffuseMatrix* vec4f(uv2Updated,1.0,0.0)).xy;
#endif
#endif
#include<clipPlaneVertex>
}`;t.ShaderStore.ShadersStoreWGSL[n]||(t.ShaderStore.ShadersStoreWGSL[n]=s),e.s(["shadowMapVertexShaderWGSL",0,{name:n,shader:s}],426013)},390730,631084,e=>{"use strict";var t=e.i(213361);function r(e){return e.split(" ").filter(e=>""!==e).map(e=>parseFloat(e))}function i(e,t,i){for(;i.length!==t;){let t=r(e.lines[e.index++]);i.push(...t)}}function a(e){let a={lines:new TextDecoder("utf-8").decode(e).split("\n"),index:0},o={version:a.lines[0],candelaValues:[],horizontalAngles:[],verticalAngles:[],numberOfHorizontalAngles:0,numberOfVerticalAngles:0};for(a.index=1;a.lines.length>0&&!a.lines[a.index].includes("TILT=");)a.index++;a.lines[a.index].includes("INCLUDE"),a.index++;let n=r(a.lines[a.index++]);o.numberOfLights=n[0],o.lumensPerLamp=n[1],o.candelaMultiplier=n[2],o.numberOfVerticalAngles=n[3],o.numberOfHorizontalAngles=n[4],o.photometricType=n[5],o.unitsType=n[6],o.width=n[7],o.length=n[8],o.height=n[9];let s=r(a.lines[a.index++]);o.ballastFactor=s[0],o.fileGenerationType=s[1],o.inputWatts=s[2];for(let e=0;e<o.numberOfHorizontalAngles;e++)o.candelaValues[e]=[];i(a,o.numberOfVerticalAngles,o.verticalAngles),i(a,o.numberOfHorizontalAngles,o.horizontalAngles);for(let e=0;e<o.numberOfHorizontalAngles;e++)i(a,o.numberOfVerticalAngles,o.candelaValues[e]);let l=-1;for(let e=0;e<o.numberOfHorizontalAngles;e++)for(let t=0;t<o.numberOfVerticalAngles;t++)o.candelaValues[e][t]*=o.candelaValues[e][t]*o.candelaMultiplier*o.ballastFactor*o.fileGenerationType,l=Math.max(l,o.candelaValues[e][t]);if(l>0)for(let e=0;e<o.numberOfHorizontalAngles;e++)for(let t=0;t<o.numberOfVerticalAngles;t++)o.candelaValues[e][t]/=l;let f=new Float32Array(64800),c=o.horizontalAngles[0],d=o.horizontalAngles[o.numberOfHorizontalAngles-1];for(let e=0;e<64800;e++){let r=e%360,i=Math.floor(e/360);d-c!=0&&(r<c||r>=d)&&(r%=2*d)>d&&(r=2*d-r),f[i+180*r]=function(e,r,i){let a=0,o=0,n=0,s=0,l=0,f=0;for(let t=0;t<e.numberOfHorizontalAngles-1;t++)if(i<e.horizontalAngles[t+1]||t===e.numberOfHorizontalAngles-2){o=t,n=e.horizontalAngles[t],s=e.horizontalAngles[t+1];break}for(let t=0;t<e.numberOfVerticalAngles-1;t++)if(r<e.verticalAngles[t+1]||t===e.numberOfVerticalAngles-2){a=t,l=e.verticalAngles[t],f=e.verticalAngles[t+1];break}let c=s-n,d=f-l;if(0===d)return 0;let u=0===c?0:(i-n)/c,m=(r-l)/d,p=0===c?o:o+1,v=(0,t.Lerp)(e.candelaValues[o][a],e.candelaValues[p][a],u),S=(0,t.Lerp)(e.candelaValues[o][a+1],e.candelaValues[p][a+1],u);return(0,t.Lerp)(v,S,m)}(o,i,r)}return{width:180,height:1,data:f}}e.s(["LoadIESData",0,a],631084),e.s(["_IESTextureLoader",0,class{constructor(){this.supportCascades=!1}loadCubeData(){throw".ies not supported in Cube."}loadData(e,t,r){let i=a(new Uint8Array(e.buffer,e.byteOffset,e.byteLength));r(i.width,i.height,!!t.useMipMaps,!1,()=>{let e=t.getEngine();t.type=1,t.format=6,t._gammaSpace=!1,e._uploadDataToTextureDirectly(t,i.data)})}}],390730)},436813,e=>{"use strict";var t=e.i(263537);let r="boundingBoxRendererVertexDeclaration",i=`uniform mat4 world;uniform mat4 viewProjection;
#ifdef MULTIVIEW
uniform mat4 viewProjectionR;
#endif
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.i(444e3);let a="boundingBoxRendererVertexShader",o=`attribute vec3 position;
#include<__decl__boundingBoxRendererVertex>
#ifdef INSTANCES
attribute vec4 world0;attribute vec4 world1;attribute vec4 world2;attribute vec4 world3;
#endif
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
#ifdef INSTANCES
mat4 finalWorld=mat4(world0,world1,world2,world3);vec4 worldPos=finalWorld*vec4(position,1.0);
#else
vec4 worldPos=world*vec4(position,1.0);
#endif
#ifdef MULTIVIEW
if (gl_ViewID_OVR==0u) {gl_Position=viewProjection*worldPos;} else {gl_Position=viewProjectionR*worldPos;}
#else
gl_Position=viewProjection*worldPos;
#endif
#define CUSTOM_VERTEX_MAIN_END
}
`;t.ShaderStore.ShadersStore[a]||(t.ShaderStore.ShadersStore[a]=o),e.s(["boundingBoxRendererVertexShader",0,{name:a,shader:o}],436813)},797367,e=>{"use strict";var t=e.i(440163),r=e.i(916624),i=e.i(774685),a=e.i(774100),o=e.i(711835);class n extends t.FlowGraphBlock{constructor(e){super(e),this.config=e,this.array=this.registerDataInput("array",r.RichTypeAny),this.index=this.registerDataInput("index",r.RichTypeAny,new a.FlowGraphInteger(-1)),this.value=this.registerDataOutput("value",r.RichTypeAny)}_updateOutputs(e){let t=this.array.getValue(e),r=(0,o.getNumericValue)(this.index.getValue(e));t&&r>=0&&r<t.length?this.value.setValue(t[r],e):this.value.setValue(null,e)}serialize(e){super.serialize(e)}getClassName(){return"FlowGraphArrayIndexBlock"}}(0,i.RegisterClass)("FlowGraphArrayIndexBlock",n),e.s(["FlowGraphArrayIndexBlock",0,n])},109742,e=>{"use strict";var t=e.i(263537);let r="layerVertexShader",i=`attribute position: vec2f;uniform scale: vec2f;uniform offset: vec2f;uniform textureMatrix: mat4x4f;varying vUV: vec2f;const madd: vec2f= vec2f(0.5,0.5);
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input : VertexInputs)->FragmentInputs {
#define CUSTOM_VERTEX_MAIN_BEGIN
var shiftedPosition: vec2f=vertexInputs.position*uniforms.scale+uniforms.offset;vertexOutputs.vUV=(uniforms.textureMatrix* vec4f(shiftedPosition*madd+madd,1.0,0.0)).xy;vertexOutputs.position= vec4f(shiftedPosition,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["layerVertexShaderWGSL",0,{name:r,shader:i}])},794011,e=>{"use strict";var t=e.i(263537);let r="displayPassPixelShader",i=`varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;var passSamplerSampler: sampler;var passSampler: texture_2d<f32>;
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {fragmentOutputs.color=textureSample(passSampler,passSamplerSampler,input.vUV);}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["displayPassPixelShaderWGSL",0,{name:r,shader:i}])},745078,e=>{"use strict";var t=e.i(263537);let r="lensFlareVertexShader",i=`attribute position: vec2f;uniform viewportMatrix: mat4x4f;varying vUV: vec2f;const madd: vec2f= vec2f(0.5,0.5);
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input : VertexInputs)->FragmentInputs {
#define CUSTOM_VERTEX_MAIN_BEGIN
vertexOutputs.vUV=vertexInputs.position*madd+madd;vertexOutputs.position=uniforms.viewportMatrix* vec4f(vertexInputs.position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["lensFlareVertexShaderWGSL",0,{name:r,shader:i}])},844037,e=>{"use strict";var t=e.i(263537);let r="lensFlarePixelShader",i=`varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;uniform color: vec4f;
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
var baseColor: vec4f=textureSample(textureSampler,textureSamplerSampler,input.vUV);fragmentOutputs.color=baseColor*uniforms.color;
#define CUSTOM_FRAGMENT_MAIN_END
}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["lensFlarePixelShaderWGSL",0,{name:r,shader:i}])},816791,e=>{"use strict";var t=e.i(868738),r=e.i(774685),i=e.i(916624);class a extends t.FlowGraphEventBlock{constructor(e){super(e),this.config=e,this.body=this.registerDataInput("body",i.RichTypeAny),this.otherBody=this.registerDataOutput("otherBody",i.RichTypeAny),this.point=this.registerDataOutput("point",i.RichTypeVector3),this.normal=this.registerDataOutput("normal",i.RichTypeVector3),this.impulse=this.registerDataOutput("impulse",i.RichTypeNumber),this.distance=this.registerDataOutput("distance",i.RichTypeNumber)}_preparePendingTasks(e){let t=this.body.getValue(e);if(!t)return void this._reportError(e,"No physics body provided for collision event");t.setCollisionCallbackEnabled(!0);let r=t.getCollisionObservable().add(t=>{this._onCollision(e,t)});e._setExecutionVariable(this,"_collisionObserver",r),e._setExecutionVariable(this,"_subscribedBody",t)}_onCollision(e,t){let r=this.body.getValue(e),i=t.collider===r?t.collidedAgainst:t.collider;this.otherBody.setValue(i,e),t.point&&this.point.setValue(t.point,e),t.normal&&this.normal.setValue(t.normal,e),this.impulse.setValue(t.impulse,e),this.distance.setValue(t.distance,e),this._execute(e)}_executeEvent(e,t){return!0}_cancelPendingTasks(e){let t=e._getExecutionVariable(this,"_collisionObserver",null),r=e._getExecutionVariable(this,"_subscribedBody",null);if(t&&r){let e=r.getCollisionObservable();e.remove(t),e.hasObservers()||r.setCollisionCallbackEnabled(!1)}e._setExecutionVariable(this,"_collisionObserver",null),e._setExecutionVariable(this,"_subscribedBody",null)}getClassName(){return"FlowGraphPhysicsCollisionEventBlock"}}(0,r.RegisterClass)("FlowGraphPhysicsCollisionEventBlock",a),e.s(["FlowGraphPhysicsCollisionEventBlock",0,a])},294350,e=>{"use strict";var t=e.i(774685),r=e.i(303663),i=e.i(916624),a=e.i(774100);class o extends r.FlowGraphExecutionBlock{constructor(e){super(e),this.config=e,this.outputSignals=[],this.reset=this._registerSignalInput("reset"),this.lastIndex=this.registerDataOutput("lastIndex",i.RichTypeFlowGraphInteger,new a.FlowGraphInteger(-1)),this.setNumberOfOutputSignals(e?.outputSignalCount)}_getNextIndex(e){if(!e.includes(!1)&&this.config.isLoop&&e.fill(!1),!this.config.isRandom)return e.indexOf(!1);{let t=e.map((e,t)=>e?-1:t).filter(e=>-1!==e);return t.length?t[Math.floor(Math.random()*t.length)]:-1}}setNumberOfOutputSignals(e=1){for(;this.outputSignals.length>e;){let e=this.outputSignals.pop();e&&(e.disconnectFromAll(),this._unregisterSignalOutput(e.name))}for(;this.outputSignals.length<e;)this.outputSignals.push(this._registerSignalOutput(`out_${this.outputSignals.length}`))}_execute(e,t){if(e._hasExecutionVariable(this,"indexesUsed")||e._setExecutionVariable(this,"indexesUsed",this.outputSignals.map(()=>!1)),t===this.reset){e._deleteExecutionVariable(this,"indexesUsed"),this.lastIndex.setValue(new a.FlowGraphInteger(-1),e);return}let r=e._getExecutionVariable(this,"indexesUsed",[]),i=this._getNextIndex(r);i>-1&&(this.lastIndex.setValue(new a.FlowGraphInteger(i),e),r[i]=!0,e._setExecutionVariable(this,"indexesUsed",r),this.outputSignals[i]._activateSignal(e))}getClassName(){return"FlowGraphMultiGateBlock"}serialize(e){super.serialize(e),e.config.outputSignalCount=this.config.outputSignalCount,e.config.isRandom=this.config.isRandom,e.config.loop=this.config.isLoop,e.config.startIndex=this.config.startIndex}}(0,t.RegisterClass)("FlowGraphMultiGateBlock",o),e.s(["FlowGraphMultiGateBlock",0,o])},909103,214390,e=>{"use strict";var t=e.i(774100),r=e.i(916624);let i=new RegExp(/\/\{(\w+)\}(?=\/|$)/g);class a{constructor(e,a){this.path=e,this.ownerBlock=a,this.templatedInputs=[];let o=i.exec(e);const n=new Set;for(;o;){const[,s]=o;if(n.has(s))throw Error("Duplicate template variable detected.");n.add(s),this.templatedInputs.push(a.registerDataInput(s,r.RichTypeFlowGraphInteger,new t.FlowGraphInteger(0))),o=i.exec(e)}}getAccessor(e,t){let r=this.path;for(let e of this.templatedInputs){let i=e.getValue(t).value;if("number"!=typeof i||i<0)throw Error("Invalid value for templated input.");r=r.replace(`{${e.name}}`,i.toString())}return e.convert(r)}}e.s(["FlowGraphPathConverterComponent",0,a],214390);var o=e.i(774685),n=e.i(202286),s=e.i(788601),l=e.i(196548);class f extends l.FlowGraphCachedOperationBlock{constructor(e){super(r.RichTypeAny,e),this.config=e,this.object=this.registerDataOutput("object",r.RichTypeAny),this.propertyName=this.registerDataOutput("propertyName",r.RichTypeAny),this.setterFunction=this.registerDataOutput("setFunction",r.RichTypeAny,this._setPropertyValue.bind(this)),this.getterFunction=this.registerDataOutput("getFunction",r.RichTypeAny,this._getPropertyValue.bind(this)),this.generateAnimationsFunction=this.registerDataOutput("generateAnimationsFunction",r.RichTypeAny,this._getInterpolationAnimationPropertyInfo.bind(this)),this.templateComponent=new a(e.jsonPointer,this)}_doOperation(e){let t=this.templateComponent.getAccessor(this.config.pathConverter,e),r=t.info.get(t.object),i=t.info.getTarget?.(t.object),a=t.info.getPropertyName?.[0](t.object);if(i)this.object.setValue(i,e),a&&this.propertyName.setValue(a,e);else throw Error("Object is undefined");return r}_setPropertyValue(e,t,r,i){let a=this.templateComponent.getAccessor(this.config.pathConverter,i),o=a.info.type;o.startsWith("Color")&&(r=c(r,o)),a.info.set?.(r,a.object)}_getPropertyValue(e,t,r){let i=this.templateComponent.getAccessor(this.config.pathConverter,r),a=i.info.type,o=i.info.get(i.object);return a.startsWith("Color")?function(e){if(e instanceof s.Color3)return new n.Vector3(e.r,e.g,e.b);if(e instanceof s.Color4)return new n.Vector4(e.r,e.g,e.b,e.a);throw Error("Invalid color type")}(o):o}_getInterpolationAnimationPropertyInfo(e,t,r){let i=this.templateComponent.getAccessor(this.config.pathConverter,r);return(e,t,r,a)=>{let o=[],n=i.info.type;return n.startsWith("Color")&&(e=e.map(e=>({frame:e.frame,value:c(e.value,n)}))),i.info.interpolation?.forEach((t,n)=>{let s=i.info.getPropertyName?.[n](i.object)||"Animation-interpolation-"+n,l=e;for(let n of(r!==t.type&&(l=e.map(e=>({frame:e.frame,value:t.getValue(void 0,e.value.asArray?e.value.asArray():[e.value],0,1)}))),t.buildAnimations(i.object,s,60,l)))a&&n.babylonAnimation.setEasingFunction(a),o.push(n.babylonAnimation)}),o}}getClassName(){return"FlowGraphJsonPointerParserBlock"}}function c(e,t){return e.getClassName().startsWith("Color")?e:"Color3"===t?new s.Color3(e.x,e.y,e.z):"Color4"===t?new s.Color4(e.x,e.y,e.z,e.w):e}(0,o.RegisterClass)("FlowGraphJsonPointerParserBlock",f),e.s(["FlowGraphJsonPointerParserBlock",0,f],909103)},524750,e=>{"use strict";var t=e.i(263537);let r="fxaaPixelShader",i=`varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;uniform texelSize: vec2f;varying sampleCoordS: vec2f;varying sampleCoordE: vec2f;varying sampleCoordN: vec2f;varying sampleCoordW: vec2f;varying sampleCoordNW: vec2f;varying sampleCoordSE: vec2f;varying sampleCoordNE: vec2f;varying sampleCoordSW: vec2f;const fxaaQualitySubpix: f32=1.0;const fxaaQualityEdgeThreshold: f32=0.166;const fxaaQualityEdgeThresholdMin: f32=0.0833;const kLumaCoefficients: vec3f= vec3f(0.2126,0.7152,0.0722);fn FxaaLuma(rgba: vec4f)->f32 {return dot(rgba.rgb,kLumaCoefficients);} 
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var posM: vec2f;posM.x=input.vUV.x;posM.y=input.vUV.y;var rgbyM: vec4f=textureSampleLevel(textureSampler,textureSamplerSampler,input.vUV,0.0);var lumaM: f32=FxaaLuma(rgbyM);var lumaS: f32=FxaaLuma(textureSampleLevel(textureSampler,textureSamplerSampler,input.sampleCoordS,0.0));var lumaE: f32=FxaaLuma(textureSampleLevel(textureSampler,textureSamplerSampler,input.sampleCoordE,0.0));var lumaN: f32=FxaaLuma(textureSampleLevel(textureSampler,textureSamplerSampler,input.sampleCoordN,0.0));var lumaW: f32=FxaaLuma(textureSampleLevel(textureSampler,textureSamplerSampler,input.sampleCoordW,0.0));var maxSM: f32=max(lumaS,lumaM);var minSM: f32=min(lumaS,lumaM);var maxESM: f32=max(lumaE,maxSM);var minESM: f32=min(lumaE,minSM);var maxWN: f32=max(lumaN,lumaW);var minWN: f32=min(lumaN,lumaW);var rangeMax: f32=max(maxWN,maxESM);var rangeMin: f32=min(minWN,minESM);var rangeMaxScaled: f32=rangeMax*fxaaQualityEdgeThreshold;var range: f32=rangeMax-rangeMin;var rangeMaxClamped: f32=max(fxaaQualityEdgeThresholdMin,rangeMaxScaled);
#ifndef MALI
if(range<rangeMaxClamped) 
{fragmentOutputs.color=rgbyM;return fragmentOutputs;}
#endif
var lumaNW: f32=FxaaLuma(textureSampleLevel(textureSampler,textureSamplerSampler,input.sampleCoordNW,0.0));var lumaSE: f32=FxaaLuma(textureSampleLevel(textureSampler,textureSamplerSampler,input.sampleCoordSE,0.0));var lumaNE: f32=FxaaLuma(textureSampleLevel(textureSampler,textureSamplerSampler,input.sampleCoordNE,0.0));var lumaSW: f32=FxaaLuma(textureSampleLevel(textureSampler,textureSamplerSampler,input.sampleCoordSW,0.0));var lumaNS: f32=lumaN+lumaS;var lumaWE: f32=lumaW+lumaE;var subpixRcpRange: f32=1.0/range;var subpixNSWE: f32=lumaNS+lumaWE;var edgeHorz1: f32=(-2.0*lumaM)+lumaNS;var edgeVert1: f32=(-2.0*lumaM)+lumaWE;var lumaNESE: f32=lumaNE+lumaSE;var lumaNWNE: f32=lumaNW+lumaNE;var edgeHorz2: f32=(-2.0*lumaE)+lumaNESE;var edgeVert2: f32=(-2.0*lumaN)+lumaNWNE;var lumaNWSW: f32=lumaNW+lumaSW;var lumaSWSE: f32=lumaSW+lumaSE;var edgeHorz4: f32=(abs(edgeHorz1)*2.0)+abs(edgeHorz2);var edgeVert4: f32=(abs(edgeVert1)*2.0)+abs(edgeVert2);var edgeHorz3: f32=(-2.0*lumaW)+lumaNWSW;var edgeVert3: f32=(-2.0*lumaS)+lumaSWSE;var edgeHorz: f32=abs(edgeHorz3)+edgeHorz4;var edgeVert: f32=abs(edgeVert3)+edgeVert4;var subpixNWSWNESE: f32=lumaNWSW+lumaNESE;var lengthSign: f32=uniforms.texelSize.x;var horzSpan: bool=edgeHorz>=edgeVert;var subpixA: f32=subpixNSWE*2.0+subpixNWSWNESE;if (!horzSpan)
{lumaN=lumaW;}
if (!horzSpan) 
{lumaS=lumaE;}
if (horzSpan) 
{lengthSign=uniforms.texelSize.y;}
var subpixB: f32=(subpixA*(1.0/12.0))-lumaM;var gradientN: f32=lumaN-lumaM;var gradientS: f32=lumaS-lumaM;var lumaNN: f32=lumaN+lumaM;var lumaSS: f32=lumaS+lumaM;var pairN: bool=abs(gradientN)>=abs(gradientS);var gradient: f32=max(abs(gradientN),abs(gradientS));if (pairN)
{lengthSign=-lengthSign;}
var subpixC: f32=clamp(abs(subpixB)*subpixRcpRange,0.0,1.0);var posB: vec2f;posB.x=posM.x;posB.y=posM.y;var offNP: vec2f;offNP.x=select(uniforms.texelSize.x,0.0,(!horzSpan));offNP.y=select(uniforms.texelSize.y,0.0,(horzSpan));if (!horzSpan) 
{posB.x+=lengthSign*0.5;}
if (horzSpan)
{posB.y+=lengthSign*0.5;}
var posN: vec2f;posN.x=posB.x-offNP.x*1.5;posN.y=posB.y-offNP.y*1.5;var posP: vec2f;posP.x=posB.x+offNP.x*1.5;posP.y=posB.y+offNP.y*1.5;var subpixD: f32=((-2.0)*subpixC)+3.0;var lumaEndN: f32=FxaaLuma(textureSampleLevel(textureSampler,textureSamplerSampler,posN,0.0));var subpixE: f32=subpixC*subpixC;var lumaEndP: f32=FxaaLuma(textureSampleLevel(textureSampler,textureSamplerSampler,posP,0.0));if (!pairN) 
{lumaNN=lumaSS;}
var gradientScaled: f32=gradient*1.0/4.0;var lumaMM: f32=lumaM-lumaNN*0.5;var subpixF: f32=subpixD*subpixE;var lumaMLTZero: bool=lumaMM<0.0;lumaEndN-=lumaNN*0.5;lumaEndP-=lumaNN*0.5;var doneN: bool=abs(lumaEndN)>=gradientScaled;var doneP: bool=abs(lumaEndP)>=gradientScaled;if (!doneN) 
{posN.x-=offNP.x*3.0;}
if (!doneN) 
{posN.y-=offNP.y*3.0;}
var doneNP: bool=(!doneN) || (!doneP);if (!doneP) 
{posP.x+=offNP.x*3.0;}
if (!doneP)
{posP.y+=offNP.y*3.0;}
if (doneNP)
{if (!doneN) {lumaEndN=FxaaLuma(textureSampleLevel(textureSampler,textureSamplerSampler,posN.xy,0.0));}
if (!doneP) {lumaEndP=FxaaLuma(textureSampleLevel(textureSampler,textureSamplerSampler,posP.xy,0.0));}
if (!doneN) {lumaEndN=lumaEndN-lumaNN*0.5;}
if (!doneP) {lumaEndP=lumaEndP-lumaNN*0.5;}
doneN=abs(lumaEndN)>=gradientScaled;doneP=abs(lumaEndP)>=gradientScaled;if (!doneN) {posN.x-=offNP.x*12.0;}
if (!doneN) {posN.y-=offNP.y*12.0;}
doneNP=(!doneN) || (!doneP);if (!doneP) {posP.x+=offNP.x*12.0;}
if (!doneP) {posP.y+=offNP.y*12.0;}}
var dstN: f32=posM.x-posN.x;var dstP: f32=posP.x-posM.x;if (!horzSpan)
{dstN=posM.y-posN.y;}
if (!horzSpan) 
{dstP=posP.y-posM.y;}
var goodSpanN: bool=(lumaEndN<0.0) != lumaMLTZero;var spanLength: f32=(dstP+dstN);var goodSpanP: bool=(lumaEndP<0.0) != lumaMLTZero;var spanLengthRcp: f32=1.0/spanLength;var directionN: bool=dstN<dstP;var dst: f32=min(dstN,dstP);var goodSpan: bool=select(goodSpanP,goodSpanN,directionN);var subpixG: f32=subpixF*subpixF;var pixelOffset: f32=(dst*(-spanLengthRcp))+0.5;var subpixH: f32=subpixG*fxaaQualitySubpix;var pixelOffsetGood: f32=select(0.0,pixelOffset,goodSpan);var pixelOffsetSubpix: f32=max(pixelOffsetGood,subpixH);if (!horzSpan)
{posM.x+=pixelOffsetSubpix*lengthSign;}
if (horzSpan)
{posM.y+=pixelOffsetSubpix*lengthSign;}
#ifdef MALI
if(range<rangeMaxClamped) 
{fragmentOutputs.color=rgbyM;}
else
{fragmentOutputs.color=textureSampleLevel(textureSampler,textureSamplerSampler,posM,0.0);}
#else
fragmentOutputs.color=textureSampleLevel(textureSampler,textureSamplerSampler,posM,0.0);
#endif
}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["fxaaPixelShaderWGSL",0,{name:r,shader:i}])},859826,e=>{"use strict";var t=e.i(263537);let r="bloomMergePixelShader",i=`uniform sampler2D textureSampler;uniform sampler2D bloomBlur;varying vec2 vUV;uniform float bloomWeight;
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void)
{gl_FragColor=texture2D(textureSampler,vUV);vec3 blurred=texture2D(bloomBlur,vUV).rgb;gl_FragColor.rgb=gl_FragColor.rgb+(blurred.rgb*bloomWeight); }
`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["bloomMergePixelShader",0,{name:r,shader:i}])},125905,e=>{"use strict";var t=e.i(263537);let r="hdrIrradianceFilteringVertexShader",i=`attribute vec2 position;varying vec3 direction;uniform vec3 up;uniform vec3 right;uniform vec3 front;
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
mat3 view=mat3(up,right,front);direction=view*vec3(position,1.0);gl_Position=vec4(position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["hdrIrradianceFilteringVertexShader",0,{name:r,shader:i}])},649818,e=>{"use strict";var t=e.i(263537);let r="hdrFilteringVertexShader",i=`attribute position: vec2f;varying direction: vec3f;uniform up: vec3f;uniform right: vec3f;uniform front: vec3f;
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input : VertexInputs)->FragmentInputs {
#define CUSTOM_VERTEX_MAIN_BEGIN
var view: mat3x3f= mat3x3f(uniforms.up,uniforms.right,uniforms.front);vertexOutputs.direction=view*vec3f(vertexInputs.position,1.0);vertexOutputs.position= vec4f(vertexInputs.position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["hdrFilteringVertexShaderWGSL",0,{name:r,shader:i}])},702218,e=>{"use strict";var t=e.i(263537);let r="copyTexture3DLayerToTexturePixelShader",i=`precision highp sampler3D;uniform sampler3D textureSampler;uniform int layerNum;varying vec2 vUV;void main(void) {vec3 coord=vec3(0.0,0.0,float(layerNum));coord.xy=vec2(vUV.x,vUV.y)*vec2(textureSize(textureSampler,0).xy);vec3 color=texelFetch(textureSampler,ivec3(coord),0).rgb;gl_FragColor=vec4(color,1);}
`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["copyTexture3DLayerToTexturePixelShader",0,{name:r,shader:i}])},212902,e=>{"use strict";var t=e.i(353679),r=e.i(916624),i=e.i(774685);class a extends t.FlowGraphExecutionBlockWithOutSignal{constructor(e){super(e),this.body=this.registerDataInput("body",r.RichTypeAny),this.velocity=this.registerDataInput("velocity",r.RichTypeVector3)}_execute(e,t){let r=this.body.getValue(e);if(!r){this._reportError(e,"No physics body provided"),this.out._activateSignal(e);return}r.setLinearVelocity(this.velocity.getValue(e)),this.out._activateSignal(e)}getClassName(){return"FlowGraphSetLinearVelocityBlock"}}(0,i.RegisterClass)("FlowGraphSetLinearVelocityBlock",a),e.s(["FlowGraphSetLinearVelocityBlock",0,a])},387649,e=>{"use strict";var t=e.i(263537);let r="bilateralBlurQualityPixelShader",i=`uniform sampler2D textureSampler;uniform sampler2D depthSampler;uniform sampler2D normalSampler;uniform int filterSize;uniform vec2 blurDir;uniform float depthThreshold;uniform float normalThreshold;varying vec2 vUV;void main(void) {vec3 color=textureLod(textureSampler,vUV,0.).rgb;float depth=textureLod(depthSampler,vUV,0.).x;if (depth>=1e6 || depth<=0.) {glFragColor=vec4(color,1.);return;}
vec3 normal=textureLod(normalSampler,vUV,0.).rgb;
#ifdef DECODE_NORMAL
normal=normal*2.0-1.0;
#endif
float sigma=float(filterSize);float two_sigma2=2.0*sigma*sigma;float sigmaDepth=depthThreshold;float two_sigmaDepth2=2.0*sigmaDepth*sigmaDepth;float sigmaNormal=normalThreshold;float two_sigmaNormal2=2.0*sigmaNormal*sigmaNormal;vec3 sum=vec3(0.);float wsum=0.;for (int x=-filterSize; x<=filterSize; ++x) {for (int y=-filterSize; y<=filterSize; ++y) {vec2 coords=vec2(x,y)*blurDir;vec3 sampleColor=textureLod(textureSampler,vUV+coords,0.).rgb;float sampleDepth=textureLod(depthSampler,vUV+coords,0.).r;vec3 sampleNormal=textureLod(normalSampler,vUV+coords,0.).rgb;
#ifdef DECODE_NORMAL
sampleNormal=sampleNormal*2.0-1.0;
#endif
float r=dot(coords,coords);float w=exp(-r/two_sigma2);float rDepth=sampleDepth-depth;float wd=exp(-rDepth*rDepth/two_sigmaDepth2);float rNormal=abs(sampleNormal.x-normal.x)+abs(sampleNormal.y-normal.y)+abs(sampleNormal.z-normal.z);float wn=exp(-rNormal*rNormal/two_sigmaNormal2);sum+=sampleColor*w*wd*wn;wsum+=w*wd*wn;}}
glFragColor=vec4(sum/wsum,1.);}
`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["bilateralBlurQualityPixelShader",0,{name:r,shader:i}])},967946,e=>{"use strict";var t,r;(r=t||(t={})).Animation="Animation",r.AnimationGroup="AnimationGroup",r.Mesh="Mesh",r.Material="Material",r.Camera="Camera",r.Light="Light",e.s(["GetFlowGraphAssetWithType",0,function(e,t,r,i){switch(t){case"Animation":return i?e.animations.find(e=>e.uniqueId===r)??null:e.animations[r]??null;case"AnimationGroup":return i?e.animationGroups.find(e=>e.uniqueId===r)??null:e.animationGroups[r]??null;case"Mesh":return i?e.meshes.find(e=>e.uniqueId===r)??null:e.meshes[r]??null;case"Material":return i?e.materials.find(e=>e.uniqueId===r)??null:e.materials[r]??null;case"Camera":return i?e.cameras.find(e=>e.uniqueId===r)??null:e.cameras[r]??null;case"Light":return i?e.lights.find(e=>e.uniqueId===r)??null:e.lights[r]??null;default:return null}}])},897064,e=>{"use strict";var t=e.i(967946),r=e.i(440163),i=e.i(916624),a=e.i(774685),o=e.i(774100),n=e.i(711835);class s extends r.FlowGraphBlock{constructor(e){super(e),this.config=e,this.type=this.registerDataInput("type",i.RichTypeAny,e.type),this.value=this.registerDataOutput("value",i.RichTypeAny),this.index=this.registerDataInput("index",i.RichTypeAny,new o.FlowGraphInteger((0,n.getNumericValue)(e.index??-1)))}_updateOutputs(e){let r=this.type.getValue(e),i=this.index.getValue(e),a=(0,t.GetFlowGraphAssetWithType)(e.assetsContext,r,(0,n.getNumericValue)(i),this.config.useIndexAsUniqueId);this.value.setValue(a,e)}getClassName(){return"FlowGraphGetAssetBlock"}}(0,a.RegisterClass)("FlowGraphGetAssetBlock",s),e.s(["FlowGraphGetAssetBlock",0,s])},665221,e=>{"use strict";var t=e.i(263537);e.i(738124);let r="iblIcdfPixelShader",i=`#include<helperFunctions>
varying vUV: vec2f;
#ifdef IBL_USE_CUBE_MAP
var iblSourceSampler: sampler;var iblSource: texture_cube<f32>;
#else
var iblSourceSampler: sampler;var iblSource: texture_2d<f32>;
#endif
var scaledLuminanceSamplerSampler : sampler;var scaledLuminanceSampler : texture_2d<f32>;var cdfx: texture_2d<f32>;var cdfy: texture_2d<f32>;fn fetchLuminance(coords: vec2f)->f32 {
#ifdef IBL_USE_CUBE_MAP
var direction: vec3f=equirectangularToCubemapDirection(coords);var color: vec3f=textureSampleLevel(iblSource,iblSourceSampler,direction,0.0).rgb;
#else
var color: vec3f=textureSampleLevel(iblSource,iblSourceSampler,coords,0.0).rgb;
#endif
return dot(color,LuminanceEncodeApprox);}
fn fetchCDFx(x: u32)->f32 {return textureLoad(cdfx, vec2u(x,0),0).x;}
fn bisectx(size: u32,targetValue: f32)->f32
{var a: u32=0;var b=size-1;while (b-a>1) {var c: u32=(a+b)>>1;if (fetchCDFx(c)<targetValue) {a=c;}
else {b=c;}}
return mix( f32(a), f32(b),(targetValue-fetchCDFx(a))/(fetchCDFx(b)-fetchCDFx(a)))/ f32(size-1);}
fn fetchCDFy(y: u32,invocationId: u32)->f32 {return textureLoad(cdfy, vec2u(invocationId,y),0).x;}
fn bisecty(size: u32,targetValue: f32,invocationId: u32)->f32
{var a: u32=0;var b=size-1;while (b-a>1) {var c=(a+b)>>1;if (fetchCDFy(c,invocationId)<targetValue) {a=c;}
else {b=c;}}
return mix( f32(a), f32(b),(targetValue-fetchCDFy(a,invocationId))/(fetchCDFy(b,invocationId)-fetchCDFy(a,invocationId)))/ f32(size-1);}
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var cdfxSize: vec2u=textureDimensions(cdfx,0);var cdfWidth: u32=cdfxSize.x;var icdfWidth: u32=cdfWidth-1;var currentPixel: vec2u= vec2u(fragmentInputs.position.xy);var outputColor: vec3f=vec3f(1.0);if (currentPixel.x==0)
{outputColor.x= 0.0;}
else if (currentPixel.x==icdfWidth-1) {outputColor.x= 1.0;} else {var targetValue: f32=fetchCDFx(cdfWidth-1)*input.vUV.x;outputColor.x= bisectx(cdfWidth,targetValue);}
var cdfySize: vec2u=textureDimensions(cdfy,0);var cdfHeight: u32=cdfySize.y;if (currentPixel.y==0) {outputColor.y= 0.0;}
else if (currentPixel.y==cdfHeight-2) {outputColor.y= 1.0;} else {var targetValue: f32=fetchCDFy(cdfHeight-1,currentPixel.x)*input.vUV.y;outputColor.y= max(bisecty(cdfHeight,targetValue,currentPixel.x),0.0);}
var size : vec2f=vec2f(textureDimensions(scaledLuminanceSampler,0));var highestMip: f32=floor(log2(size.x));var normalization : f32=textureSampleLevel(scaledLuminanceSampler,
scaledLuminanceSamplerSampler,
input.vUV,highestMip)
.r;var pixelLuminance: f32=fetchLuminance(input.vUV);outputColor.z=pixelLuminance/(2.0*PI*normalization);fragmentOutputs.color=vec4( outputColor,1.0);}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["iblIcdfPixelShaderWGSL",0,{name:r,shader:i}])},687977,e=>{"use strict";var t=e.i(263537);let r="iblCdfDebugPixelShader",i=`#define PI 3.1415927
varying vUV: vec2f;var cdfySampler: sampler;var cdfy: texture_2d<f32>;var cdfxSampler: sampler;var cdfx: texture_2d<f32>;var icdfSampler: sampler;var icdf: texture_2d<f32>;
#ifdef IBL_USE_CUBE_MAP
var iblSourceSampler: sampler;var iblSource: texture_cube<f32>;
#else
var iblSourceSampler: sampler;var iblSource: texture_2d<f32>;
#endif
var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;
#define cdfyVSize (0.8/3.0)
#define cdfxVSize 0.1
#define cdfyHSize 0.5
uniform sizeParams: vec4f;
#ifdef IBL_USE_CUBE_MAP
fn equirectangularToCubemapDirection(uv: vec2f)->vec3f {var longitude: f32=uv.x*2.0*PI-PI;var latitude: f32=PI*0.5-uv.y*PI;var direction: vec3f;direction.x=cos(latitude)*sin(longitude);direction.y=sin(latitude);direction.z=cos(latitude)*cos(longitude);return direction;}
#endif
@fragment
fn main(input: FragmentInputs)->FragmentOutputs { 
var colour: vec3f= vec3f(0.0);var uv: vec2f =
vec2f((uniforms.sizeParams.x+input.vUV.x)*uniforms.sizeParams.z,(uniforms.sizeParams.y+input.vUV.y)*uniforms.sizeParams.w);var backgroundColour: vec3f=textureSample(textureSampler,textureSamplerSampler,input.vUV).rgb;var cdfxWidth: u32=textureDimensions(cdfx,0).x;var cdfyHeight: u32=textureDimensions(cdfy,0).y;const iblStart: f32=1.0-cdfyVSize;const pdfStart: f32=1.0-2.0*cdfyVSize;const cdfyStart: f32=1.0-3.0*cdfyVSize;const cdfxStart: f32=1.0-3.0*cdfyVSize-cdfxVSize;const icdfxStart: f32=1.0-3.0*cdfyVSize-2.0*cdfxVSize;
#ifdef IBL_USE_CUBE_MAP
var direction: vec3f=equirectangularToCubemapDirection(
(uv- vec2f(0.0,iblStart))* vec2f(1.0,1.0/cdfyVSize));var iblColour: vec3f=textureSampleLevel(iblSource,iblSourceSampler,direction,0.0).rgb;
#else
var iblColour: vec3f=textureSample(iblSource,iblSourceSampler,(uv- vec2f(0.0,iblStart)) *
vec2f(1.0,1.0/cdfyVSize))
.rgb;
#endif
var pdfColour: vec3f =
textureSample(icdf,icdfSampler,(uv- vec2f(0.0,pdfStart))* vec2f(1.0,1.0/cdfyVSize)).zzz;var cdfyColour: f32 =
textureSample(cdfy,cdfySampler,(uv- vec2f(0.0,cdfyStart))* vec2f(2.0,1.0/cdfyVSize)).r;var icdfyColour: f32 =
textureSample(icdf,icdfSampler,(uv- vec2f(0.5,cdfyStart))* vec2f(2.0,1.0/cdfyVSize)).g;var cdfxColour: f32 =
textureSample(cdfx,cdfxSampler,(uv- vec2f(0.0,cdfxStart))* vec2f(1.0,1.0/cdfxVSize)).r;var icdfxColour: f32=textureSample(icdf,icdfSampler,(uv- vec2f(0.0,icdfxStart)) *
vec2f(1.0,1.0/cdfxVSize)).r;if (uv.x<0.0 || uv.x>1.0 || uv.y<0.0 || uv.y>1.0) {colour=backgroundColour;} else if (uv.y>iblStart) {colour+=iblColour;} else if (uv.y>pdfStart) {colour+=pdfColour;} else if (uv.y>cdfyStart && uv.x<0.5) {colour.r+=cdfyColour/f32(cdfyHeight);} else if (uv.y>cdfyStart && uv.x>0.5) {colour.r+=icdfyColour;} else if (uv.y>cdfxStart) {colour.r+=cdfxColour/f32(cdfxWidth);} else if (uv.y>icdfxStart) {colour.r+=icdfxColour;}
fragmentOutputs.color =vec4(mix(colour,backgroundColour,0.5),1.0);}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["iblCdfDebugPixelShaderWGSL",0,{name:r,shader:i}])},547405,e=>{"use strict";var t=e.i(263537);let r="motionBlurPixelShader",i=`varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;uniform motionStrength: f32;uniform motionScale: f32;uniform screenSize: vec2f;
#ifdef OBJECT_BASED
var velocitySamplerSampler: sampler;var velocitySampler: texture_2d<f32>;
#else
var depthSamplerSampler: sampler;var depthSampler: texture_2d<f32>;uniform inverseViewProjection: mat4x4f;uniform prevViewProjection: mat4x4f;uniform projection: mat4x4f;
#endif
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {
#ifdef GEOMETRY_SUPPORTED
#ifdef OBJECT_BASED
var texelSize: vec2f=1.0/uniforms.screenSize;var velocityColor: vec4f=textureSampleLevel(velocitySampler,velocitySamplerSampler,input.vUV,0.0);velocityColor=vec4f(velocityColor.rg*2.0- vec2f(1.0),velocityColor.b,velocityColor.a);let signs=sign(velocityColor.rg);var velocity=pow(abs(velocityColor.rg),vec2f(3.0))*signs*velocityColor.a;velocity*=uniforms.motionScale*uniforms.motionStrength;var speed: f32=length(velocity/texelSize);var samplesCount: i32= i32(clamp(speed,1.0,SAMPLES));velocity=normalize(velocity)*texelSize;var hlim: f32= f32(-samplesCount)*0.5+0.5;var result: vec4f=textureSampleLevel(textureSampler,textureSamplerSampler, input.vUV,0.0);for (var i: i32=1; i< i32(SAMPLES); i++)
{if (i>=samplesCount) {break;}
var offset: vec2f=input.vUV+velocity*(hlim+ f32(i));result+=textureSampleLevel(textureSampler,textureSamplerSampler, offset,0.0);}
fragmentOutputs.color=vec4f(result.rgb/ f32(samplesCount),1.0);
#else
var result: vec4f=textureSampleLevel(textureSampler,textureSamplerSampler, input.vUV,0.0);var texelSize: vec2f=1.0/uniforms.screenSize;var depth: f32=textureSampleLevel(depthSampler,depthSamplerSampler,input.vUV,0.0).r;if (depth==0.0) {fragmentOutputs.color=result;return fragmentOutputs;}
depth=uniforms.projection[2].z+uniforms.projection[3].z/depth; 
var cpos: vec4f= vec4f(input.vUV*2.0-1.0,depth,1.0);cpos=uniforms.inverseViewProjection*cpos;cpos/=cpos.w;var ppos: vec4f=uniforms.prevViewProjection*cpos;ppos/=ppos.w;ppos=vec4f(ppos.xy*0.5+0.5,ppos.zw);var velocity: vec2f=(ppos.xy-input.vUV)*uniforms.motionScale*uniforms.motionStrength;var speed: f32=length(velocity/texelSize);var nSamples: i32= i32(clamp(speed,1.0,SAMPLES));for (var i: i32=1; i< i32(SAMPLES); i++) {if (i>=nSamples) {break;}
var offset1: vec2f=input.vUV+velocity*( f32(i)/ f32(nSamples-1)-0.5);result+=textureSampleLevel(textureSampler,textureSamplerSampler, offset1,0.0);}
fragmentOutputs.color=result/ f32(nSamples);
#endif
#else
fragmentOutputs.color=textureSample(textureSampler,textureSamplerSampler, input.vUV);
#endif
}
`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["motionBlurPixelShaderWGSL",0,{name:r,shader:i}])},823139,e=>{"use strict";var t=e.i(263537);let r="tonemapPixelShader",i=`varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;uniform _ExposureAdjustment: f32;
#if defined(HABLE_TONEMAPPING)
const A: f32=0.15;const B: f32=0.50;const C: f32=0.10;const D: f32=0.20;const E: f32=0.02;const F: f32=0.30;const W: f32=11.2;
#endif
fn Luminance(c: vec3f)->f32
{return dot(c, vec3f(0.22,0.707,0.071));}
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var colour: vec3f=textureSample(textureSampler,textureSamplerSampler,input.vUV).rgb;
#if defined(REINHARD_TONEMAPPING)
var lum: f32=Luminance(colour.rgb); 
var lumTm: f32=lum*uniforms._ExposureAdjustment;var scale: f32=lumTm/(1.0+lumTm); 
colour*=scale/lum;
#elif defined(HABLE_TONEMAPPING)
colour*=uniforms._ExposureAdjustment;const ExposureBias: f32=2.0;var x: vec3f=ExposureBias*colour;var curr: vec3f=((x*(A*x+C*B)+D*E)/(x*(A*x+B)+D*F))-E/F;x= vec3f(W,W,W);var whiteScale: vec3f=1.0/(((x*(A*x+C*B)+D*E)/(x*(A*x+B)+D*F))-E/F);colour=curr*whiteScale;
#elif defined(OPTIMIZED_HEJIDAWSON_TONEMAPPING)
colour*=uniforms._ExposureAdjustment;var X: vec3f=max( vec3f(0.0,0.0,0.0),colour-0.004);var retColor: vec3f=(X*(6.2*X+0.5))/(X*(6.2*X+1.7)+0.06);colour=retColor*retColor;
#elif defined(PHOTOGRAPHIC_TONEMAPPING)
colour= vec3f(1.0,1.0,1.0)-exp2(-uniforms._ExposureAdjustment*colour);
#endif
fragmentOutputs.color= vec4f(colour.rgb,1.0);}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["tonemapPixelShaderWGSL",0,{name:r,shader:i}])},226859,e=>{"use strict";var t=e.i(263537);let r="chromaticAberrationPixelShader",i=`uniform sampler2D textureSampler; 
uniform float chromatic_aberration;uniform float radialIntensity;uniform vec2 direction;uniform vec2 centerPosition;uniform float screen_width;uniform float screen_height;varying vec2 vUV;
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void)
{vec2 centered_screen_pos=vec2(vUV.x-centerPosition.x,vUV.y-centerPosition.y);vec2 directionOfEffect=direction;if(directionOfEffect.x==0. && directionOfEffect.y==0.){directionOfEffect=normalize(centered_screen_pos);}
float radius2=centered_screen_pos.x*centered_screen_pos.x
+ centered_screen_pos.y*centered_screen_pos.y;float radius=sqrt(radius2);vec3 ref_indices=vec3(-0.3,0.0,0.3);float ref_shiftX=chromatic_aberration*pow(radius,radialIntensity)*directionOfEffect.x/screen_width;float ref_shiftY=chromatic_aberration*pow(radius,radialIntensity)*directionOfEffect.y/screen_height;vec2 ref_coords_r=vec2(vUV.x+ref_indices.r*ref_shiftX,vUV.y+ref_indices.r*ref_shiftY*0.5);vec2 ref_coords_g=vec2(vUV.x+ref_indices.g*ref_shiftX,vUV.y+ref_indices.g*ref_shiftY*0.5);vec2 ref_coords_b=vec2(vUV.x+ref_indices.b*ref_shiftX,vUV.y+ref_indices.b*ref_shiftY*0.5);vec4 r=texture2D(textureSampler,ref_coords_r);vec4 g=texture2D(textureSampler,ref_coords_g);vec4 b=texture2D(textureSampler,ref_coords_b);float a=clamp(r.a+g.a+b.a,0.,1.);gl_FragColor=vec4(r.r,g.g,b.b,a);}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["chromaticAberrationPixelShader",0,{name:r,shader:i}])},529460,e=>{"use strict";var t=e.i(263537);let r="rsmFullGlobalIlluminationPixelShader",i=`/**
* The implementation is a direct application of the formula found in http:
*/
precision highp float;varying vec2 vUV;uniform mat4 rsmLightMatrix;uniform vec4 rsmInfo;uniform sampler2D textureSampler;uniform sampler2D normalSampler;uniform sampler2D rsmPositionW;uniform sampler2D rsmNormalW;uniform sampler2D rsmFlux;
#ifdef TRANSFORM_NORMAL
uniform mat4 invView;
#endif
vec3 computeIndirect(vec3 p,vec3 n) {vec3 indirectDiffuse=vec3(0.);float intensity=rsmInfo.z;float edgeArtifactCorrection=rsmInfo.w;vec4 texRSM=rsmLightMatrix*vec4(p,1.);texRSM.xy/=texRSM.w;texRSM.xy=texRSM.xy*0.5+0.5;int width=int(rsmInfo.x);int height=int(rsmInfo.y);for (int j=0; j<height; j++) {for (int i=0; i<width; i++) {ivec2 uv=ivec2(i,j);vec3 vplPositionW=texelFetch(rsmPositionW,uv,0).xyz;vec3 vplNormalW=texelFetch(rsmNormalW,uv,0).xyz*2.0-1.0;vec3 vplFlux=texelFetch(rsmFlux,uv,0).rgb;vplPositionW-=vplNormalW*edgeArtifactCorrection; 
float dist2=dot(vplPositionW-p,vplPositionW-p);indirectDiffuse+=vplFlux*max(0.,dot(n,vplPositionW-p))*max(0.,dot(vplNormalW,p-vplPositionW))/(dist2*dist2);}}
return clamp(indirectDiffuse*intensity,0.0,1.0);}
void main(void) 
{vec3 positionW=texture2D(textureSampler,vUV).xyz;vec3 normalW=texture2D(normalSampler,vUV).xyz;
#ifdef DECODE_NORMAL
normalW=normalW*2.0-1.0;
#endif
#ifdef TRANSFORM_NORMAL
normalW=(invView*vec4(normalW,0.)).xyz;
#endif
gl_FragColor.rgb=computeIndirect(positionW,normalW);gl_FragColor.a=1.0;}
`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["rsmFullGlobalIlluminationPixelShader",0,{name:r,shader:i}])},463034,e=>{"use strict";var t=e.i(353679),r=e.i(916624),i=e.i(774685);class a extends t.FlowGraphExecutionBlockWithOutSignal{constructor(e){super(e),this.body=this.registerDataInput("body",r.RichTypeAny),this.velocity=this.registerDataInput("velocity",r.RichTypeVector3)}_execute(e,t){let r=this.body.getValue(e);if(!r){this._reportError(e,"No physics body provided"),this.out._activateSignal(e);return}r.setAngularVelocity(this.velocity.getValue(e)),this.out._activateSignal(e)}getClassName(){return"FlowGraphSetAngularVelocityBlock"}}(0,i.RegisterClass)("FlowGraphSetAngularVelocityBlock",a),e.s(["FlowGraphSetAngularVelocityBlock",0,a])},37022,e=>{"use strict";var t=e.i(263537);let r="blackAndWhitePixelShader",i=`varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;uniform degree: f32;
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var color: vec3f=textureSample(textureSampler,textureSamplerSampler,input.vUV).rgb;var luminance: f32=dot(color, vec3f(0.3,0.59,0.11)); 
var blackAndWhite: vec3f= vec3f(luminance,luminance,luminance);fragmentOutputs.color= vec4f(color-((color-blackAndWhite)*uniforms.degree),1.0);}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["blackAndWhitePixelShaderWGSL",0,{name:r,shader:i}])},813885,e=>{"use strict";var t=e.i(263537);let r="highlightsPixelShader",i=`varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;const RGBLuminanceCoefficients: vec3f= vec3f(0.2126,0.7152,0.0722);
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var tex: vec4f=textureSample(textureSampler,textureSamplerSampler,input.vUV);var c: vec3f=tex.rgb;var luma: f32=dot(c.rgb,RGBLuminanceCoefficients);fragmentOutputs.color= vec4f(pow(c, vec3f(25.0-luma*15.0)),tex.a); }`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["highlightsPixelShaderWGSL",0,{name:r,shader:i}])},561717,e=>{"use strict";var t=e.i(263537);e.i(201632);let r="grainPixelShader",i=`#include<helperFunctions>
uniform sampler2D textureSampler; 
uniform float intensity;uniform float animatedSeed;varying vec2 vUV;
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void)
{gl_FragColor=texture2D(textureSampler,vUV);vec2 seed=vUV*(animatedSeed);float grain=dither(seed,intensity);float lum=getLuminance(gl_FragColor.rgb);float grainAmount=(cos(-PI+(lum*PI*2.))+1.)/2.;gl_FragColor.rgb+=grain*grainAmount;gl_FragColor.rgb=max(gl_FragColor.rgb,0.0);}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["grainPixelShader",0,{name:r,shader:i}])},502588,e=>{"use strict";var t=e.i(263537);let r="layerVertexShader",i=`attribute vec2 position;uniform vec2 scale;uniform vec2 offset;uniform mat4 textureMatrix;varying vec2 vUV;const vec2 madd=vec2(0.5,0.5);
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
vec2 shiftedPosition=position*scale+offset;vUV=vec2(textureMatrix*vec4(shiftedPosition*madd+madd,1.0,0.0));gl_Position=vec4(shiftedPosition,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["layerVertexShader",0,{name:r,shader:i}])},9701,e=>{"use strict";var t=e.i(916624),r=e.i(353679),i=e.i(774685),a=e.i(774100);class o extends r.FlowGraphExecutionBlockWithOutSignal{constructor(e={}){super(e),this.config=e,this.config.startIndex=e.startIndex??new a.FlowGraphInteger(0),this.reset=this._registerSignalInput("reset"),this.maxExecutions=this.registerDataInput("maxExecutions",t.RichTypeFlowGraphInteger),this.executionCount=this.registerDataOutput("executionCount",t.RichTypeFlowGraphInteger,new a.FlowGraphInteger(0))}_execute(e,t){if(t===this.reset)this.executionCount.setValue(this.config.startIndex,e);else{let t=this.executionCount.getValue(e);t.value<this.maxExecutions.getValue(e).value&&(this.executionCount.setValue(new a.FlowGraphInteger(t.value+1),e),this.out._activateSignal(e))}}getClassName(){return"FlowGraphDoNBlock"}}(0,i.RegisterClass)("FlowGraphDoNBlock",o),e.s(["FlowGraphDoNBlock",0,o])},194182,e=>{"use strict";var t=e.i(263537);let r="colorCorrectionPixelShader",i=`varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;varying vUV: vec2f;var colorTableSampler: sampler;var colorTable: texture_2d<f32>;const SLICE_COUNT: f32=16.0; 
fn sampleAs3DTexture(uv: vec3f,width: f32)->vec4f {var sliceSize: f32=1.0/width; 
var slicePixelSize: f32=sliceSize/width; 
var sliceInnerSize: f32=slicePixelSize*(width-1.0); 
var zSlice0: f32=min(floor(uv.z*width),width-1.0);var zSlice1: f32=min(zSlice0+1.0,width-1.0);var xOffset: f32=slicePixelSize*0.5+uv.x*sliceInnerSize;var s0: f32=xOffset+(zSlice0*sliceSize);var s1: f32=xOffset+(zSlice1*sliceSize);var slice0Color: vec4f=textureSample(colorTable,colorTableSampler,vec2f(s0,uv.y));var slice1Color: vec4f=textureSample(colorTable,colorTableSampler,vec2f(s1,uv.y));var zOffset: f32=((uv.z*width)%(1.0));return mix(slice0Color,slice1Color,zOffset);}
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var screen_color: vec4f=textureSample(textureSampler,textureSamplerSampler,input.vUV);fragmentOutputs.color=sampleAs3DTexture(screen_color.rgb,SLICE_COUNT);}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["colorCorrectionPixelShaderWGSL",0,{name:r,shader:i}])},931973,e=>{"use strict";var t=e.i(263537);let r="meshUVSpaceRendererFinaliserPixelShader",i=`precision highp float;varying vec2 vUV;uniform sampler2D textureSampler;uniform sampler2D maskTextureSampler;uniform vec2 textureSize;void main() {vec4 mask=texture2D(maskTextureSampler,vUV).rgba;if (mask.r>0.5) {gl_FragColor=texture2D(textureSampler,vUV);} else {vec2 texelSize=4.0/textureSize;vec2 uv_p01=vUV+vec2(-1.0,0.0)*texelSize;vec2 uv_p21=vUV+vec2(1.0,0.0)*texelSize;vec2 uv_p10=vUV+vec2(0.0,-1.0)*texelSize;vec2 uv_p12=vUV+vec2(0.0,1.0)*texelSize;float mask_p01=texture2D(maskTextureSampler,uv_p01).r;float mask_p21=texture2D(maskTextureSampler,uv_p21).r;float mask_p10=texture2D(maskTextureSampler,uv_p10).r;float mask_p12=texture2D(maskTextureSampler,uv_p12).r;vec4 col=vec4(0.0,0.0,0.0,0.0);float total_weight=0.0;if (mask_p01>0.5) {col+=texture2D(textureSampler,uv_p01);total_weight+=1.0;}
if (mask_p21>0.5) {col+=texture2D(textureSampler,uv_p21);total_weight+=1.0;}
if (mask_p10>0.5) {col+=texture2D(textureSampler,uv_p10);total_weight+=1.0;}
if (mask_p12>0.5) {col+=texture2D(textureSampler,uv_p12);total_weight+=1.0;}
if (total_weight>0.0) {gl_FragColor=col/total_weight;} else {gl_FragColor=col;}}}
`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["meshUVSpaceRendererFinaliserPixelShader",0,{name:r,shader:i}])},564439,e=>{"use strict";var t=e.i(263537);e.i(624154),e.i(568039),e.i(298378),e.i(369136),e.i(880779),e.i(675406),e.i(610460),e.i(587630),e.i(761523),e.i(479126);let r="pickingVertexShader",i=`attribute vec3 position;
#if defined(INSTANCES)
attribute float instanceMeshID;
#endif
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]
#include<instancesDeclaration>
uniform mat4 viewProjection;
#if defined(INSTANCES)
flat varying float vMeshID;
#endif
void main(void) {vec3 positionUpdated=position;
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
vec4 worldPos=finalWorld*vec4(positionUpdated,1.0);gl_Position=viewProjection*worldPos;
#if defined(INSTANCES)
vMeshID=instanceMeshID;
#endif
}
`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["pickingVertexShader",0,{name:r,shader:i}])},769900,e=>{"use strict";var t=e.i(263537);let r="hdrFilteringVertexShader",i=`attribute vec2 position;varying vec3 direction;uniform vec3 up;uniform vec3 right;uniform vec3 front;
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
mat3 view=mat3(up,right,front);direction=view*vec3(position,1.0);gl_Position=vec4(position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["hdrFilteringVertexShader",0,{name:r,shader:i}])},701076,e=>{"use strict";var t=e.i(263537);let r="lodPixelShader",i=`const GammaEncodePowerApprox=1.0/2.2;varying vUV: vec2f;var textureSampler: texture_2d<f32>;uniform lod: f32;uniform gamma: i32;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {let textureSize=textureDimensions(textureSampler);fragmentOutputs.color=textureLoad(textureSampler,vec2u(fragmentInputs.vUV*vec2f(textureSize)),u32(uniforms.lod));if (uniforms.gamma==0) {fragmentOutputs.color=vec4f(pow(fragmentOutputs.color.rgb,vec3f(GammaEncodePowerApprox)),fragmentOutputs.color.a);}}
`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["lodPixelShaderWGSL",0,{name:r,shader:i}])},718896,e=>{"use strict";var t=e.i(263537);let r="fluidRenderingParticleThicknessVertexShader",i=`attribute vec3 position;attribute vec2 offset;uniform mat4 view;uniform mat4 projection;uniform vec2 size;varying vec2 uv;void main(void) {vec3 cornerPos;cornerPos.xy=vec2(offset.x-0.5,offset.y-0.5)*size;cornerPos.z=0.0;vec3 viewPos=(view*vec4(position,1.0)).xyz+cornerPos;gl_Position=projection*vec4(viewPos,1.0);uv=offset;}
`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["fluidRenderingParticleThicknessVertexShader",0,{name:r,shader:i}])},897490,e=>{"use strict";var t=e.i(263537);let r="depthBoxBlurPixelShader",i=`varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;uniform screenSize: vec2f;
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var colorDepth: vec4f=vec4f(0.0);for (var x: i32=-OFFSET; x<=OFFSET; x++) {for (var y: i32=-OFFSET; y<=OFFSET; y++) {colorDepth+=textureSample(textureSampler,textureSamplerSampler,input.vUV+ vec2f(f32(x),f32(y))/uniforms.screenSize);}}
fragmentOutputs.color=(colorDepth/ f32((OFFSET*2+1)*(OFFSET*2+1)));}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["depthBoxBlurPixelShaderWGSL",0,{name:r,shader:i}])},646614,e=>{"use strict";var t=e.i(916624),r=e.i(353679),i=e.i(774685);class a extends r.FlowGraphExecutionBlockWithOutSignal{constructor(e){super(e),this.count=this.registerDataInput("count",t.RichTypeNumber),this.reset=this._registerSignalInput("reset"),this.currentCount=this.registerDataOutput("currentCount",t.RichTypeNumber)}_execute(e,t){if(t===this.reset)return void e._setExecutionVariable(this,"debounceCount",0);let r=this.count.getValue(e),i=e._getExecutionVariable(this,"debounceCount",0)+1;this.currentCount.setValue(i,e),e._setExecutionVariable(this,"debounceCount",i),i>=r&&(this.out._activateSignal(e),e._setExecutionVariable(this,"debounceCount",0))}getClassName(){return"FlowGraphDebounceBlock"}}(0,i.RegisterClass)("FlowGraphDebounceBlock",a),e.s(["FlowGraphDebounceBlock",0,a])},744634,e=>{"use strict";var t=e.i(440163),r=e.i(916624),i=e.i(774685),a=e.i(906115);class o extends t.FlowGraphBlock{constructor(e){super(e),this.config=e,this.output=this.registerDataOutput("output",(0,r.getRichTypeFromValue)(e.value))}_updateOutputs(e){this.output.setValue(this.config.value,e)}getClassName(){return"FlowGraphConstantBlock"}serialize(e={},t=a.defaultValueSerializationFunction){super.serialize(e),t("value",this.config.value,e.config)}}(0,i.RegisterClass)("FlowGraphConstantBlock",o),e.s(["FlowGraphConstantBlock",0,o])},717234,e=>{"use strict";var t=e.i(263537);let r="meshUVSpaceRendererFinaliserVertexShader",i=`attribute position: vec3f;attribute uv: vec2f;uniform worldViewProjection: mat4x4f;varying vUV: vec2f;@vertex
fn main(input : VertexInputs)->FragmentInputs {vertexOutputs.position=uniforms.worldViewProjection* vec4f(vertexInputs.position,1.0);vertexOutputs.positionvUV=vertexInputs.uv;}
`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["meshUVSpaceRendererFinaliserVertexShaderWGSL",0,{name:r,shader:i}])},621517,e=>{"use strict";var t=e.i(263537);let r="ssaoCombinePixelShader",i=`uniform sampler2D textureSampler;uniform sampler2D originalColor;uniform vec4 viewport;varying vec2 vUV;
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
vec2 uv=viewport.xy+vUV*viewport.zw;vec4 ssaoColor=texture2D(textureSampler,uv);vec4 sceneColor=texture2D(originalColor,uv);gl_FragColor=sceneColor*ssaoColor;
#define CUSTOM_FRAGMENT_MAIN_END
}
`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["ssaoCombinePixelShader",0,{name:r,shader:i}])},529653,e=>{"use strict";var t=e.i(263537);let r="iblCdfxPixelShader",i=`#define PI 3.1415927
varying vUV: vec2f;var cdfy: texture_2d<f32>;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var cdfyRes=textureDimensions(cdfy,0);var currentPixel=vec2u(fragmentInputs.position.xy);var cdfx: f32=0.0;for (var x: u32=1; x<=currentPixel.x; x++) {cdfx+=textureLoad(cdfy, vec2u(x-1,cdfyRes.y-1),0).x;}
fragmentOutputs.color= vec4f( vec3f(cdfx),1.0);}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["iblCdfxPixelShaderWGSL",0,{name:r,shader:i}])},916052,e=>{"use strict";var t=e.i(263537);let r="pickingPixelShader",i=`#if defined(INSTANCES)
flat varying vMeshID: f32;
#else
uniform meshID: f32;
#endif
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var id: i32;
#if defined(INSTANCES)
id=i32(input.vMeshID);
#else
id=i32(uniforms.meshID);
#endif
var color=vec3f(
f32((id>>16) & 0xFF),
f32((id>>8) & 0xFF),
f32(id & 0xFF),
)/255.0;fragmentOutputs.color=vec4f(color,1.0);}
`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["pickingPixelShaderWGSL",0,{name:r,shader:i}])},856953,e=>{"use strict";var t=e.i(263537);let r="tonemapPixelShader",i=`varying vec2 vUV;uniform sampler2D textureSampler;uniform float _ExposureAdjustment;
#if defined(HABLE_TONEMAPPING)
const float A=0.15;const float B=0.50;const float C=0.10;const float D=0.20;const float E=0.02;const float F=0.30;const float W=11.2;
#endif
float Luminance(vec3 c)
{return dot(c,vec3(0.22,0.707,0.071));}
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) 
{vec3 colour=texture2D(textureSampler,vUV).rgb;
#if defined(REINHARD_TONEMAPPING)
float lum=Luminance(colour.rgb); 
float lumTm=lum*_ExposureAdjustment;float scale=lumTm/(1.0+lumTm); 
colour*=scale/lum;
#elif defined(HABLE_TONEMAPPING)
colour*=_ExposureAdjustment;const float ExposureBias=2.0;vec3 x=ExposureBias*colour;vec3 curr=((x*(A*x+C*B)+D*E)/(x*(A*x+B)+D*F))-E/F;x=vec3(W,W,W);vec3 whiteScale=1.0/(((x*(A*x+C*B)+D*E)/(x*(A*x+B)+D*F))-E/F);colour=curr*whiteScale;
#elif defined(OPTIMIZED_HEJIDAWSON_TONEMAPPING)
colour*=_ExposureAdjustment;vec3 X=max(vec3(0.0,0.0,0.0),colour-0.004);vec3 retColor=(X*(6.2*X+0.5))/(X*(6.2*X+1.7)+0.06);colour=retColor*retColor;
#elif defined(PHOTOGRAPHIC_TONEMAPPING)
colour= vec3(1.0,1.0,1.0)-exp2(-_ExposureAdjustment*colour);
#endif
gl_FragColor=vec4(colour.rgb,1.0);}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["tonemapPixelShader",0,{name:r,shader:i}])},398123,e=>{"use strict";var t=e.i(263537);let r="screenSpaceCurvaturePixelShader",i=`precision highp float;varying vec2 vUV;uniform sampler2D textureSampler;uniform sampler2D normalSampler;uniform float curvature_ridge;uniform float curvature_valley;
#ifndef CURVATURE_OFFSET
#define CURVATURE_OFFSET 1
#endif
float curvature_soft_clamp(float curvature,float control)
{if (curvature<0.5/control)
return curvature*(1.0-curvature*control);return 0.25/control;}
float calculate_curvature(ivec2 texel,float ridge,float valley)
{vec2 normal_up =texelFetch(normalSampler,texel+ivec2(0, CURVATURE_OFFSET),0).rb;vec2 normal_down =texelFetch(normalSampler,texel+ivec2(0,-CURVATURE_OFFSET),0).rb;vec2 normal_left =texelFetch(normalSampler,texel+ivec2(-CURVATURE_OFFSET,0),0).rb;vec2 normal_right=texelFetch(normalSampler,texel+ivec2( CURVATURE_OFFSET,0),0).rb;float normal_diff=((normal_up.g-normal_down.g)+(normal_right.r-normal_left.r));if (normal_diff<0.0)
return -2.0*curvature_soft_clamp(-normal_diff,valley);return 2.0*curvature_soft_clamp(normal_diff,ridge);}
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) 
{ivec2 texel=ivec2(gl_FragCoord.xy);vec4 baseColor=texture2D(textureSampler,vUV);float curvature=calculate_curvature(texel,curvature_ridge,curvature_valley);baseColor.rgb*=curvature+1.0;gl_FragColor=baseColor;}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["screenSpaceCurvaturePixelShader",0,{name:r,shader:i}])},355369,e=>{"use strict";var t=e.i(263537);let r="depthOfFieldMergePixelShader",i=`#if defined(WEBGL2) || defined(WEBGPU) || defined(NATIVE)
#define TEXTUREFUNC(s,c,lod) texture2DLodEXT(s,c,lod)
#else
#define TEXTUREFUNC(s,c,bias) texture2D(s,c,bias)
#endif
uniform sampler2D textureSampler;varying vec2 vUV;uniform sampler2D circleOfConfusionSampler;uniform sampler2D blurStep0;
#if BLUR_LEVEL>0
uniform sampler2D blurStep1;
#endif
#if BLUR_LEVEL>1
uniform sampler2D blurStep2;
#endif
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void)
{float coc=TEXTUREFUNC(circleOfConfusionSampler,vUV,0.0).r;
#if BLUR_LEVEL==0
vec4 original=TEXTUREFUNC(textureSampler,vUV,0.0);vec4 blurred0=TEXTUREFUNC(blurStep0,vUV,0.0);gl_FragColor=mix(original,blurred0,coc);
#endif
#if BLUR_LEVEL==1
if(coc<0.5){vec4 original=TEXTUREFUNC(textureSampler,vUV,0.0);vec4 blurred1=TEXTUREFUNC(blurStep1,vUV,0.0);gl_FragColor=mix(original,blurred1,coc/0.5);}else{vec4 blurred0=TEXTUREFUNC(blurStep0,vUV,0.0);vec4 blurred1=TEXTUREFUNC(blurStep1,vUV,0.0);gl_FragColor=mix(blurred1,blurred0,(coc-0.5)/0.5);}
#endif
#if BLUR_LEVEL==2
if(coc<0.33){vec4 original=TEXTUREFUNC(textureSampler,vUV,0.0);vec4 blurred2=TEXTUREFUNC(blurStep2,vUV,0.0);gl_FragColor=mix(original,blurred2,coc/0.33);}else if(coc<0.66){vec4 blurred1=TEXTUREFUNC(blurStep1,vUV,0.0);vec4 blurred2=TEXTUREFUNC(blurStep2,vUV,0.0);gl_FragColor=mix(blurred2,blurred1,(coc-0.33)/0.33);}else{vec4 blurred0=TEXTUREFUNC(blurStep0,vUV,0.0);vec4 blurred1=TEXTUREFUNC(blurStep1,vUV,0.0);gl_FragColor=mix(blurred1,blurred0,(coc-0.66)/0.34);}
#endif
}
`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["depthOfFieldMergePixelShader",0,{name:r,shader:i}])},134486,e=>{"use strict";var t=e.i(353679),r=e.i(916624),i=e.i(774685);class a extends t.FlowGraphExecutionBlockWithOutSignal{constructor(e){super(e),this.sound=this.registerDataInput("sound",r.RichTypeAny),this.volume=this.registerDataInput("volume",r.RichTypeNumber,1),this.startOffset=this.registerDataInput("startOffset",r.RichTypeNumber,0),this.loop=this.registerDataInput("loop",r.RichTypeBoolean,!1)}_execute(e,t){let r=this.sound.getValue(e);if(!r){this._reportError(e,"No sound provided"),this.out._activateSignal(e);return}let i=this.volume.getValue(e),a=this.startOffset.getValue(e),o=this.loop.getValue(e);r.play({volume:i,startOffset:a,loop:o}),this.out._activateSignal(e)}getClassName(){return"FlowGraphPlaySoundBlock"}}(0,i.RegisterClass)("FlowGraphPlaySoundBlock",a),e.s(["FlowGraphPlaySoundBlock",0,a])},782117,e=>{"use strict";var t=e.i(263537);e.i(624154),e.i(568039),e.i(298378),e.i(369136),e.i(182478),e.i(880779);let r="pointCloudVertexDeclaration",i=`#ifdef POINTSIZE
uniform float pointSize;
#endif
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.i(675406),e.i(610460),e.i(587630),e.i(761523),e.i(479126),e.i(781801),e.i(229082);let a="depthVertexShader",o=`attribute vec3 position;
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]
#include<clipPlaneVertexDeclaration>
#include<instancesDeclaration>
uniform mat4 viewProjection;uniform vec2 depthValues;
#if defined(ALPHATEST) || defined(NEED_UV)
varying vec2 vUV;uniform mat4 diffuseMatrix;
#ifdef UV1
attribute vec2 uv;
#endif
#ifdef UV2
attribute vec2 uv2;
#endif
#endif
#ifdef STORE_CAMERASPACE_Z
uniform mat4 view;varying vec4 vViewPos;
#endif
#include<pointCloudVertexDeclaration>
varying float vDepthMetric;
#define CUSTOM_VERTEX_DEFINITIONS
void main(void)
{vec3 positionUpdated=position;
#ifdef UV1
vec2 uvUpdated=uv;
#endif
#ifdef UV2
vec2 uv2Updated=uv2;
#endif
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
vec4 worldPos=finalWorld*vec4(positionUpdated,1.0);
#include<clipPlaneVertex>
gl_Position=viewProjection*worldPos;
#ifdef STORE_CAMERASPACE_Z
vViewPos=view*worldPos;
#else
#ifdef USE_REVERSE_DEPTHBUFFER
vDepthMetric=((-gl_Position.z+depthValues.x)/(depthValues.y));
#else
vDepthMetric=((gl_Position.z+depthValues.x)/(depthValues.y));
#endif
#endif
#if defined(ALPHATEST) || defined(BASIC_RENDER)
#ifdef UV1
vUV=vec2(diffuseMatrix*vec4(uvUpdated,1.0,0.0));
#endif
#ifdef UV2
vUV=vec2(diffuseMatrix*vec4(uv2Updated,1.0,0.0));
#endif
#endif
#include<pointCloudVertex>
}
`;t.ShaderStore.ShadersStore[a]||(t.ShaderStore.ShadersStore[a]=o),e.s(["depthVertexShader",0,{name:a,shader:o}],782117)},221493,e=>{"use strict";var t=e.i(263537);e.i(407892),e.i(380244),e.i(585817),e.i(945868),e.i(349e3),e.i(13486),e.i(988389),e.i(431235),e.i(300889),e.i(398879),e.i(92372),e.i(84318);let r="depthVertexShader",i=`attribute position: vec3f;
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]
#include<clipPlaneVertexDeclaration>
#include<instancesDeclaration>
uniform viewProjection: mat4x4f;uniform depthValues: vec2f;
#if defined(ALPHATEST) || defined(NEED_UV)
varying vUV: vec2f;uniform diffuseMatrix: mat4x4f;
#ifdef UV1
attribute uv: vec2f;
#endif
#ifdef UV2
attribute uv2: vec2f;
#endif
#endif
#ifdef STORE_CAMERASPACE_Z
uniform view: mat4x4f;varying vViewPos: vec4f;
#endif
varying vDepthMetric: f32;
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input : VertexInputs)->FragmentInputs {var positionUpdated: vec3f=vertexInputs.position;
#ifdef UV1
var uvUpdated: vec2f=vertexInputs.uv;
#endif
#ifdef UV2
var uv2Updated: vec2f=vertexInputs.uv2;
#endif
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
var worldPos: vec4f=finalWorld* vec4f(positionUpdated,1.0);
#include<clipPlaneVertex>
vertexOutputs.position=uniforms.viewProjection*worldPos;
#ifdef STORE_CAMERASPACE_Z
vertexOutputs.vViewPos=uniforms.view*worldPos;
#else
#ifdef USE_REVERSE_DEPTHBUFFER
vertexOutputs.vDepthMetric=((-vertexOutputs.position.z+uniforms.depthValues.x)/(uniforms.depthValues.y));
#else
vertexOutputs.vDepthMetric=((vertexOutputs.position.z+uniforms.depthValues.x)/(uniforms.depthValues.y));
#endif
#endif
#if defined(ALPHATEST) || defined(BASIC_RENDER)
#ifdef UV1
vertexOutputs.vUV= (uniforms.diffuseMatrix* vec4f(uvUpdated,1.0,0.0)).xy;
#endif
#ifdef UV2
vertexOutputs.vUV= (uniforms.diffuseMatrix* vec4f(uv2Updated,1.0,0.0)).xy;
#endif
#endif
}
`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["depthVertexShaderWGSL",0,{name:r,shader:i}])},444e3,e=>{"use strict";var t=e.i(263537);let r="boundingBoxRendererUboDeclaration",i=`#ifdef WEBGL2
uniform vec4 color;uniform mat4 world;uniform mat4 viewProjection;
#ifdef MULTIVIEW
uniform mat4 viewProjectionR;
#endif
#else
layout(std140,column_major) uniform;uniform BoundingBoxRenderer {vec4 color;mat4 world;mat4 viewProjection;mat4 viewProjectionR;};
#endif
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.s([])},277886,e=>{"use strict";var t=e.i(263537);let r="boundingBoxRendererFragmentDeclaration",i=`uniform vec4 color;
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.i(444e3);let a="boundingBoxRendererPixelShader",o=`#include<__decl__boundingBoxRendererFragment>
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
gl_FragColor=color;
#define CUSTOM_FRAGMENT_MAIN_END
}`;t.ShaderStore.ShadersStore[a]||(t.ShaderStore.ShadersStore[a]=o),e.s(["boundingBoxRendererPixelShader",0,{name:a,shader:o}],277886)},536859,e=>{"use strict";var t=e.i(263537);let r="fxaaVertexShader",i=`attribute position: vec2f;uniform texelSize: vec2f;varying vUV: vec2f;varying sampleCoordS: vec2f;varying sampleCoordE: vec2f;varying sampleCoordN: vec2f;varying sampleCoordW: vec2f;varying sampleCoordNW: vec2f;varying sampleCoordSE: vec2f;varying sampleCoordNE: vec2f;varying sampleCoordSW: vec2f;const madd: vec2f= vec2f(0.5,0.5);
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input : VertexInputs)->FragmentInputs {
#define CUSTOM_VERTEX_MAIN_BEGIN
vertexOutputs.vUV=(vertexInputs.position*madd+madd);vertexOutputs.sampleCoordS=vertexOutputs.vUV+ vec2f( 0.0,1.0)*uniforms.texelSize;vertexOutputs.sampleCoordE=vertexOutputs.vUV+ vec2f( 1.0,0.0)*uniforms.texelSize;vertexOutputs.sampleCoordN=vertexOutputs.vUV+ vec2f( 0.0,-1.0)*uniforms.texelSize;vertexOutputs.sampleCoordW=vertexOutputs.vUV+ vec2f(-1.0,0.0)*uniforms.texelSize;vertexOutputs.sampleCoordNW=vertexOutputs.vUV+ vec2f(-1.0,-1.0)*uniforms.texelSize;vertexOutputs.sampleCoordSE=vertexOutputs.vUV+ vec2f( 1.0,1.0)*uniforms.texelSize;vertexOutputs.sampleCoordNE=vertexOutputs.vUV+ vec2f( 1.0,-1.0)*uniforms.texelSize;vertexOutputs.sampleCoordSW=vertexOutputs.vUV+ vec2f(-1.0,1.0)*uniforms.texelSize;vertexOutputs.position=vec4f(vertexInputs.position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["fxaaVertexShaderWGSL",0,{name:r,shader:i}])},74992,e=>{"use strict";var t=e.i(263537);let r="greasedLinePixelShader",i=`precision highp float;uniform sampler2D grlColors;uniform float grlUseColors;uniform float grlUseDash;uniform float grlDashArray;uniform float grlDashOffset;uniform float grlDashRatio;uniform float grlVisibility;uniform float grlColorsWidth;uniform vec2 grl_colorModeAndColorDistributionType;uniform vec3 grlColor;varying float grlCounters;varying float grlColorPointer;void main() {float grlColorMode=grl_colorModeAndColorDistributionType.x;float grlColorDistributionType=grl_colorModeAndColorDistributionType.y;gl_FragColor=vec4(grlColor,1.);gl_FragColor.a=step(grlCounters,grlVisibility);if (gl_FragColor.a==0.) discard;if( grlUseDash==1. ){gl_FragColor.a=ceil(mod(grlCounters+grlDashOffset,grlDashArray)-(grlDashArray*grlDashRatio));if (gl_FragColor.a==0.) discard;}
if (grlUseColors==1.) {vec4 textureColor;if (grlColorDistributionType==COLOR_DISTRIBUTION_TYPE_LINE) { 
textureColor=texture2D(grlColors,vec2(grlCounters,0.),0.);} else {textureColor=texture2D(grlColors,vec2(grlColorPointer/grlColorsWidth,0.),0.);}
if (grlColorMode==COLOR_MODE_SET) {gl_FragColor=textureColor;} else if (grlColorMode==COLOR_MODE_ADD) {gl_FragColor+=textureColor;} else if (grlColorMode==COLOR_MODE_MULTIPLY) {gl_FragColor*=textureColor;}}}
`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["greasedLinePixelShader",0,{name:r,shader:i}])},737894,e=>{"use strict";var t=e.i(263537);let r="glowBlurPostProcessPixelShader",i=`varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;uniform screenSize: vec2f;uniform direction: vec2f;uniform blurWidth: f32;fn getLuminance(color: vec3f)->f32
{return dot(color, vec3f(0.2126,0.7152,0.0722));}
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var weights: array<f32 ,7>;weights[0]=0.05;weights[1]=0.1;weights[2]=0.2;weights[3]=0.3;weights[4]=0.2;weights[5]=0.1;weights[6]=0.05;var texelSize: vec2f= vec2f(1.0/uniforms.screenSize.x,1.0/uniforms.screenSize.y);var texelStep: vec2f=texelSize*uniforms.direction*uniforms.blurWidth;var start: vec2f=input.vUV-3.0*texelStep;var baseColor: vec4f= vec4f(0.,0.,0.,0.);var texelOffset: vec2f= vec2f(0.,0.);for (var i: i32=0; i<7; i++)
{var texel: vec4f=textureSample(textureSampler,textureSamplerSampler,start+texelOffset);baseColor=vec4f(baseColor.rgb,baseColor.a+texel.a*weights[i]);var luminance: f32=getLuminance(baseColor.rgb);var luminanceTexel: f32=getLuminance(texel.rgb);var choice: f32=step(luminanceTexel,luminance);baseColor=vec4f(choice*baseColor.rgb+(1.0-choice)*texel.rgb,baseColor.a);texelOffset+=texelStep;}
fragmentOutputs.color=baseColor;}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["glowBlurPostProcessPixelShaderWGSL",0,{name:r,shader:i}])},83446,e=>{"use strict";var t=e.i(263537);let r="bilateralBlurPixelShader",i=`uniform sampler2D textureSampler;uniform sampler2D depthSampler;uniform sampler2D normalSampler;uniform int filterSize;uniform vec2 blurDir;uniform float depthThreshold;uniform float normalThreshold;varying vec2 vUV;void main(void) {vec3 color=textureLod(textureSampler,vUV,0.).rgb;float depth=textureLod(depthSampler,vUV,0.).x;if (depth>=1e6 || depth<=0.) {glFragColor=vec4(color,1.);return;}
vec3 normal=textureLod(normalSampler,vUV,0.).rgb;
#ifdef DECODE_NORMAL
normal=normal*2.0-1.0;
#endif
float sigma=float(filterSize);float two_sigma2=2.0*sigma*sigma;float sigmaDepth=depthThreshold;float two_sigmaDepth2=2.0*sigmaDepth*sigmaDepth;float sigmaNormal=normalThreshold;float two_sigmaNormal2=2.0*sigmaNormal*sigmaNormal;vec3 sum=vec3(0.);float wsum=0.;for (int x=-filterSize; x<=filterSize; ++x) {vec2 coords=vec2(x);vec3 sampleColor=textureLod(textureSampler,vUV+coords*blurDir,0.).rgb;float sampleDepth=textureLod(depthSampler,vUV+coords*blurDir,0.).r;vec3 sampleNormal=textureLod(normalSampler,vUV+coords*blurDir,0.).rgb;
#ifdef DECODE_NORMAL
sampleNormal=sampleNormal*2.0-1.0;
#endif
float r=dot(coords,coords);float w=exp(-r/two_sigma2);float depthDelta=abs(sampleDepth-depth);float wd=step(depthDelta,depthThreshold);vec3 normalDelta=abs(sampleNormal-normal);float wn=step(normalDelta.x+normalDelta.y+normalDelta.z,normalThreshold);sum+=sampleColor*w*wd*wn;wsum+=w*wd*wn;}
glFragColor=vec4(sum/wsum,1.);}
`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["bilateralBlurPixelShader",0,{name:r,shader:i}])},759366,e=>{"use strict";var t=e.i(263537);let r="iblShadowAccumulationPixelShader",i=`#ifdef GL_ES
precision mediump float;
#endif
varying vec2 vUV;uniform vec4 accumulationParameters;
#define remanence accumulationParameters.x
#define resetb accumulationParameters.y
#define sceneSize accumulationParameters.z
uniform sampler2D motionSampler;uniform sampler2D positionSampler;uniform sampler2D spatialBlurSampler;uniform sampler2D oldAccumulationSampler;uniform sampler2D prevPositionSampler;vec2 max2(vec2 v,vec2 w) { return vec2(max(v.x,w.x),max(v.y,w.y)); }
void main(void) {bool reset=bool(resetb);vec2 gbufferRes=vec2(textureSize(motionSampler,0));ivec2 gbufferPixelCoord=ivec2(vUV*gbufferRes);vec2 shadowRes=vec2(textureSize(spatialBlurSampler,0));ivec2 shadowPixelCoord=ivec2(vUV*shadowRes);vec4 LP=texelFetch(positionSampler,gbufferPixelCoord,0);if (0.0==LP.w) {gl_FragColor=vec4(1.0,0.0,0.0,1.0);return;}
vec2 velocityColor=texelFetch(motionSampler,gbufferPixelCoord,0).xy;vec2 prevCoord=vUV+velocityColor;vec3 PrevLP=texture(prevPositionSampler,prevCoord).xyz;vec4 PrevShadows=texture(oldAccumulationSampler,prevCoord);vec3 newShadows=texelFetch(spatialBlurSampler,shadowPixelCoord,0).xyz;PrevShadows.a =
!reset && all(lessThan(abs(prevCoord-vec2(0.5)),vec2(0.5))) &&
distance(LP.xyz,PrevLP)<5e-2*sceneSize
? max(PrevShadows.a/(1.0+PrevShadows.a),1.0-remanence)
: 1.0;PrevShadows=max(vec4(0.0),PrevShadows);gl_FragColor =
vec4(mix(PrevShadows.x,newShadows.x,PrevShadows.a),
mix(PrevShadows.y,newShadows.y,PrevShadows.a),
mix(PrevShadows.z,newShadows.z,PrevShadows.a),PrevShadows.a);}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["iblShadowAccumulationPixelShader",0,{name:r,shader:i}])},138464,e=>{"use strict";var t=e.i(440163),r=e.i(916624),i=e.i(774685);class a extends t.FlowGraphBlock{constructor(e){super(e),this.condition=this.registerDataInput("condition",r.RichTypeBoolean),this.onTrue=this.registerDataInput("onTrue",r.RichTypeAny),this.onFalse=this.registerDataInput("onFalse",r.RichTypeAny),this.output=this.registerDataOutput("output",r.RichTypeAny)}_updateOutputs(e){let t=this.condition.getValue(e);this.output.setValue(t?this.onTrue.getValue(e):this.onFalse.getValue(e),e)}getClassName(){return"FlowGraphConditionalBlock"}}(0,i.RegisterClass)("FlowGraphConditionalBlock",a),e.s(["FlowGraphConditionalDataBlock",0,a])},378108,e=>{"use strict";var t=e.i(916624),r=e.i(774685),i=e.i(196548),a=e.i(202286);class o extends i.FlowGraphCachedOperationBlock{constructor(e){super(t.RichTypeVector3,e),this.body=this.registerDataInput("body",t.RichTypeAny)}_doOperation(e){let t=this.body.getValue(e);if(!t)return;let r=e._getExecutionVariable(this,"_cachedVelocity",null);return r||(r=new a.Vector3,e._setExecutionVariable(this,"_cachedVelocity",r)),t.getAngularVelocityToRef(r),r}getClassName(){return"FlowGraphGetAngularVelocityBlock"}}(0,r.RegisterClass)("FlowGraphGetAngularVelocityBlock",o),e.s(["FlowGraphGetAngularVelocityBlock",0,o])},735939,e=>{"use strict";var t=e.i(440163),r=e.i(916624),i=e.i(774685);class a extends t.FlowGraphBlock{constructor(e){super(e),this.body=this.registerDataInput("body",r.RichTypeAny),this.mass=this.registerDataOutput("mass",r.RichTypeNumber),this.centerOfMass=this.registerDataOutput("centerOfMass",r.RichTypeVector3),this.inertia=this.registerDataOutput("inertia",r.RichTypeVector3)}_updateOutputs(e){let t=this.body.getValue(e);if(!t)return;let r=t.getMassProperties();void 0!==r.mass&&this.mass.setValue(r.mass,e),r.centerOfMass&&this.centerOfMass.setValue(r.centerOfMass,e),r.inertia&&this.inertia.setValue(r.inertia,e)}getClassName(){return"FlowGraphGetPhysicsMassPropertiesBlock"}}(0,i.RegisterClass)("FlowGraphGetPhysicsMassPropertiesBlock",a),e.s(["FlowGraphGetPhysicsMassPropertiesBlock",0,a])},404894,e=>{"use strict";var t=e.i(353679),r=e.i(916624),i=e.i(774685);class a extends t.FlowGraphExecutionBlockWithOutSignal{constructor(e){super(e),this.body=this.registerDataInput("body",r.RichTypeAny),this.motionType=this.registerDataInput("motionType",r.RichTypeNumber,2)}_execute(e,t){let r=this.body.getValue(e);if(!r){this._reportError(e,"No physics body provided"),this.out._activateSignal(e);return}r.setMotionType(this.motionType.getValue(e)),this.out._activateSignal(e)}getClassName(){return"FlowGraphSetPhysicsMotionTypeBlock"}}(0,i.RegisterClass)("FlowGraphSetPhysicsMotionTypeBlock",a),e.s(["FlowGraphSetPhysicsMotionTypeBlock",0,a])},45688,e=>{"use strict";var t=e.i(263537);let r="lodPixelShader",i=`precision highp float;const float GammaEncodePowerApprox=1.0/2.2;varying vec2 vUV;uniform sampler2D textureSampler;uniform float lod;uniform vec2 texSize;uniform int gamma;void main(void)
{ivec2 textureDimensions=textureSize(textureSampler,0);gl_FragColor=texelFetch(textureSampler,ivec2(vUV*vec2(textureDimensions)),int(lod));if (gamma==0) {gl_FragColor.rgb=pow(gl_FragColor.rgb,vec3(GammaEncodePowerApprox));}}
`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["lodPixelShader",0,{name:r,shader:i}])},975663,e=>{"use strict";var t=e.i(263537);let r="meshUVSpaceRendererPixelShader",i=`varying vDecalTC: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {if (input.vDecalTC.x<0. || input.vDecalTC.x>1. || input.vDecalTC.y<0. || input.vDecalTC.y>1.) {discard;}
fragmentOutputs.color=textureSample(textureSampler,textureSamplerSampler,input.vDecalTC);}
`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["meshUVSpaceRendererPixelShaderWGSL",0,{name:r,shader:i}])},998106,e=>{"use strict";var t=e.i(263537);let r="fluidRenderingParticleThicknessPixelShader",i=`uniform float particleAlpha;varying vec2 uv;void main(void) {vec3 normal;normal.xy=uv*2.0-1.0;float r2=dot(normal.xy,normal.xy);if (r2>1.0) discard;float thickness=sqrt(1.0-r2);glFragColor=vec4(vec3(particleAlpha*thickness),1.0);}
`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["fluidRenderingParticleThicknessPixelShader",0,{name:r,shader:i}])},502829,e=>{"use strict";var t=e.i(263537);let r="glowMapMergeVertexShader",i=`attribute position: vec2f;varying vUV: vec2f;
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input : VertexInputs)->FragmentInputs {const madd: vec2f= vec2f(0.5,0.5);
#define CUSTOM_VERTEX_MAIN_BEGIN
vertexOutputs.vUV=vertexInputs.position*madd+madd;vertexOutputs.position= vec4f(vertexInputs.position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["glowMapMergeVertexShaderWGSL",0,{name:r,shader:i}])},671922,e=>{"use strict";var t=e.i(263537);e.i(13486),e.i(243400),e.i(706568),e.i(300889);let r="greasedLineVertexShader",i=`#include<instancesDeclaration>
#include<sceneUboDeclaration>
#include<meshUboDeclaration>
attribute grl_widths: f32;
#ifdef GREASED_LINE_USE_OFFSETS
attribute grl_offsets: vec3f; 
#endif
attribute grl_colorPointers: f32;attribute position: vec3f;varying grlCounters: f32;varying grlColorPointer: f32;
#ifdef GREASED_LINE_CAMERA_FACING
attribute grl_nextAndCounters: vec4f;attribute grl_previousAndSide: vec4f;uniform grlResolution: vec2f;uniform grlAspect: f32;uniform grlWidth: f32;uniform grlSizeAttenuation: f32;fn grlFix(i: vec4f,aspect: f32)->vec2f {var res=i.xy/i.w;res.x*=aspect;return res;}
#else
attribute grl_slopes: vec3f;attribute grl_counters: f32;
#endif
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input : VertexInputs)->FragmentInputs {
#define CUSTOM_VERTEX_MAIN_BEGIN
#include<instancesVertex>
vertexOutputs.grlColorPointer=vertexInputs.grl_colorPointers;let grlMatrix: mat4x4f=scene.viewProjection*mesh.world ;
#ifdef GREASED_LINE_CAMERA_FACING
let grlBaseWidth: f32=uniforms.grlWidth;let grlPrevious: vec3f=vertexInputs.grl_previousAndSide.xyz;let grlSide: f32=vertexInputs.grl_previousAndSide.w;let grlNext: vec3f=vertexInputs.grl_nextAndCounters.xyz;vertexOutputs.grlCounters=vertexInputs.grl_nextAndCounters.w;let grlWidth:f32=grlBaseWidth*vertexInputs.grl_widths;
#ifdef GREASED_LINE_USE_OFFSETS
var grlPositionOffset: vec3f=vertexInputs.grl_offsets;
#else
var grlPositionOffset=vec3f(0.);
#endif
let positionUpdated: vec3f=vertexInputs.position+grlPositionOffset;let worldDir: vec3f=normalize(grlNext-grlPrevious);let nearPosition: vec3f=positionUpdated+(worldDir*0.001);let grlFinalPosition: vec4f=grlMatrix*vec4f(positionUpdated,1.0);let screenNearPos: vec4f=grlMatrix*vec4(nearPosition,1.0);let grlLinePosition: vec2f=grlFix(grlFinalPosition,uniforms.grlAspect);let grlLineNearPosition: vec2f=grlFix(screenNearPos,uniforms.grlAspect);let grlDir: vec2f=normalize(grlLineNearPosition-grlLinePosition);var grlNormal: vec4f=vec4f(-grlDir.y,grlDir.x,0.0,1.0);let grlHalfWidth: f32=0.5*grlWidth;
#if defined(GREASED_LINE_RIGHT_HANDED_COORDINATE_SYSTEM)
grlNormal.x*=-grlHalfWidth;grlNormal.y*=-grlHalfWidth;
#else
grlNormal.x*=grlHalfWidth;grlNormal.y*=grlHalfWidth;
#endif
grlNormal*=scene.projection;if (uniforms.grlSizeAttenuation==1.) {grlNormal.x*=grlFinalPosition.w;grlNormal.y*=grlFinalPosition.w;let pr=vec4f(uniforms.grlResolution,0.0,1.0)*scene.projection;grlNormal.x/=pr.x;grlNormal.y/=pr.y;}
vertexOutputs.position=vec4f(grlFinalPosition.xy+grlNormal.xy*grlSide,grlFinalPosition.z,grlFinalPosition.w);
#else
vertexOutputs.grlCounters=vertexInputs.grl_counters;
#ifdef GREASED_LINE_USE_OFFSETS
let grlPositionOffset: vec3f=vertexInputs.grl_offsets;
#else
let grlPositionOffset: vec3f=vec3f(0.0);
#endif
vertexOutputs.position=grlMatrix*vec4f(vertexInputs.position+grlPositionOffset+vertexInputs.grl_slopes*vertexInputs.grl_widths,1.0);
#endif
#define CUSTOM_VERTEX_MAIN_END
}
`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["greasedLineVertexShaderWGSL",0,{name:r,shader:i}])},608087,e=>{"use strict";var t=e.i(263537);e.i(828487),e.i(739589);let r="kernelBlurFragment",i=`#ifdef DOF
factor=sampleCoC(fragmentInputs.sampleCoord{X}); 
computedWeight=KERNEL_WEIGHT{X}*factor;sumOfWeights+=computedWeight;
#else
computedWeight=KERNEL_WEIGHT{X};
#endif
#ifdef PACKEDFLOAT
blend+=unpack(textureSample(textureSampler,textureSamplerSampler,fragmentInputs.sampleCoord{X}))*computedWeight;
#else
blend+=textureSample(textureSampler,textureSamplerSampler,fragmentInputs.sampleCoord{X})*computedWeight;
#endif
`;t.ShaderStore.IncludesShadersStoreWGSL[r]||(t.ShaderStore.IncludesShadersStoreWGSL[r]=i);let a="kernelBlurFragment2",o=`#ifdef DOF
factor=sampleCoC(fragmentInputs.sampleCenter+uniforms.delta*KERNEL_DEP_OFFSET{X});computedWeight=KERNEL_DEP_WEIGHT{X}*factor;sumOfWeights+=computedWeight;
#else
computedWeight=KERNEL_DEP_WEIGHT{X};
#endif
#ifdef PACKEDFLOAT
blend+=unpack(textureSample(textureSampler,textureSamplerSampler,fragmentInputs.sampleCenter+uniforms.delta*KERNEL_DEP_OFFSET{X}))*computedWeight;
#else
blend+=textureSample(textureSampler,textureSamplerSampler,fragmentInputs.sampleCenter+uniforms.delta*KERNEL_DEP_OFFSET{X})*computedWeight;
#endif
`;t.ShaderStore.IncludesShadersStoreWGSL[a]||(t.ShaderStore.IncludesShadersStoreWGSL[a]=o);let n="kernelBlurPixelShader",s=`var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;uniform delta: vec2f;varying sampleCenter: vec2f;
#ifdef DOF
var circleOfConfusionSamplerSampler: sampler;var circleOfConfusionSampler: texture_2d<f32>;fn sampleCoC(offset: vec2f)->f32 {var coc: f32=textureSample(circleOfConfusionSampler,circleOfConfusionSamplerSampler,offset).r;return coc; }
#endif
#include<kernelBlurVaryingDeclaration>[0..varyingCount]
#ifdef PACKEDFLOAT
#include<packingFunctions>
#endif
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var computedWeight: f32=0.0;
#ifdef PACKEDFLOAT
var blend: f32=0.;
#else
var blend: vec4f= vec4f(0.);
#endif
#ifdef DOF
var sumOfWeights: f32=CENTER_WEIGHT; 
var factor: f32=0.0;
#ifdef PACKEDFLOAT
blend+=unpack(textureSample(textureSampler,textureSamplerSampler,input.sampleCenter))*CENTER_WEIGHT;
#else
blend+=textureSample(textureSampler,textureSamplerSampler,input.sampleCenter)*CENTER_WEIGHT;
#endif
#endif
#include<kernelBlurFragment>[0..varyingCount]
#include<kernelBlurFragment2>[0..depCount]
#ifdef PACKEDFLOAT
fragmentOutputs.color=pack(blend);
#else
fragmentOutputs.color=blend;
#endif
#ifdef DOF
fragmentOutputs.color/=sumOfWeights;
#endif
}`;t.ShaderStore.ShadersStoreWGSL[n]||(t.ShaderStore.ShadersStoreWGSL[n]=s),e.s(["kernelBlurPixelShaderWGSL",0,{name:n,shader:s}],608087)},623321,e=>{"use strict";var t=e.i(868738),r=e.i(916624),i=e.i(774685),a=e.i(711835);class o extends t.FlowGraphEventBlock{constructor(e){super(e),this.type="PointerOut",this.pointerId=this.registerDataOutput("pointerId",r.RichTypeNumber),this.targetMesh=this.registerDataInput("targetMesh",r.RichTypeAny,e?.targetMesh),this.meshOutOfPointer=this.registerDataOutput("meshOutOfPointer",r.RichTypeAny)}_executeEvent(e,t){let r=this.targetMesh.getValue(e);return this.meshOutOfPointer.setValue(t.mesh,e),this.pointerId.setValue(t.pointerId,e),!(!(t.over&&(0,a._IsDescendantOf)(t.mesh,r))&&(t.mesh===r||(0,a._IsDescendantOf)(t.mesh,r)))||(this._execute(e),!this.config?.stopPropagation)}_preparePendingTasks(e){}_cancelPendingTasks(e){}getClassName(){return"FlowGraphPointerOutEventBlock"}}(0,i.RegisterClass)("FlowGraphPointerOutEventBlock",o),e.s(["FlowGraphPointerOutEventBlock",0,o])},475294,e=>{"use strict";var t=e.i(263537);let r="iblShadowGBufferDebugPixelShader",i=`#ifdef GL_ES
precision mediump float;
#endif
varying vec2 vUV;uniform sampler2D textureSampler;uniform sampler2D depthSampler;uniform sampler2D normalSampler;uniform sampler2D positionSampler;uniform sampler2D velocitySampler;uniform vec4 sizeParams;uniform float maxDepth;
#define offsetX sizeParams.x
#define offsetY sizeParams.y
#define widthScale sizeParams.z
#define heightScale sizeParams.w
void main(void) {vec2 uv =
vec2((offsetX+vUV.x)*widthScale,(offsetY+vUV.y)*heightScale);vec4 backgroundColour=texture2D(textureSampler,vUV).rgba;vec4 depth=texture2D(depthSampler,vUV);vec4 worldNormal=texture2D(normalSampler,vUV);vec4 worldPosition=texture2D(positionSampler,vUV);vec4 velocityLinear=texture2D(velocitySampler,vUV);if (uv.x<0.0 || uv.x>1.0 || uv.y<0.0 || uv.y>1.0) {gl_FragColor.rgba=backgroundColour;} else {gl_FragColor.a=1.0;if (uv.x<=0.25) {gl_FragColor.rgb=depth.rgb;gl_FragColor.a=1.0;} else if (uv.x<=0.5) {velocityLinear.rg=velocityLinear.rg*0.5+0.5;gl_FragColor.rgb=velocityLinear.rgb;} else if (uv.x<=0.75) {gl_FragColor.rgb=worldPosition.rgb;} else {gl_FragColor.rgb=worldNormal.rgb;}}}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["iblShadowGBufferDebugPixelShader",0,{name:r,shader:i}])},605261,e=>{"use strict";var t=e.i(353679),r=e.i(916624),i=e.i(774685);class a extends t.FlowGraphExecutionBlockWithOutSignal{constructor(e){super(e),this.body=this.registerDataInput("body",r.RichTypeAny),this.force=this.registerDataInput("force",r.RichTypeVector3),this.location=this.registerDataInput("location",r.RichTypeVector3)}_execute(e,t){let r=this.body.getValue(e);if(!r){this._reportError(e,"No physics body provided"),this.out._activateSignal(e);return}let i=this.force.getValue(e),a=this.location.getValue(e);r.applyForce(i,a),this.out._activateSignal(e)}getClassName(){return"FlowGraphApplyForceBlock"}}(0,i.RegisterClass)("FlowGraphApplyForceBlock",a),e.s(["FlowGraphApplyForceBlock",0,a])},206234,e=>{"use strict";var t=e.i(263537);let r="iblCdfyPixelShader",i=`varying vUV : vec2f;
#include <helperFunctions>
#ifdef IBL_USE_CUBE_MAP
var iblSourceSampler: sampler;var iblSource: texture_cube<f32>;
#else
var iblSourceSampler: sampler;var iblSource: texture_2d<f32>;
#endif
uniform iblHeight: i32;
#ifdef IBL_USE_CUBE_MAP
fn fetchCube(uv: vec2f)->f32 {var direction: vec3f=equirectangularToCubemapDirection(uv);return sin(PI*uv.y) *
dot(textureSampleLevel(iblSource,iblSourceSampler,direction,0.0)
.rgb,
LuminanceEncodeApprox);}
#else
fn fetchPanoramic(Coords: vec2i,envmapHeight: f32)->f32 {return sin(PI*(f32(Coords.y)+0.5)/envmapHeight) *
dot(textureLoad(iblSource,Coords,0).rgb,LuminanceEncodeApprox);}
#endif
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var coords: vec2i= vec2i(fragmentInputs.position.xy);var cdfy: f32=0.0;for (var y: i32=1; y<=coords.y; y++) {
#ifdef IBL_USE_CUBE_MAP
var uv: vec2f= vec2f(input.vUV.x,( f32(y-1)+0.5)/ f32(uniforms.iblHeight));cdfy+=fetchCube(uv);
#else
cdfy+=fetchPanoramic( vec2i(coords.x,y-1), f32(uniforms.iblHeight));
#endif
}
fragmentOutputs.color= vec4f(cdfy,0.0,0.0,1.0);}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["iblCdfyPixelShaderWGSL",0,{name:r,shader:i}])},919,e=>{"use strict";var t=e.i(916624),r=e.i(774685),i=e.i(196548),a=e.i(202286);class o extends i.FlowGraphCachedOperationBlock{constructor(e){super(t.RichTypeVector3,e),this.body=this.registerDataInput("body",t.RichTypeAny)}_doOperation(e){let t=this.body.getValue(e);if(!t)return;let r=e._getExecutionVariable(this,"_cachedVelocity",null);return r||(r=new a.Vector3,e._setExecutionVariable(this,"_cachedVelocity",r)),t.getLinearVelocityToRef(r),r}getClassName(){return"FlowGraphGetLinearVelocityBlock"}}(0,r.RegisterClass)("FlowGraphGetLinearVelocityBlock",o),e.s(["FlowGraphGetLinearVelocityBlock",0,o])},668568,e=>{"use strict";var t=e.i(263537);e.i(755704),e.i(739589),e.i(212954);let r="depthPixelShader",i=`#ifdef ALPHATEST
varying vUV: vec2f;var diffuseSamplerSampler: sampler;var diffuseSampler: texture_2d<f32>;
#endif
#include<clipPlaneFragmentDeclaration>
varying vDepthMetric: f32;
#ifdef PACKED
#include<packingFunctions>
#endif
#ifdef STORE_CAMERASPACE_Z
varying vViewPos: vec4f;
#endif
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {
#include<clipPlaneFragment>
#ifdef ALPHATEST
if (textureSample(diffuseSampler,diffuseSamplerSampler,input.vUV).a<0.4) {discard;}
#endif
#ifdef STORE_CAMERASPACE_Z
#ifdef PACKED
fragmentOutputs.color=pack(input.vViewPos.z);
#else
fragmentOutputs.color= vec4f(input.vViewPos.z,0.0,0.0,1.0);
#endif
#else
#ifdef NONLINEARDEPTH
#ifdef PACKED
fragmentOutputs.color=pack(input.position.z);
#else
fragmentOutputs.color= vec4f(input.position.z,0.0,0.0,0.0);
#endif
#else
#ifdef PACKED
fragmentOutputs.color=pack(input.vDepthMetric);
#else
fragmentOutputs.color= vec4f(input.vDepthMetric,0.0,0.0,1.0);
#endif
#endif
#endif
}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["depthPixelShaderWGSL",0,{name:r,shader:i}])},785967,e=>{"use strict";var t=e.i(263537);e.i(828487);let r="kernelBlurVertex";t.ShaderStore.IncludesShadersStoreWGSL[r]||(t.ShaderStore.IncludesShadersStoreWGSL[r]="vertexOutputs.sampleCoord{X}=vertexOutputs.sampleCenter+uniforms.delta*KERNEL_OFFSET{X};");let i="kernelBlurVertexShader",a=`attribute position: vec2f;uniform delta: vec2f;varying sampleCenter: vec2f;
#include<kernelBlurVaryingDeclaration>[0..varyingCount]
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input : VertexInputs)->FragmentInputs {const madd: vec2f= vec2f(0.5,0.5);
#define CUSTOM_VERTEX_MAIN_BEGIN
vertexOutputs.sampleCenter=(vertexInputs.position*madd+madd);
#include<kernelBlurVertex>[0..varyingCount]
vertexOutputs.position= vec4f(vertexInputs.position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;t.ShaderStore.ShadersStoreWGSL[i]||(t.ShaderStore.ShadersStoreWGSL[i]=a),e.s(["kernelBlurVertexShaderWGSL",0,{name:i,shader:a}],785967)},230963,e=>{"use strict";var t=e.i(440163),r=e.i(916624),i=e.i(774685);class a extends t.FlowGraphBlock{constructor(e){super(e),this.functionName=this.registerDataInput("functionName",r.RichTypeString),this.object=this.registerDataInput("object",r.RichTypeAny),this.context=this.registerDataInput("context",r.RichTypeAny,null),this.output=this.registerDataOutput("output",r.RichTypeAny)}_updateOutputs(e){let t=this.functionName.getValue(e),r=this.object.getValue(e),i=this.context.getValue(e);if(r&&t){let a=r[t];a&&"function"==typeof a&&this.output.setValue(a.bind(i),e)}}getClassName(){return"FlowGraphFunctionReference"}}(0,i.RegisterClass)("FlowGraphFunctionReference",a),e.s(["FlowGraphFunctionReferenceBlock",0,a])},43308,e=>{"use strict";var t=e.i(263537);let r="copyTexture3DLayerToTexturePixelShader",i=`var textureSampler: texture_3d<f32>;uniform layerNum: i32;varying vUV: vec2f;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {let coord=vec3f(vec2f(input.vUV.x,input.vUV.y)*vec2f(textureDimensions(textureSampler,0).xy),f32(uniforms.layerNum));let color=textureLoad(textureSampler,vec3i(coord),0).rgb;fragmentOutputs.color= vec4f(color,1);}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["copyTexture3DLayerToTexturePixelShaderWGSL",0,{name:r,shader:i}])},815754,e=>{"use strict";var t=e.i(263537);let r="anaglyphPixelShader",i=`varying vec2 vUV;uniform sampler2D textureSampler;uniform sampler2D leftSampler;
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void)
{vec4 leftFrag=texture2D(leftSampler,vUV);leftFrag=vec4(1.0,leftFrag.g,leftFrag.b,1.0);vec4 rightFrag=texture2D(textureSampler,vUV);rightFrag=vec4(rightFrag.r,1.0,1.0,1.0);gl_FragColor=vec4(rightFrag.rgb*leftFrag.rgb,1.0);}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["anaglyphPixelShader",0,{name:r,shader:i}])},364378,e=>{"use strict";var t=e.i(263537);let r="lightProxyPixelShader",i=`flat varying vOffset: u32;flat varying vMask: u32;uniform tileMaskResolution: vec3f;var<storage,read_write> tileMaskBuffer: array<atomic<u32>>;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {let maskResolution=vec2u(uniforms.tileMaskResolution.yz);let tilePosition=vec2u(fragmentInputs.position.xy);let tileIndex=(tilePosition.x*maskResolution.x+tilePosition.y)*maskResolution.y+fragmentInputs.vOffset;atomicOr(&tileMaskBuffer[tileIndex],fragmentInputs.vMask);}
`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["lightProxyPixelShaderWGSL",0,{name:r,shader:i}])},828414,e=>{"use strict";var t=e.i(263537);let r="areaLightTextureProcessingPixelShader",i=`uniform sampler2D textureSampler;uniform vec2 scalingRange;varying vec2 vUV;void main(void)
{float x=(vUV.x-scalingRange.x)/(scalingRange.y-scalingRange.x);float y=(vUV.y-scalingRange.x)/(scalingRange.y-scalingRange.x);vec2 scaledUV=vec2(x,y);gl_FragColor=texture2D(textureSampler,scaledUV);}
`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["areaLightTextureProcessingPixelShader",0,{name:r,shader:i}])},103446,e=>{"use strict";var t=e.i(263537);let r="iblShadowSpatialBlurPixelShader",i=`precision highp sampler2D;
#define PI 3.1415927
varying vec2 vUV;uniform sampler2D depthSampler;uniform sampler2D worldNormalSampler;uniform sampler2D voxelTracingSampler;uniform vec4 blurParameters;
#define stridef blurParameters.x
#define worldScale blurParameters.y
const float weights[5]=float[5](0.0625,0.25,0.375,0.25,0.0625);const int nbWeights=5;vec2 max2(vec2 v,vec2 w) {return vec2(max(v.x,w.x),max(v.y,w.y));}
void main(void)
{vec2 gbufferRes=vec2(textureSize(depthSampler,0));ivec2 gbufferPixelCoord=ivec2(vUV*gbufferRes);vec2 shadowRes=vec2(textureSize(voxelTracingSampler,0));ivec2 shadowPixelCoord=ivec2(vUV*shadowRes);vec3 N=texelFetch(worldNormalSampler,gbufferPixelCoord,0).xyz;if (length(N)<0.01) {glFragColor=vec4(1.0,1.0,0.0,1.0);return;}
float depth=-texelFetch(depthSampler,gbufferPixelCoord,0).x;vec4 X=vec4(0.0);for(int y=0; y<nbWeights; ++y) {for(int x=0; x<nbWeights; ++x) {ivec2 gBufferCoords=gbufferPixelCoord+int(stridef)*ivec2(x-(nbWeights>>1),y-(nbWeights>>1));ivec2 shadowCoords=shadowPixelCoord+int(stridef)*ivec2(x-(nbWeights>>1),y-(nbWeights>>1));vec4 T=texelFetch(voxelTracingSampler,shadowCoords,0);float ddepth=-texelFetch(depthSampler,gBufferCoords,0).x-depth;vec3 dN=texelFetch(worldNormalSampler,gBufferCoords,0).xyz-N;float w=weights[x]*weights[y] *
exp2(max(-1000.0/(worldScale*worldScale),-0.5) *
(ddepth*ddepth) -
1e1*dot(dN,dN));X+=vec4(w*T.x,w*T.y,w*T.z,w);}}
gl_FragColor=vec4(X.x/X.w,X.y/X.w,X.z/X.w,1.0);}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["iblShadowSpatialBlurPixelShader",0,{name:r,shader:i}])},105308,e=>{"use strict";var t=e.i(263537);let r="lodCubePixelShader",i=`const GammaEncodePowerApprox=1.0/2.2;varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_cube<f32>;uniform lod: f32;uniform gamma: i32;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {let uv=fragmentInputs.vUV*2.0-1.0;
#ifdef POSITIVEX
fragmentOutputs.color=textureSampleLevel(textureSampler,textureSamplerSampler,vec3f(1.001,uv.y,uv.x),uniforms.lod);
#endif
#ifdef NEGATIVEX
fragmentOutputs.color=textureSampleLevel(textureSampler,textureSamplerSampler,vec3f(-1.001,uv.y,uv.x),uniforms.lod);
#endif
#ifdef POSITIVEY
fragmentOutputs.color=textureSampleLevel(textureSampler,textureSamplerSampler,vec3f(uv.y,1.001,uv.x),uniforms.lod);
#endif
#ifdef NEGATIVEY
fragmentOutputs.color=textureSampleLevel(textureSampler,textureSamplerSampler,vec3f(uv.y,-1.001,uv.x),uniforms.lod);
#endif
#ifdef POSITIVEZ
fragmentOutputs.color=textureSampleLevel(textureSampler,textureSamplerSampler,vec3f(uv,1.001),uniforms.lod);
#endif
#ifdef NEGATIVEZ
fragmentOutputs.color=textureSampleLevel(textureSampler,textureSamplerSampler,vec3f(uv,-1.001),uniforms.lod);
#endif
if (uniforms.gamma==0) {fragmentOutputs.color=vec4f(pow(fragmentOutputs.color.rgb,vec3f(GammaEncodePowerApprox)),fragmentOutputs.color.a);}}
`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["lodCubePixelShaderWGSL",0,{name:r,shader:i}])},657921,e=>{"use strict";var t=e.i(868738),r=e.i(774685);class i extends t.FlowGraphEventBlock{constructor(){super(...arguments),this.initPriority=-1,this.type="SceneReady"}_executeEvent(e,t){return this._execute(e),!0}_preparePendingTasks(e){}_cancelPendingTasks(e){}getClassName(){return"FlowGraphSceneReadyEventBlock"}}(0,r.RegisterClass)("FlowGraphSceneReadyEventBlock",i),e.s(["FlowGraphSceneReadyEventBlock",0,i])},304764,e=>{"use strict";var t=e.i(263537);let r="highlightsPixelShader",i=`varying vec2 vUV;uniform sampler2D textureSampler;const vec3 RGBLuminanceCoefficients=vec3(0.2126,0.7152,0.0722);
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) 
{vec4 tex=texture2D(textureSampler,vUV);vec3 c=tex.rgb;float luma=dot(c.rgb,RGBLuminanceCoefficients);gl_FragColor=vec4(pow(c,vec3(25.0-luma*15.0)),tex.a); }`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["highlightsPixelShader",0,{name:r,shader:i}])},937928,e=>{"use strict";var t=e.i(263537);let r="depthBoxBlurPixelShader",i=`varying vec2 vUV;uniform sampler2D textureSampler;uniform vec2 screenSize;
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void)
{vec4 colorDepth=vec4(0.0);for (int x=-OFFSET; x<=OFFSET; x++)
for (int y=-OFFSET; y<=OFFSET; y++)
colorDepth+=texture2D(textureSampler,vUV+vec2(x,y)/screenSize);gl_FragColor=(colorDepth/float((OFFSET*2+1)*(OFFSET*2+1)));}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["depthBoxBlurPixelShader",0,{name:r,shader:i}])},766408,e=>{"use strict";var t=e.i(263537);let r="hdrIrradianceFilteringVertexShader",i=`attribute position: vec2f;varying direction: vec3f;uniform up: vec3f;uniform right: vec3f;uniform front: vec3f;
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input : VertexInputs)->FragmentInputs {
#define CUSTOM_VERTEX_MAIN_BEGIN
var view: mat3x3f= mat3x3f(uniforms.up,uniforms.right,uniforms.front);vertexOutputs.direction=view*vec3f(vertexInputs.position,1.0);vertexOutputs.position= vec4f(vertexInputs.position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["hdrIrradianceFilteringVertexShaderWGSL",0,{name:r,shader:i}])},710773,e=>{"use strict";var t=e.i(263537);let r="iblCdfxPixelShader",i=`precision highp sampler2D;
#define PI 3.1415927
varying vec2 vUV;uniform sampler2D cdfy;void main(void) {ivec2 cdfyRes=textureSize(cdfy,0);ivec2 currentPixel=ivec2(gl_FragCoord.xy);float cdfx=0.0;for (int x=1; x<=currentPixel.x; x++) {cdfx+=texelFetch(cdfy,ivec2(x-1,cdfyRes.y-1),0).x;}
gl_FragColor=vec4(vec3(cdfx),1.0);}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["iblCdfxPixelShader",0,{name:r,shader:i}])},122697,e=>{"use strict";var t=e.i(263537);let r="fluidRenderingParticleDiffusePixelShader",i=`uniform particleAlpha: f32;varying uv: vec2f;varying diffuseColor: vec3f;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var normalxy: vec2f=input.uv*2.0-1.0;var r2: f32=dot(normalxy,normalxy);if (r2>1.0) {discard;}
fragmentOutputs.color=vec4f(input.diffuseColor,1.0);}
`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["fluidRenderingParticleDiffusePixelShaderWGSL",0,{name:r,shader:i}])},759360,e=>{"use strict";var t=e.i(263537);let r="filterPixelShader",i=`varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;uniform kernelMatrix: mat4x4f;
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var baseColor: vec3f=textureSample(textureSampler,textureSamplerSampler,input.vUV).rgb;var updatedColor: vec3f=(uniforms.kernelMatrix* vec4f(baseColor,1.0)).rgb;fragmentOutputs.color= vec4f(updatedColor,1.0);}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["filterPixelShaderWGSL",0,{name:r,shader:i}])},917516,e=>{"use strict";var t=e.i(263537);let r="blackAndWhitePixelShader",i=`varying vec2 vUV;uniform sampler2D textureSampler;uniform float degree;
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) 
{vec3 color=texture2D(textureSampler,vUV).rgb;float luminance=dot(color,vec3(0.3,0.59,0.11)); 
vec3 blackAndWhite=vec3(luminance,luminance,luminance);gl_FragColor=vec4(color-((color-blackAndWhite)*degree),1.0);}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["blackAndWhitePixelShader",0,{name:r,shader:i}])},630952,e=>{"use strict";var t=e.i(263537);e.i(738124);let r="rgbdEncodePixelShader",i=`varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;
#include<helperFunctions>
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {fragmentOutputs.color=toRGBD(textureSample(textureSampler,textureSamplerSampler,input.vUV).rgb);}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["rgbdEncodePixelShaderWGSL",0,{name:r,shader:i}])},480518,e=>{"use strict";var t=e.i(263537);e.i(738124);let r="rgbdDecodePixelShader",i=`varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;
#include<helperFunctions>
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {fragmentOutputs.color=vec4f(fromRGBD(textureSample(textureSampler,textureSamplerSampler,input.vUV)),1.0);}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["rgbdDecodePixelShaderWGSL",0,{name:r,shader:i}])},341421,e=>{"use strict";var t=e.i(263537);let r="fluidRenderingParticleThicknessPixelShader",i=`uniform particleAlpha: f32;varying uv: vec2f;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var normalxy: vec2f=input.uv*2.0-1.0;var r2: f32=dot(normalxy,normalxy);if (r2>1.0) {discard;}
var thickness: f32=sqrt(1.0-r2);fragmentOutputs.color=vec4f(vec3f(uniforms.particleAlpha*thickness),1.0);}
`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["fluidRenderingParticleThicknessPixelShaderWGSL",0,{name:r,shader:i}])},909939,e=>{"use strict";var t=e.i(263537);e.i(201632);let r="extractHighlightsPixelShader",i=`#include<helperFunctions>
varying vec2 vUV;uniform sampler2D textureSampler;uniform float threshold;uniform float exposure;
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) 
{gl_FragColor=texture2D(textureSampler,vUV);float luma=dot(LuminanceEncodeApprox,gl_FragColor.rgb*exposure);gl_FragColor.rgb=step(threshold,luma)*gl_FragColor.rgb;}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["extractHighlightsPixelShader",0,{name:r,shader:i}])},757513,e=>{"use strict";var t=e.i(774685),r=e.i(303663);class i extends r.FlowGraphExecutionBlock{constructor(e){super(e),this.config=e,this.executionSignals=[],this.setNumberOfOutputSignals(this.config.outputSignalCount)}_execute(e){for(let t=0;t<this.executionSignals.length;t++)this.executionSignals[t]._activateSignal(e)}setNumberOfOutputSignals(e=1){for(;this.executionSignals.length>e;){let e=this.executionSignals.pop();e&&(e.disconnectFromAll(),this._unregisterSignalOutput(e.name))}for(;this.executionSignals.length<e;)this.executionSignals.push(this._registerSignalOutput(`out_${this.executionSignals.length}`))}getClassName(){return"FlowGraphSequenceBlock"}}(0,t.RegisterClass)("FlowGraphSequenceBlock",i),e.s(["FlowGraphSequenceBlock",0,i])},629101,e=>{"use strict";var t=e.i(440163),r=e.i(916624),i=e.i(774685),a=e.i(774100);class o extends t.FlowGraphBlock{constructor(e){super(e),this.config=e,this.object=this.registerDataInput("object",r.RichTypeAny),this.array=this.registerDataInput("array",r.RichTypeAny),this.index=this.registerDataOutput("index",r.RichTypeFlowGraphInteger,new a.FlowGraphInteger(-1))}_updateOutputs(e){let t=this.object.getValue(e),r=this.array.getValue(e);r&&this.index.setValue(new a.FlowGraphInteger(r.indexOf(t)),e)}serialize(e){super.serialize(e)}getClassName(){return"FlowGraphIndexOfBlock"}}(0,i.RegisterClass)("FlowGraphIndexOfBlock",o),e.s(["FlowGraphIndexOfBlock",0,o])},917304,e=>{"use strict";var t=e.i(263537);e.i(624154),e.i(568039),e.i(298378),e.i(369136),e.i(201632),e.i(24012),e.i(773111);let r="shadowMapVertexDeclaration",i=`#include<sceneVertexDeclaration>
#include<meshVertexDeclaration>
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.i(629238),e.i(997900);let a="shadowMapUboDeclaration",o=`layout(std140,column_major) uniform;
#include<sceneUboDeclaration>
#include<meshUboDeclaration>
`;t.ShaderStore.IncludesShadersStore[a]||(t.ShaderStore.IncludesShadersStore[a]=o);let n="shadowMapVertexExtraDeclaration",s=`#if SM_NORMALBIAS==1
uniform vec3 lightDataSM;
#endif
uniform vec3 biasAndScaleSM;uniform vec2 depthValuesSM;varying float vDepthMetricSM;
#if SM_USEDISTANCE==1
varying vec3 vPositionWSM;
#endif
#if defined(SM_DEPTHCLAMP) && SM_DEPTHCLAMP==1
varying float zSM;
#endif
`;t.ShaderStore.IncludesShadersStore[n]||(t.ShaderStore.IncludesShadersStore[n]=s),e.i(182478),e.i(675406),e.i(610460),e.i(587630),e.i(761523),e.i(479126);let l="shadowMapVertexNormalBias",f=`#if SM_NORMALBIAS==1
#if SM_DIRECTIONINLIGHTDATA==1
vec3 worldLightDirSM=normalize(-lightDataSM.xyz);
#else
vec3 directionToLightSM=lightDataSM.xyz-worldPos.xyz;vec3 worldLightDirSM=normalize(directionToLightSM);
#endif
float ndlSM=dot(vNormalW,worldLightDirSM);float sinNLSM=sqrt(1.0-ndlSM*ndlSM);float normalBiasSM=biasAndScaleSM.y*sinNLSM;worldPos.xyz-=vNormalW*normalBiasSM;
#endif
`;t.ShaderStore.IncludesShadersStore[l]||(t.ShaderStore.IncludesShadersStore[l]=f),e.i(481941),e.i(781801);let c="shadowMapVertexShader",d=`attribute vec3 position;
#ifdef NORMAL
attribute vec3 normal;
#endif
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]
#ifdef INSTANCES
attribute vec4 world0;attribute vec4 world1;attribute vec4 world2;attribute vec4 world3;
#endif
#include<helperFunctions>
#include<__decl__shadowMapVertex>
#ifdef ALPHATEXTURE
varying vec2 vUV;uniform mat4 diffuseMatrix;
#ifdef UV1
attribute vec2 uv;
#endif
#ifdef UV2
attribute vec2 uv2;
#endif
#endif
#include<shadowMapVertexExtraDeclaration>
#include<clipPlaneVertexDeclaration>
#define CUSTOM_VERTEX_DEFINITIONS
void main(void)
{vec3 positionUpdated=position;
#ifdef UV1
vec2 uvUpdated=uv;
#endif
#ifdef UV2
vec2 uv2Updated=uv2;
#endif
#ifdef NORMAL
vec3 normalUpdated=normal;
#endif
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
vec4 worldPos=finalWorld*vec4(positionUpdated,1.0);
#ifdef NORMAL
mat3 normWorldSM=mat3(finalWorld);
#if defined(INSTANCES) && defined(THIN_INSTANCES)
vec3 vNormalW=normalUpdated/vec3(dot(normWorldSM[0],normWorldSM[0]),dot(normWorldSM[1],normWorldSM[1]),dot(normWorldSM[2],normWorldSM[2]));vNormalW=normalize(normWorldSM*vNormalW);
#else
#ifdef NONUNIFORMSCALING
normWorldSM=transposeMat3(inverseMat3(normWorldSM));
#endif
vec3 vNormalW=normalize(normWorldSM*normalUpdated);
#endif
#endif
#include<shadowMapVertexNormalBias>
gl_Position=viewProjection*worldPos;
#include<shadowMapVertexMetric>
#ifdef ALPHATEXTURE
#ifdef UV1
vUV=vec2(diffuseMatrix*vec4(uvUpdated,1.0,0.0));
#endif
#ifdef UV2
vUV=vec2(diffuseMatrix*vec4(uv2Updated,1.0,0.0));
#endif
#endif
#include<clipPlaneVertex>
}`;t.ShaderStore.ShadersStore[c]||(t.ShaderStore.ShadersStore[c]=d),e.s(["shadowMapVertexShader",0,{name:c,shader:d}],917304)},348199,e=>{"use strict";var t=e.i(263537);let r="fluidRenderingRenderPixelShader",i=`#define DISABLE_UNIFORMITY_ANALYSIS
#define IOR 1.333
#define ETA 1.0/IOR
#define F0 0.02
var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;var depthSamplerSampler: sampler;var depthSampler: texture_2d<f32>;
#ifdef FLUIDRENDERING_DIFFUSETEXTURE
var diffuseSamplerSampler: sampler;var diffuseSampler: texture_2d<f32>;
#else
uniform diffuseColor: vec3f;
#endif
#ifdef FLUIDRENDERING_FIXED_THICKNESS
uniform thickness: f32;var bgDepthSamplerSampler: sampler;var bgDepthSampler: texture_2d<f32>;
#else
uniform minimumThickness: f32;var thicknessSamplerSampler: sampler;var thicknessSampler: texture_2d<f32>;
#endif
#ifdef FLUIDRENDERING_ENVIRONMENT
var reflectionSamplerSampler: sampler;var reflectionSampler: texture_cube<f32>;
#endif
#if defined(FLUIDRENDERING_DEBUG) && defined(FLUIDRENDERING_DEBUG_TEXTURE)
var debugSamplerSampler: sampler;var debugSampler: texture_2d<f32>;
#endif
uniform viewMatrix: mat4x4f;uniform projectionMatrix: mat4x4f;uniform invProjectionMatrix: mat4x4f;uniform texelSize: vec2f;uniform dirLight: vec3f;uniform cameraFar: f32;uniform density: f32;uniform refractionStrength: f32;uniform fresnelClamp: f32;uniform specularPower: f32;varying vUV: vec2f;fn computeViewPosFromUVDepth(texCoord: vec2f,depth: f32)->vec3f {var ndc: vec4f=vec4f(texCoord*2.0-1.0,0.0,1.0);
#ifdef FLUIDRENDERING_RHS
ndc.z=-uniforms.projectionMatrix[2].z+uniforms.projectionMatrix[3].z/depth;
#else
ndc.z=uniforms.projectionMatrix[2].z+uniforms.projectionMatrix[3].z/depth;
#endif
ndc.w=1.0;var eyePos: vec4f=uniforms.invProjectionMatrix*ndc;return eyePos.xyz/eyePos.w;}
fn getViewPosFromTexCoord(texCoord: vec2f)->vec3f {var depth: f32=textureSampleLevel(depthSampler,depthSamplerSampler,texCoord,0.).x;return computeViewPosFromUVDepth(texCoord,depth);}
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var texCoord: vec2f=input.vUV;
#if defined(FLUIDRENDERING_DEBUG) && defined(FLUIDRENDERING_DEBUG_TEXTURE)
var color: vec4f=textureSample(debugSampler,debugSamplerSampler,texCoord);
#ifdef FLUIDRENDERING_DEBUG_DEPTH
fragmentOutputs.color=vec4f(color.rgb/vec3f(2.0),1.);if (color.r>0.999 && color.g>0.999) {fragmentOutputs.color=textureSample(textureSampler,textureSamplerSampler,texCoord);}
#else
fragmentOutputs.color=vec4f(color.rgb,1.);if (color.r<0.001 && color.g<0.001 && color.b<0.001) {fragmentOutputs.color=textureSample(textureSampler,textureSamplerSampler,texCoord);}
#endif
return fragmentOutputs;
#endif
var depthVel: vec2f=textureSampleLevel(depthSampler,depthSamplerSampler,texCoord,0.).rg;var depth: f32=depthVel.r;
#ifndef FLUIDRENDERING_FIXED_THICKNESS
var thickness: f32=textureSample(thicknessSampler,thicknessSamplerSampler,texCoord).x;
#else
var thickness: f32=uniforms.thickness;var bgDepth: f32=textureSample(bgDepthSampler,bgDepthSamplerSampler,texCoord).x;var depthNonLinear: f32=uniforms.projectionMatrix[2].z+uniforms.projectionMatrix[3].z/depth;depthNonLinear=depthNonLinear*0.5+0.5;
#endif
var backColor: vec4f=textureSample(textureSampler,textureSamplerSampler,texCoord);
#ifndef FLUIDRENDERING_FIXED_THICKNESS
if (depth>=uniforms.cameraFar || depth<=0. || thickness<=uniforms.minimumThickness) {
#else
if (depth>=uniforms.cameraFar || depth<=0. || bgDepth<=depthNonLinear) {
#endif
#ifdef FLUIDRENDERING_COMPOSITE_MODE
fragmentOutputs.color=vec4f(backColor.rgb*backColor.a,backColor.a);
#else
fragmentOutputs.color=backColor;
#endif
return fragmentOutputs;}
var viewPos: vec3f=computeViewPosFromUVDepth(texCoord,depth);var ddx: vec3f=getViewPosFromTexCoord(texCoord+vec2f(uniforms.texelSize.x,0.))-viewPos;var ddy: vec3f=getViewPosFromTexCoord(texCoord+vec2f(0.,uniforms.texelSize.y))-viewPos;var ddx2: vec3f=viewPos-getViewPosFromTexCoord(texCoord+vec2f(-uniforms.texelSize.x,0.));if (abs(ddx.z)>abs(ddx2.z)) {ddx=ddx2;}
var ddy2: vec3f=viewPos-getViewPosFromTexCoord(texCoord+vec2f(0.,-uniforms.texelSize.y));if (abs(ddy.z)>abs(ddy2.z)) {ddy=ddy2;}
var normal: vec3f=normalize(cross(ddy,ddx));
#ifdef FLUIDRENDERING_RHS
normal=-normal;
#endif
#if defined(FLUIDRENDERING_DEBUG) && defined(FLUIDRENDERING_DEBUG_SHOWNORMAL)
fragmentOutputs.color=vec4f(normal*0.5+0.5,1.0);return fragmentOutputs;
#endif
var rayDir: vec3f=normalize(viewPos); 
#ifdef FLUIDRENDERING_DIFFUSETEXTURE
var diffuseColor: vec3f=textureSampleLevel(diffuseSampler,diffuseSamplerSampler,texCoord,0.0).rgb;
#else
var diffuseColor: vec3f=uniforms.diffuseColor;
#endif
var lightDir: vec3f=normalize((uniforms.viewMatrix*vec4f(-uniforms.dirLight,0.)).xyz);var H: vec3f =normalize(lightDir-rayDir);var specular: f32 =pow(max(0.0,dot(H,normal)),uniforms.specularPower);
#ifdef FLUIDRENDERING_DEBUG_DIFFUSERENDERING
var diffuse: f32 =max(0.0,dot(lightDir,normal))*1.0;fragmentOutputs.color=vec4f(vec3f(0.1) /*ambient*/+vec3f(0.42,0.50,1.00)*diffuse+vec3f(0,0,0.2)+specular,1.);return fragmentOutputs;
#endif
var refractionDir: vec3f=refract(rayDir,normal,ETA);var transmitted: vec4f=textureSampleLevel(textureSampler,textureSamplerSampler,vec2f(texCoord+refractionDir.xy*thickness*uniforms.refractionStrength),0.0);
#ifdef FLUIDRENDERING_COMPOSITE_MODE
if (transmitted.a==0.) {transmitted.a=thickness;}
#endif
var transmittance: vec3f=exp(-uniforms.density*thickness*(1.0-diffuseColor)); 
var refractionColor: vec3f=transmitted.rgb*transmittance;
#ifdef FLUIDRENDERING_ENVIRONMENT
var reflectionDir: vec3f=reflect(rayDir,normal);var reflectionColor: vec3f=(textureSample(reflectionSampler,reflectionSamplerSampler,reflectionDir).rgb);var fresnel: f32=clamp(F0+(1.0-F0)*pow(1.0-dot(normal,-rayDir),5.0),0.,uniforms.fresnelClamp);var finalColor: vec3f=mix(refractionColor,reflectionColor,fresnel)+specular;
#else
var finalColor: vec3f=refractionColor+specular;
#endif
#ifdef FLUIDRENDERING_VELOCITY
var velocity: f32=depthVel.g;finalColor=mix(finalColor,vec3f(1.0),smoothstep(0.3,1.0,velocity/6.0));
#endif
fragmentOutputs.color=vec4f(finalColor,transmitted.a);}
`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["fluidRenderingRenderPixelShaderWGSL",0,{name:r,shader:i}])},978835,e=>{"use strict";var t=e.i(353679),r=e.i(916624),i=e.i(774685),a=e.i(700183);class o extends t.FlowGraphExecutionBlockWithOutSignal{constructor(e){if(super(e),this.message=this.registerDataInput("message",r.RichTypeAny),this.logType=this.registerDataInput("logType",r.RichTypeString,"log"),e?.messageTemplate)for(const t of this._getTemplateMatches(e.messageTemplate))this.registerDataInput(t,r.RichTypeAny)}_execute(e){let t=this.logType.getValue(e),r=this._getMessageValue(e);"warn"===t?a.Logger.Warn(r):"error"===t?a.Logger.Error(r):a.Logger.Log(r),this.out._activateSignal(e)}getClassName(){return"FlowGraphConsoleLogBlock"}_serializeValue(e){if(null==e)return String(e);if("object"==typeof e){let t=e.toString();if("[object Object]"===t)try{return JSON.stringify(e)}catch{}return t}return String(e)}_getMessageValue(e){if(!this.config?.messageTemplate)return this.message.getValue(e);{let t=this.config.messageTemplate,r=this._getTemplateMatches(t),i=this.message.getValue(e),a=null!=i&&"object"==typeof i?i:null;for(let i of r){let r;if(void 0!==(r=null!==a&&i in a?a[i]:this.getDataInput(i)?.getValue(e))){let e=i.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");t=t.replace(RegExp(`\\{${e}\\}`,"g"),this._serializeValue(r))}}return t}}_getTemplateMatches(e){let t,r=/\{([^}]+)\}/g,i=[];for(;null!==(t=r.exec(e));)i.push(t[1]);return i}}(0,i.RegisterClass)("FlowGraphConsoleLogBlock",o),e.s(["FlowGraphConsoleLogBlock",0,o])},141195,e=>{"use strict";var t=e.i(353679),r=e.i(774685),i=e.i(916624),a=e.i(774100);class o extends t.FlowGraphExecutionBlockWithOutSignal{constructor(e){super(e),this.config=e,this.inFlows=[],this._cachedActivationState=[],this.reset=this._registerSignalInput("reset"),this.completed=this._registerSignalOutput("completed"),this.remainingInputs=this.registerDataOutput("remainingInputs",i.RichTypeFlowGraphInteger,new a.FlowGraphInteger(this.config.inputSignalCount||0));for(let e=0;e<this.config.inputSignalCount;e++)this.inFlows.push(this._registerSignalInput(`in_${e}`));this._unregisterSignalInput("in")}_getCurrentActivationState(e){let t=this._cachedActivationState;if(t.length=0,e._hasExecutionVariable(this,"activationState")){let r=e._getExecutionVariable(this,"activationState",[]);for(let e=0;e<r.length;e++)t.push(r[e])}else for(let e=0;e<this.config.inputSignalCount;e++)t.push(!1);return t}_execute(e,t){let r=this._getCurrentActivationState(e);if(t===this.reset)for(let e=0;e<this.config.inputSignalCount;e++)r[e]=!1;else{let e=this.inFlows.indexOf(t);e>=0&&(r[e]=!0)}if(this.remainingInputs.setValue(new a.FlowGraphInteger(r.filter(e=>!e).length),e),e._setExecutionVariable(this,"activationState",r.slice()),r.includes(!1))t!==this.reset&&this.out._activateSignal(e);else{this.completed._activateSignal(e);for(let e=0;e<this.config.inputSignalCount;e++)r[e]=!1}}getClassName(){return"FlowGraphWaitAllBlock"}serialize(e){super.serialize(e),e.config.inputFlows=this.config.inputSignalCount}}(0,r.RegisterClass)("FlowGraphWaitAllBlock",o),e.s(["FlowGraphWaitAllBlock",0,o])},929154,e=>{"use strict";var t=e.i(916624),r=e.i(774685),i=e.i(353679),a=e.i(700183);class o extends i.FlowGraphExecutionBlockWithOutSignal{constructor(e){super(e),this.config=e,this.condition=this.registerDataInput("condition",t.RichTypeBoolean),this.executionFlow=this._registerSignalOutput("executionFlow"),this.completed=this._registerSignalOutput("completed"),this._unregisterSignalOutput("out")}_execute(e,t){let r=this.condition.getValue(e);this.config?.doWhile&&!r&&this.executionFlow._activateSignal(e);let i=0;for(;r;){if(this.executionFlow._activateSignal(e),++i>=o.MaxLoopCount){a.Logger.Warn("FlowGraphWhileLoopBlock: Max loop count reached. Breaking.");break}r=this.condition.getValue(e)}this.completed._activateSignal(e)}getClassName(){return"FlowGraphWhileLoopBlock"}}o.MaxLoopCount=1e3,(0,r.RegisterClass)("FlowGraphWhileLoopBlock",o),e.s(["FlowGraphWhileLoopBlock",0,o])},147311,e=>{"use strict";var t=e.i(263537);e.i(30653),e.i(127010),e.i(94556);let r="spritesVertexShader",i=`attribute vec4 position;attribute vec2 options;attribute vec2 offsets;attribute vec2 inverts;attribute vec4 cellInfo;attribute vec4 color;uniform mat4 view;uniform mat4 projection;varying vec2 vUV;varying vec4 vColor;
#include<fogVertexDeclaration>
#include<logDepthDeclaration>
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
vec3 viewPos=(view*vec4(position.xyz,1.0)).xyz; 
vec2 cornerPos;float angle=position.w;vec2 size=vec2(options.x,options.y);vec2 offset=offsets.xy;cornerPos=vec2(offset.x-0.5,offset.y -0.5)*size;vec3 rotatedCorner;rotatedCorner.x=cornerPos.x*cos(angle)-cornerPos.y*sin(angle);rotatedCorner.y=cornerPos.x*sin(angle)+cornerPos.y*cos(angle);rotatedCorner.z=0.;viewPos+=rotatedCorner;gl_Position=projection*vec4(viewPos,1.0); 
vColor=color;vec2 uvOffset=vec2(abs(offset.x-inverts.x),abs(1.0-offset.y-inverts.y));vec2 uvPlace=cellInfo.xy;vec2 uvSize=cellInfo.zw;vUV.x=uvPlace.x+uvSize.x*uvOffset.x;vUV.y=uvPlace.y+uvSize.y*uvOffset.y;
#ifdef FOG
vFogDistance=viewPos;
#endif
#include<logDepthVertex>
#define CUSTOM_VERTEX_MAIN_END
}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["spritesVertexShader",0,{name:r,shader:i}])},212545,e=>{"use strict";var t=e.i(263537);let r="fluidRenderingBilateralBlurPixelShader",i=`var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;uniform maxFilterSize: i32;uniform blurDir: vec2f;uniform projectedParticleConstant: f32;uniform depthThreshold: f32;varying vUV: vec2f;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var depth: f32=textureSampleLevel(textureSampler,textureSamplerSampler,input.vUV,0.).x;if (depth>=1e6 || depth<=0.) {fragmentOutputs.color=vec4f(vec3f(depth),1.);return fragmentOutputs;}
var filterSize: i32=min(uniforms.maxFilterSize,i32(ceil(uniforms.projectedParticleConstant/depth)));var sigma: f32=f32(filterSize)/3.0;var two_sigma2: f32=2.0*sigma*sigma;var sigmaDepth: f32=uniforms.depthThreshold/3.0;var two_sigmaDepth2: f32=2.0*sigmaDepth*sigmaDepth;var sum: f32=0.;var wsum: f32=0.;var sumVel: f32=0.;for (var x: i32=-filterSize; x<=filterSize; x++) {var coords: vec2f=vec2f(f32(x));var sampleDepthVel: vec2f=textureSampleLevel(textureSampler,textureSamplerSampler,input.vUV+coords*uniforms.blurDir,0.).rg;var r: f32=dot(coords,coords);var w: f32=exp(-r/two_sigma2);var rDepth: f32=sampleDepthVel.r-depth;var wd: f32=exp(-rDepth*rDepth/two_sigmaDepth2);sum+=sampleDepthVel.r*w*wd;sumVel+=sampleDepthVel.g*w*wd;wsum+=w*wd;}
fragmentOutputs.color=vec4f(sum/wsum,sumVel/wsum,0.,1.);}
`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["fluidRenderingBilateralBlurPixelShaderWGSL",0,{name:r,shader:i}])},967217,e=>{"use strict";var t=e.i(353679),r=e.i(916624),i=e.i(774685);class a extends t.FlowGraphExecutionBlockWithOutSignal{constructor(e){super(e),this.body=this.registerDataInput("body",r.RichTypeAny),this.impulse=this.registerDataInput("impulse",r.RichTypeVector3),this.location=this.registerDataInput("location",r.RichTypeVector3)}_execute(e,t){let r=this.body.getValue(e);if(!r){this._reportError(e,"No physics body provided"),this.out._activateSignal(e);return}let i=this.impulse.getValue(e),a=this.location.getValue(e);r.applyImpulse(i,a),this.out._activateSignal(e)}getClassName(){return"FlowGraphApplyImpulseBlock"}}(0,i.RegisterClass)("FlowGraphApplyImpulseBlock",a),e.s(["FlowGraphApplyImpulseBlock",0,a])},565848,e=>{"use strict";var t=e.i(263537);e.i(201632),e.i(424192),e.i(62766);let r="screenSpaceReflection2PixelShader",i=`#if defined(WEBGL2) || defined(WEBGPU) || defined(NATIVE)
#define TEXTUREFUNC(s,c,lod) texture2DLodEXT(s,c,lod)
#define TEXTURECUBEFUNC(s,c,lod) textureLod(s,c,lod)
#else
#define TEXTUREFUNC(s,c,bias) texture2D(s,c,bias)
#define TEXTURECUBEFUNC(s,c,bias) textureCube(s,c,bias)
#endif
uniform sampler2D textureSampler;varying vec2 vUV;
#ifdef SSR_SUPPORTED
uniform sampler2D reflectivitySampler;uniform sampler2D normalSampler;uniform sampler2D depthSampler;
#ifdef SSRAYTRACE_USE_BACK_DEPTHBUFFER
uniform sampler2D backDepthSampler;uniform float backSizeFactor;
#endif
#ifdef SSR_USE_ENVIRONMENT_CUBE
uniform samplerCube envCubeSampler;
#ifdef SSR_USE_LOCAL_REFLECTIONMAP_CUBIC
uniform vec3 vReflectionPosition;uniform vec3 vReflectionSize;
#endif
#endif
uniform mat4 view;uniform mat4 invView;uniform mat4 projection;uniform mat4 invProjectionMatrix;uniform mat4 projectionPixel;uniform float nearPlaneZ;uniform float farPlaneZ;uniform float stepSize;uniform float maxSteps;uniform float strength;uniform float thickness;uniform float roughnessFactor;uniform float reflectionSpecularFalloffExponent;uniform float maxDistance;uniform float selfCollisionNumSkip;uniform float reflectivityThreshold;
#include<helperFunctions>
#include<pbrBRDFFunctions>
#include<screenSpaceRayTrace>
vec3 hash(vec3 a)
{a=fract(a*0.8);a+=dot(a,a.yxz+19.19);return fract((a.xxy+a.yxx)*a.zyx);}
float computeAttenuationForIntersection(ivec2 hitPixel,vec2 hitUV,vec3 vsRayOrigin,vec3 vsHitPoint,vec3 reflectionVector,float maxRayDistance,float numIterations) {float attenuation=1.0;
#ifdef SSR_ATTENUATE_SCREEN_BORDERS
vec2 dCoords=smoothstep(0.2,0.6,abs(vec2(0.5,0.5)-hitUV.xy));attenuation*=clamp(1.0-(dCoords.x+dCoords.y),0.0,1.0);
#endif
#ifdef SSR_ATTENUATE_INTERSECTION_DISTANCE
attenuation*=1.0-clamp(distance(vsRayOrigin,vsHitPoint)/maxRayDistance,0.0,1.0);
#endif
#ifdef SSR_ATTENUATE_INTERSECTION_NUMITERATIONS
attenuation*=1.0-(numIterations/maxSteps);
#endif
#ifdef SSR_ATTENUATE_BACKFACE_REFLECTION
vec3 reflectionNormal=texelFetch(normalSampler,hitPixel,0).xyz;float directionBasedAttenuation=smoothstep(-0.17,0.0,dot(reflectionNormal,-reflectionVector));attenuation*=directionBasedAttenuation;
#endif
return attenuation;}
#endif
void main()
{
#ifdef SSR_SUPPORTED
vec4 colorFull=TEXTUREFUNC(textureSampler,vUV,0.0);vec3 color=colorFull.rgb;vec4 reflectivity=max(TEXTUREFUNC(reflectivitySampler,vUV,0.0),vec4(0.));
#ifndef SSR_DISABLE_REFLECTIVITY_TEST
if (max(reflectivity.r,max(reflectivity.g,reflectivity.b))<=reflectivityThreshold) {
#ifdef SSR_USE_BLUR
gl_FragColor=vec4(0.);
#else
gl_FragColor=colorFull;
#endif
return;}
#endif
#ifdef SSR_INPUT_IS_GAMMA_SPACE
color=toLinearSpace(color);
#endif
vec2 texSize=vec2(textureSize(depthSampler,0));vec3 csNormal=texelFetch(normalSampler,ivec2(vUV*texSize),0).xyz; 
#ifdef SSR_DECODE_NORMAL
csNormal=csNormal*2.0-1.0;
#endif
#ifdef SSR_NORMAL_IS_IN_WORLDSPACE
csNormal=(view*vec4(csNormal,0.0)).xyz;
#endif
float depth=texelFetch(depthSampler,ivec2(vUV*texSize),0).r;
#ifdef SSRAYTRACE_SCREENSPACE_DEPTH
depth=linearizeDepth(depth,nearPlaneZ,farPlaneZ);
#endif
vec3 csPosition=computeViewPosFromUVDepth(vUV,depth,projection,invProjectionMatrix);
#ifdef ORTHOGRAPHIC_CAMERA
vec3 csViewDirection=vec3(0.,0.,1.);
#else
vec3 csViewDirection=normalize(csPosition);
#endif
vec3 csReflectedVector=reflect(csViewDirection,csNormal);
#ifdef SSR_USE_ENVIRONMENT_CUBE
vec3 wReflectedVector=vec3(invView*vec4(csReflectedVector,0.0));
#ifdef SSR_USE_LOCAL_REFLECTIONMAP_CUBIC
vec4 worldPos=invView*vec4(csPosition,1.0);wReflectedVector=parallaxCorrectNormal(worldPos.xyz,normalize(wReflectedVector),vReflectionSize,vReflectionPosition);
#endif
#ifdef SSR_INVERTCUBICMAP
wReflectedVector.y*=-1.0;
#endif
#ifdef SSRAYTRACE_RIGHT_HANDED_SCENE
wReflectedVector.z*=-1.0;
#endif
vec3 envColor=TEXTURECUBEFUNC(envCubeSampler,wReflectedVector,0.0).xyz;
#ifdef SSR_ENVIRONMENT_CUBE_IS_GAMMASPACE
envColor=toLinearSpace(envColor);
#endif
#else
vec3 envColor=color;
#endif
float reflectionAttenuation=1.0;bool rayHasHit=false;vec2 startPixel;vec2 hitPixel;vec3 hitPoint;float numIterations;
#ifdef SSRAYTRACE_DEBUG
vec3 debugColor;
#endif
#ifdef SSR_ATTENUATE_FACING_CAMERA
reflectionAttenuation*=1.0-smoothstep(0.25,0.5,dot(-csViewDirection,csReflectedVector));
#endif
if (reflectionAttenuation>0.0) {
#ifdef SSR_USE_BLUR
vec3 jitt=vec3(0.);
#else
float roughness=1.0-reflectivity.a;vec3 jitt=mix(vec3(0.0),hash(csPosition)-vec3(0.5),roughness)*roughnessFactor; 
#endif
vec2 uv2=vUV*texSize;float c=(uv2.x+uv2.y)*0.25;float jitter=mod(c,1.0); 
rayHasHit=traceScreenSpaceRay1(
csPosition,
normalize(csReflectedVector+jitt),
projectionPixel,
depthSampler,
texSize,
#ifdef SSRAYTRACE_USE_BACK_DEPTHBUFFER
backDepthSampler,
backSizeFactor,
#endif
thickness,
nearPlaneZ,
farPlaneZ,
stepSize,
jitter,
maxSteps,
maxDistance,
selfCollisionNumSkip,
startPixel,
hitPixel,
hitPoint,
numIterations
#ifdef SSRAYTRACE_DEBUG
,debugColor
#endif
);}
#ifdef SSRAYTRACE_DEBUG
gl_FragColor=vec4(debugColor,1.);return;
#endif
vec3 F0=reflectivity.rgb;vec3 fresnel=fresnelSchlickGGX(max(dot(csNormal,-csViewDirection),0.0),F0,vec3(1.));vec3 SSR=envColor;if (rayHasHit) {vec3 reflectedColor=texelFetch(textureSampler,ivec2(hitPixel),0).rgb;
#ifdef SSR_INPUT_IS_GAMMA_SPACE
reflectedColor=toLinearSpace(reflectedColor);
#endif
reflectionAttenuation*=computeAttenuationForIntersection(ivec2(hitPixel),hitPixel/texSize,csPosition,hitPoint,csReflectedVector,maxDistance,numIterations);SSR=reflectedColor*reflectionAttenuation+(1.0-reflectionAttenuation)*envColor;}
#ifndef SSR_BLEND_WITH_FRESNEL
SSR*=fresnel;
#endif
SSR=clamp(SSR,vec3(0.0),vec3(1000.0)); 
#ifdef SSR_USE_BLUR
float blur_radius=0.0;float roughness=1.0-reflectivity.a*(1.0-roughnessFactor);if (roughness>0.001) {float cone_angle=min(roughness,0.999)*3.14159265*0.5;float cone_len=distance(startPixel,hitPixel);float op_len=2.0*tan(cone_angle)*cone_len; 
float a=op_len;float h=cone_len;float a2=a*a;float fh2=4.0f*h*h;blur_radius=(a*(sqrt(a2+fh2)-a))/(4.0f*h);}
gl_FragColor=vec4(SSR,blur_radius/255.0); 
#else
#ifdef SSR_BLEND_WITH_FRESNEL
vec3 reflectionMultiplier=clamp(pow(fresnel*strength,vec3(reflectionSpecularFalloffExponent)),0.0,1.0);
#else
vec3 reflectionMultiplier=clamp(pow(reflectivity.rgb*strength,vec3(reflectionSpecularFalloffExponent)),0.0,1.0);
#endif
vec3 colorMultiplier=1.0-reflectionMultiplier;vec3 finalColor=(color*colorMultiplier)+(SSR*reflectionMultiplier);
#ifdef SSR_OUTPUT_IS_GAMMA_SPACE
finalColor=toGammaSpace(finalColor);
#endif
gl_FragColor=vec4(finalColor,colorFull.a);
#endif
#else
gl_FragColor=TEXTUREFUNC(textureSampler,vUV,0.0);
#endif
}
`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["screenSpaceReflection2PixelShader",0,{name:r,shader:i}])},41520,e=>{"use strict";var t=e.i(263537);e.i(349e3),e.i(158271),e.i(357351),e.i(84318),e.i(492952),e.i(505913);let r="particlesVertexShader",i=`attribute position: vec3f;attribute color: vec4f;attribute angle: f32;attribute size: vec2f;
#ifdef ANIMATESHEET
attribute cellIndex: f32;
#endif
#ifndef BILLBOARD
attribute direction: vec3f;
#endif
#ifdef BILLBOARDSTRETCHED
attribute direction: vec3f;
#endif
#ifdef RAMPGRADIENT
attribute remapData: vec4f;
#endif
attribute offset: vec2f;uniform view: mat4x4f;uniform projection: mat4x4f;uniform translationPivot: vec2f;
#ifdef ANIMATESHEET
uniform particlesInfos: vec3f; 
#endif
varying vUV: vec2f;varying vColor: vec4f;
#ifdef POSITIONW_AS_VARYING
varying vPositionW: vec3f;
#endif
#ifdef RAMPGRADIENT
varying remapRanges: vec4f;
#endif
#if defined(BILLBOARD) && !defined(BILLBOARDY) && !defined(BILLBOARDSTRETCHED)
uniform invView: mat4x4f;
#endif
#include<clipPlaneVertexDeclaration>
#include<fogVertexDeclaration>
#include<logDepthDeclaration>
#ifdef BILLBOARD
uniform eyePosition: vec3f;
#endif
fn rotate(yaxis: vec3f,rotatedCorner: vec3f)->vec3f {var xaxis: vec3f=normalize(cross( vec3f(0.,1.0,0.),yaxis));var zaxis: vec3f=normalize(cross(yaxis,xaxis));var row0: vec3f= vec3f(xaxis.x,xaxis.y,xaxis.z);var row1: vec3f= vec3f(yaxis.x,yaxis.y,yaxis.z);var row2: vec3f= vec3f(zaxis.x,zaxis.y,zaxis.z);var rotMatrix: mat3x3f= mat3x3f(row0,row1,row2);var alignedCorner: vec3f=rotMatrix*rotatedCorner;return vertexInputs.position+alignedCorner;}
#ifdef BILLBOARDSTRETCHED
fn rotateAlign(toCamera: vec3f,rotatedCorner: vec3f)->vec3f {var normalizedToCamera: vec3f=normalize(toCamera);var normalizedCrossDirToCamera: vec3f=normalize(cross(normalize(vertexInputs.direction),normalizedToCamera));var row0: vec3f= vec3f(normalizedCrossDirToCamera.x,normalizedCrossDirToCamera.y,normalizedCrossDirToCamera.z);var row2: vec3f= vec3f(normalizedToCamera.x,normalizedToCamera.y,normalizedToCamera.z);
#ifdef BILLBOARDSTRETCHED_LOCAL
var row1: vec3f=normalize(vertexInputs.direction);
#else
var crossProduct: vec3f=normalize(cross(normalizedToCamera,normalizedCrossDirToCamera));var row1: vec3f= vec3f(crossProduct.x,crossProduct.y,crossProduct.z);
#endif
var rotMatrix: mat3x3f= mat3x3f(row0,row1,row2);var alignedCorner: vec3f=rotMatrix*rotatedCorner;return vertexInputs.position+alignedCorner;}
#endif
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input : VertexInputs)->FragmentInputs {
#define CUSTOM_VERTEX_MAIN_BEGIN
var cornerPos: vec2f;var vPositionW: vec3f;cornerPos=( vec2f(vertexInputs.offset.x-0.5,vertexInputs.offset.y -0.5)-uniforms.translationPivot)*vertexInputs.size;
#ifdef BILLBOARD
var rotatedCorner: vec3f;
#ifdef BILLBOARDY
rotatedCorner.x=cornerPos.x*cos(vertexInputs.angle)-cornerPos.y*sin(vertexInputs.angle)+uniforms.translationPivot.x;rotatedCorner.z=cornerPos.x*sin(vertexInputs.angle)+cornerPos.y*cos(vertexInputs.angle)+uniforms.translationPivot.y;rotatedCorner.y=0.;var yaxis: vec3f=vertexInputs.position-uniforms.eyePosition;yaxis.y=0.;vPositionW=rotate(normalize(yaxis),rotatedCorner);var viewPos: vec3f=(uniforms.view* vec4f(vPositionW,1.0)).xyz;
#elif defined(BILLBOARDSTRETCHED)
rotatedCorner.x=cornerPos.x*cos(vertexInputs.angle)-cornerPos.y*sin(vertexInputs.angle)+uniforms.translationPivot.x;rotatedCorner.y=cornerPos.x*sin(vertexInputs.angle)+cornerPos.y*cos(vertexInputs.angle)+uniforms.translationPivot.y;rotatedCorner.z=0.;var toCamera: vec3f=vertexInputs.position-uniforms.eyePosition;vPositionW=rotateAlign(toCamera,rotatedCorner);var viewPos: vec3f=(uniforms.view* vec4f(vPositionW,1.0)).xyz;
#else
rotatedCorner.x=cornerPos.x*cos(vertexInputs.angle)-cornerPos.y*sin(vertexInputs.angle)+uniforms.translationPivot.x;rotatedCorner.y=cornerPos.x*sin(vertexInputs.angle)+cornerPos.y*cos(vertexInputs.angle)+uniforms.translationPivot.y;rotatedCorner.z=0.;var viewPos: vec3f=(uniforms.view* vec4f(vertexInputs.position,1.0)).xyz+rotatedCorner;vPositionW=(uniforms.invView* vec4f(viewPos,1)).xyz;
#endif
#ifdef RAMPGRADIENT
vertexOutputs.remapRanges=vertexInputs.remapData;
#endif
vertexOutputs.position=uniforms.projection* vec4f(viewPos,1.0);
#else
var rotatedCorner: vec3f;rotatedCorner.x=cornerPos.x*cos(vertexInputs.angle)-cornerPos.y*sin(vertexInputs.angle)+uniforms.translationPivot.x;rotatedCorner.z=cornerPos.x*sin(vertexInputs.angle)+cornerPos.y*cos(vertexInputs.angle)+uniforms.translationPivot.y;rotatedCorner.y=0.;var yaxis: vec3f=normalize(vertexInputs.direction);vPositionW=rotate(yaxis,rotatedCorner);vertexOutputs.position=uniforms.projection*uniforms.view* vec4f(vPositionW,1.0);
#endif
vertexOutputs.vColor=vertexInputs.color;
#ifdef ANIMATESHEET
var rowOffset: f32=floor(vertexInputs.cellIndex*uniforms.particlesInfos.z);var columnOffset: f32=vertexInputs.cellIndex-rowOffset/uniforms.particlesInfos.z;var uvScale: vec2f=uniforms.particlesInfos.xy;var uvOffset: vec2f= vec2f(vertexInputs.offset.x ,1.0-vertexInputs.offset.y);vertexOutputs.vUV=(uvOffset+ vec2f(columnOffset,rowOffset))*uvScale;
#else
vertexOutputs.vUV=vertexInputs.offset;
#endif
#if defined(CLIPPLANE) || defined(CLIPPLANE2) || defined(CLIPPLANE3) || defined(CLIPPLANE4) || defined(CLIPPLANE5) || defined(CLIPPLANE6) || defined(FOG)
var worldPos: vec4f= vec4f(vPositionW,1.0);
#endif
#ifdef POSITIONW_AS_VARYING
vertexOutputs.vPositionW=vPositionW;
#endif
#include<clipPlaneVertex>
#include<fogVertex>
#include<logDepthVertex>
#define CUSTOM_VERTEX_MAIN_END
}`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["particlesVertexShaderWGSL",0,{name:r,shader:i}])},275679,e=>{"use strict";var t=e.i(263537);e.i(624154),e.i(568039),e.i(298378),e.i(369136),e.i(182478),e.i(880779),e.i(675406),e.i(610460),e.i(587630),e.i(761523),e.i(479126),e.i(781801);let r="glowMapGenerationVertexShader",i=`attribute vec3 position;
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]
#include<clipPlaneVertexDeclaration>
#include<instancesDeclaration>
uniform mat4 viewProjection;varying vec4 vPosition;
#ifdef UV1
attribute vec2 uv;
#endif
#ifdef UV2
attribute vec2 uv2;
#endif
#ifdef DIFFUSE
varying vec2 vUVDiffuse;uniform mat4 diffuseMatrix;
#endif
#ifdef OPACITY
varying vec2 vUVOpacity;uniform mat4 opacityMatrix;
#endif
#ifdef EMISSIVE
varying vec2 vUVEmissive;uniform mat4 emissiveMatrix;
#endif
#ifdef VERTEXALPHA
attribute vec4 color;varying vec4 vColor;
#endif
#define CUSTOM_VERTEX_DEFINITIONS
void main(void)
{vec3 positionUpdated=position;
#ifdef UV1
vec2 uvUpdated=uv;
#endif
#ifdef UV2
vec2 uv2Updated=uv2;
#endif
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
vec4 worldPos=finalWorld*vec4(positionUpdated,1.0);
#ifdef CUBEMAP
vPosition=worldPos;gl_Position=viewProjection*finalWorld*vec4(position,1.0);
#else
vPosition=viewProjection*worldPos;gl_Position=vPosition;
#endif
#ifdef DIFFUSE
#ifdef DIFFUSEUV1
vUVDiffuse=vec2(diffuseMatrix*vec4(uvUpdated,1.0,0.0));
#endif
#ifdef DIFFUSEUV2
vUVDiffuse=vec2(diffuseMatrix*vec4(uv2Updated,1.0,0.0));
#endif
#endif
#ifdef OPACITY
#ifdef OPACITYUV1
vUVOpacity=vec2(opacityMatrix*vec4(uvUpdated,1.0,0.0));
#endif
#ifdef OPACITYUV2
vUVOpacity=vec2(opacityMatrix*vec4(uv2Updated,1.0,0.0));
#endif
#endif
#ifdef EMISSIVE
#ifdef EMISSIVEUV1
vUVEmissive=vec2(emissiveMatrix*vec4(uvUpdated,1.0,0.0));
#endif
#ifdef EMISSIVEUV2
vUVEmissive=vec2(emissiveMatrix*vec4(uv2Updated,1.0,0.0));
#endif
#endif
#ifdef VERTEXALPHA
vColor=color;
#endif
#include<clipPlaneVertex>
}`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["glowMapGenerationVertexShader",0,{name:r,shader:i}])},389895,e=>{"use strict";var t=e.i(263537);e.i(704290),e.i(346145);let r="kernelBlurFragment",i=`#ifdef DOF
factor=sampleCoC(sampleCoord{X}); 
computedWeight=KERNEL_WEIGHT{X}*factor;sumOfWeights+=computedWeight;
#else
computedWeight=KERNEL_WEIGHT{X};
#endif
#ifdef PACKEDFLOAT
blend+=unpack(texture2D(textureSampler,sampleCoord{X}))*computedWeight;
#else
blend+=texture2D(textureSampler,sampleCoord{X})*computedWeight;
#endif
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i);let a="kernelBlurFragment2",o=`#ifdef DOF
factor=sampleCoC(sampleCenter+delta*KERNEL_DEP_OFFSET{X});computedWeight=KERNEL_DEP_WEIGHT{X}*factor;sumOfWeights+=computedWeight;
#else
computedWeight=KERNEL_DEP_WEIGHT{X};
#endif
#ifdef PACKEDFLOAT
blend+=unpack(texture2D(textureSampler,sampleCenter+delta*KERNEL_DEP_OFFSET{X}))*computedWeight;
#else
blend+=texture2D(textureSampler,sampleCenter+delta*KERNEL_DEP_OFFSET{X})*computedWeight;
#endif
`;t.ShaderStore.IncludesShadersStore[a]||(t.ShaderStore.IncludesShadersStore[a]=o);let n="kernelBlurPixelShader",s=`uniform sampler2D textureSampler;uniform vec2 delta;varying vec2 sampleCenter;
#ifdef DOF
uniform sampler2D circleOfConfusionSampler;float sampleCoC(in vec2 offset) {float coc=texture2D(circleOfConfusionSampler,offset).r;return coc; }
#endif
#include<kernelBlurVaryingDeclaration>[0..varyingCount]
#ifdef PACKEDFLOAT
#include<packingFunctions>
#endif
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void)
{float computedWeight=0.0;
#ifdef PACKEDFLOAT
float blend=0.;
#else
vec4 blend=vec4(0.);
#endif
#ifdef DOF
float sumOfWeights=CENTER_WEIGHT; 
float factor=0.0;
#ifdef PACKEDFLOAT
blend+=unpack(texture2D(textureSampler,sampleCenter))*CENTER_WEIGHT;
#else
blend+=texture2D(textureSampler,sampleCenter)*CENTER_WEIGHT;
#endif
#endif
#include<kernelBlurFragment>[0..varyingCount]
#include<kernelBlurFragment2>[0..depCount]
#ifdef PACKEDFLOAT
gl_FragColor=pack(blend);
#else
gl_FragColor=blend;
#endif
#ifdef DOF
gl_FragColor/=sumOfWeights;
#endif
}`;t.ShaderStore.ShadersStore[n]||(t.ShaderStore.ShadersStore[n]=s),e.s(["kernelBlurPixelShader",0,{name:n,shader:s}],389895)},471255,e=>{"use strict";var t=e.i(868738),r=e.i(805664),i=e.i(774685),a=e.i(711835),o=e.i(916624);class n extends t.FlowGraphEventBlock{constructor(e){super(e),this.config=e,this.type="MeshPick",this.asset=this.registerDataInput("asset",o.RichTypeAny,e?.targetMesh),this.pickedPoint=this.registerDataOutput("pickedPoint",o.RichTypeVector3),this.pickOrigin=this.registerDataOutput("pickOrigin",o.RichTypeVector3),this.pointerId=this.registerDataOutput("pointerId",o.RichTypeNumber),this.pickedMesh=this.registerDataOutput("pickedMesh",o.RichTypeAny),this.pointerType=this.registerDataInput("pointerType",o.RichTypeAny,r.PointerEventTypes.POINTERPICK)}_getReferencedMesh(e){return this.asset.getValue(e)}_executeEvent(e,t){if(this.pointerType.getValue(e)!==t.type)return!0;let r=this._getReferencedMesh(e),i=t.pickInfo?.pickedMesh;return(r?i&&(i===r||(0,a._IsDescendantOf)(i,r)||i.name===r.name):i)&&i?(this.pointerId.setValue(t.event.pointerId,e),this.pickOrigin.setValue(t.pickInfo.ray?.origin,e),this.pickedPoint.setValue(t.pickInfo.pickedPoint,e),this.pickedMesh.setValue(i,e),this._execute(e),!this.config?.stopPropagation):(this.pointerId.resetToDefaultValue(e),this.pickOrigin.resetToDefaultValue(e),this.pickedPoint.resetToDefaultValue(e),this.pickedMesh.resetToDefaultValue(e),!0)}_preparePendingTasks(e){}_cancelPendingTasks(e){}getClassName(){return"FlowGraphMeshPickEventBlock"}}(0,i.RegisterClass)("FlowGraphMeshPickEventBlock",n),e.s(["FlowGraphMeshPickEventBlock",0,n])},151812,e=>{"use strict";var t=e.i(263537);e.i(319240),e.i(197003),e.i(182478),e.i(30653),e.i(127010),e.i(201632),e.i(549030),e.i(781801),e.i(313976),e.i(94556);let r="gaussianSplattingVertexShader",i=`#include<__decl__gaussianSplattingVertex>
#ifdef LOGARITHMICDEPTH
#extension GL_EXT_frag_depth : enable
#endif
#include<clipPlaneVertexDeclaration>
#include<fogVertexDeclaration>
#include<logDepthDeclaration>
#include<helperFunctions>
uniform vec2 invViewport;uniform vec2 dataTextureSize;uniform vec2 focal;uniform float kernelSize;uniform vec3 eyePosition;uniform float alpha;
#if IS_COMPOUND
uniform mat4 partWorld[MAX_PART_COUNT];uniform float partVisibility[MAX_PART_COUNT];
#endif
uniform sampler2D covariancesATexture;uniform sampler2D covariancesBTexture;uniform sampler2D centersTexture;uniform sampler2D colorsTexture;
#if SH_DEGREE>0
uniform highp usampler2D shTexture0;
#endif
#if SH_DEGREE>1
uniform highp usampler2D shTexture1;
#endif
#if SH_DEGREE>2
uniform highp usampler2D shTexture2;
#endif
#if SH_DEGREE>3
uniform highp usampler2D shTexture3;uniform highp usampler2D shTexture4;
#endif
#if IS_COMPOUND
uniform sampler2D partIndicesTexture;
#endif
varying vec4 vColor;varying vec2 vPosition;
#define CUSTOM_VERTEX_DEFINITIONS
#include<gaussianSplatting>
void main () {
#define CUSTOM_VERTEX_MAIN_BEGIN
float splatIndex=getSplatIndex(int(position.z+0.5));Splat splat=readSplat(splatIndex);vec3 covA=splat.covA.xyz;vec3 covB=vec3(splat.covA.w,splat.covB.xy);
#if IS_COMPOUND
mat4 splatWorld=getPartWorld(splat.partIndex);
#else
mat4 splatWorld=world;
#endif
vec4 worldPos=splatWorld*vec4(splat.center.xyz,1.0);vColor=splat.color;vPosition=position.xy;
#if SH_DEGREE>0
mat3 worldRot=mat3(splatWorld);mat3 normWorldRot=inverseMat3(worldRot);vec3 eyeToSplatLocalSpace=normalize(normWorldRot*(worldPos.xyz-eyePosition));vColor.xyz=splat.color.xyz+computeSH(splat,eyeToSplatLocalSpace);
#endif
vColor.w*=alpha;
#if IS_COMPOUND
vColor.w*=partVisibility[splat.partIndex];
#endif
vec2 scale=vec2(1.,1.);
#define CUSTOM_VERTEX_UPDATE
gl_Position=gaussianSplatting(position.xy,worldPos.xyz,scale,covA,covB,splatWorld,view,projection);
#include<clipPlaneVertex>
#include<fogVertex>
#include<logDepthVertex>
#define CUSTOM_VERTEX_MAIN_END
}
`;t.ShaderStore.ShadersStore[r]||(t.ShaderStore.ShadersStore[r]=i),e.s(["gaussianSplattingVertexShader",0,{name:r,shader:i}])},331527,993859,e=>{"use strict";var t=e.i(993754);class r extends t.AbstractAudioBus{constructor(e,t,r){super(e,t),this._spatialAutoUpdate=!0,this._spatialMinUpdateTime=0,this._outBus=null,this._spatial=null,this._onOutBusDisposed=()=>{this.outBus=this.engine.defaultMainBus},"boolean"==typeof r.spatialAutoUpdate&&(this._spatialAutoUpdate=r.spatialAutoUpdate),"number"==typeof r.spatialMinUpdateTime&&(this._spatialMinUpdateTime=r.spatialMinUpdateTime)}get outBus(){return this._outBus}set outBus(e){if(this._outBus!==e){if(this._outBus&&(this._outBus.onDisposeObservable.removeCallback(this._onOutBusDisposed),!this._disconnect(this._outBus)))throw Error("Disconnect failed");if(this._outBus=e,this._outBus&&(this._outBus.onDisposeObservable.add(this._onOutBusDisposed),!this._connect(this._outBus)))throw Error("Connect failed")}}get spatial(){return this._spatial?this._spatial:this._initSpatialProperty()}dispose(){super.dispose(),this._spatial?.dispose(),this._spatial=null,this._outBus&&this._outBus.onDisposeObservable.removeCallback(this._onOutBusDisposed),this._outBus=null}_initSpatialProperty(){return this._spatial=this._createSpatialProperty(this._spatialAutoUpdate,this._spatialMinUpdateTime)}}e.s(["AudioBus",0,r],993859);var i=e.i(611436),a=e.i(238463),o=e.i(411702),n=e.i(305836);class s extends r{constructor(e,t,r){super(e,t,r),this._stereo=null,this._subGraph=new s._SubGraph(this)}async _initAsync(e){e.outBus?this.outBus=e.outBus:(await this.engine.isReadyPromise,this.outBus=this.engine.defaultMainBus),await this._subGraph.initAsync(e),(0,i._HasSpatialAudioOptions)(e)&&this._initSpatialProperty(),this.engine._addNode(this)}dispose(){super.dispose(),this._stereo=null,this.engine._removeNode(this)}get _inNode(){return this._subGraph._inNode}get _outNode(){return this._subGraph._outNode}get stereo(){return this._stereo??(this._stereo=new a._StereoAudio(this._subGraph))}getClassName(){return"_WebAudioBus"}_createSpatialProperty(e,t){return new n._SpatialWebAudio(this._subGraph,e,t)}_connect(e){return!!super._connect(e)&&(e._inNode&&this._outNode?.connect(e._inNode),!0)}_disconnect(e){return!!super._disconnect(e)&&(e._inNode&&this._outNode?.disconnect(e._inNode),!0)}}s._SubGraph=class extends o._WebAudioBusAndSoundSubGraph{get _downstreamNodes(){return this._owner._downstreamNodes??null}get _upstreamNodes(){return this._owner._upstreamNodes??null}},e.s(["_WebAudioBus",0,s],331527)},472772,e=>{"use strict";var t=e.i(263537);e.i(585817),e.i(945868),e.i(465697),e.i(398879),e.i(92372);let r="iblVoxelGridVertexShader",i=`#include <bakedVertexAnimationDeclaration>
#include <bonesDeclaration>(attribute matricesIndices : vec4f;,,attribute matricesWeights : vec4f;,,attribute matricesIndicesExtra : vec4f;,,attribute matricesWeightsExtra : vec4f;,)
#include <helperFunctions>
#include <instancesDeclaration>
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]
#include<vertexPullingDeclaration>
uniform invWorldScale : mat4x4f;varying vNormalizedPosition : vec3f;flat varying f_swizzle : i32;fn calculateTriangleNormal(v0
: vec3<f32>,v1
: vec3<f32>,v2
: vec3<f32>)
->vec3<f32> {let edge1=v1-v0;let edge2=v2-v0;let triangleNormal=cross(edge1,edge2);let normalizedTriangleNormal=normalize(triangleNormal);return normalizedTriangleNormal;}
@vertex
fn main(input : VertexInputs)->FragmentInputs {
#include <morphTargetsVertexGlobal>
var triPositions: array<vec3f,3>;var thisTriIndex : u32=vertexInputs.vertexIndex; 
for (var i: u32=0u; i<3u; i=i+1u) {var provokingVertNum : u32=vertexInputs.vertexIndex/3*3;let vertIdx=vp_readVertexIndex(provokingVertNum+i);if (provokingVertNum+i==vertexInputs.vertexIndex) {thisTriIndex=i;}
var positionUpdated=vp_readPosition(uniforms.vp_position_info,vertIdx);
#include <instancesVertex>
let inputPosition: vec3f=positionUpdated;
#include <morphTargetsVertex>(vertexInputs.position\\),inputPosition),vertexInputs.vertexIndex,vertIdx)[0..maxSimultaneousMorphTargets]
#if NUM_BONE_INFLUENCERS>0
let matrixIndex=vp_readBoneIndices(uniforms.vp_matricesIndices_info,vertIdx);let matrixWeight=vp_readBoneWeights(uniforms.vp_matricesWeights_info,vertIdx);
#if NUM_BONE_INFLUENCERS>4
let matrixIndexExtra=vp_readBoneIndicesExtra(uniforms.vp_matricesIndicesExtra_info,vertIdx);let matrixWeightExtra=vp_readBoneWeightsExtra(uniforms.vp_matricesWeightsExtra_info,vertIdx);
#endif
#endif
#include<bonesVertex>(vertexInputs.matricesIndices,matrixIndex,vertexInputs.matricesWeights,matrixWeight,vertexInputs.matricesIndicesExtra,matrixIndexExtra,vertexInputs.matricesWeightsExtra,matrixWeightExtra)
#include<bakedVertexAnimation>(vertexInputs.matricesIndices,matrixIndex,vertexInputs.matricesWeights,matrixWeight,vertexInputs.matricesIndicesExtra,matrixIndexExtra,vertexInputs.matricesWeightsExtra,matrixWeightExtra)
triPositions[i]=(finalWorld*vec4(positionUpdated,1.0)).xyz;}
var N : vec3<f32>=calculateTriangleNormal(triPositions[0],triPositions[1],triPositions[2]);let worldPos=triPositions[thisTriIndex];vertexOutputs.position=uniforms.invWorldScale*vec4(worldPos,1.0);N=abs(N);if (N.x>N.y && N.x>N.z) {vertexOutputs.f_swizzle=0;vertexOutputs.position=vec4f(vertexOutputs.position.yzx,1.0);} else if (N.y>N.z) {vertexOutputs.f_swizzle=1;vertexOutputs.position=vec4f(vertexOutputs.position.zxy,1.0);} else {vertexOutputs.f_swizzle=2;vertexOutputs.position=vec4f(vertexOutputs.position.xyz,1.0);}
vertexOutputs.vNormalizedPosition=vertexOutputs.position.xyz*0.5+0.5;vertexOutputs.position.z =
vertexOutputs.vNormalizedPosition.z; }
`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["iblVoxelGridVertexShaderWGSL",0,{name:r,shader:i}])},837438,e=>{"use strict";var t=e.i(263537);let r="lineVertexDeclaration",i=`uniform mat4 viewProjection;
#define ADDITIONAL_VERTEX_DECLARATION
`;t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]=i),e.i(629238),e.i(997900);let a="lineUboDeclaration",o=`layout(std140,column_major) uniform;
#include<sceneUboDeclaration>
#include<meshUboDeclaration>
`;t.ShaderStore.IncludesShadersStore[a]||(t.ShaderStore.IncludesShadersStore[a]=o),e.i(880779),e.i(182478),e.i(127010),e.i(587630),e.i(781801),e.i(94556);let n="lineVertexShader",s=`#include<__decl__lineVertex>
#include<instancesDeclaration>
#include<clipPlaneVertexDeclaration>
attribute vec3 position;attribute vec4 normal;uniform float width;uniform float aspectRatio;
#include<logDepthDeclaration>
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
#include<instancesVertex>
mat4 worldViewProjection=viewProjection*finalWorld;vec4 viewPosition=worldViewProjection*vec4(position,1.0);vec4 viewPositionNext=worldViewProjection*vec4(normal.xyz,1.0);vec2 currentScreen=viewPosition.xy/viewPosition.w;vec2 nextScreen=viewPositionNext.xy/viewPositionNext.w;currentScreen.x*=aspectRatio;nextScreen.x*=aspectRatio;vec2 dir=normalize(nextScreen-currentScreen);vec2 normalDir=vec2(-dir.y,dir.x);normalDir*=width/2.0;normalDir.x/=aspectRatio;vec4 offset=vec4(normalDir*normal.w,0.0,0.0);gl_Position=viewPosition+offset;
#if defined(CLIPPLANE) || defined(CLIPPLANE2) || defined(CLIPPLANE3) || defined(CLIPPLANE4) || defined(CLIPPLANE5) || defined(CLIPPLANE6)
vec4 worldPos=finalWorld*vec4(position,1.0);
#include<clipPlaneVertex>
#endif
#include<logDepthVertex>
#define CUSTOM_VERTEX_MAIN_END
}`;t.ShaderStore.ShadersStore[n]||(t.ShaderStore.ShadersStore[n]=s),e.s(["lineVertexShader",0,{name:n,shader:s}],837438)},354777,e=>{"use strict";var t=e.i(263537);e.i(579618),e.i(738124),e.i(407892),e.i(380244),e.i(13486),e.i(349e3),e.i(158271),e.i(557330),e.i(357351),e.i(300889),e.i(398879),e.i(92372),e.i(84318),e.i(492952),e.i(158752),e.i(505913);let r="backgroundVertexShader",i=`#include<backgroundUboDeclaration>
#include<helperFunctions>
attribute position: vec3f;
#ifdef NORMAL
attribute normal: vec3f;
#endif
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<instancesDeclaration>
varying vPositionW: vec3f;
#ifdef NORMAL
varying vNormalW: vec3f;
#endif
#ifdef UV1
attribute uv: vec2f;
#endif
#ifdef UV2
attribute uv2: vec2f;
#endif
#ifdef MAINUV1
varying vMainUV1: vec2f;
#endif
#ifdef MAINUV2
varying vMainUV2: vec2f;
#endif
#if defined(DIFFUSE) && DIFFUSEDIRECTUV==0
varying vDiffuseUV: vec2f;
#endif
#include<clipPlaneVertexDeclaration>
#include<fogVertexDeclaration>
#include<lightVxUboDeclaration>[0..maxSimultaneousLights]
#ifdef REFLECTIONMAP_SKYBOX
varying vPositionUVW: vec3f;
#endif
#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)
varying vDirectionW: vec3f;
#endif
#include<logDepthDeclaration>
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input : VertexInputs)->FragmentInputs {
#define CUSTOM_VERTEX_MAIN_BEGIN
#ifdef REFLECTIONMAP_SKYBOX
vertexOutputs.vPositionUVW=vertexInputs.position;
#endif
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
#ifdef MULTIVIEW
if (gl_ViewID_OVR==0u) {vertexOutputs.position=scene.viewProjection*finalWorld* vec4f(vertexInputs.position,1.0);} else {vertexOutputs.position=scene.viewProjectionR*finalWorld* vec4f(vertexInputs.position,1.0);}
#else
vertexOutputs.position=scene.viewProjection*finalWorld* vec4f(vertexInputs.position,1.0);
#endif
var worldPos: vec4f=finalWorld* vec4f(vertexInputs.position,1.0);vertexOutputs.vPositionW= worldPos.xyz;
#ifdef NORMAL
var normalWorld: mat3x3f=mat3x3f(finalWorld[0].xyz,finalWorld[1].xyz,finalWorld[2].xyz);
#ifdef NONUNIFORMSCALING
normalWorld=transposeMat3(inverseMat3(normalWorld));
#endif
vertexOutputs.vNormalW=normalize(normalWorld*vertexInputs.normal);
#endif
#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)
vertexOutputs.vDirectionW=normalize((finalWorld*vec4f(vertexInputs.position,0.0)).xyz);
#ifdef EQUIRECTANGULAR_RELFECTION_FOV
var screenToWorld: mat3x3f=inverseMat3( mat3x3f(finalWorld*scene.viewProjection));var segment: vec3f=mix(vertexOutputs.vDirectionW,screenToWorld* vec3f(0.0,0.0,1.0),abs(fFovMultiplier-1.0));if (fFovMultiplier<=1.0) {vertexOutputs.vDirectionW=normalize(segment);} else {vertexOutputs.vDirectionW=normalize(vertexOutputs.vDirectionW+(vertexOutputs.vDirectionW-segment));}
#endif
#endif
#ifndef UV1
var uv: vec2f=vec2f(0.,0.);
#else
var uv=vertexInputs.uv;
#endif
#ifndef UV2
var uv2: vec2f=vec2f(0.,0.);
#else
var uv2=vertexInputs.uv2;
#endif
#ifdef MAINUV1
vertexOutputs.vMainUV1=uv;
#endif
#ifdef MAINUV2
vertexOutputs.vMainUV2=uv2;
#endif
#if defined(DIFFUSE) && DIFFUSEDIRECTUV==0
if (uniforms.vDiffuseInfos.x==0.)
{vertexOutputs.vDiffuseUV= (uniforms.diffuseMatrix* vec4f(uv,1.0,0.0)).xy;}
else
{vertexOutputs.vDiffuseUV= (uniforms.diffuseMatrix* vec4f(uv2,1.0,0.0)).xy;}
#endif
#include<clipPlaneVertex>
#include<fogVertex>
#include<shadowsVertex>[0..maxSimultaneousLights]
#ifdef VERTEXCOLOR
vertexOutputs.vColor=vertexInputs.color;
#endif
#include<logDepthVertex>
#define CUSTOM_VERTEX_MAIN_END
}
`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["backgroundVertexShaderWGSL",0,{name:r,shader:i}])},375941,e=>{"use strict";var t=e.i(263537);let r="ssao2PixelShader",i=`varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;
#ifdef SSAO
const scales: array<f32,16>=array<f32,16>(
0.1,
0.11406250000000001,
0.131640625,
0.15625,
0.187890625,
0.2265625,
0.272265625,
0.325,
0.384765625,
0.4515625,
0.525390625,
0.60625,
0.694140625,
0.7890625,
0.891015625,
1.0
);uniform near: f32;uniform radius: f32;var depthSamplerSampler: sampler;var depthSampler: texture_2d<f32>;var randomSamplerSampler: sampler;var randomSampler: texture_2d<f32>;var normalSamplerSampler: sampler;var normalSampler: texture_2d<f32>;uniform randTextureTiles: f32;uniform samplesFactor: f32;uniform sampleSphere: array<vec3f,SAMPLES>;uniform totalStrength: f32;uniform base: f32;
#ifdef ORTHOGRAPHIC_CAMERA
uniform viewport: vec4f;
#else
uniform xViewport: f32;uniform yViewport: f32;
#endif
uniform depthProjection: mat3x3f;uniform maxZ: f32;uniform minZAspect: f32;uniform texelSize: vec2f;uniform projection: mat4x4f;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var random: vec3f=textureSampleLevel(randomSampler,randomSamplerSampler,input.vUV*uniforms.randTextureTiles,0.0).rgb;var depth: f32=textureSampleLevel(depthSampler,depthSamplerSampler,input.vUV,0.0).r;var depthSign: f32=sign(depth);depth=depth*depthSign;var normal: vec3f=textureSampleLevel(normalSampler,normalSamplerSampler,input.vUV,0.0).rgb;var occlusion: f32=0.0;var correctedRadius: f32=min(uniforms.radius,uniforms.minZAspect*depth/uniforms.near);
#ifdef ORTHOGRAPHIC_CAMERA
var vViewRay: vec3f= vec3f(mix(uniforms.viewport.x,uniforms.viewport.y,input.vUV.x),mix(uniforms.viewport.z,uniforms.viewport.w,input.vUV.y),depthSign);
#else
var vViewRay: vec3f= vec3f((input.vUV.x*2.0-1.0)*uniforms.xViewport,(input.vUV.y*2.0-1.0)*uniforms.yViewport,depthSign);
#endif
var vDepthFactor: vec3f=uniforms.depthProjection* vec3f(1.0,1.0,depth);var origin: vec3f=vViewRay*vDepthFactor;var rvec: vec3f=random*2.0-1.0;rvec.z=0.0;var dotProduct: f32=dot(rvec,normal);rvec=select( vec3f(-rvec.y,0.0,rvec.x),rvec,1.0-abs(dotProduct)>1e-2);var tangent: vec3f=normalize(rvec-normal*dot(rvec,normal));var bitangent: vec3f=cross(normal,tangent);var tbn: mat3x3f= mat3x3f(tangent,bitangent,normal);var difference: f32;for (var i: i32=0; i<SAMPLES; i++) {var samplePosition: vec3f=scales[(i+ i32(random.x*16.0)) % 16]*tbn*uniforms.sampleSphere[(i+ i32(random.y*16.0)) % 16];samplePosition=samplePosition*correctedRadius+origin;var offset: vec4f= vec4f(samplePosition,1.0);offset=uniforms.projection*offset;offset=vec4f(offset.xyz/offset.w,offset.w);offset=vec4f(offset.xy*0.5+0.5,offset.z,offset.w);if (offset.x<0.0 || offset.y<0.0 || offset.x>1.0 || offset.y>1.0) {continue;}
var sampleDepth: f32=abs(textureSampleLevel(depthSampler,depthSamplerSampler,offset.xy,0.0).r);difference=depthSign*samplePosition.z-sampleDepth;var rangeCheck: f32=1.0-smoothstep(correctedRadius*0.5,correctedRadius,difference);occlusion+=step(EPSILON,difference)*rangeCheck;}
occlusion=occlusion*(1.0-smoothstep(uniforms.maxZ*0.75,uniforms.maxZ,depth));var ao: f32=1.0-uniforms.totalStrength*occlusion*uniforms.samplesFactor;var result: f32=clamp(ao+uniforms.base,0.0,1.0);fragmentOutputs.color= vec4f( vec3f(result),1.0);}
#else
#ifdef BLUR
uniform outSize: f32;uniform soften: f32;uniform tolerance: f32;uniform samples: i32;
#ifndef BLUR_BYPASS
var depthSamplerSampler: sampler;var depthSampler: texture_2d<f32>;
#ifdef BLUR_LEGACY
fn blur13Bilateral(image: texture_2d<f32>,imageSampler: sampler,uv: vec2f,step: vec2f)->f32 {var result: f32=0.0;var off1: vec2f= vec2f(1.411764705882353)*step;var off2: vec2f= vec2f(3.2941176470588234)*step;var off3: vec2f= vec2f(5.176470588235294)*step;var compareDepth: f32=abs(textureSampleLevel(depthSampler,depthSamplerSampler,uv,0.0).r);var sampleDepth: f32;var weight: f32;var weightSum: f32=30.0;result+=textureSampleLevel(image,imageSampler,uv,0.0).r*30.0;sampleDepth=abs(textureSampleLevel(depthSampler,depthSamplerSampler,uv+off1,0.0).r);weight=clamp(1.0/( 0.003+abs(compareDepth-sampleDepth)),0.0,30.0);weightSum+= weight;result+=textureSampleLevel(image,imageSampler,uv+off1,0.0).r*weight;sampleDepth=abs(textureSampleLevel(depthSampler,depthSamplerSampler,uv-off1,0.0).r);weight=clamp(1.0/( 0.003+abs(compareDepth-sampleDepth)),0.0,30.0);weightSum+= weight;result+=textureSampleLevel(image,imageSampler,uv-off1,0.0).r*weight;sampleDepth=abs(textureSampleLevel(depthSampler,depthSamplerSampler,uv+off2,0.0).r);weight=clamp(1.0/( 0.003+abs(compareDepth-sampleDepth)),0.0,30.0);weightSum+=weight;result+=textureSampleLevel(image,imageSampler,uv+off2,0.0).r*weight;sampleDepth=abs(textureSampleLevel(depthSampler,depthSamplerSampler,uv-off2,0.0).r);weight=clamp(1.0/( 0.003+abs(compareDepth-sampleDepth)),0.0,30.0);weightSum+=weight;result+=textureSampleLevel(image,imageSampler,uv-off2,0.0).r*weight;sampleDepth=abs(textureSampleLevel(depthSampler,depthSamplerSampler,uv+off3,0.0).r);weight=clamp(1.0/( 0.003+abs(compareDepth-sampleDepth)),0.0,30.0);weightSum+=weight;result+=textureSampleLevel(image,imageSampler,uv+off3,0.0).r*weight;sampleDepth=abs(textureSampleLevel(depthSampler,depthSamplerSampler,uv-off3,0.0).r);weight=clamp(1.0/( 0.003+abs(compareDepth-sampleDepth)),0.0,30.0);weightSum+=weight;result+=textureSampleLevel(image,imageSampler,uv-off3,0.0).r*weight;return result/weightSum;}
#endif
#endif
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var result: f32=0.0;
#ifdef BLUR_BYPASS
result=textureSampleLevel(textureSampler,textureSamplerSampler,input.vUV,0.0).r;
#else
#ifdef BLUR_H
var step: vec2f= vec2f(1.0/uniforms.outSize,0.0);
#else
var step: vec2f= vec2f(0.0,1.0/uniforms.outSize);
#endif
#ifdef BLUR_LEGACY
result=blur13Bilateral(textureSampler,textureSamplerSampler,input.vUV,step);
#else
var compareDepth: f32=abs(textureSampleLevel(depthSampler,depthSamplerSampler,input.vUV,0.0).r);var weightSum: f32=0.0;for (var i: i32=-uniforms.samples; i<uniforms.samples; i+=2)
{var samplePos: vec2f=input.vUV+step*( f32(i)+0.5);var sampleDepth: f32=abs(textureSampleLevel(depthSampler,depthSamplerSampler,samplePos,0.0).r);var falloff: f32=smoothstep(0.0,
f32(uniforms.samples),
f32(uniforms.samples)-abs( f32(i))*uniforms.soften);var minDivider: f32=uniforms.tolerance*0.5+0.003;var weight: f32=falloff/( minDivider+abs(compareDepth-sampleDepth));result+=textureSampleLevel(textureSampler,textureSamplerSampler,samplePos,0.0).r*weight;weightSum+=weight;}
result/=weightSum;
#endif
#endif
fragmentOutputs.color=vec4f(result,result,result,1.0);}
#endif
#endif
`;t.ShaderStore.ShadersStoreWGSL[r]||(t.ShaderStore.ShadersStoreWGSL[r]=i),e.s(["ssao2PixelShaderWGSL",0,{name:r,shader:i}])},123175,e=>{"use strict";var t=e.i(263537);e.i(624154),e.i(568039),e.i(298378),e.i(369136),e.i(880779);let r="geometryVertexDeclaration";t.ShaderStore.IncludesShadersStore[r]||(t.ShaderStore.IncludesShadersStore[r]="uniform mat4 viewProjection;uniform mat4 view;"),e.i(629238);let i="geometryUboDeclaration",a=`#include<sceneUboDeclaration>
`;t.ShaderStore.IncludesShadersStore[i]||(t.ShaderStore.IncludesShadersStore[i]=a),e.i(182478),e.i(241326),e.i(675406),e.i(610460),e.i(587630),e.i(761523),e.i(479126),e.i(781801),e.i(443018);let o="geometryVertexShader",n=`precision highp float;
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]
#include<instancesDeclaration>
#include<__decl__geometryVertex>
#include<clipPlaneVertexDeclaration>
#ifdef IRRADIANCE
#ifdef REFLECTION
uniform mat4 reflectionMatrix;uniform vec2 vReflectionInfos;uniform vec3 vReflectionColor;
#ifdef USESPHERICALFROMREFLECTIONMAP
varying vec3 vEnvironmentIrradiance;
#ifdef SPHERICAL_HARMONICS
uniform vec3 vSphericalL00;uniform vec3 vSphericalL1_1;uniform vec3 vSphericalL10;uniform vec3 vSphericalL11;uniform vec3 vSphericalL2_2;uniform vec3 vSphericalL2_1;uniform vec3 vSphericalL20;uniform vec3 vSphericalL21;uniform vec3 vSphericalL22;
#else
uniform vec3 vSphericalX;uniform vec3 vSphericalY;uniform vec3 vSphericalZ;uniform vec3 vSphericalXX_ZZ;uniform vec3 vSphericalYY_ZZ;uniform vec3 vSphericalZZ;uniform vec3 vSphericalXY;uniform vec3 vSphericalYZ;uniform vec3 vSphericalZX;
#endif
#include<harmonicsFunctions>
#endif
#endif
#endif
attribute vec3 position;
#ifdef HAS_NORMAL_ATTRIBUTE
attribute vec3 normal;
#endif
#ifdef NEED_UV
varying vec2 vUV;
#ifdef ALPHATEST
uniform mat4 diffuseMatrix;
#endif
#ifdef BUMP
uniform mat4 bumpMatrix;varying vec2 vBumpUV;
#endif
#ifdef REFLECTIVITY
uniform mat4 reflectivityMatrix;uniform mat4 albedoMatrix;varying vec2 vReflectivityUV;varying vec2 vAlbedoUV;
#endif
#ifdef METALLIC_TEXTURE
varying vec2 vMetallicUV;uniform mat4 metallicMatrix;
#endif
#ifdef ROUGHNESS_TEXTURE
varying vec2 vRoughnessUV;uniform mat4 roughnessMatrix;
#endif
#ifdef SUBSURFACE_WEIGHT
varying vec2 vSubsurfaceWeightUV;uniform mat4 subsurfaceWeightMatrix;
#endif
#ifdef TRANSMISSION_WEIGHT
varying vec2 vTransmissionWeightUV;uniform mat4 transmissionWeightMatrix;
#endif
#ifdef UV1
attribute vec2 uv;
#endif
#ifdef UV2
attribute vec2 uv2;
#endif
#endif
#ifdef BUMP
varying mat4 vWorldView;
#endif
#ifdef BUMP
varying vec3 vNormalW;
#else
varying vec3 vNormalV;
#endif
varying vec4 vViewPos;
#if defined(POSITION) || defined(BUMP) || defined(IRRADIANCE)
varying vec3 vPositionW;
#endif
#if defined(VELOCITY) || defined(VELOCITY_LINEAR)
uniform mat4 previousViewProjection;varying vec4 vCurrentPosition;varying vec4 vPreviousPosition;
#endif
#define CUSTOM_VERTEX_DEFINITIONS
void main(void)
{vec3 positionUpdated=position;
#ifdef HAS_NORMAL_ATTRIBUTE
vec3 normalUpdated=normal;
#else
vec3 normalUpdated=vec3(0.0,0.0,0.0);
#endif
#ifdef UV1
vec2 uvUpdated=uv;
#endif
#ifdef UV2
vec2 uv2Updated=uv2;
#endif
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
#include<instancesVertex>
#if (defined(VELOCITY) || defined(VELOCITY_LINEAR)) && !defined(BONES_VELOCITY_ENABLED)
vCurrentPosition=viewProjection*finalWorld*vec4(positionUpdated,1.0);vPreviousPosition=previousViewProjection*finalPreviousWorld*vec4(positionUpdated,1.0);
#endif
#include<bonesVertex>
#include<bakedVertexAnimation>
vec4 worldPos=vec4(finalWorld*vec4(positionUpdated,1.0));
#ifdef BUMP
vWorldView=view*finalWorld;mat3 normalWorld=mat3(finalWorld);vNormalW=normalize(normalWorld*normalUpdated);
#else
#ifdef NORMAL_WORLDSPACE
vNormalV=normalize(vec3(finalWorld*vec4(normalUpdated,0.0)));
#else
vNormalV=normalize(vec3((view*finalWorld)*vec4(normalUpdated,0.0)));
#endif
#endif
vViewPos=view*worldPos;
#if (defined(VELOCITY) || defined(VELOCITY_LINEAR)) && defined(BONES_VELOCITY_ENABLED)
vCurrentPosition=viewProjection*finalWorld*vec4(positionUpdated,1.0);
#if NUM_BONE_INFLUENCERS>0
mat4 previousInfluence;previousInfluence=mPreviousBones[int(matricesIndices[0])]*matricesWeights[0];
#if NUM_BONE_INFLUENCERS>1
previousInfluence+=mPreviousBones[int(matricesIndices[1])]*matricesWeights[1];
#endif
#if NUM_BONE_INFLUENCERS>2
previousInfluence+=mPreviousBones[int(matricesIndices[2])]*matricesWeights[2];
#endif
#if NUM_BONE_INFLUENCERS>3
previousInfluence+=mPreviousBones[int(matricesIndices[3])]*matricesWeights[3];
#endif
#if NUM_BONE_INFLUENCERS>4
previousInfluence+=mPreviousBones[int(matricesIndicesExtra[0])]*matricesWeightsExtra[0];
#endif
#if NUM_BONE_INFLUENCERS>5
previousInfluence+=mPreviousBones[int(matricesIndicesExtra[1])]*matricesWeightsExtra[1];
#endif
#if NUM_BONE_INFLUENCERS>6
previousInfluence+=mPreviousBones[int(matricesIndicesExtra[2])]*matricesWeightsExtra[2];
#endif
#if NUM_BONE_INFLUENCERS>7
previousInfluence+=mPreviousBones[int(matricesIndicesExtra[3])]*matricesWeightsExtra[3];
#endif
vPreviousPosition=previousViewProjection*finalPreviousWorld*previousInfluence*vec4(positionUpdated,1.0);
#else
vPreviousPosition=previousViewProjection*finalPreviousWorld*vec4(positionUpdated,1.0);
#endif
#endif
#if defined(POSITION) || defined(BUMP) || defined(IRRADIANCE)
vPositionW=worldPos.xyz/worldPos.w;
#endif
gl_Position=viewProjection*finalWorld*vec4(positionUpdated,1.0);
#include<clipPlaneVertex>
#ifdef NEED_UV
#ifdef UV1
#if defined(ALPHATEST) && defined(ALPHATEST_UV1)
vUV=vec2(diffuseMatrix*vec4(uvUpdated,1.0,0.0));
#else
vUV=uvUpdated;
#endif
#ifdef BUMP_UV1
vBumpUV=vec2(bumpMatrix*vec4(uvUpdated,1.0,0.0));
#endif
#ifdef REFLECTIVITY_UV1
vReflectivityUV=vec2(reflectivityMatrix*vec4(uvUpdated,1.0,0.0));
#else
#ifdef METALLIC_UV1
vMetallicUV=vec2(metallicMatrix*vec4(uvUpdated,1.0,0.0));
#endif
#ifdef ROUGHNESS_UV1
vRoughnessUV=vec2(roughnessMatrix*vec4(uvUpdated,1.0,0.0));
#endif
#endif
#ifdef ALBEDO_UV1
vAlbedoUV=vec2(albedoMatrix*vec4(uvUpdated,1.0,0.0));
#endif
#ifdef SUBSURFACE_COLOR_UV1
vSubsurfaceColorUV=vec2(subsurfaceColorMatrix*vec4(uvUpdated,1.0,0.0));
#endif
#ifdef SUBSURFACE_WEIGHT_UV1
vSubsurfaceWeightUV=vec2(subsurfaceWeightMatrix*vec4(uvUpdated,1.0,0.0));
#endif
#endif
#ifdef UV2
#if defined(ALPHATEST) && defined(ALPHATEST_UV2)
vUV=vec2(diffuseMatrix*vec4(uv2Updated,1.0,0.0));
#else
vUV=uv2Updated;
#endif
#ifdef BUMP_UV2
vBumpUV=vec2(bumpMatrix*vec4(uv2Updated,1.0,0.0));
#endif
#ifdef REFLECTIVITY_UV2
vReflectivityUV=vec2(reflectivityMatrix*vec4(uv2Updated,1.0,0.0));
#else
#ifdef METALLIC_UV2
vMetallicUV=vec2(metallicMatrix*vec4(uv2Updated,1.0,0.0));
#endif
#ifdef ROUGHNESS_UV2
vRoughnessUV=vec2(roughnessMatrix*vec4(uv2Updated,1.0,0.0));
#endif
#endif
#ifdef ALBEDO_UV2
vAlbedoUV=vec2(albedoMatrix*vec4(uv2Updated,1.0,0.0));
#endif
#ifdef SUBSURFACE_COLOR_UV2
vSubsurfaceColorUV=vec2(subsurfaceColorMatrix*vec4(uv2Updated,1.0,0.0));
#endif
#ifdef SUBSURFACE_WEIGHT_UV2
vSubsurfaceWeightUV=vec2(subsurfaceWeightMatrix*vec4(uv2Updated,1.0,0.0));
#endif
#endif
#endif
#include<bumpVertex>
#ifdef IRRADIANCE
#ifdef REFLECTION
#ifdef USESPHERICALFROMREFLECTIONMAP
vec3 reflectionVector=vec3(reflectionMatrix*vec4(normalUpdated,0.0)).xyz;
#ifdef REFLECTIONMAP_OPPOSITEZ
reflectionVector.z*=-1.0;
#endif
vEnvironmentIrradiance=computeEnvironmentIrradiance(reflectionVector)*vReflectionInfos.x;
#endif
#endif
#endif
}
`;t.ShaderStore.ShadersStore[o]||(t.ShaderStore.ShadersStore[o]=n),e.s(["geometryVertexShader",0,{name:o,shader:n}],123175)}]);