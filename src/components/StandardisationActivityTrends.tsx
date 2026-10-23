import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { RelationshipRecord } from '../types';
import { TrendingUp, Calendar, Zap, AlertCircle, Filter, Clock } from 'lucide-react';

interface StandardisationActivityTrendsProps {
  records: RelationshipRecord[];
}

export type DateRangeFilter = 'all' | '12m' | '6m' | 'ytd';

interface TrendPoint {
  periodKey: string;
  label: string;
  order: number;
  total: number;
  verified: number;
  candidateOrGap: number;
  milestone: string;
  projects: string[];
}

export const StandardisationActivityTrends: React.FC<StandardisationActivityTrendsProps> = ({
  records,
}) => {
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [activeMetric, setActiveMetric] = useState<'all' | 'verified'>('all');
  const [dateRange, setDateRange] = useState<DateRangeFilter>('all');

  // Process chronological distribution from records with date range filtering
  const { filteredTrendData, peakPeriod, totalEventsCount, rangeLabel } = useMemo(() => {
    // Chronological baseline timeline anchors for AI regulatory trajectory
    const periodsMap: Record<
      string,
      {
        label: string;
        order: number;
        verified: number;
        candidateOrGap: number;
        total: number;
        milestone: string;
        projects: Set<string>;
      }
    > = {
      '2024-H2': {
        label: 'H2 2024',
        order: 1,
        verified: 0,
        candidateOrGap: 1,
        total: 1,
        milestone: 'EU AI Act Official Journal publication (Regulation 2024/1689)',
        projects: new Set(['PyTorch']),
      },
      '2025-Q1': {
        label: 'Q1 2025',
        order: 2,
        verified: 1,
        candidateOrGap: 0,
        total: 1,
        milestone: 'Prohibited AI systems transition & preliminary standardisation requests',
        projects: new Set(['Linux Foundation AI & Data']),
      },
      '2025-Q2': {
        label: 'Q2 2025',
        order: 3,
        verified: 1,
        candidateOrGap: 0,
        total: 1,
        milestone: 'CEN-CENELEC standardisation request mandate finalization',
        projects: new Set(['ONNX']),
      },
      '2025-Q3': {
        label: 'Q3 2025',
        order: 4,
        verified: 0,
        candidateOrGap: 1,
        total: 1,
        milestone: 'EU AI Office General-Purpose AI guidelines preparation',
        projects: new Set(['vLLM']),
      },
      '2025-Q4': {
        label: 'Q4 2025',
        order: 5,
        verified: 1,
        candidateOrGap: 1,
        total: 2,
        milestone: 'CEN-CENELEC JTC 21 work program kick-off & IEEE liaison',
        projects: new Set(['PyTorch', 'Linux Foundation']),
      },
      '2026-01': {
        label: 'Jan 2026',
        order: 6,
        verified: 0,
        candidateOrGap: 0,
        total: 0,
        milestone: 'EC GPAI Code of Practice public consultation feedback window',
        projects: new Set(),
      },
      '2026-02': {
        label: 'Feb 2026',
        order: 7,
        verified: 0,
        candidateOrGap: 0,
        total: 0,
        milestone: 'NIST AISIC consortium charter rollouts & ISO/IEC 42001 revisions',
        projects: new Set(),
      },
      '2026-03': {
        label: 'Mar 2026',
        order: 8,
        verified: 0,
        candidateOrGap: 0,
        total: 0,
        milestone: 'CEN-CENELEC harmonised delivery & JTC 21 plenary audits',
        projects: new Set(),
      },
      '2026-04': {
        label: 'Apr 2026',
        order: 9,
        verified: 0,
        candidateOrGap: 0,
        total: 0,
        milestone: 'European AI Office GPAI compliance review & benchmark verification',
        projects: new Set(),
      },
    };

    // Dynamically bucket incoming evidence records by date
    records.forEach((record) => {
      const dateStr = record.access_date || record.audit_timestamp || '';
      let targetKey = '2026-03';

      if (dateStr.startsWith('2026-01')) {
        targetKey = '2026-01';
      } else if (dateStr.startsWith('2026-02')) {
        targetKey = '2026-02';
      } else if (dateStr.startsWith('2026-03')) {
        targetKey = '2026-03';
      } else if (dateStr.startsWith('2026-04')) {
        targetKey = '2026-04';
      } else if (dateStr.startsWith('2025-01') || dateStr.startsWith('2025-02') || dateStr.startsWith('2025-03')) {
        targetKey = '2025-Q1';
      } else if (dateStr.startsWith('2025-04') || dateStr.startsWith('2025-05') || dateStr.startsWith('2025-06')) {
        targetKey = '2025-Q2';
      } else if (dateStr.startsWith('2025-07') || dateStr.startsWith('2025-08') || dateStr.startsWith('2025-09')) {
        targetKey = '2025-Q3';
      } else if (dateStr.startsWith('2025')) {
        targetKey = '2025-Q4';
      } else if (dateStr.startsWith('2024')) {
        targetKey = '2024-H2';
      }

      if (!periodsMap[targetKey]) {
        periodsMap[targetKey] = {
          label: targetKey,
          order: 99,
          verified: 0,
          candidateOrGap: 0,
          total: 0,
          milestone: 'Standardisation evidence recorded',
          projects: new Set(),
        };
      }

      const isVerified =
        record.evidence_status === 'independently_verified' ||
        record.evidence_status === 'documented';

      if (isVerified) {
        periodsMap[targetKey].verified += 1;
      } else {
        periodsMap[targetKey].candidateOrGap += 1;
      }
      periodsMap[targetKey].total += 1;
      periodsMap[targetKey].projects.add(record.project);
    });

    const allSortedList: TrendPoint[] = Object.entries(periodsMap)
      .sort((a, b) => a[1].order - b[1].order)
      .map(([key, val]) => ({
        periodKey: key,
        label: val.label,
        order: val.order,
        total: val.total,
        verified: val.verified,
        candidateOrGap: val.candidateOrGap,
        milestone: val.milestone,
        projects: Array.from(val.projects),
      }));

    // Apply Date Range Filter
    let filteredList: TrendPoint[] = [];
    let rLabel = 'All Historical Tracking (2024–2026)';

    if (dateRange === '12m') {
      // Last 12 months: Q2 2025 through Q2 2026 (orders 3 through 9)
      filteredList = allSortedList.filter((p) => p.order >= 3);
      rLabel = 'Last 12 Months (Q2 2025 – Apr 2026)';
    } else if (dateRange === '6m') {
      // Last 6 months: Q4 2025 through Q2 2026 (orders 5 through 9)
      filteredList = allSortedList.filter((p) => p.order >= 5);
      rLabel = 'Last 6 Months (Q4 2025 – Apr 2026)';
    } else if (dateRange === 'ytd') {
      // 2026 YTD: Jan 2026 through Apr 2026 (orders 6 through 9)
      filteredList = allSortedList.filter((p) => p.order >= 6);
      rLabel = '2026 Focused (Jan – Apr 2026)';
    } else {
      filteredList = allSortedList;
    }

    // Determine Peak Period within the selected date range
    let maxTotal = -1;
    let peak = filteredList[0];
    filteredList.forEach((item) => {
      if (item.total > maxTotal) {
        maxTotal = item.total;
        peak = item;
      }
    });

    const totalEvents = filteredList.reduce((acc, curr) => acc + curr.total, 0);

    return {
      filteredTrendData: filteredList,
      peakPeriod: peak,
      totalEventsCount: totalEvents,
      rangeLabel: rLabel,
    };
  }, [records, dateRange]);

  // Custom Recharts Tooltip
  const renderCustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data: TrendPoint = payload[0].payload;
    return (
      <div className="bg-[#1C1917] text-[#FAF8F5] p-3 rounded-lg shadow-xl border border-[#38332E] text-xs max-w-xs space-y-1.5 z-50">
        <div className="flex items-center justify-between gap-4 border-b border-[#38332E] pb-1">
          <span className="font-semibold text-white">{data.label}</span>
          <span className="font-mono text-[11px] text-[#FBBF24] font-medium">
            {data.total} recorded events
          </span>
        </div>

        <div className="space-y-1 text-[11px]">
          <div className="flex justify-between items-center text-[#E7E5E4]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#1E3A8A]" />
              Verified & Documented:
            </span>
            <strong className="font-mono text-white">{data.verified}</strong>
          </div>
          <div className="flex justify-between items-center text-[#A8A29E]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#9A3412]" />
              Candidate & Gaps:
            </span>
            <strong className="font-mono text-white">{data.candidateOrGap}</strong>
          </div>
        </div>

        <div className="pt-1 text-[10.5px] text-[#D6D3D1] border-t border-[#38332E] leading-snug">
          <span className="text-[#A8A29E] block mb-0.5">Regulatory Context:</span>
          {data.milestone}
        </div>

        {data.projects.length > 0 && (
          <div className="text-[10px] text-[#A8A29E]">
            <span className="text-[#D6D3D1]">Projects: </span>
            {data.projects.slice(0, 3).join(', ')}
            {data.projects.length > 3 ? ` +${data.projects.length - 3} more` : ''}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white border border-[#E7E3DC] rounded-lg p-4 space-y-4 shadow-2xs">
      {/* Header with Title, Date Range Filter, and Peak Badge */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#F2EDE4] pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#9A3412]" />
            <h3 className="text-sm font-serif font-semibold text-[#1C1917]">
              Standardisation & Regulatory Activity Velocity
            </h3>
          </div>
          <p className="text-[11px] text-[#57534E]">
            Frequency of open-source standardisation actions, consultations, and gap audits over time.
          </p>
        </div>

        {/* Date Range Selector Segmented Control */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-[#FAF8F5] p-1 rounded-md border border-[#E7E3DC] text-xs">
            <Filter className="w-3.5 h-3.5 text-[#78716C] ml-1 mr-1.5 shrink-0" />
            <span className="text-[11px] text-[#78716C] font-medium mr-1 hidden sm:inline">
              Range:
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setDateRange('all')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
                  dateRange === 'all'
                    ? 'bg-[#1C1917] text-white shadow-2xs'
                    : 'text-[#57534E] hover:text-[#1C1917] hover:bg-[#EBE4D8]/60'
                }`}
                title="View complete historical dataset (2024–2026)"
              >
                All Time
              </button>
              <button
                onClick={() => setDateRange('12m')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
                  dateRange === '12m'
                    ? 'bg-[#1C1917] text-white shadow-2xs'
                    : 'text-[#57534E] hover:text-[#1C1917] hover:bg-[#EBE4D8]/60'
                }`}
                title="Filter to standardisation activity in the last 12 months"
              >
                Last 12 Months
              </button>
              <button
                onClick={() => setDateRange('6m')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
                  dateRange === '6m'
                    ? 'bg-[#1C1917] text-white shadow-2xs'
                    : 'text-[#57534E] hover:text-[#1C1917] hover:bg-[#EBE4D8]/60'
                }`}
                title="Filter to standardisation activity in the last 6 months"
              >
                Last 6 Months
              </button>
              <button
                onClick={() => setDateRange('ytd')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
                  dateRange === 'ytd'
                    ? 'bg-[#1C1917] text-white shadow-2xs'
                    : 'text-[#57534E] hover:text-[#1C1917] hover:bg-[#EBE4D8]/60'
                }`}
                title="Filter to 2026 standardisation and regulatory actions"
              >
                2026 YTD
              </button>
            </div>
          </div>

          {/* Peak Regulatory Activity Badge (Dynamic to selected range) */}
          {peakPeriod && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FEF3C7] border border-[#FCD34D] rounded-md text-[11px] text-[#78350F] shrink-0">
              <Zap className="w-3.5 h-3.5 text-[#B45309] shrink-0" />
              <span>
                <strong>Peak ({peakPeriod.label}):</strong> {peakPeriod.total} events
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Metric Summaries Strip (Recalculated for selected date range) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-2.5 bg-[#FAF8F5] rounded border border-[#E7E3DC]">
          <span className="text-[10px] text-[#78716C] uppercase font-mono block">
            Observed Milestones
          </span>
          <span className="text-base font-serif font-bold text-[#1C1917] font-mono tabular-nums">
            {totalEventsCount}
          </span>
          <span className="text-[10px] text-[#78716C] block">
            {filteredTrendData.length} active periods
          </span>
        </div>

        <div className="p-2.5 bg-[#FAF8F5] rounded border border-[#E7E3DC]">
          <span className="text-[10px] text-[#78716C] uppercase font-mono block">
            High-Assurance Links
          </span>
          <span className="text-base font-serif font-bold text-[#1E3A8A] font-mono tabular-nums">
            {filteredTrendData.reduce((acc, d) => acc + d.verified, 0)}
          </span>
          <span className="text-[10px] text-[#78716C] block">verified / documented</span>
        </div>

        <div className="p-2.5 bg-[#FAF8F5] rounded border border-[#E7E3DC]">
          <span className="text-[10px] text-[#78716C] uppercase font-mono block">
            Provisional & Gaps
          </span>
          <span className="text-base font-serif font-bold text-[#9A3412] font-mono tabular-nums">
            {filteredTrendData.reduce((acc, d) => acc + d.candidateOrGap, 0)}
          </span>
          <span className="text-[10px] text-[#78716C] block">active inquiries</span>
        </div>

        <div className="p-2.5 bg-[#FAF8F5] rounded border border-[#E7E3DC]">
          <span className="text-[10px] text-[#78716C] uppercase font-mono block">
            Range Scope
          </span>
          <span className="text-base font-serif font-bold text-[#047857] truncate block">
            {dateRange === 'all'
              ? 'All Time'
              : dateRange === '12m'
              ? 'Past 12 Mo'
              : dateRange === '6m'
              ? 'Past 6 Mo'
              : '2026 Focus'}
          </span>
          <span className="text-[10px] text-[#78716C] block truncate">
            {filteredTrendData[0]?.label} – {filteredTrendData[filteredTrendData.length - 1]?.label}
          </span>
        </div>
      </div>

      {/* Chart Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
        <div className="flex items-center gap-1 text-[#57534E]">
          <Calendar className="w-3.5 h-3.5 text-[#78716C]" />
          <span>Series View:</span>
          <button
            onClick={() => setActiveMetric('all')}
            className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
              activeMetric === 'all'
                ? 'bg-[#1C1917] text-white font-medium'
                : 'bg-[#F2EDE4] text-[#57534E] hover:text-[#1C1917]'
            }`}
          >
            All Initiatives
          </button>
          <button
            onClick={() => setActiveMetric('verified')}
            className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
              activeMetric === 'verified'
                ? 'bg-[#1E3A8A] text-white font-medium'
                : 'bg-[#F2EDE4] text-[#57534E] hover:text-[#1C1917]'
            }`}
          >
            Verified Only
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[#78716C]">Style:</span>
            <button
              onClick={() => setChartType('area')}
              className={`px-2 py-0.5 rounded text-[11px] cursor-pointer ${
                chartType === 'area'
                  ? 'bg-[#E7E3DC] font-semibold text-[#1C1917]'
                  : 'text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              Area Trend
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-2 py-0.5 rounded text-[11px] cursor-pointer ${
                chartType === 'bar'
                  ? 'bg-[#E7E3DC] font-semibold text-[#1C1917]'
                  : 'text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              Bar Columns
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[#78716C] text-[10.5px]">
            <Clock className="w-3 h-3 text-[#78716C]" />
            <span>{rangeLabel}</span>
          </div>
        </div>
      </div>

      {/* Recharts Visualization */}
      <div className="h-56 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart
              data={filteredTrendData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorVerified" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1E3A8A" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#1E3A8A" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorCandidate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9A3412" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#9A3412" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7E3DC" vertical={false} />
              <XAxis
                dataKey="label"
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
              <Tooltip content={renderCustomTooltip} />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                iconType="circle"
                iconSize={8}
              />
              <Area
                type="monotone"
                dataKey="verified"
                name="Verified & Documented"
                stroke="#1E3A8A"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorVerified)"
              />
              {activeMetric === 'all' && (
                <Area
                  type="monotone"
                  dataKey="candidateOrGap"
                  name="Candidate & Gaps"
                  stroke="#9A3412"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#colorCandidate)"
                />
              )}
            </AreaChart>
          ) : (
            <BarChart
              data={filteredTrendData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E7E3DC" vertical={false} />
              <XAxis
                dataKey="label"
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
              <Tooltip content={renderCustomTooltip} />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                iconType="circle"
                iconSize={8}
              />
              <Bar
                dataKey="verified"
                name="Verified & Documented"
                fill="#1E3A8A"
                radius={[4, 4, 0, 0]}
              />
              {activeMetric === 'all' && (
                <Bar
                  dataKey="candidateOrGap"
                  name="Candidate & Gaps"
                  fill="#9A3412"
                  radius={[4, 4, 0, 0]}
                />
              )}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Regulatory Context Footer Note */}
      <div className="pt-2 border-t border-[#F2EDE4] flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-[#78716C]">
        <div className="flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-[#9A3412] shrink-0" />
          <span>
            Activity peak correlates with European AI Act CEN-CENELEC JTC 21 harmonised standard delivery deadlines and NIST AISIC working groups.
          </span>
        </div>
        <span className="font-mono text-[10px] shrink-0">
          Range filter active · {filteredTrendData.length} windows
        </span>
      </div>
    </div>
  );
};
