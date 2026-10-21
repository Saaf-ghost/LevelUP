from app.core.config import Settings


def test_cors_origins_are_split_and_trimmed() -> None:
    settings = Settings(cors_origins="http://localhost:5173, http://127.0.0.1:5173")

    assert settings.cors_origin_list == [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]


def test_api_prefix_is_normalized() -> None:
    settings = Settings(api_prefix="api/v1/")

    assert settings.api_prefix == "/api/v1"
