import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function TodosPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: todos, error } = await supabase.from('todos').select()

  return (
    <main style={{ minHeight: '100vh', padding: 40, background: '#080B10', color: '#F8FAFC', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', background: '#0F172A', padding: 24, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
        <h1 style={{ fontSize: 22, marginBottom: 12, color: '#FFFFFF' }}>Supabase Quickstart Test (/todos)</h1>
        {error ? (
          <div style={{ color: '#FCA5A5', background: 'rgba(220, 38, 38, 0.15)', padding: 12, borderRadius: 8, border: '1px solid rgba(220, 38, 38, 0.3)', fontSize: 14 }}>
            Connected to new Supabase project (<code>{process.env.NEXT_PUBLIC_SUPABASE_URL}</code>).
            <p style={{ margin: '8px 0 0', fontSize: 13, color: '#CBD5E1' }}>
              Table &apos;todos&apos; does not exist yet. Run the AERIS schema migration or create a &apos;todos&apos; table in the Supabase SQL editor to test data retrieval.
            </p>
          </div>
        ) : todos && todos.length > 0 ? (
          <ul style={{ paddingLeft: 20, margin: '12px 0' }}>
            {todos.map((todo) => (
              <li key={todo.id} style={{ margin: '6px 0' }}>{todo.name}</li>
            ))}
          </ul>
        ) : (
          <p style={{ color: '#10B981', fontSize: 14 }}>Connected to new Supabase project successfully! 0 todos found.</p>
        )}
      </div>
    </main>
  )
}
