export enum PlanName {
   FREE = "free",
   PRO = "pro",
}

export const STRIPE_PLANS = [
   {
      annualPrice: null,
      description: "Para começar a criar conteúdo",
      displayName: "Free",
      features: [
         "1 usuário",
         "Funcionalidades básicas",
         "Suporte por email",
      ],
      name: PlanName.FREE,
      price: "R$ 0",
   },
   {
      annualPrice: "R$ 1500",
      description: "Para criadores de conteúdo profissionais",
      displayName: "Pro",
      features: [
         "Membros ilimitados",
         "Todas as funcionalidades",
         "Automações",
         "Relatórios avançados",
         "Suporte prioritário",
         "API access",
         "14 dias de teste grátis",
      ],
      highlighted: true,
      name: PlanName.PRO,
      price: "R$ 150",
   },
];

export enum AddOnType {
   EXTRA_SEATS = "extra_seats",
   EXTRA_STORAGE = "extra_storage",
   AUTOMATION_PACK = "automation_pack",
}

export const STRIPE_ADDONS = [
   {
      name: AddOnType.EXTRA_SEATS,
      displayName: "Usuário Adicional",
      description: "Adicione mais usuários ao seu workspace",
      price: "R$ 8",
      annualPrice: "R$ 84",
      perUnit: "/usuário/mês",
      availableFor: [PlanName.PRO],
   },
   {
      name: AddOnType.EXTRA_STORAGE,
      displayName: "Armazenamento Extra",
      description: "Mais espaço para arquivos e anexos",
      price: "R$ 3",
      annualPrice: "R$ 24",
      perUnit: "/5GB/mês",
      availableFor: [PlanName.PRO],
   },
   {
      name: AddOnType.AUTOMATION_PACK,
      displayName: "Automações Ilimitadas",
      description: "Fluxos e regras de automação sem limite",
      price: "R$ 12",
      annualPrice: "R$ 120",
      perUnit: "/mês",
      availableFor: [PlanName.PRO],
   },
];
