import React, { useState, useRef, useEffect } from 'react';
import api from '../../api/axios';
import { Check, FileText, Loader2, Sparkles, X } from 'lucide-react';

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

  const handleUpload = async () => {
    if (!file) return;
    setStatus('PENDING');
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post(`/v1/projects/${projectId}/ai/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setJobId(response.data.jobId);
    } catch (err: any) {
      setStatus('FAILED');
      setErrorMessage(err.response?.data?.message || 'Failed to submit document for processing.');
    }
  };

  const stageLabel = () => {
    switch (status) {
      case 'PENDING':
        return 'Uploading the document and queuing the job';
      case 'EXTRACTING_PDF':
        return 'Extracting text from the PDF';
      case 'RUNNING_LLM':
        return 'Decomposing requirements';
      case 'COMPLETED':
        return 'Backlog items created';
      case 'FAILED':
        return 'Processing failed';
      default:
        return '';
    }
  };

  const isProcessing = ['PENDING', 'EXTRACTING_PDF', 'RUNNING_LLM'].includes(status);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line bg-surface-2 px-5 py-3.5">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
            <Sparkles size={17} className="text-brand" />
            Decompose a PRD
          </h2>
          {!isProcessing && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1 text-ink-faint transition hover:text-ink"
              aria-label="Close"
            >
              <X size={17} />
            </button>
          )}
        </div>

        {status === 'IDLE' && (
          <div className="space-y-4 p-5">
            <div
              onDragOver={event => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={event => {
                event.preventDefault();
                setIsDragging(false);
                const dropped = event.dataTransfer.files?.[0];
                if (!dropped) return;
                if (dropped.type === 'application/pdf' || dropped.name.toLowerCase().endsWith('.pdf')) {
                  setFile(dropped);
                } else {
                  setErrorMessage('Please select a valid PDF file.');
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition ${
                isDragging ? 'border-brand bg-brand-soft' : 'border-line-strong bg-surface-2 hover:border-brand/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={event => {
                  if (event.target.files?.[0]) setFile(event.target.files[0]);
                }}
              />
              <FileText size={26} className="mx-auto mb-2 text-brand" />
              <p className="text-sm font-medium text-ink">
                {file ? file.name : 'Drop a PRD or specification PDF here'}
              </p>
              <p className="mt-1 text-xs text-ink-faint">Text and scanned PDFs are both supported</p>
            </div>

            {errorMessage && (
              <div className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-xs text-danger">
                {errorMessage}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={onClose} className="btn-quiet">
                Cancel
              </button>
              <button type="button" disabled={!file} onClick={handleUpload} className="btn-primary">
                Decompose to backlog
              </button>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="flex flex-col items-center gap-4 px-6 py-14 text-center">
            <Loader2 size={30} className="animate-spin text-brand" />
            <div>
              <p className="text-sm font-semibold text-ink">{stageLabel()}…</p>
              <p className="mt-1 text-xs text-ink-faint">
                This runs asynchronously on the worker, so it is safe to keep the tab open.
              </p>
            </div>
          </div>
        )}

        {status === 'COMPLETED' && (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-leaf-soft text-leaf">
              <Check size={24} />
            </span>
            <h3 className="font-display text-lg font-semibold text-ink">Backlog created</h3>
            <p className="max-w-sm text-xs leading-relaxed text-ink-soft">
              Requirements and technical tasks were saved to this project in backlog status.
            </p>
            <button onClick={onClose} className="btn-leaf mt-2">
              View backlog
            </button>
          </div>
        )}

        {status === 'FAILED' && (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft text-danger">
              <X size={24} />
            </span>
            <h3 className="font-display text-lg font-semibold text-ink">Processing failed</h3>
            <p className="max-w-sm text-xs text-danger">
              {errorMessage || 'An error occurred during extraction or decomposition.'}
            </p>
            <button onClick={() => setStatus('IDLE')} className="btn-quiet mt-2">
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
