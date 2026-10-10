# Accessibility

The site includes reading controls and aims to make its public content usable with different input methods and reading needs. This document describes the current support and expectations for changes; it is **not** a claim that every page has passed an independent audit or conforms to a particular standard.

## Current user-facing support

- The `/accessibility` page describes the available options and how to report a barrier.
- Long-form content includes per-device reading preferences for text size, typeface, line height, word spacing, letter spacing, and high contrast.
- Keyboard focus styles are used across interactive controls, and many controls have accessible names or status announcements.
- Selected animated interactions check the operating system's reduced-motion preference.

These features do not replace platform zoom, browser settings, assistive technology, or well-structured content. Availability and behavior can vary by browser and device.

## Expectations for contributions

For new and changed UI, use WCAG 2.2 AA as a practical design and review target where applicable; this target is not a conformance guarantee. In particular:

- Prefer semantic HTML and native controls. Give inputs persistent labels, buttons descriptive names, and page regions meaningful headings.
- Keep all functionality keyboard operable, preserve a visible focus indicator, and do not trap focus outside a correctly managed dialog or modal.
- Use sufficient text and control contrast in light, dark, and high-contrast modes. Do not communicate status by color alone.
- Respect `prefers-reduced-motion`; avoid requiring animation, dragging, or precise pointer movements to complete an action.
- Announce asynchronous errors and success states appropriately, associate field errors with their inputs, and ensure validation can be understood without relying only on color.
- Test at narrow viewport widths and with browser zoom. Check that longer labels, translated text, and user-provided content do not obscure controls or force horizontal scrolling.
- Use informative alternative text for meaningful images and empty alternative text for decorative imagery.
- Do not add ARIA roles or properties when native HTML already provides the needed semantics; verify that an ARIA pattern includes its expected keyboard behavior.

## Review checklist

Before submitting an accessibility-sensitive change, where relevant:

1. Navigate the flow using only a keyboard.
2. Check focus order, visible focus, labels, headings, and error/status announcements.
3. Review contrast and layout in light, dark, and high-contrast modes.
4. Check reduced-motion behavior and browser zoom at a narrow viewport.
5. Use an automated accessibility checker as a supplement, not as proof of accessibility.

## Reporting a barrier

If a page or control is difficult to use, contact the project via the site's `/contact` page or email [hello@prasadk.xyz](mailto:hello@prasadk.xyz). Include the URL, browser/device or assistive technology if known, the action you were trying to complete, and what happened. Do not include passwords, tokens, or other secrets.
