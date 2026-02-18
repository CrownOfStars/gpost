from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
import json

# --- Common Helpers ---

class JSONField(str):
    """Helper to treat strings as JSON in Pydantic"""
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if isinstance(v, dict) or isinstance(v, list):
            return json.dumps(v)
        return v

# --- Tool Schemas ---

class ToolBase(BaseModel):
    name: str
    description: Optional[str] = None
    schema: Optional[Dict[str, Any]] = None # Pydantic handles dict <-> json string via ORM mode hooks often, but let's keep it simple
    credential_config: Optional[Dict[str, Any]] = None

class ToolCreate(ToolBase):
    pass

class Tool(ToolBase):
    id: str
    created_at: datetime

    @field_validator('schema', mode='before')
    @classmethod
    def parse_schema(cls, v):
        if isinstance(v, str) and v:
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return None
        return v

    @field_validator('credential_config', mode='before')
    @classmethod
    def parse_credential_config(cls, v):
        if isinstance(v, str) and v:
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return None
        return v

    class Config:
        from_attributes = True
        # Custom encoder to handle the Text columns stored as JSON strings in DB
        json_encoders = {
            # In a real app, you might use a custom getter to parse the JSON string back to dict
        }

# --- Skill Schemas ---

class SkillBase(BaseModel):
    name: str
    description: Optional[str] = None
    prompt: Optional[str] = None
    code: Optional[str] = None

class SkillCreate(SkillBase):
    tool_ids: List[str] = []

class Skill(SkillBase):
    id: str
    created_at: datetime
    tools: List[Tool] = []

    class Config:
        from_attributes = True

# --- Agent Schemas ---

class AgentBase(BaseModel):
    name: str
    role: Optional[str] = "assistant"
    avatar: Optional[str] = None
    description: Optional[str] = None
    model_id: Optional[str] = None
    model_provider: Optional[str] = None
    model_name: Optional[str] = None
    temperature: Optional[float] = 0.7
    system_prompt: Optional[str] = None

class AgentCreate(AgentBase):
    skill_ids: List[str] = []

class Agent(AgentBase):
    id: str
    created_at: datetime
    skills: List[Skill] = []
    model: Optional["LLM"] = None

    class Config:
        from_attributes = True

# --- LLM Schemas ---

class LLMBase(BaseModel):
    provider_id: str
    remote_id: str
    is_llm: bool = True

class LLM(LLMBase):
    id: str

    class Config:
        from_attributes = True

# --- Provider Schemas ---

class ProviderBase(BaseModel):
    name: str
    base_url: Optional[str] = None
    api_key: Optional[str] = None
    is_active: bool = True

class ProviderCreate(ProviderBase):
    pass

class Provider(ProviderBase):
    id: str

    class Config:
        from_attributes = True

# --- Session Schemas ---

class SessionAgentBase(BaseModel):
    original_agent_id: str
    override_system_prompt: Optional[str] = None
    override_model: Optional[str] = None

class SessionAgentCreate(SessionAgentBase):
    pass

class SessionAgent(SessionAgentBase):
    id: str
    session_id: str
    memory_context: Optional[Union[str, Dict]] = None

    class Config:
        from_attributes = True

class MessageBase(BaseModel):
    role: str
    content: str
    agent_id: Optional[str] = None
    thought_process: Optional[Union[str, List[Dict]]] = None
    msg_type: Optional[str] = "text"
    parent_id: Optional[str] = None

class MessageCreate(MessageBase):
    pass

class Message(MessageBase):
    id: str
    session_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class SessionBase(BaseModel):
    title: Optional[str] = None
    user_id: Optional[str] = "default_user"
    status: Optional[str] = "active"
    graph_config: Optional[Union[str, Dict]] = None

class SessionCreate(SessionBase):
    pass

class Session(SessionBase):
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class SessionDetail(Session):
    messages: List[Message] = []
    session_agents: List[SessionAgent] = []

# --- Chat Request Schemas ---

class ChatRequest(BaseModel):
    session_id: str
    message: str # User input
    # Optional: target specific agent to start with, 
    # otherwise defaults to the 'entry' node in the graph
    target_agent_id: Optional[str] = None 

class ChatStopRequest(BaseModel):
    session_id: str

# Rebuild models for forward refs (Agent.model -> LLM)
Agent.model_rebuild()