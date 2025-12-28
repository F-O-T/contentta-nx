import type { Resend } from "resend";
import DeletionCompletedEmail from "./emails/deletion-completed";
import DeletionReminderEmail from "./emails/deletion-reminder";
import DeletionScheduledEmail from "./emails/deletion-scheduled";
import MagicLinkEmail from "./emails/magic-link";
import OrganizationInvitationEmail from "./emails/organization-invitation";
import OTPEmail from "./emails/otp";
import WorkflowNotificationEmail from "./emails/workflow-notification";
import type { SendWorkflowEmailOptions } from "./utils";

export type { SendWorkflowEmailOptions };
export { getResendClient, type ResendClient } from "./utils";

export interface SendEmailOTPOptions {
   email: string;
   otp: string;
   type: "sign-in" | "email-verification" | "forget-password";
}

export interface SendOrganizationInvitationOptions {
   email: string;
   invitedByUsername: string;
   invitedByEmail: string;
   teamName: string;
   inviteLink: string;
}
const name = "Montte";
export const sendOrganizationInvitation = async (
   client: Resend,
   {
      email,
      invitedByUsername,
      invitedByEmail,
      teamName,
      inviteLink,
   }: SendOrganizationInvitationOptions,
) => {
   const subject = `Convite para se juntar à equipe ${teamName} no ContentaGen`;
   await client.emails.send({
      from: `${name} <suporte@mail.montte.co>`,
      react: (
         <OrganizationInvitationEmail
            invitedByEmail={invitedByEmail}
            invitedByUsername={invitedByUsername}
            inviteLink={inviteLink}
            teamName={teamName}
         />
      ),
      subject,
      to: email,
   });
};

export const sendEmailOTP = async (
   client: Resend,
   { email, otp, type }: SendEmailOTPOptions,
) => {
   const getSubject = () => {
      switch (type) {
         case "sign-in":
            return "Faça login na sua conta";
         case "email-verification":
            return "Verifique seu e-mail";
         case "forget-password":
            return "Redefina sua senha";
         default:
            return "Verifique seu e-mail";
      }
   };
   await client.emails.send({
      from: `${name} <suporte@mail.montte.co>`,
      react: <OTPEmail otp={otp} type={type} />,
      subject: getSubject(),
      to: email,
   });
};

export const sendWorkflowEmail = async (
   client: Resend,
   { to, subject, body }: SendWorkflowEmailOptions,
) => {
   await client.emails.send({
      from: `${name} <suporte@mail.montte.co>`,
      react: <WorkflowNotificationEmail body={body} />,
      subject,
      to,
   });
};

export interface SendMagicLinkEmailOptions {
   email: string;
   magicLinkUrl: string;
}

export const sendMagicLinkEmail = async (
   client: Resend,
   { email, magicLinkUrl }: SendMagicLinkEmailOptions,
) => {
   const subject = "Acesse sua conta Montte";
   await client.emails.send({
      from: `${name} <suporte@mail.montte.co>`,
      react: <MagicLinkEmail magicLinkUrl={magicLinkUrl} />,
      subject,
      to: email,
   });
};

// Account Deletion Emails

export interface SendDeletionScheduledEmailOptions {
   email: string;
   userName: string;
   scheduledDate: string;
   cancelUrl: string;
}

export const sendDeletionScheduledEmail = async (
   client: Resend,
   {
      email,
      userName,
      scheduledDate,
      cancelUrl,
   }: SendDeletionScheduledEmailOptions,
) => {
   const subject = "Sua conta foi agendada para exclusão";
   await client.emails.send({
      from: `${name} <suporte@mail.montte.co>`,
      react: (
         <DeletionScheduledEmail
            cancelUrl={cancelUrl}
            scheduledDate={scheduledDate}
            userName={userName}
         />
      ),
      subject,
      to: email,
   });
};

export interface SendDeletionReminderEmailOptions {
   email: string;
   userName: string;
   daysRemaining: number;
   cancelUrl: string;
}

export const sendDeletionReminderEmail = async (
   client: Resend,
   {
      email,
      userName,
      daysRemaining,
      cancelUrl,
   }: SendDeletionReminderEmailOptions,
) => {
   const subject =
      daysRemaining === 1
         ? "Última chance: sua conta será excluída amanhã"
         : `Lembrete: sua conta será excluída em ${daysRemaining} dias`;
   await client.emails.send({
      from: `${name} <suporte@mail.montte.co>`,
      react: (
         <DeletionReminderEmail
            cancelUrl={cancelUrl}
            daysRemaining={daysRemaining}
            userName={userName}
         />
      ),
      subject,
      to: email,
   });
};

export interface SendDeletionCompletedEmailOptions {
   email: string;
   userName: string;
}

export const sendDeletionCompletedEmail = async (
   client: Resend,
   { email, userName }: SendDeletionCompletedEmailOptions,
) => {
   const subject = "Sua conta foi excluída";
   await client.emails.send({
      from: `${name} <suporte@mail.montte.co>`,
      react: <DeletionCompletedEmail userName={userName} />,
      subject,
      to: email,
   });
};
