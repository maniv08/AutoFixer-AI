from typing import List, Literal
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment variables or .env."""

    # LLM Settings
    LLM_PROVIDER: Literal["gemini", "openai", "anthropic", "ollama", "mock"] = "gemini"
    MODEL_NAME: str = "gemini-2.0-flash"
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    OLLAMA_BASE_URL: str = "http://localhost:11434"

    # Sandbox Configuration
    SANDBOX_TYPE: Literal["process", "docker"] = "process"
    SANDBOX_TIMEOUT_SECONDS: int = 60
    SANDBOX_MAX_MEMORY_MB: int = 512
    SANDBOX_WORKSPACE_ROOT: str = ""

    # Agent Loop Controls
    MAX_ITERATIONS: int = 5
    ENABLE_LINTER: bool = True
    ENABLE_STATIC_ANALYSIS: bool = True

    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5180",
        "http://127.0.0.1:5180",
        "http://localhost:8000",
        "*"
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
