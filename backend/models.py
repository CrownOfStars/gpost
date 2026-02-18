from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text, Float, DateTime, Table
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from datetime import datetime
from .database import Base

# --- Association Tables ---

# Many-to-Many: Skills <-> Tools
skills_tools = Table(
    'skills_tools', Base.metadata,
    Column('skill_id', String, ForeignKey('skills.id'), primary_key=True),
    Column('tool_id', String, ForeignKey('tools.id'), primary_key=True),
    Column('config', Text, nullable=True) # Storing JSON as Text for SQLite compatibility, use JSONB for Postgres
)

# Many-to-Many: Agents <-> Skills
agents_skills = Table(
    'agents_skills', Base.metadata,
    Column('agent_id', String, ForeignKey('agents.id'), primary_key=True),
    Column('skill_id', String, ForeignKey('skills.id'), primary_key=True),
    Column('enabled', Boolean, default=True)
)

# --- Core Models ---

class Tool(Base):
    __tablename__ = "tools"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    description = Column(Text)
    schema = Column(Text) # JSON stored as string
    credential_config = Column(Text) # JSON stored as string
    created_at = Column(DateTime, default=datetime.utcnow)

    skills = relationship("Skill", secondary=skills_tools, back_populates="tools")


class Provider(Base):
    __tablename__ = "providers"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    name = Column(String)
    base_url = Column(String)
    api_key = Column(String)
    is_active = Column(Boolean, default=True)

    llms = relationship("LLM", back_populates="provider", cascade="all, delete-orphan")


class LLM(Base):
    """LLM models fetched from a provider, stored for agent selection."""
    __tablename__ = "llms"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    provider_id = Column(String, ForeignKey("providers.id"), nullable=False)
    remote_id = Column(String, nullable=False)  # e.g. "gpt-4o", "gpt-4-turbo"
    is_llm = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    provider = relationship("Provider", back_populates="llms")
    agents = relationship("Agent", back_populates="model")

    __table_args__ = ({"sqlite_autoincrement": False},)


class Skill(Base):
    __tablename__ = "skills"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    description = Column(Text)
    prompt = Column(Text)
    code = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    tools = relationship("Tool", secondary=skills_tools, back_populates="skills")
    agents = relationship("Agent", secondary=agents_skills, back_populates="skills")


class Agent(Base):
    __tablename__ = "agents"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    name = Column(String)
    role = Column(String)
    avatar = Column(String)
    description = Column(Text)

    # LLM Config: link to Provider's LLM
    model_id = Column(String, ForeignKey("llms.id"), nullable=True)
    model_provider = Column(String, nullable=True)  # deprecated, kept for backward compat
    model_name = Column(String, nullable=True)  # deprecated, kept for backward compat
    temperature = Column(Float, default=0.7)

    system_prompt = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    model = relationship("LLM", back_populates="agents")
    skills = relationship("Skill", secondary=agents_skills, back_populates="agents")


class Session(Base):
    __tablename__ = "sessions"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    title = Column(String)
    user_id = Column(String)
    status = Column(String, default="active")
    
    # Topology: { "nodes": [], "edges": [] }
    graph_config = Column(Text) # JSON stored as string
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    messages = relationship("Message", back_populates="session", cascade="all, delete-orphan")
    session_agents = relationship("SessionAgent", back_populates="session", cascade="all, delete-orphan")


class SessionAgent(Base):
    """
    Snapshot of an agent inside a specific session. 
    Allows overriding prompts/models without affecting the global agent definition.
    """
    __tablename__ = "session_agents"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("sessions.id"))
    original_agent_id = Column(String, ForeignKey("agents.id"), nullable=True)
    
    # Instance overrides
    override_system_prompt = Column(Text, nullable=True)
    override_model = Column(String, nullable=True)
    
    # State
    memory_context = Column(Text) # JSON summary/short-term memory
    
    session = relationship("Session", back_populates="session_agents")
    original_agent = relationship("Agent")


class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("sessions.id"))
    
    role = Column(String) # user, assistant, system
    agent_id = Column(String, ForeignKey("agents.id"), nullable=True) # If sent by an agent
    
    content = Column(Text)
    
    # Structured data for UI: [{ "step": "thinking", "text": "..." }]
    thought_process = Column(Text) # JSON stored as string
    
    msg_type = Column(String, default="text") # text, tool_call, tool_result, error
    parent_id = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("Session", back_populates="messages")
    agent = relationship("Agent")