import { useState } from 'react';
import { Share2, Check } from 'lucide-react';

export function ShareButton() {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link: ', err);
    }
  };

  return (
    <button 
      onClick={handleShare}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 20px',
        borderRadius: '50px',
        border: '1px solid var(--border-color)',
        backgroundColor: copied ? '#e6f4ea' : 'var(--bg-card)',
        color: copied ? '#137333' : 'var(--text-color)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        fontWeight: 'bold',
        fontSize: '1rem',
        boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
      title="Copy link to share"
    >
      {copied ? <Check size={20} /> : <Share2 size={20} />}
      <span>{copied ? 'Copied!' : 'Share'}</span>
    </button>
  );
}
