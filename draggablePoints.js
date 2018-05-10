//accepts array of observable points
function DraggablePoints(opArr) {

  let self = {};
  let dragAxes = [vec3(1, 0, 0), vec3(0, 1, 0), vec3(0, 0, 1)];

  //real 3D drag axis
  function getDragAxisWorldRay() {
    return Ray(self.closestPoint.position, dragAxes[self.closestPoint.state - 1]);
  }

  //3D axis projected to NDC screen space (flattened with no z).
  function getDragAxisScreenRay() {
    let origin = vec2(camera.worldToNDC(self.closestPoint.position));
    let dAxis = dragAxes[self.closestPoint.state - 1];
    let secondPointOnScreenAxis = vec2(camera.worldToNDC(add(self.closestPoint.position, scale(10, dAxis))));

    return Ray(origin, normalize(subtract(secondPointOnScreenAxis, origin)));
  }

  self.points = opArr;
  self.closestPoint = undefined;

  self.addObservablePoints = function(opoints) {
    self.points = self.points.concat(opoints);
  }

  self.onCPStateChange = function() {}

  self.deactivate = function() {
    self.closestPoint = undefined;
  }

  self.isDragAxisSelected = function() {
    if (!self.closestPoint) return false;
    return self.closestPoint.state !== 0;
  }

  //the closest point to the mouse is determined by creating a ray from the eye
  //to the mouse position and finding the minimum distance point to the 3D ray.
  self.updateClosestPointToRay = function(ray, mousePos_ndc) {

    let cp = undefined;
    let maxDist = 10;
    let minDist = Infinity;

    self.points.forEach(function(op) {
      let dist = vec3ToRayDistance(op.position, ray);

      if (dist < minDist && dist < maxDist && camera.isVisible(op.position)) {
        minDist = dist;
        cp = op;
      }
    });

    self.closestPoint = cp;

    if (cp)
      updateClosestPointGimbal(mousePos_ndc);

    self.onCPStateChange();
  };

  //every closest point selected is drawn at a fixed distance from the eye so that the gimbal is
  //always the same size
  self.getNormalizedCPLocation = function() {
    let toCP = normalize(subtract(self.closestPoint.position, camera.eye));
    return add(scale(60, toCP), camera.eye);
  }


  //when the axis is selected and the user drags on the screen, the delta is first projected to the screen ray
  //of the projection of the selected axis, this ray is 2D. The end points of the projected delta are used
  //to derive the corresponding motion along the real 3D axis. This is achieved by intersecting the rays
  //from the projected drag end points with the 3D axis of motion and applying that delta.
  self.drag = function(start_ndc, end_ndc) {

    let screenRay = getDragAxisScreenRay();

    let projS = projectPointOnRay(start_ndc, screenRay);
    let projE = projectPointOnRay(end_ndc, screenRay);

    let eR = camera.getRayFromNDCPos(projE);
    let sR = camera.getRayFromNDCPos(projS);


    let worldRay = getDragAxisWorldRay();

    let wE = get3DRaysIntersectionLeastSquares(worldRay, eR);
    let wS = get3DRaysIntersectionLeastSquares(worldRay, sR);


    let delta = subtract(wE, wS);

    self.closestPoint.position = add(self.closestPoint.position, delta);
  }


  //when closest point is defined, its state can be 0 (no axis selected), 1 (x axis (Red) selected),
  //2 y, and 3 z.
  function updateClosestPointGimbal(mousePos_ndc) {

    function getDraggablePointState() {
      let dList = [redLS.distanceToVec(mousePos_ndc), greenLS.distanceToVec(mousePos_ndc), blueLS.distanceToVec(mousePos_ndc)];

      let maxDist = 0.05;

      closest = _.reduce(dList, function(memo, d, i) {
        if (d < memo.dist)
          return {
            dist: d,
            i: i + 1
          };
        return memo;
      }, {
        i: 0,
        dist: maxDist
      });

      return closest.i;
    }

    let gimbalSize = 5;
    let fixCP = self.getNormalizedCPLocation();

    let red = vec2(camera.worldToNDC(add(fixCP, vec3(gimbalSize, 0, 0))));
    let green = vec2(camera.worldToNDC(add(fixCP, vec3(0, gimbalSize, 0))));
    let blue = vec2(camera.worldToNDC(add(fixCP, vec3(0, 0, gimbalSize))));
    let origin = vec2(camera.worldToNDC(fixCP));

    let redLS = LineSegment(red, origin);
    let greenLS = LineSegment(green, origin);
    let blueLS = LineSegment(blue, origin);

    self.closestPoint.state = getDraggablePointState();
  }

  return self;
}

function ObservablePoint(position, changeListener) {
  let self = {};
  self.changeListener = changeListener || function() {};

  Object.defineProperty(self, "position", {
    get: function() {
      return position;
    },
    set: function(pos) {
      position = pos;
      self.changeListener();
    }
  });

  return self;
}