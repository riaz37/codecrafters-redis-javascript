const net = require("net");

console.log("Logs from your program will appear here!");

const server = net.createServer((connection) => {
  // Handle incoming data
  connection.on('data', (data) => {
    const input = data.toString();
    const parts = input.split('\r\n');
    
    // Parse RESP array
    if (parts[0].startsWith('*')) {
      const command = parts[2].toUpperCase(); // Command is always the first argument
      
      if (command === 'PING') {
        connection.write("+PONG\r\n");
      } else if (command === 'ECHO') {
        const argument = parts[4]; // The argument follows after its length
        connection.write(`$${argument.length}\r\n${argument}\r\n`);
      }
    }
  });
});

server.listen(6379, "127.0.0.1");
