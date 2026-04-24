'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoginForm, useAuth } from 'lyzr-architect/client'
import { FiUser, FiBriefcase } from 'react-icons/fi'

interface AuthScreenProps {
  onAuthSuccess: () => void
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const { refreshUser } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [role, setRole] = useState<'brand' | 'influencer'>('brand')
  const [regForm, setRegForm] = useState({ name: '', email: '', password: '', company_name: '' })
  const [regError, setRegError] = useState('')
  const [regLoading, setRegLoading] = useState(false)

  const handleRegister = async () => {
    if (!regForm.email || !regForm.password || !regForm.name) {
      setRegError('Please fill in all required fields')
      return
    }
    if (regForm.password.length < 8) {
      setRegError('Password must be at least 8 characters')
      return
    }
    setRegLoading(true)
    setRegError('')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regForm.email, password: regForm.password, name: regForm.name }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setRegError(data.error || 'Registration failed')
        setRegLoading(false)
        return
      }
      // After registration, store role in profile
      try {
        if (role === 'influencer') {
          await fetch('/api/influencer-profiles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: data.user?.id, instagram_handle: '', role: 'influencer' }),
          })
        }
        if (role === 'brand') {
          await fetch('/api/campaign-briefs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              brand_user_id: data.user?.id,
              campaign_name: 'Welcome Campaign',
              target_niches: [],
              company_name: regForm.company_name,
            }),
          })
        }
      } catch {}
      await refreshUser()
    } catch (err: any) {
      setRegError(err?.message || 'Network error')
    }
    setRegLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, hsl(30 50% 97%) 0%, hsl(20 45% 95%) 35%, hsl(40 40% 96%) 70%, hsl(15 35% 97%) 100%)' }}>
      <Card className="w-full max-w-md bg-white/75 backdrop-blur-2xl border border-white/18 shadow-2xl" style={{ borderRadius: '0.875rem' }}>
        <CardHeader className="text-center pb-2">
          <CardTitle className="font-serif text-2xl font-semibold tracking-tight">InfluencerConnect</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Brand-Influencer Collaboration Platform</p>
        </CardHeader>
        <CardContent>
          {mode === 'login' ? (
            <div>
              <LoginForm onSuccess={() => refreshUser()} onSwitchToRegister={() => setMode('register')} />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setRole('brand')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${role === 'brand' ? 'bg-primary text-primary-foreground shadow-md' : 'bg-secondary text-foreground hover:bg-secondary/80'}`}
                >
                  <FiBriefcase size={16} /> Brand
                </button>
                <button
                  onClick={() => setRole('influencer')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${role === 'influencer' ? 'bg-primary text-primary-foreground shadow-md' : 'bg-secondary text-foreground hover:bg-secondary/80'}`}
                >
                  <FiUser size={16} /> Influencer
                </button>
              </div>
              <div>
                <Label htmlFor="reg-name">Full Name *</Label>
                <Input id="reg-name" placeholder="Your name" value={regForm.name} onChange={(e) => setRegForm(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="reg-email">Email *</Label>
                <Input id="reg-email" type="email" placeholder="you@example.com" value={regForm.email} onChange={(e) => setRegForm(prev => ({ ...prev, email: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="reg-password">Password *</Label>
                <Input id="reg-password" type="password" placeholder="Min 8 characters" value={regForm.password} onChange={(e) => setRegForm(prev => ({ ...prev, password: e.target.value }))} />
              </div>
              {role === 'brand' && (
                <div>
                  <Label htmlFor="reg-company">Company Name</Label>
                  <Input id="reg-company" placeholder="Your company" value={regForm.company_name} onChange={(e) => setRegForm(prev => ({ ...prev, company_name: e.target.value }))} />
                </div>
              )}
              {regError && <p className="text-sm text-destructive">{regError}</p>}
              <Button onClick={handleRegister} disabled={regLoading} className="w-full">
                {regLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{' '}
                <button onClick={() => setMode('login')} className="text-primary hover:underline font-medium">Sign In</button>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
