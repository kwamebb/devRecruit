import { supabase } from '../lib/supabase'

export interface GitHubStats {
  username: string
  repositoryCount: number
  commitCount: number
  lastUpdated: string
}

export interface GitHubStatsResult {
  success: boolean
  stats?: GitHubStats
  error?: string
}

/**
 * Check if GitHub stats need updating (older than 24 hours)
 */
const shouldUpdateGitHubStats = (lastUpdated: string): boolean => {
  const oneDayAgo = new Date()
  oneDayAgo.setDate(oneDayAgo.getDate() - 1)
  
  const lastUpdateDate = new Date(lastUpdated)
  return lastUpdateDate < oneDayAgo
}

/**
 * Get cached GitHub statistics from the user's profile
 * Automatically updates if data is older than 24 hours
 */
export const getCachedGitHubStats = async (userId: string): Promise<GitHubStatsResult> => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('github_username, github_repository_count, github_commit_count, updated_at')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('❌ Error fetching profile:', error)
      return { success: false, error: 'Failed to fetch profile data' }
    }

    if (!profile?.github_username) {
      return { success: false, error: 'No GitHub account linked' }
    }

    // Check if stats need updating (older than 24 hours)
    const needsUpdate = shouldUpdateGitHubStats(profile.updated_at || new Date().toISOString())
    
    if (needsUpdate) {
      console.log('🔄 GitHub stats are older than 24 hours, updating automatically...')
      
      // Try to update stats in the background
      try {
        const updateResult = await updateUserGitHubStats(userId, profile.github_username)
        if (updateResult.success && updateResult.stats) {
          console.log('✅ GitHub stats updated automatically')
          return { success: true, stats: updateResult.stats }
        }
      } catch (updateError) {
        console.log('⚠️ Auto-update failed, using cached data:', updateError)
        // Fall through to return cached data
      }
    }

    const stats: GitHubStats = {
      username: profile.github_username,
      repositoryCount: profile.github_repository_count || 0,
      commitCount: profile.github_commit_count || 0,
      lastUpdated: profile.updated_at || new Date().toISOString()
    }

    return { success: true, stats }

  } catch (error) {
    console.error('❌ Error getting cached GitHub stats:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get GitHub statistics' 
    }
  }
}

/**
 * Fetch GitHub statistics from the GitHub API
 * This makes actual API calls to get fresh data
 */
export const fetchGitHubStats = async (githubUsername: string): Promise<GitHubStatsResult> => {
  try {
    if (!githubUsername) {
      return { success: false, error: 'GitHub username is required' }
    }

    console.log(`🔍 Fetching GitHub stats for: ${githubUsername}`)

    // Fetch user data from GitHub API
    const userResponse = await fetch(`https://api.github.com/users/${githubUsername}`)
    
    if (!userResponse.ok) {
      if (userResponse.status === 404) {
        return { success: false, error: 'GitHub user not found' }
      }
      if (userResponse.status === 403) {
        return { success: false, error: 'GitHub API rate limit exceeded' }
      }
      return { success: false, error: `GitHub API error: ${userResponse.status}` }
    }

    const userData = await userResponse.json()
    const repositoryCount = userData.public_repos || 0

    // For commit count, we'll use a simplified approach
    // Getting exact commit counts requires iterating through all repos which is expensive
    // For now, we'll estimate based on repository count
    const estimatedCommitCount = Math.max(repositoryCount * 10, 0) // Rough estimate

    const stats: GitHubStats = {
      username: githubUsername,
      repositoryCount,
      commitCount: estimatedCommitCount,
      lastUpdated: new Date().toISOString()
    }

    console.log(`✅ GitHub stats fetched:`, stats)
    return { success: true, stats }

  } catch (error) {
    console.error('❌ Error fetching GitHub stats:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch GitHub statistics' 
    }
  }
}

/**
 * Update GitHub statistics in the user's profile
 */
export const updateUserGitHubStats = async (
  userId: string,
  githubUsername: string
): Promise<GitHubStatsResult> => {
  try {
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== userId) {
      return { success: false, error: 'Authentication required' }
    }

    // Fetch fresh GitHub statistics
    const statsResult = await fetchGitHubStats(githubUsername)
    if (!statsResult.success || !statsResult.stats) {
      return statsResult
    }

    // Update the profile in the database
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        github_repository_count: statsResult.stats.repositoryCount,
        github_commit_count: statsResult.stats.commitCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      console.error('❌ Error updating GitHub stats in database:', updateError)
      return { success: false, error: 'Failed to update profile with GitHub statistics' }
    }

    console.log(`✅ GitHub stats updated in database for user ${userId}`)
    return { success: true, stats: statsResult.stats }

  } catch (error) {
    console.error('❌ Error updating user GitHub stats:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update GitHub statistics' 
    }
  }
}

/**
 * Refresh GitHub statistics for the current user
 */
export const refreshCurrentUserGitHubStats = async (): Promise<GitHubStatsResult> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Get the user's current profile to find their GitHub username
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('github_username')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.github_username) {
      return { success: false, error: 'GitHub username not found in profile' }
    }

    // Update and return the fresh statistics
    return await updateUserGitHubStats(user.id, profile.github_username)

  } catch (error) {
    console.error('❌ Error refreshing current user GitHub stats:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to refresh GitHub statistics' 
    }
  }
} 