# Источники, готовые проекты и визуальные инструменты

**Проверено: 24 ноября 2026 года.** Это карта для практического переиспользования: математические функции, редакторы, системы анимации и отраслевые адаптеры. Ссылки ведут к первоисточникам. Два исследования: [Curve Atlas](01-curve-atlas.md) и [Curve Engine & Agent Skill](02-engine-and-agent.md).

## Как читать каталог

- **Функция** вычисляет значение по времени. Она не обязана запускать анимационный цикл.
- **Редактор** позволяет менять кривую; собственный формат редактора может отличаться от формата исполнения.
- **Движок** управляет временем, состоянием, прерыванием, повторением и свойствами объекта.
- **Адаптер** переводит кривую в возможности конкретной среды, иногда с потерей точности или редактируемости.

Таблицы показывают пригодные компоненты, а не установленный стек Curve System. Наличие ссылки не означает включение стороннего кода в репозиторий. Лицензии прочитаны в указанных файлах; для Bevy приведена декларация из манифеста. Снимки исходных веток закреплены в таблице проверки ниже. График коммитов и количество звёзд не доказывают точность формул, качество поддержки или совместимость.

## 1. Математические функции и готовые пресеты

| ID | Проект | Что полезно забрать или изучить | Лицензия и точка входа | Ограничения |
|---|---|---|---|---|
| R01 | [ai/easings.net](https://github.com/ai/easings.net) · [визуальный атлас](https://easings.net/ru) | Карточки классических семейств, сравнение in/out/in-out, связь формулы с движением | [GPLv3](https://github.com/ai/easings.net/blob/d2563f0d32a511b5556774b838ec35c3a841b15d/LICENSE) | Хороший справочник и возможная база GPL-форка; лицензия сайта не превращается в MIT при копировании интерфейса. Не охватывает все физические модели и сплайны |
| R02 | [gre/bezier-easing](https://github.com/gre/bezier-easing) | Компактное вычисление CSS-подобной кубической Bézier; инверсия координаты времени | [MIT](https://github.com/gre/bezier-easing/blob/d244075da37f33d8ca363ccf03b043916ec0cad5/LICENSE) · [src/index.js](https://github.com/gre/bezier-easing/blob/d244075da37f33d8ca363ccf03b043916ec0cad5/src/index.js) | Только кубическая timing curve. На проверенном commit используется алгебраический решатель; старые описания Newton/bisection не описывают этот исходник |
| R03 | [d3/d3-ease](https://github.com/d3/d3-ease) · [API](https://d3js.org/d3-ease) | Семейства ease; настройка степени, overshoot, амплитуды и периода | [BSD-3-Clause](https://github.com/d3/d3-ease/blob/4a37057588130cd791ebaaaf079f1a8f9be2b88e/LICENSE) · [экспорты](https://github.com/d3/d3-ease/blob/4a37057588130cd791ebaaaf079f1a8f9be2b88e/src/index.js) | Функции времени, а не редактор или полноценный анимационный движок; ограниченность диапазона зависит от семейства |
| R04 | [d3/d3-interpolate](https://github.com/d3/d3-interpolate) · [API](https://d3js.org/d3-interpolate) | Интерполяция чисел, цветов, строк, массивов, объектов | [ISC](https://github.com/d3/d3-interpolate/blob/2f4cba6cdfe1e5fb4831fe3dc8939adf898d8556/LICENSE) | Решает другую задачу, чем easing. Выбор цветового пространства и типа значения остаётся частью приложения |
| R05 | [tweenjs/tween.js](https://github.com/tweenjs/tween.js) · [примеры](https://tweenjs.github.io/tween.js/examples/) | Easing и управление tween; полезно сравнивать повторение, группы и обновление времени | [MIT](https://github.com/tweenjs/tween.js/blob/09f2a635d7021d4f0c6be50a182ebc5be79ee2ba/LICENSE) · [src/Easing.ts](https://github.com/tweenjs/tween.js/blob/09f2a635d7021d4f0c6be50a182ebc5be79ee2ba/src/Easing.ts) | Из библиотеки можно брать функции отдельно; весь движок нужен лишь для управления переходами |
| R06 | [argyleink/open-props](https://github.com/argyleink/open-props) · [демо](https://open-props.style/#easing) | Готовые CSS-токены easing, anticipation, spring; практическая организация пресетов | [MIT](https://github.com/argyleink/open-props/blob/f39ab7c377a0e047f930982e3611bbc95254a260/LICENSE) · [props.easing.js](https://github.com/argyleink/open-props/blob/f39ab7c377a0e047f930982e3611bbc95254a260/src/props.easing.js) | Название токена описывает дизайнерский характер. Оно не гарантирует физическую эквивалентность одноимённой модели |
| R07 | [warrenm/AHEasing](https://github.com/warrenm/AHEasing) | Небольшая библиотека C для C/C++/Objective-C; самостоятельные функции | [Unlicense](https://github.com/warrenm/AHEasing/blob/82d85f7183e207bf4405d427a723a8a85406ddf4/UNLICENSE) · [easing.c](https://github.com/warrenm/AHEasing/blob/82d85f7183e207bf4405d427a723a8a85406ddf4/AHEasing/easing.c) | Нативные playground-приложения ориентированы на Apple; сам C-код переносим. Старые версии имели другую лицензию |
| R08 | [glslify/glsl-easings](https://github.com/glslify/glsl-easings) · [визуальные примеры](https://glslify.github.io/glsl-easings/) | Отдельные GLSL-файлы для каждого easing; пример модульной организации шейдеров | [MIT](https://github.com/glslify/glsl-easings/blob/e3c39929ef207dc1bfe465711eb0aaf087672a38/LICENSE.md) | Не обеспечивает совпадение CPU/GPU с заданной погрешностью автоматически; glslify-директивы требуют обработки или адаптации |
| R09 | [scipy/scipy](https://github.com/scipy/scipy) · [PCHIP](https://docs.scipy.org/doc/scipy/reference/generated/scipy.interpolate.PchipInterpolator.html) | Эталонные средства интерполяции, производных, интегралов, корней; анализ и сравнение сплайнов | [BSD-3-Clause; см. также notices](https://github.com/scipy/scipy/blob/2dd345a7824adb2af902d939a7ba9385c4de4351/LICENSE.txt) | Большой научный Python-пакет, не маленький браузерный runtime. PCHIP сохраняет монотонность исходных данных, но обычно только C¹ на узлах |

## 2. Визуальные редакторы и конвертеры

| ID | Проект | Что видно и настраивается | Лицензия | Что проверить перед форком |
|---|---|---|---|---|
| R10 | [LeaVerou/cubic-bezier](https://github.com/LeaVerou/cubic-bezier) · [cubic-bezier.com](https://cubic-bezier.com/) | Два управляющих узла, предварительный просмотр и сравнение CSS timing curves | [MIT](https://github.com/LeaVerou/cubic-bezier/blob/a95f0a4674ef56eb760e0413276dc13d9a70f2fa/LICENSE) | Узкий и понятный редактор одного сегмента; нет общего каталога физических кривых и научного анализа |
| R11 | [gre/bezier-easing-editor](https://github.com/gre/bezier-easing-editor) · [демо](https://gre.github.io/bezier-easing-editor/) | React/SVG-компонент с управляемым значением, onChange и индикатором progress | [MIT](https://github.com/gre/bezier-easing-editor/blob/298b490335534f07cd3f6806380fee2222f8132e/LICENSE) | Подходит как компонент внутри своего приложения. Текущий README требует React 17+; проверить зависимости выбранной версии |
| R12 | [mojs/mojs-curve-editor](https://github.com/mojs/mojs-curve-editor) | Редактор составных easing/property curves, SVG path, undo/redo, получение easing | [MIT](https://github.com/mojs/mojs-curve-editor/blob/3f1b8a2b3b617c8375c29af4534a7317cb1d6e25/LICENSE.md) | Последний найденный commit — 2023 год; старую сборку и зависимость от mo.js нужно отдельно воспроизвести |
| R13 | [chenz24/easing.tools](https://github.com/chenz24/easing.tools) · [демо](https://easing.tools/) | Bézier и spring, численные параметры, несколько сцен движения, экспорт | [MIT](https://github.com/chenz24/easing.tools/blob/9dd5e2014ce3a85efc59f22784ce57ac6e3516b6/LICENSE) | Готовый прототип для изучения UX. Пресеты с названиями Material/Apple требуют сверки с официальными дизайн-системами; root LICENSE не заменяет проверку происхождения данных |
| R14 | [jakearchibald/linear-easing-generator](https://github.com/jakearchibald/linear-easing-generator) · [демо](https://linear-easing-generator.netlify.app/) | Перевод JavaScript/SVG easing в CSS linear(), упрощение и округление точек | [Apache-2.0](https://github.com/jakearchibald/linear-easing-generator/blob/17e22b88db2a94e6a798610ce406a04c7f9b8d27/LICENSE) | Результат — кусочно-линейная аппроксимация. Нужно измерять погрешность после упрощения и округления |
| R15 | [okikio/spring-easing](https://github.com/okikio/spring-easing) · [документация](https://spring-easing.okikio.dev/) | Генерация массивов кадров и CSS-представления spring; примеры с разными анимационными API | [MIT в корне](https://github.com/okikio/spring-easing/blob/707097383d5dc063092bdb3eef4a237e06640eeb/LICENSE); [отдельное Apache-2.0 происхождение CSS helpers](https://github.com/okikio/spring-easing/blob/707097383d5dc063092bdb3eef4a237e06640eeb/README.md) | README отдельно относит CSSSpringEasing/getOptimizedPoints/getLinearSyntax к Apache-2.0. Не помечать всё содержимое как «только MIT» |

## 3. Исполнение анимации и отраслевые системы

| ID | Проект | Сильная сторона для Curve System | Лицензия | Граница применимости |
|---|---|---|---|---|
| R16 | [motiondivision/motion](https://github.com/motiondivision/motion) · [animate](https://motion.dev/docs/animate) | Tween, физические и duration-based springs, изменение цели, web/React-проекты | [MIT ядра](https://github.com/motiondivision/motion/blob/133051adce0f0b0bfb661f9f517dc2250ba3a288/LICENSE.md) | Motion+ и коммерческие материалы не входят автоматически в MIT-лицензию ядра. Параметры разных режимов spring не взаимозаменяемы |
| R17 | [pmndrs/react-spring](https://github.com/pmndrs/react-spring) · [Config Visualizer](https://www.react-spring.dev/docs/advanced/config) | Пружины и непрерывные взаимодействия в React; конфигурация mass/tension/friction | [MIT](https://github.com/pmndrs/react-spring/blob/13aacc5a88af35061da375c0259629f1a16a3caa/LICENSE) | Фреймворкозависимый слой. Precision, restVelocity и clamp влияют на завершение; это больше, чем одна функция f(t) |
| R18 | [juliangarnier/anime](https://github.com/juliangarnier/anime) · [easings](https://animejs.com/documentation/easings/) | Easing, cubicBezier, spring и их визуальный редактор; изолированный импорт animejs/easings | [MIT](https://github.com/juliangarnier/anime/blob/01b81be1df6843ccfe0a71c0699a746bf740dd77/LICENSE.md) | Подключать подмодуль или адаптер, если полный движок не нужен. Не смешивать API разных major-версий |
| R19 | [greensock/GSAP](https://github.com/greensock/GSAP) · [CustomEase](https://gsap.com/docs/v3/Eases/CustomEase/) | Многосегментные кривые, SVG path import/export, развитый timeline и визуализатор | [Standard no-charge license, не MIT](https://github.com/greensock/GSAP/blob/5e6c35ff8eedea12d4f229129def635277d8b0f2/package.json) · [текст условий](https://gsap.com/standard-license/) | Самостоятельные условия использования. Полный текст страницы лицензии был закрыт проверкой доступа; перед включением кода нужно прочитать актуальные условия, не выводить их из слова free |
| R20 | [pantor/ruckig](https://github.com/pantor/ruckig) · [документация](https://docs.ruckig.com/) | Генерация траекторий по текущим/целевым p,v,a и пределам скорости, ускорения, jerk | [MIT Community](https://github.com/pantor/ruckig/blob/91085469d2133089c285e2f34541255815390e2c/LICENSE) | State-to-state и intermediate waypoints имеют разные условия. Community с промежуточными точками использует облачный API; полностью локальный waypoint-режим относится к Pro |
| R21 | [scriptituk/xfade-easing](https://github.com/scriptituk/xfade-easing) | Easing для FFmpeg xfade, готовые выражения, CLI, адаптации GLSL-переходов | [MIT в корне](https://github.com/scriptituk/xfade-easing/blob/102dec017d455e20072281f75b202bd3a7b3d694/LICENSE) · [варианты и ограничения](https://github.com/scriptituk/xfade-easing/blob/102dec017d455e20072281f75b202bd3a7b3d694/README.md) | Есть вариант с изменённой сборкой FFmpeg и вариант custom expressions. Их возможности и производительность различаются; сохранять исходные notices FFmpeg и перенесённых переходов |
| R22 | [vleue/bevy_easings](https://github.com/vleue/bevy_easings) · [API](https://docs.rs/bevy_easings/) | Пример интеграции easing с ECS, типами компонентов и Rust | [MIT OR Apache-2.0 в Cargo.toml](https://github.com/vleue/bevy_easings/blob/436a1736f3bb0fea55c6a0f6725dd5a4ed0765c8/Cargo.toml) | Версия привязана к версии Bevy; файл текста лицензии в просмотренном корне не найден. Перед переносом исходников уточнить комплект лицензий и notices |

## 4. Зафиксированные состояния репозиториев

Дата в правом столбце — **дата последнего commit в просмотренной default branch, UTC**, полученная через GitHub API 24.11.2026. Это не дата релиза и не обещание поддержки. Частые изменения документации/зависимостей не равны развитию алгоритма; старый компактный математический модуль может оставаться полезным.

| Репозиторий | Проверенный commit | Дата commit, UTC |
|---|---|---|
| ai/easings.net | [d2563f0d3](https://github.com/ai/easings.net/commit/d2563f0d32a511b5556774b838ec35c3a841b15d) | 2026-04-07 |
| gre/bezier-easing | [d244075da](https://github.com/gre/bezier-easing/commit/d244075da37f33d8ca363ccf03b043916ec0cad5) | 2026-11-15 |
| d3/d3-ease | [4a3705758](https://github.com/d3/d3-ease/commit/4a37057588130cd791ebaaaf079f1a8f9be2b88e) | 2026-11-03 |
| d3/d3-interpolate | [2f4cba6cd](https://github.com/d3/d3-interpolate/commit/2f4cba6cdfe1e5fb4831fe3dc8939adf898d8556) | 2026-11-03 |
| tweenjs/tween.js | [09f2a635d](https://github.com/tweenjs/tween.js/commit/09f2a635d7021d4f0c6be50a182ebc5be79ee2ba) | 2026-11-17 |
| motiondivision/motion | [133051adc](https://github.com/motiondivision/motion/commit/133051adce0f0b0bfb661f9f517dc2250ba3a288) | 2026-11-23 |
| pmndrs/react-spring | [13aacc5a8](https://github.com/pmndrs/react-spring/commit/13aacc5a88af35061da375c0259629f1a16a3caa) | 2026-11-23 |
| juliangarnier/anime | [01b81be1d](https://github.com/juliangarnier/anime/commit/01b81be1df6843ccfe0a71c0699a746bf740dd77) | 2026-08-09 |
| greensock/GSAP | [5e6c35ff8](https://github.com/greensock/GSAP/commit/5e6c35ff8eedea12d4f229129def635277d8b0f2) | 2026-11-04 |
| LeaVerou/cubic-bezier | [a95f0a467](https://github.com/LeaVerou/cubic-bezier/commit/a95f0a4674ef56eb760e0413276dc13d9a70f2fa) | 2024-07-15 |
| gre/bezier-easing-editor | [298b49033](https://github.com/gre/bezier-easing-editor/commit/298b490335534f07cd3f6806380fee2222f8132e) | 2026-06-10 |
| mojs/mojs-curve-editor | [3f1b8a2b3](https://github.com/mojs/mojs-curve-editor/commit/3f1b8a2b3b617c8375c29af4534a7317cb1d6e25) | 2023-03-30 |
| chenz24/easing.tools | [9dd5e2014](https://github.com/chenz24/easing.tools/commit/9dd5e2014ce3a85efc59f22784ce57ac6e3516b6) | 2026-04-07 |
| jakearchibald/linear-easing-generator | [17e22b88d](https://github.com/jakearchibald/linear-easing-generator/commit/17e22b88db2a94e6a798610ce406a04c7f9b8d27) | 2024-08-23 |
| okikio/spring-easing | [707097383](https://github.com/okikio/spring-easing/commit/707097383d5dc063092bdb3eef4a237e06640eeb) | 2023-08-25 |
| glslify/glsl-easings | [e3c39929e](https://github.com/glslify/glsl-easings/commit/e3c39929ef207dc1bfe465711eb0aaf087672a38) | 2020-07-18 |
| warrenm/AHEasing | [82d85f718](https://github.com/warrenm/AHEasing/commit/82d85f7183e207bf4405d427a723a8a85406ddf4) | 2022-11-30 |
| pantor/ruckig | [91085469d](https://github.com/pantor/ruckig/commit/91085469d2133089c285e2f34541255815390e2c) | 2026-11-13 |
| scriptituk/xfade-easing | [102dec017](https://github.com/scriptituk/xfade-easing/commit/102dec017d455e20072281f75b202bd3a7b3d694) | 2026-09-09 |
| scipy/scipy | [2dd345a78](https://github.com/scipy/scipy/commit/2dd345a7824adb2af902d939a7ba9385c4de4351) | 2026-11-22 |
| vleue/bevy_easings | [436a1736f](https://github.com/vleue/bevy_easings/commit/436a1736f3bb0fea55c6a0f6725dd5a4ed0765c8) | 2026-10-27 |
| argyleink/open-props | [f39ab7c37](https://github.com/argyleink/open-props/commit/f39ab7c377a0e047f930982e3611bbc95254a260) | 2026-10-11 |

## 5. Первоисточники по средам и форматам

| Источник | Что брать в спецификацию Curve System |
|---|---|
| [Robert Penner: Easing Functions](https://robertpenner.com/easing/) | История классического семейства, авторские ссылки на реализации и исходное лицензирование; условия конкретного порта проверять отдельно |
| [W3C CSS Easing Functions Level 2](https://www.w3.org/TR/css-easing-2/) | Определение input/output progress, cubic-bezier(), steps(), linear(), поведение на границах; это рабочий проект стандарта, а не свидетельство поддержки каждым браузером |
| [Chrome: CSS linear()](https://developer.chrome.com/docs/css-ui/css-linear-easing-function) | Практическое описание экспорта сложной формы в набор точек и визуальный генератор |
| [Adobe: Keyframe interpolation](https://helpx.adobe.com/after-effects/desktop/animate-in-after-effects/animation-keyframes/keyframe-interpolation.html) | Различие временной и пространственной интерполяции; не смешивать motion path и timing curve |
| [Adobe: Speed](https://helpx.adobe.com/after-effects/desktop/animate-in-after-effects/speed-between-keyframes/speed.html) | Speed graph, входящая/исходящая скорость и influence; не считать координаты CSS Bézier прямым эквивалентом полей AE |
| [Blender Python: FCurve](https://docs.blender.org/api/current/bpy.types.FCurve.html) | evaluate(frame), keyframe_points, modifiers, samples; документировать, что сохраняется редактируемым |
| [Godot: Tween](https://docs.godotengine.org/en/stable/classes/class_tween.html) | Отдельные TransitionType и EaseType, interpolate_value; сверять версию Godot |
| [Unity: Mathf.SmoothDamp](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Mathf.SmoothDamp.html) | Пример API, которому нужны текущее значение, скорость, target и deltaTime; не экспортировать как обычный статический ease |
| [FFmpeg: xfade](https://ffmpeg.org/ffmpeg-filters.html#xfade) | Контракт фильтра и ограничения совместимости входных потоков; пользовательское выражение и изменённая сборка — разные режимы |
| [W3C: prefers-reduced-motion](https://www.w3.org/TR/mediaqueries-5/#prefers-reduced-motion) | Политика уменьшения движения в интерактивных демо и конечном UI |
| [SciPy: PchipInterpolator](https://docs.scipy.org/doc/scipy/reference/generated/scipy.interpolate.PchipInterpolator.html) | Сохранение формы, непрерывность первой производной, возможные скачки второй; ссылка на Fritsch–Butland |
| [GitHub: Licensing a repository](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository) | Публичная видимость репозитория сама по себе не является разрешением на произвольное повторное использование |

## 6. Что открыть руками в первую очередь

Это быстрый маршрут для сравнения инструментов, а не заявление, что каждый редактор был протестирован во всех браузерах:

1. [easings.net/ru](https://easings.net/ru) — понять разницу семейств по форме и движению.
2. [cubic-bezier.com](https://cubic-bezier.com/) — руками изменить четыре координаты одного сегмента.
3. [gre Bézier Editor](https://gre.github.io/bezier-easing-editor/) — увидеть компонент, который можно встроить в собственный UI.
4. [easing.tools](https://easing.tools/) — сравнить обычные кривые со spring и несколькими типами анимации.
5. [Anime.js Easing Editor](https://animejs.com/easing-editor/) — посмотреть интегрированный язык параметров и предпросмотр.
6. [GSAP CustomEase](https://gsap.com/docs/v3/Eases/CustomEase/) — изучить редактирование составных кривых и SVG.
7. [linear() generator](https://linear-easing-generator.netlify.app/) — увидеть, как произвольная форма превращается в CSS.
8. [React Spring Config Visualizer](https://www.react-spring.dev/docs/advanced/config) — связать параметры пружины с характером движения.
9. [Open Props easing](https://open-props.style/#easing) — посмотреть, как кривые становятся согласованными токенами дизайн-системы.

Для каждого демо полезно повторить один сценарий: перемещение на 300 px за 0.8 s; затем заменить перемещение на opacity, scale и поворот. Так становится видно, где форма полезна, а где overshoot создаёт нежелательное изменение свойства.

## 7. Habr: русскоязычный вход и предметы для проверки

Эти материалы включены как объяснения и маршруты дальнейшего поиска. Формулы, форматы и ограничения исполнения в проекте опираются на первоисточники выше.

- [«Easing Functions — функции плавности для CSS-анимации и переходов»](https://habr.com/ru/companies/skillbox/articles/579044/) — доступный вход в CSS timing functions и визуальные инструменты.
- [«Разбираемся в анимациях и временных переходах в CSS»](https://habr.com/ru/companies/netologyru/articles/692466/) — практические приёмы редактирования переходов. Формулировку, будто все функции плавности основаны на кубической Bézier, нельзя переносить в общий атлас: существуют steps(), linear(), физические и другие модели.
- [Вопрос «Кривая Безье и скорость анимации…»](https://qna.habr.com/q/681603) — наглядный пример распространённого смешения геометрической траектории, прогресса и скорости. Ответы сообщества не заменяют спецификацию.

## 8. Авторы и аккаунты X

Прямое чтение X при проверке ограничивалось ответами 403 и неполной индексацией. Ниже — **каналы обнаружения новых примеров**, а не подтверждённая подборка последних постов. Актуальные заявления, даты, метрики и обещания авторов не восстановлены по пересказам.

| Автор / аккаунт | Проверяемая связанная работа | За чем следить |
|---|---|---|
| [Jake Archibald · @jaffathecake](https://x.com/jaffathecake) | [linear-easing-generator](https://github.com/jakearchibald/linear-easing-generator); [W3C обсуждение linear()](https://lists.w3.org/Archives/Public/public-webapps-github/2022Aug/0011.html) | Форматы веб-анимации, генераторы easing и аргументы за простые переносимые представления |
| [Jhey Tompkins · @jh3yy](https://x.com/jh3yy) | [Авторский сайт со ссылкой на X](https://www.jhey.dev/); [CodePen: GSAP → CSS linear()](https://codepen.io/jh3y/pen/yLGOaLG) | Живые демо, неожиданные способы применения CSS и динамические превью |
| [Adam Argyle · @argyleink](https://x.com/argyleink) | [Авторский GitHub](https://github.com/argyleink); [Open Props](https://open-props.style/); [nerdy.dev](https://nerdy.dev/) | Motion tokens, CSS, доступность и инструменты для дизайнера |

Полезный соседний маршрут — [Bram.us: Bringing Bounce and Elastic easing to CSS](https://www.bram.us/2021/12/04/bringing-bounce-and-elastic-easing-to-css/) и [авторская статья Bramus в Chrome Docs](https://developer.chrome.com/docs/css-ui/css-linear-easing-function). Старое обсуждение предложения 2021 года нужно читать как историю, а текущий синтаксис сверять со спецификацией.

## 9. Что осталось непроверенным

- Полный текст текущей GSAP Standard License не удалось извлечь из страницы с проверкой доступа; указание собственной лицензии подтверждено package.json. Не сделан вывод о совместимости всех возможных способов распространения.
- [Iñigo Quilez: Useful Functions](https://iquilezles.org/articles/functions/) — полезное направление по shaping functions, но страница была недоступна для чтения. Формулы и разрешение на копирование её фрагментов здесь не объявлены проверенными.
- Не проводилась установка всех 22 проектов, испытание их сборок, аудит безопасности зависимостей или сравнение производительности.
- Ссылка на Anime.js Easing Editor найдена в официальной документации, но сама страница вернула ошибку при автоматическом чтении; работа интерактивного интерфейса не подтверждена. Страницы Blender FCurve также не открылись напрямую, поэтому сведения об API сверены с индексированными страницами официальной документации.
- Не проверена точная эквивалентность сторонних пресетов с одноимёнными кривыми Curve System. Для этого нужны численные тесты на зафиксированных версиях.
- Для каждой будущей интеграции предстоит проверить экспорт и обратный импорт в реальном After Effects, Blender, Godot, Unity или FFmpeg. Доступность API не доказывает готовность адаптера.

## 10. Правила пополнения каталога

Добавлять источник, если он даёт новую формулу, новый способ управления, нужный формат экспорта, иной класс гарантий или воспроизводимое визуальное сравнение. Для каждой находки фиксировать URL, дату проверки, commit/version, лицензию конкретного файла, единицу переиспользования, ограничения и результаты запуска. Зеркала и пересказы не считать независимым подтверждением одного исходного проекта.

Обновлять запись при изменении её решения: другой алгоритм, лицензия, формат, зависимость или состояние доступности демо. Добавление ещё одного похожего сайта без такой разницы увеличивает каталог, но не увеличивает полезный выбор.
