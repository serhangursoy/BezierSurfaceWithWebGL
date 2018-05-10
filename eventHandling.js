//field of view vertical angle is needed for picking objects with mouse rays
function setUpEventHandling(canvas, fov){
	var msm = MouseStateMachine(canvas.width, canvas.height, fov);

	$( "#switchTexture" ).click(function() {
		switchTexture();
	});

	draggablePoints.onCPStateChange = function(){



		if(!draggablePoints.closestPoint)
			$('canvas').css( 'cursor', 'default' );
		else if(draggablePoints.closestPoint.state !=0)
			$('canvas').css( 'cursor', 'pointer' );
		else
			$('canvas').css( 'cursor', 'default' );
	}

	function getCentralizedMousePos(event){
		return getCentralizedCoords(getMousePos(canvas, event), canvas.width, canvas.height);
	}

	canvas.onmouseup = function(event){
		msm.mouseup();
	}

	canvas.onmousedown = function(event){
		var pos = getCentralizedMousePos(event);
		msm.mousedown(pos);
	}

	canvas.onmousemove = function(event){
		var pos = getCentralizedMousePos(event);
		msm.mousemove(pos);
	}

	canvas.onmousewheel = function (event){
	  var direction = (event.detail<0 || event.wheelDelta>0) ? 1 : -1;
	  msm.mousewheel(direction);
	  //stops event propagation, so it doesnt scroll the page also
	  return false;
	}
	
	document.onkeydown = checkKey;

	function checkKey(e) {
		e = e || window.event;

		switch(e.keyCode){
			case 83: //s
				msm.mousewheel(-1);
				break;
			case 87: //w
				msm.mousewheel(1);
				break;
		}
	}

}
