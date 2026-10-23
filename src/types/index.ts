export type EntityType =
  | 'open_source_project'
  | 'institution'
  | 'standards_body'
  | 'standard_or_framework';

export type RelationshipType =
  | 'formal_membership'
  | 'technical_contribution'
  | 'consultation_response'
  | 'documented_citation'
  | 'declared_alignment'
  | 'contextual_relevance'
  | 'unresolved';

export type EvidenceStatus =
  | 'candidate'
  | 'documented'
  | 'independently_verified'
  | 'gap';

export interface Entity {
  id: string;
  name: string;
  entity_type: EntityType;
  official_url: string;
  description: string;
  jurisdiction?: string;
  lead_maintainer_or_secretariat?: string;
}

export interface RelationshipRecord {
  id: string;
  project: string;
  institution_or_process: string;
  relationship_type: RelationshipType;
  evidence_status: EvidenceStatus;
  source_url: string;
  source_passage: string;
  access_date: string; // YYYY-MM-DD
  notes: string;
  reviewer?: string;
  gap_recommendation?: string;
  audit_timestamp?: string;
}

export interface SourceRegistryItem {
  id: string;
  name: string;
  source_type: 'official_policy' | 'standards_body' | 'project_repository' | 'consultation_portal' | 'academic_registry';
  url: string;
  authority_level: 'primary' | 'secondary' | 'informal';
  coverage_notes: string;
}

export interface ValidationIssue {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationCheckResult {
  valid: boolean;
  missing_fields: string[];
  warnings: string[];
  issues: ValidationIssue[];
}

export interface GraphNode {
  id: string;
  name: string;
  entity_type: EntityType;
  degree: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationship_type: RelationshipType;
  evidence_status: EvidenceStatus;
  record: RelationshipRecord;
}
