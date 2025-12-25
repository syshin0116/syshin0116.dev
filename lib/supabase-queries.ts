/**
 * Supabase Data Queries
 * 
 * This module provides functions to fetch data from Supabase.
 * Falls back to static data if Supabase is not configured.
 */

import { supabase, isSupabaseConfigured } from './supabase'
import { projectsTimeline as staticProjectsTimeline, projectsDetail as staticProjectsDetail, ProjectTimeline, ProjectDetail } from '@/data/projects'
import { events as staticEvents } from '@/data/events'
import { Events } from '@/types/events'

/**
 * Fetch all projects for timeline view
 */
export async function getProjectsTimeline(): Promise<ProjectTimeline[]> {
  // Fall back to static data if Supabase is not configured
  if (!isSupabaseConfigured()) {
    console.warn('⚠️  Supabase not configured, using static data')
    return staticProjectsTimeline
  }

  try {
    const { data, error } = await supabase
      .from('projects_timeline')
      .select('*')
      .order('year', { ascending: false })
      .order('period_number', { ascending: false })

    if (error || !data) {
      console.error('Error fetching projects timeline:', error)
      return staticProjectsTimeline
    }

    // Transform database format to app format
    return (data as Array<{
      id: string
      title: string
      period: string
      year: number
      period_type: 'Q' | 'H'
      period_number: number
      is_completed: boolean
      description: string
      tags: string[]
      category: 'company' | 'personal'
    }>).map(project => ({
      id: project.id,
      title: project.title,
      period: project.period,
      year: project.year,
      periodType: project.period_type,
      periodNumber: project.period_number,
      isCompleted: project.is_completed,
      description: project.description,
      tags: project.tags,
      category: project.category
    }))
  } catch (error) {
    console.error('Error fetching projects timeline:', error)
    return staticProjectsTimeline
  }
}

/**
 * Fetch project detail by ID
 */
export async function getProjectDetail(projectId: string): Promise<ProjectDetail | null> {
  // Fall back to static data if Supabase is not configured
  if (!isSupabaseConfigured()) {
    console.warn('⚠️  Supabase not configured, using static data')
    return staticProjectsDetail[projectId] || null
  }

  try {
    const { data, error } = await supabase
      .from('projects_detail')
      .select('*')
      .eq('id', projectId)
      .single()

    if (error || !data) {
      console.error('Error fetching project detail:', error)
      return staticProjectsDetail[projectId] || null
    }

    // Transform database format to app format
    const project = data as {
      id: string
      title: string
      subtitle: string
      period: string
      duration: string
      role: string
      team: string
      description: string
      tech_stack: unknown
      achievements?: unknown
      key_features?: unknown
      key_responsibilities?: unknown
      business_goals?: unknown
      architecture_evolution?: unknown
      challenges?: unknown
      learnings: string[]
    }
    
    return {
      id: project.id,
      title: project.title,
      subtitle: project.subtitle,
      period: project.period,
      duration: project.duration,
      role: project.role,
      team: project.team,
      description: project.description,
      techStack: project.tech_stack as ProjectDetail['techStack'],
      achievements: project.achievements as ProjectDetail['achievements'],
      keyFeatures: project.key_features as ProjectDetail['keyFeatures'],
      keyResponsibilities: project.key_responsibilities as ProjectDetail['keyResponsibilities'],
      businessGoals: project.business_goals as ProjectDetail['businessGoals'],
      architectureEvolution: project.architecture_evolution as ProjectDetail['architectureEvolution'],
      challenges: project.challenges as ProjectDetail['challenges'],
      learnings: project.learnings
    }
  } catch (error) {
    console.error('Error fetching project detail:', error)
    return staticProjectsDetail[projectId] || null
  }
}

/**
 * Fetch all project details (for generateStaticParams)
 */
export async function getAllProjectsDetail(): Promise<Record<string, ProjectDetail>> {
  // Fall back to static data if Supabase is not configured
  if (!isSupabaseConfigured()) {
    console.warn('⚠️  Supabase not configured, using static data')
    return staticProjectsDetail
  }

  try {
    const { data, error } = await supabase
      .from('projects_detail')
      .select('*')

    if (error || !data) {
      console.error('Error fetching all projects detail:', error)
      return staticProjectsDetail
    }

    // Transform database format to app format
    const projectsMap: Record<string, ProjectDetail> = {}
    const projects = data as Array<{
      id: string
      title: string
      subtitle: string
      period: string
      duration: string
      role: string
      team: string
      description: string
      tech_stack: unknown
      achievements?: unknown
      key_features?: unknown
      key_responsibilities?: unknown
      business_goals?: unknown
      architecture_evolution?: unknown
      challenges?: unknown
      learnings: string[]
    }>
    
    projects.forEach(project => {
      projectsMap[project.id] = {
        id: project.id,
        title: project.title,
        subtitle: project.subtitle,
        period: project.period,
        duration: project.duration,
        role: project.role,
        team: project.team,
        description: project.description,
        techStack: project.tech_stack as ProjectDetail['techStack'],
        achievements: project.achievements as ProjectDetail['achievements'],
        keyFeatures: project.key_features as ProjectDetail['keyFeatures'],
        keyResponsibilities: project.key_responsibilities as ProjectDetail['keyResponsibilities'],
        businessGoals: project.business_goals as ProjectDetail['businessGoals'],
        architectureEvolution: project.architecture_evolution as ProjectDetail['architectureEvolution'],
        challenges: project.challenges as ProjectDetail['challenges'],
        learnings: project.learnings
      }
    })

    return projectsMap
  } catch (error) {
    console.error('Error fetching all projects detail:', error)
    return staticProjectsDetail
  }
}

/**
 * Fetch all events for timeline
 */
export async function getEvents(): Promise<Events> {
  // Fall back to static data if Supabase is not configured
  if (!isSupabaseConfigured()) {
    console.warn('⚠️  Supabase not configured, using static data')
    return staticEvents
  }

  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('year', { ascending: false })
      .order('period_number', { ascending: false })

    if (error || !data) {
      console.error('Error fetching events:', error)
      return staticEvents
    }

    // Transform database format to app format
    return (data as Array<{
      year: number
      period_type: 'Q' | 'H'
      period_number: number
      is_checked: boolean
      events: unknown
    }>).map(event => ({
      year: event.year,
      periodType: event.period_type,
      periodNumber: event.period_number,
      isChecked: event.is_checked,
      events: event.events as Events[0]['events']
    }))
  } catch (error) {
    console.error('Error fetching events:', error)
    return staticEvents
  }
}
