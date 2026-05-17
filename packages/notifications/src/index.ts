export type NotificationChannel = "in-app" | "email";

export type NotificationEvent = {
  organizationId: string;
  userId?: string;
  channel: NotificationChannel;
  subject: string;
  body: string;
};

