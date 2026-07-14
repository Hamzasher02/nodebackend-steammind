import mongoose from 'mongoose'

function connectDatabase(url) {
  return mongoose.connect(url)
}

export default connectDatabase
