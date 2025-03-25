const net = require("net");

console.log("Logs from your program will appear here!");

// Pre-define common responses
const PONG_RESPONSE = "+PONG\r\n";
const OK_RESPONSE = "+OK\r\n";
const NULL_RESPONSE = "$-1\r\n";
const CRLF = "\r\n";

// In-memory storage for key-value pairs and their expiry times
const storage = new Map();
const expiryTimes = new Map();

// Helper to check if a key is expired
const isExpired = (key) => {
  const expiryTime = expiryTimes.get(key);
  if (!expiryTime) return false;
  
  if (Date.now() >= expiryTime) {
    // Clean up expired key
    storage.delete(key);
    expiryTimes.delete(key);
    return true;
  }
  return false;
};

// Command handlers map for faster lookup
const handlers = {
  PING: () => PONG_RESPONSE,
  
  ECHO: (args) => {
    const value = args[0];
    return `$${value.length}${CRLF}${value}${CRLF}`;
  },
  
  SET: (args) => {
    const [key, value, ...options] = args;
    
    // Check for PX argument
    const pxIndex = options.findIndex(p => p.toLowerCase() === 'px');
    if (pxIndex !== -1 && options.length > pxIndex + 1) {
      const expiryMs = parseInt(options[pxIndex + 1]);
      if (!isNaN(expiryMs)) {
        expiryTimes.set(key, Date.now() + expiryMs);
      }
    }
    
    storage.set(key, value);
    return OK_RESPONSE;
  },
  
  GET: (args) => {
    const key = args[0];
    
    // Check for expiry
    if (isExpired(key)) {
      return NULL_RESPONSE;
    }
    
    const value = storage.get(key);
    if (value === undefined) return NULL_RESPONSE;
    return `$${value.length}${CRLF}${value}${CRLF}`;
  }
};

const server = net.createServer((connection) => {
  let buffer = '';
  
  connection.on('data', (data) => {
    buffer += data;
    
    // Process complete commands
    while (buffer.includes(CRLF)) {
      const parts = buffer.split(CRLF);
      
      if (parts[0].startsWith('*')) {
        const argCount = parseInt(parts[0].slice(1));
        const args = [];
        let validCommand = true;
        let currentIndex = 1;
        
        // Parse arguments
        for (let i = 0; i < argCount && validCommand; i++) {
          if (currentIndex + 1 >= parts.length) {
            validCommand = false;
            break;
          }
          
          if (parts[currentIndex].startsWith('$')) {
            args.push(parts[currentIndex + 1]);
            currentIndex += 2;
          } else {
            validCommand = false;
            break;
          }
        }
        
        if (validCommand) {
          const command = args[0].toUpperCase();
          const handler = handlers[command];
          
          if (handler) {
            connection.write(handler(args.slice(1)));
          }
          
          // Remove processed command from buffer
          buffer = parts.slice(currentIndex).join(CRLF);
        }
      } else {
        // Invalid command format
        buffer = parts.slice(1).join(CRLF);
      }
    }
  });
});

server.listen(6379, "127.0.0.1");
