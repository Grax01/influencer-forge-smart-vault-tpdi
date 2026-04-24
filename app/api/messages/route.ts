import { NextResponse } from 'next/server'
import { authMiddleware, getCurrentUserId } from 'lyzr-architect'
import getMessageModel from '@/models/message'

export const GET = authMiddleware(async (req: any) => {
  try {
    const Model = await getMessageModel()
    const url = new URL(req.url)
    const conversationId = url.searchParams.get('conversation_id')
    if (!conversationId) return NextResponse.json({ success: false, error: 'conversation_id required' }, { status: 400 })
    const data = await Model.find({ conversation_id: conversationId }).sort({ createdAt: 1 }).lean()
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
})

export const POST = authMiddleware(async (req: any) => {
  try {
    const Model = await getMessageModel()
    const body = await req.json()
    const doc = await Model.create({ ...body, owner_user_id: getCurrentUserId() })
    return NextResponse.json({ success: true, data: doc })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
})
