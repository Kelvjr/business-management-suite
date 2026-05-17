"use client";

import { useEffect, useState } from "react";

export function DashboardLastUpdated() {
  const [minutes, setMinutes] = useState(0);

  useEffect(() => {
    const t0 = Date.now();
    const bump = () => setMinutes(Math.floor((Date.now() - t0) / 60000));
    bump();
    const id = window.setInterval(bump, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const text =
    minutes < 60
      ? `${minutes}m`
      : `${Math.floor(minutes / 60)}${Math.floor(minutes / 60) === 1 ? "hr" : "hrs"}`;

  return (
    <span className="text-xs font-medium text-neutral-400">
      Last updated: {text}
    </span>
  );
}
