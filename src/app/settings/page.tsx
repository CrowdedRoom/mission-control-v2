'use client'

import { useState } from 'react'
import { Bell, Moon, Shield, Database } from 'lucide-react'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: true,
    autoSave: true,
    compactView: false
  })

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Settings</h1>
        <p className="text-slate-400">Configure Mission Control to work the way you want.</p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* Appearance */}
        <SettingsSection title="Appearance" icon={<Moon size={20} />}>
          <ToggleSetting
            label="Dark Mode"
            description="Use dark theme throughout the app"
            enabled={settings.darkMode}
            onChange={() => setSettings(s => ({ ...s, darkMode: !s.darkMode }))}
          />
          <ToggleSetting
            label="Compact View"
            description="Show more content with less padding"
            enabled={settings.compactView}
            onChange={() => setSettings(s => ({ ...s, compactView: !s.compactView }))}
          />
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection title="Notifications" icon={<Bell size={20} />}>
          <ToggleSetting
            label="Enable Notifications"
            description="Get notified about task updates and mentions"
            enabled={settings.notifications}
            onChange={() => setSettings(s => ({ ...s, notifications: !s.notifications }))}
          />
        </SettingsSection>

        {/* Data */}
        <SettingsSection title="Data & Storage" icon={<Database size={20} />}>
          <ToggleSetting
            label="Auto-save"
            description="Automatically save changes as you work"
            enabled={settings.autoSave}
            onChange={() => setSettings(s => ({ ...s, autoSave: !s.autoSave }))}
          />
          
          <div className="pt-4 border-t border-slate-700">
            <h4 className="text-sm font-medium text-slate-300 mb-3">Database</h4>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-slate-300 transition-colors">
                Export Data
              </button>
              <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-slate-300 transition-colors">
                Import Data
              </button>
              <button className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm transition-colors">
                Reset All Data
              </button>
            </div>
          </div>
        </SettingsSection>

        {/* About */}
        <SettingsSection title="About" icon={<Shield size={20} />}>
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-300">Version</span>
              <span className="text-slate-400">2.0.0</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-300">Built by</span>
              <span className="text-slate-400">Larry 🦝 for DJ</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-300">Database</span>
              <span className="text-slate-400">Local JSON</span>
            </div>
          </div>
        </SettingsSection>
      </div>
    </div>
  )
}

function SettingsSection({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) {
  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-slate-400">{icon}</span>
        <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}

function ToggleSetting({ 
  label, 
  description, 
  enabled, 
  onChange 
}: { 
  label: string
  description: string
  enabled: boolean
  onChange: () => void
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="font-medium text-slate-200">{label}</p>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
      <button
        onClick={onChange}
        className={`w-12 h-6 rounded-full transition-colors relative ${
          enabled ? 'bg-blue-600' : 'bg-slate-600'
        }`}
      >
        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
          enabled ? 'left-7' : 'left-1'
        }`} />
      </button>
    </div>
  )
}
