'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Calendar</h1>
          <p className="text-slate-400">Schedule and important dates.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors">
          <Plus size={18} />
          Add Event
        </button>
      </div>

      {/* Calendar */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
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
          {weekDays.map(day => (
            <div key={day} className="p-3 text-center text-sm font-medium text-slate-400">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const isToday = isSameDay(day, new Date())
            const isSelected = selectedDate && isSameDay(day, selectedDate)
            
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`aspect-square p-2 border-b border-r border-slate-700/50 hover:bg-slate-700/50 transition-colors flex flex-col items-start ${
                  !isSameMonth(day, currentDate) ? 'text-slate-600' : 'text-slate-300'
                } ${isSelected ? 'bg-blue-600/20 border-blue-500' : ''}`}
                style={{
                  gridColumn: index === 0 ? monthStart.getDay() + 1 : undefined
                }}
              >
                <span className={`text-sm font-medium ${
                  isToday ? 'bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center' : ''
                }`}>
                  {format(day, 'd')}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="mt-8 bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">Upcoming</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-4 p-3 bg-slate-700/50 rounded-lg">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400 font-bold">
              3
            </div>
            <div>
              <p className="font-medium text-slate-200">Trail Blazers Game</p>
              <p className="text-sm text-slate-400">Tonight • Moda Center</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
