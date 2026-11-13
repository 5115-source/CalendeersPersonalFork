import { expect } from "chai";
import { validateFeedURL } from "../src/services/canvasFeed.js";
import { parseClassSchedule, ScheduleError } from "../src/services/classSchedule.js";

describe("validateFeedURL", () => {
  it("accepts valid Canvas feed URL with webcal:// scheme", () => {
    const input = "webcal://canvas.uw.edu/feeds/calendars/user_abc123.ics";
    const result = validateFeedURL(input);
    
    expect(result).to.equal("https://canvas.uw.edu/feeds/calendars/user_abc123.ics");
  });

  it("accepts valid Canvas feed URL with https:// scheme", () => {
    const input = "https://canvas.uw.edu/feeds/calendars/user_XyZ-789_test.ics";
    const result = validateFeedURL(input);
    
    expect(result).to.equal("https://canvas.uw.edu/feeds/calendars/user_XyZ-789_test.ics");
  });

  it("accepts URLs with trailing whitespace", () => {
    const input = "  https://canvas.uw.edu/feeds/calendars/user_abc.ics  \n";
    const result = validateFeedURL(input);
    
    expect(result).to.equal("https://canvas.uw.edu/feeds/calendars/user_abc.ics");
  });

  it("rejects URL with wrong hostname", () => {
    const input = "https://evil.com/feeds/calendars/user_abc123.ics";
    
    expect(() => validateFeedURL(input)).to.throw("Invalid UW Canvas Calendar Feed URL");
  });

  it("rejects URL with non-HTTPS protocol", () => {
    const input = "http://canvas.uw.edu/feeds/calendars/user_abc123.ics";
    
    expect(() => validateFeedURL(input)).to.throw("Invalid UW Canvas Calendar Feed URL");
  });

  it("rejects URL with port number", () => {
    const input = "https://canvas.uw.edu:8080/feeds/calendars/user_abc123.ics";
    
    expect(() => validateFeedURL(input)).to.throw("Invalid UW Canvas Calendar Feed URL");
  });

  it("rejects URL with authentication credentials", () => {
    const input = "https://user:pass@canvas.uw.edu/feeds/calendars/user_abc123.ics";
    
    expect(() => validateFeedURL(input)).to.throw("Invalid UW Canvas Calendar Feed URL");
  });

  it("rejects URL with query parameters", () => {
    const input = "https://canvas.uw.edu/feeds/calendars/user_abc123.ics?token=secret";
    
    expect(() => validateFeedURL(input)).to.throw("Invalid UW Canvas Calendar Feed URL");
  });

  it("rejects URL with fragment/hash", () => {
    const input = "https://canvas.uw.edu/feeds/calendars/user_abc123.ics#section";
    
    expect(() => validateFeedURL(input)).to.throw("Invalid UW Canvas Calendar Feed URL");
  });

  it("rejects URL with invalid path pattern", () => {
    const input = "https://canvas.uw.edu/feeds/calendar/user_abc123.ics";
    
    expect(() => validateFeedURL(input)).to.throw("Invalid UW Canvas Calendar Feed URL");
  });

  it("rejects URL with invalid user ID format", () => {
    const input = "https://canvas.uw.edu/feeds/calendars/user_123@456.ics";
    
    expect(() => validateFeedURL(input)).to.throw("Invalid UW Canvas Calendar Feed URL");
  });

  it("rejects URL with missing .ics extension", () => {
    const input = "https://canvas.uw.edu/feeds/calendars/user_abc123";
    
    expect(() => validateFeedURL(input)).to.throw("Invalid UW Canvas Calendar Feed URL");
  });

  it("handles case-insensitive webcal:// prefix", () => {
    const input = "WEBCAL://canvas.uw.edu/feeds/calendars/user_abc123.ics";
    const result = validateFeedURL(input);
    
    expect(result).to.equal("https://canvas.uw.edu/feeds/calendars/user_abc123.ics");
  });
});

describe("parseClassSchedule", () => {
  const validScheduleICS = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//University of Washington//Register.UW//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
SUMMARY:CSE 331 A
DTSTART:20261103T143000Z
DTEND:20261103T153000Z
RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR
LOCATION:CSE 405
END:VEVENT
BEGIN:VEVENT
SUMMARY:CSE 331 A
DTSTART:20261105T160000Z
DTEND:20261105T171500Z
RRULE:FREQ=WEEKLY;BYDAY=TU,TH
LOCATION:CSE 405
END:VEVENT
BEGIN:VEVENT
SUMMARY:MATH 125 A
DTSTART:20261104T150000Z
DTEND:20261104T160000Z
RRULE:FREQ=WEEKLY;BYDAY=TU,TH
LOCATION:SAV 131
END:VEVENT
END:VCALENDAR`;

  it("parses valid Register.UW .ics file with multiple courses", () => {
    const result = parseClassSchedule(validScheduleICS);
    
    expect(result).to.have.property("courses");
    expect(result).to.have.property("updatedAt");
    expect(result.courses).to.be.an("array");
    expect(result.courses.length).to.equal(2);
  });

  it("correctly extracts course names from schedule", () => {
    const result = parseClassSchedule(validScheduleICS);
    const courseNames = result.courses.map(c => c.name).sort();
    
    expect(courseNames).to.deep.equal(["CSE 331 A", "MATH 125 A"]);
  });

  it("correctly extracts meeting days from recurring events", () => {
    const result = parseClassSchedule(validScheduleICS);
    const cse = result.courses.find(c => c.name === "CSE 331 A");
    
    expect(cse.meetings).to.have.lengthOf(2);
    expect(cse.meetings[0].days).to.deep.equal(["MO", "WE", "FR"]);
    expect(cse.meetings[1].days).to.deep.equal(["TU", "TH"]);
  });

  it("correctly extracts meeting times in minutes", () => {
    const result = parseClassSchedule(validScheduleICS);
    const cse = result.courses.find(c => c.name === "CSE 331 A");
    
    expect(cse.meetings[0].start).to.equal(390);
    expect(cse.meetings[0].end).to.equal(450);
  });

  it("correctly extracts meeting locations", () => {
    const result = parseClassSchedule(validScheduleICS);
    const cse = result.courses.find(c => c.name === "CSE 331 A");
    const math = result.courses.find(c => c.name === "MATH 125 A");
    
    expect(cse.meetings[0].location).to.equal("CSE 405");
    expect(math.meetings[0].location).to.equal("SAV 131");
  });

  it("detects and rejects duplicate meetings", () => {
    const duplicateICS = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:CSE 331 A
DTSTART:20261103T143000Z
DTEND:20261103T153000Z
RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR
LOCATION:CSE 405
END:VEVENT
BEGIN:VEVENT
SUMMARY:CSE 331 A
DTSTART:20261103T143000Z
DTEND:20261103T153000Z
RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR
LOCATION:CSE 405
END:VEVENT
END:VCALENDAR`;
    
    const result = parseClassSchedule(duplicateICS);
    const cse = result.courses.find(c => c.name === "CSE 331 A");
    
    expect(cse.meetings).to.have.lengthOf(1);
  });

  it("rejects invalid .ics format without VCALENDAR", () => {
    const invalidICS = "DTSTART:20261103T143000Z\nSUMMARY:CSE 331";
    
    expect(() => parseClassSchedule(invalidICS)).to.throw(ScheduleError);
    expect(() => parseClassSchedule(invalidICS))
      .to.throw("doesn't look like a valid .ics file");
  });

  it("rejects plain text that is not .ics format", () => {
    const invalidText = "This is just some random text, not a calendar file";
    
    expect(() => parseClassSchedule(invalidText)).to.throw(ScheduleError);
  });

  it("throws error when no class meetings are found", () => {
    const emptyEventsICS = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:Holiday
DTSTART;VALUE=DATE:20261125
DTEND;VALUE=DATE:20261126
END:VEVENT
END:VCALENDAR`;
    
    expect(() => parseClassSchedule(emptyEventsICS))
      .to.throw(ScheduleError)
      .with.property("message", "No class meetings were found in that .ics file.");
  });

  it("ignores all-day events (VALUE=DATE)", () => {
    const mixedICS = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:Holiday
DTSTART;VALUE=DATE:20261125
DTEND;VALUE=DATE:20261126
END:VEVENT
BEGIN:VEVENT
SUMMARY:CSE 331 A
DTSTART:20261103T143000Z
DTEND:20261103T153000Z
RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR
END:VEVENT
END:VCALENDAR`;
    
    const result = parseClassSchedule(mixedICS);
    
    expect(result.courses).to.have.lengthOf(1);
    expect(result.courses[0].name).to.equal("CSE 331 A");
  });

  it("ignores courses with no meetings", () => {
    const eventsNoMeetingsICS = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:CSE 331 A
DTSTART:20261103T143000Z
DTEND:20261103T153000Z
RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR
LOCATION:CSE 405
END:VEVENT
BEGIN:VEVENT
SUMMARY:
DTSTART:20261103T143000Z
DTEND:20261103T153000Z
END:VEVENT
END:VCALENDAR`;
    
    const result = parseClassSchedule(eventsNoMeetingsICS);
    
    expect(result.courses).to.have.lengthOf(1);
  });

  it("updates schedules in chronological order by day and start time", () => {
    const result = parseClassSchedule(validScheduleICS);
    const cse = result.courses.find(c => c.name === "CSE 331 A");
    
    expect(cse.meetings[0].days[0]).to.equal("MO");
    expect(cse.meetings[1].days[0]).to.equal("TU");
  });

  it("trims and normalizes whitespace in course names", () => {
    const extraSpacesICS = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:  CSE   331   A  
DTSTART:20261103T143000Z
DTEND:20261103T153000Z
RRULE:FREQ=WEEKLY;BYDAY=MO
LOCATION:CSE 405
END:VEVENT
END:VCALENDAR`;
    
    const result = parseClassSchedule(extraSpacesICS);
    
    expect(result.courses[0].name).to.equal("CSE 331 A");
  });

  it("throws error for invalid input types", () => {
    expect(() => parseClassSchedule(null)).to.throw(ScheduleError);
    expect(() => parseClassSchedule(undefined)).to.throw(ScheduleError);
    expect(() => parseClassSchedule(123)).to.throw(ScheduleError);
  });
});
