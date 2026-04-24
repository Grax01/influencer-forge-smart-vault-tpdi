import { initDB, createModel } from 'lyzr-architect'
import mongoose from 'mongoose'

let _model: any = null
let _initDone = false

const COLLECTION_NAME = 'influencer_profiles_v2'

async function ensureInit() {
  if (!_initDone) {
    // Always call initDB first - this registers the RLS plugin globally
    await initDB()
    _initDone = true
  }

  // Verify connection is ready
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

export default async function getInfluencerProfileModel() {
  await ensureInit()

  if (!_model) {
    // Clear any stale cached model from hot reloads
    if (mongoose.models['InfluencerProfileV2']) {
      delete mongoose.models['InfluencerProfileV2']
      delete (mongoose as any).modelSchemas?.['InfluencerProfileV2']
    }

    _model = createModel('InfluencerProfileV2', {
      user_id: { type: String, required: true },
      instagram_handle: { type: String, default: '' },
      follower_count: { type: Number, default: 0 },
      bio: { type: String, default: '' },
      media_count: { type: Number, default: 0 },
      avg_engagement_rate: { type: Number, default: 0 },
      content_style: { type: String, default: '' },
      niche_tags: { type: [String], default: [] },
      top_content: { type: Array, default: [] },
      audience_demographics: { type: Object, default: {} },
      account_reach_28d: { type: Number, default: 0 },
      profile_views: { type: Number, default: 0 },
      analysis_summary: { type: String, default: '' },
      last_analyzed_at: { type: Date, default: null },
    }, { collection: COLLECTION_NAME })
  }
  return _model
}

// Export for direct raw collection access (bypasses RLS completely)
export async function getRawCollection() {
  await ensureInit()
  const db = mongoose.connection.db!
  return db.collection(COLLECTION_NAME)
}
