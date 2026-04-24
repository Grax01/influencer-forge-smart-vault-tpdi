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
      return NextResponse.json({
        error: 'DB is null after connection',
        readyState: mongoose.connection.readyState,
      }, { status: 500 })
    }

    const dbName = db.databaseName
    const allCollections = await db.listCollections().toArray()
    const collectionInfo: any[] = []

    for (const col of allCollections) {
      const count = await db.collection(col.name).countDocuments()
      let sampleDoc = null
      if (count > 0) {
        sampleDoc = await db.collection(col.name).findOne({})
        if (sampleDoc) {
          const keys = Object.keys(sampleDoc)
          sampleDoc = { _keys: keys, _id: sampleDoc._id }
        }
      }
      collectionInfo.push({
        name: col.name,
        documentCount: count,
        sampleKeys: sampleDoc,
      })
    }

    const influencerCollections = collectionInfo.filter(c =>
      c.name.toLowerCase().includes('influencer')
    )

    return NextResponse.json({
      success: true,
      database: dbName,
      connectionState: mongoose.connection.readyState,
      totalCollections: allCollections.length,
      influencerCollections,
      allCollections: collectionInfo,
      mongooseModels: Object.keys(mongoose.models),
    })
  } catch (error: any) {
    console.error('[debug-db] Error:', error.message)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
