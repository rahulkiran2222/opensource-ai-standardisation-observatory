import React, { useState, useEffect } from 'react';
import { RelationshipRecord, RelationshipType, EvidenceStatus, Entity } from '../types';
import { validateRecord, generateGapGuidance } from '../utils/validation';
import { X, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: RelationshipRecord) => void;
  recordToEdit?: RelationshipRecord | null;
  entities: Entity[];
}

export const RecordModal: React.FC<RecordModalProps> = ({
  isOpen,
  onClose,
  onSave,
  recordToEdit,
  entities,
}) => {
  const [project, setProject] = useState('');
  const [institution, setInstitution] = useState('');
  const [relationshipType, setRelationshipType] = useState<RelationshipType>('unresolved');
  const [evidenceStatus, setEvidenceStatus] = useState<EvidenceStatus>('candidate');
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourcePassage, setSourcePassage] = useState('');
  const [accessDate, setAccessDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [reviewer, setReviewer] = useState('Senior Auditor');
  const [gapRecommendation, setGapRecommendation] = useState('');

  useEffect(() => {
    if (recordToEdit) {
      setProject(recordToEdit.project);
      setInstitution(recordToEdit.institution_or_process);
      setRelationshipType(recordToEdit.relationship_type);
      setEvidenceStatus(recordToEdit.evidence_status);
      setSourceUrl(recordToEdit.source_url || '');
      setSourcePassage(recordToEdit.source_passage || '');
      setAccessDate(recordToEdit.access_date || new Date().toISOString().slice(0, 10));
      setNotes(recordToEdit.notes || '');
      setReviewer(recordToEdit.reviewer || 'Senior Auditor');
      setGapRecommendation(recordToEdit.gap_recommendation || '');
    } else {
      setProject('');
      setInstitution('');
      setRelationshipType('unresolved');
      setEvidenceStatus('candidate');
      setSourceUrl('');
      setSourcePassage('');
      setAccessDate(new Date().toISOString().slice(0, 10));
      setNotes('');
      setReviewer('Senior Auditor');
      setGapRecommendation('');
    }
  }, [recordToEdit, isOpen]);

  // Generate gap recommendation if user selects gap
  const handleStatusChange = (newStatus: EvidenceStatus) => {
    setEvidenceStatus(newStatus);
    if (newStatus === 'gap' && !gapRecommendation && project && institution) {
      setGapRecommendation(generateGapGuidance(project, institution, relationshipType));
    }
  };

  const handleGenerateGuidance = () => {
    if (project && institution) {
      setGapRecommendation(generateGapGuidance(project, institution, relationshipType));
    }
  };

  const currentRecordState: Partial<RelationshipRecord> = {
    project,
    institution_or_process: institution,
    relationship_type: relationshipType,
    evidence_status: evidenceStatus,
    source_url: sourceUrl,
    source_passage: sourcePassage,
    access_date: accessDate,
    notes,
  };

  const validation = validateRecord(currentRecordState);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validation.valid) return;

    const savedRecord: RelationshipRecord = {
      id: recordToEdit ? recordToEdit.id : `rec_${Date.now()}`,
      project: project.trim(),
      institution_or_process: institution.trim(),
      relationship_type: relationshipType,
      evidence_status: evidenceStatus,
      source_url: sourceUrl.trim(),
      source_passage: sourcePassage.trim(),
      access_date: accessDate.trim(),
      notes: notes.trim(),
      reviewer: reviewer.trim(),
      gap_recommendation: gapRecommendation.trim(),
      audit_timestamp: new Date().toISOString(),
    };

    onSave(savedRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1C1917]/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-[#E7E3DC] rounded-xl max-w-2xl w-full p-6 space-y-5 shadow-lg my-8">
        <div className="flex items-start justify-between pb-3 border-b border-[#E7E3DC]">
          <div>
            <span className="text-xs font-mono text-[#78716C] uppercase">
              {recordToEdit ? 'Modify Existing Evidence Record' : 'Create New Audited Evidence Record'}
            </span>
            <h2 className="text-xl font-serif font-semibold text-[#1C1917] mt-0.5">
              {recordToEdit ? `${project} ↔ ${institution}` : 'Add Evidence Link'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#78716C] hover:text-[#1C1917] p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Entity Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-[#1C1917] block mb-1">
                Open-Source Project <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="text"
                list="projects-list"
                value={project}
                onChange={(e) => setProject(e.target.value)}
                placeholder="e.g. PyTorch, vLLM, ONNX"
                className="w-full p-2 bg-[#FAF8F5] border border-[#DDD6C8] rounded focus:outline-none focus:border-[#9A3412] text-[#1C1917]"
                required
              />
              <datalist id="projects-list">
                {entities
                  .filter((e) => e.entity_type === 'open_source_project')
                  .map((e) => (
                    <option key={e.id} value={e.name} />
                  ))}
              </datalist>
            </div>

            <div>
              <label className="font-semibold text-[#1C1917] block mb-1">
                Institution or Standards Body <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="text"
                list="institutions-list"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="e.g. CEN-CENELEC JTC 21, NIST"
                className="w-full p-2 bg-[#FAF8F5] border border-[#DDD6C8] rounded focus:outline-none focus:border-[#9A3412] text-[#1C1917]"
                required
              />
              <datalist id="institutions-list">
                {entities
                  .filter((e) => e.entity_type !== 'open_source_project')
                  .map((e) => (
                    <option key={e.id} value={e.name} />
                  ))}
              </datalist>
            </div>
          </div>

          {/* Relationship Modality & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-[#1C1917] block mb-1">
                Relationship Claim Type <span className="text-[#DC2626]">*</span>
              </label>
              <select
                value={relationshipType}
                onChange={(e) => setRelationshipType(e.target.value as RelationshipType)}
                className="w-full p-2 bg-[#FAF8F5] border border-[#DDD6C8] rounded focus:outline-none focus:border-[#9A3412] text-[#1C1917]"
              >
                <option value="formal_membership">formal_membership</option>
                <option value="technical_contribution">technical_contribution</option>
                <option value="consultation_response">consultation_response</option>
                <option value="documented_citation">documented_citation</option>
                <option value="declared_alignment">declared_alignment</option>
                <option value="contextual_relevance">contextual_relevance</option>
                <option value="unresolved">unresolved</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-[#1C1917] block mb-1">
                Evidence Audit Status <span className="text-[#DC2626]">*</span>
              </label>
              <select
                value={evidenceStatus}
                onChange={(e) => handleStatusChange(e.target.value as EvidenceStatus)}
                className="w-full p-2 bg-[#FAF8F5] border border-[#DDD6C8] rounded focus:outline-none focus:border-[#9A3412] text-[#1C1917]"
              >
                <option value="candidate">candidate (unverified lead)</option>
                <option value="documented">documented (textually cited)</option>
                <option value="independently_verified">independently_verified (authoritative roster)</option>
                <option value="gap">gap (investigated; insufficient proof)</option>
              </select>
            </div>
          </div>

          {/* Source URL */}
          <div>
            <label className="font-semibold text-[#1C1917] block mb-1">
              Source URL <span className="text-[#DC2626]">*</span>
            </label>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://..."
              className="w-full p-2 bg-[#FAF8F5] border border-[#DDD6C8] rounded focus:outline-none focus:border-[#9A3412] text-[#1C1917]"
              required
            />
          </div>

          {/* Verbatim Supporting Passage */}
          <div>
            <label className="font-semibold text-[#1C1917] block mb-1">
              Verbatim Supporting Passage
              {evidenceStatus === 'independently_verified' && (
                <span className="text-[#DC2626] ml-1">(Required for verified claims)</span>
              )}
            </label>
            <textarea
              rows={3}
              value={sourcePassage}
              onChange={(e) => setSourcePassage(e.target.value)}
              placeholder="Paste exact excerpt from public standard, meeting minute, or institutional roster..."
              className="w-full p-2 bg-[#FAF8F5] border border-[#DDD6C8] rounded focus:outline-none focus:border-[#9A3412] text-[#1C1917]"
            />
          </div>

          {/* Access Date & Reviewer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-[#1C1917] block mb-1">
                Access / Audit Date (YYYY-MM-DD)
              </label>
              <input
                type="date"
                value={accessDate}
                onChange={(e) => setAccessDate(e.target.value)}
                className="w-full p-2 bg-[#FAF8F5] border border-[#DDD6C8] rounded focus:outline-none focus:border-[#9A3412] text-[#1C1917]"
              />
            </div>

            <div>
              <label className="font-semibold text-[#1C1917] block mb-1">
                Reviewer / Auditor Identifier
              </label>
              <input
                type="text"
                value={reviewer}
                onChange={(e) => setReviewer(e.target.value)}
                className="w-full p-2 bg-[#FAF8F5] border border-[#DDD6C8] rounded focus:outline-none focus:border-[#9A3412] text-[#1C1917]"
              />
            </div>
          </div>

          {/* Reviewer Notes */}
          <div>
            <label className="font-semibold text-[#1C1917] block mb-1">
              Reviewer Notes / Assessment Rationale
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Repository link does not establish committee participation."
              className="w-full p-2 bg-[#FAF8F5] border border-[#DDD6C8] rounded focus:outline-none focus:border-[#9A3412] text-[#1C1917]"
            />
          </div>

          {/* Gap Guidance Action Directive */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-[#1C1917]">
                Gap Guidance Directive (Next Research Action)
              </label>
              <button
                type="button"
                onClick={handleGenerateGuidance}
                className="text-[11px] text-[#9A3412] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Auto-generate advice</span>
              </button>
            </div>
            <textarea
              rows={2}
              value={gapRecommendation}
              onChange={(e) => setGapRecommendation(e.target.value)}
              placeholder="What specific primary documents should researchers inspect to resolve this claim?"
              className="w-full p-2 bg-[#FAF8F5] border border-[#DDD6C8] rounded focus:outline-none focus:border-[#9A3412] text-[#1C1917]"
            />
          </div>

          {/* Live Validation Banner */}
          {!validation.valid && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded text-[#991B1B] space-y-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Cannot save record: Schema requirements not met</span>
              </div>
              <ul className="list-disc list-inside text-[11px]">
                {validation.issues.map((iss, i) => (
                  <li key={i}>{iss.message}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E7E3DC]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#57534E] hover:text-[#1C1917] hover:bg-[#FAF8F5] rounded border border-[#E7E3DC] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!validation.valid}
              className={`px-4 py-2 text-xs font-medium text-white rounded transition-colors cursor-pointer ${
                validation.valid
                  ? 'bg-[#1C1917] hover:bg-[#292524]'
                  : 'bg-[#A8A29E] cursor-not-allowed'
              }`}
            >
              {recordToEdit ? 'Save Changes' : 'Record in Ledger'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
