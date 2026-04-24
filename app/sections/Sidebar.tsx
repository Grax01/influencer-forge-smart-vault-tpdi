'use client'

import React from 'react'
import { UserMenu, useAuth } from 'lyzr-architect/client'
import { FiHome, FiUsers, FiMessageSquare, FiBriefcase, FiSearch, FiSettings, FiLayers, FiLogOut } from 'react-icons/fi'

interface SidebarProps {
  activeScreen: string
  onNavigate: (screen: string) => void
  userRole: 'brand' | 'influencer'
}

const brandNav = [
  { id: 'dashboard', label: 'Dashboard', icon: FiHome },
  { id: 'campaigns', label: 'Campaigns', icon: FiBriefcase },
  { id: 'discover', label: 'Discover', icon: FiSearch },
  { id: 'collaborations', label: 'Collaborations', icon: FiLayers },
  { id: 'messages', label: 'Messages', icon: FiMessageSquare },
  { id: 'settings', label: 'Settings', icon: FiSettings },
]

const influencerNav = [
  { id: 'dashboard', label: 'Dashboard', icon: FiHome },
  { id: 'collaborations', label: 'Collaborations', icon: FiLayers },
  { id: 'messages', label: 'Messages', icon: FiMessageSquare },
  { id: 'settings', label: 'Settings', icon: FiSettings },
]

export default function Sidebar({ activeScreen, onNavigate, userRole }: SidebarProps) {
  const { logout } = useAuth()
  const navItems = userRole === 'brand' ? brandNav : influencerNav

  const handleLogout = async () => {
    try {
      await logout()
    } catch (e) {
      console.error('Logout failed:', e)
    }
  }

  return (
    <div className="w-64 h-screen flex flex-col bg-white/75 backdrop-blur-2xl border-r border-white/18 shadow-xl" style={{ borderRadius: '0 0.875rem 0.875rem 0' }}>
      <div className="p-6 pb-4">
        <h1 className="font-serif text-xl font-semibold tracking-tight text-foreground">InfluencerConnect</h1>
        <p className="text-xs text-muted-foreground mt-0.5 capitalize">{userRole} Portal</p>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeScreen === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-primary text-primary-foreground shadow-md' : 'text-foreground/70 hover:bg-secondary hover:text-foreground'}`}
            >
              <Icon size={18} />
              {item.label}
            </button>
          )
        })}
      </nav>
      <div className="p-4 border-t border-border space-y-2">
        <UserMenu />
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
        >
          <FiLogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  )
}
