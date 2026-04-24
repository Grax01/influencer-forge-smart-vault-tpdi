'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FiBriefcase, FiUsers, FiClock, FiCheckCircle, FiMessageSquare } from 'react-icons/fi'

interface BrandDashboardProps {
  campaigns: any[]
  collaborations: any[]
  conversations: any[]
  onNavigate: (screen: string) => void
}

export default function BrandDashboard({ campaigns, collaborations, conversations, onNavigate }: BrandDashboardProps) {
  const safeCollabs = Array.isArray(collaborations) ? collaborations : []
  const safeCampaigns = Array.isArray(campaigns) ? campaigns : []
  const safeConvos = Array.isArray(conversations) ? conversations : []

  const activeCount = safeCollabs.filter(c => c?.status === 'active').length
  const proposedCount = safeCollabs.filter(c => c?.status === 'proposed').length
  const completedCount = safeCollabs.filter(c => c?.status === 'completed').length
  const totalInfluencers = new Set(safeCollabs.map(c => c?.influencer_id).filter(Boolean)).size

  const stats = [
    { label: 'Active Campaigns', value: safeCampaigns.length, icon: FiBriefcase },
    { label: 'Influencers Contacted', value: totalInfluencers, icon: FiUsers },
    { label: 'Pending Proposals', value: proposedCount, icon: FiClock },
    { label: 'Completed Collabs', value: completedCount, icon: FiCheckCircle },
  ]

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6 max-w-5xl">
        <div>
          <h2 className="font-serif text-2xl font-semibold tracking-tight">Brand Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">Overview of your campaigns and collaborations</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => {
            const Icon = s.icon
            return (
              <Card key={s.label} className="bg-white/75 backdrop-blur-lg border border-white/18 shadow-md cursor-pointer hover:shadow-lg transition-shadow" style={{ borderRadius: '0.875rem' }}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10"><Icon size={18} className="text-primary" /></div>
                    <div>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <p className="text-lg font-semibold">{s.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-white/75 backdrop-blur-lg border border-white/18 shadow-md" style={{ borderRadius: '0.875rem' }}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="font-serif text-base">Recent Campaigns</CardTitle>
              <button onClick={() => onNavigate('campaigns')} className="text-xs text-primary hover:underline">View All</button>
            </CardHeader>
            <CardContent>
              {safeCampaigns.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No campaigns yet. Create your first campaign brief.</p>
              ) : (
                <div className="space-y-2">
                  {safeCampaigns.slice(0, 5).map((c: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-2 rounded-lg bg-secondary/30">
                      <div>
                        <p className="text-sm font-medium">{c?.campaign_name || 'Untitled'}</p>
                        <div className="flex gap-1 mt-1">
                          {Array.isArray(c?.target_niches) && c.target_niches.slice(0, 3).map((n: string, j: number) => (
                            <Badge key={j} variant="outline" className="text-xs">{n}</Badge>
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">${c?.budget_range_min || 0} - ${c?.budget_range_max || 0}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/75 backdrop-blur-lg border border-white/18 shadow-md" style={{ borderRadius: '0.875rem' }}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="font-serif text-base">Recent Conversations</CardTitle>
              <button onClick={() => onNavigate('messages')} className="text-xs text-primary hover:underline">View All</button>
            </CardHeader>
            <CardContent>
              {safeConvos.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No conversations yet. Discover influencers to start.</p>
              ) : (
                <div className="space-y-2">
                  {safeConvos.slice(0, 5).map((c: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-2 rounded-lg bg-secondary/30">
                      <div className="flex items-center gap-2">
                        <FiMessageSquare size={14} className="text-muted-foreground" />
                        <span className="text-sm">{c?.influencer_user_id ? `Influencer Chat` : 'Conversation'}</span>
                      </div>
                      {c?.has_active_deal && <Badge variant="default" className="text-xs">Deal Active</Badge>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Active Collabs */}
        {activeCount > 0 && (
          <Card className="bg-white/75 backdrop-blur-lg border border-white/18 shadow-md" style={{ borderRadius: '0.875rem' }}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="font-serif text-base">Active Collaborations</CardTitle>
              <button onClick={() => onNavigate('collaborations')} className="text-xs text-primary hover:underline">View All</button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {safeCollabs.filter(c => c?.status === 'active').slice(0, 5).map((c: any, i: number) => (
                  <div key={i} className="flex justify-between items-center p-2 rounded-lg bg-secondary/30">
                    <div>
                      <p className="text-sm font-medium">{c?.campaign_name || 'Campaign'}</p>
                      <p className="text-xs text-muted-foreground">Fee: ${c?.fee_agreed || 0}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800 text-xs">Active</Badge>
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
