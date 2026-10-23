import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Plus,
  Database,
  Network,
  Search,
  BarChart3,
  BookOpen,
  Menu,
  X,
  ArrowRight,
  ExternalLink,
  FileText,
  CornerDownLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { Entity, RelationshipRecord, EvidenceStatus } from '../types';

export type NavTab = 'network' | 'register' | 'matcher' | 'reporting' | 'codebook';

interface TopBarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenNewRecordModal: () => void;
  onOpenCsvModal: () => void;
  totalRecordsCount: number;
  entities?: Entity[];
  records?: RelationshipRecord[];
  onSelectRecord?: (record: RelationshipRecord) => void;
  onSelectEntity?: (entityName: string) => void;
  onSearchSubmit?: (query: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onTabChange,
  onOpenNewRecordModal,
  onOpenCsvModal,
  totalRecordsCount,
  entities = [],
  records = [],
  onSelectRecord,
  onSelectEntity,
  onSearchSubmit,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const [stage2DropdownOpen, setStage2DropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const stage2MenuRef = useRef<HTMLDivElement>(null);

  // Close search & stage2 dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setSearchDropdownOpen(false);
      }
      if (
        stage2MenuRef.current &&
        !stage2MenuRef.current.contains(event.target as Node)
      ) {
        setStage2DropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut: '/' or 'Cmd/Ctrl + K' focuses the global search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') ||
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchDropdownOpen(true);
      } else if (e.key === 'Escape') {
        setSearchDropdownOpen(false);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute matched entities and records
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { matchedEntities: [], matchedRecords: [], totalMatches: 0 };

    const matchedEntities = entities
      .filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.entity_type.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q) ||
          e.lead_maintainer_or_secretariat?.toLowerCase().includes(q)
      )
      .slice(0, 4);

    const matchedRecords = records
      .filter(
        (r) =>
          r.project.toLowerCase().includes(q) ||
          r.institution_or_process.toLowerCase().includes(q) ||
          r.relationship_type.toLowerCase().includes(q) ||
          r.evidence_status.toLowerCase().includes(q) ||
          r.notes?.toLowerCase().includes(q) ||
          r.source_passage?.toLowerCase().includes(q) ||
          r.reviewer?.toLowerCase().includes(q)
      )
      .slice(0, 5);

    return {
      matchedEntities,
      matchedRecords,
      totalMatches: matchedEntities.length + matchedRecords.length,
    };
  }, [searchQuery, entities, records]);

  const handleNavClick = (tab: NavTab) => {
    onTabChange(tab);
    setMobileMenuOpen(false);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchDropdownOpen(false);
    if (onSearchSubmit) {
      onSearchSubmit(searchQuery.trim());
    } else {
      onTabChange('register');
    }
  };

  const handleSelectEntityItem = (entityName: string) => {
    setSearchDropdownOpen(false);
    setSearchQuery('');
    if (onSelectEntity) {
      onSelectEntity(entityName);
    } else {
      onTabChange('register');
    }
  };

  const handleSelectRecordItem = (rec: RelationshipRecord) => {
    setSearchDropdownOpen(false);
    setSearchQuery('');
    if (onSelectRecord) {
      onSelectRecord(rec);
    } else {
      onTabChange('register');
    }
  };

  const getStatusBadge = (status: EvidenceStatus) => {
    switch (status) {
      case 'independently_verified':
        return (
          <span className="text-[10px] font-mono text-[#166534] bg-[#F0FDF4] border border-[#BBF7D0] px-1.5 py-0.5 rounded">
            Verified
          </span>
        );
      case 'documented':
        return (
          <span className="text-[10px] font-mono text-[#1E3A8A] bg-[#EFF6FF] border border-[#BFDBFE] px-1.5 py-0.5 rounded">
            Documented
          </span>
        );
      case 'candidate':
        return (
          <span className="text-[10px] font-mono text-[#92400E] bg-[#FEF3C7] border border-[#FDE68A] px-1.5 py-0.5 rounded">
            Candidate
          </span>
        );
      case 'gap':
        return (
          <span className="text-[10px] font-mono text-[#991B1B] bg-[#FEF2F2] border border-[#FECACA] px-1.5 py-0.5 rounded">
            Gap
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E7E3DC] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 lg:gap-4">
        {/* Zone 1: Two-line compact brand header */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded border border-[#D5CEBF] bg-[#F2EDE4] flex items-center justify-center text-[#78350F] shadow-xs shrink-0">
            <Database className="w-4 h-4 stroke-[1.75]" />
          </div>
          <button
            onClick={() => handleNavClick('network')}
            className="text-left group cursor-pointer leading-tight focus:outline-hidden"
          >
            <span className="block text-[10px] font-mono uppercase tracking-wider text-[#78716C] font-medium leading-none mb-0.5">
              Open-Source AI
            </span>
            <span className="block text-[13px] sm:text-sm font-serif font-bold text-[#1C1917] group-hover:text-[#9A3412] transition-colors whitespace-nowrap leading-tight">
              Standardisation Observatory
            </span>
          </button>
        </div>

        {/* Global Search Bar (Desktop) */}
        <div ref={searchContainerRef} className="relative hidden md:block max-w-[210px] lg:max-w-[260px] w-full">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#78716C] pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchDropdownOpen(true);
              }}
              onFocus={() => {
                if (searchQuery.trim()) setSearchDropdownOpen(true);
              }}
              placeholder="Search records & entities..."
              className="w-full pl-8 pr-12 py-1 text-xs bg-[#FAF8F5] border border-[#DDD6C8] rounded-md focus:outline-none focus:border-[#9A3412] focus:bg-white text-[#1C1917] transition-all shadow-2xs"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchDropdownOpen(false);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#1C1917] text-xs cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            ) : (
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono text-[#A8A29E] bg-[#F2EDE4] px-1 py-0.5 rounded border border-[#E7E3DC] pointer-events-none">
                /
              </kbd>
            )}
          </form>

          {/* Search Results Dropdown Popover */}
          {searchDropdownOpen && searchQuery.trim().length > 0 && (
            <div className="absolute left-0 mt-1.5 w-80 lg:w-96 bg-white border border-[#E7E3DC] rounded-lg shadow-xl py-2 z-50 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-3 py-1 border-b border-[#F2EDE4] flex items-center justify-between text-[11px] text-[#78716C]">
                <span className="font-medium">
                  {searchResults.totalMatches > 0
                    ? `Found ${searchResults.totalMatches} matches for "${searchQuery}"`
                    : `No matches for "${searchQuery}"`}
                </span>
                <span className="text-[10px] font-mono text-[#A8A29E]">ESC to close</span>
              </div>

              {/* Group 1: Matching Entities */}
              {searchResults.matchedEntities.length > 0 && (
                <div className="py-1">
                  <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-[#78716C] bg-[#FAF8F5]">
                    Entities & Standards Bodies
                  </div>
                  {searchResults.matchedEntities.map((ent) => (
                    <button
                      key={ent.id}
                      onClick={() => handleSelectEntityItem(ent.name)}
                      className="w-full text-left px-3 py-1.5 hover:bg-[#FDF2E9] transition-colors flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <div className="truncate">
                        <span className="font-semibold text-[#1C1917] block truncate">
                          {ent.name}
                        </span>
                        <span className="text-[10px] text-[#78716C] capitalize block truncate">
                          {ent.entity_type.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#9A3412] font-medium flex items-center gap-1 shrink-0">
                        <span>View</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Group 2: Matching Records */}
              {searchResults.matchedRecords.length > 0 && (
                <div className="py-1 border-t border-[#F2EDE4]">
                  <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-[#78716C] bg-[#FAF8F5]">
                    Evidence Records
                  </div>
                  {searchResults.matchedRecords.map((rec) => (
                    <button
                      key={rec.id}
                      onClick={() => handleSelectRecordItem(rec)}
                      className="w-full text-left px-3 py-1.5 hover:bg-[#F2EDE4]/60 transition-colors cursor-pointer space-y-0.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-[#1C1917] truncate">
                          {rec.project} ↔ {rec.institution_or_process}
                        </span>
                        {getStatusBadge(rec.evidence_status)}
                      </div>
                      <div className="text-[10.5px] text-[#57534E] truncate">
                        {rec.source_passage ? `"${rec.source_passage}"` : rec.notes}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Search Footer Action */}
              <div className="pt-2 border-t border-[#F2EDE4] px-3">
                <button
                  onClick={() => handleSearchSubmit()}
                  className="w-full py-1.5 px-2 bg-[#FAF8F5] hover:bg-[#F2EDE4] border border-[#DDD6C8] rounded text-[11px] font-medium text-[#1C1917] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Search className="w-3 h-3 text-[#9A3412]" />
                  <span>Filter all results in Evidence Register</span>
                  <CornerDownLeft className="w-3 h-3 text-[#78716C]" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Zone 2: Navigation Links (Desktop: md and above) */}
        <nav className="hidden lg:flex items-center gap-4 xl:gap-5 text-[13px] font-medium text-[#57534E]">
          <button
            onClick={() => handleNavClick('network')}
            className={`whitespace-nowrap pb-0.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'network'
                ? 'border-[#9A3412] text-[#1C1917] font-semibold'
                : 'border-transparent hover:text-[#1C1917] hover:border-[#D5CEBF]'
            }`}
          >
            <Network className="w-3.5 h-3.5 opacity-70" />
            <span>Network</span>
          </button>

          <button
            onClick={() => handleNavClick('register')}
            className={`whitespace-nowrap pb-0.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'register'
                ? 'border-[#9A3412] text-[#1C1917] font-semibold'
                : 'border-transparent hover:text-[#1C1917] hover:border-[#D5CEBF]'
            }`}
          >
            <Database className="w-3.5 h-3.5 opacity-70" />
            <span>Evidence Register</span>
            <span className="text-[11px] font-mono tabular-nums text-[#78716C]">
              ({totalRecordsCount})
            </span>
          </button>

          <button
            onClick={() => handleNavClick('matcher')}
            className={`whitespace-nowrap pb-0.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'matcher'
                ? 'border-[#9A3412] text-[#1C1917] font-semibold'
                : 'border-transparent hover:text-[#1C1917] hover:border-[#D5CEBF]'
            }`}
          >
            <Search className="w-3.5 h-3.5 opacity-70" />
            <span>Candidate Matcher</span>
          </button>

          <button
            onClick={() => handleNavClick('reporting')}
            className={`whitespace-nowrap pb-0.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'reporting'
                ? 'border-[#9A3412] text-[#1C1917] font-semibold'
                : 'border-transparent hover:text-[#1C1917] hover:border-[#D5CEBF]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 opacity-70" />
            <span>Reports</span>
          </button>

          <button
            onClick={() => handleNavClick('codebook')}
            className={`whitespace-nowrap pb-0.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'codebook'
                ? 'border-[#9A3412] text-[#1C1917] font-semibold'
                : 'border-transparent hover:text-[#1C1917] hover:border-[#D5CEBF]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 opacity-70" />
            <span>Codebook</span>
          </button>

          {/* Stage 2 Modules Dropdown */}
          <div className="relative" ref={stage2MenuRef}>
            <button
              onClick={() => setStage2DropdownOpen(!stage2DropdownOpen)}
              className="whitespace-nowrap pb-0.5 border-b-2 border-transparent hover:text-[#1C1917] hover:border-[#D5CEBF] transition-all cursor-pointer flex items-center gap-1.5 text-[13px] font-medium text-[#57534E]"
              title="Stage 2 Empirical Analysis Modules"
            >
              <Layers className="w-3.5 h-3.5 text-[#9A3412]" />
              <span>Stage 2</span>
              <span className="text-[9.5px] font-mono px-1.5 py-0.2 bg-[#FDF2E9] text-[#9A3412] border border-[#FDBA74] rounded-full font-semibold">
                NEW
              </span>
              <ChevronDown className={`w-3 h-3 text-[#78716C] transition-transform ${stage2DropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {stage2DropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-[#E7E3DC] rounded-lg shadow-xl py-2 z-50 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-3 py-1.5 border-b border-[#F2EDE4] mb-1 flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#78716C]">
                    Stage 2 Analytical Modules
                  </span>
                  <span className="text-[10px] text-[#9A3412] font-semibold">Python Engine</span>
                </div>
                <a
                  href="pages/network-analysis.html"
                  className="flex items-start gap-2.5 px-3 py-2 hover:bg-[#FAF8F5] transition-colors"
                >
                  <span className="text-base mt-0.5">📊</span>
                  <div>
                    <div className="font-medium text-[#1C1917] flex items-center gap-1">
                      <span>Network Analysis</span>
                      <ExternalLink className="w-2.5 h-2.5 text-[#78716C]" />
                    </div>
                    <div className="text-[11px] text-[#78716C]">
                      Verified graph stats, centralities & density
                    </div>
                  </div>
                </a>
                <a
                  href="pages/brokerage-pathways.html"
                  className="flex items-start gap-2.5 px-3 py-2 hover:bg-[#FAF8F5] transition-colors"
                >
                  <span className="text-base mt-0.5">🌉</span>
                  <div>
                    <div className="font-medium text-[#1C1917] flex items-center gap-1">
                      <span>Brokerage & Pathways</span>
                      <ExternalLink className="w-2.5 h-2.5 text-[#78716C]" />
                    </div>
                    <div className="text-[11px] text-[#78716C]">
                      Bridge actors, cut vertices & multi-hop paths
                    </div>
                  </div>
                </a>
                <a
                  href="pages/temporal-analysis.html"
                  className="flex items-start gap-2.5 px-3 py-2 hover:bg-[#FAF8F5] transition-colors"
                >
                  <span className="text-base mt-0.5">⏱️</span>
                  <div>
                    <div className="font-medium text-[#1C1917] flex items-center gap-1">
                      <span>Temporal Analysis</span>
                      <ExternalLink className="w-2.5 h-2.5 text-[#78716C]" />
                    </div>
                    <div className="text-[11px] text-[#78716C]">
                      Regulatory peaks & longitudinal timeline
                    </div>
                  </div>
                </a>
                <a
                  href="pages/data-quality.html"
                  className="flex items-start gap-2.5 px-3 py-2 hover:bg-[#FAF8F5] transition-colors"
                >
                  <span className="text-base mt-0.5">🛡️</span>
                  <div>
                    <div className="font-medium text-[#1C1917] flex items-center gap-1">
                      <span>Data Quality & Audit</span>
                      <ExternalLink className="w-2.5 h-2.5 text-[#78716C]" />
                    </div>
                    <div className="text-[11px] text-[#78716C]">
                      5-field schema audit & anomaly register
                    </div>
                  </div>
                </a>
                <a
                  href="pages/research-outputs.html"
                  className="flex items-start gap-2.5 px-3 py-2 hover:bg-[#FAF8F5] transition-colors border-t border-[#F2EDE4] mt-1 pt-2"
                >
                  <span className="text-base mt-0.5">📦</span>
                  <div>
                    <div className="font-medium text-[#1C1917] flex items-center gap-1">
                      <span>Research Outputs</span>
                      <ExternalLink className="w-2.5 h-2.5 text-[#78716C]" />
                    </div>
                    <div className="text-[11px] text-[#78716C]">
                      Dataset downloads, SemVer & reproducibility
                    </div>
                  </div>
                </a>
              </div>
            )}
          </div>
        </nav>

        {/* Zone 3: Primary Actions (Desktop) & Mobile Hamburger */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Action buttons (hidden on small mobile, visible sm+) */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={onOpenCsvModal}
              className="px-3 py-1.5 text-xs font-medium text-[#57534E] hover:text-[#1C1917] bg-[#F2EDE4]/70 hover:bg-[#EBE4D8] border border-[#DDD6C8] rounded-md transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5"
              title="Import or Export CSV Dataset"
            >
              <Database className="w-3.5 h-3.5" />
              <span>CSV Data</span>
            </button>

            <button
              onClick={onOpenNewRecordModal}
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#1C1917] hover:bg-[#292524] rounded-md transition-all shadow-xs whitespace-nowrap cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Evidence</span>
            </button>
          </div>

          {/* Mobile menu toggle button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-[#57534E] hover:text-[#1C1917] hover:bg-[#EBE4D8] rounded-md transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E7E3DC] bg-[#FAF8F5] px-4 pt-2.5 pb-4 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Mobile Global Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search records & entities..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#DDD6C8] rounded-md focus:outline-none focus:border-[#9A3412] text-[#1C1917]"
            />
          </form>

          {/* Quick results in mobile view */}
          {searchQuery.trim().length > 0 && searchResults.totalMatches > 0 && (
            <div className="bg-white border border-[#E7E3DC] rounded-md p-2 space-y-1.5 max-h-48 overflow-y-auto">
              <div className="text-[10px] font-mono text-[#78716C] uppercase">
                {searchResults.totalMatches} matches found:
              </div>
              {searchResults.matchedEntities.map((ent) => (
                <button
                  key={ent.id}
                  onClick={() => {
                    handleSelectEntityItem(ent.name);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left p-1.5 rounded hover:bg-[#FAF8F5] flex items-center justify-between text-xs"
                >
                  <span className="font-medium text-[#1C1917] truncate">{ent.name}</span>
                  <span className="text-[10px] text-[#9A3412]">View</span>
                </button>
              ))}
              {searchResults.matchedRecords.map((rec) => (
                <button
                  key={rec.id}
                  onClick={() => {
                    handleSelectRecordItem(rec);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left p-1.5 rounded hover:bg-[#FAF8F5] text-xs space-y-0.5"
                >
                  <div className="font-medium text-[#1C1917] truncate">
                    {rec.project} ↔ {rec.institution_or_process}
                  </div>
                  <div className="text-[10px] text-[#78716C] truncate">
                    {rec.evidence_status.replace(/_/g, ' ')}
                  </div>
                </button>
              ))}
            </div>
          )}

          <nav className="flex flex-col space-y-1 text-sm font-medium text-[#57534E]">
            <button
              onClick={() => handleNavClick('network')}
              className={`w-full text-left px-3 py-2 rounded-md transition-all flex items-center gap-2.5 ${
                activeTab === 'network'
                  ? 'bg-[#F2EDE4] text-[#9A3412] font-semibold'
                  : 'hover:bg-[#F2EDE4]/50 hover:text-[#1C1917]'
              }`}
            >
              <Network className="w-4 h-4 opacity-70" />
              <span>Network Explorer</span>
            </button>

            <button
              onClick={() => handleNavClick('register')}
              className={`w-full text-left px-3 py-2 rounded-md transition-all flex items-center justify-between ${
                activeTab === 'register'
                  ? 'bg-[#F2EDE4] text-[#9A3412] font-semibold'
                  : 'hover:bg-[#F2EDE4]/50 hover:text-[#1C1917]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Database className="w-4 h-4 opacity-70" />
                <span>Evidence Register</span>
              </div>
              <span className="text-xs font-mono text-[#78716C] bg-[#E7E3DC]/60 px-1.5 py-0.5 rounded">
                {totalRecordsCount} records
              </span>
            </button>

            <button
              onClick={() => handleNavClick('matcher')}
              className={`w-full text-left px-3 py-2 rounded-md transition-all flex items-center gap-2.5 ${
                activeTab === 'matcher'
                  ? 'bg-[#F2EDE4] text-[#9A3412] font-semibold'
                  : 'hover:bg-[#F2EDE4]/50 hover:text-[#1C1917]'
              }`}
            >
              <Search className="w-4 h-4 opacity-70" />
              <span>Candidate Matcher</span>
            </button>

            <button
              onClick={() => handleNavClick('reporting')}
              className={`w-full text-left px-3 py-2 rounded-md transition-all flex items-center gap-2.5 ${
                activeTab === 'reporting'
                  ? 'bg-[#F2EDE4] text-[#9A3412] font-semibold'
                  : 'hover:bg-[#F2EDE4]/50 hover:text-[#1C1917]'
              }`}
            >
              <BarChart3 className="w-4 h-4 opacity-70" />
              <span>Audit & Reports</span>
            </button>

            <button
              onClick={() => handleNavClick('codebook')}
              className={`w-full text-left px-3 py-2 rounded-md transition-all flex items-center gap-2.5 ${
                activeTab === 'codebook'
                  ? 'bg-[#F2EDE4] text-[#9A3412] font-semibold'
                  : 'hover:bg-[#F2EDE4]/50 hover:text-[#1C1917]'
              }`}
            >
              <BookOpen className="w-4 h-4 opacity-70" />
              <span>Codebook & Python Engine</span>
            </button>
          </nav>

          {/* Stage 2 Modules Mobile Section */}
          <div className="pt-2 border-t border-[#E7E3DC] space-y-1">
            <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-[#78716C] flex items-center justify-between">
              <span>Stage 2 Modules (Python)</span>
              <span className="px-1.5 py-0.2 bg-[#FDF2E9] text-[#9A3412] border border-[#FDBA74] rounded-full text-[9px] font-semibold">NEW</span>
            </div>
            <a
              href="pages/network-analysis.html"
              className="w-full px-3 py-1.5 text-xs rounded-md text-[#57534E] hover:bg-[#F2EDE4] hover:text-[#1C1917] flex items-center justify-between"
            >
              <span>📊 Network Analysis & Density</span>
              <ExternalLink className="w-3 h-3 text-[#78716C]" />
            </a>
            <a
              href="pages/brokerage-pathways.html"
              className="w-full px-3 py-1.5 text-xs rounded-md text-[#57534E] hover:bg-[#F2EDE4] hover:text-[#1C1917] flex items-center justify-between"
            >
              <span>🌉 Brokerage & Pathways Tracer</span>
              <ExternalLink className="w-3 h-3 text-[#78716C]" />
            </a>
            <a
              href="pages/temporal-analysis.html"
              className="w-full px-3 py-1.5 text-xs rounded-md text-[#57534E] hover:bg-[#F2EDE4] hover:text-[#1C1917] flex items-center justify-between"
            >
              <span>⏱️ Temporal Regulatory Analysis</span>
              <ExternalLink className="w-3 h-3 text-[#78716C]" />
            </a>
            <a
              href="pages/data-quality.html"
              className="w-full px-3 py-1.5 text-xs rounded-md text-[#57534E] hover:bg-[#F2EDE4] hover:text-[#1C1917] flex items-center justify-between"
            >
              <span>🛡️ Data Quality & Audit Report</span>
              <ExternalLink className="w-3 h-3 text-[#78716C]" />
            </a>
            <a
              href="pages/research-outputs.html"
              className="w-full px-3 py-1.5 text-xs rounded-md hover:bg-[#F2EDE4] flex items-center justify-between font-medium text-[#9A3412]"
            >
              <span>📦 Research Outputs & Reproducibility</span>
              <ExternalLink className="w-3 h-3 text-[#9A3412]" />
            </a>
          </div>

          {/* Mobile action buttons row */}
          <div className="pt-2 border-t border-[#E7E3DC] flex items-center gap-2">
            <button
              onClick={() => {
                onOpenCsvModal();
                setMobileMenuOpen(false);
              }}
              className="flex-1 py-2 text-xs font-medium text-[#57534E] hover:text-[#1C1917] bg-[#F2EDE4] border border-[#DDD6C8] rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Database className="w-3.5 h-3.5" />
              <span>CSV Data</span>
            </button>

            <button
              onClick={() => {
                onOpenNewRecordModal();
                setMobileMenuOpen(false);
              }}
              className="flex-1 py-2 text-xs font-medium text-white bg-[#1C1917] hover:bg-[#292524] rounded-md transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Evidence</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
