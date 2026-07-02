import os
import json
import uuid
import asyncio
import logging
from typing import Dict, Optional, List
from fastapi import FastAPI, HTTPException, Security, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Try to import google-antigravity and mcp
try:
    from google.antigravity import Agent, LocalAgentConfig, CapabilitiesConfig
except ImportError:
    class CapabilitiesConfig:
        def __init__(self, **kwargs): pass
    class LocalAgentConfig:
        def __init__(self, **kwargs): pass
    class Agent:
        def __init__(self, config): pass
        async def __aenter__(self): return self
        async def __aexit__(self, exc_type, exc_val, exc_tb): pass
        async def chat(self, prompt: str):
            async def mock_stream():
                yield "Error: google-antigravity package is not installed."
            return mock_stream()

try:
    from mcp.server.fastmcp import FastMCP
except ImportError:
    # Fallback placeholder if not installed
    class FastMCP:
        def __init__(self, *args, **kwargs): pass
        def tool(self):
            return lambda func: func
        def sse_app(self, mount_path="/"):
            pass

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("antigravity-bridge")

# Define paths & workspace configurations
CONFIG_PATH = os.path.expanduser("~/Projects/project/antigravity-bridge/config.json")
WORKSPACE_ROOT = os.path.expanduser("~/Projects/project")

DEFAULT_CONFIG = {
    "api_key": str(uuid.uuid4()),
    "port": 8000,
    "host": "127.0.0.1",
    "enable_write_capabilities": True,
    "allowNonWorkspaceAccess": False,
    "system_instructions": "You are a Google Antigravity agent. You help the user manage their codebase, run commands, and write code."
}

# Load or generate config
if not os.path.exists(os.path.dirname(CONFIG_PATH)):
    os.makedirs(os.path.dirname(CONFIG_PATH), exist_ok=True)

if os.path.exists(CONFIG_PATH):
    try:
        with open(CONFIG_PATH, "r") as f:
            config_data = json.load(f)
    except Exception:
        config_data = DEFAULT_CONFIG
else:
    config_data = DEFAULT_CONFIG
    with open(CONFIG_PATH, "w") as f:
        json.dump(config_data, f, indent=4)

API_KEY = config_data.get("api_key", DEFAULT_CONFIG["api_key"])
SYSTEM_INSTRUCTIONS = config_data.get("system_instructions", DEFAULT_CONFIG["system_instructions"])
ENABLE_WRITE = config_data.get("enable_write_capabilities", DEFAULT_CONFIG["enable_write_capabilities"])
ALLOW_NON_WORKSPACE = config_data.get("allowNonWorkspaceAccess", DEFAULT_CONFIG["allowNonWorkspaceAccess"])

# Initialize FastAPI App
app = FastAPI(
    title="Antigravity GPT & Claude Bridge",
    description="Secure bridge API to connect ChatGPT Actions & Claude Remote MCP with Google Antigravity local agent.",
    version="1.1.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper to resolve workspace paths safely
def safe_resolve_path(rel_path: str) -> str:
    abs_path = os.path.abspath(os.path.join(WORKSPACE_ROOT, rel_path))
    if not abs_path.startswith(WORKSPACE_ROOT) and not ALLOW_NON_WORKSPACE:
        raise ValueError("Access denied: path is outside the workspace root.")
    return abs_path

# ==========================================
# 1. MCP Server Implementation (for Claude)
# ==========================================
mcp = FastMCP("Antigravity")

@mcp.tool()
async def ask_antigravity(prompt: str) -> str:
    """
    Ask the local Antigravity agent to perform a task (e.g. read files, run commands, write code, explore).
    """
    capabilities = CapabilitiesConfig() if ENABLE_WRITE else None
    agent_config = LocalAgentConfig(
        system_instructions=SYSTEM_INSTRUCTIONS,
        capabilities=capabilities
    )
    try:
        async with Agent(agent_config) as agent:
            response = await agent.chat(prompt)
            output = ""
            async for token in response:
                output += token
            return output
    except Exception as e:
        return f"Error executing task in Antigravity: {str(e)}"

@mcp.tool()
async def list_directory(directory: str = ".") -> str:
    """List contents of a directory in the workspace."""
    try:
        abs_path = safe_resolve_path(directory)
        if not os.path.exists(abs_path):
            return f"Error: Directory {directory} does not exist."
        items = os.listdir(abs_path)
        result = []
        for item in items:
            full_item_path = os.path.join(abs_path, item)
            is_dir = os.path.isdir(full_item_path)
            type_str = "[DIR]" if is_dir else "[FILE]"
            size_str = f" ({os.path.getsize(full_item_path)} bytes)" if not is_dir else ""
            result.append(f"{type_str} {item}{size_str}")
        return "\n".join(result) if result else "(Empty directory)"
    except Exception as e:
        return f"Error: {str(e)}"

@mcp.tool()
async def view_file(file_path: str) -> str:
    """Read contents of a file in the workspace."""
    try:
        abs_path = safe_resolve_path(file_path)
        if not os.path.exists(abs_path):
            return f"Error: File {file_path} does not exist."
        with open(abs_path, "r", encoding="utf-8", errors="replace") as f:
            return f.read()
    except Exception as e:
        return f"Error: {str(e)}"

@mcp.tool()
async def write_file(file_path: str, content: str) -> str:
    """Write or overwrite a file in the workspace."""
    if not ENABLE_WRITE:
        return "Error: Write operations are disabled on this bridge."
    try:
        abs_path = safe_resolve_path(file_path)
        os.makedirs(os.path.dirname(abs_path), exist_ok=True)
        with open(abs_path, "w", encoding="utf-8") as f:
            f.write(content)
        return f"Successfully wrote to {file_path}."
    except Exception as e:
        return f"Error: {str(e)}"

@mcp.tool()
async def run_command(command: str) -> str:
    """Run a shell command in the workspace directory."""
    if not ENABLE_WRITE:
        return "Error: Command execution is disabled on this bridge."
    try:
        process = await asyncio.create_subprocess_shell(
            command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=WORKSPACE_ROOT
        )
        stdout, stderr = await process.communicate()
        result = []
        if stdout:
            result.append(stdout.decode("utf-8", errors="replace"))
        if stderr:
            result.append(f"Stderr:\n{stderr.decode('utf-8', errors='replace')}")
        return "\n".join(result) if result else "Command executed with no output."
    except Exception as e:
        return f"Error: {str(e)}"

# Mount the MCP SSE application
mcp_app = mcp.sse_app()
app.mount("/mcp", mcp_app)

# ==========================================
# 2. Security Middleware (for both HTTP/MCP)
# ==========================================
class SecurityASGIMiddleware:
    def __init__(self, app_to_wrap):
        self.app = app_to_wrap

    async def __call__(self, scope, receive, send):
        # We only check HTTP requests (GET and POST)
        if scope["type"] == "http":
            from starlette.datastructures import URL
            url = URL(scope=scope)
            
            # Authenticate the MCP SSE endpoint
            if url.path == "/mcp/sse":
                from urllib.parse import parse_qs
                query = parse_qs(scope.get("query_string", b"").decode("utf-8"))
                tokens = query.get("token", [])
                if not tokens or tokens[0] != API_KEY:
                    logger.warning(f"Unauthorized MCP access attempt on {url.path}")
                    await send({
                        "type": "http.response.start",
                        "status": 401,
                        "headers": [(b"content-type", b"text/plain")]
                    })
                    await send({
                        "type": "http.response.body",
                        "body": b"Unauthorized: Missing or invalid token parameter.",
                        "more_body": False
                    })
                    return

        # Pass to the main application
        await self.app(scope, receive, send)

app.add_middleware(SecurityASGIMiddleware)

# ==========================================
# 3. OpenAPI Endpoints (for ChatGPT Actions)
# ==========================================
security_scheme = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Security(security_scheme)):
    if credentials.credentials != API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return credentials.credentials

class ChatRequest(BaseModel):
    prompt: str = Field(..., description="Prompt/Instruction for the Antigravity agent.")

class TaskStatusResponse(BaseModel):
    task_id: str
    status: str
    output: str
    error: Optional[str] = None

class SessionResponse(BaseModel):
    session_id: str
    status: str

# Session State for ChatGPT
class AgentSession:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.input_queue = asyncio.Queue()
        self.output_queue = asyncio.Queue()
        self.status = "initializing"
        self.loop_task = None
        self.accumulated_output = ""
        self.current_task_id = None
        self.current_task_status = "idle"
        self.current_task_error = None

    async def start(self):
        self.loop_task = asyncio.create_task(self._agent_loop())

    async def _agent_loop(self):
        try:
            capabilities = CapabilitiesConfig() if ENABLE_WRITE else None
            agent_config = LocalAgentConfig(
                system_instructions=SYSTEM_INSTRUCTIONS,
                capabilities=capabilities
            )
            self.status = "idle"
            
            async with Agent(agent_config) as agent:
                while self.status != "closed":
                    item = await self.input_queue.get()
                    if item is None:
                        break
                    
                    task_id, prompt = item
                    self.current_task_id = task_id
                    self.current_task_status = "running"
                    self.status = "busy"
                    self.accumulated_output = ""
                    self.current_task_error = None
                    
                    try:
                        response = await agent.chat(prompt)
                        async for token in response:
                            self.accumulated_output += token
                            await self.output_queue.put(token)
                        
                        await self.output_queue.put(None)
                        self.current_task_status = "completed"
                    except Exception as e:
                        self.current_task_error = str(e)
                        self.current_task_status = "failed"
                        self.accumulated_output += f"\n[Agent Error: {str(e)}]"
                        await self.output_queue.put(None)
                    
                    self.status = "idle"
                    self.input_queue.task_done()
        except Exception as e:
            self.status = f"error: {str(e)}"
            self.current_task_status = "failed"
            self.current_task_error = str(e)

    async def close(self):
        self.status = "closed"
        await self.input_queue.put(None)
        if self.loop_task:
            self.loop_task.cancel()
            try:
                await self.loop_task
            except asyncio.CancelledError:
                pass

sessions: Dict[str, AgentSession] = {}
tasks_history: Dict[str, TaskStatusResponse] = {}

@app.post("/sessions", response_model=SessionResponse, dependencies=[Depends(verify_token)])
async def create_session():
    """Create a new stateful Antigravity agent session."""
    session_id = str(uuid.uuid4())
    session = AgentSession(session_id)
    await session.start()
    sessions[session_id] = session
    return SessionResponse(session_id=session_id, status=session.status)

@app.delete("/sessions/{session_id}", dependencies=[Depends(verify_token)])
async def close_session(session_id: str):
    """Close and clean up an active session."""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found.")
    session = sessions[session_id]
    await session.close()
    del sessions[session_id]
    return {"status": "closed", "session_id": session_id}

@app.post("/sessions/{session_id}/chat", dependencies=[Depends(verify_token)])
async def chat_sync_with_timeout(session_id: str, request: ChatRequest):
    """Interact with the agent synchronously with timeout fallback."""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found.")
    
    session = sessions[session_id]
    if session.status == "busy":
        raise HTTPException(status_code=409, detail="Agent is currently busy.")
        
    task_id = str(uuid.uuid4())
    await session.input_queue.put((task_id, request.prompt))
    
    start_time = asyncio.get_event_loop().time()
    completed = False
    
    while asyncio.get_event_loop().time() - start_time < 15.0:
        if session.current_task_status in ["completed", "failed"]:
            completed = True
            break
        await asyncio.sleep(0.5)
        
    return {
        "task_id": task_id,
        "completed": completed,
        "status": session.current_task_status,
        "output": session.accumulated_output,
        "error": session.current_task_error
    }

@app.get("/tasks/{task_id}", response_model=TaskStatusResponse, dependencies=[Depends(verify_token)])
async def get_task_status(task_id: str):
    """Poll task status and output."""
    for session in sessions.values():
        if session.current_task_id == task_id:
            return TaskStatusResponse(
                task_id=task_id,
                status=session.current_task_status,
                output=session.accumulated_output,
                error=session.current_task_error
            )
    if task_id in tasks_history:
        return tasks_history[task_id]
    raise HTTPException(status_code=404, detail="Task not found.")
