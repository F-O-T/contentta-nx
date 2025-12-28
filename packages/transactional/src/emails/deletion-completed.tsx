import { Section, Text } from "@react-email/components";

import { DefaultFooter } from "./default-footer";
import { DefaultHeading } from "./default-heading";
import { DefaultEmailLayout } from "./default-layout";

interface DeletionCompletedEmailProps {
   userName: string;
}

export default function DeletionCompletedEmail({
   userName,
}: DeletionCompletedEmailProps) {
   return (
      <DefaultEmailLayout preview="Sua conta foi excluída">
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
               Conta excluída
            </Text>
            <Text
               style={{
                  color: "#6b7280",
                  fontSize: "15px",
                  lineHeight: "24px",
                  margin: "0 0 24px 0",
               }}
            >
               Olá {userName}, sua conta foi excluída com sucesso.
            </Text>
            <Section
               style={{
                  backgroundColor: "#f3f4f6",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  margin: "0 0 24px 0",
                  padding: "24px",
               }}
            >
               <Text
                  style={{
                     color: "#374151",
                     fontSize: "14px",
                     lineHeight: "22px",
                     margin: 0,
                  }}
               >
                  Todos os seus dados foram permanentemente removidos dos nossos
                  servidores, incluindo:
               </Text>
               <ul
                  style={{
                     color: "#6b7280",
                     fontSize: "14px",
                     lineHeight: "24px",
                     margin: "16px 0 0 0",
                     paddingLeft: "20px",
                     textAlign: "left",
                  }}
               >
                  <li>Informações da conta</li>
                  <li>Transações e histórico financeiro</li>
                  <li>Contas a pagar e receber</li>
                  <li>Relatórios e configurações</li>
               </ul>
            </Section>
            <Text
               style={{
                  color: "#6b7280",
                  fontSize: "14px",
                  lineHeight: "22px",
                  margin: "0 0 16px 0",
               }}
            >
               Agradecemos por ter usado o Montte. Se você mudar de ideia no
               futuro, você é sempre bem-vindo para criar uma nova conta.
            </Text>
            <Text
               style={{
                  color: "#9ca3af",
                  fontSize: "13px",
                  lineHeight: "20px",
                  margin: 0,
               }}
            >
               Este é o último e-mail que você receberá desta conta.
            </Text>
         </Section>
         <DefaultFooter />
      </DefaultEmailLayout>
   );
}

DeletionCompletedEmail.PreviewProps = {
   userName: "João",
} satisfies DeletionCompletedEmailProps;
