from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Auth
    api_key: str = "dev_12345"
    admin_key: str = "admin_secret"

    # CORS
    frontend_url: str = "http://localhost:5173"
    frontend_urls: str = ""
    strict_cors: bool = False

    # Model paths
    model_dir: str = "models"
    bike_model_path: str = "models/best_model.joblib"
    car_model_path: str = "models/car_model.joblib"

    # Database
    database_url: str = "sqlite+aiosqlite:///data/autovaluate.db"

    # Server
    log_level: str = "INFO"

    @property
    def allowed_origins(self) -> List[str]:
        origins = [self.frontend_url]
        if self.frontend_urls:
            origins.extend(
                [u.strip() for u in self.frontend_urls.split(",") if u.strip()]
            )
        return origins

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()
