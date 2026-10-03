/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /** Citation context for the page being rendered (set by the page before rendering MDX). */
    cites?: {
      locale: import('./i18n/locales').Locale;
      /** 'link': markers link to the Research page; 'bibliography': markers on the Research page itself. */
      mode: 'link' | 'bibliography';
      seen: Record<string, number>;
    };
  }
}
