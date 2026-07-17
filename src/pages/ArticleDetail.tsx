import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, type Article } from '../lib/supabase';
import 'react-quill-new/dist/quill.snow.css'; // Include quill styles for rendering
import { calculateReadTime } from '../utils/readTime';
import { LikeButton } from '../components/LikeButton';
import { ShareButton } from '../components/ShareButton';
import { BookmarkButton } from '../components/BookmarkButton';
import { Comments } from '../components/Comments';

import DOMPurify from 'dompurify';
import { Helmet } from 'react-helmet-async';
import { ReadingPreferences } from '../components/ReadingPreferences';

export function ArticleDetail() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif'>('sans');
  const [zenMode, setZenMode] = useState(false);

  useEffect(() => {
    if (zenMode) {
      document.body.classList.add('zen-mode');
    } else {
      document.body.classList.remove('zen-mode');
    }
    return () => document.body.classList.remove('zen-mode');
  }, [zenMode]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
      const clientHeight = document.documentElement.clientHeight || window.innerHeight;
      const windowHeight = scrollHeight - clientHeight;
      if (windowHeight <= 0) {
        setScrollProgress(0);
        return;
      }
      const scroll = (scrollTop / windowHeight) * 100;
      setScrollProgress(scroll);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    async function fetchArticle() {
      if (!id) return;
      
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (data) {
          setArticle(data);
        }
      } catch (error) {
        console.error('Error fetching article:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchArticle();
  }, [id]);

  if (loading) {
    return (
      <div className="container">
        <p className="empty-state">Loading article...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="container">
        <div className="empty-state">
          <h2>Article not found</h2>
          <p style={{ marginTop: '10px' }}>
            <Link viewTransition to="/">← Back to Home</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{article.title} - Gecko Space</title>
        <meta name="description" content={article.content.substring(0, 160).replace(/<[^>]*>?/gm, '') + '...'} />
        {article.cover_image_url && <meta property="og:image" content={article.cover_image_url} />}
      </Helmet>
      {/* Gecko Scroll Progress Bar */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          transform: `scaleX(${scrollProgress / 100})`,
          transformOrigin: 'left',
          height: '4px',
          backgroundColor: 'var(--accent-color)',
          zIndex: 9999,
          transition: 'transform 0.1s cubic-bezier(0.1, 0.7, 0.1, 1)',
          boxShadow: '0 0 10px var(--accent-color)'
        }} 
      />
      <div className="container">
      <div className="back-to-home-wrapper" style={{ marginBottom: '40px' }}>
        <Link viewTransition 
          to="/" 
          style={{ 
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--text-color)', 
            fontSize: '1rem',
            fontWeight: '600',
            padding: '8px 16px',
            borderRadius: '20px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            textDecoration: 'none',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(-4px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
        >
          <span style={{ fontSize: '1.2rem' }}>←</span> Back to Home
        </Link>
      </div>
      <article>
        <h1 className="article-title">{article.title}</h1>
        <div className="article-meta">
          {article.category && (
            <span style={{ 
              backgroundColor: 'var(--accent-color)', color: 'white', 
              padding: '2px 10px', borderRadius: '12px', marginRight: '10px', fontSize: '0.85rem' 
            }}>
              {article.category}
            </span>
          )}
          Published on {new Date(article.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
          <span style={{ margin: '0 8px' }}>•</span>
          {calculateReadTime(article.content)} min read
        </div>

        {article.cover_image_url && (
          <div style={{ marginBottom: '30px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <img 
              src={article.cover_image_url} 
              alt={article.title} 
              style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', display: 'block' }} 
            />
          </div>
        )}
        <div className="utility-bar" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginTop: '30px', marginBottom: '20px' }}>
          <ReadingPreferences 
            fontSize={fontSize} setFontSize={setFontSize}
            fontFamily={fontFamily} setFontFamily={setFontFamily}
            zenMode={zenMode} setZenMode={setZenMode}
          />
        </div>

        <div 
          className="article-content ql-editor" 
          style={{ fontSize: `${fontSize}px`, fontFamily: fontFamily === 'serif' ? 'Georgia, serif' : 'inherit', transition: 'font-size 0.3s ease', wordBreak: 'normal', overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content.replace(/&nbsp;/g, ' ')) }} 
        />
        
        <div className="like-share-buttons" style={{ marginTop: '40px', paddingBottom: '20px', display: 'flex', gap: '15px' }}>
          <LikeButton articleId={article.id} />
          <BookmarkButton articleId={article.id} />
          <ShareButton />
        </div>

        <div className="comments-section">
          <Comments articleId={article.id} />
        </div>
      </article>
    </div>
    </>
  );
}
