let gl;
let t = 0;


let texture;
let specular;
let normal;
let textInd = 0;
let sharedUniforms;

let TEXTURE_HOLDER = [];
let SPECULAR_HOLDER = [];
let NORMAL_HOLDER = [];

let phongProgram;
let gouraudProgram;
let primitiveProgram;

let lightModel;

let lightPosition;

let cube;
let camera;
let draggablePoints;
let gimbal;
let BSM;
let POINT_COUNT_X = 8;
let POINT_COUNT_Y = 8;
let fixedSize = false;
let gridLinesBuffer;
let isPhong;
let isWire;
let timeShifter = vec2(0, 0);
let timeVar = 1;

window.onload = function() {
  init();
};


// FUNCTIONS

function init() {
  let fovy = 40; // FOV
  let canvas = document.getElementById("gl-canvas");

  let someCountX = document.getElementById("contPointX").value;
  let someCountY = document.getElementById("contPointY").value;
  let preserveRes = document.getElementById("preserveCheck").checked;
  isPhong = document.getElementById("phongShadingRadio").checked;
  isWire = document.getElementById("wireShadingRadio").checked;
  console.log("What are my tiny values :)) ", isPhong, isWire);

  POINT_COUNT_X = parseInt(someCountX);
  POINT_COUNT_Y = parseInt(someCountY);

  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) {
    alert("WebGL isn't available");
  }

  gl.viewport(0, 0, canvas.width, canvas.height);

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  lightPosition = ObservablePoint(vec3(0, 60, 0));
  camera = Camera(vec3(100, 100, 100), vec3(-1, -1, -1), vec3(0, 1, 0), fovy, canvas.width / canvas.height, 1, 500);

  draggablePoints = DraggablePoints([ObservablePoint(vec3(100, 100, -100))]);
  //draggablePoints.addObservablePoints([lightPosition]);
  let someX, someY;
  if (!preserveRes) {
    someX = 40 / POINT_COUNT_X;
    someY = 40 / POINT_COUNT_Y;
  } else {
    someX = 10;
    someY = 10;
  }
  BSM = BezierSurfaceModel(vec3(-15, 0, -15), someX, someY, 20, 20, POINT_COUNT_X, POINT_COUNT_Y, isWire);
  draggablePoints.addObservablePoints(BSM.controlPoints);

  let normField = {
    name: "aNormal_ms"
  };
  let vertField = {
    name: "aVertexPosition_ms"
  };
  let textField = {
    name: "aTexcoord"
  };

  let unifField = {
    lightPosition_ws: {
      name: "uLightPosition_ws",
      setter: gl.uniform3fv
    },
    N: {
      name: "N",
      setter: setMat3fv(gl)
    }
  };

  wireframeProgram = ShaderProgram(gl, "wireframe-vshader", "wireframe-fshader", {
    normal: normField,
    vertex: vertField,
    texcoord: textField
  }, {
    lightPosition_ws: {
      name: "uLightPosition_ws",
      setter: gl.uniform3fv
    },
    N: {
      name: "N",
      setter: setMat3fv(gl)
    }
  });

  phongProgram = ShaderProgram(gl, "phong-vshader", "phong-fshader", {
    normal: normField,
    vertex: vertField,
    texcoord: textField
  }, {
    lightPosition_ws: {
      name: "uLightPosition_ws",
      setter: gl.uniform3fv
    },
    N: {
      name: "N",
      setter: setMat3fv(gl)
    }
  });


  gouraudProgram = ShaderProgram(gl, "gouraud-vshader", "gouraud-fshader", {
    normal: normField,
    vertex: vertField,
    texcoord: textField
  }, {
    lightPosition_ws: {
      name: "uLightPosition_ws",
      setter: gl.uniform3fv
    },
    N: {
      name: "N",
      setter: setMat3fv(gl)
    }
  });



  sharedUniforms = {
    P: {
      name: "P",
      setter: setMat4fv(gl)
    },
    M: {
      name: "M",
      setter: setMat4fv(gl)
    },
    V: {
      name: "V",
      setter: setMat4fv(gl)
    }
  };

  primitiveProgram = ShaderProgram(gl, "primitive-vshader", "primitive-fshader", {
    vertex: {
      name: "aVertexPosition_ms"
    }
  }, {
    color: {
      name: "uColor",
      setter: gl.uniform4fv
    }
  });

  // useProgram(gl, phongProgram);
  //
  // bindUniformsToProgram(sharedUniforms, phongProgram.id, gl);

  lightModel = Tetrahedron(gl);

  coordSys = CoordSys(gl);
  cube = Cube(gl);
  gridLinesBuffer = gl.createBuffer();

  let texture1 = loadTexture(gl, "Texture/lava.jpg");
  let texture2 = loadTexture(gl, "Texture/water.png");
  let texture3 = loadTexture(gl, "Texture/wall.jpg");
  let texture4 = loadTexture(gl, "Texture/space.png");

  TEXTURE_HOLDER[0] = texture1;
  TEXTURE_HOLDER[1] = texture2;
  TEXTURE_HOLDER[2] = texture3;
  TEXTURE_HOLDER[3] = texture4;

  let specular1 = loadTexture(gl, "Texture/lavaSpec.jpg");
  let specular2 = loadTexture(gl, "Texture/wallSpec.jpg");
  let specular3 = loadTexture(gl, "Texture/waterSpec.png");
  let specular4 = loadTexture(gl, "Texture/spaceSpec.jpg");

  SPECULAR_HOLDER[0] = specular1;
  SPECULAR_HOLDER[1] = specular3;
  SPECULAR_HOLDER[2] = specular2;
  SPECULAR_HOLDER[3] = specular4;

  let normal1 = loadTexture(gl, "Texture/lavaNormal.jpg");
  let normal2 = loadTexture(gl, "Texture/wallNormal.jpg");
  let normal3 = loadTexture(gl, "Texture/waterNormal.png");
  let normal4 = loadTexture(gl, "Texture/spaceNormal.jpg");

  NORMAL_HOLDER[0] = normal1;
  NORMAL_HOLDER[1] = normal3;
  NORMAL_HOLDER[2] = normal2;
  NORMAL_HOLDER[3] = normal4;

  if (texture == null && specular == null) {
    texture = texture1;
    specular = specular1;
    normal = normal1;
    textInd = 0;
  }

  let origin = vec3(0, 0, 0);

  gimbal = {
    r: Line(gl, origin, vec3(1, 0, 0)),
    g: Line(gl, origin, vec3(0, 1, 0)),
    b: Line(gl, origin, vec3(0, 0, 1))
  };

  setUpEventHandling(canvas, fovy);
  render();
};

function switchTexture() {
  console.log("It is ", textInd, " Holder Length ", TEXTURE_HOLDER.length);
  if (textInd + 1 == TEXTURE_HOLDER.length) {
    textInd = 0;
    console.log("Changed to ", textInd, " because of loop");
  } else {
    textInd++;
    console.log("Changed to ", textInd);
  }

  texture = TEXTURE_HOLDER[textInd];
  specular = SPECULAR_HOLDER[textInd];
  normal = NORMAL_HOLDER[textInd];
  //  init();
}


function setUniformData(uniforms, data) {
  Object.keys(data).forEach(function(k) {
    uniforms[k].set(data[k]);
  });
}

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  //  gl.clearColor(0, 1, 1, 1);
  //  gl.clear(1, 0, 0, 0);

  t += 0.009;

  let M;
  let P = camera.getPerspectiveMatrix();
  let V = camera.getViewMatrix();

  let sharedUniformData = {
    P: flatten(P),
    V: flatten(V)
  };

  unloadProgram(primitiveProgram, gl);

  /////////////////////////////////////////////////////////

  if (isPhong) {

    useProgram(gl, phongProgram, sharedUniforms, sharedUniformData);
    phongProgram.uniforms.lightPosition_ws.set(flatten(lightPosition.position));
    M = scalem(1, 1, 1);
    phongProgram.uniforms.N.set(flatten(getNormalTransformMat3(V, M)));
    sharedUniforms.M.set(flatten(M));

    setProgramAttributes(gl, BSM.surface, phongProgram);
    drawObject(gl, BSM.surface);

    timeShifter[0] = 2.5 * Math.sin(0.0001 * timeVar);
    timeShifter[1] = 5.5 * Math.cos(0.0001 * timeVar);
    timeVar += 1;
    // lookup the sampler locations.
    var uDiffTexture = gl.getUniformLocation(phongProgram.id, "uDiffuseTexture");
    var uSpecTexture = gl.getUniformLocation(phongProgram.id, "uSpecularTexture");
    var uNormTexture = gl.getUniformLocation(phongProgram.id, "uNormalTexture");

    //  console.log("TEXTURE", uDiffTexture);
    gl.uniform1i(uDiffTexture, 0); // texture unit 0
    gl.uniform1i(uSpecTexture, 1); // texture unit 1
    gl.uniform1i(uNormTexture, 2);
    gl.uniform2fv(gl.getUniformLocation(phongProgram.id, "timeShifter"), flatten(timeShifter));
    //  gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set each texture unit to use a particular texture.
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, specular);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, normal);

    unloadProgram(phongProgram, gl);
  } else if (!isWire) {
    useProgram(gl, gouraudProgram, sharedUniforms, sharedUniformData);

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gouraudProgram.uniforms.lightPosition_ws.set(flatten(lightPosition.position));
    M = scalem(1, 1, 1);
    gouraudProgram.uniforms.N.set(flatten(getNormalTransformMat3(V, M)));
    sharedUniforms.M.set(flatten(M));

    setProgramAttributes(gl, BSM.surface, gouraudProgram);
    drawObject(gl, BSM.surface);


    timeShifter[0] = 2.5 * Math.sin(0.0001 * timeVar);
    timeShifter[1] = 5.5 * Math.cos(0.0001 * timeVar);
    timeVar += 1;
    // lookup the sampler locations.
    var uDiffTexture = gl.getUniformLocation(gouraudProgram.id, "uDiffuseTexture");
    var uSpecTexture = gl.getUniformLocation(gouraudProgram.id, "uSpecularTexture");
    var uNormTexture = gl.getUniformLocation(gouraudProgram.id, "uNormalTexture");

    //  console.log("TEXTURE", uDiffTexture);
    gl.uniform1i(uDiffTexture, 0); // texture unit 0
    gl.uniform1i(uSpecTexture, 1); // texture unit 1
    gl.uniform1i(uNormTexture, 2);
    gl.uniform2fv(gl.getUniformLocation(gouraudProgram.id, "timeShifter"), flatten(timeShifter));
    //  gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set each texture unit to use a particular texture.
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, specular);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, normal);

    unloadProgram(gouraudProgram, gl);
  } else {

    useProgram(gl, wireframeProgram, sharedUniforms, sharedUniformData);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    wireframeProgram.uniforms.lightPosition_ws.set(flatten(lightPosition.position));
    M = scalem(1, 1, 1);
    wireframeProgram.uniforms.N.set(flatten(getNormalTransformMat3(V, M)));
    sharedUniforms.M.set(flatten(M));
    setProgramAttributes(gl, BSM.surface, wireframeProgram);
    drawObject(gl, BSM.surface);
    unloadProgram(wireframeProgram, gl);
  }

  ////////////////////////////////////////////////////
  useProgram(gl, primitiveProgram, sharedUniforms, sharedUniformData);

  primitiveProgram.uniforms.color.set([1, 1, 1, 1]);

  setProgramAttributes(gl, cube, primitiveProgram);
  gl.disable(gl.DEPTH_TEST);

  // Draw clickable points...
  if (draggablePoints.closestPoint && draggablePoints.closestPoint != lightPosition) {

    BSM.controlPoints.forEach(function(dp) {
      M = mult(translate(dp.position[0], dp.position[1], dp.position[2]), scalem(0.7, 0.7, 0.7));
      sharedUniforms.M.set(flatten(M));
      drawObject(gl, cube);
    });

    drawControlGrid(gl, sharedUniforms, primitiveProgram, POINT_COUNT_X, POINT_COUNT_Y);
  }

  if (draggablePoints.closestPoint) {
    drawGimbal(gl, sharedUniforms, primitiveProgram, draggablePoints.getNormalizedCPLocation(), 4, draggablePoints.closestPoint.state);
  }

  gl.enable(gl.DEPTH_TEST);


  requestAnimFrame(render);
}

function drawControlGrid(gl, sharedUniforms, program, dragCountX, dragCountY) {

  let vertices = [];
  let controlPointCount = dragCountX;
  BSM.controlPoints.forEach(function(dp, i) {
    if (i % dragCountY != 0 && i % dragCountY != dragCountY - 1)
      vertices.push(dp.position[0], dp.position[1], dp.position[2]);
    //  if (i % dragCountY == 1 || i % dragCountY == dragCountY - 1)

    vertices.push(dp.position[0], dp.position[1], dp.position[2]);
  });

  controlPointCount = dragCountY;
  BSM.controlPoints.forEach(function(dp, i) {
    let j = i + dragCountY;
    if (i < dragCountY * (dragCountX - 1)) {
      vertices.push(dp.position[0], dp.position[1], dp.position[2]);
      let sp = BSM.controlPoints[j].position;
      vertices.push(sp[0], sp[1], sp[2]);
    }
  });

  gl.bindBuffer(gl.ARRAY_BUFFER, gridLinesBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  let vertexBuffer = {
    id: gridLinesBuffer,
    elSize: 3
  };
  let attribBuffers = {
    vertex: vertexBuffer
  };
  let lines = {
    attribBuffers,
    nVerts: ((dragCountX * (dragCountY - 1)) + (dragCountY * (dragCountX - 1))) * 2, //16 * (controlPointCount - 1),
    primtype: gl.LINES
  };

  setProgramAttributes(gl, lines, primitiveProgram);
  sharedUniforms.M.set(flatten(scalem(1, 1, 1)));

  primitiveProgram.uniforms.color.set([1, 1, 1, 1]);

  program.uniforms.color.set([1, 1, 1, 1]);
  drawObject(gl, lines);
}

/*
  Draw indicator..
*/
function drawGimbal(gl, sharedUniforms, program, pos, size, state) {
  let M = mult(translate(pos[0], pos[1], pos[2]), scalem(size, size, size));
  sharedUniforms.M.set(flatten(M));

  program.uniforms.color.set([1, 0, 0, 1]);
  setProgramAttributes(gl, gimbal.r, primitiveProgram);
  drawObject(gl, gimbal.r);

  program.uniforms.color.set([0, 1, 0, 1]);
  setProgramAttributes(gl, gimbal.g, primitiveProgram);
  drawObject(gl, gimbal.g);

  program.uniforms.color.set([0, 0, 1, 1]);
  setProgramAttributes(gl, gimbal.b, primitiveProgram);
  drawObject(gl, gimbal.b);
}