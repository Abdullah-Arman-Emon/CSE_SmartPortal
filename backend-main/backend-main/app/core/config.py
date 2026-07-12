from pydantic_settings import BaseSettings
from pydantic import Field
import os

class Settings(BaseSettings):
    database_url: str
    secret_key: str
    resource_hub: str = Field(..., alias="RESOURCE_HUB")  # <-- Add this line
    # Optional: Gemini key for the CSEDU chatbot (read here so it's a known field;
    # ChatbotApi also reads it from the environment via os.getenv).
    gemini_api_key: str = ""

    class Config:
        env_file = ".env"
        # Ignore any other keys present in .env (e.g. future service keys) so an
        # extra line never crashes startup.
        extra = "ignore"

settings = Settings()
