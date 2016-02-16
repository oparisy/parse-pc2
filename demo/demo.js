/* jshint node: true */
/* jslint browser: true */
/* jslint asi: true */
'use strict'

var glClear = require('gl-clear')
var createContext = require('gl-context')
var fit = require('canvas-fit')
var Geom = require('gl-geometry')
var glslify = require('glslify')
var glShader = require('gl-shader')
var mat4 = require('gl-mat4')
var turntableCamera = require('turntable-camera')
var parseOBJ = require('parse-wavefront-obj')
var fs = require('fs')
var normals = require('normals')
var unindexMesh = require('unindex-mesh')
var faceNormals = require('face-normals')
var PC2Loader = require('../')

// Canvas & WebGL setup
var canvas = document.body.appendChild(document.createElement('canvas'))
window.addEventListener('resize', fit(canvas), false)
var gl = createContext(canvas, render)
var clear = glClear({color: [ 0, 0, 0, 1 ], depth: true})
gl.enable(gl.DEPTH_TEST)

// Load cloth model
var obj = parseOBJ(fs.readFileSync(__dirname + '/basicCloth.obj'))
var norms = normals.vertexNormals(obj.cells, obj.positions)
var cloth = Geom(gl).attr('position', obj.positions).attr('normal', norms).faces(obj.cells)

// Load cube model
var cObj = parseOBJ(fs.readFileSync(__dirname + '/cube.obj'))
for (var i = 0; i < cObj.positions.length; i++) {
  // A small translation to avoid z fighting with the cloth
  cObj.positions[i][1] -= 0.15
}
var cTriangles = unindexMesh(cObj.positions, cObj.cells)
var cNormals = faceNormals(cTriangles)
var cube = Geom(gl).attr('position', cTriangles).attr('normal', cNormals)

// Load cloth animation (blocking API)
var anim = PC2Loader.toObject(fs.readFileSync(__dirname + '/basicCloth.pc2'))

// Basic npr shader
var shader = glShader(gl, glslify('./test.vert'), glslify('./test.frag'))

// Projection and camera setup
var proj = mat4.create()
var camera = turntableCamera()
camera.downwards = Math.PI * 0.25

// Main loop
function render () {
  update(cloth)

  var width = canvas.width
  var height = canvas.height

  gl.viewport(0, 0, width, height)
  clear(gl)

  mat4.perspective(proj, Math.PI / 4, width / height, 0.001, 1000)

  // Update camera rotation angle
  camera.rotation = Date.now() * 0.0002

  cloth.bind(shader)
  shader.uniforms.uProjection = proj
  shader.uniforms.uView = camera.view()
  cloth.draw()

  cube.bind(shader)
  shader.uniforms.uProjection = proj
  shader.uniforms.uView = camera.view()
  cube.draw()
}

var startDate = Date.now()
var currentFrame = 0

function update (geom) {
  // Pick appropriate frame (24fps)
  var delta_ms = Date.now() - startDate
  var newFrame = Math.floor(24 * delta_ms / 1000) % anim.frames.length

  // Update geometry on frame change
  if (newFrame !== currentFrame) {
    currentFrame = newFrame
    var framePosition = anim.frames[currentFrame]
    geom.attr('position', framePosition)
    geom.attr('normal', normals.vertexNormals(obj.cells, framePosition))
  }
}
