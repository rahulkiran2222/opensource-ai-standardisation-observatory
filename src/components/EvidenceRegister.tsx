import React, { useState, useMemo } from 'react';
import { RelationshipRecord, EvidenceStatus, RelationshipType } from '../types';
import { exportRecordsToCsv } from '../utils/validation';
import {
  Search,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Filter,
  Plus,
  ArrowUpDown,
  Calendar,
  AlertCircle,
  HelpCircle,
  Edit3,
  Trash2,
  Download,
  FileSpreadsheet,
  FileCode,
  ChevronDown,
} from 'lucide-react';

interface EvidenceRegisterProps {
  records: RelationshipRecord[];
  onSelectRecord: (record: RelationshipRecord) => void;
  onEditRecord: (record: RelationshipRecord) => void;
  onDeleteRecord: (recordId: string) => void;
  onNewRecord: () => void;
  initialFilterStatus?: EvidenceStatus | 'all';
  initialSearchQuery?: string;
}

export const EvidenceRegister: React.FC<EvidenceRegisterProps> = ({
  records,
  onSelectRecord,
  onEditRecord,
  onDeleteRecord,
  onNewRecord,
  initialFilterStatus = 'all',
  initialSearchQuery = '',
}) => {
  const [searchTerm, setSearchTerm] = useState(initialSearchQuery);
  const [statusFilter, setStatusFilter] = useState<EvidenceStatus | 'all'>(initialFilterStatus);
  const [typeFilter, setTypeFilter] = useState<RelationshipType | 'all'>('all');
  const [sortField, setSortField] = useState<'project' | 'status' | 'date'>('project');
  const [sortAsc, setSortAsc] = useState(true);
  const [activeGapRecord, setActiveGapRecord] = useState<RelationshipRecord | null>(null);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  // Filter & sort logic
  const filteredRecords = useMemo(() => {
    return records
      .filter((r) => {
        // Status filter
        if (statusFilter !== 'all' && r.evidence_status !== statusFilter) return false;
        // Type filter
        if (typeFilter !== 'all' && r.relationship_type !== typeFilter) return false;
        // Search term
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const match =
            r.project.toLowerCase().includes(q) ||
            r.institution_or_process.toLowerCase().includes(q) ||
            r.notes.toLowerCase().includes(q) ||
            r.source_passage.toLowerCase().includes(q) ||
            r.source_url.toLowerCase().includes(q);
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortField === 'project') {
          const comp = a.project.localeCompare(b.project);
          return sortAsc ? comp : -comp;
        }
        if (sortField === 'status') {
          const comp = a.evidence_status.localeCompare(b.evidence_status);
          return sortAsc ? comp : -comp;
        }
        if (sortField === 'date') {
          const comp = (a.access_date || '').localeCompare(b.access_date || '');
          return sortAsc ? comp : -comp;
        }
        return 0;
      });
  }, [records, statusFilter, typeFilter, searchTerm, sortField, sortAsc]);

  // Status counters
  const statusCounts = useMemo(() => {
    return {
      all: records.length,
      independently_verified: records.filter((r) => r.evidence_status === 'independently_verified').length,
      documented: records.filter((r) => r.evidence_status === 'documented').length,
      candidate: records.filter((r) => r.evidence_status === 'candidate').length,
      gap: records.filter((r) => r.evidence_status === 'gap').length,
    };
  }, [records]);

  const handleStatusFilterClick = (status: EvidenceStatus | 'all') => {
    setStatusFilter(status);
    if (status === 'gap') {
      const firstGap = records.find((r) => r.evidence_status === 'gap');
      if (firstGap) setActiveGapRecord(firstGap);
    } else {
      setActiveGapRecord(null);
    }
  };

  const handleExportCsv = () => {
    if (filteredRecords.length === 0) return;
    const csvContent = exportRecordsToCsv(filteredRecords);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().split('T')[0];
    link.href = url;
    link.setAttribute('download', `observatory_evidence_filtered_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setExportDropdownOpen(false);
    setExportFeedback(`Exported ${filteredRecords.length} filtered records as CSV`);
    setTimeout(() => setExportFeedback(null), 3500);
  };

  const handleExportJson = () => {
    if (filteredRecords.length === 0) return;
    const jsonContent = JSON.stringify(filteredRecords, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().split('T')[0];
    link.href = url;
    link.setAttribute('download', `observatory_evidence_filtered_${timestamp}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setExportDropdownOpen(false);
    setExportFeedback(`Exported ${filteredRecords.length} filtered records as JSON`);
    setTimeout(() => setExportFeedback(null), 3500);
  };

  const getStatusText = (status: EvidenceStatus) => {
    switch (status) {
      case 'independently_verified':
        return 'Independently Verified';
      case 'documented':
        return 'Documented Citation';
      case 'candidate':
        return 'Candidate Claim';
      case 'gap':
        return 'Evidence Gap';
    }
  };

  const getStatusBadge = (status: EvidenceStatus) => {
    switch (status) {
      case 'independently_verified':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#1C1917]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#166534]" />
            <span>Independently Verified</span>
          </span>
        );
      case 'documented':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#334155]">
            <FileText className="w-3.5 h-3.5 text-[#475569]" />
            <span>Documented</span>
          </span>
        );
      case 'candidate':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#92400E]">
            <HelpCircle className="w-3.5 h-3.5 text-[#D97706]" />
            <span>Candidate</span>
          </span>
        );
      case 'gap':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#991B1B]">
            <AlertCircle className="w-3.5 h-3.5 text-[#DC2626]" />
            <span>Evidence Gap</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Editorial Description */}
      <div className="border-b border-[#E7E3DC] pb-5">
        <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-3">
          <div>
            <h1 className="text-2xl lg:text-3xl font-serif font-medium text-[#1C1917] tracking-tight">
              Evidence Register
            </h1>
            <p className="text-sm text-[#57534E] mt-1 max-w-2xl leading-relaxed">
              The primary researcher's working ledger. Every entry connects an open-source AI project to a standardisation body or regulatory process, anchored by source URLs, verbatim passages, and audit evaluations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-[#78716C]">
            <span>Schema</span>
            <span aria-hidden="true">·</span>
            <span>Audited Records</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-[#1C1917] font-medium">
              {filteredRecords.length} records shown
            </span>

            <div className="flex items-center gap-1 sm:ml-2">
              <button
                onClick={handleExportCsv}
                disabled={filteredRecords.length === 0}
                className="px-2 py-1 text-[11px] font-medium text-[#166534] bg-[#F0FDF4] hover:bg-[#DCFCE7] border border-[#BBF7D0] rounded transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title={`Export ${filteredRecords.length} filtered records as CSV`}
              >
                <FileSpreadsheet className="w-3 h-3" />
                <span>CSV</span>
              </button>
              <button
                onClick={handleExportJson}
                disabled={filteredRecords.length === 0}
                className="px-2 py-1 text-[11px] font-medium text-[#1E3A8A] bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] rounded transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title={`Export ${filteredRecords.length} filtered records as JSON`}
              >
                <FileCode className="w-3 h-3" />
                <span>JSON</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Special Gap Explanation Callout (Activated when clicking Gap status or inspecting a gap row) */}
      {activeGapRecord && (
        <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-lg space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0" />
              <h3 className="text-sm font-semibold text-[#991B1B]">
                Evidence Gap Action Directive: {activeGapRecord.project} ↔ {activeGapRecord.institution_or_process}
              </h3>
            </div>
            <button
              onClick={() => setActiveGapRecord(null)}
              className="text-[#991B1B] hover:text-[#7F1D1D] text-xs font-medium cursor-pointer"
            >
              Dismiss Directive
            </button>
          </div>

          <p className="text-xs text-[#7F1D1D] leading-relaxed">
            <strong>Current Audit Finding:</strong> {activeGapRecord.notes}
          </p>

          <div className="p-3 bg-white/80 border border-[#FCA5A5] rounded text-xs text-[#1C1917] space-y-1">
            <span className="font-semibold text-[#991B1B] block">Required Primary Research Steps:</span>
            <p className="text-xs text-[#374151]">
              {activeGapRecord.gap_recommendation ||
                'Direct the investigation away from GitHub code repositories and toward official committee records, meeting attendance registers, accredited national standardization body lists (e.g. DIN, AFNOR, BSI), or FOIA access requests. Informal repository links do not establish committee participation.'}
            </p>
          </div>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-3 bg-white border border-[#E7E3DC] rounded-lg">
        {/* Status Segmented Controls */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0">
          <button
            onClick={() => handleStatusFilterClick('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-[#1C1917] text-white'
                : 'text-[#57534E] hover:text-[#1C1917] hover:bg-[#FAF8F5]'
            }`}
          >
            All ({statusCounts.all})
          </button>

          <button
            onClick={() => handleStatusFilterClick('independently_verified')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
              statusFilter === 'independently_verified'
                ? 'bg-[#166534] text-white'
                : 'text-[#57534E] hover:text-[#166534] hover:bg-[#FAF8F5]'
            }`}
          >
            Independently Verified ({statusCounts.independently_verified})
          </button>

          <button
            onClick={() => handleStatusFilterClick('documented')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
              statusFilter === 'documented'
                ? 'bg-[#334155] text-white'
                : 'text-[#57534E] hover:text-[#334155] hover:bg-[#FAF8F5]'
            }`}
          >
            Documented ({statusCounts.documented})
          </button>

          <button
            onClick={() => handleStatusFilterClick('candidate')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
              statusFilter === 'candidate'
                ? 'bg-[#D97706] text-white'
                : 'text-[#57534E] hover:text-[#D97706] hover:bg-[#FAF8F5]'
            }`}
          >
            Candidate Claims ({statusCounts.candidate})
          </button>

          <button
            onClick={() => handleStatusFilterClick('gap')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
              statusFilter === 'gap'
                ? 'bg-[#DC2626] text-white'
                : 'text-[#DC2626] hover:bg-[#FEF2F2]'
            }`}
          >
            Evidence Gaps ({statusCounts.gap})
          </button>
        </div>

        {/* Search & Type Dropdown */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search project, notes, source..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#DDD6C8] rounded focus:outline-none focus:border-[#9A3412] text-[#1C1917]"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="text-xs bg-[#FAF8F5] border border-[#DDD6C8] rounded px-2.5 py-1.5 text-[#1C1917] focus:outline-none focus:border-[#9A3412]"
          >
            <option value="all">All Relationship Types</option>
            <option value="formal_membership">Formal Membership</option>
            <option value="technical_contribution">Technical Contribution</option>
            <option value="consultation_response">Consultation Response</option>
            <option value="documented_citation">Documented Citation</option>
            <option value="declared_alignment">Declared Alignment</option>
            <option value="contextual_relevance">Contextual Relevance</option>
            <option value="unresolved">Unresolved</option>
          </select>

          {/* Export Filtered Dropdown */}
          <div className="relative shrink-0">
            <button
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
              disabled={filteredRecords.length === 0}
              className={`px-3 py-1.5 text-xs font-medium border rounded transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                filteredRecords.length === 0
                  ? 'bg-[#FAF8F5] text-[#A8A29E] border-[#E7E3DC] cursor-not-allowed opacity-60'
                  : 'bg-[#F2EDE4]/80 hover:bg-[#EBE4D8] text-[#1C1917] border-[#DDD6C8]'
              }`}
              title={
                filteredRecords.length === 0
                  ? 'No records matching current filters'
                  : `Export ${filteredRecords.length} filtered records`
              }
            >
              <Download className="w-3.5 h-3.5 text-[#57534E]" />
              <span>Export ({filteredRecords.length})</span>
              <ChevronDown className="w-3 h-3 text-[#78716C]" />
            </button>

            {exportDropdownOpen && (
              <div className="absolute right-0 mt-1 w-56 bg-white border border-[#E7E3DC] rounded-lg shadow-lg py-1 z-30 text-xs">
                <div className="px-3 py-1.5 border-b border-[#F2EDE4] text-[11px] text-[#78716C] font-mono">
                  Export {filteredRecords.length} filtered records:
                </div>
                <button
                  onClick={handleExportCsv}
                  className="w-full text-left px-3 py-2 hover:bg-[#FAF8F5] text-[#1C1917] flex items-center gap-2.5 cursor-pointer transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-[#166534] shrink-0" />
                  <div>
                    <span className="font-semibold block text-xs">Download as CSV</span>
                    <span className="text-[10px] text-[#78716C] block leading-tight">Spreadsheet format (.csv)</span>
                  </div>
                </button>
                <button
                  onClick={handleExportJson}
                  className="w-full text-left px-3 py-2 hover:bg-[#FAF8F5] text-[#1C1917] flex items-center gap-2.5 cursor-pointer transition-colors"
                >
                  <FileCode className="w-4 h-4 text-[#1E3A8A] shrink-0" />
                  <div>
                    <span className="font-semibold block text-xs">Download as JSON</span>
                    <span className="text-[10px] text-[#78716C] block leading-tight">Structured array (.json)</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onNewRecord}
            className="px-3 py-1.5 text-xs font-medium text-white bg-[#1C1917] hover:bg-[#292524] rounded transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Record</span>
          </button>
        </div>
      </div>

      {/* Export Feedback Banner */}
      {exportFeedback && (
        <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg text-xs text-[#166534] flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#166534] shrink-0" />
            <span className="font-medium">{exportFeedback}</span>
          </div>
          <span className="text-[11px] text-[#15803D] font-mono">Download started</span>
        </div>
      )}

      {/* Main Working Table */}
      <div className="bg-white border border-[#E7E3DC] rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#E7E3DC] text-[#78716C] uppercase tracking-wider text-[11px]">
                <th
                  onClick={() => {
                    if (sortField === 'project') setSortAsc(!sortAsc);
                    else {
                      setSortField('project');
                      setSortAsc(true);
                    }
                  }}
                  className="py-3 px-4 font-semibold cursor-pointer hover:text-[#1C1917]"
                >
                  <div className="flex items-center gap-1">
                    <span>Project & Process</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 font-semibold">Claimed Relationship</th>
                <th
                  onClick={() => {
                    if (sortField === 'status') setSortAsc(!sortAsc);
                    else {
                      setSortField('status');
                      setSortAsc(true);
                    }
                  }}
                  className="py-3 px-4 font-semibold cursor-pointer hover:text-[#1C1917]"
                >
                  <div className="flex items-center gap-1">
                    <span>Audit Status</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 font-semibold min-w-[280px]">Supporting Evidence & Notes</th>
                <th
                  onClick={() => {
                    if (sortField === 'date') setSortAsc(!sortAsc);
                    else {
                      setSortField('date');
                      setSortAsc(true);
                    }
                  }}
                  className="py-3 px-4 font-semibold cursor-pointer hover:text-[#1C1917]"
                >
                  <div className="flex items-center gap-1">
                    <span>Audited Date</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2EFE9]">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-4 text-center text-[#78716C]">
                    <p className="text-sm">No evidence records match the current filter or search criteria.</p>
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                        setTypeFilter('all');
                      }}
                      className="mt-2 text-xs text-[#9A3412] hover:underline cursor-pointer"
                    >
                      Clear all filters
                    </button>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const isGap = record.evidence_status === 'gap';

                  return (
                    <tr
                      key={record.id}
                      className={`hover:bg-[#FAF8F5]/80 transition-colors ${
                        activeGapRecord?.id === record.id ? 'bg-[#FEF2F2]/50' : ''
                      }`}
                    >
                      {/* Project & Institution */}
                      <td className="py-3 px-4 align-top">
                        <div className="font-semibold text-[#1C1917] text-[13px]">
                          {record.project}
                        </div>
                        <div className="text-xs text-[#57534E] mt-0.5">
                          {record.institution_or_process}
                        </div>
                        {record.source_url && (
                          <a
                            href={record.source_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-[#9A3412] hover:underline mt-1.5"
                          >
                            <span>Inspect source link</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </td>

                      {/* Relationship Type */}
                      <td className="py-3 px-4 align-top">
                        <div className="font-medium text-[#1C1917]">
                          {record.relationship_type.replace(/_/g, ' ')}
                        </div>
                        <div className="text-[11px] text-[#78716C] mt-0.5">
                          Reviewer: {record.reviewer || 'Observer'}
                        </div>
                      </td>

                      {/* Evidence Status */}
                      <td className="py-3 px-4 align-top">
                        <button
                          onClick={() => {
                            if (isGap) {
                              setActiveGapRecord(record);
                            } else {
                              onSelectRecord(record);
                            }
                          }}
                          className="cursor-pointer text-left group"
                          title={isGap ? 'Click to view gap guidance directive' : 'Inspect record details'}
                        >
                          {getStatusBadge(record.evidence_status)}
                          {isGap && (
                            <span className="block text-[11px] text-[#DC2626] group-hover:underline mt-0.5">
                              View action directive →
                            </span>
                          )}
                        </button>
                      </td>

                      {/* Evidence Passage & Reviewer Notes */}
                      <td className="py-3 px-4 align-top space-y-1.5">
                        {record.source_passage ? (
                          <div className="text-xs text-[#292524] italic bg-[#FAF8F5] p-2 border border-[#E7E3DC] rounded leading-relaxed">
                            "{record.source_passage}"
                          </div>
                        ) : (
                          <div className="text-xs text-[#78716C] italic">
                            No verbatim passage recorded.
                          </div>
                        )}

                        {record.notes && (
                          <div className="text-[11px] text-[#57534E] leading-normal">
                            <strong className="text-[#1C1917]">Note:</strong> {record.notes}
                          </div>
                        )}
                      </td>

                      {/* Access Date */}
                      <td className="py-3 px-4 align-top whitespace-nowrap text-[#78716C] font-mono tabular-nums text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-[#A8A29E]" />
                          <span>{record.access_date || 'Undated'}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 align-top text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onEditRecord(record)}
                            className="p-1.5 text-[#57534E] hover:text-[#1C1917] hover:bg-[#F2EDE4] rounded transition-colors cursor-pointer"
                            title="Edit Record"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteRecord(record.id)}
                            className="p-1.5 text-[#78716C] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded transition-colors cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
