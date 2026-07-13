import { Minus, Plus, Maximize, Minimize } from 'lucide-react';

interface ReadingPreferencesProps {
  fontSize: number;
  setFontSize: (size: number | ((prev: number) => number)) => void;
  fontFamily: 'sans' | 'serif';
  setFontFamily: (font: 'sans' | 'serif') => void;
  zenMode: boolean;
  setZenMode: (zen: boolean | ((prev: boolean) => boolean)) => void;
}

export function ReadingPreferences({
  fontSize,
  setFontSize,
  fontFamily,
  setFontFamily,
  zenMode,
  setZenMode
}: ReadingPreferencesProps) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '20px',
      padding: '8px 20px',
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: '30px',
      marginBottom: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
    }}>
      {/* Font Size */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button 
          onClick={() => setFontSize(prev => Math.max(14, prev - 2))}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', display: 'flex', padding: '4px' }}
          title="Giảm cỡ chữ"
        >
          <Minus size={16} />
        </button>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-color)', minWidth: '40px', textAlign: 'center' }}>
          {fontSize}px
        </span>
        <button 
          onClick={() => setFontSize(prev => Math.min(24, prev + 2))}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', display: 'flex', padding: '4px' }}
          title="Tăng cỡ chữ"
        >
          <Plus size={16} />
        </button>
      </div>

      <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-color)' }} />

      {/* Font Family */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => setFontFamily('sans')}
          style={{ 
            background: fontFamily === 'sans' ? 'var(--accent-color)' : 'none', 
            color: fontFamily === 'sans' ? '#fff' : 'var(--text-light)',
            border: 'none', borderRadius: '12px', padding: '4px 10px', cursor: 'pointer',
            fontSize: '0.9rem', fontFamily: 'sans-serif', fontWeight: 'bold'
          }}
        >
          Sans
        </button>
        <button
          onClick={() => setFontFamily('serif')}
          style={{ 
            background: fontFamily === 'serif' ? 'var(--accent-color)' : 'none', 
            color: fontFamily === 'serif' ? '#fff' : 'var(--text-light)',
            border: 'none', borderRadius: '12px', padding: '4px 10px', cursor: 'pointer',
            fontSize: '0.9rem', fontFamily: 'serif', fontWeight: 'bold'
          }}
        >
          Serif
        </button>
      </div>

      <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-color)' }} />

      {/* Zen Mode */}
      <button 
        onClick={() => setZenMode(prev => !prev)}
        style={{ 
          background: 'none', border: 'none', cursor: 'pointer', 
          color: zenMode ? 'var(--accent-color)' : 'var(--text-light)', 
          display: 'flex', alignItems: 'center', gap: '6px', padding: '4px',
          fontSize: '0.9rem'
        }}
        title="Chế độ tập trung"
      >
        {zenMode ? <Minimize size={18} /> : <Maximize size={18} />}
        <span>Zen Mode</span>
      </button>
    </div>
  );
}
