import React, { useState } from 'react';
import { SummaryDocument } from '../types/index';
import { exportToAnkiTSV, exportToCSV, exportToMarkdown } from '../utils/retentionLogic';
import { X, Copy, Check, Download, Printer, FileText } from 'lucide-react';

interface ExportModalProps {
  studyDoc: SummaryDocument;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  studyDoc,
  isOpen,
  onClose,
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!isOpen) return null;

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = filename;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportAnki = () => {
    const tsv = exportToAnkiTSV(studyDoc.flashcards);
    downloadFile(tsv, `${studyDoc.title.toLowerCase().replace(/\s+/g, '_')}_anki.tsv`, 'text/tab-separated-values');
  };

  const handleExportCSV = () => {
    const csv = exportToCSV(studyDoc.flashcards);
    downloadFile(csv, `${studyDoc.title.toLowerCase().replace(/\s+/g, '_')}_flashcards.csv`, 'text/csv');
  };

  const handleCopyMarkdown = async () => {
    const md = exportToMarkdown(studyDoc);
    try {
      await navigator.clipboard.writeText(md);
      setCopiedType('markdown');
      setTimeout(() => setCopiedType(null), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
              Export Study Material
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose your preferred format for offline study and external apps.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3.5 my-6">
          {/* Anki Export */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                Anki Flashcards (.tsv)
              </div>
              <div className="text-xs text-slate-500">
                Tab-separated format with memory anchors, ready for Anki Desktop or AnkiMobile import.
              </div>
            </div>
            <button
              onClick={handleExportAnki}
              className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shrink-0 flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>

          {/* CSV Export */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                Spreadsheet Table (.csv)
              </div>
              <div className="text-xs text-slate-500">
                Compatible with Excel, Google Sheets, Notion, and Quizlet.
              </div>
            </div>
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold shrink-0 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>

          {/* Markdown Summary */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                Markdown Study Guide
              </div>
              <div className="text-xs text-slate-500">
                Complete summary, key takeaways, cheat sheet, and flashcards formatted in Markdown.
              </div>
            </div>
            <button
              onClick={handleCopyMarkdown}
              className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold shrink-0 flex items-center gap-1.5"
            >
              {copiedType === 'markdown' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedType === 'markdown' ? 'Copied!' : 'Copy Text'}</span>
            </button>
          </div>

          {/* Print / PDF */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                Print or Save as PDF
              </div>
              <div className="text-xs text-slate-500">
                Printer-friendly format for physical handouts, binders, and offline review.
              </div>
            </div>
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold shrink-0 flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
