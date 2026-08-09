import 'dotenv/config'
import http from 'http'
import app from './app.js'
import connectDatabase from './db/connetion.db.js'
import initSocket from './socket/index.js'
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

// Process-level unhandled exception and rejection handlers
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! Shutting down gracefully...', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION! Details:', reason);
});

async function start() {
    try {
        const db = await connectDatabase(process.env.MONGO_URI || 'mongodb://localhost:27017/steammind');
        console.log('Database connected successfully.');
        initSocket(server, app);
        console.log('Socket initialized.');
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}...`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
    console.log(`Received ${signal}. Closing server gracefully...`);
    server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
    });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

start();