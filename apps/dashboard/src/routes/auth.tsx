import { translate } from "@packages/localization";
import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";

export const Route = createFileRoute("/auth")({
   component: AuthLayout,
   staticData: {
      breadcrumb: "Authentication",
   },
});

function AuthLayout() {
   const location = useLocation();

   return (
      <div className="flex min-h-screen w-full overflow-hidden bg-background">
         {/* Form Panel - First on mobile and desktop */}
         <main className="flex flex-1 flex-col justify-center items-center px-4 py-8 md:px-8 lg:px-12 order-1 lg:order-1">
            {/* Mobile Logo */}
            <div className="lg:hidden mb-8">
               <div className="flex items-center gap-2">
                  <img alt="Montte" className="w-10 h-10" src="/favicon.svg" />
                  <span className="text-xl font-semibold">Montte</span>
               </div>
            </div>

            <section
               className="w-full max-w-md duration-500 animate-in slide-in-from-bottom-4 fade-in"
               key={location.pathname}
            >
               <section aria-label="Authentication">
                  <Outlet />
               </section>
            </section>
         </main>

         {/* Brand Panel - Hidden on mobile, on the right */}
         <aside className="hidden lg:flex lg:w-[40%] relative flex-col justify-between bg-gradient-to-br from-primary via-primary/95 to-primary/85 p-8 xl:p-12 order-2">
            {/* Background Pattern */}
            <div
               aria-hidden="true"
               className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.1)_1px,transparent_0)] bg-[size:32px_32px]"
            />

            {/* Content */}
            <div className="relative z-10">
               <div className="flex items-center gap-3">
                  <img
                     alt="Montte"
                     className="w-10 h-10 brightness-0 invert"
                     src="/favicon.svg"
                  />
                  <span className="text-xl font-semibold text-white">
                     Montte
                  </span>
               </div>
            </div>

            {/* Center Content - Illustration & Tagline */}
            <div className="relative z-10 space-y-8">
               {/* Abstract Finance Illustration */}
               <div className="relative">
                  <svg
                     className="w-full max-w-md mx-auto opacity-90"
                     fill="none"
                     viewBox="0 0 400 300"
                     xmlns="http://www.w3.org/2000/svg"
                  >
                     <title>Dashboard mockup illustration</title>
                     {/* Dashboard mockup illustration */}
                     <rect
                        height="180"
                        rx="8"
                        stroke="rgba(255,255,255,0.3)"
                        strokeWidth="2"
                        width="280"
                        x="60"
                        y="60"
                     />
                     <rect
                        fill="rgba(255,255,255,0.1)"
                        height="20"
                        rx="4"
                        width="260"
                        x="70"
                        y="70"
                     />
                     <circle
                        cx="85"
                        cy="80"
                        fill="rgba(255,255,255,0.3)"
                        r="5"
                     />
                     <circle
                        cx="100"
                        cy="80"
                        fill="rgba(255,255,255,0.2)"
                        r="5"
                     />
                     <circle
                        cx="115"
                        cy="80"
                        fill="rgba(255,255,255,0.15)"
                        r="5"
                     />

                     {/* Chart bars */}
                     <rect
                        fill="rgba(255,255,255,0.2)"
                        height="60"
                        rx="4"
                        width="30"
                        x="80"
                        y="130"
                     />
                     <rect
                        fill="rgba(255,255,255,0.35)"
                        height="90"
                        rx="4"
                        width="30"
                        x="120"
                        y="100"
                     />
                     <rect
                        fill="rgba(255,255,255,0.25)"
                        height="70"
                        rx="4"
                        width="30"
                        x="160"
                        y="120"
                     />
                     <rect
                        fill="rgba(255,255,255,0.4)"
                        height="100"
                        rx="4"
                        width="30"
                        x="200"
                        y="90"
                     />
                     <rect
                        fill="rgba(255,255,255,0.3)"
                        height="80"
                        rx="4"
                        width="30"
                        x="240"
                        y="110"
                     />

                     {/* Card elements */}
                     <rect
                        fill="rgba(255,255,255,0.15)"
                        height="50"
                        rx="6"
                        width="100"
                        x="280"
                        y="100"
                     />
                     <rect
                        fill="rgba(255,255,255,0.1)"
                        height="50"
                        rx="6"
                        width="100"
                        x="280"
                        y="160"
                     />

                     {/* Floating elements */}
                     <circle
                        cx="50"
                        cy="150"
                        fill="rgba(255,255,255,0.2)"
                        r="20"
                     />
                     <circle
                        cx="370"
                        cy="250"
                        fill="rgba(255,255,255,0.15)"
                        r="15"
                     />
                     <rect
                        fill="rgba(255,255,255,0.1)"
                        height="8"
                        rx="4"
                        transform="rotate(-15 20 250)"
                        width="60"
                        x="20"
                        y="250"
                     />
                  </svg>
               </div>

               <div className="text-center space-y-4">
                  <h2 className="text-2xl xl:text-3xl font-serif font-semibold text-white">
                     {translate("dashboard.routes.auth.brand.tagline")}
                  </h2>
                  <p className="text-white/70 text-sm xl:text-base max-w-sm mx-auto">
                     {translate("dashboard.routes.auth.brand.description")}
                  </p>
               </div>
            </div>

            {/* Footer */}
            <div className="relative z-10 text-white/50 text-xs">
               © {new Date().getFullYear()} Montte.{" "}
               {translate("common.actions.all-rights-reserved")}
            </div>
         </aside>
      </div>
   );
}
