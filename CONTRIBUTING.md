# Contributing

This repository is private while authorship, licensing, asset provenance, and
product-name clearance are resolved. Contributions are accepted only from
explicitly authorized collaborators.

## Development workflow

1. Create a focused branch from `main`.
2. Install Python 3.12 dependencies from `requirements-dev.txt` in a local
   virtual environment.
3. Keep `.env`, SQLite files, resumes, generated assets, and local project data
   out of Git.
4. Add or update tests for behavior changes.
5. Run `python -m ruff check app.py tests`, `python -m pytest`, and the relevant
   browser flows.
6. Explain security, privacy, accessibility, and migration impact in the pull
   request.

By contributing, you must have the right to submit the work and must identify
third-party or AI-assisted material whose terms or provenance require review.
No contribution changes the project licensing status unless the verified
rightsholders approve that change in writing.
