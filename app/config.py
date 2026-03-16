from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/middleman_verify"
    APP_ENV: str = "development"

    class Config:
        env_file = ".env"


settings = Settings()
