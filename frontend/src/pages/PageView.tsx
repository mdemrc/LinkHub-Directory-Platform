import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Page } from '../types'
import { pagesApi } from '../lib/api'
import { FiFileText, FiHome, FiChevronRight } from 'react-icons/fi'
import SEO from '../components/SEO'

export default function PageView() {
  const { slug } = useParams<{ slug: string }>()
  const [page, setPage] = useState<Page | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchPage = async () => {
      if (!slug) return

      try {
        const response = await pagesApi.getBySlug(slug)
        setPage(response.data)
      } catch (error) {
        console.error('Failed to fetch page:', error)
        setError(true)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPage()
  }, [slug])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-lz-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !page) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <FiFileText className="text-gray-500" size={28} />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Page Not Found</h1>
        <p className="text-sm text-gray-400 mb-6">The requested page does not exist or has been removed.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-lz-accent hover:text-lz-accent/80 transition-colors"
        >
          <FiHome size={14} />
          Back to Home
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-8 sm:py-12 px-4 sm:px-0">
      <SEO
        title={page.title}
        description={`${page.title} - LinkHub`}
        ogType="article"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: page.title, url: `/page/${page.slug}` }
        ]}
      />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6">
        <Link to="/" className="hover:text-white transition-colors">Home</Link>
        <FiChevronRight size={12} />
        <span className="text-gray-300">{page.title}</span>
      </nav>

      {/* Header */}
      <div className="mb-8 pb-6 border-b border-white/10">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{page.title}</h1>
        <p className="text-xs text-gray-500">
          Last updated: {new Date(page.updatedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      {/* Content */}
      <article
        className="prose prose-invert prose-sm sm:prose-base max-w-none
          prose-headings:text-white prose-headings:font-bold
          prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-white/10
          prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3
          prose-p:text-gray-400 prose-p:leading-relaxed
          prose-a:text-lz-accent prose-a:no-underline hover:prose-a:underline
          prose-strong:text-white
          prose-li:text-gray-400 prose-li:leading-relaxed
          prose-ul:my-4 prose-ol:my-4
          prose-blockquote:border-lz-accent/50 prose-blockquote:bg-lz-accent/5 prose-blockquote:rounded-r-lg prose-blockquote:py-1
          prose-code:text-lz-accent prose-code:bg-white/5 prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm
          prose-pre:bg-[#0d1117] prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl
        "
        dangerouslySetInnerHTML={{ __html: page.content }}
      />
    </div>
  )
}
