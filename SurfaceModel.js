let pointCount_x = 4;
let pointCount_y = 4;
let smallest = 0;

function BezierSurfaceModel(startPos, xDiff, zDiff, uSamples, vSamples, DRAGGABLE_COUNT_X, DRAGGABLE_COUNT_Y, isWireFrame) {
  let self = {};
  pointCount_x = DRAGGABLE_COUNT_X;
  pointCount_y = DRAGGABLE_COUNT_Y;

  if (DRAGGABLE_COUNT_X > DRAGGABLE_COUNT_Y) smallest = DRAGGABLE_COUNT_Y;
  else smallest = DRAGGABLE_COUNT_X;
  self.uSamples = uSamples;
  self.vSamples = vSamples;

  self.controlPoints = getObservableControlPointsForBezierSurface(startPos, xDiff, zDiff, recompute);

  function getNewBezierSurfaceSampler(grid) {
    return function(u, v) {
      return bezierSurface(u, v, grid, pointCount_x, pointCount_y);
    }
  }

  function getUPDeriv(grid) {
    return function(u, v) {
      return bezierSurfaceUDerivative(u, v, grid, smallest);
    };
  }

  function getVPDeriv(grid) {
    return function(u, v) {
      return bezierSurfaceVDerivative(u, v, grid, smallest);
    };
  }

  let controlPointGrid = observableControlPointsToVec3Matrix(self.controlPoints);

  let surf = parametricSurface(getNewBezierSurfaceSampler(controlPointGrid),
    getUPDeriv(controlPointGrid),
    getVPDeriv(controlPointGrid),
    uSamples,
    vSamples, isWireFrame);

  function recompute() {

    let controlPointGrid = observableControlPointsToVec3Matrix(self.controlPoints);
    let bsSampler = getNewBezierSurfaceSampler(controlPointGrid);

    let vertices = getParametricSurfaceVertices(bsSampler, self.uSamples, self.vSamples);

    let normals = getParametricSurfaceNormals(bsSampler, getUPDeriv(controlPointGrid), getVPDeriv(controlPointGrid), self.uSamples, self.vSamples);

    gl.bindBuffer(gl.ARRAY_BUFFER, surf.attribBuffers.vertex.id);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, surf.attribBuffers.normal.id);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
  }

  self.surface = surf;

  return self;
}

function getObservableControlPointsForBezierSurface(startPos, xDiff, zDiff, callback) {
  let oCPoints = [];
  for (let i = 0; i < pointCount_x; i++) {
    for (let j = 0; j < pointCount_y; j++) {
      let pos = vec3(xDiff * j, 0, zDiff * i);
      oCPoints.push(ObservablePoint(add(pos, startPos), callback));
    }
  }
  return oCPoints;
}

function observableControlPointsToVec3Matrix(oPoints) {
  let controlPoints = [];
  console.log(oPoints[0].position);
  for (let p = 0; p < oPoints.length; p++) {
    if (p % pointCount_y == 0)
      controlPoints.push([]);
    arrIndx = Math.floor(p / pointCount_y);
    controlPoints[arrIndx][p % pointCount_y] = oPoints[p].position;
  }
  return controlPoints;
}