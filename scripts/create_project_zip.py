#!/usr/bin/env python3
"""
Packages the Open-Source AI Standardisation Observatory project into a clean .zip archive.
Excludes node_modules, .git, cache, and build directories.
Outputs to public/open-source-ai-standardisation-observatory.zip for direct browser download.
"""

import os
import zipfile

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUTPUT_DIR = os.path.join(PROJECT_ROOT, "public")
OUTPUT_ZIP = os.path.join(OUTPUT_DIR, "open-source-ai-standardisation-observatory.zip")

EXCLUDE_DIRS = {
    "node_modules",
    ".git",
    ".aistudio",
    "__pycache__",
    ".pytest_cache",
}

EXCLUDE_FILES = {
    ".DS_Store",
    "open-source-ai-standardisation-observatory.zip",
}

def create_zip():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    file_count = 0
    with zipfile.ZipFile(OUTPUT_ZIP, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(PROJECT_ROOT):
            # Prune excluded directories
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith(".aistudio")]

            for file in files:
                if file in EXCLUDE_FILES or file.endswith(".pyc") or file.endswith(".zip"):
                    continue

                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, PROJECT_ROOT)

                # Skip files inside public/ if they are the output zip
                if rel_path == os.path.relpath(OUTPUT_ZIP, PROJECT_ROOT):
                    continue

                zipf.write(full_path, arcname=rel_path)
                file_count += 1

    size_kb = os.path.getsize(OUTPUT_ZIP) / 1024
    print(f"Created {OUTPUT_ZIP} with {file_count} files ({size_kb:.1f} KB)")

if __name__ == "__main__":
    create_zip()
