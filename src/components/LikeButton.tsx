import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface LikeButtonProps {
  articleId: string;
}

export function LikeButton({ articleId }: LikeButtonProps) {
  const { user } = useAuth();
  const [likesCount, setLikesCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLikes();
  }, [articleId, user]);

  const fetchLikes = async () => {
    try {
      // Get total count
      const { count, error } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('article_id', articleId);
      
      if (!error && count !== null) {
        setLikesCount(count);
      }

      // Check if current user liked
      if (user) {
        const { data, error: userError } = await supabase
          .from('likes')
          .select('id')
          .eq('article_id', articleId)
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (!userError && data) {
          setHasLiked(true);
        }
      }
    } catch (err) {
      console.error('Error fetching likes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLike = async () => {
    if (!user) {
      toast.error('You must be logged in to like an article.');
      return;
    }
    
    setLoading(true);
    try {
      if (hasLiked) {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('article_id', articleId)
          .eq('user_id', user.id);
        setHasLiked(false);
        setLikesCount(c => Math.max(0, c - 1));
      } else {
        // Like
        await supabase
          .from('likes')
          .insert([{ article_id: articleId, user_id: user.id }]);
        setHasLiked(true);
        setLikesCount(c => c + 1);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleToggleLike} 
      disabled={loading}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 20px',
        borderRadius: '50px',
        border: '1px solid',
        borderColor: hasLiked ? 'var(--accent-color)' : 'var(--border-color)',
        backgroundColor: hasLiked ? 'var(--accent-color)' : 'var(--bg-card)',
        color: hasLiked ? 'white' : 'var(--text-color)',
        cursor: loading ? 'wait' : 'pointer',
        transition: 'all 0.2s ease',
        fontWeight: 'bold',
        fontSize: '1rem',
        boxShadow: hasLiked ? '0 4px 12px rgba(100, 108, 255, 0.3)' : '0 2px 5px rgba(0,0,0,0.05)',
        transform: 'scale(1)',
      }}
      onMouseEnter={(e) => {
        if (!loading) e.currentTarget.style.transform = 'scale(1.05)';
      }}
      onMouseLeave={(e) => {
        if (!loading) e.currentTarget.style.transform = 'scale(1)';
      }}
      onMouseDown={(e) => {
        if (!loading) e.currentTarget.style.transform = 'scale(0.95)';
      }}
      onMouseUp={(e) => {
        if (!loading) e.currentTarget.style.transform = 'scale(1.05)';
      }}
    >
      <Heart 
        size={20} 
        fill={hasLiked ? "white" : "none"} 
        color={hasLiked ? "white" : "currentColor"} 
        strokeWidth={2}
      />
      <span>{likesCount} Likes</span>
    </button>
  );
}
