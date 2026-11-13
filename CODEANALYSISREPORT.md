# Calendeers — Code Analysis and Hardening Report

**Introduction**

Calendeers is a Discord bot designed to help students manage their academic schedules through Canvas and Register.UW integration. This report evaluates the bot's code quality, maintainability, complexity, architecture, and automated testing. The goal is to identify technical weaknesses, document existing limitations, and recommend improvements that make Calendeers more reliable and easier to maintain.

---

## 1. Technical Debt and Code Smells

**File analyzed:** `src/events/interactionCreate.js`

**Finding 1: Large Event Handler**
The `execute()` function handles multiple Discord commands, select menu interactions, and modal submissions. This makes the function harder to read, maintain, and test as new features are added.

**Recommendation:** Split command handlers into smaller functions or separate modules, each responsible for one feature.

**Finding 2: Duplicated Code**
The `/schedule` and `/upcoming-assignments` commands contain similar code for retrieving and formatting calendar events, including dates, titles, and locations. Maintaining duplicate logic can lead to inconsistent behavior.

**Recommendation:** Extract shared calendar-event formatting into a reusable helper function.

**Finding 3: Multiple Responsibilities**
The interaction handler manages Discord responses, input validation, calendar data retrieval, schedule storage, and error handling in one file. This increases maintenance effort and makes independent testing more difficult.

**Recommendation:** Keep interaction handling separate from business logic and use dedicated services or helper functions.

**Summary:** These are maintainability concerns rather than confirmed runtime bugs. Refactoring would improve readability, testability, and future feature development.


## 2. Cyclomatic Complexity

**File analyzed:** `src/events/interactionCreate.js`

**Method:** I manually analyzed the `execute()` function by counting decision points, including if statements, catch clauses, logical operators, ternary expressions, nullish coalescing, and optional chaining. Branches inside nested callback functions were counted separately.

**Result:** The estimated cyclomatic complexity of `execute()` is 37 under these counting rules.

**Finding:** The function handles several Discord commands, select menu interactions, and modal submissions. The numerous conditional branches increase its complexity and make testing and maintenance more difficult.

**Recommendation:** Refactor `execute()` into smaller command handlers. This would reduce the complexity of individual functions and make unit testing easier.

**Conclusion:** The current event handler has high structural complexity and would benefit from refactoring.


## 3. Cohesion and Coupling

**File analyzed:** `src/events/interactionCreate.js`

**Method:** I examined the responsibilities of the event handler and counted its direct dependencies on service modules.

**Coupling Analysis:**
The file imports functions from three service modules:
- `calendarStore`: 9 imported functions
- `canvasFeed`: 3 imported functions
- `classSchedule`: 4 imported functions

In total, the event handler imports 16 functions from 3 internal service modules.

This creates multiple direct dependencies. Changes to service interfaces may require updates to the event handler.

**Cohesion Analysis:**
The `execute()` function handles seven slash commands, a select menu interaction, and a modal submission. These operations involve calendar management, assignment tracking, class schedules, and Discord responses.

Although these features are related to the bot, combining them into one large function reduces functional cohesion and makes independent testing more difficult.

**Recommendation:**
Separate the interaction handler into smaller command-specific modules. Keep calendar storage, Canvas integration, and class schedule processing in dedicated services.

**Conclusion:**
The current design has several direct service dependencies and mixes multiple responsibilities within one event handler. Refactoring could improve cohesion, reduce unnecessary coupling, and simplify maintenance.

**Measurement Note:** Dependency counts are based on static imports. Cohesion was assessed qualitatively rather than using a numerical cohesion metric.

## 4. Test Coverage Analysis

**Objective:** Measure and improve test coverage across the Calendeers codebase, with focus on critical calendar and schedule-processing functionality.

**Methodology:**
- **Testing Framework:** Mocha with Chai assertions for unit testing
- **Coverage Tool:** c8, which uses V8's native code coverage capabilities and generates Istanbul-compatible reports
- **Scope:** All 11 JavaScript source files under `src/`
- **Key Issue Addressed:** Resolved ES module import compatibility issues and configured c8 to collect accurate coverage data
- **Baseline:** 8 existing unit tests in `tests/missingAssignments.spec.js`
- **Improvement:** Added 27 new comprehensive unit tests targeting core service functions

**Coverage Results:**

| Metric | Before (8 Tests) | After (35 Tests) | Improvement |
|--------|------------------|------------------|-------------|
| **Statement Coverage** | 19.60% | 27.82% | +8.22 pp |
| **Branch Coverage** | 79.31% | 85.98% | +6.67 pp |
| **Function Coverage** | 11.62% | 20.93% | +9.31 pp |
| **Line Coverage** | 19.60% | 27.82% | +8.22 pp |
| **Passing Tests** | 8 | 35 | +27 tests |

**File-Level Improvements:**
- **`canvasFeed.js`:** 35.81% → 45.11% (+9.30 pp, +26% relative)
- **`classSchedule.js`:** 16.29% → 60.67% (+44.38 pp, +272% relative) — significant improvement through comprehensive schedule parsing tests
- **`calendarStore.js`:** 27.27% → 27.27% — no new tests added for this module

**Coverage Gaps & Untested Modules:**
- **Discord Event Handlers** (`guildMemberAdd.js`, `messageCreate.js`, `ready.js`): 0% coverage — could be tested using mocked Discord.js interactions
- **Bot Initialization** (`app.js`): 0% coverage — requires bot startup and configuration context
- **Helper Modules** (`index.js`, `loadEvents.js`, `loadFiles.js`): 0% coverage — require event loader and context setup

These gaps highlight opportunities for further testing. Discord event handlers and helper modules could be tested using mocks, while integration tests would help verify bot initialization and interactions between components.

**Key Findings — Test Coverage:**
- ES module import resolution was blocking coverage measurement entirely
- The original tests did not directly exercise `parseClassSchedule()`
- Statement coverage across the entire codebase improved by approximately 42% relative to baseline, while service-layer coverage increased from 27.04% to 45.90%
- Reported branch coverage reached 85.98%, although significant portions of the codebase remain untested

## 5. Unit Testing

**Objective:** Implement comprehensive unit tests for untested or undertested functionality.

**Implementation:** 27 unit tests added to `tests/validationSchedule.spec.js`

**validateFeedURL() — 12 Tests:**
- Valid Canvas calendar URLs (webcal:// and https:// protocols)
- Whitespace trimming and normalization
- Rejection of invalid hostnames and wrong domains
- Rejection of invalid protocols and non-HTTPS schemes
- Port number validation
- Credential/authentication rejection
- Query parameter validation
- URL fragment rejection
- Invalid URL path formats
- User ID validation
- Missing `.ics` extension detection
- Case-insensitive protocol handling

**parseClassSchedule() — 15 Tests:**
- Valid Register.UW `.ics` schedule file parsing
- Multi-course schedule extraction
- Course name parsing
- Recurring event meeting day extraction (RRULE BYDAY)
- Meeting time calculations with UTC-to-America/Los_Angeles timezone conversion
- Meeting location extraction
- Duplicate meeting detection and rejection
- Invalid `.ics` format rejection
- Plain text (non-calendar) rejection
- Error handling when no meetings found
- All-day event filtering (VALUE=DATE)
- Courses with no meetings handling
- Chronological ordering by day and start time
- Whitespace normalization in course names
- Invalid input type validation

**Test Results:**
- **All 35 tests passing** (61ms execution time)
- **0 failures, 0 regressions** — all original 8 tests remain passing
- No application functionality modified
- Synthetic test data used (no real Canvas tokens or personal information)

**Impact on Reliability:**
- The new tests help detect regressions in Canvas URL validation and class schedule parsing, including malformed inputs, recurring events, and edge cases
- Timezone conversion logic is now verified against expected UTC→Pacific time calculations
- Security-relevant URL validation is explicitly tested with adversarial inputs
- Automated test execution helps catch potential issues when code changes occur

**Key Findings — Unit Testing:**

Overall, the 27 new unit tests improve confidence in Calendeers' Canvas URL validation and class schedule parsing. They also help detect potential regressions involving malformed input, recurring events, and timezone conversions. However, additional tests are needed for Discord interactions, calendar storage, and external API failures.

**Testing Gaps & Future Recommendations:**
- Event handlers require Discord.js mock infrastructure (beyond current scope)
- Integration testing would verify end-to-end calendar workflows
- Fuzzing could reveal additional edge cases in calendar parsing
- Mock-based tests for `calendarStore.js` file operations would improve storage-layer coverage
- Mock-based tests for API calls in `canvasFeed.js` would reach currently uncovered network paths

---

