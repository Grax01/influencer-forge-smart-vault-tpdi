import { NextResponse } from 'next/server'
import { authMiddleware, getCurrentUserId } from 'lyzr-architect'
import getCollaborationModel from '@/models/collaboration'

export const GET = authMiddleware(async (req: any) => {
  try {
    const Model = await getCollaborationModel()
    const url = new URL(req.url)
    const status = url.searchParams.get('status')
    const query: any = {}
    if (status && status !== 'all') query.status = status
    const data = await Model.find(query).sort({ proposed_at: -1 }).lean()
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
})

export const POST = authMiddleware(async (req: any) => {
  try {
    const Model = await getCollaborationModel()
    const body = await req.json()
    const doc = await Model.create({ ...body, owner_user_id: getCurrentUserId() })
    return NextResponse.json({ success: true, data: doc })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
})

export const PUT = authMiddleware(async (req: any) => {
  try {
    const Model = await getCollaborationModel()
    const body = await req.json()
    const { _id, ...update } = body
    const doc = await Model.findByIdAndUpdate(_id, update, { new: true }).lean()
    return NextResponse.json({ success: true, data: doc })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
})
