/* jshint node: true */
/* jslint asi: true */
/* global describe, it, beforeEach */
'use strict'

var assert = require('chai').assert
var fs = require('fs')
var util = require('util')

var pc2Parser = require('../index')

describe('Definition', function () {
  it('should be properly defined', function () {
    var parser = new pc2Parser.StreamingParser()
    assert(util.isObject(parser))
  })
})

describe('Parsing', function () {
  var filename = __dirname + '/palmtree_animated_joined.pc2'

  var buf
  beforeEach(function () {
    // Read test data
    buf = fs.readFileSync(filename)
  })

  it('should parse without error', function () {
    var parser = new pc2Parser.StreamingParser()
    parser.on('readable', function () {
      parser.read()
    })
    parser.write(buf)
  })

  it('should return a meaningful object (stream API)', function (done) {
    var parser = new pc2Parser.StreamingParser()
    parser.on('readable', function () {
      var parsed = parser.read()
      if (parsed) {
        checkContent(parsed)
        done()
      }
    })

    parser.write(buf)
  })

  it('should return a meaningful object (blocking API)', function (done) {
    var parsed = pc2Parser.toObject(buf)
    checkContent(parsed)
    done()
  })

  // Shared validation
  function checkContent (parsed) {
    // Basic sanity checks
    assert.isDefined(parsed)
    assert(util.isObject(parsed))
    assert.equal(parsed.cacheSignatureString, 'POINTCACHE2')
    assert.equal(parsed.fileVersion, 1)

    assert.property(parsed, 'numPoints')
    assert.property(parsed, 'startFrame')
    assert.property(parsed, 'sampleRate')
    assert.property(parsed, 'numSamples')

    var storedFrames = parsed.numSamples / parsed.sampleRate
    var fileSizeInBytes = fs.statSync(filename).size
    assert.equal((32 + storedFrames * parsed.numPoints * 3 * 4), fileSizeInBytes)

    assert.property(parsed, 'frames')
    assert.isArray(parsed.frames)
    assert.equal(parsed.frames.length, storedFrames)

    if (parsed.frames.length > 0) {
      // "points" should be an array of length parsed.numPoints
      assert.isArray(parsed.frames[0])
      assert.equal(parsed.frames[0].length, parsed.numPoints)

      // Items of "points" should be arrays of length 3
      assert.isArray(parsed.frames[0][0])
      assert.equal(parsed.frames[0][0].length, 3)
    }
  }
})
