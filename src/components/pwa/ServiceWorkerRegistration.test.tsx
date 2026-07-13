import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";

describe("ServiceWorkerRegistration", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("registers /sw.js when the browser supports service workers", () => {
    const register = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, serviceWorker: { register } });

    render(<ServiceWorkerRegistration />);

    expect(register).toHaveBeenCalledWith("/sw.js");
  });

  it("does nothing when the browser has no serviceWorker support", () => {
    const navigatorWithoutServiceWorker = { ...navigator };
    // @ts-expect-error -- simulating a browser without service worker support
    delete navigatorWithoutServiceWorker.serviceWorker;
    vi.stubGlobal("navigator", navigatorWithoutServiceWorker);

    expect(() => render(<ServiceWorkerRegistration />)).not.toThrow();
  });
});
