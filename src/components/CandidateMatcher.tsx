import React, { useState, useMemo } from 'react';
import { RelationshipRecord } from '../types';
import { findCandidates } from '../utils/validation';
import {
  Search,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';

interface CandidateMatcherProps {
  records: RelationshipRecord[];
  onSelectRecord: (record: RelationshipRecord) => void;
  onEditRecord: (record: RelationshipRecord) => void;
}

export const CandidateMatcher: React.FC<CandidateMatcherProps> = ({
  records,
  onSelectRecord,
  onEditRecord,
}) => {
  const [query, setQuery] = useState('CEN-CENELEC');
  const sampleQueries = [
    'PyTorch',
    'CEN-CENELEC',
    'NIST',
    'GPAI Code of Practice',
    'model cards',
    'Harmonised',
    'vLLM',
  ];

  const candidateResults = useMemo(() => {
    return findCandidates(records, query);
  }, [records, query]);

  return (
    <div className="space-y-6">
      {/* Title & Editorial Description */}
      <div className="border-b border-[#E7E3DC] pb-5">
        <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-3">
          <div>
            <h1 className="text-2xl lg:text-3xl font-serif font-medium text-[#1C1917] tracking-tight">
              Candidate Matcher
            </h1>
            <p className="text-sm text-[#57534E] mt-1 max-w-2xl leading-relaxed">
              Automated lexical retrieval aid designed to discover candidate relationships across public mentions, repositories, and regulatory filings for subsequent human audit.
            </p>
          </div>
          <div className="text-xs text-[#78716C] font-mono">
            Component 08 · Retrieval Aid
          </div>
        </div>

        {/* Essential Academic Principle Banner */}
        <div className="mt-4 p-4 bg-[#FFFBEB] border border-[#FDE68A] rounded-lg flex items-start gap-3 text-xs text-[#92400E]">
          <ShieldAlert className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
          <div className="space-y-1 leading-relaxed">
            <strong className="font-semibold text-[#78350F] block">
              Methodological Separation: Retrieval vs. Verification
            </strong>
            <p>
              The candidate matcher finds records whose text contains relevant terms to answer: <em>"Which records should I inspect next?"</em> It <strong>cannot</strong> answer: <em>"Does this project formally participate in standardisation?"</em> A keyword match in a GitHub repository, issue thread, or press release does not prove committee accreditation, voting rights, or regulatory compliance. All matches require rigorous human verification.
            </p>
          </div>
        </div>
      </div>

      {/* Query Bar & Presets */}
      <div className="p-4 bg-white border border-[#E7E3DC] rounded-lg space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#78716C]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter research keywords (e.g., PyTorch, JTC 21, IEEE, safety, GPAI)..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-[#FAF8F5] border border-[#DDD6C8] rounded focus:outline-none focus:border-[#9A3412] text-[#1C1917]"
            />
          </div>
          {query && (
            <button
              onClick={() => setQuery('')}
              className="px-3 py-2 text-xs font-medium text-[#78716C] hover:text-[#1C1917] bg-[#FAF8F5] border border-[#DDD6C8] rounded cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Quick Sample Queries */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-[#57534E]">
          <span className="text-[#78716C]">Sample Queries:</span>
          {sampleQueries.map((q) => (
            <button
              key={q}
              onClick={() => setQuery(q)}
              className={`px-2.5 py-1 rounded border transition-colors cursor-pointer text-xs ${
                query.toLowerCase() === q.toLowerCase()
                  ? 'bg-[#1C1917] text-white border-[#1C1917]'
                  : 'bg-[#FAF8F5] hover:bg-[#F2EDE4] text-[#57534E] border-[#E7E3DC]'
              }`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-[#78716C] px-1">
        <span>
          Retrieved <strong>{candidateResults.length} candidate leads</strong> matching query terms: "
          {query.trim() || 'all'}"
        </span>
        <span className="font-mono">Unverified until human auditor signs off</span>
      </div>

      {/* Candidate Leads List */}
      <div className="space-y-3">
        {candidateResults.length === 0 ? (
          <div className="p-12 text-center bg-white border border-[#E7E3DC] rounded-lg text-[#78716C]">
            <Search className="w-8 h-8 mx-auto text-[#D5CEBF] mb-2" />
            <h3 className="text-base font-serif font-medium text-[#1C1917]">
              No candidate records matched "{query}"
            </h3>
            <p className="text-xs text-[#57534E] mt-1 max-w-md mx-auto">
              Try broader search terms or examine the Source Registry in the Codebook tab to identify new public repositories or committee portals to audit.
            </p>
          </div>
        ) : (
          candidateResults.map(({ record, matchedTerms }) => {
            const isGap = record.evidence_status === 'gap';
            const isVerified = record.evidence_status === 'independently_verified';

            return (
              <div
                key={record.id}
                className="p-5 bg-white border border-[#E7E3DC] rounded-lg hover:border-[#DDD6C8] transition-all space-y-3 shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-[#78716C]">
                      <span>Candidate Pair</span>
                      <span aria-hidden="true">·</span>
                      <span>Matched on: {matchedTerms.map((t) => `"${t}"`).join(', ')}</span>
                    </div>
                    <h3 className="text-base font-serif font-semibold text-[#1C1917] mt-0.5">
                      {record.project} ↔ {record.institution_or_process}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2 py-0.5 text-xs rounded border ${
                        isVerified
                          ? 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]'
                          : isGap
                          ? 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]'
                          : 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]'
                      }`}
                    >
                      {record.evidence_status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-[#78716C] font-mono">
                      {record.relationship_type.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Verbatim passage or repository note */}
                {record.source_passage ? (
                  <div className="p-3 bg-[#FAF8F5] border border-[#E7E3DC] rounded text-xs text-[#292524] italic leading-relaxed">
                    "{record.source_passage}"
                  </div>
                ) : (
                  <div className="p-2.5 bg-[#FEF2F2]/60 border border-[#FECACA] rounded text-xs text-[#7F1D1D]">
                    <span className="font-semibold">Absence of Primary Evidence: </span>
                    {record.notes}
                  </div>
                )}

                {/* Audit recommendation */}
                {record.gap_recommendation && (
                  <div className="text-xs text-[#57534E] bg-[#FAF8F5] p-2.5 rounded border border-[#E7E3DC]">
                    <strong className="text-[#1C1917]">Auditor Guidance: </strong>
                    {record.gap_recommendation}
                  </div>
                )}

                {/* Actions & Verification Links */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#F2EFE9] text-xs">
                  <div className="flex items-center gap-3">
                    {record.source_url && (
                      <a
                        href={record.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[#9A3412] hover:underline font-medium"
                      >
                        <span>Open Raw Source URL</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <span className="text-[#78716C]">
                      Audited: {record.access_date || 'Undated'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEditRecord(record)}
                      className="px-3 py-1.5 text-xs font-medium text-[#1C1917] bg-[#F2EDE4] hover:bg-[#EBE4D8] border border-[#DDD6C8] rounded transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span>Audit & Code Relationship</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onSelectRecord(record)}
                      className="px-3 py-1.5 text-xs font-medium text-[#57534E] hover:text-[#1C1917] hover:bg-[#FAF8F5] rounded transition-colors cursor-pointer"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
