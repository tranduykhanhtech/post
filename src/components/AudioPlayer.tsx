import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Volume2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface AudioPlayerProps {
  text: string;
}

export function AudioPlayer({ text }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [supported, setSupported] = useState(true);
  
  // Use a ref to store utterances
  const utterancesRef = useRef<SpeechSynthesisUtterance[]>([]);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setSupported(false);
      return;
    }

    // Split text into sentences (by punctuation like . ? ! \n)
    const sentences = text.match(/[^.!?\n]+[.!?\n]+/g) || [text];
    
    // Find Vietnamese voice
    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const viVoice = voices.find(v => v.lang === 'vi-VN' || v.lang.includes('vi'));
      if (viVoice) {
        voiceRef.current = viVoice;
      }
    };
    
    window.speechSynthesis.onvoiceschanged = setVoice;
    setVoice();

    // Create utterances
    const utterances = sentences.map((sentence, index) => {
      const u = new SpeechSynthesisUtterance(sentence.trim());
      u.lang = 'vi-VN';
      u.rate = 1.0;
      u.pitch = 1.0;
      if (voiceRef.current) u.voice = voiceRef.current;
      
      if (index === sentences.length - 1) {
        u.onend = () => {
          setIsPlaying(false);
          setIsPaused(false);
        };
      }
      u.onerror = (e) => {
        console.error("Speech error", e);
        setIsPlaying(false);
        setIsPaused(false);
      };
      return u;
    });

    utterancesRef.current = utterances;

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [text]);

  const handlePlay = () => {
    if (!supported) {
      toast.error('Trình duyệt của bạn không hỗ trợ tính năng đọc văn bản.');
      return;
    }
    
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
    } else {
      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      if (utterancesRef.current.length > 0) {
        utterancesRef.current.forEach(u => {
          if (voiceRef.current) u.voice = voiceRef.current;
          window.speechSynthesis.speak(u);
        });
        setIsPlaying(true);
        setIsPaused(false);
      }
    }
  };

  const handlePause = () => {
    window.speechSynthesis.pause();
    setIsPaused(true);
    setIsPlaying(false);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  if (!supported) return null;

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '12px',
      padding: '8px 16px',
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: '30px',
      marginBottom: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-light)', fontSize: '0.9rem' }}>
        <Volume2 size={18} />
        <span>Nghe bài viết</span>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid var(--border-color)', paddingLeft: '12px' }}>
        {isPlaying ? (
          <button 
            onClick={handlePause}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-color)', display: 'flex', alignItems: 'center', padding: '4px' }}
            title="Tạm dừng"
          >
            <Pause size={18} fill="currentColor" />
          </button>
        ) : (
          <button 
            onClick={handlePlay}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-color)', display: 'flex', alignItems: 'center', padding: '4px' }}
            title={isPaused ? "Tiếp tục" : "Bắt đầu đọc"}
          >
            <Play size={18} fill="currentColor" />
          </button>
        )}
        
        {(isPlaying || isPaused) && (
          <button 
            onClick={handleStop}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f44336', display: 'flex', alignItems: 'center', padding: '4px' }}
            title="Dừng"
          >
            <Square size={16} fill="currentColor" />
          </button>
        )}
      </div>
    </div>
  );
}
