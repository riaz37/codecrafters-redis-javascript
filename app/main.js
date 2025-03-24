const net = require("net");

console.log("Logs from your program will appear here!");

const server = net.createServer((connection) => {
  // Handle incoming data
  connection.on('data', (data) => {
    // We don't need to parse the PING command fully for this stage
    // Just respond with PONG in the correct RESP format
    connection.write("+PONG\r\n");
  });
});

server.listen(6379, "127.0.0.1");
