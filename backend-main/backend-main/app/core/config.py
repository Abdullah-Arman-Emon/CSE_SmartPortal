from pydantic_settings import BaseSettings
from pydantic import Field
import os

class Settings(BaseSettings):
    database_url: str
    secret_key: str
    resource_hub: str = Field(..., alias="RESOURCE_HUB")  # <-- Add this line

    class Config:
        env_file = ".env"
        # extra = "forbid"  # Optional: Prevents loading any extra fields

settings = Settings()
