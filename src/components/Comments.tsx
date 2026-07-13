import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth, type Profile } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface Comment {
  id: string;
  article_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  profiles: Profile;
  replies?: Comment[];
}

interface CommentsProps {
  articleId: string;
}

export function Comments({ articleId }: CommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [articleId]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles (
            id,
            display_name,
            role
          )
        `)
        .eq('article_id', articleId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Organize into tree
      const commentMap = new Map<string, Comment>();
      const rootComments: Comment[] = [];

      data?.forEach((c: any) => {
        const comment = { ...c, replies: [] } as Comment;
        commentMap.set(comment.id, comment);
      });

      data?.forEach((c: any) => {
        if (c.parent_id) {
          const parent = commentMap.get(c.parent_id);
          if (parent) {
            parent.replies!.push(commentMap.get(c.id)!);
          }
        } else {
          rootComments.push(commentMap.get(c.id)!);
        }
      });

      setComments(rootComments);
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (parentId: string | null = null) => {
    if (!user) return;
    const content = parentId ? replyContent : newComment;
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('comments').insert([
        {
          article_id: articleId,
          user_id: user.id,
          parent_id: parentId,
          content: content.trim(),
        }
      ]);
      
      if (error) throw error;
      
      if (parentId) {
        setReplyingTo(null);
        setReplyContent('');
      } else {
        setNewComment('');
      }
      
      await fetchComments();
    } catch (err) {
      console.error('Error posting comment:', err);
      toast.error('Failed to post comment.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} style={{ marginLeft: isReply ? '40px' : '0', marginTop: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--border-color)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--text-color)'
        }}>
          {comment.profiles?.display_name?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '10px 15px', borderRadius: '18px', display: 'inline-block' }}>
            <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '4px' }}>
              {comment.profiles?.display_name || 'Anonymous'}
            </div>
            <div style={{ fontSize: '0.95rem' }}>{comment.content}</div>
          </div>
          <div style={{ display: 'flex', gap: '15px', marginTop: '5px', marginLeft: '10px', fontSize: '0.85rem', color: 'var(--text-light)' }}>
            <span>{new Date(comment.created_at).toLocaleDateString()}</span>
            {user && !isReply && (
              <button 
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                style={{ background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Reply
              </button>
            )}
          </div>
        </div>
      </div>

      {replyingTo === comment.id && (
        <div style={{ marginLeft: '50px', marginTop: '10px', display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            className="form-control" 
            placeholder="Write a reply..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            style={{ flex: 1, padding: '8px 15px', borderRadius: '20px' }}
          />
          <button 
            className="btn" 
            onClick={() => handleSubmitComment(comment.id)}
            disabled={submitting || !replyContent.trim()}
          >
            Send
          </button>
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div style={{ marginTop: '10px' }}>
          {comment.replies.map(reply => renderComment(reply, true))}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ marginTop: '40px', paddingTop: '40px', borderTop: '1px solid var(--border-color)' }}>
      <h2>Comments</h2>
      
      {user ? (
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--accent-color)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white'
          }}>
            {user.email?.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              style={{ flex: 1, padding: '10px 15px', borderRadius: '20px' }}
            />
            <button 
              className="btn" 
              onClick={() => handleSubmitComment(null)}
              disabled={submitting || !newComment.trim()}
              style={{
                borderRadius: '20px',
                padding: '10px 25px',
                fontWeight: 'bold',
                backgroundColor: 'var(--accent-color)',
                color: 'white',
                border: 'none',
                cursor: (submitting || !newComment.trim()) ? 'not-allowed' : 'pointer',
                opacity: (submitting || !newComment.trim()) ? 0.6 : 1
              }}
            >
              Post
            </button>
          </div>
        </div>
      ) : (
        <div style={{ padding: '20px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', marginTop: '20px', textAlign: 'center' }}>
          <p>You must be logged in to post a comment.</p>
        </div>
      )}

      {loading ? (
        <p style={{ marginTop: '20px' }}>Loading comments...</p>
      ) : (
        <div style={{ marginTop: '30px' }}>
          {comments.map(c => renderComment(c))}
        </div>
      )}
    </div>
  );
}
