"use client";

import { useState, useRef, useEffect } from "react";
import { usePersona } from "@/hooks/usePersona";
import { Hero } from "@/components/sections/Hero";
import { ProjectsGrid } from "@/components/sections/Projects";
import { Skills } from "@/components/sections/Skills";
import { Certificates } from "@/components/sections/Certificates";
import { Contact } from "@/components/sections/Contact";
import { About } from "@/components/sections/About";
import { Footer } from "@/components/sections/Footer";
import { CaseStudies } from "@/components/sections/CaseStudies";
import { Architecture } from "@/components/sections/Architecture";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, FileText, Cpu, Briefcase, FolderOpen } from "lucide-react";
import { Project } from "@/lib/notion/projects";
import { CaseStudy } from "@/lib/notion/case-studies";
import { ArchitectureDoc } from "@/lib/notion/architecture";

interface Highlight {
  label: string;
  value: string;
  icon?: string;
}

interface AboutData {
  title: string | null;
  content: string | null;
  highlights: Highlight[];
}

interface ProfileData {
  name: string;
  email: string | null;
  bio: string | null;
  shortBio: string | null;
  profileImageUrl: string | null;
  resumeUrl: string | null;
  socialLinks: Record<string, string> | null;
  location: string | null;
  available: boolean;
}

interface SkillData {
  id: string;
  name: string;
  level: number;
  category: string;
  years: number | null;
  icon: string | null;
  personas: string[] | null;
}

interface CertificateData {
  id: string;
  name: string;
  issuer: string;
  issueDate: string | null;
  expiryDate: string | null;
  credentialId: string | null;
  credentialUrl: string | null;
  imageUrl: string | null;
  skills: string[];
  featured: boolean;
}

interface HomeClientProps {
  projects: Project[];
  about: AboutData;
  profile: ProfileData;
  skills: SkillData[];
  certificates: CertificateData[];
  caseStudies: CaseStudy[];
  architectureDocs: ArchitectureDoc[];
}

export default function HomeClient({ projects, about, profile, skills, certificates, caseStudies, architectureDocs }: HomeClientProps) {
  const { persona, isLoading, confidence } = usePersona();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Section order can vary by persona
  const getSectionOrder = () => {
    switch (persona) {
      case "recruiter":
        return ["hero", "about", "certificates", "skills", "projects", "contact"];
      case "engineer":
        return ["hero", "projects", "skills", "architecture", "about", "certificates", "contact"];
      case "designer":
        return ["hero", "projects", "case-studies", "about", "skills", "certificates", "contact"];
      case "gamer":
        return ["hero", "projects", "skills", "about", "certificates", "contact"];
      case "cto":
        return ["hero", "about", "architecture", "certificates", "projects", "skills", "contact"];
      default:
        return ["hero", "about", "projects", "skills", "certificates", "contact"];
    }
  };

  const sections: Record<string, React.ReactNode> = {
    hero: <Hero key="hero" profile={profile} />,
    about: (
      <About
        key="about"
        title={about.title || "About Me"}
        content={about.content || ""}
        highlights={about.highlights || []}
        profile={profile}
      />
    ),
    projects: <ProjectsGrid key="projects" projects={projects} />,
    skills: <Skills key="skills" skills={skills} />,
    certificates: <Certificates key="certificates" certificates={certificates} />,
    "case-studies": <CaseStudies key="case-studies" caseStudies={caseStudies} />,
    architecture: <Architecture key="architecture" docs={architectureDocs} />,
    contact: <Contact key="contact" email={profile.email || undefined} />,
  };

  const sectionOrder = getSectionOrder();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  const navItems = [
    { id: "about", label: "About" },
    { id: "projects", label: "Projects" },
    { id: "skills", label: "Skills" },
    { id: "certificates", label: "Certificates" },
    { id: "contact", label: "Contact" },
  ];

  // Extra links that appear in "More" dropdown
  // Items relevant to current persona appear first (highlighted), others are grouped under "Other"
  const moreLinks = [
    { id: "case-studies", label: "Case Studies", href: "/case-studies", icon: FileText, relevantFor: ["designer"] },
    { id: "architecture", label: "Architecture", href: "/architecture", icon: Cpu, relevantFor: ["engineer", "cto"] },
    { id: "intake", label: "Work With Me", href: "/intake", icon: Briefcase, relevantFor: ["recruiter", "cto"] },
    { id: "all-projects", label: "All Projects", href: "/projects", icon: FolderOpen, relevantFor: ["engineer", "designer", "gamer"] },
  ];

  const relevantLinks = moreLinks.filter(link => link.relevantFor.includes(persona));
  const otherLinks = moreLinks.filter(link => !link.relevantFor.includes(persona));

  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMoreDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative">
      {/* Loading overlay during initial persona detection */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-zinc-950"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-center"
            >
              <motion.div
                className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-zinc-200 dark:border-zinc-800 border-t-blue-500"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              />
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-zinc-500 dark:text-zinc-400"
              >
                Personalizing your experience...
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confidence indicator (dev mode) */}
      {process.env.NODE_ENV === "development" && confidence > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="fixed top-20 left-4 z-40 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-mono shadow-lg"
        >
          Persona: {persona} ({Math.round(confidence * 100)}%)
        </motion.div>
      )}

      {/* Render sections in persona-optimized order */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: isLoading ? 0.5 : 0 }}
        className="pt-16"
      >
        {sectionOrder.map((sectionKey, index) => (
          <motion.div
            key={sectionKey}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
          >
            {sections[sectionKey]}
          </motion.div>
        ))}
        
        {/* Footer */}
        <Footer profile={profile} />
      </motion.div>

      {/* Navigation (floating) */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="fixed top-0 left-0 right-0 z-30 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <motion.button
              onClick={() => scrollToSection("hero")}
              className="font-bold text-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-blue-500">{"<"}</span>
              Sam
              <span className="text-blue-500">{"/>"}</span>
            </motion.button>

            {/* Nav Links - Desktop */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <motion.button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {item.label}
                </motion.button>
              ))}
              <a
                href="/now"
                className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
              >
                Now
              </a>

              {/* More Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <motion.button
                  onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                  className="flex items-center gap-1 px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  More
                  <ChevronDown 
                    className={`w-4 h-4 transition-transform ${moreDropdownOpen ? 'rotate-180' : ''}`} 
                  />
                </motion.button>

                <AnimatePresence>
                  {moreDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden z-50"
                    >
                      {/* Relevant for current mode */}
                      {relevantLinks.length > 0 && (
                        <div className="p-2">
                          <div className="px-3 py-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                            For You
                          </div>
                          {relevantLinks.map((link) => (
                            <a
                              key={link.id}
                              href={link.href}
                              onClick={() => setMoreDropdownOpen(false)}
                              className="flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors"
                            >
                              <link.icon className="w-4 h-4" />
                              {link.label}
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Other links */}
                      {otherLinks.length > 0 && (
                        <div className={`p-2 ${relevantLinks.length > 0 ? 'border-t border-zinc-200 dark:border-zinc-800' : ''}`}>
                          {relevantLinks.length > 0 && (
                            <div className="px-3 py-1.5 text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                              Other
                            </div>
                          )}
                          {otherLinks.map((link) => (
                            <a
                              key={link.id}
                              href={link.href}
                              onClick={() => setMoreDropdownOpen(false)}
                              className="flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300 rounded-lg transition-colors"
                            >
                              <link.icon className="w-4 h-4" />
                              {link.label}
                            </a>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <motion.a
                href="/intake"
                className="ml-2 px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/25"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                Let&apos;s Talk
              </motion.a>
            </div>

            {/* Mobile menu button */}
            <motion.button
              className="md:hidden p-2 text-zinc-600 dark:text-zinc-400 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              whileTap={{ scale: 0.9 }}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
            >
              <div className="px-4 py-4 space-y-2">
                {navItems.map((item, index) => (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => scrollToSection(item.id)}
                    className="block w-full text-left px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                  >
                    {item.label}
                  </motion.button>
                ))}
                <motion.a
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: navItems.length * 0.05 }}
                  href="/now"
                  className="block w-full text-left px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                >
                  Now
                </motion.a>

                {/* Relevant links for current mode */}
                {relevantLinks.length > 0 && (
                  <>
                    <div className="px-4 pt-2 pb-1 text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                      For You
                    </div>
                    {relevantLinks.map((link, index) => (
                      <motion.a
                        key={link.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (navItems.length + 1 + index) * 0.05 }}
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-all"
                      >
                        <link.icon className="w-4 h-4" />
                        {link.label}
                      </motion.a>
                    ))}
                  </>
                )}

                {/* Other links */}
                {otherLinks.length > 0 && (
                  <>
                    <div className="px-4 pt-2 pb-1 text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                      Other
                    </div>
                    {otherLinks.map((link, index) => (
                      <motion.a
                        key={link.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (navItems.length + 1 + relevantLinks.length + index) * 0.05 }}
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
                      >
                        <link.icon className="w-4 h-4" />
                        {link.label}
                      </motion.a>
                    ))}
                  </>
                )}

                <motion.a
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (navItems.length + 1 + moreLinks.length) * 0.05 }}
                  href="/intake"
                  className="block w-full text-center px-4 py-3 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors mt-2"
                >
                  Let&apos;s Talk
                </motion.a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </div>
  );
}
