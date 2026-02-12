"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { sendComplianceReminderEmail } from "@/app/actions/compliance";

export default function SendReminderButton() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function handleSend() {
    startTransition(async () => {
      const res = await sendComplianceReminderEmail();
      if (res.success) {
        setMessage("Нагадування надіслано на email.");
      } else {
        setMessage(res.error || "Не вдалося надіслати нагадування.");
      }
    });
  }

  return (
    <div className="space-y-3">
      <Button onClick={handleSend} isLoading={isPending}>
        Надіслати нагадування на email
      </Button>
      {message && <p className="text-sm text-gray-600">{message}</p>}
    </div>
  );
}
