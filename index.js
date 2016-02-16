/* jshint node: true */
/* jslint asi: true */
'use strict'

var Dissolve = require('dissolve')
var util = require('util')
var assert = require('chai').assert

/* Implemented with the help of http://mattebb.com/projects/bpython/pointcache/export_pc2.py */
function PC2Parser () {
  Dissolve.call(this)

  // Read header(32 bytes)
  this.string('cacheSignatureString', 11).tap(checkEqual('cacheSignatureString', 'POINTCACHE2'))
  this.uint8('zero').tap(checkEqual('zero', 0))
  this.uint32le('fileVersion').tap(checkEqual('fileVersion', 1))
  this.uint32le('numPoints') // Number of points per sample
  this.floatle('startFrame') // First sampled frame
  this.floatle('sampleRate') // How frequently to sample (or skip) the frames
  this.uint32le('numSamples') // How many samples are stored in this file

  // Read raw data for positions
  this.tap(function () {
    this.vars.numFrames = this.vars.numSamples / this.vars.sampleRate
    this.buffer('raw', this.vars.numFrames * this.vars.numPoints * 12)
  })

  // Organize positions as nested, anonymous arrays
  // (could not do it with "loop")
  this.tap(function () {
    var raw = this.vars.raw
    delete this.vars.raw

    // "for frame in range(startFrame, startFrame+numSamples, sampleRate)"
    this.vars.frames = []
    for (var idx = 0; idx < this.vars.numFrames; idx++) {
      this.vars.frames.push(pointsArray(raw, idx * this.vars.numPoints * 12, this.vars.numPoints))
    }
  })

  // Read from buffer "buf", starting at position "offset", an array of "numPoints" positions (arrays of 3 floats)
  function pointsArray (buf, offset, numPoints) {
    var pointsData = []
    for (var i = offset; i < offset + numPoints * 12; i += 12) {
      pointsData.push([buf.readFloatLE(i + 0), buf.readFloatLE(i + 4), buf.readFloatLE(i + 8)])
    }
    return pointsData
  }

  // Emit result ("this" is a Transform stream)
  this.tap(function () {
    this.push(this.vars)
  })
}

util.inherits(PC2Parser, Dissolve)

function checkEqual (varName, expected) {
  return function () {
    assert.equal(this.vars[varName], expected)
  }
}

function blockingParser (data) {
  var result
  var parser = new PC2Parser()
  parser.on('readable', function () {
    var pc2Data = parser.read()
    if (pc2Data) {
      result = pc2Data
    }
  })
  parser.write(!Buffer.isBuffer(data) ? new Buffer(data) : data)
  parser.end()
  return result
}

// Usage: see tests.js
module.exports = {
  StreamingParser: PC2Parser,
  toObject: blockingParser
}
