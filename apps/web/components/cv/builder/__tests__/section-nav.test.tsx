import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRef } from 'react';

import { SectionNav } from '../section-nav';

/**
 * Stub IntersectionObserver that exposes its callback so tests can drive
 * the observer manually without depending on jsdom (which has no layout).
 */
class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];

  callback: IntersectionObserverCallback;
  options?: IntersectionObserverInit;
  observed: Element[] = [];

  constructor(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit,
  ) {
    this.callback = callback;
    this.options = options;
    FakeIntersectionObserver.instances.push(this);
  }

  observe(target: Element) {
    this.observed.push(target);
  }

  unobserve(target: Element) {
    this.observed = this.observed.filter((el) => el !== target);
  }

  disconnect() {
    this.observed = [];
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  // Drive the callback as if the browser had reported intersection updates.
  fire(entries: Array<Partial<IntersectionObserverEntry>>) {
    this.callback(
      entries as IntersectionObserverEntry[],
      this as unknown as IntersectionObserver,
    );
  }
}

let originalScrollIntoView:
  | ((arg?: boolean | ScrollIntoViewOptions) => void)
  | undefined;
let originalIntersectionObserver: typeof IntersectionObserver | undefined;

beforeEach(() => {
  FakeIntersectionObserver.instances = [];

  originalScrollIntoView = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = vi.fn();

  originalIntersectionObserver = (
    globalThis as unknown as { IntersectionObserver?: typeof IntersectionObserver }
  ).IntersectionObserver;
  (globalThis as unknown as {
    IntersectionObserver: typeof IntersectionObserver;
  }).IntersectionObserver =
    FakeIntersectionObserver as unknown as typeof IntersectionObserver;
});

afterEach(() => {
  if (originalScrollIntoView) {
    Element.prototype.scrollIntoView = originalScrollIntoView;
  }
  if (originalIntersectionObserver) {
    (globalThis as unknown as {
      IntersectionObserver: typeof IntersectionObserver;
    }).IntersectionObserver = originalIntersectionObserver;
  } else {
    delete (
      globalThis as unknown as { IntersectionObserver?: unknown }
    ).IntersectionObserver;
  }
});

/**
 * Test harness that mounts SectionNav next to the seven canonical anchors,
 * all scoped to the same scroll container ref so SectionNav resolves them
 * via its scoped selector path.
 */
function Harness() {
  const ref = useRef<HTMLDivElement | null>(null);
  return (
    <div ref={ref}>
      <SectionNav scrollContainerRef={ref} />
      <div id="cv-section-profile">P</div>
      <div id="cv-section-experience">E</div>
      <div id="cv-section-education">Ed</div>
      <div id="cv-section-skills">S</div>
      <div id="cv-section-projects">Pr</div>
      <div id="cv-section-certifications">C</div>
      <div id="cv-section-languages">L</div>
    </div>
  );
}

describe('SectionNav', () => {
  describe('scrollIntoView on click (Requirements 3.1, 3.2)', () => {
    it('calls scrollIntoView with smooth/center options when a section button is clicked', async () => {
      const user = userEvent.setup();
      render(<Harness />);

      // "Kỹ năng" maps to the skills section (id="cv-section-skills").
      await user.click(screen.getByText('Kỹ năng'));

      expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
      expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center',
      });
    });
  });

  describe('activeSection highlight via IntersectionObserver (Requirement 3.4)', () => {
    it('marks the most-visible section as aria-current="location"', () => {
      render(<Harness />);

      const observer = FakeIntersectionObserver.instances[0];
      expect(observer).toBeDefined();

      const experienceAnchor = document.getElementById(
        'cv-section-experience',
      );
      expect(experienceAnchor).not.toBeNull();

      // Simulate the browser reporting that the experience section now
      // dominates the viewport.
      act(() => {
        observer.fire([
          {
            target: experienceAnchor as Element,
            intersectionRatio: 0.8,
            isIntersecting: true,
          },
        ]);
      });

      const experienceButton = screen.getByTestId(
        'section-nav-item-experience',
      );
      expect(experienceButton).toHaveAttribute('aria-current', 'location');
      expect(experienceButton).toHaveAttribute('data-active', 'true');

      // Sanity check: a different section should NOT be active.
      const skillsButton = screen.getByTestId('section-nav-item-skills');
      expect(skillsButton).not.toHaveAttribute('aria-current');
      expect(skillsButton).toHaveAttribute('data-active', 'false');
    });
  });
});
