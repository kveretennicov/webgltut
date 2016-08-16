App = function () {
  "use strict";

  var start = function (window, canvasId) {

    var log = {
      error: function (message) {
        window.console.error(message)
        window.alert(message);
      },
      info: function (message) {
        window.console.info(message)
      },
    };

    var stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '0px';
    window.document.body.appendChild(stats.domElement);

    var elemCanvas = window.document.getElementById(canvasId);
    var gl = WebGLUtils.setupWebGL(elemCanvas, {antialias: false});

    var createShader = function (shaderType, shaderSource) {

      var shader = gl.createShader(shaderType);
      gl.shaderSource(shader, shaderSource);
      gl.compileShader(shader);

      var status = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
      if (!status) {
        var infoLog = gl.getShaderInfoLog(shader);
        var shaderTypeName = function () {
          switch (shaderType) {
            case gl.VERTEX_SHADER: return 'vertex';
            case gl.GEOMETRY_SHADER: return 'geometry';
            case gl.FRAGMENT_SHADER: return 'fragment';
          }
        }();
        log.error(
          'Compile failure in ' + shaderTypeName + ' shader:\n' + infoLog);
      }

      return shader;
    }

    var createProgram = function (shaderList) {

      var program = gl.createProgram();

      for (var i = 0; i < shaderList.length; ++i) {
        gl.attachShader(program, shaderList[i]);
      }

      gl.linkProgram(program);

      var status = gl.getProgramParameter(program, gl.LINK_STATUS);
      if (!status) {
        var infoLog = gl.getProgramInfoLog(program);
        log.error('Linker failure: ' + infoLog);
      }

      var locations = {}
      var cAttribs = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
      for (var i = 0; i < cAttribs; ++i) {
        var info = gl.getActiveAttrib(program, i);
        var location = gl.getAttribLocation(program, info.name);
        locations[info.name] = location;
      }
      var cUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
      for (var i = 0; i < cUniforms; ++i) {
        var info = gl.getActiveUniform(program, i);
        var location = gl.getUniformLocation(program, info.name);
        locations[info.name] = location;
      }

      for (var i = 0; i < shaderList.length; ++i) {
        gl.detachShader(program, shaderList[i]);
      }

      return {
        program: program,
        locations: locations,
      }
    }

    var initializeProgram = function () {

      var elemVertexShader = window.document.getElementById('vs');
      var elemFragmentShader = window.document.getElementById('fs');

      var vertexShader = createShader(
        gl.VERTEX_SHADER, elemVertexShader.text);
      var fragmentShader = createShader(
        gl.FRAGMENT_SHADER, elemFragmentShader.text);

      var programInfo = createProgram([vertexShader, fragmentShader]);

      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);

      return programInfo;
    }

    var programInfo = initializeProgram();
    var theProgram = programInfo.program;

    var modelToCameraMatrixUnif = programInfo.locations['modelToCameraMatrix'];
    var cameraToClipMatrixUnif = programInfo.locations['cameraToClipMatrix'];

    var calcFrustumScale = function (fovDeg) {
      var fovRad = glMatrix.toRadian(fovDeg);
      return 1.0 / Math.tan(fovRad / 2.0);
    }

    var frustumScale = calcFrustumScale(45.0);
    var zNear = 1.0;
    var zFar = 61.0;
    var cameraToClipMatrix = new Float32Array(16);
    cameraToClipMatrix[0] = frustumScale;
    cameraToClipMatrix[5] = frustumScale;
    cameraToClipMatrix[10] = (zNear + zFar) / (zNear - zFar);
    cameraToClipMatrix[14] = 2 * zNear * zFar / (zNear - zFar);
    cameraToClipMatrix[11] = -1;

    gl.useProgram(theProgram);
    gl.uniformMatrix4fv(cameraToClipMatrixUnif, false, cameraToClipMatrix);
    gl.useProgram(null);

    var numberOfVertices = 8;

    var vertexData = [
	+1.0, +1.0, +1.0,
	-1.0, -1.0, +1.0,
	-1.0, +1.0, -1.0,
	+1.0, -1.0, -1.0,

	-1.0, -1.0, -1.0,
	+1.0, +1.0, -1.0,
	+1.0, -1.0, +1.0,
	-1.0, +1.0, +1.0,
    ];

    var GREEN_COLOR = [0.0, 1.0, 0.0, 1.0];
    var BLUE_COLOR = [0.0, 0.0, 1.0, 1.0];
    var RED_COLOR = [1.0, 0.0, 0.0, 1.0];
    var GREY_COLOR = [0.8, 0.8, 0.8, 1.0];
    var BROWN_COLOR = [0.5, 0.5, 0.0, 1.0];

    vertexData = vertexData.concat.apply(
      vertexData,
      [
	GREEN_COLOR,
	BLUE_COLOR,
	RED_COLOR,
	BROWN_COLOR,

	GREEN_COLOR,
	BLUE_COLOR,
	RED_COLOR,
	BROWN_COLOR,
      ]
    );

    var indexData = [
	0, 1, 2,
	1, 0, 3,
	2, 3, 0,
	3, 2, 1,

	5, 4, 6,
	4, 5, 7,
	7, 6, 4,
	6, 7, 5,
    ];

    var initializeVertexBuffer = function () {

      var buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);

      return buffer;
    }

    var initializeIndexBuffer = function () {

      var buffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

      return buffer;
    }

    var vertexBufferObject = initializeVertexBuffer(); 
    var indexBufferObject = initializeIndexBuffer();

    var reshape = function () {

      var width = gl.canvas.clientWidth;
      var height = gl.canvas.clientHeight;

      if (gl.canvas.width != width
          || gl.canvas.height != height) {

        gl.canvas.width = width;
        gl.canvas.height = height;
        gl.viewport(0, 0, width, height);

        cameraToClipMatrix[0] = frustumScale * (height / width);
        cameraToClipMatrix[5] = frustumScale;

        gl.useProgram(theProgram);
        gl.uniformMatrix4fv(
          cameraToClipMatrixUnif, false, cameraToClipMatrix);
        gl.useProgram(null);
      }      
    }

    var getElapsedTimeMs = function () {
      var startTimeMs = Date.now();
      return function () {
        return Date.now() - startTimeMs;
      }
    }();

    var createInstance = function (calcRotation, offset) {
      var constructMatrix = function (elapsedTimeS) {
        var theMat = mat4.create(); // 4x4
        var rotMatrix = calcRotation(elapsedTimeS); // 3x3
        theMat[0] = rotMatrix[0];
        theMat[1] = rotMatrix[1];
        theMat[2] = rotMatrix[2];
        theMat[4] = rotMatrix[3];
        theMat[5] = rotMatrix[4];
        theMat[6] = rotMatrix[5];
        theMat[8] = rotMatrix[6];
        theMat[9] = rotMatrix[7];
        theMat[10] = rotMatrix[8];
        theMat[12] = offset[0];
        theMat[13] = offset[1];
        theMat[14] = offset[2];
        return theMat;
      }
      return {
        constructMatrix: constructMatrix,
      }
    }

    var computeAngleRad = function (elapsedTimeS, loopDurationS) {
      var currTimeThroughLoopS = elapsedTimeS % loopDurationS;
      return Math.PI * 2 * currTimeThroughLoopS / loopDurationS;
    }

    var nullRotation = function () {
      return mat3.create();
    }

    var rotateX = function (elapsedTimeS) {

      var angleRad = computeAngleRad(elapsedTimeS, 3.0);
      var cos = Math.cos(angleRad);
      var sin = Math.sin(angleRad);

      var theMat = mat3.create();
      theMat[4] = cos;
      theMat[5] = sin;
      theMat[7] = -sin;
      theMat[8] = cos;

      return theMat;
    }

    var rotateY = function (elapsedTimeS) {

      var angleRad = computeAngleRad(elapsedTimeS, 2.0);
      var cos = Math.cos(angleRad);
      var sin = Math.sin(angleRad);

      var theMat = mat3.create();
      theMat[0] = cos;
      theMat[2] = -sin;
      theMat[6] = sin;
      theMat[8] = cos;

      return theMat;
    }

    var rotateZ = function (elapsedTimeS) {

      var angleRad = computeAngleRad(elapsedTimeS, 2.0);
      var cos = Math.cos(angleRad);
      var sin = Math.sin(angleRad);

      var theMat = mat3.create();
      theMat[0] = cos;
      theMat[1] = sin;
      theMat[3] = -sin;
      theMat[4] = cos;

      return theMat;
    }

    var rotateAxis = function (elapsedTimeS) {

      var angleRad = computeAngleRad(elapsedTimeS, 2.0);
      var cos = Math.cos(angleRad);
      var sin = Math.sin(angleRad);
      var invCos = 1 - cos;

      var axis = [1.0, 1.0, 1.0];
      vec3.normalize(axis, axis);
      var axisX = axis[0];
      var axisY = axis[1];
      var axisZ = axis[2];

      var theMat = mat3.create();

      theMat[0] = axisX * axisX + (1 - axisX * axisX) * cos;
      theMat[1] = invCos * axisX * axisY + axisZ * sin;
      theMat[2] = invCos * axisX * axisZ - axisY * sin;

      theMat[3] = invCos * axisX * axisY - axisZ * sin;
      theMat[4] = axisY * axisY + (1 - axisY * axisY) * cos;
      theMat[5] = invCos * axisY * axisZ + axisX * sin;

      theMat[6] = invCos * axisX * axisZ + axisY * sin;
      theMat[7] = invCos * axisY * axisZ - axisX * sin;
      theMat[8] = axisZ * axisZ + (1 - axisZ * axisZ) * cos;

      return theMat;
    }

    var instanceList = [
      createInstance(nullRotation, [0.0, 0.0, -25.0]),
      createInstance(rotateX, [-5.0, -5.0, -25.0]),
      createInstance(rotateY, [-5.0, 5.0, -25.0]),
      createInstance(rotateZ, [5.0, 5.0, -25.0]),
      createInstance(rotateAxis, [5.0, -5.0, -25.0]),
    ];

    var render = function () {

      stats.begin();

      reshape();

      gl.clearColor(0, 0, 0, 1.0);
      gl.clearDepth(1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.useProgram(theProgram);

      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferObject);
      gl.enableVertexAttribArray(0);
      gl.enableVertexAttribArray(1);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBufferObject);

      //

      var colorDataOffset = 4 * 3 * numberOfVertices;
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
      gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, colorDataOffset);

      var elapsedTimeS = getElapsedTimeMs() / 1000.0;
      for (var iLoop = 0; iLoop < instanceList.length; ++iLoop) {
        var currInst = instanceList[iLoop];
        var transformMatrix = currInst.constructMatrix(elapsedTimeS);
        gl.uniformMatrix4fv(
          modelToCameraMatrixUnif, false, transformMatrix);
        gl.drawElements(gl.TRIANGLES, indexData.length, gl.UNSIGNED_SHORT, 0);
      }

      //

      gl.disableVertexAttribArray(0);
      gl.disableVertexAttribArray(1);
      gl.useProgram(null);

      stats.end();

      window.requestAnimFrame(render, gl.canvas);
    }

    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.frontFace(gl.CW);

    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.depthFunc(gl.LESS);
    gl.depthRange(0.0, 1.0);

    render();
  };

  return {
    start: start,
  };
}();
