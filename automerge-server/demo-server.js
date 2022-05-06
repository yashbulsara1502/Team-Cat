
/**
 * @type {any}
 */
const WebSocket = require('ws')
const http = require('http')
const StaticServer = require('node-static').Server
const socketIO = require('socket.io')


const production = process.env.PRODUCTION != null
const port = process.env.PORT || 8082

const staticServer = new StaticServer('../', { cache: production ? 3600 : false, gzip: production })

const server = http.createServer((request, response) => {
  request.addListener('end', () => {
    staticServer.serve(request, response)
  }).resume()
})

var websocketList = [];


let interval;
const io = socketIO(server, {
  cors: {
    origin: '*'
  }
});
io.on('connection', socket => {
  console.log("client connection on websocket", socket.id);
  // if(interval){
  //     clearInterval(interval);
  // }

  socket.on('typing', function (data) {
    console.log("Client ", data);
    socket.broadcast.emit('typing', data)
  })

  //getApiAndEmit(socket)
  socket.on("disconnect", () => {
    console.log("Client disconnected");
    //clearInterval(interval);
  })
})


const getApiAndEmit = socket => {
  const response = new Date();
  socket.emit("FromAPI", response)
}

server.on('upgrade', (request, socket, head) => {


})

server.listen(port)

console.log(`Listening to http://localhost:${port} ${production ? '(production)' : ''}`)
