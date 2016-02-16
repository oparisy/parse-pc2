# parse-pc2
Parse .PC2 vertex animation files.

## Blocking API

```javascript
var pc2Parser = require('parse-pc2')
var parsed = pc2Parser.toObject(fs.readFileSync('/path/to/animation.pc2'))
```

## Stream API

```javascript
var pc2Parser = require('parse-pc2')
var parser = new pc2Parser.StreamingParser()
parser.on('readable', function () {
  var parsed = parser.read()
  if (parsed) {
    // Use parsed data
  }
})

parser.write(buf)
```

## Object Structure
The following object structure is returned by both parsing APIs:
```javascript
{
  numPoints,  // Number of points per sample
  startFrame, // First sampled frame
  sampleRate, // How frequently to sample (or skip) the frames
  numSamples, // How many samples are stored in this file
  
  frames: [
    // An array per frame
    // Each containing "numPoints" vertex coordinates
    [ [x, y, z], [x, y, z] ]
  ]
}
```

## Example

An example using [stack.gl](http://stack.gl) modules to play an animation exported from Blender:
```bash
$ npm run demo
```

## Development
### Unit Tests
```bash
$ npm run test
```

### Coding style
[standardjs.com](http://standardjs.com) and jshint, as enforced by:
```bash
$ npm run lint
```

## License

MIT
