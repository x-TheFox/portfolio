import { NextResponse } from 'next/server';
import { db, isDatabaseReady, sessions } from '@/lib/db';
import { isNotionConfigured } from '@/lib/notion/client';
import { sql } from 'drizzle-orm';

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down' | 'not-configured';
  latency?: number;
  error?: string;
  details?: Record<string, unknown>;
}

interface HealthCheckResponse {
  overall: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  services: ServiceStatus[];
  environment: {
    nodeEnv: string;
    configured: {
      database: boolean;
      notion: boolean;
      groq: boolean;
      openrouter: boolean;
      uploadthing: boolean;
      adminSecret: boolean;
    };
  };
}

async function checkDatabase(): Promise<ServiceStatus> {
  const start = Date.now();
  
  if (!isDatabaseReady()) {
    return {
      name: 'Database (Neon)',
      status: 'not-configured',
      error: 'DATABASE_URL not set',
    };
  }
  
  try {
    // Simple query to check connection using the proxy
    await db.execute(sql`SELECT 1`);
    
    return {
      name: 'Database (Neon)',
      status: 'healthy',
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      name: 'Database (Neon)',
      status: 'down',
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkNotion(): Promise<ServiceStatus> {
  const start = Date.now();
  
  if (!isNotionConfigured()) {
    return {
      name: 'Notion API',
      status: 'not-configured',
      error: 'NOTION_API_KEY not set',
    };
  }
  
  if (!process.env.NOTION_PROJECTS_DATABASE_ID) {
    return {
      name: 'Notion API',
      status: 'degraded',
      error: 'NOTION_PROJECTS_DATABASE_ID not set',
    };
  }
  
  try {
    // Try to query the projects database
    const { Client } = await import('@notionhq/client');
    const notion = new Client({ auth: process.env.NOTION_API_KEY });
    
    await notion.databases.retrieve({
      database_id: process.env.NOTION_PROJECTS_DATABASE_ID,
    });
    
    return {
      name: 'Notion API',
      status: 'healthy',
      latency: Date.now() - start,
      details: {
        projectsDbConfigured: true,
      },
    };
  } catch (error) {
    return {
      name: 'Notion API',
      status: 'down',
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkGroq(): Promise<ServiceStatus> {
  const start = Date.now();
  
  if (!process.env.GROQ_API_KEY) {
    return {
      name: 'Groq API',
      status: 'not-configured',
      error: 'GROQ_API_KEY not set',
    };
  }
  
  try {
    const response = await fetch('https://api.groq.com/openai/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      name: 'Groq API',
      status: 'healthy',
      latency: Date.now() - start,
      details: {
        modelsAvailable: data.data?.length ?? 0,
      },
    };
  } catch (error) {
    return {
      name: 'Groq API',
      status: 'down',
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkOpenRouter(): Promise<ServiceStatus> {
  const start = Date.now();
  
  if (!process.env.OPENROUTER_API_KEY) {
    return {
      name: 'OpenRouter API',
      status: 'not-configured',
      error: 'OPENROUTER_API_KEY not set',
    };
  }
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      name: 'OpenRouter API',
      status: 'healthy',
      latency: Date.now() - start,
      details: {
        modelsAvailable: data.data?.length ?? 0,
      },
    };
  } catch (error) {
    return {
      name: 'OpenRouter API',
      status: 'down',
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkUploadThing(): Promise<ServiceStatus> {
  if (!process.env.UPLOADTHING_TOKEN) {
    return {
      name: 'UploadThing',
      status: 'not-configured',
      error: 'UPLOADTHING_TOKEN not set',
    };
  }
  
  // UploadThing doesn't have a simple health check endpoint
  // Just verify the token is present
  return {
    name: 'UploadThing',
    status: 'healthy',
    details: {
      tokenConfigured: true,
    },
  };
}

function checkEnvVars(): {
  database: boolean;
  notion: boolean;
  groq: boolean;
  openrouter: boolean;
  uploadthing: boolean;
  adminSecret: boolean;
} {
  return {
    database: !!process.env.DATABASE_URL,
    notion: !!process.env.NOTION_API_KEY && !!process.env.NOTION_PROJECTS_DATABASE_ID,
    groq: !!process.env.GROQ_API_KEY,
    openrouter: !!process.env.OPENROUTER_API_KEY,
    uploadthing: !!process.env.UPLOADTHING_TOKEN,
    adminSecret: !!process.env.ADMIN_SECRET,
  };
}

function determineOverallStatus(services: ServiceStatus[]): 'healthy' | 'degraded' | 'down' {
  const criticalServices = ['Database (Neon)'];
  
  const criticalDown = services.some(
    s => criticalServices.includes(s.name) && s.status === 'down'
  );
  
  if (criticalDown) {
    return 'down';
  }
  
  const anyDown = services.some(s => s.status === 'down');
  const anyDegraded = services.some(s => s.status === 'degraded');
  
  if (anyDown || anyDegraded) {
    return 'degraded';
  }
  
  return 'healthy';
}

export async function GET() {
  try {
    // Run all checks in parallel
    const [dbStatus, notionStatus, groqStatus, openRouterStatus, uploadThingStatus] = 
      await Promise.all([
        checkDatabase(),
        checkNotion(),
        checkGroq(),
        checkOpenRouter(),
        checkUploadThing(),
      ]);
    
    const services = [
      dbStatus,
      notionStatus,
      groqStatus,
      openRouterStatus,
      uploadThingStatus,
    ];
    
    const response: HealthCheckResponse = {
      overall: determineOverallStatus(services),
      timestamp: new Date().toISOString(),
      services,
      environment: {
        nodeEnv: process.env.NODE_ENV ?? 'development',
        configured: checkEnvVars(),
      },
    };
    
    const statusCode = response.overall === 'healthy' ? 200 : 
                       response.overall === 'degraded' ? 200 : 503;
    
    return NextResponse.json(response, { status: statusCode });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        overall: 'down',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        services: [],
        environment: {
          nodeEnv: process.env.NODE_ENV ?? 'development',
          configured: checkEnvVars(),
        },
      },
      { status: 503 }
    );
  }
}
