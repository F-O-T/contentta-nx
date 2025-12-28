import { Button, Section, Text } from "@react-email/components";

import { DefaultFooter } from "./default-footer";
import { DefaultHeading } from "./default-heading";
import { DefaultEmailLayout } from "./default-layout";

interface DeletionScheduledEmailProps {
   userName: string;
   scheduledDate: string;
   cancelUrl: string;
}

export default function DeletionScheduledEmail({
   userName,
   scheduledDate,
   cancelUrl,
}: DeletionScheduledEmailProps) {
   return (
      <DefaultEmailLayout preview="Sua conta foi agendada para exclusão">
         <DefaultHeading />
         <Section style={{ padding: "32px 24px", textAlign: "center" }}>
            <Text
               style={{
                  color: "#1a1a2e",
                  fontSize: "22px",
                  fontWeight: 600,
                  lineHeight: "28px",
                  margin: "0 0 8px 0",
               }}
            >
               Exclusão de conta agendada
            </Text>
            <Text
               style={{
                  color: "#6b7280",
                  fontSize: "15px",
                  lineHeight: "24px",
                  margin: "0 0 24px 0",
               }}
            >
               Olá {userName}, sua conta foi agendada para exclusão.
            </Text>
            <Section
               style={{
                  backgroundColor: "#fef2f2",
                  border: "2px solid #fecaca",
                  borderRadius: "12px",
                  margin: "0 0 24px 0",
                  padding: "24px",
               }}
            >
               <Text
                  style={{
                     color: "#991b1b",
                     fontSize: "14px",
                     fontWeight: 600,
                     margin: "0 0 8px 0",
                  }}
               >
                  Data de exclusão:
               </Text>
               <Text
                  style={{
                     color: "#dc2626",
                     fontSize: "20px",
                     fontWeight: 700,
                     margin: 0,
                  }}
               >
                  {scheduledDate}
               </Text>
            </Section>
            <Text
               style={{
                  color: "#6b7280",
                  fontSize: "14px",
                  lineHeight: "22px",
                  margin: "0 0 24px 0",
               }}
            >
               Após esta data, todos os seus dados serão permanentemente
               excluídos e não poderão ser recuperados.
            </Text>
            <Button
               href={cancelUrl}
               style={{
                  backgroundColor: "#42B46E",
                  borderRadius: "8px",
                  color: "#ffffff",
                  display: "inline-block",
                  fontSize: "14px",
                  fontWeight: 600,
                  padding: "12px 24px",
                  textDecoration: "none",
               }}
            >
               Cancelar exclusão
            </Button>
            <Text
               style={{
                  color: "#9ca3af",
                  fontSize: "13px",
                  lineHeight: "20px",
                  margin: "24px 0 0 0",
               }}
            >
               Se você não solicitou a exclusão da sua conta, entre em contato
               conosco imediatamente.
            </Text>
         </Section>
         <DefaultFooter />
      </DefaultEmailLayout>
   );
}

DeletionScheduledEmail.PreviewProps = {
   userName: "João",
   scheduledDate: "15 de Janeiro de 2025",
   cancelUrl: "https://app.montte.co/settings/profile",
} satisfies DeletionScheduledEmailProps;
