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

export default async function getCollaborationModel() {
  await ensureConnection()
  if (!_model) {
    _model = createModel('Collaboration', {
      conversation_id: { type: String, default: '' },
      influencer_id: { type: String, required: true },
      brand_id: { type: String, required: true },
      brand_name: { type: String, default: '' },
      campaign_name: { type: String, default: '' },
      deliverables_agreed: { type: String, default: '' },
      fee_agreed: { type: Number, default: 0 },
      deadline: { type: Date, default: null },
      status: { type: String, default: 'proposed', enum: ['proposed', 'counter_offered', 'accepted', 'active', 'content_submitted', 'completed', 'declined'] },
      instagram_post_url: { type: String, default: '' },
      actual_reach: { type: Number, default: 0 },
      actual_engagement_rate: { type: Number, default: 0 },
      proposed_by: { type: String, default: '' },
      proposed_at: { type: Date, default: Date.now },
      accepted_at: { type: Date, default: null },
      completed_at: { type: Date, default: null },
    })
  }
  return _model
}
