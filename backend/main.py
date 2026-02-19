import asyncio
from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional, AsyncGenerator
import json
import uuid
from openai import OpenAI

from . import models, schemas
from .database import engine, get_db

# Create Tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="GPost Agent Orchestration API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Agents ---

@app.get("/api/agents", response_model=List[schemas.Agent])
def get_agents(db: Session = Depends(get_db)):
    return db.query(models.Agent).all()

@app.post("/api/agents", response_model=schemas.Agent)
def create_agent(agent: schemas.AgentCreate, db: Session = Depends(get_db)):
    db_agent = models.Agent(**agent.dict(exclude={'skill_ids'}))
    
    # Handle Skill binding
    if agent.skill_ids:
        skills = db.query(models.Skill).filter(models.Skill.id.in_(agent.skill_ids)).all()
        db_agent.skills = skills
        
    db.add(db_agent)
    db.commit()
    db.refresh(db_agent)
    return db_agent

@app.get("/api/agents/{agent_id}", response_model=schemas.Agent)
def get_agent(agent_id: str, db: Session = Depends(get_db)):
    agent = db.query(models.Agent).filter(models.Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent

@app.put("/api/agents/{agent_id}", response_model=schemas.Agent)
def update_agent(agent_id: str, agent_update: schemas.AgentCreate, db: Session = Depends(get_db)):
    db_agent = db.query(models.Agent).filter(models.Agent.id == agent_id).first()
    if not db_agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Update fields
    for key, value in agent_update.dict(exclude={'skill_ids'}).items():
        setattr(db_agent, key, value)
    
    # Update skills relation
    if agent_update.skill_ids is not None:
        skills = db.query(models.Skill).filter(models.Skill.id.in_(agent_update.skill_ids)).all()
        db_agent.skills = skills

    db.commit()
    db.refresh(db_agent)
    return db_agent

@app.delete("/api/agents/{agent_id}")
def delete_agent(agent_id: str, db: Session = Depends(get_db)):
    db_agent = db.query(models.Agent).filter(models.Agent.id == agent_id).first()
    if not db_agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    db.delete(db_agent)
    db.commit()
    return {"ok": True}

# --- Skills ---

@app.get("/api/skills", response_model=List[schemas.Skill])
def get_skills(db: Session = Depends(get_db)):
    return db.query(models.Skill).all()

@app.post("/api/skills", response_model=schemas.Skill)
def create_skill(skill: schemas.SkillCreate, db: Session = Depends(get_db)):
    db_skill = models.Skill(**skill.dict(exclude={'tool_ids'}))
    
    # Handle Tool binding
    if skill.tool_ids:
        tools = db.query(models.Tool).filter(models.Tool.id.in_(skill.tool_ids)).all()
        db_skill.tools = tools
        
    db.add(db_skill)
    db.commit()
    db.refresh(db_skill)
    return db_skill

@app.put("/api/skills/{skill_id}", response_model=schemas.Skill)
def update_skill(skill_id: str, skill_update: schemas.SkillCreate, db: Session = Depends(get_db)):
    db_skill = db.query(models.Skill).filter(models.Skill.id == skill_id).first()
    if not db_skill:
        raise HTTPException(status_code=404, detail="Skill not found")
        
    for key, value in skill_update.dict(exclude={'tool_ids'}).items():
        setattr(db_skill, key, value)
        
    if skill_update.tool_ids is not None:
        tools = db.query(models.Tool).filter(models.Tool.id.in_(skill_update.tool_ids)).all()
        db_skill.tools = tools

    db.commit()
    db.refresh(db_skill)
    return db_skill

# --- Tools ---

@app.get("/api/tools", response_model=List[schemas.Tool])
def get_tools(db: Session = Depends(get_db)):
    return db.query(models.Tool).all()

@app.post("/api/tools", response_model=schemas.Tool)
def create_tool(tool: schemas.ToolCreate, db: Session = Depends(get_db)):
    # Convert dicts to json strings for storage
    tool_data = tool.dict()
    if tool_data.get('schema'):
        tool_data['schema'] = json.dumps(tool_data['schema'])
    if tool_data.get('credential_config'):
        tool_data['credential_config'] = json.dumps(tool_data['credential_config'])
        
    db_tool = models.Tool(**tool_data)
    db.add(db_tool)
    db.commit()
    db.refresh(db_tool)
    return db_tool

@app.put("/api/tools/{tool_id}", response_model=schemas.Tool)
def update_tool(tool_id: str, tool: schemas.ToolCreate, db: Session = Depends(get_db)):
    db_tool = db.query(models.Tool).filter(models.Tool.id == tool_id).first()
    if not db_tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    tool_data = tool.dict()
    if tool_data.get('schema'):
        tool_data['schema'] = json.dumps(tool_data['schema'])
    if tool_data.get('credential_config'):
        tool_data['credential_config'] = json.dumps(tool_data['credential_config'])
    for key, value in tool_data.items():
        setattr(db_tool, key, value)
    db.commit()
    db.refresh(db_tool)
    return db_tool

@app.delete("/api/tools/{tool_id}")
def delete_tool(tool_id: str, db: Session = Depends(get_db)):
    db_tool = db.query(models.Tool).filter(models.Tool.id == tool_id).first()
    if not db_tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    db.delete(db_tool)
    db.commit()
    return {"ok": True}

# --- Providers ---

@app.get("/api/providers", response_model=List[schemas.Provider])
def get_providers(db: Session = Depends(get_db)):
    return db.query(models.Provider).all()

@app.post("/api/providers", response_model=schemas.Provider)
def create_provider(provider: schemas.ProviderCreate, db: Session = Depends(get_db)):
    db_provider = models.Provider(**provider.dict())
    db.add(db_provider)
    db.commit()
    db.refresh(db_provider)
    return db_provider

@app.put("/api/providers/{provider_id}", response_model=schemas.Provider)
def update_provider(provider_id: str, provider: schemas.ProviderCreate, db: Session = Depends(get_db)):
    db_provider = db.query(models.Provider).filter(models.Provider.id == provider_id).first()
    if not db_provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    for key, value in provider.dict().items():
        setattr(db_provider, key, value)
    db.commit()
    db.refresh(db_provider)
    return db_provider

@app.delete("/api/providers/{provider_id}")
def delete_provider(provider_id: str, db: Session = Depends(get_db)):
    db_provider = db.query(models.Provider).filter(models.Provider.id == provider_id).first()
    if not db_provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    db.delete(db_provider)
    db.commit()
    return {"ok": True}

def _fetch_llms_from_provider(db_provider) -> list:
    """Fetch LLM list from remote provider API."""
    client = OpenAI(
        api_key=db_provider.api_key or "",
        base_url=db_provider.base_url
    )
    llm_models = []
    remote_models = client.models.list()
    for model in remote_models:
        model_id = model.id
        try:
            client.chat.completions.create(
                model=model_id,
                messages=[{"role": "user", "content": "say 1"}],
                max_tokens=1,
                timeout=5
            )
            llm_models.append({"remote_id": model_id, "is_llm": True})
        except Exception:
            continue
    return llm_models


@app.get("/api/llms", response_model=List[schemas.LLM])
def get_all_llms(provider_id: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """Get all LLMs, optionally filtered by provider_id."""
    q = db.query(models.LLM)
    if provider_id:
        q = q.filter(models.LLM.provider_id == provider_id)
    return q.all()


@app.get("/api/providers/{provider_id}/models", response_model=List[schemas.LLM])
def get_provider_models(provider_id: str, db: Session = Depends(get_db)):
    """Get LLMs from DB for this provider."""
    db_provider = db.query(models.Provider).filter(models.Provider.id == provider_id).first()
    if not db_provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    return db.query(models.LLM).filter(models.LLM.provider_id == provider_id).all()


@app.post("/api/providers/{provider_id}/models/refresh")
def refresh_provider_models(provider_id: str, db: Session = Depends(get_db)):
    """Fetch LLMs from remote provider and sync to DB."""
    db_provider = db.query(models.Provider).filter(models.Provider.id == provider_id).first()
    if not db_provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    if not db_provider.api_key:
        raise HTTPException(status_code=400, detail="Provider has no API key configured")

    try:
        llm_list = _fetch_llms_from_provider(db_provider)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch models from provider: {str(e)}"
        )

    # Delete existing LLMs for this provider, then insert new ones
    db.query(models.LLM).filter(models.LLM.provider_id == provider_id).delete()
    for item in llm_list:
        db_llm = models.LLM(
            provider_id=provider_id,
            remote_id=item["remote_id"],
            is_llm=item.get("is_llm", True)
        )
        db.add(db_llm)
    db.commit()

    return {
        "provider_id": provider_id,
        "total_count": len(llm_list),
        "models": [
            {"id": m.id, "remote_id": m.remote_id, "provider_id": m.provider_id}
            for m in db.query(models.LLM).filter(models.LLM.provider_id == provider_id).all()
        ]
    }

# --- Sessions ---

@app.get("/api/sessions", response_model=List[schemas.Session])
def get_sessions(db: Session = Depends(get_db)):
    return db.query(models.Session).all()

@app.post("/api/sessions", response_model=schemas.Session)
def create_session(session: schemas.SessionCreate, db: Session = Depends(get_db)):
    db_session = models.Session(**session.dict())
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

@app.get("/api/sessions/{session_id}", response_model=schemas.SessionDetail)
def get_session_detail(session_id: str, db: Session = Depends(get_db)):
    session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@app.patch("/api/sessions/{session_id}")
def update_session(session_id: str, session: schemas.SessionBase, db: Session = Depends(get_db)):
    db_session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session.title:
        db_session.title = session.title
    db.commit()
    return db_session

@app.delete("/api/sessions/{session_id}")
def delete_session(session_id: str, db: Session = Depends(get_db)):
    db_session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(db_session)
    db.commit()
    return {"ok": True}

# --- Session Agents & Topology ---

@app.get("/api/sessions/{session_id}/agents", response_model=List[schemas.SessionAgent])
def get_session_agents(session_id: str, db: Session = Depends(get_db)):
    return db.query(models.SessionAgent).filter(models.SessionAgent.session_id == session_id).all()

@app.post("/api/sessions/{session_id}/agents", response_model=schemas.SessionAgent)
def add_agent_to_session(session_id: str, agent_data: schemas.SessionAgentCreate, db: Session = Depends(get_db)):
    # 1. Verify session exists
    session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    # 2. Create Session Agent Instance
    db_session_agent = models.SessionAgent(
        session_id=session_id,
        original_agent_id=agent_data.original_agent_id,
        override_system_prompt=agent_data.override_system_prompt,
        override_model=agent_data.override_model
    )
    db.add(db_session_agent)
    db.commit()
    db.refresh(db_session_agent)
    return db_session_agent

@app.get("/api/sessions/{session_id}/graph")
def get_session_graph(session_id: str, db: Session = Depends(get_db)):
    session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Return parsed JSON or empty default
    if session.graph_config:
        return json.loads(session.graph_config)
    return {"nodes": [], "edges": []}

@app.put("/api/sessions/{session_id}/graph")
def update_session_graph(session_id: str, graph: dict, db: Session = Depends(get_db)):
    session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.graph_config = json.dumps(graph)
    db.commit()
    return {"ok": True}

# --- Chat & Orchestration ---

# --- SSE Stream Event Contract ---
# event: thinking | text | handoff | end
# data: JSON
#
# thinking: {"text": "..."}           - reasoning trace, append to thought block
# text:     {"chunk": "x", "agent_id": "...", "agent_name": "..."}  - typewriter chunk
# handoff:  {"from_agent_id", "from_agent_name", "to_agent_id", "to_agent_name"}  - agent switch
# end:      {"message_id": "..."}      - stream complete

def _sse_event(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


async def _mock_chat_stream(session_id: str, message: str) -> AsyncGenerator[str, None]:
    """Mock streaming: thinking -> text (typewriter) -> handoff -> end."""
    # 1. Parse @mentions (mock)
    mentioned = [m.strip() for m in message.split() if m.startswith("@")]
    agents_involved = ["Router Agent", "Coder Agent"] if not mentioned else [m for m in mentioned if m]

    # 2. Thinking
    yield _sse_event("thinking", {"text": f"User asked: '{message[:50]}...' Analyzing intent."})
    await asyncio.sleep(0.5)
    yield _sse_event("thinking", {"text": "Checking memory and context..."})
    await asyncio.sleep(0.4)
    yield _sse_event("thinking", {"text": "Drafting response..."})
    await asyncio.sleep(0.3)

    # 3. Text (typewriter) - first agent
    full_text = f"[Mock] I received your message: {message}. "
    for i, char in enumerate(full_text):
        yield _sse_event("text", {"chunk": char, "agent_id": "router", "agent_name": agents_involved[0] if agents_involved else "Assistant"})
        await asyncio.sleep(0.03)

    # 4. Handoff (if multiple agents)
    if len(agents_involved) > 1:
        yield _sse_event("handoff", {
            "from_agent_id": "router",
            "from_agent_name": agents_involved[0],
            "to_agent_id": "coder",
            "to_agent_name": agents_involved[1],
        })
        await asyncio.sleep(0.3)
        extra = " I'm the Coder Agent, ready to help with code."
        for char in extra:
            yield _sse_event("text", {"chunk": char, "agent_id": "coder", "agent_name": agents_involved[1]})
            await asyncio.sleep(0.02)

    # 5. End
    yield _sse_event("end", {"message_id": ""})


@app.post("/api/chat/stream")
async def chat_stream(request: schemas.ChatRequest, db: Session = Depends(get_db)):
    """
    SSE streaming chat. Saves user message, then streams: thinking -> text -> handoff? -> end.
    """
    session = db.query(models.Session).filter(models.Session.id == request.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    user_msg = models.Message(
        session_id=request.session_id,
        role="user",
        content=request.message,
        msg_type="text",
    )
    db.add(user_msg)
    db.commit()

    session_agents = db.query(models.SessionAgent).filter(
        models.SessionAgent.session_id == request.session_id
    ).all()
    agent_id = session_agents[0].original_agent_id if session_agents else None

    async def _stream_with_save():
        full_content: List[str] = []
        async for sse_chunk in _mock_chat_stream(request.session_id, request.message):
            if "event: text" in sse_chunk and "data:" in sse_chunk:
                try:
                    data_part = sse_chunk.split("data:", 1)[1].strip().split("\n")[0]
                    j = json.loads(data_part)
                    full_content.append(j.get("chunk", ""))
                except (IndexError, json.JSONDecodeError):
                    pass
            yield sse_chunk

        # Save assistant message after stream ends
        content = "".join(full_content)
        if content:
            bot_msg = models.Message(
                session_id=request.session_id,
                role="assistant",
                agent_id=agent_id,
                content=content,
                thought_process="[]",
                msg_type="text",
            )
            db.add(bot_msg)
            db.commit()

    return StreamingResponse(
        _stream_with_save(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.post("/api/chat/send")
def send_message(request: schemas.ChatRequest, db: Session = Depends(get_db)):
    """
    1. Saves user message
    2. (Mock) Simulates Orchestrator deciding which agent to run
    3. (Mock) Generates a response
    """
    
    # 1. Save User Message
    user_msg = models.Message(
        session_id=request.session_id,
        role="user",
        content=request.message,
        msg_type="text"
    )
    db.add(user_msg)
    db.commit()
    
    # --- MOCK ORCHESTRATION LOGIC START ---
    # In a real system, this would trigger a celery task or an async agent loop.
    
    # Let's see if we have agents in this session
    session_agents = db.query(models.SessionAgent).filter(models.SessionAgent.session_id == request.session_id).all()
    
    response_content = "I am a simple echo. Configure agents to get real responses."
    agent_id = None
    thought_process = []
    
    if session_agents:
        # Pick the first agent found in the session for demo purposes
        active_agent = session_agents[0]
        agent_id = active_agent.original_agent_id
        
        # Simulate thinking
        thought_process = [
            {"step": "plan", "text": f"User asked: '{request.message}'. I should respond."},
            {"step": "retrieve", "text": "Checking memory context..."},
            {"step": "generate", "text": "Drafting response..."}
        ]
        response_content = f" [Simulated Response from Agent] I received: {request.message}"

    # 2. Save Assistant Response
    bot_msg = models.Message(
        session_id=request.session_id,
        role="assistant",
        agent_id=agent_id,
        content=response_content,
        thought_process=json.dumps(thought_process),
        msg_type="text"
    )
    db.add(bot_msg)
    db.commit()
    # --- MOCK ORCHESTRATION LOGIC END ---

    return {"status": "success", "new_message_id": bot_msg.id}

@app.post("/api/chat/stop")
def stop_chat(request: schemas.ChatStopRequest):
    # In a real system, this would send a signal to the running async task
    return {"status": "stopped", "detail": "Signal sent to orchestrator."}

@app.get("/api/logs/{trace_id}")
def get_trace_logs(trace_id: str):
    # Mock data
    return {
        "trace_id": trace_id,
        "steps": [
            {"timestamp": "2023-10-27T10:00:00Z", "actor": "Router", "action": "Selected Agent A"},
            {"timestamp": "2023-10-27T10:00:01Z", "actor": "Agent A", "input": "Hello", "output": "Hi there"}
        ]
    }