# Security Notes

- Do not hardcode `GROQ_API_KEY` in source files.
- Use `.env.local` for local development.
- Use Vercel Environment Variables for production.
- Rotate any API key that was pasted into chat, committed to GitHub, or shared publicly.
- The project includes basic rate limiting for posts, votes, and AI tools.
- The project includes basic text moderation to keep debate spicy but not harmful.
- Supabase service role keys must stay server-side only.
