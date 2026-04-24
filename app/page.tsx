'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { AuthProvider, ProtectedRoute, useAuth } from 'lyzr-architect/client'
import AuthScreen from './sections/AuthScreen'
import Sidebar from './sections/Sidebar'
import InfluencerDashboard from './sections/InfluencerDashboard'
import BrandDashboard from './sections/BrandDashboard'
import CampaignBriefs from './sections/CampaignBriefs'
import DiscoverInfluencers from './sections/DiscoverInfluencers'
import InfluencerProfile from './sections/InfluencerProfile'
import Collaborations from './sections/Collaborations'
import Messages from './sections/Messages'
import Settings from './sections/Settings'

const THEME_VARS = {
  '--background': '30 40% 98%',
  '--foreground': '20 40% 10%',
  '--card': '30 40% 96%',
  '--card-foreground': '20 40% 10%',
  '--primary': '24 95% 53%',
  '--primary-foreground': '30 40% 98%',
  '--secondary': '30 35% 92%',
  '--secondary-foreground': '20 40% 10%',
  '--accent': '12 80% 50%',
  '--accent-foreground': '30 40% 98%',
  '--destructive': '0 84% 60%',
  '--destructive-foreground': '30 40% 98%',
  '--muted': '30 30% 90%',
  '--muted-foreground': '20 25% 45%',
  '--border': '30 35% 88%',
  '--input': '30 30% 80%',
  '--ring': '24 95% 53%',
  '--radius': '0.875rem',
} as React.CSSProperties

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button onClick={() => this.setState({ hasError: false, error: '' })} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">Try again</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function AppContent() {
  const { user } = useAuth()
  const [activeScreen, setActiveScreen] = useState('dashboard')
  const [userRole, setUserRole] = useState<'brand' | 'influencer'>('brand')
  const [profile, setProfile] = useState<any>(null)
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [collaborations, setCollaborations] = useState<any[]>([])
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedInfluencer, setSelectedInfluencer] = useState<any>(null)
  const [activeAgentId, setActiveAgentId] = useState('')
  const [dataLoaded, setDataLoaded] = useState(false)

  const userId = user?.id || ''

  const loadData = useCallback(async () => {
    if (!userId) return
    try {
      const [profileRes, campaignRes, collabRes, convoRes] = await Promise.all([
        fetch('/api/influencer-profiles').then(r => r.json()).catch(() => ({ data: [] })),
        fetch('/api/campaign-briefs').then(r => r.json()).catch(() => ({ data: [] })),
        fetch('/api/collaborations').then(r => r.json()).catch(() => ({ data: [] })),
        fetch('/api/conversations').then(r => r.json()).catch(() => ({ data: [] })),
      ])

      const profiles = Array.isArray(profileRes?.data) ? profileRes.data : []
      const myProfile = profiles.find((p: any) => p?.user_id === userId)

      if (myProfile) {
        setProfile(myProfile)
        setUserRole('influencer')
      } else {
        setUserRole('brand')
      }

      setCampaigns(Array.isArray(campaignRes?.data) ? campaignRes.data : [])
      setCollaborations(Array.isArray(collabRes?.data) ? collabRes.data : [])
      setConversations(Array.isArray(convoRes?.data) ? convoRes.data : [])
      setDataLoaded(true)
    } catch {
      setDataLoaded(true)
    }
  }, [userId])

  useEffect(() => { loadData() }, [loadData])

  const handleViewProfile = (inf: any) => {
    setSelectedInfluencer(inf)
    setActiveScreen('profile')
  }

  const handleMessageInfluencer = async (inf: any) => {
    try {
      const existingConvo = (Array.isArray(conversations) ? conversations : []).find(
        (c: any) => c?.influencer_user_id === inf?.influencer_id || c?.brand_user_id === userId
      )
      if (existingConvo) {
        setActiveScreen('messages')
      } else {
        const res = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brand_user_id: userRole === 'brand' ? userId : (inf?.influencer_id || ''),
            influencer_user_id: userRole === 'brand' ? (inf?.influencer_id || '') : userId,
            status: 'active',
          }),
        })
        await res.json()
        await loadData()
        setActiveScreen('messages')
      }
    } catch {
      setActiveScreen('messages')
    }
  }

  const renderScreen = () => {
    switch (activeScreen) {
      case 'dashboard':
        return userRole === 'influencer' ? (
          <InfluencerDashboard profile={profile} collaborations={collaborations} onProfileUpdate={(data: any) => { setProfile(data); loadData() }} userId={userId} />
        ) : (
          <BrandDashboard campaigns={campaigns} collaborations={collaborations} conversations={conversations} onNavigate={setActiveScreen} />
        )
      case 'campaigns':
        return <CampaignBriefs campaigns={campaigns} userId={userId} onRefresh={loadData} />
      case 'discover':
        return <DiscoverInfluencers campaigns={campaigns} onViewProfile={handleViewProfile} onMessage={handleMessageInfluencer} />
      case 'profile':
        return selectedInfluencer ? (
          <InfluencerProfile influencer={selectedInfluencer} onBack={() => setActiveScreen('discover')} onMessage={handleMessageInfluencer} collaborations={collaborations} />
        ) : (
          <DiscoverInfluencers campaigns={campaigns} onViewProfile={handleViewProfile} onMessage={handleMessageInfluencer} />
        )
      case 'collaborations':
        return <Collaborations collaborations={collaborations} userRole={userRole} userId={userId} onRefresh={loadData} />
      case 'messages':
        return <Messages conversations={conversations} userId={userId} userRole={userRole} onRefresh={loadData} />
      case 'settings':
        return <Settings user={user} userRole={userRole} activeAgentId={activeAgentId} />
      default:
        return null
    }
  }

  if (!dataLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsl(30 50% 97%) 0%, hsl(20 45% 95%) 35%, hsl(40 40% 96%) 70%, hsl(15 35% 97%) 100%)' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading your workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'linear-gradient(135deg, hsl(30 50% 97%) 0%, hsl(20 45% 95%) 35%, hsl(40 40% 96%) 70%, hsl(15 35% 97%) 100%)' }}>
      <Sidebar activeScreen={activeScreen} onNavigate={setActiveScreen} userRole={userRole} />
      <main className="flex-1 overflow-hidden">
        {renderScreen()}
      </main>
    </div>
  )
}

export default function Page() {
  return (
    <ErrorBoundary>
      <div style={THEME_VARS} className="min-h-screen bg-background text-foreground font-sans">
        <AuthProvider>
          <ProtectedRoute unauthenticatedFallback={<AuthScreen onAuthSuccess={() => {}} />}>
            <AppContent />
          </ProtectedRoute>
        </AuthProvider>
      </div>
    </ErrorBoundary>
  )
}
