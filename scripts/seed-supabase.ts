/**
 * Supabase Data Migration Script
 * 
 * This script migrates data from static TypeScript files to Supabase.
 * 
 * Usage:
 *   1. Set up your .env.local file with Supabase credentials
 *   2. Run: npx tsx scripts/seed-supabase.ts
 */

import { createClient } from '@supabase/supabase-js'
import { projectsTimeline, projectsDetail } from '../data/projects'
import { events } from '../data/events'
import type { Database } from '../types/database'

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing Supabase credentials')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

// Create Supabase admin client
const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function seedProjectsTimeline() {
  console.log('\n📦 Seeding projects_timeline table...')
  
  const data = projectsTimeline.map(project => ({
    id: project.id,
    title: project.title,
    period: project.period,
    year: project.year,
    period_type: project.periodType,
    period_number: project.periodNumber,
    is_completed: project.isCompleted,
    description: project.description,
    tags: project.tags,
    category: project.category
  }))

  // @ts-expect-error - Supabase type inference issue with upsert
  const { data: inserted, error } = await supabase
    .from('projects_timeline')
    .upsert(data, { onConflict: 'id' })
    .select()

  if (error) {
    console.error('❌ Error seeding projects_timeline:', error.message)
    throw error
  }

  console.log(`✅ Successfully seeded ${inserted?.length || 0} projects to timeline`)
}

async function seedProjectsDetail() {
  console.log('\n📦 Seeding projects_detail table...')
  
  const data = Object.values(projectsDetail).map(project => ({
    id: project.id,
    title: project.title,
    subtitle: project.subtitle,
    period: project.period,
    duration: project.duration,
    role: project.role,
    team: project.team,
    description: project.description,
    tech_stack: project.techStack,
    achievements: project.achievements || null,
    key_features: project.keyFeatures || null,
    key_responsibilities: project.keyResponsibilities || null,
    business_goals: project.businessGoals || null,
    architecture_evolution: project.architectureEvolution || null,
    challenges: project.challenges || null,
    learnings: project.learnings || []
  }))

  // @ts-expect-error - Supabase type inference issue with upsert
  const { data: inserted, error } = await supabase
    .from('projects_detail')
    .upsert(data, { onConflict: 'id' })
    .select()

  if (error) {
    console.error('❌ Error seeding projects_detail:', error.message)
    throw error
  }

  console.log(`✅ Successfully seeded ${inserted?.length || 0} project details`)
}

async function seedEvents() {
  console.log('\n📦 Seeding events table...')
  
  const data = events.map(event => ({
    year: event.year,
    period_type: event.periodType,
    period_number: event.periodNumber,
    is_checked: event.isChecked,
    events: event.events
  }))

  // Clear existing events first
  const { error: deleteError } = await supabase
    .from('events')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

  if (deleteError) {
    console.warn('⚠️  Warning clearing events:', deleteError.message)
  }

  // @ts-expect-error - Supabase type inference issue with insert
  const { data: inserted, error } = await supabase
    .from('events')
    .insert(data)
    .select()

  if (error) {
    console.error('❌ Error seeding events:', error.message)
    throw error
  }

  console.log(`✅ Successfully seeded ${inserted?.length || 0} events`)
}

async function verifyData() {
  console.log('\n🔍 Verifying seeded data...')
  
  const { count: timelineCount, error: timelineError } = await supabase
    .from('projects_timeline')
    .select('*', { count: 'exact', head: true })

  const { count: detailCount, error: detailError } = await supabase
    .from('projects_detail')
    .select('*', { count: 'exact', head: true })

  const { count: eventsCount, error: eventsError } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })

  if (timelineError || detailError || eventsError) {
    console.error('❌ Error verifying data')
    return
  }

  console.log('\n📊 Database Statistics:')
  console.log(`  - Projects Timeline: ${timelineCount} records`)
  console.log(`  - Projects Detail: ${detailCount} records`)
  console.log(`  - Events: ${eventsCount} records`)
}

async function main() {
  console.log('🚀 Starting Supabase data migration...')
  console.log(`   URL: ${SUPABASE_URL}`)
  
  try {
    await seedProjectsTimeline()
    await seedProjectsDetail()
    await seedEvents()
    await verifyData()
    
    console.log('\n✨ Migration completed successfully!')
    console.log('\n💡 Next steps:')
    console.log('  1. Verify data in Supabase dashboard')
    console.log('  2. Update your components to fetch from Supabase')
    console.log('  3. Test the application')
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  }
}

main()
