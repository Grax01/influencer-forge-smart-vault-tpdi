'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { FiSettings, FiUser, FiShield } from 'react-icons/fi'

const AGENT_INFO = [
  { name: 'Profile Analysis Agent', id: '69eb981614e70411b00f8059', purpose: 'Analyzes Instagram profiles for engagement metrics, content style, and audience demographics' },
  { name: 'Campaign Matchmaker', id: '69eb981694ae1d830940fac8', purpose: 'AI-powered influencer matching with scored rankings for campaigns' },
  { name: 'Outreach Drafting Agent', id: '69eb981794ae1d830940faca', purpose: 'Generates personalized collaboration outreach proposals' },
  { name: 'Script Generator Agent', id: '69eb9817f002b0832a126c89', purpose: 'Creates structured content scripts with hooks, CTAs, and hashtags' },
]

interface SettingsProps {
  user: any
  userRole: 'brand' | 'influencer'
  activeAgentId: string
}

export default function Settings({ user, userRole, activeAgentId }: SettingsProps) {
  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6 max-w-3xl">
        <div>
          <h2 className="font-serif text-2xl font-semibold tracking-tight">Settings</h2>
          <p className="text-sm text-muted-foreground mt-1">Account settings and platform info</p>
        </div>

        <Card className="bg-white/75 backdrop-blur-lg border border-white/18 shadow-md" style={{ borderRadius: '0.875rem' }}>
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <FiUser size={16} className="text-primary" />
            <CardTitle className="font-serif text-base">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <p className="text-sm">{user?.email || 'Not set'}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Name</Label>
              <p className="text-sm">{user?.name || 'Not set'}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Role</Label>
              <Badge variant="secondary" className="capitalize">{userRole}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/75 backdrop-blur-lg border border-white/18 shadow-md" style={{ borderRadius: '0.875rem' }}>
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <FiShield size={16} className="text-primary" />
            <CardTitle className="font-serif text-base">AI Agents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {AGENT_INFO.map((agent) => (
              <div key={agent.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-secondary/30">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${activeAgentId === agent.id ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/30'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{agent.name}</p>
                  <p className="text-xs text-muted-foreground">{agent.purpose}</p>
                </div>
                {activeAgentId === agent.id && <Badge variant="default" className="text-xs flex-shrink-0">Active</Badge>}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}
