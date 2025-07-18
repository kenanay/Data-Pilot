from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///./data_pilot.db"
    SECRET_KEY: str = "super-secret-key"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALGORITHM: str = "HS256"
    ENVIRONMENT: str = "development"

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'


settings = Settings()
