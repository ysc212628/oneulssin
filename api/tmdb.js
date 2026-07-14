export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'GET 요청만 허용됩니다' });
    return;
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: '서버에 TMDB_API_KEY 환경변수가 설정되지 않았습니다' });
    return;
  }

  const title = req.query.title;
  if (!title) {
    res.status(400).json({ error: 'title 쿼리 파라미터가 필요합니다' });
    return;
  }

  try {
    const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&language=ko-KR&query=${encodeURIComponent(title)}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    let best = searchData.results && searchData.results[0];

    // 한국어 검색 결과가 없으면 영어로 한 번 더 시도
    if (!best) {
      const fallbackUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(title)}`;
      const fallbackRes = await fetch(fallbackUrl);
      const fallbackData = await fallbackRes.json();
      best = fallbackData.results && fallbackData.results[0];
    }

    if (!best) {
      res.status(404).json({ error: '영화 정보를 찾지 못했습니다' });
      return;
    }

    res.status(200).json({
      title: best.title,
      original_title: best.original_title,
      overview: best.overview || '',
      poster_url: best.poster_path ? `https://image.tmdb.org/t/p/w500${best.poster_path}` : null,
      vote_average: typeof best.vote_average === 'number' ? Math.round(best.vote_average * 10) / 10 : null,
      release_date: best.release_date || ''
    });
  } catch (err) {
    res.status(500).json({ error: '서버 내부 오류: ' + err.message });
  }
}
