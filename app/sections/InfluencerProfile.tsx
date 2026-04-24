'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { callAIAgent } from '@/lib/aiAgent'
import { FiArrowLeft, FiMessageSquare, FiMail, FiUsers, FiTrendingUp, FiHeart, FiMessageCircle, FiBookmark, FiEye, FiCopy } from 'react-icons/fi'

const OUTREACH_AGENT_ID = '69eb981794ae1d830940faca'

interface InfluencerProfileProps {
  influencer: any
  onBack: () => void
  onMessage: (influencer: any) => void
  collaborations: any[]
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-1.5">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm mt-2 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-base mt-2 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm">{line.slice(2)}</li>
        if (!line.trim()) return <div key={i} className="h-0.5" />
        return <p key={i} className="text-sm">{line}</p>
      })}
    </div>
  )
}

export default function InfluencerProfile({ influencer, onBack, onMessage, collaborations }: InfluencerProfileProps) {
  const [drafting, setDrafting] = useState(false)
  const [outreach, setOutreach] = useState<any>(null)
  const [context, setContext] = useState('')
  const [error, setError] = useState('')

  const handleDraftOutreach = async () => {
    setDrafting(true)
    setError('')
    try {
      const message = `Draft a collaboration outreach proposal for influencer @${influencer?.instagram_handle || influencer?.influencer_name || 'unknown'}. ${context ? `Additional context: ${context}` : ''} Influencer details: Name: ${influencer?.influencer_name || ''}, Handle: @${influencer?.instagram_handle || ''}, Niche: ${Array.isArray(influencer?.niche_tags) ? influencer.niche_tags.join(', ') : influencer?.strengths || ''}, Match Score: ${influencer?.overall_match_score || ''}%, Predicted Reach: ${influencer?.predicted_reach || ''}, Suggested Fee: $${influencer?.suggested_fee_min || 0}-$${influencer?.suggested_fee_max || 0}.`
      const result = await callAIAgent(message, OUTREACH_AGENT_ID)
      if (result.success) {
        setOutreach(result?.response?.result)
      } else {
        setError(result?.error || 'Failed to generate outreach')
      }
    } catch (e: any) {
      setError(e?.message || 'Network error')
    }
    setDrafting(false)
  }

  const copyToClipboard = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {})
    }
  }

  const safeCollabs = Array.isArray(collaborations) ? collaborations.filter((c: any) => c?.influencer_id === influencer?.influencer_id) : []

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6 max-w-5xl">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <FiArrowLeft size={16} /> Back
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Profile Info */}
          <div className="space-y-4">
            <Card className="bg-white/75 backdrop-blur-lg border border-white/18 shadow-md" style={{ borderRadius: '0.875rem' }}>
              <CardContent className="p-5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <FiUsers size={24} className="text-primary" />
                  </div>
                  <div>
                    <h2 className="font-serif text-xl font-semibold">{influencer?.influencer_name || 'Influencer'}</h2>
                    <p className="text-sm text-muted-foreground">@{influencer?.instagram_handle || 'handle'}</p>
                  </div>
                </div>
                {influencer?.bio && <p className="text-sm mb-3">{influencer.bio}</p>}
                {influencer?.content_style && <p className="text-xs text-muted-foreground mb-2">Style: {influencer.content_style}</p>}
                {(Array.isArray(influencer?.niche_tags) && influencer.niche_tags.length > 0) && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {influencer.niche_tags.map((t: string, i: number) => <Badge key={i} variant="secondary" className="text-xs">{t}</Badge>)}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="p-2 rounded-lg bg-secondary/30 text-center">
                    <FiUsers size={14} className="mx-auto mb-1 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Followers</p>
                    <p className="text-sm font-semibold">{(influencer?.follower_count || 0).toLocaleString()}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-secondary/30 text-center">
                    <FiTrendingUp size={14} className="mx-auto mb-1 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Engagement</p>
                    <p className="text-sm font-semibold">{influencer?.avg_engagement_rate || influencer?.predicted_engagement_rate || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {influencer?.audience_demographics && (
              <Card className="bg-white/75 backdrop-blur-lg border border-white/18 shadow-md" style={{ borderRadius: '0.875rem' }}>
                <CardHeader className="pb-2"><CardTitle className="font-serif text-base">Audience Demographics</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {influencer.audience_demographics?.age_ranges && <div><span className="text-muted-foreground">Ages:</span> {influencer.audience_demographics.age_ranges}</div>}
                  {influencer.audience_demographics?.gender_split && <div><span className="text-muted-foreground">Gender:</span> {influencer.audience_demographics.gender_split}</div>}
                  {influencer.audience_demographics?.top_cities && <div><span className="text-muted-foreground">Cities:</span> {influencer.audience_demographics.top_cities}</div>}
                  {influencer.audience_demographics?.top_countries && <div><span className="text-muted-foreground">Countries:</span> {influencer.audience_demographics.top_countries}</div>}
                </CardContent>
              </Card>
            )}

            <div className="flex gap-2">
              <Button onClick={() => onMessage(influencer)} className="flex-1 gap-2"><FiMessageSquare size={16} /> Message</Button>
              <Button variant="outline" onClick={handleDraftOutreach} disabled={drafting} className="flex-1 gap-2">
                <FiMail size={16} /> {drafting ? 'Drafting...' : 'Draft Outreach'}
              </Button>
            </div>
          </div>

          {/* Right: Content & History */}
          <div className="space-y-4">
            {Array.isArray(influencer?.top_content) && influencer.top_content.length > 0 && (
              <Card className="bg-white/75 backdrop-blur-lg border border-white/18 shadow-md" style={{ borderRadius: '0.875rem' }}>
                <CardHeader className="pb-2"><CardTitle className="font-serif text-base">Top Content</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {influencer.top_content.slice(0, 5).map((item: any, i: number) => (
                    <div key={i} className="p-3 rounded-lg bg-secondary/30">
                      <div className="flex justify-between mb-1">
                        <Badge variant="outline" className="text-xs">{item?.media_type || 'Post'}</Badge>
                        {item?.reel_plays ? <span className="text-xs text-muted-foreground">{(item.reel_plays).toLocaleString()} plays</span> : null}
                      </div>
                      <p className="text-xs line-clamp-2 mb-2">{item?.caption_summary || ''}</p>
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><FiHeart size={10} /> {(item?.likes || 0).toLocaleString()}</span>
                        <span className="flex items-center gap-1"><FiMessageCircle size={10} /> {(item?.comments || 0).toLocaleString()}</span>
                        <span className="flex items-center gap-1"><FiBookmark size={10} /> {(item?.saves || 0).toLocaleString()}</span>
                        <span className="flex items-center gap-1"><FiEye size={10} /> {(item?.reach || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {safeCollabs.length > 0 && (
              <Card className="bg-white/75 backdrop-blur-lg border border-white/18 shadow-md" style={{ borderRadius: '0.875rem' }}>
                <CardHeader className="pb-2"><CardTitle className="font-serif text-base">Collaboration History</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {safeCollabs.map((c: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-2 rounded-lg bg-secondary/30">
                      <div>
                        <p className="text-sm font-medium">{c?.campaign_name || 'Campaign'}</p>
                        <p className="text-xs text-muted-foreground">Fee: ${c?.fee_agreed || 0}</p>
                      </div>
                      <Badge variant="outline" className="text-xs capitalize">{c?.status || 'unknown'}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Outreach context */}
        {!outreach && (
          <Card className="bg-white/75 backdrop-blur-lg border border-white/18 shadow-md" style={{ borderRadius: '0.875rem' }}>
            <CardHeader className="pb-2"><CardTitle className="font-serif text-base">Outreach Context (Optional)</CardTitle></CardHeader>
            <CardContent>
              <Textarea placeholder="Add any extra context for the outreach proposal (campaign goals, specific ideas, etc.)" value={context} onChange={(e) => setContext(e.target.value)} rows={3} />
            </CardContent>
          </Card>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {/* Outreach Result */}
        {outreach && (
          <Card className="bg-white/75 backdrop-blur-lg border border-white/18 shadow-lg" style={{ borderRadius: '0.875rem' }}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="font-serif text-lg">Outreach Proposal</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(outreach?.full_proposal || '')} className="gap-1"><FiCopy size={14} /> Copy</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {outreach?.subject_line && <div><p className="text-xs text-muted-foreground font-medium">Subject Line</p><p className="text-sm font-semibold">{outreach.subject_line}</p></div>}
              {outreach?.greeting && <p className="text-sm">{outreach.greeting}</p>}
              {outreach?.opening_hook && <div><p className="text-xs text-muted-foreground font-medium">Opening</p><p className="text-sm">{outreach.opening_hook}</p></div>}
              {outreach?.value_proposition && <div><p className="text-xs text-muted-foreground font-medium">Value Proposition</p><p className="text-sm">{outreach.value_proposition}</p></div>}
              {outreach?.collaboration_details && <div><p className="text-xs text-muted-foreground font-medium">Collaboration Details</p><p className="text-sm">{outreach.collaboration_details}</p></div>}
              {outreach?.mutual_benefits && <div><p className="text-xs text-muted-foreground font-medium">Mutual Benefits</p><p className="text-sm">{outreach.mutual_benefits}</p></div>}
              {outreach?.call_to_action && <div><p className="text-xs text-muted-foreground font-medium">Call to Action</p><p className="text-sm">{outreach.call_to_action}</p></div>}
              {outreach?.closing && <p className="text-sm italic">{outreach.closing}</p>}
              {outreach?.personalization_notes && <div className="pt-3 border-t border-border"><p className="text-xs text-muted-foreground font-medium">Personalization Notes</p><p className="text-xs text-muted-foreground">{outreach.personalization_notes}</p></div>}
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  )
}
