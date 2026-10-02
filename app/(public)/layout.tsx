import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BackToTop } from "@/components/layout/BackToTop";
import { NavigationLoader } from "@/components/layout/NavigationLoader";
import { FirebaseAnalytics } from "@/components/layout/FirebaseAnalytics";
import { analyticsConfig } from "@/config/analytics";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <Footer />
      <BackToTop />
      <NavigationLoader />
      {/* Public pages only: the admin dashboard (cover letters included) sends no analytics. */}
      {analyticsConfig.firebase.enabled && <FirebaseAnalytics />}
    </>
  );
}
