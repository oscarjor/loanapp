.PHONY: help install lint test coverage clean run

help:
	@echo "Available commands:"
	@echo "  make install    - Install dependencies and setup pre-commit hooks"
	@echo "  make lint       - Run pylint on all Python files"
	@echo "  make test       - Run tests"
	@echo "  make coverage   - Run tests with coverage report"
	@echo "  make clean      - Remove generated files"
	@echo "  make run        - Run the development server"

install:
	python3 -m venv venv
	. venv/bin/activate && pip install -r requirements.txt
	@echo "✓ Dependencies installed"
	@echo "Run 'source venv/bin/activate' to activate the virtual environment"

lint:
	@echo "Running pylint..."
	. venv/bin/activate && pylint app tests

test:
	@echo "Running tests..."
	. venv/bin/activate && pytest tests/ -v

coverage:
	@echo "Running tests with coverage..."
	. venv/bin/activate && pytest tests/ --cov=app --cov-report=html --cov-report=term

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	rm -rf htmlcov/ .coverage

run:
	@echo "Starting development server..."
	. venv/bin/activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
