'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { callAIAgent } from '@/lib/aiAgent'
import {
  FiSearch, FiTrendingUp, FiDollarSign, FiStar, FiUser, FiMessageSquare,
  FiChevronDown, FiChevronUp, FiTarget, FiUsers, FiActivity, FiShield,
  FiEye, FiBarChart2, FiAward, FiAlertCircle, FiCheckCircle
} from 'react-icons/fi'

const MATCHMAKER_AGENT_ID = '69eb981694ae1d830940fac8'

interface DiscoverInfluencersProps {
  campaigns: any[]
  onViewProfile: (influencer: any) => void
  onMessage: (influencer: any) => void
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600'
  if (score >= 60) return 'text-amber-600'
  if (score >= 40) return 'text-orange-600'
  return 'text-red-500'
}

function getScoreBg(score: number): string {
  if (score >= 80) return 'bg-emerald-50 border-emerald-200'
  if (score >= 60) return 'bg-amber-50 border-amber-200'
  if (score >= 40) return 'bg-orange-50 border-orange-200'
  return 'bg-red-50 border-red-200'
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent'
  if (score >= 80) return 'Very Good'
  if (score >= 70) return 'Good'
  if (score >= 60) return 'Fair'
  if (score >= 40) return 'Below Average'
  return 'Poor'
}

function ScoreBar({ label, score, icon }: { label: string; score: number; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 w-[140px] shrink-0 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex-1 h-2 bg-secondary/50 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${score}%`,
            background: score >= 80 ? '#059669' : score >= 60 ? '#d97706' : score >= 40 ? '#ea580c' : '#ef4444',
          }}
        />
      </div>
      <span className={`text-xs font-semibold w-10 text-right ${getScoreColor(score)}`}>{score}%</span>
    </div>
  )
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-1.5">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm mt-2 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-base mt-2 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-lg mt-3 mb-1">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm">{line.slice(2)}</li>
        if (!line.trim()) return <div key={i} className="h-0.5" />
        return <p key={i} className="text-sm">{line}</p>
      })}
    </div>
  )
}

export default function DiscoverInfluencers({ campaigns, onViewProfile, onMessage }: DiscoverInfluencersProps) {
  const [selectedCampaign, setSelectedCampaign] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState('')
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({})
  const [dbProfiles, setDbProfiles] = useState<any[]>([])
  const [loadingProfiles, setLoadingProfiles] = useState(true)
  const [profileCount, setProfileCount] = useState(0)

  const safeCampaigns = Array.isArray(campaigns) ? campaigns : []
  const chosen = safeCampaigns.find((c: any) => c?._id === selectedCampaign)

  useEffect(() => {
    const fetchProfiles = async () => {
      setLoadingProfiles(true)
      try {
        const res = await fetch('/api/influencer-profiles?all=true', {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        })
        const data = await res.json()
        if (!res.ok) {
          console.error('Failed to fetch influencer profiles:', res.status, data?.error || res.statusText)
          if (res.status === 401) {
            setError('Authentication error - please log in again.')
          } else {
            setError(data?.error || `Failed to load influencer profiles (${res.status})`)
          }
          setDbProfiles([])
          setProfileCount(0)
          setLoadingProfiles(false)
          return
        }
        const profiles = Array.isArray(data?.data) ? data.data : []
        console.log(`[DiscoverInfluencers] Fetched ${profiles.length} profiles from API`)
        setDbProfiles(profiles)
        setProfileCount(profiles.length)
      } catch (err) {
        console.error('Error fetching influencer profiles:', err)
        setDbProfiles([])
        setProfileCount(0)
      }
      setLoadingProfiles(false)
    }
    fetchProfiles()
  }, [])

  const toggleExpanded = (index: number) => {
    setExpandedCards(prev => ({ ...prev, [index]: !prev[index] }))
  }

  const handleSearch = async () => {
    if (!chosen) { setError('Please select a campaign brief'); return }
    if (dbProfiles.length === 0) { setError('No influencer profiles found in the database. Add influencer profiles first.'); return }

    setSearching(true)
    setError('')
    setExpandedCards({})

    try {
      const profilesSummary = dbProfiles.map((p: any) => ({
        influencer_id: p._id || p.user_id || '',
        instagram_handle: p.instagram_handle || '',
        follower_count: p.follower_count || 0,
        bio: p.bio || '',
        media_count: p.media_count || 0,
        avg_engagement_rate: p.avg_engagement_rate || 0,
        content_style: p.content_style || '',
        niche_tags: Array.isArray(p.niche_tags) ? p.niche_tags : [],
        audience_demographics: p.audience_demographics || {},
        account_reach_28d: p.account_reach_28d || 0,
        profile_views: p.profile_views || 0,
        analysis_summary: p.analysis_summary || '',
      }))

      const message = `IMPORTANT: Score ONLY the following ${profilesSummary.length} influencer profiles from our database. Do NOT invent or add any influencer not in this list.

CAMPAIGN DETAILS:
- Campaign: "${chosen.campaign_name}"
- Target Niches: ${Array.isArray(chosen.target_niches) ? chosen.target_niches.join(', ') : 'any'}
- Target Demographics: ${chosen.target_demographics || 'any'}
- Budget Range: $${chosen.budget_range_min || 0} - $${chosen.budget_range_max || 0}
- Deliverables: ${chosen.deliverable_requirements || 'flexible'}
- Campaign Goals: ${chosen.campaign_goals || 'general brand awareness'}

DATABASE INFLUENCER PROFILES TO SCORE:
${JSON.stringify(profilesSummary, null, 2)}

Score each influencer on: niche_alignment, engagement, demographics, content_quality, audience_authenticity, brand_safety, reach_efficiency. Calculate overall_performance_score as weighted average. Provide detailed score_reasoning for each.`

      const result = await callAIAgent(message, MATCHMAKER_AGENT_ID)
      if (result.success) {
        setResults(result?.response?.result)
      } else {
        setError(result?.error || 'Search failed')
      }
    } catch (e: any) {
      setError(e?.message || 'Network error')
    }
    setSearching(false)
  }

  const rankedInfluencers = Array.isArray(results?.ranked_influencers) ? results.ranked_influencers : []

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6 max-w-5xl">
        <div>
          <h2 className="font-serif text-2xl font-semibold tracking-tight">Discover Influencers</h2>
          <p className="text-sm text-muted-foreground mt-1">
            AI-powered scoring of {loadingProfiles ? '...' : profileCount} influencer{profileCount !== 1 ? 's' : ''} in your database
          </p>
        </div>

        {/* Search Controls */}
        <Card className="bg-white/75 backdrop-blur-lg border border-white/18 shadow-md" style={{ borderRadius: '0.875rem' }}>
          <CardContent className="p-4">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium mb-1.5 block">Select Campaign Brief</label>
                <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                  <SelectTrigger><SelectValue placeholder="Choose a campaign..." /></SelectTrigger>
                  <SelectContent>
                    {safeCampaigns.map((c: any) => (
                      <SelectItem key={c?._id || ''} value={c?._id || ''}>{c?.campaign_name || 'Untitled'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSearch} disabled={searching || !selectedCampaign || loadingProfiles} className="gap-2">
                <FiSearch size={16} /> {searching ? 'Analyzing...' : 'Score & Rank'}
              </Button>
            </div>
            {profileCount === 0 && !loadingProfiles && !error && (
              <div className="flex items-center gap-2 mt-3 text-sm text-amber-700 bg-amber-50 p-2.5 rounded-lg">
                <FiAlertCircle size={16} />
                <span>No influencer profiles found yet. Switch to the Influencer Dashboard, enter an Instagram handle, and click "Analyze Profile" to add one.</span>
              </div>
            )}
            {profileCount > 0 && !loadingProfiles && (
              <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                <FiCheckCircle size={14} className="text-emerald-500" />
                <span>{profileCount} influencer profile{profileCount !== 1 ? 's' : ''} found in database - ready to score</span>
              </div>
            )}
            {error && <p className="text-sm text-destructive mt-2">{error}</p>}
          </CardContent>
        </Card>

        {/* Summary */}
        {results?.top_recommendations_summary && (
          <Card className="bg-white/75 backdrop-blur-lg border border-white/18 shadow-md" style={{ borderRadius: '0.875rem' }}>
            <CardHeader className="pb-2"><CardTitle className="font-serif text-base flex items-center gap-2"><FiAward size={16} /> Summary</CardTitle></CardHeader>
            <CardContent>{renderMarkdown(results.top_recommendations_summary)}</CardContent>
          </Card>
        )}

        {/* Campaign Fit Analysis */}
        {results?.campaign_fit_analysis && (
          <Card className="bg-white/75 backdrop-blur-lg border border-white/18 shadow-md" style={{ borderRadius: '0.875rem' }}>
            <CardHeader className="pb-2"><CardTitle className="font-serif text-base flex items-center gap-2"><FiBarChart2 size={16} /> Campaign Fit Analysis</CardTitle></CardHeader>
            <CardContent>{renderMarkdown(results.campaign_fit_analysis)}</CardContent>
          </Card>
        )}

        {/* Ranked Influencer Cards */}
        {rankedInfluencers.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-serif text-lg font-semibold">Ranked Matches ({rankedInfluencers.length})</h3>
            {rankedInfluencers.map((inf: any, i: number) => {
              const perfScore = inf?.overall_performance_score || 0
              const isExpanded = expandedCards[i] || false

              return (
                <Card key={i} className="bg-white/75 backdrop-blur-lg border border-white/18 shadow-md hover:shadow-lg transition-shadow" style={{ borderRadius: '0.875rem' }}>
                  <CardContent className="p-5">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
                          <FiUser size={18} className="text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">{inf?.influencer_name || inf?.instagram_handle || 'Unknown'}</h4>
                          <p className="text-xs text-muted-foreground">@{inf?.instagram_handle || 'handle'}</p>
                          {inf?.follower_count > 0 && (
                            <p className="text-xs text-muted-foreground">{Number(inf.follower_count).toLocaleString()} followers</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-amber-100 text-amber-800 text-xs">#{inf?.rank || i + 1}</Badge>
                        {/* Performance Score Badge */}
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${getScoreBg(perfScore)}`}>
                          <FiStar size={14} className={getScoreColor(perfScore)} />
                          <span className={`text-sm font-bold ${getScoreColor(perfScore)}`}>{perfScore}</span>
                          <span className={`text-xs ${getScoreColor(perfScore)}`}>/ 100</span>
                        </div>
                      </div>
                    </div>

                    {/* Performance Score Label */}
                    <div className="mb-4 flex items-center gap-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getScoreBg(perfScore)} ${getScoreColor(perfScore)} border`}>
                        {getScoreLabel(perfScore)} Match
                      </span>
                    </div>

                    {/* Score Breakdown Bars */}
                    <div className="space-y-2 mb-4 p-3 bg-secondary/20 rounded-xl">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Score Breakdown</p>
                      <ScoreBar label="Niche Fit" score={inf?.niche_alignment_score || 0} icon={<FiTarget size={12} />} />
                      <ScoreBar label="Engagement" score={inf?.engagement_score || 0} icon={<FiActivity size={12} />} />
                      <ScoreBar label="Demographics" score={inf?.demographics_score || 0} icon={<FiUsers size={12} />} />
                      <ScoreBar label="Content Quality" score={inf?.content_quality_score || 0} icon={<FiStar size={12} />} />
                      <ScoreBar label="Authenticity" score={inf?.audience_authenticity_score || 0} icon={<FiShield size={12} />} />
                      <ScoreBar label="Brand Safety" score={inf?.brand_safety_score || 0} icon={<FiCheckCircle size={12} />} />
                      <ScoreBar label="Reach Efficiency" score={inf?.reach_efficiency_score || 0} icon={<FiEye size={12} />} />
                    </div>

                    {/* Predicted Metrics */}
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1"><FiTrendingUp size={12} /> Reach: {inf?.predicted_reach || 'N/A'}</span>
                      <span className="flex items-center gap-1"><FiActivity size={12} /> Engagement: {inf?.predicted_engagement_rate || 'N/A'}</span>
                      <span className="flex items-center gap-1"><FiDollarSign size={12} /> Fee: ${inf?.suggested_fee_min || 0} - ${inf?.suggested_fee_max || 0}</span>
                    </div>

                    {/* Strengths & Considerations */}
                    {inf?.strengths && <p className="text-xs mb-1"><span className="font-medium text-emerald-700">Strengths:</span> {inf.strengths}</p>}
                    {inf?.considerations && <p className="text-xs mb-1"><span className="font-medium text-amber-700">Considerations:</span> {inf.considerations}</p>}
                    {inf?.recommendation && <p className="text-xs mb-3"><span className="font-medium text-primary">Recommendation:</span> {inf.recommendation}</p>}

                    {/* Collapsible Reasoning Box */}
                    {inf?.score_reasoning && (
                      <div className="mb-3">
                        <button
                          onClick={() => toggleExpanded(i)}
                          className="flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors w-full text-left py-1.5"
                        >
                          {isExpanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                          <span>{isExpanded ? 'Hide' : 'Show'} Detailed Score Reasoning</span>
                        </button>
                        {isExpanded && (
                          <div className="mt-2 p-3 bg-secondary/30 rounded-xl border border-secondary/50 text-xs leading-relaxed text-muted-foreground">
                            {inf.score_reasoning.split('\n').map((line: string, li: number) => {
                              if (!line.trim()) return <div key={li} className="h-1" />
                              if (line.startsWith('- ') || line.startsWith('* ')) {
                                return <li key={li} className="ml-4 list-disc mb-0.5">{line.slice(2)}</li>
                              }
                              const boldMatch = line.match(/^(\*\*.*?\*\*:?)(.*)/)
                              if (boldMatch) {
                                return (
                                  <p key={li} className="mb-0.5">
                                    <span className="font-semibold text-foreground">{boldMatch[1].replace(/\*\*/g, '')}</span>
                                    {boldMatch[2]}
                                  </p>
                                )
                              }
                              return <p key={li} className="mb-0.5">{line}</p>
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => onViewProfile(inf)} className="gap-1"><FiUser size={14} /> View Profile</Button>
                      <Button size="sm" onClick={() => onMessage(inf)} className="gap-1"><FiMessageSquare size={14} /> Message</Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Empty State */}
        {!results && !searching && (
          <Card className="bg-white/75 backdrop-blur-lg border border-white/18 shadow-md" style={{ borderRadius: '0.875rem' }}>
            <CardContent className="p-8 text-center">
              <FiSearch size={32} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Select a campaign brief and click "Score & Rank" to evaluate influencers from your database.</p>
            </CardContent>
          </Card>
        )}

        {/* Searching State */}
        {searching && (
          <Card className="bg-white/75 backdrop-blur-lg border border-white/18 shadow-md" style={{ borderRadius: '0.875rem' }}>
            <CardContent className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Analyzing {profileCount} influencer profile{profileCount !== 1 ? 's' : ''} against campaign criteria...</p>
              <p className="text-xs text-muted-foreground mt-1">Calculating performance scores across 7 metrics</p>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  )
}
