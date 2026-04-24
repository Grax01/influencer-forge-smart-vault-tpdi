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

export default async function getCampaignBriefModel() {
  await ensureConnection()
  if (!_model) {
    _model = createModel('CampaignBrief', {
      brand_user_id: { type: String, required: true },
      campaign_name: { type: String, required: true },
      target_niches: { type: [String], default: [] },
      target_demographics: { type: String, default: '' },
      budget_range_min: { type: Number, default: 0 },
      budget_range_max: { type: Number, default: 0 },
      deliverable_requirements: { type: String, default: '' },
    }, { collection: 'campaign_briefs' })
  }
  return _model
}
