import { NextResponse } from 'next/server'
import { authMiddleware, getCurrentUserId } from 'lyzr-architect'
import getConversationModel from '@/models/conversation'

export const GET = authMiddleware(async (req: any) => {
  try {
    const Model = await getConversationModel()
    const data = await Model.find({}).sort({ last_message_at: -1 }).lean()
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
})

export const POST = authMiddleware(async (req: any) => {
  try {
    const Model = await getConversationModel()
    const body = await req.json()
    const doc = await Model.create({ ...body, owner_user_id: getCurrentUserId() })
    return NextResponse.json({ success: true, data: doc })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
})

export const PUT = authMiddleware(async (req: any) => {
  try {
    const Model = await getConversationModel()
    const body = await req.json()
    const { _id, ...update } = body
    const doc = await Model.findByIdAndUpdate(_id, update, { new: true }).lean()
    return NextResponse.json({ success: true, data: doc })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
})
