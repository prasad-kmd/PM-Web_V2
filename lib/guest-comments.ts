export type GuestProfile = {
  name: string;
  email: string;
  github: string;
  linkedin: string;
  twitter: string;
};

export const emptyProfile: GuestProfile = {
  name: "",
  email: "",
  github: "",
  linkedin: "",
  twitter: "",
};
const handlePattern = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,38}$/;

export function cleanHandle(value: string): string {
  return value.trim().replace(/^@/, "");
}

export function profileLinks(profile: GuestProfile) {
  const github = cleanHandle(profile.github);
  const linkedin = cleanHandle(profile.linkedin);
  const twitter = cleanHandle(profile.twitter);
  return {
    profile: [
      github && `https://github.com/${github}`,
      linkedin && `https://www.linkedin.com/in/${linkedin}`,
      twitter && `https://x.com/${twitter}`,
    ]
      .filter(Boolean)
      .join(","),
    // LinkedIn and X have no reliable unauthenticated avatar endpoint.
    avatar: github ? `https://github.com/${github}.png` : "",
  };
}

export function validProfile(profile: GuestProfile): boolean {
  return (
    profile.name.trim().length >= 2 &&
    profile.name.trim().length <= 80 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email) &&
    profile.email.length <= 254 &&
    (["github", "linkedin", "twitter"] as const).every(
      (field) =>
        !profile[field] || handlePattern.test(cleanHandle(profile[field])),
    )
  );
}

// Compatible with the reference Notion comment format; email is never public.
export function formatGuestComment(
  profile: GuestProfile,
  body: string,
): string {
  const { profile: url, avatar } = profileLinks(profile);
  const safeName = profile.name.trim().replace(/[|\[\]\r\n]/g, " ");
  return `[${safeName}|${url}|${avatar}]: ${body.trim()}`;
}

export function parseGuestComment(text: string) {
  const match = text.match(/^\[([^|\]]*)\|([^|\]]*)\|([^\]]*)\]: ([\s\S]*)$/);
  if (!match)
    return { name: "Notion user", profile: "", avatar: "", body: text };
  return {
    name: match[1],
    profile: match[2],
    avatar: match[3],
    body: match[4],
  };
}
