import html2pdf from 'html2pdf.js';

const getOpt = (filename?: string) => ({
  margin: 10,
  filename,
  image: { type: 'jpeg' as const, quality: 0.98 },
  html2canvas: { 
    scale: 2, 
    useCORS: true,
    logging: false,
    letterRendering: true
  },
  jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
});

export async function exportPDF(element: HTMLElement, filename: string): Promise<void> {
  return html2pdf().set(getOpt(filename)).from(element).save();
}

export async function getPDFBlob(element: HTMLElement): Promise<Blob> {
  return html2pdf().set(getOpt()).from(element).output('blob');
}
