'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, X, Clock, MapPin, Calendar as CalendarIcon, Trash2 } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, parseISO, isToday } from 'date-fns'

type CalendarEvent = {
  id: string
  title: string
  description: string | null
  start: string
  end: string | null
  all_day: boolean
  location: string | null
  color: string
  category: 'family' | 'work' | 'personal' | 'health' | 'social' | 'other'
  recurring: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  reminder: number | null
  created_at: string
  updated_at: string
}

const categoryColors: Record<string, string> = {
  family: '#ef4444',
  work: '#3b82f6',
  personal: '#8b5cf6',
  health: '#22c55e',
  social: '#f97316',
  other: '#64748b'
}

const categoryLabels: Record<string, string> = {
  family: '👨‍👩‍👧‍👦 Family',
  work: '💼 Work',
  personal: '🎯 Personal',
  health: '💪 Health',
  social: '🎉 Social',
  other: '📌 Other'
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start: '',
    end: '',
    all_day: false,
    location: '',
    category: 'other' as 'family' | 'work' | 'personal' | 'health' | 'social' | 'other',
    color: '#3b82f6'
  })

  // Calculate calendar grid
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const weekDaysMobile = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  useEffect(() => {
    fetchEvents()
  }, [currentDate])

  const fetchEvents = async () => {
    try {
      const start = startOfWeek(startOfMonth(currentDate))
      const end = endOfWeek(endOfMonth(currentDate))
      const res = await fetch(`/api/events?start=${start.toISOString()}&end=${end.toISOString()}`)
      const data = await res.json()
      setEvents(data)
    } catch (error) {
      console.error('Failed to fetch events:', error)
    } finally {
      setLoading(false)
    }
  }

  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      const eventStart = parseISO(event.start)
      const eventEnd = event.end ? parseISO(event.end) : eventStart
      
      // Check if day falls between start and end (inclusive)
      const dayStart = new Date(day)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(day)
      dayEnd.setHours(23, 59, 59, 999)
      
      return eventStart <= dayEnd && eventEnd >= dayStart
    })
  }

  const openNewEventModal = (date?: Date) => {
    const targetDate = date || selectedDate || new Date()
    const dateStr = format(targetDate, "yyyy-MM-dd'T'HH:mm")
    setFormData({
      title: '',
      description: '',
      start: dateStr,
      end: '',
      all_day: false,
      location: '',
      category: 'other',
      color: '#3b82f6'
    })
    setEditingEvent(null)
    setShowModal(true)
  }

  const openEditEventModal = (event: CalendarEvent) => {
    setFormData({
      title: event.title,
      description: event.description || '',
      start: event.start.slice(0, 16),
      end: event.end?.slice(0, 16) || '',
      all_day: event.all_day,
      location: event.location || '',
      category: event.category,
      color: event.color
    })
    setEditingEvent(event)
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const eventData = {
      title: formData.title,
      description: formData.description || null,
      start: new Date(formData.start).toISOString(),
      end: formData.end ? new Date(formData.end).toISOString() : null,
      all_day: formData.all_day,
      location: formData.location || null,
      category: formData.category,
      color: categoryColors[formData.category],
      recurring: 'none' as const,
      reminder: null
    }

    try {
      if (editingEvent) {
        await fetch(`/api/events/${editingEvent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData)
        })
      } else {
        await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData)
        })
      }
      setShowModal(false)
      fetchEvents()
    } catch (error) {
      console.error('Failed to save event:', error)
    }
  }

  const handleDelete = async () => {
    if (!editingEvent) return
    if (!confirm('Delete this event?')) return

    try {
      await fetch(`/api/events/${editingEvent.id}`, { method: 'DELETE' })
      setShowModal(false)
      fetchEvents()
    } catch (error) {
      console.error('Failed to delete event:', error)
    }
  }

  const upcomingEvents = events
    .filter(e => new Date(e.start) >= new Date())
    .slice(0, 5)

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100 mb-1 md:mb-2">Calendar</h1>
          <p className="text-sm md:text-base text-slate-400">Schedule events and track important dates.</p>
        </div>
        <button 
          onClick={() => openNewEventModal()}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors w-full sm:w-auto"
        >
          <Plus size={18} />
          Add Event
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden order-2 lg:order-1">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <h2 className="text-xl font-semibold text-slate-100">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Week Days */}
          <div className="grid grid-cols-7 border-b border-slate-700">
            {weekDays.map((day, i) => (
              <div key={day} className="p-2 md:p-3 text-center text-xs md:text-sm font-medium text-slate-400">
                <span className="hidden md:inline">{day}</span>
                <span className="md:hidden">{weekDaysMobile[i]}</span>
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const dayEvents = getEventsForDay(day)
              const isCurrentMonth = isSameMonth(day, currentDate)
              const isSelected = selectedDate && isSameDay(day, selectedDate)
              const todayClass = isToday(day)
              
              const maxEvents = typeof window !== 'undefined' && window.innerWidth < 768 ? 2 : 3
              
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => {
                    setSelectedDate(day)
                    if (dayEvents.length === 0) {
                      openNewEventModal(day)
                    }
                  }}
                  className={`min-h-[70px] md:min-h-[100px] p-1 md:p-2 border-b border-r border-slate-700/50 hover:bg-slate-700/50 transition-colors flex flex-col items-start ${
                    !isCurrentMonth ? 'bg-slate-800/50' : ''
                  } ${isSelected ? 'bg-blue-600/20 ring-1 ring-blue-500' : ''}`}
                >
                  <span className={`text-xs md:text-sm font-medium mb-1 ${
                    !isCurrentMonth ? 'text-slate-600' : 'text-slate-300'
                  } ${todayClass ? 'bg-blue-600 text-white w-5 h-5 md:w-7 md:h-7 rounded-full flex items-center justify-center text-xs' : ''}`}>
                    {format(day, 'd')}
                  </span>
                  <div className="w-full space-y-0.5 md:space-y-1 overflow-hidden">
                    {dayEvents.slice(0, maxEvents).map(event => (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditEventModal(event)
                        }}
                        className="text-[10px] md:text-xs p-0.5 md:p-1 rounded truncate cursor-pointer hover:opacity-80"
                        style={{ backgroundColor: event.color + '30', color: event.color, borderLeft: `2px solid ${event.color}` }}
                      >
                        <span className="hidden md:inline">{event.title}</span>
                        <span className="md:hidden">•</span>
                      </div>
                    ))}
                    {dayEvents.length > maxEvents && (
                      <div className="text-[10px] md:text-xs text-slate-400 pl-0.5 md:pl-1">
                        +{dayEvents.length - maxEvents}
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Sidebar - Upcoming Events */}
        <div className="space-y-4 md:space-y-6 order-1 lg:order-2">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <CalendarIcon size={18} className="text-blue-400" />
              Upcoming
            </h3>
            {loading ? (
              <div className="text-slate-400 text-sm">Loading...</div>
            ) : upcomingEvents.length === 0 ? (
              <div className="text-slate-400 text-sm">No upcoming events</div>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map(event => (
                  <div
                    key={event.id}
                    onClick={() => openEditEventModal(event)}
                    className="p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div 
                        className="w-1 h-full rounded-full self-stretch"
                        style={{ backgroundColor: event.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-200 truncate">{event.title}</p>
                        <p className="text-sm text-slate-400 flex items-center gap-1 mt-1">
                          <Clock size={12} />
                          {format(parseISO(event.start), event.all_day ? 'MMM d' : 'MMM d, h:mm a')}
                        </p>
                        {event.location && (
                          <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin size={12} />
                            {event.location}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Category Legend */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Categories</h3>
            <div className="space-y-2">
              {Object.entries(categoryLabels).map(([key, label]) => (
                <div key={key} className="flex items-center gap-2 text-sm">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: categoryColors[key] }}
                  />
                  <span className="text-slate-300">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Event Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl w-full max-w-lg border border-slate-700">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-slate-100">
                {editingEvent ? 'Edit Event' : 'New Event'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Event title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={2}
                  placeholder="Optional description"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Start</label>
                  <input
                    type="datetime-local"
                    value={formData.start}
                    onChange={(e) => setFormData({ ...formData, start: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">End</label>
                  <input
                    type="datetime-local"
                    value={formData.end}
                    onChange={(e) => setFormData({ ...formData, end: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as 'family' | 'work' | 'personal' | 'health' | 'social' | 'other' })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="all_day"
                  checked={formData.all_day}
                  onChange={(e) => setFormData({ ...formData, all_day: e.target.checked })}
                  className="rounded bg-slate-700 border-slate-600 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="all_day" className="text-sm text-slate-300">All day event</label>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                {editingEvent ? (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                    Delete
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors"
                  >
                    {editingEvent ? 'Update' : 'Create'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
