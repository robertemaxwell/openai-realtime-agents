import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer } from 'ws';
import { SimpleTwilioAudioStreamHandler } from './src/app/lib/simpleTwilioAudioStream';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Handle WebSocket upgrade with detailed logging
  server.on('upgrade', (request, socket, head) => {
    console.log('=== WebSocket Upgrade Request ===');
    console.log('URL:', request.url);
    console.log('Method:', request.method);
    console.log('Headers:', JSON.stringify(request.headers, null, 2));
    console.log('Remote Address:', (socket as any).remoteAddress);
    
    if (request.url === '/api/twilio/audio-stream') {
      console.log('✅ Accepting WebSocket upgrade for Twilio stream');
      
      const wss = new WebSocketServer({ noServer: true });
      
      wss.handleUpgrade(request, socket, head, (ws) => {
        console.log('🎉 New Twilio WebSocket connection established successfully!');
        
        // Send a test message immediately
        ws.send(JSON.stringify({ 
          event: 'connected',
          message: 'WebSocket connection established'
        }));
        
        try {
          const handler = new SimpleTwilioAudioStreamHandler(ws);
          console.log('SimpleTwilioAudioStreamHandler created successfully');
        } catch (error) {
          console.error('Error creating SimpleTwilioAudioStreamHandler:', error);
          ws.close(1011, 'Internal server error');
        }
        
        ws.on('error', (error) => {
          console.error('WebSocket error:', error);
        });
        
        ws.on('close', (code, reason) => {
          console.log(`Twilio WebSocket connection closed: ${code} - ${reason}`);
        });
      });
    } else {
      console.log('❌ Rejecting WebSocket upgrade for unknown path:', request.url);
      socket.destroy();
    }
  });

  server.listen(port, (err?: Error) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> WebSocket server ready for Twilio audio streaming`);
  });
}); 