import { Button, Section, Text } from "@react-email/components";

import { DefaultFooter } from "./default-footer";
import { DefaultHeading } from "./default-heading";
import { DefaultEmailLayout } from "./default-layout";

interface DeletionReminderEmailProps {
   userName: string;
   daysRemaining: number;
   cancelUrl: string;
}

export default function DeletionReminderEmail({
   userName,
   daysRemaining,
   cancelUrl,
}: DeletionReminderEmailProps) {
   const isUrgent = daysRemaining <= 1;

   return (
      <DefaultEmailLayout
         preview={`Sua conta será excluída em ${daysRemaining} ${daysRemaining === 1 ? "dia" : "dias"}`}
      >
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
               Lembrete de exclusão
            </Text>
            <Text
               style={{
                  color: "#6b7280",
                  fontSize: "15px",
                  lineHeight: "24px",
                  margin: "0 0 24px 0",
               }}
            >
               Olá {userName}, este é um lembrete sobre a exclusão da sua conta.
            </Text>
            <Section
               style={{
                  backgroundColor: isUrgent ? "#fef2f2" : "#fffbeb",
                  border: `2px solid ${isUrgent ? "#fecaca" : "#fde68a"}`,
                  borderRadius: "12px",
                  margin: "0 0 24px 0",
                  padding: "24px",
               }}
            >
               <Text
                  style={{
                     color: isUrgent ? "#991b1b" : "#92400e",
                     fontSize: "14px",
                     fontWeight: 600,
                     margin: "0 0 8px 0",
                  }}
               >
                  Tempo restante:
               </Text>
               <Text
                  style={{
                     color: isUrgent ? "#dc2626" : "#d97706",
                     fontSize: "32px",
                     fontWeight: 700,
                     margin: 0,
                  }}
               >
                  {daysRemaining} {daysRemaining === 1 ? "dia" : "dias"}
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
               {isUrgent
                  ? "Sua conta será excluída amanhã! Esta é sua última chance de cancelar."
                  : "Após este período, todos os seus dados serão permanentemente excluídos."}
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
               Clique no botão acima para manter sua conta ativa.
            </Text>
         </Section>
         <DefaultFooter />
      </DefaultEmailLayout>
   );
}

DeletionReminderEmail.PreviewProps = {
   userName: "João",
   daysRemaining: 7,
   cancelUrl: "https://app.montte.co/settings/profile",
} satisfies DeletionReminderEmailProps;
