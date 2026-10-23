import React, { useState } from 'react';
import { pythonCodeModules } from '../data/pythonCodeModules';
import { initialSources } from '../data/initialData';
import { validateRecord } from '../utils/validation';
import {
  BookOpen,
  Layers,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Play,
  ExternalLink,
  Code2,
} from 'lucide-react';

export const MethodologyCodebook: React.FC = () => {
  const [selectedModuleFilename, setSelectedModuleFilename] = useState<string>(
    pythonCodeModules[2].filename // validate_record.py
  );
  const [copiedModule, setCopiedModule] = useState(false);

  // Live validator test state
  const [testProject, setTestProject] = useState('PyTorch');
  const [testInstitution, setTestInstitution] = useState('CEN-CENELEC JTC 21');
  const [testRelType, setTestRelType] = useState('formal_membership');
  const [testStatus, setTestStatus] = useState('gap');
  const [testUrl, setTestUrl] = useState('https://github.com/pytorch/pytorch');
  const [testPassage, setTestPassage] = useState('');
  const [testDate, setTestDate] = useState('2026-03-12');
  const [testNotes, setTestNotes] = useState('Repository link does not establish participation.');

  const liveValidationResult = validateRecord({
    project: testProject,
    institution_or_process: testInstitution,
    relationship_type: testRelType as any,
    evidence_status: testStatus as any,
    source_url: testUrl,
    source_passage: testPassage,
    access_date: testDate,
    notes: testNotes,
  });

  const activeModule = pythonCodeModules.find(
    (m) => m.filename === selectedModuleFilename
  ) || pythonCodeModules[0];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeModule.code);
    setCopiedModule(true);
    setTimeout(() => setCopiedModule(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Title & Editorial Description */}
      <div className="border-b border-[#E7E3DC] pb-5">
        <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-3">
          <div>
            <h1 className="text-2xl lg:text-3xl font-serif font-medium text-[#1C1917] tracking-tight">
              Research Methodology & Coding Architecture
            </h1>
            <p className="text-sm text-[#57534E] mt-1 max-w-2xl leading-relaxed">
              Conceptual foundations, four-layer architecture, controlled codebook taxonomy, and reproducible Python engine modules.
            </p>
          </div>
          <div className="text-xs text-[#78716C] font-mono">
            Academic Defense Framework
          </div>
        </div>
      </div>

      {/* The 4 Academic Layers */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#9A3412]" />
          <h2 className="text-lg font-serif font-semibold text-[#1C1917]">
            The Four-Layer Academic Framework
          </h2>
        </div>
        <p className="text-xs text-[#57534E] max-w-3xl leading-relaxed">
          How to present and defend this coding project to an academic supervisor: the system is constructed across four interconnected methodological tiers.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-white border border-[#E7E3DC] rounded-lg space-y-2">
            <div className="text-xs font-mono text-[#9A3412] font-semibold">
              Layer 01
            </div>
            <h3 className="text-base font-serif font-medium text-[#1C1917]">
              Data Layer
            </h3>
            <p className="text-xs text-[#57534E] leading-relaxed">
              Normalized schemas for entities (projects, SDOs, institutions), source registries, and relationship records with strict URI and date specifications.
            </p>
          </div>

          <div className="p-4 bg-white border border-[#E7E3DC] rounded-lg space-y-2">
            <div className="text-xs font-mono text-[#1E3A8A] font-semibold">
              Layer 02
            </div>
            <h3 className="text-base font-serif font-medium text-[#1C1917]">
              Research & Audit Layer
            </h3>
            <p className="text-xs text-[#57534E] leading-relaxed">
              Explicit coding rules, source authority weighting, verbatim passage extraction, and automated completeness validation.
            </p>
          </div>

          <div className="p-4 bg-white border border-[#E7E3DC] rounded-lg space-y-2">
            <div className="text-xs font-mono text-[#78350F] font-semibold">
              Layer 03
            </div>
            <h3 className="text-base font-serif font-medium text-[#1C1917]">
              Graph Engine Layer
            </h3>
            <p className="text-xs text-[#57534E] leading-relaxed">
              Transformation of validated relationships into NetworkX graph data structures. Rejects edges from unverified keyword hits.
            </p>
          </div>

          <div className="p-4 bg-white border border-[#E7E3DC] rounded-lg space-y-2">
            <div className="text-xs font-mono text-[#334155] font-semibold">
              Layer 04
            </div>
            <h3 className="text-base font-serif font-medium text-[#1C1917]">
              Observatory Interface Layer
            </h3>
            <p className="text-xs text-[#57534E] leading-relaxed">
              Interactive SVG network, researcher evidence register, candidate discovery matcher, gap action guidance, and reproducible CSV pipelines.
            </p>
          </div>
        </div>
      </div>

      {/* Controlled Codebook Taxonomy */}
      <div className="bg-white border border-[#E7E3DC] rounded-lg p-6 space-y-6">
        <div>
          <h2 className="text-lg font-serif font-semibold text-[#1C1917]">
            Controlled Vocabulary Codebook
          </h2>
          <p className="text-xs text-[#78716C] mt-1">
            Standardized definitions separating relationship types (what is claimed) from evidence audit status (how well it is proved).
          </p>
        </div>

        {/* Relationship Types Grid */}
        <div className="space-y-3">
          <div className="text-xs font-mono text-[#1C1917] uppercase tracking-wider font-semibold">
            Relationship Modality (Claim Type)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-[#FAF8F5] border border-[#E7E3DC] rounded space-y-1">
              <strong className="text-[#1C1917] block">formal_membership</strong>
              <p className="text-[#57534E]">
                Official accredited membership, liaison organization status, or voting delegate representation in an SDO committee.
              </p>
            </div>
            <div className="p-3 bg-[#FAF8F5] border border-[#E7E3DC] rounded space-y-1">
              <strong className="text-[#1C1917] block">technical_contribution</strong>
              <p className="text-[#57534E]">
                Submission of technical specifications, code artifacts, model cards, or test suites directly incorporated into draft standards.
              </p>
            </div>
            <div className="p-3 bg-[#FAF8F5] border border-[#E7E3DC] rounded space-y-1">
              <strong className="text-[#1C1917] block">consultation_response</strong>
              <p className="text-[#57534E]">
                Public feedback filed in response to legislative consultations (e.g. EU AI Act AI Office, GPAI Code of Practice).
              </p>
            </div>
            <div className="p-3 bg-[#FAF8F5] border border-[#E7E3DC] rounded space-y-1">
              <strong className="text-[#1C1917] block">documented_citation</strong>
              <p className="text-[#57534E]">
                Explicit reference or technical citation of an open-source project within official standard publications or guidelines.
              </p>
            </div>
            <div className="p-3 bg-[#FAF8F5] border border-[#E7E3DC] rounded space-y-1">
              <strong className="text-[#1C1917] block">declared_alignment</strong>
              <p className="text-[#57534E]">
                Public commitment by project maintainers to comply with or benchmark against specific standards (e.g. ISO/IEC 42001).
              </p>
            </div>
            <div className="p-3 bg-[#FAF8F5] border border-[#E7E3DC] rounded space-y-1">
              <strong className="text-[#1C1917] block">contextual_relevance</strong>
              <p className="text-[#57534E]">
                General governance dialogue or regulatory discussions without formal committee liaison or technical submission.
              </p>
            </div>
          </div>
        </div>

        {/* Evidence Status Grid */}
        <div className="space-y-3 pt-3 border-t border-[#F2EFE9]">
          <div className="text-xs font-mono text-[#1C1917] uppercase tracking-wider font-semibold">
            Evidence Audit Status (Confidence Level)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded space-y-1">
              <strong className="text-[#166534] block">independently_verified</strong>
              <p className="text-[#14532D]">
                Corroborated by primary institutional registers (e.g. NIST roster, EU Transparency register) with verbatim passages and access dates.
              </p>
            </div>
            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-1">
              <strong className="text-[#334155] block">documented</strong>
              <p className="text-[#475569]">
                Supported by direct published documentation or secondary liaison reports, but pending independent committee roster confirmation.
              </p>
            </div>
            <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded space-y-1">
              <strong className="text-[#92400E] block">candidate</strong>
              <p className="text-[#78350F]">
                Discovered via keyword matching or self-reported social posts. Has not undergone human audit or primary verification.
              </p>
            </div>
            <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded space-y-1">
              <strong className="text-[#991B1B] block">gap</strong>
              <p className="text-[#7F1D1D]">
                Investigated claim where provided sources fail to prove the relationship (e.g. PyTorch repo link != CEN committee membership).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Authoritative Source Registry */}
      <div className="bg-white border border-[#E7E3DC] rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-serif font-semibold text-[#1C1917]">
              Source Registry
            </h2>
            <p className="text-xs text-[#78716C] mt-0.5">
              Official institutional portals and primary registers for empirical evidence collection
            </p>
          </div>
          <span className="text-xs text-[#57534E] font-mono">
            {initialSources.length} Primary Registers Cataloged
          </span>
        </div>

        <div className="divide-y divide-[#F2EFE9] text-xs">
          {initialSources.map((src) => (
            <div key={src.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="font-semibold text-[#1C1917]">{src.name}</div>
                <div className="text-[#57534E] mt-0.5">{src.coverage_notes}</div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[11px] font-mono text-[#78716C] uppercase">
                  {src.authority_level}
                </span>
                <a
                  href={src.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[#9A3412] hover:underline"
                >
                  <span>Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reproducible Python Engine Modules Explorer */}
      <div className="bg-white border border-[#E7E3DC] rounded-lg p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-[#9A3412]" />
              <h2 className="text-lg font-serif font-semibold text-[#1C1917]">
                Python Code Modules
              </h2>
            </div>
            <p className="text-xs text-[#78716C] mt-0.5">
              Inspecting the actual executable Python source files for validation, graph construction, and reporting
            </p>
          </div>

          <button
            onClick={handleCopyCode}
            className="px-3 py-1.5 text-xs font-medium text-[#1C1917] bg-[#F2EDE4] hover:bg-[#EBE4D8] border border-[#DDD6C8] rounded transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            {copiedModule ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#166534]" />
                <span>Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Current Module</span>
              </>
            )}
          </button>
        </div>

        {/* Module Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {pythonCodeModules.map((m) => (
            <button
              key={m.filename}
              onClick={() => setSelectedModuleFilename(m.filename)}
              className={`px-3 py-1.5 rounded font-mono transition-colors cursor-pointer whitespace-nowrap ${
                selectedModuleFilename === m.filename
                  ? 'bg-[#1C1917] text-white font-medium'
                  : 'bg-[#FAF8F5] text-[#57534E] hover:text-[#1C1917] border border-[#E7E3DC]'
              }`}
            >
              {m.filename}
            </button>
          ))}
        </div>

        {/* Active Module Details */}
        <div className="text-xs text-[#57534E] p-2.5 bg-[#FAF8F5] border border-[#E7E3DC] rounded">
          <strong>Purpose:</strong> {activeModule.description}
        </div>

        {/* Code Block */}
        <pre className="p-4 bg-[#1C1917] text-[#FAF8F5] rounded-lg text-xs font-mono overflow-x-auto max-h-[380px] leading-relaxed select-text">
          {activeModule.code}
        </pre>
      </div>

      {/* Interactive Python-Style Live Validator Simulator */}
      <div className="bg-white border border-[#E7E3DC] rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-[#166534]" />
          <h2 className="text-lg font-serif font-semibold text-[#1C1917]">
            Live Validation Engine Simulator
          </h2>
        </div>
        <p className="text-xs text-[#57534E]">
          Test an evidence candidate in real-time against <code>validate_record.py</code> completeness and audit rules.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-semibold text-[#1C1917] block mb-1">Project</label>
            <input
              type="text"
              value={testProject}
              onChange={(e) => setTestProject(e.target.value)}
              className="w-full p-2 bg-[#FAF8F5] border border-[#DDD6C8] rounded text-[#1C1917]"
            />
          </div>

          <div>
            <label className="font-semibold text-[#1C1917] block mb-1">Target Institution or Process</label>
            <input
              type="text"
              value={testInstitution}
              onChange={(e) => setTestInstitution(e.target.value)}
              className="w-full p-2 bg-[#FAF8F5] border border-[#DDD6C8] rounded text-[#1C1917]"
            />
          </div>

          <div>
            <label className="font-semibold text-[#1C1917] block mb-1">Claimed Relationship Type</label>
            <select
              value={testRelType}
              onChange={(e) => setTestRelType(e.target.value)}
              className="w-full p-2 bg-[#FAF8F5] border border-[#DDD6C8] rounded text-[#1C1917]"
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
            <label className="font-semibold text-[#1C1917] block mb-1">Evidence Status</label>
            <select
              value={testStatus}
              onChange={(e) => setTestStatus(e.target.value)}
              className="w-full p-2 bg-[#FAF8F5] border border-[#DDD6C8] rounded text-[#1C1917]"
            >
              <option value="candidate">candidate</option>
              <option value="documented">documented</option>
              <option value="independently_verified">independently_verified</option>
              <option value="gap">gap</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="font-semibold text-[#1C1917] block mb-1">Source URL</label>
            <input
              type="text"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              className="w-full p-2 bg-[#FAF8F5] border border-[#DDD6C8] rounded text-[#1C1917]"
            />
          </div>

          <div className="md:col-span-2">
            <label className="font-semibold text-[#1C1917] block mb-1">
              Verbatim Source Passage (Required for <code>independently_verified</code>)
            </label>
            <textarea
              rows={2}
              value={testPassage}
              onChange={(e) => setTestPassage(e.target.value)}
              placeholder="Paste exact supporting text from official document..."
              className="w-full p-2 bg-[#FAF8F5] border border-[#DDD6C8] rounded text-[#1C1917]"
            />
          </div>

          <div>
            <label className="font-semibold text-[#1C1917] block mb-1">Access Date (YYYY-MM-DD)</label>
            <input
              type="text"
              value={testDate}
              onChange={(e) => setTestDate(e.target.value)}
              className="w-full p-2 bg-[#FAF8F5] border border-[#DDD6C8] rounded text-[#1C1917]"
            />
          </div>

          <div>
            <label className="font-semibold text-[#1C1917] block mb-1">Reviewer Audit Notes</label>
            <input
              type="text"
              value={testNotes}
              onChange={(e) => setTestNotes(e.target.value)}
              className="w-full p-2 bg-[#FAF8F5] border border-[#DDD6C8] rounded text-[#1C1917]"
            />
          </div>
        </div>

        {/* Live Validation Result Box */}
        <div
          className={`p-4 rounded-lg border text-xs space-y-1.5 ${
            liveValidationResult.valid
              ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#14532D]'
              : 'bg-[#FEF2F2] border-[#FECACA] text-[#7F1D1D]'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold">
            {liveValidationResult.valid ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-[#166534]" />
                <span>Record Structure Valid: Meets Observatory Audit Preconditions</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-[#DC2626]" />
                <span>Validation Rule Violations Detected</span>
              </>
            )}
          </div>

          {liveValidationResult.issues.length > 0 && (
            <ul className="list-disc list-inside space-y-1 pt-1 text-xs">
              {liveValidationResult.issues.map((issue, idx) => (
                <li key={idx}>
                  <strong>{issue.field}:</strong> {issue.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
