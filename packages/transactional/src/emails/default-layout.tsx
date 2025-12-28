import {
   Body,
   Container,
   Font,
   Head,
   Html,
   Preview,
   Tailwind,
} from "@react-email/components";
import type { ReactNode } from "react";

interface DefaultEmailLayoutProps {
   children: ReactNode;
   preview?: string;
}

export const DefaultEmailLayout = ({
   children,
   preview,
}: DefaultEmailLayoutProps) => {
   return (
      <Tailwind
         config={{
            theme: {
               extend: {
                  colors: {
                     primary: {
                        DEFAULT: "#42B46E",
                        dark: "#0C5343",
                        light: "#379255",
                     },
                     background: "#f5f7f6",
                     foreground: "#1a1a2e",
                     muted: "#6b7280",
                     card: "#ffffff",
                     border: "#e5e7eb",
                  },
                  borderRadius: {
                     DEFAULT: "0.8rem",
                  },
               },
            },
         }}
      >
         <Html>
            <Head>
               <Font
                  fallbackFontFamily="Arial"
                  fontFamily="Montserrat"
                  fontStyle="normal"
                  fontWeight={400}
                  webFont={{
                     url: "https://app.montte.co/email/montserrat-regular.woff2",
                     format: "woff2",
                  }}
               />
            </Head>
            {preview && <Preview>{preview}</Preview>}
            <Body
               style={{
                  backgroundColor: "#f5f7f6",
                  fontFamily: "Montserrat, Arial, sans-serif",
                  margin: 0,
                  padding: 0,
               }}
            >
               <Container
                  style={{
                     backgroundColor: "#ffffff",
                     borderRadius: "12px",
                     boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                     margin: "40px auto",
                     maxWidth: "520px",
                     overflow: "hidden",
                  }}
               >
                  {children}
               </Container>
            </Body>
         </Html>
      </Tailwind>
   );
};
