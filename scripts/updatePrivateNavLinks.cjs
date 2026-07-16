const fs = require("fs");
const path = require("path");

const loginPath = path.join(process.cwd(), "app", "login", "page.tsx");
const navPath = path.join(process.cwd(), "components", "SiteNav.tsx");

let login = fs.readFileSync(loginPath, "utf8");
let nav = fs.readFileSync(navPath, "utf8");

/**
 * 1. Додаємо auto redirect на login-сторінку:
 * якщо користувач уже авторизований і відкрив /login?next=/...
 * його одразу перекине на потрібну сторінку.
 */
if (!login.includes("AUTO_REDIRECT_IF_ALREADY_LOGGED_IN")) {
  const marker = `  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextPath = sanitizeNextPath(params.get("next"));

    setRedirectPath(nextPath);
  }, []);`;

  const insert = `  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextPath = sanitizeNextPath(params.get("next"));

    setRedirectPath(nextPath);
  }, []);

  // AUTO_REDIRECT_IF_ALREADY_LOGGED_IN
  useEffect(() => {
    let isMounted = true;

    async function redirectIfAlreadyLoggedIn() {
      const params = new URLSearchParams(window.location.search);
      const nextPath = sanitizeNextPath(params.get("next"));

      const { data } = await supabase.auth.getUser();

      if (!isMounted) return;

      if (data.user) {
        router.replace(nextPath);
        router.refresh();
      }
    }

    redirectIfAlreadyLoggedIn();

    return () => {
      isMounted = false;
    };
  }, [router]);`;

  if (!login.includes(marker)) {
    console.error("LOGIN: не знайшов місце для вставки auto redirect.");
    process.exit(1);
  }

  login = login.replace(marker, insert);
  fs.writeFileSync(loginPath, login, "utf8");
  console.log("UPDATED: app/login/page.tsx auto redirect");
} else {
  console.log("SKIP: login auto redirect already exists");
}

/**
 * 2. Оновлюємо приватні href у SiteNav.
 * Робимо тільки точкові заміни, без зміни структури меню.
 */
const replacements = [
  {
    from: 'href="/add"',
    to: 'href="/login?next=/add"',
  },
  {
    from: 'href="/request-store"',
    to: 'href="/login?next=/request-store"',
  },
  {
    from: 'href="/profile"',
    to: 'href="/login?next=/profile"',
  },
  {
    from: 'href: "/add"',
    to: 'href: "/login?next=/add"',
  },
  {
    from: 'href: "/request-store"',
    to: 'href: "/login?next=/request-store"',
  },
  {
    from: 'href: "/profile"',
    to: 'href: "/login?next=/profile"',
  },
];

let changedNav = false;

for (const replacement of replacements) {
  if (nav.includes(replacement.from)) {
    nav = nav.split(replacement.from).join(replacement.to);
    changedNav = true;
  }
}

if (changedNav) {
  fs.writeFileSync(navPath, nav, "utf8");
  console.log("UPDATED: components/SiteNav.tsx private links");
} else {
  console.log("SKIP: SiteNav private links not found or already updated");
}
