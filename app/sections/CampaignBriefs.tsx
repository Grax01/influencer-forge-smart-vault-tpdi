'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Slider } from '@/components/ui/slider'
import { FiPlus, FiTrash2 } from 'react-icons/fi'

interface CampaignBriefsProps {
  campaigns: any[]
  userId: string
  onRefresh: () => void
}

const NICHE_OPTIONS = ['Fashion', 'Beauty', 'Fitness', 'Food', 'Travel', 'Tech', 'Gaming', 'Lifestyle', 'Parenting', 'Music', 'Comedy', 'Education', 'Health', 'Finance', 'Sports']

export default function CampaignBriefs({ campaigns, userId, onRefresh }: CampaignBriefsProps) {
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    campaign_name: '',
    target_niches: [] as string[],
    target_demographics: '',
    budget_range_min: 500,
    budget_range_max: 5000,
    deliverable_requirements: '',
  })

  const toggleNiche = (niche: string) => {
    setForm(prev => ({
      ...prev,
      target_niches: prev.target_niches.includes(niche) ? prev.target_niches.filter(n => n !== niche) : [...prev.target_niches, niche],
    }))
  }

  const handleSave = async () => {
    if (!form.campaign_name.trim()) { setError('Campaign name is required'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/campaign-briefs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, brand_user_id: userId }),
      })
      const data = await res.json()
      if (!data.success) { setError(data.error || 'Failed to save'); setSaving(false); return }
      setForm({ campaign_name: '', target_niches: [], target_demographics: '', budget_range_min: 500, budget_range_max: 5000, deliverable_requirements: '' })
      setShowForm(false)
      onRefresh()
    } catch (e: any) {
      setError(e?.message || 'Network error')
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/campaign-briefs?id=${id}`, { method: 'DELETE' })
      onRefresh()
    } catch {}
  }

  const safeCampaigns = Array.isArray(campaigns) ? campaigns : []

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6 max-w-4xl">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-serif text-2xl font-semibold tracking-tight">Campaign Briefs</h2>
            <p className="text-sm text-muted-foreground mt-1">Create and manage your campaign briefs</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2"><FiPlus size={16} /> New Brief</Button>
        </div>

        {showForm && (
          <Card className="bg-white/75 backdrop-blur-lg border border-white/18 shadow-md" style={{ borderRadius: '0.875rem' }}>
            <CardHeader className="pb-3"><CardTitle className="font-serif text-lg">Create Campaign Brief</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Campaign Name *</Label>
                <Input placeholder="e.g., Summer Launch 2025" value={form.campaign_name} onChange={(e) => setForm(prev => ({ ...prev, campaign_name: e.target.value }))} />
              </div>
              <div>
                <Label className="mb-2 block">Target Niches</Label>
                <div className="flex flex-wrap gap-2">
                  {NICHE_OPTIONS.map(n => (
                    <button key={n} onClick={() => toggleNiche(n)} className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${form.target_niches.includes(n) ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground hover:bg-secondary/80'}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Target Demographics</Label>
                <Input placeholder="e.g., 18-35, Female, US-based" value={form.target_demographics} onChange={(e) => setForm(prev => ({ ...prev, target_demographics: e.target.value }))} />
              </div>
              <div>
                <Label>Budget Range: ${form.budget_range_min} - ${form.budget_range_max}</Label>
                <div className="flex gap-4 mt-2">
                  <div className="flex-1">
                    <span className="text-xs text-muted-foreground">Min</span>
                    <Slider value={[form.budget_range_min]} min={100} max={50000} step={100} onValueChange={([v]) => setForm(prev => ({ ...prev, budget_range_min: v }))} />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs text-muted-foreground">Max</span>
                    <Slider value={[form.budget_range_max]} min={100} max={50000} step={100} onValueChange={([v]) => setForm(prev => ({ ...prev, budget_range_max: v }))} />
                  </div>
                </div>
              </div>
              <div>
                <Label>Deliverable Requirements</Label>
                <Textarea placeholder="e.g., 2 Instagram Reels, 3 Stories, 1 Feed Post..." value={form.deliverable_requirements} onChange={(e) => setForm(prev => ({ ...prev, deliverable_requirements: e.target.value }))} rows={3} />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Brief'}</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {safeCampaigns.length === 0 && !showForm && (
            <Card className="bg-white/75 backdrop-blur-lg border border-white/18 shadow-md" style={{ borderRadius: '0.875rem' }}>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No campaign briefs yet. Create your first one to start discovering influencers.</p>
              </CardContent>
            </Card>
          )}
          {safeCampaigns.map((c: any, i: number) => (
            <Card key={c?._id || i} className="bg-white/75 backdrop-blur-lg border border-white/18 shadow-md" style={{ borderRadius: '0.875rem' }}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{c?.campaign_name || 'Untitled'}</h3>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {Array.isArray(c?.target_niches) && c.target_niches.map((n: string, j: number) => (
                        <Badge key={j} variant="secondary" className="text-xs">{n}</Badge>
                      ))}
                    </div>
                    {c?.target_demographics && <p className="text-xs text-muted-foreground mt-1.5">{c.target_demographics}</p>}
                    <p className="text-xs text-muted-foreground mt-1">Budget: ${c?.budget_range_min || 0} - ${c?.budget_range_max || 0}</p>
                    {c?.deliverable_requirements && <p className="text-xs mt-1 line-clamp-2">{c.deliverable_requirements}</p>}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => c?._id && handleDelete(c._id)}>
                    <FiTrash2 size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </ScrollArea>
  )
}
