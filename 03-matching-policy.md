# Matching Policy (High-Level)

## Objective

Provide a practical and explainable match score between CV and JD to help HR prioritize faster.

## Policy Structure

- Mandatory criteria group
- Preferred criteria group
- Additional signal group

For MVP, policy has two score components:
- `skill_score` from matched skill requirements
- `constraint_score` from hard constraints (education, minimum years, etc.)

Final score is blended (example):
- `final_score = 0.85 * skill_score + 0.15 * constraint_score`

Hard constraints do not auto-drop the candidate.
If constraints fail, candidate is still ranked but flagged for HR review.

Weight configuration is fixed to 5 levels (not free-form numbers):
- `very_low`, `low`, `medium`, `high`, `critical`

## Output

For each application, the system provides:
- Overall match score
- Match tier (for example: high, medium, low)
- Short reason summary
- Constraint-failed flag for HR decision support

## Human Control

- HR remains the final decision maker.
- The system supports prioritization, not auto-hiring decisions.
- HR can adjust policy behavior at business level.
