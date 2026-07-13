import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Bookmark } from 'lucide-react';
import toast from 'react-hot-toast';

interface BookmarkButtonProps {
  articleId: string;
}

export function BookmarkButton({ articleId }: BookmarkButtonProps) {
  const { user } = useAuth();
  const [hasBookmarked, setHasBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkBookmark() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('bookmarks')
          .select('id')
          .eq('article_id', articleId)
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (!error && data) {
          setHasBookmarked(true);
        }
      } catch (err) {
        console.error('Error fetching bookmark:', err);
      } finally {
        setLoading(false);
      }
    }
    checkBookmark();
  }, [articleId, user]);

  const handleToggleBookmark = async () => {
    if (!user) {
      toast.error('You must be logged in to save an article.');
      return;
    }
    
    setLoading(true);
    try {
      if (hasBookmarked) {
        // Remove
        await supabase
          .from('bookmarks')
          .delete()
          .eq('article_id', articleId)
          .eq('user_id', user.id);
        setHasBookmarked(false);
      } else {
        // Add
        await supabase
          .from('bookmarks')
          .insert([{ article_id: articleId, user_id: user.id }]);
        setHasBookmarked(true);
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleToggleBookmark} 
      disabled={loading}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 20px',
        borderRadius: '50px',
        border: '1px solid',
        borderColor: hasBookmarked ? 'var(--accent-color)' : 'var(--border-color)',
        backgroundColor: hasBookmarked ? 'var(--accent-color)' : 'var(--bg-card)',
        color: hasBookmarked ? 'white' : 'var(--text-color)',
        cursor: loading ? 'wait' : 'pointer',
        transition: 'all 0.2s ease',
        fontWeight: 'bold',
        fontSize: '1rem',
        boxShadow: hasBookmarked ? '0 4px 12px rgba(100, 108, 255, 0.3)' : 'none',
      }}
      title={hasBookmarked ? "Remove from saved" : "Save for later"}
    >
      <Bookmark 
        size={20} 
        fill={hasBookmarked ? "white" : "none"} 
        strokeWidth={2}
      />
      <span className="hide-on-mobile">{hasBookmarked ? 'Saved' : 'Save'}</span>
    </button>
  );
}
