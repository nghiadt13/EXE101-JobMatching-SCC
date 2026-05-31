# Matching Policy (High-Level)

## Objective

Provide a practical and explainable match score between CV and JD to help HR prioritize faster.

## Policy Structure

- Mandatory criteria group
- Preferred criteria group
- Additional signal group

For V2 pipeline, policy has four score components:
- `skill_score` from matched skill requirements (weighted by importance)
- `constraint_score` from hard constraints (education, location, etc.)
- `experience_bonus` from relevant experience vs minimum required months
- `project_bonus` from AI-assessed project relevance

Final score is blended deterministically:
- `final_score = 0.70 * skill_score + 0.10 * constraint_score + 0.10 * experience_bonus + 0.10 * project_bonus`

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
