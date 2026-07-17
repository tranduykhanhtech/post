import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase, type Article } from '../lib/supabase';
import { calculateReadTime } from '../utils/readTime';
import { stripHtml } from '../utils/html';
import { Sparkles, Clock, Bookmark, Loader2, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Helmet } from 'react-helmet-async';
import { getCoverPosition, extractBaseUrl } from '../utils/imagePosition';

const PAGE_SIZE = 10;

export function Home() {
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  const [feedType, setFeedType] = useState<'latest' | 'foryou' | 'saved'>('latest');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  // 1. Fetch all distinct categories on mount
  useEffect(() => {
    supabase.from('articles').select('category').then(({ data }) => {
      if (data) {
        const cats = new Set<string>();
        data.forEach(d => {
          if (d.category) cats.add(d.category);
        });
        setCategories(Array.from(cats).sort());
      }
    });
  }, []);

  // 2. Fetch Articles with Pagination & Filters
  const loadArticles = async (pageNum: number, reset: boolean = false) => {
    try {
      let query = supabase.from('articles').select('*');

      // Apply Filters
      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
      }
      if (feedType === 'saved' && user) {
        const { data: bData } = await supabase.from('bookmarks').select('article_id').eq('user_id', user.id);
        const bIds = bData ? bData.map(b => b.article_id) : [];
        if (bIds.length === 0) {
          if (reset) setArticles([]);
          setHasMore(false);
          return;
        }
        query = query.in('id', bIds);
      }

      // Apply Sort
      // For "foryou", without backend RPC, we just fallback to latest for now, or randomize client-side later.
      query = query.order('created_at', { ascending: false });

      // Apply Pagination
      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      query = query.range(from, to);

      const { data, error } = await query;
      if (error) throw error;

      if (data) {
        if (data.length < PAGE_SIZE) setHasMore(false);
        else setHasMore(true);

        // If Foryou, shuffle the fetched page
        if (feedType === 'foryou') {
          for (let i = data.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [data[i], data[j]] = [data[j], data[i]];
          }
        }

        if (reset) {
          setArticles(data);
        } else {
          setArticles(prev => {
            const newIds = data.map(d => d.id);
            const filteredPrev = prev.filter(p => !newIds.includes(p.id));
            return [...filteredPrev, ...data];
          });
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  // Reset and fetch when filters change
  useEffect(() => {
    async function fetchInitial() {
      setLoading(true);
      setPage(0);
      setHasMore(true);
      await loadArticles(0, true);
      setLoading(false);
    }
    fetchInitial();
  }, [searchQuery, selectedCategory, feedType, user]);

  const handleLoadMore = async () => {
    setIsFetchingMore(true);
    const nextPage = page + 1;
    await loadArticles(nextPage, false);
    setPage(nextPage);
    setIsFetchingMore(false);
  };

  if (loading && page === 0) {
    return (
      <div className="container">
        <p className="empty-state">Loading articles...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <Helmet>
        <title>Gecko Space - Trang chủ</title>
        <meta name="description" content="Chào mừng đến với Gecko Space - Nơi chia sẻ kiến thức và đam mê." />
      </Helmet>
      {/* Header Controls */}
      <div style={{ marginBottom: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Header Tabs */}
        <div className="scrollable-tabs" style={{ display: 'flex', gap: '25px', marginBottom: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px' }}>
          <button 
            onClick={() => setFeedType('latest')}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '1.1rem', fontWeight: feedType === 'latest' ? 'bold' : 'normal',
              color: feedType === 'latest' ? 'var(--text-color)' : 'var(--text-light)',
            }}
          >
            <Clock size={18} /> Mới nhất
          </button>
          <button 
            onClick={() => setFeedType('foryou')}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '1.1rem', fontWeight: feedType === 'foryou' ? 'bold' : 'normal',
              color: feedType === 'foryou' ? 'var(--accent-color)' : 'var(--text-light)',
            }}
          >
            <Sparkles size={18} /> Dành cho bạn
          </button>
          {user && (
            <button 
              onClick={() => setFeedType('saved')}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '1.1rem', fontWeight: feedType === 'saved' ? 'bold' : 'normal',
                color: feedType === 'saved' ? 'var(--text-color)' : 'var(--text-light)',
              }}
            >
              <Bookmark size={18} /> Đã lưu
            </button>
          )}
        </div>

        {/* Search Results indicator */}
        {searchQuery && (
          <div style={{ padding: '10px 15px', backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            Showing results for: <strong>"{searchQuery}"</strong>
          </div>
        )}

        {/* Categories Pill */}
        {categories.length > 0 && (
          <div className="scrollable-tabs" style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setSelectedCategory(null)}
              style={{
                padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border-color)',
                cursor: 'pointer', fontSize: '0.9rem',
                backgroundColor: selectedCategory === null ? 'var(--text-color)' : 'var(--bg-card)',
                color: selectedCategory === null ? 'var(--bg-color)' : 'var(--text-color)',
                transition: 'all 0.2s'
              }}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border-color)',
                  cursor: 'pointer', fontSize: '0.9rem',
                  backgroundColor: selectedCategory === cat ? 'var(--text-color)' : 'var(--bg-card)',
                  color: selectedCategory === cat ? 'var(--bg-color)' : 'var(--text-color)',
                  transition: 'all 0.2s'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Article List */}
      {articles.length === 0 ? (
        <div className="empty-state">
          <p>No articles found.</p>
        </div>
      ) : (
        <div className="article-list">
          {articles.map((article, index) => (
            <article 
              key={article.id} 
              className={`article-card fade-in-up ${index === 0 && !searchQuery && !selectedCategory ? 'hero-article' : ''}`} 
              style={{ padding: article.cover_image_url ? 0 : '24px', animationDelay: `${index * 0.1}s` }}
            >
              {article.cover_image_url && (
                <Link viewTransition to={`/article/${article.id}`}>
                  <img src={extractBaseUrl(article.cover_image_url)} alt={article.title} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', objectPosition: getCoverPosition(article.cover_image_url) }} />
                </Link>
              )}
              <div style={{ padding: article.cover_image_url ? '20px' : 0 }}>
                <h2 className="article-card-title" style={{ marginTop: 0 }}>
                  <Link viewTransition to={`/article/${article.id}`}>{article.title}</Link>
                </h2>
              <div className="article-card-meta" style={{ display: 'flex', alignItems: 'center' }}>
                {article.category && (
                  <span style={{ 
                    backgroundColor: 'var(--accent-color)', color: 'white', 
                    padding: '2px 8px', borderRadius: '12px', marginRight: '10px', fontSize: '0.8rem' 
                  }}>
                    {article.category}
                  </span>
                )}
                {new Date(article.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
                <span style={{ margin: '0 8px' }}>•</span>
                {calculateReadTime(article.content)} min read
                <span style={{ margin: '0 8px' }}>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }} title={`${article.views || 0} views`}>
                  <Eye size={14} /> {article.views || 0}
                </span>
              </div>
                <p className="article-card-excerpt">
                  {article.excerpt || stripHtml(article.content.replace(/&nbsp;/g, ' '))}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && articles.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: '40px', paddingBottom: '40px' }}>
          <button 
            onClick={handleLoadMore}
            disabled={isFetchingMore}
            style={{
              padding: '12px 30px',
              borderRadius: '25px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-color)',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: isFetchingMore ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'all 0.2s',
              boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
            }}
          >
            {isFetchingMore ? (
              <>
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                Loading...
              </>
            ) : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
