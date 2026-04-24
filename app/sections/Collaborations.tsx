'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FiCheck, FiX, FiClock, FiTrendingUp, FiLink } from 'react-icons/fi'

const STATUS_TABS = ['all', 'proposed', 'active', 'content_submitted', 'completed', 'declined']

const STATUS_COLORS: Record<string, string> = {
  proposed: 'bg-amber-100 text-amber-800',
  counter_offered: 'bg-amber-100 text-amber-800',
  accepted: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  content_submitted: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
  declined: 'bg-gray-100 text-gray-500',
}

interface CollaborationsProps {
  collaborations: any[]
  userRole: 'brand' | 'influencer'
  userId: string
  onRefresh: () => void
}

export default function Collaborations({ collaborations, userRole, userId, onRefresh }: CollaborationsProps) {
  const [activeTab, setActiveTab] = useState('all')
  const [actionDialog, setActionDialog] = useState<any>(null)
  const [formData, setFormData] = useState({ instagram_post_url: '', actual_reach: '', actual_engagement_rate: '' })
  const [saving, setSaving] = useState(false)

  const safeCollabs = Array.isArray(collaborations) ? collaborations : []
  const filtered = activeTab === 'all' ? safeCollabs : safeCollabs.filter((c: any) => c?.status === activeTab)

  const updateCollab = async (id: string, update: any) => {
    setSaving(true)
    try {
      await fetch('/api/collaborations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: id, ...update }),
      })
      onRefresh()
    } catch {}
    setSaving(false)
    setActionDialog(null)
  }

  const getDaysUntil = (deadline: string) => {
    if (!deadline) return null
    const d = new Date(deadline)
    const now = new Date()
    const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6 max-w-5xl">
        <div>
          <h2 className="font-serif text-2xl font-semibold tracking-tight">Collaborations</h2>
          <p className="text-sm text-muted-foreground mt-1">Track and manage all your collaborations</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all capitalize ${activeTab === tab ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground hover:bg-secondary/80'}`}
            >
              {tab === 'content_submitted' ? 'Submitted' : tab} ({tab === 'all' ? safeCollabs.length : safeCollabs.filter(c => c?.status === tab).length})
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <Card className="bg-white/75 backdrop-blur-lg border border-white/18 shadow-md" style={{ borderRadius: '0.875rem' }}>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No collaborations found in this category.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((c: any, i: number) => {
              const daysLeft = getDaysUntil(c?.deadline)
              return (
                <Card key={c?._id || i} className="bg-white/75 backdrop-blur-lg border border-white/18 shadow-md" style={{ borderRadius: '0.875rem' }}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm">{c?.campaign_name || 'Campaign'}</h3>
                          <Badge className={`text-xs ${STATUS_COLORS[c?.status || ''] || 'bg-gray-100 text-gray-500'}`}>{c?.status || 'unknown'}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{c?.brand_name || 'Brand'}</p>
                        <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                          {c?.deliverables_agreed && <span>Deliverables: {c.deliverables_agreed}</span>}
                          {c?.fee_agreed ? <span>Fee: ${c.fee_agreed.toLocaleString()}</span> : null}
                          {daysLeft !== null && (
                            <span className={`flex items-center gap-1 ${daysLeft < 0 ? 'text-destructive' : daysLeft < 3 ? 'text-amber-600' : ''}`}>
                              <FiClock size={12} />
                              {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                            </span>
                          )}
                        </div>
                        {c?.instagram_post_url && (
                          <a href={c.instagram_post_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                            <FiLink size={10} /> View Post
                          </a>
                        )}
                        {c?.status === 'completed' && (c?.actual_reach || c?.actual_engagement_rate) ? (
                          <div className="flex gap-3 mt-2">
                            {c.actual_reach ? <span className="text-xs flex items-center gap-1"><FiTrendingUp size={10} /> Reach: {c.actual_reach.toLocaleString()}</span> : null}
                            {c.actual_engagement_rate ? <span className="text-xs">Engagement: {c.actual_engagement_rate}%</span> : null}
                          </div>
                        ) : null}
                      </div>
                      <div className="flex gap-1.5 ml-2">
                        {/* Influencer actions */}
                        {userRole === 'influencer' && c?.status === 'proposed' && (
                          <>
                            <Button size="sm" onClick={() => updateCollab(c._id, { status: 'accepted', accepted_at: new Date().toISOString() })} className="gap-1 text-xs"><FiCheck size={12} /> Accept</Button>
                            <Button size="sm" variant="outline" onClick={() => updateCollab(c._id, { status: 'declined' })} className="gap-1 text-xs"><FiX size={12} /> Decline</Button>
                          </>
                        )}
                        {userRole === 'influencer' && c?.status === 'active' && (
                          <Button size="sm" variant="outline" onClick={() => setActionDialog({ type: 'submit', collab: c })} className="text-xs">Submit Content</Button>
                        )}
                        {userRole === 'influencer' && c?.status === 'completed' && !c?.actual_reach && (
                          <Button size="sm" variant="outline" onClick={() => setActionDialog({ type: 'metrics', collab: c })} className="text-xs">Update Metrics</Button>
                        )}
                        {/* Brand actions */}
                        {userRole === 'brand' && c?.status === 'accepted' && (
                          <Button size="sm" onClick={() => updateCollab(c._id, { status: 'active' })} className="text-xs">Activate</Button>
                        )}
                        {userRole === 'brand' && c?.status === 'content_submitted' && (
                          <Button size="sm" onClick={() => updateCollab(c._id, { status: 'completed', completed_at: new Date().toISOString() })} className="text-xs gap-1"><FiCheck size={12} /> Mark Complete</Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Action Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle className="font-serif">{actionDialog?.type === 'submit' ? 'Submit Content' : 'Update Metrics'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {actionDialog?.type === 'submit' && (
              <div>
                <Label>Instagram Post URL</Label>
                <Input placeholder="https://instagram.com/p/..." value={formData.instagram_post_url} onChange={(e) => setFormData(prev => ({ ...prev, instagram_post_url: e.target.value }))} />
              </div>
            )}
            {actionDialog?.type === 'metrics' && (
              <>
                <div>
                  <Label>Actual Reach</Label>
                  <Input type="number" placeholder="e.g., 50000" value={formData.actual_reach} onChange={(e) => setFormData(prev => ({ ...prev, actual_reach: e.target.value }))} />
                </div>
                <div>
                  <Label>Actual Engagement Rate (%)</Label>
                  <Input type="number" placeholder="e.g., 4.5" value={formData.actual_engagement_rate} onChange={(e) => setFormData(prev => ({ ...prev, actual_engagement_rate: e.target.value }))} />
                </div>
              </>
            )}
            <Button
              disabled={saving}
              onClick={() => {
                if (actionDialog?.type === 'submit') {
                  updateCollab(actionDialog.collab._id, { status: 'content_submitted', instagram_post_url: formData.instagram_post_url })
                } else {
                  updateCollab(actionDialog.collab._id, { actual_reach: Number(formData.actual_reach) || 0, actual_engagement_rate: Number(formData.actual_engagement_rate) || 0 })
                }
              }}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ScrollArea>
  )
}
