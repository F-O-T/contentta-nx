import { Section, Text } from "@react-email/components";

import { DefaultFooter } from "./default-footer";
import { DefaultHeading } from "./default-heading";
import { DefaultEmailLayout } from "./default-layout";

interface OTPEmailProps {
   otp: string;
   type: "sign-in" | "email-verification" | "forget-password";
}

const content = {
   "email-verification": {
      description: "Use o código abaixo para confirmar seu endereço de e-mail.",
      footer: "Este código é válido por 10 minutos.",
      preview: "Seu código de verificação Montte",
      title: "Confirme seu e-mail",
   },
   "forget-password": {
      description: "Use o código abaixo para redefinir sua senha.",
      footer:
         "Se você não solicitou a redefinição de senha, ignore este e-mail.",
      preview: "Código para redefinir sua senha Montte",
      title: "Redefinir senha",
   },
   "sign-in": {
      description: "Use o código abaixo para fazer login na sua conta.",
      footer: "Se você não solicitou o login, ignore este e-mail.",
      preview: "Seu código de acesso Montte",
      title: "Código de acesso",
   },
};

export default function OTPEmail({ otp, type }: OTPEmailProps) {
   const { title, description, footer, preview } = content[type];
   const formattedOtp = otp.toString().replace(/(\d{3})(?=\d)/g, "$1 ");

   return (
      <DefaultEmailLayout preview={preview}>
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
               {title}
            </Text>
            <Text
               style={{
                  color: "#6b7280",
                  fontSize: "15px",
                  lineHeight: "24px",
                  margin: "0 0 24px 0",
               }}
            >
               {description}
            </Text>
            <Section
               style={{
                  backgroundColor: "#f0fdf4",
                  border: "2px dashed #42B46E",
                  borderRadius: "12px",
                  margin: "0 0 24px 0",
                  padding: "24px",
               }}
            >
               <Text
                  style={{
                     color: "#0C5343",
                     fontSize: "36px",
                     fontWeight: 700,
                     letterSpacing: "8px",
                     margin: 0,
                  }}
               >
                  {formattedOtp}
               </Text>
            </Section>
            <Text
               style={{
                  color: "#9ca3af",
                  fontSize: "13px",
                  lineHeight: "20px",
                  margin: 0,
               }}
            >
               {footer}
            </Text>
         </Section>
         <DefaultFooter />
      </DefaultEmailLayout>
   );
}

OTPEmail.PreviewProps = {
   otp: "123456",
   type: "email-verification",
} satisfies OTPEmailProps;
