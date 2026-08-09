import mongoose from 'mongoose';

function connectDatabase(url) {
  mongoose.connection.on('connected', () => {
    console.log('Mongoose connection established.');
  });

  mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('Mongoose connection disconnected.');
  });

  return mongoose.connect(url, {
    serverSelectionTimeoutMS: 10000,
  });
}

export default connectDatabase;

