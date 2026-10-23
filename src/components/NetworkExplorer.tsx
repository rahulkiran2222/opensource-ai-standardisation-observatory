import React, { useState, useMemo } from 'react';
import { Entity, RelationshipRecord, EntityType } from '../types';
import { buildGraph, calculateNodePositions } from '../utils/networkEngine';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Search,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Info,
  X,
  FileText,
  Filter,
  BarChart3,
  ArrowLeftRight,
} from 'lucide-react';
import { StandardisationActivityTrends } from './StandardisationActivityTrends';
import { EntityComparator } from './EntityComparator';

interface NetworkExplorerProps {
  entities: Entity[];
  records: RelationshipRecord[];
  onSelectRecord: (record: RelationshipRecord) => void;
  onFilterByEntity: (entityName: string) => void;
}

export const NetworkExplorer: React.FC<NetworkExplorerProps> = ({
  entities,
  records,
  onSelectRecord,
  onFilterByEntity,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<EntityType | 'all'>('all');
  const [includeCandidates, setIncludeCandidates] = useState(true);
  const [includeGaps, setIncludeGaps] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedEntityName, setSelectedEntityName] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [showComparator, setShowComparator] = useState(false);
  const [comparatorEntityA, setComparatorEntityA] = useState<string | undefined>(undefined);

  const handleOpenComparatorForEntity = (entityName: string) => {
    setComparatorEntityA(entityName);
    setShowComparator(true);
  };

  // Build the graph using the Network Engine
  const graphData = useMemo(() => {
    return buildGraph(entities, records, {
      includeCandidates,
      includeGaps,
      filterEntityType: typeFilter,
      searchTerm,
    });
  }, [entities, records, includeCandidates, includeGaps, typeFilter, searchTerm]);

  // Compute node coordinates
  const svgWidth = 860;
  const svgHeight = 560;
  const nodePositions = useMemo(() => {
    return calculateNodePositions(graphData.nodes, graphData.edges, svgWidth, svgHeight);
  }, [graphData.nodes, graphData.edges, svgWidth, svgHeight]);

  // Selected Entity Details
  const selectedEntity = useMemo(() => {
    if (!selectedEntityName) return null;
    return entities.find((e) => e.name.toLowerCase() === selectedEntityName.toLowerCase()) || {
      id: selectedEntityName,
      name: selectedEntityName,
      entity_type: 'open_source_project' as EntityType,
      official_url: '',
      description: 'Entity referenced within the evidence database.',
    };
  }, [selectedEntityName, entities]);

  const selectedEntityRecords = useMemo(() => {
    if (!selectedEntityName) return [];
    const nameLow = selectedEntityName.toLowerCase();
    return records.filter(
      (r) =>
        r.project.toLowerCase() === nameLow ||
        r.institution_or_process.toLowerCase() === nameLow
    );
  }, [selectedEntityName, records]);

  const selectedEdgeRecord = useMemo(() => {
    if (!selectedEdgeId) return null;
    const edge = graphData.edges.find((e) => e.id === selectedEdgeId);
    return edge ? edge.record : null;
  }, [selectedEdgeId, graphData.edges]);

  // Entity Summary Statistics (Total records, top interaction type, verification breakdown)
  const entityStats = useMemo(() => {
    if (!selectedEntity || selectedEntityRecords.length === 0) {
      return {
        totalRecords: 0,
        mostFrequentType: null as string | null,
        mostFrequentTypeCount: 0,
        mostFrequentTypePct: 0,
        verifiedCount: 0,
        candidateCount: 0,
        gapCount: 0,
        verificationPct: 0,
        candidatePct: 0,
        gapPct: 0,
        topPartner: null as string | null,
        topPartnerCount: 0,
        latestDate: null as string | null,
      };
    }

    const typeFreq: Record<string, number> = {};
    const partnerFreq: Record<string, number> = {};
    let verified = 0;
    let candidate = 0;
    let gap = 0;
    let latest = '';

    const nameLow = selectedEntity.name.toLowerCase();

    selectedEntityRecords.forEach((r) => {
      // Type frequency
      typeFreq[r.relationship_type] = (typeFreq[r.relationship_type] || 0) + 1;

      // Other interacting partner
      const partner = r.project.toLowerCase() === nameLow ? r.institution_or_process : r.project;
      partnerFreq[partner] = (partnerFreq[partner] || 0) + 1;

      // Status
      if (r.evidence_status === 'independently_verified' || r.evidence_status === 'documented') {
        verified++;
      } else if (r.evidence_status === 'candidate') {
        candidate++;
      } else if (r.evidence_status === 'gap') {
        gap++;
      }

      // Latest date
      const d = r.access_date || '';
      if (d > latest) latest = d;
    });

    // Determine most frequent interaction type
    let topType = '';
    let topTypeCount = 0;
    Object.entries(typeFreq).forEach(([t, count]) => {
      if (count > topTypeCount) {
        topType = t;
        topTypeCount = count;
      }
    });

    // Determine top partner
    let topPartner = '';
    let topPartnerCount = 0;
    Object.entries(partnerFreq).forEach(([p, count]) => {
      if (count > topPartnerCount) {
        topPartner = p;
        topPartnerCount = count;
      }
    });

    const total = selectedEntityRecords.length;
    return {
      totalRecords: total,
      mostFrequentType: topType,
      mostFrequentTypeCount: topTypeCount,
      mostFrequentTypePct: total > 0 ? Math.round((topTypeCount / total) * 100) : 0,
      verifiedCount: verified,
      candidateCount: candidate,
      gapCount: gap,
      verificationPct: total > 0 ? Math.round((verified / total) * 100) : 0,
      candidatePct: total > 0 ? Math.round((candidate / total) * 100) : 0,
      gapPct: total > 0 ? Math.round((gap / total) * 100) : 0,
      topPartner,
      topPartnerCount,
      latestDate: latest || null,
    };
  }, [selectedEntity, selectedEntityRecords]);

  // Visual token helpers
  const getNodeColor = (type: EntityType) => {
    switch (type) {
      case 'open_source_project':
        return { bg: '#FDF2E9', border: '#9A3412', text: '#7C2D12', fill: '#9A3412' };
      case 'standards_body':
        return { bg: '#EFF6FF', border: '#1E3A8A', text: '#1E3A8A', fill: '#1E3A8A' };
      case 'institution':
        return { bg: '#FEF3C7', border: '#78350F', text: '#78350F', fill: '#78350F' };
      case 'standard_or_framework':
        return { bg: '#F1F5F9', border: '#475569', text: '#334155', fill: '#475569' };
    }
  };

  const getEdgeStroke = (status: string) => {
    switch (status) {
      case 'independently_verified':
        return { stroke: '#1C1917', strokeWidth: 2.2, strokeDasharray: '0', opacity: 0.9 };
      case 'documented':
        return { stroke: '#475569', strokeWidth: 1.8, strokeDasharray: '0', opacity: 0.85 };
      case 'candidate':
        return { stroke: '#D97706', strokeWidth: 1.4, strokeDasharray: '4 3', opacity: 0.75 };
      case 'gap':
        return { stroke: '#DC2626', strokeWidth: 1.2, strokeDasharray: '2 3', opacity: 0.65 };
      default:
        return { stroke: '#A8A29E', strokeWidth: 1, strokeDasharray: '3 3', opacity: 0.5 };
    }
  };

  return (
    <div className="space-y-6">
      {/* Editorial Header Section */}
      <div className="border-b border-[#E7E3DC] pb-5">
        <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-3">
          <div>
            <h1 className="text-2xl lg:text-3xl font-serif font-medium text-[#1C1917] tracking-tight">
              Observatory Network Graph
            </h1>
            <p className="text-sm text-[#57534E] mt-1 max-w-2xl leading-relaxed">
              Visualizing verified and candidate relationships between open-source AI projects, standards development organizations (SDOs), and European policy processes.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 shrink-0">
            <button
              onClick={() => setShowComparator(!showComparator)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all flex items-center gap-1.5 cursor-pointer ${
                showComparator
                  ? 'bg-[#9A3412] text-white border-[#9A3412] shadow-xs'
                  : 'bg-[#FDF2E9] hover:bg-[#FCE7D6] text-[#9A3412] border-[#FDBA74]'
              }`}
              title="Compare two entities side-by-side (records, assurance, timeline trends)"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>{showComparator ? 'Hide Comparator' : 'Entity Comparator'}</span>
            </button>
            <div className="flex items-center gap-2 text-xs text-[#78716C]">
              <span>Graph Source</span>
              <span aria-hidden="true">·</span>
              <span className="font-medium text-[#1C1917]">Audited Evidence Ledger</span>
            </div>
          </div>
        </div>

        {/* Fundamental Methodological Notice */}
        <div className="mt-4 p-3 bg-[#F4EFEA]/80 border border-[#E2DBD1] rounded-lg flex items-start gap-3 text-xs text-[#57534E]">
          <Info className="w-4 h-4 text-[#9A3412] shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-semibold text-[#1C1917]">Network Inclusion Rule:</strong> Edges are constructed strictly from records that have undergone evidence auditing. Solid links represent documented or independently verified relationships. Provisional candidate links and unresolved evidence gaps are visually distinguished to avoid false attribution of institutional membership.
          </div>
        </div>
      </div>

      {/* Network Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 bg-white border border-[#E7E3DC] rounded-lg">
          <div className="text-xs text-[#78716C] mb-1">Entities in View</div>
          <div className="text-xl font-serif font-semibold text-[#1C1917] font-mono tabular-nums">
            {graphData.metrics.activeNodesInGraph}
          </div>
          <div className="text-[11px] text-[#78716C] mt-0.5">
            of {graphData.metrics.totalEntities} cataloged
          </div>
        </div>

        <div className="p-3.5 bg-white border border-[#E7E3DC] rounded-lg">
          <div className="text-xs text-[#78716C] mb-1">Audited Relations</div>
          <div className="text-xl font-serif font-semibold text-[#1C1917] font-mono tabular-nums">
            {graphData.metrics.totalAuditedRelationships}
          </div>
          <div className="text-[11px] text-[#78716C] mt-0.5">
            in evidence database
          </div>
        </div>

        <div className="p-3.5 bg-white border border-[#E7E3DC] rounded-lg">
          <div className="text-xs text-[#78716C] mb-1">Active Network Edges</div>
          <div className="text-xl font-serif font-semibold text-[#1C1917] font-mono tabular-nums">
            {graphData.edges.length}
          </div>
          <div className="text-[11px] text-[#78716C] mt-0.5">
            {graphData.metrics.verifiedEdgesCount} verified / {graphData.metrics.candidateProvisionalCount} candidate
          </div>
        </div>

        <div className="p-3.5 bg-white border border-[#E7E3DC] rounded-lg">
          <div className="text-xs text-[#78716C] mb-1">Connected Clusters</div>
          <div className="text-xl font-serif font-semibold text-[#1C1917] font-mono tabular-nums">
            {graphData.metrics.connectedComponentsCount}
          </div>
          <div className="text-[11px] text-[#78716C] mt-0.5">
            components (BFS)
          </div>
        </div>

        <div className="p-3.5 bg-white border border-[#E7E3DC] rounded-lg">
          <div className="text-xs text-[#78716C] mb-1">Network Density</div>
          <div className="text-xl font-serif font-semibold text-[#1C1917] font-mono tabular-nums">
            {graphData.metrics.networkDensity}
          </div>
          <div className="text-[11px] text-[#78716C] mt-0.5">
            2E / V(V-1)
          </div>
        </div>

        <div className="p-3.5 bg-white border border-[#E7E3DC] rounded-lg">
          <div className="text-xs text-[#78716C] mb-1">Average Degree</div>
          <div className="text-xl font-serif font-semibold text-[#1C1917] font-mono tabular-nums">
            {graphData.metrics.averageDegree}
          </div>
          <div className="text-[11px] text-[#78716C] mt-0.5">
            links per entity
          </div>
        </div>
      </div>

      {/* Entity Comparator Tool (Head-to-head records and interaction frequency trends) */}
      {showComparator && (
        <EntityComparator
          entities={entities}
          records={records}
          onSelectRecord={onSelectRecord}
          onFilterByEntity={onFilterByEntity}
          initialEntityA={comparatorEntityA}
          onClose={() => setShowComparator(false)}
        />
      )}

      {/* Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-[#E7E3DC] rounded-lg">
        {/* Search */}
        <div className="relative min-w-[220px] max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search entity (e.g. PyTorch, CEN)..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#DDD6C8] rounded focus:outline-none focus:border-[#9A3412] text-[#1C1917]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#1C1917] text-xs cursor-pointer"
            >
              ×
            </button>
          )}
        </div>

        {/* Entity Type Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="text-[#78716C] text-[11px] mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
              typeFilter === 'all'
                ? 'bg-[#1C1917] text-white font-medium'
                : 'bg-[#FAF8F5] hover:bg-[#F2EDE4] text-[#57534E] border border-[#E7E3DC]'
            }`}
          >
            All Types
          </button>
          <button
            onClick={() => setTypeFilter('open_source_project')}
            className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
              typeFilter === 'open_source_project'
                ? 'bg-[#9A3412] text-white font-medium'
                : 'bg-[#FAF8F5] hover:bg-[#F2EDE4] text-[#57534E] border border-[#E7E3DC]'
            }`}
          >
            Open-Source Projects
          </button>
          <button
            onClick={() => setTypeFilter('standards_body')}
            className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
              typeFilter === 'standards_body'
                ? 'bg-[#1E3A8A] text-white font-medium'
                : 'bg-[#FAF8F5] hover:bg-[#F2EDE4] text-[#57534E] border border-[#E7E3DC]'
            }`}
          >
            Standards Bodies
          </button>
          <button
            onClick={() => setTypeFilter('institution')}
            className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
              typeFilter === 'institution'
                ? 'bg-[#78350F] text-white font-medium'
                : 'bg-[#FAF8F5] hover:bg-[#F2EDE4] text-[#57534E] border border-[#E7E3DC]'
            }`}
          >
            Institutions
          </button>
          <button
            onClick={() => setTypeFilter('standard_or_framework')}
            className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
              typeFilter === 'standard_or_framework'
                ? 'bg-[#475569] text-white font-medium'
                : 'bg-[#FAF8F5] hover:bg-[#F2EDE4] text-[#57534E] border border-[#E7E3DC]'
            }`}
          >
            Frameworks
          </button>
        </div>

        {/* Edge Visibility Toggles & Zoom */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-[#57534E] cursor-pointer">
            <input
              type="checkbox"
              checked={includeCandidates}
              onChange={(e) => setIncludeCandidates(e.target.checked)}
              className="accent-[#9A3412] rounded"
            />
            <span>Show Candidates (Dashed)</span>
          </label>

          <label className="flex items-center gap-1.5 text-xs text-[#57534E] cursor-pointer">
            <input
              type="checkbox"
              checked={includeGaps}
              onChange={(e) => setIncludeGaps(e.target.checked)}
              className="accent-[#DC2626] rounded"
            />
            <span>Show Gaps (Dotted Red)</span>
          </label>

          <div className="h-4 w-[1px] bg-[#E7E3DC]" />

          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoomLevel((z) => Math.min(z + 0.15, 1.8))}
              className="p-1 text-[#57534E] hover:text-[#1C1917] hover:bg-[#FAF8F5] rounded border border-[#E7E3DC] cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(z - 0.15, 0.6))}
              className="p-1 text-[#57534E] hover:text-[#1C1917] hover:bg-[#FAF8F5] rounded border border-[#E7E3DC] cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setZoomLevel(1);
                setSelectedEntityName(null);
                setSelectedEdgeId(null);
              }}
              className="p-1 text-[#57534E] hover:text-[#1C1917] hover:bg-[#FAF8F5] rounded border border-[#E7E3DC] cursor-pointer"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas + Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SVG Network Canvas */}
        <div className="lg:col-span-8 bg-white border border-[#E7E3DC] rounded-lg p-3 relative overflow-hidden flex flex-col justify-between min-h-[520px]">
          {/* Subtle Sector Legend */}
          <div className="flex items-center justify-between text-[11px] text-[#78716C] px-2 pt-1 z-10">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#9A3412]" />
                Projects (Left)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1E3A8A]" />
                Standards Bodies (Right)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#78350F]" />
                Institutions (Bottom)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#475569]" />
                Frameworks (Top)
              </span>
            </div>
            <div className="font-mono">Interactive: Click node or edge</div>
          </div>

          {/* SVG Viewport */}
          <div className="relative w-full h-[470px] overflow-hidden flex items-center justify-center">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-full select-none cursor-default"
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'center center',
                transition: 'transform 0.2s ease-out',
              }}
            >
              {/* Subtle background radial grid */}
              <circle
                cx={svgWidth / 2}
                cy={svgHeight / 2}
                r={svgWidth * 0.38}
                fill="none"
                stroke="#F2EFE9"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <circle
                cx={svgWidth / 2}
                cy={svgHeight / 2}
                r={svgWidth * 0.22}
                fill="none"
                stroke="#F2EFE9"
                strokeWidth="1"
                strokeDasharray="4 4"
              />

              {/* Render Edges */}
              <g className="edges">
                {graphData.edges.map((edge) => {
                  const sPos = nodePositions.get(edge.source);
                  const tPos = nodePositions.get(edge.target);
                  if (!sPos || !tPos) return null;

                  const strokeProps = getEdgeStroke(edge.evidence_status);
                  const isSelected = selectedEdgeId === edge.id;
                  const isHighlighted =
                    selectedEntityName &&
                    (edge.source.toLowerCase() === selectedEntityName.toLowerCase() ||
                      edge.target.toLowerCase() === selectedEntityName.toLowerCase());

                  // Curved path calculation
                  const dx = tPos.x - sPos.x;
                  const dy = tPos.y - sPos.y;
                  const dr = Math.sqrt(dx * dx + dy * dy) * 1.25;

                  return (
                    <g key={edge.id} className="cursor-pointer group">
                      {/* Invisible wider stroke for easier clicking */}
                      <path
                        d={`M ${sPos.x} ${sPos.y} A ${dr} ${dr} 0 0,1 ${tPos.x} ${tPos.y}`}
                        fill="none"
                        stroke="transparent"
                        strokeWidth="14"
                        onClick={() => {
                          setSelectedEdgeId(edge.id);
                          setSelectedEntityName(null);
                        }}
                      />
                      <path
                        d={`M ${sPos.x} ${sPos.y} A ${dr} ${dr} 0 0,1 ${tPos.x} ${tPos.y}`}
                        fill="none"
                        stroke={
                          isSelected
                            ? '#9A3412'
                            : isHighlighted
                            ? '#1C1917'
                            : strokeProps.stroke
                        }
                        strokeWidth={
                          isSelected
                            ? 3.5
                            : isHighlighted
                            ? strokeProps.strokeWidth + 1
                            : strokeProps.strokeWidth
                        }
                        strokeDasharray={strokeProps.strokeDasharray}
                        opacity={
                          selectedEntityName && !isHighlighted
                            ? 0.2
                            : strokeProps.opacity
                        }
                        className="transition-all"
                        onClick={() => {
                          setSelectedEdgeId(edge.id);
                          setSelectedEntityName(null);
                        }}
                      />
                    </g>
                  );
                })}
              </g>

              {/* Render Nodes */}
              <g className="nodes">
                {graphData.nodes.map((node) => {
                  const pos = nodePositions.get(node.name);
                  if (!pos) return null;

                  const colors = getNodeColor(node.entity_type);
                  const isSelected =
                    selectedEntityName?.toLowerCase() === node.name.toLowerCase();
                  const isNeighborOfSelected =
                    selectedEntityName &&
                    graphData.edges.some(
                      (e) =>
                        (e.source.toLowerCase() === selectedEntityName.toLowerCase() &&
                          e.target.toLowerCase() === node.name.toLowerCase()) ||
                        (e.target.toLowerCase() === selectedEntityName.toLowerCase() &&
                          e.source.toLowerCase() === node.name.toLowerCase())
                    );

                  const nodeOpacity =
                    selectedEntityName && !isSelected && !isNeighborOfSelected ? 0.35 : 1;

                  return (
                    <g
                      key={node.name}
                      transform={`translate(${pos.x}, ${pos.y})`}
                      className="cursor-pointer group"
                      onClick={() => {
                        setSelectedEntityName(node.name);
                        setSelectedEdgeId(null);
                      }}
                      opacity={nodeOpacity}
                    >
                      {/* Selection halo */}
                      {isSelected && (
                        <circle
                          r="28"
                          fill="none"
                          stroke={colors.border}
                          strokeWidth="2"
                          strokeDasharray="3 3"
                          className="animate-spin"
                          style={{ animationDuration: '12s' }}
                        />
                      )}

                      {/* Main Node Circle */}
                      <circle
                        r="18"
                        fill={colors.bg}
                        stroke={isSelected ? '#1C1917' : colors.border}
                        strokeWidth={isSelected ? 2.5 : 1.75}
                        className="transition-transform group-hover:scale-110"
                      />

                      {/* Degree Badge inside node */}
                      <text
                        textAnchor="middle"
                        dy="4"
                        fontSize="10"
                        fontWeight="600"
                        fill={colors.text}
                        className="font-mono tabular-nums pointer-events-none"
                      >
                        {node.degree}
                      </text>

                      {/* Node Label */}
                      <text
                        textAnchor="middle"
                        dy="32"
                        fontSize="11"
                        fontWeight={isSelected ? '700' : '500'}
                        fill="#1C1917"
                        className="pointer-events-none select-none tracking-tight"
                      >
                        {node.name.length > 20
                          ? `${node.name.slice(0, 18)}…`
                          : node.name}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>

          {/* Bottom Edge Style Key */}
          <div className="flex flex-wrap items-center justify-between text-xs text-[#57534E] pt-2 border-t border-[#F2EFE9]">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-[2px] bg-[#1C1917]" />
                <span>Verified (Solid)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-[2px] bg-[#475569]" />
                <span>Documented Citation</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-[2px] border-b-2 border-dashed border-[#D97706]" />
                <span>Candidate Claim</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-[2px] border-b-2 border-dotted border-[#DC2626]" />
                <span>Evidence Gap</span>
              </span>
            </div>

            <span className="text-[11px] text-[#78716C]">
              Node number = verified degree count
            </span>
          </div>
        </div>

        {/* Inspector / Dossier Drawer */}
        <div className="lg:col-span-4 bg-white border border-[#E7E3DC] rounded-lg p-5 flex flex-col justify-between">
          {selectedEntity ? (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#E7E3DC]">
                <div>
                  <div className="text-xs uppercase tracking-wider text-[#78716C] font-mono">
                    {selectedEntity.entity_type.replace(/_/g, ' ')}
                  </div>
                  <h2 className="text-xl font-serif font-medium text-[#1C1917] mt-0.5">
                    {selectedEntity.name}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedEntityName(null)}
                  className="text-[#78716C] hover:text-[#1C1917] p-1 cursor-pointer"
                  title="Close dossier"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Entity Overview */}
              <div className="text-xs text-[#57534E] leading-relaxed">
                {selectedEntity.description}
              </div>

              {selectedEntity.lead_maintainer_or_secretariat && (
                <div className="text-xs text-[#57534E] flex items-center gap-1.5">
                  <span className="text-[#78716C]">Maintainer/Secretariat:</span>
                  <span className="font-medium text-[#1C1917]">
                    {selectedEntity.lead_maintainer_or_secretariat}
                  </span>
                </div>
              )}

              {selectedEntity.official_url && (
                <div>
                  <a
                    href={selectedEntity.official_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[#9A3412] hover:underline font-medium"
                  >
                    <span>Visit Official Repository / Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Entity Summary Statistics Panel */}
              <div className="p-3.5 bg-[#FAF8F5] border border-[#DDD6C8] rounded-lg space-y-3">
                <div className="flex items-center justify-between border-b border-[#E7E3DC] pb-2">
                  <span className="text-[11px] font-semibold text-[#1C1917] uppercase tracking-wider flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-[#9A3412]" />
                    <span>Entity Interaction Statistics</span>
                  </span>
                  <span className="text-[10px] font-mono text-[#78716C] bg-white px-2 py-0.5 rounded border border-[#E7E3DC]">
                    {entityStats.totalRecords} Records
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Total Records */}
                  <div className="p-2.5 bg-white border border-[#E7E3DC] rounded">
                    <span className="text-[10px] text-[#78716C] uppercase font-mono block">
                      Total Records
                    </span>
                    <span className="text-base font-serif font-bold text-[#1C1917] font-mono tabular-nums block">
                      {entityStats.totalRecords}
                    </span>
                    <span className="text-[10px] text-[#78716C] block">
                      audited connections
                    </span>
                  </div>

                  {/* High-Assurance Ratio */}
                  <div className="p-2.5 bg-white border border-[#E7E3DC] rounded">
                    <span className="text-[10px] text-[#78716C] uppercase font-mono block">
                      Verified Rate
                    </span>
                    <span className="text-base font-serif font-bold text-[#166534] font-mono tabular-nums block">
                      {entityStats.verificationPct}%
                    </span>
                    <span className="text-[10px] text-[#78716C] block">
                      {entityStats.verifiedCount} high-assurance
                    </span>
                  </div>

                  {/* Most Frequent Interaction Type */}
                  <div className="p-2.5 bg-white border border-[#E7E3DC] rounded col-span-2">
                    <span className="text-[10px] text-[#78716C] uppercase font-mono block">
                      Most Frequent Interaction Type
                    </span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-xs font-semibold text-[#1C1917] capitalize">
                        {entityStats.mostFrequentType
                          ? entityStats.mostFrequentType.replace(/_/g, ' ')
                          : 'None recorded'}
                      </span>
                      {entityStats.mostFrequentTypeCount > 0 && (
                        <span className="text-[11px] font-mono text-[#9A3412] font-medium bg-[#FDF2E9] px-1.5 py-0.5 rounded">
                          {entityStats.mostFrequentTypeCount} ({entityStats.mostFrequentTypePct}%)
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[#78716C] block mt-0.5">
                      primary mode of standardisation engagement
                    </span>
                  </div>

                  {/* Primary Interfacing Body */}
                  {entityStats.topPartner && (
                    <div className="p-2.5 bg-white border border-[#E7E3DC] rounded col-span-2">
                      <span className="text-[10px] text-[#78716C] uppercase font-mono block">
                        Primary Interfacing Partner / SDO
                      </span>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-xs font-semibold text-[#1E3A8A] truncate block max-w-[190px]">
                          {entityStats.topPartner}
                        </span>
                        <span className="text-[10px] font-mono text-[#78716C] bg-[#F1F5F9] px-1.5 py-0.5 rounded">
                          {entityStats.topPartnerCount} connection{entityStats.topPartnerCount > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Evidence Assurance Profile Mini-Bar */}
                {entityStats.totalRecords > 0 && (
                  <div className="space-y-1 pt-1 border-t border-[#E7E3DC]">
                    <div className="flex justify-between text-[10px] text-[#78716C]">
                      <span>Assurance Breakdown</span>
                      <span className={entityStats.gapCount > 0 ? 'text-[#DC2626] font-medium' : 'text-[#166534]'}>
                        {entityStats.gapCount > 0 ? `${entityStats.gapCount} Gaps Identified` : 'Zero Gaps'}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#E7E3DC] rounded-full overflow-hidden flex">
                      <div
                        style={{ width: `${entityStats.verificationPct}%` }}
                        className="bg-[#166534] h-full"
                        title={`${entityStats.verifiedCount} Verified / Documented`}
                      />
                      <div
                        style={{ width: `${entityStats.candidatePct}%` }}
                        className="bg-[#D97706] h-full"
                        title={`${entityStats.candidateCount} Candidate Claims`}
                      />
                      <div
                        style={{ width: `${entityStats.gapPct}%` }}
                        className="bg-[#DC2626] h-full"
                        title={`${entityStats.gapCount} Evidence Gaps`}
                      />
                    </div>
                    <div className="flex justify-between text-[9.5px] text-[#78716C] font-mono">
                      <span className="text-[#166534]">{entityStats.verifiedCount} verified</span>
                      <span className="text-[#D97706]">{entityStats.candidateCount} candidate</span>
                      <span className="text-[#DC2626]">{entityStats.gapCount} gap</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Connected Relationships in Observatory */}
              <div className="pt-3 border-t border-[#F2EFE9]">
                <div className="text-xs font-semibold text-[#1C1917] uppercase tracking-wider mb-2.5">
                  Audited Relations ({selectedEntityRecords.length})
                </div>

                {selectedEntityRecords.length === 0 ? (
                  <p className="text-xs text-[#78716C] italic">
                    No active relationship records linked to this entity.
                  </p>
                ) : (
                  <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                    {selectedEntityRecords.map((rec) => {
                      const otherEntity =
                        rec.project.toLowerCase() === selectedEntity.name.toLowerCase()
                          ? rec.institution_or_process
                          : rec.project;

                      return (
                        <div
                          key={rec.id}
                          onClick={() => onSelectRecord(rec)}
                          className="p-2.5 bg-[#FAF8F5] hover:bg-[#F4EFEA] border border-[#E7E3DC] rounded text-xs cursor-pointer transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-[#1C1917]">
                              {otherEntity}
                            </span>
                            <span className="text-[11px] text-[#78716C]">
                              {rec.evidence_status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#9A3412] mt-0.5">
                            {rec.relationship_type.replace(/_/g, ' ')}
                          </div>
                          {rec.notes && (
                            <div className="text-[11px] text-[#57534E] mt-1 line-clamp-2">
                              {rec.notes}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-3 space-y-2">
                <button
                  onClick={() => handleOpenComparatorForEntity(selectedEntity.name)}
                  className="w-full py-2 px-3 text-xs font-semibold text-[#9A3412] bg-[#FDF2E9] hover:bg-[#FCE7D6] border border-[#FDBA74] rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>Compare with Another Entity</span>
                </button>

                <button
                  onClick={() => onFilterByEntity(selectedEntity.name)}
                  className="w-full py-2 px-3 text-xs font-medium text-[#1C1917] bg-[#F2EDE4] hover:bg-[#EBE4D8] border border-[#DDD6C8] rounded transition-colors cursor-pointer"
                >
                  Filter Evidence Register for {selectedEntity.name}
                </button>
              </div>
            </div>
          ) : selectedEdgeRecord ? (
            /* Selected Edge Dossier */
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#E7E3DC]">
                <div>
                  <div className="text-xs uppercase tracking-wider text-[#78716C] font-mono">
                    Audited Relationship Edge
                  </div>
                  <h2 className="text-lg font-serif font-medium text-[#1C1917] mt-0.5">
                    {selectedEdgeRecord.project} ↔ {selectedEdgeRecord.institution_or_process}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedEdgeId(null)}
                  className="text-[#78716C] hover:text-[#1C1917] p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Edge Meta */}
              <div className="flex items-center gap-2 text-xs text-[#57534E]">
                <span>Type: <strong>{selectedEdgeRecord.relationship_type.replace(/_/g, ' ')}</strong></span>
                <span aria-hidden="true">·</span>
                <span>Status: <strong>{selectedEdgeRecord.evidence_status.replace(/_/g, ' ')}</strong></span>
              </div>

              {/* Verbatim Passage */}
              {selectedEdgeRecord.source_passage ? (
                <div className="p-3 bg-[#FAF8F5] border border-[#E7E3DC] rounded text-xs text-[#292524] italic leading-relaxed">
                  "{selectedEdgeRecord.source_passage}"
                </div>
              ) : (
                <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded text-xs text-[#991B1B]">
                  No verbatim source passage recorded for this relationship edge.
                </div>
              )}

              {/* Auditor notes */}
              {selectedEdgeRecord.notes && (
                <div className="text-xs text-[#57534E]">
                  <span className="font-semibold text-[#1C1917]">Reviewer Note: </span>
                  {selectedEdgeRecord.notes}
                </div>
              )}

              {selectedEdgeRecord.gap_recommendation && (
                <div className="p-2.5 bg-[#FFFBEB] border border-[#FDE68A] rounded text-xs text-[#92400E]">
                  <strong className="block mb-0.5">Evidence Next Step:</strong>
                  {selectedEdgeRecord.gap_recommendation}
                </div>
              )}

              <div className="pt-2 flex items-center justify-between text-xs">
                <span className="text-[#78716C]">
                  Audited: {selectedEdgeRecord.access_date || 'Unrecorded'}
                </span>
                {selectedEdgeRecord.source_url && (
                  <a
                    href={selectedEdgeRecord.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#9A3412] hover:underline font-medium"
                  >
                    <span>Inspect Source</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <button
                onClick={() => onSelectRecord(selectedEdgeRecord)}
                className="w-full py-2 px-3 text-xs font-medium text-white bg-[#1C1917] hover:bg-[#292524] rounded transition-colors cursor-pointer mt-2"
              >
                Open Full Evidence Record
              </button>
            </div>
          ) : (
            /* Default prompt when nothing is selected */
            <div className="py-12 px-4 text-center space-y-3">
              <div className="w-10 h-10 mx-auto rounded-full bg-[#FAF8F5] border border-[#E7E3DC] flex items-center justify-center text-[#78716C]">
                <Info className="w-5 h-5 stroke-[1.5]" />
              </div>
              <h3 className="text-base font-serif font-medium text-[#1C1917]">
                Entity & Edge Inspector
              </h3>
              <p className="text-xs text-[#57534E] leading-relaxed max-w-xs mx-auto">
                Click any node to review its dossier and verified connections, or click any relationship line to inspect the supporting source evidence.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recharts Trends: Frequency of Standardisation Events Over Time */}
      <StandardisationActivityTrends records={records} />
    </div>
  );
};
