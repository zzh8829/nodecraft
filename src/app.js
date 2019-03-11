import express from 'express';
import http from 'http';
import socketio from 'socket.io'
import mapcache from './mapcache'
import { generateMap } from './mapgen'

const app = express();
const server = http.createServer(app);
const io = socketio.listen(server);
const port = process.env.PORT || 8000;

app.set('port', port);
app.enable('trust proxy');
app.disable('x-powered-by');

app.get('/healthz', (req, res) => {
  res.send("ok");
});

let blocks = mapcache.latest() || {};

// Every 4 Hours
var CronJob = require('cron').CronJob
new CronJob('01 00 */4 * * *', () => {
  mapcache.save(blocks);
}, null, true, 'UTC');

app.get('/mapcache', (req, res) => {
  mapcache.load((json) => {
    res.json(json);
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

server.listen(port);
console.log('Server started')
