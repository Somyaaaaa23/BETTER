from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from dotenv import load_dotenv
load_dotenv()

db = SQLAlchemy()
migrate = Migrate()


def create_app():
    app = Flask(__name__)
    app.config.from_object("app.config.Config")

    db.init_app(app)
    migrate.init_app(app, db)
    CORS(app, supports_credentials=True, origins=["http://localhost:5173"])

    from app.routes.analyze import bp as analyze_bp
    from app.routes.sessions import bp as sessions_bp
    from app.routes.admin import bp as admin_bp

    app.register_blueprint(analyze_bp)
    app.register_blueprint(sessions_bp)
    app.register_blueprint(admin_bp)

    # Import models so Alembic can detect them
    from app.models import analysis  # noqa: F401

    return app
