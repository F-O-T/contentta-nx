import { Button, Section, Text } from "@react-email/components";

import { DefaultFooter } from "./default-footer";
import { DefaultHeading } from "./default-heading";
import { DefaultEmailLayout } from "./default-layout";

interface MagicLinkEmailProps {
   magicLinkUrl: string;
}

export default function MagicLinkEmail({ magicLinkUrl }: MagicLinkEmailProps) {
   return (
      <DefaultEmailLayout preview="Seu link de acesso Montte">
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
               Link de Acesso
            </Text>
            <Text
               style={{
                  color: "#6b7280",
                  fontSize: "15px",
                  lineHeight: "24px",
                  margin: "0 0 24px 0",
               }}
            >
               Clique no botao abaixo para acessar sua conta. Este link expira
               em 15 minutos.
            </Text>
            <Button
               href={magicLinkUrl}
               style={{
                  backgroundColor: "#42B46E",
                  borderRadius: "8px",
                  color: "#ffffff",
                  display: "inline-block",
                  fontSize: "16px",
                  fontWeight: 600,
                  padding: "12px 32px",
                  textDecoration: "none",
               }}
            >
               Acessar Conta
            </Button>
            <Text
               style={{
                  color: "#9ca3af",
                  fontSize: "13px",
                  lineHeight: "20px",
                  margin: "24px 0 0 0",
               }}
            >
               Se voce nao solicitou este link, ignore este e-mail.
            </Text>
         </Section>
         <DefaultFooter />
      </DefaultEmailLayout>
   );
}

MagicLinkEmail.PreviewProps = {
   magicLinkUrl: "https://app.montte.co/auth/sign-in?token=abc123",
} satisfies MagicLinkEmailProps;
