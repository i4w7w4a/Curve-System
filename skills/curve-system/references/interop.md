# Interoperability guide

Read the actual target API for the selected version. The current repository implements JavaScript evaluation and limited CSS export. Other rows below are design guidance, not installed adapters.

| Target | Representation to investigate | Main risk |
|---|---|---|
| CSS | Exact `cubic-bezier`/`steps`; approximated `linear()` for complex curves | Boundary/fill semantics and property clamping |
| Web Animations | Keyframes and easing per interval | Offset normalization, direction, fill and interpolation type |
| After Effects | Expressions or temporal keyframe velocity/influence | Mixing value graph, speed graph and spatial handles |
| Blender | F-Curve keyframes, handle coordinates, modifiers or samples | Auto handles changing intended shape; frame/time conversion |
| GLSL | Analytic code or LUT plus sampling rule | Float precision, texture filtering and missed discontinuities |
| FFmpeg | Expressions supported by the exact filter/version | Progress direction, syntax limitations, modified vs stock FFmpeg |
| Audio | Gain envelope or parameter scheduling | Amplitude/dB confusion, correlation, clicks at joins |
| Robotics | Boundary states and physical limits | Confusing visual ease with a constrained trajectory solution |

## Fidelity levels

- **Exact within a declared domain:** equivalent formula and boundary semantics, subject to floating-point arithmetic.
- **Approximate:** samples, simplified paths or fitted curves; report error metric and measured bound where available.
- **Baked:** rendered frames/audio rather than recoverable editable curve semantics.

SVG is usually an image or a geometric path, not a universal timing interchange. A path may contain vertical segments, loops or multiple y-values per x. Do not import it as a single-valued time function without validating the time coordinate.

## Minimal export record

Keep id, all non-default or fully expanded parameters, evaluator version/commit, time domain, duration, units, output/clamp policy, target representation and provenance. For sampled output also keep sample locations, interpolation rule, error metric, tolerance and observed error. State which fields are actual current output and which belong to a future extended format.

Do not copy a library's source on the assumption that similar equations imply identical licensing. Consult the checked snapshots in the repository's `research/resources.md` and recheck terms when importing a new revision.
