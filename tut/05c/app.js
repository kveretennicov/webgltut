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
    var offsetUniform = programInfo.locations['offset'];

    var perspectiveMatrixUnif = programInfo.locations['perspectiveMatrix'];

    var frustumScale = 1.0;
    var zNear = 1.0;
    var zFar = 3.0;
    var perspectiveMatrix = new Float32Array(16);
    perspectiveMatrix[0] = frustumScale;
    perspectiveMatrix[5] = frustumScale;
    perspectiveMatrix[10] = (zNear + zFar) / (zNear - zFar);
    perspectiveMatrix[14] = 2 * zNear * zFar / (zNear - zFar);
    perspectiveMatrix[11] = -1;

    var numberOfVertices = 36;

    var RIGHT_EXTENT = 0.8;
    var LEFT_EXTENT = -RIGHT_EXTENT;
    var TOP_EXTENT = 0.20;
    var MIDDLE_EXTENT = 0.0;
    var BOTTOM_EXTENT = -TOP_EXTENT;
    var FRONT_EXTENT = -1.25;
    var REAR_EXTENT = -1.75;

    var vertexData = [
	//Object 1 positions
	LEFT_EXTENT,	TOP_EXTENT,	REAR_EXTENT,
	LEFT_EXTENT,	MIDDLE_EXTENT,	FRONT_EXTENT,
	RIGHT_EXTENT,	MIDDLE_EXTENT,	FRONT_EXTENT,
	RIGHT_EXTENT,	TOP_EXTENT,	REAR_EXTENT,

	LEFT_EXTENT,	BOTTOM_EXTENT,	REAR_EXTENT,
	LEFT_EXTENT,	MIDDLE_EXTENT,	FRONT_EXTENT,
	RIGHT_EXTENT,	MIDDLE_EXTENT,	FRONT_EXTENT,
	RIGHT_EXTENT,	BOTTOM_EXTENT,	REAR_EXTENT,

	LEFT_EXTENT,	TOP_EXTENT,	REAR_EXTENT,
	LEFT_EXTENT,	MIDDLE_EXTENT,	FRONT_EXTENT,
	LEFT_EXTENT,	BOTTOM_EXTENT,	REAR_EXTENT,

	RIGHT_EXTENT,	TOP_EXTENT,	REAR_EXTENT,
	RIGHT_EXTENT,	MIDDLE_EXTENT,	FRONT_EXTENT,
	RIGHT_EXTENT,	BOTTOM_EXTENT,	REAR_EXTENT,

	LEFT_EXTENT,	BOTTOM_EXTENT,	REAR_EXTENT,
	LEFT_EXTENT,	TOP_EXTENT,	REAR_EXTENT,
	RIGHT_EXTENT,	TOP_EXTENT,	REAR_EXTENT,
	RIGHT_EXTENT,	BOTTOM_EXTENT,	REAR_EXTENT,

	//Object 2 positions
	TOP_EXTENT,	RIGHT_EXTENT,	REAR_EXTENT,
	MIDDLE_EXTENT,	RIGHT_EXTENT,	FRONT_EXTENT,
	MIDDLE_EXTENT,	LEFT_EXTENT,	FRONT_EXTENT,
	TOP_EXTENT,	LEFT_EXTENT,	REAR_EXTENT,

	BOTTOM_EXTENT,	RIGHT_EXTENT,	REAR_EXTENT,
	MIDDLE_EXTENT,	RIGHT_EXTENT,	FRONT_EXTENT,
	MIDDLE_EXTENT,	LEFT_EXTENT,	FRONT_EXTENT,
	BOTTOM_EXTENT,	LEFT_EXTENT,	REAR_EXTENT,

	TOP_EXTENT,	RIGHT_EXTENT,	REAR_EXTENT,
	MIDDLE_EXTENT,	RIGHT_EXTENT,	FRONT_EXTENT,
	BOTTOM_EXTENT,	RIGHT_EXTENT,	REAR_EXTENT,
					
	TOP_EXTENT,	LEFT_EXTENT,	REAR_EXTENT,
	MIDDLE_EXTENT,	LEFT_EXTENT,	FRONT_EXTENT,
	BOTTOM_EXTENT,	LEFT_EXTENT,	REAR_EXTENT,
					
	BOTTOM_EXTENT,	RIGHT_EXTENT,	REAR_EXTENT,
	TOP_EXTENT,	RIGHT_EXTENT,	REAR_EXTENT,
	TOP_EXTENT,	LEFT_EXTENT,	REAR_EXTENT,
	BOTTOM_EXTENT,	LEFT_EXTENT,	REAR_EXTENT,
      ];

    var GREEN_COLOR = [0.75, 0.75, 1.0, 1.0];
    var BLUE_COLOR = [0.0, 0.5, 0.0, 1.0];
    var RED_COLOR = [1.0, 0.0, 0.0, 1.0];
    var GREY_COLOR = [0.8, 0.8, 0.8, 1.0];
    var BROWN_COLOR = [0.5, 0.5, 0.0, 1.0];

    vertexData = vertexData.concat.apply(
      vertexData,
      [
	//Object 1 colors
	GREEN_COLOR,
	GREEN_COLOR,
	GREEN_COLOR,
	GREEN_COLOR,

	BLUE_COLOR,
	BLUE_COLOR,
	BLUE_COLOR,
	BLUE_COLOR,

	RED_COLOR,
	RED_COLOR,
	RED_COLOR,

	GREY_COLOR,
	GREY_COLOR,
	GREY_COLOR,

	BROWN_COLOR,
	BROWN_COLOR,
	BROWN_COLOR,
	BROWN_COLOR,

	//Object 2 colors
	RED_COLOR,
	RED_COLOR,
	RED_COLOR,
	RED_COLOR,

	BROWN_COLOR,
	BROWN_COLOR,
	BROWN_COLOR,
	BROWN_COLOR,

	BLUE_COLOR,
	BLUE_COLOR,
	BLUE_COLOR,

	GREEN_COLOR,
	GREEN_COLOR,
	GREEN_COLOR,

	GREY_COLOR,
	GREY_COLOR,
	GREY_COLOR,
	GREY_COLOR,
    ]);

    var indexData = [
	0, 2, 1,
	3, 2, 0,

	4, 5, 6,
	6, 7, 4,

	8, 9, 10,
	11, 13, 12,

	14, 16, 15,
	17, 16, 14,
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

        perspectiveMatrix[0] = frustumScale * (height / width);
        perspectiveMatrix[5] = frustumScale;

        gl.useProgram(theProgram);
        gl.uniformMatrix4fv(
          perspectiveMatrixUnif, false, perspectiveMatrix);
        gl.useProgram(null);
      }      
    }

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

      // First object.

      var colorDataOffset = 4 * 3 * numberOfVertices;
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
      gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, colorDataOffset);

      gl.uniform3f(offsetUniform, 0.0, 0.0, 0.0);
      gl.drawElements(gl.TRIANGLES, indexData.length, gl.UNSIGNED_SHORT, 0);

      // Second object.

      var posDataOffset = 4 * 3 * (numberOfVertices / 2);
      colorDataOffset += 4 * 4 * (numberOfVertices / 2);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, posDataOffset);
      gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, colorDataOffset);

      gl.uniform3f(offsetUniform, 0.0, 0.0, -1.0);
      gl.drawElements(gl.TRIANGLES, indexData.length, gl.UNSIGNED_SHORT, 0);

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
    gl.depthFunc(gl.LEQUAL);
    gl.depthRange(0.0, 1.0);

    render();
  };

  return {
    start: start,
  };
}();
