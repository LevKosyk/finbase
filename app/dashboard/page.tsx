"use client";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const session = supabase.auth.getSession().then(res => {
      setUser(res.data.session?.user ?? null);
    });
  }, []);

  if (!user) return <div>Загрузка...</div>;

  return (
    <div>
      <h1>Добро пожаловать, {user.email}</h1>
    </div>
  );
}
