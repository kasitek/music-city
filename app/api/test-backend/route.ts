import { NextResponse } from 'next/server'
import { listArtists, resetActor } from '@/lib/ic/backend'

export async function GET() {
  try {
    console.log('[API] Testing backend connection...')
    
    // Reset actor to ensure fresh connection
    resetActor()
    
    console.log('[API] Environment variables:', {
      NEXT_PUBLIC_DFX_NETWORK: process.env.NEXT_PUBLIC_DFX_NETWORK,
      NEXT_PUBLIC_IC_HOST: process.env.NEXT_PUBLIC_IC_HOST,
      NEXT_PUBLIC_MUSIC_CITY_BACKEND_CANISTER_ID: process.env.NEXT_PUBLIC_MUSIC_CITY_BACKEND_CANISTER_ID
    })
    
    const artists = await listArtists()
    
    return NextResponse.json({
      success: true,
      message: 'Backend connection successful',
      data: artists,
      count: Array.isArray(artists) ? artists.length : 0
    })
    
  } catch (error: any) {
    console.error('[API] Backend test failed:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Backend connection failed',
      error: error?.message || String(error),
      details: {
        name: error?.name,
        stack: error?.stack?.split('\n').slice(0, 5) // First 5 lines of stack
      }
    }, { status: 500 })
  }
}