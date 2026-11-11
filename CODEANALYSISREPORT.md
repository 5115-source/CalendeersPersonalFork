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