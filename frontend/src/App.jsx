import React, { useState, useEffect } from 'react';
import {
  Shield,
  Upload,
  MessageSquare,
  FileText,
  GripVertical,
  Send,
  Loader2,
  ChevronRight,
  User,
  Plus,
  Trash2,
  Settings,
  XCircle,
  CheckCircle2,
  BrainCircuit,
  Sparkles,
  Database,
  X
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import axios from 'axios';

// API Configuration
const API_BASE = "http://127.0.0.1:8000/api";
const WS_BASE = "ws://127.0.0.1:8000/ws";

export default function App() {
  const [activeView, setActiveView] = useState('upload'); // 'upload' or 'chat'

  return (
    <div className="flex h-screen w-screen bg-[#0f172a] text-slate-200 overflow-hidden font-['Poppins']">
      {/* Sidebar */}
      <aside className="w-64 glass flex flex-col border-r border-slate-700/50">
        <div className="p-6 flex items-center gap-3">
          <div className="p-2 bg-sky-500 rounded-lg shadow-lg shadow-sky-500/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Buster</h1>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          <SidebarItem
            icon={<Upload className="w-5 h-5" />}
            label="Upload Matrix"
            active={activeView === 'upload'}
            onClick={() => setActiveView('upload')}
          />
          <SidebarItem
            icon={<MessageSquare className="w-5 h-5" />}
            label="Agentic Chat"
            active={activeView === 'chat'}
            onClick={() => setActiveView('chat')}
          />
        </nav>

        <div className="p-4 border-t border-slate-700/50">
          <div className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white transition-colors cursor-pointer group">
            <Database className="w-5 h-5 group-hover:text-sky-400" />
            <span className="text-sm font-medium">Doc Store</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-800/20 via-transparent to-transparent">
        {activeView === 'upload' ? <UploadView /> : <ChatView />}
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${active
        ? 'bg-sky-500/10 text-sky-400 shadow-sm'
        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
        }`}
    >
      <div className={`${active ? 'text-sky-400' : 'text-slate-500'}`}>
        {icon}
      </div>
      <span className="text-sm font-semibold">{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />}
    </button>
  );
}

function IndexingProgressOverlay({ isVisible, progress }) {
  if (!isVisible || !progress) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl animate-in fade-in duration-500" />

      <div className="relative max-w-lg w-full glass rounded-[2.5rem] p-12 border border-sky-500/30 shadow-2xl shadow-sky-500/10 animate-in zoom-in-95 duration-500 flex flex-col items-center text-center space-y-8">
        {/* Animated Brain Icon */}
        <div className="relative">
          <div className="absolute inset-0 bg-sky-500/20 blur-3xl rounded-full animate-pulse" />
          <div className="relative p-6 bg-slate-900 border border-sky-500/50 rounded-3xl shadow-lg">
            <BrainCircuit className="w-12 h-12 text-sky-400 animate-pulse" />
          </div>
          <div className="absolute -top-2 -right-2 p-2 bg-fuchsia-500 rounded-xl shadow-lg animate-bounce duration-[2000ms]">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">AI Indexing in Progress</h2>
          <p className="text-slate-400 text-sm font-medium">Buster is transcribing and structuring your legal batch...</p>
        </div>

        {/* Progress Container */}
        <div className="w-full space-y-4">
          <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
            <span className="text-sky-400">Efficiency Optimized</span>
            <span className="text-white">{Math.round(progress.percentage)}%</span>
          </div>

          <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/50 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-sky-500 via-fuchsia-500 to-sky-500 bg-[length:200%_auto] animate-gradient transition-all duration-700 rounded-full shadow-[0_0_15px_rgba(14,165,233,0.5)]"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>

          <div className="flex justify-between items-center px-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                {progress.status === 'indexing' ? 'Processing Pages...' : 'Finalizing Index...'}
              </span>
            </div>
            <span className="text-xs font-black text-white bg-slate-800 px-3 py-1 rounded-lg border border-slate-700/50">
              {progress.processed_pages} / {progress.total_pages} Pages
            </span>
          </div>
        </div>

        <div className="pt-4">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] animate-pulse">
            Do not close this window while the Quantum Core is active
          </p>
        </div>
      </div>
    </div>
  );
}

function ImagePreviewModal({ src, onClose }) {
  if (!src) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300" />
      <div
        className="relative max-w-5xl w-full max-h-[90vh] glass rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-700/50"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-slate-800/80 hover:bg-red-500 rounded-full text-white transition-all z-10"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="p-2 h-full flex flex-col items-center">
          <img
            src={src}
            className="w-full h-full object-contain rounded-2xl"
            alt="Preview"
          />
        </div>
      </div>
    </div>
  );
}

function SortableItem({ id, src, onRemove, onPreview, index }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`aspect-square rounded-xl overflow-hidden border border-slate-700/50 bg-slate-900 group/preview relative shadow-lg transition-shadow ${isDragging ? 'shadow-2xl ring-2 ring-fuchsia-500/50' : ''}`}
    >
      {/* Expansion Click Area (The Image) */}
      <img
        src={src}
        className="w-full h-full object-cover opacity-80 group-hover/preview:opacity-100 transition-opacity cursor-pointer"
        onClick={() => onPreview(src)}
      />

      {/* Visual Overlay (Non-blocking) */}
      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/preview:opacity-100 transition-opacity pointer-events-none flex items-center justify-center">
        <div className="text-white text-[10px] font-bold uppercase tracking-tighter bg-slate-950/60 px-2 py-1 rounded-md mb-8">
          Click to Expand
        </div>
      </div>

      {/* Dedicated Drag Handle */}
      <div
        {...attributes} {...listeners}
        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/preview:opacity-100 transition-opacity cursor-grab active:cursor-grabbing pointer-events-none"
      >
        <div className="p-3 bg-slate-950/60 rounded-full border border-white/20 pointer-events-auto hover:scale-110 transition-transform active:scale-95">
          <GripVertical className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Index Badge */}
      <div className="absolute top-2 left-2 px-2 py-0.5 bg-fuchsia-500 rounded-md text-[10px] font-bold text-white shadow-lg pointer-events-none">
        {index + 1}
      </div>

      {/* Remove Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
      >
        <Trash2 className="w-3 h-3 text-white" />
      </button>

      {/* Hover Preview Text */}
      <div className="absolute bottom-2 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <span className="text-[8px] font-bold text-white bg-slate-900/60 px-2 py-1 rounded-full uppercase tracking-widest">Click to Expand</span>
      </div>
    </div>
  );
}

function UploadView() {
  const [previewImage, setPreviewImage] = useState(null);

  return (
    <div className="h-full p-8 overflow-y-auto scrollbar-hide">
      <div className="max-w-5xl mx-auto space-y-8">
        <header>
          <h2 className="text-3xl font-bold text-white mb-2">Upload Matrix</h2>
          <p className="text-slate-400">Streamline your documents into the Zero-Trust index.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <PersonalUploadCard onPreview={setPreviewImage} />
          <LegalUploadCard onPreview={setPreviewImage} />
        </div>
      </div>

      <ImagePreviewModal
        src={previewImage}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
}

function PersonalUploadCard({ onPreview }) {
  const [docName, setDocName] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [file]);

  const handleUpload = async () => {
    if (!file || !docName) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('document_name', docName);
    formData.append('file', file);

    try {
      await axios.post(`${API_BASE}/upload/personal`, formData);
      alert('Upload Successful!');
      setFile(null);
      setDocName('');
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass rounded-3xl p-8 space-y-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <User className="w-24 h-24" />
      </div>

      <div className="flex items-center gap-4">
        <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500">
          <User className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Personal Mode</h3>
          <p className="text-sm text-slate-400">Identify cards, passports, etc.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Document Name</label>
          <input
            type="text"
            placeholder="e.g. Identity Card"
            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sky-500 transition-colors"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
          />
        </div>

        <div
          className="border-2 border-dashed border-slate-700/50 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 hover:border-sky-500/50 hover:bg-sky-500/5 transition-all cursor-pointer group/upload relative overflow-hidden"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            setFile(e.dataTransfer.files[0]);
          }}
          onClick={() => !file && document.getElementById('personal-file').click()}
        >
          {file ? (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden group/thumb">
              <img
                src={previewUrl}
                className="w-full h-full object-cover opacity-80 group-hover/thumb:opacity-100 transition-opacity"
              />
              <div
                className="absolute inset-0 flex items-center justify-center bg-slate-950/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview(previewUrl);
                }}
              >
                <Plus className="w-8 h-8 text-white" />
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-lg shadow-lg hover:bg-red-600 transition-colors"
              >
                <Trash2 className="w-4 h-4 text-white" />
              </button>
            </div>
          ) : (
            <>
              <input
                id="personal-file"
                type="file"
                className="hidden"
                onChange={(e) => setFile(e.target.files[0])}
              />
              <div className="p-4 bg-slate-800/80 rounded-full group-hover/upload:scale-110 transition-transform shadow-lg">
                <Upload className="w-8 h-8 text-slate-400 group-hover/upload:text-sky-400" />
              </div>
              <p className="text-sm font-medium text-slate-400 text-center">
                Drag & Drop or Click to Upload
              </p>
            </>
          )}
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || !docName || loading}
          className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-sky-500/20 transition-all active:scale-95"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Index Document'}
        </button>
      </div>
    </div>
  );
}

function LegalUploadCard({ onPreview }) {
  const [batchName, setBatchName] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [indexingProgress, setIndexingProgress] = useState(null);
  const [isIndexing, setIsIndexing] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const pollProgress = (batchName) => {
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`${API_BASE}/upload/progress/${batchName}`);
        const data = res.data;
        setIndexingProgress(data);

        if (data.status === 'completed') {
          clearInterval(interval);
          setTimeout(() => {
            setIsIndexing(false);
            setIndexingProgress(null);
            alert('Batch Indexed Successfully!');
          }, 1500);
        } else if (data.status === 'error') {
          clearInterval(interval);
          setIsIndexing(false);
          alert('Indexing encountered an error. Check server logs.');
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000);
    return interval;
  };

  const handleUpload = async () => {
    if (files.length === 0 || !batchName) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('batch_name', batchName);
    files.forEach(f => formData.append('files', f.file));

    try {
      const res = await axios.post(`${API_BASE}/upload/legal`, formData);
      setFiles([]);
      setBatchName('');
      // Trigger indexing state
      setIsIndexing(true);
      setIndexingProgress({
        percentage: 0,
        processed_pages: 0,
        total_pages: files.length,
        status: 'uploading'
      });
      pollProgress(res.data.data.batch_name);
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setFiles((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addFiles = (newFileList) => {
    const newItems = Array.from(newFileList).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file: file,
      preview: URL.createObjectURL(file)
    }));
    setFiles([...files, ...newItems]);
  };

  return (
    <div className="glass rounded-3xl p-8 space-y-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <FileText className="w-24 h-24" />
      </div>

      <div className="flex items-center gap-4">
        <div className="p-3 bg-fuchsia-500/10 rounded-2xl text-fuchsia-500">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Legal Mode (Batch)</h3>
          <p className="text-sm text-slate-400">Drag to reorder pages before indexing.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Batch Name</label>
          <input
            type="text"
            placeholder="e.g. Property Deed 2026"
            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-fuchsia-500 transition-colors"
            value={batchName}
            onChange={(e) => setBatchName(e.target.value)}
          />
        </div>

        <div
          className="border-2 border-dashed border-slate-700/50 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 hover:border-fuchsia-500/50 hover:bg-fuchsia-500/5 transition-all cursor-pointer group/upload"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            addFiles(e.dataTransfer.files);
          }}
          onClick={() => document.getElementById('legal-files').click()}
        >
          <input
            id="legal-files"
            type="file"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
          <div className="p-4 bg-slate-800/80 rounded-full group-hover/upload:scale-110 transition-transform shadow-lg text-slate-400 group-hover/upload:text-fuchsia-400">
            <Plus className="w-8 h-8" />
          </div>
          <p className="text-sm font-medium text-slate-400 text-center">
            {files.length > 0 ? <span className="text-fuchsia-400 font-bold">{files.length} Pieces Collected</span> : 'Populate Batch Container'}
          </p>
        </div>

        {files.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={files.map(f => f.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-4 gap-3 py-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                {files.map((item, i) => (
                  <SortableItem
                    key={item.id}
                    id={item.id}
                    src={item.preview}
                    index={i}
                    onPreview={onPreview}
                    onRemove={() => {
                      setFiles(files.filter(f => f.id !== item.id));
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        <button
          onClick={handleUpload}
          disabled={files.length === 0 || !batchName || loading || isIndexing}
          className="w-full bg-fuchsia-500 hover:bg-fuchsia-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-fuchsia-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
            <>
              <Shield className="w-5 h-5" />
              <span>Commit to Secure Index</span>
            </>
          )}
        </button>
      </div>

      <IndexingProgressOverlay
        isVisible={isIndexing}
        progress={indexingProgress}
      />
    </div>
  );
}

function ChatView() {
  const [availableBatches, setAvailableBatches] = useState([]);
  const [activeBatch, setActiveBatch] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = React.useRef(null);
  const messagesEndRef = React.useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, status]);

  useEffect(() => {
    fetchBatches();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const fetchBatches = async () => {
    try {
      const res = await axios.get(`${API_BASE}/batches`);
      setAvailableBatches(res.data.batches || []);
    } catch (err) {
      console.error("Failed to fetch batches:", err);
    }
  };

  const connect = () => {
    if (!activeBatch) return;

    // Safety: Close any lingering connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    const socket = new WebSocket(`${WS_BASE}/chat`);
    wsRef.current = socket;

    socket.onopen = () => {
      setIsConnected(true);
      setStatus('Secure session established.');
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'status') {
        setStatus(data.message);
      } else if (data.type === 'error') {
        setStatus('');
        setMessages(prev => [...prev, { role: 'error', content: data.message }]);
      } else if (data.type === 'chunk') {
        setStatus('');
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last && last.role === 'assistant') {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...last,
              content: last.content + data.content
            };
            return updated;
          } else {
            return [...prev, { role: 'assistant', content: data.content }];
          }
        });
      } else if (data.type === 'done') {
        setStatus('');
      }
    };

    socket.onclose = () => {
      setIsConnected(false);
      setStatus('Session terminated.');
      wsRef.current = null;
    };
  };

  const endSession = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    setMessages([]);
    setIsConnected(false);
    setActiveBatch('');
    fetchBatches();
  };

  const sendMessage = () => {
    if (!input || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    const payload = { query: input, batch_name: activeBatch };
    wsRef.current.send(JSON.stringify(payload));
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput('');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Top Header */}
      <header className="glass h-16 border-b border-slate-700/50 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`} />
          <span className="text-sm font-bold uppercase tracking-widest text-slate-400">
            {isConnected ? `Analyzing: ${activeBatch}` : 'Quantum Chat Interface'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {!isConnected ? (
            <>
              <select
                className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-sky-500 w-48 text-slate-200 cursor-pointer"
                value={activeBatch}
                onChange={e => setActiveBatch(e.target.value)}
              >
                <option value="" disabled>Select Document Batch</option>
                {availableBatches.map(batch => (
                  <option key={batch} value={batch}>{batch}</option>
                ))}
              </select>
              <button
                onClick={connect}
                disabled={!activeBatch}
                className="bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-1.5 rounded-lg shadow-md transition-all active:scale-95"
              >
                Start Session
              </button>
            </>
          ) : (
            <button
              onClick={endSession}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold px-4 py-1.5 rounded-lg transition-all active:scale-95"
            >
              End Session
            </button>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        {messages.length === 0 && !status && !isConnected && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
            <div className="p-6 bg-slate-800/30 rounded-full border border-slate-700/50">
              <MessageSquare className="w-16 h-16 text-slate-600" />
            </div>
            <div>
              <h4 className="text-xl font-bold uppercase tracking-widest">Awaiting Linkage</h4>
              <p className="text-sm max-w-xs">Select a processed batch from the dropdown above to begin.</p>
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-2xl px-6 py-4 rounded-3xl shadow-lg animate-in slide-in-from-bottom-2 duration-300 ${m.role === 'user'
              ? 'bg-sky-500 text-white rounded-tr-none'
              : m.role === 'error'
                ? 'bg-red-500/20 border border-red-500/50 text-red-200 rounded-tl-none shadow-red-500/10'
                : 'glass text-slate-200 rounded-tl-none border-slate-700/50'
              }`}>
              <div className="flex gap-3">
                {m.role === 'error' && <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
              </div>
            </div>
          </div>
        ))}

        {status && (
          <div className="flex justify-start">
            <div className={`flex items-center gap-3 glass px-5 py-3 rounded-2xl border-slate-700/50 shadow-xl ${status.includes('Security Alert') ? 'border-red-500/50 bg-red-500/5' :
              status.includes('established') ? 'border-green-500/50 bg-green-500/5' : ''
              }`}>
              {status.includes('Security Alert') ? (
                <Shield className="w-4 h-4 text-red-500 animate-pulse" />
              ) : status.includes('established') ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />
              )}
              <span className={`text-[10px] font-bold uppercase tracking-widest ${status.includes('Security Alert') ? 'text-red-400 animate-pulse' :
                status.includes('established') ? 'text-green-400' :
                  'text-slate-400 animate-pulse'
                }`}>
                {status}
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <footer className="p-6 bg-slate-900/50 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex items-center gap-3 glass p-2 rounded-2xl border-slate-700/50 shadow-2xl relative">
          <input
            disabled={!isConnected}
            placeholder={isConnected ? "Query the agentic index..." : "Connect to a batch first"}
            className="flex-1 bg-transparent px-4 py-2 text-sm focus:outline-none disabled:opacity-50"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
          />
          <button
            disabled={!isConnected || !input}
            onClick={sendMessage}
            className="p-3 bg-sky-500 rounded-xl hover:bg-sky-600 transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-sky-500/20 active:scale-95"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </footer>
    </div>
  );
}
