# Selection guide

Use constraints first, visual character second. These are project heuristics, not universal results of perceptual research.

| Intent | Candidates | Why / boundary |
|---|---|---|
| Calm bounded start-stop | `smootherstep`, `septic` | Zero endpoint velocity/acceleration; septic also has zero endpoint jerk |
| Simple soft transition | `smoothstep`, `sine-in-out` | Lower continuity at joins to holds than smootherstep |
| Immediate response then braking | `cubic-out`, `quint-out`, adjustable `cubic-bezier` | Nonzero initial slope can be intentional; reject if rest-to-rest is required |
| Anticipation | `back-in` | Negative output is part of the model |
| One brief excursion at arrival | `back-out` | Endpoint normalization does not imply zero final acceleration |
| Repeated artistic oscillation | `elastic-out` | A damped cosine shape, not the repository's physical step response |
| Physical settling in a fixed observation window | `spring-response` | May not reach exactly 1 at the window end |
| Spring-like fixed-end transition | `spring-ease` | Endpoint scaling modifies physical response; final velocity may remain nonzero |
| Discrete states | `steps-start`, `steps-end` | Choose jump side and number of intervals explicitly |
| Follow a changing target | Stateful spring/damper | Not implemented by the current finite easing API |
| Enforce p/v/a/j bounds | Trajectory planner | Smoothstep alone is insufficient |
| Audio crossfade | Gain functions with correlation assumptions | Equal-power, equal-gain and perceived loudness are different requirements |

## Concrete response pattern

1. State the interpreted quantity, duration, bounds and continuity requirement.
2. Name the chosen curve and a useful alternative, with exact ids and parameters.
3. Give endpoint properties and explain any overshoot or finite-horizon behavior.
4. Show evaluation/export using the repository's implementation or clearly identify a mathematical example.
5. Give the fidelity and editability limits in the destination.

Example task: opacity 0→1, 800ms, no overshoot, zero velocity and acceleration at both ends. `smootherstep` satisfies those constraints on this interval and when joined to holds through second derivative. `septic` also zeros endpoint jerk but has a different velocity profile. Do not recommend an oscillating curve, a logistic merely because it looks like an S, or a curve selected only by a familiar name.

For the same task in CSS, smootherstep has degree five and cannot generally be represented exactly by a single time-linear cubic polynomial. The current `toCSS('smootherstep')` returns `null`. Use JS, a verified approximation or another explicitly relaxed requirement. `smoothstep` has an exact supported cubic Bézier export, but it does not satisfy zero endpoint acceleration.

## Checks that change the decision

- A UI property may clip overshoot even though the mathematical function preserves it.
- The same curve played twice as fast has twice the velocity, four times the acceleration and eight times the jerk for a fixed displacement.
- A long camera path can have high spatial acceleration even when the scalar easing looks calm.
- A stateful target change is not a new isolated segment unless the user accepts resets of derivative state.
- A flat value graph means no change; a flat nonzero speed graph means uniform change.
- A narrow feature missed by uniform sampling remains a feature; do not infer a proof of monotonicity from a small thumbnail.
