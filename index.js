const express        = require('express');
const app    = express();
const server = require('http').createServer(app);
const io     = require('socket.io').listen(server);
const port   = process.env.PORT || 8000;

app.set('port', port);
app.enable('trust proxy');
app.disable('x-powered-by');

app.get('/healthz', function(req, res) {
  res.send("ok");
});

const mapcache = require('./mapcache');

let blocks = mapcache.latest() || {};

// Every 4 Hours
var CronJob = require('cron').CronJob
new CronJob('01 00 */4 * * *', function() {
  mapcache.save(blocks);
}, null, true, 'UTC');

app.get('/mapcache', function(req, res) {
  mapcache.load(function(json) {
    res.json(json)
  })
});

io.on('connection', (socket) => {
  socket.emit('init', blocks);
  socket.on('insert', (data) => {
    blocks[data] = true;
    socket.broadcast.emit('insert', data);
  });
  socket.on('delete', (data) => {
    delete blocks[data];
    socket.broadcast.emit('delete', data);
  });
  socket.on('clear', (data) => {
    blocks = {};
    socket.broadcast.emit('clear', data);
  });
  socket.on('generate', () => {
    io.sockets.emit('clear');
    blocks = generateMap();
    io.sockets.emit('init', blocks);
  });
});

const worldWidth = 64;
const worldDepth = 64;
const worldHalfWidth = worldWidth / 2;
const worldHalfDepth = worldDepth / 2;

/*eslint-disable */
const ImprovedNoise = require('./ImprovedNoise.js');

function generateMap() {
  const data = generateHeight(worldWidth, worldDepth);
  const getY = ((x, z) => {
    return (data[x + z * worldWidth] * 0.18) | 0;
  });

  const blocks = {};
  for (let z = 0; z < worldDepth; z ++) {
    for (let x = 0; x < worldWidth; x ++) {
      pos = [x - worldHalfWidth, getY(x, z), z - worldHalfDepth];
      blocks[pos] = true;
    }
  }
  return blocks;
}
function generateHeight(width, height) {
  var data = [], perlin = ImprovedNoise(),
    size = width * height, quality = 2, z = Math.random() * 100;
  for (var j = 0; j < 4; j ++) {
    if (j === 0) for (var i = 0; i < size; i ++) data[i] = 0;
    for (var i = 0; i < size; i ++) {
      var x = i % width, y = (i / width) | 0;
      data[i] += perlin.noise(x / quality, y / quality, z) * quality;
    }
    quality *= 4;
  }
  return data;
}
/*eslint-enable */

function sendUploadToGCS (req, res, next) {
  if (!req.file) {
    return next();
  }

  const gcsname = Date.now() + req.file.originalname;
  const file = bucket.file(gcsname);

  const stream = file.createWriteStream({
    metadata: {
      contentType: req.file.mimetype
    }
  });

  stream.on('error', (err) => {
    req.file.cloudStorageError = err;
    next(err);
  });

  stream.on('finish', () => {
    req.file.cloudStorageObject = gcsname;
    req.file.cloudStoragePublicUrl = getPublicUrl(gcsname);
    next();
  });

  stream.end(req.file.buffer);
}

server.listen(port);
