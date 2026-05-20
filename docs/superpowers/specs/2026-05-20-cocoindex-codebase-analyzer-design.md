# CocoIndex Codebase Analyzer Design

## Overview
This document outlines the design for a Python-based CocoIndex data pipeline that automatically analyzes the NestJS `src` directory. It uses an LLM to generate a file-by-file breakdown explaining how the code works, its data flow, and key highlights, ultimately producing a comprehensive `src_explanation.md` document.

## Architecture & Setup
- **Location:** The Python pipeline will be isolated in a `tools/analyzer` directory to avoid polluting the NestJS root.
- **Dependencies:** 
  - `cocoindex>=1.0.0`: The core incremental processing framework.
  - `litellm`: To interact with the LLM API.
  - `instructor`: For structured data extraction from the LLM.
  - `pydantic`: For defining the schema of the extracted data.

## Data Flow Pipeline

### 1. Source
- We will use CocoIndex's `localfs.walk_dir` to recursively scan the `../../src` directory.
- A `PatternFilePathMatcher` will ensure we only process `.ts` files (e.g., `**/*.ts`).

### 2. Transformation
- A processing function decorated with `@coco.fn(memo=True)` will handle each file. Memoization ensures that if the pipeline is run multiple times, only changed files are re-analyzed by the LLM.
- **LLM Extraction:** The file content will be sent to the LLM (via `instructor` and `litellm`), requesting structured output defined by a Pydantic model:
  - `file_path`: The path of the file.
  - `purpose`: A brief explanation of what the file does.
  - `data_flow`: How data enters and leaves this file.
  - `highlights`: Key code highlights or patterns used.

### 3. Target State
- Since CocoIndex is incremental, we will accumulate the results. 
- A final aggregation step (or a custom target) will format these structured JSON/Pydantic results into the final `src_explanation.md` file, which will be written to the root of the project.

## Error Handling & Testing
- If a file cannot be parsed or the LLM request fails, the pipeline will log the error and skip that file or retry.
- The pipeline can be run incrementally; it will only process new or modified files on subsequent runs.
