import { Entity, RelationshipRecord, GraphNode, GraphEdge, EntityType } from '../types';

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  isolatedNodes: GraphNode[];
  metrics: {
    totalEntities: number;
    activeNodesInGraph: number;
    totalAuditedRelationships: number;
    verifiedEdgesCount: number;
    candidateProvisionalCount: number;
    gapCount: number;
    connectedComponentsCount: number;
    networkDensity: number;
    averageDegree: number;
  };
}

export function buildGraph(
  entities: Entity[],
  records: RelationshipRecord[],
  options: {
    includeCandidates: boolean;
    includeGaps: boolean;
    filterEntityType?: EntityType | 'all';
    searchTerm?: string;
  } = {
    includeCandidates: false,
    includeGaps: false,
    filterEntityType: 'all',
    searchTerm: '',
  }
): GraphData {
  const nodeMap = new Map<string, GraphNode>();

  // Ensure all known entities exist as nodes
  for (const ent of entities) {
    nodeMap.set(ent.name.toLowerCase(), {
      id: ent.name,
      name: ent.name,
      entity_type: ent.entity_type,
      degree: 0,
    });
  }

  // Also include any entities referenced in records that weren't in entities array
  for (const rec of records) {
    const projKey = rec.project.toLowerCase();
    if (!nodeMap.has(projKey)) {
      nodeMap.set(projKey, {
        id: rec.project,
        name: rec.project,
        entity_type: 'open_source_project',
        degree: 0,
      });
    }
    const instKey = rec.institution_or_process.toLowerCase();
    if (!nodeMap.has(instKey)) {
      nodeMap.set(instKey, {
        id: rec.institution_or_process,
        name: rec.institution_or_process,
        entity_type: rec.institution_or_process.toLowerCase().includes('act') || rec.institution_or_process.toLowerCase().includes('iso/iec 42')
          ? 'standard_or_framework'
          : 'standards_body',
        degree: 0,
      });
    }
  }

  // Filter edges based on rigorous academic rules
  const edges: GraphEdge[] = [];
  let candidateProvisionalCount = 0;
  let gapCount = 0;
  let verifiedEdgesCount = 0;

  for (const rec of records) {
    if (rec.evidence_status === 'gap') {
      gapCount++;
      if (!options.includeGaps) continue;
    } else if (rec.evidence_status === 'candidate') {
      candidateProvisionalCount++;
      if (!options.includeCandidates) continue;
    } else {
      verifiedEdgesCount++;
    }

    // Add valid edge
    edges.push({
      id: rec.id,
      source: rec.project,
      target: rec.institution_or_process,
      relationship_type: rec.relationship_type,
      evidence_status: rec.evidence_status,
      record: rec,
    });

    // Increment degrees
    const sourceNode = nodeMap.get(rec.project.toLowerCase());
    const targetNode = nodeMap.get(rec.institution_or_process.toLowerCase());
    if (sourceNode) sourceNode.degree += 1;
    if (targetNode) targetNode.degree += 1;
  }

  let nodes = Array.from(nodeMap.values());

  // Entity type filter
  if (options.filterEntityType && options.filterEntityType !== 'all') {
    nodes = nodes.filter((n) => n.entity_type === options.filterEntityType);
  }

  // Search filter
  if (options.searchTerm && options.searchTerm.trim() !== '') {
    const term = options.searchTerm.toLowerCase();
    nodes = nodes.filter((n) => n.name.toLowerCase().includes(term));
  }

  const activeNodeNames = new Set(nodes.map((n) => n.name.toLowerCase()));
  const activeEdges = edges.filter(
    (e) =>
      activeNodeNames.has(e.source.toLowerCase()) &&
      activeNodeNames.has(e.target.toLowerCase())
  );

  const isolatedNodes = nodes.filter((n) => n.degree === 0);

  // Compute graph metrics
  const V = nodes.length;
  const E = activeEdges.length;
  const networkDensity = V > 1 ? Number(((2 * E) / (V * (V - 1))).toFixed(4)) : 0;
  const averageDegree = V > 0 ? Number(((2 * E) / V).toFixed(2)) : 0;

  // Compute connected components using simple BFS/DFS
  const adj = new Map<string, string[]>();
  nodes.forEach((n) => adj.set(n.name, []));
  activeEdges.forEach((e) => {
    adj.get(e.source)?.push(e.target);
    adj.get(e.target)?.push(e.source);
  });

  const visited = new Set<string>();
  let connectedComponentsCount = 0;

  nodes.forEach((n) => {
    if (!visited.has(n.name)) {
      connectedComponentsCount++;
      const queue = [n.name];
      visited.add(n.name);
      while (queue.length > 0) {
        const curr = queue.shift()!;
        const neighbors = adj.get(curr) || [];
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            queue.push(neighbor);
          }
        }
      }
    }
  });

  return {
    nodes,
    edges: activeEdges,
    isolatedNodes,
    metrics: {
      totalEntities: entities.length,
      activeNodesInGraph: V,
      totalAuditedRelationships: records.length,
      verifiedEdgesCount,
      candidateProvisionalCount,
      gapCount,
      connectedComponentsCount,
      networkDensity,
      averageDegree,
    },
  };
}

// Compute deterministic physics positions for SVG visualization
export function calculateNodePositions(
  nodes: GraphNode[],
  edges: GraphEdge[],
  width: number,
  height: number
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  if (nodes.length === 0) return positions;

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.38;

  // Group nodes by entity type for clean visual clusters
  const typeGroups: Record<EntityType, GraphNode[]> = {
    open_source_project: [],
    standards_body: [],
    institution: [],
    standard_or_framework: [],
  };

  nodes.forEach((n) => {
    if (typeGroups[n.entity_type]) {
      typeGroups[n.entity_type].push(n);
    } else {
      typeGroups.open_source_project.push(n);
    }
  });

  // Assign angles based on quadrant sectors
  const sectors: Record<EntityType, { startAngle: number; endAngle: number }> = {
    open_source_project: { startAngle: Math.PI * 0.7, endAngle: Math.PI * 1.3 }, // Left sector
    standards_body: { startAngle: -Math.PI * 0.25, endAngle: Math.PI * 0.25 },   // Right sector
    institution: { startAngle: Math.PI * 0.25, endAngle: Math.PI * 0.7 },        // Bottom sector
    standard_or_framework: { startAngle: -Math.PI * 0.7, endAngle: -Math.PI * 0.25 }, // Top sector
  };

  Object.entries(typeGroups).forEach(([type, group]) => {
    const sector = sectors[type as EntityType];
    const count = group.length;
    group.forEach((node, idx) => {
      let angle: number;
      if (count === 1) {
        angle = (sector.startAngle + sector.endAngle) / 2;
      } else {
        const step = (sector.endAngle - sector.startAngle) / (count - 1 || 1);
        angle = sector.startAngle + idx * step;
      }

      // Add slight jitter/stagger for high degrees so nodes don't overlap
      const r = radius * (0.85 + (idx % 3) * 0.12);
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;
      positions.set(node.name, { x, y });
    });
  });

  return positions;
}
