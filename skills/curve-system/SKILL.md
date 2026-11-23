---
name: curve-system
description: "Select, explain, visualize, parameterize and transfer timing curves using the Curve System repository. Use for easing, animation curves, keyframe timing, camera transitions, overshoot, springs, envelopes, value/speed graphs, or choosing a curve from a motion brief. Distinguish finite easing from stateful following and constrained motion planning."
---

# Curve System

Use this repository's actual evaluator and metadata. Treat this file as a portable project skill; its presence in GitHub does not mean it is installed in the user's personal skill directory or that new tools are available.

## Locate the working version

Find the repository root containing `src/curves.mjs` and `catalog/curves.json`; when reading this file in its repository location, the root is `../..`. Read `README.md` for implemented status, `catalog/curves.json` for candidate data and `docs/usage.md` for API semantics. If the repository is unavailable, explain the limitation and use mathematical reasoning with explicit assumptions; do not claim to run its evaluator.

Read [selection-guide.md](references/selection-guide.md) for selection and [interop.md](references/interop.md) when exporting to another environment. Consult `research/resources.md` for verified external components and license scope.

## 1. Translate the request into constraints

Identify the animated quantity, start/end values, time units and duration, target environment, permitted output range, required endpoint velocity/acceleration, and whether the target can change during motion.

Proceed with sensible stated assumptions when details are low-impact. Ask only for missing information that materially changes the solution, such as whether overshoot is forbidden or whether the output must remain editable in a named editor. Do useful work before asking.

Distinguish:

- **Timing function:** normalized input progress → output progress.
- **Value interpolation:** progress → a number, color, vector, rotation or other typed value.
- **Path:** geometry of movement; constant parameter speed does not imply constant arc-length speed.
- **Envelope:** a time-dependent control signal, possibly with several stages.
- **Dynamics:** state plus target and elapsed time; required for interruption or continuous following.
- **Trajectory planning:** a problem with physical bounds and boundary conditions.

Do not repeatedly restart ease-in-out for a moving target and claim continuous velocity. Do not treat minimum jerk as an automatic bound on peak jerk.

## 2. Choose distinguishable candidates

Use `catalog/intent-rules.json` as a starting heuristic. Filter out candidates violating hard constraints before ranking visual character. Suggest two or three meaningfully different options when comparison helps; give one when the requirements determine it.

Prefer monotone bounded candidates for opacity and bounded controls. Choose smootherstep/septic when the specified hold joins require vanishing endpoint derivatives. Use back/elastic/spring only when excursion is permitted and explain the model. Preserve original curve IDs and parameter names.

Never infer formula equivalence from a common preset name. In this repository normalized expo/elastic and the symmetric back-in-out definition differ from some Penner ports. Compare formulas or sampled values before transferring a name to another library.

## 3. Verify the actual curve

Use `evaluate`, `derivatives`, `sample` and `breakpoints` from `src/curves.mjs` when available. The normalized time must be a finite number in `[0,1]`; unknown or out-of-range parameters are rejected. No implicit output clamp occurs.

Check endpoint values and one-sided derivatives, extrema/overshoot, monotonicity when required, and singularities or discontinuities. `null` means an unavailable/undefined finite derivative under the evaluator contract, never zero. Include event locations in any graphical or export sampling.

For physical duration `T` and change `Δq`, scale derivatives by `Δq/T`, `Δq/T²`, `Δq/T³`. Distinguish signed scalar velocity from spatial speed. A smooth formula on `[0,1]` may form a nonsmooth join with a hold outside it.

For cubic Bézier invert `Bx(u)=t` before evaluating `By(u)`. Do not use `By(t)` or silently equate time handles with AE influence. For a physical spring inspect the end of the chosen horizon; do not declare it settled because the timeline ends. Explain endpoint normalization if used.

## 4. Show what the user can assess

Reuse the matching SVG card from `assets/curves/` and derivative image where useful. Generate new mathematical plots only when the user requests them or the active task already authorizes creating such visuals. Do not generate or edit an unrelated supplied image in response to an analysis-only request.

Use the same time, distance and object when comparing motion. Label the horizontal and vertical axes; separate value, velocity, acceleration and jerk. Show overshoot and discontinuities instead of visually hiding them. Start motion only after a user action; respect reduced-motion preferences in shipped UI.

## 5. Export with an explicit fidelity contract

Return the stable id, parameters, evaluator version/commit, duration and unit assumptions. For JSON use the implemented `curve-system/selection@0.1` format; identify it as a curve selection rather than a complete timeline project.

Use `toCSS` only when it returns a string. If it returns `null`, explain that a different representation or approximation is required. Do not invent a supposedly exact cubic Bézier for a bouncing or oscillating curve.

When exporting samples/keys/LUT, state representation, interpolation rule, endpoint policy and the measured or unmeasured approximation error. Do not call a dense sample list exact without a proof. Explain what remains editable and what is baked.

Read the target's primary API documentation when version-specific behavior matters. Before copying third-party implementation, inspect the relevant LICENSE and notices at the chosen revision. Do not assume all curve sites or free animation products use MIT.

## 6. Verify changes and report

When changing the repository, run the tests relevant to the changed behavior, regenerate affected assets, and run `npm run check`. Use `node scripts/render-atlas.mjs --check` to detect stale generated artifacts. Keep formulas, metadata, diagrams and docs consistent.

Report the chosen model and why it satisfies the constraints, parameter values, how to apply it, what was actually checked and any material limitation. Distinguish implemented code from proposals and illustrative snippets. Do not claim an external research task has finished unless its output has been received.
