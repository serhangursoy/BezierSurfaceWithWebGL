//positions are viewport centralized
function MouseStateMachine(w,h, fovy){

	var self = {};

	self.width = w;
	self.height = h;
	self.mousePos = undefined;
	self.prevMousePos = undefined;
	self.currentState = BaseMouseState(self);

	self.updateClosestDraggablePointToMouseRay = function(){
		draggablePoints.updateClosestPointToRay(self.getRayFromMousePos(), self.getNDCMousePos());
	}

	self.getMouseDelta = function(){
		return subtract(self.mousePos, self.prevMousePos);
	}

	self.getRayFromMousePos = function(){
		return camera.getRayFromNDCPos(viewPortToNDC(self.mousePos, self.width, self.height));
	}

	self.getNDCFromViewPortPos = function(vpPos){
		return viewPortToNDC(vpPos, self.width, self.height);
	}

	self.getNDCMousePos = function(){
		return viewPortToNDC(self.mousePos, self.width, self.height);
	}

	self.mousemove = function(pos){
		self.mousePos = pos;
		self.currentState.mousemove();
		self.prevMousePos = pos;
	}

	 self.mousedown = function(pos){
		self.mousePos = self.prevMousePos = pos;
		self.currentState.mousedown();
	}

	self.mouseup= function(pos){
		self.currentState.mouseup();
	}

	self.mousewheel = function(delta){
		self.currentState.mousewheel(delta);
	}

	return self;
}

function BaseMouseState(msm){
	return {
		mousemove: function(){
			msm.updateClosestDraggablePointToMouseRay();
		},
		mouseup: function(){
			msm.currentState = BaseMouseState(msm);
		},
		mousedown: function(){

			if(draggablePoints.isDragAxisSelected())
				msm.currentState = PointDragMS(msm);
			else
				msm.currentState = PinchRotateMS(msm);
		},
		mousewheel: function(delta){
			camera.zoom(delta);
			msm.updateClosestDraggablePointToMouseRay();
		}
	};
}

function PinchRotateMS(msm){
	var self = BaseMouseState(msm);
	draggablePoints.deactivate();

	self.mousemove = function(){
			var deltaDrag = msm.getMouseDelta(); 

			if(length(deltaDrag)>0.1){
				var start = getSphereIntercept(msm.prevMousePos, msm.width, msm.height);
				var end = getSphereIntercept(msm.mousePos, msm.width, msm.height);
				var angle = Math.acos(dot(normalize(start), normalize(end)));
				var axis = cross(start, end);

				camera.rotateAroundWSOrigin(angle, axis);
			}
	}

	return self;
}

function PointDragMS(msm){
	var self = BaseMouseState(msm);

	self.mousemove = function(){
		var e = msm.getNDCFromViewPortPos(msm.mousePos);
		var s = msm.getNDCFromViewPortPos(msm.prevMousePos);

		draggablePoints.drag(s,e);
	}

	self.mousewheel = function(){};

	return self;
}

//position relative to canvas
function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();

    return vec2(evt.clientX - rect.left, evt.clientY - rect.top);
}

function viewPortToNDC(pos, w, h){
	var x = pos[0]/(w/2);
	var y = pos[1]/(h/2);

	return vec2(x,y);
}

function rayVectorFromNDC(pos, fovy, aspect){
    var z = -1.0 / Math.tan( radians(fovy) / 2 );
	var x = pos[0]*aspect;
	var y = pos[1];
	return vec3(x,y,z);
}

function getCentralizedCoords(v, w, h){
	return vec2(v[0] - w/2, -(v[1] - h/2));
}

function getSphereIntercept(v, w, h){
	var r = h;
	var l = length(v);

	//when outside of sphere map vector to circle 
	//(sphere with plane z=0 intercept) x^2 + y^2 = r^2
	if(r<l){
		var inter = scale(r, getNormalized(v));
		return vec3(inter[0],inter[1],0);
	}
	else{
		var x = v[0];
		var y = v[1];
		
		var z = -Math.sqrt(r*r - x*x - y*y);

		return vec3(x,y,z);
	}
}
