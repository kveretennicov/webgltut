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

      for (var i = 0; i < shaderList.length; ++i) {
        gl.detachShader(program, shaderList[i]);
      }

      return program;
    }

    var initializeProgram = function () {

      var elemVertexShader = window.document.getElementById('vs');
      var elemFragmentShader = window.document.getElementById('fs');

      var vertexShader = createShader(
        gl.VERTEX_SHADER, elemVertexShader.text);
      var fragmentShader = createShader(
        gl.FRAGMENT_SHADER, elemFragmentShader.text);

      var program = createProgram([vertexShader, fragmentShader]);

      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);

      return program;
    }

    var theProgram = initializeProgram();

    var vertexPositions = [
      0.75, 0.75, 0.0, 1.0,
      0.75, -0.75, 0.0, 1.0,
      -0.75, -0.75, 0.0, 1.0,
    ];

    var initializeVertexBuffer = function () {

      var buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER, new Float32Array(vertexPositions), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);

      return buffer;
    }

    var positionBufferObject = initializeVertexBuffer(); 

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

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBufferObject);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.disableVertexAttribArray(0);
      gl.useProgram(null);

      stats.end();

      window.requestAnimFrame(render, gl.canvas);
    }

    render();
  };

  return {
    start: start,
  };
}();
