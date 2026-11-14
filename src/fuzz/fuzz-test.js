
import fc from "fast-check";
import { validateFeedURL } from "../services/canvasFeed.js";

// Characters allowed in Canvas calendar user IDs
const characters =
  "abcdefghijklmnopqrstuvwxyz" +
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
  "0123456789_-";

// Generate random Canvas user IDs
const userIdGenerator = fc.array(
  fc.constantFrom(...characters),
  { minLength: 1, maxLength: 50 }
).map(chars => chars.join(""));

// Count the tests that pass
let passed = 0;

// Run a fuzzing property
function runFuzzTest(name, property) {
  console.log(`\nTesting: ${name}`);

  try {
    fc.assert(property, { numRuns: 1000 });

    console.log("PASS: 1000 random test cases");
    passed++;
  } catch (error) {
    console.error("FAIL: Found a counterexample!");
    console.error(error);
    process.exitCode = 1;
  }
}

console.log("=== Calendeers Fuzz Testing ===");

// TEST 1: Valid Canvas URLs should be accepted
runFuzzTest(
  "Valid Canvas calendar URLs",
  fc.property(userIdGenerator, userId => {
    const url =
      "https://canvas.uw.edu/feeds/calendars/" +
      `user_${userId}.ics`;

    return validateFeedURL(url) === url;
  })
);

// TEST 2: Malicious hosts should be rejected
runFuzzTest(
  "Reject untrusted hosts",
  fc.property(
    fc.constantFrom(
      "evil.example",
      "canvas.uw.edu.evil.example",
      "localhost",
      "127.0.0.1"
    ),
    userIdGenerator,
    (host, userId) => {
      const url =
        `https://${host}/feeds/calendars/` +
        `user_${userId}.ics`;

      try {
        validateFeedURL(url);
        return false; // Security failure
      } catch {
        return true; // Correctly rejected
      }
    }
  )
);

// TEST 3: Query strings and fragments
// should not be accepted
runFuzzTest(
  "Reject URL query strings and fragments",
  fc.property(
    userIdGenerator,
    fc.constantFrom(
      "?token=abc",
      "?redirect=evil",
      "#fragment",
      "?debug=true"
    ),
    (userId, suffix) => {
      const url =
        "https://canvas.uw.edu/feeds/calendars/" +
        `user_${userId}.ics${suffix}`;

      try {
        validateFeedURL(url);
        return false;
      } catch {
        return true;
      }
    }
  )
);

console.log("\n=== Fuzz Testing Summary ===");
console.log(`${passed}/3 properties passed`);
console.log("1000 generated cases per property");
