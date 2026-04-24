'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { callAIAgent } from '@/lib/aiAgent'
import { FiSend, FiSearch, FiPlay, FiDollarSign, FiCopy, FiCheck, FiX, FiEdit } from 'react-icons/fi'

const SCRIPT_AGENT_ID = '69eb9817f002b0832a126c89'

interface MessagesProps {
  conversations: any[]
  userId: string
  userRole: 'brand' | 'influencer'
  onRefresh: () => void
}

export default function Messages({ conversations, userId, userRole, onRefresh }: MessagesProps) {
  const [activeConvo, setActiveConvo] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [search, setSearch] = useState('')
  const [showDealForm, setShowDealForm] = useState(false)
  const [showScriptForm, setShowScriptForm] = useState(false)
  const [generatingScript, setGeneratingScript] = useState(false)
  const [dealForm, setDealForm] = useState({ campaign_name: '', deliverables: '', fee: '', deadline: '' })
  const [scriptPrompt, setScriptPrompt] = useState('')
  const [sessionId, setSessionId] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const safeConvos = Array.isArray(conversations) ? conversations : []
  const filteredConvos = search ? safeConvos.filter((c: any) => JSON.stringify(c).toLowerCase().includes(search.toLowerCase())) : safeConvos

  useEffect(() => {
    if (activeConvo?._id) loadMessages(activeConvo._id)
  }, [activeConvo?._id])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  const loadMessages = async (convoId: string) => {
    setLoadingMsgs(true)
    try {
      const res = await fetch(`/api/messages?conversation_id=${convoId}`)
      const data = await res.json()
      if (data.success) setMessages(Array.isArray(data.data) ? data.data : [])
    } catch {}
    setLoadingMsgs(false)
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConvo?._id) return
    setSending(true)
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: activeConvo._id, sender_id: userId, message_type: 'text', content: newMessage }),
      })
      await fetch('/api/conversations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: activeConvo._id, last_message_at: new Date().toISOString() }),
      })
      setNewMessage('')
      await loadMessages(activeConvo._id)
    } catch {}
    setSending(false)
  }

  const handleProposeDeal = async () => {
    if (!activeConvo?._id) return
    setSending(true)
    try {
      // Create collaboration
      const collabRes = await fetch('/api/collaborations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: activeConvo._id,
          influencer_id: userRole === 'brand' ? activeConvo.influencer_user_id : userId,
          brand_id: userRole === 'brand' ? userId : activeConvo.brand_user_id,
          brand_name: '',
          campaign_name: dealForm.campaign_name,
          deliverables_agreed: dealForm.deliverables,
          fee_agreed: Number(dealForm.fee) || 0,
          deadline: dealForm.deadline || null,
          status: 'proposed',
          proposed_by: userId,
        }),
      })
      const collabData = await collabRes.json()
      // Send deal card message
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: activeConvo._id,
          sender_id: userId,
          message_type: 'deal_card',
          content: JSON.stringify({ campaign_name: dealForm.campaign_name, deliverables: dealForm.deliverables, fee: dealForm.fee, deadline: dealForm.deadline, status: 'proposed' }),
          deal_id: collabData?.data?._id || '',
        }),
      })
      setDealForm({ campaign_name: '', deliverables: '', fee: '', deadline: '' })
      setShowDealForm(false)
      await loadMessages(activeConvo._id)
      onRefresh()
    } catch {}
    setSending(false)
  }

  const handleGenerateScript = async () => {
    if (!scriptPrompt.trim()) return
    setGeneratingScript(true)
    try {
      const sid = sessionId || `session_${Date.now()}`
      if (!sessionId) setSessionId(sid)
      const result = await callAIAgent(scriptPrompt, SCRIPT_AGENT_ID, { session_id: sid })
      if (result.success) {
        const scriptData = result?.response?.result
        // Post as script card
        if (activeConvo?._id) {
          await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              conversation_id: activeConvo._id,
              sender_id: userId,
              message_type: 'script_card',
              content: scriptData?.caption || 'Script generated',
              script_content: scriptData,
            }),
          })
          await loadMessages(activeConvo._id)
        }
      }
      setScriptPrompt('')
      setShowScriptForm(false)
    } catch {}
    setGeneratingScript(false)
  }

  const copyText = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {})
  }

  const handleDealAction = async (msg: any, action: 'accepted' | 'declined') => {
    if (!msg?.deal_id) return
    try {
      await fetch('/api/collaborations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: msg.deal_id, status: action, ...(action === 'accepted' ? { accepted_at: new Date().toISOString() } : {}) }),
      })
      onRefresh()
      if (activeConvo?._id) await loadMessages(activeConvo._id)
    } catch {}
  }

  const renderScriptCard = (script: any) => {
    if (!script) return null
    return (
      <div className="space-y-2 max-w-sm">
        {script?.hook && (
          <div className="p-2.5 rounded-lg bg-white/50 backdrop-blur border border-white/20">
            <div className="flex justify-between items-center mb-1"><span className="text-xs font-medium text-muted-foreground">Hook</span><button onClick={() => copyText(script.hook)} className="p-0.5"><FiCopy size={10} /></button></div>
            <p className="text-xs">{script.hook}</p>
          </div>
        )}
        {script?.script && (
          <div className="p-2.5 rounded-lg bg-white/50 backdrop-blur border border-white/20">
            <div className="flex justify-between items-center mb-1"><span className="text-xs font-medium text-muted-foreground">Script</span><button onClick={() => copyText(script.script)} className="p-0.5"><FiCopy size={10} /></button></div>
            <p className="text-xs whitespace-pre-wrap">{script.script}</p>
          </div>
        )}
        {script?.cta && (
          <div className="p-2.5 rounded-lg bg-white/50 backdrop-blur border border-white/20">
            <div className="flex justify-between items-center mb-1"><span className="text-xs font-medium text-muted-foreground">CTA</span><button onClick={() => copyText(script.cta)} className="p-0.5"><FiCopy size={10} /></button></div>
            <p className="text-xs">{script.cta}</p>
          </div>
        )}
        {(script?.caption || (Array.isArray(script?.hashtags) && script.hashtags.length > 0)) && (
          <div className="p-2.5 rounded-lg bg-white/50 backdrop-blur border border-white/20">
            <span className="text-xs font-medium text-muted-foreground">Caption & Hashtags</span>
            {script.caption && <p className="text-xs mt-1">{script.caption}</p>}
            {Array.isArray(script.hashtags) && <p className="text-xs text-primary mt-1">{script.hashtags.map((h: string) => h.startsWith('#') ? h : `#${h}`).join(' ')}</p>}
          </div>
        )}
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {script?.platform && <Badge variant="outline" className="text-xs">{script.platform}</Badge>}
          {script?.tone && <span>Tone: {script.tone}</span>}
          {script?.estimated_duration && <span>Duration: {script.estimated_duration}</span>}
        </div>
        {script?.production_notes && <p className="text-xs text-muted-foreground italic">Notes: {script.production_notes}</p>}
      </div>
    )
  }

  const renderDealCard = (msg: any) => {
    let deal: any = {}
    try { deal = typeof msg?.content === 'string' ? JSON.parse(msg.content) : msg?.content || {} } catch { deal = {} }
    const isSender = msg?.sender_id === userId
    return (
      <div className="p-3 rounded-lg bg-white/60 backdrop-blur border border-white/20 max-w-sm space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <FiDollarSign size={14} className="text-primary" />
          <span className="text-xs font-semibold">Deal Proposal</span>
          <Badge className="text-xs bg-amber-100 text-amber-800 ml-auto">{deal?.status || 'proposed'}</Badge>
        </div>
        {deal?.campaign_name && <p className="text-xs"><span className="font-medium">Campaign:</span> {deal.campaign_name}</p>}
        {deal?.deliverables && <p className="text-xs"><span className="font-medium">Deliverables:</span> {deal.deliverables}</p>}
        {deal?.fee && <p className="text-xs"><span className="font-medium">Fee:</span> ${deal.fee}</p>}
        {deal?.deadline && <p className="text-xs"><span className="font-medium">Deadline:</span> {deal.deadline}</p>}
        {!isSender && deal?.status === 'proposed' && (
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={() => handleDealAction(msg, 'accepted')} className="text-xs gap-1 h-7"><FiCheck size={12} /> Accept</Button>
            <Button size="sm" variant="outline" onClick={() => handleDealAction(msg, 'declined')} className="text-xs gap-1 h-7"><FiX size={12} /> Decline</Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Left: Conversation List */}
      <div className="w-80 border-r border-border flex flex-col bg-white/50 backdrop-blur-lg">
        <div className="p-3 border-b border-border">
          <div className="relative">
            <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search conversations..." className="pl-8 h-8 text-xs" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {filteredConvos.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">No conversations yet.</p>
          ) : (
            filteredConvos.map((c: any, i: number) => (
              <button
                key={c?._id || i}
                onClick={() => setActiveConvo(c)}
                className={`w-full p-3 text-left border-b border-border/50 hover:bg-secondary/30 transition-colors ${activeConvo?._id === c?._id ? 'bg-secondary/50' : ''}`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium truncate">Conversation #{i + 1}</span>
                  {c?.has_active_deal && <Badge variant="default" className="text-xs h-5">Deal</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{c?.status || 'active'}</p>
              </button>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Right: Chat */}
      <div className="flex-1 flex flex-col">
        {!activeConvo ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Select a conversation to start messaging</p>
          </div>
        ) : (
          <>
            <div className="p-3 border-b border-border flex justify-between items-center bg-white/30 backdrop-blur">
              <div>
                <p className="text-sm font-medium">Conversation</p>
                <p className="text-xs text-muted-foreground">{activeConvo?.status || 'active'}</p>
              </div>
              <div className="flex gap-1.5">
                <Button size="sm" variant="outline" onClick={() => setShowScriptForm(true)} className="text-xs gap-1 h-7"><FiPlay size={12} /> Generate Script</Button>
                <Button size="sm" variant="outline" onClick={() => setShowDealForm(true)} className="text-xs gap-1 h-7"><FiDollarSign size={12} /> Propose Deal</Button>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMsgs && <p className="text-sm text-center text-muted-foreground">Loading messages...</p>}
              {(Array.isArray(messages) ? messages : []).map((msg: any, i: number) => {
                const isMine = msg?.sender_id === userId
                return (
                  <div key={i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-md ${isMine ? 'order-last' : ''}`}>
                      {msg?.message_type === 'script_card' ? renderScriptCard(msg?.script_content) : msg?.message_type === 'deal_card' ? renderDealCard(msg) : (
                        <div className={`px-3 py-2 rounded-xl text-sm ${isMine ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-secondary text-foreground rounded-bl-sm'}`}>
                          {msg?.content || ''}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5 px-1">{msg?.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="p-3 border-t border-border bg-white/30 backdrop-blur">
              <div className="flex gap-2">
                <Input placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()} className="flex-1" />
                <Button onClick={sendMessage} disabled={sending || !newMessage.trim()} size="sm"><FiSend size={16} /></Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Deal Form Dialog */}
      <Dialog open={showDealForm} onOpenChange={setShowDealForm}>
        <DialogContent className="bg-card">
          <DialogHeader><DialogTitle className="font-serif">Propose a Deal</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Campaign Name</Label><Input value={dealForm.campaign_name} onChange={(e) => setDealForm(prev => ({ ...prev, campaign_name: e.target.value }))} placeholder="Campaign name" /></div>
            <div><Label>Deliverables</Label><Textarea value={dealForm.deliverables} onChange={(e) => setDealForm(prev => ({ ...prev, deliverables: e.target.value }))} placeholder="2 Reels, 3 Stories..." rows={2} /></div>
            <div><Label>Fee ($)</Label><Input type="number" value={dealForm.fee} onChange={(e) => setDealForm(prev => ({ ...prev, fee: e.target.value }))} placeholder="2500" /></div>
            <div><Label>Deadline</Label><Input type="date" value={dealForm.deadline} onChange={(e) => setDealForm(prev => ({ ...prev, deadline: e.target.value }))} /></div>
            <Button onClick={handleProposeDeal} disabled={sending || !dealForm.campaign_name} className="w-full">{sending ? 'Sending...' : 'Send Proposal'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Script Form Dialog */}
      <Dialog open={showScriptForm} onOpenChange={setShowScriptForm}>
        <DialogContent className="bg-card">
          <DialogHeader><DialogTitle className="font-serif">Generate Content Script</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Describe the content you want</Label><Textarea value={scriptPrompt} onChange={(e) => setScriptPrompt(e.target.value)} placeholder="Create a 30-second Instagram Reel script about a new skincare product. Fun, upbeat tone targeting Gen Z..." rows={4} /></div>
            <Button onClick={handleGenerateScript} disabled={generatingScript || !scriptPrompt.trim()} className="w-full">{generatingScript ? 'Generating...' : 'Generate Script'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
