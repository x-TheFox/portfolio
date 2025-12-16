import { NextResponse } from 'next/server';
import { fetchRepoMetaFromUrl } from '@/lib/github';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');

  try {
    let meta;

    if (url) {
      meta = await fetchRepoMetaFromUrl(url);
    } else if (owner && repo) {
      meta = await fetchRepoMetaFromUrl(`https://github.com/${owner}/${repo}`);
    } else {
      return NextResponse.json({ error: 'Missing url or owner/repo' }, { status: 400 });
    }

    return NextResponse.json(meta, {
      status: 200,
      headers: {
        'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
