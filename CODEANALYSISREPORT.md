Note: Basic file setup, we should make this report look proffesional with headings and things as we work on it)

1. Divide up the different perspectives on code analysis and code hardening into meaningful tasks for each group member. Your group does not need to do all tasks, but each person should choose two from the following:

    1. Examine your code for technical debt and code smells. [can be done by more than one person]
    2. Assess the cyclomatic complexity of the methods in your bot.
    3. Measure your cohesion and coupling (architecture diagrams might help with this!).
    4. Measure your test coverage.
    5. Build a threat model.
    6. Write a fuzzer to try to break functionality in your bot (see Fast-check for a short intro to running fast-check tests in Codespaces). [can be done by more than one person]
    7. Unit tests. Write at least 3, these are easy and quick. [can be done by more than one person]
    8. Smoke test. If you don't have one already, write a test that will call all the major functions in your bot and verify that core features are working.
    9. Implement continuous integration / continuous deployment for your bot.
    10. Your own idea about what the bot needs (propose a scope to Dr. Champion)

2. Describe your efforts and findings in a shared code analysis report in your repo.
3. Create user stories associated with your findings (at least 2 per person; you must write out the story yourself).

## Code Analysis - Joon

### Task 1: Technical Debt and Code Smells

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


### Task 2: Cyclomatic Complexity

**File analyzed:** `src/events/interactionCreate.js`

**Method:** I manually analyzed the `execute()` function by counting decision points, including if statements, catch clauses, logical operators, ternary expressions, nullish coalescing, and optional chaining. Branches inside nested callback functions were counted separately.

**Result:** The estimated cyclomatic complexity of `execute()` is 37 under these counting rules.

**Finding:** The function handles several Discord commands, select menu interactions, and modal submissions. The numerous conditional branches increase its complexity and make testing and maintenance more difficult.

**Recommendation:** Refactor `execute()` into smaller command handlers. This would reduce the complexity of individual functions and make unit testing easier.

**Conclusion:** The current event handler has high structural complexity and would benefit from refactoring.


### Task 3: Cohesion and Coupling

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

