# Matching Performance Notes (MVP)

- Scope: single `POST /matching/calculate` request with one CV and one Job.
- Baseline target: under 100ms average for local mocked data path.
- Hotspots:
  - text normalization
  - TF-IDF term generation and cosine vector build
- Current optimization choices:
  - hard text-length cap in normalizer
  - no DB N+1 in matching service (one CV query + one Job query)
- Future optimization hook:
  - optional cache on `(cvId, jobId, cv.updatedAt, job.updatedAt)` key.
