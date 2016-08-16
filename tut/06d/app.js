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

    var positionAttrib = programInfo.locations['position'];
    var colorAttrib = programInfo.locations['color'];
    var modelToCameraMatrixUnif = programInfo.locations['modelToCameraMatrix'];
    var cameraToClipMatrixUnif = programInfo.locations['cameraToClipMatrix'];

    var calcFrustumScale = function (fovDeg) {
      var fovRad = glMatrix.toRadian(fovDeg);
      return 1.0 / Math.tan(fovRad / 2.0);
    }

    var frustumScale = calcFrustumScale(45.0);
    var zNear = 1.0;
    var zFar = 100.0;
    var cameraToClipMatrix = mat4.create();
    cameraToClipMatrix[0] = frustumScale;
    cameraToClipMatrix[5] = frustumScale;
    cameraToClipMatrix[10] = (zNear + zFar) / (zNear - zFar);
    cameraToClipMatrix[14] = 2 * zNear * zFar / (zNear - zFar);
    cameraToClipMatrix[11] = -1;

    gl.useProgram(theProgram);
    gl.uniformMatrix4fv(cameraToClipMatrixUnif, false, cameraToClipMatrix);
    gl.useProgram(null);

    var numberOfVertices = 24;

    var vertexData = [
	//Front
	+1.0, +1.0, +1.0,
	+1.0, -1.0, +1.0,
	-1.0, -1.0, +1.0,
	-1.0, +1.0, +1.0,

	//Top
	+1.0, +1.0, +1.0,
	-1.0, +1.0, +1.0,
	-1.0, +1.0, -1.0,
	+1.0, +1.0, -1.0,

	//Left
	+1.0, +1.0, +1.0,
	+1.0, +1.0, -1.0,
	+1.0, -1.0, -1.0,
	+1.0, -1.0, +1.0,

	//Back
	+1.0, +1.0, -1.0,
	-1.0, +1.0, -1.0,
	-1.0, -1.0, -1.0,
	+1.0, -1.0, -1.0,

	//Bottom
	+1.0, -1.0, +1.0,
	+1.0, -1.0, -1.0,
	-1.0, -1.0, -1.0,
	-1.0, -1.0, +1.0,

	//Right
	-1.0, +1.0, +1.0,
	-1.0, -1.0, +1.0,
	-1.0, -1.0, -1.0,
	-1.0, +1.0, -1.0,
    ];

    var RED_COLOR = [1.0, 0.0, 0.0, 1.0];
    var GREEN_COLOR = [0.0, 1.0, 0.0, 1.0];
    var BLUE_COLOR = [0.0, 0.0, 1.0, 1.0];

    var YELLOW_COLOR = [1.0, 1.0, 0.0, 1.0];
    var CYAN_COLOR = [0.0, 1.0, 1.0, 1.0];
    var MAGENTA_COLOR = [1.0, 0.0, 1.0, 1.0];

    vertexData = vertexData.concat.apply(
      vertexData,
      [
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
	RED_COLOR,

	YELLOW_COLOR,
	YELLOW_COLOR,
	YELLOW_COLOR,
	YELLOW_COLOR,

	CYAN_COLOR,
	CYAN_COLOR,
	CYAN_COLOR,
	CYAN_COLOR,

	MAGENTA_COLOR,
	MAGENTA_COLOR,
	MAGENTA_COLOR,
	MAGENTA_COLOR,
      ]
    );

    var indexData = [
	0, 1, 2,
	2, 3, 0,

	4, 5, 6,
	6, 7, 4,

	8, 9, 10,
	10, 11, 8,

	12, 13, 14,
	14, 15, 12,

	16, 17, 18,
	18, 19, 16,

	20, 21, 22,
	22, 23, 20,
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

    var clamp = function (value, minValue, maxValue) {
      if (value < minValue) {
        return minValue;
      }
      if (value > maxValue) {
        return maxValue;
      }
      return value;
    }

    var rotateX = function (angDeg) {

      var angleRad = glMatrix.toRadian(angDeg);
      var cos = Math.cos(angleRad);
      var sin = Math.sin(angleRad);

      var theMat = mat3.create();
      theMat[4] = cos;
      theMat[5] = sin;
      theMat[7] = -sin;
      theMat[8] = cos;

      return theMat;
    }

    var rotateY = function (angDeg) {

      var angleRad = glMatrix.toRadian(angDeg);
      var cos = Math.cos(angleRad);
      var sin = Math.sin(angleRad);

      var theMat = mat3.create();
      theMat[0] = cos;
      theMat[2] = -sin;
      theMat[6] = sin;
      theMat[8] = cos;

      return theMat;
    }

    var rotateZ = function (angDeg) {

      var angleRad = glMatrix.toRadian(angDeg);
      var cos = Math.cos(angleRad);
      var sin = Math.sin(angleRad);

      var theMat = mat3.create();
      theMat[0] = cos;
      theMat[1] = sin;
      theMat[3] = -sin;
      theMat[4] = cos;

      return theMat;
    }

    var createMatrixStack = function () {

      var currMat = mat4.create();
      var matrices = [];

      var mat4FromMat3 = function (m3) {
        var m4 = mat4.create();
        m4[0] = m3[0];
        m4[1] = m3[1];
        m4[2] = m3[2];
        m4[4] = m3[3];
        m4[5] = m3[4];
        m4[6] = m3[5];
        m4[8] = m3[6];
        m4[9] = m3[7];
        m4[10] = m3[8];
        return m4;
      }

      var push = function () {
        matrices.push(mat4.clone(currMat));
      }

      var pop = function () {
        currMat = matrices[matrices.length - 1];
        matrices.pop();
      }

      return {
        top: function () {
          return currMat;
        },
        rotateX: function (angDeg) {
          mat4.mul(currMat, currMat, mat4FromMat3(rotateX(angDeg)));
        },
        rotateY: function (angDeg) {
          mat4.mul(currMat, currMat, mat4FromMat3(rotateY(angDeg)));
        },
        rotateZ: function (angDeg) {
          mat4.mul(currMat, currMat, mat4FromMat3(rotateZ(angDeg)));
        },
        scale: function (scaleVec) {
          var scaleMat = mat4.create();
          scaleMat[0] = scaleVec[0];
          scaleMat[5] = scaleVec[1];
          scaleMat[10] = scaleVec[2];
          mat4.mul(currMat, currMat, scaleMat);
        },
        translate: function (offsetVec) {
          var translateMat = mat4.create();
          translateMat[12] = offsetVec[0];
          translateMat[13] = offsetVec[1];
          translateMat[14] = offsetVec[2];
          mat4.mul(currMat, currMat, translateMat);
        },
        do: function (action) {
          push();
          try {
            action(this);
          } finally {
            pop();
          }
        }
      };
    }

    var armature = (function () {
      
      var posBase = vec3.fromValues(3.0, -5.0, -40.0),
          angBase = -45.0,
          posBaseLeft = vec3.fromValues(2.0, 0.0, 0.0),
          posBaseRight = vec3.fromValues(-2.0, 0.0, 0.0),
          scaleBaseZ = 3.0,
          angUpperArm = -33.75,
          sizeUpperArm = 9.0,
          posLowerArm = vec3.fromValues(0.0, 0.0, 8.0),
          angLowerArm = 146.25,
          lenLowerArm = 5.0,
          widthLowerArm = 1.5,
          posWrist = vec3.fromValues(0.0, 0.0, 5.0),
          angWristRoll = 0.0,
          angWristPitch = 67.5,
          lenWrist = 2.0,
          widthWrist = 2.0,
          posLeftFinger = vec3.fromValues(1.0, 0.0, 1.0),
          posRightFinger = vec3.fromValues(-1.0, 0.0, 1.0),
          angFingerOpen = 180.0,
          lenFinger = 2.0,
          widthFinger = 0.5,
          angLowerFinger = 45.0;

      var drawFingers = function (modelToCameraStack) {

        modelToCameraStack.do(function () {
        
          // Draw left finger.

          modelToCameraStack.translate(posLeftFinger);
          modelToCameraStack.rotateY(angFingerOpen);

          modelToCameraStack.do(function () {

            modelToCameraStack.translate(
              vec3.fromValues(0.0, 0.0, lenFinger / 2.0));
            modelToCameraStack.scale(
              vec3.fromValues(
                widthFinger / 2.0, widthFinger / 2.0, lenFinger / 2.0));

            gl.uniformMatrix4fv(
              modelToCameraMatrixUnif, false, modelToCameraStack.top());
            gl.drawElements(
              gl.TRIANGLES, indexData.length, gl.UNSIGNED_SHORT, 0);
          });

          // Draw left lower finger.

          modelToCameraStack.do(function () {

            modelToCameraStack.translate(
              vec3.fromValues(0.0, 0.0, lenFinger));
            modelToCameraStack.rotateY(-angLowerFinger);
            modelToCameraStack.translate(
              vec3.fromValues(0.0, 0.0, lenFinger / 2.0));
            modelToCameraStack.scale(
              vec3.fromValues(
                widthFinger / 2.0, widthFinger / 2.0, lenFinger / 2.0));

            gl.uniformMatrix4fv(
              modelToCameraMatrixUnif, false, modelToCameraStack.top());
            gl.drawElements(
              gl.TRIANGLES, indexData.length, gl.UNSIGNED_SHORT, 0);
          });
        });

        modelToCameraStack.do(function () {
        
          modelToCameraStack.translate(posRightFinger);
          modelToCameraStack.rotateY(-angFingerOpen);

          // Draw right finger.

          modelToCameraStack.do(function () {

            modelToCameraStack.translate(
              vec3.fromValues(0.0, 0.0, lenFinger / 2.0));
            modelToCameraStack.scale(
              vec3.fromValues(
                widthFinger / 2.0, widthFinger / 2.0, lenFinger / 2.0));

            gl.uniformMatrix4fv(
              modelToCameraMatrixUnif, false, modelToCameraStack.top());
            gl.drawElements(
              gl.TRIANGLES, indexData.length, gl.UNSIGNED_SHORT, 0);
          });

          // Draw right lower finger.

          modelToCameraStack.do(function () {

            modelToCameraStack.translate(
              vec3.fromValues(0.0, 0.0, lenFinger));
            modelToCameraStack.rotateY(angLowerFinger);
            modelToCameraStack.translate(
              vec3.fromValues(0.0, 0.0, lenFinger / 2.0));
            modelToCameraStack.scale(
              vec3.fromValues(
                widthFinger / 2.0, widthFinger / 2.0, lenFinger / 2.0));

            gl.uniformMatrix4fv(
              modelToCameraMatrixUnif, false, modelToCameraStack.top());
            gl.drawElements(
              gl.TRIANGLES, indexData.length, gl.UNSIGNED_SHORT, 0);
          });
        });
      }

      var drawWrist = function (modelToCameraStack) {

        modelToCameraStack.do(function () {

          modelToCameraStack.translate(posWrist);
          modelToCameraStack.rotateZ(angWristRoll);
          modelToCameraStack.rotateX(angWristPitch);

          modelToCameraStack.do(function () {
            modelToCameraStack.scale(
              vec3.fromValues(
                widthWrist / 2.0, widthWrist / 2.0, lenWrist / 2.0));
            gl.uniformMatrix4fv(
              modelToCameraMatrixUnif, false, modelToCameraStack.top());
            gl.drawElements(
              gl.TRIANGLES, indexData.length, gl.UNSIGNED_SHORT, 0);
          });

          drawFingers(modelToCameraStack);
        });
      }

      var drawLowerArm = function (modelToCameraStack) {
        
        modelToCameraStack.do(function () {

          modelToCameraStack.translate(posLowerArm);
          modelToCameraStack.rotateX(angLowerArm);

          modelToCameraStack.do(function () {
            modelToCameraStack.translate(
              vec3.fromValues(0.0, 0.0, lenLowerArm / 2.0));
            modelToCameraStack.scale(
              vec3.fromValues(
                widthLowerArm / 2.0, widthLowerArm / 2.0, lenLowerArm / 2.0));
            gl.uniformMatrix4fv(
              modelToCameraMatrixUnif, false, modelToCameraStack.top());
            gl.drawElements(
              gl.TRIANGLES, indexData.length, gl.UNSIGNED_SHORT, 0);
          });

          drawWrist(modelToCameraStack);
        });
      }

      var drawUpperArm = function (modelToCameraStack) {

        modelToCameraStack.do(function () {

          modelToCameraStack.rotateX(angUpperArm);

          modelToCameraStack.do(function () {
            modelToCameraStack.translate(
              vec3.fromValues(0.0, 0.0, sizeUpperArm / 2.0 - 1.0));
            modelToCameraStack.scale(
              vec3.fromValues(1.0, 1.0, sizeUpperArm / 2.0));
            gl.uniformMatrix4fv(
              modelToCameraMatrixUnif, false, modelToCameraStack.top());
            gl.drawElements(
              gl.TRIANGLES, indexData.length, gl.UNSIGNED_SHORT, 0);
          });

          drawLowerArm(modelToCameraStack);
        });
      }

      var draw = function () {

        var modelToCameraStack = createMatrixStack();

        gl.useProgram(theProgram);

        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferObject);
        gl.enableVertexAttribArray(positionAttrib);
        gl.enableVertexAttribArray(colorAttrib);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBufferObject);

        var colorDataOffset = 4 * 3 * numberOfVertices;
        gl.vertexAttribPointer(positionAttrib, 3, gl.FLOAT, false, 0, 0);
        gl.vertexAttribPointer(
          colorAttrib, 4, gl.FLOAT, false, 0, colorDataOffset);

        modelToCameraStack.translate(posBase);
        modelToCameraStack.rotateY(angBase);

        // Draw left base.

        modelToCameraStack.do(function () {
          modelToCameraStack.translate(posBaseLeft);
          modelToCameraStack.scale(vec3.fromValues(1.0, 1.0, scaleBaseZ));
          gl.uniformMatrix4fv(
            modelToCameraMatrixUnif, false, modelToCameraStack.top());
          gl.drawElements(
            gl.TRIANGLES, indexData.length, gl.UNSIGNED_SHORT, 0);
        });

        // Draw right base.

        modelToCameraStack.do(function () {
          modelToCameraStack.translate(posBaseRight);
          modelToCameraStack.scale(vec3.fromValues(1.0, 1.0, scaleBaseZ));
          gl.uniformMatrix4fv(
            modelToCameraMatrixUnif, false, modelToCameraStack.top());
          gl.drawElements(
            gl.TRIANGLES, indexData.length, gl.UNSIGNED_SHORT, 0);
        });

        // Draw main arm.

        drawUpperArm(modelToCameraStack);

        //

        gl.disableVertexAttribArray(positionAttrib);
        gl.disableVertexAttribArray(colorAttrib);
        gl.useProgram(null);
      }

      var standardAngleIncrement = 11.25;
      var smallAngleIncrement = 9.0;

      return {
        draw: draw,
        adjBase: function (increment) {
          angBase += increment
            ? standardAngleIncrement
            : -standardAngleIncrement;
          angBase %= 360.0;
        },
        adjUpperArm: function (increment) {
          angUpperArm += increment
            ? standardAngleIncrement
            : -standardAngleIncrement;
          angUpperArm = clamp(angUpperArm, -90.0, 0.0);
        },
        adjLowerArm: function (increment) {
          angLowerArm += increment
            ? standardAngleIncrement
            : -standardAngleIncrement;
          angLowerArm = clamp(angLowerArm, 0.0, 146.25);
        },
        adjWristPitch: function (increment) {
          angWristPitch += increment
            ? standardAngleIncrement
            : -standardAngleIncrement;
          angWristPitch = clamp(angWristPitch, 0.0, 90.0);
        },
        adjWristRoll: function (increment) {
          angWristRoll += increment
            ? standardAngleIncrement
            : -standardAngleIncrement;
          angWristRoll %= 360.0;
        },
        adjFingerOpen: function (increment) {
          angFingerOpen += increment
            ? smallAngleIncrement
            : -smallAngleIncrement;
          angFingerOpen = clamp(angFingerOpen, 9.0, 180.0);
        },
        writePose: function () {
          log.info('angBase: ' + angBase);
          log.info('angUpperArm: ' + angUpperArm);
          log.info('angLowerArm: ' + angLowerArm);
          log.info('angWristPitch: ' + angWristPitch);
          log.info('angWristRoll: ' + angWristRoll);
          log.info('angFingerOpen: ' + angFingerOpen);
        },
      };
    })();

    window.addEventListener('keypress', (function () {

      var keyHandlers = {
        'a': function () { armature.adjBase(true); },
        'd': function () { armature.adjBase(false); },
        'w': function () { armature.adjUpperArm(true); },
        's': function () { armature.adjUpperArm(false); },
        'r': function () { armature.adjLowerArm(true); },
        'f': function () { armature.adjLowerArm(false); },
        't': function () { armature.adjWristPitch(true); },
        'g': function () { armature.adjWristPitch(false); },
        'z': function () { armature.adjWristRoll(true); },
        'c': function () { armature.adjWristRoll(false); },
        'q': function () { armature.adjFingerOpen(true); },
        'e': function () { armature.adjFingerOpen(false); },
        ' ': function () { armature.writePose(); },
      };

      return function (e) {
        var char = String.fromCharCode(e.charCode);
        var handler = keyHandlers[char];
        if (handler !== undefined) {
          e.preventDefault();
          handler();
        }
      };
    })());

    var render = function () {

      stats.begin();

      reshape();

      gl.clearColor(0, 0, 0, 1.0);
      gl.clearDepth(1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      armature.draw();

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
