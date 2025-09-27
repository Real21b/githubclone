import { useState, useEffect, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSocket } from '../contexts/SocketContext'
import { apolloClient } from '../lib/apollo-client'
import toast from 'react-hot-toast'

// 🚀 Optimized Data Fetching Hook for Microservices
export function useOptimizedDataFetching() {
  const queryClient = useQueryClient()
  const { socket, isConnected } = useSocket()

  // 📊 Repository Data with Real-time Updates
  const useRepositoryData = (repoId: string) => {
    const [isWatching, setIsWatching] = useState<boolean | null>(null)
    const [isStarred, setIsStarred] = useState<boolean | null>(null)

    // Static repository data (cached)
    const { data: repoData, isLoading: repoLoading } = useQuery({
      queryKey: ['repository', repoId],
      queryFn: async () => {
        const response = await apolloClient.query({
          query: GET_REPOSITORY,
          variables: { id: repoId },
          fetchPolicy: 'cache-first' // Use cache first
        })
        return response.data.repository
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    })

    // User-specific data (always fresh)
    const { data: userData, isLoading: userLoading } = useQuery({
      queryKey: ['user-repo-status', repoId],
      queryFn: async () => {
        const response = await fetch(`/api/user/repo-status?repoId=${repoId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        return response.json()
      },
      enabled: !!repoId,
      staleTime: 30 * 1000, // 30 seconds
      refetchOnWindowFocus: true
    })

    // Real-time updates via WebSocket
    useEffect(() => {
      if (!socket || !isConnected || !repoId) return

      const handleRepoUpdate = (data: any) => {
        if (data.repositoryId === repoId) {
          // Invalidate and refetch repository data
          queryClient.invalidateQueries(['repository', repoId])
          toast.success('Repository updated!')
        }
      }

      const handleStarUpdate = (data: any) => {
        if (data.repositoryId === repoId) {
          setIsStarred(data.isStarred)
          queryClient.invalidateQueries(['repository', repoId])
        }
      }

      const handleWatchUpdate = (data: any) => {
        if (data.repositoryId === repoId) {
          setIsWatching(data.isWatching)
        }
      }

      socket.on('repository-updated', handleRepoUpdate)
      socket.on('star-updated', handleStarUpdate)
      socket.on('watch-updated', handleWatchUpdate)

      return () => {
        socket.off('repository-updated', handleRepoUpdate)
        socket.off('star-updated', handleStarUpdate)
        socket.off('watch-updated', handleWatchUpdate)
      }
    }, [socket, isConnected, repoId, queryClient])

    // Update local state when user data changes
    useEffect(() => {
      if (userData) {
        setIsWatching(userData.isWatching)
        setIsStarred(userData.isStarred)
      }
    }, [userData])

    return {
      repoData,
      isWatching,
      isStarred,
      isLoading: repoLoading || userLoading,
      userData
    }
  }

  // 👤 User Profile Data with Optimized Caching
  const useUserProfile = (userId: string) => {
    const { data: profile, isLoading } = useQuery({
      queryKey: ['user-profile', userId],
      queryFn: async () => {
        const response = await apolloClient.query({
          query: GET_USER_PROFILE,
          variables: { id: userId },
          fetchPolicy: 'cache-first'
        })
        return response.data.user
      },
      staleTime: 10 * 60 * 1000, // 10 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
    })

    // Real-time profile updates
    useEffect(() => {
      if (!socket || !isConnected || !userId) return

      const handleProfileUpdate = (data: any) => {
        if (data.userId === userId) {
          queryClient.invalidateQueries(['user-profile', userId])
        }
      }

      socket.on('profile-updated', handleProfileUpdate)

      return () => {
        socket.off('profile-updated', handleProfileUpdate)
      }
    }, [socket, isConnected, userId, queryClient])

    return { profile, isLoading }
  }

  // 📋 Issues List with Pagination and Real-time Updates
  const useIssuesList = (repoId: string, page: number = 1) => {
    const [issues, setIssues] = useState<any[]>([])

    const { data, isLoading, fetchNextPage, hasNextPage } = useQuery({
      queryKey: ['issues', repoId, page],
      queryFn: async ({ pageParam = 1 }) => {
        const response = await apolloClient.query({
          query: GET_ISSUES,
          variables: { 
            repositoryId: repoId,
            page: pageParam,
            limit: 20
          }
        })
        return response.data.issues
      },
      getNextPageParam: (lastPage) => lastPage.hasNextPage ? lastPage.page + 1 : undefined,
      staleTime: 2 * 60 * 1000, // 2 minutes
    })

    // Real-time issue updates
    useEffect(() => {
      if (!socket || !isConnected || !repoId) return

      const handleNewIssue = (data: any) => {
        if (data.repositoryId === repoId) {
          setIssues(prev => [data.issue, ...prev])
          toast.success('New issue created!')
        }
      }

      const handleIssueUpdate = (data: any) => {
        if (data.repositoryId === repoId) {
          setIssues(prev => prev.map(issue => 
            issue.id === data.issue.id ? { ...issue, ...data.issue } : issue
          ))
        }
      }

      socket.on('new-issue', handleNewIssue)
      socket.on('issue-updated', handleIssueUpdate)

      return () => {
        socket.off('new-issue', handleNewIssue)
        socket.off('issue-updated', handleIssueUpdate)
      }
    }, [socket, isConnected, repoId])

    // Flatten paginated data
    const allIssues = useMemo(() => {
      if (!data?.pages) return []
      return data.pages.flatMap(page => page.issues)
    }, [data])

    return {
      issues: allIssues,
      isLoading,
      fetchNextPage,
      hasNextPage
    }
  }

  // 🔄 Optimized Mutations
  const useOptimizedMutations = () => {
    const queryClient = useQueryClient()

    const starRepository = useMutation({
      mutationFn: async ({ repoId, isStarred }: { repoId: string, isStarred: boolean }) => {
        const response = await fetch(`/api/repositories/${repoId}/star`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ isStarred })
        })
        return response.json()
      },
      onMutate: async ({ repoId, isStarred }) => {
        // Optimistic update
        await queryClient.cancelQueries(['repository', repoId])
        const previousData = queryClient.getQueryData(['repository', repoId])
        
        queryClient.setQueryData(['repository', repoId], (old: any) => ({
          ...old,
          isStarred,
          starCount: old.starCount + (isStarred ? 1 : -1)
        }))

        return { previousData }
      },
      onError: (err, variables, context) => {
        // Rollback on error
        if (context?.previousData) {
          queryClient.setQueryData(['repository', variables.repoId], context.previousData)
        }
        toast.error('Failed to update star status')
      },
      onSuccess: (data, variables) => {
        // Broadcast via WebSocket
        if (socket && isConnected) {
          socket.emit('star-repository', {
            repositoryId: variables.repoId,
            isStarred: variables.isStarred
          })
        }
        toast.success(variables.isStarred ? 'Repository starred!' : 'Repository unstarred!')
      }
    })

    const watchRepository = useMutation({
      mutationFn: async ({ repoId, isWatching }: { repoId: string, isWatching: boolean }) => {
        const response = await fetch(`/api/repositories/${repoId}/watch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ isWatching })
        })
        return response.json()
      },
      onSuccess: (data, variables) => {
        if (socket && isConnected) {
          socket.emit('watch-repository', {
            repositoryId: variables.repoId,
            isWatching: variables.isWatching
          })
        }
        toast.success(variables.isWatching ? 'Watching repository!' : 'Stopped watching repository!')
      }
    })

    return {
      starRepository,
      watchRepository
    }
  }

  // 📊 Performance Monitoring
  const usePerformanceMonitoring = () => {
    useEffect(() => {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            console.log('Page load time:', entry.loadEventEnd - entry.loadEventStart)
          }
          if (entry.entryType === 'resource') {
            console.log('Resource load time:', entry.duration)
          }
        }
      })

      observer.observe({ entryTypes: ['navigation', 'resource'] })

      return () => observer.disconnect()
    }, [])
  }

  return {
    useRepositoryData,
    useUserProfile,
    useIssuesList,
    useOptimizedMutations,
    usePerformanceMonitoring
  }
}

// GraphQL Queries
const GET_REPOSITORY = `
  query GetRepository($id: ID!) {
    repository(id: $id) {
      id
      name
      description
      starCount
      forkCount
      watchCount
      isPublic
      createdAt
      updatedAt
      owner {
        id
        username
        avatar
      }
    }
  }
`

const GET_USER_PROFILE = `
  query GetUserProfile($id: ID!) {
    user(id: $id) {
      id
      username
      email
      avatar
      bio
      location
      website
      createdAt
      repositories {
        id
        name
        description
        starCount
      }
    }
  }
`

const GET_ISSUES = `
  query GetIssues($repositoryId: ID!, $page: Int!, $limit: Int!) {
    issues(repositoryId: $repositoryId, page: $page, limit: $limit) {
      issues {
        id
        title
        description
        status
        priority
        createdAt
        author {
          id
          username
          avatar
        }
      }
      hasNextPage
      page
    }
  }
`
