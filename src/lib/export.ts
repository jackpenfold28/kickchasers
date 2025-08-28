import { supabase } from '@/lib/supabase'

// These are stubs. If you already wired jsPDF/SheetJS, call those here.
export async function exportGamePdf(gameId:string){
  // TODO: pull events/players and build a pdf
  const { data: events } = await supabase.from('events').select('*').eq('game_id',gameId)
  console.log('PDF export for', gameId, events?.length, 'events')
  alert('Mock PDF export started (see console).')
}
export async function exportGameXlsx(gameId:string){
  const { data: events } = await supabase.from('events').select('*').eq('game_id',gameId)
  console.log('XLSX export for', gameId, events?.length, 'events')
  alert('Mock Excel export started (see console).')
}