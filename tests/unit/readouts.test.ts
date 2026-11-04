import { describe, expect, it } from "vitest";
import { buildReadouts, formatReadout, litCells, yearsSinceFirstRole } from "@/lib/home/readouts";

const NOW = new Date("2026-11-04T00:00:00.000Z");

describe("yearsSinceFirstRole", () => {
  it("counts whole years from the earliest start date", () => {
    const experience = [
      { startDate: new Date("2023-02-01T00:00:00.000Z") },
      { startDate: new Date("2021-06-01T00:00:00.000Z") },
    ];
    expect(yearsSinceFirstRole(experience, NOW)).toBe(5);
  });

  it("returns null without experience", () => {
    expect(yearsSinceFirstRole([], NOW)).toBeNull();
  });

  it("ignores invalid and future dates", () => {
    const experience = [
      { startDate: new Date("not a date") },
      { startDate: new Date("2030-01-01T00:00:00.000Z") },
      { startDate: new Date("2024-11-03T00:00:00.000Z") },
    ];
    expect(yearsSinceFirstRole(experience, NOW)).toBe(2);
  });

  it("accepts ISO strings from the JSON store", () => {
    const experience = [{ startDate: "2020-01-01T00:00:00.000Z" as unknown as Date }];
    expect(yearsSinceFirstRole(experience, NOW)).toBe(6);
  });
});

describe("buildReadouts", () => {
  it("derives every readout from data", () => {
    const readouts = buildReadouts({
      projectCount: 6,
      skillCount: 12,
      experience: [{ startDate: new Date("2021-01-01T00:00:00.000Z") }],
      now: NOW,
    });
    expect(readouts).toEqual([
      { label: "Projects shipped", value: 6 },
      { label: "Core skills", value: 12 },
      { label: "Years building", value: 5 },
    ]);
  });

  it("drops readouts with no data instead of showing zero", () => {
    const readouts = buildReadouts({ projectCount: null, skillCount: 0, experience: [], now: NOW });
    expect(readouts).toEqual([]);
  });
});

describe("formatting", () => {
  it("zero-pads to two digits", () => {
    expect(formatReadout(6)).toBe("06");
    expect(formatReadout(120)).toBe("120");
    expect(formatReadout(-3)).toBe("00");
  });

  it("caps lit cells at the meter length", () => {
    expect(litCells(6, 10)).toBe(6);
    expect(litCells(14, 10)).toBe(10);
    expect(litCells(-1, 10)).toBe(0);
  });
});
