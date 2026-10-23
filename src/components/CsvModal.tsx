import React, { useState } from 'react';
import { RelationshipRecord } from '../types';
import { exportRecordsToCsv, parseCsvToRecords } from '../utils/validation';
import {
  X,
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Copy,
  Check,
} from 'lucide-react';

interface CsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: RelationshipRecord[];
  onImportRecords: (newRecords: RelationshipRecord[]) => void;
}

export const CsvModal: React.FC<CsvModalProps> = ({
  isOpen,
  onClose,
  records,
  onImportRecords,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'template' | 'github'>('export');
  const [csvInput, setCsvInput] = useState('');
  const [importResult, setImportResult] = useState<{
    importedCount: number;
    duplicateCount: number;
    errors: string[];
  } | null>(null);
  const [copiedCsv, setCopiedCsv] = useState(false);

  if (!isOpen) return null;

  // Generate blank CSV template adhering strictly to codebook schema
  const blankTemplate = `project,institution_or_process,relationship_type,evidence_status,source_url,source_passage,access_date,notes,reviewer,gap_recommendation
"PyTorch","CEN-CENELEC JTC 21","formal_membership","gap","https://github.com/pytorch/pytorch","","2026-03-12","Repository link does not establish committee participation.","Auditor","Direct researcher toward official CEN-CENELEC national delegation registers."
"ExampleProject","NIST AISIC","formal_membership","independently_verified","https://www.nist.gov/...","Verbatim passage confirming membership...","2026-03-15","Verified on official member roster","Senior Fellow",""`;

  const exportedCsvContent = exportRecordsToCsv(records);

  const handleDownloadExport = () => {
    const blob = new Blob([exportedCsvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `observatory_evidence_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([blankTemplate], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'observatory_template_schema.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvInput(content);
    };
    reader.readAsText(file);
  };

  const handleProcessImport = () => {
    if (!csvInput.trim()) return;
    const { records: newRecords, errors, duplicates } = parseCsvToRecords(csvInput);
    
    if (newRecords.length > 0) {
      onImportRecords(newRecords);
    }

    setImportResult({
      importedCount: newRecords.length,
      duplicateCount: duplicates,
      errors,
    });
  };

  const handleCopyExport = () => {
    navigator.clipboard.writeText(exportedCsvContent);
    setCopiedCsv(true);
    setTimeout(() => setCopiedCsv(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1C1917]/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-[#E7E3DC] rounded-xl max-w-2xl w-full p-6 space-y-5 shadow-lg my-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#E7E3DC]">
          <div>
            <span className="text-xs font-mono text-[#78716C] uppercase">
              Component 09 · Interoperable Data Bridge
            </span>
            <h2 className="text-xl font-serif font-semibold text-[#1C1917] mt-0.5">
              CSV Import & Export Engine
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#78716C] hover:text-[#1C1917] p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 border-b border-[#F2EFE9] text-xs">
          <button
            onClick={() => {
              setActiveTab('export');
              setImportResult(null);
            }}
            className={`px-4 py-2 font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'export'
                ? 'border-[#9A3412] text-[#1C1917] font-semibold'
                : 'border-transparent text-[#57534E] hover:text-[#1C1917]'
            }`}
          >
            Export Audited Dataset ({records.length} records)
          </button>

          <button
            onClick={() => {
              setActiveTab('import');
              setImportResult(null);
            }}
            className={`px-4 py-2 font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'import'
                ? 'border-[#9A3412] text-[#1C1917] font-semibold'
                : 'border-transparent text-[#57534E] hover:text-[#1C1917]'
            }`}
          >
            Import CSV File
          </button>

          <button
            onClick={() => {
              setActiveTab('template');
              setImportResult(null);
            }}
            className={`px-4 py-2 font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'template'
                ? 'border-[#9A3412] text-[#1C1917] font-semibold'
                : 'border-transparent text-[#57534E] hover:text-[#1C1917]'
            }`}
          >
            Download Schema Template
          </button>

          <button
            onClick={() => {
              setActiveTab('github');
              setImportResult(null);
            }}
            className={`px-4 py-2 font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'github'
                ? 'border-[#9A3412] text-[#1C1917] font-semibold'
                : 'border-transparent text-[#57534E] hover:text-[#1C1917]'
            }`}
          >
            GitHub & Project ZIP
          </button>
        </div>

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div className="space-y-4 text-xs">
            <p className="text-[#57534E] leading-relaxed">
              Export the current evidence database into standard CSV format. This file maintains complete auditable integrity, including source passages, verification statuses, and gap directives.
            </p>

            <pre className="p-3 bg-[#1C1917] text-[#FAF8F5] rounded text-xs font-mono overflow-x-auto max-h-48 leading-relaxed">
              {exportedCsvContent}
            </pre>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[#78716C]">
                Ready for import into Python, pandas, or spreadsheet editors.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyExport}
                  className="px-3 py-1.5 font-medium text-[#57534E] hover:text-[#1C1917] bg-[#FAF8F5] border border-[#DDD6C8] rounded transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {copiedCsv ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#166534]" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Raw CSV</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownloadExport}
                  className="px-4 py-1.5 font-medium text-white bg-[#1C1917] hover:bg-[#292524] rounded transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV File</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Import Tab */}
        {activeTab === 'import' && (
          <div className="space-y-4 text-xs">
            <p className="text-[#57534E] leading-relaxed">
              Upload a CSV file or paste formatted CSV rows below. The importer maps incoming headers, checks mandatory fields, and preserves unverified candidate labels without falsely treating them as independently verified.
            </p>

            {/* File drag/drop or select */}
            <div className="p-4 border-2 border-dashed border-[#DDD6C8] rounded-lg bg-[#FAF8F5] text-center space-y-2">
              <Upload className="w-6 h-6 mx-auto text-[#78716C]" />
              <div className="text-[#1C1917] font-medium">Select a CSV file to upload</div>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="text-xs text-[#78716C] file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-[#1C1917] file:text-white cursor-pointer"
              />
            </div>

            {/* Or Paste text */}
            <div>
              <label className="font-semibold text-[#1C1917] block mb-1">
                Or Paste CSV Content:
              </label>
              <textarea
                rows={5}
                value={csvInput}
                onChange={(e) => setCsvInput(e.target.value)}
                placeholder={`project,institution_or_process,relationship_type,evidence_status,source_url...\n"PyTorch","CEN-CENELEC JTC 21","formal_membership","gap","https://..."`}
                className="w-full p-2.5 bg-[#FAF8F5] border border-[#DDD6C8] rounded font-mono text-xs text-[#1C1917] focus:outline-none focus:border-[#9A3412]"
              />
            </div>

            {/* Import Results Banner */}
            {importResult && (
              <div
                className={`p-3.5 rounded-lg border space-y-1.5 ${
                  importResult.importedCount > 0
                    ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#14532D]'
                    : 'bg-[#FEF2F2] border-[#FECACA] text-[#7F1D1D]'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold">
                  {importResult.importedCount > 0 ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#166534]" />
                      <span>Successfully imported {importResult.importedCount} records into the evidence register.</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
                      <span>Import failed: No valid records parsed.</span>
                    </>
                  )}
                </div>

                {importResult.duplicateCount > 0 && (
                  <p className="text-[11px] text-[#78350F]">
                    Notice: {importResult.duplicateCount} records had identical project-institution pairs and were merged/appended.
                  </p>
                )}

                {importResult.errors.length > 0 && (
                  <ul className="list-disc list-inside text-[11px] space-y-0.5 pt-1">
                    {importResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-[#57534E] hover:text-[#1C1917] bg-[#FAF8F5] rounded border border-[#E7E3DC] cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleProcessImport}
                disabled={!csvInput.trim()}
                className={`px-4 py-2 text-xs font-medium text-white rounded transition-colors cursor-pointer ${
                  csvInput.trim()
                    ? 'bg-[#1C1917] hover:bg-[#292524]'
                    : 'bg-[#A8A29E] cursor-not-allowed'
                }`}
              >
                Run CSV Import & Validate
              </button>
            </div>
          </div>
        )}

        {/* Template Tab */}
        {activeTab === 'template' && (
          <div className="space-y-4 text-xs">
            <p className="text-[#57534E] leading-relaxed">
              Use this canonical blank schema template to collect evidence. Using this identical schema prevents import errors and guarantees that every field aligns with the codebook definitions.
            </p>

            <pre className="p-3 bg-[#FAF8F5] border border-[#E7E3DC] rounded text-xs font-mono overflow-x-auto max-h-48 leading-relaxed text-[#1C1917]">
              {blankTemplate}
            </pre>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[#78716C]">
                Includes sample gap record and verified record rows.
              </span>
              <button
                onClick={handleDownloadTemplate}
                className="px-4 py-1.5 font-medium text-white bg-[#1C1917] hover:bg-[#292524] rounded transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Blank CSV Template</span>
              </button>
            </div>
          </div>
        )}

        {/* GitHub & Hugging Face Tab */}
        {activeTab === 'github' && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-[#FEF3C7]/60 border border-[#FCD34D] rounded-lg flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-[#78350F] text-xs">
                  Complete Project ZIP Archive (Hugging Face & GitHub Ready)
                </h3>
                <p className="text-[#92400E] mt-0.5 text-[11px] leading-relaxed">
                  Contains all frontend code, Python verification engine & test suite, pre-configured <code>Dockerfile</code> for Hugging Face Spaces (port 7860), GitHub Actions deploy workflow, and documentation.
                </p>
              </div>

              <a
                href="./open-source-ai-standardisation-observatory.zip"
                download="open-source-ai-standardisation-observatory.zip"
                className="px-3.5 py-1.5 font-semibold text-white bg-[#78350F] hover:bg-[#92400E] rounded transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download ZIP</span>
              </a>
            </div>

            {/* Hugging Face Option */}
            <div className="p-3.5 bg-white border border-[#E7E3DC] rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#1C1917] flex items-center gap-1.5">
                  <span>Option A: Deploy to Hugging Face Spaces (Recommended for AI Research)</span>
                </span>
                <span className="text-[11px] font-mono text-[#166534] bg-[#F0FDF4] px-2 py-0.5 rounded border border-[#BBF7D0]">
                  Free Cloud Hosting
                </span>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-[#57534E] leading-relaxed">
                <li>
                  Create a new Space at <a href="https://huggingface.co/new-space" target="_blank" rel="noreferrer" className="text-[#9A3412] underline">huggingface.co/new-space</a>.
                </li>
                <li>
                  Select <strong>Docker</strong> as the Space SDK (Hardware: <em>CPU Basic · Free</em>).
                </li>
                <li>
                  Unzip the downloaded archive and push to Hugging Face:
                  <pre className="mt-1 p-2.5 bg-[#1C1917] text-[#FAF8F5] rounded text-[11px] font-mono overflow-x-auto select-all">
{`git init
git add .
git commit -m "Deploy Open-Source AI Standardisation Observatory"
git branch -M main
git remote add origin https://huggingface.co/spaces/<YOUR-USERNAME>/<YOUR-SPACE-NAME>
git push -u origin main --force`}
                  </pre>
                  <p className="text-[11px] text-[#78716C] mt-1">
                    <em>(When asked for password, use your Hugging Face Access Token from Settings → Access Tokens).</em>
                  </p>
                </li>
                <li>
                  Hugging Face automatically runs the included <code>Dockerfile</code> and launches your app live on port 7860!
                </li>
              </ol>
            </div>

            {/* GitHub Pages Option (Primary) */}
            <div className="p-3.5 bg-white border border-[#E7E3DC] rounded-lg space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#1C1917] flex items-center gap-1.5">
                  <span>Deploy to GitHub Pages (Fastest: Zero-Build via /docs)</span>
                </span>
                <span className="text-[11px] font-mono text-[#166534] bg-[#F0FDF4] px-2 py-0.5 rounded border border-[#BBF7D0]">
                  Pre-compiled in ZIP
                </span>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-[#57534E] leading-relaxed">
                <li>
                  Create a new repo on <a href="https://github.com/new" target="_blank" rel="noreferrer" className="text-[#9A3412] underline">GitHub</a>.
                </li>
                <li>
                  Unzip the archive and push all files:
                  <pre className="mt-1 p-2.5 bg-[#1C1917] text-[#FAF8F5] rounded text-[11px] font-mono overflow-x-auto select-all">
{`git init
git add .
git commit -m "Deploy Open-Source AI Standardisation Observatory"
git branch -M main
git remote add origin https://github.com/<YOUR-USERNAME>/<YOUR-REPO>.git
git push -u origin main`}
                  </pre>
                </li>
                <li>
                  In your GitHub repository, open <strong>Settings</strong> → <strong>Pages</strong>.
                </li>
                <li>
                  Under <em>Build and deployment</em> → <strong>Source</strong>: Keep <strong>Deploy from a branch</strong>.
                </li>
                <li>
                  Under <strong>Branch</strong>: Select <strong>`main`</strong> and select the <strong>`/docs`</strong> folder from the dropdown, then click <strong>Save</strong>!
                </li>
                <li>
                  Done! Your site will be live in 30 seconds at <code>https://&lt;YOUR-USERNAME&gt;.github.io/&lt;YOUR-REPO&gt;/</code>.
                </li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
