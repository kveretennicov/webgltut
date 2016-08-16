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

    var vertexData = [
	 0.25,  0.25, 0.75, 1.0,
	 0.25, -0.25, 0.75, 1.0,
	-0.25,  0.25, 0.75, 1.0,

	 0.25, -0.25, 0.75, 1.0,
	-0.25, -0.25, 0.75, 1.0,
	-0.25,  0.25, 0.75, 1.0,

	 0.25,  0.25, -0.75, 1.0,
	-0.25,  0.25, -0.75, 1.0,
	 0.25, -0.25, -0.75, 1.0,

	 0.25, -0.25, -0.75, 1.0,
	-0.25,  0.25, -0.75, 1.0,
	-0.25, -0.25, -0.75, 1.0,

	-0.25,  0.25,  0.75, 1.0,
	-0.25, -0.25,  0.75, 1.0,
	-0.25, -0.25, -0.75, 1.0,

	-0.25,  0.25,  0.75, 1.0,
	-0.25, -0.25, -0.75, 1.0,
	-0.25,  0.25, -0.75, 1.0,

	 0.25,  0.25,  0.75, 1.0,
	 0.25, -0.25, -0.75, 1.0,
	 0.25, -0.25,  0.75, 1.0,

	 0.25,  0.25,  0.75, 1.0,
	 0.25,  0.25, -0.75, 1.0,
	 0.25, -0.25, -0.75, 1.0,

	 0.25,  0.25, -0.75, 1.0,
	 0.25,  0.25,  0.75, 1.0,
	-0.25,  0.25,  0.75, 1.0,

	 0.25,  0.25, -0.75, 1.0,
	-0.25,  0.25,  0.75, 1.0,
	-0.25,  0.25, -0.75, 1.0,

	 0.25, -0.25, -0.75, 1.0,
	-0.25, -0.25,  0.75, 1.0,
	 0.25, -0.25,  0.75, 1.0,

	 0.25, -0.25, -0.75, 1.0,
	-0.25, -0.25, -0.75, 1.0,
	-0.25, -0.25,  0.75, 1.0,


	0.0, 0.0, 1.0, 1.0,
	0.0, 0.0, 1.0, 1.0,
	0.0, 0.0, 1.0, 1.0,

	0.0, 0.0, 1.0, 1.0,
	0.0, 0.0, 1.0, 1.0,
	0.0, 0.0, 1.0, 1.0,

	0.8, 0.8, 0.8, 1.0,
	0.8, 0.8, 0.8, 1.0,
	0.8, 0.8, 0.8, 1.0,

	0.8, 0.8, 0.8, 1.0,
	0.8, 0.8, 0.8, 1.0,
	0.8, 0.8, 0.8, 1.0,

	0.0, 1.0, 0.0, 1.0,
	0.0, 1.0, 0.0, 1.0,
	0.0, 1.0, 0.0, 1.0,

	0.0, 1.0, 0.0, 1.0,
	0.0, 1.0, 0.0, 1.0,
	0.0, 1.0, 0.0, 1.0,

	0.5, 0.5, 0.0, 1.0,
	0.5, 0.5, 0.0, 1.0,
	0.5, 0.5, 0.0, 1.0,

	0.5, 0.5, 0.0, 1.0,
	0.5, 0.5, 0.0, 1.0,
	0.5, 0.5, 0.0, 1.0,

	1.0, 0.0, 0.0, 1.0,
	1.0, 0.0, 0.0, 1.0,
	1.0, 0.0, 0.0, 1.0,

	1.0, 0.0, 0.0, 1.0,
	1.0, 0.0, 0.0, 1.0,
	1.0, 0.0, 0.0, 1.0,

	0.0, 1.0, 1.0, 1.0,
	0.0, 1.0, 1.0, 1.0,
	0.0, 1.0, 1.0, 1.0,

	0.0, 1.0, 1.0, 1.0,
	0.0, 1.0, 1.0, 1.0,
	0.0, 1.0, 1.0, 1.0,
    ];

    var initializeVertexBuffer = function () {

      var buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);

      return buffer;
    }

    var vertexBufferObject = initializeVertexBuffer(); 

    var reshape = function () {
      var width = gl.canvas.clientWidth;
      var height = gl.canvas.clientHeight;
      if (gl.canvas.width != width
          || gl.canvas.height != height) {
        gl.canvas.width = width;
        gl.canvas.height = height;
        gl.viewport(0, 0, width, height);
      }      
    }

    var render = function () {

      stats.begin();

      reshape();

      gl.clearColor(0, 0, 0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(theProgram);

      gl.uniform2f(offsetUniform, 0.5, 0.25);

      var colorData = vertexData.length * 4 / 2;
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferObject);
      gl.enableVertexAttribArray(0);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
      gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, colorData);

      gl.drawArrays(gl.TRIANGLES, 0, 36);

      gl.disableVertexAttribArray(0);
      gl.disableVertexAttribArray(1);
      gl.useProgram(null);

      stats.end();

      window.requestAnimFrame(render, gl.canvas);
    }

    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.frontFace(gl.CW);

    render();
  };

  return {
    start: start,
  };
}();
