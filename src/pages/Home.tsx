import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase, type Article } from '../lib/supabase';
import { calculateReadTime } from '../utils/readTime';
import { stripHtml } from '../utils/html';
import { Sparkles, Clock, Bookmark } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Helmet } from 'react-helmet-async';

export function Home() {
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedType, setFeedType] = useState<'latest' | 'foryou' | 'saved'>('latest');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  useEffect(() => {
    async function fetchArticles() {
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) setArticles(data);

        // Fetch bookmarks if logged in
        if (user) {
          const { data: bookmarksData } = await supabase
            .from('bookmarks')
            .select('article_id')
            .eq('user_id', user.id);
          if (bookmarksData) {
            setBookmarkedIds(bookmarksData.map(b => b.article_id));
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchArticles();
  }, [user]);

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    articles.forEach(a => {
      if (a.category) cats.add(a.category);
    });
    return Array.from(cats).sort();
  }, [articles]);

  // Filter and shuffle
  const displayedArticles = useMemo(() => {
    let result = [...articles];

    // 0. Search by query
    if (searchQuery) {
      result = result.filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase()) || stripHtml(a.content).toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // 1. Filter by category
    if (selectedCategory) {
      result = result.filter(a => a.category === selectedCategory);
    }

    // 2. Sort or Shuffle or Saved
    if (feedType === 'saved') {
      result = result.filter(a => bookmarkedIds.includes(a.id));
    } else if (feedType === 'foryou') {
      // Fisher-Yates shuffle for random order
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
    } else {
      // Latest is already sorted by the database
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return result;
  }, [articles, feedType, selectedCategory, searchQuery, bookmarkedIds]);

  if (loading) {
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
      {displayedArticles.length === 0 ? (
        <div className="empty-state">
          <p>No articles found.</p>
        </div>
      ) : (
        <div className="article-list">
          {displayedArticles.map((article) => (
            <article key={article.id} className="article-card" style={{ padding: article.cover_image_url ? 0 : '24px', overflow: 'hidden' }}>
              {article.cover_image_url && (
                <Link viewTransition to={`/article/${article.id}`}>
                  <img src={article.cover_image_url} alt={article.title} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                </Link>
              )}
              <div style={{ padding: article.cover_image_url ? '20px' : 0 }}>
                <h2 className="article-card-title" style={{ marginTop: 0 }}>
                  <Link viewTransition to={`/article/${article.id}`}>{article.title}</Link>
                </h2>
              <div className="article-card-meta">
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
              </div>
                <p className="article-card-excerpt">
                  {article.excerpt || stripHtml(article.content.replace(/&nbsp;/g, ' '))}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
