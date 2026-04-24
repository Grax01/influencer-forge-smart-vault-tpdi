'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { callAIAgent } from '@/lib/aiAgent'
import { FiUsers, FiTrendingUp, FiTag, FiLayers, FiEye, FiHeart, FiMessageCircle, FiBookmark } from 'react-icons/fi'

const PROFILE_AGENT_ID = '69eb981614e70411b00f8059'

interface InfluencerDashboardProps {
  profile: any
  collaborations: any[]
  onProfileUpdate: (data: any) => void
  userId: string
}

export default function InfluencerDashboard({ profile, collaborations, onProfileUpdate, userId }: InfluencerDashboardProps) {
  const [analyzing, setAnalyzing] = useState(false)
  const [handle, setHandle] = useState(profile?.instagram_handle || '')
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [error, setError] = useState('')

  const activeCollabs = Array.isArray(collaborations) ? collaborations.filter((c: any) => c?.status === 'active' || c?.status === 'proposed') : []

  const handleAnalyze = async () => {
    if (!handle.trim()) { setError('Please enter your Instagram handle'); return }
    setAnalyzing(true)
    setError('')
    try {
      const result = await callAIAgent(`Analyze Instagram profile @${handle.replace('@', '')}`, PROFILE_AGENT_ID)
      if (result.success) {
        const data = result?.response?.result
        setAnalysisResult(data)
        // Update profile in DB
        const updateBody: any = {
          user_id: userId,
          instagram_handle: data?.instagram_handle || handle,
          follower_count: data?.follower_count || 0,
          bio: data?.bio || '',
          media_count: data?.media_count || 0,
          avg_engagement_rate: data?.avg_engagement_rate || 0,
          content_style: data?.content_style || '',
          niche_tags: Array.isArray(data?.niche_tags) ? data.niche_tags : [],
          top_content: Array.isArray(data?.top_content) ? data.top_content : [],
          audience_demographics: data?.audience_demographics || {},
          account_reach_28d: data?.account_reach_28d || 0,
          profile_views: data?.profile_views || 0,
          analysis_summary: data?.analysis_summary || '',
          last_analyzed_at: new Date().toISOString(),
        }
        if (profile?._id) {
          updateBody._id = profile._id
          const saveRes = await fetch('/api/influencer-profiles', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(updateBody)
          })
          const saveData = await saveRes.json()
          console.log(`[InfluencerDashboard] PUT response: status=${saveRes.status}`, saveData)
          if (!saveRes.ok || !saveData.success) {
            console.error('[InfluencerDashboard] Failed to update profile:', saveData?.error)
            setError(`Profile analyzed but failed to save: ${saveData?.error || 'Unknown error'}`)
          }
        } else {
          const saveRes = await fetch('/api/influencer-profiles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(updateBody)
          })
          const saveData = await saveRes.json()
          console.log(`[InfluencerDashboard] POST response: status=${saveRes.status}`, saveData)
          if (!saveRes.ok || !saveData.success) {
            console.error('[InfluencerDashboard] Failed to save profile:', saveData?.error)
            setError(`Profile analyzed but failed to save: ${saveData?.error || 'Unknown error'}`)
          }
        }
        onProfileUpdate(updateBody)
      } else {
        setError(result?.error || 'Analysis failed')
      }
    } catch (e: any) {
      setError(e?.message || 'Network error')
    }
    setAnalyzing(false)
  }

  const displayData = analysisResult || profile
  const stats = [
    { label: 'Followers', value: displayData?.follower_count || 0, icon: FiUsers, fmt: (v: number) => v >= 1000 ? `${(v/1000).toFixed(1)}K` : String(v) },
    { label: 'Avg Engagement', value: displayData?.avg_engagement_rate || 0, icon: FiTrendingUp, fmt: (v: number) => `${(v * (v < 1 ? 100 : 1)).toFixed(2)}%` },
    { label: 'Niche Tags', value: Array.isArray(displayData?.niche_tags) ? displayData.niche_tags.length : 0, icon: FiTag, fmt: (v: number) => String(v) },
    { label: 'Active Collabs', value: activeCollabs.length, icon: FiLayers, fmt: (v: number) => String(v) },
  ]

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6 max-w-5xl">
        <div>
          <h2 className="font-serif text-2xl font-semibold tracking-tight">Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">Your influencer analytics at a glance</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => {
            const Icon = s.icon
            return (
              <Card key={s.label} className="bg-white/75 backdrop-blur-lg border border-white/18 shadow-md" style={{ borderRadius: '0.875rem' }}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10"><Icon size={18} className="text-primary" /></div>
                    <div>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <p className="text-lg font-semibold">{s.fmt(s.value)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Analyze CTA */}
        <Card className="bg-white/75 backdrop-blur-lg border border-white/18 shadow-md" style={{ borderRadius: '0.875rem' }}>
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-lg">Analyze My Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <div className="flex-1">
                <Label htmlFor="ig-handle" className="text-xs">Instagram Handle</Label>
                <Input id="ig-handle" placeholder="@yourhandle" value={handle} onChange={(e) => setHandle(e.target.value)} />
              </div>
              <Button onClick={handleAnalyze} disabled={analyzing} className="self-end">
                {analyzing ? 'Analyzing...' : 'Analyze'}
              </Button>
            </div>
            {error && <p className="text-sm text-destructive mt-2">{error}</p>}
          </CardContent>
        </Card>

        {/* Bio & Demographics */}
        {displayData?.bio && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-white/75 backdrop-blur-lg border border-white/18 shadow-md" style={{ borderRadius: '0.875rem' }}>
              <CardHeader className="pb-2"><CardTitle className="font-serif text-base">Bio</CardTitle></CardHeader>
              <CardContent><p className="text-sm leading-relaxed">{displayData.bio}</p>
                {displayData?.content_style && <p className="text-xs text-muted-foreground mt-2">Style: {displayData.content_style}</p>}
                {Array.isArray(displayData?.niche_tags) && displayData.niche_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {displayData.niche_tags.map((tag: string, i: number) => <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>)}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="bg-white/75 backdrop-blur-lg border border-white/18 shadow-md" style={{ borderRadius: '0.875rem' }}>
              <CardHeader className="pb-2"><CardTitle className="font-serif text-base">Audience Demographics</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {displayData?.audience_demographics?.age_ranges && <div><span className="text-muted-foreground">Ages:</span> {displayData.audience_demographics.age_ranges}</div>}
                {displayData?.audience_demographics?.gender_split && <div><span className="text-muted-foreground">Gender:</span> {displayData.audience_demographics.gender_split}</div>}
                {displayData?.audience_demographics?.top_cities && <div><span className="text-muted-foreground">Cities:</span> {displayData.audience_demographics.top_cities}</div>}
                {displayData?.audience_demographics?.top_countries && <div><span className="text-muted-foreground">Countries:</span> {displayData.audience_demographics.top_countries}</div>}
                <div className="flex gap-4 mt-3 pt-3 border-t border-border">
                  <div><span className="text-muted-foreground text-xs">28d Reach</span><p className="font-semibold">{(displayData?.account_reach_28d || 0).toLocaleString()}</p></div>
                  <div><span className="text-muted-foreground text-xs">Profile Views</span><p className="font-semibold">{(displayData?.profile_views || 0).toLocaleString()}</p></div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Top Content */}
        {Array.isArray(displayData?.top_content) && displayData.top_content.length > 0 && (
          <Card className="bg-white/75 backdrop-blur-lg border border-white/18 shadow-md" style={{ borderRadius: '0.875rem' }}>
            <CardHeader className="pb-2"><CardTitle className="font-serif text-base">Top Content</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {displayData.top_content.slice(0, 5).map((item: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg bg-secondary/50 space-y-2">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline" className="text-xs">{item?.media_type || 'Post'}</Badge>
                      {item?.reel_plays ? <span className="text-xs text-muted-foreground">{(item.reel_plays || 0).toLocaleString()} plays</span> : null}
                    </div>
                    <p className="text-xs line-clamp-2">{item?.caption_summary || 'No caption'}</p>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><FiHeart size={12} /> {(item?.likes || 0).toLocaleString()}</span>
                      <span className="flex items-center gap-1"><FiMessageCircle size={12} /> {(item?.comments || 0).toLocaleString()}</span>
                      <span className="flex items-center gap-1"><FiBookmark size={12} /> {(item?.saves || 0).toLocaleString()}</span>
                      <span className="flex items-center gap-1"><FiEye size={12} /> {(item?.reach || 0).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analysis Summary */}
        {displayData?.analysis_summary && (
          <Card className="bg-white/75 backdrop-blur-lg border border-white/18 shadow-md" style={{ borderRadius: '0.875rem' }}>
            <CardHeader className="pb-2"><CardTitle className="font-serif text-base">Analysis Summary</CardTitle></CardHeader>
            <CardContent><p className="text-sm leading-relaxed whitespace-pre-wrap">{displayData.analysis_summary}</p></CardContent>
          </Card>
        )}

        {/* Active Collaborations Strip */}
        {activeCollabs.length > 0 && (
          <Card className="bg-white/75 backdrop-blur-lg border border-white/18 shadow-md" style={{ borderRadius: '0.875rem' }}>
            <CardHeader className="pb-2"><CardTitle className="font-serif text-base">Active Collaborations</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {activeCollabs.slice(0, 5).map((c: any, i: number) => (
                  <div key={i} className="flex justify-between items-center p-2 rounded-lg bg-secondary/30">
                    <div>
                      <p className="text-sm font-medium">{c?.campaign_name || 'Untitled'}</p>
                      <p className="text-xs text-muted-foreground">{c?.brand_name || 'Brand'}</p>
                    </div>
                    <Badge variant={c?.status === 'active' ? 'default' : 'secondary'}>{c?.status || 'proposed'}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  )
}
