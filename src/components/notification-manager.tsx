"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { playCompletionSound } from "@/lib/utils/sound";

export function NotificationManager() {
  const [, setNotificationPermission] =
    useState<NotificationPermission>("default");
  const { toast } = useToast();

  useEffect(() => {
    const requestNotificationPermission = async () => {
      if ("Notification" in window) {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);

        if (permission === "granted") return;

        toast({
          title: "Notifications disabled",
          description:
            "You won't receive notifications for completed tasks. You can enable them in your browser settings.",
          variant: "default",
        });
      }
    };

    void requestNotificationPermission();
  }, [toast]);

  return null;
}

export function sendNotification(title: string, body: string) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body });
  }
  playCompletionSound();
}
