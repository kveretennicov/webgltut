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
    var zFar = 45.0;
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

    var createInstance = function (calcOffset) {
      var constructMatrix = function (elapsedTimeS) {
        var theMat = mat4.create();
        var offset = calcOffset(elapsedTimeS);
        theMat[12] = offset[0];
        theMat[13] = offset[1];
        theMat[14] = offset[2];
        return theMat;
      }
      return {
        constructMatrix: constructMatrix,
      }
    }

    var stationaryOffset = function () {
      return [0.0, 0.0, -20.0];
    }

    var ovalOffset = function (elapsedTimeS) {

      var loopDuration = 3.0;
      var scale = Math.PI * 2 / loopDuration;

      var currTimeThroughLoop = elapsedTimeS % loopDuration;

      var offset = [
        Math.cos(currTimeThroughLoop * scale) * 4.0,
        Math.sin(currTimeThroughLoop * scale) * 6.0,
        -20.0,
        ];
      return offset;
    }

    var bottomCircleOffset = function (elapsedTimeS) {

      var loopDuration = 12.0;
      var scale = Math.PI * 2 / loopDuration;

      var currTimeThroughLoop = elapsedTimeS % loopDuration;

      var offset = [
        Math.cos(currTimeThroughLoop * scale) * 5.0,
        -3.5,
        Math.sin(currTimeThroughLoop * scale) * 5.0 - 20.0,
      ];
      return offset;
    }

    var instanceList = [
      createInstance(stationaryOffset),
      createInstance(ovalOffset),
      createInstance(bottomCircleOffset),
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
