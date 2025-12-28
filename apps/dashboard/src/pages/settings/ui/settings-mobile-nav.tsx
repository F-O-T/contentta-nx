import { translate } from "@packages/localization";
import { QuickAccessCard } from "@packages/ui/components/quick-access-card";
import { useNavigate } from "@tanstack/react-router";
import { Bell, CreditCard, Settings2, Shield, User } from "lucide-react";
import { useActiveOrganization } from "@/hooks/use-active-organization";

const settingsNavItems = [
   {
      description: translate(
         "dashboard.routes.settings.nav.profile.description",
      ),
      href: "/$slug/settings/profile",
      icon: User,
      id: "profile",
      title: translate("dashboard.routes.settings.nav.profile"),
   },
   {
      description: translate(
         "dashboard.routes.settings.nav.security.description",
      ),
      href: "/$slug/settings/security",
      icon: Shield,
      id: "security",
      title: translate("dashboard.routes.settings.nav.security"),
   },
   {
      description: translate(
         "dashboard.routes.settings.nav.preferences.description",
      ),
      href: "/$slug/settings/preferences",
      icon: Settings2,
      id: "preferences",
      title: translate("dashboard.routes.settings.nav.preferences"),
   },
   {
      description: translate(
         "dashboard.routes.settings.nav.notifications.description",
      ),
      href: "/$slug/settings/notifications",
      icon: Bell,
      id: "notifications",
      title: translate("dashboard.routes.settings.nav.notifications"),
   },
   {
      description: translate(
         "dashboard.routes.settings.nav.billing.description",
      ),
      href: "/$slug/settings/billing",
      icon: CreditCard,
      id: "billing",
      title: translate("dashboard.routes.settings.nav.billing"),
   },
];

export function SettingsMobileNav() {
   const { activeOrganization } = useActiveOrganization();
   const navigate = useNavigate();

   return (
      <div className="grid gap-4">
         {settingsNavItems.map((item) => (
            <QuickAccessCard
               description={item.description}
               icon={<item.icon className="size-4" />}
               key={item.id}
               onClick={() =>
                  navigate({
                     params: { slug: activeOrganization.slug },
                     to: item.href,
                  })
               }
               title={item.title}
            />
         ))}
      </div>
   );
}
