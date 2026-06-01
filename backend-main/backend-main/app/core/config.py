from pydantic_settings import BaseSettings
from pydantic import ConfigDict, Field
import os

class Settings(BaseSettings):
    database_url: str
    secret_key: str
    resource_hub: str = Field(..., alias="RESOURCE_HUB")  # <-- Add this line

    model_config = ConfigDict(
        env_file=".env",
        extra="ignore",  # Allow unrelated env vars in the same .env file
    )

settings = Settings()
