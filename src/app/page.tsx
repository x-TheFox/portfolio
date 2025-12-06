import { getProjects } from "@/lib/notion/projects";
import { getCaseStudies } from "@/lib/notion/case-studies";
import { getArchitectureDocs } from "@/lib/notion/architecture";
import { getAbout, getProfile, getSkills, getCertificates } from "@/lib/cms";
import HomeClient from "./HomeClient";

// ISR with 5-minute revalidation
export const revalidate = 300;

interface Highlight {
  label: string;
  value: string;
  icon?: string;
}

export default async function Home() {
  // Fetch all data server-side in parallel
  const [projects, caseStudies, architectureDocs, aboutData, profileData, skillsData, certificatesData] = await Promise.all([
    getProjects(),
    getCaseStudies(),
    getArchitectureDocs(),
    getAbout(),
    getProfile(),
    getSkills(),
    getCertificates(),
  ]);

  // Ensure highlights is properly typed
  const about = {
    title: aboutData.title,
    content: aboutData.content,
    highlights: (aboutData.highlights as Highlight[]) || [],
  };

  // Transform profile to match expected interface
  const profile = {
    name: profileData.name,
    email: profileData.email,
    bio: profileData.bio,
    shortBio: profileData.shortBio,
    profileImageUrl: profileData.profileImageUrl,
    resumeUrl: profileData.resumeUrl,
    socialLinks: profileData.socialLinks as Record<string, string> | null,
    location: profileData.location,
    available: profileData.available ?? false,
  };

  // Transform skills to match expected interface
  const skills = skillsData.map(s => ({
    id: s.id,
    name: s.name,
    level: s.level ?? 50,
    category: s.category,
    years: s.years,
    icon: s.icon,
    personas: (s.personas as string[]) || ['global'],
  }));

  // Transform certificates to match expected interface
  const certificates = certificatesData.map(c => ({
    id: c.id,
    name: c.name,
    issuer: c.issuer,
    issueDate: c.issueDate,
    expiryDate: c.expiryDate,
    credentialId: c.credentialId,
    credentialUrl: c.credentialUrl,
    imageUrl: c.imageUrl,
    skills: (c.skills as string[]) || [],
    featured: c.featured ?? false,
  }));

  return (
    <HomeClient 
      projects={projects} 
      about={about} 
      profile={profile}
      skills={skills}
      certificates={certificates}
      caseStudies={caseStudies}
      architectureDocs={architectureDocs}
    />
  );
}
