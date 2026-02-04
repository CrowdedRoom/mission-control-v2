import { NextResponse } from 'next/server'
import { getActivity } from '@/lib/db'

export async function GET() {
  try {
    const activity = await getActivity()
    // Return only last 20 activities
    return NextResponse.json(activity.slice(0, 20))
  } catch (error) {
    console.error('Error fetching activity:', error)
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 })
  }
}
