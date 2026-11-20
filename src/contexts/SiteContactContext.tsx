'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { platformSettingsService } from '@/services/platform-settings.service';
import {
  DEFAULT_SITE_CONTACT,
  DEFAULT_LANDING_CONTENT,
  type LandingContent,
  type SiteContact,
} from '@/types/platform-settings.types';

/**
 * Administrator-managed public site content, shared by the footer, the public
 * contact pages and the landing page.
 *
 * One request feeds both the contact block and the landing-page content: they
 * come from the same site-settings record and would otherwise be fetched twice
 * on first paint.
 *
 * Defaults are provided as the context values rather than `undefined`, on
 * purpose. Error screens such as `app/error.tsx` sit on the boundary of this
 * provider: if the provider itself ever failed, the fallback would render
 * outside it, and throwing from the hook would replace one error with another.
 * Rendering the defaults is the correct degradation.
 */
const SiteContactContext = createContext<SiteContact>(DEFAULT_SITE_CONTACT);
const LandingContentContext = createContext<LandingContent>(DEFAULT_LANDING_CONTENT);

export function SiteContactProvider({ children }: { children: React.ReactNode }) {
  const [contact, setContact] = useState<SiteContact>(DEFAULT_SITE_CONTACT);
  const [landing, setLanding] = useState<LandingContent>(DEFAULT_LANDING_CONTENT);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await platformSettingsService.getSiteSettings();
        const nextContact = response.data?.contact;
        const nextLanding = response.data?.landing;

        if (!active || !response.success) return;

        // Merge so a backend that predates a field cannot blank it out.
        if (nextContact) {
          setContact({ ...DEFAULT_SITE_CONTACT, ...nextContact });
        }

        if (nextLanding) {
          setLanding({
            hero: { ...DEFAULT_LANDING_CONTENT.hero, ...nextLanding.hero },
            showcase: { ...DEFAULT_LANDING_CONTENT.showcase, ...nextLanding.showcase },
          });
        }
      } catch {
        // These details are decorative for most pages; an offline error
        // screen must not fail again because the fetch did.
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  return (
    <SiteContactContext.Provider value={contact}>
      <LandingContentContext.Provider value={landing}>
        {children}
      </LandingContentContext.Provider>
    </SiteContactContext.Provider>
  );
}

export function useSiteContact(): SiteContact {
  return useContext(SiteContactContext);
}

/** Hero copy and the showcase strip, editable from the admin settings screen. */
export function useLandingContent(): LandingContent {
  return useContext(LandingContentContext);
}
