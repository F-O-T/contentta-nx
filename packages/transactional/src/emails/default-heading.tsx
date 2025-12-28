import { Img, Section, Text } from "@react-email/components";

const logoUrl = "https://app.montte.co/email/logo.png";

export const DefaultHeading = () => {
   return (
      <Section
         style={{
            backgroundColor: "#0C5343",
            padding: "32px 24px",
            textAlign: "center",
         }}
      >
         <table cellPadding="0" cellSpacing="0" style={{ margin: "0 auto" }}>
            <tr>
               <td style={{ verticalAlign: "middle", paddingRight: "12px" }}>
                  <Img
                     alt="Montte"
                     height="32"
                     src={logoUrl}
                     style={{ display: "block" }}
                     width="48"
                  />
               </td>
               <td style={{ verticalAlign: "middle" }}>
                  <Text
                     style={{
                        color: "#ffffff",
                        fontSize: "28px",
                        fontWeight: 700,
                        letterSpacing: "-0.5px",
                        margin: 0,
                     }}
                  >
                     Montte
                  </Text>
               </td>
            </tr>
         </table>
      </Section>
   );
};
