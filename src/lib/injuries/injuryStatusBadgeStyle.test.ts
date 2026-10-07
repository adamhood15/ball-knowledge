import { describe, expect, it } from "vitest";
import { injuryStatusBadgeClasses } from "@/lib/injuries/injuryStatusBadgeStyle";


describe("injuryStatusBadgeClasses", () => {
  it("is solid red for Out and IR, the designations where the player won't play", () => {
    expect(injuryStatusBadgeClasses("Out")).toContain("bg-red-600");
    expect(injuryStatusBadgeClasses("Out")).toContain("text-white");
    expect(injuryStatusBadgeClasses("IR")).toContain("bg-red-600");
  });

  it("is solid yellow for Questionable and Doubtful, the designations where the player might play", () => {
    expect(injuryStatusBadgeClasses("Questionable")).toContain("bg-yellow-400");
    expect(injuryStatusBadgeClasses("Questionable")).toContain("text-background");
    expect(injuryStatusBadgeClasses("Doubtful")).toContain("bg-yellow-400");
  });

  it("keeps the neutral box for designations outside the red and yellow rule, rather than guessing a color", () => {
    const neutralClasses = injuryStatusBadgeClasses("DNR");
    expect(neutralClasses).not.toContain("bg-red-600");
    expect(neutralClasses).not.toContain("bg-yellow-400");
    expect(neutralClasses).toContain("border-muted-text/30");
  });

  it("pairs solid red with white text and solid yellow with dark text, for legible contrast", () => {
    expect(injuryStatusBadgeClasses("Out")).toContain("bg-red-600 text-white");
    expect(injuryStatusBadgeClasses("Questionable")).toContain("bg-yellow-400 text-background");
  });
});
