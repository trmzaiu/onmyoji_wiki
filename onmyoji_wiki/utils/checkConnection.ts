import { useSupabase } from './useSupabase'

export async function checkConnection(): Promise<boolean> {
  const supabase = useSupabase()

  const { error } = await supabase.from('heroes').select('id').limit(1)

  if (error) {
    console.error('❌ Không thể kết nối đến Supabase:', error.message)
    return false
  }

  console.log('✅ Kết nối Supabase thành công')
  return true
}