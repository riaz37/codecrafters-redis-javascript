const net = require("net");

console.log("Logs from your program will appear here!");

// Pre-define common responses
const PONG_RESPONSE = "+PONG\r\n";
const OK_RESPONSE = "+OK\r\n";
const NULL_RESPONSE = "$-1\r\n";
const CRLF = "\r\n";

// In-memory storage for key-value pairs
const storage = new Map();

// Command handlers map for faster lookup
const handlers = {
  PING: () => PONG_RESPONSE,
  
  ECHO: (parts) => {
    const arg = parts[4];
    return `$${arg.length}${CRLF}${arg}${CRLF}`;
  },
  
  SET: (parts) => {
    storage.set(parts[4], parts[6]);
    return OK_RESPONSE;
  },
  
  GET: (parts) => {
    const value = storage.get(parts[4]);
    if (value === undefined) return NULL_RESPONSE;
    return `$${value.length}${CRLF}${value}${CRLF}`;
  }
};

const server = net.createServer((connection) => {
  // Use a buffer to handle partial data
  let buffer = '';
  
  connection.on('data', (data) => {
    buffer += data;
    
    // Process complete commands
    if (buffer.includes(CRLF)) {
      const parts = buffer.split(CRLF);
      buffer = ''; // Reset buffer
      
      if (parts[0].startsWith('*')) {
        const command = parts[2].toUpperCase();
        const handler = handlers[command];
        
        if (handler) {
          connection.write(handler(parts));
        }
      }
    }
  });
});

server.listen(6379, "127.0.0.1");
