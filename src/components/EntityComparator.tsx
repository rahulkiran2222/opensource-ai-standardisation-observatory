import React, { useState, useMemo } from 'react';
import { Entity, RelationshipRecord, EntityType, EvidenceStatus } from '../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  ArrowLeftRight,
  Database,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  AlertCircle,
  Layers,
  Sparkles,
  X,
  TrendingUp,
} from 'lucide-react';

interface EntityComparatorProps {
  entities: Entity[];
  records: RelationshipRecord[];
  onSelectRecord: (record: RelationshipRecord) => void;
  onFilterByEntity: (entityName: string) => void;
  initialEntityA?: string;
  initialEntityB?: string;
  onClose?: () => void;
}

export const EntityComparator: React.FC<EntityComparatorProps> = ({
  entities,
  records,
  onSelectRecord,
  onFilterByEntity,
  initialEntityA,
  initialEntityB,
  onClose,
}) => {
  // Select initial entities default: PyTorch vs vLLM
  const [entityAName, setEntityAName] = useState<string>(
    initialEntityA || (entities.length > 0 ? entities[0].name : '')
  );
  const [entityBName, setEntityBName] = useState<string>(
    initialEntityB || (entities.length > 2 ? entities[2].name : entities[1]?.name || '')
  );

  const entityA = useMemo(
    () => entities.find((e) => e.name.toLowerCase() === entityAName.toLowerCase()),
    [entities, entityAName]
  );

  const entityB = useMemo(
    () => entities.find((e) => e.name.toLowerCase() === entityBName.toLowerCase()),
    [entities, entityBName]
  );

  // Filter records for each entity
  const recordsA = useMemo(() => {
    if (!entityAName) return [];
    const low = entityAName.toLowerCase();
    return records.filter(
      (r) => r.project.toLowerCase() === low || r.institution_or_process.toLowerCase() === low
    );
  }, [entityAName, records]);

  const recordsB = useMemo(() => {
    if (!entityBName) return [];
    const low = entityBName.toLowerCase();
    return records.filter(
      (r) => r.project.toLowerCase() === low || r.institution_or_process.toLowerCase() === low
    );
  }, [entityBName, records]);

  // Direct relationship between A and B if any
  const directRelations = useMemo(() => {
    if (!entityAName || !entityBName) return [];
    const lowA = entityAName.toLowerCase();
    const lowB = entityBName.toLowerCase();
    return records.filter(
      (r) =>
        (r.project.toLowerCase() === lowA && r.institution_or_process.toLowerCase() === lowB) ||
        (r.project.toLowerCase() === lowB && r.institution_or_process.toLowerCase() === lowA)
    );
  }, [entityAName, entityBName, records]);

  // Partners and shared bodies
  const comparisonStats = useMemo(() => {
    const getPartners = (entityName: string, recs: RelationshipRecord[]) => {
      const low = entityName.toLowerCase();
      const set = new Set<string>();
      recs.forEach((r) => {
        const partner = r.project.toLowerCase() === low ? r.institution_or_process : r.project;
        set.add(partner);
      });
      return set;
    };

    const partnersA = getPartners(entityAName, recordsA);
    const partnersB = getPartners(entityBName, recordsB);

    const sharedPartners = Array.from(partnersA).filter((p) => partnersB.has(p));

    const getVerifiedRate = (recs: RelationshipRecord[]) => {
      if (recs.length === 0) return 0;
      const verified = recs.filter(
        (r) => r.evidence_status === 'independently_verified' || r.evidence_status === 'documented'
      ).length;
      return Math.round((verified / recs.length) * 100);
    };

    const getGapCount = (recs: RelationshipRecord[]) => {
      return recs.filter((r) => r.evidence_status === 'gap').length;
    };

    return {
      partnersCountA: partnersA.size,
      partnersCountB: partnersB.size,
      sharedPartners,
      verifiedPctA: getVerifiedRate(recordsA),
      verifiedPctB: getVerifiedRate(recordsB),
      gapsA: getGapCount(recordsA),
      gapsB: getGapCount(recordsB),
    };
  }, [entityAName, entityBName, recordsA, recordsB]);

  // Comparative chronological timeline data for Recharts
  const comparativeTrendData = useMemo(() => {
    const periods = [
      { key: '2025-Q3', label: 'Q3 2025' },
      { key: '2025-Q4', label: 'Q4 2025' },
      { key: '2026-01', label: 'Jan 2026' },
      { key: '2026-02', label: 'Feb 2026' },
      { key: '2026-03', label: 'Mar 2026' },
      { key: '2026-04', label: 'Apr 2026' },
    ];

    const countForEntityInPeriod = (recs: RelationshipRecord[], periodKey: string) => {
      return recs.filter((r) => {
        const d = r.access_date || r.audit_timestamp || '';
        if (periodKey === '2025-Q3') {
          return d.startsWith('2025-07') || d.startsWith('2025-08') || d.startsWith('2025-09');
        }
        if (periodKey === '2025-Q4') {
          return d.startsWith('2025-10') || d.startsWith('2025-11') || d.startsWith('2025-12') || d.startsWith('2025');
        }
        return d.startsWith(periodKey);
      }).length;
    };

    return periods.map((p) => ({
      period: p.label,
      [entityAName || 'Entity A']: countForEntityInPeriod(recordsA, p.key),
      [entityBName || 'Entity B']: countForEntityInPeriod(recordsB, p.key),
    }));
  }, [entityAName, entityBName, recordsA, recordsB]);

  // Quick preset pairings
  const applyPreset = (nameA: string, nameB: string) => {
    setEntityAName(nameA);
    setEntityBName(nameB);
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
            Evidence Gap
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-[#DDD6C8] rounded-xl p-5 space-y-6 shadow-sm">
      {/* Comparator Header & Close Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E7E3DC] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#FDF2E9] border border-[#FDBA74] flex items-center justify-center text-[#9A3412]">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <h2 className="text-base font-serif font-semibold text-[#1C1917]">
              Entity Comparator & Head-to-Head Analysis
            </h2>
          </div>
          <p className="text-xs text-[#57534E]">
            Compare standardisation participation, assurance levels, shared working groups, and interaction frequency trends side by side.
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAF8F5] rounded border border-[#E7E3DC] cursor-pointer self-start sm:self-auto"
            title="Close comparator"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Entity Selection Controls & Presets Bar */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Selector A */}
          <div className="p-3 bg-[#FAF8F5] border border-[#E7E3DC] rounded-lg space-y-1.5">
            <label className="text-[11px] font-semibold text-[#9A3412] uppercase tracking-wider block">
              Entity A (Terracotta Series):
            </label>
            <select
              value={entityAName}
              onChange={(e) => setEntityAName(e.target.value)}
              className="w-full text-xs bg-white border border-[#DDD6C8] rounded-md px-3 py-2 text-[#1C1917] focus:outline-none focus:border-[#9A3412] font-medium"
            >
              {entities.map((ent) => (
                <option key={ent.id} value={ent.name}>
                  {ent.name} ({ent.entity_type.replace(/_/g, ' ')})
                </option>
              ))}
            </select>
          </div>

          {/* Selector B */}
          <div className="p-3 bg-[#FAF8F5] border border-[#E7E3DC] rounded-lg space-y-1.5">
            <label className="text-[11px] font-semibold text-[#1E3A8A] uppercase tracking-wider block">
              Entity B (Navy Series):
            </label>
            <select
              value={entityBName}
              onChange={(e) => setEntityBName(e.target.value)}
              className="w-full text-xs bg-white border border-[#DDD6C8] rounded-md px-3 py-2 text-[#1C1917] focus:outline-none focus:border-[#1E3A8A] font-medium"
            >
              {entities.map((ent) => (
                <option key={ent.id} value={ent.name}>
                  {ent.name} ({ent.entity_type.replace(/_/g, ' ')})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Comparison Presets */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#78716C]">
          <span className="text-[11px] font-mono mr-1">Quick Presets:</span>
          <button
            onClick={() => applyPreset('PyTorch', 'vLLM')}
            className="px-2.5 py-1 bg-white hover:bg-[#F2EDE4] border border-[#E7E3DC] rounded text-[11px] text-[#57534E] hover:text-[#1C1917] cursor-pointer transition-colors"
          >
            PyTorch vs. vLLM
          </button>
          <button
            onClick={() => applyPreset('PyTorch', 'Transformers (Hugging Face)')}
            className="px-2.5 py-1 bg-white hover:bg-[#F2EDE4] border border-[#E7E3DC] rounded text-[11px] text-[#57534E] hover:text-[#1C1917] cursor-pointer transition-colors"
          >
            PyTorch vs. Transformers
          </button>
          <button
            onClick={() => applyPreset('CEN-CENELEC JTC 21', 'ISO/IEC JTC 1/SC 42')}
            className="px-2.5 py-1 bg-white hover:bg-[#F2EDE4] border border-[#E7E3DC] rounded text-[11px] text-[#57534E] hover:text-[#1C1917] cursor-pointer transition-colors"
          >
            CEN-CENELEC vs. ISO/IEC
          </button>
          <button
            onClick={() => applyPreset('Linux Foundation AI & Data', 'European Commission')}
            className="px-2.5 py-1 bg-white hover:bg-[#F2EDE4] border border-[#E7E3DC] rounded text-[11px] text-[#57534E] hover:text-[#1C1917] cursor-pointer transition-colors"
          >
            Linux Foundation vs. EU Commission
          </button>
        </div>
      </div>

      {/* Head-to-Head Quantitative Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-white border border-[#E7E3DC] rounded-lg">
          <span className="text-[10px] text-[#78716C] uppercase font-mono block">Audited Records</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-serif font-bold text-[#9A3412] font-mono tabular-nums">
              {recordsA.length}
            </span>
            <span className="text-xs text-[#78716C]">vs</span>
            <span className="text-xl font-serif font-bold text-[#1E3A8A] font-mono tabular-nums">
              {recordsB.length}
            </span>
          </div>
          <span className="text-[10px] text-[#78716C] block mt-0.5">total documented ties</span>
        </div>

        <div className="p-3 bg-white border border-[#E7E3DC] rounded-lg">
          <span className="text-[10px] text-[#78716C] uppercase font-mono block">Verification Rate</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-serif font-bold text-[#9A3412] font-mono tabular-nums">
              {comparisonStats.verifiedPctA}%
            </span>
            <span className="text-xs text-[#78716C]">vs</span>
            <span className="text-xl font-serif font-bold text-[#1E3A8A] font-mono tabular-nums">
              {comparisonStats.verifiedPctB}%
            </span>
          </div>
          <span className="text-[10px] text-[#78716C] block mt-0.5">high-assurance ratio</span>
        </div>

        <div className="p-3 bg-white border border-[#E7E3DC] rounded-lg">
          <span className="text-[10px] text-[#78716C] uppercase font-mono block">Partners Engaged</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-serif font-bold text-[#9A3412] font-mono tabular-nums">
              {comparisonStats.partnersCountA}
            </span>
            <span className="text-xs text-[#78716C]">vs</span>
            <span className="text-xl font-serif font-bold text-[#1E3A8A] font-mono tabular-nums">
              {comparisonStats.partnersCountB}
            </span>
          </div>
          <span className="text-[10px] text-[#78716C] block mt-0.5">distinct institutions</span>
        </div>

        <div className="p-3 bg-white border border-[#E7E3DC] rounded-lg">
          <span className="text-[10px] text-[#78716C] uppercase font-mono block">Evidence Gaps</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-serif font-bold text-[#DC2626] font-mono tabular-nums">
              {comparisonStats.gapsA}
            </span>
            <span className="text-xs text-[#78716C]">vs</span>
            <span className="text-xl font-serif font-bold text-[#DC2626] font-mono tabular-nums">
              {comparisonStats.gapsB}
            </span>
          </div>
          <span className="text-[10px] text-[#78716C] block mt-0.5">unverified claims</span>
        </div>
      </div>

      {/* Shared Standards Bodies & Direct Relationships Banner */}
      <div className="p-3 bg-[#FAF8F5] border border-[#DDD6C8] rounded-lg space-y-2 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#9A3412]" />
            <strong className="text-[#1C1917]">Shared Standardisation Interfaces:</strong>
            <span className="text-[#57534E]">
              {comparisonStats.sharedPartners.length > 0
                ? comparisonStats.sharedPartners.join(', ')
                : 'No shared partner institutions cataloged.'}
            </span>
          </div>

          {directRelations.length > 0 && (
            <div className="px-2 py-0.5 bg-[#FEF3C7] border border-[#FCD34D] rounded text-[#78350F] font-medium text-[11px] flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-[#B45309]" />
              <span>Direct Link Cataloged ({directRelations.length} edge)</span>
            </div>
          )}
        </div>
      </div>

      {/* Side-by-Side Interaction Frequency Trends (Recharts) */}
      <div className="bg-white border border-[#E7E3DC] rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#9A3412]" />
            <h3 className="text-sm font-serif font-semibold text-[#1C1917]">
              Side-by-Side Activity Frequency Trends
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[#78716C]">
            Quarterly & Monthly Distribution
          </span>
        </div>

        <div className="h-56 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={comparativeTrendData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E7E3DC" vertical={false} />
              <XAxis
                dataKey="period"
                stroke="#78716C"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#DDD6C8' }}
              />
              <YAxis
                stroke="#78716C"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1C1917',
                  borderColor: '#38332E',
                  borderRadius: '6px',
                  color: '#FAF8F5',
                  fontSize: '11px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar
                dataKey={entityAName || 'Entity A'}
                fill="#9A3412"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey={entityBName || 'Entity B'}
                fill="#1E3A8A"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Side-by-Side Participation Records Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Column A: Entity A Records */}
        <div className="p-4 bg-white border border-[#E7E3DC] rounded-lg space-y-3">
          <div className="flex items-center justify-between border-b border-[#F2EDE4] pb-2">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#9A3412] font-semibold block">
                Entity A Ledger
              </span>
              <h4 className="text-sm font-semibold text-[#1C1917]">{entityAName}</h4>
            </div>
            <span className="text-xs font-mono text-[#78716C] bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#E7E3DC]">
              {recordsA.length} records
            </span>
          </div>

          {recordsA.length === 0 ? (
            <p className="text-xs text-[#78716C] italic py-4 text-center">
              No participation records logged for {entityAName}.
            </p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {recordsA.map((rec) => {
                const partner =
                  rec.project.toLowerCase() === entityAName.toLowerCase()
                    ? rec.institution_or_process
                    : rec.project;
                return (
                  <div
                    key={rec.id}
                    onClick={() => onSelectRecord(rec)}
                    className="p-2.5 bg-[#FAF8F5] hover:bg-[#FDF2E9] border border-[#E7E3DC] hover:border-[#FDBA74] rounded text-xs cursor-pointer transition-colors space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[#1C1917] truncate">{partner}</span>
                      {getStatusBadge(rec.evidence_status)}
                    </div>
                    <div className="text-[11px] text-[#9A3412]">
                      {rec.relationship_type.replace(/_/g, ' ')}
                    </div>
                    {rec.notes && (
                      <p className="text-[11px] text-[#57534E] line-clamp-2">{rec.notes}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Column B: Entity B Records */}
        <div className="p-4 bg-white border border-[#E7E3DC] rounded-lg space-y-3">
          <div className="flex items-center justify-between border-b border-[#F2EDE4] pb-2">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#1E3A8A] font-semibold block">
                Entity B Ledger
              </span>
              <h4 className="text-sm font-semibold text-[#1C1917]">{entityBName}</h4>
            </div>
            <span className="text-xs font-mono text-[#78716C] bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#E7E3DC]">
              {recordsB.length} records
            </span>
          </div>

          {recordsB.length === 0 ? (
            <p className="text-xs text-[#78716C] italic py-4 text-center">
              No participation records logged for {entityBName}.
            </p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {recordsB.map((rec) => {
                const partner =
                  rec.project.toLowerCase() === entityBName.toLowerCase()
                    ? rec.institution_or_process
                    : rec.project;
                return (
                  <div
                    key={rec.id}
                    onClick={() => onSelectRecord(rec)}
                    className="p-2.5 bg-[#FAF8F5] hover:bg-[#EFF6FF] border border-[#E7E3DC] hover:border-[#BFDBFE] rounded text-xs cursor-pointer transition-colors space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[#1C1917] truncate">{partner}</span>
                      {getStatusBadge(rec.evidence_status)}
                    </div>
                    <div className="text-[11px] text-[#1E3A8A]">
                      {rec.relationship_type.replace(/_/g, ' ')}
                    </div>
                    {rec.notes && (
                      <p className="text-[11px] text-[#57534E] line-clamp-2">{rec.notes}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
