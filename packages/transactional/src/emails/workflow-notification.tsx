import { Section } from "@react-email/components";
import { DefaultFooter } from "./default-footer";
import { DefaultHeading } from "./default-heading";
import { DefaultEmailLayout } from "./default-layout";

interface WorkflowNotificationEmailProps {
   body: string;
}

export default function WorkflowNotificationEmail({
   body,
}: WorkflowNotificationEmailProps) {
   return (
      <DefaultEmailLayout preview="Notificação do seu fluxo de trabalho">
         <DefaultHeading />
         <Section style={{ padding: "32px 24px" }}>
            <div
               dangerouslySetInnerHTML={{ __html: body }}
               style={{
                  color: "#1a1a2e",
                  fontSize: "15px",
                  lineHeight: "24px",
               }}
            />
         </Section>
         <DefaultFooter />
      </DefaultEmailLayout>
   );
}

WorkflowNotificationEmail.PreviewProps = {
   body: `
      <p style="margin: 0 0 16px 0;">Olá!</p>
      <p style="margin: 0 0 16px 0;">Uma nova transação de <strong style="color: #42B46E;">R$ 150,00</strong> foi registrada na sua conta.</p>
      <p style="margin: 0; color: #6b7280;">Descrição: Pagamento de assinatura mensal</p>
   `,
} satisfies WorkflowNotificationEmailProps;
