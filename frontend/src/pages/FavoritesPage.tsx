import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { Favorite } from '../types'
import { favoritesApi } from '../lib/api'
import LinkCard from '../components/LinkCard'
import { FiHeart, FiSearch } from 'react-icons/fi'
import SEO from '../components/SEO'

export default function FavoritesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login')
      return
    }

    if (isAuthenticated) {
      fetchFavorites()
    }
  }, [isAuthenticated, authLoading])

  const fetchFavorites = async () => {
    try {
      const response = await favoritesApi.getAll()
      setFavorites(response.data)
    } catch (error) {
      console.error('Failed to fetch favorites:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFavoriteChange = (linkId: number, isFavorite: boolean) => {
    if (!isFavorite) {
      setFavorites(favorites.filter(f => f.linkId !== linkId))
    }
  }

  const filteredFavorites = searchQuery
    ? favorites.filter(f =>
        f.link?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.link?.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : favorites

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-lz-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SEO
        title="My Favorites"
        description="Your saved favorite links on LinkHub."
        noindex={true}
      />
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
          <FiHeart className="text-red-500" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{t('nav.favorites')}</h1>
          <p className="text-sm text-lz-muted">
            {favorites.length} saved links
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-lz-muted" size={18} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search your favorites..."
          className="w-full pl-10 pr-4 py-2.5 bg-lz-card border border-lz-border rounded-lg text-sm text-white placeholder-lz-muted focus:outline-none focus:border-lz-accent transition-colors"
        />
      </div>

      {/* Favorites List */}
      {filteredFavorites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFavorites.map((favorite) => (
            favorite.link && (
              <LinkCard
                key={favorite.id}
                link={{ ...favorite.link, isFavorite: true }}
                onFavoriteChange={handleFavoriteChange}
              />
            )
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-lz-card border border-lz-border rounded-lg">
          <FiHeart className="mx-auto text-lz-muted mb-4" size={48} />
          <h3 className="text-lg font-semibold text-white mb-2">
            {searchQuery ? 'No matches found' : 'No favorites yet'}
          </h3>
          <p className="text-sm text-lz-muted">
            {searchQuery
              ? 'Try a different search term'
              : 'Start adding links to your favorites by clicking the heart icon'}
          </p>
        </div>
      )}
    </div>
  )
}
