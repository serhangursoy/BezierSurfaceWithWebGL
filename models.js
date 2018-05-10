function createFloatArrayBuffer(gl, elSize, array) {
  let arrBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, arrBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(array), gl.STATIC_DRAW);
  return {
    id: arrBuffer,
    elSize: elSize
  };
}

function createIndexBuffer(gl, indices) {
  let indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  return indexBuffer;
}

function loadTexture(gl, filename) {

  let texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
    new Uint8Array([255, 0, 0, 255]));

  let image = new Image();
  image.src = filename;
  image.onload = function() {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);
  }

  return texture;
}

function getNormalTransformMat3(V, M) {
  return normalMatrix(mult(V, M), true);
}

function concatenateArrOfArrs(arroarr) {
  let arr = [];
  arroarr.forEach(function(a) {
    arr = arr.concat(a);
  });

  return arr;
}

function getIndicesForGridMeshTriangleStrip(m, n) {
  let indices = [];

  for (i = 0; i < m - 1; i++) {

    for (j = 0; j < n; j++) {
      indices.push(i * n + j);
      indices.push((i + 1) * n + j);

      if (j == n - 1 && i != m - 2) {
        indices.push((i + 1) * n + j);
        indices.push((i + 1) * n);
      }
    }
  }

  return indices;
}

function CoordSys(gl) {

  let vertexBuffer = createFloatArrayBuffer(gl, 3, [
    //x
    1.0, 0.0, 0.0,
    0.0, 0.0, 0.0,
    //y
    0.0, 0.0, 0.0,
    0.0, 1.0, 0.0,
    //z
    0.0, 0.0, 0.0,
    0.0, 0.0, 1.0
  ]);

  let colorBuffer = createFloatArrayBuffer(gl, 4, [
    1.0, 0.0, 0.0, 1.0,
    1.0, 0.0, 0.0, 1.0,

    0.0, 1.0, 0.0, 1.0,
    0.0, 1.0, 0.0, 1.0,

    0.0, 0.0, 1.0, 1.0,
    0.0, 0.0, 1.0, 1.0
  ]);

  let attribBuffers = {
    vertex: vertexBuffer,
    color: colorBuffer
  };

  return {
    attribBuffers,
    nVerts: 6,
    primtype: gl.LINES
  };
}

function Line(gl, pos1, pos2) {
  let arr = pos1.concat(pos2);
  let vertexBuffer = createFloatArrayBuffer(gl, 3, arr);
  let attribBuffers = {
    vertex: vertexBuffer
  };
  return {
    attribBuffers,
    nVerts: 2,
    primtype: gl.LINES
  };
}

function getParametricSurfaceVertices(surf, uSamples, vSamples) {
  let vertices = [];

  iterateThroughParameterSpace(uSamples, vSamples, function(u, v) {
    let p = surf(u, v);
    vertices.push(p[0], p[1], p[2]);
  });

  return vertices;
}

function getParametricSurfaceTexCoords(surf, uSamples, vSamples) {

  let texCoords = [];
  iterateThroughParameterSpace(uSamples, vSamples, function(u, v) {
    texCoords.push(u, v);
  });

  return texCoords;
}

function getParametricSurfaceNormals(surf, uDeriv, vDeriv, uSamples, vSamples) {
  let normals = [];

  iterateThroughParameterSpace(uSamples, vSamples, function(u, v) {
    let p = surf(u, v);

    let ud = uDeriv(u, v);
    let vd = vDeriv(u, v);

    let normal = cross(ud, vd);

    normals.push(normal[0], normal[1], normal[2]);
  });

  return normals;
}

function iterateThroughParameterSpace(uSamples, vSamples, iteratee) {

  let du = 1 / (uSamples - 1);
  let dv = 1 / (vSamples - 1);
  let i, j;

  for (i = 0; i < uSamples; i++) {
    let u = i * du;

    for (j = 0; j < vSamples; j++) {
      let v = j * dv;

      iteratee(u, v);
    }
  }
}


function parametricSurface(surf, uPderiv, vPderiv, uSamples, vSamples, isWireFrame) {
  let indices = getIndicesForGridMeshTriangleStrip(uSamples, vSamples);
  let vertices = getParametricSurfaceVertices(surf, uSamples, vSamples);
  let normals = getParametricSurfaceNormals(surf, uPderiv, vPderiv, uSamples, vSamples);
  let texCoords = getParametricSurfaceTexCoords(surf, uSamples, vSamples);

  let indexBuffer = createIndexBuffer(gl, indices);

  let normalBuffer = createFloatArrayBuffer(gl, 3, normals);
  let texCoordBuffer = createFloatArrayBuffer(gl, 2, texCoords);
  let vertexBuffer = createFloatArrayBuffer(gl, 3, vertices);

  let attribBuffers = {
    vertex: vertexBuffer,
    normal: normalBuffer,
    texcoord: texCoordBuffer
  };

  let drawingType = gl.TRIANGLE_STRIP;
  if (isWireFrame) {
    drawingType = gl.LINE_STRIP;
  }
  return {
    indxBuffer: indexBuffer,
    attribBuffers,
    nVerts: vertices.length,
    nIndices: indices.length,
    primtype: drawingType
  };
}





function Tetrahedron(gl) {
  let theta = Math.PI * 2 / 3;
  let apex = [0, 1, 0];
  let v1 = [1, 0, 0];
  let v2 = [Math.cos(theta), 0, Math.sin(theta)];
  let v3 = [Math.cos(2 * theta), 0, Math.sin(2 * theta)];

  let vertBuff = createFloatArrayBuffer(gl, 3, concatenateArrOfArrs([
    v1,
    v2,
    v3,
    v1,
    apex,
    v2,
    apex,
    v3
  ]));

  let attribBuffers = {
    vertex: vertBuff
  };

  return {
    attribBuffers,
    nVerts: 8,
    primtype: gl.LINE_STRIP
  };
}


function Cube(gl) {

  let vertexBuffer = createFloatArrayBuffer(gl, 3, [
    //upper front
    -1.0, -1.0, 1.0,
    1.0, -1.0, 1.0,

    //upper back
    -1.0, -1.0, -1.0,
    1.0, -1.0, -1.0,

    //lower front
    1.0, 1.0, 1.0, -1.0, 1.0, 1.0,

    //lower back
    1.0, 1.0, -1.0, -1.0, 1.0, -1.0,

    //left back
    -1.0, -1.0, -1.0, -1.0, 1.0, -1.0,

    //right back
    1.0, 1.0, -1.0,
    1.0, -1.0, -1.0,

    //left Top
    -1.0, 1.0, -1.0, -1.0, 1.0, 1.0,

    //right Top
    1.0, 1.0, 1.0,
    1.0, 1.0, -1.0,

    // Bottom face

    //bottom right
    1.0, -1.0, -1.0,
    1.0, -1.0, 1.0,

    //bottom left
    -1.0, -1.0, -1.0, -1.0, -1.0, 1.0,

    // front left
    -1.0, -1.0, 1.0, -1.0, 1.0, 1.0,

    //front right
    1.0, 1.0, 1.0,
    1.0, -1.0, 1.0
  ]);

  let attribBuffers = {
    vertex: vertexBuffer
  };

  let cube = {
    attribBuffers,
    nVerts: 24,
    primtype: gl.TRIANGLE_FAN
  };

  return cube;
}