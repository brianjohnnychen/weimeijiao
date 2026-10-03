/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /** Citation context for the page being rendered (set by the page before rendering MDX). */
    cites?: {
      locale: import('./i18n/locales').Locale;
      ids: string[];
      mode: 'footnotes' | 'bibliography';
      seen: Record<string, number>;
    };
  }
}
