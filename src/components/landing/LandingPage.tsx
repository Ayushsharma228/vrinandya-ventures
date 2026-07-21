"use client";

import { AnnouncementBar }  from "./AnnouncementBar";
import { Navbar }           from "./Navbar";
import { Hero }             from "./Hero";
import { StatsBar }         from "./StatsBar";
import { ProductCatalogue } from "./ProductCatalogue";
import { HowItWorks }       from "./HowItWorks";
import { Features }         from "./Features";
import { Testimonials }     from "./Testimonials";
import { Plans }            from "./Plans";
import { FAQ }              from "./FAQ";
import { ApplyForm }        from "./ApplyForm";
import { FinalCTA }         from "./FinalCTA";
import { Footer }           from "./Footer";
import { MobileBar }        from "./MobileBar";
import { C }                from "./constants";

export default function LandingPage() {
  return (
    <div style={{ background: C.navy, minHeight: "100vh" }}>
      {/* Single fixed header — announcement bar + navbar stacked, no overlap */}
      <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50 }}>
        <AnnouncementBar />
        <Navbar />
      </header>
      <main>
        <Hero />
        <StatsBar />
        <ProductCatalogue />
        <HowItWorks />
        <Features />
        <Testimonials />
        <Plans />
        <FAQ />
        <ApplyForm />
        <FinalCTA />
      </main>
      <Footer />
      <MobileBar />
    </div>
  );
}
