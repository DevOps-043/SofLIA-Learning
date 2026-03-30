'use client'

import { useState, useEffect } from 'react'
import { InstructorNews, InstructorNewsService, NewsStats } from '../services/instructorNews.service'

export function useInstructorNews() {
  const [news, setNews] = useState<InstructorNews[]>([])
  const [stats, setStats] = useState<NewsStats>({
    totalNews: 0,
    publishedNews: 0,
    draftNews: 0,
    archivedNews: 0,
    totalViews: 0,
    totalComments: 0,
    averageViews: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [newsData, statsData] = await Promise.all([
        InstructorNewsService.getNews(),
        InstructorNewsService.getNewsStats()
      ])

      setNews(newsData)
      setStats(statsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }

  const createNews = async (newsData: Partial<InstructorNews>) => {
    try {
      const newNews = await InstructorNewsService.createNews(newsData)
      
      // Actualizar estado local sin recargar
      setNews(prevNews => [newNews, ...prevNews])
      setStats(prevStats => ({
        ...prevStats,
        totalNews: prevStats.totalNews + 1,
        publishedNews: prevStats.publishedNews + (newNews.status === 'published' ? 1 : 0),
        draftNews: prevStats.draftNews + (newNews.status === 'draft' ? 1 : 0),
        archivedNews: prevStats.archivedNews + (newNews.status === 'archived' ? 1 : 0)
      }))
      
      return newNews
    } catch (err) {
      throw err
    }
  }

  const updateNews = async (newsId: string, newsData: Partial<InstructorNews>) => {
    try {
      const updatedNews = await InstructorNewsService.updateNews(newsId, newsData)
      
      // Actualizar estado local sin recargar
      setNews(prevNews => 
        prevNews.map(news => 
          news.id === newsId ? { ...news, ...updatedNews } : news
        )
      )
      
      return updatedNews
    } catch (err) {
      throw err
    }
  }

  const deleteNews = async (newsId: string) => {
    try {
      await InstructorNewsService.deleteNews(newsId)
      
      // Actualizar estado local sin recargar
      const deletedNews = news.find(newsItem => newsItem.id === newsId)
      if (deletedNews) {
        setNews(prevNews => prevNews.filter(newsItem => newsItem.id !== newsId))
        setStats(prevStats => ({
          ...prevStats,
          totalNews: prevStats.totalNews - 1,
          publishedNews: prevStats.publishedNews - (deletedNews.status === 'published' ? 1 : 0),
          draftNews: prevStats.draftNews - (deletedNews.status === 'draft' ? 1 : 0),
          archivedNews: prevStats.archivedNews - (deletedNews.status === 'archived' ? 1 : 0)
        }))
      }
    } catch (err) {
      throw err
    }
  }

  const toggleNewsStatus = async (newsId: string, status: 'draft' | 'published' | 'archived') => {
    try {
      await InstructorNewsService.toggleNewsStatus(newsId, status)
      
      // Actualizar estado local sin recargar
      setNews(prevNews => 
        prevNews.map(newsItem => 
          newsItem.id === newsId ? { ...newsItem, status } : newsItem
        )
      )
      
      // Actualizar estadísticas
      setStats(prevStats => {
        const newsItem = news.find(n => n.id === newsId)
        if (!newsItem) return prevStats
        
        const newStats = { ...prevStats }
        
        // Restar del estado anterior
        if (newsItem.status === 'published') newStats.publishedNews--
        else if (newsItem.status === 'draft') newStats.draftNews--
        else if (newsItem.status === 'archived') newStats.archivedNews--
        
        // Sumar al nuevo estado
        if (status === 'published') newStats.publishedNews++
        else if (status === 'draft') newStats.draftNews++
        else if (status === 'archived') newStats.archivedNews++
        
        return newStats
      })
    } catch (err) {
      throw err
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return {
    news,
    stats,
    isLoading,
    error,
    refetch: fetchData,
    createNews,
    updateNews,
    deleteNews,
    toggleNewsStatus
  }
}

