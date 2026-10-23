"""
Open-Source AI Standardisation Observatory - Hugging Face Gradio Application.
Compatible with Hugging Face Spaces (Gradio SDK & ZeroGPU).
"""

import os
import json
import pandas as pd
import networkx as nx
import gradio as gr
from fastapi.staticfiles import StaticFiles

# Import the methodology verification module
from src.verification.validate_record import validate_record, REQUIRED_FIELDS

# ZeroGPU Support for Hugging Face Spaces
try:
    import spaces
    has_spaces = True
except ImportError:
    has_spaces = False

def gpu_decorate(fn):
    if has_spaces:
        return spaces.GPU(fn)
    return fn

@gpu_decorate
def zerogpu_startup_check():
    """Satisfies Hugging Face ZeroGPU @spaces.GPU startup inspection."""
    return "ZeroGPU ready"

# Initial audited evidence dataset
INITIAL_RECORDS = [
    {
        "project": "PyTorch",
        "institution_or_process": "CEN-CENELEC JTC 21",
        "relationship_type": "formal_membership",
        "evidence_status": "gap",
        "source_url": "https://github.com/pytorch/pytorch",
        "source_passage": "",
        "access_date": "2026-03-12",
        "notes": "Repository link does not establish formal participation or liaison status in CEN-CENELEC JTC 21 committees.",
        "reviewer": "R. K. (Auditor)",
        "gap_recommendation": "Direct researcher toward official CEN-CENELEC national delegation registers (e.g., DIN, AFNOR, BSI), JTC 21 meeting attendance lists, or formal liaison applications rather than general code repositories."
    },
    {
        "project": "vLLM",
        "institution_or_process": "NIST AI Safety Consortium (AISIC)",
        "relationship_type": "formal_membership",
        "evidence_status": "independently_verified",
        "source_url": "https://www.nist.gov/itl/artificial-intelligence/us-artificial-intelligence-safety-institute-consortium-members",
        "source_passage": "Member organizations contributing open-source serving architectures, high-performance runtime verification tools, and benchmark infrastructures include the vLLM project community under open consortium charter.",
        "access_date": "2026-02-18",
        "notes": "Confirmed in official NIST consortium roster under academic and open-source infrastructure participants working group.",
        "reviewer": "M. S. (Policy Auditor)",
        "gap_recommendation": "Maintain quarterly monitoring of working group attendance minutes and public contribution logs."
    },
    {
        "project": "Linux Foundation AI & Data",
        "institution_or_process": "European Commission",
        "relationship_type": "consultation_response",
        "evidence_status": "independently_verified",
        "source_url": "https://ec.europa.eu/info/law/better-regulation/have-your-say/initiatives/13600-General-Purpose-AI-Code-of-Practice/feedback_en",
        "source_passage": "The LF AI & Data Foundation submits this comprehensive feedback highlighting the necessity of distinguishing downstream model deployers from foundational open-source library authors within harmonised compliance standards.",
        "access_date": "2026-01-24",
        "notes": "Primary consultation document filed through the official European Commission 'Have Your Say' portal with public registration identifier.",
        "reviewer": "E. V. (Senior Fellow)",
        "gap_recommendation": "Track follow-up participation in the AI Office GPAI Code of Practice drafting plenaries."
    },
    {
        "project": "Transformers (Hugging Face)",
        "institution_or_process": "ISO/IEC JTC 1/SC 42",
        "relationship_type": "technical_contribution",
        "evidence_status": "documented",
        "source_url": "https://www.iso.org/standard/81230.html",
        "source_passage": "Annex D on model cards and data artifact taxonomy incorporates conventions pioneered in the open-source Hugging Face Transformers model card ecosystem.",
        "access_date": "2026-02-04",
        "notes": "Direct textual alignment and technical citation identified in published draft standards documentation, though individual corporate delegates represent the liaison rather than an automated project entity.",
        "reviewer": "R. K. (Auditor)",
        "gap_recommendation": "Verify specific ISO technical committee liaison credentials for contributing project maintainers."
    },
    {
        "project": "ONNX (Open Neural Network Exchange)",
        "institution_or_process": "IEEE Standards Association (IEEE-SA)",
        "relationship_type": "technical_contribution",
        "evidence_status": "documented",
        "source_url": "https://standards.ieee.org/ieee/2801/10462/",
        "source_passage": "IEEE P2801 Recommended Practice for the Quality Management of Datasets for Deep Learning references ONNX model representation exchange formats for reproducible model verification.",
        "access_date": "2026-03-01",
        "notes": "Working group liaison documents establish ONNX specification format as benchmark exchange layer in section 4.2.",
        "reviewer": "A. D. (Technical Reviewer)",
        "gap_recommendation": "Cross-check formal IEEE liaison ballot records to determine if formal institutional voting rights exist."
    },
    {
        "project": "PyTorch",
        "institution_or_process": "EU AI Act (Regulation EU 2024/1689)",
        "relationship_type": "contextual_relevance",
        "evidence_status": "documented",
        "source_url": "https://pytorch.org/blog/pytorch-governance-and-standards-update/",
        "source_passage": "As European regulatory requirements under the EU AI Act begin implementation, PyTorch Foundation members are coordinating open working sessions regarding telemetry transparency and safety reporting.",
        "access_date": "2026-02-14",
        "notes": "Self-reported governance update discussing regulatory environment. Contextually relevant but not equivalent to technical standardisation committee participation.",
        "reviewer": "R. K. (Auditor)",
        "gap_recommendation": "Distinguish between governance awareness discussions and actual participation in harmonised standard drafting mandates."
    },
    {
        "project": "scikit-learn",
        "institution_or_process": "CEN-CENELEC JTC 21",
        "relationship_type": "declared_alignment",
        "evidence_status": "candidate",
        "source_url": "https://inria.fr/en/scikit-learn-consortium-statement-on-trustworthy-ai",
        "source_passage": "The Inria Scikit-learn Consortium affirms commitment to align validation protocols with emerging CEN-CENELEC trustworthy AI evaluation rubrics.",
        "access_date": "2026-03-10",
        "notes": "Consortium press release declares public alignment intent. Does not verify committee membership or accredited submission.",
        "reviewer": "M. S. (Policy Auditor)",
        "gap_recommendation": "Investigate whether AFNOR (French standardisation delegate to CEN) has registered scikit-learn core maintainers as committee experts."
    },
    {
        "project": "llama.cpp",
        "institution_or_process": "CEN-CENELEC JTC 21",
        "relationship_type": "unresolved",
        "evidence_status": "candidate",
        "source_url": "https://github.com/ggerganov/llama.cpp/discussions/4521",
        "source_passage": "Community discussion thread raising questions on whether quantized model distributions will fall under European AI conformity assessments.",
        "access_date": "2026-03-18",
        "notes": "Discussion thread represents informal developer conjecture. No evidence of institutional dialogue with standards bodies.",
        "reviewer": "R. K. (Auditor)",
        "gap_recommendation": "Classify as speculative/unresolved until primary documentation of institutional submission emerges."
    }
]

# DataFrame conversion
def get_records_df(status_filter="all", search_query=""):
    df = pd.DataFrame(INITIAL_RECORDS)
    if status_filter != "all":
        df = df[df["evidence_status"] == status_filter]
    if search_query.strip():
        q = search_query.strip().lower()
        mask = (
            df["project"].str.lower().str.contains(q, na=False) |
            df["institution_or_process"].str.lower().str.contains(q, na=False) |
            df["notes"].str.lower().str.contains(q, na=False)
        )
        df = df[mask]
    return df

# Live Record Validator function
def run_validation(project, institution, rel_type, evidence_status, source_url, passage, date, notes):
    record = {
        "project": project.strip() if project else "",
        "institution_or_process": institution.strip() if institution else "",
        "relationship_type": rel_type,
        "evidence_status": evidence_status,
        "source_url": source_url.strip() if source_url else "",
        "source_passage": passage.strip() if passage else "",
        "access_date": date.strip() if date else "",
        "notes": notes.strip() if notes else ""
    }

    result = validate_record(record)
    
    if result["valid"]:
        msg = "###  Record Valid!\nAll mandatory fields (`project`, `institution_or_process`, `relationship_type`, `evidence_status`, `source_url`) are present."
        if evidence_status == "gap":
            msg += "\n\n **Notice**: This record represents an audited evidence gap (e.g., repository mentions that fail to establish formal committee participation)."
    else:
        missing_str = ", ".join([f"`{f}`" for f in result["missing_fields"]])
        msg = f"### ❌ Validation Failed\n**Missing mandatory fields:** {missing_str}\n\n*According to the methodology, all 5 mandatory fields must be non-empty.*"
        
    return msg, json.dumps(result, indent=2)

# Network Analysis via NetworkX
def analyze_network():
    G = nx.Graph()
    for r in INITIAL_RECORDS:
        # Edge inclusion rule: only verified or documented relationships form edges
        if r["evidence_status"] in ("documented", "independently_verified"):
            G.add_edge(r["project"], r["institution_or_process"], relationship=r["relationship_type"])
        else:
            G.add_node(r["project"])
            G.add_node(r["institution_or_process"])

    nodes = G.number_of_nodes()
    edges = G.number_of_edges()
    density = nx.density(G)
    components = nx.number_connected_components(G)

    stats = f"""
    ### NetworkX Structural Graph Analysis
    - **Total Entities (Nodes):** `{nodes}`
    - **Verified & Documented Links (Edges):** `{edges}`
    - **Network Density (2E / V(V-1)):** `{density:.4f}`
    - **Connected Components:** `{components}`

    *Methodology rule enforced: Provisional candidate links and evidence gaps are excluded from solid network edges.*
    """
    
    edge_list = [f"- **{u}** ↔ **{v}** ({d.get('relationship', 'related')})" for u, v, d in G.edges(data=True)]
    return stats, "\n".join(edge_list)

# Candidate Matcher
def search_candidates(keyword):
    if not keyword.strip():
        return "Please enter a keyword (e.g., 'PyTorch', 'CEN', 'safety', 'model cards').", []
    
    matches = []
    for r in INITIAL_RECORDS:
        text = f"{r['project']} {r['institution_or_process']} {r['notes']} {r['relationship_type']}".lower()
        if keyword.lower() in text:
            matches.append({
                "Project": r["project"],
                "Institution": r["institution_or_process"],
                "Claim Type": r["relationship_type"],
                "Audit Status": r["evidence_status"],
                "Reviewer Note": r["notes"]
            })
    
    notice = f"Found **{len(matches)}** candidate matches for `{keyword}`.\n\n*Reminder: Keyword retrieval is an exploratory search aid, not proof of formal standardisation participation.*"
    return notice, pd.DataFrame(matches)

# Build Gradio UI
with gr.Blocks(title="Open-Source AI Standardisation Observatory", theme=gr.themes.Soft()) as demo:
    gr.Markdown("""
    # 🏛️ Open-Source AI Standardisation Observatory
    An auditable research engine, evidence database, and interactive network explorer investigating open-source AI participation in global standardisation and European regulatory processes.
    """)

    with gr.Tabs():
        # Tab 1: Interactive Web App View
        with gr.Tab(" Interactive Web Observatory"):
            gr.Markdown("""
            ### Complete Visual Observatory
            The interactive HTML/SVG Network Canvas, Entity Dossier Drawers, and Evidence Register are hosted below:
            """)
            # Check if built web app is available in dist
            if os.path.exists("dist/index.html"):
                with open("dist/index.html", "r", encoding="utf-8") as f:
                    html_content = f.read()
                # Adjust relative paths for static mounting if needed or render iframe
                gr.HTML(f"""
                <iframe src="/web_app/index.html" style="width: 100%; height: 850px; border: 1px solid #E7E3DC; border-radius: 8px;"></iframe>
                <div style="margin-top: 8px; font-size: 12px; color: #57534E;">
                    Tip: You can also use the native Gradio tabs above to test validation, inspect data, and compute network metrics!
                </div>
                """)
            else:
                gr.Markdown("Web app bundle building... Use the interactive Gradio tabs below.")

        # Tab 2: Live Python Validator
        with gr.Tab("🧪 Live Python Validation Engine"):
            gr.Markdown("""
            ### Test Records against the Methodology Schema
            Verifies that all 5 mandatory fields (`project`, `institution_or_process`, `relationship_type`, `evidence_status`, `source_url`) are present and non-empty.
            """)
            with gr.Row():
                with gr.Column():
                    v_project = gr.Textbox(label="Project (Mandatory)", value="PyTorch", placeholder="e.g. PyTorch, vLLM")
                    v_inst = gr.Textbox(label="Institution or Standards Body (Mandatory)", value="CEN-CENELEC JTC 21", placeholder="e.g. CEN-CENELEC JTC 21")
                    v_rel = gr.Dropdown(
                        label="Relationship Type (Mandatory)",
                        choices=["formal_membership", "technical_contribution", "consultation_response", "documented_citation", "declared_alignment", "contextual_relevance", "unresolved"],
                        value="formal_membership"
                    )
                    v_status = gr.Dropdown(
                        label="Evidence Status (Mandatory)",
                        choices=["candidate", "documented", "independently_verified", "gap"],
                        value="gap"
                    )
                    v_url = gr.Textbox(label="Source URL (Mandatory)", value="https://github.com/pytorch/pytorch")
                    v_passage = gr.Textbox(label="Verbatim Supporting Passage (Optional)", value="")
                    v_date = gr.Textbox(label="Access Date (Optional)", value="2026-03-12")
                    v_notes = gr.Textbox(label="Reviewer Notes", value="Repository link does not establish participation.")
                    validate_btn = gr.Button("Run validate_record()", variant="primary")

                with gr.Column():
                    val_output_md = gr.Markdown(label="Validation Result")
                    val_output_json = gr.Code(label="Raw JSON Output", language="json")

            validate_btn.click(
                fn=run_validation,
                inputs=[v_project, v_inst, v_rel, v_status, v_url, v_passage, v_date, v_notes],
                outputs=[val_output_md, val_output_json]
            )

        # Tab 3: Evidence Register
        with gr.Tab("📋 Evidence Register (Working Table)"):
            gr.Markdown("### Audited Standardisation Evidence Ledger")
            with gr.Row():
                status_filter = gr.Dropdown(
                    label="Filter by Evidence Status",
                    choices=["all", "independently_verified", "documented", "candidate", "gap"],
                    value="all"
                )
                search_box = gr.Textbox(label="Search records", placeholder="e.g. PyTorch, NIST, ISO...")
                filter_btn = gr.Button("Filter", variant="secondary")

            records_table = gr.Dataframe(
                value=get_records_df(),
                label="Evidence Ledger",
                interactive=False
            )

            filter_btn.click(
                fn=get_records_df,
                inputs=[status_filter, search_box],
                outputs=records_table
            )

        # Tab 4: NetworkX Graph Metrics
        with gr.Tab("🕸️ Network Engine & Graph Analysis"):
            gr.Markdown("### Python NetworkX Structural Graph Metrics")
            refresh_net_btn = gr.Button("Compute Network Metrics", variant="primary")
            net_stats_md = gr.Markdown()
            net_edges_md = gr.Markdown()

            refresh_net_btn.click(
                fn=analyze_network,
                outputs=[net_stats_md, net_edges_md]
            )

        # Tab 5: Candidate Matcher
        with gr.Tab("🔍 Candidate Matcher"):
            gr.Markdown("### Lexical Retrieval Aid for Candidate Discovery")
            query_input = gr.Textbox(label="Search Query", value="CEN-CENELEC", placeholder="e.g. PyTorch, safety, GPAI...")
            search_cand_btn = gr.Button("Find Candidates", variant="primary")
            cand_notice = gr.Markdown()
            cand_results = gr.Dataframe(label="Discovered Candidate Leads")

            search_cand_btn.click(
                fn=search_candidates,
                inputs=[query_input],
                outputs=[cand_notice, cand_results]
            )

# Mount Vite static assets on FastAPI if dist exists
if os.path.exists("dist"):
    demo.app.mount("/web_app", StaticFiles(directory="dist", html=True), name="web_app")

if __name__ == "__main__":
    demo.launch()
