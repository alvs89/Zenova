import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink, Loader2 } from 'lucide-react';
import { TaskAttachment } from '@/types';
import { get as idbGet } from 'idb-keyval';

interface FilePreviewModalProps {
  attachment: TaskAttachment | null;
  onClose: () => void;
}

export function FilePreviewModal({ attachment, onClose }: FilePreviewModalProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!attachment) {
      setDataUrl(null);
      return;
    }
    
    if (attachment.data) {
      setDataUrl(attachment.data);
    } else if (attachment.idbId) {
      setLoading(true);
      idbGet(attachment.idbId).then((val: any) => {
        if (typeof val === 'string') {
          setDataUrl(val);
        }
        setLoading(false);
      }).catch(err => {
        console.error("Failed to load local attachment", err);
        setLoading(false);
      });
    }
  }, [attachment]);

  if (!attachment) return null;

  const isImage = attachment.mimeType.startsWith('image/');
  const isPDF = attachment.mimeType === 'application/pdf';

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.5, bounce: 0 }}
          className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-10">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 truncate pr-4 flex items-center gap-2">
              {attachment.name}
              {loading && <Loader2 size={16} className="animate-spin text-slate-400" />}
            </h3>
            <div className="flex items-center gap-2">
              {dataUrl && (
                <a 
                  href={dataUrl} 
                  download={attachment.name}
                  className="p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  title="Download"
                >
                  <ExternalLink size={20} />
                </a>
              )}
              <button 
                onClick={onClose}
                className="p-2 text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto bg-slate-100/50 dark:bg-slate-950/50 flex items-center justify-center p-4 min-h-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-12 text-slate-500">
                <Loader2 size={40} className="mb-4 animate-spin opacity-50" />
                <p>Loading large file from local storage...</p>
              </div>
            ) : !dataUrl ? (
              <div className="flex flex-col items-center justify-center p-12 text-slate-500">
                <p>File data could not be found locally. It might have been uploaded on another device.</p>
              </div>
            ) : isImage ? (
              <img 
                src={dataUrl} 
                alt={attachment.name} 
                className="max-w-full h-auto object-contain max-h-[80vh] rounded-lg shadow-sm"
              />
            ) : isPDF ? (
              <iframe 
                src={dataUrl} 
                title={attachment.name}
                className="w-full h-full min-h-[60vh] rounded-lg bg-white shadow-sm border border-slate-200 dark:border-slate-800"
              />
            ) : (
              <object 
                data={dataUrl} 
                type={attachment.mimeType}
                className="w-full h-full min-h-[60vh] rounded-lg bg-white shadow-sm border border-slate-200 dark:border-slate-800"
              >
                <div className="flex flex-col items-center justify-center h-full space-y-4 text-center p-8 bg-white dark:bg-slate-900">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full">
                    <ExternalLink size={32} className="text-slate-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-1">Preview not available</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm">
                      This file format cannot be previewed directly in the browser. Please download it to view its contents.
                    </p>
                  </div>
                  <a 
                    href={dataUrl} 
                    download={attachment.name}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
                  >
                    Download File
                  </a>
                </div>
              </object>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
