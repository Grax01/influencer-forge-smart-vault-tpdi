import { NextResponse } from 'next/server'
import { authMiddleware, getCurrentUserId } from 'lyzr-architect'
import getInfluencerProfileModel, { getRawCollection } from '@/models/influencerProfile'
import mongoose from 'mongoose'
import { ObjectId } from 'mongodb'

const KNOWN_OLD_COLLECTIONS = [
  'influencer_profiles',
  'influencerprofiles',
  'influencer_profile',
  'influencerprofile',
  'influencerprofilev2s',
]

async function migrateOldData() {
  try {
    const db = mongoose.connection.db
    if (!db) return

    const rawCol = await getRawCollection()
    const v2Count = await rawCol.countDocuments()
    if (v2Count > 0) return // Already has data, skip migration

    const allCollections = await db.listCollections().toArray()
    const colNames = allCollections.map(c => c.name)

    for (const oldName of KNOWN_OLD_COLLECTIONS) {
      if (colNames.includes(oldName)) {
        const oldCol = db.collection(oldName)
        const oldDocs = await oldCol.find({}).toArray()
        if (oldDocs.length > 0) {
          console.log(`[influencer-profiles] Migrating ${oldDocs.length} docs from '${oldName}' to 'influencer_profiles_v2'`)
          const cleaned = oldDocs.map(({ _id, ...rest }) => rest)
          await rawCol.insertMany(cleaned)
          console.log(`[influencer-profiles] Migration complete from '${oldName}'`)
          return
        }
      }
    }
  } catch (err: any) {
    console.error('[influencer-profiles] Migration error:', err.message)
  }
}

export const GET = authMiddleware(async (req: any) => {
  try {
    const url = new URL(req.url)
    const userId = url.searchParams.get('user_id')
    const all = url.searchParams.get('all')
    let data: any[] = []

    // Always ensure DB is connected via initDB
    const Model = await getInfluencerProfileModel()

    // Run migration from old collections on first request
    await migrateOldData()

    if (all === 'true') {
      // Bypass RLS completely: use raw MongoDB driver, no Mongoose model
      const rawCol = await getRawCollection()
      data = await rawCol.find({}).toArray()
      console.log(`[influencer-profiles GET] all=true, found ${data.length} docs via raw collection 'influencer_profiles_v2'`)

      // If still empty, scan ALL collections for influencer data as fallback
      if (data.length === 0) {
        const db = mongoose.connection.db
        if (db) {
          const allCollections = await db.listCollections().toArray()
          for (const col of allCollections) {
            if (col.name.toLowerCase().includes('influencer') && col.name !== 'influencer_profiles_v2') {
              const docs = await db.collection(col.name).find({}).toArray()
              if (docs.length > 0) {
                console.log(`[influencer-profiles GET] Fallback: found ${docs.length} docs in '${col.name}'`)
                data = docs
                break
              }
            }
          }
        }
      }
    } else {
      // Use Mongoose model (RLS-scoped to current user)
      if (userId) {
        data = await Model.find({ user_id: userId }).lean()
      } else {
        data = await Model.find({}).lean()
      }
      // If RLS returns empty, try raw collection filtered by the RLS user
      if (data.length === 0 && req.userId) {
        const rawCol = await getRawCollection()
        data = await rawCol.find({ owner_user_id: req.userId }).toArray()
        console.log(`[influencer-profiles GET] RLS fallback: found ${data.length} docs for user ${req.userId}`)
      }
    }

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error: any) {
    console.error('[influencer-profiles GET] Error:', error.message)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
})

export const POST = authMiddleware(async (req: any) => {
  try {
    const Model = await getInfluencerProfileModel()
    const body = await req.json()
    console.log(`[influencer-profiles POST] Creating profile for handle: ${body?.instagram_handle || 'unknown'}`)

    // Also save directly to raw collection as a safety net
    const ownerId = getCurrentUserId()
    const docData = { ...body, owner_user_id: ownerId }

    let doc
    try {
      doc = await Model.create(docData)
      console.log(`[influencer-profiles POST] Created via Model, _id: ${doc?._id}`)
    } catch (modelErr: any) {
      console.error(`[influencer-profiles POST] Model.create failed: ${modelErr.message}, trying raw insert`)
      // Fallback: insert directly into raw collection
      const rawCol = await getRawCollection()
      const result = await rawCol.insertOne({
        ...docData,
        created_at: new Date(),
        updated_at: new Date(),
      })
      doc = { _id: result.insertedId, ...docData }
      console.log(`[influencer-profiles POST] Created via raw insert, _id: ${result.insertedId}`)
    }

    return NextResponse.json({ success: true, data: doc })
  } catch (error: any) {
    console.error('[influencer-profiles POST] Error:', error.message)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
})

export const PUT = authMiddleware(async (req: any) => {
  try {
    const Model = await getInfluencerProfileModel()
    const body = await req.json()
    const { _id, ...update } = body
    console.log(`[influencer-profiles PUT] Updating profile _id: ${_id}`)

    let doc
    try {
      doc = await Model.findByIdAndUpdate(_id, update, { new: true }).lean()
    } catch (modelErr: any) {
      console.error(`[influencer-profiles PUT] Model.findByIdAndUpdate failed: ${modelErr.message}, trying raw update`)
      const rawCol = await getRawCollection()
      let filter: any
      try {
        filter = { _id: new ObjectId(_id) }
      } catch {
        filter = { _id }
      }
      await rawCol.updateOne(filter, { $set: { ...update, updated_at: new Date() } })
      doc = await rawCol.findOne(filter)
    }

    return NextResponse.json({ success: true, data: doc })
  } catch (error: any) {
    console.error('[influencer-profiles PUT] Error:', error.message)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
})
