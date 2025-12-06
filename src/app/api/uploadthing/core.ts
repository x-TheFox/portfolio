import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { UploadThingError } from 'uploadthing/server';
import { cookies } from 'next/headers';
import { validateSession } from '@/lib/auth/admin';

const f = createUploadthing();

// Auth middleware - validates admin session
async function authMiddleware() {
  const cookieStore = await cookies();
  const session = await validateSession(cookieStore);
  
  if (!session) {
    throw new UploadThingError('Unauthorized');
  }
  
  return { sessionId: session.id };
}

export const ourFileRouter = {
  // Profile image uploader - max 4MB, single file
  profileImage: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } })
    .middleware(authMiddleware)
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Profile image uploaded:', file.ufsUrl);
      return { url: file.ufsUrl };
    }),

  // Certificate images - max 2MB, up to 10 files
  certificateImage: f({ image: { maxFileSize: '2MB', maxFileCount: 10 } })
    .middleware(authMiddleware)
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Certificate image uploaded:', file.ufsUrl);
      return { url: file.ufsUrl };
    }),

  // Resume/document uploader - max 8MB, single file
  resumeFile: f({ 
    pdf: { maxFileSize: '8MB', maxFileCount: 1 },
    'application/msword': { maxFileSize: '8MB', maxFileCount: 1 },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { maxFileSize: '8MB', maxFileCount: 1 },
  })
    .middleware(authMiddleware)
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Resume uploaded:', file.ufsUrl);
      return { url: file.ufsUrl };
    }),

  // Case study PDF uploader - max 16MB, single file
  caseStudyPdf: f({ 
    pdf: { maxFileSize: '16MB', maxFileCount: 1 },
  })
    .middleware(authMiddleware)
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Case study PDF uploaded:', file.ufsUrl);
      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
