# CocoIndex Codebase Analyzer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Python CocoIndex data pipeline that reads all NestJS `.ts` files and uses an LLM to generate a `src_explanation.md` file explaining the codebase.

**Architecture:** A CocoIndex App scanning `src/**/*.ts` using `localfs`, processing each file with an LLM via `litellm` and `instructor`, and aggregating the results into a single Markdown file.

**Tech Stack:** Python, CocoIndex, LiteLLM, Instructor, Pydantic.

---

### Task 1: Setup Project and Dependencies

**Files:**
- Create: `tools/analyzer/pyproject.toml`
- Create: `tools/analyzer/.env`

- [ ] **Step 1: Write `pyproject.toml`**

```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "codebase-analyzer"
version = "0.1.0"
description = "CocoIndex pipeline to analyze NestJS codebase"
requires-python = ">=3.10"
dependencies = [
    "cocoindex>=1.0.0",
    "litellm",
    "instructor",
    "pydantic>=2.0"
]
```

- [ ] **Step 2: Create `.env` placeholder**

```env
# Put your OPENAI_API_KEY or GEMINI_API_KEY here depending on the LLM
OPENAI_API_KEY="your-api-key"
```

- [ ] **Step 3: Commit**

```bash
git add tools/analyzer/pyproject.toml tools/analyzer/.env
git commit -m "chore: setup analyzer project and dependencies"
```

### Task 2: Define Schemas and Processing Function

**Files:**
- Create: `tools/analyzer/main.py`

- [ ] **Step 1: Write initial `main.py` with Schemas and Processing Function**

```python
import pathlib
import json
import instructor
from pydantic import BaseModel, Field
from litellm import acompletion
import cocoindex as coco
from cocoindex.connectors import localfs
from cocoindex.resources.file import FileLike, PatternFilePathMatcher

# Use an instructor client for structured extraction
_instructor_client = instructor.from_litellm(acompletion, mode=instructor.Mode.JSON)

class FileAnalysis(BaseModel):
    file_path: str = Field(..., description="The path of the file.")
    purpose: str = Field(..., description="A brief explanation of what the file does.")
    data_flow: str = Field(..., description="How data enters and leaves this file.")
    highlights: str = Field(..., description="Key code highlights or patterns used.")

@coco.fn(memo=True)
async def analyze_file(file: FileLike, outdir: pathlib.Path) -> None:
    content = await file.read_text()
    file_path_str = str(file.file_path.path)
    
    # We use a relatively cheap but smart model
    result = await _instructor_client.chat.completions.create(
        model="gpt-4o-mini", # Make sure to configure your env correctly or change this
        response_model=FileAnalysis,
        messages=[
            {"role": "system", "content": "You are a senior NestJS developer explaining a codebase."},
            {"role": "user", "content": f"Analyze the following TypeScript file located at '{file_path_str}':\n\n```typescript\n{content}\n```"}
        ],
    )
    
    # Write the intermediate JSON result to a temp file in the outdir
    outname = f"{file.file_path.path.stem}_{hash(file_path_str)}.json"
    localfs.declare_file(outdir / outname, result.model_dump_json(indent=2), create_parent_dirs=True)
```

- [ ] **Step 2: Commit**

```bash
git add tools/analyzer/main.py
git commit -m "feat: add schema and file analysis function"
```

### Task 3: Define Aggregation Function and the App

**Files:**
- Modify: `tools/analyzer/main.py`

- [ ] **Step 1: Append Aggregation and App to `main.py`**

```python
@coco.fn
async def aggregate_results(outdir: pathlib.Path, project_root: pathlib.Path) -> None:
    all_json_files = localfs.walk_dir(
        outdir,
        recursive=False,
        path_matcher=PatternFilePathMatcher(included_patterns=["*.json"])
    )
    
    # Read all intermediate results
    analyses = []
    for _, file_like in all_json_files.items():
        content = await file_like.read_text()
        analyses.append(FileAnalysis.model_validate_json(content))
        
    # Sort for consistent output
    analyses.sort(key=lambda x: x.file_path)
    
    # Generate Markdown
    md_content = "# Source Code Analysis\n\n"
    for analysis in analyses:
        md_content += f"## {analysis.file_path}\n"
        md_content += f"**Purpose:** {analysis.purpose}\n\n"
        md_content += f"**Data Flow:** {analysis.data_flow}\n\n"
        md_content += f"**Highlights:** {analysis.highlights}\n\n"
        md_content += "---\n\n"
        
    localfs.declare_file(project_root / "src_explanation.md", md_content, create_parent_dirs=True)

@coco.fn
async def app_main(sourcedir: pathlib.Path, outdir: pathlib.Path, project_root: pathlib.Path) -> None:
    # 1. Scan source files
    files = localfs.walk_dir(
        sourcedir,
        recursive=True,
        path_matcher=PatternFilePathMatcher(included_patterns=["**/*.ts"])
    )
    
    # 2. Mount analysis component for each file
    await coco.mount_each(analyze_file, files.items(), outdir)
    
    # 3. Aggregate results (runs after all analyses are done in catch-up mode)
    await coco.mount(aggregate_results, outdir, project_root)

# Define the CocoIndex App
app = coco.App(
    coco.AppConfig(name="CodebaseAnalyzer"),
    app_main,
    sourcedir=pathlib.Path("../../src"),
    outdir=pathlib.Path("./.tmp_results"),
    project_root=pathlib.Path("../../")
)
```

- [ ] **Step 2: Commit**

```bash
git add tools/analyzer/main.py
git commit -m "feat: add aggregation and app definition"
```
