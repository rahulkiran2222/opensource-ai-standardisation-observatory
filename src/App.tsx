/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { initialEntities, initialRecords } from './data/initialData';
import { RelationshipRecord, Entity, EvidenceStatus } from './types';
import { TopBar, NavTab } from './components/TopBar';
import { NetworkExplorer } from './components/NetworkExplorer';
import { EvidenceRegister } from './components/EvidenceRegister';
import { CandidateMatcher } from './components/CandidateMatcher';
import { ResearchReporting } from './components/ResearchReporting';
import { MethodologyCodebook } from './components/MethodologyCodebook';
import { RecordModal } from './components/RecordModal';
import { CsvModal } from './components/CsvModal';
import { ExternalLink, Check, BookOpen, Layers } from 'lucide-react';

export default function App() {
  const [entities, setEntities] = useState<Entity[]>(initialEntities);
  const [records, setRecords] = useState<RelationshipRecord[]>(initialRecords);
  const [activeTab, setActiveTab] = useState<NavTab>('network');

  // Modals state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<RelationshipRecord | null>(null);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  // Register filter state (passed when jumping from graph or candidate matcher)
  const [registerFilterStatus, setRegisterFilterStatus] = useState<EvidenceStatus | 'all'>('all');
  const [registerSearchQuery, setRegisterSearchQuery] = useState('');

  // Selected Record Modal / Dossier
  const [selectedRecordDetail, setSelectedRecordDetail] = useState<RelationshipRecord | null>(null);

  // Handlers
  const handleSaveRecord = (newOrUpdated: RelationshipRecord) => {
    setRecords((prev) => {
      const idx = prev.findIndex((r) => r.id === newOrUpdated.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newOrUpdated;
        return copy;
      }
      return [newOrUpdated, ...prev];
    });
  };

  const handleDeleteRecord = (id: string) => {
    if (window.confirm('Are you sure you want to delete this evidence record?')) {
      setRecords((prev) => prev.filter((r) => r.id !== id));
      if (selectedRecordDetail?.id === id) {
        setSelectedRecordDetail(null);
      }
    }
  };

  const handleImportRecords = (newRecords: RelationshipRecord[]) => {
    setRecords((prev) => [...newRecords, ...prev]);
    setActiveTab('register');
  };

  const handleFilterByEntity = (entityName: string) => {
    setRegisterSearchQuery(entityName);
    setRegisterFilterStatus('all');
    setActiveTab('register');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1917] flex flex-col font-sans selection:bg-[#EAE2D5] selection:text-[#1C1917]">
      {/* 3-Zone Top Navigation Contract with Global Search */}
      <TopBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenNewRecordModal={() => {
          setRecordToEdit(null);
          setIsRecordModalOpen(true);
        }}
        onOpenCsvModal={() => setIsCsvModalOpen(true)}
        totalRecordsCount={records.length}
        entities={entities}
        records={records}
        onSelectRecord={(rec) => setSelectedRecordDetail(rec)}
        onSelectEntity={(entityName) => handleFilterByEntity(entityName)}
        onSearchSubmit={(query) => {
          setRegisterSearchQuery(query);
          setRegisterFilterStatus('all');
          setActiveTab('register');
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'network' && (
          <NetworkExplorer
            entities={entities}
            records={records}
            onSelectRecord={(rec) => setSelectedRecordDetail(rec)}
            onFilterByEntity={handleFilterByEntity}
          />
        )}

        {activeTab === 'register' && (
          <EvidenceRegister
            records={records}
            onSelectRecord={(rec) => setSelectedRecordDetail(rec)}
            onEditRecord={(rec) => {
              setRecordToEdit(rec);
              setIsRecordModalOpen(true);
            }}
            onDeleteRecord={handleDeleteRecord}
            onNewRecord={() => {
              setRecordToEdit(null);
              setIsRecordModalOpen(true);
            }}
            initialFilterStatus={registerFilterStatus}
            initialSearchQuery={registerSearchQuery}
          />
        )}

        {activeTab === 'matcher' && (
          <CandidateMatcher
            records={records}
            onSelectRecord={(rec) => setSelectedRecordDetail(rec)}
            onEditRecord={(rec) => {
              setRecordToEdit(rec);
              setIsRecordModalOpen(true);
            }}
          />
        )}

        {activeTab === 'reporting' && (
          <ResearchReporting
            records={records}
            onSelectRecord={(rec) => setSelectedRecordDetail(rec)}
          />
        )}

        {activeTab === 'codebook' && <MethodologyCodebook />}
      </main>

      {/* Record Creation / Editing Modal */}
      <RecordModal
        isOpen={isRecordModalOpen}
        onClose={() => {
          setIsRecordModalOpen(false);
          setRecordToEdit(null);
        }}
        onSave={handleSaveRecord}
        recordToEdit={recordToEdit}
        entities={entities}
      />

      {/* CSV Import/Export Modal */}
      <CsvModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        records={records}
        onImportRecords={handleImportRecords}
      />

      {/* Detailed Evidence Dossier Modal */}
      {selectedRecordDetail && (
        <div className="fixed inset-0 z-50 bg-[#1C1917]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E7E3DC] rounded-xl max-w-xl w-full p-6 space-y-4 shadow-lg">
            <div className="flex items-start justify-between pb-3 border-b border-[#E7E3DC]">
              <div>
                <span className="text-xs uppercase tracking-wider text-[#78716C] font-mono">
                  {selectedRecordDetail.evidence_status.replace(/_/g, ' ')}
                </span>
                <h2 className="text-lg font-serif font-semibold text-[#1C1917] mt-0.5">
                  {selectedRecordDetail.project} ↔ {selectedRecordDetail.institution_or_process}
                </h2>
              </div>
              <button
                onClick={() => setSelectedRecordDetail(null)}
                className="text-[#78716C] hover:text-[#1C1917] p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-[#57534E]">
              <span>Modality: <strong>{selectedRecordDetail.relationship_type.replace(/_/g, ' ')}</strong></span>
              <span aria-hidden="true">·</span>
              <span>Auditor: <strong>{selectedRecordDetail.reviewer || 'Observer'}</strong></span>
              <span aria-hidden="true">·</span>
              <span>Date: <strong>{selectedRecordDetail.access_date || 'Undated'}</strong></span>
            </div>

            {selectedRecordDetail.source_passage ? (
              <div className="p-3 bg-[#FAF8F5] border border-[#E7E3DC] rounded text-xs text-[#292524] italic leading-relaxed">
                "{selectedRecordDetail.source_passage}"
              </div>
            ) : (
              <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded text-xs text-[#991B1B]">
                No verbatim passage extracted.
              </div>
            )}

            {selectedRecordDetail.notes && (
              <div className="text-xs text-[#57534E]">
                <strong className="text-[#1C1917]">Reviewer Finding: </strong>
                {selectedRecordDetail.notes}
              </div>
            )}

            {selectedRecordDetail.gap_recommendation && (
              <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded text-xs text-[#92400E]">
                <strong className="block mb-0.5">Research Next Action:</strong>
                {selectedRecordDetail.gap_recommendation}
              </div>
            )}

            <div className="pt-2 flex items-center justify-between text-xs">
              {selectedRecordDetail.source_url ? (
                <a
                  href={selectedRecordDetail.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[#9A3412] hover:underline font-medium"
                >
                  <span>Open Official Source Document</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="text-[#78716C]">No source URL recorded</span>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const toEdit = selectedRecordDetail;
                    setSelectedRecordDetail(null);
                    setRecordToEdit(toEdit);
                    setIsRecordModalOpen(true);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-[#1C1917] bg-[#F2EDE4] hover:bg-[#EBE4D8] border border-[#DDD6C8] rounded cursor-pointer"
                >
                  Edit Record
                </button>
                <button
                  onClick={() => setSelectedRecordDetail(null)}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-[#1C1917] hover:bg-[#292524] rounded cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Editorial Footer */}
      <footer className="border-t border-[#E7E3DC] bg-[#FAF8F5] py-8 px-6 text-xs text-[#78716C]">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-serif font-medium text-[#1C1917]">
                Open-Source AI Standardisation Observatory
              </span>
              <span aria-hidden="true">·</span>
              <span>Audited Research Ledger & Network Engine</span>
            </div>

            <div className="flex items-center gap-6">
              <button
                onClick={() => setActiveTab('codebook')}
                className="hover:text-[#1C1917] transition-colors cursor-pointer"
              >
                Academic Defense & Codebook
              </button>
              <button
                onClick={() => setIsCsvModalOpen(true)}
                className="hover:text-[#1C1917] transition-colors cursor-pointer"
              >
                Download Schema
              </button>
              <span>Open Source Standardisation Research</span>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E7E3DC]/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#78716C]">
            <div className="flex items-center gap-1 font-mono uppercase text-[#9A3412] font-semibold">
              <span>Stage 2 Modules:</span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <a href="pages/network-analysis.html" className="hover:text-[#1C1917] transition-colors">
                Network Analysis
              </a>
              <span aria-hidden="true">·</span>
              <a href="pages/brokerage-pathways.html" className="hover:text-[#1C1917] transition-colors">
                Brokerage & Pathways
              </a>
              <span aria-hidden="true">·</span>
              <a href="pages/temporal-analysis.html" className="hover:text-[#1C1917] transition-colors">
                Temporal Analysis
              </a>
              <span aria-hidden="true">·</span>
              <a href="pages/data-quality.html" className="hover:text-[#1C1917] transition-colors">
                Data Quality & Audit
              </a>
              <span aria-hidden="true">·</span>
              <a href="pages/research-outputs.html" className="hover:text-[#1C1917] transition-colors font-medium text-[#1C1917]">
                Research Outputs & Reproducibility
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
