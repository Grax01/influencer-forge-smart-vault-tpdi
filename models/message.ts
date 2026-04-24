import { initDB, createModel } from 'lyzr-architect'
import mongoose from 'mongoose'

let _model: any = null

async function ensureConnection() {
  if (mongoose.connection.readyState !== 1) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('DATABASE_URL env var is required')
    try {
      await mongoose.connect(url, {
        retryWrites: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      })
    } catch {
      await initDB()
    }
  }
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connection.asPromise()
  }
  if (!mongoose.connection.db) {
    await new Promise(resolve => setTimeout(resolve, 300))
    if (!mongoose.connection.db) {
      throw new Error('MongoDB connection established but db object is null')
    }
  }
}

export default async function getMessageModel() {
  await ensureConnection()
  if (!_model) {
    _model = createModel('Message', {
      conversation_id: { type: String, required: true },
      sender_id: { type: String, required: true },
      message_type: { type: String, default: 'text', enum: ['text', 'script_card', 'deal_card'] },
      content: { type: String, default: '' },
      script_content: { type: Object, default: null },
      deal_id: { type: String, default: '' },
    })
  }
  return _model
}
