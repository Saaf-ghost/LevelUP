import React, { useState, useRef, useEffect } from 'react';
import api from '../../api/axios';

interface BacklogPdfUploadModalProps {
  projectId: number;
  isOpen: boolean;
  onClose: () => void;
  onBacklogGenerated: () => void;
}

type JobStatus = 'IDLE' | 'PENDING' | 'EXTRACTING_PDF' | 'RUNNING_LLM' | 'COMPLETED' | 'FAILED';

export const BacklogPdfUploadModal: React.FC<BacklogPdfUploadModalProps> = ({
  projectId,
  isOpen,
  onClose,
  onBacklogGenerated,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<JobStatus>('IDLE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setJobId(null);
      setStatus('IDLE');
      setErrorMessage(null);
    }
  }, [isOpen]);

  // Polling loop when a job is in-flight
  useEffect(() => {
    if (!jobId || status === 'COMPLETED' || status === 'FAILED') return;

    const interval = setInterval(async () => {
      try {
        const response = await api.get(`/v1/jobs/${jobId}`);
        const currentStatus: JobStatus = response.data.status;
        setStatus(currentStatus);

        if (currentStatus === 'COMPLETED') {
          clearInterval(interval);
          onBacklogGenerated();
        } else if (currentStatus === 'FAILED') {
          clearInterval(interval);
          setErrorMessage(response.data.message || 'AI document decomposition failed.');
        }
      } catch (err: any) {
        console.error('Failed to poll job status:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId, status, onBacklogGenerated]);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf' || droppedFile.name.toLowerCase().endsWith('.pdf')) {
        setFile(droppedFile);
      } else {
        setErrorMessage('Please select a valid PDF file.');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus('PENDING');
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post(`/v1/projects/${projectId}/ai/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setJobId(res.data.jobId);
    } catch (err: any) {
      setStatus('FAILED');
      setErrorMessage(err.response?.data?.message || 'Failed to submit document for processing.');
    }
  };

  const getStatusStage = () => {
    switch (status) {
      case 'PENDING':
        return 'Uploading document & queuing job...';
      case 'EXTRACTING_PDF':
        return 'Extracting text with PyMuPDF & EasyOCR...';
      case 'RUNNING_LLM':
        return 'Decomposing requirements with Ollama (llama3)...';
      case 'COMPLETED':
        return 'Backlog items successfully created!';
      case 'FAILED':
        return 'Processing failed.';
      default:
        return '';
    }
  };

  const isProcessing = ['PENDING', 'EXTRACTING_PDF', 'RUNNING_LLM'].includes(status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">✨</span>
            AI PDF Backlog Decomposer
          </h2>
          {!isProcessing && (
            <button onClick={onClose} className="text-slate-400 hover:text-white transition">
              ✕
            </button>
          )}
        </div>

        {status === 'IDLE' && (
          <div className="mt-6 space-y-4">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setFile(e.target.files[0]);
                  }
                }}
              />
              <div className="text-4xl mb-2">📄</div>
              <p className="font-medium text-slate-200">
                {file ? file.name : 'Drag & drop your PRD or specification PDF here'}
              </p>
              <p className="text-sm text-slate-400 mt-1">Supports native text and scanned image PDFs</p>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-sm">
                {errorMessage}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!file}
                onClick={handleUpload}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium shadow-lg shadow-indigo-600/30 transition"
              >
                Decompose to Backlog
              </button>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-lg">🤖</div>
            </div>
            <div>
              <p className="text-lg font-semibold text-white">{getStatusStage()}</p>
              <p className="text-sm text-slate-400 mt-1">
                Processing asynchronously on local hardware to prevent UI freezing.
              </p>
            </div>
          </div>
        )}

        {status === 'COMPLETED' && (
          <div className="py-8 flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-2xl">
              ✓
            </div>
            <h3 className="text-lg font-bold text-white">Decomposition Complete!</h3>
            <p className="text-sm text-slate-300">
              Requirements, User Stories, and Technical Tasks have been saved to your project backlog in Draft status.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition"
            >
              View Backlog
            </button>
          </div>
        )}

        {status === 'FAILED' && (
          <div className="py-8 flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center text-2xl">
              ✕
            </div>
            <h3 className="text-lg font-bold text-white">Processing Failed</h3>
            <p className="text-sm text-rose-300">{errorMessage || 'An error occurred during extraction or decomposition.'}</p>
            <button
              onClick={() => setStatus('IDLE')}
              className="mt-4 px-6 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

