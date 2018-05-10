function LineSegment(a,b){
	return {
		distanceToVec: function(v){
			var ray = Ray(a, normalize(subtract(a,b)));
			var lineDist = vec3ToRayDistance(v, ray);
			var endPointDist = Math.min( length(subtract(v,a)), length(subtract(v,b)));
			var projOnLine = dot(subtract(v,a), subtract(v,b)) < 0;

			if(projOnLine)
				return Math.min(lineDist, endPointDist);

			return endPointDist;
		}
	};
}

//returns position on ray1
function get3DRaysIntersectionLeastSquares(ray1, ray2){

	var A = [ [ray1.d[0],  - ray2.d[0]],
	  	  [ray1.d[1],  - ray2.d[1]],
	  	  [ray1.d[2],  - ray2.d[2]] ];

	var b = subtract(ray2.o, ray1.o);

	var AT = numeric.transpose(A);

	var ATAInv = numeric.inv(numeric.dot(AT,A));

	var ATAInvAT = numeric.dot(ATAInv,AT);

	var coeffs = numeric.dot(ATAInvAT, b);

	return ray1.getPosition(coeffs[0]);
}

//origin and direction are vec3, direction is normalized
function Ray(origin, direction){

	var o = origin;
	var d = direction;
	
	function getPosition(t){
		return add(o, scale(t, direction));
	}

	return {o, d, getPosition};
}

function projectPointOnRay(v, ray){
	var toV = subtract(v, ray.o);
	var projection = add(ray.o, scale(dot(toV, ray.d), ray.d));
	return projection;
}

function vec3ToRayDistance(v, ray){
	// var toV = subtract(v, ray.o);
	// var projection = add(ray.o, scale(dot(toV, ray.d), ray.d));
	
	var projection = projectPointOnRay(v, ray);
	var normalComponent = subtract(projection, v);
	return length(normalComponent);
}
