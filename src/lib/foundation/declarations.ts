import type {SupabaseClient} from '@supabase/supabase-js'

export const FOUNDATION_DECLARATION_PAGE_SIZE = 500

/** Read every page; never present a partial result as the complete statistics. */
export async function listFoundationDeclarations(database: SupabaseClient) {
  const rows: Record<string, unknown>[] = []

  for (let offset = 0; ; offset += FOUNDATION_DECLARATION_PAGE_SIZE) {
    const {data, error} = await database
      .from('foundation_interest_declarations')
      .select('*')
      .order('created_at', {ascending: true})
      .order('id', {ascending: true})
      .range(offset, offset + FOUNDATION_DECLARATION_PAGE_SIZE - 1)

    if (error) return {data: null, error}
    const page = data ?? []
    rows.push(...page)
    if (page.length < FOUNDATION_DECLARATION_PAGE_SIZE) return {data: rows, error: null}
  }
}
