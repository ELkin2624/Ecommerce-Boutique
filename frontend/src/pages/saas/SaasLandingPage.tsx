import React, { useState } from 'react';
import { SaasNavbar } from './components/SaasNavbar';
import { SaasPricing } from './components/SaasPricing';
import { SaasAlwaysIncluded } from './components/SaasAlwaysIncluded';
import { SaasFeatures } from './components/SaasFeatures';
import { SaasComparisonTable } from './components/SaasComparisonTable';
import { SaasTestimonials } from './components/SaasTestimonials';
import { SaasFaq } from './components/SaasFaq';
import { SaasCtaBanner } from './components/SaasCtaBanner';
import { SaasOnboardingModal } from './components/SaasOnboardingModal';
import { SaasFooter } from './components/SaasFooter';

export const SaasLandingPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('PRO');

  const handleOpenRegister = (planId: string = 'PRO') => {
    setSelectedPlan(planId);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-saas-bg text-saas-text-primary flex flex-col pt-16 selection:bg-holst-600 selection:text-white transition-colors duration-200">
      {/* 1. Header & Navigation with Holst Palette & Theme Toggle (Fixed Top) */}
      <SaasNavbar onOpenRegister={handleOpenRegister} />

      {/* 3. Core Pricing Cards (Shopify-Style 3-Tier Grid with 20% Annual Discount) */}
      <SaasPricing onSelectPlan={handleOpenRegister} />

      {/* 4. Always Included in Every Plan (Shopify's "Always included" Foundational Value) */}
      <SaasAlwaysIncluded />

      {/* 5. Ecosystem & Key Capabilities Spotlight (POS, Virtual Fitting, Multi-branch) */}
      <SaasFeatures />

      {/* 6. Expandable Detailed Feature Comparison Matrix */}
      <SaasComparisonTable onSelectPlan={handleOpenRegister} />

      {/* 7. Social Proof: Boutique Success Stories & Impact Metrics */}
      <SaasTestimonials />

      {/* 8. Interactive FAQs Accordion */}
      <SaasFaq />

      {/* 9. Final High-Conversion Banner (Shopify's "Turn plans into progress") */}
      <SaasCtaBanner onOpenRegister={handleOpenRegister} />

      {/* 11. Global Footer */}
      <SaasFooter />

      {/* 12. Self-Service Tenant Registration & PostgreSQL Provisioning Wizard */}
      <SaasOnboardingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialPlan={selectedPlan}
      />
    </div>
  );
};
