import { NextResponse } from 'next/server'
import { initDB } from 'lyzr-architect'
import mongoose from 'mongoose'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await initDB()
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connection.asPromise()
    }
    const db = mongoose.connection.db
    if (!db) {
      return NextResponse.json({ error: 'db is null' }, { status: 500 })
    }

    const v2Docs = await db.collection('influencer_profiles_v2').find({}).toArray()
    const v1Docs = await db.collection('influencer_profiles').find({}).toArray()

    // Also check what mongoose model thinks
    const allCollections = await db.listCollections().toArray()
    const influencerCols = allCollections
      .filter(c => c.name.toLowerCase().includes('influencer'))
      .map(c => c.name)

    return NextResponse.json({
      success: true,
      influencer_profiles_v2_count: v2Docs.length,
      influencer_profiles_v2_handles: v2Docs.map(d => d.instagram_handle),
      influencer_profiles_count: v1Docs.length,
      all_influencer_collections: influencerCols,
      mongoose_models: Object.keys(mongoose.models),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
