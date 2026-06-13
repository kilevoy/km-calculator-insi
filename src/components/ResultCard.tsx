import React, { lazy, Suspense, useState, useEffect, useRef } from 'react';
import type { CalculatorParams, CalculatorResult } from '../types/calculator';
import { formatDays, formatWeight } from '../utils/formatters';
import { useGoogleDrive } from '../hooks/useGoogleDrive';
import { Share2, FileDown, CloudUpload, Check, AlertCircle, Loader2 } from 'lucide-react';

interface ResultCardProps {
  params: CalculatorParams;
  result: CalculatorResult;
  shareUrl: string;
  reportRef: React.MutableRefObject<HTMLDivElement | null>;
}

const CostBreakdown = lazy(() => import('./CostBreakdown'));

export const ResultCard: React.FC<ResultCardProps> = ({
  params,
  result,
  shareUrl,
  reportRef,
}) => {
  // Count-up animation for cost
  const [displayCost, setDisplayCost] = useState(0);
  const previousCostRef = useRef(0);

  useEffect(() => {
    const start = previousCostRef.current;
    const end = result.cost;
    if (start === end) return;
    
    const duration = 600; // ms
    const startTime = performance.now();
    let animationFrameId: number;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Easing: easeOutCubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const nextVal = start + (end - start) * easeProgress;
      setDisplayCost(nextVal);
      
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setDisplayCost(end);
        previousCostRef.current = end;
      }
    };
    
    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [result.cost]);

  // Actions states
  const [copied, setCopied] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const { isUploading, uploadStatus, uploadedFileUrl, error: uploadError, uploadFile, resetUpload } = useGoogleDrive();
  const canIssueReport = result.status === 'valid';

  const getReportFilename = () => {
    const sysClean = params.system.replace(/\s+/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10);
    return `КМ_${sysClean}_${result.area_m2}м2_${dateStr}.pdf`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current || !canIssueReport) return;
    setIsExportingPDF(true);
    try {
      const filename = getReportFilename();
      const [{ exportPDF }, { default: confetti }] = await Promise.all([
        import('../utils/pdf-export'),
        import('canvas-confetti'),
      ]);
      await exportPDF(reportRef.current, filename);
      
      // Confetti effect
      confetti({
        particleCount: 120,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleUploadToDrive = async () => {
    if (!reportRef.current || !canIssueReport) return;
    resetUpload();
    try {
      const filename = getReportFilename();
      // Generate blob
      const { getPDFBlob } = await import('../utils/pdf-export');
      const pdfBlob = await getPDFBlob(reportRef.current);
      // Upload to Drive
      await uploadFile(pdfBlob, filename);
    } catch (err: unknown) {
      console.error('Failed to upload to Google Drive:', err);
    }
  };

  return (
    <div className="glass-card p-6 sticky top-6 space-y-6 flex flex-col justify-between">
      <div>
        {/* Cost header */}
        <div className="text-center pb-5 border-b border-insi-slate-100">
          <span className="text-[10px] uppercase font-bold tracking-wider text-insi-slate-400 block mb-1">
            Расчетная стоимость разработки КМ
          </span>
          <h2 className="text-3xl font-black text-insi-blue tracking-tight select-none">
            {new Intl.NumberFormat('ru-RU', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(displayCost)}{' '}
            <span className="text-sm font-bold text-insi-slate-500">тыс. руб.</span>
          </h2>
          <span className="text-[10px] text-insi-slate-400 mt-1 block">
            Без НДС (УСН) • Удельная: {result.cost_per_ton.toFixed(2)} тыс. руб/т
          </span>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 py-5 border-b border-insi-slate-100">
          <div>
            <span className="text-[9px] uppercase font-bold text-insi-slate-400 block">Срок выполнения</span>
            <span className="text-sm font-bold text-insi-slate-800 mt-0.5 block">
              {formatDays(result.term)}
            </span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-insi-slate-400 block">Металлоемкость</span>
            <span className="text-sm font-bold text-insi-slate-800 mt-0.5 block">
              {result.metal_consumption} кг/м²
            </span>
          </div>
          <div className="col-span-2 border-t border-insi-slate-50 pt-2.5">
            <span className="text-[9px] uppercase font-bold text-insi-slate-400 block">Ориентировочный вес</span>
            <span className="text-xs font-semibold text-insi-slate-700 mt-0.5 block">
              {formatWeight(result.total_weight_tons)}
            </span>
          </div>
        </div>

        {/* Pie breakdown chart */}
        <div className="py-2">
          <h3 className="text-xs font-bold text-insi-slate-800 mb-2 uppercase tracking-wide">
            Структура стоимости
          </h3>
          <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-slate-100" />}>
            <CostBreakdown data={result.breakdown} />
          </Suspense>
        </div>
      </div>

      {/* Action panel */}
      <div className="space-y-2 pt-4 border-t border-insi-slate-100 mt-auto">
        {!canIssueReport && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-[10px] text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Исправьте ошибки параметров перед выпуском PDF или загрузкой в Google Drive.</span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          {/* Copy link */}
          <button
            type="button"
            onClick={handleCopyLink}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
              copied
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-white border-insi-slate-200 hover:border-insi-slate-350 text-insi-slate-600 hover:text-insi-blue'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            {copied ? 'Ссылка готова!' : 'Ссылка'}
          </button>

          {/* Download PDF */}
          <button
            type="button"
            disabled={isExportingPDF || !canIssueReport}
            onClick={handleDownloadPDF}
            className="w-full py-2.5 px-4 bg-insi-blue hover:bg-insi-blue-dark text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm disabled:bg-insi-blue/50"
          >
            {isExportingPDF ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
            {isExportingPDF ? 'Экспорт...' : 'Скачать PDF'}
          </button>
        </div>

        {/* Send to Google Drive */}
        <button
          type="button"
          disabled={isUploading || !canIssueReport}
          onClick={handleUploadToDrive}
          className="w-full py-2.5 px-4 bg-insi-slate-900 hover:bg-insi-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm disabled:bg-insi-slate-900/60"
        >
          {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CloudUpload className="w-3.5 h-3.5" />}
          Загрузить в Google Drive
        </button>

        {/* Drive upload statuses */}
        {uploadStatus === 'success' && (
          <div className="bg-green-50 border border-green-150 rounded-xl p-3 text-[10px] text-green-700 flex items-start gap-2">
            <Check className="w-4 h-4 shrink-0 text-green-600" />
            <div>
              <span className="font-bold block">Файл успешно сохранен!</span>
              <a
                href={uploadedFileUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold text-green-800 hover:text-green-950 block mt-0.5"
              >
                Открыть в Google Drive
              </a>
            </div>
          </div>
        )}

        {uploadStatus === 'error' && (
          <div className="bg-red-50 border border-red-150 rounded-xl p-3 text-[10px] text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <div>
              <span className="font-bold block">Ошибка загрузки в Drive</span>
              <span className="block mt-0.5 leading-relaxed">{uploadError}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default ResultCard;
