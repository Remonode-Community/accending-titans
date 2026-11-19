'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { platformSettingsService } from '@/services/platform-settings.service';
import { DEFAULT_SITE_CONTACT, type SiteContact } from '@/types/platform-settings.types';

/**
 * Administrator-managed support details, shared by the footer and the public
 * contact pages.
 *
 * Defaults are provided as the context value rather than `undefined`, on
 * purpose. Error screens such as `app/error.tsx` sit on the boundary of this
 * provider: if the provider itself ever failed, the fallback would render
 * outside it, and throwing from the hook would replace one error with another.
 * Rendering the defaults is the correct degradation for contact details.
 */
const SiteContactContext = createContext<SiteContact>(DEFAULT_SITE_CONTACT);

export function SiteContactProvider({ children }: { children: React.ReactNode }) {
  const [contact, setContact] = useState<SiteContact>(DEFAULT_SITE_CONTACT);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await platformSettingsService.getSiteSettings();
        const next = response.data?.contact;

        if (!active || !response.success || !next) return;

        // Merge so a backend that predates a field cannot blank it out.
        setContact({ ...DEFAULT_SITE_CONTACT, ...next });
      } catch {
        // Contact details are decorative for most pages; an offline error
        // screen must not fail again because the fetch did.
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  return (
    <SiteContactContext.Provider value={contact}>{children}</SiteContactContext.Provider>
  );
}

export function useSiteContact(): SiteContact {
  return useContext(SiteContactContext);
}
