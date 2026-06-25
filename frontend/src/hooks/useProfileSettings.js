import { useEffect, useMemo, useState } from "react";
import { getAuthUser } from "../services/auth";
import { getLocalSettings } from "../services/profileSettings";

function resolveUserId() {
  return getAuthUser()?.id || "guest";
}

export function useProfileSettings() {
  const [settings, setSettings] = useState(() =>
    getLocalSettings(resolveUserId()),
  );

  useEffect(() => {
    const syncSettings = () => {
      setSettings(getLocalSettings(resolveUserId()));
    };

    window.addEventListener("storage", syncSettings);
    window.addEventListener("livo:settings-updated", syncSettings);

    return () => {
      window.removeEventListener("storage", syncSettings);
      window.removeEventListener("livo:settings-updated", syncSettings);
    };
  }, []);

  return useMemo(() => settings, [settings]);
}
