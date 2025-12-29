import commonActionsPtBr from "./common/actions.json";
import commonBrandPtBr from "./common/brand.json";
import commonChartsPtBr from "./common/charts.json";
import commonCookiesPtBr from "./common/cookies.json";
import commonErrorReportPtBr from "./common/error-report.json";
import commonErrorsPtBr from "./common/errors.json";
import commonFormPtBr from "./common/form.json";
import commonHeadersPtBr from "./common/headers.json";
import commonLabelsPtBr from "./common/labels.json";
import commonLanguagesPtBr from "./common/languages.json";
import commonStatusPtBr from "./common/status.json";
import commonStripePtBr from "./common/stripe.json";
import commonThemesPtBr from "./common/themes.json";
import commonTimePtBr from "./common/time.json";
import commonValidationPtBr from "./common/validation.json";
import layoutPtBr from "./dashboard/layout.json";
import anonymousPtBr from "./dashboard/routes/anonymous.json";
import authPtBr from "./dashboard/routes/auth.json";
import bankAccountsPtBr from "./dashboard/routes/bank-accounts.json";
import billsPtBr from "./dashboard/routes/bills.json";
import budgetsPtBr from "./dashboard/routes/budgets.json";
import categoriesPtBr from "./dashboard/routes/categories.json";
import contentPtBr from "./dashboard/routes/content.json";
import costCentersPtBr from "./dashboard/routes/cost-centers.json";
import counterpartiesPtBr from "./dashboard/routes/counterparties.json";
import customReportsPtBr from "./dashboard/routes/custom-reports.json";
import emailVerificationPtBr from "./dashboard/routes/email-verification.json";
import forgotPasswordPtBr from "./dashboard/routes/forgot-password.json";
import homePagePtBr from "./dashboard/routes/home.json";
import interestTemplatesPtBr from "./dashboard/routes/interest-templates.json";
import magicLinkPtBr from "./dashboard/routes/magic-link.json";
import onboardingPtBr from "./dashboard/routes/onboarding.json";
import organizationPtBr from "./dashboard/routes/organization.json";
import profilePtBr from "./dashboard/routes/profile.json";
import settingsPtBr from "./dashboard/routes/settings.json";
import signInPtBr from "./dashboard/routes/sign-in.json";
import signUpPtBr from "./dashboard/routes/sign-up.json";
import tagsPtBr from "./dashboard/routes/tags.json";
import transactionsPtBr from "./dashboard/routes/transactions.json";
import writersPtBr from "./dashboard/routes/writers.json";
import serverAuthPtBr from "./server/auth.json";

const resources = {
   translation: {
      common: {
         actions: commonActionsPtBr,
         brand: commonBrandPtBr,
         charts: commonChartsPtBr,
         cookies: commonCookiesPtBr,
         "error-report": commonErrorReportPtBr,
         errors: commonErrorsPtBr,
         form: commonFormPtBr,
         headers: commonHeadersPtBr,
         labels: commonLabelsPtBr,
         languages: commonLanguagesPtBr,
         status: commonStatusPtBr,
         stripe: commonStripePtBr,
         themes: commonThemesPtBr,
         time: commonTimePtBr,
         validation: commonValidationPtBr,
      },
      dashboard: {
         layout: layoutPtBr,
         routes: {
            anonymous: anonymousPtBr,
            auth: authPtBr,
            "bank-accounts": bankAccountsPtBr,
            bills: billsPtBr,
            budgets: budgetsPtBr,
            categories: categoriesPtBr,
            content: contentPtBr,
            "cost-centers": costCentersPtBr,
            counterparties: counterpartiesPtBr,
            "custom-reports": customReportsPtBr,
            "email-verification": emailVerificationPtBr,
            "forgot-password": forgotPasswordPtBr,
            home: homePagePtBr,
            "interest-templates": interestTemplatesPtBr,
            "magic-link": magicLinkPtBr,
            onboarding: onboardingPtBr,
            organization: organizationPtBr,
            profile: profilePtBr,
            settings: settingsPtBr,
            "sign-in": signInPtBr,
            "sign-up": signUpPtBr,
            tags: tagsPtBr,
            transactions: transactionsPtBr,
            writers: writersPtBr,
         },
      },
      server: {
         auth: serverAuthPtBr,
      },
   },
};

export default resources;
