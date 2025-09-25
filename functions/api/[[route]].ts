// Cloudflare Pages Functions - API 엔드포인트
// Supabase 설정
const SUPABASE_URL = 'https://xzhbhrhihtfkuvcltpsw.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6aGJocmhpaHRma3V2Y2x0cHN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjcxNjQ5MjAsImV4cCI6MjA0Mjc0MDkyMH0.s-vJdCEAL2gKx7pqxH_yRSsO_aDm8gSNRNph_yYIpgM'

// CORS 헤더 설정
function addCorsHeaders(response: Response): Response {
  const newResponse = new Response(response.body, response)
  newResponse.headers.set('Access-Control-Allow-Origin', '*')
  newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey, x-client-info')
  return newResponse
}

// GET 요청 처리
export async function onRequestGet(context: any) {
  const { request } = context
  const url = new URL(request.url)
  const path = url.pathname.replace('/api/', '')

  try {
    let supabaseUrl: string
    
    switch (path) {
      case 'assignments':
        supabaseUrl = `${SUPABASE_URL}/rest/v1/assignments?select=*&order=assigned_at.desc`
        break
      case 'sessions':
        supabaseUrl = `${SUPABASE_URL}/rest/v1/sessions?select=*&order=created_at.desc`
        break
      case 'learning_guides':
        supabaseUrl = `${SUPABASE_URL}/rest/v1/learning_guides?select=*&limit=1`
        break
      case 'board_content':
        supabaseUrl = `${SUPABASE_URL}/rest/v1/board_content?select=*`
        break
      case 'stage_config':
        supabaseUrl = `${SUPABASE_URL}/rest/v1/stage_config?select=*`
        break
      default:
        return addCorsHeaders(new Response(JSON.stringify({ 
          message: 'API is working', 
          timestamp: new Date().toISOString() 
        }), {
          headers: { 'Content-Type': 'application/json' }
        }))
    }
    
    const response = await fetch(supabaseUrl, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Supabase error: ${response.status}`)
    }
    
    const data = await response.json()
    
    return addCorsHeaders(new Response(JSON.stringify({
      data: data,
      error: null
    }), {
      headers: { 'Content-Type': 'application/json' }
    }))
    
  } catch (error) {
    console.error(`API error for ${path}:`, error)
    return addCorsHeaders(new Response(JSON.stringify({
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }))
  }
}

// POST 요청 처리
export async function onRequestPost(context: any) {
  const { request } = context
  const url = new URL(request.url)
  const path = url.pathname.replace('/api/', '')

  try {
    const body = await request.text()
    
    let supabaseUrl: string
    
    switch (path) {
      case 'assignments':
        supabaseUrl = `${SUPABASE_URL}/rest/v1/assignments`
        break
      case 'sessions':
        supabaseUrl = `${SUPABASE_URL}/rest/v1/sessions`
        break
      default:
        return addCorsHeaders(new Response(JSON.stringify({
          error: '지원하지 않는 엔드포인트입니다'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }))
    }
    
    const response = await fetch(supabaseUrl, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: body
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Supabase error: ${response.status} - ${errorText}`)
    }
    
    const data = await response.json()
    
    return addCorsHeaders(new Response(JSON.stringify({
      data: data,
      error: null
    }), {
      headers: { 'Content-Type': 'application/json' }
    }))
    
  } catch (error) {
    console.error(`POST API error for ${path}:`, error)
    return addCorsHeaders(new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }))
  }
}

// OPTIONS 요청 처리 (CORS preflight)
export async function onRequestOptions(context: any) {
  return addCorsHeaders(new Response(null, { status: 200 }))
}