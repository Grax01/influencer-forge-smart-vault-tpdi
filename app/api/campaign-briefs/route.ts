import { NextResponse } from 'next/server'
import { authMiddleware, getCurrentUserId } from 'lyzr-architect'
import getCampaignBriefModel from '@/models/campaignBrief'

export const GET = authMiddleware(async (req: any) => {
  try {
    const Model = await getCampaignBriefModel()
    const data = await Model.find({}).sort({ createdAt: -1 }).lean()
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
})

export const POST = authMiddleware(async (req: any) => {
  try {
    const Model = await getCampaignBriefModel()
    const body = await req.json()
    const doc = await Model.create({ ...body, owner_user_id: getCurrentUserId() })
    return NextResponse.json({ success: true, data: doc })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
})

export const DELETE = authMiddleware(async (req: any) => {
  try {
    const Model = await getCampaignBriefModel()
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 })
    await Model.findByIdAndDelete(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
})
