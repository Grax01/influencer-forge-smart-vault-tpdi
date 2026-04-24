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

export default async function getConversationModel() {
  await ensureConnection()
  if (!_model) {
    _model = createModel('Conversation', {
      brand_user_id: { type: String, required: true },
      influencer_user_id: { type: String, required: true },
      last_message_at: { type: Date, default: Date.now },
      has_active_deal: { type: Boolean, default: false },
      status: { type: String, default: 'active' },
    })
  }
  return _model
}
