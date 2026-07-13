import { useState, useRef, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { supabase, type Article } from '../lib/supabase';
import * as mammoth from 'mammoth';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { useAuth } from '../context/AuthContext';
import { PenTool, List, Calendar, Folder, Trash2, Edit3, Image as ImageIcon, FileText, UploadCloud, Save } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import toast from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';

export function AdminDashboard() {
  const { profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'write' | 'history'>('write');
  
  // Editor State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editorError, setEditorError] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverImageInputRef = useRef<HTMLInputElement>(null);

  // History State
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<string | null>(null);
  
  const navigate = useNavigate();

  // Load drafts on mount
  useEffect(() => {
    const savedTitle = localStorage.getItem('draft_title');
    const savedCategory = localStorage.getItem('draft_category');
    const savedCoverImage = localStorage.getItem('draft_cover');
    const savedContent = localStorage.getItem('draft_content');
    if (savedTitle && !editingId) setTitle(savedTitle);
    if (savedCategory && !editingId) setCategory(savedCategory);
    if (savedCoverImage && !editingId) setCoverImage(savedCoverImage);
    if (savedContent && !editingId) setContent(savedContent);
  }, [editingId]);

  // Save drafts
  useEffect(() => {
    if (!editingId) {
      localStorage.setItem('draft_title', title);
      localStorage.setItem('draft_category', category);
      localStorage.setItem('draft_cover', coverImage);
      localStorage.setItem('draft_content', content);
    }
  }, [title, content, category, coverImage, editingId]);

  // Fetch History
  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setArticles(data || []);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  // Handlers for Editor
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension === 'txt') {
        const text = await file.text();
        setContent((prev) => (prev ? prev + '<br><br>' + text : text));
      } else if (extension === 'docx' || extension === 'doc') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setContent((prev) => (prev ? prev + '<br><br>' + result.value : result.value));
      } else {
        setEditorError('Unsupported file format. Please upload .txt or .docx');
      }
    } catch (err) {
      console.error('Error reading file:', err);
      setEditorError('Failed to read the file.');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setEditorError('Please upload a valid image file.');
      return;
    }

    setIsUploadingImage(true);
    setEditorError('');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('cover_images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('cover_images')
        .getPublicUrl(filePath);

      setCoverImage(data.publicUrl);
    } catch (err: any) {
      console.error('Error uploading image:', err);
      setEditorError('Failed to upload image. Did you create the bucket?');
    } finally {
      setIsUploadingImage(false);
      if (coverImageInputRef.current) coverImageInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setEditorError('Title and content are required.');
      return;
    }

    setIsSubmitting(true);
    setEditorError('');

    try {
      if (editingId) {
        // Update
        const { error } = await supabase
          .from('articles')
          .update({ title, content, category, cover_image_url: coverImage || null })
          .eq('id', editingId);
        if (error) throw error;
        
        // Reset and go to history
        setEditingId(null);
        setTitle('');
        setCategory('');
        setCoverImage('');
        setContent('');
        toast.success('Article updated successfully!');
        setActiveTab('history');
      } else {
        // Insert
        const { error } = await supabase
          .from('articles')
          .insert([{ title, content, category, cover_image_url: coverImage || null }]);
        if (error) throw error;
        
        localStorage.removeItem('draft_title');
        localStorage.removeItem('draft_category');
        localStorage.removeItem('draft_cover');
        localStorage.removeItem('draft_content');
        toast.success('Article published successfully!');
        navigate('/', { viewTransition: true });
      }
    } catch (err: any) {
      console.error('Error saving article:', err);
      toast.error(err.message || 'Failed to save article.');
      setEditorError(err.message || 'Failed to save article.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handlers for History
  const handleEdit = (article: Article) => {
    setEditingId(article.id);
    setTitle(article.title);
    setCategory(article.category || '');
    setCoverImage(article.cover_image_url || '');
    setContent(article.content);
    setActiveTab('write');
  };

  const handleDelete = (id: string) => {
    setArticleToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!articleToDelete) return;
    try {
      const { error } = await supabase.from('articles').delete().eq('id', articleToDelete);
      if (error) throw error;
      setArticles((prev) => prev.filter((a) => a.id !== articleToDelete));
      toast.success('Article deleted successfully!');
    } catch (err: any) {
      console.error('Error deleting article:', err);
      toast.error('Error deleting article: ' + err.message);
    } finally {
      setDeleteModalOpen(false);
      setArticleToDelete(null);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setCategory('');
    setCoverImage('');
    setContent('');
    const savedTitle = localStorage.getItem('draft_title');
    const savedCategory = localStorage.getItem('draft_category');
    const savedCoverImage = localStorage.getItem('draft_cover');
    const savedContent = localStorage.getItem('draft_content');
    if (savedTitle) setTitle(savedTitle);
    if (savedCategory) setCategory(savedCategory);
    if (savedCoverImage) setCoverImage(savedCoverImage);
    if (savedContent) setContent(savedContent);
  };

  if (loading) return <div className="container"><p>Loading...</p></div>;
  if (!profile || profile.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container" style={{ maxWidth: '900px' }}>
      <Helmet>
        <title>Manage - Gecko Space</title>
      </Helmet>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
        <div className="admin-pill-tabs" style={{ 
          display: 'inline-flex', 
          backgroundColor: 'var(--border-color)', 
          padding: '6px', 
          borderRadius: '30px',
          position: 'relative'
        }}>
          <button
            onClick={() => setActiveTab('write')}
            style={{
              background: activeTab === 'write' ? 'var(--bg-card)' : 'transparent',
              border: 'none',
              padding: '10px 30px',
              fontSize: '1rem',
              fontWeight: 600,
              color: activeTab === 'write' ? 'var(--text-color)' : 'var(--text-light)',
              borderRadius: '24px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: activeTab === 'write' ? '0 2px 10px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <PenTool size={18} /> {editingId ? 'Edit Article' : 'Write'}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            style={{
              background: activeTab === 'history' ? 'var(--bg-card)' : 'transparent',
              border: 'none',
              padding: '10px 30px',
              fontSize: '1rem',
              fontWeight: 600,
              color: activeTab === 'history' ? 'var(--text-color)' : 'var(--text-light)',
              borderRadius: '24px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: activeTab === 'history' ? '0 2px 10px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <List size={18} /> History
          </button>
        </div>
      </div>

      {activeTab === 'write' && (
        <div>
          {editorError && (
            <div style={{ padding: '15px', backgroundColor: '#fee', color: '#c00', marginBottom: '20px', borderRadius: '4px' }}>
              {editorError}
            </div>
          )}

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="title" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1.1rem', marginBottom: '10px' }}>
                <FileText size={18} /> Title
              </label>
              <input
                type="text"
                id="title"
                className="form-control"
                placeholder="Give your article a catchy title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
                autoFocus
                style={{ fontSize: '1.2rem', padding: '15px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1.1rem', marginBottom: '10px' }}>
                <ImageIcon size={18} /> Cover Image (optional)
              </label>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Paste URL or click Upload"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  disabled={isSubmitting || isUploadingImage}
                  style={{ flexGrow: 1, padding: '15px', borderRadius: '12px' }}
                />
                <input 
                  type="file" 
                  accept="image/*"
                  style={{ display: 'none' }}
                  ref={coverImageInputRef}
                  onChange={handleCoverImageUpload}
                />
                <button 
                  type="button" 
                  onClick={() => coverImageInputRef.current?.click()}
                  disabled={isSubmitting || isUploadingImage}
                  style={{ 
                    whiteSpace: 'nowrap', 
                    padding: '15px 25px', 
                    borderRadius: '12px', 
                    border: '1px solid var(--border-color)', 
                    background: 'var(--bg-card)', 
                    color: 'var(--text-color)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: 600,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <UploadCloud size={18} /> {isUploadingImage ? 'Uploading...' : 'Upload'}
                </button>
              </div>
              {coverImage && (
                <div style={{ marginTop: '15px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', height: '200px' }}>
                  <img src={coverImage} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="category" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1.1rem', marginBottom: '10px' }}>
                <Folder size={18} /> Series / Category
              </label>
              <input
                type="text"
                id="category"
                className="form-control"
                placeholder="e.g. React.js, Tản mạn..."
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isSubmitting}
                style={{ padding: '15px', borderRadius: '12px' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1.1rem', margin: 0 }}>
                  <PenTool size={18} /> Content
                </label>
                <div>
                  <input 
                    type="file" 
                    accept=".txt,.doc,.docx"
                    style={{ display: 'none' }}
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                  <button 
                    type="button" 
                    style={{ 
                      padding: '8px 16px', 
                      fontSize: '0.9rem', 
                      background: 'var(--bg-card)', 
                      color: 'var(--text-color)', 
                      border: '1px solid var(--border-color)',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FileText size={16} /> Import Doc/Txt
                  </button>
                </div>
              </div>
              <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <ReactQuill
                  theme="snow"
                  value={content}
                  onChange={setContent}
                  readOnly={isSubmitting}
                  placeholder="Write your thoughts here..."
                  style={{ minHeight: '400px', border: 'none' }}
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                      [{'list': 'ordered'}, {'list': 'bullet'}],
                      ['link', 'image'],
                      ['clean']
                    ]
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px', marginTop: '10px', marginBottom: '40px' }}>
              <button 
                type="submit" 
                disabled={isSubmitting}
                style={{
                  flexGrow: 1,
                  padding: '16px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: 'var(--accent-color)',
                  color: 'white',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s ease',
                  opacity: isSubmitting ? 0.7 : 1
                }}
              >
                <Save size={20} />
                {isSubmitting ? 'Saving...' : (editingId ? 'Update Article' : 'Publish Article')}
              </button>
              {editingId && (
                <button 
                  type="button" 
                  onClick={cancelEdit} 
                  style={{ 
                    padding: '16px 30px', 
                    borderRadius: '12px', 
                    background: 'transparent', 
                    color: 'var(--text-color)', 
                    border: '1px solid var(--border-color)',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {activeTab === 'history' && (
        <div>
          {isLoadingHistory ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-light)' }}>
              <div style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>
                <Edit3 size={32} />
              </div>
              <p style={{ marginTop: '10px' }}>Loading articles...</p>
            </div>
          ) : articles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-light)' }}>
              <FileText size={48} style={{ opacity: 0.5, marginBottom: '15px' }} />
              <h3 style={{ fontSize: '1.5rem', marginBottom: '10px', color: 'var(--text-color)' }}>No articles yet</h3>
              <p style={{ marginBottom: '20px' }}>Start sharing your knowledge with the world!</p>
              <button 
                onClick={() => setActiveTab('write')}
                style={{
                  padding: '10px 20px',
                  borderRadius: '20px',
                  border: 'none',
                  backgroundColor: 'var(--accent-color)',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Write First Article
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '20px' }}>
              {articles.map(article => (
                <div key={article.id} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '20px', 
                  backgroundColor: 'var(--bg-card)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '16px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}>
                  <div style={{ flexGrow: 1, paddingRight: '20px' }}>
                    <h3 style={{ fontSize: '1.4rem', marginBottom: '8px', color: 'var(--text-color)' }}>
                      {article.title}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', color: 'var(--text-light)', fontSize: '0.9rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={14} />
                        {new Date(article.created_at).toLocaleDateString()}
                      </span>
                      {article.category && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Folder size={14} />
                          {article.category}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={() => handleEdit(article)}
                      style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'var(--bg-color)', 
                        color: 'var(--text-color)', 
                        border: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      title="Edit Article"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(article.id)}
                      style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: '#fff0f0', 
                        color: '#d32f2f', 
                        border: '1px solid #ffd0d0',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      title="Delete Article"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Article"
        message="Are you sure you want to delete this article? This action cannot be undone."
        confirmText="Delete"
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </div>
  );
}
